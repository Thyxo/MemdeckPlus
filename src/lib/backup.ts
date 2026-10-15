/** Fuld backup: al state + fotos (IndexedDB) i én JSON-fil. */
import { getState, normalizeState, replaceState } from '../store/store';
import { allPhotos, clearPhotos, type Photo, putPhoto } from './idb';
import { ymd } from './date';
import { downloadFile } from './files';

interface Backup {
  type: 'stackmaster-backup';
  version: 1;
  exportedAt: string;
  state: unknown;
  photos: Photo[];
}

export async function exportBackup() {
  let photos: Photo[] = [];
  try { photos = await allPhotos(); } catch { /* ingen fotos */ }
  const data: Backup = { type: 'stackmaster-backup', version: 1, exportedAt: new Date().toISOString(), state: getState(), photos };
  downloadFile(`memdeckplus-backup-${ymd()}.json`, JSON.stringify(data));
}

/** Returnerer antal stacks i den importerede backup. Kaster ved ugyldig fil. */
export async function importBackup(text: string): Promise<number> {
  const data = JSON.parse(text) as Partial<Backup>;
  if (data?.type !== 'stackmaster-backup' || !data.state) throw new Error('invalid');
  const st = normalizeState(data.state);
  await clearPhotos().catch(() => undefined);
  for (const p of data.photos ?? []) if (p?.id && p.dataUrl) await putPhoto(p);
  replaceState(st);
  return st.stacks.length;
}
