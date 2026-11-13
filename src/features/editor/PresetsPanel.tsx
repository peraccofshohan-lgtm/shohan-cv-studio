/**
 * Style preset library (Part 9).
 *
 * A preset stores only design tokens, never content, and never replaces the
 * built-in template: applying one records the base template plus the saved
 * overrides. Stored in the existing `template_settings` table, so no schema
 * change and no risk to customer data.
 */
import React, { useState } from 'react';
import { Pencil, Save, Trash2, Copy, Check } from 'lucide-react';
import { useWorkspace } from '@/store/workspace';
import { Button, Field, Input, useLang, Badge } from '@/components/ui';
import { PanelSection } from '@/components/studioControls';
import { templateById } from '@/templates/catalog';

export const PresetsPanel: React.FC = () => {
  const lang = useLang();
  const bn = (a: string, b: string) => (lang === 'bn' ? b : a);
  const presets = useWorkspace((s) => s.presets);
  const savePreset = useWorkspace((s) => s.savePreset);
  const applyPreset = useWorkspace((s) => s.applyPreset);
  const renamePreset = useWorkspace((s) => s.renamePreset);
  const duplicatePreset = useWorkspace((s) => s.duplicatePreset);
  const deletePreset = useWorkspace((s) => s.deletePreset);
  const current = useWorkspace((s) => s.current);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <PanelSection
        title={bn('Save this style', 'এই স্টাইল সংরক্ষণ করুন')}
        description={bn(
          'Colours, fonts, spacing, margins and header treatment are saved together. Content is never included.',
          'রং, ফন্ট, স্পেসিং, মার্জিন ও হেডার একসঙ্গে সংরক্ষিত হয়। কোনো তথ্য সংরক্ষণ করা হয় না।',
        )}
      >
        <Field label={bn('Preset name', 'প্রিসেটের নাম')}>
          <Input
            value={name}
            placeholder={bn('e.g. Navy Corporate for Banks', 'যেমন: ব্যাংকের জন্য নেভি কর্পোরেট')}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
          />
        </Field>
        <Button
          variant="primary"
          icon={<Save size={14} />}
          block
          disabled={!current}
          onClick={() => {
            savePreset(name || (lang === 'bn' ? 'আমার স্টাইল' : 'My style'));
            setName('');
          }}
        >
          {bn('Save current design as a preset', 'বর্তমান ডিজাইন প্রিসেট হিসেবে সংরক্ষণ')}
        </Button>
      </PanelSection>

      <PanelSection
        title={bn('Saved presets', 'সংরক্ষিত প্রিসেট')}
        description={
          presets.length === 0
            ? bn('No presets yet.', 'এখনো কোনো প্রিসেট নেই।')
            : bn(`${presets.length} preset(s) available on this computer.`, `এই কম্পিউটারে ${presets.length}টি প্রিসেট আছে।`)
        }
      >
        {presets.length === 0 ? null : (
          <div className="col" style={{ gap: 'var(--sp-2)' }}>
            {presets.map((preset) => {
              const base = templateById(preset.baseTemplateId);
              const active = current?.design.presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className="card card-pad col"
                  style={{ gap: 6, borderColor: active ? 'var(--primary)' : undefined }}
                >
                  {editing === preset.id ? (
                    <div className="row" style={{ gap: 6 }}>
                      <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} autoFocus />
                      <Button
                        size="sm"
                        onClick={() => {
                          renamePreset(preset.id, draftName);
                          setEditing(null);
                        }}
                      >
                        <Check size={13} />
                      </Button>
                    </div>
                  ) : (
                    <div className="row between" style={{ gap: 6 }}>
                      <strong style={{ fontSize: 'var(--fs-sm)' }}>{preset.name}</strong>
                      {active ? <Badge tone="success">{bn('applied', 'প্রয়োগকৃত')}</Badge> : null}
                    </div>
                  )}
                  <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                    {bn('Based on', 'ভিত্তি')}: {lang === 'bn' ? base.nameBn : base.name}
                    {' · '}
                    {preset.design.density ?? 'balanced'}
                  </div>
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    <Button size="sm" variant="primary" onClick={() => applyPreset(preset.id)}>
                      {bn('Apply', 'প্রয়োগ')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(preset.id);
                        setDraftName(preset.name);
                      }}
                      icon={<Pencil size={12} />}
                      aria-label={bn('Rename', 'নাম বদলান')}
                    />
                    <Button
                      size="sm"
                      onClick={() => duplicatePreset(preset.id)}
                      icon={<Copy size={12} />}
                      aria-label={bn('Duplicate', 'কপি')}
                    />
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deletePreset(preset.id)}
                      icon={<Trash2 size={12} />}
                      aria-label={bn('Delete', 'মুছুন')}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>

      <PanelSection title={bn('About presets', 'প্রিসেট সম্পর্কে')} defaultOpen={false}>
        <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {bn(
            'Applying a preset never modifies the built-in template, so a CV that uses a preset can always be restored to its original design with “Reset design”.',
            'প্রিসেট প্রয়োগ করলে বিল্ট-ইন টেমপ্লেট বদলায় না, তাই “ডিজাইন রিসেট” দিয়ে সবসময় মূল ডিজাইনে ফেরা যায়।',
          )}
        </p>
      </PanelSection>
    </div>
  );
};
