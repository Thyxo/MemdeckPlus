/**
 * Online billedsøgning efter frit licenserede billeder (ingen API-nøgle nødvendig):
 *  - Wikimedia Commons (CC/Public Domain)
 *  - Openverse (WordPress-projektet, CC-licenserede billeder)
 * Valgte billeder skaleres ned og gemmes lokalt i IndexedDB, så de virker offline.
 * Kreditering (fotograf, licens, kilde) gemmes sammen med billedet.
 */
import { blobToScaledDataUrl, putPhoto } from './idb';
import { uid } from '../data/stacks';

export type Provider = 'wikimedia' | 'openverse';

export interface ImageHit {
  id: string;
  thumb: string;
  title: string;
  creator?: string;
  license?: string;
  source: string;
  provider: Provider;
}

const stripHtml = (s?: string) => (s ? s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : undefined);

async function searchWikimedia(q: string, signal?: AbortSignal): Promise<ImageHit[]> {
  const params = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search',
    gsrsearch: `filetype:bitmap ${q}`, gsrnamespace: '6', gsrlimit: '18',
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '320',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  const pages = Object.values<Record<string, unknown>>(j?.query?.pages ?? {});
  pages.sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0));
  return pages
    .map((p): ImageHit | null => {
      const ii = (p.imageinfo as Record<string, unknown>[] | undefined)?.[0] as
        | { thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }
        | undefined;
      if (!ii?.thumburl) return null;
      return {
        id: String(p.pageid),
        thumb: ii.thumburl,
        title: String(p.title ?? '').replace(/^File:/, '').replace(/\.\w+$/, ''),
        creator: stripHtml(ii.extmetadata?.Artist?.value),
        license: stripHtml(ii.extmetadata?.LicenseShortName?.value),
        source: ii.descriptionurl ?? 'https://commons.wikimedia.org',
        provider: 'wikimedia',
      };
    })
    .filter((x): x is ImageHit => !!x);
}

async function searchOpenverse(q: string, signal?: AbortSignal): Promise<ImageHit[]> {
  const params = new URLSearchParams({ q, page_size: '18', mature: 'false' });
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return (j?.results ?? []).map((r: Record<string, string>) => ({
    id: r.id,
    thumb: r.thumbnail || `https://api.openverse.org/v1/images/${r.id}/thumb/`,
    title: r.title,
    creator: r.creator,
    license: r.license ? `CC ${r.license.toUpperCase()} ${r.license_version ?? ''}`.trim() : undefined,
    source: r.foreign_landing_url || r.url,
    provider: 'openverse' as const,
  }));
}

export function searchImages(q: string, provider: Provider, signal?: AbortSignal): Promise<ImageHit[]> {
  return provider === 'openverse' ? searchOpenverse(q, signal) : searchWikimedia(q, signal);
}

/** Henter et billede som Blob – først via fetch (CORS), ellers via <img crossOrigin> + canvas. */
async function fetchImageBlob(url: string): Promise<Blob> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) return await res.blob();
  } catch { /* prøv fallback */ }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('cors'));
    i.src = url;
  });
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.85));
}

/** Gemmer et søgeresultat lokalt og returnerer foto-id + kreditering. */
export async function saveHit(hit: ImageHit): Promise<{ photoId: string; credit: string }> {
  const blob = await fetchImageBlob(hit.thumb);
  const dataUrl = await blobToScaledDataUrl(blob, 320);
  const photoId = uid('photo');
  const credit = [hit.title, hit.creator && `© ${hit.creator}`, hit.license, hit.provider === 'wikimedia' ? 'Wikimedia Commons' : 'Openverse']
    .filter(Boolean).join(' · ');
  await putPhoto({ id: photoId, dataUrl, credit, sourceUrl: hit.source, license: hit.license });
  return { photoId, credit };
}

/** Gemmer et foto fra enheden (kamera/fil). */
export async function saveFile(file: File): Promise<string> {
  const dataUrl = await blobToScaledDataUrl(file, 480);
  const photoId = uid('photo');
  await putPhoto({ id: photoId, dataUrl, credit: file.name });
  return photoId;
}
