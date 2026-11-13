/**
 * Backup archive format.
 *
 * Extracted from the Backup page so the format can be unit-tested with real
 * bytes: a round-trip test is the only way to know that a restore would actually
 * work before a shop operator depends on it.
 *
 * Archive layout (.scvbackup = plain ZIP):
 *   manifest.json   — version, counts, created time, SHA-256 of the database
 *   database.sqlite — the complete SQLite file
 *   README.txt      — human-readable restore instructions
 */
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

export const BACKUP_FORMAT = 1;
export const BACKUP_APP = 'SHOHAN CV STUDIO';

export interface BackupManifest {
  app: string;
  appVersion: string;
  build: string;
  schemaVersion: number;
  createdAt: string;
  counts: { customers: number; projects: number };
  databaseBytes: number;
  databaseSha256: string;
  format: number;
}

/** SHA-256 as lowercase hex. Returns 'unavailable' when WebCrypto is absent. */
export async function sha256(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return 'unavailable';
  // Copy into a plain ArrayBuffer: some engines reject views over shared buffers.
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  const digest = await subtle.digest('SHA-256', copy.buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface BuildBackupOptions {
  database: Uint8Array;
  schemaVersion: number;
  appVersion: string;
  build: string;
  counts: { customers: number; projects: number };
  createdAt: string;
}

/** Build the archive bytes plus the manifest that was embedded. */
export async function buildBackupArchive(
  options: BuildBackupOptions,
): Promise<{ bytes: Uint8Array; manifest: BackupManifest }> {
  const manifest: BackupManifest = {
    app: BACKUP_APP,
    appVersion: options.appVersion,
    build: options.build,
    schemaVersion: options.schemaVersion,
    createdAt: options.createdAt,
    counts: options.counts,
    databaseBytes: options.database.length,
    databaseSha256: await sha256(options.database),
    format: BACKUP_FORMAT,
  };
  const files: Record<string, Uint8Array> = {
    'manifest.json': strToU8(JSON.stringify(manifest, null, 2)),
    'database.sqlite': options.database,
    'README.txt': strToU8(
      [
        'SHOHAN CV STUDIO backup',
        `Created: ${manifest.createdAt}`,
        `App version: ${manifest.appVersion} (build ${manifest.build})`,
        `Customers: ${manifest.counts.customers}   CV projects: ${manifest.counts.projects}`,
        '',
        'To restore: open SHOHAN CV STUDIO -> Backup & Restore -> Restore from backup,',
        'then choose this .scvbackup file. Verification runs automatically.',
        '',
        'This archive contains personal data. Store it securely and delete it when no longer needed.',
      ].join('\n'),
    ),
  };
  return { bytes: zipSync(files, { level: 6 }), manifest };
}

export type BackupValidation =
  | { ok: true; manifest: BackupManifest; database: Uint8Array }
  | { ok: false; reason: 'not-a-backup' | 'foreign-app' | 'checksum' | 'too-new' | 'corrupt'; detail: string };

/**
 * Validate an archive *before* the operator is asked to confirm a restore.
 * Nothing is written until this returns ok.
 */
export async function validateBackupArchive(bytes: Uint8Array, currentSchemaVersion: number): Promise<BackupValidation> {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    return { ok: false, reason: 'corrupt', detail: 'The file is not a readable ZIP archive.' };
  }
  const manifestRaw = files['manifest.json'];
  const database = files['database.sqlite'];
  if (!manifestRaw || !database) {
    return { ok: false, reason: 'not-a-backup', detail: 'manifest.json or database.sqlite is missing.' };
  }
  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(strFromU8(manifestRaw)) as BackupManifest;
  } catch {
    return { ok: false, reason: 'corrupt', detail: 'manifest.json is not valid JSON.' };
  }
  if (manifest.app !== BACKUP_APP) {
    return { ok: false, reason: 'foreign-app', detail: `Archive belongs to "${manifest.app}".` };
  }
  if (typeof manifest.schemaVersion === 'number' && manifest.schemaVersion > currentSchemaVersion) {
    return {
      ok: false,
      reason: 'too-new',
      detail: `Backup schema v${manifest.schemaVersion} is newer than this build (v${currentSchemaVersion}). Update the app first.`,
    };
  }
  const checksum = await sha256(database);
  if (manifest.databaseSha256 !== 'unavailable' && checksum !== manifest.databaseSha256) {
    return { ok: false, reason: 'checksum', detail: 'SHA-256 mismatch — the archive may be corrupted.' };
  }
  return { ok: true, manifest, database };
}
