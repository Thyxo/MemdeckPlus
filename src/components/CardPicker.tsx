/**
 * Kortvælger: vælg værdi + kulør (i vilkårlig rækkefølge). Indsendes automatisk, når begge er valgt.
 * Store trykflader (min. 44 px) – egnet til hurtig betjening med tommelfingeren.
 */
import { useEffect, useState } from 'react';
import { type CardId, RANKS, type Rank, type Suit, SUITS, rankLabel } from '../data/cards';
import { useT } from '../i18n';
import { sfx } from '../lib/feedback';
import { useApp } from '../store/store';
import { SuitIcon } from './SuitIcon';

export function CardPicker({ onPick, disabled, disabledCards, compact }: {
  onPick: (c: CardId) => void; disabled?: boolean; disabledCards?: Set<CardId>; compact?: boolean;
}) {
  const t = useT();
  const { settings } = useApp();
  const [rank, setRank] = useState<Rank | null>(null);
  const [suit, setSuit] = useState<Suit | null>(null);

  useEffect(() => {
    if (rank && suit) {
      const c = `${rank}${suit}` as CardId;
      setRank(null);
      setSuit(null);
      if (!disabledCards?.has(c)) onPick(c);
    }
  }, [rank, suit, onPick, disabledCards]);

  useEffect(() => { if (disabled) { setRank(null); setSuit(null); } }, [disabled]);

  const suitNames: Record<Suit, string> = { S: t('suitS'), H: t('suitH'), C: t('suitC'), D: t('suitD') };

  return (
    <div className={`picker ${compact ? 'picker-compact' : ''}`}>
      <div className="picker-ranks" role="group" aria-label={t('rank')}>
        {RANKS.map((r) => {
          const allUsed = disabledCards && SUITS.every((s) => disabledCards.has(`${r}${s}` as CardId));
          const blocked = !!(suit && disabledCards?.has(`${r}${suit}` as CardId));
          return (
            <button key={r} disabled={disabled || allUsed || blocked} aria-pressed={rank === r}
              className={rank === r ? 'on' : ''} onClick={() => { sfx.tap(); setRank(rank === r ? null : r); }}>
              {rankLabel(r, settings.danishRanks ? 'da' : 'en')}
            </button>
          );
        })}
      </div>
      <div className="picker-suits" role="group" aria-label={t('suit')}>
        {SUITS.map((s) => {
          const blocked = !!(rank && disabledCards?.has(`${rank}${s}` as CardId));
          return (
            <button key={s} disabled={disabled || blocked} aria-pressed={suit === s} aria-label={suitNames[s]}
              className={`${suit === s ? 'on' : ''} suit-${s}`} onClick={() => { sfx.tap(); setSuit(suit === s ? null : s); }}>
              <SuitIcon suit={s} size={26} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
