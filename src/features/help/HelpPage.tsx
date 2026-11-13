/**
 * Help & About — a genuine user guide, compatibility matrix and diagnostics.
 * Everything here reflects what the software actually does; unverified
 * platform claims are explicitly marked "not tested".
 */
import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  CircleSlash,
  Download,
  FileText,
  Keyboard,
  LifeBuoy,
  Monitor,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { Badge, Button, Notice, SectionHeader, useLang } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { APP_NAME, APP_VERSION, BUILD_NUMBER } from '@/lib/appMeta';
import { getBridge, isDesktop } from '@/platform';
import { WIZARD_STEPS } from '@/features/cv-wizard/steps';
import { TEMPLATES } from '@/templates/catalog';
import { toBengaliDigits as bnDigits } from '@/lib/sections';

type PlatformStatus = 'passed' | 'failed' | 'untested' | 'unsupported';

const COMPAT: { os: string; arch: string; status: PlatformStatus; note: { bn: string; en: string } }[] = [
  {
    os: 'Windows 7 SP1',
    arch: 'x86 / x64',
    status: 'untested',
    note: {
      bn: 'Electron 22-এর জন্য নির্বাচিত। এই পরিবেশে বাস্তব পরীক্ষা করা সম্ভব হয়নি — স্বয়ংক্রিয় পরীক্ষায় পাস, তবে Windows 7-এ ম্যানুয়াল যাচাই প্রয়োজন।',
      en: 'Targeted via Electron 22. Automated tests pass, but no real Windows 7 machine was available here — manual verification required.',
    },
  },
  {
    os: 'Windows 8 / 8.1',
    arch: 'x86 / x64',
    status: 'untested',
    note: { bn: 'একই রানটাইম — ম্যানুয়াল যাচাই প্রয়োজন।', en: 'Same runtime — manual verification required.' },
  },
  {
    os: 'Windows 10',
    arch: 'x64',
    status: 'untested',
    note: { bn: 'ইনস্টলার কনফিগার করা আছে; এই পরিবেশে চালানো সম্ভব নয়।', en: 'Installer configured; cannot be executed in this environment.' },
  },
  {
    os: 'Windows 11',
    arch: 'x64',
    status: 'untested',
    note: { bn: 'ইনস্টলার কনফিগার করা আছে; এই পরিবেশে চালানো সম্ভব নয়।', en: 'Installer configured; cannot be executed in this environment.' },
  },
];

