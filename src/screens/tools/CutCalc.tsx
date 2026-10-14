/**
 * Cut-beregner: når der cuttes N kort fra toppen til bunden, roteres stakken N pladser.
 * Viser nyt top-/bundkort, samlet forskydning ved flere cuts og hvor et kort nu ligger.
 */
import { useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { useActive } from '../../components/StackSelect';
import { CardChip, PlayingCard } from '../../components/PlayingCard';
import { Page, Segmented, Stepper, TopBar } from '../../components/ui';
import type { CardId } from '../../data/cards';
import { useT } from '../../i18n';

const mod52 = (n: number) => ((n % 52) + 52) % 52;

export function CutCalc() {
  const t = useT();
  const { cardAt, posOf } = useActive();
  const [mode, setMode] = useState<'cut' | 'bring'>('cut');
  const [n, setN] = useState(26);
  const [cuts, setCuts] = useState<number[]>([]);
  const [find, setFind] = useState<CardId | null>(null);
  const [bring, setBring] = useState<CardId | null>(null);
  const total = mod52(cuts.reduce((a, b) => a + b, 0));
  const offset = mod52(total + (mode === 'cut' ? n : 0));
  const top = cardAt(offset + 1)!;
  const bottom = cardAt(offset === 0 ? 52 : offset)!;
  const newPos = (c: CardId) => mod52((posOf.get(c) ?? 1) - 1 - offset) + 1;

  return (
    <>
      <TopBar title={t('cutCalc')} backTo="/tools" />
      <Page>
        <p className="muted">{t('cutIntro')}</p>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'cut', label: t('cutAtN') }, { value: 'bring', label: t('bringCard') }]} />

        {mode === 'cut' ? (
          <div className="card stack-v gap-top">
            <div className="spread"><span>{t('cardsCut')}</span><Stepper value={n} min={0} max={51} onChange={setN} /></div>
            <input type="range" min={0} max={51} value={n} onChange={(e) => setN(Number(e.target.value))} style={{ accentColor: 'var(--gold)', minHeight: 44 }} aria-label={t('cardsCut')} />
            <div className="btn-row">
              <button className="btn" onClick={() => { setCuts([...cuts, n]); }}>+ {t('addCut')}</button>
              <button className="btn ghost" disabled={!cuts.length} onClick={() => setCuts([])}>{t('reset')}</button>
            </div>
            {cuts.length > 0 && <small className="muted">{t('previousCuts')}: {cuts.join(' + ')} = {total} ({t('mod52')})</small>}
          </div>
        ) : (
          <div className="card stack-v gap-top">
            <small className="muted">{t('bringHelp')}</small>
            <CardPicker onPick={setBring} compact />
            {bring && (
              <div className="stack-v">
                <div className="spread"><span>{t('toTop')} <CardChip card={bring} size="sm" /></span><b className="gold">{t('cutNCards', { n: mod52((posOf.get(bring) ?? 1) - 1 - total) })}</b></div>
                <div className="spread"><span>{t('toBottom')}</span><b className="gold">{t('cutNCards', { n: mod52((posOf.get(bring) ?? 1) - total) })}</b></div>
              </div>
            )}
          </div>
        )}

        <div className="grid-2 gap-top">
          <div className="card center stack-v" style={{ alignItems: 'center' }}><small className="muted">{t('newTop')}</small><PlayingCard card={top} width={100} /><small>{t('wasPos', { n: offset + 1 })}</small></div>
          <div className="card center stack-v" style={{ alignItems: 'center' }}><small className="muted">{t('newBottom')}</small><PlayingCard card={bottom} width={100} /><small>{t('wasPos', { n: offset === 0 ? 52 : offset })}</small></div>
        </div>

        <div className="section-title">{t('shiftedStack')}</div>
        <div className="card flat">
          <p style={{ marginTop: 0 }}>{t('shiftRule', { n: offset })}</p>
          <div className="chip-row">
            {Array.from({ length: 52 }, (_, i) => cardAt(offset + i + 1)!).map((c, i) => (
              <span key={i} className="stack-h" style={{ gap: 2 }}><small className="muted mono">{i + 1}</small><CardChip card={c} size="sm" /></span>
            ))}
          </div>
        </div>

        <div className="section-title">{t('whereIsNow')}</div>
        <div className="card stack-v">
          <CardPicker onPick={setFind} compact />
          {find && <div className="spread"><span><CardChip card={find} size="md" /> {t('origPos', { n: posOf.get(find) ?? 0 })}</span><b className="gold" style={{ fontSize: '1.6rem' }}>#{newPos(find)}</b></div>}
        </div>
      </Page>
    </>
  );
}
