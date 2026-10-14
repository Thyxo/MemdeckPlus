/** Viser kortets tildelte billede (emoji, tekst eller foto fra IndexedDB). */
import { useEffect, useState } from 'react';
import type { CardId } from '../data/cards';
import { getPhoto } from '../lib/idb';
import { useApp } from '../store/store';
import type { CardImage } from '../store/types';

export function usePhotoUrl(photoId?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!photoId) { setUrl(null); return; }
    getPhoto(photoId).then((p) => alive && setUrl(p?.dataUrl ?? null)).catch(() => setUrl(null));
    return () => { alive = false; };
  }, [photoId]);
  return url;
}

export function ImageThumb({ img, size }: { img?: CardImage; size?: 'lg' }) {
  const url = usePhotoUrl(img?.kind === 'photo' ? img.photoId : undefined);
  return (
    <span className={`card-img ${size ?? ''}`} aria-hidden="true">
      {img?.kind === 'photo' && url ? <img src={url} alt="" /> : img?.emoji ?? (img?.text ? img.text.slice(0, 1).toUpperCase() : '·')}
    </span>
  );
}

export function CardImageView({ card, size }: { card: CardId; size?: 'lg' }) {
  const { images } = useApp();
  return <ImageThumb img={images[card]} size={size} />;
}
