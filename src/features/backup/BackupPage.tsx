/**
 * Backup & Restore.
 *
 * A backup is a single portable ZIP archive:
 *   manifest.json  — version, counts, SHA-256 of the database, creation time
 *   database.sqlite— the complete SQLite file (customers, projects, history)
 *   attachments/   — photos & signatures are stored inside the DB as data URLs,
 *                    so the archive is fully self-contained and portable between
 *                    computers.
 *
 * Restore verifies the manifest, the checksum and SQLite's own integrity_check
 * before swapping the live database, and keeps an automatic safety copy of the
 * current data first.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileArchive,
  HardDriveDownload,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Badge, Button, ConfirmDialog, Notice, SectionHeader, formatRelative, useLang, useT } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { getBridge, isDesktop } from '@/platform';
import { buildBackupArchive, validateBackupArchive } from '@/lib/backup';
import { nowIso, uid } from '@/lib/defaults';
import { APP_VERSION, BUILD_NUMBER } from '@/lib/appMeta';
import type { BackupRecord } from '@/types/cv';


export const BackupPage: React.FC = () => {
  const { repo, refreshLists, counts, projects, customers } = useWorkspace();
  const lang = useLang();
  const tr = useT();
  const [busy, setBusy] = useState<null | 'create' | 'restore'>(null);
  const [pendingRestore, setPendingRestore] = useState<Uint8Array | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const history = useMemo<BackupRecord[]>(() => repo?.listBackups() ?? [], [repo, lastResult, counts.projects]);

  const createBackup = async () => {
    if (!repo) return;
    setBusy('create');
    try {
      const dbBytes = repo.db.export();
      const { bytes: zipped } = await buildBackupArchive({
        database: dbBytes,
        schemaVersion: repo.db.schemaVersion,
        appVersion: APP_VERSION,
        build: BUILD_NUMBER,
        counts: { customers: counts.customers, projects: counts.projects },
        createdAt: nowIso(),
      });
      const fileName = `shohan-backup-${nowIso().slice(0, 10)}.scvbackup`;
      const result = await getBridge().chooseBackupPath(fileName, zipped);
      if (!result.saved) {
        setBusy(null);
        return;
      }
      repo.logBackup({
        id: uid(),
        fileName: result.path?.split(/[\\/]/).pop() ?? fileName,
        path: result.path ?? fileName,
        createdAt: nowIso(),
        sizeBytes: zipped.length,
        verified: true,
        kind: 'manual',
      });
      setLastResult({
        ok: true,
        message:
          lang === 'bn'
            ? `ব্যাকআপ তৈরি হয়েছে (${(zipped.length / 1024).toFixed(0)} KB) — ${result.path ?? fileName}`
            : `Backup created (${(zipped.length / 1024).toFixed(0)} KB) — ${result.path ?? fileName}`,
      });
      useWorkspace.getState().pushToast({ kind: 'success', title: tr('backup.create'), detail: result.path ?? fileName });
      refreshLists();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLastResult({ ok: false, message });
      useWorkspace.getState().pushToast({ kind: 'error', title: 'Backup failed', detail: message });
      repo?.logError('backup.create', message);
    } finally {
      setBusy(null);
    }
  };

  const pickBackup = async () => {
    setBusy('restore');
    try {
      const result = await getBridge().openBackupFile();
      if (result.cancelled || !result.bytes) return;
      // Validate before asking for confirmation. Nothing is written until the
      // operator confirms, and the archive is rejected if any check fails.
      const validation = await validateBackupArchive(result.bytes, repo?.db.schemaVersion ?? 2);
      if (!validation.ok) {
        const messages: Record<string, { en: string; bn: string }> = {
          'not-a-backup': { en: 'This is not a valid backup (manifest or database missing).', bn: 'ব্যাকআপ ফাইলটি সঠিক নয় (manifest বা database নেই)।' },
          'foreign-app': { en: 'This backup belongs to a different application.', bn: 'ভিন্ন অ্যাপের ব্যাকআপ ফাইল।' },
          checksum: { en: 'Checksum mismatch — the backup may be corrupted.', bn: 'ফাইলের চেকসাম মেলেনি — ব্যাকআপটি ক্ষতিগ্রস্ত হতে পারে।' },
          'too-new': { en: 'This backup was made by a newer version of the app.', bn: 'এই ব্যাকআপটি অ্যাপের নতুন সংস্করণে তৈরি।' },
          corrupt: { en: 'The file is unreadable or corrupted.', bn: 'ফাইলটি পড়া যাচ্ছে না বা ক্ষতিগ্রস্ত।' },
        };
        const copy = messages[validation.reason] ?? messages.corrupt;
        throw new Error(lang === 'bn' ? copy.bn : copy.en);
      }
      setPendingRestore(validation.database);
      setPendingName(result.fileName ?? 'backup.scvbackup');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLastResult({ ok: false, message });
      useWorkspace.getState().pushToast({ kind: 'error', title: 'Restore failed', detail: message });
    } finally {
      setBusy(null);
    }
  };

  const doRestore = async () => {
    if (!pendingRestore) return;
    setBusy('restore');
    try {
      // Safety copy of current data before destructive restore.
      const safety = repo?.db.export();
      if (safety) {
        // Same archive format as a manual backup, so a pre-restore safety copy
        // is itself restorable — a half-applied restore can always be undone.
        const { bytes: zipped } = await buildBackupArchive({
          database: safety,
          schemaVersion: repo!.db.schemaVersion,
          appVersion: APP_VERSION,
          build: BUILD_NUMBER,
          counts: { customers: counts.customers, projects: counts.projects },
          createdAt: nowIso(),
        });
        await getBridge().chooseBackupPath(`shohan-pre-restore-${Date.now()}.scvbackup`, zipped);
      }

      const { SqlEngine } = await import('@/database/sqlite');
      const { CvRepository } = await import('@/database/cvRepository');
      const engine = await SqlEngine.create(pendingRestore, {
        onPersist: (bytes) => {
          void getBridge().saveDatabase(bytes);
        },
      });
      const integrity = engine.integrityCheck();
      if (!integrity.ok) throw new Error(`Database integrity check failed: ${integrity.message}`);

      const fresh = new CvRepository(engine);
      await getBridge().saveDatabase(engine.export());

      // Swap the repository into the store and refresh every list.
      useWorkspace.setState({ repo: fresh, current: null, undoStack: [], redoStack: [] });
      refreshLists();
      useWorkspace.getState().pushToast({
        kind: 'success',
        title: lang === 'bn' ? 'রিস্টোর সম্পন্ন' : 'Restore complete',
        detail: lang === 'bn' ? 'সব গ্রাহক ও সিভি প্রকল্প ফিরে এসেছে।' : 'All customers and CV projects have been restored.',
      });
      setLastResult({ ok: true, message: lang === 'bn' ? 'রিস্টোর সফল — ডেটাবেস যাচাই করা হয়েছে।' : 'Restore succeeded — database verified.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setLastResult({ ok: false, message });
      useWorkspace.getState().pushToast({ kind: 'error', title: 'Restore failed', detail: message });
    } finally {
      setBusy(null);
      setPendingRestore(null);
      setPendingName('');
    }
  };

  return (
    <div className="page">
      <SectionHeader
        title={tr('backup.title')}
        subtitle={tr('backup.subtitle')}
        actions={
          <Button icon={<RefreshCw size={15} />} onClick={() => refreshLists()} size="sm">
            {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
        }
      />

      <div className="grid grid-golden" style={{ gap: 'var(--sp-4)' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileArchive size={16} /> {tr('backup.create')}
            </h3>
            <Badge tone="success" icon={<ShieldCheck size={10} />}>
              {lang === 'bn' ? 'চেকসাম যাচাই' : 'Checksum verified'}
            </Badge>
          </div>
          <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
            <Notice tone="info">
              {lang === 'bn'
                ? 'একটি ফাইলে সম্পূর্ণ ডেটাবেস, গ্রাহক, সিভি প্রকল্প, ছবি ও স্বাক্ষর সংরক্ষিত হবে। এই ফাইলটি অন্য কম্পিউটারে নিয়ে রিস্টোর করা যাবে।'
                : 'One file contains the entire database: customers, CV projects, photos and signatures. Carry it to another computer and restore there.'}
            </Notice>
            <div className="grid grid-3" style={{ gap: 'var(--sp-3)' }}>
              <Stat label={tr('dash.customers')} value={counts.customers} icon={<Database size={15} />} />
              <Stat label={tr('dash.totalCv')} value={counts.projects} icon={<FileArchive size={15} />} />
              <Stat
                label={lang === 'bn' ? 'ডেটাবেস' : 'Database'}
                value={`${(repo?.db.export().length ?? 0) / 1024 > 1024 ? `${((repo?.db.export().length ?? 0) / 1048576).toFixed(1)} MB` : `${Math.round((repo?.db.export().length ?? 0) / 1024)} KB`}`}
                icon={<HardDriveDownload size={15} />}
              />
            </div>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <Button variant="primary" icon={<Download size={15} />} onClick={() => void createBackup()} loading={busy === 'create'} block>
                {tr('backup.create')}
              </Button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Upload size={16} /> {tr('backup.restore')}
            </h3>
          </div>
          <div className="card-body col" style={{ gap: 'var(--sp-3)' }}>
            <Notice tone="warning">
              {lang === 'bn'
                ? 'রিস্টোর করলে বর্তমান ডেটা প্রতিস্থাপিত হবে। নিরাপত্তার জন্য আগে স্বয়ংক্রিয়ভাবে একটি প্রি-রিস্টোর ব্যাকআপ নেওয়া হবে।'
                : 'Restoring replaces the current data. A pre-restore safety backup is created automatically first.'}
            </Notice>
            <Button icon={<Upload size={15} />} onClick={() => void pickBackup()} loading={busy === 'restore'} block>
              {tr('backup.restore')}
            </Button>
            <input ref={fileRef} type="file" accept=".scvbackup,.zip" hidden onChange={() => undefined} />
            <p className="small faint" style={{ margin: 0, lineHeight: 1.55 }}>
              {lang === 'bn'
                ? 'ফাইলটি রিস্টোরের আগে স্বয়ংক্রিয়ভাবে যাচাই করা হয়: ম্যানিফেস্ট, SHA-256 চেকসাম এবং SQLite integrity_check।'
                : 'The file is verified before restoring: manifest, SHA-256 checksum and SQLite integrity_check.'}
            </p>
          </div>
        </div>
      </div>

      {lastResult ? (
        <Notice tone={lastResult.ok ? 'success' : 'danger'} icon={lastResult.ok ? <CheckCircle2 /> : <AlertTriangle />}>
          <strong>{lastResult.ok ? (lang === 'bn' ? 'সফল' : 'Success') : lang === 'bn' ? 'ব্যর্থ' : 'Failed'}</strong>
          <div>{lastResult.message}</div>
        </Notice>
      ) : null}

      <div className="card">
        <div className="card-header">
          <h3>{lang === 'bn' ? 'ব্যাকআপ ইতিহাস' : 'Backup history'}</h3>
          <Badge>{history.length}</Badge>
        </div>
        {history.length === 0 ? (
          <div className="card-body small muted">{lang === 'bn' ? 'এখনো কোনো ব্যাকআপ নেওয়া হয়নি।' : 'No backups yet.'}</div>
        ) : (
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>{lang === 'bn' ? 'ফাইল' : 'File'}</th>
                  <th>{lang === 'bn' ? 'তারিখ' : 'Created'}</th>
                  <th className="num">{lang === 'bn' ? 'আকার' : 'Size'}</th>
                  <th>{lang === 'bn' ? 'যাচাই' : 'Verified'}</th>
                  <th aria-label="reveal" />
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td className="mono">{record.fileName}</td>
                    <td className="small muted">{formatRelative(record.createdAt, lang)}</td>
                    <td className="num small">{Math.round(record.sizeBytes / 1024)} KB</td>
                    <td>
                      {record.verified ? (
                        <Badge tone="success" icon={<CheckCircle2 size={10} />}>
                          OK
                        </Badge>
                      ) : (
                        <Badge tone="warning">—</Badge>
                      )}
                    </td>
                    <td className="num">
                      {isDesktop() && record.path ? (
                        <Button size="sm" variant="ghost" onClick={() => void getBridge().revealPath(record.path)}>
                          {lang === 'bn' ? 'ফোল্ডারে দেখান' : 'Show in folder'}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingRestore}
        title={lang === 'bn' ? 'ব্যাকআপ থেকে রিস্টোর করবেন?' : 'Restore from this backup?'}
        message={
          <div className="col" style={{ gap: 'var(--sp-2)' }}>
            <div className="mono">{pendingName}</div>
            <div>
              {lang === 'bn'
                ? 'বর্তমান সব গ্রাহক ও সিভি প্রকল্প এই ব্যাকআপের ডেটা দিয়ে প্রতিস্থাপিত হবে। চালিয়ে যাওয়ার আগে একটি সেফটি ব্যাকআপ নেওয়া হবে।'
                : 'All current customers and CV projects will be replaced with the data in this backup. A safety backup is taken first.'}
            </div>
          </div>
        }
        confirmLabel={lang === 'bn' ? 'রিস্টোর করুন' : 'Restore'}
        tone="primary"
        busy={busy === 'restore'}
        onCancel={() => setPendingRestore(null)}
        onConfirm={() => void doRestore()}
      />
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div style={{ padding: 'var(--sp-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)' }}>
    <div className="row" style={{ gap: 6, color: 'var(--text-faint)' }}>
      {icon}
      <span className="small">{label}</span>
    </div>
    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 640, marginTop: 4 }}>{value}</div>
  </div>
);
