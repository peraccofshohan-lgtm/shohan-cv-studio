/**
 * Document title panel (Part 1).
 *
 * The six title choices (CV / CURRICULUM VITAE / RESUME / PROFESSIONAL RESUME /
 * No title / Custom) plus the full styling block. Every change writes to the
 * project's `data.title`, so the choice is remembered per CV and every exporter
 * sees it.
 *
 * When "No title" is chosen the styling block is collapsed away entirely — the
 * document does not render an empty band, and the panel does not pretend there
 * is something to style.
 */
import React from 'react';
import type { TextAlign, TextTransform, TitlePreset } from '@/types/cv';
import { TITLE_PRESET_TEXT } from '@/types/cv';
import { useWorkspace } from '@/store/workspace';
import { useLang, Field, Input, Select, Switch, Button, Segmented } from '@/components/ui';
import { HexField, NumberField, PanelSection } from '@/components/studioControls';

const PRESETS: { id: TitlePreset; en: string; bn: string }[] = [
  { id: 'cv', en: 'CV', bn: 'সিভি' },
  { id: 'curriculum-vitae', en: 'CURRICULUM VITAE', bn: 'কারিকুলাম ভিটা' },
  { id: 'resume', en: 'RESUME', bn: 'রেজুমে' },
  { id: 'professional-resume', en: 'PROFESSIONAL RESUME', bn: 'প্রফেশনাল রেজুমে' },
  { id: 'none', en: 'No title', bn: 'শিরোনাম নেই' },
  { id: 'custom', en: 'Custom…', bn: 'কাস্টম…' },
];

