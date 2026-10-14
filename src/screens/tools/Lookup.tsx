/**
 * "Hvor skal kortet være?" – hurtigt opslag til optræden: stor skrift, sort skærm.
 * Vælg kort → position, eller tast position → kort. Begge veje på samme skærm.
 */
import { useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { Icon } from '../../components/Icon';
import { NumberPad } from '../../components/NumberPad';
import { useActive } from '../../components/StackSelect';
import { PlayingCard } from '../../components/PlayingCard';
import { Segmented } from '../../components/ui';
import { type CardId, cardLabel } from '../../data/cards';
import { useT } from '../../i18n';
import { back } from '../../lib/router';

export function Lookup() {
  const t = useT();
  const { state, posOf, cardAt, stack } = useActive();
  const [mode, setMode] = useState<'card' | 'pos'>('card');
  const [card, setCard] = useState<CardId | null>(null);
  const [pos, setPos] = useState<number | null>(null);
  const lang = state.settings.danishRanks ? 'da' : 'en';
  const shownCard = pos ? cardAt(pos) : null;

  return (
    <div className="perform" style={{ display: 'flex', flexDirection: 'column', padding: 'calc(env(safe-area-inset-top) + 8px) 12px calc(env(safe-area-inset-bottom) + 12px)' }}>
      <div className="spread">
        <button className="icon-btn" onClick={() => back('/tools')} aria-label={t('back')} style={{ color: '#888' }}><Icon name="back" /></button>
        <small style={{ color: '#666' }}>{stack.name}</small>
        <span style={{ width: 48 }} />
      </div>
      <Segmented value={mode} onChange={(m) => { setMode(m); setCard(null); setPos(null); }} options={[{ value: 'card', label: t('cardToPos') }, { value: 'pos', label: t('posToCard') }]} />
      <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 200 }} aria-live="polite">
        {mode === 'card' ? (
          card ? (
            <div className="center">
              <div style={{ color: '#888', fontSize: '1.4rem' }}>{cardLabel(card, lang)}</div>
              <div className="big-out" style={{ color: 'var(--gold)' }}>{posOf.get(card)}</div>
            </div>
          ) : <span style={{ color: '#555' }}>{t('pickACard')}</span>
        ) : shownCard ? (
          <div className="center stack-v" style={{ alignItems: 'center' }}>
            <div style={{ color: '#888', fontSize: '1.4rem' }}>#{pos}</div>
            <PlayingCard card={shownCard} width={150} />
          </div>
        ) : <span style={{ color: '#555' }}>{t('typePosition')}</span>}
      </div>
      {mode === 'card'
        ? <CardPicker onPick={(c) => setCard(c)} />
        : <NumberPad onSubmit={(n) => setPos(n)} />}
    </div>
  );
}
