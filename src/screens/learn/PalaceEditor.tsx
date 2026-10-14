/** Rediger en memory palace-rute: stop, rækkefølge, kort pr. stop, og visuel rute-oversigt. */
import { useState } from 'react';
import { ImageThumb } from '../../components/CardImageView';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { EmptyState, Page, Segmented, Sheet, TopBar, confirmDialog, promptDialog } from '../../components/ui';
import { uid } from '../../data/stacks';
import { useT } from '../../i18n';
import { navigate } from '../../lib/router';
import { actions } from '../../store/store';
import type { Palace, PalaceStop } from '../../store/types';

export function PalaceEditor({ id }: { id: string }) {
  const t = useT();
  const { state, order } = useActive();
  const palace = state.palaces.find((p) => p.id === id);
  const [editStop, setEditStop] = useState<PalaceStop | null>(null);
  const [mode, setMode] = useState<'route' | 'edit'>('route');

  if (!palace) return (<><TopBar title={t('memoryPalace')} backTo="/learn/palace" /><Page><EmptyState icon="map" title={t('palaceNotFound')} /></Page></>);

  const save = (p: Palace) => actions.savePalace(p);
  const needed = Math.ceil((53 - palace.startPos) / palace.perStop);
  const move = (i: number, d: number) => {
    const stops = [...palace.stops];
    const j = i + d;
    if (j < 0 || j >= stops.length) return;
    [stops[i], stops[j]] = [stops[j], stops[i]];
    save({ ...palace, stops });
  };
  const addStop = () => {
    const s: PalaceStop = { id: uid('stop'), emoji: '📍', name: t('stopN', { n: palace.stops.length + 1 }) };
    save({ ...palace, stops: [...palace.stops, s] });
    setEditStop(s);
  };

  return (
    <>
      <TopBar title={palace.name} backTo="/learn/palace" right={
        <button className="icon-btn" aria-label={t('rename')} onClick={async () => {
          const n = await promptDialog({ title: t('rename'), value: palace.name });
          if (n) save({ ...palace, name: n });
        }}><Icon name="edit" /></button>} />
      <Page>
        <div className="card flat stack-v">
          <div className="spread"><span>{t('cardsPerStop')}</span>
            <Segmented value={palace.perStop} onChange={(v) => save({ ...palace, perStop: v })} options={[{ value: 3, label: '3' }, { value: 4, label: '4' }]} />
          </div>
          <small className={palace.stops.length >= needed ? 'ok' : 'bad'}>
            {palace.stops.length >= needed ? t('routeCovers', { n: 52 }) : t('routeMissing', { n: needed - palace.stops.length, m: needed })}
          </small>
        </div>

        <div className="gap-top"><Segmented value={mode} onChange={setMode} options={[{ value: 'route', label: t('routeView') }, { value: 'edit', label: t('editStops') }]} /></div>

        {mode === 'route' ? (
          <div className="route gap-top">
            {palace.stops.map((s, i) => {
              const from = palace.startPos + i * palace.perStop;
              const cards = Array.from({ length: palace.perStop }, (_, k) => from + k).filter((p) => p <= 52);
              if (!cards.length) return null;
              return (
                <div key={s.id} className="route-stop card" style={{ padding: 12 }}>
                  <div className="spread">
                    <b>{s.emoji} {s.name}</b>
                    <span className="pill">#{cards[0]}–{cards[cards.length - 1]}</span>
                  </div>
                  {s.note && <small className="muted">{s.note}</small>}
                  <div className="stack-h" style={{ marginTop: 8, gap: 8 }}>
                    {cards.map((p) => {
                      const c = order[p - 1];
                      return (
                        <span key={p} className="stack-v" style={{ gap: 4, alignItems: 'center' }}>
                          <ImageThumb img={state.images[c]} />
                          <CardChip card={c} size="sm" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {palace.stops.length < needed && (
              <div className="route-stop card flat" style={{ padding: 12, borderStyle: 'dashed' }}>
                <small className="muted">{t('routeMissing', { n: needed - palace.stops.length, m: needed })}</small>
                <button className="btn sm outline gap-top" onClick={addStop}><Icon name="plus" size={16} /> {t('addStop')}</button>
              </div>
            )}
          </div>
        ) : (
          <div className="slot-list gap-top">
            {palace.stops.map((s, i) => (
              <div key={s.id} className="slot">
                <span className="slot-pos">{i + 1}</span>
                <button className="slot-card" onClick={() => setEditStop(s)}>
                  <span style={{ fontSize: '1.4rem' }}>{s.emoji}</span>
                  <span>{s.name}</span>
                </button>
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('moveUp')}>↑</button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === palace.stops.length - 1} aria-label={t('moveDown')}>↓</button>
              </div>
            ))}
            <button className="btn outline" onClick={addStop}><Icon name="plus" size={18} /> {t('addStop')}</button>
          </div>
        )}

        <button className="btn ghost block gap-top bad" onClick={async () => {
          if (await confirmDialog({ title: t('deleteRouteQ'), danger: true, ok: t('delete') })) { actions.deletePalace(palace.id); navigate('/learn/palace', true); }
        }}><Icon name="trash" size={18} /> {t('deleteRoute')}</button>
      </Page>

      <StopSheet stop={editStop} onClose={() => setEditStop(null)}
        onSave={(s) => { save({ ...palace, stops: palace.stops.map((x) => (x.id === s.id ? s : x)) }); setEditStop(null); }}
        onDelete={(s) => { save({ ...palace, stops: palace.stops.filter((x) => x.id !== s.id) }); setEditStop(null); }} />
    </>
  );
}

function StopSheet({ stop, onClose, onSave, onDelete }: { stop: PalaceStop | null; onClose: () => void; onSave: (s: PalaceStop) => void; onDelete: (s: PalaceStop) => void }) {
  const t = useT();
  const [d, setD] = useState<PalaceStop | null>(null);
  if (stop && (!d || d.id !== stop.id)) setD(stop);
  if (!stop || !d) return null;
  return (
    <Sheet open onClose={onClose} title={t('editStop')} footer={<>
      <button className="btn ghost" onClick={() => onDelete(stop)}><Icon name="trash" size={18} /> {t('delete')}</button>
      <button className="btn primary" onClick={() => onSave({ ...d, name: d.name.trim() || stop.name })}>{t('save')}</button>
    </>}>
      <div className="stack-v">
        <label className="field">{t('stopName')}<input className="input" value={d.name} maxLength={60} onChange={(e) => setD({ ...d, name: e.target.value })} /></label>
        <label className="field">Emoji<input className="input" value={d.emoji} maxLength={8} onChange={(e) => setD({ ...d, emoji: e.target.value })} style={{ fontSize: '1.4rem' }} /></label>
        <label className="field">{t('noteOptional')}<textarea className="input" style={{ fontFamily: 'inherit', minHeight: 70 }} value={d.note ?? ''} onChange={(e) => setD({ ...d, note: e.target.value })} placeholder={t('stopNotePlaceholder')} /></label>
      </div>
    </Sheet>
  );
}
