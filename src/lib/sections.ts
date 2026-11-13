/**
 * Dynamic Section Engine.
 *
 * ONE resolver feeds the live preview, the DOCX exporter, the PDF exporter and
 * the print pipeline. A section is emitted only when it is enabled *and* has
 * real content, which structurally prevents empty headings, orphan rules and
 * blank pages in every output format.
 */
import type { CVData, SectionId } from '@/types/cv';

export type BlockKind =
  | 'paragraph'
  | 'timeline'
  | 'simple-list'
  | 'chips'
  | 'labelled-grid'
  | 'two-column-list';

export interface TimelineItem {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  meta: string;
  bullets: string[];
  body: string;
}

export interface LabelledRow {
  label: string;
  value: string;
}

export interface ResolvedSection {
  id: SectionId;
  title: string;
  kind: BlockKind;
  order: number;
  enabled: boolean;
  /** True only when the section will actually print. */
  hasContent: boolean;
  paragraphs: string[];
  timeline: TimelineItem[];
  list: string[];
  chips: string[];
  labelled: LabelledRow[];
  /** Reason the section was auto-hidden (diagnostics / QA panel). */
  hiddenReason?: string;
}

export interface ResolveOptions {
  /** Print personal details labels in Bangla. */
  language: 'bn' | 'en';
  /** Include the photo block in the header. */
  /** Section titles can be overridden per project (localisation/customisation). */
  titleOverrides?: Partial<Record<SectionId, string>>;
}

const has = (arr: unknown[] | undefined | null): boolean => Array.isArray(arr) && arr.length > 0;
const text = (s: string | undefined | null): boolean => !!s && s.trim().length > 0;

const SURVIVING = (minLength = 1): boolean => true;

function titleFor(id: SectionId, lang: 'bn' | 'en', overrides?: ResolveOptions['titleOverrides']): string {
  const override = overrides?.[id];
  if (override && override.trim()) return override.trim();
  return SECTION_TITLES[id][lang];
}

export const SECTION_TITLES: Record<SectionId, { en: string; bn: string }> = {
  careerObjective: { en: 'Career Objective', bn: 'ক্যারিয়ার অবজেক্টিভ' },
  careerInterests: { en: 'Career Interest', bn: 'ক্যারিয়ার আগ্রহ' },
  education: { en: 'Educational Qualification', bn: 'শিক্ষাগত যোগ্যতা' },
  experience: { en: 'Work Experience', bn: 'কর্ম অভিজ্ঞতা' },
  skills: { en: 'Skills', bn: 'দক্ষতা' },
  languages: { en: 'Language Proficiency', bn: 'ভাষা দক্ষতা' },
  training: { en: 'Training & Certifications', bn: 'প্রশিক্ষণ ও সার্টিফিকেশন' },
  projects: { en: 'Projects', bn: 'প্রকল্প' },
  achievements: { en: 'Achievements & Awards', bn: 'অর্জন ও পুরস্কার' },
  strengths: { en: 'Strengths', bn: 'শক্তিশালী দিক' },
  hobbies: { en: 'Hobbies & Interests', bn: 'শখ ও আগ্রহ' },
  volunteer: { en: 'Volunteer Experience', bn: 'স্বেচ্ছাসেবা' },
  personalDetails: { en: 'Personal Details', bn: 'ব্যক্তিগত তথ্য' },
  references: { en: 'References', bn: 'রেফারেন্স' },
  declaration: { en: 'Declaration', bn: 'ঘোষণাপত্র' },
  signature: { en: 'Signature', bn: 'স্বাক্ষর' },
  custom: { en: 'Additional Information', bn: 'অতিরিক্ত তথ্য' },
};

const PERSONAL_LABELS: Record<string, { en: string; bn: string }> = {
  fatherName: { en: "Father's Name", bn: 'পিতার নাম' },
  motherName: { en: "Mother's Name", bn: 'মাতার নাম' },
  dateOfBirth: { en: 'Date of Birth', bn: 'জন্ম তারিখ' },
  gender: { en: 'Gender', bn: 'লিঙ্গ' },
  nationality: { en: 'Nationality', bn: 'জাতীয়তা' },
  religion: { en: 'Religion', bn: 'ধর্ম' },
  maritalStatus: { en: 'Marital Status', bn: 'বৈবাহিক অবস্থা' },
  bloodGroup: { en: 'Blood Group', bn: 'রক্তের গ্রুপ' },
  height: { en: 'Height', bn: 'উচ্চতা' },
  weight: { en: 'Weight', bn: 'ওজন' },
  nationalId: { en: 'National ID', bn: 'জাতীয় পরিচয়পত্র নম্বর' },
  passportNo: { en: 'Passport No.', bn: 'পাসপোর্ট নম্বর' },
  presentAddress: { en: 'Present Address', bn: 'বর্তমান ঠিকানা' },
  permanentAddress: { en: 'Permanent Address', bn: 'স্থায়ী ঠিকানা' },
  mobile: { en: 'Mobile', bn: 'মোবাইল' },
  altPhone: { en: 'Alternative Phone', bn: 'বিকল্প ফোন' },
  email: { en: 'Email', bn: 'ইমেইল' },
  linkedin: { en: 'LinkedIn', bn: 'লিংকডইন' },
  website: { en: 'Website', bn: 'ওয়েবসাইট' },
};

