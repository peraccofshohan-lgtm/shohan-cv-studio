/**
 * Dynamic section engine — the contract every exporter depends on.
 *
 * The rule under test: a heading never prints without content, a disabled
 * section never prints at all, and the user's order is preserved everywhere
 * (preview, DOCX, PDF, print).
 */
import { describe, it, expect } from 'vitest';
import { createEmptyCv } from '@/lib/defaults';
import {
  resolveSections,
  printableSections,
  SECTION_TITLES,
  formatPeriod,
  formatDate,
  toBengaliDigits,
} from '@/lib/sections';
import type { CVData, SectionId } from '@/types/cv';

const empty = (): CVData => createEmptyCv();
const opts = { language: 'en' as const };

const setSection = (cv: CVData, id: SectionId, order: number, enabled = true): CVData => {
  cv.sections = cv.sections.map((s) => (s.id === id ? { ...s, order, enabled } : s));
  return cv;
};

describe('section resolution', () => {
  it('emits nothing printable for a brand-new CV', () => {
    expect(printableSections(empty(), opts)).toHaveLength(0);
  });

  it('hides empty sections instead of printing a bare heading', () => {
    const cv = empty();
    cv.careerObjective.text = '   '; // whitespace only
    cv.education = [{ ...cv.education[0], degree: '', institution: '' }];
    const resolved = resolveSections(cv, opts);
    expect(resolved.every((s) => s.hasContent === false)).toBe(true);
    expect(printableSections(cv, opts)).toHaveLength(0);
  });

  it('drops disabled sections even when they contain data', () => {
    const cv = empty();
    cv.careerObjective.text = 'A real objective with content.';
    setSection(cv, 'careerObjective', 1, false);
    expect(printableSections(cv, opts)).toHaveLength(0);
    const all = resolveSections(cv, opts).find((s) => s.id === 'careerObjective');
    expect(all?.hiddenReason).toBe('DISABLED');
  });

  it('prints a section once it has content', () => {
    const cv = empty();
    cv.careerObjective.text = 'A real objective with content.';
    const printable = printableSections(cv, opts);
    expect(printable).toHaveLength(1);
    expect(printable[0].kind).toBe('paragraph');
    expect(printable[0].paragraphs[0]).toBe('A real objective with content.');
  });

  it("preserves the user's ordering", () => {
    const cv = empty();
    cv.careerObjective.text = 'Objective text.';
    cv.skills = [{ id: 's1', name: 'Tally ERP 9', category: 'Software', level: 'advanced' }];
    cv.languages = [{ id: 'l1', name: 'Bangla', reading: 'native', writing: 'native', speaking: 'native', listening: 'native', overall: 'native' }];
    setSection(cv, 'careerObjective', 3);
    setSection(cv, 'skills', 2);
    setSection(cv, 'languages', 1);
    expect(printableSections(cv, opts).map((s) => s.id)).toEqual(['languages', 'skills', 'careerObjective']);
  });

  it('honours per-project section title overrides', () => {
    const cv = empty();
    cv.careerObjective.text = 'Objective text.';
    const [section] = printableSections(cv, { ...opts, titleOverrides: { careerObjective: 'লক্ষ্য' } });
    expect(section.title).toBe('লক্ষ্য');
  });

  it('localises default headings for mixed-language output', () => {
    const cv = empty();
    cv.careerObjective.text = 'উদ্দেশ্য';
    const [bn] = printableSections(cv, { language: 'bn' });
    expect(bn.title).toBe(SECTION_TITLES.careerObjective.bn);
    const [en] = printableSections(cv, { language: 'en' });
    expect(en.title).toBe(SECTION_TITLES.careerObjective.en);
  });

  it('keeps timeline entries that are only partly filled', () => {
    const cv = empty();
    cv.hasExperience = true;
    cv.experience = [
      {
        id: 'e1',
        industry: 'Manufacturing',
        company: '',
        jobTitle: 'Accounts Officer',
        employmentType: 'Full-time',
        location: '',
        startDate: '2020-01-01',
        endDate: '',
        currentlyWorking: true,
        responsibilities: ['Kept the ledger.'],
        achievements: [],
        projects: '',
        tools: '',
        additionalDetails: '',
      },
    ];
    const experience = printableSections(cv, opts).find((s) => s.id === 'experience');
    expect(experience?.timeline).toHaveLength(1);
    if (!experience) throw new Error('experience section missing');
    expect(experience.timeline[0].period).toBe('Jan 2020 – Present');
    expect(experience.timeline[0].bullets).toEqual(['Kept the ledger.']);
  });

  it('never emits an ATS-hostile graphic in a chip section', () => {
    const cv = empty();
    cv.careerInterests.enabled = true;
    cv.careerInterests.selected = ['Banking', 'Audit'];
    setSection(cv, 'careerInterests', 1);
    const interests = printableSections(cv, opts).find((s) => s.id === 'careerInterests');
    expect(interests?.kind).toBe('chips');
    expect(interests?.chips).toEqual(['Banking', 'Audit']);
  });
});

describe('period formatting', () => {
  it('formats an open-ended role', () => {
    expect(formatPeriod('2019-03-01', '', true, 'en')).toBe('Mar 2019 – Present');
  });

  it('writes Bangla dates in Bangla, not English month names', () => {
    // Bangladeshi CVs expect মার্চ ২০১৯, never "Mar 2019".
    expect(formatPeriod('2019-03-01', '', true, 'bn')).toBe('মার্চ ২০১৯ – বর্তমান');
    expect(formatPeriod('2017-06-01', '2019-02-01', false, 'bn')).toBe('জুন ২০১৭ – ফেব্রুয়ারি ২০১৯');
    expect(formatDate('2019-03-05', 'bn')).toBe('০৫ মার্চ ২০১৯');
    expect(formatDate('2019-03-05', 'en')).toBe('05 March 2019');
  });

  it('converts digits for Bangla output', () => {
    expect(toBengaliDigits('2019')).toBe('২০১৯');
    expect(toBengaliDigits('0-1-2')).toBe('০-১-২');
    // Latin text and punctuation are untouched.
    expect(toBengaliDigits('BSc 2020')).toBe('BSc ২০২০');
  });

  it('formats a closed range', () => {
    expect(formatPeriod('2019-03-01', '2021-07-01', false, 'en')).toBe('Mar 2019 – Jul 2021');
  });

  it('degrades safely on a single date or free text', () => {
    expect(formatPeriod('2019-03-01', '', false, 'en')).toBe('Mar 2019');
    expect(formatPeriod('', '', false, 'en')).toBe('');
    // A free-text value that Date() can parse is normalised; the engine never throws.
    expect(formatPeriod('Class of 2019', '', false, 'en')).toBe('Jan 2019');
    expect(formatPeriod('not a date at all', '', false, 'en')).toBe('not a date at all');
  });
});
