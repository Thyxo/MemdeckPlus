/** Vælg aktiv stack + hook med afledte data for den aktive stack. */
import { useMemo } from 'react';
import type { CardId } from '../data/cards';
import { useT } from '../i18n';
import { actions, activeStack, fullOrder, isComplete, useApp } from '../store/store';
import { Icon } from './Icon';

export function useActive() {
  const state = useApp();
  const stack = activeStack(state);
  return useMemo(() => {
    const order = fullOrder(stack);
    const posOf = new Map<CardId, number>();
    stack.order.forEach((c, i) => c && posOf.set(c, i + 1));
    return {
      state,
      stack,
      order,
      complete: isComplete(stack),
      srs: state.srs[stack.id] ?? {},
      posOf,
      cardAt: (p: number) => stack.order[(((p - 1) % 52) + 52) % 52] ?? null,
    };
  }, [state, stack]);
}

export function StackSelect({ compact }: { compact?: boolean }) {
  const t = useT();
  const state = useApp();
  return (
    <label className="stack-select" style={compact ? { minHeight: 40 } : undefined}>
      <Icon name="deck" size={20} className="gold" />
      <span className="sr-only">{t('activeStack')}</span>
      <select value={state.activeStackId} onChange={(e) => actions.setActiveStack(e.target.value)}>
        {state.stacks.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}{isComplete(s) ? '' : ` (${t('incomplete')})`}
          </option>
        ))}
      </select>
    </label>
  );
}
