/**
 * Template preview tile.
 *
 * Renders a REAL scaled-down CV using the actual document engine, so what the
 * operator sees in the gallery is exactly the layout they will get. A skeleton
 * fallback is used only when no sample data is available.
 */
import React, { useMemo } from 'react';
import { Check, Eye, ImageOff, ScanText } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import type { CVData } from '@/types/cv';
import type { TemplateDefinition } from '@/templates/catalog';
import { resolveDesign } from '@/templates/catalog';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { embeddedFontCss } from '@/assets/fonts';

export const TemplateCard: React.FC<{
  template: TemplateDefinition;
  sample: CVData;
  selected: boolean;
  language: 'bn' | 'en';
  onSelect: () => void;
  onPreview: () => void;
  compact?: boolean;
}> = ({ template, sample, selected, language, onSelect, onPreview, compact }) => {
  const design = useMemo(() => resolveDesign(template.id, {}), [template.id]);
  const css = useMemo(() => buildDocumentCss({ design, fontCss: embeddedFontCss(), mode: 'screen' }), [design]);

  // Scale the real A4 page down into the tile.
  const tileWidth = compact ? 200 : 268;
  const pageWidthPx = 793.7;
  const scale = tileWidth / pageWidthPx;
  const pageHeightPx = 1122.5;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderColor: selected ? 'var(--primary)' : 'var(--border)',
        boxShadow: selected ? '0 0 0 2px var(--primary-soft)' : 'var(--shadow-xs)',
        transition: 'border-color 160ms var(--ease), box-shadow 160ms var(--ease)',
      }}
    >
      <style>{css}</style>
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-sunken)',
          padding: 'var(--sp-3)',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: tileWidth,
            height: Math.round(pageHeightPx * scale),
            overflow: 'hidden',
            background: '#fff',
            boxShadow: '0 4px 14px rgba(16,30,50,.14)',
            borderRadius: 2,
          }}
        >
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: pageWidthPx }}>
            <CvDocument data={sample} design={design} language={language} />
          </div>
        </div>
        {selected ? (
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'var(--primary)',
              color: 'var(--primary-contrast)',
              borderRadius: 'var(--radius-pill)',
              width: 24,
              height: 24,
              display: 'grid',
              placeItems: 'center',
            }}
            aria-label="Selected"
          >
            <Check size={14} />
          </span>
        ) : null}
      </div>

      <div className="card-body" style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', flex: 1 }}>
        <div className="row between" style={{ gap: 'var(--sp-2)' }}>
          <strong style={{ fontSize: 'var(--fs-base)', letterSpacing: '-0.01em' }}>
            {language === 'bn' ? template.nameBn : template.name}
          </strong>
        </div>
        <div className="small faint">{template.category}</div>
        {!compact ? (
          <p className="small muted" style={{ margin: 0, lineHeight: 1.55, minHeight: 54 }}>
            {language === 'bn' ? template.descriptionBn : template.description}
          </p>
        ) : null}
        <div className="row wrap" style={{ gap: 4 }}>
          {template.atsFriendly ? (
            <Badge tone="success" icon={<ScanText size={10} />}>
              ATS
            </Badge>
          ) : null}
          {template.photoSupported ? (
            <Badge tone="info">{language === 'bn' ? 'ছবি' : 'Photo'}</Badge>
          ) : (
            <Badge icon={<ImageOff size={10} />}>{language === 'bn' ? 'ছবি নেই' : 'No photo'}</Badge>
          )}
          <Badge>{language === 'bn' ? 'A4' : 'A4'}</Badge>
        </div>
        <div className="row" style={{ gap: 'var(--sp-2)', marginTop: 'auto', paddingTop: 'var(--sp-2)' }}>
          <Button size="sm" variant={selected ? 'secondary' : 'primary'} onClick={onSelect} style={{ flex: 1 }}>
            {selected ? (language === 'bn' ? 'নির্বাচিত' : 'Selected') : language === 'bn' ? 'বেছে নিন' : 'Use'}
          </Button>
          <Button size="sm" variant="outline" icon={<Eye size={13} />} onClick={onPreview} aria-label="Full preview">
            {language === 'bn' ? 'দেখুন' : 'Preview'}
          </Button>
        </div>
      </div>
    </div>
  );
};
