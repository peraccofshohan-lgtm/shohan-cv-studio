/**
 * Document composition resolver.
 *
 * Turns the per-project *design* and *document* controls into one flat,
 * serialisable token bag (`DocumentTokens`) and one layout report. The preview,
 * the print document, the PDF payload and the DOCX exporter all read this same
 * object, which is how "what you see is what exports" is enforced structurally
 * rather than by convention.
 *
 * Everything here is pure: no React, no DOM, no platform access. That keeps it
 * unit-testable and safe to run inside the DOCX generator and in Node tests.
 */
import type {
  CVData,
  DesignOverrides,
  DocumentTitleTokens,
  FontRole,
  PageLengthMode,
  SpacingToken,
  TextAlign,
} from '@/types/cv';
import type { ResolvedDesign } from '@/templates/catalog';
import { TITLE_PRESET_TEXT } from '@/types/cv';

/* ------------------------------------------------------------------ density */

export const DENSITY_PRESETS = {
  compact: {
    id: 'compact',
    name: 'Compact',
    nameBn: 'সংকুচিত',
    bodyScale: 0.94,
    lineHeight: 1.38,
    sectionSpacing: 0.78,
    entryGap: 0.72,
    paragraphGap: 0.72,
    /** Compact mode still keeps ≥ 9pt body text. */
    minBodyPt: 9,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    nameBn: 'ভারসাম্যপূর্ণ',
    bodyScale: 1,
    lineHeight: 1.5,
    sectionSpacing: 1,
    entryGap: 1,
    paragraphGap: 1,
    minBodyPt: 9.5,
  },
  spacious: {
    id: 'spacious',
    name: 'Spacious',
    nameBn: 'প্রশস্ত',
    bodyScale: 1.03,
    lineHeight: 1.62,
    sectionSpacing: 1.24,
    entryGap: 1.22,
    paragraphGap: 1.2,
    minBodyPt: 10,
  },
} as const;

export type DensityId = keyof typeof DENSITY_PRESETS;

/* -------------------------------------------------------------------- units */

export type LengthUnit = 'mm' | 'pt' | 'in' | 'px';

export const MM_PER_UNIT: Record<LengthUnit, number> = {
  mm: 1,
  pt: 25.4 / 72.2705, // 1 pt = 0.35278 mm (A4/TeX point, matches 2.9528 px)
  in: 25.4,
  px: 25.4 / 96,
};

/** Convert a length in `unit` into millimetres. */
export function toMm(value: number, unit: LengthUnit): number {
  return value * MM_PER_UNIT[unit];
}

/** Convert millimetres into `unit`. */
export function fromMm(valueMm: number, unit: LengthUnit): number {
  return valueMm / MM_PER_UNIT[unit];
}

/** A4 sheet in millimetres — the single source of truth for page geometry. */
export const A4 = { widthMm: 210, heightMm: 297 } as const;

/* ------------------------------------------------------------------- tokens */

export interface DocumentMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TypographyRole {
  /** CSS font stack. */
  family: string;
  /** Points. */
  sizePt: number;
  weight: number;
  italic: boolean;
  underline: boolean;
  /** em. */
  letterSpacing: number;
  /** Unitless multiplier. */
  lineHeight: number;
  /** Text-transform applied by the renderer. */
  transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  /** Hex colour resolved from palette + overrides. */
  color: string;
}

export interface DocumentTokens {
  margins: DocumentMargins;
  density: DensityId;
  typography: Record<FontRole, TypographyRole>;
  spacing: Record<SpacingToken, number>;
  bodyAlign: TextAlign;
  paragraphIndentMm: number;
  title: DocumentTitleTokens;
  photo: {
    sizeMm: number;
    borderMm: number;
    borderColor: string;
    shape: ResolvedDesign['photoShape'];
    position: 'left' | 'right';
  };
  colors: ResolvedDesign['palette'];
  pageLength: {
    mode: PageLengthMode;
    maxPages: number;
    breakBefore: string[];
    keepTogether: boolean;
  };
}

/* ------------------------------------------------------------- title engine */

/**
 * Resolve the title block. Returns `visible: false` and empty text when the
 * operator chose "No title" — the renderer then emits no element at all, so no
 * empty band or stray margin can appear.
 */
