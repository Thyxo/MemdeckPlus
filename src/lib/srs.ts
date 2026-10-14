/**
 * Spaced repetition: Leitner-system med 5 bokse, pr. kort og pr. retning.
 *
 *  Boks 0 = nyt (aldrig set)
 *  Boks 1 → gentag samme dag, 2 → +1 dag, 3 → +3 dage, 4 → +7 dage, 5 → +14 dage
 *
 * Rigtigt svar på et kort, der er "forfaldent" (eller nyt), rykker én boks op.
 * Rigtigt svar på et kort, der ikke er forfaldent, tæller kun i statistikken.
 * Forkert svar sender altid kortet tilbage til boks 1.
 */
import type { CardId } from '../data/cards';
import { addDays, ymd } from './date';

export type Direction = 'c2p' | 'p2c' | 'nx';
export const MAIN_DIRS: Direction[] = ['c2p', 'p2c'];
export const BOX_INTERVALS = [0, 0, 1, 3, 7, 14];
export const MAX_BOX = 5;

export interface SrsItem {
  box: number;
  due: string;
  seen: number;
  correct: number;
  wrong: number;
  totalMs: number;
  last?: number;
}

export type SrsMap = Record<string, SrsItem>;

export const srsKey = (card: CardId, dir: Direction) => `${card}|${dir}`;

export function newItem(today = ymd()): SrsItem {
  return { box: 0, due: today, seen: 0, correct: 0, wrong: 0, totalMs: 0 };
}

export function isDue(item: SrsItem | undefined, today = ymd()): boolean {
  return !item || item.box === 0 || item.due <= today;
}

/** Returnerer en ny opdateret post efter et svar. */
export function review(item: SrsItem | undefined, correct: boolean, ms: number, today = ymd()): SrsItem {
  const it = { ...(item ?? newItem(today)) };
  const due = isDue(item, today);
  it.seen++;
  it.totalMs += Math.min(ms, 60000);
  it.last = Date.now();
  if (correct) {
    it.correct++;
    if (due) {
      it.box = Math.min(MAX_BOX, Math.max(1, it.box + 1));
      it.due = addDays(today, BOX_INTERVALS[it.box]);
    }
  } else {
    it.wrong++;
    it.box = 1;
    it.due = today;
  }
  return it;
}

/** Styrke for ét kort i [0,1], gennemsnit af de to hovedretninger. */
export function cardStrength(srs: SrsMap | undefined, card: CardId): number {
  if (!srs) return 0;
  let sum = 0;
  for (const d of MAIN_DIRS) sum += (srs[srsKey(card, d)]?.box ?? 0) / MAX_BOX;
  return sum / MAIN_DIRS.length;
}

/** Et kort tæller som "lært", når begge hovedretninger er i boks 3 eller højere. */
export function isMastered(srs: SrsMap | undefined, card: CardId): boolean {
  if (!srs) return false;
  return MAIN_DIRS.every((d) => (srs[srsKey(card, d)]?.box ?? 0) >= 3);
}

/** Samlet beherskelse af en stak i procent (0–100). */
export function stackMastery(srs: SrsMap | undefined, cards: CardId[]): number {
  if (!cards.length) return 0;
  const total = cards.reduce((a, c) => a + cardStrength(srs, c), 0);
  return Math.round((total / cards.length) * 100);
}

export interface CardStats {
  card: CardId;
  seen: number;
  correct: number;
  wrong: number;
  avgMs: number;
  errorRate: number;
  strength: number;
}

export function cardStats(srs: SrsMap | undefined, card: CardId): CardStats {
  let seen = 0, correct = 0, wrong = 0, ms = 0;
  for (const d of ['c2p', 'p2c', 'nx'] as Direction[]) {
    const it = srs?.[srsKey(card, d)];
    if (!it) continue;
    seen += it.seen;
    correct += it.correct;
    wrong += it.wrong;
    ms += it.totalMs;
  }
  return {
    card, seen, correct, wrong,
    avgMs: seen ? ms / seen : 0,
    errorRate: seen ? wrong / seen : 0,
    strength: cardStrength(srs, card),
  };
}

/** Svage kort: sorteret efter fejlrate (med lille vægt på lav boks). Kun kort man har set. */
export function weakCards(srs: SrsMap | undefined, cards: CardId[], limit = 12): CardStats[] {
  return cards
    .map((c) => cardStats(srs, c))
    .filter((s) => s.seen > 0 && (s.wrong > 0 || s.strength < 0.4))
    .sort((a, b) => b.errorRate + (1 - b.strength) * 0.3 - (a.errorRate + (1 - a.strength) * 0.3))
    .slice(0, limit);
}

export interface QueueItem {
  card: CardId;
  pos: number; // 1-baseret
  dir: Direction;
}

/**
 * Dagens kø: først forfaldne kort (laveste boks først), derefter nye kort i stakkens rækkefølge.
 */
export function buildDailyQueue(
  order: CardId[],
  srs: SrsMap | undefined,
  opts: { dirs: Direction[]; size: number; newLimit: number; today?: string },
): QueueItem[] {
  const today = opts.today ?? ymd();
  const due: (QueueItem & { box: number; dueDate: string })[] = [];
  const fresh: QueueItem[] = [];
  order.forEach((card, i) => {
    for (const dir of opts.dirs) {
      const it = srs?.[srsKey(card, dir)];
      if (!it || it.box === 0) fresh.push({ card, pos: i + 1, dir });
      else if (it.due <= today) due.push({ card, pos: i + 1, dir, box: it.box, dueDate: it.due });
    }
  });
  due.sort((a, b) => a.box - b.box || a.dueDate.localeCompare(b.dueDate));
  // Nye kort: tag kort for kort (alle retninger for samme kort følger ad)
  const newCards = new Set<CardId>();
  const freshPicked: QueueItem[] = [];
  for (const q of fresh) {
    if (!newCards.has(q.card) && newCards.size >= opts.newLimit) continue;
    newCards.add(q.card);
    freshPicked.push(q);
  }
  const queue = [...due.map(({ card, pos, dir }) => ({ card, pos, dir })), ...freshPicked].slice(0, opts.size);
  return shuffleSoft(queue);
}

/** Antal forfaldne poster i dag (til badges/hjem-skærm). */
export function dueCount(order: CardId[], srs: SrsMap | undefined, dirs: Direction[], today = ymd()): number {
  let n = 0;
  for (const card of order) {
    for (const dir of dirs) {
      const it = srs?.[srsKey(card, dir)];
      if (it && it.box > 0 && it.due <= today) n++;
    }
  }
  return n;
}

/** Bland, men undgå at samme kort kommer to gange i træk. */
export function shuffleSoft<T extends { card: CardId }>(arr: T[]): T[] {
  const a = shuffle(arr);
  for (let i = 1; i < a.length; i++) {
    if (a[i].card === a[i - 1].card) {
      const j = a.findIndex((x, k) => k > i && x.card !== a[i - 1].card);
      if (j > 0) [a[i], a[j]] = [a[j], a[i]];
    }
  }
  return a;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
