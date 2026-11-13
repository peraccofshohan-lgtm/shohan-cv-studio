// @vitest-environment node
/**
 * Backup / restore round-trip (Task 9).
 *
 * Builds a real SQLite database with real customer and project rows, exports the
 * bytes, packs a `.scvbackup` archive, validates it, restores it into a fresh
 * engine and reads the data back. This is the only way to know that a restore
 * works without a Windows machine.
 */
import { describe, it, expect } from 'vitest';
import { SqlEngine } from '@/database/sqlite';
import { CvRepository } from '@/database/cvRepository';
import { createEmptyCustomer, createProject, nowIso, uid } from '@/lib/defaults';
import { buildBackupArchive, validateBackupArchive, sha256, BACKUP_APP } from '@/lib/backup';
import { unzipSync, strFromU8 } from 'fflate';
import { SCHEMA_VERSION } from '@/database/schema';

async function seededRepo() {
  const engine = await SqlEngine.create(null);
  const repo = new CvRepository(engine);
  const customer = createEmptyCustomer({ name: 'করিম সাহেব', phone: '01711000000', email: 'karim@example.com' });
  repo.saveCustomer(customer);

  const project = createProject({ customerId: customer.id, title: 'Bank CV' });
  project.data.personal.fullName = 'মোঃ রফিকুল ইসলাম';
  project.data.personal.mobile = '+8801711234567';
  project.data.personal.email = 'rafiq@example.com';
  project.data.careerObjective.text = 'A precise objective used for the restore test.';
  project.data.skills.push({ id: uid(), name: 'Excel', category: 'Office', level: 'advanced' });
  project.data.title = { ...project.data.title, preset: 'custom', text: 'PROFESSIONAL PROFILE' };
  project.data.pageLength = { ...project.data.pageLength, mode: 'two-pages', maxPages: 2 };
  repo.saveProject(project);
  return { engine, repo, customer, project };
}

