/**
 * Input sanitisation helpers.
 *
 * All user text is escaped before it reaches generated HTML, and filenames are
 * stripped of characters that Windows rejects. Nothing in the app interpolates
 * raw user input into markup.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
};

export function escapeHtml(value: string): string {
  return String(value ?? '').replace(/[&<>"'`]/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

/** Windows-safe filename with a sane length and no reserved names. */
export function safeFileName(input: string, fallback = 'document'): string {
  const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  let name = String(input ?? '')
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '');
  if (!name) name = fallback;
  if (reserved.test(name)) name = `_${name}`;
  return name.slice(0, 120);
}

/** Compose a file name from the operator's pattern, e.g. {name}_{template}_{date}. */
export function buildFileName(
  pattern: string,
  parts: { name: string; template: string; date?: Date; company?: string },
): string {
  const date = parts.date ?? new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const source = pattern || '{name}_{template}_{date}';
  return safeFileName(
    source
      .replace(/\{name\}/g, parts.name || 'CV')
      .replace(/\{template\}/g, parts.template || '')
      .replace(/\{date\}/g, dateStr)
      .replace(/\{company\}/g, parts.company ?? '')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, ''),
    'CV',
  );
}

/** Trim + collapse whitespace, strip control characters, cap length. */
export function cleanText(value: string, max = 4000): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .slice(0, max)
    .trim();
}

/** Basic URL validation — only http(s) and mailto are accepted. */
export function normalizeUrl(value: string): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw.slice(0, 500);
  if (/^mailto:/i.test(raw)) return raw.slice(0, 500);
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return `https://${raw}`.slice(0, 500);
  return '';
}

/** Loose email check used for inline validation (not for security decisions). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? '').trim());
}

/** Bangladeshi and international phone shapes. */
export function isPhone(value: string): boolean {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  return digits.length >= 7 && digits.length <= 17;
}
