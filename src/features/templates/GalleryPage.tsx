/**
 * Post-wizard template gallery: choose the design for the finished CV.
 * Selection never touches content — only the template id and design tokens.
 */
import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, LayoutTemplate, Palette } from 'lucide-react';
import { Badge, Button, Field, Modal, Select, useLang, useT } from '@/components/ui';
import { useUI } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';
import { PALETTES, TEMPLATES, templateCategories, resolveDesign, templateById } from '@/templates/catalog';
import { TemplateCard } from './TemplateCard';
import { buildSampleCv } from './sampleData';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { embeddedFontCss } from '@/assets/fonts';
import { estimatePageCount, printableSections } from '@/lib/sections';

export const GalleryPage: React.FC = () => {
  const current = useWorkspace((s) => s.current);
  const setTemplate = useWorkspace((s) => s.setTemplate);
  const updateDesign = useWorkspace((s) => s.updateDesign);
  const { navigate, language } = useUI();
  const tr = useT();
  const lang = language;

  const [category, setCategory] = useState<string>('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [sample] = useState(() => buildSampleCv(lang === 'bn' ? 'bn' : 'en'));

  const previewDesign = useMemo(
    () => (previewId ? resolveDesign(previewId, {}) : null),
    [previewId],
  );
  const previewCss = useMemo(
    () => (previewDesign ? buildDocumentCss({ design: previewDesign, fontCss: embeddedFontCss(), mode: 'screen' }) : ''),
    [previewDesign],
  );

  const data = current?.data ?? sample;
  const categories = ['all', ...templateCategories()];

  const list = category === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  const pages = useMemo(() => {
    if (!current) return 1;
    return estimatePageCount(printableSections(current.data, { language: lang }), !!current.data.photo.dataUrl);
  }, [current, lang]);

  return (
    <div className="page wide" style={{ padding: 'var(--sp-5)' }}>
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 650, letterSpacing: '-0.015em' }}>{tr('tpl.title')}</h2>
          <p style={{ maxWidth: '70ch' }}>{tr('tpl.subtitle')}</p>
        </div>
        <div className="row" style={{ gap: 'var(--sp-2)' }}>
          <Button icon={<ArrowLeft size={15} />} onClick={() => navigate({ name: 'wizard', step: 18 })}>
            {tr('common.back')}
          </Button>
          <Button
            variant="primary"
            icon={<Palette size={15} />}
            onClick={() => {
              void useWorkspace.getState().saveNow();
              navigate({ name: 'editor' });
            }}
          >
            {tr('wiz.openStudio')}
            <ArrowRight size={15} />
          </Button>
        </div>
      </div>

      <div className="card card-pad">
        <div className="row wrap between" style={{ gap: 'var(--sp-3)' }}>
          <div className="row wrap" style={{ gap: 6 }}>
            {categories.map((c) => (
              <button
                key={c}
                className={`badge ${category === c ? 'badge-primary' : ''}`}
                style={{ cursor: 'pointer', padding: '7px 12px', fontSize: 'var(--fs-sm)' }}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
              >
                {c === 'all' ? (lang === 'bn' ? `সব (${TEMPLATES.length})` : `All (${TEMPLATES.length})`) : c}
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 'var(--sp-3)' }}>
            {current ? (
              <Badge tone="info" icon={<LayoutTemplate size={11} />}>
                {current.data.personal.fullName || current.title} · {pages} {tr('editor.pages')}
              </Badge>
            ) : null}
            <Field label="">
              <Select
                value={current?.design.paletteId ?? 'navy'}
                onChange={(e) => updateDesign({ paletteId: e.target.value })}
                style={{ width: 190 }}
                aria-label="Colour palette"
              >
                {PALETTES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === 'bn' ? p.nameBn : p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--sp-4)',
        }}
      >
        {list.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            sample={data}
            language={lang}
            selected={current?.templateId === template.id}
            onSelect={() => {
              setTemplate(template.id);
              useWorkspace.getState().pushToast({
                kind: 'success',
                title: lang === 'bn' ? 'টেমপ্লেট নির্বাচিত' : 'Template applied',
                detail: template.name,
              });
            }}
            onPreview={() => setPreviewId(template.id)}
          />
        ))}
      </div>

      <Modal
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        title={previewId ? (lang === 'bn' ? templateById(previewId).nameBn : templateById(previewId).name) : ''}
        description={previewId ? templateById(previewId).description : ''}
        size="lg"
        footer={
          <>
            <Button onClick={() => setPreviewId(null)}>{tr('common.close')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (previewId) setTemplate(previewId);
                setPreviewId(null);
              }}
            >
              {tr('tpl.select')}
            </Button>
          </>
        }
      >
        {previewDesign ? (
          <div style={{ background: 'var(--bg-sunken)', padding: 'var(--sp-4)', borderRadius: 'var(--radius-sm)', overflow: 'auto' }}>
            <style>{previewCss}</style>
            <div style={{ width: 560, margin: '0 auto', transform: 'scale(1)', transformOrigin: 'top center' }}>
              <CvDocument data={data} design={previewDesign} language={lang} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
