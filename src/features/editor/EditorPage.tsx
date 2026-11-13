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
  Eye,
  FileDown,
  FileText,
  Layers,
  Printer,
  Redo2,
  RotateCcw,
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
  Select,
  Switch,
  useLang,
  useT,
} from '@/components/ui';
import { useWorkspace, flushAutosave } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { buildStandaloneHtml } from '@/document/standalone';
import { embeddedFontCss } from '@/assets/fonts';
import { FONT_PAIRS, PALETTES, resolveDesign, templateById } from '@/templates/catalog';
import { estimatePageCount, printableSections, SECTION_TITLES } from '@/lib/sections';
import type { SectionId } from '@/types/cv';
import { exportDocx, exportPdf, printProject } from '@/features/exporting/exportService';
import { ContentPanel } from './ContentPanel';

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
  const tr = useT();
  const lang = language;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState<null | 'docx' | 'pdf' | 'print'>(null);
  const [targetSection, setTargetSection] = useState<SectionId | 'personal'>('personal');

  const data = current?.data;
  const design = useMemo(
    () => (current ? resolveDesign(current.templateId, current.design) : resolveDesign('classic-professional', {})),
    [current],
  );
  const css = useMemo(() => buildDocumentCss({ design, fontCss: embeddedFontCss(), mode: 'screen', showGuides: false }), [design]);

  const sections = useMemo(
    () => (data ? printableSections(data, { language: lang }) : []),
    [data, lang],
  );
  const pages = useMemo(() => estimatePageCount(sections, !!data?.photo.dataUrl), [sections, data?.photo.dataUrl]);

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

  const runExport = async (kind: 'docx' | 'pdf' | 'print') => {
    setBusy(kind);
    try {
      await flushAutosave();
      const options = { project: current, design };
      if (kind === 'docx') await exportDocx(options);
      if (kind === 'pdf') await exportPdf(options);
      if (kind === 'print') await printProject(options);
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
        <Button size="sm" icon={<Eye size={14} />} onClick={() => setPreviewOpen(true)}>
          {tr('common.preview')}
        </Button>
        <Button size="sm" icon={<Printer size={14} />} onClick={() => void runExport('print')} loading={busy === 'print'}>
          {tr('common.print')}
        </Button>
        <Button size="sm" icon={<FileDown size={14} />} onClick={() => void runExport('docx')} loading={busy === 'docx'}>
          DOCX
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
            <SectionNavigator active={targetSection} onSelect={setTargetSection} />
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
          <div className="editor-canvas-inner" style={{ transform: `scale(${editorZoom})`, width: 793.7 * editorZoom }}>
            <CvDocument data={data} design={design} language={lang} pageCount={pages} />
          </div>
        </div>

        <aside className="editor-right" aria-label={tr('editor.design')}>
          <div style={{ padding: 'var(--sp-4)', borderBottom: '1px solid var(--border)' }}>
            <div className="segmented" style={{ width: '100%' }} role="group" aria-label="Editor panel">
              <button aria-pressed={editorPanel === 'content'} onClick={() => setEditorPanel('content')} style={{ flex: 1 }}>
                <FileText size={14} /> {tr('editor.content')}
              </button>
              <button aria-pressed={editorPanel === 'design'} onClick={() => setEditorPanel('design')} style={{ flex: 1 }}>
                <Sliders size={14} /> {tr('editor.design')}
              </button>
            </div>
          </div>
          <div style={{ padding: 'var(--sp-4)' }}>
            {editorPanel === 'content' ? (
              <ContentPanel section={targetSection} />
            ) : (
              <DesignPanel />
            )}
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
}> = ({ active, onSelect }) => {
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

  return (
    <>
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

/** Design customisation panel — tokens only, never content. */
export const DesignPanel: React.FC = () => {
  const current = useWorkspace((s) => s.current)!;
  const updateDesign = useWorkspace((s) => s.updateDesign);
  const resetDesign = useWorkspace((s) => s.resetDesign);
  const lang = useLang();
  const d = current.design;

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <Field label={lang === 'bn' ? 'রঙের প্যালেট' : 'Colour palette'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => updateDesign({ paletteId: p.id })}
              title={lang === 'bn' ? p.nameBn : p.name}
              aria-pressed={d.paletteId === p.id}
              style={{
                height: 38,
                borderRadius: 'var(--radius-sm)',
                border: d.paletteId === p.id ? '2px solid var(--text)' : '1px solid var(--border)',
                background: `linear-gradient(135deg, ${p.primary} 0 62%, ${p.accent} 62% 100%)`,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {d.paletteId === p.id ? (
                <Check size={13} style={{ position: 'absolute', inset: 0, margin: 'auto', color: '#fff' }} />
              ) : null}
            </button>
          ))}
        </div>
      </Field>

      <Field label={lang === 'bn' ? 'ফন্ট' : 'Font pairing'}>
        <Select value={d.fontPairId} onChange={(e) => updateDesign({ fontPairId: e.target.value })}>
          {FONT_PAIRS.map((f) => (
            <option key={f.id} value={f.id}>
              {lang === 'bn' ? f.nameBn : f.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={lang === 'bn' ? 'হেডিং স্টাইল' : 'Section heading style'}>
        <Select
          value={d.headingStyle}
          onChange={(e) => updateDesign({ headingStyle: e.target.value as typeof d.headingStyle })}
        >
          <option value="rule">Rule</option>
          <option value="bar">Colour bar</option>
          <option value="caps">Small caps</option>
          <option value="boxed">Boxed</option>
          <option value="underline">Underline</option>
          <option value="side-mark">Side mark</option>
        </Select>
      </Field>

      <SliderField
        label={lang === 'bn' ? 'হেডিং আকার' : 'Heading size'}
        value={d.headingScale}
        min={0.8}
        max={1.3}
        step={0.02}
        onChange={(v) => updateDesign({ headingScale: v })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label={lang === 'bn' ? 'বডি টেক্সট আকার' : 'Body text size'}
        value={d.bodyScale}
        min={0.85}
        max={1.2}
        step={0.01}
        onChange={(v) => updateDesign({ bodyScale: v })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label={lang === 'bn' ? 'লাইন স্পেসিং' : 'Line spacing'}
        value={d.lineHeight}
        min={1.2}
        max={1.9}
        step={0.02}
        onChange={(v) => updateDesign({ lineHeight: v })}
        format={(v) => v.toFixed(2)}
      />
      <SliderField
        label={lang === 'bn' ? 'সেকশন ফাঁক' : 'Section spacing'}
        value={d.sectionSpacing}
        min={0.6}
        max={1.6}
        step={0.05}
        onChange={(v) => updateDesign({ sectionSpacing: v })}
        format={(v) => `${v.toFixed(2)}×`}
      />
      <SliderField
        label={lang === 'bn' ? 'পেজ মার্জিন' : 'Page margin'}
        value={d.marginMm}
        min={10}
        max={26}
        step={1}
        onChange={(v) => updateDesign({ marginMm: v })}
        format={(v) => `${v} mm`}
      />

      <Field label={lang === 'bn' ? 'ছবির আকৃতি' : 'Photo shape'}>
        <Select value={d.photoShape} onChange={(e) => updateDesign({ photoShape: e.target.value as typeof d.photoShape })}>
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="rounded">Rounded</option>
          <option value="none">No photo</option>
        </Select>
      </Field>
      <Field label={lang === 'bn' ? 'ছবির অবস্থান' : 'Photo position'}>
        <Select value={d.photoPosition} onChange={(e) => updateDesign({ photoPosition: e.target.value as 'left' | 'right' })}>
          <option value="right">{lang === 'bn' ? 'ডান' : 'Right'}</option>
          <option value="left">{lang === 'bn' ? 'বাম' : 'Left'}</option>
        </Select>
      </Field>
      <Field label={lang === 'bn' ? 'হেডার লেআউট' : 'Header layout'}>
        <Select value={d.headerStyle} onChange={(e) => updateDesign({ headerStyle: e.target.value as typeof d.headerStyle })}>
          <option value="banner">Banner</option>
          <option value="split">Split</option>
          <option value="centered">Centred</option>
          <option value="minimal">Minimal</option>
          <option value="band">Colour band</option>
          <option value="dual">Dual rule</option>
        </Select>
      </Field>

      <div className="col" style={{ gap: 'var(--sp-2)' }}>
        <div className="row between">
          <span className="field-label" style={{ margin: 0 }}>
            {lang === 'bn' ? 'ফুটার' : 'Footer'}
          </span>
          <Switch checked={!!d.showFooter} onChange={(v) => updateDesign({ showFooter: v })} />
        </div>
        <div className="row between">
          <span className="field-label" style={{ margin: 0 }}>
            {lang === 'bn' ? 'পৃষ্ঠা নম্বর' : 'Page numbers'}
          </span>
          <Switch checked={!!d.showPageNumbers} onChange={(v) => updateDesign({ showPageNumbers: v })} />
        </div>
      </div>

      <Button variant="outline" icon={<RotateCcw size={14} />} onClick={resetDesign} block>
        {lang === 'bn' ? 'ডিজাইন রিসেট' : 'Reset design'}
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