export function resolveTitle(data: CVData): DocumentTitleTokens {
  const t = data.title;
  const raw =
    t.preset === 'none'
      ? ''
      : t.preset === 'custom'
        ? (t.text ?? '').trim()
        : TITLE_PRESET_TEXT[t.preset] || (t.text ?? '').trim();

  const visible = t.visible && t.preset !== 'none' && raw.length > 0;

  return {
    visible,
    text: visible ? applyTransform(raw, t.transform) : '',
    /** Untransformed text, used by DOCX/HTML exporters that set case themselves. */
    rawText: visible ? raw : '',
    fontFamily: t.fontFamily,
    sizePt: t.fontSize,
    weight: t.fontWeight,
    italic: t.italic,
    underline: t.underline,
    color: t.color,
    align: t.align,
    letterSpacing: t.letterSpacing,
    spaceBeforeMm: visible ? t.spaceBeforeMm : 0,
    /** With no title there is nothing to separate from the contact block. */
    spaceAfterMm: visible ? t.spaceAfterMm : 0,
    border: t.border,
    background: t.background,
    backgroundPaddingMm: t.background === 'none' ? 0 : t.backgroundPaddingMm,
    accentLine: visible && t.accentLine,
    position: t.position,
  };
}

export function applyTransform(value: string, transform: DocumentTitleTokens['transform']): string {
  switch (transform) {
    case 'uppercase':
      // `toUpperCase` is locale-insensitive here on purpose: Bangla has no case,
      // and Turkish-style dotless i is not relevant for bn/en documents.
      return value.toUpperCase();
    case 'lowercase':
      return value.toLowerCase();
    case 'capitalize':
      return value
        .split(/\s+/)
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
        .join(' ');
    default:
      return value;
  }
}

/* ------------------------------------------------------------ spacing table */

/** Spacing tokens expressed as multipliers of the template's rhythm. */
const DEFAULT_SPACING: Record<SpacingToken, number> = {
  header: 1,
  nameContact: 1,
  title: 1,
  sectionHeading: 1,
  sectionGap: 1,
  paragraph: 1,
  bullet: 1,
  line: 1,
  column: 1,
  photo: 1,
  footer: 1,
  pageBreak: 1,
};

/** Base millimetre values before multipliers (A4, 16 mm margins). */
export const SPACING_BASE_MM: Record<SpacingToken, number> = {
  header: 3.4,
  nameContact: 2.6,
  title: 1.2,
  sectionHeading: 2.4,
  sectionGap: 5.2,
  paragraph: 1.4,
  bullet: 0.7,
  line: 0,
  column: 7,
  photo: 6,
  footer: 1.6,
  pageBreak: 0,
};

/* --------------------------------------------------------------- main entry */

export interface ComposeOptions {
  data: CVData;
  design: ResolvedDesign;
  overrides?: DesignOverrides;
  /** Approximate page count used only to seed the title's page-length policy. */
  pageCount?: number;
}

/**
 * Build the flat token bag consumed by every renderer.
 *
 * Precedence (lowest → highest): template layout → density preset → explicit
 * `DesignOverrides` values → per-project document settings.
 */
