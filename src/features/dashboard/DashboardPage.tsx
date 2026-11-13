/**
 * Dashboard — the first screen. Golden-ratio split: a wide primary column with
 * the call to action and recent work, and a narrower column of at-a-glance
 * metrics and utilities.
 */
import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock3,
  Database,
  FilePlus2,
  FileText,
  LayoutTemplate,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WifiOff,
} from 'lucide-react';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { Badge, Button, EmptyState, IconButton, Input, useT, formatRelative } from '@/components/ui';
import { APP_NAME, APP_VERSION } from '@/lib/appMeta';
import { TEMPLATES } from '@/templates/catalog';
import { useDebounced } from '@/components/ui';

export const DashboardPage: React.FC = () => {
  const { counts, projects, customers, exports, bridgeInfo, refreshLists } = useWorkspace();
  const { navigate, language } = useUI();
  const tr = useT();
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 180);

  const filteredRecent = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const list = q
      ? projects.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.fullName ?? '').toLowerCase().includes(q) ||
            (p.customerName ?? '').toLowerCase().includes(q),
        )
      : projects;
    return list.slice(0, 6);
  }, [projects, debounced]);

  const recentCustomers = customers.slice(0, 4);
  const lastExport = exports[0];
  const lastBackupLabel = useMemo(() => {
    const repo = useWorkspace.getState().repo;
    const backups = repo?.listBackups() ?? [];
    return backups[0]?.createdAt ?? null;
  }, [exports.length]);

  const openProject = async (id: string) => {
    await useWorkspace.getState().openProject(id);
    navigate({ name: 'editor' });
  };

  const startNew = async () => {
    navigate({ name: 'wizard', step: 0 });
  };

  const stats = [
    { key: 'dash.totalCv', value: counts.projects, icon: <FileText size={18} />, tone: 'primary' as const },
    { key: 'dash.todayCv', value: counts.todayProjects, icon: <TrendingUp size={18} />, tone: 'success' as const },
    { key: 'dash.customers', value: counts.customers, icon: <Users size={18} />, tone: 'info' as const },
    { key: 'dash.templates', value: TEMPLATES.length, icon: <LayoutTemplate size={18} />, tone: 'accent' as const },
  ];

  return (
    <div className="page">
      {/* ---------------------------------------------------------- hero */}
      <section
        className="card"
        style={{
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(135deg, var(--hero-grad-a) 0%, var(--hero-grad-b) 46%, var(--hero-grad-c) 100%)',
          borderColor: 'transparent',
          color: 'var(--primary-contrast)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.618fr) minmax(0, 1fr)',
            gap: 'var(--sp-6)',
            padding: 'var(--sp-7) var(--sp-6)',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          <div>
            <span
              className="badge"
              style={{
                background: 'rgba(255,255,255,.14)',
                color: 'inherit',
                border: '1px solid rgba(255,255,255,.22)',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
              }}
            >
              <WifiOff size={11} /> {tr('status.offline')}
            </span>
            <h2
              style={{
                margin: 'var(--sp-3) 0 var(--sp-2)',
                fontSize: 'var(--fs-2xl)',
                fontWeight: 650,
                letterSpacing: '-0.02em',
                lineHeight: 1.18,
              }}
            >
              {language === 'bn' ? 'আজকের সিভি, কয়েক মিনিটে।' : 'Today’s CV, in a few minutes.'}
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: '52ch',
                color: 'rgba(255,255,255,.82)',
                fontSize: 'var(--fs-base)',
                lineHeight: 1.6,
              }}
            >
              {language === 'bn'
                ? 'প্রতিটি ধাপে সহজ ফর্ম, ২০টি পেশাদার টেমপ্লেট, A4 প্রিন্ট, সম্পাদনযোগ্য DOCX এবং উচ্চমানের PDF — সম্পূর্ণ ইন্টারনেট ছাড়াই।'
                : 'Guided forms at every step, 20 professional templates, A4 printing, editable DOCX and high-quality PDF — entirely offline.'}
            </p>
            <div className="row" style={{ marginTop: 'var(--sp-5)', gap: 'var(--sp-3)' }}>
              <Button
                variant="accent"
                size="lg"
                icon={<FilePlus2 size={17} />}
                onClick={startNew}
                style={{ color: '#1b1206' }}
              >
                {tr('dash.newCv')}
              </Button>
              <Button
                size="lg"
                onClick={() => navigate({ name: 'customers' })}
                icon={<Users size={17} />}
                style={{
                  background: 'rgba(255,255,255,.1)',
                  borderColor: 'rgba(255,255,255,.28)',
                  color: '#fff',
                }}
              >
                {tr('nav.customers')}
              </Button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--sp-3)',
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.key}
                style={{
                  background: 'rgba(255,255,255,.1)',
                  border: '1px solid rgba(255,255,255,.18)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--sp-4)',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <div style={{ opacity: 0.7, display: 'flex', alignItems: 'center', gap: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 680, lineHeight: 1.1, marginTop: 6 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', opacity: 0.78, marginTop: 2 }}>{tr(stat.key)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- metrics row */}
      <section className="grid grid-4">
        <MetricCard
          label={tr('dash.backupStatus')}
          value={lastBackupLabel ? formatRelative(lastBackupLabel, language) : language === 'bn' ? 'ব্যাকআপ নেই' : 'No backup yet'}
          hint={language === 'bn' ? 'ডেটা এই কম্পিউটারেই সংরক্ষিত' : 'Data stays on this computer'}
          icon={<Database size={16} />}
          action={{ label: tr('nav.backup'), onClick: () => navigate({ name: 'backup' }) }}
          tone={lastBackupLabel ? 'success' : 'warning'}
        />
        <MetricCard
          label={language === 'bn' ? 'সর্বশেষ এক্সপোর্ট' : 'Last export'}
          value={lastExport ? lastExport.format.toUpperCase() : language === 'bn' ? 'কিছু নেই' : 'None'}
          hint={lastExport ? `${lastExport.projectTitle} · ${formatRelative(lastExport.createdAt, language)}` : '—'}
          icon={<Clock3 size={16} />}
          action={{ label: tr('nav.exports'), onClick: () => navigate({ name: 'exports' }) }}
          tone="info"
        />
        <MetricCard
          label={language === 'bn' ? 'সংস্করণ' : 'Version'}
          value={`v${APP_VERSION}`}
          hint={bridgeInfo?.kind === 'electron' ? `Electron ${bridgeInfo.electronVersion ?? ''}` : 'Browser preview'}
          icon={<Sparkles size={16} />}
          action={{ label: tr('nav.help'), onClick: () => navigate({ name: 'help' }) }}
          tone="primary"
        />
        <MetricCard
          label={language === 'bn' ? 'ডেটা সুরক্ষা' : 'Data safety'}
          value={language === 'bn' ? 'লোকাল' : 'Local only'}
          hint={language === 'bn' ? 'কোনো ক্লাউড বা টেলিমেট্রি নেই' : 'No cloud, no telemetry'}
          icon={<ShieldCheck size={16} />}
          action={{ label: tr('nav.settings'), onClick: () => navigate({ name: 'settings' }) }}
          tone="success"
        />
      </section>

      {/* -------------------------------------------------- main content */}
      <section className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.618fr) minmax(0, 1fr)', gap: 'var(--sp-4)' }}>
        <div className="card">
          <div className="card-header">
            <div className="row" style={{ gap: 'var(--sp-3)', flex: 1, minWidth: 0 }}>
              <h3>{tr('dash.recentProjects')}</h3>
              <div className="search" style={{ marginLeft: 'auto', maxWidth: 260 }}>
                <Search size={15} />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={language === 'bn' ? 'প্রকল্প বা গ্রাহক খুঁজুন…' : 'Search projects or customers…'}
                  aria-label={tr('common.search')}
                />
              </div>
            </div>
            <Button size="sm" onClick={() => navigate({ name: 'projects' })} icon={<ArrowRight size={14} />}>
              {tr('nav.projects')}
            </Button>
          </div>
          {filteredRecent.length === 0 ? (
            <EmptyState
              icon={<FileText size={22} />}
              title={tr('proj.empty')}
              description={tr('proj.emptyHint')}
              action={
                <Button variant="primary" icon={<FilePlus2 size={15} />} onClick={startNew}>
                  {tr('dash.newCv')}
                </Button>
              }
            />
          ) : (
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>{language === 'bn' ? 'প্রকল্প' : 'Project'}</th>
                    <th>{language === 'bn' ? 'টেমপ্লেট' : 'Template'}</th>
                    <th>{language === 'bn' ? 'সর্বশেষ' : 'Updated'}</th>
                    <th aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecent.map((project) => {
                    const template = TEMPLATES.find((t) => t.id === project.templateId);
                    const initials = (project.fullName || project.title || '?')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((s) => s[0])
                      .join('')
                      .toUpperCase();
                    return (
                      <tr key={project.id} onDoubleClick={() => void openProject(project.id)}>
                        <td>
                          <div className="cell-main">
                            <div className="avatar">
                              {project.photoDataUrl ? (
                                <img src={project.photoDataUrl} alt="" />
                              ) : (
                                initials
                              )}
                            </div>
                            <div className="cell-title">
                              <strong>{project.fullName || project.title}</strong>
                              <span>
                                {project.title}
                                {project.customerName ? ` · ${project.customerName}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="small muted">{template?.name ?? project.templateId}</span>
                        </td>
                        <td>
                          <span className="small muted">{formatRelative(project.updatedAt, language)}</span>
                        </td>
                        <td className="num">
                          <Button size="sm" onClick={() => void openProject(project.id)}>
                            {language === 'bn' ? 'খুলুন' : 'Open'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col" style={{ gap: 'var(--sp-4)' }}>
          <div className="card">
            <div className="card-header">
              <h3>{tr('dash.quickActions')}</h3>
            </div>
            <div className="card-body col" style={{ gap: 'var(--sp-2)' }}>
              <QuickAction icon={<FilePlus2 size={16} />} label={tr('nav.newCv')} onClick={startNew} />
              <QuickAction
                icon={<LayoutTemplate size={16} />}
                label={tr('nav.templates')}
                onClick={() => navigate({ name: 'templates' })}
              />
              <QuickAction icon={<Users size={16} />} label={tr('cust.add')} onClick={() => navigate({ name: 'customers' })} />
              <QuickAction icon={<Database size={16} />} label={tr('backup.create')} onClick={() => navigate({ name: 'backup' })} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>{tr('dash.recentCustomers')}</h3>
              <IconButton label={tr('nav.customers')} size="sm" onClick={() => navigate({ name: 'customers' })}>
                <ArrowRight size={14} />
              </IconButton>
            </div>
            {recentCustomers.length === 0 ? (
              <div className="card-body small muted" style={{ paddingTop: 'var(--sp-4)' }}>
                {tr('cust.empty')}
              </div>
            ) : (
              <div style={{ padding: 'var(--sp-2) var(--sp-2) var(--sp-3)' }}>
                {recentCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    className="nav-item"
                    style={{ padding: '8px var(--sp-2)' }}
                    onClick={() => navigate({ name: 'customers' })}
                  >
                    <div className="avatar sq" style={{ width: 28, height: 28, flexBasis: 28, fontSize: 11 }}>
                      {(customer.name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <span className="cell-title" style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: 'var(--fs-sm)' }}>{customer.name}</strong>
                      <span style={{ fontSize: 'var(--fs-2xs)' }}>{customer.phone || customer.email || '—'}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card card-pad">
            <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
              <Badge tone="primary" icon={<ShieldCheck size={11} />}>
                Privacy
              </Badge>
            </div>
            <p className="small muted" style={{ margin: 'var(--sp-3) 0 0', lineHeight: 1.6 }}>
              {language === 'bn'
                ? 'সব তথ্য শুধু আপনার কম্পিউটারে সংরক্ষিত থাকে। কোনো ইন্টারনেট সংযোগ, অ্যাকাউন্ট বা অনলাইন অ্যাক্টিভেশন প্রয়োজন হয় না।'
                : 'Everything is stored only on this computer. No internet connection, account or online activation is required.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  action: { label: string; onClick: () => void };
  tone: 'primary' | 'success' | 'info' | 'warning';
}> = ({ label, value, hint, icon, action, tone }) => (
  <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
    <div className="row between">
      <span className="small muted" style={{ fontWeight: 560 }}>
        {label}
      </span>
      <Badge tone={tone}>{icon}</Badge>
    </div>
    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 650, letterSpacing: '-0.01em' }} className="truncate">
      {value}
    </div>
    <div className="row between" style={{ gap: 'var(--sp-2)' }}>
      <span className="small faint truncate">{hint}</span>
      <button
        className="btn btn-ghost btn-sm"
        onClick={action.onClick}
        style={{ padding: '0 6px', height: 22, fontSize: 'var(--fs-2xs)' }}
      >
        {action.label}
      </button>
    </div>
  </div>
);

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    className="btn btn-outline"
    onClick={onClick}
    style={{ justifyContent: 'flex-start', height: 40, fontWeight: 540 }}
  >
    <span style={{ color: 'var(--primary)', display: 'flex' }}>{icon}</span>
    {label}
  </button>
);
