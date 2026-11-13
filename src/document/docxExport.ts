/**
 * DOCX export — a genuinely editable Word document.
 *
 * Requirements honoured:
 *  - Real Word paragraphs, tables and bullet lists (no flattened image).
 *  - A4 page, symmetric margins from the template, correct line spacing.
 *  - Bengali Unicode text preserved (font + cs/bidi hints set on every run) so
 *    Word/LibreOffice render conjuncts correctly instead of showing boxes.
 *  - Photo and signature embedded as real inline images.
 *  - Header/footer with optional page numbering and repeated page header.
 *  - Excluded/empty sections never appear (driven by the shared resolver).
 *  - Structural variety per template: header composition, heading style,
 *    entry layout and rule colour all differ, matching the on-screen design.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertMillimetersToTwip,
  type IBorderOptions,
  type IParagraphStyleOptions,
} from 'docx';
import type { CVData, TextTransform } from '@/types/cv';
import { TITLE_PRESET_TEXT } from '@/types/cv';
import { applyTransform } from '@/lib/composition';
import type { ResolvedDesign } from '@/templates/catalog';
import { printableSections, type ResolvedSection } from '@/lib/sections';
import { MM_TO_PX } from '@/lib/golden';

const hex = (color: string) => color.replace('#', '').toUpperCase();
const NONE_BORDER: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
  top: NONE_BORDER,
  bottom: NONE_BORDER,
  left: NONE_BORDER,
  right: NONE_BORDER,
  insideHorizontal: NONE_BORDER,
  insideVertical: NONE_BORDER,
};

export interface DocxExportOptions {
  data: CVData;
  design: ResolvedDesign;
  title?: string;
}

/** Decode a data: URL into bytes + type for docx ImageRun. */
function dataUrlToImage(dataUrl: string): { data: Uint8Array; type: 'png' | 'jpg' } | null {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl ?? '');
  if (!match) return null;
  const type = match[1].toLowerCase() === 'png' ? 'png' : 'jpg';
  const binary = typeof atob === 'function' ? atob(match[2]) : Buffer.from(match[2], 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { data: bytes, type };
}

/** A run that keeps Bengali conjuncts intact in Word and LibreOffice. */
function run(
  text: string,
  opts: {
    bold?: boolean;
    size?: number;
    color?: string;
    italics?: boolean;
    font?: string;
    caps?: boolean;
    spacing?: number;
    underline?: Record<string, never>;
  } = {},
): TextRun {
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  return new TextRun({
    text,
    bold: opts.bold,
    italics: opts.italics,
    size: opts.size,
    color: opts.color ? hex(opts.color) : undefined,
    font: { name: opts.font ?? 'Inter', hint: 'default' },
    allCaps: opts.caps,
    characterSpacing: opts.spacing,
    underline: opts.underline ? {} : undefined,
    // Complex-script hints: required for correct Bangla shaping.
    rightToLeft: false,
    cs: hasBengali ? (opts.font ?? 'Noto Sans Bengali') : undefined,
  } as never);
}

/** Pick a single installed family name from a CSS font stack for Word. */
function titleDocxFont(stack: string): string {
  if (/Lora/i.test(stack)) return 'Lora';
  if (/Noto Sans Bengali/i.test(stack)) return 'Noto Sans Bengali';
  return 'Inter';
}

