// @vitest-environment jsdom
/**
 * Render-level smoke tests for the highest-risk screens.
 *
 * The build environment has no browser and no Electron, so these tests are the
 * only automated check that the React tree actually mounts, renders Bangla and
 * English text, and exposes working controls. They are not a substitute for the
 * manual checklist in docs/TESTING.md — they catch crashes and dead buttons, not
 * visual regressions.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, cleanup, act } from '@testing-library/react';

vi.mock('@/platform', async () => {
  const actual = await vi.importActual<typeof import('@/platform')>('@/platform');
  return {
    ...actual,
    isDesktop: () => false,
    getBridge: () => ({
      info: async () => ({
        kind: 'browser' as const,
        appVersion: '1.0.0',
        electronVersion: '',
        chromeVersion: '108',
        platform: 'test',
        dataPath: '/tmp/test-data',
        printers: [] as string[],
      }),
      loadDatabase: async () => null,
      persistDatabase: async () => undefined,
      logError: async () => undefined,
      listPrinters: async () => [],
      print: async () => ({ printed: true, message: 'ok' }),
      saveText: async () => ({ saved: true, path: '/tmp/out.txt', message: 'ok' }),
      saveFile: async () => ({ saved: true, path: '/tmp/out.docx', message: 'ok' }),
      chooseBackupPath: async () => ({ saved: true, path: '/tmp/backup.zip', message: 'ok' }),
      openBackupFile: async () => ({ canceled: true, path: null, message: 'canceled' }),
      chooseDirectory: async () => ({ canceled: true, path: null, message: 'canceled' }),
      revealPath: async () => ({ ok: true, message: 'ok' }),
      saveDatabase: async () => ({ saved: true, path: '/tmp/db.sqlite', message: 'ok' }),
      onMenuAction: undefined,
    }),
  };
});

import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TemplatesPage } from '@/features/templates/TemplatesPage';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { createEmptyCv, defaultDesign } from '@/lib/defaults';
import { TEMPLATES } from '@/templates/catalog';

function installStores() {
  const data = createEmptyCv();
  data.personal.fullName = 'মোঃ রফিকুল ইসলাম';
  data.personal.email = 'rafiq@example.com';
  data.careerObjective.text = 'A real objective.';

  useWorkspace.setState({
    ready: true,
    bootError: null,
    current: {
      id: 'p1',
      title: 'রফিকুল — CV',
      templateId: 'classic-professional',
      design: defaultDesign(),
      data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerId: null,
      isDraft: true,
      status: 'draft',
      version: 1,
    } as never,
    projects: [],
    customers: [],
    exports: [],
    counts: { projects: 3, customers: 2, todayProjects: 1, duplicates: 0 },
    settings: {} as never,
    dirty: false,
    saving: false,
  });
  useUI.setState({ language: 'bn', route: { name: 'dashboard' }, theme: 'light' });
}

beforeEach(() => {
  installStores();
});

describe('dashboard', () => {
  it('renders Bangla headings and the real project counts', () => {
    render(<DashboardPage />);
    // The page must be in Bangla — the product's primary language.
    expect(document.body.textContent).toMatch(/[\u0980-\u09FF]/);
    expect(document.body.textContent).toContain('3');
  });

  it('renders English when the interface language is English', () => {
    useUI.setState({ language: 'en' });
    render(<DashboardPage />);
    expect(document.body.textContent).toMatch(/[A-Za-z]/);
  });
});

describe('template gallery', () => {
  it('lists every template from the catalogue', () => {
    render(<TemplatesPage />);
    const text = document.body.textContent ?? '';
    for (const template of TEMPLATES) {
      // The Bangla UI shows the Bangla names, so accept either.
      const present = text.includes(template.name) || text.includes(template.nameBn);
      expect(present, `${template.id} missing from the gallery`).toBe(true);
    }
  });

  it('offers every template category as a filter', () => {
    render(<TemplatesPage />);
    const text = document.body.textContent ?? '';
    for (const template of TEMPLATES) {
      expect(text.includes(template.category) || text.includes(template.description)).toBe(true);
    }
  });
});

describe('editor', () => {
  it('renders the A4 document, the section navigator and the export buttons', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container } = render(<EditorPage />);

    // The A4 page itself must exist and carry the user's text.
    const paper = container.querySelector('.cv-paper');
    expect(paper).not.toBeNull();
    expect(paper?.textContent).toContain('মোঃ রফিকুল ইসলাম');
    expect(paper?.getAttribute('data-template')).toBe('classic-professional');

    // Export actions are real buttons, in the toolbar.
    const toolbar = container.querySelector('.editor-toolbar');
    expect(toolbar?.textContent).toContain('DOCX');
    expect(toolbar?.textContent).toContain('PDF');
    expect(toolbar?.textContent).toContain('HTML');

    // Section navigator is populated from the section config, not hard-coded.
    // 18 configured document sections plus the personal-information row.
    expect(container.querySelectorAll('.section-row').length).toBeGreaterThanOrEqual(18);
  });

  it('toggles the A4 page guides in the live preview', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container, getByText } = render(<EditorPage />);
    expect(container.querySelector('.page-guide')).toBeNull();
    fireEvent.click(getByText('Guides'));
    expect(container.querySelector('.page-guide')).not.toBeNull();
    fireEvent.click(getByText('Guides'));
    expect(container.querySelector('.page-guide')).toBeNull();
  });

  it('omits a switched-off section from the printed page', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container } = render(<EditorPage />);
    const paper = container.querySelector('.cv-paper')!;
    expect(paper.textContent).toContain('Career Objective');
    cleanup();
    act(() => {
      useWorkspace.getState().updateData((draft) => {
        const target = draft.sections.find((s) => s.id === 'careerObjective');
        if (target) target.enabled = false;
      });
    });
    const second = render(<EditorPage />);
    expect(second.container.querySelector('.cv-paper')!.textContent).not.toContain('Career Objective');
  });
});

describe('title and page-length panels drive the document', () => {
  it('renders the CV title on the A4 page and removes it for "No title"', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const first = render(<EditorPage />);
    // Default title is CURRICULUM VITAE, printed above the contact block.
    expect(first.container.querySelector('.cv-title')?.textContent).toBe('CURRICULUM VITAE');
    cleanup();

    act(() => {
      useWorkspace.getState().updateData((draft) => {
        draft.title = { ...draft.title, preset: 'none', visible: false };
      });
    });
    const second = render(<EditorPage />);
    // Hiding the title must remove the element entirely — no empty band.
    expect(second.container.querySelector('.cv-title')).toBeNull();
  });

  it('opens the Title panel and shows the six title choices', async () => {
    installStores();
    useUI.setState({ language: 'en', editorPanel: 'title' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container } = render(<EditorPage />);
    const text = container.textContent ?? '';
    for (const label of ['CV', 'CURRICULUM VITAE', 'RESUME', 'PROFESSIONAL RESUME', 'No title', 'Custom']) {
      expect(text).toContain(label);
    }
  });

  it('opens the Page length panel with all three modes', async () => {
    installStores();
    useUI.setState({ language: 'en', editorPanel: 'pages' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container } = render(<EditorPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Exactly one page');
    expect(text).toContain('Target two pages');
    expect(text).toContain('Automatic');
    // The "never delete content" contract is stated in the collapsed Limits
    // section, so check the copy in the always-visible mode descriptions.
    expect(text).toMatch(/nothing is removed/i);
  });

  it('opens the Reports panel with ATS and quality sections', async () => {
    installStores();
    useUI.setState({ language: 'en', editorPanel: 'reports' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container } = render(<EditorPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('Layout diagnostics');
    expect(text).toContain('ATS suitability');
    expect(text).toContain('Quality checklist');
  });

  it('opens the Design panel in Basic mode and reveals Advanced controls', async () => {
    installStores();
    useUI.setState({ language: 'en', editorPanel: 'design' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container, getByText } = render(<EditorPage />);
    // Basic mode: no colour token fields yet.
    expect(container.textContent).not.toContain('Photo border');
    fireEvent.click(getByText('Advanced'));
    expect(container.textContent).toContain('Photo border');
    expect(container.textContent).toContain('Margins');
  });
});
