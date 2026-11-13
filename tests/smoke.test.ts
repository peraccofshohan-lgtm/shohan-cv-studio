import { describe, it, expect } from 'vitest';
import { createEmptyCv, createProject } from '@/lib/defaults';
import { printableSections, resolveSections } from '@/lib/sections';
import { resolveDesign, TEMPLATES } from '@/templates/catalog';
import { buildStandaloneHtml } from '@/document/standalone';
import { uid } from '@/lib/defaults';

function sampleCv() {
  const cv = createEmptyCv();
  cv.personal.fullName = 'মোঃ রফিকুল ইসলাম';
  cv.personal.headline = 'Senior Accounts Officer';
  cv.personal.mobile = '+880 1711 000000';
  cv.personal.email = 'rafiq@example.com';
  cv.personal.presentAddress = 'Dhanmondi, Dhaka';
  cv.careerObjective.text = 'To build a long-term career in finance where accuracy and integrity support transparent reporting.';
  cv.education.push({ id: uid(), degree: 'M.Com in Accounting', group: 'Accounting', institution: 'University of Dhaka', board: 'University of Dhaka', passingYear: '2016', result: '', gpa: '3.65', scale: '4.00', division: '', location: 'Dhaka', additionalInfo: '', currentlyStudying: false });
  cv.hasExperience = true;
  cv.experience.push({ id: uid(), industry: 'Manufacturing', company: 'Meghna Group', jobTitle: 'Senior Accounts Officer', employmentType: 'Full-time', location: 'Dhaka', startDate: '2019-03-01', endDate: '', currentlyWorking: true, responsibilities: ['Maintain daily ledger and bank reconciliation.', 'Prepare monthly financial statements.'], achievements: ['Reduced reconciliation time by 20% through better tracking.'], projects: '', tools: 'Tally ERP, MS Excel', additionalDetails: '' });
  cv.skills.push({ id: uid(), name: 'Tally ERP', category: 'Software Skills', level: 'advanced' });
  cv.skills.push({ id: uid(), name: 'Financial Reporting', category: 'Technical Skills', level: 'expert' });
  cv.languages.push({ id: uid(), name: 'Bangla', reading: 'native', writing: 'native', speaking: 'native', listening: 'native', overall: 'native' });
  return cv;
}

describe('document engine', () => {
  it('drops empty sections entirely', () => {
    const cv = createEmptyCv();
    cv.personal.fullName = 'Test';
    const sections = printableSections(cv, { language: 'en' });
    expect(sections.map(s => s.id)).not.toContain('training');
    expect(sections.map(s => s.id)).not.toContain('projects');
    expect(sections.every(s => s.hasContent)).toBe(true);
  });

  it('renders all 20 templates without throwing', () => {
    const cv = sampleCv();
    for (const t of TEMPLATES) {
      const design = resolveDesign(t.id, {});
      const html = buildStandaloneHtml({ data: cv, design, title: t.name });
      expect(html).toContain('cv-paper');
      expect(html.length).toBeGreaterThan(5000);
      expect(html).toContain('রফিকুল');
    }
  });

  it('never emits an empty section heading', () => {
    const cv = sampleCv();
    cv.referencesEnabled = true;
    const sections = resolveSections(cv, { language: 'en' });
    const visible = sections.filter(s => s.enabled && s.hasContent);
    for (const s of visible) {
      expect(s.title.length).toBeGreaterThan(0);
      const total = s.paragraphs.length + s.timeline.length + s.chips.length + s.labelled.length + s.list.length;
      expect(total).toBeGreaterThan(0);
    }
  });
});
