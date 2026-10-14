/**
 * Øvelse f: "Hele rækkefølgen" – tryk kortene i korrekt orden fra hukommelsen (1 → 52, eller fra valgfri start).
 * Fejl markeres, det rigtige kort vises og indsættes, så man kan fortsætte.
 */
import { useEffect, useRef, useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip, PlayingCard } from '../../components/PlayingCard';
import { Bar, Page, ProgressRing, Segmented, TopBar } from '../../components/ui';
import type { CardId } from '../../data/cards';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';
import { back, navigate } from '../../lib/router';
import { actions, emit } from '../../store/store';

export function FullOrder() {
  const t = useT();
  const { stack, order } = useActive();
  const [start, setStart] = useState<number | null>(null);
  const [count, setCount] = useState(52);
  const [placed, setPlaced] = useState<{ card: CardId; ok: boolean }[]>([]);
  const [lastWrong, setLastWrong] = useState<CardId | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const t0 = useRef(0);
  const lastT = useRef(0);
  const finishedRef = useRef(false);
  const mistakes = placed.filter((p) => !p.ok).length;
  const done = start !== null && placed.length >= count;

  useEffect(() => {
    if (start === null || done) return;
    const id = window.setInterval(() => setElapsed(performance.now() - t0.current), 250);
    return () => window.clearInterval(id);
  }, [start, done]);

  useEffect(() => {
    if (!done || finishedRef.current) return;
    finishedRef.current = true;
    const ms = performance.now() - t0.current;
    setElapsed(ms);
    if (mistakes === 0 && count === 52) {
      actions.setHighscore(stack.id, { fullOrderMs: ms });
      emit('confetti');
    }
    actions.finishSession();
  }, [done, count, mistakes, stack.id]);

  if (start === null) {
    return (
      <>
        <TopBar title={t('modeFull')} backTo="/train" />
        <Page>
          <p className="muted">{t('fullIntro')}</p>
          <div className="card stack-v gap-top">
            <div className="field">{t('howMany')}
              <Segmented value={count} onChange={setCount} options={[13, 26, 52].map((n) => ({ value: n, label: String(n) }))} />
            </div>
            <div className="btn-row">
              <button className="btn primary big" onClick={() => { finishedRef.current = false; lastT.current = 0; t0.current = performance.now(); setStart(1); }}>
                <Icon name="play" /> {t('startFrom', { n: 1 })}
              </button>
            </div>
            {count < 52 && (
              <button className="btn" onClick={() => { finishedRef.current = false; lastT.current = 0; t0.current = performance.now(); setStart(1 + Math.floor(Math.random() * (53 - count))); }}>
                🎲 {t('randomStart')}
              </button>
            )}
          </div>
        </Page>
      </>
    );
  }

  const nextPos = start + placed.length;
  const expected = order[nextPos - 1];

  const pick = (c: CardId) => {
    if (done) return;
    const ok = c === expected;
    if (ok) { sfx.correct(); setLastWrong(null); } else { sfx.wrong(); setLastWrong(c); }
    const now = performance.now();
    actions.recordAnswer(stack.id, expected, 'p2c', ok, now - (lastT.current || t0.current));
    lastT.current = now;
    setPlaced((p) => [...p, { card: expected, ok }]);
  };

  if (done) {
    const pct = Math.round(((count - mistakes) / count) * 100);
    return (
      <>
        <TopBar title={t('modeFull')} backTo="/train" />
        <Page>
          <div className="card hero center stack-v" style={{ alignItems: 'center' }}>
            <ProgressRing value={pct} size={140}><div><b style={{ fontSize: '2rem' }}>{pct}%</b><br /><small>{t('nOfM', { n: count - mistakes, m: count })}</small></div></ProgressRing>
            <h2 className="display">{mistakes === 0 ? t('perfect') : t('mistakesN', { n: mistakes })}</h2>
            <span className="pill gold">⏱ {(elapsed / 1000).toFixed(1)} s</span>
          </div>
          <div className="section-title">{t('yourSequence')}</div>
          <div className="chip-row">
            {placed.map((p, i) => <span key={i} title={`#${start + i}`} style={{ outline: p.ok ? undefined : '2px solid var(--bad)', borderRadius: 8 }}><CardChip card={p.card} size="sm" /></span>)}
          </div>
          <div className="stack-v gap-top">
            <button className="btn primary block" onClick={() => { setPlaced([]); setStart(null); }}>{t('again')}</button>
            <button className="btn ghost block" onClick={() => navigate('/train', true)}>{t('done')}</button>
          </div>
        </Page>
      </>
    );
  }

  return (
    <Page className="full">
      <div className="quiz">
        <div className="quiz-top">
          <button className="icon-btn" onClick={() => back('/train')} aria-label={t('endSession')}><Icon name="close" /></button>
          <Bar value={(placed.length / count) * 100} />
          <span className="pill mono">⏱ {Math.floor(elapsed / 1000)}s</span>
        </div>
        <div className="quiz-prompt">{t('fullNext', { n: nextPos })} · <span className={mistakes ? 'bad' : 'muted'}>{t('mistakesN', { n: mistakes })}</span></div>
        <div className="stack-h" style={{ justifyContent: 'center', minHeight: 150 }}>
          {placed.slice(-3).map((p, i, arr) => (
            <span key={placed.length - arr.length + i} className="card-enter" style={{ marginLeft: i ? -30 : 0 }}>
              <PlayingCard card={p.card} width={86} state={p.ok ? undefined : 'bad'} />
            </span>
          ))}
          <span className="pop" key={nextPos} style={{ marginLeft: placed.length ? -20 : 0 }}><PlayingCard faceDown width={86} /></span>
        </div>
        {lastWrong && (
          <div className="feedback badf">
            <span>✗</span>
            <span style={{ flex: 1 }}>{t('youPicked')} <CardChip card={lastWrong} size="sm" /> — {t('correctWas')} <CardChip card={placed[placed.length - 1].card} size="sm" /></span>
          </div>
        )}
        <CardPicker onPick={pick} disabledCards={new Set(placed.map((p) => p.card))} />
      </div>
    </Page>
  );
}
