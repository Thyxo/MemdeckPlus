/**
 * "Byg stakken": lær 5–10 kort ad gangen. Hver bid studeres (vend kort, billede, historie)
 * og testes; ved ≥ 90 % rigtige låses næste bid op.
 */
import { useRef, useState } from 'react';
import { ImageThumb } from '../../components/CardImageView';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip, FlipCard } from '../../components/PlayingCard';
import { Page, ProgressRing, Segmented, TopBar, confirmDialog } from '../../components/ui';
import { type CardId, cardName } from '../../data/cards';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';
import { shuffleSoft } from '../../lib/srs';
import { actions, emit } from '../../store/store';
import { type QItem, Quiz, type QuizResult } from '../train/Quiz';
import { palaceStopFor } from '../train/memoryTip';
import { ImageEditorSheet } from './ImageEditor';

const PASS = 0.9;

export function BuildStack() {
  const t = useT();
  const { state, stack, order } = useActive();
  const lp = state.learn[stack.id] ?? { chunkSize: 8, passed: [] };
  const size = lp.chunkSize;
  const chunks = Math.ceil(52 / size);
  const [open, setOpen] = useState<number | null>(null);

  if (open !== null) return <ChunkStudy key={open} idx={open} size={size} onClose={() => setOpen(null)} onNext={() => setOpen(open + 1 < chunks ? open + 1 : null)} />;

  const unlocked = (i: number) => i === 0 || lp.passed.includes(i - 1) || lp.passed.includes(i);

  return (
    <>
      <TopBar title={t('buildTheStack')} backTo="/learn" sub={stack.name} />
      <Page>
        <p className="muted">{t('buildIntro')}</p>
        <label className="field gap-top">{t('chunkSize')}
          <Segmented value={size} onChange={async (v) => {
            if (v === size) return;
            if (lp.passed.length && !(await confirmDialog({ title: t('changeChunkQ'), body: t('changeChunkBody') }))) return;
            actions.setChunkSize(stack.id, v);
          }} options={[5, 6, 8, 10].map((n) => ({ value: n, label: t('nCards', { n }) }))} />
        </label>
        <div className="navlist gap-top">
          {Array.from({ length: chunks }, (_, i) => {
            const from = i * size + 1;
            const to = Math.min(52, from + size - 1);
            const passed = lp.passed.includes(i);
            const open = unlocked(i);
            return (
              <button key={i} className="navrow" disabled={!open} onClick={() => { sfx.tap(); setOpen(i); }} style={{ opacity: open ? 1 : 0.55 }}>
                <span className="navrow-icon">{passed ? '✓' : open ? i + 1 : '🔒'}</span>
                <span className="navrow-text">
                  <b>{t('chunkN', { n: i + 1 })} · #{from}–{to}</b>
                  <span className="chip-row" style={{ marginTop: 4 }}>
                    {order.slice(from - 1, to).map((c) => <CardChip key={c} card={open ? c : null} size="sm" />)}
                  </span>
                </span>
                {passed ? <span className="pill ok">{t('passed')}</span> : open ? <Icon name="chevron" className="muted" /> : null}
              </button>
            );
          })}
        </div>
      </Page>
    </>
  );
}