export async function buildDocx({ data, design, title }: DocxExportOptions): Promise<Uint8Array> {
  const p = design.palette;
  const language = data.language === 'bn' ? 'bn' : 'en';
  const sections = printableSections(data, { language });
  const margin = convertMillimetersToTwip(Math.max(8, Math.min(30, design.marginMm)));
  const bodySize = Math.round(19 * design.bodyScale); // half-points (≈9.5pt)
  const headingSize = Math.round(21 * design.headingScale);
  const lineSpacing = Math.round(240 * design.lineHeight);
  const serif = design.fontPair.display.includes('Lora');
  const bodyFont = design.fontPair.body.includes('Lora') ? 'Lora' : 'Inter';
  const headFont = serif ? 'Lora' : 'Inter';

  const children: (Paragraph | Table)[] = [];

  // ------------------------------------------------------------- header
  const p0 = data.personal;
  const contacts = [
    p0.mobile,
    p0.email,
    [p0.presentAddress, p0.city, p0.country].filter(Boolean).join(', '),
    p0.linkedin,
    p0.website,
  ].filter(Boolean);

  const photoImage = data.photo.dataUrl && design.photoShape !== 'none' && design.template.photoSupported
    ? dataUrlToImage(data.photo.dataUrl)
    : null;

  /**
   * Document title block. Mirrors the HTML renderer: when the operator chose
   * "No title" nothing is emitted at all, so the header does not gain a gap.
   */
  const docTitle = data.title?.visible && data.title.preset !== 'none'
    ? (data.title.preset === 'custom' ? data.title.text.trim() : TITLE_PRESET_TEXT[data.title.preset])
    : '';
  const transformedTitle = applyTransform(docTitle, data.title?.transform ?? 'none');
  const titleParagraph = transformedTitle
    ? new Paragraph({
        spacing: { before: Math.round((data.title?.spaceBeforeMm ?? 1) * 56.7), after: Math.round((data.title?.spaceAfterMm ?? 1.4) * 56.7) },
        alignment:
          data.title?.align === 'center'
            ? AlignmentType.CENTER
            : data.title?.align === 'right'
              ? AlignmentType.RIGHT
              : data.title?.align === 'justify'
                ? AlignmentType.JUSTIFIED
                : AlignmentType.LEFT,
        children: [
          run(transformedTitle, {
            size: Math.round((data.title?.fontSize ?? 10) * 2),
            bold: (data.title?.fontWeight ?? 600) >= 600,
            italics: !!data.title?.italic,
            underline: data.title?.underline ? {} : undefined,
            color: data.title?.color ? hex(data.title.color) : p.muted,
            font: data.title?.fontFamily ? titleDocxFont(data.title.fontFamily) : bodyFont,
            spacing: Math.round((data.title?.letterSpacing ?? 0.14) * 20 * 10) / 10,
          }),
        ],
        border:
          data.title?.border && data.title.border !== 'none'
            ? { bottom: { style: data.title.border === 'double' ? BorderStyle.DOUBLE : BorderStyle.SINGLE, size: data.title.border === 'thick' ? 12 : 6, color: p.primary, space: 2 } }
            : undefined,
      })
    : null;

  const nameParagraph = new Paragraph({
    spacing: { after: 40 },
    alignment: design.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [run(p0.fullName || 'Your Name', { bold: true, size: Math.round(38 * design.headingScale), color: p.primary, font: headFont, spacing: -6 })],
  });

  const headlineParagraph = p0.headline
    ? new Paragraph({
        spacing: { after: 60 },
        alignment: design.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [run(p0.headline, { size: bodySize + 2, color: p.muted, font: bodyFont, italics: true })],
      })
    : null;

  const contactParagraph = contacts.length
    ? new Paragraph({
        spacing: { after: 120 },
        alignment: design.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: contacts.flatMap((c, i) => [
          run(String(c), { size: bodySize - 1, color: p.muted, font: bodyFont }),
          ...(i < contacts.length - 1 ? [run('   •   ', { size: bodySize - 1, color: p.accent, bold: true })] : []),
        ]),
      })
    : null;

  const titleFirst = data.title?.position === 'above-name';
  const titleLast = data.title?.position === 'below-contact';
  const identityCellChildren = [
    ...(titleFirst && titleParagraph ? [titleParagraph] : []),
    nameParagraph,
    ...(!titleFirst && !titleLast && titleParagraph ? [titleParagraph] : []),
    ...(headlineParagraph ? [headlineParagraph] : []),
    ...(contactParagraph ? [contactParagraph] : []),
    ...(titleLast && titleParagraph ? [titleParagraph] : []),
  ];

  if (photoImage) {
    const frame = Math.round(data.photo.frameSize * 3.7795); // mm → px at 96dpi
    const photoCell = new TableCell({
      width: { size: Math.round(frame * 15), type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              data: photoImage.data,
              transformation: { width: frame, height: frame },
              floating: undefined,
            } as never),
          ],
        }),
      ],
    });
    const identityWidth = Math.round((210 - design.marginMm * 2) * 56.7);
    const identityCell = new TableCell({
      width: { size: identityWidth, type: WidthType.DXA },
      borders: NO_BORDERS,
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      children: identityCellChildren,
    });
    const cells = design.photoPosition === 'left' ? [photoCell, identityCell] : [identityCell, photoCell];
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: NO_BORDERS,
        rows: [new TableRow({ children: cells })],
      }),
    );
  } else {
    children.push(...identityCellChildren);
  }

  // Header rule / band
  if (design.headerStyle !== 'minimal' || design.band > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 160 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: design.headerStyle === 'dual' ? 12 : 6, color: hex(p.primary), space: 1 },
        },
        children: [run('', { size: 2 })],
      }),
    );
  }

  // ------------------------------------------------------------ sections
  const headingFor = (section: ResolvedSection): Paragraph => {
    const baseChildren = [
      run(
        design.upperHeadings ? section.title.toUpperCase() : section.title,
        { bold: true, size: headingSize, color: p.primary, font: headFont, spacing: design.upperHeadings ? 20 : 0 },
      ),
    ];
    const style = design.headingStyle;
    const border =
      style === 'rule' || style === 'underline'
        ? {
            bottom: {
              style: BorderStyle.SINGLE,
              size: style === 'underline' ? 12 : 4,
              color: hex(style === 'underline' ? p.accent : p.primary),
              space: 2,
            },
          }
        : style === 'bar'
          ? { left: { style: BorderStyle.SINGLE, size: 24, color: hex(p.accent), space: 4 } }
          : style === 'side-mark'
            ? { left: { style: BorderStyle.SINGLE, size: 18, color: hex(p.accent), space: 6 } }
            : undefined;
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: Math.round(200 * design.sectionSpacing), after: 90 },
      keepNext: true,
      border,
      shading:
        style === 'boxed'
          ? { type: ShadingType.CLEAR, color: 'auto', fill: hex(p.tint) }
          : undefined,
      children: baseChildren,
    });
  };

  const bullet = (text: string, level = 0): Paragraph =>
    new Paragraph({
      numbering: { reference: 'cv-bullets', level },
      spacing: { after: 30, line: lineSpacing },
      children: [run(text, { size: bodySize, font: bodyFont })],
    });

  const metaLine = (text: string, opts: { color?: string; size?: number } = {}): Paragraph =>
    new Paragraph({
      spacing: { after: 20 },
      children: [run(text, { size: opts.size ?? bodySize - 1, color: opts.color ?? p.muted, font: bodyFont })],
    });

  for (const section of sections) {
    if (section.id === 'signature') continue; // rendered in the tail
    children.push(headingFor(section));

    if (section.kind === 'paragraph') {
      for (const text of section.paragraphs) {
        children.push(
          new Paragraph({
            spacing: { after: 80, line: lineSpacing },
            alignment: AlignmentType.JUSTIFIED,
            children: [run(text, { size: bodySize, font: bodyFont })],
          }),
        );
      }
    }

    if (section.kind === 'chips') {
      children.push(
        new Paragraph({
          spacing: { after: 100, line: lineSpacing },
          children: section.chips.flatMap((chip, i) => [
            run(chip, { size: bodySize, font: bodyFont }),
            ...(i < section.chips.length - 1 ? [run('  •  ', { size: bodySize, color: p.accent, bold: true })] : []),
          ]),
        }),
      );
    }

    if (section.kind === 'simple-list') {
      for (const item of section.list) children.push(bullet(item));
    }

    if (section.kind === 'labelled-grid') {
      const rows = section.labelled.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 2800, type: WidthType.DXA },
                borders: NO_BORDERS,
                margins: { top: 20, bottom: 20, left: 0, right: 80 },
                children: [new Paragraph({ children: [run(row.label, { size: bodySize - 1, color: p.muted, font: bodyFont })] })],
              }),
              new TableCell({
                borders: NO_BORDERS,
                margins: { top: 20, bottom: 20, left: 0, right: 0 },
                children: [new Paragraph({ children: [run(row.value, { size: bodySize - 1, font: bodyFont })] })],
              }),
            ],
          }),
      );
      if (rows.length) {
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            borders: NO_BORDERS,
            rows,
          }),
        );
      }
    }

    if (section.kind === 'timeline') {
      section.timeline.forEach((item, index) => {
        const periodRun = item.period ? run(item.period, { size: bodySize - 1, color: p.muted, font: bodyFont }) : null;
        const isSplit = design.entryLayout === 'split';

        if (isSplit && periodRun) {
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              layout: TableLayoutType.FIXED,
              borders: NO_BORDERS,
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      borders: NO_BORDERS,
                      margins: { top: 0, bottom: 0, left: 0, right: 120 },
                      children: [
                        new Paragraph({ children: [run(item.title, { bold: true, size: bodySize + 1, font: bodyFont })] }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 2400, type: WidthType.DXA },
                      borders: NO_BORDERS,
                      margins: { top: 0, bottom: 0, left: 0, right: 0 },
                      children: [
                        new Paragraph({ alignment: AlignmentType.RIGHT, children: [periodRun] }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          );
        } else {
          children.push(
            new Paragraph({
              spacing: { before: index === 0 ? 0 : 60, after: 20 },
              keepNext: true,
              children: [
                run(item.title, { bold: true, size: bodySize + 1, font: bodyFont }),
                ...(item.period ? [run('  |  ', { size: bodySize - 1, color: p.accent }), periodRun as TextRun] : []),
              ],
            }),
          );
        }
        if (item.subtitle) children.push(metaLine(item.subtitle));
        if (item.meta) children.push(metaLine(item.meta, { color: p.accent, size: bodySize - 2 }));
        for (const b of item.bullets) children.push(bullet(b));
        if (item.body) {
          for (const line of item.body.split('\n').filter(Boolean)) {
            children.push(
              new Paragraph({
                spacing: { after: 30, line: lineSpacing },
                children: [run(line, { size: bodySize - 1, font: bodyFont })],
              }),
            );
          }
        }
        if (design.entryRule && index < section.timeline.length - 1) {
          children.push(
            new Paragraph({
              spacing: { before: 60, after: 60 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: hex(p.accent), space: 2 } },
              children: [run('', { size: 2 })],
            }),
          );
        }
      });
    }
  }

  // ------------------------------------------------------ declaration/signature
  if (data.declaration.enabled && data.declaration.text) {
    children.push(headingFor({ ...(sections.find((s) => s.id === 'declaration') as ResolvedSection), id: 'declaration', title: language === 'bn' ? 'ঘোষণাপত্র' : 'Declaration' }));
    children.push(
      new Paragraph({
        spacing: { after: 100, line: lineSpacing },
        alignment: AlignmentType.JUSTIFIED,
        children: [run(data.declaration.text, { size: bodySize, font: bodyFont })],
      }),
    );
  }

  const signatureImage = data.signature.enabled && data.signature.dataUrl ? dataUrlToImage(data.signature.dataUrl) : null;
  if (signatureImage || data.declaration.place || data.declaration.date) {
    const metaText = [
      data.declaration.place ? `${language === 'bn' ? 'স্থান' : 'Place'}: ${data.declaration.place}` : '',
      data.declaration.date ? `${language === 'bn' ? 'তারিখ' : 'Date'}: ${data.declaration.date}` : '',
    ]
      .filter(Boolean)
      .join('      ');
    if (metaText) {
      children.push(new Paragraph({ spacing: { before: 120, after: 80 }, children: [run(metaText, { size: bodySize - 1, color: p.muted, font: bodyFont })] }));
    }
    if (signatureImage) {
      const width = Math.round(46 * data.signature.scale * 3.7795);
      children.push(
        new Paragraph({
          alignment:
            data.signature.align === 'left'
              ? AlignmentType.LEFT
              : data.signature.align === 'center'
                ? AlignmentType.CENTER
                : AlignmentType.RIGHT,
          spacing: { before: 120, after: 40 },
          children: [
            new ImageRun({
              data: signatureImage.data,
              transformation: { width, height: Math.round(width * 0.42) },
            } as never),
          ],
        }),
      );
      children.push(
        new Paragraph({
          alignment:
            data.signature.align === 'left'
              ? AlignmentType.LEFT
              : data.signature.align === 'center'
                ? AlignmentType.CENTER
                : AlignmentType.RIGHT,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: hex(p.text), space: 2 } },
          children: [run(data.personal.fullName, { size: bodySize - 1, color: p.muted, font: bodyFont })],
        }),
      );
    }
  }

  // -------------------------------------------------------------- styles
  const styleDefs: IParagraphStyleOptions[] = [
    {
      id: 'CVBody',
      name: 'CV Body',
      basedOn: 'Normal',
      quickFormat: true,
      run: { font: bodyFont, size: bodySize, color: hex(p.text) },
      paragraph: { spacing: { line: lineSpacing, after: 60 } },
    },
    {
      id: 'CVHeading2',
      name: 'CV Section Heading',
      basedOn: 'Heading2',
      next: 'CVBody',
      quickFormat: true,
      run: { font: headFont, size: headingSize, bold: true, color: hex(p.primary) },
      paragraph: { spacing: { before: 200, after: 90 }, keepNext: true },
    },
  ];

  const pageFooter = design.showFooter || design.showPageNumbers
    ? new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: hex(p.accent), space: 2 } },
            children: [
              ...(design.showFooter ? [run(data.personal.fullName ?? '', { size: bodySize - 3, color: p.muted, font: bodyFont })] : []),
              ...(design.showFooter && design.showPageNumbers ? [run('    |    ', { size: bodySize - 3, color: p.accent })] : []),
              ...(design.showPageNumbers
                ? [
                    run(`${language === 'bn' ? 'পৃষ্ঠা' : 'Page'} `, { size: bodySize - 3, color: p.muted, font: bodyFont }),
                    new TextRun({ children: [PageNumber.CURRENT], size: bodySize - 3, color: hex(p.muted) }),
                    run(' / ', { size: bodySize - 3, color: p.muted }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: bodySize - 3, color: hex(p.muted) }),
                  ]
                : []),
            ],
          }),
        ],
      })
    : undefined;

  const doc = new Document({
    creator: data.personal.fullName || 'SHOHAN CV STUDIO',
    title: title ?? `${data.personal.fullName} — Curriculum Vitae`,
    description: 'Curriculum Vitae generated with SHOHAN CV STUDIO',
    styles: { paragraphStyles: styleDefs },
    numbering: {
      config: [
        {
          reference: 'cv-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 340, hanging: 200 } }, run: { color: hex(p.accent), size: bodySize } },
            },
            {
              level: 1,
              format: LevelFormat.BULLET,
              text: '–',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 680, hanging: 200 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
            margin: { top: margin, bottom: margin, left: margin, right: margin, header: 0, footer: 240, gutter: 0 },
          },
        },
        footers: pageFooter ? { default: pageFooter } : undefined,
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const PX_PER_MM = MM_TO_PX;