describe('backup archive', () => {
  it('contains a manifest, the database and a README', async () => {
    const { engine, repo, project } = await seededRepo();
    const { bytes, manifest } = await buildBackupArchive({
      database: engine.export(),
      schemaVersion: engine.schemaVersion,
      appVersion: '1.1.0',
      build: '2026.11',
      counts: { customers: repo.listCustomers().length, projects: repo.listProjects().length },
      createdAt: nowIso(),
    });

    const files = unzipSync(bytes);
    expect(Object.keys(files).sort()).toEqual(['README.txt', 'database.sqlite', 'manifest.json']);

    expect(manifest.app).toBe(BACKUP_APP);
    expect(manifest.format).toBe(1);
    expect(manifest.databaseSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.counts.projects).toBe(1);
    expect(strFromU8(files['README.txt'])).toContain('SHOHAN CV STUDIO');

    const json = JSON.parse(strFromU8(files['manifest.json']));
    expect(json.schemaVersion).toBe(SCHEMA_VERSION);
    expect(json.databaseBytes).toBeGreaterThan(0);
    expect(project.id).toBeTruthy();
  });

  it('round-trips customer, project, title block and page policy through a restore', async () => {
    const { engine, repo, customer, project } = await seededRepo();
    const { bytes } = await buildBackupArchive({
      database: engine.export(),
      schemaVersion: engine.schemaVersion,
      appVersion: '1.1.0',
      build: '2026.11',
      counts: { customers: 1, projects: 1 },
      createdAt: nowIso(),
    });

    const validation = await validateBackupArchive(bytes, SCHEMA_VERSION);
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;

    // Restore into a completely fresh engine, as the app does.
    const restored = await SqlEngine.create(validation.database);
    const restoredRepo = new CvRepository(restored);

    expect(restoredRepo.listCustomers().map((c) => c.name)).toContain(customer.name);
    const loaded = restoredRepo.getProject(project.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.data.personal.fullName).toBe('মোঃ রফিকুল ইসলাম');
    expect(loaded!.data.careerObjective.text).toContain('restore test');
    expect(loaded!.data.skills[0].name).toBe('Excel');
    // v1.1 fields survive the round-trip too.
    expect(loaded!.data.title.text).toBe('PROFESSIONAL PROFILE');
    expect(loaded!.data.pageLength.mode).toBe('two-pages');
    // And the restored database is structurally sound.
    expect(restored.integrityCheck().ok).toBe(true);
    expect(restored.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('rejects a corrupted archive instead of destroying existing data', async () => {
    const { engine } = await seededRepo();
    const { bytes } = await buildBackupArchive({
      database: engine.export(),
      schemaVersion: engine.schemaVersion,
      appVersion: '1.1.0',
      build: '2026.11',
      counts: { customers: 1, projects: 1 },
      createdAt: nowIso(),
    });

    // Flip one byte inside the stored database entry by rebuilding the zip with
    // a tampered payload but the original manifest.
    const files = unzipSync(bytes);
    const tampered = new Uint8Array(files['database.sqlite']);
    tampered[tampered.length - 1] ^= 0xff;
    const { zipSync } = await import('fflate');
    const rebuilt = zipSync({
      'manifest.json': files['manifest.json'],
      'database.sqlite': tampered,
      'README.txt': files['README.txt'],
    });

    const validation = await validateBackupArchive(rebuilt, SCHEMA_VERSION);
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.reason).toBe('checksum');
  });

  it('rejects a foreign archive and a non-zip file', async () => {
    const { zipSync, strToU8 } = await import('fflate');
    const foreign = zipSync({
      'manifest.json': strToU8(JSON.stringify({ app: 'SOME OTHER APP' })),
      'database.sqlite': new Uint8Array([1, 2, 3]),
    });
    const a = await validateBackupArchive(foreign, SCHEMA_VERSION);
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.reason).toBe('foreign-app');

    const b = await validateBackupArchive(strToU8('this is not a zip file'), SCHEMA_VERSION);
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.reason).toBe('corrupt');
  });

  it('refuses a backup created by a newer schema', async () => {
    const { engine } = await seededRepo();
    const { bytes } = await buildBackupArchive({
      database: engine.export(),
      schemaVersion: 99,
      appVersion: '9.9.9',
      build: 'future',
      counts: { customers: 0, projects: 0 },
      createdAt: nowIso(),
    });
    const validation = await validateBackupArchive(bytes, SCHEMA_VERSION);
    expect(validation.ok).toBe(false);
    if (!validation.ok) expect(validation.reason).toBe('too-new');
  });

  it('produces a stable SHA-256 for identical bytes', async () => {
    const payload = new Uint8Array([1, 2, 3, 4, 5]);
    const a = await sha256(payload);
    const b = await sha256(payload);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('persistence across a simulated app restart', () => {
  it('reloads a saved database file from disk bytes', async () => {
    const { engine, project } = await seededRepo();
    const fileBytes = engine.export();

    // Simulate closing and reopening the app: a new engine over the saved bytes.
    const reopened = await SqlEngine.create(fileBytes);
    const repo = new CvRepository(reopened);
    const loaded = repo.getProject(project.id);
    expect(loaded?.data.personal.fullName).toBe('মোঃ রফিকুল ইসলাম');
    expect(repo.listProjects()).toHaveLength(1);
  });

  it('keeps autosaved edits after a second save', async () => {
    const { engine, repo, project } = await seededRepo();
    project.data.personal.headline = 'Senior Accounts Officer';
    repo.saveProject({ ...project, version: 2 });
    const bytes = engine.export();

    const reopened = await SqlEngine.create(bytes);
    const loaded = new CvRepository(reopened).getProject(project.id);
    expect(loaded?.data.personal.headline).toBe('Senior Accounts Officer');
    expect(loaded?.version).toBe(2);
  });
});
