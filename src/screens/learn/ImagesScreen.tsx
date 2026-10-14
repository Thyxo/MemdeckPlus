/** Billeder & historier for alle 52 kort: automatiske forslag, redigering og hent fotos online. */
import { useRef, useState } from 'react';
import { ImageThumb } from '../../components/CardImageView';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { Bar, Page, Segmented, Sheet, TopBar, confirmDialog } from '../../components/ui';
import { ALL_CARDS, type CardId } from '../../data/cards';
import { IMAGE_SUGGESTIONS } from '../../data/imageSuggestions';
import { useT } from '../../i18n';
import { saveHit, searchImages } from '../../lib/imageSearch';
import { actions, emit, getState } from '../../store/store';
import type { CardImage } from '../../store/types';
import { ImageEditorSheet, suggestionFor } from './ImageEditor';

export function ImagesScreen() {
  const t = useT();
  const { state, stack, order } = useActive();
  const [sort, setSort] = useState<'stack' | 'suit'>('stack');
  const [edit, setEdit] = useState<CardId | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [bulk, setBulk] = useState<{ done: number; total: number; failed: number } | null>(null);
  const cancel = useRef(false);
  const lang = state.settings.lang;
  const list = sort === 'stack' ? order : ALL_CARDS;
  const count = ALL_CARDS.filter((c) => state.images[c]).length;

  const generate = async (overwrite: boolean) => {
    if (overwrite && count && !(await confirmDialog({ title: t('overwriteImagesQ'), body: t('overwriteImagesBody'), danger: true, ok: t('overwrite') }))) return;
    const next: Partial<Record<CardId, CardImage>> = {};
    for (const c of ALL_CARDS) if (overwrite || !state.images[c]) next[c] = suggestionFor(c, lang);
    actions.setImages(next);
    setGenOpen(false);
    emit('toast', 'suggestionsGenerated');
  };

  /** Henter et foto online til hvert kort uden foto (første søgeresultat fra Wikimedia Commons). */
  const fetchAll = async () => {
    if (!navigator.onLine) return emit('toast', 'offlineSearch');
    setGenOpen(false);
    const targets = ALL_CARDS.filter((c) => getState().images[c]?.kind !== 'photo');
    cancel.current = false;
    let failed = 0;
    setBulk({ done: 0, total: targets.length, failed: 0 });
    for (let i = 0; i < targets.length; i++) {
      if (cancel.current) break;
      const c = targets[i];
      const s = IMAGE_SUGGESTIONS[c];
      const existing = getState().images[c];
      try {
        const hits = await searchImages(s.q, 'wikimedia');
        if (!hits.length) throw new Error('none');
        const { photoId, credit } = await saveHit(hits[0]);
        actions.setImage(c, { kind: 'photo', photoId, credit, text: existing?.text || (lang === 'da' ? s.da : s.en), emoji: existing?.emoji ?? s.emoji });
      } catch {
        failed++;
      }
      setBulk({ done: i + 1, total: targets.length, failed });
    }
    setBulk(null);
    emit('toast', failed ? 'bulkPartly' : 'bulkDone');
  };

  return (
    <>
      <TopBar title={t('imagesAndStories')} backTo="/learn" sub={`${count}/52`}
        right={<button className="icon-btn filled" onClick={() => setGenOpen(true)} aria-label={t('generate')}><Icon name="sparkle" /></button>} />
      <Page>
        <p className="muted">{t('imagesIntro')}</p>
        {count === 0 && (
          <div className="card gold-edge stack-v gap-top">
            <b>{t('noImagesTitle')}</b>
            <small className="muted">{t('noImagesText')}</small>
            <button className="btn primary" onClick={() => generate(false)}>✨ {t('generateAll')}</button>
          </div>
        )}
        {bulk && (
          <div className="card stack-v gap-top">
            <div className="spread"><b>{t('fetchingPhotos', { n: bulk.done, m: bulk.total })}</b><button className="btn sm" onClick={() => { cancel.current = true; }}>{t('cancel')}</button></div>
            <Bar value={(bulk.done / Math.max(1, bulk.total)) * 100} />
            {bulk.failed > 0 && <small className="bad">{t('failedN', { n: bulk.failed })}</small>}
          </div>
        )}
        <div className="gap-top">
          <Segmented value={sort} onChange={setSort} options={[{ value: 'stack', label: t('sortStack') }, { value: 'suit', label: t('sortSuit') }]} />
        </div>
        <div className="navlist gap-top">
          {list.map((c) => {
            const pos = order.indexOf(c) + 1;
            const img = state.images[c];
            const story = state.stories[stack.id]?.[pos];
            return (
              <button key={c} className="navrow" onClick={() => setEdit(c)}>
                <span style={{ width: 30, textAlign: 'right', fontWeight: 800 }} className="gold mono">{pos}</span>
                <CardChip card={c} />
                <ImageThumb img={img} />
                <span className="navrow-text">
                  <b>{img?.text || <span className="muted">{t('noImageYet')}</span>}</b>
                  {story ? <small>→ {story}</small> : img?.credit ? <small style={{ fontSize: '.68rem' }}>{img.credit}</small> : null}
                </span>
                <Icon name="edit" className="muted" size={18} />
              </button>
            );
          })}
        </div>
      </Page>
      <ImageEditorSheet card={edit} onClose={() => setEdit(null)} />
      <Sheet open={genOpen} onClose={() => setGenOpen(false)} title={t('generate')}>
        <div className="navlist">
          <button className="navrow" onClick={() => generate(false)}><span className="navrow-icon">✨</span><span className="navrow-text"><b>{t('fillMissing')}</b><small>{t('fillMissingDesc')}</small></span></button>
          <button className="navrow" onClick={() => generate(true)}><span className="navrow-icon">♻️</span><span className="navrow-text"><b>{t('overwriteAll')}</b><small>{t('overwriteAllDesc')}</small></span></button>
          <button className="navrow" onClick={fetchAll} disabled={!!bulk}><span className="navrow-icon">🌐</span><span className="navrow-text"><b>{t('fetchPhotosAll')}</b><small>{t('fetchPhotosAllDesc')}</small></span></button>
        </div>
      </Sheet>
    </>
  );
}
