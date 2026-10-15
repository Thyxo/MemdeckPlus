/** Fælles UI-byggeklodser: topbar, ark (bottom sheet), segmenter, kontakter, tomme tilstande m.m. */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import { back } from '../lib/router';
import { sfx } from '../lib/feedback';
import { Icon, type IconName } from './Icon';

export function TopBar({ title, backTo, right, sub }: { title: ReactNode; backTo?: string; right?: ReactNode; sub?: ReactNode }) {
  const t = useT();
  return (
    <header className="topbar">
      {backTo !== undefined ? (
        <button className="icon-btn" onClick={() => back(backTo)} aria-label={t('back')}>
          <Icon name="back" />
        </button>
      ) : (
        <span className="topbar-spacer" />
      )}
      <div className="topbar-title">
        <h1>{title}</h1>
        {sub && <div className="topbar-sub">{sub}</div>}
      </div>
      <div className="topbar-right">{right ?? <span className="topbar-spacer" />}</div>
    </header>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={`page ${className ?? ''}`}>{children}</main>;
}

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const t = useT();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({ value, options, onChange, ariaLabel }: {
  value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={String(o.value)} role="radio" aria-checked={o.value === value}
          className={o.value === value ? 'on' : ''} onClick={() => { sfx.tap(); onChange(o.value); }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; desc?: ReactNode }) {
  return (
    <label className="row toggle-row">
      <span className="row-text"><span>{label}</span>{desc && <small>{desc}</small>}</span>
      <input type="checkbox" className="switch" checked={checked} onChange={(e) => { sfx.tap(); onChange(e.target.checked); }} />
    </label>
  );
}

export function Stepper({ value, min, max, step = 1, onChange, format }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => ReactNode }) {
  const t = useT();
  return (
    <div className="stepper">
      <button className="icon-btn" aria-label={t('decrease')} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <output aria-live="polite">{format ? format(value) : value}</output>
      <button className="icon-btn" aria-label={t('increase')} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>+</button>
    </div>
  );
}

export function EmptyState({ icon = 'sparkle', title, text, action }: { icon?: IconName; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={30} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ProgressRing({ value, size = 120, stroke = 10, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ring-track)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--gold)" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function Bar({ value, tone = 'gold' }: { value: number; tone?: 'gold' | 'green' | 'red' }) {
  return (
    <div className="bar" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <span className={`bar-fill bar-${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function NavRow({ icon, title, desc, onClick, right, badge }: { icon?: IconName | ReactNode; title: ReactNode; desc?: ReactNode; onClick: () => void; right?: ReactNode; badge?: ReactNode }) {
  return (
    <button className="navrow" onClick={() => { sfx.tap(); onClick(); }}>
      {icon && <span className="navrow-icon">{typeof icon === 'string' ? <Icon name={icon as IconName} /> : icon}</span>}
      <span className="navrow-text"><b>{title}</b>{desc && <small>{desc}</small>}</span>
      {badge && <span className="pill">{badge}</span>}
      {right ?? <Icon name="chevron" className="muted" />}
    </button>
  );
}

export function Skeleton({ h = 16, w = '100%', r = 8 }: { h?: number; w?: number | string; r?: number }) {
  return <span className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

// ---------- Globale dialoger (bekræft / indtast) ----------
type DialogReq =
  | { kind: 'confirm'; title: string; body?: string; ok?: string; danger?: boolean; resolve: (v: boolean) => void }
  | { kind: 'prompt'; title: string; value: string; ok?: string; resolve: (v: string | null) => void };
let pushDialog: ((d: DialogReq) => void) | null = null;

export function confirmDialog(o: { title: string; body?: string; ok?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => pushDialog ? pushDialog({ kind: 'confirm', ...o, resolve }) : resolve(window.confirm(o.title)));
}
export function promptDialog(o: { title: string; value?: string; ok?: string }): Promise<string | null> {
  return new Promise((resolve) => pushDialog ? pushDialog({ kind: 'prompt', value: '', ...o, resolve }) : resolve(window.prompt(o.title, o.value)));
}

export function DialogHost() {
  const t = useT();
  const [d, setD] = useState<DialogReq | null>(null);
  const [val, setVal] = useState('');
  useEffect(() => {
    pushDialog = (req) => { setD(req); if (req.kind === 'prompt') setVal(req.value); };
    return () => { pushDialog = null; };
  }, []);
  if (!d) return null;
  const close = (ok: boolean) => {
    if (d.kind === 'confirm') d.resolve(ok);
    else d.resolve(ok && val.trim() ? val.trim() : null);
    setD(null);
  };
  return (
    <div className="sheet-backdrop center" onClick={() => close(false)}>
      <form className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); close(true); }}>
        <h2>{d.title}</h2>
        {d.kind === 'confirm' && d.body && <p className="muted">{d.body}</p>}
        {d.kind === 'prompt' && <input className="input" autoFocus value={val} onChange={(e) => setVal(e.target.value)} maxLength={60} />}
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={() => close(false)}>{t('cancel')}</button>
          <button type="submit" className={`btn ${d.kind === 'confirm' && d.danger ? 'danger' : 'primary'}`}>{d.ok ?? t('ok')}</button>
        </div>
      </form>
    </div>
  );
}
