/**
 * CV editing studio.
 *
 * Three columns: section navigator, live A4 page, design panel. The toolbar
 * exposes save, undo/redo, preview, print, DOCX and PDF. Design customisation
 * only ever writes to `project.design` — customer content is never touched.
 */
import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ClipboardCopy,
  Eye,
  FileDown,
  FileText,
  Globe,
  Printer,
  Redo2,
  RotateCcw,
  Bookmark,
  ClipboardCheck,
  Minimize2,
  MoveHorizontal,
  Paintbrush,
  FileStack,
  Ruler,
  Type,
  Save,
  Settings2,
  Sliders,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  Badge,
  Button,
  Field,
  IconButton,
  Input,
  Modal,
  Notice,
  Segmented,
  Select,
  SwitchRow,
  useLang,
  useT,
} from '@/components/ui';
import { HexField, NumberField, PanelSection } from '@/components/studioControls';
import { useWorkspace, flushAutosave } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { buildStandaloneHtml } from '@/document/standalone';
import { embeddedFontCss } from '@/assets/fonts';
import { FONT_PAIRS, PALETTES, resolveDesign, templateById } from '@/templates/catalog';
import { printableSections, SECTION_TITLES } from '@/lib/sections';
import type { SectionId } from '@/types/cv';
import { exportDocx, exportPdf, exportHtml, printProject } from '@/features/exporting/exportService';
import { copyAsPlainText } from '@/features/exporting/textExport';
import { ContentPanel } from './ContentPanel';
import { TitlePanel } from './TitlePanel';
import { PageLengthPanel } from './PageLengthPanel';
import { ReportsPanel } from './ReportsPanel';
import { PresetsPanel } from './PresetsPanel';
import { SectionStylePanel } from './SectionStylePanel';
import { hasOverride } from '@/lib/sectionStyles';
import { composeDocumentTokens } from '@/lib/composition';
import { ORDER_PRESETS, applyOrderPreset, detectOrderPreset, type OrderPresetId } from '@/lib/sectionOrder';
import { buildLayoutReport } from '@/lib/layoutReport';

