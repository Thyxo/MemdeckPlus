/**
 * "Weighing the cards": find antallet af afløftede kort ud fra ét glimt.
 * Kender man topkortet før cuttet og ser bundkortet af den afløftede bunke
 * (eller det nye topkort på resten), er antallet differensen i stakken.
 */
import { useState } from 'react';
import { CardPicker } from '../../components/CardPicker';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { Page, Segmented, TopBar } from '../../components/ui';
import type { CardId } from '../../data/cards';
import { useT } from '../../i18n';

const mod52 = (n: number) => ((n % 52) + 52) % 52;

export function CountCards() {
  const t = useT();
  const { order, posOf } = useActive();
  const [top, setTop] = useState<CardId>(order[0]);
  const [seen, setSeen] = useState<CardId | null>(null);
  const [kind, setKind] = useState<'bottomOfPacket' | 'topOfRest'>('bottomOfPacket');
  const [picking, setPicking] = useState<'top' | 'seen'>('seen');

  const count = seen ? mod52((posOf.get(seen) ?? 0) - (posOf.get(top) ?? 0)) + (kind === 'bottomOfPacket' ? 1 : 0) : null;

  return (
    <>
      <TopBar title={t('countCards')} backTo="/tools" />
      <Page>
        <p className="muted">{t('countIntro')}</p>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'bottomOfPacket', label: t('glimpseBottom') }, { value: 'topOfRest', label: t('glimpseTop') }]} />
        <div className="grid-2 gap-top">
          <button className={`choice ${picking === 'top' ? 'on' : ''}`} onClick={() => setPicking('top')} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <small className="muted">{t('topBeforeCut')}</small>
            <CardChip card={top} size="lg" />
          </button>
          <button className={`choice ${picking === 'seen' ? 'on' : ''}`} onClick={() => setPicking('seen')} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <small className="muted">{kind === 'bottomOfPacket' ? t('glimpseBottom') : t('glimpseTop')}</small>
            <CardChip card={seen} size="lg" />
          </button>
        </div>
        <div className="card center gap-top">
          <small className="muted">{t('cardsInPacket')}</small>
          <div className="quiz-big">{count ?? '–'}</div>
          {count !== null && <small className="muted">{t('restHas', { n: 52 - count })}</small>}
        </div>
        <div className="gap-top"><CardPicker onPick={(c) => { if (picking === 'top') { setTop(c); setPicking('seen'); } else setSeen(c); }} /></div>
      </Page>
    </>
  );
}
