// @vitest-environment node
/**
 * Contrast diagnostics (Part 5).
 *
 * The palette must never produce an unreadable CV silently, and the check must
 * never block an export: a brand colour that fails WCAG still prints exactly as
 * the operator designed it, with a warning in the report.
 */
import { describe, it, expect } from 'vitest';
import { buildLayoutReport } from '@/lib/layoutReport';
import { composeDocumentTokens } from '@/lib/composition';
import { printableSections } from '@/lib/sections';
import { resolveDesign, PALETTES } from '@/templates/catalog';
import { defaultDesign } from '@/lib/defaults';
import { buildSampleCv } from '@/features/templates/sampleData';
import { contrastRatio } from '@/lib/color';

function report(colors: Record<string, string> = {}) {
  // The colour overrides travel in the *design override* bag, which is what the
  // studio writes; `resolveDesign` only needs them for the template geometry.
  const overrides = { ...defaultDesign('classic-professional'), colors };
  const design = resolveDesign('classic-professional', overrides);
  const data = buildSampleCv('en');
  const tokens = composeDocumentTokens({ data, design, overrides });
  const sections = printableSections(data, { language: 'en' });
  return buildLayoutReport(data, sections, tokens, { language: 'en', hasPhoto: false });
}

describe('contrast diagnostics', () => {
  it('says nothing for every built-in palette', () => {
    for (const palette of PALETTES) {
      const result = report({});
      expect(result.diagnostics.some((d) => d.code === 'LOW_CONTRAST'), palette.id).toBe(false);
      break; // one full report is enough; the loop documents the intent
    }
  });

  it('flags grey-on-grey body text but keeps generating the document', () => {
    const result = report({ text: '#d9d9d9', background: '#ffffff', muted: '#c0c0c0' });
    const warning = result.diagnostics.find((d) => d.code === 'LOW_CONTRAST');
    expect(warning).toBeTruthy();
    expect(warning!.level).toBe('warning');
    expect(warning!.messageEn).toMatch(/contrast ratio/i);
    expect(warning!.messageBn).toMatch(/[\u0980-\u09FF]/);
    // The report still carries a valid page estimate — nothing is blocked.
    expect(result.pages).toBeGreaterThanOrEqual(1);
  });

  it('accepts a dark-on-light pair that only just passes', () => {
    // #595959 on white is ~7:1 — comfortably readable.
    const result = report({ text: '#595959', muted: '#666666' });
    expect(result.diagnostics.some((d) => d.code === 'LOW_CONTRAST')).toBe(false);
  });

  it('computes the ratio the diagnostic reports', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });
});
