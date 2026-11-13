/**
 * Application shell: sidebar navigation + top bar + routed content.
 *
 * Layout follows the golden ratio for the sidebar/content split, collapses to
 * an icon rail on demand, and stays usable from 1024×768 upward.
 */
import React, { useEffect, useMemo } from 'react';
import {
  Archive,
  ArrowLeft,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Database,
  FilePlus2,
  FileStack,
  FileText,
  LayoutTemplate,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { useUI, type Route } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';
import { APP_NAME, APP_VERSION } from '@/lib/appMeta';
import { IconButton, useT } from '@/components/ui';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProjectsPage } from '@/features/projects/ProjectsPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { TemplatesPage } from '@/features/templates/TemplatesPage';
import { WizardPage } from '@/features/cv-wizard/WizardPage';
import { GalleryPage } from '@/features/templates/GalleryPage';
import { EditorPage } from '@/features/editor/EditorPage';
import { BackupPage } from '@/features/backup/BackupPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { ExportsPage } from '@/features/exports/ExportsPage';
import { HelpPage } from '@/features/help/HelpPage';
import { DraftsPage } from '@/features/projects/DraftsPage';

interface NavEntry {
  route: Route;
  key: string;
  icon: React.ReactNode;
  group: 'workspace' | 'library' | 'system';
}

const NAV: NavEntry[] = [
  { route: { name: 'dashboard' }, key: 'nav.dashboard', icon: <BarChart3 />, group: 'workspace' },
  { route: { name: 'wizard', step: 0 }, key: 'nav.newCv', icon: <FilePlus2 />, group: 'workspace' },
  { route: { name: 'projects' }, key: 'nav.projects', icon: <FileStack />, group: 'workspace' },
  { route: { name: 'customers' }, key: 'nav.customers', icon: <Users />, group: 'workspace' },
  { route: { name: 'templates' }, key: 'nav.templates', icon: <LayoutTemplate />, group: 'library' },
  { route: { name: 'drafts' }, key: 'nav.drafts', icon: <FileText />, group: 'library' },
  { route: { name: 'exports' }, key: 'nav.exports', icon: <Archive />, group: 'library' },
  { route: { name: 'backup' }, key: 'nav.backup', icon: <Database />, group: 'system' },
  { route: { name: 'settings' }, key: 'nav.settings', icon: <Settings />, group: 'system' },
  { route: { name: 'help' }, key: 'nav.help', icon: <CircleHelp />, group: 'system' },
];

const ROUTE_TITLES: Record<string, { bn: string; en: string }> = {
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  projects: { bn: 'সব সিভি প্রকল্প', en: 'All CV projects' },
  customers: { bn: 'গ্রাহক ব্যবস্থাপনা', en: 'Customer management' },
  templates: { bn: 'টেমপ্লেট লাইব্রেরি', en: 'Template library' },
  drafts: { bn: 'সংরক্ষিত ড্রাফট', en: 'Saved drafts' },
  exports: { bn: 'এক্সপোর্ট ইতিহাস', en: 'Export history' },
  backup: { bn: 'ব্যাকআপ ও রিস্টোর', en: 'Backup & restore' },
  settings: { bn: 'সেটিংস', en: 'Settings' },
  help: { bn: 'সহায়তা ও পরিচিতি', en: 'Help & about' },
  wizard: { bn: 'সিভি তৈরির উইজার্ড', en: 'CV creation wizard' },
  gallery: { bn: 'টেমপ্লেট গ্যালারি', en: 'Template gallery' },
  editor: { bn: 'সিভি এডিটিং স্টুডিও', en: 'CV editing studio' },
};

