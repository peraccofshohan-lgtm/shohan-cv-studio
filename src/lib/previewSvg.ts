/**
 * Dependency-free SVG renderer for documentation previews.
 *
 * It consumes the SAME resolved design and section model as the HTML/DOCX
 * renderers, so the SVGs in docs/images reflect the real layout decisions
 * (header style, rail position, heading treatment, palette, typography scale)
 * rather than being decorative mock-ups.
 *
 * SVG is used because it needs no binary encoder and stays crisp at any size.
 */
import type { CVData } from '@/types/cv';
import type { ResolvedDesign } from '@/templates/catalog';
import type { ResolvedSection } from '@/lib/sections';

const PAGE_W = 620; // ≈ A4 at 75dpi
const PAGE_H = 877;

function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Approximate text width so lines wrap like the real renderer. */
function wrap(text: string, maxChars: number): string[] {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [];
}

class Canvas {
  parts: string[] = [];
  cursor = 0;

  text(
    x: number,
    y: number,
    value: string,
    opts: { size?: number; fill?: string; weight?: number; family?: string; spacing?: number; anchor?: string; italic?: boolean } = {},
  ) {
    if (!value) return;
    this.parts.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${opts.family ?? 'Inter, Noto Sans Bengali, sans-serif'}" ` +
        `font-size="${opts.size ?? 9}" font-weight="${opts.weight ?? 400}" fill="${opts.fill ?? '#1b232c'}"` +
        `${opts.spacing ? ` letter-spacing="${opts.spacing}"` : ''}` +
        `${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}` +
        `${opts.italic ? ' font-style="italic"' : ''}>${esc(value)}</text>`,
    );
  }

  rect(x: number, y: number, w: number, h: number, fill: string, extra = '') {
    this.parts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0.4, w).toFixed(1)}" height="${Math.max(0.4, h).toFixed(1)}" fill="${fill}" ${extra}/>`);
  }

  circle(cx: number, cy: number, r: number, fill: string) {
    this.parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`);
  }

  /** Draws a small bullet marker. */
  dot(x: number, y: number, color: string) {
    this.circle(x, y, 1.6, color);
  }
}

export interface PreviewSvgOptions {
  data: CVData;
  design: ResolvedDesign;
  sections: ResolvedSection[];
  language: 'bn' | 'en';
}

export function renderPreviewSvg({ data, design, sections, language }: PreviewSvgOptions): string {
  const p = design.palette;
  const c = new Canvas();
  const margin = 46;
  const contentWidth = PAGE_W - margin * 2;
  const isRail = design.bodyLayout === 'sidebar-left' || design.bodyLayout === 'sidebar-right';
  const railWidth = 150;
  const railX = design.bodyLayout === 'sidebar-right' ? PAGE_W - railWidth : 0;
  const mainX = design.bodyLayout === 'sidebar-left' ? railWidth + 22 : margin;
  const mainWidth = isRail ? PAGE_W - railWidth - margin - 22 : contentWidth;

  c.rect(0, 0, PAGE_W, PAGE_H, '#ffffff');

  // ------------------------------------------------------------- rail
  if (isRail) {
    c.rect(railX, 0, railWidth, PAGE_H, p.sidebar);
    let ry = 64;
    if (data.photo.dataUrl) {
      c.rect(railX + railWidth / 2 - 26, ry - 26, 52, 52, 'rgba(255,255,255,.16)', 'rx="26"');
      ry += 48;
    }
    c.text(railX + 20, ry, language === 'bn' ? 'যোগাযোগ' : 'CONTACT', {
      size: 7.4,
      weight: 700,
      fill: 'rgba(255,255,255,.66)',
      spacing: 1.2,
    });
    ry += 14;
    for (const line of [data.personal.mobile, data.personal.email, data.personal.presentAddress].filter(Boolean)) {
      for (const part of wrap(String(line), 22)) {
        c.text(railX + 20, ry, part, { size: 7.6, fill: 'rgba(255,255,255,.92)' });
        ry += 10;
      }
    }
    ry += 10;
    const railSectionIds = ['skills', 'languages'];
    for (const section of sections.filter((s) => railSectionIds.includes(s.id))) {
      c.text(railX + 20, ry, section.title.toUpperCase(), {
        size: 7.2,
        weight: 700,
        fill: 'rgba(255,255,255,.66)',
        spacing: 1.1,
      });
      ry += 13;
      const items =
        section.kind === 'chips' ? section.chips : section.labelled.map((l) => `${l.label}: ${l.value}`);
      for (const item of items.slice(0, 10)) {
        for (const part of wrap(item, 24)) {
          c.text(railX + 20, ry, part, { size: 7.4, fill: 'rgba(255,255,255,.9)' });
          ry += 9.6;
        }
      }
      ry += 9;
    }
  }

  // ------------------------------------------------------------ header
  let y = margin;
  const headerBand = design.headerStyle === 'band';
  const photoOnRight = design.photoPosition === 'right';
  const photoSize = 62;

  if (headerBand) {
    c.rect(0, 0, isRail ? PAGE_W - railWidth : PAGE_W, y + 92, p.primary);
    y = margin + 16;
  }

  const nameColor = headerBand ? '#ffffff' : p.primary;
  const mutedColor = headerBand ? 'rgba(255,255,255,.85)' : p.muted;
  const nameX = design.headerStyle === 'centered' ? mainX + mainWidth / 2 : mainX;

  if (design.headerStyle === 'centered') {
    c.text(nameX, y + 12, data.personal.fullName || 'Your Name', {
      size: 21,
      weight: 700,
      fill: nameColor,
      anchor: 'middle',
      spacing: -0.2,
    });
    if (data.personal.headline) {
      c.text(nameX, y + 30, data.personal.headline, { size: 9.4, fill: mutedColor, anchor: 'middle', italic: true });
    }
    const contact = [data.personal.mobile, data.personal.email, data.personal.presentAddress].filter(Boolean).join('  •  ');
    c.text(nameX, y + 46, contact, { size: 8, fill: mutedColor, anchor: 'middle' });
    y += 58;
  } else {
    c.text(mainX, y + 12, data.personal.fullName || 'Your Name', {
      size: design.headerStyle === 'minimal' ? 19 : 21,
      weight: 700,
      fill: nameColor,
      spacing: design.headerStyle === 'dual' ? 0.4 : -0.2,
    });
    if (data.personal.headline) {
      c.text(mainX, y + 28, data.personal.headline, { size: 9.2, fill: mutedColor, italic: true });
    }
    let cy = y + (data.personal.headline ? 43 : 28);
    const contactItems = [data.personal.mobile, data.personal.email, data.personal.presentAddress, data.personal.linkedin].filter(Boolean);
    let lineX = mainX;
    for (const item of contactItems) {
      const text = String(item);
      const width = text.length * 3.9;
      if (lineX + width > (isRail ? PAGE_W - margin : PAGE_W - margin) - (photoOnRight && data.photo.dataUrl ? photoSize + 16 : 0)) {
        lineX = mainX;
        cy += 11;
      }
      c.text(lineX, cy, text, { size: 8, fill: mutedColor });
      lineX += width + 12;
    }
    y = cy + 12;
  }

  if (data.photo.dataUrl && design.photoShape !== 'none') {
    const px = design.headerStyle === 'centered' ? mainX + mainWidth / 2 - photoSize / 2 : photoOnRight ? PAGE_W - margin - photoSize : mainX;
    const py = headerBand ? margin - 22 : margin - 8;
    const radius =
      design.photoShape === 'circle' ? photoSize / 2 : design.photoShape === 'rounded' ? 8 : 0;
    c.rect(px, py, photoSize, photoSize, p.tint, `rx="${radius}"`);
    c.text(px + photoSize / 2, py + photoSize / 2 + 3, 'PHOTO', {
      size: 6.4,
      fill: p.muted,
      anchor: 'middle',
      spacing: 0.8,
    });
    if (design.headerStyle === 'centered') y += photoSize + 8;
  }

  // header rule / band
  if (!headerBand && design.headerStyle !== 'minimal') {
    c.rect(mainX, y + 2, mainWidth, design.headerStyle === 'dual' ? 2 : 0.9, p.primary);
    y += 10;
  } else if (design.band > 0) {
    c.rect(mainX, y + 2, mainWidth, Math.max(1.6, design.band * 1.2), p.accent);
    y += 10;
  }
  y += 6;

  // ---------------------------------------------------------- sections
  const bodyStartX = mainX;
  const bodyWidth = mainWidth;
  const maxY = PAGE_H - margin - 10;

  const renderHeading = (title: string) => {
    const style = design.headingStyle;
    const label = design.upperHeadings ? title.toUpperCase() : title;
    if (y + 26 > maxY) return false;
    if (style === 'boxed') {
      c.rect(bodyStartX, y - 8, bodyWidth, 15, p.tint, 'rx="2"');
      c.text(bodyStartX + 6, y + 2, label, { size: 7.8, weight: 700, fill: p.primary, spacing: 0.9 });
      y += 19;
      return true;
    }
    if (style === 'bar') {
      c.rect(bodyStartX, y - 7, 2.6, 10, p.accent);
      c.text(bodyStartX + 9, y + 1, label, { size: 7.9, weight: 700, fill: p.primary, spacing: 0.8 });
    } else if (style === 'side-mark') {
      c.rect(bodyStartX, y - 8, 2.2, 12, p.accent);
      c.text(bodyStartX + 9, y + 1, label, { size: 8.2, weight: 700, fill: p.primary });
    } else {
      c.text(bodyStartX, y + 1, label, { size: 7.9, weight: 700, fill: p.primary, spacing: 0.9 });
      c.rect(bodyStartX + label.length * 4.6 + 8, y - 2.4, Math.max(10, bodyWidth - label.length * 4.6 - 8), style === 'underline' ? 1.4 : 0.5, style === 'underline' ? p.accent : p.primary, 'opacity="0.55"');
    }
    y += 13;
    return true;
  };

  const renderEntry = (item: { title: string; subtitle: string; period: string; meta: string; bullets: string[]; body: string }) => {
    if (y + 22 > maxY) return;
    const periodWidth = item.period ? item.period.length * 3.6 + 8 : 0;
    c.text(bodyStartX, y, item.title, { size: 9.2, weight: 600, fill: p.text });
    if (item.period && design.entryLayout === 'split') {
      c.text(bodyStartX + bodyWidth, y, item.period, { size: 7.8, fill: p.muted, anchor: 'end' });
    } else if (item.period) {
      c.text(bodyStartX + item.title.length * 4.6 + 6, y, `· ${item.period}`, { size: 7.8, fill: p.muted });
    }
    y += 10;
    if (item.subtitle) {
      for (const line of wrap(item.subtitle, Math.floor(bodyWidth / 3.9)).slice(0, 1)) {
        c.text(bodyStartX, y, line, { size: 8, fill: p.muted });
        y += 9;
      }
    }
    if (item.meta) {
      c.text(bodyStartX, y, item.meta, { size: 7.2, fill: p.accent });
      y += 9;
    }
    for (const bullet of item.bullets.slice(0, 4)) {
      for (const [index, line] of wrap(bullet, Math.floor(bodyWidth / 3.8)).slice(0, 2).entries()) {
        if (index === 0) c.dot(bodyStartX + 2.4, y - 2.6, p.accent);
        c.text(bodyStartX + 9, y, line, { size: 7.6, fill: p.text });
        y += 8.8;
      }
    }
    if (item.body) {
      for (const line of wrap(item.body, Math.floor(bodyWidth / 3.8)).slice(0, 2)) {
        c.text(bodyStartX, y, line, { size: 7.6, fill: p.text });
        y += 8.8;
      }
    }
    void periodWidth;
    y += design.entryRule ? 10 : 7;
    if (design.entryRule) c.rect(bodyStartX, y - 5, bodyWidth, 0.5, p.muted, 'opacity="0.3"');
  };

  const railSkip = new Set(['skills', 'languages']);
  for (const section of sections) {
    if (isRail && railSkip.has(section.id)) continue;
    if (y + 30 > maxY) break;
    if (!renderHeading(section.title)) break;

    if (section.kind === 'paragraph') {
      for (const paragraph of section.paragraphs) {
        for (const line of wrap(paragraph, Math.floor(bodyWidth / 3.7))) {
          if (y > maxY) break;
          c.text(bodyStartX, y, line, { size: 7.9, fill: p.text });
          y += 9.6;
        }
        y += 3;
      }
    }
    if (section.kind === 'chips') {
      let x = bodyStartX;
      for (const chip of section.chips.slice(0, 14)) {
        const w = chip.length * 3.7 + 10;
        if (x + w > bodyStartX + bodyWidth) {
          x = bodyStartX;
          y += 13;
        }
        c.rect(x, y - 7.4, w, 11, p.tint, 'rx="2"');
        c.text(x + 5, y + 0.6, chip, { size: 7.2, fill: p.text });
        x += w + 4;
      }
      y += 17;
    }
    if (section.kind === 'labelled-grid') {
      const columns = section.labelled.length > 3 ? 2 : 1;
      const colWidth = bodyWidth / columns;
      section.labelled.slice(0, 12).forEach((row, index) => {
        const col = index % columns;
        const rowIndex = Math.floor(index / columns);
        const rowY = y + rowIndex * 10;
        c.text(bodyStartX + col * colWidth, rowY, row.label, { size: 7.4, fill: p.muted });
        c.text(bodyStartX + col * colWidth + colWidth * 0.42, rowY, row.value.slice(0, 34), { size: 7.4, fill: p.text });
      });
      y += Math.ceil(Math.min(12, section.labelled.length) / columns) * 10 + 8;
    }
    if (section.kind === 'timeline') {
      for (const item of section.timeline.slice(0, 5)) {
        renderEntry(item);
        if (y > maxY) break;
      }
    }
    y += 5;
  }

  // signature
  if (data.signature.enabled && data.signature.dataUrl) {
    c.rect(bodyStartX + bodyWidth - 90, Math.min(y + 10, maxY - 30), 90, 22, 'transparent');
    c.text(bodyStartX + bodyWidth, Math.min(y + 34, maxY - 6), data.personal.fullName, {
      size: 7.4,
      fill: p.muted,
      anchor: 'end',
    });
    c.rect(bodyStartX + bodyWidth - 100, Math.min(y + 26, maxY - 12), 100, 0.6, p.text, 'opacity="0.5"');
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}" role="img" aria-label="CV template preview: ${esc(design.template.name)}">
<rect width="${PAGE_W}" height="${PAGE_H}" fill="#ffffff"/>
${c.parts.join('\n')}
</svg>`;
}
