/**
 * Per-section design overrides (Part 5).
 *
 * A section override changes only that section: its heading colour, heading
 * alignment, heading size relative to the document default, the gap above it,
 * its bullet marker, and whether it starts a new page. Nothing else in the
 * document moves, and no content is touched.
 *
 * The stored shape (`SectionStyleOverride`) has existed since schema v2; this
 * module turns it into (a) a sanitised, serialisable form and (b) the two
 * one-line CSS declarations the renderers need. Everything is pure so the
 * preview, DOCX, print and PDF payload read exactly the same values.
 */
import type { SectionId, SectionStyleOverride, TextAlign } from '@/types/cv';

export type BulletStyle = NonNullable<SectionStyleOverride['bulletStyle']>;

export const BULLET_STYLES: { id: BulletStyle; nameEn: string; nameBn: string; glyph: string }[] = [
  { id: 'dot', nameEn: 'Dot', nameBn: 'বিন্দু', glyph: '●' },
  { id: 'dash', nameEn: 'Dash', nameBn: 'ড্যাশ', glyph: '–' },
  { id: 'square', nameEn: 'Square', nameBn: 'বর্গ', glyph: '■' },
  { id: 'none', nameEn: 'None', nameBn: 'কোনোটি নয়', glyph: '—' },
];

export const HEADING_SCALE_MIN = 0.8;
export const HEADING_SCALE_MAX = 1.25;
/**
 * The gap multiplier can only *add* space. Making one section tighter than the
 * document rhythm is how text starts to collide with a rule or a heading, so
 * the slider stops at the document default (1) at the bottom end.
 */
export const SECTION_GAP_MIN = 1;
export const SECTION_GAP_MAX = 2.5;

const ALIGNS: TextAlign[] = ['left', 'center', 'right', 'justify'];

/** Colour keys must be a real 3/6-digit hex; anything else is dropped. */
function normalizeColor(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw.split('').map((c) => c + c).join('')}`.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase();
  return null;
}

function clampNumber(value: unknown, min: number, max: number): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n)) return undefined;
  return Math.min(max, Math.max(min, Math.round(n * 100) / 100));
}

/**
 * Sanitise one override. Returns `null` when nothing meaningful is set, so the
 * store never accumulates empty objects that would defeat the "is it
 * overridden?" check in the UI.
 */
export function normalizeSectionOverride(input: SectionStyleOverride | undefined | null): SectionStyleOverride | null {
  if (!input) return null;
  const next: SectionStyleOverride = {};

  const color = normalizeColor(input.headingColor);
  if (color) next.headingColor = color;
  if (input.headingAlign && ALIGNS.includes(input.headingAlign)) next.headingAlign = input.headingAlign;
  const scale = clampNumber(input.headingScale, HEADING_SCALE_MIN, HEADING_SCALE_MAX);
  if (scale !== undefined) next.headingScale = scale;
  const spacing = clampNumber(input.paragraphSpacing, SECTION_GAP_MIN, SECTION_GAP_MAX);
  if (spacing !== undefined) next.paragraphSpacing = spacing;
  if (input.bulletStyle && BULLET_STYLES.some((b) => b.id === input.bulletStyle)) {
    next.bulletStyle = input.bulletStyle;
  }
  if (input.pageBreakBefore === true) next.pageBreakBefore = true;

  return Object.keys(next).length > 0 ? next : null;
}

/** The override for a section, or `null` when it uses the document default. */
export function overrideFor(
  styles: Partial<Record<SectionId, SectionStyleOverride>> | undefined,
  id: SectionId,
): SectionStyleOverride | null {
  return normalizeSectionOverride(styles?.[id]);
}

/** True when this section carries at least one override. */
export function hasOverride(
  styles: Partial<Record<SectionId, SectionStyleOverride>> | undefined,
  id: SectionId,
): boolean {
  return overrideFor(styles, id) !== null;
}

/** Store a (sanitised) override, or clear it when everything is at default. */
export function setOverride(
  styles: Partial<Record<SectionId, SectionStyleOverride>> | undefined,
  id: SectionId,
  next: SectionStyleOverride | null,
): Partial<Record<SectionId, SectionStyleOverride>> {
  const copy = { ...(styles ?? {}) };
  const clean = normalizeSectionOverride(next);
  if (clean) copy[id] = clean;
  else delete copy[id];
  return copy;
}

/**
 * The CSS custom properties that carry this section's override.
 *
 * Emitted as an inline `style` on the `<section>` element, so the same markup is
 * used by the screen preview, the print document and the PDF payload. The
 * declarations only ever *read* existing variables (`--accent`, `--gap`) or set
 * a literal value, which keeps the cascade predictable and avoids a second
 * stylesheet for exports.
 */
export interface SectionCssVars {
  [key: `--${string}`]: string;
}

export function sectionCssVars(override: SectionStyleOverride | null): SectionCssVars {
  const vars: SectionCssVars = {};
  if (!override) return vars;
  if (override.headingColor) {
    vars['--sec-heading'] = override.headingColor;
    vars['--sec-rule'] = override.headingColor;
  }
  if (override.headingScale !== undefined) vars['--sec-heading-scale'] = String(override.headingScale);
  if (override.headingAlign) vars['--sec-heading-align'] = override.headingAlign;
  if (override.paragraphSpacing !== undefined) vars['--sec-gap-mul'] = String(override.paragraphSpacing);
  if (override.bulletStyle) vars['--sec-bullet'] = bulletGlyph(override.bulletStyle);
  return vars;
}

/** The character printed before a bullet, or '' for the "none" style. */
export function bulletGlyph(style: BulletStyle): string {
  switch (style) {
    case 'dot':
      return '•';
    case 'dash':
      return '–';
    case 'square':
      return '▪';
    case 'none':
      return '';
    default:
      return '•';
  }
}

/**
 * Sections that start a new page: the explicit page policy from the page-length
 * panel plus any section marked "start on a new page" in its own override.
 * Deduplicated, so a section never produces two breaks.
 */
export function sectionsStartingNewPage(
  breakBefore: readonly string[] | undefined,
  styles: Partial<Record<SectionId, SectionStyleOverride>> | undefined,
): Set<string> {
  const set = new Set<string>(breakBefore ?? []);
  for (const [id, override] of Object.entries(styles ?? {})) {
    if (override?.pageBreakBefore) set.add(id);
  }
  return set;
}

/** One-line summary for the editor, e.g. "Heading colour · Bullets". */
export function describeOverride(override: SectionStyleOverride | null, lang: 'bn' | 'en'): string {
  if (!override) return lang === 'bn' ? 'ডিফল্ট' : 'Document default';
  const parts: string[] = [];
  if (override.headingColor) parts.push(lang === 'bn' ? 'শিরোনামের রঙ' : 'Heading colour');
  if (override.headingAlign) parts.push(lang === 'bn' ? 'শিরোনামের অবস্থান' : 'Heading align');
  if (override.headingScale !== undefined) parts.push(lang === 'bn' ? 'শিরোনামের আকার' : 'Heading size');
  if (override.paragraphSpacing !== undefined) parts.push(lang === 'bn' ? 'সেকশন ফাঁক' : 'Section gap');
  if (override.bulletStyle) parts.push(lang === 'bn' ? 'বুলেট' : 'Bullets');
  if (override.pageBreakBefore) parts.push(lang === 'bn' ? 'নতুন পৃষ্ঠা' : 'New page');
  return parts.join(' · ');
}