export function composeDocumentTokens({
  data,
  design,
  overrides = {} as DesignOverrides,
}: ComposeOptions): DocumentTokens {
  const densityId = (overrides.density ?? 'balanced') as DensityId;
  const density = DENSITY_PRESETS[densityId] ?? DENSITY_PRESETS.balanced;
  const colors = { ...design.palette, ...cleanColors(overrides.colors) };

  const margins: DocumentMargins = overrides.margins
    ? {
        top: clamp(overrides.margins.top, 6, 40),
        right: clamp(overrides.margins.right, 6, 40),
        bottom: clamp(overrides.margins.bottom, 6, 40),
        left: clamp(overrides.margins.left, 6, 40),
      }
    : {
        top: design.marginMm,
        right: design.marginMm,
        bottom: design.marginMm,
        left: design.marginMm,
      };

  const spacingUser = overrides.spacing ?? {};
  // Density is applied to real spacing tokens here — not just to the visual
  // type scale — so "Compact" genuinely fits more and "Spacious" genuinely
  // breathes. Explicit per-token overrides then multiply on top.
  const densitySpacing: Record<SpacingToken, number> = {
    ...DEFAULT_SPACING,
    sectionGap: density.sectionSpacing,
    paragraph: density.paragraphGap,
    bullet: density.paragraphGap,
    line: density.lineHeight / 1.5,
  };
  const spacing = Object.fromEntries(
    (Object.keys(densitySpacing) as SpacingToken[]).map((key) => {
      const base = densitySpacing[key] * (spacingUser[key] ?? 1);
      return [key, round2(base)];
    }),
  ) as Record<SpacingToken, number>;

  const bodyPt = Math.max(density.minBodyPt, 9.9 * design.bodyScale * density.bodyScale);
  const namePt = overrides.nameSizePt ?? 23 * design.headingScale;
  const headingPt = Math.max(9, 10.2 * design.headingScale);

  const bodyFamily = design.fontPair.body;
  const headFamily = design.fontPair.display;
  const roles = overrides.fontRoles ?? {};
  const roleFamily = (role: FontRole, fallback: string): string => {
    const custom = roles[role];
    return custom && custom.trim().length > 0 ? custom : fallback;
  };

  const typography: Record<FontRole, TypographyRole> = {
    name: role(roleFamily('name', headFamily), namePt, 700, -0.012, design.lineHeight, data),
    title: role(roleFamily('title', headFamily), overrides.titleSizePt ?? data.title.fontSize, 600, 0.14, 1.2, data),
    heading: role(roleFamily('heading', headFamily), headingPt, 700, design.upperHeadings ? 0.11 : 0.005, 1.25, data),
    subheading: role(roleFamily('subheading', headFamily), bodyPt + 0.4, 650, 0, design.lineHeight, data),
    body: role(roleFamily('body', bodyFamily), bodyPt, 400, 0, design.lineHeight * density.lineHeight / 1.5, data),
    contact: role(roleFamily('contact', bodyFamily), bodyPt - 0.6, 400, 0.01, 1.4, data),
    dates: role(roleFamily('dates', bodyFamily), bodyPt - 0.8, 400, 0, 1.35, data),
    bullets: role(roleFamily('bullets', bodyFamily), bodyPt - 0.3, 400, 0, design.lineHeight, data),
    footer: role(roleFamily('footer', bodyFamily), bodyPt - 1.6, 400, 0, 1.3, data),
    pageNumbers: role(roleFamily('pageNumbers', bodyFamily), bodyPt - 1.6, 400, 0.02, 1.3, data),
  };

  // Colours: the title/heading roles follow the palette unless overridden.
  typography.heading.color = colors.heading ?? colors.primary;
  typography.subheading.color = colors.heading ?? colors.primary;
  typography.body.color = colors.text;
  typography.bullets.color = colors.text;
  typography.contact.color = colors.muted;
  typography.dates.color = colors.muted;
  typography.footer.color = colors.muted;
  typography.pageNumbers.color = colors.muted;
  typography.name.color = colors.primary;

  const title = resolveTitle(data);
  title.color = title.color ?? colors.muted;

  const photoBorderWidth = { none: 0, thin: 0.3, medium: 0.6, thick: 1 } as const;

  return {
    margins,
    density: densityId,
    typography,
    spacing,
    bodyAlign: overrides.bodyAlign ?? 'justify',
    paragraphIndentMm: overrides.paragraphIndentMm ?? 0,
    title,
    photo: {
      sizeMm: overrides.photoSizeMm ?? data.photo.frameSize ?? 30,
      borderMm: photoBorderWidth[overrides.photoBorder ?? 'none'],
      borderColor: overrides.photoBorderColor ?? colors.photoBorder ?? colors.accent,
      shape: design.photoShape,
      position: design.photoPosition,
    },
    colors: {
      ...colors,
      heading: colors.heading ?? colors.primary,
      border: colors.border ?? colors.text,
      divider: colors.divider ?? colors.text,
      background: colors.background ?? '#ffffff',
      headerBackground: colors.headerBackground ?? colors.primary,
      footerBackground: colors.footerBackground ?? '#ffffff',
    },
    pageLength: {
      mode: data.pageLength?.mode ?? 'automatic',
      maxPages: data.pageLength?.maxPages ?? 4,
      breakBefore: data.pageLength?.breakBefore ?? [],
      keepTogether: data.pageLength?.keepTogether ?? true,
    },
  };
}

function role(
  family: string,
  sizePt: number,
  weight: number,
  letterSpacing: number,
  lineHeight: number,
  data: CVData,
): TypographyRole {
  return {
    family,
    sizePt: round2(sizePt),
    weight,
    italic: false,
    underline: false,
    letterSpacing,
    lineHeight: round2(lineHeight),
    transform: 'none',
    color: data.title.color ?? '#000000',
  };
}

/** Drop empty/invalid hex values so a cleared colour input falls back cleanly. */
function cleanColors(input: DesignOverrides['colors']): Partial<ResolvedDesign['palette']> {
  if (!input) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim())) {
      out[key] = value.trim();
    }
  }
  return out as Partial<ResolvedDesign['palette']>;
}

export const clamp = (value: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

const round2 = (v: number): number => Math.round(v * 100) / 100;
