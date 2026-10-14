/**
 * Stack-editor: manuel indtastning (kortvælger pr. position), træk-og-slip-sortering,
 * tekstimport/-eksport, gitter-visning og løbende validering (52 unikke kort).
 */
import { type PointerEvent as RPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { Icon } from '../../components/Icon';
import { CardChip, PlayingCard } from '../../components/PlayingCard';
import { EmptyState, Page, Segmented, Sheet, TopBar, confirmDialog, promptDialog } from '../../components/ui';
import { type CardId, cardName, formatOrder, parseCardList, validateOrder } from '../../data/cards';
import type { Stack } from '../../data/stacks';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';
import { copyText } from '../../lib/files';
import { navigate } from '../../lib/router';
import { actions, emit, useApp } from '../../store/store';
import { exportStack } from './stackIO';

type View = 'list' | 'text' | 'grid';

export function StackEditor({ id }: { id: string }) {
  const t = useT();
  const state = useApp();
  const stack = state.stacks.find((s) => s.id === id);
  const [view, setView] = useState<View>('list');

  if (!stack) {
    return (
      <>
        <TopBar title={t('tabLibrary')} backTo="/library" />
        <Page><EmptyState icon="library" title={t('stackNotFound')} action={<button className="btn primary" onClick={() => navigate('/library')}>{t('backToLibrary')}</button>} /></Page>
      </>
    );
  }

  const locked = !!stack.builtIn;
  const v = validateOrder(stack.order);
  const setOrder = (order: (CardId | null)[]) => actions.saveStack({ ...stack, order });

  return (
    <>
      <TopBar
        title={stack.name}
        sub={stack.author}
        backTo="/library"
        right={<button className="icon-btn" onClick={() => exportStack(stack)} aria-label={t('exportJson')}><Icon name="download" /></button>}
      />
      <Page>
        {locked && (
          <div className="card flat gold-edge stack-v" style={{ marginBottom: 12 }}>
            <div>🔒 <b>{t('lockedTitle')}</b></div>
            <small>{t('lockedText')}</small>
            <button className="btn outline" onClick={async () => {
              const n = await promptDialog({ title: t('duplicateAs'), value: `${stack.name} (${t('copy')})` });
              if (n) navigate(`/library/${actions.duplicateStack(stack.id, n)}`, true);
            }}><Icon name="copy" /> {t('duplicateToEdit')}</button>
          </div>
        )}

        {!locked && (
          <div className="stack-h" style={{ marginBottom: 12 }}>
            <button className="btn sm" onClick={async () => {
              const n = await promptDialog({ title: t('rename'), value: stack.name });
              if (n) actions.renameStack(stack.id, n);
            }}><Icon name="edit" size={18} /> {t('rename')}</button>
            <span className="muted" style={{ fontSize: '.8rem' }}>{t('autoSaved')}</span>
          </div>
        )}

        <ValidationBox v={v} />

        {v.ok && state.activeStackId !== stack.id && (
          <button className="btn green block gap-top" onClick={() => { actions.setActiveStack(stack.id); emit('toast', 'stackActivated'); }}>
            ★ {t('useStack')}
          </button>
        )}

        <div className="gap-top">
          <Segmented value={view} onChange={setView} options={[
            { value: 'list', label: t('viewList') },
            { value: 'grid', label: t('viewGrid') },
            { value: 'text', label: t('viewText') },
          ]} />
        </div>

        <div className="gap-top">
          {view === 'list' && <SortableSlots stack={stack} locked={locked} onChange={setOrder} dupes={new Set(v.duplicates.map((d) => d.card))} />}
          {view === 'grid' && <GridView order={stack.order} />}
          {view === 'text' && <TextView stack={stack} locked={locked} onApply={setOrder} />}
        </div>
      </Page>
    </>
  );
}

function ValidationBox({ v }: { v: ReturnType<typeof validateOrder> }) {
  const t = useT();
  if (v.ok) return <div className="validation okv">✓ <b>{t('validOk')}</b></div>;
  return (
    <div className="validation badv">
      <b>{t('validFilled', { n: v.filled })}</b>
      {v.duplicates.length > 0 && (
        <div className="gap-top" style={{ marginTop: 8 }}>
          <small>{t('duplicates')}:</small>
          <div className="chip-row">
            {v.duplicates.map((d) => <span key={d.card} className="stack-h" style={{ gap: 4 }}><CardChip card={d.card} size="sm" /><small>#{d.positions.join(', #')}</small></span>)}
          </div>
        </div>
      )}
      {v.missing.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <small>{t('missingCards', { n: v.missing.length })}:</small>
          <div className="chip-row">{v.missing.map((c) => <CardChip key={c} card={c} size="sm" />)}</div>
        </div>
      )}
      {v.empty.length > 0 && v.empty.length < 52 && (
        <div style={{ marginTop: 8 }}><small>{t('emptyPositions')}: {compactRanges(v.empty)}</small></div>
      )}
    </div>
  );
}

/** [1,2,3,7,9,10] → "1–3, 7, 9–10" */
export function compactRanges(nums: number[]): string {
  const out: string[] = [];
  let start = nums[0];
  let prev = nums[0];
  for (let i = 1; i <= nums.length; i++) {
    const n = nums[i];
    if (n === prev + 1) { prev = n; continue; }
    out.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  return out.join(', ');
}

function SortableSlots({ stack, locked, onChange, dupes }: { stack: Stack; locked: boolean; onChange: (o: (CardId | null)[]) => void; dupes: Set<CardId> }) {
  const t = useT();
  const { settings } = useApp();
  const [order, setOrder] = useState(stack.order);
  const [drag, setDrag] = useState<{ idx: number; startY: number; dy: number } | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const rowH = useRef(58);

  useEffect(() => { if (!drag) setOrder(stack.order); }, [stack.order, drag]);

  const used = useMemo(() => new Set(order.filter(Boolean) as CardId[]), [order]);

  const onDown = (e: RPointerEvent, idx: number) => {
    if (locked) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const first = listRef.current?.firstElementChild as HTMLElement | null;
    if (first) rowH.current = first.offsetHeight + 6;
    sfx.tap();
    setDrag({ idx, startY: e.pageY, dy: 0 });
  };
  const onMove = (e: RPointerEvent) => {
    if (!drag) return;
    // Auto-scroll nær kanten
    if (e.clientY < 90) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 90) window.scrollBy(0, 14);
    const pageY = e.clientY + window.scrollY;
    let dy = pageY - drag.startY;
    let idx = drag.idx;
    let startY = drag.startY;
    const target = Math.max(0, Math.min(51, idx + Math.round(dy / rowH.current)));
    if (target !== idx) {
      const next = [...order];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      setOrder(next);
      startY += (target - idx) * rowH.current;
      dy = pageY - startY;
      idx = target;
      sfx.tap();
    }
    setDrag({ idx, startY, dy });
  };
  const onUp = () => {
    if (!drag) return;
    setDrag(null);
    onChange(order);
  };

  const setCard = (pos: number, c: CardId | null) => {
    const next = [...order];
    next[pos] = c;
    setOrder(next);
    onChange(next);
  };

  return (
    <>
      {!locked && <p className="muted" style={{ fontSize: '.85rem' }}>{t('dragHelp')}</p>}
      <div className="slot-list" ref={listRef}>
        {order.map((c, i) => {
          const dragging = drag?.idx === i;
          return (
            <div key={i} className={`slot ${dragging ? 'dragging' : ''} ${c && dupes.has(c) ? 'dup' : ''}`}
              style={dragging ? { transform: `translateY(${drag!.dy}px) scale(1.02)` } : undefined}>
              <span className="slot-pos">{i + 1}</span>
              <button className="slot-card" onClick={() => !locked && setEdit(i)}
                aria-label={`${t('position')} ${i + 1}: ${c ? cardName(c, settings.lang) : t('empty')}`}>
                <CardChip card={c} size="md" />
                <span className="muted" style={{ fontSize: '.85rem' }}>{c ? cardName(c, settings.lang) : t('tapToChoose')}</span>
              </button>
              {!locked && (
                <button className="drag-handle" aria-label={t('dragToMove')}
                  onPointerDown={(e) => onDown(e, i)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
                  <Icon name="drag" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={edit !== null} onClose={() => setEdit(null)} title={edit !== null ? `${t('position')} ${edit + 1}` : ''}>
        {edit !== null && (
          <div className="stack-v">
            <div className="center"><PlayingCard card={order[edit]} faceDown={!order[edit]} width={90} /></div>
            <small className="muted center">{t('pickCardForPos')}</small>
            <CardPicker onPick={(c) => { setCard(edit, c); setEdit(edit < 51 ? edit + 1 : null); }} disabledCards={new Set([...used].filter((x) => x !== order[edit]))} />
            <div className="btn-row">
              <button className="btn" disabled={!order[edit]} onClick={() => { setCard(edit, null); }}>{t('clearSlot')}</button>
              <button className="btn" disabled={edit === 0} onClick={() => setEdit(edit - 1)}>‹ {edit}</button>
              <button className="btn" disabled={edit === 51} onClick={() => setEdit(edit + 1)}>{edit + 2} ›</button>
            </div>
            <form className="stack-h" onSubmit={(e) => {
              e.preventDefault();
              const to = Number(moveTo) - 1;
              if (to >= 0 && to < 52 && to !== edit) {
                const next = [...order];
                const [item] = next.splice(edit, 1);
                next.splice(to, 0, item);
                setOrder(next); onChange(next); setEdit(to); setMoveTo('');
              }
            }}>
              <input className="input" style={{ flex: 1 }} inputMode="numeric" placeholder={t('moveToPos')} value={moveTo} onChange={(e) => setMoveTo(e.target.value.replace(/\D/g, '').slice(0, 2))} />
              <button className="btn" type="submit" disabled={!moveTo}>{t('move')}</button>
            </form>
          </div>
        )}
      </Sheet>
    </>
  );
}

function GridView({ order }: { order: (CardId | null)[] }) {
  return (
    <div className="deck-grid">
      {order.map((c, i) => (
        <div key={i} className="cell">
          <span className="pos">{i + 1}</span>
          <PlayingCard card={c} faceDown={!c} width="100%" />
        </div>
      ))}
    </div>
  );
}

function TextView({ stack, locked, onApply }: { stack: Stack; locked: boolean; onApply: (o: (CardId | null)[]) => void }) {
  const t = useT();
  const [text, setText] = useState(formatOrder(stack.order));
  const parsed = parseCardList(text.replace(/--/g, ''));
  return (
    <div className="stack-v">
      <p className="muted" style={{ fontSize: '.85rem' }}>{t('textHelp')}</p>
      <textarea className="input" style={{ minHeight: 200 }} value={text} readOnly={locked} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      <small className={parsed.cards.length === 52 ? 'ok' : 'muted'}>
        {t('parsedCards', { n: parsed.cards.length })}
        {parsed.invalid.length > 0 && <span className="bad"> · {t('invalidTokens')}: {parsed.invalid.slice(0, 8).join(', ')}</span>}
      </small>
      <div className="btn-row">
        <button className="btn" onClick={async () => emit('toast', (await copyText(formatOrder(stack.order))) ? 'copied' : 'copyFailed')}><Icon name="copy" /> {t('copy')}</button>
        {!locked && (
          <button className="btn primary" disabled={!parsed.cards.length} onClick={async () => {
            if (parsed.cards.length !== 52 && !(await confirmDialog({ title: t('applyPartialQ', { n: parsed.cards.length }) }))) return;
            onApply(Array.from({ length: 52 }, (_, i) => parsed.cards[i] ?? null));
            emit('toast', 'orderApplied');
          }}>{t('apply')}</button>
        )}
      </div>
    </div>
  );
}
