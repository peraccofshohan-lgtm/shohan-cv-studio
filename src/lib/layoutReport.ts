/**
 * Layout diagnostics + composition report.
 *
 * Pure function over the resolved section model. It answers three questions the
 * operator actually asks before exporting:
 *
 *   1. Will this fit the page-length target I chose? (never by deleting content)
 *   2. Is anything in the document going to look wrong? (orphans, runaways,
 *      duplicated skills, half-empty final page …)
 *   3. Is the document readable by an ATS parser and complete enough to send?
 *
 * The numbers come from measured typography (point sizes, line heights, the A4
 * text box), not from character counts, so a compact Bengali CV and a spacious
 * English one are estimated on the same physical basis.
 */
import type { CVData, LayoutDiagnostic, SectionId } from '@/types/cv';
import type { ResolvedSection } from '@/lib/sections';
import { A4, type DocumentTokens } from '@/lib/composition';

/* --------------------------------------------------------------- estimation */

/** Points (1/72.27 in) to millimetres. */
const PT_TO_MM = 25.4 / 72.2705;

export interface FitEstimate {
  /** Estimated used height of the first page, in mm. */
  contentMm: number;
  /** Printable height of one page, in mm. */
  pageHeightMm: number;
  /** Estimated page count. */
  pages: number;
  /** How full the *last* page is (0–1). */
  lastPageFill: number;
  /** Breakdown per section, used by the whitespace diagnostics. */
  perSection: { id: SectionId; heightMm: number }[];
}

export interface LayoutReport {
  estimate: FitEstimate;
  diagnostics: LayoutDiagnostic[];
  /** Fits the operator's chosen page-length policy? */
  fitsTarget: boolean;
  targetLabel: string;
  /** Page count the document will actually occupy. */
  pages: number;
}

/**
 * Estimate how much vertical space a block of text needs.
 *
 * `charsPerLine` is derived from the real text width and the average advance
 * width of the body font (≈0.5 em for Inter/Noto Sans Bengali at these sizes).
 */
function textHeightMm(text: string, tokens: DocumentTokens, widthMm: number, sizePt?: number): number {
  const pt = sizePt ?? tokens.typography.body.sizePt;
  const mmPerLine = pt * PT_TO_MM * tokens.typography.body.lineHeight;
  const avgAdvance = pt * PT_TO_MM * 0.5;
  const charsPerLine = Math.max(12, Math.floor(widthMm / avgAdvance));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * mmPerLine;
}

export function estimateFit(sections: ResolvedSection[], tokens: DocumentTokens, hasPhoto: boolean): FitEstimate {
  const pageHeightMm = A4.heightMm - tokens.margins.top - tokens.margins.bottom;
  const widthMm = A4.widthMm - tokens.margins.left - tokens.margins.right;
  const sectionGapMm = tokens.spacing.sectionGap * 1.82;
  const headingGapMm = tokens.spacing.sectionHeading * 2.4;

  let total = 0;
  const perSection: { id: SectionId; heightMm: number }[] = [];

  // Header: name + title + contact lines + photo column.
  const nameMm = tokens.typography.name.sizePt * PT_TO_MM * 1.12;
  const titleMm = tokens.title.visible
    ? tokens.title.sizePt * PT_TO_MM * 1.25 + tokens.title.spaceBeforeMm + tokens.title.spaceAfterMm
    : 0;
  const contactLines = 2;
  const contactMm = contactLines * tokens.typography.contact.sizePt * PT_TO_MM * 1.4 + tokens.spacing.nameContact * 2.6;
  const photoMm = hasPhoto ? tokens.photo.sizeMm : 0;
  const headerMm = Math.max(nameMm + titleMm + contactMm, photoMm) + tokens.spacing.header * 3.4;
  total += headerMm;

  for (const section of sections) {
    if (!section.enabled || !section.hasContent) continue;
    let h = headingGapMm + tokens.typography.heading.sizePt * PT_TO_MM * 1.25;

    for (const paragraph of section.paragraphs) h += textHeightMm(paragraph, tokens, widthMm) + 1.4;
    for (const item of section.timeline) {
      h += tokens.typography.subheading.sizePt * PT_TO_MM * 1.3;
      if (item.subtitle) h += tokens.typography.body.sizePt * PT_TO_MM * 1.25;
      if (item.period) h += 0;
      for (const bullet of item.bullets) {
        h += textHeightMm(bullet, tokens, widthMm - 4, tokens.typography.bullets.sizePt) + 0.7;
      }
      if (item.body) h += textHeightMm(item.body, tokens, widthMm) + 1.2;
      h += 3.1; // entry gap
    }
    if (section.chips.length > 0) {
      const chipH = 4.6;
      const perRow = Math.max(1, Math.floor(widthMm / 26));
      h += Math.ceil(section.chips.length / perRow) * chipH;
    }
    if (section.list.length > 0) {
      const perRow = 2;
      h += Math.ceil(section.list.length / perRow) * 4.2;
    }
    if (section.labelled.length > 0) {
      const perRow = section.labelled.length <= 3 ? 1 : 2;
      h += Math.ceil(section.labelled.length / perRow) * 4.4;
    }

    total += h + sectionGapMm;
    perSection.push({ id: section.id, heightMm: Math.round(h * 10) / 10 });
  }

  // Tail (declaration/signature) is part of `sections` already.
  const pages = Math.max(1, Math.ceil(total / pageHeightMm));
  const lastPageFill = pages === 1 ? Math.min(1, total / pageHeightMm) : (total - (pages - 1) * pageHeightMm) / pageHeightMm;

  return {
    contentMm: Math.round(total * 10) / 10,
    pageHeightMm: Math.round(pageHeightMm * 10) / 10,
    pages,
    lastPageFill: Math.max(0, Math.min(1, lastPageFill)),
    perSection,
  };
}

