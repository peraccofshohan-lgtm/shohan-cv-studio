/**
 * UI store — transient interface state that must never be persisted in the
 * project record (navigation, zoom, panel visibility, theme, language).
 */
import { create } from 'zustand';

export type EditorPanel = 'content' | 'design' | 'title' | 'pages' | 'reports' | 'presets' | 'section';

export type Route =
  | { name: 'dashboard' }
  | { name: 'projects' }
  | { name: 'customers' }
  | { name: 'templates' }
  | { name: 'drafts' }
  | { name: 'exports' }
  | { name: 'backup' }
  | { name: 'settings' }
  | { name: 'help' }
  | { name: 'wizard'; step: number }
  | { name: 'gallery' }
  | { name: 'editor' };

interface UIState {
  route: Route;
  language: 'bn' | 'en';
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  editorZoom: number;
  editorPanel: EditorPanel;
  wizardStep: number;
  /** Route history for Back behaviour. */
  history: Route[];

  navigate: (route: Route, opts?: { replace?: boolean }) => void;
  back: () => void;
  setLanguage: (lang: 'bn' | 'en') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setZoom: (zoom: number) => void;
  setEditorPanel: (panel: EditorPanel) => void;
  setWizardStep: (step: number) => void;
}

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const store = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable in private mode — non-fatal */
  }
};

export const useUI = create<UIState>((set, get) => ({
  route: { name: 'dashboard' },
  language: readStored<'bn' | 'en'>('ui.language', 'bn'),
  theme: readStored<'light' | 'dark' | 'system'>('ui.theme', 'light'),
  sidebarCollapsed: readStored('ui.sidebarCollapsed', false),
  editorZoom: 1,
  editorPanel: 'content',
  wizardStep: 0,
  history: [],

  navigate(route, opts) {
    const current = get().route;
    set({
      route,
      history: opts?.replace ? get().history : [...get().history, current].slice(-25),
      wizardStep: route.name === 'wizard' ? route.step : get().wizardStep,
    });
  },

  back() {
    const history = get().history;
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    set({ route: previous, history: history.slice(0, -1) });
  },

  setLanguage(language) {
    store('ui.language', language);
    set({ language });
  },

  setTheme(theme) {
    store('ui.theme', theme);
    set({ theme });
  },

  toggleSidebar() {
    const next = !get().sidebarCollapsed;
    store('ui.sidebarCollapsed', next);
    set({ sidebarCollapsed: next });
  },

  setZoom(zoom) {
    set({ editorZoom: Math.max(0.5, Math.min(1.75, Number(zoom.toFixed(2)))) });
  },

  setEditorPanel(editorPanel) {
    set({ editorPanel });
  },

  setWizardStep(wizardStep) {
    set({ wizardStep });
  },
}));