export const TitlePanel: React.FC = () => {
  const lang = useLang();
  const bn = (a: string, b: string) => (lang === 'bn' ? b : a);
  const title = useWorkspace((s) => s.current?.data.title);
  const update = useWorkspace((s) => s.updateData);
  if (!title) return null;

  const patch = (next: Partial<typeof title>) =>
    update((draft) => {
      draft.title = { ...draft.title, ...next };
    });

  const choosePreset = (preset: TitlePreset) => {
    if (preset === 'custom') {
      patch({ preset, visible: true, text: title.text || 'CURRICULUM VITAE' });
      return;
    }
    if (preset === 'none') {
      // Hiding is explicit: the renderer emits nothing, the header reflows.
      patch({ preset, visible: false });
      return;
    }
    patch({ preset, visible: true, text: TITLE_PRESET_TEXT[preset] });
  };

  const hidden = !title.visible || title.preset === 'none';

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <PanelSection
        title={bn('Title style', 'শিরোনামের ধরন')}
        description={bn(
          'Choose the heading printed above the name. “No title” removes it completely — the header moves up instead of leaving a blank band.',
          'নামের উপরে যে শিরোনাম ছাপা হবে তা বেছে নিন। “শিরোনাম নেই” নির্বাচন করলে এটি সম্পূর্ণ বাদ যাবে — ফাঁকা জায়গা না রেখে হেডার উপরে উঠে আসবে।',
        )}
      >
        <div className="col" style={{ gap: 6 }}>
          {PRESETS.map((preset) => (
            <label
              key={preset.id}
              className="row"
              style={{
                gap: 'var(--sp-2)',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: title.preset === preset.id ? 'var(--primary-soft)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="cv-title-preset"
                checked={title.preset === preset.id}
                onChange={() => choosePreset(preset.id)}
              />
              <span style={{ fontSize: 'var(--fs-sm)' }}>{lang === 'bn' ? preset.bn : preset.en}</span>
            </label>
          ))}
        </div>

        {title.preset === 'custom' ? (
          <Field label={bn('Title text', 'শিরোনামের লেখা')}>
            <Input value={title.text} onChange={(e) => patch({ text: e.target.value })} maxLength={80} />
          </Field>
        ) : null}

        <Switch
          checked={title.visible}
          onChange={(v) => patch({ visible: v, preset: v ? (title.preset === 'none' ? 'cv' : title.preset) : 'none' })}
          label={bn('Show the title', 'শিরোনাম দেখাও')}
        />
      </PanelSection>

      {hidden ? (
        <div className="notice info" role="status">
          <div>
            {bn(
              'The title is hidden, so the document has no title band at all. Turn it back on to restore the styling options.',
              'শিরোনাম লুকানো আছে, তাই ডকুমেন্টে কোনো শিরোনাম ব্যান্ড নেই। স্টাইল অপশন ফিরে পেতে আবার চালু করুন।',
            )}
          </div>
        </div>
      ) : (
        <>
          <PanelSection title={bn('Typography', 'টাইপোগ্রাফি')}>
            <NumberField
              label={bn('Size', 'আকার')}
              value={title.fontSize}
              min={6}
              max={26}
              step={0.5}
              unit="pt"
              onChange={(v) => patch({ fontSize: v })}
            />
            <Field label={bn('Weight', 'ওজন')}>
              <Select value={String(title.fontWeight)} onChange={(e) => patch({ fontWeight: Number(e.target.value) })}>
                <option value="400">Regular (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semi-bold (600)</option>
                <option value="700">Bold (700)</option>
              </Select>
            </Field>
            <Field label={bn('Letter case', 'হাতের লেখা')}>
              <Select
                value={title.transform}
                onChange={(e) => patch({ transform: e.target.value as TextTransform })}
              >
                <option value="uppercase">{bn('UPPERCASE', 'বড় হাতের')}</option>
                <option value="lowercase">{bn('lowercase', 'ছোট হাতের')}</option>
                <option value="capitalize">{bn('Title Case', 'শিরোনামের মতো')}</option>
                <option value="none">{bn('As typed', 'যেমন লেখা')}</option>
              </Select>
            </Field>
            <NumberField
              label={bn('Letter spacing', 'অক্ষর ফাঁক')}
              value={title.letterSpacing}
              min={0}
              max={0.6}
              step={0.01}
              unit="em"
              onChange={(v) => patch({ letterSpacing: v })}
            />
            <div className="row" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <label className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
                <input type="checkbox" checked={title.italic} onChange={(e) => patch({ italic: e.target.checked })} />
                {bn('Italic', 'ইটালিক')}
              </label>
              <label className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
                <input type="checkbox" checked={title.underline} onChange={(e) => patch({ underline: e.target.checked })} />
                {bn('Underline', 'আন্ডারলাইন')}
              </label>
              <label className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
                <input
                  type="checkbox"
                  checked={title.strikethrough === true}
                  onChange={(e) => patch({ strikethrough: e.target.checked })}
                />
                {bn('Strikethrough', 'স্ট্রাইকথ্রু')}
              </label>
            </div>
            <NumberField
              label={bn('Word spacing', 'শব্দের ফাঁক')}
              value={title.wordSpacing ?? 0}
              min={0}
              max={0.5}
              step={0.01}
              unit="em"
              onChange={(v) => patch({ wordSpacing: v })}
              hint={
                /[\u0980-\u09FF]/.test(title.text ?? '')
                  ? bn(
                      'বাংলা শিরোনামে শব্দের ফাঁক প্রয়োগ হয় না — যুক্তাক্ষর আলাদা হয়ে যাওয়া ঠেকাতে।',
                      'Word spacing is not applied to Bengali titles — it would pull conjuncts apart.',
                    )
                  : bn('ল্যাটিন লেখায় প্রযোজ্য', 'Applies to Latin text')
              }
            />
            <HexField
              label={bn('Title colour', 'শিরোনামের রং')}
              value={title.color}
              fallback="#5b6572"
              onChange={(v) => patch({ color: v })}
              showRgb
            />
          </PanelSection>

          <PanelSection title={bn('Placement & spacing', 'অবস্থান ও ফাঁক')} defaultOpen={false}>
            <Field label={bn('Alignment', 'সারিবদ্ধতা')}>
              <Segmented<TextAlign>
                ariaLabel={bn('Title alignment', 'শিরোনামের সারিবদ্ধতা')}
                value={title.align}
                onChange={(v) => patch({ align: v })}
                options={[
                  { value: 'left', label: 'L' },
                  { value: 'center', label: 'C' },
                  { value: 'right', label: 'R' },
                ]}
              />
            </Field>
            <Field label={bn('Position', 'স্থান')}>
              <Select
                value={title.position}
                onChange={(e) => patch({ position: e.target.value as typeof title.position })}
              >
                <option value="above-name">{bn('Above the name', 'নামের উপরে')}</option>
                <option value="below-name">{bn('Below the name', 'নামের নিচে')}</option>
                <option value="below-contact">{bn('Below the contact details', 'যোগাযোগের নিচে')}</option>
              </Select>
            </Field>
            <NumberField
              label={bn('Space above', 'উপরের ফাঁক')}
              value={title.spaceBeforeMm}
              min={0}
              max={16}
              step={0.2}
              unit="mm"
              onChange={(v) => patch({ spaceBeforeMm: v })}
            />
            <NumberField
              label={bn('Space below', 'নিচের ফাঁক')}
              value={title.spaceAfterMm}
              min={0}
              max={16}
              step={0.2}
              unit="mm"
              onChange={(v) => patch({ spaceAfterMm: v })}
            />
          </PanelSection>

          <PanelSection title={bn('Decoration', 'সাজসজ্জা')} defaultOpen={false}>
            <Field label={bn('Rule under the title', 'শিরোনামের নিচের রেখা')}>
              <Select value={title.border} onChange={(e) => patch({ border: e.target.value as typeof title.border })}>
                <option value="none">{bn('None', 'কিছু না')}</option>
                <option value="thin">{bn('Thin line', 'সরু রেখা')}</option>
                <option value="thick">{bn('Thick line', 'মোটা রেখা')}</option>
                <option value="double">{bn('Double line', 'দুই রেখা')}</option>
                <option value="accent">{bn('Side accent', 'পাশের অ্যাকসেন্ট')}</option>
              </Select>
            </Field>
            <Field label={bn('Background', 'পেছনের রং')}>
              <Select
                value={title.background}
                onChange={(e) => patch({ background: e.target.value as typeof title.background })}
              >
                <option value="none">{bn('None', 'কিছু না')}</option>
                <option value="tint">{bn('Soft tint', 'হালকা আভা')}</option>
                <option value="primary">{bn('Solid accent', 'গাঢ় অ্যাকসেন্ট')}</option>
              </Select>
            </Field>
            {title.background !== 'none' ? (
              <NumberField
                label={bn('Background padding', 'পেছনের প্যাডিং')}
                value={title.backgroundPaddingMm}
                min={0}
                max={6}
                step={0.2}
                unit="mm"
                onChange={(v) => patch({ backgroundPaddingMm: v })}
              />
            ) : null}
            <Switch
              checked={title.accentLine}
              onChange={(v) => patch({ accentLine: v })}
              label={bn('Short accent line', 'ছোট অ্যাকসেন্ট রেখা')}
            />
          </PanelSection>
        </>
      )}

      <Button
        variant="outline"
        block
        onClick={() =>
          update((draft) => {
            draft.title = {
              ...draft.title,
              visible: true,
              preset: 'curriculum-vitae',
              text: TITLE_PRESET_TEXT['curriculum-vitae'],
              fontFamily: null,
              fontSize: 10,
              fontWeight: 600,
              italic: false,
              underline: false,
              strikethrough: false,
              color: null,
              transform: 'uppercase',
              letterSpacing: 0.14,
              wordSpacing: 0,
              align: 'left',
              spaceBeforeMm: 1,
              spaceAfterMm: 1.4,
              border: 'none',
              backgroundPaddingMm: 0,
              background: 'none',
              accentLine: true,
              position: 'below-name',
            };
          })
        }
      >
        {bn('Restore the default title', 'ডিফল্ট শিরোনামে ফিরে যান')}
      </Button>
    </div>
  );
};
