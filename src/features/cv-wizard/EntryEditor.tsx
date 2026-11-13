/**
 * Reusable list editor used by every repeatable wizard step
 * (education, experience, skills, training, projects, references…).
 *
 * Provides add / edit / delete / reorder with keyboard and mouse support, and
 * an expandable card so long forms stay readable.
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import { useLang } from '@/components/ui';

export interface EntryEditorProps<T extends { id: string }> {
  items: T[];
  onChange: (next: T[]) => void;
  create: () => T;
  renderForm: (item: T, patch: (patch: Partial<T>) => void) => React.ReactNode;
  renderSummary?: (item: T) => { title: string; subtitle?: string };
  addLabel: string;
  emptyLabel: string;
  emptyHint?: string;
  /** Minimum number of entries below which a warning is shown. */
  minRecommended?: number;
  warningLabel?: string;
}

export function EntryEditor<T extends { id: string }>({
  items,
  onChange,
  create,
  renderForm,
  renderSummary,
  addLabel,
  emptyLabel,
  emptyHint,
  minRecommended,
  warningLabel,
}: EntryEditorProps<T>) {
  const [openIds, setOpenIds] = useState<string[]>(() => (items.length === 1 ? [items[0].id] : []));

  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const patchItem = (id: string, patch: Partial<T>) =>
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));

  const add = () => {
    const item = create();
    onChange([...items, item]);
    setOpenIds((prev) => [...prev, item.id]);
  };

  return (
    <div className="col" style={{ gap: 'var(--sp-3)' }}>
      {items.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-5)',
            textAlign: 'center',
            background: 'var(--bg-subtle)',
          }}
        >
          <div style={{ fontWeight: 560, marginBottom: 4 }}>{emptyLabel}</div>
          {emptyHint ? <div className="small muted">{emptyHint}</div> : null}
        </div>
      ) : null}

      {items.map((item, index) => {
        const open = openIds.includes(item.id);
        const summary = renderSummary?.(item);
        return (
          <div
            key={item.id}
            className="card"
            style={{ borderColor: open ? 'var(--primary)' : 'var(--border)', transition: 'border-color 150ms var(--ease)' }}
          >
            <div
              className="row between"
              style={{ padding: 'var(--sp-3) var(--sp-4)', gap: 'var(--sp-3)', cursor: 'pointer' }}
              onClick={() => toggle(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(item.id))}
              aria-expanded={open}
            >
              <div className="row" style={{ gap: 'var(--sp-3)', minWidth: 0 }}>
                <span className="faint" style={{ display: 'flex' }}>
                  <GripVertical size={15} />
                </span>
                <div className="cell-title" style={{ minWidth: 0 }}>
                  <strong>{summary?.title || `#${index + 1}`}</strong>
                  {summary?.subtitle ? <span>{summary.subtitle}</span> : null}
                </div>
              </div>
              <div className="row" style={{ gap: 2 }} onClick={(e) => e.stopPropagation()}>
                <IconButton label="Move up" size="sm" onClick={() => move(index, -1)} disabled={index === 0}>
                  <ChevronUp size={14} />
                </IconButton>
                <IconButton label="Move down" size="sm" onClick={() => move(index, 1)} disabled={index === items.length - 1}>
                  <ChevronDown size={14} />
                </IconButton>
                <IconButton label="Delete" size="sm" onClick={() => remove(item.id)}>
                  <Trash2 size={14} />
                </IconButton>
                <IconButton label={open ? 'Collapse' : 'Expand'} size="sm" onClick={() => toggle(item.id)}>
                  {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </IconButton>
              </div>
            </div>
            {open ? (
              <div className="card-body" style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-4)' }}>
                {renderForm(item, (patch) => patchItem(item.id, patch))}
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="row" style={{ gap: 'var(--sp-3)' }}>
        <Button icon={<Plus size={15} />} onClick={add} variant="primary">
          {addLabel}
        </Button>
        {minRecommended !== undefined && items.length < minRecommended && warningLabel ? (
          <span className="small muted">{warningLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

/** Bullet-list editor used for responsibilities, achievements, etc. */
export const BulletEditor: React.FC<{
  values: string[];
  onChange: (next: string[]) => void;
  label: string;
  placeholder?: string;
  addLabel?: string;
}> = ({ values, onChange, label, placeholder, addLabel }) => {
  const lang = useLang();
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="col" style={{ gap: 6 }}>
        {values.map((value, index) => (
          <div className="input-row" key={index}>
            <span className="faint small" style={{ width: 16 }}>
              •
            </span>
            <input
              className="input"
              value={value}
              placeholder={placeholder}
              onChange={(e) => onChange(values.map((v, i) => (i === index ? e.target.value : v)))}
              aria-label={`${label} ${index + 1}`}
            />
            <IconButton label="Remove line" size="sm" onClick={() => onChange(values.filter((_, i) => i !== index))}>
              <Trash2 size={13} />
            </IconButton>
          </div>
        ))}
        <div>
          <Button size="sm" icon={<Plus size={13} />} onClick={() => onChange([...values, ''])}>
            {addLabel ?? (lang === 'bn' ? 'লাইন যোগ করুন' : 'Add line')}
          </Button>
        </div>
      </div>
    </div>
  );
};