export const HelpPage: React.FC = () => {
  const { bridgeInfo, repo, pushToast } = useWorkspace();
  const lang = useLang();
  const [errors, setErrors] = useState<{ createdAt: string; scope: string; message: string }[] | null>(null);

  const loadErrors = () => {
    setErrors(repo?.recentErrors(30) ?? []);
  };

  const exportLog = async () => {
    const rows = repo?.recentErrors(200) ?? [];
    const text = rows.map((r) => `${r.createdAt}\t${r.scope}\t${r.message}`).join('\n');
    const result = await getBridge().saveText({ suggestedName: 'shohan-diagnostics.txt', text: text || '(no errors logged)', extensions: ['txt'] });
    if (result.saved) pushToast({ kind: 'success', title: lang === 'bn' ? 'লগ সংরক্ষিত' : 'Log exported' });
  };

  return (
    <div className="page">
      <SectionHeader
        title={lang === 'bn' ? 'সহায়তা ও পরিচিতি' : 'Help & about'}
        subtitle={lang === 'bn' ? 'ব্যবহার নির্দেশিকা, কীবোর্ড শর্টকাট, প্ল্যাটফর্ম অবস্থা ও ডায়াগনস্টিকস।' : 'User guide, keyboard shortcuts, platform status and diagnostics.'}
      />

      <div className="grid grid-golden" style={{ gap: 'var(--sp-4)' }}>
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} /> {lang === 'bn' ? 'সংক্ষিপ্ত ব্যবহার নির্দেশিকা' : 'Quick user guide'}
            </h3>
          </div>
          <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
            {[
              {
                icon: <FileText size={15} />,
                title: lang === 'bn' ? '১. নতুন সিভি তৈরি করুন' : '1. Create a new CV',
                // Counts are derived, never typed: a hard-coded "19 steps" stayed
                // in this screen after the wizard grew to 20.
                body:
                  lang === 'bn'
                    ? `ড্যাশবোর্ড থেকে “নতুন সিভি” চাপুন। ${bnDigits(String(WIZARD_STEPS.length))}টি ধাপে তথ্য দিন — প্রতিটি ধাপ স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়। ঐচ্ছিক ধাপগুলো “এড়িয়ে যান” দিয়ে বাদ দিতে পারবেন।`
                    : `Press “Create New CV” on the dashboard. Fill in the ${WIZARD_STEPS.length} steps — each one saves automatically. Optional steps can be skipped.`,
              },
              {
                icon: <Monitor size={15} />,
                title: lang === 'bn' ? '২. টেমপ্লেট বেছে নিন' : '2. Choose a template',
                body:
                  lang === 'bn'
                    ? `উইজার্ড শেষে ${bnDigits(String(TEMPLATES.length))}টি টেমপ্লেটের গ্যালারি খুলবে। প্রতিটি কার্ডে আসল লেআউট দেখা যায়। টেমপ্লেট বদলালেও কোনো তথ্য হারাবে না।`
                    : `The gallery opens with all ${TEMPLATES.length} templates. Every card shows the real layout. Switching templates never loses data.`,
              },
              {
                icon: <Printer size={15} />,
                title: lang === 'bn' ? '৩. প্রিন্ট ও এক্সপোর্ট' : '3. Print & export',
                body:
                  lang === 'bn'
                    ? 'এডিটিং স্টুডিওতে Print, DOCX ও PDF বাটন আছে। DOCX সম্পূর্ণ সম্পাদনযোগ্য, PDF-এর পাঠ্য সার্চযোগ্য, আর প্রিন্ট সরাসরি A4 প্রিন্টারে যায়।'
                    : 'The studio has Print, DOCX and PDF actions. DOCX stays fully editable, PDF text is searchable, and printing goes straight to A4 paper.',
              },
              {
                icon: <ShieldCheck size={15} />,
                title: lang === 'bn' ? '৪. ব্যাকআপ রাখুন' : '4. Keep a backup',
                body:
                  lang === 'bn'
                    ? 'প্রতিদিন কাজ শেষে Backup & Restore থেকে ব্যাকআপ নিন। একটি ফাইলেই সব গ্রাহক, সিভি ও ছবি থাকে — অন্য কম্পিউটারে রিস্টোর করা যাবে।'
                    : 'Take a backup at the end of each day. One file holds every customer, CV and photo, and restores on another computer.',
              },
            ].map((step) => (
              <div key={step.title} className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
                <Badge tone="primary">{step.icon}</Badge>
                <div>
                  <div style={{ fontWeight: 580, fontSize: 'var(--fs-sm)' }}>{step.title}</div>
                  <div className="small muted" style={{ lineHeight: 1.6, marginTop: 2 }}>
                    {step.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col" style={{ gap: 'var(--sp-4)' }}>
          <div className="card">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Keyboard size={16} /> {lang === 'bn' ? 'কীবোর্ড শর্টকাট' : 'Keyboard shortcuts'}
              </h3>
            </div>
            <div className="card-body col" style={{ gap: 8 }}>
              {[
                ['Ctrl / Cmd + S', lang === 'bn' ? 'সংরক্ষণ' : 'Save'],
                ['Ctrl / Cmd + Z', lang === 'bn' ? 'আনডু' : 'Undo'],
                ['Ctrl / Cmd + Y', lang === 'bn' ? 'রিডু' : 'Redo'],
                ['Ctrl / Cmd + N', lang === 'bn' ? 'নতুন সিভি (উইজার্ড শুরু)' : 'New CV (opens the wizard)'],
                ['Esc', lang === 'bn' ? 'ডায়ালগ বন্ধ' : 'Close dialog'],
                ['Tab', lang === 'bn' ? 'পরবর্তী নিয়ন্ত্রণে যান' : 'Next control'],
              ].map(([key, label]) => (
                <div key={key} className="row between">
                  <span className="small muted">{label}</span>
                  <kbd>{key}</kbd>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>{lang === 'bn' ? 'সিস্টেম তথ্য' : 'System information'}</h3>
            </div>
            <div className="card-body col" style={{ gap: 6 }}>
              <Row label="App" value={`${APP_NAME} v${APP_VERSION}`} />
              <Row label="Build" value={BUILD_NUMBER} />
              <Row label="Runtime" value={bridgeInfo?.kind === 'electron' ? `Electron ${bridgeInfo.electronVersion}` : 'Browser'} />
              <Row label="Chromium" value={bridgeInfo?.chromeVersion ?? navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? '—'} />
              <Row label={lang === 'bn' ? 'ডেটা পাথ' : 'Data path'} value={bridgeInfo?.dataPath ?? '—'} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>{lang === 'bn' ? 'Windows সামঞ্জস্য ম্যাট্রিক্স' : 'Windows compatibility matrix'}</h3>
          <Badge tone="warning">{lang === 'bn' ? 'বাস্তব যাচাই বাকি' : 'Physical verification pending'}</Badge>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="data">
            <thead>
              <tr>
                <th>OS</th>
                <th>{lang === 'bn' ? 'আর্কিটেকচার' : 'Architecture'}</th>
                <th>{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th>{lang === 'bn' ? 'মন্তব্য' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody>
              {COMPAT.map((row) => (
                <tr key={row.os}>
                  <td style={{ fontWeight: 560 }}>{row.os}</td>
                  <td className="small muted">{row.arch}</td>
                  <td>
                    <StatusBadge status={row.status} lang={lang} />
                  </td>
                  <td className="small muted" style={{ maxWidth: 520 }}>
                    {lang === 'bn' ? row.note.bn : row.note.en}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body">
          <Notice tone="warning">
            {lang === 'bn'
              ? 'সততার সাথে বলতে হয়: এই বিল্ডটি Linux কনটেইনারে তৈরি ও স্বয়ংক্রিয়ভাবে পরীক্ষিত। কোনো Windows মেশিনে বাস্তব ইনস্টলেশন পরীক্ষা করা হয়নি, তাই কোনো OS-কে “Passed” বলে দাবি করা হচ্ছে না।'
              : 'To be explicit: this build was produced and automatically tested in a Linux container. It has not been installed on a physical Windows machine, so no OS is claimed as “Passed”.'}
          </Notice>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LifeBuoy size={16} /> {lang === 'bn' ? 'ডায়াগনস্টিকস' : 'Diagnostics'}
          </h3>
          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <Button size="sm" onClick={loadErrors}>
              {lang === 'bn' ? 'লগ দেখুন' : 'View log'}
            </Button>
            <Button size="sm" icon={<Download size={13} />} onClick={() => void exportLog()}>
              {lang === 'bn' ? 'লগ এক্সপোর্ট' : 'Export log'}
            </Button>
          </div>
        </div>
        <div className="card-body">
          {errors === null ? (
            <span className="small muted">
              {lang === 'bn'
                ? 'লগে কোনো সংবেদনশীল CV তথ্য লেখা হয় না — শুধু ত্রুটির ধরন ও প্রযুক্তিগত বার্তা।'
                : 'No sensitive CV content is ever written to the log — only error types and technical messages.'}
            </span>
          ) : errors.length === 0 ? (
            <div className="row" style={{ gap: 8 }}>
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
              <span className="small">
                {lang === 'bn' ? 'কোনো ত্রুটি লগ হয়নি।' : 'No errors have been logged.'}
              </span>
            </div>
          ) : (
            <div className="col" style={{ gap: 4, maxHeight: 260, overflow: 'auto' }}>
              {errors.map((error, index) => (
                <div key={index} className="small mono" style={{ padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="faint">{error.createdAt.slice(0, 19).replace('T', ' ')}</span> · <strong>{error.scope}</strong> · {error.message}
                </div>
              ))}
            </div>
          )}
          {!isDesktop() ? (
            <p className="small faint" style={{ marginTop: 'var(--sp-3)' }}>
              {lang === 'bn'
                ? 'ব্রাউজার মোডে চলছে — ডেটাবেস IndexedDB-তে সংরক্ষিত। ডেস্কটপ বিল্ডে ডেটা %APPDATA%\\Shohan CV Studio-তে থাকে।'
                : 'Running in browser mode — the database lives in IndexedDB. The desktop build stores it in %APPDATA%\\Shohan CV Studio.'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="row between" style={{ gap: 'var(--sp-3)' }}>
    <span className="small muted">{label}</span>
    <span className="small mono truncate" title={value} style={{ maxWidth: 260 }}>
      {value}
    </span>
  </div>
);

const StatusBadge: React.FC<{ status: PlatformStatus; lang: 'bn' | 'en' }> = ({ status, lang }) => {
  if (status === 'passed') return <Badge tone="success" icon={<CheckCircle2 size={10} />}>{lang === 'bn' ? 'পাস' : 'Passed'}</Badge>;
  if (status === 'failed') return <Badge tone="danger" icon={<TriangleAlert size={10} />}>{lang === 'bn' ? 'ব্যর্থ' : 'Failed'}</Badge>;
  if (status === 'unsupported') return <Badge tone="danger" icon={<CircleSlash size={10} />}>{lang === 'bn' ? 'অসমর্থিত' : 'Unsupported'}</Badge>;
  return <Badge tone="warning">{lang === 'bn' ? 'পরীক্ষা হয়নি' : 'Not tested'}</Badge>;
};