/* -------------------------------------------------------------- diagnostics */

const longBullet = (value: string): boolean => value.trim().split(/\s+/).length > 32;

/**
 * Build the full layout report: fit estimate, whitespace/orphan diagnostics and
 * the page-length verdict.
 */
export function buildLayoutReport(
  data: CVData,
  sections: ResolvedSection[],
  tokens: DocumentTokens,
  options: { language: 'bn' | 'en'; hasPhoto: boolean },
): LayoutReport {
  const estimate = estimateFit(sections, tokens, options.hasPhoto);
  const diagnostics: LayoutDiagnostic[] = [];
  const mode = tokens.pageLength.mode;

  /* ---------------------------------------------------------- page length */
  if (mode === 'one-page' && estimate.pages > 1) {
    diagnostics.push({
      level: 'warning',
      code: 'PAGE_OVERFLOW',
      messageEn: `The content needs about ${estimate.pages} A4 pages but this CV is set to exactly one page. Nothing has been removed — shorten the text, switch to the two-page layout, or choose automatic pagination.`,
      messageBn: `বিষয়বস্তুর জন্য প্রায় ${estimate.pages}টি A4 পৃষ্ঠা প্রয়োজন, কিন্তু এই সিভি এক পৃষ্ঠায় সীমাবদ্ধ। কোনো তথ্য মুছে ফেলা হয়নি — লেখা সংক্ষিপ্ত করুন, দুই পৃষ্ঠার লেআউট বেছে নিন, অথবা স্বয়ংক্রিয় পৃষ্ঠা সংখ্যা চালু করুন।`,
    });
  }
  if (mode === 'two-pages' && estimate.pages > 2) {
    diagnostics.push({
      level: 'warning',
      code: 'PAGE_OVERFLOW',
      messageEn: `The content needs about ${estimate.pages} A4 pages but this CV targets two. Nothing has been removed.`,
      messageBn: `বিষয়বস্তুর জন্য প্রায় ${estimate.pages}টি পৃষ্ঠা প্রয়োজন, কিন্তু লক্ষ্য দুই পৃষ্ঠা। কোনো তথ্য মুছে ফেলা হয়নি।`,
    });
  }
  if (estimate.pages > tokens.pageLength.maxPages) {
    diagnostics.push({
      level: 'warning',
      code: 'PAGE_OVERFLOW',
      messageEn: `This CV is estimated at ${estimate.pages} pages, above the maximum of ${tokens.pageLength.maxPages} you set. Content is never cut automatically.`,
      messageBn: `এই সিভির আনুমানিক দৈর্ঘ্য ${estimate.pages} পৃষ্ঠা, যা আপনার নির্ধারিত সর্বোচ্চ ${tokens.pageLength.maxPages} পৃষ্ঠার বেশি। তথ্য স্বয়ংক্রিয়ভাবে কাটা হয় না।`,
    });
  }
  if (estimate.pages > 1 && estimate.lastPageFill < 0.22) {
    diagnostics.push({
      level: 'info',
      code: 'ALMOST_EMPTY_LAST_PAGE',
      messageEn: `The last page is only about ${Math.round(estimate.lastPageFill * 100)}% full. Tighten the spacing or move a short section up to avoid an almost-empty page.`,
      messageBn: `শেষ পৃষ্ঠাটি প্রায় ${Math.round(estimate.lastPageFill * 100)}% পূর্ণ। স্পেসিং কমিয়ে দিন অথবা ছোট সেকশনটি উপরে আনুন যাতে প্রায়-খালি পৃষ্ঠা না থাকে।`,
    });
  }
  if (mode === 'automatic' && estimate.pages === 1 && estimate.lastPageFill < 0.55) {
    diagnostics.push({
      level: 'info',
      code: 'PAGE_UNDERFLOW',
      messageEn: `Page one is only about ${Math.round(estimate.lastPageFill * 100)}% full. A roomier density or more detail would use the sheet better.`,
      messageBn: `প্রথম পৃষ্ঠাটি প্রায় ${Math.round(estimate.lastPageFill * 100)}% পূর্ণ। প্রশস্ত ডেনসিটি বা বেশি তথ্য দিলে পৃষ্ঠাটি আরও ভালোভাবে ব্যবহৃত হবে।`,
    });
  }

  /* ------------------------------------------- orphans and section balance */
  for (const section of sections) {
    const rendered = section.enabled && section.hasContent;
    if (!rendered && section.enabled) {
      diagnostics.push({
        level: 'info',
        code: 'EMPTY_SECTION',
        sectionId: section.id,
        messageEn: `“${section.title}” is switched on but has no content, so it is omitted from every export.`,
        messageBn: `“${section.title}” চালু আছে কিন্তু কোনো তথ্য নেই, তাই কোনো এক্সপোর্টে এটি আসবে না।`,
      });
    }
    if (!rendered) continue;

    const height = estimate.perSection.find((s) => s.id === section.id)?.heightMm ?? 0;
    if (height > estimate.pageHeightMm * 0.62) {
      diagnostics.push({
        level: 'info',
        code: 'ORPHAN_HEADING_RISK',
        sectionId: section.id,
        messageEn: `“${section.title}” is taller than half a page, so it will continue onto the next page. Its heading is kept with the first entry.`,
        messageBn: `“${section.title}” অর্ধ পৃষ্ঠার চেয়ে বড়, তাই এটি পরের পৃষ্ঠায় চলবে। শিরোনামটি প্রথম এন্ট্রির সঙ্গে রাখা হয়েছে।`,
      });
    }
    const bullets = section.timeline.flatMap((t) => t.bullets);
    if (bullets.some(longBullet)) {
      diagnostics.push({
        level: 'info',
        code: 'OVERLONG_BULLET',
        sectionId: section.id,
        messageEn: `“${section.title}” contains a bullet longer than 32 words. Shorter bullets read better and print more evenly.`,
        messageBn: `“${section.title}”-এ ৩২ শব্দের বেশি একটি বুলেট আছে। ছোট বুলেট পড়তে ও ছাপাতে ভালো লাগে।`,
      });
    }
  }

  const names = data.skills.map((s) => s.name.trim().toLowerCase()).filter(Boolean);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    diagnostics.push({
      level: 'warning',
      code: 'DUPLICATE_SKILL',
      messageEn: `Duplicate skill${duplicates.length > 1 ? 's' : ''}: ${[...new Set(duplicates)].join(', ')}.`,
      messageBn: `পুনরাবৃত্ত দক্ষতা: ${[...new Set(duplicates)].join(', ')}।`,
    });
  }

  const objective = data.careerObjective?.text ?? '';
  if (objective.trim().split(/\s+/).filter(Boolean).length > 110) {
    diagnostics.push({
      level: 'info',
      code: 'OVERLONG_OBJECTIVE',
      sectionId: 'careerObjective',
      messageEn: 'The career objective is longer than 110 words. Two or three sentences are usually strongest.',
      messageBn: 'ক্যারিয়ার অবজেক্টিভ ১১০ শব্দের বেশি। দুই-তিন বাক্যই সাধারণত সবচেয়ে কার্যকর।',
    });
  }

  for (const entry of data.experience) {
    if (!entry.startDate) {
      diagnostics.push({
        level: 'warning',
        code: 'MISSING_DATE',
        sectionId: 'experience',
        messageEn: `“${entry.jobTitle || 'Work experience'}” has no start date. Incomplete dates are the most common reason a CV is rejected at screening.`,
        messageBn: `“${entry.jobTitle || 'কর্ম অভিজ্ঞতা'}”-এ শুরুর তারিখ নেই। অসম্পূর্ণ তারিখই স্ক্রিনিংয়ে বাতিল হওয়ার সবচেয়ে সাধারণ কারণ।`,
      });
    }
  }

  if (options.hasPhoto && tokens.photo.sizeMm > 40) {
    diagnostics.push({
      level: 'info',
      code: 'PHOTO_TOO_LARGE',
      messageEn: 'The photo frame is larger than 40 mm; it takes space that content could use.',
      messageBn: 'ছবির ফ্রেম ৪০ মিমি-র বেশি; এটি তথ্যের জন্য প্রয়োজনীয় জায়গা নিচ্ছে।',
    });
  }

  const targetLabel =
    mode === 'one-page' ? '1' : mode === 'two-pages' ? '2' : `≤ ${tokens.pageLength.maxPages}`;
  const fitsTarget =
    mode === 'one-page' ? estimate.pages === 1 : mode === 'two-pages' ? estimate.pages <= 2 : estimate.pages <= tokens.pageLength.maxPages;

  return { estimate, diagnostics, fitsTarget, targetLabel, pages: estimate.pages };
}
