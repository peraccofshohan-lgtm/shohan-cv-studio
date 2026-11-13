/**
 * Colour helpers.
 *
 * We deliberately avoid CSS `color-mix()` so that the design renders identically
 * on Chromium 108 (Electron 22, the Windows 7-compatible runtime).
 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): Rgb {
  const clean = String(hex ?? '').replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** Mix two hex colours: weight applies to `a`. */
export function mixHex(a: string, b: string, weight = 0.5): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const w = Math.max(0, Math.min(1, weight));
  const to = (x: number, y: number) => Math.round(x * w + y * (1 - w));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(to(ca.r, cb.r))}${hex(to(ca.g, cb.g))}${hex(to(ca.b, cb.b))}`;
}

export function darken(hex: string, amount = 0.14): string {
  return mixHex(hex, '#000000', 1 - amount);
}

export function lighten(hex: string, amount = 0.12): string {
  return mixHex(hex, '#ffffff', 1 - amount);
}

/** Relative luminance (WCAG 2.1) for contrast checks. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
