// @vitest-environment node
/**
 * Named style presets (Part 9).
 *
 * Applying a preset must set a base template and layer design tokens on top —
 * never mutate a template definition and never touch CV content. These tests
 * run every preset through the real resolver so a typo in an id cannot ship.
 */
import { describe, it, expect } from 'vitest';
import { NAMED_PRESETS, namedPresetById } from '@/lib/namedPresets';
import { FONT_PAIRS, PALETTES, TEMPLATES, resolveDesign, templateById } from '@/templates/catalog';
import { composeDocumentTokens } from '@/lib/composition';
import { buildStandaloneHtml } from '@/document/standalone';
import { buildSampleCv } from '@/features/templates/sampleData';
import { defaultDesign } from '@/lib/defaults';

describe('named presets', () => {
  it('ships exactly ten, with unique ids and both names', () => {
    expect(NAMED_PRESETS).toHaveLength(10);
    expect(new Set(NAMED_PRESETS.map((p) => p.id)).size).toBe(10);
    for (const p of NAMED_PRESETS) {
      expect(p.nameEn.length).toBeGreaterThan(2);
      expect(p.nameBn).toMatch(/[\u0980-\u09FF]/);
      expect(p.descriptionEn.length).toBeGreaterThan(20);
    }
  });

  it('references only ids that exist', () => {
    const palettes = new Set(PALETTES.map((p) => p.id));
    const pairs = new Set(FONT_PAIRS.map((f) => f.id));
    const templates = new Set(TEMPLATES.map((t) => t.id));
    for (const p of NAMED_PRESETS) {
      expect(templates.has(p.baseTemplateId), p.id).toBe(true);
      if (p.design.paletteId) expect(palettes.has(p.design.paletteId), `${p.id} palette`).toBe(true);
      if (p.design.fontPairId) expect(pairs.has(p.design.fontPairId), `${p.id} font pair`).toBe(true);
    }
  });

  it('resolves to a valid A4 design and renders a real document', () => {
    for (const p of NAMED_PRESETS) {
      const design = resolveDesign(p.baseTemplateId, { ...defaultDesign(p.baseTemplateId), ...p.design });
      const cv = buildSampleCv('en');
      const tokens = composeDocumentTokens({ data: cv, design });
      expect(tokens.typography.body.sizePt).toBeGreaterThanOrEqual(9);
      const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV', tokens });
      expect(html, p.id).toContain('size: A4 portrait');
      expect(html, p.id).toContain(cv.personal.fullName);
    }
  });

  it('renders just as well in Bangla with the photo removed', () => {
    for (const p of NAMED_PRESETS) {
      const design = resolveDesign(p.baseTemplateId, { ...defaultDesign(p.baseTemplateId), ...p.design });
      const cv = buildSampleCv('bn');
      cv.photo = { ...cv.photo, dataUrl: null };
      const tokens = composeDocumentTokens({ data: cv, design });
      const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'জীবনবৃত্তান্ত', tokens });
      expect(html, p.id).toMatch(/[\u0980-\u09FF]/);
      expect(html, p.id).not.toContain('class="cv-photo"');
    }
  });

  it('never mutates the template catalog', () => {
    const before = JSON.parse(JSON.stringify(TEMPLATES));
    for (const p of NAMED_PRESETS) resolveDesign(p.baseTemplateId, p.design);
    expect(TEMPLATES).toEqual(before);
    // And the base template still resolves to its own palette when no override
    // is supplied — a preset cannot leave a permanent mark.
    const preset = namedPresetById('named-ats-plain')!;
    const pristine = resolveDesign(preset.baseTemplateId, {});
    expect(pristine.palette.id).toBe(templateById(preset.baseTemplateId).paletteId);
  });
});
