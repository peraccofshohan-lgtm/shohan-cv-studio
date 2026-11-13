// @vitest-environment node
/**
 * Title decoration controls — strikethrough and word spacing (Part 4).
 *
 * The contract: both controls work for Latin titles, both reach the print
 * payload and the DOCX, and word spacing is *never* applied to Bengali, because
 * separating words in Bangla also pulls conjuncts apart.
 */
import { describe, it, expect } from 'vitest';
import { composeDocumentTokens } from '@/lib/composition';
import { buildStandaloneHtml } from '@/document/standalone';
import { buildDocx } from '@/document/docxExport';
import { defaultTitle } from '@/lib/defaults';
import { resolveDesign } from '@/templates/catalog';
import { buildSampleCv } from '@/features/templates/sampleData';

const design = resolveDesign('classic-professional', {});

function cvWithTitle(patch: Partial<ReturnType<typeof defaultTitle>>) {
  const cv = buildSampleCv('en');
  cv.title = { ...defaultTitle(), ...patch };
  return cv;
}

describe('title strikethrough and word spacing', () => {
  it('defaults to neither', () => {
    const t = composeDocumentTokens({ data: buildSampleCv('en'), design }).title;
    expect(t.strikethrough).toBe(false);
    expect(t.wordSpacing).toBe(0);
  });

  it('applies both to a Latin title, in the tokens and in the CSS', () => {
    const cv = cvWithTitle({ text: 'CURRICULUM VITAE', strikethrough: true, wordSpacing: 0.2 });
    const tokens = composeDocumentTokens({ data: cv, design });
    expect(tokens.title.strikethrough).toBe(true);
    expect(tokens.title.wordSpacing).toBe(0.2);

    const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV', tokens });
    expect(html).toMatch(/\.cv-title \{[^}]*text-decoration: line-through/s);
    expect(html).toMatch(/\.cv-title \{[^}]*word-spacing: 0\.200em/s);
  });

  it('combines underline and strikethrough instead of replacing one with the other', () => {
    const cv = cvWithTitle({ underline: true, strikethrough: true });
    const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV' });
    expect(html).toMatch(/\.cv-title \{[^}]*text-decoration: underline line-through/s);
  });

  it('refuses word spacing for a Bengali title but still allows strikethrough', () => {
    const cv = cvWithTitle({ preset: 'custom', text: 'জীবনবৃত্তান্ত', wordSpacing: 0.3, strikethrough: true });
    const tokens = composeDocumentTokens({ data: cv, design });
    expect(tokens.title.text).toContain('জীবনবৃত্তান্ত');
    expect(tokens.title.wordSpacing).toBe(0);
    expect(tokens.title.strikethrough).toBe(true);
    const html = buildStandaloneHtml({ data: cv, design, pageCount: 1, title: 'CV', tokens });
    expect(html).toMatch(/\.cv-title \{[^}]*word-spacing: 0\.000em/s);
  });

  it('clamps word spacing so a title can never be spread across the page', () => {
    const cv = cvWithTitle({ wordSpacing: 99 });
    expect(composeDocumentTokens({ data: cv, design }).title.wordSpacing).toBe(0.5);
    const negative = cvWithTitle({ wordSpacing: -3 });
    expect(composeDocumentTokens({ data: negative, design }).title.wordSpacing).toBe(0);
  });

  it('carries the strike into the DOCX run properties', async () => {
    const cv = cvWithTitle({ strikethrough: true });
    const bytes = await buildDocx({ data: cv, design, title: 'CV' });
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(bytes);
    const doc = await zip.file('word/document.xml')!.async('string');
    expect(doc).toContain('<w:strike');
  });

  it('does not put a strike or extra tracking on a Bengali DOCX title', async () => {
    const cv = cvWithTitle({ preset: 'custom', text: 'জীবনবৃত্তান্ত', wordSpacing: 0.4 });
    const bytes = await buildDocx({ data: cv, design, title: 'CV' });
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(bytes);
    const doc = await zip.file('word/document.xml')!.async('string');
    expect(doc).toContain('জীবনবৃত্তান্ত');
    expect(doc).not.toContain('<w:spacing w:val="80"');
  });
});
