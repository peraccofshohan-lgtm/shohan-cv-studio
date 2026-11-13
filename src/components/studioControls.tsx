/**
 * Studio controls.
 *
 * Small, dependency-free inputs used by the title / page-length / design panels:
 * a slider with a numeric box, and a colour field with a native picker plus a
 * HEX/RGB entry. Both are keyboard accessible and work offline.
 *
 * Colour values are validated here rather than in the CSS builder, so an
 * unfinished "#14" in the text box can never reach the document stylesheet.
 */
import React, { useEffect, useId, useMemo, useState } from 'react';
import { hexToRgb } from '@/lib/color';
import { Field } from './ui';

/* --------------------------------------------------------------- HexField */

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(raw)) {
    return `#${raw.split('').map((c) => c + c).join('')}`.toLowerCase();
  }
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw}`.toLowerCase();
  return null;
}

export const HexField: React.FC<{
  label: string;
  value: string | null;
  fallback: string;
  onChange: (next: string | null) => void;
  hint?: string;
  /** Show the RGB triplet under the field. */
  showRgb?: boolean;
}> = ({ label, value, fallback, onChange, hint, showRgb = false }) => {
  const id = useId();
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  const effective = value ?? fallback;
  const rgb = useMemo(() => hexToRgb(effective), [effective]);

  const commit = (next: string) => {
    setDraft(next);
    if (next.trim() === '') {
      onChange(null); // "use the template colour"
      return;
    }
    const hex = normalizeHex(next);
    if (hex) onChange(hex);
  };

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
        <input
          type="color"
          aria-label={`${label} colour picker`}
          value={effective}
          onChange={(e) => commit(e.target.value)}
          style={{
            width: 34,
            height: 30,
            padding: 0,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            cursor: 'pointer',
            flex: '0 0 auto',
          }}
        />
        <input
          id={id}
          className="input"
          value={draft}
          placeholder="template"
          spellCheck={false}
          onChange={(e) => commit(e.target.value)}
          style={{ fontFamily: 'ui-monospace, monospace', textTransform: 'lowercase' }}
        />
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange(null)}
          disabled={value === null}
          title="Restore the template colour"
        >
          Reset
        </button>
      </div>
      {showRgb ? (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>
          rgb({rgb.r}, {rgb.g}, {rgb.b})
        </div>
      ) : null}
    </Field>
  );
};

/* --------------------------------------------------------------- NumberField */

export const NumberField: React.FC<{
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  hint?: string;
}> = ({ label, value, onChange, min = 0, max = 100, step = 1, unit, hint }) => {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ flex: 1 }}
          aria-label={`${label} slider`}
        />
        <input
          type="number"
          className="input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          style={{ width: 74, flex: '0 0 auto' }}
          aria-label={`${label} value`}
        />
        {unit ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>{unit}</span> : null}
      </div>
    </Field>
  );
};

/* --------------------------------------------------------------- Panel bits */

export const PanelSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  description?: string;
}> = ({ title, children, defaultOpen = true, description }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="col" style={{ gap: 'var(--sp-3)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 0,
          padding: 0,
          cursor: 'pointer',
          font: 'inherit',
          color: 'var(--text)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 650,
          letterSpacing: '0.01em',
        }}
      >
        <span>{title}</span>
        <span aria-hidden="true" style={{ color: 'var(--text-muted)' }}>
          {open ? '−' : '+'}
        </span>
      </button>
      {open ? (
        <div className="col" style={{ gap: 'var(--sp-3)' }}>
          {description ? (
            <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
          ) : null}
          {children}
        </div>
      ) : null}
    </section>
  );
};

export const AlignPicker: React.FC<{
  value: 'left' | 'center' | 'right' | 'justify';
  onChange: (next: 'left' | 'center' | 'right' | 'justify') => void;
  label: string;
  allowJustify?: boolean;
}> = ({ value, onChange, label, allowJustify = true }) => {
  const options = [
    { v: 'left' as const, glyph: '⌐', tip: 'Align left' },
    { v: 'center' as const, glyph: '≡', tip: 'Centre' },
    { v: 'right' as const, glyph: '¬', tip: 'Align right' },
    ...(allowJustify ? [{ v: 'justify' as const, glyph: '☰', tip: 'Justify' }] : []),
  ];
  return (
    <Field label={label}>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.v}
            type="button"
            aria-pressed={value === opt.v}
            title={opt.tip}
            aria-label={`${label}: ${opt.tip}`}
            onClick={() => onChange(opt.v)}
          >
            {opt.glyph}
          </button>
        ))}
      </div>
    </Field>
  );
};
