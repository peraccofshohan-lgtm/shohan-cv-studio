// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SqlEngine } from '@/database/sqlite';
import { CvRepository } from '@/database/cvRepository';
import { SCHEMA_VERSION } from '@/database/schema';
import { createEmptyCv, createProject, createEmptyCustomer, nowIso, uid } from '@/lib/defaults';

describe('SQLite repository', () => {
  it('creates the schema and reports integrity', async () => {
    const engine = await SqlEngine.create(null);
    // v2 adds the document-composition columns (title, page length, section styles).
    expect(engine.schemaVersion).toBe(SCHEMA_VERSION);
    // v2 added document composition; v3 adds standalone saved palettes.
    expect(SCHEMA_VERSION).toBe(3);
    const integrity = engine.integrityCheck();
    expect(integrity.ok).toBe(true);
    expect(integrity.message).toBe('ok');
  });

  it('round-trips a full project through normalised tables', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);

    const customer = createEmptyCustomer({ name: 'করিম সাহেব', phone: '01711000000' });
    repo.saveCustomer(customer);

    const project = createProject({ customerId: customer.id, title: 'Bank CV' });
    project.data.personal.fullName = 'মোঃ রফিকুল ইসলাম';
    project.data.personal.mobile = '+8801711234567';
    project.data.careerObjective.text = 'Objective text.';
    project.data.education.push({
      id: uid(), degree: 'B.Com', group: 'Accounting', institution: 'DU', board: 'DU',
      passingYear: '2015', result: '', gpa: '3.5', scale: '4.00', division: '', location: 'Dhaka',
      additionalInfo: '', currentlyStudying: false,
    });
    project.data.hasExperience = true;
    project.data.experience.push({
      id: uid(), industry: 'Banking', company: 'ABC Bank', jobTitle: 'Officer',
      employmentType: 'Full-time', location: 'Dhaka', startDate: '2019-01', endDate: '',
      currentlyWorking: true, responsibilities: ['A', 'B'], achievements: ['C'],
      projects: '', tools: 'Tally', additionalDetails: '',
    });
    project.data.skills.push({ id: uid(), name: 'Excel', category: 'Computer Skills', level: 'expert' });
    project.data.languages.push({ id: uid(), name: 'Bangla', reading: 'native', writing: 'native', speaking: 'native', listening: 'native', overall: 'native' });
    project.data.strengthsEnabled = true;
    project.data.strengths.push({ id: uid(), text: 'Teamwork' });
    const s = project.data.sections.find((x) => x.id === 'strengths');
    if (s) s.enabled = true;

    repo.saveProject(project);

    // Reload from the serialised bytes, exactly like an app restart.
    const bytes = engine.export();
    const engine2 = await SqlEngine.create(bytes);
    const repo2 = new CvRepository(engine2);
    const loaded = repo2.getProject(project.id);

    expect(loaded).toBeTruthy();
    expect(loaded!.data.personal.fullName).toBe('মোঃ রফিকুল ইসলাম');
    expect(loaded!.data.education).toHaveLength(1);
    expect(loaded!.data.education[0].institution).toBe('DU');
    expect(loaded!.data.experience[0].responsibilities).toEqual(['A', 'B']);
    expect(loaded!.data.skills[0].level).toBe('expert');
    expect(loaded!.data.languages[0].overall).toBe('native');
    expect(loaded!.data.strengthsEnabled).toBe(true);
    expect(loaded!.data.strengths[0].text).toBe('Teamwork');
    expect(loaded!.customerId).toBe(customer.id);
  });

  it('cascades deletes so no orphan rows remain', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const project = createProject({ title: 'T' });
    project.data.education.push({
      id: uid(), degree: 'X', group: '', institution: 'Y', board: '', passingYear: '',
      result: '', gpa: '', scale: '', division: '', location: '', additionalInfo: '', currentlyStudying: false,
    });
    repo.saveProject(project);
    repo.hardDeleteProject(project.id);
    expect(repo.getProject(project.id)).toBeNull();
    expect(engine.scalar<number>('SELECT COUNT(*) FROM education')).toBe(0);
  });

  it('keeps version history and restores a snapshot', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const p = createProject({ title: 'V' });
    p.data.personal.fullName = 'First';
    repo.saveProject(p);
    const v1 = repo.getProject(p.id)!;
    v1.data.personal.fullName = 'Second';
    v1.version = 2;
    repo.saveProject(v1);

    const versions = repo.projectVersions(p.id);
    expect(versions.length).toBeGreaterThanOrEqual(2);

    const restored = repo.restoreVersion(p.id, 1);
    expect(restored!.data.personal.fullName).toBe('First');
  });

  it('supports customer CRUD with soft delete', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const c = createEmptyCustomer({ name: 'Test', phone: '123' });
    repo.saveCustomer(c);
    expect(repo.listCustomers()).toHaveLength(1);
    repo.softDeleteCustomer(c.id);
    expect(repo.listCustomers()).toHaveLength(0);
    repo.restoreCustomer(c.id);
    expect(repo.listCustomers()).toHaveLength(1);
  });

  it('stores settings as typed JSON', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    repo.setSetting('app_settings', { theme: 'dark', autosaveMs: 900 });
    const loaded = repo.getSetting<{ theme: string }>('app_settings', { theme: 'light' });
    expect(loaded.theme).toBe('dark');
  });

  it('logs exports and counts dashboard metrics', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const p = createProject({ title: 'Counted' });
    repo.saveProject(p);
    repo.logExport({ id: uid(), projectId: p.id, projectTitle: 'Counted', format: 'pdf', fileName: 'a.pdf', createdAt: nowIso(), status: 'success', message: '' });
    expect(repo.listExports()).toHaveLength(1);
    const counts = repo.counts();
    expect(counts.projects).toBe(1);
    expect(counts.todayProjects).toBe(1);
  });

  it('round-trips the title block, page length and section styles (schema v2)', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const project = createProject({ title: 'Composition' });
    project.data.title = {
      ...project.data.title,
      preset: 'custom',
      text: 'PROFESSIONAL PROFILE',
      align: 'center',
      letterSpacing: 0.3,
      visible: true,
    };
    project.data.pageLength = { mode: 'one-page', maxPages: 1, breakBefore: ['education'], keepTogether: true };
    project.data.sectionStyles = { skills: { headingColor: '#123456', bulletStyle: 'dash' } };
    repo.saveProject(project);

    const loaded = repo.getProject(project.id)!;
    expect(loaded.data.title.text).toBe('PROFESSIONAL PROFILE');
    expect(loaded.data.title.align).toBe('center');
    expect(loaded.data.pageLength.mode).toBe('one-page');
    expect(loaded.data.pageLength.breakBefore).toEqual(['education']);
    expect(loaded.data.sectionStyles.skills?.headingColor).toBe('#123456');
  });

  it('opens a v1.0 project that has no title/page-length columns filled', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const project = createProject({ title: 'Legacy' });
    repo.saveProject(project);
    // Simulate a pre-upgrade row: blank the new columns.
    engine.run(
      `UPDATE cv_projects SET title_json='', page_length_json='', section_styles_json='' WHERE id=$a`,
      { a: project.id },
    );
    const loaded = repo.getProject(project.id)!;
    expect(loaded.data.title.preset).toBe('curriculum-vitae');
    expect(loaded.data.title.visible).toBe(true);
    expect(loaded.data.pageLength.mode).toBe('automatic');
    expect(loaded.data.sectionStyles).toEqual({});
  });
});