function ChunkStudy({ idx, size, onClose, onNext }: { idx: number; size: number; onClose: () => void; onNext: () => void }) {
  const t = useT();
  const { state, stack, order } = useActive();
  const from = idx * size + 1;
  const to = Math.min(52, from + size - 1);
  const cards = order.slice(from - 1, to);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<'study' | 'quiz' | 'result'>('study');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [editImg, setEditImg] = useState<CardId | null>(null);
  const swipe = useRef<number | null>(null);
  const pos = from + i;
  const card = cards[i];
  const nextCard = order[pos % 52];
  const story = state.stories[stack.id]?.[pos] ?? '';
  const ps = palaceStopFor(state, stack.id, pos);
  const lang = state.settings.lang;

  const go = (d: number) => {
    const n = i + d;
    if (n < 0 || n >= cards.length) return;
    sfx.tap();
    setI(n);
    setFlipped(false);
  };

  if (phase === 'quiz') {
    const items: QItem[] = shuffleSoft(cards.flatMap((c, k) => {
      const p = from + k;
      const base: QItem[] = [{ card: c, pos: p, dir: 'c2p' }, { card: c, pos: p, dir: 'p2c' }];
      if (k < cards.length - 1) base.push({ card: c, pos: p, dir: 'nx' });
      return base;
    }));
    return (
      <Page className="full">
        <Quiz title={`${t('chunkN', { n: idx + 1 })} · #${from}–${to}`} stackId={stack.id} order={stack.order} items={items}
          onDone={(r) => {
            setResult(r);
            setPhase('result');
            const ok = r.answers.filter((a) => a.correct).length / Math.max(1, r.answers.length);
            if (ok >= PASS && r.answers.length === items.length) {
              actions.passChunk(stack.id, idx);
              emit('confetti');
            }
            actions.finishSession();
          }} />
      </Page>
    );
  }

  if (phase === 'result' && result) {
    const n = result.answers.length;
    const ok = result.answers.filter((a) => a.correct).length;
    const pct = Math.round((ok / Math.max(1, n)) * 100);
    const passed = pct >= PASS * 100;
    return (
      <>
        <TopBar title={t('chunkN', { n: idx + 1 })} backTo="/learn/build" />
        <Page>
          <div className="card hero center stack-v" style={{ alignItems: 'center' }}>
            <ProgressRing value={pct} size={140}><b style={{ fontSize: '2rem' }}>{pct}%</b></ProgressRing>
            <h2 className="display">{passed ? t('chunkPassed') : t('chunkNotPassed', { n: Math.round(PASS * 100) })}</h2>
          </div>
          <div className="stack-v gap-top">
            {passed && <button className="btn primary block big" onClick={onNext}>{t('nextChunk')} <Icon name="arrowRight" /></button>}
            <button className={`btn block ${passed ? '' : 'primary'}`} onClick={() => { setI(0); setFlipped(false); setPhase('study'); }}>{t('studyAgain')}</button>
            <button className="btn block" onClick={() => setPhase('quiz')}>{t('testAgain')}</button>
            <button className="btn ghost block" onClick={onClose}>{t('backToChunks')}</button>
          </div>
        </Page>
      </>
    );
  }

  return (
    <>
      <TopBar title={`${t('chunkN', { n: idx + 1 })} · #${from}–${to}`} backTo="/learn/build" right={<button className="icon-btn" onClick={onClose} aria-label={t('close')}><Icon name="close" /></button>} />
      <Page>
        <div className="chip-row" style={{ justifyContent: 'center' }}>
          {cards.map((c, k) => (
            <button key={c} onClick={() => { setI(k); setFlipped(false); }} style={{ border: 0, background: 'none', padding: 2, opacity: k === i ? 1 : 0.5 }} aria-label={`#${from + k}`}>
              <span className={`pill ${k === i ? 'gold' : ''}`}>#{from + k}</span>
            </button>
          ))}
        </div>

        <div className="stack-v gap-top" style={{ alignItems: 'center' }}
          onPointerDown={(e) => { swipe.current = e.clientX; }}
          onPointerUp={(e) => {
            if (swipe.current === null) return;
            const dx = e.clientX - swipe.current;
            swipe.current = null;
            if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
          }}>
          <div className="quiz-big" style={{ fontSize: '3rem' }}>#{pos}</div>
          <div className="card-enter" key={pos} style={{ width: 'min(52vw, 200px)' }}>
            <FlipCard card={card} flipped={flipped} width="100%" onClick={() => { sfx.tap(); setFlipped(!flipped); }} />
          </div>
          <small className="muted">{flipped ? cardName(card, lang) : t('tapToFlip')}</small>
        </div>

        {flipped && (
          <div className="card stack-v gap-top" style={{ animation: 'page-in .3s' }}>
            <button className="stack-h" style={{ background: 'none', border: 0, padding: 0, color: 'inherit', textAlign: 'left', flexWrap: 'nowrap' }} onClick={() => setEditImg(card)}>
              <ImageThumb img={state.images[card]} />
              <span className="navrow-text">
                <b>{state.images[card]?.text || t('noImageYet')}</b>
                <small className="muted">{t('tapToEditImage')}</small>
              </span>
              <Icon name="edit" className="muted" />
            </button>
            {ps && <small className="muted">🏛️ {ps.palace.name}: {ps.stop.emoji} {ps.stop.name}</small>}
            <label className="field">{t('storyToNext', { n: pos % 52 + 1 })} <span className="stack-h" style={{ gap: 6 }}><CardChip card={card} size="sm" /> → <CardChip card={nextCard} size="sm" /></span>
              <textarea className="input" style={{ minHeight: 70, fontFamily: 'inherit' }} value={story} placeholder={t('storyPlaceholder', {
                a: state.images[card]?.text || cardName(card, lang), b: state.images[nextCard]?.text || cardName(nextCard, lang),
              })} onChange={(e) => actions.setStory(stack.id, pos, e.target.value)} />
            </label>
          </div>
        )}

        <div className="btn-row gap-top">
          <button className="btn" disabled={i === 0} onClick={() => go(-1)}><Icon name="back" /> {t('previous')}</button>
          {i < cards.length - 1
            ? <button className="btn primary" onClick={() => go(1)}>{t('next')} <Icon name="chevron" /></button>
            : <button className="btn primary" onClick={() => setPhase('quiz')}>{t('testChunk')}</button>}
        </div>
        {i < cards.length - 1 && <button className="btn ghost block gap-top" onClick={() => setPhase('quiz')}>{t('skipToTest')}</button>}
      </Page>
      <ImageEditorSheet card={editImg} onClose={() => setEditImg(null)} />
    </>
  );
}
