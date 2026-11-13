/**
 * Per-section design panel (Part 5).
 *
 * Edits one section's own styling without touching the document-wide design:
 * heading colour, heading alignment, heading size, the gap above the section,
 * the bullet marker and an optional page break. Every control writes through
 * `setOverride`, which sanitises the value and deletes the entry once nothing
 * differs from the document default — so "reset" restores the template's own
 * look rather than an approximation of it.
 */
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Select, useLang } from '@/components/ui';
import { AlignPicker, HexField, NumberField, PanelSection } from '@/components/studioControls';
import { useWorkspace } from '@/store/workspace';
import type { SectionId, SectionStyleOverride } from '@/types/cv';
import { SECTION_TITLES } from '@/lib/sections';
import { composeDocumentTokens } from '@/lib/composition';
import { resolveDesign } from '@/templates/catalog';
import {
  BULLET_STYLES,
  HEADING_SCALE_MAX,
  HEADING_SCALE_MIN,
  SECTION_GAP_MAX,
  SECTION_GAP_MIN,
  overrideFor,
  setOverride,
} from '@/lib/sectionStyles';

export const SectionStylePanel: React.FC<{ section: SectionId }> = ({ section }) => {
  const project = useWorkspace((s) => s.current);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const bn = (b: string, e: string) => (lang === 'bn' ? b : e);

  if (!project) return null;
  const data = project.data;
  const design = resolveDesign(project.templateId, project.design);
  const tokens = composeDocumentTokens({ data, design, overrides: project.design });
  const override = overrideFor(data.sectionStyles, section);
  const title = SECTION_TITLES[section]?.[lang] ?? section;

  const patch = (next: Partial<SectionStyleOverride>) => {
    update((draft) => {
      draft.sectionStyles = setOverride(draft.sectionStyles, section, {
        ...(draft.sectionStyles?.[section] ?? {}),
        ...next,
      });
    });
  };

  const reset = () =>
    update((draft) => {
      draft.sectionStyles = setOverride(draft.sectionStyles, section, null);
    });

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="small" style={{ fontWeight: 620 }}>
          {bn('সেকশন ডিজাইন', 'Section design')} · {title}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={!override}
          title={bn('টেমপ্লেটে ফিরুন', 'Back to the template look')}
        >
          <RotateCcw size={12} /> {bn('রিসেট', 'Reset')}
        </Button>
      </div>

      <p className="small" style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        {bn(
          'এই পরিবর্তন শুধু এই সেকশনে প্রযোজ্য — বাকি ডকুমেন্ট অপরিবর্তিত থাকে, কোনো লেখা বদলায় না।',
          'These changes apply to this section only. The rest of the document is untouched and no text is altered.',
        )}
      </p>

      <PanelSection title={bn('শিরোনাম', 'Heading')}>
        <HexField
          label={bn('শিরোনামের রঙ', 'Heading colour')}
          value={override?.headingColor ?? null}
          fallback={tokens.colors.heading ?? tokens.colors.primary}
          onChange={(next) => patch({ headingColor: next })}
          hint={bn('খালি = টেমপ্লেটের রঙ', 'Empty = the template colour')}
        />
        <div className="col" style={{ gap: 6 }}>
          <span className="small" style={{ fontWeight: 560 }}>
            {bn('অবস্থান', 'Alignment')}
          </span>
          <AlignPicker
            label={bn('শিরোনামের অবস্থান', 'Heading alignment')}
            value={override?.headingAlign ?? 'left'}
            onChange={(next) => patch({ headingAlign: next })}
            allowJustify={false}
          />
          {override?.headingAlign ? (
            <span className="small" style={{ color: 'var(--text-muted)' }}>
              {bn('সেন্টার/ডানে থাকলে রুল লাইন লুকানো থাকে।', 'The leader rule is hidden when centred or right-aligned.')}
            </span>
          ) : null}
        </div>
        <NumberField
          label={bn('আকার (গুণক)', 'Size (multiplier)')}
          value={override?.headingScale ?? 1}
          onChange={(next) => patch({ headingScale: next })}
          min={HEADING_SCALE_MIN}
          max={HEADING_SCALE_MAX}
          step={0.05}
          unit="×"
          hint={bn(
            `ডিফল্ট ${tokens.typography.heading.sizePt.toFixed(1)} pt · সীমা ${HEADING_SCALE_MIN}–${HEADING_SCALE_MAX}×`,
            `Default ${tokens.typography.heading.sizePt.toFixed(1)} pt · limited to ${HEADING_SCALE_MIN}–${HEADING_SCALE_MAX}×`,
          )}
        />
      </PanelSection>

      <PanelSection title={bn('ফাঁক ও বুলেট', 'Spacing & bullets')}>
        <NumberField
          label={bn('উপরের ফাঁক (গুণক)', 'Gap above (multiplier)')}
          value={override?.paragraphSpacing ?? 1}
          onChange={(next) => patch({ paragraphSpacing: next })}
          min={SECTION_GAP_MIN}
          max={SECTION_GAP_MAX}
          step={0.05}
          unit="×"
          hint={bn(
            'শুধু বাড়ানো যায় — চাপাচাপি এড়াতে ১× এর কম নয়।',
            'Can only be increased — never below 1× so nothing is crammed.',
          )}
        />
        <div className="col" style={{ gap: 6 }}>
          <span className="small" style={{ fontWeight: 560 }}>{bn('বুলেট চিহ্ন', 'Bullet marker')}</span>
          <Select
            aria-label={bn('বুলেট চিহ্ন', 'Bullet marker')}
            value={override?.bulletStyle ?? 'dot'}
            onChange={(e) => patch({ bulletStyle: e.target.value as SectionStyleOverride['bulletStyle'] })}
          >
            {BULLET_STYLES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.glyph === '' ? '' : `${b.glyph}  `}
                {lang === 'bn' ? b.nameBn : b.nameEn}
              </option>
            ))}
          </Select>
        </div>
      </PanelSection>

      <PanelSection title={bn('পৃষ্ঠা', 'Page')} defaultOpen={false}>
        <label className="row" style={{ gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={override?.pageBreakBefore ?? false}
            onChange={(e) => patch({ pageBreakBefore: e.target.checked })}
          />
          <span className="small">
            {bn('এই সেকশন নতুন পৃষ্ঠা থেকে শুরু হবে', 'Start this section on a new page')}
          </span>
        </label>
        <span className="small" style={{ color: 'var(--text-muted)' }}>
          {bn(
            'পৃষ্ঠা সংখ্যা বাড়তে পারে — কোনো তথ্য সরানো হয় না।',
            'This may add a page. No content is ever removed to compensate.',
          )}
        </span>
      </PanelSection>
    </div>
  );
};