describe('standalone colour palettes (schema v3)', () => {
  it('saves, lists, applies and deletes a palette without touching projects', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    const project = createProject({ title: 'Palette test' });
    repo.saveProject(project);

    repo.saveColorPalette({
      id: 'pal-1',
      name: 'Bank green',
      basePaletteId: 'deep-green',
      colors: { primary: '#0b6b3a', accent: '#c8a54a' },
    });
    const list = repo.listColorPalettes();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Bank green');
    expect(list[0].colors.primary).toBe('#0b6b3a');

    // Renaming keeps the same row (upsert by id).
    repo.saveColorPalette({ id: 'pal-1', name: 'Bank green v2', basePaletteId: 'deep-green', colors: { primary: '#0b6b3a' } });
    expect(repo.listColorPalettes()).toHaveLength(1);
    expect(repo.listColorPalettes()[0].name).toBe('Bank green v2');

    // The project is untouched by any palette operation.
    expect(repo.getProject(project.id)?.data.personal.fullName).toBe(project.data.personal.fullName);

    repo.deleteColorPalette('pal-1');
    expect(repo.listColorPalettes()).toEqual([]);
    expect(repo.getProject(project.id)).toBeTruthy();
  });

  it('survives a save/reload cycle', async () => {
    const engine = await SqlEngine.create(null);
    const repo = new CvRepository(engine);
    repo.saveColorPalette({ id: 'pal-2', name: 'Navy ink', basePaletteId: 'navy', colors: { primary: '#11224a' } });
    const bytes = engine.export();

    const engine2 = await SqlEngine.create(bytes);
    const repo2 = new CvRepository(engine2);
    expect(engine2.schemaVersion).toBe(SCHEMA_VERSION);
    expect(repo2.listColorPalettes()[0].colors.primary).toBe('#11224a');
  });
});
