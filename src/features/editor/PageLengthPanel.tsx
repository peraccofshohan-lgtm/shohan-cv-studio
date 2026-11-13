/**
 * Page-length panel (Part 2).
 *
 * Three modes — exactly one page, a two-page target, or automatic pagination —
 * plus a hard ceiling and section-level page breaks. The panel is explicit about
 * the contract: a page target *warns* and never deletes content. When the
 * content cannot fit readably, the operator is told so and can choose.
 */
import React from 'react';
import type { PageLengthMode, SectionId } from '@/types/cv';
import { useWorkspace } from '@/store/workspace';
import { useLang, Switch, Badge, Notice } from '@/components/ui';
import { NumberField, PanelSection } from '@/components/studioControls';
import { SECTION_TITLES } from '@/lib/sections';

const MODES: { id: PageLengthMode; en: string; bn: string; hintEn: string; hintBn: string }[] = [
  {
    id: 'one-page',
    en: 'Exactly one page',
    bn: 'ঠিক এক পৃষ্ঠা',
    hintEn: 'Optimised composition for a single sheet. If the content cannot fit readably you get a warning — nothing is removed.',
    hintBn: 'এক পৃষ্ঠার জন্য সাজানো। পাঠযোগ্যভাবে না ধরলে সতর্কতা দেখানো হবে — কোনো তথ্য মুছে ফেলা হবে না।',
  },
  {
    id: 'two-pages',
    en: 'Target two pages',
    bn: 'লক্ষ্য দুই পৃষ্ঠা',
    hintEn: 'Balanced two-page composition with consistent headings and page numbers.',
    hintBn: 'সুসংগত শিরোনাম ও পৃষ্ঠা নম্বরসহ ভারসাম্যপূর্ণ দুই পৃষ্ঠা।',
  },
  {
    id: 'automatic',
    en: 'Automatic',
    bn: 'স্বয়ংক্রিয়',
    hintEn: 'The page count follows the content, using professional composition rules.',
    hintBn: 'পেশাদার কম্পোজিশন নিয়ম অনুসরণ করে তথ্যের পরিমাণ অনুযায়ী পৃষ্ঠা সংখ্যা নির্ধারিত হবে।',
  },
];

export const PageLengthPanel: React.FC<{ pages: number; fits: boolean; target: string; warnings: number }> = ({
  pages,
  fits,
  target,
  warnings,
}) => {
  const lang = useLang();
  const bn = (a: string, b: string) => (lang === 'bn' ? b : a);
  const pageLength = useWorkspace((s) => s.current?.data.pageLength);
  const update = useWorkspace((s) => s.updateData);
  if (!pageLength) return null;

  const patch = (next: Partial<typeof pageLength>) =>
    update((draft) => {
      draft.pageLength = { ...draft.pageLength, ...next };
    });

  const toggleBreak = (id: SectionId) =>
    patch({
      breakBefore: pageLength.breakBefore.includes(id)
        ? pageLength.breakBefore.filter((x) => x !== id)
        : [...pageLength.breakBefore, id],
    });

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <Badge tone={fits ? 'success' : 'warning'}>
          {bn('Estimated', 'আনুমানিক')}: {pages} {bn(pages === 1 ? 'page' : 'pages', 'পৃষ্ঠা')}
        </Badge>
        <Badge tone="info">
          {bn('Target', 'লক্ষ্য')}: {target}
        </Badge>
        {warnings > 0 ? (
          <Badge tone="warning">
            {warnings} {bn('notice', 'নোটিশ')}
            {warnings === 1 ? '' : lang === 'bn' ? 'সমূহ' : 's'}
          </Badge>
        ) : null}
      </div>

      <PanelSection title={bn('Page length', 'পৃষ্ঠার দৈর্ঘ্য')}>
        <div className="col" style={{ gap: 6 }}>
          {MODES.map((mode) => (
            <label
              key={mode.id}
              className="col"
              style={{
                gap: 2,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: pageLength.mode === mode.id ? 'var(--primary-soft)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <span className="row" style={{ gap: 'var(--sp-2)' }}>
                <input
                  type="radio"
                  name="page-length-mode"
                  checked={pageLength.mode === mode.id}
                  onChange={() => patch({ mode: mode.id })}
                />
                <strong style={{ fontSize: 'var(--fs-sm)' }}>{bn(mode.en, mode.bn)}</strong>
              </span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginLeft: 22, lineHeight: 1.5 }}>
                {bn(mode.hintEn, mode.hintBn)}
              </span>
            </label>
          ))}
        </div>
        {!fits ? (
          <Notice tone="warning">
            {bn(
              'The content is longer than the mode you chose. Nothing has been removed: shorten the text, adjust spacing, or switch mode.',
              'আপনার নির্বাচিত মোডের চেয়ে তথ্য বেশি। কিছুই মুছে ফেলা হয়নি: লেখা সংক্ষিপ্ত করুন, স্পেসিং ঠিক করুন, অথবা মোড বদলান।',
            )}
          </Notice>
        ) : null}
      </PanelSection>

      <PanelSection title={bn('Limits', 'সীমা')} defaultOpen={false}>
        <NumberField
          label={bn('Maximum pages', 'সর্বোচ্চ পৃষ্ঠা')}
          value={pageLength.maxPages}
          min={1}
          max={12}
          step={1}
          onChange={(v) => patch({ maxPages: v })}
        />
        <Switch
          checked={pageLength.keepTogether}
          onChange={(v) => patch({ keepTogether: v })}
          label={bn('Keep sections from splitting across pages', 'পৃষ্ঠা ভেদ করে সেকশন না ভাগ করা')}
        />
        <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {bn(
            'Content is never deleted to satisfy a page limit. Exceeding the limit produces a warning in the layout report instead.',
            'পৃষ্ঠা সীমার জন্য কোনো তথ্য কখনো মুছে ফেলা হয় না। সীমা ছাড়ালে লেআউট রিপোর্টে সতর্কতা দেখানো হয়।',
          )}
        </p>
      </PanelSection>

      <PanelSection title={bn('Manual page breaks', 'ম্যানুয়াল পৃষ্ঠা বিরতি')} defaultOpen={false}>
        <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {bn(
            'Start any section on a fresh page. The break applies to the preview, PDF, print and HTML output.',
            'যেকোনো সেকশন নতুন পৃষ্ঠা থেকে শুরু করুন। এই বিরতি প্রিভিউ, PDF, প্রিন্ট ও HTML-এ প্রয়োগ হবে।',
          )}
        </p>
        <div className="col" style={{ gap: 4 }}>
          {(Object.keys(SECTION_TITLES) as SectionId[]).map((id) => (
            <label key={id} className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
              <input
                type="checkbox"
                checked={pageLength.breakBefore.includes(id)}
                onChange={() => toggleBreak(id)}
              />
              {SECTION_TITLES[id][lang]}
            </label>
          ))}
        </div>
      </PanelSection>
    </div>
  );
};
