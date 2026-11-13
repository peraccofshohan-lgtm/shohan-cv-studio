/**
 * Workspace store.
 *
 * Owns long-lived application state: the SQLite engine, repository, settings,
 * customer/project lists, and the "current project" being edited.
 *
 * Autosave is debounced and silent; explicit saves bump the version and write a
 * snapshot. Undo/redo uses an in-memory stack of CV data snapshots per project.
 */
import { create } from 'zustand';
import { SqlEngine } from '@/database/sqlite';
import { resolveDesign } from '@/templates/catalog';
import { composeDocumentTokens } from '@/lib/composition';
import { defaultDesign } from '@/lib/defaults';
import { CvRepository, type ProjectSummary } from '@/database/cvRepository';
import type {
  AppSettings,
  SavedPalette,
  StylePreset,
  CustomerRecord,
  DesignOverrides,
  ExportRecord,
  ProjectRecord,
} from '@/types/cv';
import { DEFAULT_SETTINGS, createEmptyCustomer, createProject, nowIso, uid } from '@/lib/defaults';
import { COLOR_TOKENS } from '@/types/cv';
import { getBridge } from '@/platform';
import type { PlatformInfo } from '@/platform/types';

export interface ToastItem {
  id: string;
  kind: 'success' | 'error' | 'warning' | 'info';
  title: string;
  detail?: string;
}

interface HistoryEntry {
  data: ProjectRecord['data'];
  design: DesignOverrides;
  templateId: string;
}

interface WorkspaceState {
  ready: boolean;
  bootError: string | null;
  bridgeInfo: PlatformInfo | null;
  repo: CvRepository | null;
  settings: AppSettings;

  customers: CustomerRecord[];
  projects: ProjectSummary[];
  exports: ExportRecord[];
  counts: { customers: number; projects: number; todayProjects: number; duplicates: number };

  current: ProjectRecord | null;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: string | null;

  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];

  toasts: ToastItem[];

  boot: () => Promise<void>;
  refreshLists: () => void;
  setSettings: (patch: Partial<AppSettings>) => Promise<void>;

  createNewProject: (opts?: { customerId?: string | null; title?: string }) => Promise<ProjectRecord>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  updateData: (updater: (draft: ProjectRecord['data']) => void, opts?: { transient?: boolean }) => void;
  updateDesign: (patch: Partial<DesignOverrides>) => void;
  setTemplate: (templateId: string) => void;
  setTitle: (title: string) => void;
  setCustomer: (customerId: string | null) => void;
  saveNow: (opts?: { snapshot?: boolean }) => Promise<void>;
  undo: () => void;
  redo: () => void;
  resetDesign: () => void;

  /** User-saved style presets (styled variants of a base template). */
  presets: StylePreset[];
  refreshPresets: () => void;
  savePreset: (name: string) => void;
  applyPreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  duplicatePreset: (id: string) => void;
  deletePreset: (id: string) => void;

  /** Standalone saved colour palettes (Part 5). */
  palettes: SavedPalette[];
  refreshPalettes: () => void;
  savePalette: (name: string) => void;
  applyPalette: (id: string) => void;
  deletePalette: (id: string) => void;

  saveCustomer: (customer: CustomerRecord) => Promise<CustomerRecord>;
  newCustomerDraft: () => CustomerRecord;
  deleteCustomer: (id: string) => Promise<void>;
  restoreCustomer: (id: string) => Promise<void>;
  purgeCustomer: (id: string) => Promise<void>;

  deleteProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  purgeProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;

  pushToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
  logExport: (record: Omit<ExportRecord, 'id' | 'createdAt'>) => void;
}

const MAX_HISTORY = 60;

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPersistTimer: ReturnType<typeof setTimeout> | null = null;

