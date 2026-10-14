/** Mønster-hjælp: automatisk fundne mønstre + egne noter om områder af stakken. */
import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { EmptyState, Page, Segmented, Sheet, TopBar } from '../../components/ui';
import { rankLabel, type Rank } from '../../data/cards';
import { uid } from '../../data/stacks';
import { tk, useT } from '../../i18n';
import { type PatternKind, findPatterns } from '../../lib/patterns';
import { actions } from '../../store/store';
import type { PatternNote } from '../../store/types';

const KINDS: PatternKind[] = ['valuePos', 'pair', 'suitRun', 'step', 'mirror', 'colorRun', 'fours'];

export function Patterns() {
  const t = useT();
  const { state, stack, order, complete } = useActive();
  const [tab, setTab] = useState<'auto' | 'mine'>('auto');
  const [note, setNote] = useState<PatternNote | null>(null);
  const patterns = useMemo(() => (complete ? findPatterns(order) : []), [order, complete]);
  const notes = state.patternNotes[stack.id] ?? [];
  const lang = state.settings.danishRanks ? 'da' : 'en';

  return (
    <>
      <TopBar title={t('patterns')} backTo="/learn" sub={stack.name} />
      <Page>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'auto', label: t('autoFound') }, { value: 'mine', label: t('myNotes', { n: notes.length }) }]} />
        {tab === 'auto' ? (
          !complete ? <EmptyState title={t('stackIncompleteTitle')} /> : (
            <div className="stack-v gap-top">
              {KINDS.map((k) => {
                const list = patterns.filter((p) => p.kind === k);
                if (!list.length) return null;
                return (
                  <section key={k}>
                    <div className="section-title" style={{ marginTop: 8 }}>{tk(t, `pat.${k}`)} · {list.length}</div>
                    <p className="muted" style={{ fontSize: '.85rem', marginTop: 0 }}>{tk(t, `patDesc.${k}`)}</p>
                    <div className="stack-v" style={{ gap: 8 }}>
                      {list.map((p, i) => (
                        <div key={i} className="pattern-item">
                          <div className="spread">
                            <b className="mono">
                              {k === 'fours' ? `${rankLabel(p.info as Rank, lang)}: ` : ''}
                              #{p.positions.join(k === 'suitRun' || k === 'step' || k === 'colorRun' ? '–' : ', #').replace(/–.*–/, '–')}
                            </b>
                            {p.info && k === 'step' && <span className="pill gold">{p.info}</span>}
                            {k === 'valuePos' && <span className="pill">{p.info === '=' ? t('exact') : t('mod13')}</span>}
                          </div>
                          <div className="chip-row">
                            {p.positions.map((pos) => <CardChip key={pos} card={order[pos - 1]} size="sm" />)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )
        ) : (
          <div className="stack-v gap-top">
            <p className="muted" style={{ fontSize: '.88rem' }}>{t('notesIntro')}</p>
            {notes.length === 0 && <EmptyState icon="pattern" title={t('noNotes')} text={t('noNotesText')} />}
            {[...notes].sort((a, b) => a.from - b.from).map((n) => (
              <button key={n.id} className="pattern-item" style={{ textAlign: 'left', color: 'inherit', width: '100%' }} onClick={() => setNote(n)}>
                <div className="spread"><b className="mono">#{n.from}–{n.to}</b><Icon name="edit" size={16} className="muted" /></div>
                <div>{n.text}</div>
                <div className="chip-row">{order.slice(n.from - 1, n.to).map((c) => <CardChip key={c} card={c} size="sm" />)}</div>
              </button>
            ))}
            <button className="btn primary" onClick={() => setNote({ id: uid('note'), from: 1, to: 4, text: '' })}><Icon name="plus" size={18} /> {t('addNote')}</button>
          </div>
        )}
      </Page>
      <NoteSheet note={note} onClose={() => setNote(null)} stackId={stack.id} order={order} />
    </>
  );
}

function NoteSheet({ note, onClose, stackId, order }: { note: PatternNote | null; onClose: () => void; stackId: string; order: ReturnType<typeof useActive>['order'] }) {
  const t = useT();
  const [d, setD] = useState<PatternNote | null>(null);
  if (note && (!d || d.id !== note.id)) setD(note);
  if (!note || !d) return null;
  const from = Math.max(1, Math.min(52, d.from));
  const to = Math.max(from, Math.min(52, d.to));
  return (
    <Sheet open onClose={onClose} title={t('patternNote')} footer={<>
      <button className="btn ghost" onClick={() => { actions.deletePatternNote(stackId, note.id); onClose(); }}><Icon name="trash" size={18} /> {t('delete')}</button>
      <button className="btn primary" disabled={!d.text.trim()} onClick={() => { actions.savePatternNote(stackId, { ...d, from, to, text: d.text.trim() }); onClose(); }}>{t('save')}</button>
    </>}>
      <div className="stack-v">
        <div className="grid-2">
          <label className="field">{t('fromPos')}<input className="input" type="number" min={1} max={52} value={d.from} onChange={(e) => setD({ ...d, from: Number(e.target.value) })} /></label>
          <label className="field">{t('toPos')}<input className="input" type="number" min={1} max={52} value={d.to} onChange={(e) => setD({ ...d, to: Number(e.target.value) })} /></label>
        </div>
        <div className="chip-row">{order.slice(from - 1, to).map((c) => <CardChip key={c} card={c} size="md" />)}</div>
        <label className="field">{t('explanation')}<textarea className="input" style={{ fontFamily: 'inherit', minHeight: 90 }} value={d.text} onChange={(e) => setD({ ...d, text: e.target.value })} placeholder={t('notePlaceholder')} /></label>
      </div>
    </Sheet>
  );
}
