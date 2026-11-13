import { describe, it, expect } from 'vitest';
import { createEmptyCv, uid } from '@/lib/defaults';
import { resolveDesign, TEMPLATES } from '@/templates/catalog';
import { buildDocx } from '@/document/docxExport';
import { unzipSync, strFromU8 } from 'fflate';

function sampleCv() {
  const cv = createEmptyCv();
  cv.personal.fullName = 'মোঃ রফিকুল ইসলাম';
  cv.personal.headline = 'Senior Accounts Officer';
  cv.personal.mobile = '+880 1711 000000';
  cv.personal.email = 'rafiq@example.com';
  cv.personal.presentAddress = 'Dhanmondi, Dhaka';
  cv.careerObjective.text = 'To build a long-term career in finance.';
  cv.education.push({ id: uid(), degree: 'M.Com', group: 'Accounting', institution: 'University of Dhaka', board: 'DU', passingYear: '2016', result: '', gpa: '3.65', scale: '4.00', division: '', location: 'Dhaka', additionalInfo: '', currentlyStudying: false });
  cv.hasExperience = true;
  cv.experience.push({ id: uid(), industry: 'Manufacturing', company: 'Meghna Group', jobTitle: 'Accounts Officer', employmentType: 'Full-time', location: 'Dhaka', startDate: '2019-03-01', endDate: '', currentlyWorking: true, responsibilities: ['Maintain daily ledger.'], achievements: [], projects: '', tools: '', additionalDetails: '' });
  cv.skills.push({ id: uid(), name: 'Tally ERP', category: 'Software Skills', level: 'advanced' });
  cv.skills.push({ id: uid(), name: 'Reporting', category: 'Technical Skills', level: 'expert' });
  cv.languages.push({ id: uid(), name: 'Bangla', reading: 'native', writing: 'native', speaking: 'native', listening: 'native', overall: 'native' });
  return cv;
}

describe('DOCX export', () => {
  it('produces a valid OOXML package with A4 page size', async () => {
    const cv = sampleCv();
    const bytes = await buildDocx({ data: cv, design: resolveDesign('classic-professional', {}) });
    expect(bytes.length).toBeGreaterThan(4000);
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
    const files = unzipSync(bytes);
    const doc = unzipSync(bytes)['word/document.xml'];
    expect(doc).toBeTruthy();
    const xml = strFromU8(doc);
    // A4: 11906 x 16838 twips
    const size = /<w:pgSz w:w="(\d+)" w:h="(\d+)"/.exec(xml);
    expect(size).toBeTruthy();
    // A4 = 11906 × 16838 twips (allow ±3 due to integer rounding of mm→twip)
    expect(Math.abs(Number(size![1]) - 11906)).toBeLessThanOrEqual(3);
    expect(Math.abs(Number(size![2]) - 16838)).toBeLessThanOrEqual(3);
    expect(xml).toContain('রফিকুল');
    expect(Object.keys(files)).toContain('[Content_Types].xml');
  });

  it('keeps text editable (many w:t runs, not one image)', async () => {
    const cv = sampleCv();
    const bytes = await buildDocx({ data: cv, design: resolveDesign('ats-modern', {}) });
    const xml = strFromU8(unzipSync(bytes)['word/document.xml']);
    const runs = (xml.match(/<w:t[ >]/g) ?? []).length;
    expect(runs).toBeGreaterThan(20);
  });

  it('exports every template', async () => {
    const cv = sampleCv();
    for (const t of TEMPLATES) {
      const bytes = await buildDocx({ data: cv, design: resolveDesign(t.id, {}) });
      expect(bytes.length, t.id).toBeGreaterThan(3000);
    }
  }, 60000);
});
