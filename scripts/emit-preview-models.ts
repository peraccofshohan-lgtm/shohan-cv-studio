/**
 * Emits docs/preview-models.json — the resolved design + section model for every
 * template, produced by the SAME code that drives the live preview, DOCX, PDF and
 * print renderers. scripts/render_previews.py then draws documentation PNGs from
 * it, so docs cannot drift away from the product.
 *
 * Run: npx vitest run tests/emit-models.test.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { TEMPLATES, resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';
import { printableSections } from '@/lib/sections';
import { composeDocumentTokens } from '@/lib/composition';

export function emitPreviewModels(): number {
  const models: unknown[] = [];
  for (const language of ['en', 'bn'] as const) {
    const cv = buildSampleCv(language);
    for (const template of TEMPLATES) {
      const design = resolveDesign(template.id, {});
      const sections = printableSections(cv, { language });
      // The previews draw the *resolved composition tokens*, so the documented
      // images follow the same title block, margins and spacing as the app.
      const tokens = composeDocumentTokens({ data: cv, design });
      models.push({
        templateId: template.id,
        templateName: template.name,
        language,
        design,
        tokens,
        data: {
          personal: {
            fullName: cv.personal.fullName,
            headline: cv.personal.headline,
            mobile: cv.personal.mobile,
            email: cv.personal.email,
            address: cv.personal.presentAddress,
            linkedin: cv.personal.linkedin,
          },
          photo: !!cv.photo.dataUrl,
          signature: cv.signature.enabled,
        },
        sections: sections.map((s) => ({
          id: s.id,
          title: s.title,
          kind: s.kind,
          paragraphs: s.paragraphs,
          timeline: s.timeline,
          chips: s.chips,
          labelled: s.labelled,
          list: s.list,
        })),
      });
    }
  }
  const dir = join(process.cwd(), 'docs');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'preview-models.json'), JSON.stringify(models, null, 1), 'utf8');
  return models.length;
}
