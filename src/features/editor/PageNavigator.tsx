/**
 * Page navigator (Part 8) — real page thumbnails.
 *
 * The thumbnail is not a drawing or a screenshot mock-up: it is the **same**
 * `CvDocument` rendered at a small scale, using the same resolved tokens as the
 * A4 page beside it. If a heading is hidden or a section is dropped, the
 * thumbnail shows that immediately because it is the production document model.
 *
 * The page count is the estimator's (`buildLayoutReport`), which is what the
 * footer numbers, the PDF payload and the layout diagnostics also use — so the
 * number of thumbnails can never disagree with the rest of the studio.
 */
import React from 'react';
import { useLang } from '@/components/ui';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { embeddedFontCss } from '@/assets/fonts';
import type { CVData } from '@/types/cv';
import type { ResolvedDesign } from '@/templates/catalog';
import type { DocumentTokens } from '@/lib/composition';

/** Thumbnail width in CSS pixels — 210 mm ≈ 793.7 px, so 46 px ≈ 12 mm wide. */
const THUMB_WIDTH = 46;

export interface PageNavigatorProps {
  data: CVData;
  design: ResolvedDesign;
  language: 'bn' | 'en';
  tokens: DocumentTokens;
  pages: number;
  /** 1-based page the reader is looking at. */
  active: number;
  onSelect: (page: number) => void;
}

export const PageNavigator: React.FC<PageNavigatorProps> = ({
  data,
  design,
  language,
  tokens,
  pages,
  active,
  onSelect,
}) => {
  const lang = useLang();
  const css = buildDocumentCss({ design, fontCss: embeddedFontCss(), mode: 'screen', tokens });
  const total = Math.max(1, Math.min(20, pages));
  const scale = THUMB_WIDTH / (210 * 2.9528);

  return (
    <div
      className="page-nav"
      role="group"
      aria-label={lang === 'bn' ? 'পৃষ্ঠা' : 'Pages'}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 10px 10px' }}
    >
      {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onSelect(page)}
          aria-pressed={page === active}
          aria-label={(lang === 'bn' ? 'পৃষ্ঠা ' : 'Page ') + page}
          title={lang === 'bn' ? `পৃষ্ঠা ${page}` : `Page ${page}`}
          style={{
            position: 'relative',
            padding: 0,
            border: `1px solid ${page === active ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 2,
            background: '#fff',
            overflow: 'hidden',
            cursor: 'pointer',
            width: THUMB_WIDTH + 2,
            height: Math.round(297 * 2.9528 * scale) + 2,
            flex: '0 0 auto',
          }}
        >
          {/*
            One scaled copy of the real document per thumbnail, with the stylesheet
            inlined so no global CSS can leak into (or out of) the mini page.
            `aria-hidden` keeps screen readers on the accessible button label
            instead of reading the whole CV once per page.
          */}
          <style dangerouslySetInnerHTML={{ __html: css }} />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: 210 * 2.9528,
              pointerEvents: 'none',
            }}
          >
            <CvDocument data={data} design={design} language={language} pageCount={total} tokens={tokens} />
          </div>
          <span
            style={{
              position: 'absolute',
              right: 1,
              bottom: 1,
              fontSize: 8,
              lineHeight: 1.2,
              padding: '0 3px',
              borderRadius: 2,
              background: page === active ? 'var(--primary)' : 'rgba(255,255,255,.9)',
              color: page === active ? '#fff' : 'var(--text-muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {page}
          </span>
        </button>
      ))}
    </div>
  );
};
