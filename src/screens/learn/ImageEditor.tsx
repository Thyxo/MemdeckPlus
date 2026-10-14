/**
 * Billed-tildeling for ét kort: emoji / person / genstand / tekst / foto.
 * Foto kan tages med kameraet, vælges fra enheden eller hentes online (Wikimedia Commons / Openverse).
 */
import { useEffect, useRef, useState } from 'react';
import { ImageThumb, usePhotoUrl } from '../../components/CardImageView';
import { Icon } from '../../components/Icon';
import { PlayingCard } from '../../components/PlayingCard';
import { Segmented, Sheet, Skeleton } from '../../components/ui';
import { type CardId, cardName } from '../../data/cards';
import { IMAGE_SUGGESTIONS } from '../../data/imageSuggestions';
import { useT } from '../../i18n';
import { deletePhoto } from '../../lib/idb';
import { type ImageHit, type Provider, saveFile, saveHit, searchImages } from '../../lib/imageSearch';
import { actions, emit, getState, useApp } from '../../store/store';
import type { CardImage, ImageKind } from '../../store/types';

export function suggestionFor(card: CardId, lang: 'da' | 'en'): CardImage {
  const s = IMAGE_SUGGESTIONS[card];
  return { kind: 'emoji', emoji: s.emoji, text: lang === 'da' ? s.da : s.en };
}

/** Slet et foto fra IndexedDB, hvis intet kort længere bruger det. */
export function releasePhoto(photoId?: string) {
  if (!photoId) return;
  const used = Object.values(getState().images).some((i) => i?.photoId === photoId);
  if (!used) deletePhoto(photoId).catch(() => undefined);
}

export function ImageEditorSheet({ card, onClose }: { card: CardId | null; onClose: () => void }) {
  const t = useT();
  const state = useApp();
  const lang = state.settings.lang;
  const [draft, setDraft] = useState<CardImage>({ kind: 'emoji', text: '' });
  const [q, setQ] = useState('');
  const [provider, setProvider] = useState<Provider>('wikimedia');
  const [hits, setHits] = useState<ImageHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const photoUrl = usePhotoUrl(draft.kind === 'photo' ? draft.photoId : undefined);

  useEffect(() => {
    if (!card) return;
    setDraft(state.images[card] ?? { kind: 'emoji', text: '', emoji: '' });
    setQ(IMAGE_SUGGESTIONS[card].q);
    setHits(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  if (!card) return null;
  const sugg = suggestionFor(card, lang);

  const search = async () => {
    if (!q.trim()) return;
    if (!navigator.onLine) { setError(t('offlineSearch')); return; }
    abort.current?.abort();
    abort.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const res = await searchImages(q.trim(), provider, abort.current.signal);
      setHits(res);
      if (!res.length) setError(t('noResults'));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(t('searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const pickHit = async (h: ImageHit) => {
    setSaving(h.id);
    try {
      const { photoId, credit } = await saveHit(h);
      setDraft((d) => ({ ...d, kind: 'photo', photoId, credit, text: d.text || q }));
    } catch {
      setError(t('downloadFailed'));
    } finally {
      setSaving(null);
    }
  };

  const pickFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const photoId = await saveFile(file);
      setDraft((d) => ({ ...d, kind: 'photo', photoId, credit: undefined }));
    } catch {
      setError(t('downloadFailed'));
    }
  };

  const save = () => {
    const prev = state.images[card];
    const clean: CardImage = { ...draft, text: draft.text.trim() };
    if (!clean.text && !clean.emoji && !clean.photoId) { actions.setImage(card, null); }
    else actions.setImage(card, clean);
    if (prev?.photoId && prev.photoId !== clean.photoId) releasePhoto(prev.photoId);
    emit('toast', 'saved');
    onClose();
  };

  const kinds: { value: ImageKind; label: string }[] = [
    { value: 'emoji', label: '😀' }, { value: 'person', label: t('kindPerson') }, { value: 'object', label: t('kindObject') },
    { value: 'text', label: t('kindText') }, { value: 'photo', label: t('kindPhoto') },
  ];

  return (
    <Sheet open={!!card} onClose={onClose} title={cardName(card, lang)}
      footer={<>
        {state.images[card] && <button className="btn ghost" onClick={() => { const p = state.images[card]?.photoId; actions.setImage(card, null); releasePhoto(p); onClose(); }}><Icon name="trash" size={18} /> {t('remove')}</button>}
        <button className="btn primary" onClick={save}>{t('save')}</button>
      </>}>
      <div className="stack-v">
        <div className="stack-h" style={{ flexWrap: 'nowrap' }}>
          <PlayingCard card={card} width={70} />
          {draft.kind === 'photo' && photoUrl ? <span className="card-img lg"><img src={photoUrl} alt="" /></span> : <ImageThumb img={draft} size="lg" />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{draft.text || '—'}</b>
            {draft.kind === 'photo' && draft.credit && <small className="muted" style={{ display: 'block', fontSize: '.7rem' }}>{draft.credit}</small>}
          </div>
        </div>

        <button className="btn outline" onClick={() => setDraft({ ...draft, ...sugg, kind: draft.kind === 'photo' ? 'photo' : 'emoji', photoId: draft.kind === 'photo' ? draft.photoId : undefined })}>
          ✨ {t('useSuggestion')}: {sugg.emoji} {sugg.text}
        </button>

        <Segmented value={draft.kind} onChange={(k) => setDraft({ ...draft, kind: k })} options={kinds} />

        <label className="field">{draft.kind === 'person' ? t('whoIsIt') : draft.kind === 'object' ? t('whatIsIt') : t('imageText')}
          <input className="input" value={draft.text} maxLength={80} onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder={draft.kind === 'person' ? t('personPlaceholder') : sugg.text} />
        </label>

        {draft.kind !== 'photo' && draft.kind !== 'text' && (
          <label className="field">{t('emojiOptional')}
            <input className="input" value={draft.emoji ?? ''} maxLength={8} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} placeholder={sugg.emoji} style={{ fontSize: '1.4rem' }} />
          </label>
        )}

        {draft.kind === 'photo' && (
          <div className="stack-v">
            <div className="btn-row">
              <label className="btn">
                <Icon name="camera" size={18} /> {t('takeOrChoose')}
                <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
            </div>
            <div className="section-title" style={{ margin: '8px 0 0' }}>{t('searchOnline')}</div>
            <form className="stack-h" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); search(); }}>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} />
              <button className="btn primary" type="submit" aria-label={t('search')}><Icon name="search" size={20} /></button>
            </form>
            <Segmented value={provider} onChange={(p) => { setProvider(p); setHits(null); }} options={[
              { value: 'wikimedia', label: 'Wikimedia Commons' }, { value: 'openverse', label: 'Openverse' },
            ]} />
            {error && <small className="bad">{error}</small>}
            {loading && <div className="img-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={100} r={12} />)}</div>}
            {!loading && hits && hits.length > 0 && (
              <div className="img-grid">
                {hits.map((h) => (
                  <button key={h.id} onClick={() => pickHit(h)} title={[h.title, h.creator, h.license].filter(Boolean).join(' · ')}
                    className={saving === h.id ? 'on' : ''} disabled={!!saving}>
                    <img src={h.thumb} alt={h.title} loading="lazy" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
            <small className="muted" style={{ fontSize: '.75rem' }}>{t('licenseNote')}</small>
          </div>
        )}
      </div>
    </Sheet>
  );
}
