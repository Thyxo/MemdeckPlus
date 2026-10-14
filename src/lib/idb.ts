/**
 * Minimal IndexedDB-wrapper til fotos (billeder fylder for meget til localStorage).
 * Hvert foto gemmes som data-URL + evt. kreditering (licens, fotograf, kilde).
 */

export interface Photo {
  id: string;
  dataUrl: string;
  credit?: string;
  sourceUrl?: string;
  license?: string;
}

const DB_NAME = 'stackmaster';
const STORE = 'photos';
let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const t = d.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

const cache = new Map<string, Photo>();

export async function putPhoto(p: Photo): Promise<void> {
  cache.set(p.id, p);
  await tx('readwrite', (s) => s.put(p));
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  if (cache.has(id)) return cache.get(id);
  const p = await tx<Photo | undefined>('readonly', (s) => s.get(id));
  if (p) cache.set(id, p);
  return p;
}

export async function deletePhoto(id: string): Promise<void> {
  cache.delete(id);
  await tx('readwrite', (s) => s.delete(id));
}

export async function allPhotos(): Promise<Photo[]> {
  return tx<Photo[]>('readonly', (s) => s.getAll());
}

export async function clearPhotos(): Promise<void> {
  cache.clear();
  await tx('readwrite', (s) => s.clear());
}

/** Skalerer et billede (Blob/File) ned og returnerer en komprimeret JPEG data-URL. */
export async function blobToScaledDataUrl(blob: Blob, max = 320): Promise<string> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('image-load'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
