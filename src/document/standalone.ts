/**
 * Standalone document builder.
 *
 * Produces ONE self-contained HTML string (fonts embedded as data: URIs, no
 * scripts, no external references) used for:
 *   - the native Windows print job (Electron prints this in an offscreen window)
 *   - PDF generation via Chromium's printToPDF (keeps text selectable/searchable)
 *   - the browser fallback print dialog
 *
 * Because Chromium paginates this exact document, the PDF and the printed
 * sheet follow the same A4 rules as the on-screen preview.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import type { CVData } from '@/types/cv';
import type { ResolvedDesign } from '@/templates/catalog';
import { CvDocument } from './CvDocument';
import { buildDocumentCss } from './styles';
import { embeddedFontCss } from '@/assets/fonts';
import { escapeHtml } from '@/lib/sanitize';

export interface StandaloneOptions {
  data: CVData;
  design: ResolvedDesign;
  pageCount?: number;
  title?: string;
  /** Include the tiny print-toolbar (browser preview only). */
  toolbar?: boolean;
}

export function buildStandaloneHtml({ data, design, pageCount = 1, title = 'CV', toolbar = false }: StandaloneOptions): string {
  const language = data.language === 'bn' ? 'bn' : 'en';
  const markup = renderToStaticMarkup(
    React.createElement(CvDocument, { data, design, language, pageCount }),
  );
  const css = buildDocumentCss({ design, fontCss: embeddedFontCss(), mode: 'print' });

  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=210mm">
<title>${escapeHtml(title)}</title>
<style>
${css}
html,body{background:#fff;}
@media screen {
  body { padding: ${toolbar ? '56px 0 24px' : '0'}; background: #eef1f5; }
  .cv-paper { box-shadow: 0 10px 30px rgba(16,30,50,.18); margin-bottom: 18px; }
}
${toolbar ? SCREEN_TOOLBAR_CSS : ''}
</style>
</head>
<body>
${toolbar ? SCREEN_TOOLBAR : ''}
${markup}
</body>
</html>`;
}

const SCREEN_TOOLBAR = `<div class="print-toolbar" role="toolbar" aria-label="Print">
  <span class="print-hint">A4 · 210 × 297 mm</span>
  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</div>`;

const SCREEN_TOOLBAR_CSS = `
.print-toolbar{position:fixed;top:0;left:0;right:0;height:52px;display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;background:#14395e;color:#fff;font:600 13px/1 system-ui,sans-serif;z-index:10;}
.print-btn{height:34px;padding:0 16px;border-radius:6px;border:1px solid rgba(255,255,255,.4);
  background:rgba(255,255,255,.12);color:#fff;font:inherit;cursor:pointer;}
.print-btn:hover{background:rgba(255,255,255,.22);}
.print-hint{opacity:.75;font-weight:500;letter-spacing:.04em}
@media print{ .print-toolbar{display:none} }
`;

/** Estimate how many A4 pages the current content needs (used for footers). */
export function estimatePages(
  sections: Array<{ hasContent: boolean; timeline: unknown[]; paragraphs: string[] }>,
  hasPhoto: boolean,
): number {
  let weight = hasPhoto ? 0.5 : 0;
  for (const section of sections) {
    if (!section.hasContent) continue;
    weight += 0.55 + section.timeline.length * 0.55;
    weight += section.paragraphs.join(' ').length / 1400;
  }
  return Math.max(1, Math.min(6, Math.ceil(weight / 1.15)));
}
