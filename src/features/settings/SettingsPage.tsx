/**
 * Application settings: general, CV defaults, printing, export, backup,
 * privacy and about. Every control writes through to the local database.
 */
import React, { useState } from 'react';
import {
  Database,
  FileDown,
  Info,
  Languages,
  Monitor,
  Palette,
  Printer,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Notice,
  SectionHeader,
  Segmented,
  Select,
  Switch,
  useLang,
  useT,
} from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { APP_NAME, APP_VERSION, BUILD_NUMBER } from '@/lib/appMeta';
import { FONT_PAIRS, TEMPLATES } from '@/templates/catalog';
import { getBridge, isDesktop } from '@/platform';
import type { CVLanguage } from '@/types/cv';

type Tab = 'general' | 'defaults' | 'printing' | 'export' | 'backup' | 'privacy' | 'about';

export const SettingsPage: React.FC = () => {
  const { settings, setSettings, bridgeInfo, refreshLists, repo } = useWorkspace();
  const { theme, setTheme, language, setLanguage } = useUI();
  const tr = useT();
  const lang = language;
  const [tab, setTab] = useState<Tab>('general');
  const [confirmWipe, setConfirmWipe] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: tr('settings.general'), icon: <Monitor size={15} /> },
    { id: 'defaults', label: tr('settings.defaults'), icon: <Palette size={15} /> },
    { id: 'printing', label: tr('settings.printing'), icon: <Printer size={15} /> },
    { id: 'export', label: tr('settings.export'), icon: <FileDown size={15} /> },
    { id: 'backup', label: tr('settings.backup'), icon: <Database size={15} /> },
    { id: 'privacy', label: tr('settings.privacy'), icon: <ShieldCheck size={15} /> },
    { id: 'about', label: tr('settings.about'), icon: <Info size={15} /> },
  ];

  const wipeAll = async () => {
    if (!repo) return;
    repo.db.transaction(() => {
      for (const table of ['cv_projects', 'customers', 'export_history', 'backup_history', 'error_log']) {
        repo.db.run(`DELETE FROM ${table}`);
      }
    });
    refreshLists();
    setConfirmWipe(false);
    useWorkspace.getState().pushToast({
      kind: 'success',
      title: lang === 'bn' ? 'সব লোকাল ডেটা মুছে ফেলা হয়েছে' : 'All local data deleted',
    });
  };

  return (
    <div className="page">
      <SectionHeader title={tr('settings.title')} subtitle={lang === 'bn' ? 'সব সেটিংস এই কম্পিউটারে সংরক্ষিত থাকে।' : 'All settings are stored on this computer only.'} />

      <div className="grid" style={{ gridTemplateColumns: '216px minmax(0,1fr)', gap: 'var(--sp-5)', alignItems: 'start' }}>
        <nav className="card" style={{ padding: 'var(--sp-2)', position: 'sticky', top: 0 }} aria-label="Settings sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              className="nav-item"
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
              style={{ fontSize: 'var(--fs-sm)' }}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="col" style={{ gap: 'var(--sp-4)' }}>
          {tab === 'general' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.general')}</h3>
              </div>
              <div className="card-body col" style={{ gap: 'var(--sp-5)' }}>
                <Field label={lang === 'bn' ? 'ইন্টারফেস ভাষা' : 'Interface language'} hint={lang === 'bn' ? 'সিভির ভেতরের ভাষা আলাদা — উইজার্ডে নির্ধারণ করা যায়।' : 'The CV language is separate and set in the wizard.'}>
                  <Segmented
                    value={language}
                    onChange={(v) => setLanguage(v)}
                    options={[
                      { value: 'bn' as const, label: 'বাংলা' },
                      { value: 'en' as const, label: 'English' },
                    ]}
                    ariaLabel="Interface language"
                  />
                </Field>
                <Field label={lang === 'bn' ? 'থিম' : 'Theme'}>
                  <Segmented
                    value={theme}
                    onChange={(v) => {
                      setTheme(v);
                      void setSettings({ theme: v });
                    }}
                    options={[
                      { value: 'light' as const, label: lang === 'bn' ? 'লাইট' : 'Light' },
                      { value: 'dark' as const, label: lang === 'bn' ? 'ডার্ক' : 'Dark' },
                      { value: 'system' as const, label: lang === 'bn' ? 'সিস্টেম' : 'System' },
                    ]}
                    ariaLabel="Theme"
                  />
                </Field>
                <Field label={lang === 'bn' ? 'স্বয়ংক্রিয় সংরক্ষণের ব্যবধান' : 'Autosave interval'}>
                  <Select value={String(settings.autosaveMs)} onChange={(e) => void setSettings({ autosaveMs: Number(e.target.value) })}>
                    <option value="600">{lang === 'bn' ? 'প্রতি ০.৬ সেকেন্ড (দ্রুত)' : '0.6 s (fast)'}</option>
                    <option value="1200">{lang === 'bn' ? 'প্রতি ১.২ সেকেন্ড (প্রস্তাবিত)' : '1.2 s (recommended)'}</option>
                    <option value="2500">{lang === 'bn' ? 'প্রতি ২.৫ সেকেন্ড' : '2.5 s'}</option>
                    <option value="5000">{lang === 'bn' ? 'প্রতি ৫ সেকেন্ড (কম লেখা)' : '5 s (fewer writes)'}</option>
                  </Select>
                </Field>
                <div className="row between">
                  <div>
                    <div style={{ fontWeight: 560 }}>{lang === 'bn' ? 'অ্যানিমেশন কমান' : 'Reduce motion'}</div>
                    <div className="small muted">{lang === 'bn' ? 'ট্রানজিশন বন্ধ করে দ্রুত অনুভূতি দেয়' : 'Disables transitions for a snappier feel'}</div>
                  </div>
                  <Switch
                    checked={settings.reduceMotion}
                    onChange={(next) => {
                      void setSettings({ reduceMotion: next });
                      document.documentElement.setAttribute('data-motion', next ? 'reduced' : 'normal');
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'defaults' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.defaults')}</h3>
              </div>
              <div className="card-body field-grid">
                <Field label={lang === 'bn' ? 'ডিফল্ট CV ভাষা' : 'Default CV language'}>
                  <Select
                    value={settings.defaultCvLanguage}
                    onChange={(e) => void setSettings({ defaultCvLanguage: e.target.value as CVLanguage })}
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা</option>
                    <option value="mixed">Bangla + English</option>
                  </Select>
                </Field>
                <Field label={lang === 'bn' ? 'ডিফল্ট টেমপ্লেট' : 'Default template'}>
                  <Select value={settings.defaultTemplateId} onChange={(e) => void setSettings({ defaultTemplateId: e.target.value })}>
                    {TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {lang === 'bn' ? t.nameBn : t.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={lang === 'bn' ? 'ডিফল্ট ফন্ট' : 'Default font pairing'}>
                  <Select value={settings.defaultFontPairId} onChange={(e) => void setSettings({ defaultFontPairId: e.target.value })}>
                    {FONT_PAIRS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {lang === 'bn' ? f.nameBn : f.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={lang === 'bn' ? 'ডিফল্ট পেজ মার্জিন' : 'Default page margin'}>
                  <Select value={String(settings.defaultMarginMm)} onChange={(e) => void setSettings({ defaultMarginMm: Number(e.target.value) })}>
                    <option value="12">12 mm</option>
                    <option value="14">14 mm</option>
                    <option value="16">16 mm {lang === 'bn' ? '(প্রস্তাবিত)' : '(recommended)'}</option>
                    <option value="18">18 mm</option>
                    <option value="20">20 mm</option>
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          {tab === 'printing' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.printing')}</h3>
                <Badge tone="info">A4 · 210 × 297 mm</Badge>
              </div>
              <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
                <Notice tone="info">
                  {lang === 'bn'
                    ? 'প্রিন্ট সবসময় A4 পেজ হিসেবে পাঠানো হয়। কপি সংখ্যা, রঙ/সাদা-কালো এবং মান Windows প্রিন্টার ড্রাইভার থেকেই নিয়ন্ত্রণ করা হয় — এতে প্রতিটি প্রিন্টারের নির্ভুল সেটিং পাওয়া যায়।'
                    : 'Jobs are always sent as A4 pages. Copies, colour/b&w and quality are controlled by the Windows printer driver, which gives exact results on every printer.'}
                </Notice>
                <Field label={lang === 'bn' ? 'ডিফল্ট প্রিন্টার' : 'Default printer'} hint={isDesktop() ? undefined : lang === 'bn' ? 'ব্রাউজার মোডে প্রিন্টার তালিকা OS-এর মাধ্যমেই আসে।' : 'In browser mode the printer list comes from the OS dialog.'}>
                  <Select value={settings.defaultPrinter} onChange={(e) => void setSettings({ defaultPrinter: e.target.value })}>
                    <option value="">{lang === 'bn' ? 'সিস্টেম ডিফল্ট' : 'System default'}</option>
                    {(bridgeInfo?.printers ?? []).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          ) : null}

          {tab === 'export' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.export')}</h3>
              </div>
              <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
                <Field
                  label={lang === 'bn' ? 'ফাইলনেম প্যাটার্ন' : 'File name pattern'}
                  hint={
                    lang === 'bn'
                      ? 'ব্যবহারযোগ্য টোকেন: {name} {template} {date} {company}'
                      : 'Available tokens: {name} {template} {date} {company}'
                  }
                >
                  <Input value={settings.filenamePattern} onChange={(e) => void setSettings({ filenamePattern: e.target.value })} maxLength={90} />
                </Field>
                <div className="field-grid">
                  <Field label={lang === 'bn' ? 'ডিফল্ট DOCX ফোল্ডার' : 'Default DOCX folder'}>
                    <div className="input-row">
                      <Input value={settings.defaultDocxLocation} readOnly placeholder={lang === 'bn' ? 'প্রতিবার জিজ্ঞাসা করা হবে' : 'Ask every time'} />
                      <Button
                        size="sm"
                        disabled={!isDesktop()}
                        onClick={async () => {
                          const dir = await getBridge().chooseDirectory('Default DOCX folder');
                          if (dir.path) void setSettings({ defaultDocxLocation: dir.path });
                        }}
                      >
                        {lang === 'bn' ? 'বাছুন' : 'Browse'}
                      </Button>
                    </div>
                  </Field>
                  <Field label={lang === 'bn' ? 'ডিফল্ট PDF ফোল্ডার' : 'Default PDF folder'}>
                    <div className="input-row">
                      <Input value={settings.defaultPdfLocation} readOnly placeholder={lang === 'bn' ? 'প্রতিবার জিজ্ঞাসা করা হবে' : 'Ask every time'} />
                      <Button
                        size="sm"
                        disabled={!isDesktop()}
                        onClick={async () => {
                          const dir = await getBridge().chooseDirectory('Default PDF folder');
                          if (dir.path) void setSettings({ defaultPdfLocation: dir.path });
                        }}
                      >
                        {lang === 'bn' ? 'বাছুন' : 'Browse'}
                      </Button>
                    </div>
                  </Field>
                </div>
                <Notice tone="success">
                  {lang === 'bn'
                    ? 'DOCX একটি সম্পূর্ণ সম্পাদনযোগ্য Word ফাইল (পাঠ্য, টেবিল, বুলেট ও ছবি সহ)। PDF-এ পাঠ্য সার্চযোগ্য ও নির্বাচনযোগ্য থাকে।'
                    : 'DOCX is a fully editable Word file (text, tables, bullets and images). PDF text stays searchable and selectable.'}
                </Notice>
              </div>
            </div>
          ) : null}

          {tab === 'backup' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.backup')}</h3>
              </div>
              <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
                <Field label={lang === 'bn' ? 'ব্যাকআপ ফ্রিকোয়েন্সি' : 'Backup frequency'}>
                  <Select value={settings.backupFrequency} onChange={(e) => void setSettings({ backupFrequency: e.target.value as typeof settings.backupFrequency })}>
                    <option value="manual">{lang === 'bn' ? 'শুধু ম্যানুয়াল' : 'Manual only'}</option>
                    <option value="daily">{lang === 'bn' ? 'প্রতিদিন মনে করিয়ে দাও' : 'Remind me daily'}</option>
                    <option value="weekly">{lang === 'bn' ? 'প্রতি সপ্তাহে মনে করিয়ে দাও' : 'Remind me weekly'}</option>
                  </Select>
                </Field>
                <Notice tone="info">
                  {lang === 'bn'
                    ? 'স্বয়ংক্রিয় ব্যাকআপ কখনো ইন্টারনেটে পাঠানো হয় না — শুধু আপনি যে ফোল্ডার বাছবেন সেখানে সংরক্ষিত হয়।'
                    : 'Backups are never sent over the internet — they are written only to the folder you choose.'}
                </Notice>
              </div>
            </div>
          ) : null}

          {tab === 'privacy' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.privacy')}</h3>
                <Badge tone="success" icon={<ShieldCheck size={10} />}>
                  {lang === 'bn' ? 'লোকাল-অনলি' : 'Local-only'}
                </Badge>
              </div>
              <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
                <div className="grid grid-2" style={{ gap: 'var(--sp-3)' }}>
                  <PrivacyRow label={lang === 'bn' ? 'ইন্টারনেট সংযোগ' : 'Internet connection'} value={lang === 'bn' ? 'কখনোই প্রয়োজন হয় না' : 'Never required'} ok />
                  <PrivacyRow label={lang === 'bn' ? 'ক্লাউড স্টোরেজ' : 'Cloud storage'} value={lang === 'bn' ? 'নেই' : 'None'} ok />
                  <PrivacyRow label={lang === 'bn' ? 'টেলিমেট্রি / অ্যানালিটিক্স' : 'Telemetry / analytics'} value={lang === 'bn' ? 'নেই' : 'None'} ok />
                  <PrivacyRow label={lang === 'bn' ? 'অনলাইন অ্যাক্টিভেশন' : 'Online activation'} value={lang === 'bn' ? 'নেই' : 'None'} ok />
                </div>
                <Notice tone="info">
                  {lang === 'bn'
                    ? `আপনার ডেটা সংরক্ষিত আছে: ${bridgeInfo?.dataPath ?? '—'}`
                    : `Your data lives at: ${bridgeInfo?.dataPath ?? '—'}`}
                </Notice>
                <div className="divider" />
                <div className="row between wrap" style={{ gap: 'var(--sp-3)' }}>
                  <div>
                    <div style={{ fontWeight: 560 }}>{lang === 'bn' ? 'সব লোকাল ডেটা মুছুন' : 'Delete all local data'}</div>
                    <div className="small muted">
                      {lang === 'bn'
                        ? 'সব গ্রাহক, সিভি প্রকল্প, ছবি ও ইতিহাস স্থায়ীভাবে মুছে যাবে। আগে ব্যাকআপ নিন।'
                        : 'Removes every customer, CV project, photo and history entry. Take a backup first.'}
                    </div>
                  </div>
                  <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setConfirmWipe(true)}>
                    {lang === 'bn' ? 'সব ডেটা মুছুন' : 'Delete all data'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'about' ? (
            <div className="card">
              <div className="card-header">
                <h3>{tr('settings.about')}</h3>
              </div>
              <div className="card-body col" style={{ gap: 'var(--sp-4)' }}>
                <div className="row" style={{ gap: 'var(--sp-4)' }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary)',
                      color: 'var(--primary-contrast)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      letterSpacing: '.08em',
                      fontSize: 20,
                    }}
                  >
                    SC
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 650, letterSpacing: '-0.01em' }}>{APP_NAME}</div>
                    <div className="small muted">
                      {lang === 'bn' ? 'পেশাদার সিভি তৈরির সম্পূর্ণ অফলাইন স্টুডিও' : 'Complete offline professional CV studio'}
                    </div>
                    <div className="row" style={{ gap: 6, marginTop: 6 }}>
                      <Badge tone="primary">v{APP_VERSION}</Badge>
                      <Badge>build {BUILD_NUMBER}</Badge>
                      <Badge tone={isDesktop() ? 'success' : 'warning'}>{bridgeInfo?.kind ?? 'browser'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-2" style={{ gap: 'var(--sp-3)' }}>
                  <InfoRow label={lang === 'bn' ? 'রানটাইম' : 'Runtime'} value={bridgeInfo?.kind === 'electron' ? `Electron ${bridgeInfo.electronVersion} · Chromium ${bridgeInfo.chromeVersion}` : `Chromium ${navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? '—'}`} />
                  <InfoRow label={lang === 'bn' ? 'প্ল্যাটফর্ম' : 'Platform'} value={bridgeInfo?.platform ?? '—'} />
                  <InfoRow label={lang === 'bn' ? 'ডেটা লোকেশন' : 'Data location'} value={bridgeInfo?.dataPath ?? '—'} />
                  <InfoRow label={lang === 'bn' ? 'লাইসেন্স' : 'Licence'} value="MIT (application) · SIL OFL 1.1 (fonts)" />
                </div>
                <Notice tone="info">
                  <div>
                    <strong>{lang === 'bn' ? 'ফন্ট ক্রেডিট' : 'Font credits'}</strong>
                    <div className="small">
                      Inter (Rasmus Andersson), Lora (Cyreal), Noto Sans Bengali &amp; Noto Serif Bengali (Google) — SIL Open Font License 1.1.
                    </div>
                  </div>
                </Notice>
                <Notice tone="warning">
                  <div>
                    <strong>Windows 7 / 8 / 8.1</strong>
                    <div className="small">
                      {lang === 'bn'
                        ? 'এই বিল্ডটি Electron 22-এর জন্য প্রস্তুত, যা Windows 7 SP1–11 সমর্থন করে। Windows 7 আর Microsoft সমর্থিত নয় — অফলাইন ব্যবহারে ঝুঁকি কম, তবে সিস্টেম আপডেট পাওয়া যায় না।'
                        : 'This build targets Electron 22, which supports Windows 7 SP1 through 11. Windows 7 is no longer supported by Microsoft — an offline-only tool limits exposure, but the OS receives no security updates.'}
                    </div>
                  </div>
                </Notice>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={confirmWipe}
        title={lang === 'bn' ? 'সব ডেটা স্থায়ীভাবে মুছবেন?' : 'Delete all data permanently?'}
        message={
          lang === 'bn'
            ? 'এই কাজটি ফিরিয়ে আনা যাবে না। আগে ব্যাকআপ নেওয়া হয়েছে কিনা নিশ্চিত করুন।'
            : 'This cannot be undone. Make sure you have taken a backup first.'
        }
        confirmLabel={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete everything'}
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => void wipeAll()}
      />
    </div>
  );
};

const PrivacyRow: React.FC<{ label: string; value: string; ok?: boolean }> = ({ label, value, ok }) => (
  <div className="row between" style={{ padding: 'var(--sp-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)' }}>
    <span className="small muted">{label}</span>
    <Badge tone={ok ? 'success' : 'default'}>{value}</Badge>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ padding: 'var(--sp-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
    <div className="small faint">{label}</div>
    <div className="small mono truncate" style={{ marginTop: 3 }} title={value}>
      {value}
    </div>
  </div>
);
