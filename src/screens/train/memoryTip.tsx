/** Hukommelsestip til feedback: kortets billede, historie og memory-palace-stop. */
import { ImageThumb } from '../../components/CardImageView';
import type { CardId } from '../../data/cards';
import { useT } from '../../i18n';
import { useApp } from '../../store/store';
import type { AppState } from '../../store/types';

export function palaceStopFor(state: AppState, stackId: string, pos: number) {
  for (const p of state.palaces.filter((x) => x.stackId === stackId)) {
    const rel = pos - p.startPos;
    if (rel < 0) continue;
    const stop = p.stops[Math.floor(rel / p.perStop)];
    if (stop) return { palace: p, stop };
  }
  return null;
}

export function MemoryTip({ card, pos, stackId }: { card: CardId; pos: number; stackId: string }) {
  const t = useT();
  const state = useApp();
  const img = state.images[card];
  const story = state.stories[stackId]?.[pos - 1] ?? state.stories[stackId]?.[pos];
  const ps = palaceStopFor(state, stackId, pos);
  if (!img && !story && !ps) return <small className="muted">{t('tipNone')}</small>;
  return (
    <div className="stack-h" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
      {img && <ImageThumb img={img} />}
      <div style={{ fontSize: '.88rem' }}>
        {img && <div><b>{img.text}</b></div>}
        {ps && <div className="muted">🏛️ {ps.stop.emoji} {ps.stop.name} <small>({ps.palace.name})</small></div>}
        {story && <div className="muted">“{story}”</div>}
      </div>
    </div>
  );
}