/** Bengali month names, in calendar order. */
const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

/**
 * Formats one date the way Bangladeshi CVs are written.
 *
 * `2020-03-01` becomes `Mar 2020` in English and `মার্চ ২০২০` in Bangla, using
 * Bengali digits when the document language is Bangla. Values that are not real
 * dates (e.g. "Class of 2019") are passed through untouched.
 */
function formatMonthYear(value: string, lang: 'bn' | 'en'): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const month = d.getMonth();
  const year = d.getFullYear();
  if (lang === 'bn') {
    return `${BN_MONTHS[month]} ${toBengaliDigits(String(year))}`;
  }
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/** Converts Western digits to Bengali digits (০১২৩৪৫৬৭৮৯). */
export function toBengaliDigits(value: string): string {
  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(value).replace(/[0-9]/g, (digit) => map[Number(digit)]);
}

export function formatPeriod(start: string, end: string, current: boolean, lang: 'bn' | 'en'): string {
  const a = formatMonthYear(start, lang);
  const b = current ? (lang === 'bn' ? 'বর্তমান' : 'Present') : formatMonthYear(end, lang);
  if (a && b) return `${a} – ${b}`;
  return a || b;
}

export function formatDate(value: string, lang: 'bn' | 'en'): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  if (lang === 'bn') {
    // Two-digit day, matching the English output (০৫ মার্চ ২০১৯).
    return `${toBengaliDigits(String(d.getDate()).padStart(2, '0'))} ${BN_MONTHS[d.getMonth()]} ${toBengaliDigits(
      String(d.getFullYear()),
    )}`;
  }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

/**
 * Resolve the printable document model.
 * Sections keep the user's ordering; disabled or empty sections are dropped.
 */
