/**
 * Template library — browse all 20 designs, preview at full size and apply.
 */
import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui';
import { Button, Modal, useT } from '@/components/ui';
import { useUI } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';
import { TEMPLATES, resolveDesign, templateById, templateCategories } from '@/templates/catalog';
import { TemplateCard } from './TemplateCard';
import { buildSampleCv } from './sampleData';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { embeddedFontCss } from '@/assets/fonts';

export const TemplatesPage: React.FC = () => {
  const { language, navigate } = useUI();
  const tr = useT();
  const [sample] = useState(() => buildSampleCv(language === 'bn' ? 'bn' : 'en'));
  const [category, setCategory] = useState('all');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const current = useWorkspace((s) => s.current);
  const setTemplate = useWorkspace((s) => s.setTemplate);

  const previewDesign = useMemo(() => (previewId ? resolveDesign(previewId, {}) : null), [previewId]);
  const previewCss = useMemo(
    () => (previewDesign ? buildDocumentCss({ design: previewDesign, fontCss: embeddedFontCss(), mode: 'screen' }) : ''),
    [previewDesign],
  );

  const categories = ['all', ...templateCategories()];
  const list = category === 'all' ? TEMPLATES : TEMPLATES.filter((t) => t.category === category);

  const useTemplate = (id: string) => {
    if (current) {
      setTemplate(id);
      navigate({ name: 'editor' });
    } else {
      void useWorkspace.getState().createNewProject({ title: 'Untitled CV' }).then(() => {
        useWorkspace.getState().setTemplate(id);
        navigate({ name: 'wizard', step: 0 });
      });
    }
  };

  return (
    <div className="page wide">
      <div className="section-head">
        <div>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 650, letterSpacing: '-0.015em' }}>{tr('tpl.title')}</h2>
          <p style={{ maxWidth: '70ch' }}>{tr('tpl.subtitle')}</p>
        </div>
        <Badge tone="primary">{TEMPLATES.length} designs</Badge>
      </div>

      <div className="card card-pad">
        <div className="row wrap" style={{ gap: 6 }}>
          {categories.map((c) => (
            <button
              key={c}
              className={`badge ${category === c ? 'badge-primary' : ''}`}
              style={{ cursor: 'pointer', padding: '7px 12px', fontSize: 'var(--fs-sm)' }}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
            >
              {c === 'all' ? (language === 'bn' ? 'সব' : 'All') : c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 'var(--sp-4)' }}>
        {list.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            sample={current?.data ?? sample}
            language={language}
            selected={current?.templateId === template.id}
            onSelect={() => useTemplate(template.id)}
            onPreview={() => setPreviewId(template.id)}
          />
        ))}
      </div>

      <Modal
        open={!!previewId}
        onClose={() => setPreviewId(null)}
        title={previewId ? (language === 'bn' ? templateById(previewId).nameBn : templateById(previewId).name) : ''}
        description={previewId ? templateById(previewId).description : ''}
        size="lg"
        footer={
          <>
            <Button onClick={() => setPreviewId(null)}>{tr('common.close')}</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (previewId) useTemplate(previewId);
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
            <div style={{ width: 560, margin: '0 auto' }}>
              <CvDocument data={current?.data ?? sample} design={previewDesign} language={language} />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
