/** Hjælpere til opbygning af spørgsmål for de forskellige øvelser. */
import type { CardId } from '../../data/cards';
import { type Direction, shuffle, shuffleSoft } from '../../lib/srs';
import type { DirPref } from '../../store/types';
import type { QItem } from './Quiz';

export function dirsFor(p: DirPref): Direction[] {
  return p === 'both' ? ['c2p', 'p2c'] : [p];
}

/** Tilfældige spørgsmål fra et udvalg af positioner. */
export function randomItems(order: CardId[], positions: number[], dirs: Direction[], n: number): QItem[] {
  const out: QItem[] = [];
  let pool: number[] = [];
  while (out.length < n) {
    if (!pool.length) pool = shuffle(positions);
    const pos = pool.pop()!;
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    out.push({ card: order[pos - 1], pos, dir, prev: dir === 'nx' ? Math.random() < 0.3 : undefined });
  }
  return shuffleSoft(out);
}

export function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
