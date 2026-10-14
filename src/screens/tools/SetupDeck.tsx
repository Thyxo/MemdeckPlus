/**
 * "Sæt spillet op": guide til at ordne et rigtigt kortspil, ét kort ad gangen.
 * To retninger: stakkens rækkefølge (find kortet) eller fra sorteret spil (kortet → position).
 * Oplæsning (Web Speech API), auto-stepper og halvvejs-tjek ved 26.
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip, PlayingCard } from '../../components/PlayingCard';
import { Bar, Page, Segmented, TopBar } from '../../components/ui';
import { NEW_DECK_ORDER, cardName } from '../../data/cards';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';
import { speak, speechSupported, stopSpeaking } from '../../lib/speech';

export function SetupDeck() {
  const t = useT();
  const { state, order, posOf } = useActive();
  const lang = state.settings.lang;
  const [mode, setMode] = useState<'stack' | 'sorted'>('stack');
  const [i, setI] = useState(0);
  const [voice, setVoice] = useState(false);
  const [auto, setAuto] = useState(false);
  const [delay, setDelay] = useState(4);
  const swipe = useRef<number | null>(null);
  const list = mode === 'stack' ? order : NEW_DECK_ORDER;
  const card = list[i];
  const targetPos = posOf.get(card) ?? 0;
  const halfway = mode === 'stack' && i === 25;

  // Wake lock: hold skærmen tændt under opsætning
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => undefined);
    return () => { lock?.release().catch(() => undefined); stopSpeaking(); };
  }, []);

  useEffect(() => {
    if (!voice || !card) return;
    const text = mode === 'stack'
      ? `${i + 1}. ${cardName(card, lang)}`
      : `${cardName(card, lang)}: ${t('position')} ${targetPos}`;
    speak(text, lang);
  }, [i, voice, mode, card, lang, targetPos, t]);

  useEffect(() => {
    if (!auto) return;
    if (i >= 51) { setAuto(false); return; }
    const id = window.setTimeout(() => setI((x) => Math.min(51, x + 1)), delay * 1000);
    return () => window.clearTimeout(id);
  }, [auto, i, delay]);

  const go = (d: number) => { sfx.tap(); setI((x) => Math.max(0, Math.min(51, x + d))); };

  return (
    <>
      <TopBar title={t('setupDeck')} backTo="/tools" />
      <Page className="full">
        <Segmented value={mode} onChange={(m) => { setMode(m); setI(0); }} options={[{ value: 'stack', label: t('setupByStack') }, { value: 'sorted', label: t('setupFromSorted') }]} />
        <p className="muted" style={{ fontSize: '.85rem' }}>{mode === 'stack' ? t('setupByStackHelp') : t('setupFromSortedHelp')}</p>

        <div className="spread"><b className="mono">{i + 1} / 52</b>{halfway && <span className="pill gold">½ {t('halfwayCheck')}</span>}</div>
        <Bar value={((i + 1) / 52) * 100} />

        <div className="stack-v gap-top" style={{ alignItems: 'center' }}
          onPointerDown={(e) => { swipe.current = e.clientX; }}
          onPointerUp={(e) => { if (swipe.current === null) return; const dx = e.clientX - swipe.current; swipe.current = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); }}>
          {mode === 'sorted' && <div className="quiz-big" style={{ fontSize: '2.2rem' }}>→ #{targetPos}</div>}
          <div key={`${mode}${i}`} className="card-enter" style={{ width: 'min(62vw, 260px)' }}><PlayingCard card={card} width="100%" /></div>
          <div className="display" style={{ fontSize: '1.3rem' }}>{cardName(card, lang)}</div>
          {mode === 'stack' && i < 51 && <small className="muted">{t('upNext')}: <CardChip card={list[i + 1]} size="sm" /></small>}
        </div>

        {halfway && (
          <div className="feedback good gap-top">
            <span>🔎</span>
            <span>{t('halfwayText', { a: cardName(order[0], lang), b: cardName(order[25], lang) })}</span>
          </div>
        )}

        <div className="btn-row gap-top">
          <button className="btn big" onClick={() => go(-1)} disabled={i === 0}><Icon name="back" /> {t('back')}</button>
          <button className="btn primary big" onClick={() => go(1)} disabled={i === 51}>{t('next')} <Icon name="chevron" /></button>
        </div>
        <div className="btn-row gap-top">
          {speechSupported && (
            <button className={`btn ${voice ? 'outline' : ''}`} onClick={() => { setVoice(!voice); if (voice) stopSpeaking(); }} aria-pressed={voice}>
              <Icon name="speaker" size={18} /> {voice ? t('voiceOn') : t('voiceOff')}
            </button>
          )}
          <button className={`btn ${auto ? 'outline' : ''}`} onClick={() => setAuto(!auto)} aria-pressed={auto}>
            <Icon name={auto ? 'pause' : 'play'} size={18} /> {auto ? t('autoOn') : t('autoStep')}
          </button>
        </div>
        {auto && (
          <label className="field gap-top">{t('secondsPerCard', { n: delay })}
            <input type="range" min={2} max={10} value={delay} onChange={(e) => setDelay(Number(e.target.value))} style={{ accentColor: 'var(--gold)', minHeight: 44 }} />
          </label>
        )}
        {i === 51 && <div className="feedback good gap-top"><span>✅</span><span>{t('setupDone')}</span></div>}
        <div className="btn-row gap-top">
          <button className="btn ghost" onClick={() => setI(0)}>{t('restart')}</button>
          <button className="btn ghost" onClick={() => setI(25)}>{t('jumpToHalf')}</button>
        </div>
      </Page>
    </>
  );
}
