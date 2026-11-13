/**
 * Plain-text export — used for pasting into application forms and email bodies.
 * It must mirror the printable document: same sections, same order, same
 * privacy rules, and it must never dump blank headings.
 */
import { describe, it, expect } from 'vitest';
import { buildPlainText } from '@/features/exporting/textExport';
import { createEmptyCv, defaultDesign } from '@/lib/defaults';
import type { ProjectRecord } from '@/types/cv';

function project(patch: (cv: ReturnType<typeof createEmptyCv>) => void): ProjectRecord {
  const data = createEmptyCv();
  patch(data);
  return {
    id: 'p1',
    title: 'Test CV',
    templateId: 'classic-professional',
    design: defaultDesign(),
    data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerId: null,
    isDraft: true,
    status: 'draft',
    version: 1,
  } as unknown as ProjectRecord;
}

describe('plain-text export', () => {
  it('starts with the name and contact block', () => {
    const text = buildPlainText(
      project((cv) => {
        cv.personal.fullName = 'মোঃ রফিকুল ইসলাম';
        cv.personal.mobile = '+880 1711 234 567';
        cv.personal.email = 'rafiq@example.com';
      }),
    );
    expect(text.split('\n')[0]).toBe('মোঃ রফিকুল ইসলাম');
    expect(text).toContain('Mobile: +880 1711 234 567');
    expect(text).toContain('Email: rafiq@example.com');
  });

  it('omits empty and disabled sections entirely', () => {
    const text = buildPlainText(
      project((cv) => {
        cv.personal.fullName = 'A Person';
        cv.careerObjective.text = 'Objective text here.';
      }),
    );
    expect(text).toContain('CAREER OBJECTIVE');
    expect(text).not.toContain('EDUCATIONAL QUALIFICATION');
    expect(text).not.toContain('WORK EXPERIENCE');
    expect(text).toContain('Objective text here.');
  });

  it('keeps the user order of sections', () => {
    const text = buildPlainText(
      project((cv) => {
        cv.personal.fullName = 'A Person';
        cv.careerObjective.text = 'Objective text here.';
        cv.skills = [{ id: 's1', name: 'Tally', category: 'Software', level: 'advanced' }];
        cv.sections = cv.sections.map((s) =>
          s.id === 'careerObjective' ? { ...s, order: 40 } : s.id === 'skills' ? { ...s, order: 1 } : s,
        );
      }),
    );
    expect(text.indexOf('SKILLS')).toBeLessThan(text.indexOf('CAREER OBJECTIVE'));
  });

  it('hides sensitive identifiers unless the operator enabled them', () => {
    const hidden = buildPlainText(
      project((cv) => {
        cv.personal.nationalId = '1990123456789';
        cv.personalDetails.nationalId = false;
      }),
    );
    expect(hidden).not.toContain('1990123456789');

    const shown = buildPlainText(
      project((cv) => {
        cv.personal.nationalId = '1990123456789';
        cv.personalDetails.nationalId = true;
      }),
    );
    expect(shown).toContain('1990123456789');
  });

  it('formats timeline entries as readable blocks with dashes for bullets', () => {
    const text = buildPlainText(
      project((cv) => {
        cv.hasExperience = true;
        cv.experience = [
          {
            id: 'e1',
            industry: 'Banking',
            company: 'A Bank',
            jobTitle: 'Officer',
            employmentType: 'Full-time',
            location: 'Dhaka',
            startDate: '2020-01-01',
            endDate: '',
            currentlyWorking: true,
            responsibilities: ['Balanced the ledger.', 'Handled VAT.'],
            achievements: [],
            projects: '',
            tools: '',
            additionalDetails: '',
          },
        ];
      }),
    );
    expect(text).toContain('Officer — Jan 2020 – Present');
    expect(text).toContain('A Bank • Dhaka');
    expect(text).toContain('- Balanced the ledger.');
  });

  it('ends without trailing blank-line noise', () => {
    const text = buildPlainText(project((cv) => (cv.personal.fullName = 'Only A Name')));
    expect(text.endsWith('\n')).toBe(true);
    expect(text).not.toMatch(/\n{3,}/);
  });
});
