// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildDocx } from '@/document/docxExport';
import { resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';

async function docxParts(title: 'show' | 'hide') {
  const cv = buildSampleCv('en');
  if (title === 'hide') cv.title = { ...cv.title, preset: 'none', visible: false };
  const bytes = await buildDocx({ data: cv, design: resolveDesign('classic-professional', {}), title: 'CV' });
  const zip = unzipSync(bytes);
  return { names: Object.keys(zip), xml: strFromU8(zip['word/document.xml']) };
}

describe('docx payload', () => {
  it('is a real OOXML package', async () => {
    const { names } = await docxParts('show');
    expect(names).toContain('[Content_Types].xml');
    expect(names).toContain('word/document.xml');
    expect(names).toContain('word/styles.xml');
  });
  it('contains the title text when visible', async () => {
    const { xml } = await docxParts('show');
    expect(xml).toContain('CURRICULUM VITAE');
  });
  it('omits the title when hidden', async () => {
    const { xml } = await docxParts('hide');
    expect(xml).not.toContain('CURRICULUM VITAE');
  });
  it('uses A4 page size in twips', async () => {
    const { xml } = await docxParts('show');
    // 210 mm = 11905 twips, 297 mm = 16837 twips.
    expect(xml).toMatch(/<w:pgSz w:w="11905" w:h="16837"/);
  });

  it('mirrors the page margins from the design', async () => {
    const cv = buildSampleCv('en');
    const bytes = await buildDocx({
      data: cv,
      design: resolveDesign('classic-professional', { marginMm: 25 }),
      title: 'CV',
    });
    const xml = strFromU8(unzipSync(bytes)['word/document.xml']);
    // 25 mm = 1417 twips
    expect(xml).toMatch(/<w:pgMar w:top="1417"/);
  });
});