export const AppShell: React.FC = () => {
  const { route, navigate, sidebarCollapsed, toggleSidebar, language, setLanguage, theme, setTheme } = useUI();
  const { ready, bootError, bridgeInfo, current, dirty, saving, lastSavedAt } = useWorkspace();
  const tr = useT();

  // Apply theme to <html> so tokens cascade.
  useEffect(() => {
    const resolve = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    };
    const apply = () => document.documentElement.setAttribute('data-theme', resolve());
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => theme === 'system' && apply();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  // Global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        void useWorkspace.getState().saveNow();
      }
      if (e.key.toLowerCase() === 'z' && !e.shiftKey && route.name === 'editor') {
        e.preventDefault();
        useWorkspace.getState().undo();
      }
      if ((e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) && route.name === 'editor') {
        e.preventDefault();
        useWorkspace.getState().redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [route.name]);

  // Desktop menu integration.
  useEffect(() => {
    const bridge = window.shohan as unknown as { onMenuAction?: (cb: (a: string) => void) => () => void } | undefined;
    if (!bridge?.onMenuAction) return;
    return bridge.onMenuAction((action) => {
      if (action === 'new-cv') navigate({ name: 'wizard', step: 0 });
      if (action === 'save') void useWorkspace.getState().saveNow();
    });
  }, [navigate]);

  const title = useMemo(() => {
    const entry = ROUTE_TITLES[route.name] ?? ROUTE_TITLES.dashboard;
    return entry[language] ?? entry.en;
  }, [route.name, language]);

  const subtitle = useMemo(() => {
    if (route.name === 'editor' && current) {
      const state = saving ? tr('common.saving') : dirty ? '● ' + tr('editor.saveState') : tr('common.saved');
      return `${current.title} · ${state}`;
    }
    if (route.name === 'wizard') return `${tr('wiz.step')} ${route.step + 1} / 19`;
    return APP_NAME;
  }, [route, current, dirty, saving, tr]);

  const groups: { id: NavEntry['group']; label: string }[] = [
    { id: 'workspace', label: tr('nav.workspace') },
    { id: 'library', label: tr('nav.library') },
    { id: 'system', label: tr('nav.system') },
  ];

  if (!ready) {
    return <BootScreen error={bootError} />;
  }

  const isEditorOrWizard = route.name === 'editor' || route.name === 'wizard' || route.name === 'gallery';

  return (
    <div className="app-shell" data-collapsed={sidebarCollapsed}>
      <aside className="sidebar" aria-label="Primary">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            SC
          </div>
          <div className="brand-text">
            <strong>{APP_NAME}</strong>
            <span>
              {tr('status.version')} {APP_VERSION}
            </span>
          </div>
        </div>

        <nav className="nav">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="nav-group-label">{group.label}</div>
              {NAV.filter((n) => n.group === group.id).map((entry) => {
                const active =
                  route.name === entry.route.name ||
                  (entry.route.name === 'wizard' && (route.name === 'wizard' || route.name === 'gallery'));
                return (
                  <button
                    key={entry.key}
                    className="nav-item"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => navigate(entry.route)}
                    title={tr(entry.key)}
                  >
                    {entry.icon}
                    <span className="nav-label">{tr(entry.key)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="status-chip" title={bridgeInfo?.dataPath}>
            <span className={`status-dot ${bridgeInfo?.offline ? 'offline' : ''}`} />
            <span className="sidebar-foot-detail">
              {bridgeInfo?.kind === 'electron' ? tr('status.desktop') : tr('status.browser')} ·{' '}
              {bridgeInfo?.offline ? tr('status.offline') : 'Local'}
            </span>
          </div>
          <button className="nav-item" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span className="nav-label">Collapse</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          {isEditorOrWizard ? (
            <IconButton label="Back" onClick={() => useUI.getState().back()}>
              <ArrowLeft size={17} />
            </IconButton>
          ) : (
            <IconButton label="Toggle sidebar" onClick={toggleSidebar}>
              {sidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </IconButton>
          )}
          <div className="topbar-title">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              title="Change interface language"
              aria-label="Change interface language"
            >
              <BookOpen size={14} />
              {language === 'bn' ? 'বাংলা' : 'EN'}
            </button>
            <IconButton
              label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </IconButton>
          </div>
        </header>

        <main className={`content ${isEditorOrWizard ? 'tight' : ''}`}>
          <RouteView route={route} />
        </main>
      </div>
    </div>
  );
};

const RouteView: React.FC<{ route: Route }> = ({ route }) => {
  switch (route.name) {
    case 'dashboard':
      return <DashboardPage />;
    case 'projects':
      return <ProjectsPage />;
    case 'customers':
      return <CustomersPage />;
    case 'templates':
      return <TemplatesPage />;
    case 'drafts':
      return <DraftsPage />;
    case 'exports':
      return <ExportsPage />;
    case 'backup':
      return <BackupPage />;
    case 'settings':
      return <SettingsPage />;
    case 'help':
      return <HelpPage />;
    case 'wizard':
      return <WizardPage step={route.step} />;
    case 'gallery':
      return <GalleryPage />;
    case 'editor':
      return <EditorPage />;
    default:
      return <DashboardPage />;
  }
};

const BootScreen: React.FC<{ error: string | null }> = ({ error }) => (
  <div className="boot-splash" role="status">
    <div className="boot-mark">SC</div>
    <p>{APP_NAME}</p>
    {error ? (
      <>
        <span style={{ color: 'var(--danger)', maxWidth: 520, textAlign: 'center' }}>
          Database could not start: {error}
        </span>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
          Retry
        </button>
      </>
    ) : (
      <span>Preparing your offline workspace…</span>
    )}
  </div>
);

export const icons = { BriefcaseBusiness };
