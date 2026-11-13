// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SqlEngine } from '@/database/sqlite';
import { CvRepository } from '@/database/cvRepository';
import { createEmptyCv, createProject, createEmptyCustomer, nowIso, uid } from '@/lib/defaults';

describe('SQLite repository', () => {
  it('creates the schema and reports integrity', async () => {
    const engine = await SqlEngine.create(null);
    expect(engine.schemaVersion).toBe(1);
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
});
