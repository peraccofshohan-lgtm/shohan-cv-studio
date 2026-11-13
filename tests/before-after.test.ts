// @vitest-environment node
/**
 * Before/after comparison (Part 8).
 *
 * The comparison is only useful if it is truthful: it must detect a design
 * change, a template change, a section being hidden and a text edit, and it must
 * stay silent when nothing happened. Both sides are rendered from the same
 * production pipeline, so these tests assert the diff logic rather than pixels.
 */
import { describe, it, expect } from 'vitest';
import { diffSnapshots, type Snapshot } from '@/features/editor/BeforeAfter';
import { buildSampleCv } from '@/features/templates/sampleData';
import { defaultDesign } from '@/lib/defaults';

/**
 * A deep copy of one canonical project.
 *
 * Snapshots in the app are always clones of the *same* project record, so entry
 * ids are shared; building the sample twice would produce fresh uids and make
 * every list look edited. The helper clones so the tests model reality.
 */
const BASE: Snapshot = {
  data: buildSampleCv('en'),
  design: defaultDesign('classic-professional'),
  templateId: 'classic-professional',
};

const snapshot = (): Snapshot => JSON.parse(JSON.stringify(BASE)) as Snapshot;

describe('snapshot diff', () => {
  it('reports no change for an identical snapshot', () => {
    const diff = diffSnapshots(snapshot(), snapshot());
    expect(diff.changed).toBe(false);
    expect(diff.designKeys).toEqual([]);
    expect(diff.sections).toEqual([]);
    expect(diff.contentAreas).toEqual([]);
  });

  it('ignores presetId, which changes on every preset apply', () => {
    const after = snapshot();
    after.design.presetId = 'abc';
    expect(diffSnapshots(snapshot(), after).changed).toBe(false);
  });

  it('detects a design change and names the keys', () => {
    const after = snapshot();
    after.design.density = 'compact';
    after.design.marginMm = 22;
    const diff = diffSnapshots(snapshot(), after);
    expect(diff.changed).toBe(true);
    expect(diff.designKeys.sort()).toEqual(['density', 'marginMm']);
    expect(diff.contentAreas).toEqual([]);
  });

  it('detects a template change', () => {
    const after = snapshot();
    after.templateId = 'ats-classic';
    const diff = diffSnapshots(snapshot(), after);
    expect(diff.template).toBe(true);
    expect(diff.changed).toBe(true);
  });

  it('detects hidden sections and reordering separately', () => {
    const before = snapshot();
    const after = snapshot();
    after.data.sections = after.data.sections.map((s) =>
      s.id === 'languages' ? { ...s, enabled: false } : s.id === 'skills' ? { ...s, order: 0 } : s,
    );
    const diff = diffSnapshots(before, after);
    expect(diff.sections).toContain('languages:hidden');
    expect(diff.sections.some((s) => s.endsWith(':moved'))).toBe(true);
  });

  it('detects a content edit without calling it a design change', () => {
    const after = snapshot();
    after.data.personal.fullName = 'নতুন নাম';
    after.data.skills = [...after.data.skills, { id: 'x', name: 'New', category: 'c', level: 'expert' } as never];
    const diff = diffSnapshots(snapshot(), after);
    expect(diff.contentAreas).toContain('personal');
    expect(diff.contentAreas).toContain('skills');
    expect(diff.designKeys).toEqual([]);
  });

  it('treats a section-style override as a content-area change', () => {
    const after = snapshot();
    after.data.sectionStyles = { skills: { bulletStyle: 'dash' } };
    expect(diffSnapshots(snapshot(), after).contentAreas).toContain('sectionStyles');
  });
});
