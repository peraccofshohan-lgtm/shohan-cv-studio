// @vitest-environment node
/**
 * Print/PDF payload integrity.
 *
 * The desktop and browser print paths both receive one self-contained HTML
 * string. If that string is missing content, missing the A4 page rule, or
 * depends on a font that is not embedded, printing silently fails in the field —
 * which is exactly the class of bug this suite exists to prevent.
 */
import { describe, it, expect } from 'vitest';
import { buildStandaloneHtml } from '@/document/standalone';
import { buildDocumentCss } from '@/document/styles';
import { resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';
import { printableSections } from '@/lib/sections';

const design = resolveDesign('classic-professional', {});

describe('standalone print document', () => {
  it('is a complete HTML document with the A4 page rule', () => {
    const html = buildStandaloneHtml({ data: buildSampleCv('en'), design, pageCount: 1, title: 'CV' });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('width: 210mm');
    expect(html).toContain('min-height: 297mm');
    expect(html).toMatch(/<\/html>\s*$/);
  });

  it('embeds the font data so printing never depends on installed fonts', () => {
    const html = buildStandaloneHtml({ data: buildSampleCv('en'), design, pageCount: 1, title: 'CV' });
    expect(html).toContain('@font-face');
    expect(html).toContain('data:font/woff2;base64,');
    // Bengali faces must be present for mixed-language CVs.
    expect(html).toContain("font-family: 'Noto Sans Bengali'");
  });

  it('carries the actual CV text, not a placeholder image', () => {
    const cv = buildSampleCv('en');
    const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV' });
    expect(html).toContain(cv.personal.fullName);
    expect(html).toContain(cv.personal.email as string);
    expect(html).not.toContain('<img'); // no photo in the sample, no image of text
  });

  it('keeps Bengali text byte-exact for the print engine', () => {
    const cv = buildSampleCv('bn');
    const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV' });
    expect(html).toContain('মোঃ রফিকুল ইসলাম');
    expect(html).toContain('শিক্ষাগত যোগ্যতা');
  });

  it('prints no heading for a section that has no content', () => {
    const cv = buildSampleCv('en');
    // Remove every skill so the Skills section must vanish.
    cv.skills = [];
    const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV' });
    // The heading element must be gone (the word may still appear inside a
    // training entry's "Skills:" note, which is legitimate body text).
    expect(html).not.toMatch(/>Skills</);
    // ...while the sections that still have content remain.
    expect(printableSections(cv, { language: 'en' }).some((s) => s.id === 'education')).toBe(true);
    expect(html).toContain('Educational Qualification');
  });

  it('declares print colours explicitly instead of relying on browser defaults', () => {
    const css = buildDocumentCss({ design, mode: 'print' });
    expect(css).toContain('-webkit-print-color-adjust: exact');
    expect(css).toContain('@page');
  });

  it('hides screen-only guides from the printed output', () => {
    const css = buildDocumentCss({ design, mode: 'print', showGuides: true });
    expect(css).toMatch(/@media print[\s\S]*page-guide[\s\S]*display: none/);
  });
});
