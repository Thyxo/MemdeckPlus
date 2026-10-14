/**
 * Talknapper til positioner 1–52.
 * Auto-indsend: et ciffer 6–9 kan kun være et ensifret svar; to cifre indsendes straks.
 */
import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { sfx } from '../lib/feedback';
import { Icon } from './Icon';

export function NumberPad({ onSubmit, disabled, max = 52, autoSubmit = true }: { onSubmit: (n: number) => void; disabled?: boolean; max?: number; autoSubmit?: boolean }) {
  const t = useT();
  const [val, setVal] = useState('');

  useEffect(() => { if (disabled) setVal(''); }, [disabled]);

  const submit = (s: string) => {
    const n = Number(s);
    if (n >= 1 && n <= max) { onSubmit(n); setVal(''); }
  };
  const press = (d: string) => {
    if (disabled) return;
    sfx.tap();
    const next = (val + d).replace(/^0+/, '');
    if (!next || Number(next) > max) return;
    setVal(next);
    if (!autoSubmit) return;
    const canExtend = Number(next) * 10 <= max;
    if (next.length >= String(max).length || !canExtend) submit(next);
  };

  // Tastatur-understøttelse på desktop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') setVal((v) => v.slice(0, -1));
      else if (e.key === 'Enter') submit(val);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="numpad">
      <div className="numpad-display" aria-live="polite">{val || <span className="muted">{t('typePosition')}</span>}</div>
      <div className="numpad-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} disabled={disabled} onClick={() => press(d)}>{d}</button>
        ))}
        <button disabled={disabled || !val} onClick={() => setVal((v) => v.slice(0, -1))} aria-label={t('erase')}><Icon name="undo" /></button>
        <button disabled={disabled} onClick={() => press('0')}>0</button>
        <button className="numpad-ok" disabled={disabled || !val} onClick={() => submit(val)} aria-label={t('ok')}><Icon name="check" /></button>
      </div>
    </div>
  );
}