export const EditorPage: React.FC = () => {
  const current = useWorkspace((s) => s.current);
  const undo = useWorkspace((s) => s.undo);
  const redo = useWorkspace((s) => s.redo);
  const saveNow = useWorkspace((s) => s.saveNow);
  const dirty = useWorkspace((s) => s.dirty);
  const saving = useWorkspace((s) => s.saving);
  const canUndo = useWorkspace((s) => s.undoStack.length > 0);
  const canRedo = useWorkspace((s) => s.redoStack.length > 0);
  const { navigate, editorZoom, setZoom, editorPanel, setEditorPanel, language } = useUI();
  const bn = (a: string, b: string) => (language === 'bn' ? b : a);
  const tr = useT();
  const lang = language;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<null | 'docx' | 'pdf' | 'print' | 'html'>(null);
  const [targetSection, setTargetSection] = useState<SectionId | 'personal'>('personal');

  const data = current?.data;
  const design = useMemo(
    () => (current ? resolveDesign(current.templateId, current.design) : resolveDesign('classic-professional', {})),
    [current],
  );
  const [guides, setGuides] = useState(false);
  const sections = useMemo(
    () => (data ? printableSections(data, { language: lang }) : []),
    [data, lang],
  );
  /** One composition pass: the preview, the exports and the report all use it. */
  const tokens = useMemo(
    () => (data ? composeDocumentTokens({ data, design, overrides: current?.design }) : null),
    [data, design, current?.design],
  );
  const report = useMemo(
    () =>
      data && tokens
        ? buildLayoutReport(data, sections, tokens, { language: lang, hasPhoto: !!data.photo.dataUrl })
        : null,
    [data, tokens, sections, lang],
  );
  const pages = report?.pages ?? 1;

  const css = useMemo(
    () =>
      buildDocumentCss({
        design,
        fontCss: embeddedFontCss(),
        mode: 'screen',
        showGuides: guides,
        tokens: tokens ?? undefined,
      }),
    [design, guides, tokens],
  );


  if (!current || !data) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty">
            <div className="empty-icon">
              <FileText size={22} />
            </div>
            <h3>{lang === 'bn' ? 'কোনো প্রকল্প খোলা নেই' : 'No project open'}</h3>
            <p>
              {lang === 'bn'
                ? 'সম্পাদনা শুরু করতে একটি প্রকল্প খুলুন বা নতুন সিভি তৈরি করুন।'
                : 'Open a project or create a new CV to start editing.'}
            </p>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <Button variant="primary" onClick={() => navigate({ name: 'wizard', step: 0 })}>
                {tr('dash.newCv')}
              </Button>
              <Button onClick={() => navigate({ name: 'projects' })}>{tr('nav.projects')}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const runExport = async (kind: 'docx' | 'pdf' | 'print' | 'html') => {
    setBusy(kind);
    try {
      await flushAutosave();
      const options = { project: current, design };
      if (kind === 'docx') await exportDocx(options);
      if (kind === 'pdf') await exportPdf(options);
      if (kind === 'print') await printProject(options);
      if (kind === 'html') await exportHtml(options);
    } catch (err) {
      useWorkspace.getState().pushToast({
        kind: 'error',
        title: lang === 'bn' ? 'কাজটি সম্পন্ন হয়নি' : 'The action could not be completed',
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  };

  const previewHtml = buildStandaloneHtml({
    data,
    design,
    pageCount: pages,
    title: current.title,
  });

  return (
    <div className="editor-root">
      <style>{`${css}
      .editor-root { display: grid; grid-template-rows: auto minmax(0,1fr); height: 100%; min-height: 0; }
      .editor-toolbar { display: flex; align-items: center; gap: var(--sp-2); padding: 10px var(--sp-4); border-bottom: 1px solid var(--border); background: var(--bg-elevated); flex-wrap: wrap; }
      .editor-main { display: grid; grid-template-columns: 246px minmax(0,1fr) 320px; min-height: 0; height: 100%; }
      .editor-left, .editor-right { background: var(--bg-elevated); overflow-y: auto; }
      .editor-left { border-right: 1px solid var(--border); }
      .editor-right { border-left: 1px solid var(--border); }
      .editor-canvas { overflow: auto; background: var(--bg-sunken); padding: var(--sp-5); display: flex; justify-content: center; align-items: flex-start; }
      .editor-canvas-inner { transform-origin: top center; }
      .editor-canvas-inner { position: relative; }
      .margin-guides { position: absolute; border: 1px dashed rgba(37,99,235,.45); pointer-events: none; z-index: 4; }
      .section-row { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: var(--radius-sm); }
      .section-row:hover { background: var(--bg-hover); }
      .section-row[data-active='true'] { background: var(--primary-soft); }
      .section-row button.sec-name { flex: 1; min-width: 0; text-align: left; border: 0; background: none; font: inherit; font-size: var(--fs-sm); color: var(--text); cursor: pointer; padding: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @media (max-width: 1400px) { .editor-main { grid-template-columns: 216px minmax(0,1fr) 290px; } }
      @media (max-width: 1120px) { .editor-main { grid-template-columns: 190px minmax(0,1fr); } .editor-right { display: none; } }
    `}</style>

      <div className="editor-toolbar">
        <div className="row" style={{ gap: 2 }}>
          <IconButton label={tr('common.undo')} onClick={undo} disabled={!canUndo}>
            <Undo2 size={16} />
          </IconButton>
          <IconButton label={tr('common.redo')} onClick={redo} disabled={!canRedo}>
            <Redo2 size={16} />
          </IconButton>
          <IconButton label={tr('common.save')} onClick={() => void saveNow()}>
            <Save size={16} />
          </IconButton>
        </div>
        <div className="divider" style={{ width: 1, height: 22, margin: '0 4px' }} />
        <Badge tone={saving ? 'warning' : dirty ? 'info' : 'success'} icon={saving ? undefined : <Check size={10} />}>
          {saving ? tr('common.saving') : dirty ? tr('editor.saveState') : tr('common.saved')}
        </Badge>
        <Badge>{templateById(current.templateId).name}</Badge>
        <Badge tone="info">
          {pages} {tr('editor.pages')}
        </Badge>

        <span className="spacer" />

        <div className="row" style={{ gap: 2 }}>
          <IconButton label={bn('Fit to page', 'পৃষ্ঠায় ফিট')} onClick={() => setZoom(0.72)}>
            <Minimize2 size={15} />
          </IconButton>
          <IconButton label={bn('Fit to width', 'প্রস্থে ফিট')} onClick={() => setZoom(1)}>
            <MoveHorizontal size={15} />
          </IconButton>
          <IconButton label="Zoom out" onClick={() => setZoom(editorZoom - 0.1)}>
            <ZoomOut size={15} />
          </IconButton>
          <span className="small mono faint" style={{ width: 40, textAlign: 'center' }}>
            {Math.round(editorZoom * 100)}%
          </span>
          <IconButton label="Zoom in" onClick={() => setZoom(editorZoom + 0.1)}>
            <ZoomIn size={15} />
          </IconButton>
        </div>
        <div className="divider" style={{ width: 1, height: 22, margin: '0 4px' }} />
        <Button
          size="sm"
          variant={guides ? 'primary' : 'ghost'}
          aria-pressed={guides}
          icon={<Ruler size={14} />}
          onClick={() => setGuides((v) => !v)}
          title={lang === 'bn' ? 'A4 পৃষ্ঠা সীমানা দেখান' : 'Show A4 page boundaries'}
        >
          {lang === 'bn' ? 'গাইড' : 'Guides'}
        </Button>
        <Button
          size="sm"
          icon={<ClipboardCopy size={14} />}
          onClick={async () => {
            try {
              const result = await copyAsPlainText(current);
              useWorkspace.getState().pushToast({
                kind: 'success',
                title:
                  result.method === 'clipboard'
                    ? lang === 'bn'
                      ? 'প্লেইন টেক্সট কপি হয়েছে'
                      : 'Plain text copied'
                    : lang === 'bn'
                      ? 'টেক্সট ফাইল হিসেবে সংরক্ষিত'
                      : 'Saved as a text file',
                detail: result.detail,
              });
            } catch (err) {
              useWorkspace.getState().pushToast({
                kind: 'error',
                title: lang === 'bn' ? 'কপি করা যায়নি' : 'Could not copy',
                detail: err instanceof Error ? err.message : String(err),
              });
            }
          }}
        >
          {lang === 'bn' ? 'টেক্সট' : 'Text'}
        </Button>
        <Button size="sm" icon={<Eye size={14} />} onClick={() => setPreviewOpen(true)}>
          {tr('common.preview')}
        </Button>
        <Button size="sm" icon={<Printer size={14} />} onClick={() => void runExport('print')} loading={busy === 'print'}>
          {tr('common.print')}
        </Button>
        <Button size="sm" icon={<FileDown size={14} />} onClick={() => void runExport('docx')} loading={busy === 'docx'}>
          DOCX
        </Button>
        <Button
          size="sm"
          icon={<Globe size={14} />}
          onClick={() => void runExport('html')}
          loading={busy === 'html'}
          title={lang === 'bn' ? 'স্বয়ংসম্পূর্ণ HTML কপি সংরক্ষণ করুন' : 'Save a self-contained HTML copy'}
        >
          HTML
        </Button>
        <Button size="sm" variant="primary" icon={<FileDown size={14} />} onClick={() => void runExport('pdf')} loading={busy === 'pdf'}>
          PDF
        </Button>
      </div>

      <div className="editor-main">
        <aside className="editor-left" aria-label={tr('editor.sections')}>
          <div style={{ padding: 'var(--sp-4) var(--sp-4) var(--sp-2)' }}>
            <div className="row between">
              <span className="small" style={{ fontWeight: 620 }}>
                {tr('editor.sections')}
              </span>
              <Badge tone="primary">{sections.length}</Badge>
            </div>
          </div>
          <div style={{ padding: '0 var(--sp-2) var(--sp-4)' }}>
            <button
              className="section-row"
              data-active={targetSection === 'personal'}
              onClick={() => setTargetSection('personal')}
              style={{ width: '100%' }}
            >
              <span className="sec-name">{lang === 'bn' ? 'ব্যক্তিগত তথ্য ও যোগাযোগ' : 'Personal & contact'}</span>
              <ChevronDown size={13} className="faint" />
            </button>
            <SectionNavigator
                active={targetSection}
                onSelect={setTargetSection}
                onDesign={(id) => {
                  setTargetSection(id);
                  setEditorPanel('section');
                }}
              />
          </div>
          <div style={{ padding: '0 var(--sp-4) var(--sp-5)' }}>
            <Button
              size="sm"
              block
              icon={<Settings2 size={14} />}
              onClick={() => navigate({ name: 'wizard', step: 0 })}
            >
              {lang === 'bn' ? 'উইজার্ডে ফিরে যান' : 'Back to wizard'}
            </Button>
          </div>
        </aside>

        <div className="editor-canvas">
          <div className="editor-canvas-inner" style={{ transform: `scale(${editorZoom})`, width: 210 * 2.9528 * editorZoom }}>
            {guides && tokens ? (
              <div
                aria-hidden="true"
                className="margin-guides"
                style={{
                  left: tokens.margins.left * 2.9528,
                  top: tokens.margins.top * 2.9528,
                  right: tokens.margins.right * 2.9528,
                  bottom: tokens.margins.bottom * 2.9528,
                }}
              />
            ) : null}
            <CvDocument
              data={data}
              design={design}
              language={lang}
              pageCount={pages}
              guides={guides}
              tokens={tokens ?? undefined}
            />
          </div>
        </div>

        <aside className="editor-right" aria-label={tr('editor.design')}>
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--border)' }}>
            <div className="segmented" style={{ width: '100%' }} role="group" aria-label="Editor panel">
              <button aria-pressed={editorPanel === 'content'} onClick={() => setEditorPanel('content')} style={{ flex: 1 }} title={tr('editor.content')}>
                <FileText size={14} />
              </button>
              <button aria-pressed={editorPanel === 'design'} onClick={() => setEditorPanel('design')} style={{ flex: 1 }} title={tr('editor.design')}>
                <Sliders size={14} />
              </button>
              <button aria-pressed={editorPanel === 'title'} onClick={() => setEditorPanel('title')} style={{ flex: 1 }} title={bn('Title', 'শিরোনাম')}>
                <Type size={14} />
              </button>
              <button aria-pressed={editorPanel === 'pages'} onClick={() => setEditorPanel('pages')} style={{ flex: 1 }} title={bn('Page length', 'পৃষ্ঠার দৈর্ঘ্য')}>
                <FileStack size={14} />
              </button>
              <button aria-pressed={editorPanel === 'reports'} onClick={() => setEditorPanel('reports')} style={{ flex: 1 }} title={bn('Reports', 'রিপোর্ট')}>
                <ClipboardCheck size={14} />
              </button>
              <button aria-pressed={editorPanel === 'presets'} onClick={() => setEditorPanel('presets')} style={{ flex: 1 }} title={bn('Style presets', 'স্টাইল প্রিসেট')}>
                <Bookmark size={14} />
              </button>
            </div>
          </div>
          <div style={{ padding: 'var(--sp-4)' }}>
            {editorPanel === 'content' ? <ContentPanel section={targetSection} /> : null}
            {editorPanel === 'design' ? <DesignPanel /> : null}
            {editorPanel === 'title' ? <TitlePanel /> : null}
            {editorPanel === 'pages' && report ? (
              <PageLengthPanel
                pages={report.pages}
                fits={report.fitsTarget}
                target={report.targetLabel}
                warnings={report.diagnostics.filter((d) => d.level !== 'info').length}
              />
            ) : null}
            {editorPanel === 'reports' && report ? (
              <ReportsPanel report={report} data={data} templateName={design.template.name} />
            ) : null}
            {editorPanel === 'presets' ? <PresetsPanel /> : null}
            {editorPanel === 'section' && targetSection !== 'personal' ? (
              <SectionStylePanel section={targetSection} />
            ) : null}
          </div>
        </aside>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={lang === 'bn' ? 'সম্পূর্ণ প্রিভিউ' : 'Full preview'}
        description={lang === 'bn' ? 'এটি হুবহু প্রিন্ট/PDF লেআউট — A4 পৃষ্ঠা।' : 'This is the exact print/PDF layout — A4 pages.'}
        size="lg"
        footer={
          <>
            <Button onClick={() => setPreviewOpen(false)}>{tr('common.close')}</Button>
            <Button icon={<Printer size={14} />} onClick={() => void runExport('print')}>
              {tr('common.print')}
            </Button>
            <Button variant="primary" icon={<FileDown size={14} />} onClick={() => void runExport('pdf')}>
              {tr('common.pdfSave')}
            </Button>
          </>
        }
      >
        <div style={{ background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)', overflow: 'auto', maxHeight: '64vh', padding: 'var(--sp-4)' }}>
          <iframe
            title="CV print preview"
            srcDoc={previewHtml}
            style={{ width: '100%', height: '58vh', border: 0, background: '#fff', borderRadius: 4 }}
            sandbox="allow-same-origin"
          />
        </div>
      </Modal>
    </div>
  );
};

/** Reorderable section list with visibility toggles. */
const SectionNavigator: React.FC<{
  active: SectionId | 'personal';
  onSelect: (id: SectionId | 'personal') => void;
  onDesign: (id: SectionId) => void;
}> = ({ active, onSelect, onDesign }) => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();

  const ordered = [...data.sections].sort((a, b) => a.order - b.order);
  const visible = new Set(
    printableSections(data, { language: lang }).map((s) => s.id),
  );

  const move = (id: SectionId, direction: -1 | 1) => {
    const index = ordered.findIndex((s) => s.id === id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    update((draft) => {
      draft.sections = next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const toggle = (id: SectionId, enabled: boolean) =>
    update((draft) => {
      const section = draft.sections.find((s) => s.id === id);
      if (section) section.enabled = enabled;
    });

  const currentPreset = detectOrderPreset(data.sections);

  return (
    <>
      <div style={{ padding: '0 10px 8px' }}>
        <Select
          value={currentPreset ?? 'custom'}
          aria-label={lang === 'bn' ? 'প্রস্তাবিত ক্রম' : 'Recommended order'}
          onChange={(e) => {
            if (e.target.value === 'custom') return;
            const presetId = e.target.value as OrderPresetId;
            update((draft) => {
              draft.sections = applyOrderPreset(draft.sections, presetId);
            });
          }}
          title={
            lang === 'bn'
              ? 'প্রস্তাবিত ক্রম প্রয়োগ করুন — কোনো তথ্য মুছে যাবে না'
              : 'Apply a recommended order — no content is removed'
          }
        >
          {currentPreset === null && (
            <option value="custom">{lang === 'bn' ? 'কাস্টম ক্রম' : 'Custom order'}</option>
          )}
          {ORDER_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {lang === 'bn' ? preset.nameBn : preset.nameEn}
              {currentPreset === preset.id ? ' ✓' : ''}
            </option>
          ))}
        </Select>
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>
          {lang === 'bn'
            ? 'প্রস্তাবিত ক্রম শুধু সেকশন সাজায়; কোনো তথ্য যোগ বা বাদ হয় না।'
            : 'A recommended order only rearranges sections; nothing is added or removed.'}
        </div>
      </div>
      {ordered.map((section, index) => {
        const title = SECTION_TITLES[section.id][lang];
        const hasContent = visible.has(section.id);
        return (
          <div key={section.id} className="section-row" data-active={active === section.id}>
            <span
              title={hasContent ? (lang === 'bn' ? 'প্রিন্ট হবে' : 'Prints') : lang === 'bn' ? 'খালি — বাদ যাবে' : 'Empty — omitted'}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                flex: '0 0 7px',
                background: !section.enabled ? 'var(--border-strong)' : hasContent ? 'var(--success)' : 'var(--warning)',
              }}
            />
            <button className="sec-name" onClick={() => onSelect(section.id)} title={title}>
              {title}
            </button>
            <div className="row" style={{ gap: 0 }}>
              <button
                className="btn btn-icon btn-sm"
                style={{ width: 20, height: 20 }}
                onClick={() => move(section.id, -1)}
                disabled={index === 0}
                aria-label={`Move ${title} up`}
              >
                <ArrowUp size={11} />
              </button>
              <button
                className="btn btn-icon btn-sm"
                style={{ width: 20, height: 20 }}
                onClick={() => move(section.id, 1)}
                disabled={index === ordered.length - 1}
                aria-label={`Move ${title} down`}
              >
                <ArrowDown size={11} />
              </button>
              <button
                className="btn btn-icon btn-sm"
                style={{ width: 20, height: 20 }}
                onClick={() => onDesign(section.id)}
                aria-label={`Design ${title}`}
                title={
                  hasOverride(data.sectionStyles, section.id)
                    ? lang === 'bn' ? 'সেকশন ডিজাইন (পরিবর্তিত)' : 'Section design (customised)'
                    : lang === 'bn' ? 'সেকশন ডিজাইন' : 'Section design'
                }
              >
                <Paintbrush
                  size={11}
                  style={{ opacity: hasOverride(data.sectionStyles, section.id) ? 1 : 0.4 }}
                />
              </button>
              <button
                className="btn btn-icon btn-sm"
                style={{ width: 20, height: 20 }}
                onClick={() => toggle(section.id, !section.enabled)}
                aria-label={`${section.enabled ? 'Hide' : 'Show'} ${title}`}
                aria-pressed={section.enabled}
                title={section.enabled ? (lang === 'bn' ? 'লুকান' : 'Hide') : lang === 'bn' ? 'দেখাও' : 'Show'}
              >
                <Eye size={11} style={{ opacity: section.enabled ? 1 : 0.35 }} />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};

/**
 * Design panel — tokens only, never content.
 *
 * Two modes: Basic (palette, font pair, density, spacing, margins) and Advanced
 * (individual colours, per-role fonts, photo geometry, footer, layout). Basic is
 * the default so a first-time operator can produce a professional CV without
 * opening the advanced controls.
 */
export const DesignPanel: React.FC = () => {
  const current = useWorkspace((s) => s.current)!;
  const updateDesign = useWorkspace((s) => s.updateDesign);
  const resetDesign = useWorkspace((s) => s.resetDesign);
  const lang = useLang();
  const bn = (a: string, b: string) => (lang === 'bn' ? b : a);
  const d = current.design;
  const [advanced, setAdvanced] = useState(false);

  const margins = d.margins ?? { top: d.marginMm, right: d.marginMm, bottom: d.marginMm, left: d.marginMm };
  const setMargin = (side: 'top' | 'right' | 'bottom' | 'left', value: number) =>
    updateDesign({ margins: { ...margins, [side]: value } });
  const spacing = d.spacing ?? {};
  const setSpacing = (key: keyof NonNullable<typeof d.spacing>, value: number) =>
    updateDesign({ spacing: { ...spacing, [key]: value } });
  const colours = d.colors ?? {};

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <div className="segmented" role="group" aria-label={bn('Design mode', 'ডিজাইন মোড')} style={{ width: '100%' }}>
        <button aria-pressed={!advanced} onClick={() => setAdvanced(false)} style={{ flex: 1 }}>
          {bn('Basic', 'সাধারণ')}
        </button>
        <button aria-pressed={advanced} onClick={() => setAdvanced(true)} style={{ flex: 1 }}>
          {bn('Advanced', 'অ্যাডভান্সড')}
        </button>
      </div>

      <Field label={bn('Colour palette', 'রঙের প্যালেট')}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => updateDesign({ paletteId: p.id, colors: {} })}
              title={lang === 'bn' ? p.nameBn : p.name}
              aria-pressed={d.paletteId === p.id}
              aria-label={lang === 'bn' ? p.nameBn : p.name}
              style={{
                height: 38,
                borderRadius: 'var(--radius-sm)',
                border: d.paletteId === p.id ? '2px solid var(--text)' : '1px solid var(--border)',
                background: `linear-gradient(135deg, ${p.primary} 0 55%, ${p.accent} 55% 78%, ${p.tint} 78% 100%)`,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </Field>

      <Field label={bn('Font pair', 'ফন্ট জোড়া')}>
        <Select value={d.fontPairId} onChange={(e) => updateDesign({ fontPairId: e.target.value })}>
          {FONT_PAIRS.map((f) => (
            <option key={f.id} value={f.id}>
              {lang === 'bn' ? f.nameBn : f.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={bn('Density', 'ঘনত্ব')} hint={bn('Changes real spacing, not just the look.', 'শুধু রূপ নয়, প্রকৃত স্পেসিং বদলায়।')}>
        <Segmented
          ariaLabel={bn('Density', 'ঘনত্ব')}
          value={d.density ?? 'balanced'}
          onChange={(v) => updateDesign({ density: v })}
          options={[
            { value: 'compact', label: bn('Compact', 'সংকুচিত') },
            { value: 'balanced', label: bn('Balanced', 'ভারসাম্য') },
            { value: 'spacious', label: bn('Spacious', 'প্রশস্ত') },
          ]}
        />
      </Field>

      <Field label={bn('Header style', 'হেডার স্টাইল')}>
        <Select value={d.headerStyle} onChange={(e) => updateDesign({ headerStyle: e.target.value as typeof d.headerStyle })}>
          <option value="banner">{bn('Banner with rule', 'রেখাযুক্ত ব্যানার')}</option>
          <option value="split">{bn('Split', 'বিভক্ত')}</option>
          <option value="centered">{bn('Centred', 'কেন্দ্রীভূত')}</option>
          <option value="minimal">{bn('Minimal', 'সংক্ষিপ্ত')}</option>
          <option value="band">{bn('Solid band', 'গাঢ় ব্যান্ড')}</option>
          <option value="dual">{bn('Double rule', 'দুই রেখা')}</option>
        </Select>
      </Field>

      <Field label={bn('Section heading style', 'সেকশন শিরোনামের ধরন')}>
        <Select value={d.headingStyle} onChange={(e) => updateDesign({ headingStyle: e.target.value as typeof d.headingStyle })}>
          <option value="rule">{bn('Rule to the right', 'ডানে রেখা')}</option>
          <option value="bar">{bn('Accent bar', 'অ্যাকসেন্ট বার')}</option>
          <option value="caps">{bn('Wide capitals', 'প্রশস্ত বড় হাতের')}</option>
          <option value="underline">{bn('Heavy underline', 'মোটা আন্ডারলাইন')}</option>
          <option value="boxed">{bn('Boxed', 'বক্স')}</option>
          <option value="side-mark">{bn('Side mark', 'পাশের চিহ্ন')}</option>
        </Select>
      </Field>

      <Field label={bn('Body layout', 'বডি লেআউট')}>
        <Select value={d.bodyLayout ?? 'single'} onChange={(e) => updateDesign({ bodyLayout: e.target.value as NonNullable<typeof d.bodyLayout> })}>
          <option value="single">{bn('Single column', 'এক কলাম')}</option>
          <option value="two-col">{bn('Two columns', 'দুই কলাম')}</option>
          <option value="sidebar-left">{bn('Sidebar left', 'বাম সাইডবার')}</option>
          <option value="sidebar-right">{bn('Sidebar right', 'ডান সাইডবার')}</option>
        </Select>
      </Field>

      <SliderField
        label={bn('Overall text size', 'সামগ্রিক লেখার আকার')}
        value={d.bodyScale}
        min={0.85}
        max={1.15}
        step={0.01}
        onChange={(v) => updateDesign({ bodyScale: v })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label={bn('Heading size', 'শিরোনামের আকার')}
        value={d.headingScale}
        min={0.85}
        max={1.2}
        step={0.01}
        onChange={(v) => updateDesign({ headingScale: v })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label={bn('Line spacing', 'লাইন ফাঁক')}
        value={d.lineHeight}
        min={1.25}
        max={1.9}
        step={0.01}
        onChange={(v) => updateDesign({ lineHeight: v })}
        format={(v) => v.toFixed(2)}
      />
      <SliderField
        label={bn('Space between sections', 'সেকশনের মাঝে ফাঁক')}
        value={d.sectionSpacing}
        min={0.6}
        max={1.6}
        step={0.02}
        onChange={(v) => updateDesign({ sectionSpacing: v })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label={bn('Page margin', 'পৃষ্ঠার মার্জিন')}
        value={d.marginMm}
        min={8}
        max={30}
        step={0.5}
        onChange={(v) => updateDesign({ marginMm: v, margins: undefined })}
        format={(v) => `${v} mm`}
      />

      <Field label={bn('Photo frame', 'ছবির ফ্রেম')}>
        <Select value={d.photoShape} onChange={(e) => updateDesign({ photoShape: e.target.value as typeof d.photoShape })}>
          <option value="circle">{bn('Circle', 'বৃত্ত')}</option>
          <option value="rounded">{bn('Rounded square', 'গোলাকার বর্গ')}</option>
          <option value="square">{bn('Square', 'বর্গ')}</option>
          <option value="none">{bn('No photo', 'ছবি নেই')}</option>
        </Select>
      </Field>
      <Field label={bn('Photo side', 'ছবির দিক')}>
        <Select value={d.photoPosition} onChange={(e) => updateDesign({ photoPosition: e.target.value as 'left' | 'right' })}>
          <option value="left">{bn('Left', 'বাম')}</option>
          <option value="right">{bn('Right', 'ডান')}</option>
        </Select>
      </Field>

      {advanced ? (
        <>
          <PanelSection title={bn('Colours', 'রং')} description={bn('Leave a field empty to use the template colour.', 'টেমপ্লেটের রং ব্যবহার করতে ঘরটি খালি রাখুন।')}>
            {(
              [
                ['primary', bn('Primary', 'প্রাথমিক')],
                ['accent', bn('Accent', 'অ্যাকসেন্ট')],
                ['heading', bn('Headings', 'শিরোনাম')],
                ['text', bn('Body text', 'মূল লেখা')],
                ['muted', bn('Muted text', 'হালকা লেখা')],
                ['border', bn('Borders', 'সীমানা')],
                ['sidebar', bn('Sidebar', 'সাইডবার')],
                ['photoBorder', bn('Photo border', 'ছবির সীমানা')],
              ] as const
            ).map(([token, label]) => (
              <HexField
                key={token}
                label={label}
                value={colours[token] ?? null}
                fallback={
                  token === 'photoBorder'
                    ? '#b4894a'
                    : token === 'border'
                      ? '#d6dbe2'
                      : token === 'heading'
                        ? '#14395e'
                        : token === 'sidebar'
                          ? '#14395e'
                          : token === 'muted'
                            ? '#5b6572'
                            : token === 'accent'
                              ? '#b4894a'
                              : token === 'text'
                                ? '#1b232c'
                                : '#14395e'
                }
                onChange={(v) => updateDesign({ colors: { ...colours, [token]: v ?? undefined } })}
                showRgb
              />
            ))}
            <Button
              variant="outline"
              block
              onClick={() => updateDesign({ colors: {} })}
              disabled={Object.keys(colours).length === 0}
            >
              {bn('Reset all colours to the template', 'সব রং টেমপ্লেটে ফিরিয়ে নিন')}
            </Button>
          </PanelSection>

          <PanelSection title={bn('Margins', 'মার্জিন')} defaultOpen={false} description={bn('A4 is 210 × 297 mm. 8–25 mm is the professional range.', 'A4 হলো ২১০ × ২৯৭ মিমি। পেশাদার পরিসর ৮–২৫ মিমি।')}>
            <NumberField label={bn('Top', 'উপর')} value={margins.top} min={6} max={40} step={0.5} unit="mm" onChange={(v) => setMargin('top', v)} />
            <NumberField label={bn('Right', 'ডান')} value={margins.right} min={6} max={40} step={0.5} unit="mm" onChange={(v) => setMargin('right', v)} />
            <NumberField label={bn('Bottom', 'নিচ')} value={margins.bottom} min={6} max={40} step={0.5} unit="mm" onChange={(v) => setMargin('bottom', v)} />
            <NumberField label={bn('Left', 'বাম')} value={margins.left} min={6} max={40} step={0.5} unit="mm" onChange={(v) => setMargin('left', v)} />
            <Button variant="outline" block onClick={() => updateDesign({ margins: undefined })} disabled={!d.margins}>
              {bn('Use one margin on all sides', 'সব দিকে একই মার্জিন')}
            </Button>
          </PanelSection>

          <PanelSection title={bn('Spacing', 'ফাঁক')} defaultOpen={false}>
            {(
              [
                ['sectionGap', bn('Between sections', 'সেকশনের মাঝে')],
                ['sectionHeading', bn('Under a heading', 'শিরোনামের নিচে')],
                ['paragraph', bn('Paragraph spacing', 'অনুচ্ছেদের ফাঁক')],
                ['bullet', bn('Bullet spacing', 'বুলেটের ফাঁক')],
                ['nameContact', bn('Name to contact', 'নাম থেকে যোগাযোগ')],
                ['header', bn('Header block', 'হেডার ব্লক')],
                ['column', bn('Column gap', 'কলামের ফাঁক')],
                ['footer', bn('Footer', 'ফুটার')],
              ] as const
            ).map(([key, label]) => (
              <SliderField
                key={key}
                label={label}
                value={spacing[key] ?? 1}
                min={0.4}
                max={2}
                step={0.02}
                onChange={(v) => setSpacing(key, v)}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            ))}
            <Button variant="outline" block onClick={() => updateDesign({ spacing: {} })} disabled={Object.keys(spacing).length === 0}>
              {bn('Reset spacing', 'ফাঁক রিসেট')}
            </Button>
          </PanelSection>

          <PanelSection title={bn('Typography', 'টাইপোগ্রাফি')} defaultOpen={false}>
            <Field label={bn('Body alignment', 'মূল লেখার সারিবদ্ধতা')}>
              <Select value={d.bodyAlign ?? 'justify'} onChange={(e) => updateDesign({ bodyAlign: e.target.value as 'left' | 'center' | 'right' | 'justify' })}>
                <option value="left">{bn('Left', 'বাম')}</option>
                <option value="justify">{bn('Justified', 'জাস্টিফাইড')}</option>
                <option value="center">{bn('Centre', 'কেন্দ্র')}</option>
                <option value="right">{bn('Right', 'ডান')}</option>
              </Select>
            </Field>
            <NumberField
              label={bn('First-line indent', 'প্রথম লাইনের ইন্ডেন্ট')}
              value={d.paragraphIndentMm ?? 0}
              min={0}
              max={10}
              step={0.5}
              unit="mm"
              onChange={(v) => updateDesign({ paragraphIndentMm: v })}
            />
            <NumberField
              label={bn('Name size', 'নামের আকার')}
              value={d.nameSizePt ?? 23}
              min={14}
              max={36}
              step={0.5}
              unit="pt"
              onChange={(v) => updateDesign({ nameSizePt: v })}
            />
            <NumberField
              label={bn('Title size', 'শিরোনামের আকার')}
              value={d.titleSizePt ?? current.data.title.fontSize}
              min={6}
              max={26}
              step={0.5}
              unit="pt"
              onChange={(v) => updateDesign({ titleSizePt: v })}
            />
          </PanelSection>

          <PanelSection title={bn('Photo & footer', 'ছবি ও ফুটার')} defaultOpen={false}>
            <NumberField
              label={bn('Photo size', 'ছবির আকার')}
              value={d.photoSizeMm ?? current.data.photo.frameSize}
              min={16}
              max={50}
              step={1}
              unit="mm"
              onChange={(v) => updateDesign({ photoSizeMm: v })}
            />
            <Field label={bn('Photo border', 'ছবির সীমানা')}>
              <Select value={d.photoBorder ?? 'none'} onChange={(e) => updateDesign({ photoBorder: e.target.value as NonNullable<typeof d.photoBorder> })}>
                <option value="none">{bn('None', 'কিছু না')}</option>
                <option value="thin">{bn('Thin', 'সরু')}</option>
                <option value="medium">{bn('Medium', 'মাঝারি')}</option>
                <option value="thick">{bn('Thick', 'মোটা')}</option>
              </Select>
            </Field>
            <SwitchRow
              title={bn('Footer with the name', 'নামসহ ফুটার')}
              checked={!!d.showFooter}
              onChange={(v) => updateDesign({ showFooter: v })}
            />
            <SwitchRow
              title={bn('Page numbers', 'পৃষ্ঠা নম্বর')}
              checked={!!d.showPageNumbers}
              onChange={(v) => updateDesign({ showPageNumbers: v })}
            />
          </PanelSection>
        </>
      ) : null}

      <Button variant="outline" icon={<RotateCcw size={14} />} onClick={resetDesign} block>
        {bn('Reset design', 'ডিজাইন রিসেট')}
      </Button>
    </div>
  );
};

const SliderField: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}> = ({ label, value, min, max, step, onChange, format }) => (
  <div className="field">
    <div className="row between">
      <span className="field-label" style={{ margin: 0 }}>
        {label}
      </span>
      <span className="small mono faint">{format ? format(value) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ accentColor: 'var(--primary)' }}
      aria-label={label}
    />
  </div>
);
