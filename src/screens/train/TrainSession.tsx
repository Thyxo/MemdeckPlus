/** Kører en træningssession for en given øvelse og viser opsummering bagefter. */
import { useCallback, useMemo, useState } from 'react';
import { useActive } from '../../components/StackSelect';
import { EmptyState, Page, Segmented, TopBar } from '../../components/ui';
import { useT } from '../../i18n';
import { buildDailyQueue, weakCards } from '../../lib/srs';
import { navigate } from '../../lib/router';
import { actions, emit } from '../../store/store';
import { FullOrder } from './FullOrder';
import { dirsFor, randomItems, range } from './modes';
import { type QItem, Quiz, type QuizResult } from './Quiz';
import { Summary } from './Summary';

export function TrainSession({ mode }: { mode: string }) {
  const t = useT();
  const { state, stack, order, complete, srs } = useActive();
  const s = state.settings;
  const [result, setResult] = useState<QuizResult | null>(null);
  const [run, setRun] = useState(0);
  const [retry, setRetry] = useState<QItem[] | null>(null);
  const [rangeSel, setRangeSel] = useState<{ from: number; to: number } | null>(null);
  const dirs = dirsFor(s.direction);

  const titles: Record<string, string> = {
    daily: t('dailyTraining'), c2p: t('modeC2P'), p2c: t('modeP2C'), next: t('modeNext'),
    speed: t('modeSpeed'), range: t('modeRange'), full: t('modeFull'), weak: t('modeWeak'),
  };

  // Spørgsmål beregnes én gang pr. kørsel (run)
  const items = useMemo<QItem[]>(() => {
    if (!complete) return [];
    if (retry) return retry;
    const all = range(1, 52);
    switch (mode) {
      case 'daily': return buildDailyQueue(order, srs, { dirs, size: s.sessionSize, newLimit: s.newPerDay });
      case 'c2p': return randomItems(order, all, ['c2p'], s.sessionSize);
      case 'p2c': return randomItems(order, all, ['p2c'], s.sessionSize);
      case 'next': return randomItems(order, all, ['nx'], s.sessionSize);
      case 'weak': {
        const w = weakCards(srs, order, 15).map((x) => order.indexOf(x.card) + 1);
        return w.length ? randomItems(order, w, dirs, Math.max(w.length * 2, 10)) : [];
      }
      case 'range':
        return rangeSel ? randomItems(order, range(rangeSel.from, rangeSel.to), [...dirs, 'nx'], Math.min(s.sessionSize, (rangeSel.to - rangeSel.from + 1) * 2)) : [];
      default: return [];
    }
  }, [mode, run, retry, rangeSel, complete]); // bevidst: nyt sæt kun ved ny kørsel

  const speedNext = useCallback((): QItem => randomItems(order, range(1, 52), ['c2p', 'p2c'], 1)[0], [order]);

  const onDone = useCallback((r: QuizResult) => {
    setResult(r);
    const correct = r.answers.filter((a) => a.correct).length;
    if (mode === 'speed') {
      if (actions.setHighscore(stack.id, { speed: correct }) && correct > 0) { emit('toast', 'newHighscore'); emit('confetti'); }
    } else if (r.answers.length >= 10 && correct === r.answers.length) {
      emit('confetti');
    }
    actions.finishSession(); // tjekker også badges
  }, [mode, stack.id]);

  const restart = (retryItems?: QItem[]) => {
    setResult(null);
    setRetry(retryItems ?? null);
    setRun((x) => x + 1);
  };

  if (!complete) {
    return (
      <>
        <TopBar title={titles[mode] ?? t('tabTrain')} backTo="/train" />
        <Page><EmptyState icon="library" title={t('stackIncompleteTitle')} text={t('stackIncompleteText')}
          action={<button className="btn primary" onClick={() => navigate(`/library/${stack.id}`)}>{t('completeStack')}</button>} /></Page>
      </>
    );
  }

  if (mode === 'full') return <FullOrder />;

  if (result) {
    return <Summary title={titles[mode]} mode={mode} result={result} stackId={stack.id}
      onAgain={() => restart()} onRetryWrong={(w) => restart(w)} />;
  }

  if (mode === 'range' && !rangeSel && !retry) return <RangeSetup onStart={(from, to) => setRangeSel({ from, to })} />;

  if (mode !== 'speed' && !items.length) {
    return (
      <>
        <TopBar title={titles[mode] ?? t('tabTrain')} backTo="/train" />
        <Page>
          {mode === 'weak'
            ? <EmptyState icon="target" title={t('noWeakTitle')} text={t('noWeakText')} action={<button className="btn primary" onClick={() => navigate('/train/c2p', true)}>{t('modeC2P')}</button>} />
            : mode === 'daily'
              ? <EmptyState icon="check" title={t('allDoneTitle')} text={t('allDoneText')} action={<button className="btn primary" onClick={() => navigate('/train/speed', true)}>⚡ {t('modeSpeed')}</button>} />
              : <EmptyState title={t('nothingToTrain')} />}
        </Page>
      </>
    );
  }

  return (
    <Page className="full">
      <Quiz
        key={run}
        title={`${stack.name} · ${titles[mode] ?? ''}${rangeSel && mode === 'range' ? ` (${rangeSel.from}–${rangeSel.to})` : ''}`}
        stackId={stack.id}
        order={stack.order}
        items={mode === 'speed' ? undefined : items}
        next={mode === 'speed' ? speedNext : undefined}
        totalSeconds={mode === 'speed' ? 60 : undefined}
        perQuestion={s.timePerQuestion}
        onDone={onDone}
      />
    </Page>
  );
}

function RangeSetup({ onStart }: { onStart: (from: number, to: number) => void }) {
  const t = useT();
  const [len, setLen] = useState(13);
  const [from, setFrom] = useState(1);
  const to = Math.min(52, from + len - 1);
  const presets = [[1, 13], [14, 26], [27, 39], [40, 52]];
  return (
    <>
      <TopBar title={t('modeRange')} backTo="/train" />
      <Page>
        <p className="muted">{t('rangeIntro')}</p>
        <div className="card stack-v gap-top">
          <label className="field">{t('rangeLength')}
            <Segmented value={len} onChange={(v) => { setLen(v); setFrom(Math.min(from, 53 - v)); }} options={[5, 10, 13, 20].map((n) => ({ value: n, label: String(n) }))} />
          </label>
          <label className="field">{t('rangeFrom', { from, to })}
            <input type="range" min={1} max={53 - len} value={from} onChange={(e) => setFrom(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--gold)', minHeight: 44 }} />
          </label>
          <div className="quiz-big" style={{ fontSize: '2.6rem' }}>{from}–{to}</div>
          <div className="btn-row">
            <button className="btn" onClick={() => { const f = 1 + Math.floor(Math.random() * (53 - len)); setFrom(f); }}>🎲 {t('random')}</button>
            <button className="btn primary" onClick={() => onStart(from, to)}>{t('start')}</button>
          </div>
        </div>
        <div className="section-title">{t('quarters')}</div>
        <div className="grid-2">
          {presets.map(([a, b]) => <button key={a} className="btn" onClick={() => onStart(a, b)}>{a}–{b}</button>)}
        </div>
      </Page>
    </>
  );
}
