/**
 * Shared UI primitives.
 * Small, composable and accessible: every control is a real focusable element
 * with visible state, keyboard support and ARIA where it matters.
 */
import React, { createContext, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X, Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { STRINGS, t, type UILanguage } from '@/localization/strings';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';

/* ------------------------------------------------------------------ i18n */
export function useT(): (key: string) => string {
  const language = useUI((s) => s.language);
  return useMemo(() => (key: string) => (STRINGS[key] ? t(key, language) : key), [language]);
}

export function useLang(): UILanguage {
  return useUI((s) => s.language);
}

/* -------------------------------------------------------------- buttons */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  block?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  loading,
  block,
  children,
  className = '',
  disabled,
  ...rest
}) => (
  <button
    type="button"
    className={`btn ${variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-outline' : `btn-${variant}`} ${
      size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
    } ${block ? 'btn-block' : ''} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading ? <Spinner size={size === 'sm' ? 13 : 15} /> : icon}
    {children}
  </button>
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md'; children: React.ReactNode }
> = ({ label, size = 'md', children, className = '', ...rest }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`btn btn-icon ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
    {...rest}
  >
    {children}
  </button>
);

export const Spinner: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <span
    aria-hidden="true"
    style={{
      width: size,
      height: size,
      display: 'inline-block',
      border: `2px solid currentColor`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 700ms linear infinite',
      opacity: 0.85,
    }}
  />
);

/* --------------------------------------------------------------- fields */
export interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, required, optional, hint, error, htmlFor, children, className = '' }) => (
  <div className={`field ${className}`}>
    <label className="field-label" htmlFor={htmlFor}>
      {label}
      {required ? (
        <span className="req" aria-label="required">
          *
        </span>
      ) : optional ? (
        <span className="optional">{'optional'}</span>
      ) : null}
    </label>
    {children}
    {error ? (
      <span className="field-error" role="alert">
        <AlertTriangle size={12} /> {error}
      </span>
    ) : hint ? (
      <span className="field-hint">{hint}</span>
    ) : null}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }> = ({
  invalid,
  className = '',
  ...rest
}) => <input className={`input ${className}`} aria-invalid={invalid || undefined} {...rest} />;

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }> = ({
  invalid,
  className = '',
  ...rest
}) => <textarea className={`textarea ${className}`} aria-invalid={invalid || undefined} {...rest} />;

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...rest }) => (
  <select className={`select ${className}`} {...rest}>
    {children}
  </select>
);

export const Checkbox: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <label className="checkline">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
    <span>{label}</span>
  </label>
);

export const Switch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <label className="switch">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
    />
    <span className="switch-track" aria-hidden="true" />
    {label ? <span>{label}</span> : null}
  </label>
);

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  ariaLabel: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- badges */
export const Badge: React.FC<{
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'accent';
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ tone = 'default', icon, children }) => (
  <span className={`badge ${tone === 'default' ? '' : `badge-${tone}`}`}>
    {icon}
    {children}
  </span>
);

export const Notice: React.FC<{
  tone?: 'info' | 'warning' | 'danger' | 'success';
  children: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ tone = 'info', children, icon }) => {
  const Fallback = tone === 'warning' ? AlertTriangle : tone === 'danger' ? XCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`notice ${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      {icon ?? <Fallback />}
      <div>{children}</div>
    </div>
  );
};

/* --------------------------------------------------------------- modals */
const ModalContext = createContext<{ close: () => void }>({ close: () => undefined });

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const focusable = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    // Focus the first control for keyboard users.
    setTimeout(() => {
      ref.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    }, 30);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="modal-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal ${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
};
Modal.displayName = 'Modal';

export const ModalFooterContext = ModalContext;

/** Confirm dialog used for destructive actions. */
export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}> = ({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', onConfirm, onCancel, busy }) => (
  <Modal
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.6, color: 'var(--text-muted)' }}>{message}</div>
  </Modal>
);

/* --------------------------------------------------------------- toasts */
export const ToastHost: React.FC = () => {
  const toasts = useWorkspace((s) => s.toasts);
  const dismiss = useWorkspace((s) => s.dismissToast);
  return createPortal(
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.kind}`}>
          <div style={{ minWidth: 0 }}>
            <strong>{toast.title}</strong>
            {toast.detail ? <span>{toast.detail}</span> : null}
          </div>
          <button className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
};

/* ---------------------------------------------------------------- misc */
export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="empty">
    <div className="empty-icon">{icon}</div>
    <h3>{title}</h3>
    {description ? <p>{description}</p> : null}
    {action}
  </div>
);

export const ProgressBar: React.FC<{ value: number; label?: string }> = ({ value, label }) => (
  <div
    className="progress"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value)}
    aria-label={label ?? 'Progress'}
  >
    <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

export function useDebounced<T>(value: T, delay = 220): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function formatRelative(iso: string, language: UILanguage): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return language === 'bn' ? 'এইমাত্র' : 'just now';
  if (mins < 60) return language === 'bn' ? `${mins} মিনিট আগে` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return language === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return language === 'bn' ? `${days} দিন আগে` : `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="section-head">
    <div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
    {actions ? <div className="row">{actions}</div> : null}
  </div>
);

/** A labelled switch row used across the wizard for optional sections. */
export const SwitchRow: React.FC<{
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}> = ({ title, description, checked, onChange }) => (
  <div
    className="row between"
    style={{
      gap: 'var(--sp-4)',
      padding: 'var(--sp-3) var(--sp-4)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      background: checked ? 'var(--primary-soft)' : 'var(--bg-subtle)',
      transition: 'background 160ms var(--ease)',
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 580 }}>{title}</div>
      {description ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
      ) : null}
    </div>
    <Switch checked={checked} onChange={onChange} />
  </div>
);
