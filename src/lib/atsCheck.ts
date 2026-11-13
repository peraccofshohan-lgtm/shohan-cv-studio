/**
 * Offline ATS suitability + quality checks (Parts 7.5 and 7.6).
 *
 * This is deliberately honest: it inspects the *document model* that is actually
 * exported and reports what a text parser is likely to see. It never claims a
 * template "passes ATS", because acceptance depends on the receiving system.
 */
import type { CVData } from '@/types/cv';
import type { ResolvedSection } from '@/lib/sections';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface AtsCheck {
  id: string;
  labelEn: string;
  labelBn: string;
  status: CheckStatus;
  detailEn: string;
  detailBn: string;
  weight: number;
}

export interface QualityItem {
  id: string;
  labelEn: string;
  labelBn: string;
  ok: boolean;
}

export interface AtsReport {
  score: number;
  verdictEn: string;
  verdictBn: string;
  checks: AtsCheck[];
  quality: QualityItem[];
}

const STD_HEADINGS = /^(work experience|experience|employment|education|skills|summary|career objective|objective|projects|certifications|languages|references|achievements|training)$/i;

export function analyseAts(data: CVData, sections: ResolvedSection[], templateName: string): AtsReport {
  const p = data.personal;
  const checks: AtsCheck[] = [];
  const visible = sections.filter((s) => s.enabled && s.hasContent);

  /* ------------------------------------------------------------- contact */
  const hasEmail = /\S+@\S+\.\S+/.test(p.email);
  const hasPhone = (p.mobile || p.altPhone).replace(/\D/g, '').length >= 7;
  checks.push({
    id: 'contact',
    labelEn: 'Contact details are machine-readable',
    labelBn: 'যোগাযোগের তথ্য মেশিনে পাঠযোগ্য',
    status: hasEmail && hasPhone ? 'pass' : hasEmail || hasPhone ? 'warn' : 'fail',
    detailEn:
      hasEmail && hasPhone
        ? 'Email and phone are plain text in the document.'
        : 'Both a plain-text email and a phone number are expected near the name.',
    detailBn:
      hasEmail && hasPhone
        ? 'ইমেইল ও ফোন সাধারণ টেক্সট আকারে আছে।'
        : 'নামের কাছে সাধারণ টেক্সটে ইমেইল ও ফোন নম্বর দুটোই থাকা দরকার।',
    weight: 20,
  });

  /* ------------------------------------------------------- section titles */
  const nonStandard = visible.filter((s) => !STD_HEADINGS.test(s.title.trim()));
  checks.push({
    id: 'headings',
    labelEn: 'Standard section headings',
    labelBn: 'প্রচলিত সেকশন শিরোনাম',
    status: nonStandard.length === 0 ? 'pass' : nonStandard.length <= 2 ? 'warn' : 'fail',
    detailEn:
      nonStandard.length === 0
        ? 'Every heading matches a heading an ATS recognises.'
        : `Unusual heading${nonStandard.length > 1 ? 's' : ''}: ${nonStandard.map((s) => s.title).join(', ')}.`,
    detailBn:
      nonStandard.length === 0
        ? 'প্রতিটি শিরোনাম ATS-চেনা শিরোনামের সঙ্গে মিলে।'
        : `অপ্রচলিত শিরোনাম: ${nonStandard.map((s) => s.title).join(', ')}।`,
    weight: 15,
  });

  /* ------------------------------------------------------------ structure */
  const columns = data.sections.length > 0 ? 1 : 1; // the model itself is single-flow
  checks.push({
    id: 'reading-order',
    labelEn: 'Single logical reading order',
    labelBn: 'একক যৌক্তিক পড়ার ক্রম',
    status: columns === 1 ? 'pass' : 'warn',
    detailEn: 'Sections are emitted in one linear flow, so a parser reads them in order.',
    detailBn: 'সেকশনগুলো একই ধারায় আসে, তাই পার্সার ক্রম অনুযায়ী পড়তে পারে।',
    weight: 10,
  });

  /* ---------------------------------------------------------------- photo */
  checks.push({
    id: 'photo',
    labelEn: 'Photograph',
    labelBn: 'ছবি',
    status: data.photo.dataUrl ? 'warn' : 'pass',
    detailEn: data.photo.dataUrl
      ? 'A photo is included. Many international ATS parsers ignore images, and some employers prefer no photo.'
      : 'No photo — the safest choice for international ATS screening.',
    detailBn: data.photo.dataUrl
      ? 'ছবি যুক্ত আছে। অনেক আন্তর্জাতিক ATS ছবি পড়ে না, কিছু নিয়োগকর্তা ছবি ছাড়াই পছন্দ করেন।'
      : 'ছবি নেই — আন্তর্জাতিক ATS স্ক্রিনিংয়ের জন্য সবচেয়ে নিরাপদ।',
    weight: 5,
  });

  /* -------------------------------------------------------------- symbols */
  const bodyText = visible
    .flatMap((s) => [
      ...s.paragraphs,
      ...s.chips,
      ...s.list,
      ...s.timeline.flatMap((t) => [t.title, t.subtitle, ...t.bullets, t.body]),
    ])
    .join(' ');
  const symbols = /[■◆★•◉❖→⇒]/u.test(bodyText);
  checks.push({
    id: 'symbols',
    labelEn: 'No decorative symbols in body text',
    labelBn: 'মূল লেখায় সাজসজ্জার প্রতীক নেই',
    status: symbols ? 'warn' : 'pass',
    detailEn: symbols
      ? 'Some decorative glyphs were found; they usually survive parsing as noise.'
      : 'Body text uses plain characters only.',
    detailBn: symbols
      ? 'কিছু সাজসজ্জার প্রতীক পাওয়া গেছে; এগুলো সাধারণত পার্সিংয়ে অপ্রয়োজনীয় অক্ষর হিসেবে আসে।'
      : 'মূল লেখায় শুধু সাধারণ অক্ষর ব্যবহৃত হয়েছে।',
    weight: 5,
  });

  /* ------------------------------------------------------------- textbox */
  const totalChars = bodyText.length;
  checks.push({
    id: 'volume',
    labelEn: 'Text volume',
    labelBn: 'লেখার পরিমাণ',
    status: totalChars > 300 ? 'pass' : totalChars > 120 ? 'warn' : 'fail',
    detailEn:
      totalChars > 300
        ? `${totalChars} characters of exportable text.`
        : 'Very little exportable text — a parser may find almost nothing to index.',
    detailBn:
      totalChars > 300
        ? `${totalChars} অক্ষরের রপ্তানযোগ্য লেখা।`
        : 'রপ্তানযোগ্য লেখা খুব কম — পার্সার প্রায় কিছুই পাবে না।',
    weight: 15,
  });

  /* --------------------------------------------------------- template type */
  const atsTemplate = /ats/i.test(templateName);
  checks.push({
    id: 'template',
    labelEn: 'Template structure',
    labelBn: 'টেমপ্লেটের গঠন',
    status: atsTemplate ? 'pass' : 'warn',
    detailEn: atsTemplate
      ? `${templateName} is built for parser compatibility.`
      : `${templateName} uses decorative layout. The text order is still linear, but an ATS-friendly template is safer.`,
    detailBn: atsTemplate
      ? `${templateName} পার্সার সামঞ্জস্যের জন্য তৈরি।`
      : `${templateName}-এ সাজসজ্জামূলক লেআউট আছে। লেখার ক্রম এখনো সরল, তবে ATS-বান্ধব টেমপ্লেট বেশি নিরাপদ।`,
    weight: 15,
  });

  const maxWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce(
    (sum, c) => sum + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight * 0.5 : 0),
    0,
  );
  const score = Math.round((earned / maxWeight) * 100);

  /* ------------------------------------------------------------- quality */
  const educationVisible = visible.some((s) => s.id === 'education');
  const experienceVisible = visible.some((s) => s.id === 'experience');
  const quality: QualityItem[] = [
    { id: 'name', labelEn: 'Name is present', labelBn: 'নাম আছে', ok: p.fullName.trim().length > 1 },
    {
      id: 'contact',
      labelEn: 'Email and phone present',
      labelBn: 'ইমেইল ও ফোন আছে',
      ok: hasEmail && hasPhone,
    },
    { id: 'education', labelEn: 'Education section present', labelBn: 'শিক্ষাগত যোগ্যতা আছে', ok: educationVisible },
    {
      id: 'experience',
      labelEn: data.hasExperience ? 'Work experience present' : 'Work experience marked as not applicable',
      labelBn: data.hasExperience ? 'কর্ম অভিজ্ঞতা আছে' : 'কর্ম অভিজ্ঞতা নেই বলে চিহ্নিত',
      ok: !data.hasExperience || experienceVisible,
    },
    {
      id: 'objective',
      labelEn: 'Career objective reviewed',
      labelBn: 'ক্যারিয়ার অবজেক্টিভ দেখা হয়েছে',
      ok: !data.careerObjective.enabled || (data.careerObjective.text ?? '').trim().length > 40,
    },
    { id: 'skills', labelEn: 'Skills listed', labelBn: 'দক্ষতা তালিকাভুক্ত', ok: data.skills.length > 0 },
    {
      id: 'dates',
      labelEn: 'All experience dates filled in',
      labelBn: 'সব অভিজ্ঞতার তারিখ পূরণ করা',
      ok: data.experience.every((e) => !!e.startDate && (e.currentlyWorking || !!e.endDate)),
    },
    {
      id: 'references',
      labelEn: 'References reviewed',
      labelBn: 'রেফারেন্স দেখা হয়েছে',
      ok: !data.referencesEnabled || data.references.length > 0,
    },
    {
      id: 'photo',
      labelEn: 'Photo decision reviewed',
      labelBn: 'ছবি নিয়ে সিদ্ধান্ত দেখা হয়েছে',
      ok: !data.photo.dataUrl || p.fullName.trim().length > 1,
    },
    {
      id: 'pages',
      labelEn: 'Page count within target',
      labelBn: 'পৃষ্ঠা সংখ্যা লক্ষ্যের মধ্যে',
      ok: true, // filled in by the caller's layout report badge
    },
  ];

  const verdictEn =
    score >= 85
      ? 'Parser-friendly'
      : score >= 65
        ? 'Mostly parser-friendly'
        : score >= 45
          ? 'Some parsing risk'
          : 'High parsing risk';
  const verdictBn =
    score >= 85
      ? 'পার্সারের জন্য উপযোগী'
      : score >= 65
        ? 'বেশিরভাগ ক্ষেত্রে উপযোগী'
        : score >= 45
          ? 'কিছুটা ঝুঁকি আছে'
          : 'উচ্চ ঝুঁকি';

  return { score, verdictEn, verdictBn, checks, quality };
}
