/**
 * Minimal hash-router (#/library/abc). Hash-routing kræver ingen server-rewrites
 * og virker derfor perfekt offline og på Vercel.
 */
import { useSyncExternalStore } from 'react';

function current(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): { path: string; parts: string[]; query: URLSearchParams } {
  const full = useSyncExternalStore(subscribe, current, () => '/');
  const [path, qs = ''] = full.split('?');
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs) };
}

export function navigate(path: string, replace = false) {
  const url = `#${path}`;
  if (current() === path) return;
  if (replace) { depth--; window.location.replace(url); }
  else window.location.hash = path;
}

// Tæl navigationer i appen, så "tilbage" aldrig forlader appen ved direkte åbning af et dybt link.
let depth = 0;
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => { depth++; });

export function back(fallback = '/') {
  if (depth > 0) {
    depth = Math.max(-1, depth - 2); // history.back udløser selv en hashchange (+1)
    window.history.back();
  } else navigate(fallback, true);
}
