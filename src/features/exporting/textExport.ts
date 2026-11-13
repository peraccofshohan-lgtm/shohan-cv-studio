/**
 * Plain-text export.
 *
 * Many Bangladeshi and international employers still ask for a CV pasted into an
 * online form or an email body. This produces a clean, ATS-safe text version of
 * the SAME resolved section model the DOCX/PDF pipelines use — so the text can
 * never disagree with the document.
 *
 * Ordering, section titles, visible-section filtering and the "hide empty
 * sections" rule all come from the shared engine in src/lib/sections.ts.
 */
import type { CVData } from '@/types/cv';
import type { ProjectRecord } from '@/types/cv';
import { printableSections } from '@/lib/sections';
import { getBridge, isDesktop } from '@/platform';

export interface TextExportResult {
  /** How the text actually reached the user. */
  method: 'clipboard' | 'download';
  /** Human-readable detail for the confirmation toast. */
  detail: string;
}

/** Personal detail rows that are allowed to appear, per the project's privacy flags. */
function contactLines(data: CVData, language: 'bn' | 'en'): string[] {
  const v = data.personalDetails;
  const bn = language === 'bn';
  const lines: string[] = [];
  if (data.personal.mobile) lines.push(`${bn ? 'মোবাইল' : 'Mobile'}: ${data.personal.mobile}`);
  if (data.personal.altPhone && v.altPhone) {
    lines.push(`${bn ? 'বিকল্প ফোন' : 'Phone'}: ${data.personal.altPhone}`);
  }
  if (data.personal.email) lines.push(`${bn ? 'ইমেইল' : 'Email'}: ${data.personal.email}`);
  if (data.personal.presentAddress) {
    lines.push(`${bn ? 'ঠিকানা' : 'Address'}: ${data.personal.presentAddress}`);
  }
  if (data.personal.permanentAddress && v.permanentAddress) {
    lines.push(`${bn ? 'স্থায়ী ঠিকানা' : 'Permanent address'}: ${data.personal.permanentAddress}`);
  }
  if (data.personal.linkedin && v.linkedin) lines.push(`LinkedIn: ${data.personal.linkedin}`);
  if (data.personal.website && v.website) lines.push(`Website: ${data.personal.website}`);
  // Sensitive identifiers stay out unless the operator turned them on.
  if (v.dateOfBirth && data.personal.dateOfBirth) {
    lines.push(`${bn ? 'জন্ম তারিখ' : 'Date of birth'}: ${data.personal.dateOfBirth}`);
  }
  if (v.nationalId && data.personal.nationalId) {
    lines.push(`${bn ? 'জাতীয় পরিচয়পত্র' : 'National ID'}: ${data.personal.nationalId}`);
  }
  if (v.passportNo && data.personal.passportNo) {
    lines.push(`${bn ? 'পাসপোর্ট' : 'Passport'}: ${data.personal.passportNo}`);
  }
  return lines;
}

/** Builds the plain-text CV. Exported for tests and for the DOCX/text parity check. */
export function buildPlainText(project: ProjectRecord): string {
  const data = project.data;
  const language = data.language === 'bn' ? 'bn' : 'en';
  const sections = printableSections(data, { language });
  const out: string[] = [];

  out.push(data.personal.fullName || (language === 'bn' ? 'নাম' : 'Name'));
  if (data.personal.headline) out.push(data.personal.headline);
  out.push(...contactLines(data, language));
  out.push('');

  for (const section of sections) {
    out.push(section.title.toUpperCase());
    if (section.kind === 'paragraph') {
      for (const paragraph of section.paragraphs) out.push(paragraph);
    }
    if (section.kind === 'timeline') {
      for (const item of section.timeline) {
        const head = item.period ? `${item.title} — ${item.period}` : item.title;
        out.push(head);
        if (item.subtitle) out.push(item.subtitle);
        if (item.meta) out.push(item.meta);
        for (const bullet of item.bullets) out.push(`- ${bullet}`);
        if (item.body) out.push(item.body);
        out.push('');
      }
    }
    if (section.kind === 'chips') out.push(section.chips.join(', '));
    if (section.kind === 'simple-list' || section.kind === 'two-column-list') {
      out.push(section.list.join(', '));
    }
    if (section.kind === 'labelled-grid') {
      for (const row of section.labelled) out.push(`${row.label}: ${row.value}`);
    }
    out.push('');
  }

  if (data.signature.enabled && data.declaration.text) {
    out.push(language === 'bn' ? 'ঘোষণা' : 'DECLARATION');
    out.push(data.declaration.text);
    out.push('');
  }

  // Collapse runs of blank lines so pasted output looks deliberate.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function suggestedName(project: ProjectRecord): string {
  const base = (project.data.personal.fullName || 'CV').replace(/[\\/:*?"<>|]+/g, '-').trim();
  return `${base}-CV.txt`;
}

/**
 * Puts the plain-text CV on the clipboard, falling back to a file download when
 * the clipboard API is unavailable (older Electron, no permission, or a
 * non-secure context).
 */
export async function copyAsPlainText(project: ProjectRecord): Promise<TextExportResult> {
  const text = buildPlainText(project);

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return {
        method: 'clipboard',
        detail: `${text.split('\n').length} lines · ${text.length} characters`,
      };
    }
  } catch {
    /* fall through to the file path — never fail silently */
  }

  const bridge = getBridge();
  const bytes = new TextEncoder().encode(text);
  const result = await bridge.saveText({
    suggestedName: suggestedName(project),
    text,
    extensions: ['txt'],
  });
  if (!result.saved) {
    throw new Error(
      isDesktop() ? 'The save dialog was cancelled.' : 'The browser blocked the download.',
    );
  }
  return {
    method: 'download',
    detail: `${result.path ?? suggestedName(project)} · ${bytes.length} bytes`,
  };
}
