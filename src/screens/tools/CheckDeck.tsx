/**
 * "Tjek mit spil": indtast kortene i den rækkefølge, de ligger (kort for kort eller som tekst),
 * og se med det samme, hvad der er forkert, mangler eller er dubleret.
 */
import { useMemo, useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { Page, Segmented, TopBar } from '../../components/ui';
import { type CardId, parseCardList } from '../../data/cards';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';

export function CheckDeck() {
  const t = useT();
  const { order } = useActive();
  const [mode, setMode] = useState<'tap' | 'text'>('tap');
  const [start, setStart] = useState(1);
  const [entered, setEntered] = useState<CardId[]>([]);
  const [text, setText] = useState('');

  const seq = mode === 'tap' ? entered : parseCardList(text).cards;
  const report = useMemo(() => {
    const wrong: { pos: number; got: CardId; exp: CardId }[] = [];
    seq.forEach((c, i) => {
      const pos = ((start - 1 + i) % 52) + 1;
      if (order[pos - 1] !== c) wrong.push({ pos, got: c, exp: order[pos - 1] });
    });
    const counts = new Map<CardId, number>();
    seq.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
    const dupes = [...counts.entries()].filter(([, n]) => n > 1).map(([c]) => c);
    const missing = seq.length >= 52 ? order.filter((c) => !counts.has(c)) : [];
    return { wrong, dupes, missing };
  }, [seq, start, order]);

  const add = (c: CardId) => {
    const pos = ((start - 1 + entered.length) % 52) + 1;
    if (order[pos - 1] === c) sfx.correct(); else sfx.wrong();
    setEntered((e) => [...e, c]);
  };

  const nextPos = ((start - 1 + entered.length) % 52) + 1;
  const last = entered.length ? entered[entered.length - 1] : null;
  const lastOk = last ? order[(start - 1 + entered.length - 1) % 52] === last : true;

  return (
    <>
      <TopBar title={t('checkDeck')} backTo="/tools" />
      <Page>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'tap', label: t('cardByCard') }, { value: 'text', label: t('asText') }]} />
        <div className="spread gap-top">
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{t('startAtPos')}
            <input className="input" style={{ width: 80 }} type="number" min={1} max={52} value={start}
              onChange={(e) => { setStart(Math.max(1, Math.min(52, Number(e.target.value) || 1))); setEntered([]); }} />
          </label>
          {mode === 'tap' && entered.length > 0 && (
            <div className="stack-h">
              <button className="btn sm" onClick={() => setEntered((e) => e.slice(0, -1))}><Icon name="undo" size={16} /> {t('undo')}</button>
              <button className="btn sm ghost" onClick={() => setEntered([])}>{t('reset')}</button>
            </div>
          )}
        </div>

        <div className={`validation gap-top ${report.wrong.length || report.dupes.length ? 'badv' : 'okv'}`}>
          {seq.length === 0 ? <span>{t('checkIntro')}</span> : report.wrong.length === 0 && report.dupes.length === 0
            ? <b>✓ {t('checkAllGood', { n: seq.length })}</b>
            : <b>{t('checkErrors', { n: report.wrong.length, m: seq.length })}</b>}
          {report.dupes.length > 0 && <div style={{ marginTop: 6 }}><small>{t('duplicates')}:</small><div className="chip-row">{report.dupes.map((c) => <CardChip key={c} card={c} size="sm" />)}</div></div>}
          {report.missing.length > 0 && <div style={{ marginTop: 6 }}><small>{t('missingCards', { n: report.missing.length })}:</small><div className="chip-row">{report.missing.map((c) => <CardChip key={c} card={c} size="sm" />)}</div></div>}
        </div>

        {report.wrong.length > 0 && (
          <div className="card flat gap-top">
            <table className="table">
              <thead><tr><th>#</th><th>{t('found')}</th><th>{t('shouldBe')}</th></tr></thead>
              <tbody>{report.wrong.slice(0, 52).map((w) => (
                <tr key={w.pos}><td><b>{w.pos}</b></td><td><CardChip card={w.got} size="sm" /></td><td><CardChip card={w.exp} size="sm" /></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {mode === 'tap' ? (
          <div className="stack-v gap-top">
            <div className="spread">
              <b>{t('cardAtPos', { n: nextPos })}</b>
              {last && <span className={lastOk ? 'ok' : 'bad'}>{lastOk ? '✓' : '✗'} <CardChip card={last} size="sm" /></span>}
            </div>
            <CardPicker onPick={add} disabled={entered.length >= 52} />
          </div>
        ) : (
          <div className="stack-v gap-top">
            <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="4C 2H 7D …" spellCheck={false} />
            <small className="muted">{t('parsedCards', { n: seq.length })}</small>
          </div>
        )}
      </Page>
    </>
  );
}
