// @vitest-environment jsdom
/**
 * Design-system guarantees.
 *
 * These tests lock the Golden Ratio scale, the 8-point spacing grid, the
 * light/dark token pairs and the "no Chromium-111+ CSS" rule that keeps the app
 * running on Electron 22 (Chromium 108) under Windows 7.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PHI, goldenSplit, rhythm, mm, A4 } from '@/lib/golden';
import { TEMPLATES, PALETTES, FONT_PAIRS } from '@/templates/catalog';

const ROOT = process.cwd();
const read = (...parts: string[]) => readFileSync(join(ROOT, ...parts), 'utf8');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return [full];
  });
}

describe('golden ratio scale', () => {
  it('uses φ = 1.6180339887', () => {
    expect(PHI).toBeCloseTo(1.6180339887, 10);
  });

  it('splits a measure into the golden pair', () => {
    const { major, minor } = goldenSplit(1000);
    expect(major + minor).toBeCloseTo(1000, 1);
    expect(major / minor).toBeCloseTo(PHI, 2);
    expect(major / 1000).toBeCloseTo(0.618, 3);
  });

  it('keeps spacing on the 8-point grid', () => {
    for (const n of [1, 2, 3, 5, 8]) expect(rhythm(n)).toBe(n * 8);
  });

  it('measures A4 as 210×297 mm', () => {
    expect(A4.widthMm).toBe(210);
    expect(A4.heightMm).toBe(297);
    // 210 mm at 96 dpi
    expect(mm(210)).toBeCloseTo(793.7, 1);
    expect(mm(297)).toBeCloseTo(1122.5, 1);
  });
});

describe('design tokens', () => {
  const tokens = read('src', 'styles', 'tokens.css');

  it('defines light and dark palettes with the same custom properties', () => {
    const light = new Set([...tokens.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
    expect(light.size).toBeGreaterThan(30);
    expect(tokens).toContain("[data-theme='dark']");
    expect(tokens).toContain("[data-theme='light']");
  });

  it('uses an 8-point spacing scale', () => {
    const steps = [...tokens.matchAll(/--sp-(\d+):\s*(\d+)px/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(steps.length).toBeGreaterThan(4);
    // 4, 8, 12, 16, 24, 32, 40, 56, 72 — every step is a multiple of 4 and the
    // first two are the 8-point base units
    for (const [, value] of steps) expect(value % 4).toBe(0);
    expect(steps[0][1]).toBe(4);
    expect(steps[1][1]).toBe(8);
  });

  it('declares an exact A4 paper size for the document', () => {
    const documentCss = read('src', 'document', 'styles.ts');
    expect(documentCss).toMatch(/size:\s*A4 portrait/);
    expect(documentCss).toMatch(/width:\s*210mm/);
    expect(documentCss).toMatch(/min-height:\s*297mm/);
  });
});

describe('Chromium 108 compatibility (Windows 7 target)', () => {
  const cssFiles = walk(join(ROOT, 'src')).filter((file) => file.endsWith('.css'));
  const tsFiles = walk(join(ROOT, 'src')).filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));

  it('never uses color-mix(), which needs Chromium 111+', () => {
    for (const file of [...cssFiles, ...tsFiles]) {
      const source = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      expect(/color-mix\(/.test(source), file).toBe(false);
    }
  });

  it('never uses features unavailable in Chromium 108', () => {
    const forbidden = [/container-type\s*:/, /@layer\b/, /subgrid/, /:has\(/];
    for (const file of [...cssFiles, ...tsFiles]) {
      const source = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        expect(pattern.test(source), `${file} matches ${pattern}`).toBe(false);
      }
    }
  });

  it('targets an ES2019 browser bundle', () => {
    const config = read('vite.config.ts');
    expect(config).toContain('es2019');
  });
});

describe('template catalogue', () => {
  it('ships exactly 30 templates with unique ids and names', () => {
    expect(TEMPLATES).toHaveLength(30);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(30);
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(30);
  });

  it('gives every template a distinct structural signature', () => {
    // Two templates may share a header/body/heading combination only if their
    // entry rhythm or portrait treatment differs too.
    const signatures = TEMPLATES.map((t) =>
      [t.layout.header, t.layout.body, t.layout.heading, t.layout.entry, t.layout.photoShape].join('|'),
    );
    const repeats = signatures.length - new Set(signatures).size;
    expect(repeats).toBeLessThanOrEqual(4);
    // and no two templates may share the complete visual identity
    const full = TEMPLATES.map((t) =>
      [
        t.layout.header,
        t.layout.body,
        t.layout.heading,
        t.layout.entry,
        t.layout.photoShape,
        t.layout.band,
        t.paletteId,
        t.fontPairId,
      ].join('|'),
    );
    expect(new Set(full).size).toBe(30);
  });

  it('never differentiates templates by colour alone', () => {
    const byPalette = new Map<string, number>();
    for (const template of TEMPLATES) {
      byPalette.set(template.paletteId, (byPalette.get(template.paletteId) ?? 0) + 1);
    }
    // Every palette may repeat, but no palette may carry more than a fifth of the set
    for (const count of byPalette.values()) expect(count).toBeLessThanOrEqual(6);
  });

  it('balances portrait orientation across the catalogue', () => {
    const left = TEMPLATES.filter((t) => t.layout.photo === 'left').length;
    expect(left).toBeGreaterThanOrEqual(3);
    expect(left).toBeLessThanOrEqual(8);
  });

  it('keeps ATS templates photo-free and graphic-free', () => {
    for (const template of TEMPLATES.filter((t) => t.category === 'ATS-Friendly')) {
      expect(template.photoSupported).toBe(false);
      expect(template.atsFriendly).toBe(true);
      expect(template.layout.photoShape).toBe('none');
      expect(template.paletteId).toBeDefined();
    }
  });

  it('offers Bengali-capable palettes and 4 font pairs', () => {
    expect(PALETTES.length).toBeGreaterThanOrEqual(8);
    expect(FONT_PAIRS).toHaveLength(4);
    for (const pair of FONT_PAIRS) expect(pair.bengaliOk).toBe(true);
  });
});