/** Deep clone helper that works for the plain-object CV model. */
export const clone = <T,>(value: T): T =>
  typeof structuredClone === 'function' ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  ready: false,
  bootError: null,
  bridgeInfo: null,
  repo: null,
  settings: DEFAULT_SETTINGS,

  customers: [],
  projects: [],
  exports: [],
  counts: { customers: 0, projects: 0, todayProjects: 0, duplicates: 0 },

  current: null,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  undoStack: [],
  redoStack: [],
  presets: [],
  palettes: [],
  toasts: [],

  async boot() {
    try {
      const bridge = getBridge();
      const info = await bridge.info();
      const bytes = await bridge.loadDatabase();

      // Debounced persistence: coalesce rapid writes into one file write.
      const engine = await SqlEngine.create(bytes, {
        onPersist: (out) => {
          if (pendingPersistTimer) clearTimeout(pendingPersistTimer);
          pendingPersistTimer = setTimeout(() => {
            void bridge.saveDatabase(out).catch((err) => {
              get().pushToast({ kind: 'error', title: 'Database save failed', detail: String(err?.message ?? err) });
            });
          }, 400);
        },
      });

      const repo = new CvRepository(engine);
      const savedSettings = repo.getSetting<Partial<AppSettings>>('app_settings', {});
      const settings: AppSettings = { ...DEFAULT_SETTINGS, ...savedSettings };

      set({ repo, bridgeInfo: info, settings, ready: true, bootError: null });
      get().refreshLists();
      get().refreshPresets();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ ready: false, bootError: message });
    }
  },

  refreshLists() {
    const { repo } = get();
    if (!repo) return;
    set({
      customers: repo.listCustomers(),
      projects: repo.listProjects(),
      exports: repo.listExports(),
      counts: repo.counts(),
      presets: repo.listTemplateVariants(),
    });
  },

  async setSettings(patch) {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    get().repo?.setSetting('app_settings', next);
  },

  async createNewProject(opts) {
    const { repo, settings } = get();
    const project = createProject({
      customerId: opts?.customerId ?? null,
      title: opts?.title ?? 'Untitled CV',
      templateId: settings.defaultTemplateId,
    });
    project.data.language = settings.defaultCvLanguage;
    project.design.marginMm = settings.defaultMarginMm;
    project.design.fontPairId = settings.defaultFontPairId;
    repo?.saveProject(project);
    get().refreshLists();
    set({ current: project, dirty: false, undoStack: [], redoStack: [], lastSavedAt: nowIso() });
    return project;
  },

  async openProject(id) {
    const project = get().repo?.getProject(id);
    if (!project) {
      get().pushToast({ kind: 'error', title: 'Project not found' });
      return;
    }
    set({ current: project, dirty: false, undoStack: [], redoStack: [], lastSavedAt: project.updatedAt });
  },

  closeProject() {
    void get().saveNow();
    set({ current: null, dirty: false, undoStack: [], redoStack: [] });
  },

  updateData(updater, opts) {
    const current = get().current;
    if (!current) return;
    if (!opts?.transient) {
      set({
        undoStack: [...get().undoStack, { data: clone(current.data), design: clone(current.design), templateId: current.templateId }].slice(-MAX_HISTORY),
        redoStack: [],
      });
    }
    const nextData = clone(current.data);
    updater(nextData);
    set({ current: { ...current, data: nextData }, dirty: true });

    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      void get().saveNow();
    }, get().settings.autosaveMs);
  },

  updateDesign(patch) {
    const current = get().current;
    if (!current) return;
    set({
      undoStack: [...get().undoStack, { data: clone(current.data), design: clone(current.design), templateId: current.templateId }].slice(-MAX_HISTORY),
      redoStack: [],
      current: { ...current, design: { ...current.design, ...patch } },
      dirty: true,
    });
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => void get().saveNow(), get().settings.autosaveMs);
  },

  setTemplate(templateId) {
    const current = get().current;
    if (!current) return;
    // Switching template must never touch user content.
    const resolved = resolveDesign(templateId, {});
    set({
      undoStack: [...get().undoStack, { data: clone(current.data), design: clone(current.design), templateId: current.templateId }].slice(-MAX_HISTORY),
      redoStack: [],
      current: {
        ...current,
        templateId,
        design: {
          ...current.design,
          paletteId: resolved.palette.id,
          fontPairId: resolved.fontPair.id,
          photoShape: resolved.photoShape,
          headerStyle: resolved.headerStyle,
          headingStyle: resolved.headingStyle,
        },
      },
      dirty: true,
    });
    void get().saveNow();
  },

  setTitle(title) {
    const current = get().current;
    if (!current) return;
    set({ current: { ...current, title, updatedAt: nowIso() }, dirty: true });
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => void get().saveNow(), get().settings.autosaveMs);
  },

  setCustomer(customerId) {
    const current = get().current;
    if (!current) return;
    set({ current: { ...current, customerId }, dirty: true });
    void get().saveNow();
  },

  async saveNow(opts) {
    const { current, repo } = get();
    if (!current || !repo) return;
    set({ saving: true });
    try {
      const next: ProjectRecord = {
        ...current,
        updatedAt: nowIso(),
        version: (current.version ?? 1) + 1,
      };
      // Only append a snapshot on explicit saves to bound DB growth.
      repo.saveProject(next);
      set({ current: next, dirty: false, saving: false, lastSavedAt: next.updatedAt });
      get().refreshLists();
    } catch (err) {
      set({ saving: false });
      get().pushToast({
        kind: 'error',
        title: 'Could not save project',
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  },

  undo() {
    const { undoStack, current, redoStack } = get();
    if (undoStack.length === 0 || !current) return;
    const previous = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, { data: clone(current.data), design: clone(current.design), templateId: current.templateId }].slice(-MAX_HISTORY),
      current: { ...current, data: previous.data, design: previous.design, templateId: previous.templateId },
      dirty: true,
    });
    void get().saveNow();
  },

  redo() {
    const { redoStack, current, undoStack } = get();
    if (redoStack.length === 0 || !current) return;
    const next = redoStack[redoStack.length - 1];
    set({
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, { data: clone(current.data), design: clone(current.design), templateId: current.templateId }].slice(-MAX_HISTORY),
      current: { ...current, data: next.data, design: next.design, templateId: next.templateId },
      dirty: true,
    });
    void get().saveNow();
  },

  resetDesign() {
    const current = get().current;
    if (!current) return;
    set({
      undoStack: [...get().undoStack, { data: clone(current.data), design: clone(current.design), templateId: current.templateId }].slice(-MAX_HISTORY),
      current: { ...current, design: defaultDesign(current.templateId) },
      dirty: true,
    });
    void get().saveNow();
  },

  // ------------------------------------------------------------- presets
  refreshPresets() {
    const { repo } = get();
    if (!repo) return;
    set({ presets: repo.listTemplateVariants() });
    set({ palettes: repo.listColorPalettes() });
  },

  refreshPalettes() {
    const { repo } = get();
    if (!repo) return;
    set({ palettes: repo.listColorPalettes() });
  },

  /**
   * Save the current project's *resolved* colour set as a standalone palette.
   * Only the 13 colour tokens are stored — never content, never a template.
   */
  savePalette(name) {
    const { repo, current } = get();
    if (!repo || !current) return;
    const design = resolveDesign(current.templateId, current.design);
    // Read the *resolved* tokens, not the raw palette: optional tokens such as
    // heading/border/divider are derived at compose time, and saving a partial
    // palette would silently lose them when it is applied again.
    const resolved = composeDocumentTokens({ data: current.data, design, overrides: current.design }).colors;
    const colors: Record<string, string> = {};
    for (const token of COLOR_TOKENS) {
      const value = (resolved as unknown as Record<string, string>)[token];
      if (typeof value === 'string' && /^#[0-9a-f]{3,6}$/i.test(value)) colors[token] = value;
    }
    repo.saveColorPalette({
      id: uid(),
      name: name.trim() || 'Untitled palette',
      basePaletteId: current.design.paletteId,
      colors,
    });
    get().refreshPalettes();
    get().pushToast({
      kind: 'success',
      title: get().settings.uiLanguage === 'bn' ? 'প্যালেট সংরক্ষিত' : 'Palette saved',
      detail: name,
    });
  },

  applyPalette(id) {
    const palette = get().palettes.find((p) => p.id === id);
    if (!palette) return;
    get().updateDesign({ paletteId: palette.basePaletteId, colors: palette.colors, presetId: null });
  },

  deletePalette(id) {
    get().repo?.deleteColorPalette(id);
    get().refreshPalettes();
  },

  savePreset(name) {
    const { repo, current } = get();
    if (!repo || !current) return;
    const id = uid();
    repo.saveTemplateVariant(id, current.templateId, name.trim() || 'Untitled preset', current.design);
    get().refreshPresets();
    get().pushToast({
      kind: 'success',
      title: get().settings.uiLanguage === 'bn' ? 'প্রিসেট সংরক্ষিত' : 'Preset saved',
      detail: name,
    });
  },

  applyPreset(id) {
    const preset = get().presets.find((p) => p.id === id);
    const current = get().current;
    if (!preset || !current) return;
    set({
      undoStack: [
        ...get().undoStack,
        { data: clone(current.data), design: clone(current.design), templateId: current.templateId },
      ].slice(-MAX_HISTORY),
      current: {
        ...current,
        // Applying a preset never overwrites the template: it records the base
        // template and layers the saved design tokens on top.
        templateId: preset.baseTemplateId,
        design: { ...defaultDesign(preset.baseTemplateId), ...preset.design, presetId: preset.id },
      },
      dirty: true,
    });
    void get().saveNow();
  },

  renamePreset(id, name) {
    const { repo, presets } = get();
    const preset = presets.find((p) => p.id === id);
    if (!repo || !preset) return;
    repo.saveTemplateVariant(id, preset.baseTemplateId, name.trim() || preset.name, preset.design);
    get().refreshPresets();
  },

  duplicatePreset(id) {
    const { repo, presets } = get();
    const preset = presets.find((p) => p.id === id);
    if (!repo || !preset) return;
    repo.saveTemplateVariant(uid(), preset.baseTemplateId, `${preset.name} copy`, preset.design);
    get().refreshPresets();
  },

  deletePreset(id) {
    const { repo } = get();
    if (!repo) return;
    repo.deleteTemplateVariant(id);
    get().refreshPresets();
  },

  async saveCustomer(customer) {
    const { repo } = get();
    if (!repo) return customer;
    const next = { ...customer, updatedAt: nowIso() };
    repo.saveCustomer(next);
    get().refreshLists();
    return next;
  },

  newCustomerDraft() {
    return createEmptyCustomer();
  },

  async deleteCustomer(id) {
    const repo = get().repo;
    if (!repo) return;
    repo.softDeleteCustomer(id);
    get().refreshLists();
    get().pushToast({ kind: 'success', title: 'Customer moved to trash', detail: 'You can restore it from the Customers page.' });
  },

  async restoreCustomer(id) {
    get().repo?.restoreCustomer(id);
    get().refreshLists();
  },

  async purgeCustomer(id) {
    get().repo?.hardDeleteCustomer(id);
    get().refreshLists();
    get().pushToast({ kind: 'success', title: 'Customer permanently deleted' });
  },

  async deleteProject(id) {
    const { repo, current } = get();
    if (!repo) return;
    repo.softDeleteProject(id);
    get().refreshLists();
    if (current?.id === id) set({ current: null });
    get().pushToast({ kind: 'success', title: 'Project moved to trash' });
  },

  async restoreProject(id) {
    get().repo?.restoreProject(id);
    get().refreshLists();
  },

  async purgeProject(id) {
    get().repo?.hardDeleteProject(id);
    get().refreshLists();
  },

  async duplicateProject(id) {
    const copy = get().repo?.duplicateProject(id);
    get().refreshLists();
    if (copy) get().pushToast({ kind: 'success', title: 'Project duplicated' });
  },

  pushToast(toast) {
    const item: ToastItem = { ...toast, id: uid() };
    set({ toasts: [...get().toasts, item] });
    setTimeout(() => get().dismissToast(item.id), 6000);
  },

  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  logExport(record) {
    const repo = get().repo;
    if (!repo) return;
    repo.logExport({ ...record, id: uid(), createdAt: nowIso() });
    set({ exports: repo.listExports() });
  },
}));

/** Flush any pending autosave (called before export/print/navigation). */
export async function flushAutosave(): Promise<void> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  const state = useWorkspace.getState();
  if (state.dirty) await state.saveNow();
}
