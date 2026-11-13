/**
 * Document CSS builder.
 *
 * Produces the stylesheet used by the screen preview, the print document and
 * the PDF renderer, so all three share one layout engine. All measurements are
 * in millimetres so Chromium's A4 pagination is exact.
 */
import type { ResolvedDesign } from '@/templates/catalog';
import type { DocumentTokens } from '@/lib/composition';
import { composeDocumentTokens } from '@/lib/composition';
import { mm } from '@/lib/golden';
import { hexToRgba } from '@/lib/color';

export interface DocumentStyleOptions {
  design: ResolvedDesign;
  /** Embed @font-face rules (required for standalone print/PDF documents). */
  fontCss?: string;
  /** Screen mode centres pages on a grey desk; print mode strips chrome. */
  mode: 'screen' | 'print';
  /** Show dashed page-break guides in the editor preview. */
  showGuides?: boolean;
  /**
   * Pre-resolved composition tokens. When omitted they are derived from
   * `design`. Passing them in is how the editor and the exporters guarantee
   * they render the identical document.
   */
  tokens?: DocumentTokens;
}

export function buildDocumentCss({
  design,
  fontCss = '',
  mode,
  showGuides = false,
  tokens,
}: DocumentStyleOptions): string {
  const p = design.palette;
  const t = tokens;
  const margin = t ? t.margins.top : design.marginMm;
  const marginRight = t ? t.margins.right : design.marginMm;
  const marginBottom = t ? t.margins.bottom : design.marginMm;
  const marginLeft = t ? t.margins.left : design.marginMm;
  const base = t ? t.typography.body.sizePt : 9.9 * design.bodyScale; // pt — comfortable for A4 body copy
  const lineHeight = t ? t.typography.body.lineHeight : design.lineHeight;
  const gap = t ? t.spacing.sectionGap : design.sectionSpacing;
  const headingSize = t ? t.typography.heading.sizePt : 10.2 * design.headingScale;
  const nameSize = t ? t.typography.name.sizePt : 23 * design.headingScale;

  const bodyFont = t ? t.typography.body.family : design.fontPair.body;
  const headFont = t ? t.typography.heading.family : design.fontPair.display;
  const title = t?.title;
  const sp = (key: keyof DocumentTokens['spacing'], fallback: number): number =>
    t ? (t.spacing[key] as number) * fallback : fallback;
  const bodyAlign = t?.bodyAlign ?? 'justify';

  return `
${fontCss}

.cv-page {
  --ink: ${p.text};
  --ink-muted: ${p.muted};
  --accent: ${p.primary};
  --accent-2: ${p.accent};
  --tint: ${p.tint};
  --on-accent: ${p.onPrimary};
  --rail: ${p.sidebar};
  --margin: ${margin}mm;
  --lh: ${lineHeight};
  --gap: ${(5.2 * gap).toFixed(2)}mm;
  --rule: ${hexToRgba(p.text, 0.14)};
  --chip-border: ${hexToRgba(p.primary, 0.18)};
  --entry-gap: ${(3.1 * gap).toFixed(2)}mm;
  font-family: ${bodyFont};
  font-size: ${base.toFixed(2)}pt;
  line-height: var(--lh);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  /* Keep header bands, rules and chips in the printed/PDF output. */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  font-variant-ligatures: common-ligatures;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: none;
}

.cv-page * { box-sizing: border-box; }
.cv-page p { margin: 0; }
.cv-page ul { margin: 0; padding: 0; list-style: none; }
.cv-page a { color: inherit; text-decoration: none; }
.cv-page strong { font-weight: 600; }
.cv-page .bn { font-family: 'Noto Sans Bengali', 'Noto Serif Bengali', ${bodyFont}; line-height: 1.72; }

/* ---------------------------------------------------------- page setup */
@page {
  size: A4 portrait;
  margin: 0;
}

${mode === 'screen'
    ? `
.cv-paper {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  position: relative;
  margin: 0 auto;
  box-shadow: var(--paper-shadow, 0 12px 34px rgba(16,30,50,.16));
  overflow: hidden;
}
`
    : `
.cv-paper {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff;
  position: relative;
  overflow: hidden;
}
html, body { margin: 0; padding: 0; background: #ffffff; }
.page-break { break-after: page; page-break-after: always; }
`}

.cv-body {
  padding: ${margin}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  min-height: 297mm;
}
/* A4 page box text area, used by the diagnostics and by DOCX parity. */
.cv-page { --text-width: ${(210 - marginLeft - marginRight).toFixed(1)}mm; }

${showGuides
    ? `
.page-guide {
  position: absolute;
  left: 0; right: 0;
  top: 297mm;
  border-top: 1px dashed rgba(37, 99, 235, 0.45);
  pointer-events: none;
  z-index: 3;
}
`
    : ''}

/* --------------------------------------------------------------- header */
.cv-header { display: flex; gap: 6mm; align-items: flex-start; }
.cv-header .identity { flex: 1 1 auto; min-width: 0; }
.cv-name {
  font-family: ${headFont};
  font-size: ${nameSize.toFixed(2)}pt;
  line-height: 1.12;
  font-weight: 700;
  letter-spacing: -0.012em;
  margin: 0;
  color: var(--accent);
}
/* ------------------------------------------------------------ title block */
/*
 * The title is rendered as its own element so that "No title" removes the
 * element entirely: no empty band, no stray margin, no reserved space.
 */
.cv-title {
  display: block;
  font-family: ${title?.fontFamily ?? headFont};
  font-size: ${(title?.sizePt ?? 10).toFixed(2)}pt;
  font-weight: ${title?.weight ?? 600};
  font-style: ${title?.italic ? 'italic' : 'normal'};
  text-decoration: ${title?.underline ? 'underline' : 'none'};
  color: ${title?.color ?? 'var(--ink-muted)'};
  letter-spacing: ${(title?.letterSpacing ?? 0.14).toFixed(3)}em;
  text-align: ${title?.align ?? 'left'};
  text-transform: none;
  line-height: 1.25;
  margin: ${(title?.spaceBeforeMm ?? 1.2).toFixed(2)}mm 0 ${(title?.spaceAfterMm ?? 2.4).toFixed(2)}mm;
  ${title?.background && title.background !== 'none' ? `padding: ${(title.backgroundPaddingMm || 1.6).toFixed(2)}mm 3mm; background: ${title.background === 'primary' ? 'var(--accent)' : 'var(--tint)'}; color: ${title.background === 'primary' ? 'var(--on-accent)' : (title.color ?? 'var(--ink-muted)')};` : ''}
}
${title?.accentLine ? `.cv-title::after {
  content: '';
  display: block;
  width: 26mm;
  height: 0.5mm;
  background: var(--accent-2);
  margin-top: 1.4mm;
  ${title.align === 'center' ? 'margin-left: auto; margin-right: auto;' : title.align === 'right' ? 'margin-left: auto;' : ''}
}` : ''}
.cv-title[data-border='thin'] { border-bottom: 0.25mm solid var(--accent); padding-bottom: 1.2mm; }
.cv-title[data-border='thick'] { border-bottom: 0.7mm solid var(--accent); padding-bottom: 1.2mm; }
.cv-title[data-border='double'] { border-bottom: 0.8mm double var(--accent); padding-bottom: 1.2mm; }
.cv-title[data-border='accent'] { border-left: 1mm solid var(--accent-2); padding-left: 2.6mm; }
.cv-title-wrap[data-position='below-contact'] { order: 3; }
.cv-title-wrap { display: block; }

.cv-headline {
  font-size: ${(base + 0.7).toFixed(2)}pt;
  color: var(--ink-muted);
  margin-top: 1.4mm;
  letter-spacing: 0.01em;
  font-weight: 500;
}
.cv-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2mm 4.5mm;
  margin-top: 2.6mm;
  font-size: ${(base - 0.6).toFixed(2)}pt;
  color: var(--ink-muted);
}
.cv-contact > span { display: inline-flex; align-items: center; gap: 1.4mm; }
.cv-contact .mark { color: var(--accent-2); font-weight: 700; }
.cv-photo {
  flex: 0 0 auto;
  width: ${design.photoPosition === 'left' ? 'auto' : 'auto'};
  overflow: hidden;
  background: var(--tint);
}
.cv-photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
.cv-photo[data-shape='circle'] { border-radius: 50%; }
.cv-photo[data-shape='square'] { border-radius: 0; }
.cv-photo[data-shape='rounded'] { border-radius: 3mm; }

/* header variants */
.hdr-banner { align-items: flex-end; padding-bottom: 3.4mm; border-bottom: 0.5mm solid var(--accent); }
.hdr-banner .cv-name { font-size: ${(24 * design.headingScale).toFixed(2)}pt; }
.hdr-split { align-items: center; }
.hdr-centered { flex-direction: column; align-items: center; text-align: center; }
.hdr-centered .cv-contact { justify-content: center; }
.hdr-centered .cv-name { text-align: center; }
.hdr-centered .cv-photo { order: -1; }
.hdr-minimal { align-items: flex-start; padding-bottom: 2.4mm; }
.hdr-minimal .cv-name { font-size: ${(21 * design.headingScale).toFixed(2)}pt; letter-spacing: -0.005em; }
.hdr-band { background: var(--accent); color: var(--on-accent); padding: 6.5mm 6.5mm; margin: calc(var(--margin) * -1) calc(var(--margin) * -1) 0; align-items: center; }
.hdr-band .cv-name { color: var(--on-accent); }
.hdr-band .cv-headline { color: rgba(255, 255, 255, 0.84); }
.hdr-band .cv-contact { color: rgba(255, 255, 255, 0.9); }
.hdr-band .cv-contact .mark { color: rgba(255, 255, 255, 0.66); }
.hdr-band .cv-photo { background: rgba(255, 255, 255, 0.14); }
.hdr-dual { align-items: center; border-top: 0.35mm solid var(--accent-2); border-bottom: 0.35mm solid var(--accent-2); padding: 4.6mm 0; }
.hdr-dual .cv-name { font-size: ${(22 * design.headingScale).toFixed(2)}pt; }

.cv-band {
  height: ${(design.band).toFixed(2)}mm;
  background: ${design.headerTint ? 'var(--accent)' : 'var(--accent)'};
  width: 100%;
}

/* -------------------------------------------------------------- sections */
.cv-sections { display: flex; flex-direction: column; gap: var(--gap); flex: 1 1 auto; }
/* Per-section overrides (Part 5) arrive as inline custom properties on the
   <section> element; these fallbacks are the document defaults, so a section
   without an override lays out exactly as before. Every declaration here is
   additive or a colour/scale swap — none of them can move text under other
   text, and the gap multiplier is clamped to >= 1 in the model. */
.cv-section {
  break-inside: auto;
  --sec-heading: var(--accent);
  --sec-rule: var(--accent);
  --sec-heading-scale: 1;
  --sec-heading-align: flex-start;
  --sec-gap-mul: 1;
}
.cv-section + .cv-section { margin-top: calc(var(--gap) * (var(--sec-gap-mul) - 1)); }
.cv-section-head {
  display: flex;
  align-items: center;
  justify-content: var(--sec-heading-align);
  gap: 3mm;
  margin-bottom: 2.4mm;
  break-after: avoid;
  page-break-after: avoid;
}
.cv-section-title {
  font-family: ${headFont};
  font-size: calc(${headingSize.toFixed(2)}pt * var(--sec-heading-scale));
  font-weight: 700;
  letter-spacing: ${design.upperHeadings ? '0.11em' : '0.005em'};
  text-transform: ${design.upperHeadings ? 'uppercase' : 'none'};
  color: var(--sec-heading);
  margin: 0;
  white-space: nowrap;
}
.cv-section-head .rule { flex: 1 1 auto; height: 0.25mm; background: var(--sec-rule); opacity: 0.55; }
/* A centred or right-aligned heading has no room for the leader rule. */
.cv-section[data-head-align] .cv-section-head .rule { display: none; }

/* heading variants */
.hd-rule .rule { height: 0.25mm; }
.hd-bar .cv-section-title::before {
  content: '';
  display: inline-block;
  width: 1.1mm;
  height: 3.6mm;
  background: var(--accent-2);
  margin-right: 2.4mm;
  vertical-align: -0.6mm;
}
.hd-caps .rule { opacity: 0.35; }
.hd-caps .cv-section-title { letter-spacing: 0.16em; font-size: ${(headingSize - 0.4).toFixed(2)}pt; }
.hd-underline .rule { height: 0.55mm; opacity: 1; background: var(--accent-2); }
.hd-boxed .cv-section-head { border: 0.25mm solid var(--accent); padding: 1.2mm 2.6mm; background: var(--tint); }
.hd-boxed .rule { display: none; }
.hd-side-mark { padding-left: 4.4mm; position: relative; border-left: 0.9mm solid var(--accent-2); }
.hd-side-mark .rule { display: none; }
.hd-side-mark .cv-section-title { white-space: normal; }

/* --------------------------------------------------------------- entries */
.entry { break-inside: avoid; page-break-inside: avoid; margin-bottom: var(--entry-gap); }
.entry:last-child { margin-bottom: 0; }
.entry-top { display: flex; gap: 4mm; align-items: baseline; justify-content: space-between; }
.entry-title { font-weight: 650; color: var(--ink); margin: 0; font-size: ${(base + 0.4).toFixed(2)}pt; }
.entry-period { font-size: ${(base - 0.8).toFixed(2)}pt; color: var(--ink-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.entry-sub { color: var(--ink-muted); font-size: ${(base - 0.3).toFixed(2)}pt; margin-top: 0.5mm; }
.entry-meta { color: var(--accent); font-size: ${(base - 1.2).toFixed(2)}pt; margin-top: 0.6mm; letter-spacing: 0.01em; }
.entry-bullets { margin-top: 1.4mm; display: flex; flex-direction: column; gap: 0.7mm; }
.entry-bullets li { position: relative; padding-left: 4mm; font-size: ${(base - 0.3).toFixed(2)}pt; }
.entry-bullets li::before {
  content: '';
  position: absolute;
  left: 0.6mm;
  top: 0.62em;
  width: 1.2mm;
  height: 1.2mm;
  border-radius: 50%;
  background: var(--accent-2);
}
.entry-body { margin-top: 1.2mm; white-space: pre-line; color: var(--ink); font-size: ${(base - 0.3).toFixed(2)}pt; }
.entry-rule { border-top: 0.18mm solid var(--rule); margin-top: 2.6mm; padding-top: 2.6mm; }
.entry-split .entry-period { text-align: right; }
.entry-inline .entry-top { display: block; }
.entry-inline .entry-period { display: inline; margin-left: 2mm; }
.entry-stacked .entry-top { display: block; }
.entry-stacked .entry-period { margin-top: 0.4mm; display: block; }

/* ---------------------------------------------------------- simple blocks */
.paragraph { margin: 0; text-align: ${bodyAlign}; hyphens: none; ${t && t.paragraphIndentMm > 0 ? `text-indent: ${t.paragraphIndentMm}mm;` : ''} }
${bodyAlign === 'justify' ? '.entry-bullets li, .labelled-row dd { text-align: left; }' : ''}
.chips { display: flex; flex-wrap: wrap; gap: 1.4mm 1.8mm; }
.chip {
  padding: 0.7mm 2.2mm;
  border-radius: 1mm;
  background: var(--tint);
  color: var(--ink);
  font-size: ${(base - 0.9).toFixed(2)}pt;
  border: 0.18mm solid var(--chip-border);
}
.labelled { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9mm 5mm; }
.labelled-1 { grid-template-columns: 1fr; }
.labelled-row { display: flex; gap: 2mm; font-size: ${(base - 0.4).toFixed(2)}pt; }
.labelled-row dt { color: var(--ink-muted); flex: 0 0 34mm; }
.labelled-row dd { margin: 0; flex: 1 1 auto; color: var(--ink); }
/* Per-section marker styles: the marker is still drawn by CSS, so the text run
   keeps its exact Bengali metrics. */
.cv-section[data-bullets='dash'] .entry-bullets li::before,
.cv-section[data-bullets='dash'] .simple-list li::before {
  width: 2.4mm;
  height: 0.35mm;
  border-radius: 0;
  top: 0.58em;
}
.cv-section[data-bullets='square'] .entry-bullets li::before,
.cv-section[data-bullets='square'] .simple-list li::before {
  border-radius: 0;
  width: 1.1mm;
  height: 1.1mm;
}
.cv-section[data-bullets='none'] .entry-bullets li::before,
.cv-section[data-bullets='none'] .simple-list li::before {
  display: none;
}
.cv-section[data-bullets='none'] .entry-bullets li,
.cv-section[data-bullets='none'] .simple-list li {
  padding-left: 0;
}
.simple-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6mm 6mm; }
.simple-list li { position: relative; padding-left: 3.6mm; font-size: ${(base - 0.4).toFixed(2)}pt; }
.simple-list li::before { content: ''; position: absolute; left: 0.4mm; top: 0.6em; width: 1.1mm; height: 1.1mm; background: var(--accent-2); }

/* ------------------------------------------------------------- signature */
.signature-block { display: flex; gap: 8mm; justify-content: space-between; align-items: flex-end; margin-top: 2mm; break-inside: avoid; }
.signature-box { text-align: ${'var(--sign-align, right)'}; }
.signature-img { max-width: 46mm; max-height: 18mm; object-fit: contain; display: block; }
.signature-line { border-top: 0.2mm solid var(--ink); padding-top: 1.2mm; font-size: ${(base - 1).toFixed(2)}pt; color: var(--ink-muted); margin-top: 1.2mm; }
.declaration-meta { display: flex; justify-content: space-between; gap: 6mm; margin-top: 3mm; font-size: ${(base - 1).toFixed(2)}pt; color: var(--ink-muted); }

/* ------------------------------------------------------------------ rail */
.rail { background: var(--rail); color: var(--on-accent); padding: 6mm 5mm; }
.rail .rail-title { font-size: ${(base - 1.4).toFixed(2)}pt; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.72; margin-bottom: 1.6mm; font-weight: 700; }
.rail .rail-block { margin-bottom: 4.4mm; }
.rail .rail-line { font-size: ${(base - 0.7).toFixed(2)}pt; line-height: 1.45; margin-bottom: 0.7mm; word-break: break-word; }
.rail .cv-section-title { color: var(--on-accent); font-size: ${(headingSize - 1).toFixed(2)}pt; }
.rail .cv-section-head .rule { background: var(--on-accent); opacity: 0.32; }
.rail .chip { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.22); color: var(--on-accent); }
.rail .labelled-row dt { color: rgba(255, 255, 255, 0.66); }
.rail .labelled-row dd { color: var(--on-accent); }
.rail .entry-bullets li::before { background: var(--on-accent); opacity: 0.7; }

/* body layouts */
.body-single { display: flex; flex-direction: column; gap: var(--gap); }
.body-two-col .cv-sections { column-count: 2; column-gap: 7mm; }
.body-two-col .cv-section { break-inside: avoid; display: inline-block; width: 100%; margin-bottom: var(--gap); }
.body-sidebar-left, .body-sidebar-right { display: flex; gap: 0; align-items: stretch; }
.body-sidebar-left .cv-sections-wrap, .body-sidebar-right .cv-sections-wrap { flex: 1 1 auto; min-width: 0; padding: var(--margin) 0 var(--margin) var(--margin); display: flex; flex-direction: column; gap: var(--gap); }
.body-sidebar-left .rail, .body-sidebar-right .rail { flex: 0 0 62mm; }
.body-sidebar-left .cv-header, .body-sidebar-right .cv-header { padding: 0; }

/* footer */
.cv-footer {
  display: flex;
  justify-content: space-between;
  font-size: ${(base - 1.6).toFixed(2)}pt;
  color: var(--ink-muted);
  border-top: 0.18mm solid var(--rule);
  padding-top: 1.6mm;
  margin-top: auto;
  border-color: var(--rule);
}

/* section-level page breaks requested by the operator */
.cv-section-break { break-before: page; page-break-before: always; }
.cv-section[data-keep='true'] { break-inside: avoid; }
.cv-section-title { break-after: avoid; page-break-after: avoid; }
.entry-title, .entry-sub { break-after: avoid; page-break-after: avoid; }
.cv-section-head + * { break-before: avoid; page-break-before: avoid; }
.entry-bullets li { break-inside: avoid; page-break-inside: avoid; orphans: 2; widows: 2; }
p.paragraph, .entry-body { orphans: 2; widows: 2; }

/* keep rules attached to their content */
.cv-section-head { break-after: avoid; page-break-after: avoid; }

@media print {
  .cv-paper { box-shadow: none !important; margin: 0 !important; }
  .page-guide { display: none !important; }
  body { margin: 0 !important; }
}
`;
}

export const PAPER_PX_WIDTH = mm(210);
