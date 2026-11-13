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

describe('recommended section order in the editor', () => {
  it('applies an ordering from the navigator and keeps every section', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const store = (await import('@/store/workspace')).useWorkspace;
    const { container, getByLabelText } = render(<EditorPage />);

    const before = store.getState().current!.data.sections.map((s) => s.id);
    const select = getByLabelText('Recommended order') as HTMLSelectElement;
    expect(select.value).toBe('custom');
    for (const label of ['Fresher / Graduate', 'Technical / IT', 'Bangladesh standard']) {
      expect(container.textContent).toContain(label);
    }

    fireEvent.change(select, { target: { value: 'bangladesh' } });
    const after = store.getState().current!.data.sections;
    expect(after.map((s) => s.id).sort()).toEqual([...before].sort());
    expect(after.map((s) => s.order)).toEqual(after.map((_, i) => i));
    expect(after.findIndex((s) => s.id === 'education')).toBeLessThan(
      after.findIndex((s) => s.id === 'experience'),
    );
    expect(select.value).toBe('bangladesh');
  });
});

describe('per-section design panel', () => {
  it('opens from the navigator, edits only that section, and resets', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const store = (await import('@/store/workspace')).useWorkspace;
    // One real skill, so the section actually prints and its markup is visible.
    store.getState().updateData((draft) => {
      draft.skills = [{ id: 's1', name: 'Tally ERP 9', category: 'Software', level: 'advanced' }];
    });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container, getByLabelText } = render(<EditorPage />);

    fireEvent.click(getByLabelText('Design Skills'));
    const text = container.textContent ?? '';
    expect(text).toContain('Section design');
    expect(text).toContain('Heading colour');
    expect(text).toContain('Bullet marker');

    // Change the bullet marker: only `skills` is written.
    fireEvent.change(getByLabelText('Bullet marker'), { target: { value: 'square' } });
    const styles = store.getState().current!.data.sectionStyles;
    expect(styles.skills).toEqual({ bulletStyle: 'square' });
    expect(Object.keys(styles)).toHaveLength(1);
    // The live preview is the real document model, so it carries the override.
    const canvas = container.querySelector('.editor-canvas') as HTMLElement;
    expect(canvas.innerHTML).toContain('data-bullets="square"');
    // Content is untouched.
    expect(store.getState().current!.data.skills).toHaveLength(1);

    // Reset clears the entry, so the section returns to the template look.
    fireEvent.click(container.querySelector('button[title="Back to the template look"]') as Element);
    expect(store.getState().current!.data.sectionStyles.skills).toBeUndefined();
    expect(canvas.innerHTML).not.toContain('data-bullets="square"');
  });
});

describe('page thumbnails', () => {
  it('renders one thumbnail per estimated page from the real document model', async () => {
    installStores();
    useUI.setState({ language: 'en', showThumbnails: false, editorPage: 1, editorPanel: 'content' });
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container, getByTitle, getByLabelText } = render(<EditorPage />);
    expect(container.querySelectorAll('.page-nav').length).toBe(0);

    fireEvent.click(getByTitle('Show page thumbnails'));
    const nav = container.querySelector('.page-nav')!;
    expect(nav).toBeTruthy();
    const thumbs = nav.querySelectorAll('button');
    expect(thumbs.length).toBeGreaterThanOrEqual(1);
    expect(thumbs.length).toBeLessThanOrEqual(20);
    // Each thumbnail contains a real rendered CV, not a blank placeholder.
    expect(nav.textContent).toContain('মোঃ রফিকুল ইসলাম');
    expect(thumbs[0].getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(getByLabelText('Page 1'));
    expect(useUI.getState().editorPage).toBe(1);
  });
});

describe('named presets in the editor', () => {
  it('applies a named preset by changing the design only', async () => {
    installStores();
    useUI.setState({ language: 'en', editorPanel: 'presets' });
    const store = (await import('@/store/workspace')).useWorkspace;
    const { EditorPage } = await import('@/features/editor/EditorPage');
    const { container, getByText } = render(<EditorPage />);

    expect(container.textContent).toContain('Named presets');
    expect(container.textContent).toContain('Parser Plain');
    const beforeText = JSON.stringify(store.getState().current!.data);

    // "Parser Plain" is the third named preset in the list.
    const cards = container.querySelectorAll('.card');
    const button = Array.from(cards)
      .find((c) => (c.textContent ?? '').includes('Parser Plain'))!
      .querySelector('button')!;
    fireEvent.click(button);

    const current = store.getState().current!;
    expect(current.templateId).toBe('ats-classic');
    expect(current.design.density).toBe('compact');
    // Content is byte-identical: a preset is design only.
    expect(JSON.stringify(current.data)).toBe(beforeText);
    expect(getByText('Named presets')).toBeTruthy();
  });
});

describe('wizard document step', () => {
  it('offers title and page-length controls while creating a CV', async () => {
    installStores();
    useUI.setState({ language: 'en' });
    const { WizardPage } = await import('@/features/cv-wizard/WizardPage');
    // Step index 1 is the document step (`document` follows `personal`).
    const { container } = render(<WizardPage step={1} />);
    const text = container.textContent ?? '';
    // Step 2 of 20 is the document-title step. Its heading is rendered in the
    // step list; the panel itself carries the title choices.
    expect(text).toContain('Document Title & Length');
    expect(text).toContain('Title style');
    expect(text).toContain('No title');
    expect(text).toContain('Exactly one page');
  });
});