export function resolveSections(data: CVData, options: ResolveOptions): ResolvedSection[] {
  const lang = options.language;
  const out: ResolvedSection[] = [];
  const sorted = [...data.sections].sort((a, b) => a.order - b.order);

  const push = (section: ResolvedSection): void => {
    section.hasContent =
      has(section.paragraphs) ||
      has(section.timeline) ||
      has(section.list) ||
      has(section.chips) ||
      has(section.labelled);
    out.push(section);
  };

  for (const config of sorted) {
    const id = config.id as SectionId;
    const base: ResolvedSection = {
      id,
      title: titleFor(id, lang, options.titleOverrides),
      kind: 'paragraph',
      order: config.order,
      enabled: config.enabled,
      hasContent: false,
      paragraphs: [],
      timeline: [],
      list: [],
      chips: [],
      labelled: [],
    };
    if (!config.enabled) {
      base.hiddenReason = 'DISABLED';
      out.push(base);
      continue;
    }

    switch (id) {
      case 'careerObjective': {
        base.kind = 'paragraph';
        if (data.careerObjective.enabled && text(data.careerObjective.text)) {
          base.paragraphs = [data.careerObjective.text.trim()];
        }
        break;
      }
      case 'careerInterests': {
        base.kind = 'chips';
        if (data.careerInterests.enabled) {
          base.chips = [
            ...data.careerInterests.selected.filter((s) => text(s)),
            ...data.careerInterests.custom
              .split(/[,\n]/)
              .map((s) => s.trim())
              .filter(Boolean),
          ];
        }
        break;
      }
      case 'education': {
        base.kind = 'timeline';
        base.timeline = data.education
          .filter((e) => text(e.degree) || text(e.institution))
          .map((e) => {
            const metaParts: string[] = [];
            if (text(e.group)) metaParts.push(e.group);
            if (text(e.institution)) metaParts.push(e.institution);
            if (text(e.board)) metaParts.push(e.board);
            const resultParts: string[] = [];
            const gradeValue = text(e.gpa)
              ? `${e.gpa}${text(e.scale) ? ` / ${e.scale}` : ''}`
              : text(e.result)
                ? e.result
                : text(e.division)
                  ? e.division
                  : '';
            if (gradeValue) resultParts.push(`${lang === 'bn' ? 'ফলাফল' : 'Result'}: ${gradeValue}`);
            if (text(e.location)) resultParts.push(e.location);
            return {
              id: e.id,
              title: e.degree,
              subtitle: e.institution,
              period:
                e.passingYear
                  ? e.currentlyStudying
                    ? `${e.passingYear} (${lang === 'bn' ? 'অধ্যয়নরত' : 'Ongoing'})`
                    : e.passingYear
                  : '',
              meta: metaParts.filter((m) => m !== e.degree && m !== e.institution).join(' • '),
              bullets: resultParts,
              body: e.additionalInfo ?? '',
            };
          });
        break;
      }
      case 'experience': {
        base.kind = 'timeline';
        base.timeline = data.hasExperience
          ? data.experience
              .filter((x) => text(x.jobTitle) || text(x.company))
              .map((x) => ({
                id: x.id,
                title: x.jobTitle,
                subtitle: [x.company, text(x.location) ? x.location : ''].filter(Boolean).join(' • '),
                period: formatPeriod(x.startDate, x.endDate, x.currentlyWorking, lang),
                meta: [x.employmentType, x.industry].filter((v) => text(v)).join(' • '),
                bullets: [...x.responsibilities, ...x.achievements].filter((b) => text(b)),
                body: [x.projects, x.tools, x.additionalDetails].filter((v) => text(v)).join('\n'),
              }))
          : [];
        break;
      }
      case 'skills': {
        base.kind = 'simple-list';
        const byCategory = new Map<string, string[]>();
        for (const skill of data.skills) {
          if (!text(skill.name)) continue;
          const list = byCategory.get(skill.category) ?? [];
          list.push(skill.name.trim());
          byCategory.set(skill.category, list);
        }
        if (byCategory.size === 0) break;
        // One category → plain chip list. Multiple → labelled grid of categories.
        if (byCategory.size === 1) {
          base.kind = 'chips';
          base.chips = Array.from(byCategory.values())[0];
        } else {
          base.kind = 'labelled-grid';
          base.labelled = Array.from(byCategory.entries()).map(([label, items]) => ({
            label,
            value: items.join(', '),
          }));
        }
        break;
      }
      case 'languages': {
        base.kind = 'labelled-grid';
        base.labelled = data.languages
          .filter((l) => text(l.name))
          .map((l) => ({
            label: l.name.trim(),
            value: capitalize(l.overall),
          }));
        break;
      }
      case 'training': {
        base.kind = 'timeline';
        if (data.trainingEnabled) {
          base.timeline = data.training
            .filter((t) => text(t.title))
            .map((t) => ({
              id: t.id,
              title: t.title,
              subtitle: [t.institution, t.issuingOrganization].filter((v) => text(v)).join(' • '),
              period: [t.completionDate, t.duration].filter((v) => text(v)).join(' • '),
              meta: text(t.certificateId) ? `ID: ${t.certificateId}` : '',
              bullets: [t.description, text(t.skillsLearned) ? `${lang === 'bn' ? 'অর্জিত দক্ষতা' : 'Skills'}: ${t.skillsLearned}` : ''].filter((v) => text(v)),
              body: '',
            }));
        }
        break;
      }
      case 'projects': {
        base.kind = 'timeline';
        if (data.projectsEnabled) {
          base.timeline = data.projects
            .filter((p) => text(p.name))
            .map((p) => ({
              id: p.id,
              title: p.name,
              subtitle: [p.role, p.technologies].filter((v) => text(v)).join(' • '),
              period: formatPeriod(p.startDate, p.endDate, false, lang),
              meta: p.url,
              bullets: [...p.contributions, p.outcome].filter((v) => text(v)),
              body: p.description ?? '',
            }));
        }
        break;
      }
      case 'achievements': {
        base.kind = 'timeline';
        if (data.achievementsEnabled) {
          base.timeline = data.achievements
            .filter((a) => text(a.title) || text(a.awardName))
            .map((a) => ({
              id: a.id,
              title: text(a.title) ? a.title : a.awardName,
              subtitle: [a.awardName, a.organization].filter((v) => text(v)).join(' • '),
              period: a.date,
              meta: '',
              bullets: [],
              body: a.description ?? '',
            }));
        }
        break;
      }
      case 'strengths': {
        base.kind = 'chips';
        if (data.strengthsEnabled) base.chips = data.strengths.map((s) => s.text).filter((s) => text(s));
        break;
      }
      case 'hobbies': {
        base.kind = 'chips';
        if (data.hobbiesEnabled) base.chips = data.hobbies.map((h) => h.text).filter((s) => text(s));
        break;
      }
      case 'volunteer': {
        base.kind = 'timeline';
        if (data.volunteerEnabled) {
          base.timeline = data.volunteer
            .filter((v) => text(v.organization))
            .map((v) => ({
              id: v.id,
              title: v.role || v.organization,
              subtitle: v.role ? v.organization : '',
              period: v.duration,
              meta: '',
              bullets: v.responsibilities.filter((r) => text(r)),
              body: v.achievements ?? '',
            }));
        }
        break;
      }
      case 'personalDetails': {
        base.kind = 'labelled-grid';
        if (data.personalDetailsEnabled) {
          const v = data.personalDetails;
          const map: Array<[keyof typeof v, string]> = [
            ['fatherName', data.personal.fatherName],
            ['motherName', data.personal.motherName],
            ['dateOfBirth', formatDate(data.personal.dateOfBirth, lang)],
            ['gender', data.personal.gender],
            ['nationality', data.personal.nationality],
            ['religion', data.personal.religion],
            ['maritalStatus', data.personal.maritalStatus],
            ['bloodGroup', data.personal.bloodGroup],
            ['height', data.personal.height],
            ['weight', data.personal.weight],
            ['nationalId', data.personal.nationalId],
            ['passportNo', data.personal.passportNo],
            ['presentAddress', data.personal.presentAddress],
            ['permanentAddress', data.personal.permanentAddress],
            ['mobile', data.personal.mobile],
            ['altPhone', data.personal.altPhone],
            ['email', data.personal.email],
            ['linkedin', data.personal.linkedin],
            ['website', data.personal.website],
          ];
          base.labelled = map
            .filter(([key, value]) => v[key] === true && text(value))
            .map(([key, value]) => ({ label: PERSONAL_LABELS[key]?.[lang] ?? key, value }));
        }
        break;
      }
      case 'references': {
        base.kind = 'timeline';
        if (data.referencesEnabled) {
          base.timeline = data.references
            .filter((r) => text(r.name))
            .map((r) => ({
              id: r.id,
              title: r.name,
              subtitle: [r.designation, r.organization].filter((v) => text(v)).join(' • '),
              period: '',
              meta: [r.relationship, r.referenceType].filter((v) => text(v)).join(' • '),
              bullets: [
                text(r.phone) ? `${lang === 'bn' ? 'ফোন' : 'Phone'}: ${r.phone}` : '',
                text(r.email) ? `${lang === 'bn' ? 'ইমেইল' : 'Email'}: ${r.email}` : '',
                text(r.address) ? r.address : '',
                text(r.additionalDetails) ? r.additionalDetails : '',
              ].filter((v) => text(v)),
              body: '',
            }));
        }
        break;
      }
      case 'declaration': {
        base.kind = 'paragraph';
        if (data.declaration.enabled && text(data.declaration.text)) {
          base.paragraphs = [data.declaration.text.trim()];
        }
        break;
      }
      case 'signature': {
        base.kind = 'paragraph';
        // The signature renders as a block element; it counts as content only with an image.
        if (data.signature.enabled && data.signature.dataUrl) {
          base.paragraphs = [''];
          base.kind = 'paragraph';
          base.hasContent = true;
          out.push({ ...base, hasContent: true });
          continue;
        }
        break;
      }
      case 'custom': {
        base.kind = 'timeline';
        const enabledCustom = data.customSections.filter(
          (c) => c.enabled && text(c.title) && c.items.some((i) => text(i.heading) || text(i.body)),
        );
        if (enabledCustom.length > 0) {
          // Each custom section renders as its own titled block.
          base.timeline = [];
          base.paragraphs = [];
          for (const c of enabledCustom) {
            out.push({
              id: 'custom',
              title: c.title,
              kind: 'timeline',
              order: config.order,
              enabled: true,
              hasContent: true,
              paragraphs: [],
              list: [],
              chips: [],
              labelled: [],
              timeline: c.items
                .filter((i) => text(i.heading) || text(i.body))
                .map((i) => ({
                  id: i.id,
                  title: i.heading,
                  subtitle: i.subheading,
                  period: i.period,
                  meta: '',
                  bullets: [],
                  body: i.body,
                })),
            });
          }
          continue;
        }
        break;
      }
      default:
        break;
    }

    push(base);
  }

  return out;
}

/** Sections that will actually render — the contract used by every exporter. */
export function printableSections(data: CVData, options: ResolveOptions): ResolvedSection[] {
  return resolveSections(data, options).filter((s) => s.hasContent && s.enabled);
}

export function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Words-per-page heuristic used by the template gallery preview. */
export function estimatePageCount(sections: ResolvedSection[], hasPhoto: boolean): number {
  let units = hasPhoto ? 2 : 0;
  for (const s of sections) {
    if (!s.hasContent) continue;
    units += 1.2;
    units += s.paragraphs.join(' ').split(/\s+/).filter(Boolean).length / 90;
    units += s.timeline.length * 1.15;
    units += s.labelled.length * 0.16;
    units += s.chips.length * 0.06;
    units += s.list.length * 0.08;
    for (const t of s.timeline) units += t.bullets.length * 0.16 + (t.body ? 0.35 : 0);
  }
  return Math.max(1, Math.ceil(units / 4.6));
}
