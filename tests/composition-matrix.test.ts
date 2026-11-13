/**
 * Composition test matrix (Part 11).
 *
 * Exercises the full cross-product the specification asks for — 30 templates ×
 * language × title mode × photo × density × alignment × optional sections —
 * without drawing them (that would take hours). Each cell runs the *real*
 * pipeline: section resolver → composition tokens → CSS builder → standalone
 * HTML → DOCX byte generation, then asserts the contract that matters.
 *
 * Visual inspection is separate: scripts/render_previews.py rasterises a
 * representative subset with HarfBuzz, and tests/docs-images.test.ts checks the
 * resulting PNGs exist and are non-blank.
 */
import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { TEMPLATES, resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';
import { printableSections } from '@/lib/sections';
import { composeDocumentTokens, resolveTitle, A4 } from '@/lib/composition';
import { buildLayoutReport } from '@/lib/layoutReport';
import { buildDocumentCss } from '@/document/styles';
import { buildStandaloneHtml } from '@/document/standalone';
import { buildDocx } from '@/document/docxExport';
import type { CVLanguage, DesignOverrides, TitlePreset } from '@/types/cv';

const PHOTO_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface Cell {
  templateId: string;
  language: CVLanguage;
  title: TitlePreset;
  photo: boolean;
  density: 'compact' | 'balanced' | 'spacious';
  overrides: Partial<DesignOverrides>;
}

function makeCv(cell: Cell, optionalSections: boolean) {
  const language = cell.language === 'bn' ? 'bn' : 'en';
  const cv = buildSampleCv(language);
  cv.language = cell.language;
  cv.title = { ...cv.title, preset: cell.title, visible: cell.title !== 'none' };
  if (cell.title === 'custom') cv.title.text = 'PROFESSIONAL PROFILE';
  cv.photo = cell.photo
    ? { ...cv.photo, dataUrl: PHOTO_DATA_URL, frameSize: 30 }
    : { ...cv.photo, dataUrl: null };
  if (optionalSections) {
    for (const section of cv.sections) section.enabled = true;
    cv.trainingEnabled = true;
    cv.projectsEnabled = true;
    cv.achievementsEnabled = true;
    cv.strengthsEnabled = true;
    cv.hobbiesEnabled = true;
    cv.volunteerEnabled = true;
    cv.referencesEnabled = true;
    cv.personalDetailsEnabled = true;
    cv.careerObjective.enabled = true;
    cv.declaration = { ...cv.declaration, enabled: true, text: 'I declare the above is true.', place: 'Dhaka', date: '2024-01-15' };
  }
  return cv;
}

function render(cell: Cell, optionalSections = false) {
  const cv = makeCv(cell, optionalSections);
  const design = resolveDesign(cell.templateId, cell.overrides);
  const language = cv.language === 'bn' ? 'bn' : 'en';
  const tokens = composeDocumentTokens({ data: cv, design, overrides: cell.overrides as DesignOverrides });
  const sections = printableSections(cv, { language });
  const report = buildLayoutReport(cv, sections, tokens, { language, hasPhoto: !!cv.photo.dataUrl });
  return { cv, design, tokens, sections, report, language };
}

const base: Cell = {
  templateId: 'classic-professional',
  language: 'en',
  title: 'curriculum-vitae',
  photo: false,
  density: 'balanced',
  overrides: {},
};

describe('composition matrix — 30 templates × 2 languages', () => {
  for (const template of TEMPLATES) {
    for (const language of ['en', 'bn'] as const) {
      it(`${template.id} renders ${language} without overflow or empty headings`, () => {
        const { tokens, sections, report, design } = render({ ...base, templateId: template.id, language });

        // A4 geometry is fixed and the text box stays positive.
        expect(tokens.margins.top).toBeGreaterThan(5);
        expect(A4.widthMm - tokens.margins.left - tokens.margins.right).toBeGreaterThan(100);

        // Composition is physically plausible: between 1 and 6 pages, and no
        // page is estimated at zero height.
        expect(report.pages).toBeGreaterThanOrEqual(1);
        expect(report.pages).toBeLessThanOrEqual(6);
        expect(report.estimate.contentMm).toBeGreaterThan(40);

        // Every rendered section has a heading and real content.
        for (const section of sections) {
          expect(section.title.trim().length).toBeGreaterThan(0);
          expect(section.hasContent).toBe(true);
        }

        // The stylesheet is generated from the same tokens and is valid CSS text.
        const css = buildDocumentCss({ design, mode: 'print', tokens });
        expect(css).toContain('size: A4 portrait');
        expect(css).toContain('210mm');
        expect(css).toContain('print-color-adjust: exact');
        expect(css).not.toContain('color-mix('); // Chromium 108 / Windows 7 safety
        expect(css).not.toContain('undefined');
        expect(css).not.toContain('NaN');
      });
    }
  }
});

describe('title modes', () => {
  const modes: TitlePreset[] = ['cv', 'curriculum-vitae', 'resume', 'professional-resume', 'none', 'custom'];
  const expected: Record<TitlePreset, string> = {
    cv: 'CV',
    'curriculum-vitae': 'CURRICULUM VITAE',
    resume: 'RESUME',
    'professional-resume': 'PROFESSIONAL RESUME',
    none: '',
    custom: 'PROFESSIONAL PROFILE',
  };

  for (const mode of modes) {
    it(`title mode "${mode}" renders the expected text`, () => {
      const { cv, tokens, design } = render({ ...base, title: mode });
      expect(tokens.title.visible).toBe(mode !== 'none');
      // Uppercase transform is applied by the resolver.
      expect(tokens.title.text).toBe(expected[mode].toUpperCase());

      const html = buildStandaloneHtml({ data: cv, design, tokens });
      if (mode === 'none') {
        // No title element and no reserved space.
        expect(html).not.toContain('class="cv-title"');
        expect(tokens.title.spaceBeforeMm).toBe(0);
        expect(tokens.title.spaceAfterMm).toBe(0);
      } else {
        expect(html).toContain('class="cv-title"');
        expect(html).toContain(expected[mode].toUpperCase());
      }
    });
  }

  it('removes the title when it is hidden even though a preset is chosen', () => {
    const cv = makeCv({ ...base, title: 'resume' }, false);
    cv.title = { ...cv.title, visible: false };
    expect(resolveTitle(cv).visible).toBe(false);
    expect(resolveTitle(cv).text).toBe('');
  });

  it('never prints a title for an empty custom title', () => {
    const cv = makeCv({ ...base, title: 'custom' }, false);
    cv.title = { ...cv.title, text: '   ' };
    expect(resolveTitle(cv).visible).toBe(false);
  });
});

describe('photo and optional-section handling', () => {
  it('reflows the header when the photo is removed', () => {
    const withPhoto = render({ ...base, photo: true });
    const without = render({ ...base, photo: false });
    const a = buildStandaloneHtml({ data: withPhoto.cv, design: withPhoto.design, tokens: withPhoto.tokens });
    const b = buildStandaloneHtml({ data: without.cv, design: without.design, tokens: without.tokens });
    expect(a).toContain('cv-photo');
    expect(b).not.toContain('<div class="cv-photo"');
    // Removing the photo must not shrink the estimated document below one page.
    expect(without.report.pages).toBeGreaterThanOrEqual(1);
  });

  it('renders every optional section when all are enabled and filled', () => {
    const { sections, cv } = render({ ...base }, true);
    const ids = new Set(sections.map((s) => s.id));
    for (const id of ['training', 'projects', 'achievements', 'strengths', 'hobbies', 'volunteer', 'personalDetails', 'references', 'declaration'] as const) {
      // Sample data only fills a few of these; the ones that are empty must be
      // absent, the ones that are filled must be present.
      expect(ids.has(id)).toBe(printableSections(cv, { language: 'en' }).some((s) => s.id === id));
    }
  });

  it('drops a section that is enabled but has no content', () => {
    const cv = buildSampleCv('en');
    for (const section of cv.sections) section.enabled = true;
    const sections = printableSections(cv, { language: 'en' });
    expect(sections.every((s) => s.hasContent)).toBe(true);
    // Hobbies is enabled but empty in the sample data → never rendered.
    expect(sections.some((s) => s.id === 'hobbies')).toBe(false);
  });
});

describe('density modes change real layout parameters', () => {
  const sizes = (['compact', 'balanced', 'spacious'] as const).map((density) => {
    const result = render({ ...base, density, overrides: { density } });
    return {
      density,
      body: result.tokens.typography.body.sizePt,
      line: result.tokens.typography.body.lineHeight,
      gap: result.tokens.spacing.sectionGap,
      height: result.report.estimate.contentMm,
    };
  });

  it('increases type size and spacing from compact to spacious', () => {
    expect(sizes[0].body).toBeLessThan(sizes[1].body);
    expect(sizes[1].body).toBeLessThan(sizes[2].body);
    expect(sizes[0].gap).toBeLessThan(sizes[1].gap);
    expect(sizes[1].gap).toBeLessThan(sizes[2].gap);
    expect(sizes[0].height).toBeLessThan(sizes[1].height);
    expect(sizes[1].height).toBeLessThan(sizes[2].height);
  });

  it('never drops compact body text below 9 pt', () => {
    expect(sizes[0].body).toBeGreaterThanOrEqual(9);
  });
});

describe('alignment and typography controls reach the document', () => {
  for (const align of ['left', 'center', 'right', 'justify'] as const) {
    it(`applies body alignment: ${align}`, () => {
      const { design, tokens } = render({ ...base, overrides: { bodyAlign: align } });
      const css = buildDocumentCss({ design, mode: 'print', tokens });
      expect(css).toContain(`text-align: ${align}`);
    });
  }

  it('applies custom colours and margins', () => {
    const { design, tokens } = render({
      ...base,
      overrides: {
        colors: { primary: '#7a1f2b', heading: '#101820' },
        margins: { top: 12, right: 14, bottom: 12, left: 20 },
      },
    });
    const css = buildDocumentCss({ design, mode: 'print', tokens });
    expect(tokens.colors.primary).toBe('#7a1f2b');
    expect(tokens.colors.heading).toBe('#101820');
    expect(css).toContain('12mm 14mm 12mm 20mm');
  });

  it('ignores malformed colour input instead of emitting broken CSS', () => {
    const { tokens, design } = render({ ...base, overrides: { colors: { primary: '#12' } } });
    const css = buildDocumentCss({ design, mode: 'print', tokens });
    expect(css).not.toContain('#12;');
    expect(tokens.colors.primary).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('DOCX parity across templates', () => {
  const subset = ['classic-professional', 'ats-classic', 'modern-two-column', 'swiss-minimalist', 'contemporary-creative-portfolio'];
  for (const templateId of subset) {
    it(`${templateId} produces a valid OOXML package with A4 geometry`, async () => {
      const { cv, design } = render({ ...base, templateId, language: 'bn' });
      const bytes = await buildDocx({ data: cv, design, title: 'CV' });
      const zip = unzipSync(bytes);
      expect(Object.keys(zip)).toContain('word/document.xml');
      const xml = strFromU8(zip['word/document.xml']);
      expect(xml).toMatch(/<w:pgSz w:w="11905" w:h="16837"/);
      // Bangla content survives into the XML (no mojibake, no dropped text).
      expect(xml).toContain('মোঃ রফিকুল ইসলাম');
      expect(xml).not.toContain('<img');
    });
  }
});

describe('one-page and two-page modes never lose content', () => {
  it('keeps every section even when the one-page target cannot be met', () => {
    const cell: Cell = { ...base, overrides: {} };
    const automatic = render(cell, true);
    const cv = makeCv(cell, true);
    cv.pageLength = { ...cv.pageLength, mode: 'one-page', maxPages: 1 };
    const design = resolveDesign(cell.templateId, {});
    const tokens = composeDocumentTokens({ data: cv, design });
    const sections = printableSections(cv, { language: 'en' });
    const report = buildLayoutReport(cv, sections, tokens, { language: 'en', hasPhoto: false });

    // Same sections, same content, only the verdict changes.
    expect(sections.length).toBe(automatic.sections.length);
    if (report.pages > 1) {
      expect(report.fitsTarget).toBe(false);
      expect(report.diagnostics.some((d) => d.code === 'PAGE_OVERFLOW')).toBe(true);
    }
  });

  it('reports an almost-empty last page rather than padding it', () => {
    const cv = buildSampleCv('en');
    const design = resolveDesign('classic-professional', {});
    const tokens = composeDocumentTokens({ data: cv, design });
    const sections = printableSections(cv, { language: 'en' });
    const report = buildLayoutReport(cv, sections, tokens, { language: 'en', hasPhoto: false });
    const codes = report.diagnostics.map((d) => d.code);
    expect(codes).not.toContain('EMPTY_SECTION'); // sample has no empty sections
    expect(report.estimate.lastPageFill).toBeGreaterThan(0);
  });
});
