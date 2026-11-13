/**
 * Golden Ratio design mathematics.
 *
 * φ = 1.6180339887
 *
 * The product uses φ for composition (major/minor splits, card ratios,
 * type hierarchy) and an 8-point grid for spacing rhythm. Usability always
 * wins: every helper clamps to practical document/UI ranges.
 */

export const PHI = 1.6180339887;
export const PHI_SQ = PHI * PHI; // 2.618
export const BASE = 8; // 8-point spacing grid

/** Golden split: returns the major (0.618) and minor (0.382) share of a length. */
export function goldenSplit(total: number): { major: number; minor: number } {
  const major = (total * PHI) / (1 + PHI);
  return { major: round1(major), minor: round1(total - major) };
}

/** Spacing token on the 8-point grid (n = grid units). */
export function rhythm(n: number): number {
  return n * BASE;
}

/** Modular type scale anchored at `base` (default 16px) using φ for display steps. */
export function typeScale(step: number, base = 16): number {
  return round1(base * Math.pow(PHI, step / 2));
}

/** Distance in px for a millimetre measurement at 96 CSS dpi. */
export const MM_TO_PX = 96 / 25.4;
export function mm(v: number): number {
  return round1(v * MM_TO_PX);
}

/** A4 in millimetres and pixels (96dpi). */
export const A4 = {
  widthMm: 210,
  heightMm: 297,
  widthPx: 793.7,
  heightPx: 1122.5,
  aspect: 210 / 297,
} as const;

/** Composition helper: sidebar width from a window width, golden-ratio balanced. */
export function shellLayout(windowWidth: number): { sidebar: number; content: number } {
  const sidebarRaw = windowWidth * 0.205; // just under 1/φ² — proven comfortable
  const sidebar = Math.max(216, Math.min(300, Math.round(sidebarRaw / 8) * 8));
  return { sidebar, content: windowWidth - sidebar };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
