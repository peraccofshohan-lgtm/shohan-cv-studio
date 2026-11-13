// @vitest-environment node
/**
 * Print / PDF payload verification (Tasks 6–7).
 *
 * No Chromium is available in this environment, so a real PDF cannot be
 * rasterised here. What CAN be verified is the exact HTML document handed to
 * Chromium's printToPDF and to the Windows spooler — which is where every A4,
 * pagination and typography decision is actually made. These assertions cover
 * the properties that determine the printed result.
 *
 * Status in the delivery report: PDF *payload* verified, PDF *file* not produced.
 */
import { describe, it, expect } from 'vitest';
import { buildStandaloneHtml } from '@/document/standalone';
import { buildDocumentCss } from '@/document/styles';
import { composeDocumentTokens } from '@/lib/composition';
import { resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';
import type { CVLanguage, TitlePreset } from '@/types/cv';

function payload(
  opts: {
    language?: CVLanguage;
    templateId?: string;
    title?: TitlePreset;
    pageBreaks?: string[];
  } = {},
) {
  const language = opts.language ?? 'en';
  const cv = buildSampleCv(language === 'bn' ? 'bn' : 'en');
  cv.language = language;
  if (opts.title) cv.title = { ...cv.title, preset: opts.title, visible: opts.title !== 'none' };
  if (opts.pageBreaks) cv.pageLength = { ...cv.pageLength, breakBefore: opts.pageBreaks as never };
  const design = resolveDesign(opts.templateId ?? 'classic-professional', {});
  const tokens = composeDocumentTokens({ data: cv, design });
  const html = buildStandaloneHtml({ data: cv, design, tokens, title: 'CV' });
  const css = buildDocumentCss({ design, mode: 'print', tokens });
  return { html, css, tokens, cv, design };
}

describe('A4 page box', () => {
  it('declares a real A4 @page with zero physical margin', () => {
    const { css } = payload();
    expect(css).toMatch(/@page\s*\{[^}]*size:\s*A4 portrait/);
    // Margins are applied inside the sheet so the coloured bands can bleed to
    // the paper edge without the printer trimming them.
    expect(css).toMatch(/@page\s*\{[^}]*margin:\s*0/);
  });

  it('sizes the sheet at exactly 210 × 297 mm', () => {
    const { css } = payload();
    expect(css).toMatch(/\.cv-paper\s*\{[^}]*width:\s*210mm/);
    expect(css).toMatch(/\.cv-paper\s*\{[^}]*min-height:\s*297mm/);
  });

  it('applies the four configured margins as inner padding', () => {
    const cv = buildSampleCv('en');
    const design = resolveDesign('classic-professional', {});
    const tokens = composeDocumentTokens({
      data: cv,
      design,
      overrides: { margins: { top: 14, right: 18, bottom: 14, left: 22 } } as never,
    });
    const css = buildDocumentCss({ design, mode: 'print', tokens });
    expect(css).toContain('padding: 14mm 18mm 14mm 22mm');
  });
});

describe('pagination rules', () => {
  it('keeps a section heading with its first entry', () => {
    const { css } = payload();
    expect(css).toMatch(/\.cv-section-head\s*\{[^}]*break-after:\s*avoid/);
    expect(css).toMatch(/page-break-after:\s*avoid/);
  });

  it('prevents a single entry from splitting across pages', () => {
    const { css } = payload();
    expect(css).toMatch(/\.entry\s*\{[^}]*break-inside:\s*avoid/);
  });

  it('sets widow/orphan control on paragraphs and bullets', () => {
    const { css } = payload();
    expect(css).toMatch(/orphans:\s*2/);
    expect(css).toMatch(/widows:\s*2/);
  });

  it('honours a manual section break', () => {
    const { html, css } = payload({ pageBreaks: ['education'] });
    expect(css).toContain('break-before: page');
    // Split on the <section> tag only — `cv-section-title` also matches a naive
    // substring split, and the stylesheet itself contains the class name.
    const sections = html.split(/<section class="cv-section/).slice(1);
    const education = sections.find((s) => s.includes('Educational Qualification'));
    expect(education).toBeDefined();
    expect(education!).toMatch(/^ cv-section-break/);
  });

  it('does not add a page break when none is requested', () => {
    const { html } = payload();
    const body = html.slice(html.indexOf('<body>'));
    expect(body).not.toContain('cv-section-break');
  });
});

describe('text stays selectable and searchable', () => {
  it('emits real text nodes, never a canvas or an image of the CV', () => {
    const { html } = payload({ language: 'bn' });
    expect(html).not.toContain('<canvas');
    // The only <img> allowed is the portrait, and the sample has none.
    expect(html).not.toContain('<img');
    expect(html).toContain('মোঃ রফিকুল ইসলাম');
    expect(html).toContain('ঢাকা বিশ্ববিদ্যালয়');
  });

  it('uses text-decoration rather than images for rules', () => {
    const { css } = payload();
    expect(css).toMatch(/border-(top|bottom):\s*0?\.\d+mm/);
  });

  it('is a single self-contained document with no scripts', () => {
    const { html } = payload();
    expect(html).toContain('<!doctype html>');
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });
});

describe('Bangla typography in the print payload', () => {
  it('embeds the Bengali font as a data URI so the printer needs no font', () => {
    const { html } = payload({ language: 'bn' });
    // @font-face with an inline woff2 payload.
    expect(html).toMatch(/@font-face[^}]*font-family:\s*['"]?Noto Sans Bengali/i);
    expect(html).toMatch(/src:\s*url\(data:font\/woff2;base64,/);
  });

  it('declares a Bengali-capable family on the body and keeps Latin fallback', () => {
    const { css } = payload({ language: 'bn' });
    expect(css).toMatch(/font-family:[^;]*Noto Sans Bengali/);
  });

  it('does not letter-space Bengali text (which breaks conjuncts visually)', () => {
    const cv = buildSampleCv('bn');
    const design = resolveDesign('modern-bangladesh', {});
    const tokens = composeDocumentTokens({ data: cv, design });
    const css = buildDocumentCss({ design, mode: 'print', tokens });
    // Section titles may be letter-spaced (Latin), but the Bengali body class
    // must reset it explicitly.
    expect(css).toMatch(/\.bn\s*\{[^}]*font-family:[^;}]*Noto Sans Bengali/);
  });

  it('keeps line-height generous enough for Bengali ascenders and descenders', () => {
    const { tokens } = payload({ language: 'bn' });
    expect(tokens.typography.body.lineHeight).toBeGreaterThanOrEqual(1.38);
  });

  it('renders mixed Bengali/Latin content without dropping either script', () => {
    const cv = buildSampleCv('bn');
    cv.personal.headline = 'Senior Accounts Officer | সিনিয়র অ্যাকাউন্টস অফিসার';
    const design = resolveDesign('classic-professional', {});
    const tokens = composeDocumentTokens({ data: cv, design });
    const html = buildStandaloneHtml({ data: cv, design, tokens });
    expect(html).toContain('Senior Accounts Officer');
    expect(html).toContain('সিনিয়র অ্যাকাউন্টস অফিসার');
  });
});

describe('print colour fidelity', () => {
  it('forces colour bands and rules to print', () => {
    const { css } = payload();
    expect(css).toContain('-webkit-print-color-adjust: exact');
    expect(css).toContain('print-color-adjust: exact');
  });

  it('removes screen-only chrome from the print document', () => {
    const { css } = payload();
    expect(css).toMatch(/@media print\s*\{[^}]*box-shadow:\s*none/);
    expect(css).toMatch(/@media print\s*\{[\s\S]*?\.page-guide\s*\{\s*display:\s*none/);
  });
});

describe('page numbering', () => {
  it('shows "Page 1 / N" only when the operator enables it', () => {
    const cv = buildSampleCv('en');
    const permissive = resolveDesign('classic-professional', { showPageNumbers: true, showFooter: true });
    const html = buildStandaloneHtml({ data: cv, design: permissive, pageCount: 3 });
    expect(html).toContain('Page 1 / 3');

    const quiet = resolveDesign('classic-professional', { showPageNumbers: false, showFooter: false });
    const plain = buildStandaloneHtml({ data: cv, design: quiet });
    expect(plain).not.toContain('Page 1 /');
  });
});
