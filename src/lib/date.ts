/** Dato-hjælpere. Alle datoer gemmes som lokale "YYYY-MM-DD"-strenge. */

export function ymd(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseYmd(b).getTime() - parseYmd(a).getTime()) / 86400000);
}

/** Antal dage i træk (bagud fra i dag – eller i går, hvis man ikke har trænet endnu i dag). */
export function computeStreak(activeDays: Set<string>, today = ymd()): number {
  let cursor = activeDays.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (activeDays.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function longestStreak(activeDays: Set<string>): number {
  const sorted = [...activeDays].sort();
  let best = 0;
  let cur = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    cur = prev && daysBetween(prev, d) === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}
