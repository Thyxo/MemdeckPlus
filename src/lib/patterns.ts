/**
 * Automatisk mønster-genkendelse i en stak – som huskehjælp.
 * Alle funktioner er rene og virker for enhver komplet stak.
 */
import { type CardId, RANKS, isRed, suitOf, valueOf } from '../data/cards';

export type PatternKind =
  | 'valuePos'      // kortets værdi = positionen (evt. modulo 13)
  | 'suitRun'       // samme kulør i træk
  | 'pair'          // samme værdi side om side
  | 'step'          // fast spring i værdi (fx 3-4-5 eller 2-4-6)
  | 'colorRun'      // samme farve 4+ i træk
  | 'mirror'        // samme værdi på p og p+26
  | 'fours';        // hvor ligger alle fire af en værdi

export interface Pattern {
  kind: PatternKind;
  positions: number[]; // 1-baserede
  info?: string;
}

export function findPatterns(order: CardId[]): Pattern[] {
  const out: Pattern[] = [];
  const n = order.length;
  if (n !== 52) return out;

  // 1) værdi = position
  order.forEach((c, i) => {
    const p = i + 1;
    const v = valueOf(c);
    if (v === p || (p > 13 && ((p - 1) % 13) + 1 === v)) out.push({ kind: 'valuePos', positions: [p], info: v === p ? '=' : 'mod13' });
  });

  // 2) kulør-rækker (2+) og 5) farve-rækker (4+)
  const runs = (same: (a: CardId, b: CardId) => boolean, min: number, kind: PatternKind) => {
    let s = 0;
    for (let i = 1; i <= n; i++) {
      if (i < n && same(order[i - 1], order[i])) continue;
      if (i - s >= min) out.push({ kind, positions: range(s + 1, i) });
      s = i;
    }
  };
  runs((a, b) => suitOf(a) === suitOf(b), 2, 'suitRun');
  runs((a, b) => isRed(a) === isRed(b), 4, 'colorRun');

  // 3) par: samme værdi side om side
  for (let i = 1; i < n; i++) {
    if (valueOf(order[i - 1]) === valueOf(order[i])) out.push({ kind: 'pair', positions: [i, i + 1] });
  }

  // 4) fast spring i værdi, mindst 3 kort
  const v = (i: number) => valueOf(order[i]);
  for (let i = 0; i < n - 2; ) {
    const d = v(i + 1) - v(i);
    let j = i + 1;
    while (d !== 0 && j + 1 < n && v(j + 1) - v(j) === d) j++;
    if (d !== 0 && j - i + 1 >= 3) {
      out.push({ kind: 'step', positions: range(i + 1, j + 1), info: (d > 0 ? '+' : '') + d });
      i = j;
    } else i++;
  }

  // 6) spejl: samme værdi på p og p+26
  for (let i = 0; i < 26; i++) {
    if (valueOf(order[i]) === valueOf(order[i + 26])) out.push({ kind: 'mirror', positions: [i + 1, i + 27] });
  }

  // 7) fire ens: hvor ligger hver værdi
  for (const r of RANKS) {
    const pos = order.map((c, i) => (c.slice(0, -1) === r ? i + 1 : 0)).filter(Boolean);
    out.push({ kind: 'fours', positions: pos, info: r });
  }
  return out;
}

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}
