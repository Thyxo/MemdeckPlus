/**
 * ACAAN (Any Card At Any Number): tal → kort og kort → tal, med valg af tælle-konvention
 * og evt. forskydning (hvis spillet er cuttet). Tabel kan printes som cheat sheet.
 */
import { useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { Icon } from '../../components/Icon';
import { NumberPad } from '../../components/NumberPad';
import { useActive } from '../../components/StackSelect';
import { CardChip, PlayingCard } from '../../components/PlayingCard';
import { Page, Segmented, Stepper, TopBar } from '../../components/ui';
import type { CardId } from '../../data/cards';
import { useT } from '../../i18n';

const wrap = (n: number) => ((((n - 1) % 52) + 52) % 52) + 1;

export function Acaan() {
  const t = useT();
  const { stack, cardAt, posOf } = useActive();
  const [dir, setDir] = useState<'num' | 'card'>('num');
  const [onCount, setOnCount] = useState(true);
  const [offset, setOffset] = useState(0);
  const [num, setNum] = useState<number | null>(null);
  const [card, setCard] = useState<CardId | null>(null);
  // Position i stakken for tallet n: på tallet = n, efter tallet = n+1 (plus evt. cut-forskydning)
  const posFor = (n: number) => wrap(n + (onCount ? 0 : 1) + offset);
  const numFor = (c: CardId) => wrap((posOf.get(c) ?? 1) - offset - (onCount ? 0 : 1));

  return (
    <>
      <TopBar title={t('acaan')} backTo="/tools" right={<button className="icon-btn" onClick={() => window.print()} aria-label={t('print')}><Icon name="print" /></button>} />
      <Page>
        <div className="no-print stack-v">
          <Segmented value={dir} onChange={setDir} options={[{ value: 'num', label: t('numToCard') }, { value: 'card', label: t('cardToNum') }]} />
          <Segmented value={onCount ? 'on' : 'after'} onChange={(v) => setOnCount(v === 'on')} options={[{ value: 'on', label: t('onTheCount') }, { value: 'after', label: t('afterTheCount') }]} />
          <div className="spread"><span>{t('cutOffset')}</span><Stepper value={offset} min={0} max={51} onChange={setOffset} /></div>
          <div className="card center" style={{ minHeight: 180, display: 'grid', placeItems: 'center' }} aria-live="polite">
            {dir === 'num'
              ? (num ? <div className="stack-v" style={{ alignItems: 'center' }}><div className="quiz-big" style={{ fontSize: '2.4rem' }}>{num}</div><PlayingCard card={cardAt(posFor(num))} width={110} /></div> : <span className="muted">{t('typeNumber')}</span>)
              : (card ? <div className="stack-v" style={{ alignItems: 'center' }}><CardChip card={card} size="lg" /><div className="quiz-big">{numFor(card)}</div></div> : <span className="muted">{t('pickACard')}</span>)}
          </div>
          {dir === 'num' ? <NumberPad onSubmit={setNum} /> : <CardPicker onPick={setCard} />}
        </div>

        <div className="section-title">{t('acaanTable')} · {stack.name}{offset ? ` (+${offset})` : ''}</div>
        <div className="print-only"><h2>{stack.name} – ACAAN</h2></div>
        <div className="card flat sheet-cols">
          {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
            <div key={n} className="sc-row"><b>{n}</b><CardChip card={cardAt(posFor(n))} size="sm" /></div>
          ))}
        </div>
      </Page>
    </>
  );
}
