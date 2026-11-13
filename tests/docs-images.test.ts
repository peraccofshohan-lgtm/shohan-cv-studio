// @vitest-environment node
/**
 * Generates documentation previews: a true-colour SVG of each template built
 * from the SAME resolved design/section model used by the renderers.
 */
import { describe, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { TEMPLATES, resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';
import { printableSections } from '@/lib/sections';
import { renderPreviewSvg } from '@/lib/previewSvg';

describe('documentation previews', () => {
  it('writes one SVG preview per template', () => {
    const dir = join(process.cwd(), 'docs', 'images');
    mkdirSync(dir, { recursive: true });
    for (const language of ['en', 'bn'] as const) {
      const cv = buildSampleCv(language);
      for (const template of TEMPLATES) {
        const design = resolveDesign(template.id, {});
        const sections = printableSections(cv, { language });
        const svg = renderPreviewSvg({ data: cv, design, sections, language });
        writeFileSync(join(dir, `template-${template.id}-${language}.svg`), svg, 'utf8');
      }
    }
  });
});
