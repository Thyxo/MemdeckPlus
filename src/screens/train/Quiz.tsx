/**
 * Quiz-motor til alle spørgsmålsbaserede øvelser.
 *  c2p: kort → position (talknapper)
 *  p2c: position → kort (kortvælger)
 *  nx : næste/forrige kort (kortvælger)
 * Måler svartid, giver grøn/rød feedback med korrekt svar og hukommelsestip, registrerer i SRS.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { Icon } from '../../components/Icon';
import { NumberPad } from '../../components/NumberPad';
import { CardChip, PlayingCard } from '../../components/PlayingCard';
import { Bar } from '../../components/ui';
import { type CardId, cardLabel } from '../../data/cards';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';
import type { QueueItem } from '../../lib/srs';
import { back } from '../../lib/router';
import { actions, useApp } from '../../store/store';
import { MemoryTip } from './memoryTip';

export interface QItem extends QueueItem { prev?: boolean }
export interface Answer { item: QItem; correct: boolean; ms: number; given: string; expected: string }
export interface QuizResult { answers: Answer[]; durationMs: number }

interface Props {
  title: string;
  stackId: string;
  order: (CardId | null)[];
  items?: QItem[];
  /** Uendelig generator (hurtig-runde) */
  next?: () => QItem;
  /** Samlet tid i sekunder (hurtig-runde) */
  totalSeconds?: number;
  /** Tid pr. spørgsmål i sekunder (0 = fri) */
  perQuestion?: number;
  onDone: (r: QuizResult) => void;
}

const wrap = (p: number) => ((p - 1 + 52) % 52) + 1;

