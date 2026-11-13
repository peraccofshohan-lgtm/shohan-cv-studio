/**
 * Before/after comparison (Part 8).
 *
 * The "before" page is not a stored screenshot: it is the **same**
 * `CvDocument`, recomposed from the baseline — the data and design the project
 * had when the studio session opened. That keeps the comparison honest (both
 * sides run through the identical pipeline, so any difference is a real change)
 * and avoids storing image blobs in a CV database.
 *
 * `diffSnapshots` reports *what* changed in operator terms, so the panel can say
 * "template, palette, 3 sections" instead of leaving the user to spot it.
 */
import React from 'react';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { embeddedFontCss } from '@/assets/fonts';
import { composeDocumentTokens } from '@/lib/composition';
import { resolveDesign } from '@/templates/catalog';
import type { CVData, DesignOverrides } from '@/types/cv';

export interface Snapshot {
  data: CVData;
  design: DesignOverrides;
  templateId: string;
}

export interface SnapshotDiff {
  changed: boolean;
  template: boolean;
  designKeys: string[];
  sections: string[];
  contentAreas: string[];
}

/** Fields that always change on save and carry no design meaning. */
const IGNORED_DESIGN_KEYS = new Set<string>(['presetId']);

export function diffSnapshots(before: Snapshot, after: Snapshot): SnapshotDiff {
  const designKeys = new Set<string>([...Object.keys(before.design ?? {}), ...Object.keys(after.design ?? {})]);
  const changedDesign: string[] = [];
  for (const key of designKeys) {
    if (IGNORED_DESIGN_KEYS.has(key)) continue;
    const a = (before.design as unknown as Record<string, unknown>)[key];
    const b = (after.design as unknown as Record<string, unknown>)[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) changedDesign.push(key);
  }

  const sections: string[] = [];
  const beforeSections = new Map((before.data.sections ?? []).map((s) => [s.id, s]));
  for (const section of after.data.sections ?? []) {
    const prior = beforeSections.get(section.id);
    if (!prior) {
      sections.push(`${section.id}:added`);
      continue;
    }
    if (prior.enabled !== section.enabled) sections.push(`${section.id}:${section.enabled ? 'shown' : 'hidden'}`);
    else if (prior.order !== section.order) sections.push(`${section.id}:moved`);
    else if (prior.headingScale !== section.headingScale) sections.push(`${section.id}:resized`);
  }

  const contentAreas: string[] = [];
  if (JSON.stringify(before.data.personal) !== JSON.stringify(after.data.personal)) contentAreas.push('personal');
  if (JSON.stringify(before.data.photo) !== JSON.stringify(after.data.photo)) contentAreas.push('photo');
  if (JSON.stringify(before.data.title) !== JSON.stringify(after.data.title)) contentAreas.push('title');
  if (JSON.stringify(before.data.pageLength) !== JSON.stringify(after.data.pageLength)) contentAreas.push('pageLength');
  if (JSON.stringify(before.data.sectionStyles ?? {}) !== JSON.stringify(after.data.sectionStyles ?? {})) {
    contentAreas.push('sectionStyles');
  }
  for (const key of ['education', 'experience', 'skills', 'languages', 'training', 'projects', 'achievements'] as const) {
    if (JSON.stringify((before.data as never as Record<string, unknown>)[key]) !==
        JSON.stringify((after.data as never as Record<string, unknown>)[key])) {
      contentAreas.push(key);
    }
  }

  const template = before.templateId !== after.templateId;
  return {
    changed: template || changedDesign.length > 0 || sections.length > 0 || contentAreas.length > 0,
    template,
    designKeys: changedDesign,
    sections,
    contentAreas,
  };
}

/** A4 page rendered from a snapshot, scaled to the container width. */
const SnapshotPage: React.FC<{ snapshot: Snapshot; language: 'bn' | 'en'; scale: number }> = ({
  snapshot,
  language,
  scale,
}) => {
  const design = resolveDesign(snapshot.templateId, snapshot.design);
  const tokens = composeDocumentTokens({ data: snapshot.data, design, overrides: snapshot.design });
  const css = buildDocumentCss({ design, fontCss: embeddedFontCss(), mode: 'screen', tokens });
  return (
    <div style={{ width: 210 * 2.9528 * scale, overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: 210 * 2.9528,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <CvDocument data={snapshot.data} design={design} language={language} pageCount={1} tokens={tokens} />
      </div>
    </div>
  );
};

export const BeforeAfter: React.FC<{
  before: Snapshot;
  after: Snapshot;
  language: 'bn' | 'en';
  /** 0–1 shrink factor; the panel picks something that fits. */
  scale?: number;
}> = ({ before, after, language, scale = 0.42 }) => {
  const diff = diffSnapshots(before, after);
  return (
    <div className="col" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="col" style={{ gap: 4 }}>
          <span className="small" style={{ fontWeight: 620 }}>
            {language === 'bn' ? 'আগে' : 'Before'}
          </span>
          <SnapshotPage snapshot={before} language={language} scale={scale} />
        </div>
        <div className="col" style={{ gap: 4 }}>
          <span className="small" style={{ fontWeight: 620 }}>
            {language === 'bn' ? 'এখন' : 'Now'}
          </span>
          <SnapshotPage snapshot={after} language={language} scale={scale} />
        </div>
      </div>
      <p className="small" style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {diff.changed
          ? language === 'bn'
            ? 'পরিবর্তন: ' +
              [
                diff.template ? 'টেমপ্লেট' : '',
                diff.designKeys.length ? `${diff.designKeys.length}টি ডিজাইন সেটিং` : '',
                diff.sections.length ? `${diff.sections.length}টি সেকশন` : '',
                diff.contentAreas.length ? `${diff.contentAreas.length}টি তথ্য ক্ষেত্র` : '',
              ]
                .filter(Boolean)
                .join(' · ')
            : 'Changed: ' +
              [
                diff.template ? 'template' : '',
                diff.designKeys.length ? `${diff.designKeys.length} design setting(s)` : '',
                diff.sections.length ? `${diff.sections.length} section(s)` : '',
                diff.contentAreas.length ? `${diff.contentAreas.length} content area(s)` : '',
              ]
                .filter(Boolean)
                .join(' · ')
          : language === 'bn'
            ? 'এই সেশনে এখনো কোনো পরিবর্তন হয়নি।'
            : 'Nothing has changed in this session yet.'}
      </p>
    </div>
  );
};
