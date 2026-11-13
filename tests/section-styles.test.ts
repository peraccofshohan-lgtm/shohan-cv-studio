// @vitest-environment node
/**
 * Per-section design overrides (Part 5).
 *
 * The promise is narrow and testable: a section override changes *only* that
 * section, survives sanitising, reaches all three renderers (screen CSS,
 * standalone print/PDF payload, DOCX), and can be reset to exactly the
 * template's own look.
 */
import { describe, it, expect } from 'vitest';
import {
  BULLET_STYLES,
  HEADING_SCALE_MAX,
  HEADING_SCALE_MIN,
  SECTION_GAP_MAX,
  SECTION_GAP_MIN,
  bulletGlyph,
  describeOverride,
  hasOverride,
  normalizeSectionOverride,
  overrideFor,
  sectionCssVars,
  sectionsStartingNewPage,
  setOverride,
} from '@/lib/sectionStyles';
import { buildStandaloneHtml } from '@/document/standalone';
import { buildDocumentCss } from '@/document/styles';
import { buildDocx } from '@/document/docxExport';
import { resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';
import { composeDocumentTokens } from '@/lib/composition';

const design = resolveDesign('classic-professional', {});

describe('override model', () => {
  it('normalises colours and rejects junk', () => {
    expect(normalizeSectionOverride({ headingColor: 'ABC' })?.headingColor).toBe('#aabbcc');
    expect(normalizeSectionOverride({ headingColor: '#112233' })?.headingColor).toBe('#112233');
    expect(normalizeSectionOverride({ headingColor: 'rebeccapurple' })).toBeNull();
    expect(normalizeSectionOverride({ headingColor: 'javascript:alert(1)' })).toBeNull();
  });

  it('clamps the heading scale but never lets a section gap shrink below the document rhythm', () => {
    expect(normalizeSectionOverride({ headingScale: 9 })?.headingScale).toBe(HEADING_SCALE_MAX);
    expect(normalizeSectionOverride({ headingScale: 0.1 })?.headingScale).toBe(HEADING_SCALE_MIN);
    // Squeezing one section tighter than the document gap is how text starts
    // to collide, so the floor is 1 and only *extra* space is allowed.
    expect(normalizeSectionOverride({ paragraphSpacing: 0.3 })?.paragraphSpacing).toBe(SECTION_GAP_MIN);
    expect(SECTION_GAP_MIN).toBe(1);
    expect(normalizeSectionOverride({ paragraphSpacing: 99 })?.paragraphSpacing).toBe(SECTION_GAP_MAX);
    expect(normalizeSectionOverride({ paragraphSpacing: NaN })).toBeNull();
  });

  it('drops unknown bullet styles and keeps the four documented ones', () => {
    expect(BULLET_STYLES.map((b) => b.id)).toEqual(['dot', 'dash', 'square', 'none']);
    expect(normalizeSectionOverride({ bulletStyle: 'dot' })?.bulletStyle).toBe('dot');
    expect(normalizeSectionOverride({ bulletStyle: 'emoji' as never })).toBeNull();
  });

  it('returns null for an empty or missing override', () => {
    expect(normalizeSectionOverride(null)).toBeNull();
    expect(normalizeSectionOverride({})).toBeNull();
    expect(normalizeSectionOverride({ pageBreakBefore: false })).toBeNull();
  });

  it('setOverride stores, updates and then clears the entry', () => {
    let styles = setOverride({}, 'skills', { headingColor: '#123456' });
    expect(hasOverride(styles, 'skills')).toBe(true);
    styles = setOverride(styles, 'skills', { ...styles.skills, headingScale: 1.1 });
    expect(styles.skills).toEqual({ headingColor: '#123456', headingScale: 1.1 });
    styles = setOverride(styles, 'skills', null);
    expect(styles.skills).toBeUndefined();
    expect(hasOverride(styles, 'skills')).toBe(false);
  });

  it('emits only the CSS variables that are actually set', () => {
    expect(sectionCssVars(null)).toEqual({});
    expect(sectionCssVars(normalizeSectionOverride({ headingAlign: 'center' }))).toEqual({
      '--sec-heading-align': 'center',
    });
  });

  it('unions page-length breaks with per-section breaks, without duplicates', () => {
    const set = sectionsStartingNewPage(['education'], { skills: { pageBreakBefore: true }, education: { pageBreakBefore: true } });
    expect([...set].sort()).toEqual(['education', 'skills']);
    expect(set.size).toBe(2);
  });

  it('describes the override in both languages', () => {
    const o = normalizeSectionOverride({ headingColor: '#000000', bulletStyle: 'dash' });
    expect(describeOverride(o, 'en')).toContain('Heading colour');
    expect(describeOverride(o, 'bn')).toContain('শিরোনামের রঙ');
    expect(describeOverride(null, 'en')).toBe('Document default');
  });

  it('gives every bullet style a printable marker, with none for "none"', () => {
    expect(bulletGlyph('none')).toBe('');
    expect(bulletGlyph('dot')).not.toBe('');
    expect(bulletGlyph('dash')).not.toBe(bulletGlyph('dot'));
  });
});

describe('overrides reach every renderer', () => {
  const styles = {
    skills: { headingColor: '#a83232', headingAlign: 'center' as const, headingScale: 1.2, bulletStyle: 'dash' as const },
    education: { pageBreakBefore: true },
  };

  it('marks up only the customised sections in the print payload', () => {
    const cv = { ...buildSampleCv('en'), sectionStyles: styles };
    const html = buildStandaloneHtml({ data: cv, design, pageCount: 2, title: 'CV' });

    expect(html).toContain('data-section="skills"');
    expect(html).toContain('--sec-heading:#a83232');
    expect(html).toContain('--sec-heading-scale:1.2');
    expect(html).toContain('data-head-align="center"');
    expect(html).toContain('data-bullets="dash"');
    // The page break comes from the section override, not the page policy.
    expect(html).toMatch(/class="cv-section cv-section-break"[^>]*data-section="education"/);
    // An untouched section carries no override attributes at all.
    expect(html).not.toMatch(/data-section="languages"[^>]*data-head-align/);
  });

  it('leaves the untouched document byte-identical in its section markup', () => {
    const plain = buildStandaloneHtml({ data: buildSampleCv('en'), design, pageCount: 1, title: 'CV' });
    // The stylesheet always defines the hooks, so inspect the <section> tags
    // (the actual document markup) rather than the whole file.
    const marks = plain.match(/<section[^>]*>/g) ?? [];
    expect(marks.length).toBeGreaterThan(0);
    for (const tag of marks) {
      expect(tag).not.toContain('data-bullets');
      expect(tag).not.toContain('data-head-align');
      expect(tag).not.toContain('--sec-heading');
    }
  });

  it('ships the CSS hooks the overrides rely on', () => {
    const tokens = composeDocumentTokens({ data: buildSampleCv('en'), design });
    const css = buildDocumentCss({ design, mode: 'print', tokens });
    expect(css).toContain('--sec-heading: var(--accent)');
    expect(css).toContain('--sec-heading-scale: 1');
    expect(css).toContain('calc(var(--gap) * (var(--sec-gap-mul) - 1))');
    expect(css).toContain("[data-bullets='none']");
  });

  it('writes the same override into the DOCX, including a real page break', async () => {
    const { default: JSZip } = await import('jszip');
    const plainCv = buildSampleCv('en');
    const zip = await JSZip.loadAsync(await buildDocx({ data: plainCv, design, title: 'CV' }));
    const doc = await zip.file('word/document.xml')!.async('string');
    // The default document has no per-section page break.
    expect(doc).not.toContain('<w:pageBreakBefore');

    const overrideZip = await JSZip.loadAsync(
      await buildDocx({ data: { ...plainCv, sectionStyles: styles }, design, title: 'CV' }),
    );
    const overridden = await overrideZip.file('word/document.xml')!.async('string');
    expect(overridden).toContain('<w:pageBreakBefore');
    // Heading colour and alignment carried over (upper-case hex in OOXML runs).
    expect(overridden.toUpperCase()).toContain('A83232');
    expect(overridden).toContain('<w:jc w:val="center"');
  });

  it('uses a distinct Word numbering id for a custom bullet marker', async () => {
    const { default: JSZip } = await import('jszip');
    const readNumIds = async (styles: Record<string, unknown> | undefined) => {
      const cv = { ...buildSampleCv('en'), ...(styles ? { sectionStyles: styles } : {}) };
      const zip = await JSZip.loadAsync(await buildDocx({ data: cv, design, title: 'CV' }));
      const doc = await zip.file('word/document.xml')!.async('string');
      const numbering = await zip.file('word/numbering.xml')!.async('string');
      // `docx` maps reference names to numeric ids, so the marker glyph and the
      // set of numId values are what a reader can actually observe.
      return { ids: new Set(doc.match(/<w:numId w:val="(\d+)"/g) ?? []), numbering };
    };
    const plain = await readNumIds(undefined);
    expect(plain.numbering).toContain('•');
    const square = await readNumIds({ skills: { bulletStyle: 'square' } });
    const dash = await readNumIds({ skills: { bulletStyle: 'dash' } });
    expect(square.numbering).toContain('▪');
    expect(dash.numbering).toContain('–');
    // A section with "no marker" emits plain indented paragraphs instead of a
    // list, so that section contributes no numbered paragraph of its own.
    const countNumbered = (doc: string) => (doc.match(/<w:numPr>/g) ?? []).length;
    const readDoc = async (styles?: Record<string, unknown>) => {
      const cv = { ...buildSampleCv('en'), ...(styles ? { sectionStyles: styles } : {}) };
      const zip = await JSZip.loadAsync(await buildDocx({ data: cv, design, title: 'CV' }));
      return zip.file('word/document.xml')!.async('string');
    };
    const plainDoc = await readDoc();
    const noneDoc = await readDoc({ experience: { bulletStyle: 'none' } });
    expect(countNumbered(noneDoc)).toBeGreaterThan(0);
    expect(countNumbered(noneDoc)).toBeLessThan(countNumbered(plainDoc));
  });

  it('resets to the template look when the override is cleared', () => {
    const plain = resolveDesign('classic-professional', {});
    expect(overrideFor({}, 'skills')).toBeNull();
    expect(plain.headingStyle).toBeTruthy();
  });
});