export function Quiz({ title, stackId, order, items, next, totalSeconds, perQuestion = 0, onDone }: Props) {
  const t = useT();
  const { settings } = useApp();
  const lang = settings.danishRanks ? 'da' : 'en';
  const speed = !!next;
  const [queue, setQueue] = useState<QItem[]>(() => (items ? items : [next!()]));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'ask' | 'fb'>('ask');
  const [last, setLast] = useState<Answer | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [remaining, setRemaining] = useState(totalSeconds ?? 0);
  const asked = useRef(performance.now());
  const started = useRef(performance.now());
  const doneRef = useRef(false);
  const answersRef = useRef<Answer[]>([]);
  const item = queue[idx];

  const finish = useCallback((all: Answer[]) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone({ answers: all, durationMs: performance.now() - started.current });
  }, [onDone]);

  const expectedFor = (it: QItem): { pos?: number; card?: CardId } => {
    if (it.dir === 'c2p') return { pos: it.pos };
    if (it.dir === 'p2c') return { card: it.card };
    const target = order[wrap(it.pos + (it.prev ? -1 : 1)) - 1];
    return { card: target ?? undefined };
  };

  const advance = useCallback((all: Answer[]) => {
    if (speed) {
      setQueue((q) => [...q, next!()]);
      setIdx((i) => i + 1);
      setPhase('ask');
      asked.current = performance.now();
      return;
    }
    if (idx + 1 >= queue.length) return finish(all);
    setIdx(idx + 1);
    setPhase('ask');
    asked.current = performance.now();
  }, [speed, next, idx, queue.length, finish]);

  const answer = (given: { pos?: number; card?: CardId } | null) => {
    if (phase !== 'ask' || !item || doneRef.current) return;
    const ms = performance.now() - asked.current;
    const exp = expectedFor(item);
    const correct = !!given && (exp.pos !== undefined ? given.pos === exp.pos : given.card === exp.card);
    const a: Answer = {
      item, correct, ms,
      given: given ? (given.pos !== undefined ? `#${given.pos}` : given.card ? cardLabel(given.card, lang) : '–') : '⏱',
      expected: exp.pos !== undefined ? `#${exp.pos}` : exp.card ? cardLabel(exp.card, lang) : '?',
    };
    actions.recordAnswer(stackId, item.card, item.dir, correct, ms);
    if (correct) sfx.correct(); else sfx.wrong();
    const all = [...answersRef.current, a];
    answersRef.current = all;
    setAnswers(all);
    setLast(a);
    setPhase('fb');
    if (speed) window.setTimeout(() => advanceRef.current(all), correct ? 250 : 900);
    else if (correct) window.setTimeout(() => advanceRef.current(all), 750);
  };

  // Hold en frisk reference til advance til auto-fremskridt
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Tid pr. spørgsmål
  useEffect(() => {
    if (!perQuestion || phase !== 'ask' || speed) return;
    const id = window.setTimeout(() => answer(null), perQuestion * 1000);
    return () => window.clearTimeout(id);
  }, [idx, phase, perQuestion]); // answer() læses frisk ved hver render

  // Samlet nedtælling (hurtig-runde)
  useEffect(() => {
    if (!totalSeconds) return;
    const id = window.setInterval(() => {
      const left = Math.max(0, totalSeconds - (performance.now() - started.current) / 1000);
      setRemaining(left);
      if (left <= 0) { window.clearInterval(id); finish(answersRef.current); }
    }, 100);
    return () => window.clearInterval(id);
  }, [totalSeconds, finish]);

  if (!item) return null;
  const done = speed ? answers.filter((a) => a.correct).length : idx + (phase === 'fb' ? 1 : 0);
  const progress = speed ? (1 - remaining / (totalSeconds || 1)) * 100 : (done / queue.length) * 100;
  const fb = phase === 'fb' ? last : null;

  let prompt: string;
  if (item.dir === 'c2p') prompt = t('qWhereIs', { card: cardLabel(item.card, lang) });
  else if (item.dir === 'p2c') prompt = t('qWhatIs', { n: item.pos });
  else prompt = item.prev ? t('qBefore', { card: cardLabel(item.card, lang) }) : t('qAfter', { card: cardLabel(item.card, lang) });

  return (
    <div className="quiz">
      <div className="quiz-top">
        <button className="icon-btn" onClick={() => (answers.length ? finish(answers) : back('/train'))} aria-label={t('endSession')}><Icon name="close" /></button>
        <Bar value={progress} tone={speed ? 'green' : 'gold'} />
        <span className="pill mono">{speed ? `${Math.ceil(remaining)}s · ✓${done}` : `${Math.min(idx + 1, queue.length)}/${queue.length}`}</span>
      </div>
      <small className="muted">{title}</small>
      {perQuestion > 0 && !speed && phase === 'ask' && (
        <div className="timer-bar"><span key={idx} style={{ animation: `shrink ${perQuestion}s linear forwards` }} /></div>
      )}
      <div className="quiz-prompt" aria-live="polite">{prompt}</div>

      <div className={`quiz-stage ${fb && !fb.correct ? 'shake' : ''}`} key={idx}>
        {item.dir === 'p2c' ? (
          <div className="card-enter center">
            <div className="quiz-big">#{item.pos}</div>
            {fb && <div className="gap-top"><PlayingCard card={item.card} width={110} state={fb.correct ? 'ok' : 'bad'} /></div>}
          </div>
        ) : (
          <div className="card-enter center">
            <PlayingCard card={item.card} width={item.dir === 'nx' ? 120 : 150} state={fb ? (fb.correct ? 'ok' : 'bad') : undefined} />
          </div>
        )}
      </div>

      {fb ? (
        <div className={`feedback ${fb.correct ? 'good' : 'badf'}`}>
          <div style={{ fontSize: '1.8rem' }}>{fb.correct ? '✓' : '✗'}</div>
          <div style={{ flex: 1 }} className="stack-v">
            <div className="fb-title">
              {fb.correct ? t('correct') : t('wrongAnswer', { given: fb.given })}
              <span className="muted" style={{ fontWeight: 500 }}> · {(fb.ms / 1000).toFixed(1)} s</span>
            </div>
            {!fb.correct && (
              <div className="stack-h">
                <span>{t('correctAnswer')}:</span>
                {fb.item.dir === 'c2p'
                  ? <b className="gold" style={{ fontSize: '1.3rem' }}>{fb.expected}</b>
                  : <CardChip card={expectedFor(fb.item).card ?? null} size="lg" />}
              </div>
            )}
            {!speed && !fb.correct && <MemoryTip card={fb.item.dir === 'nx' ? (expectedFor(fb.item).card ?? fb.item.card) : fb.item.card}
              pos={fb.item.dir === 'nx' ? wrap(fb.item.pos + (fb.item.prev ? -1 : 1)) : fb.item.pos} stackId={stackId} />}
          </div>
          {!speed && !fb.correct && (
            <button className="btn primary" onClick={() => advance(answers)} autoFocus>{t('next')} <Icon name="arrowRight" size={18} /></button>
          )}
        </div>
      ) : (
        <div style={{ width: '100%' }}>
          {item.dir === 'c2p'
            ? <NumberPad onSubmit={(n) => answer({ pos: n })} />
            : <CardPicker onPick={(c) => answer({ card: c })} />}
        </div>
      )}
    </div>
  );
}
