/**
 * Grundlæggende kort-model.
 * Et kort identificeres af en kort streng: rang + kulør, fx "4C", "10H", "AS".
 */

export type Suit = 'S' | 'H' | 'C' | 'D';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardId = `${Rank}${Suit}`;

export const SUITS: Suit[] = ['S', 'H', 'C', 'D'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', C: '♣', D: '♦' };
export const SUIT_IS_RED: Record<Suit, boolean> = { S: false, H: true, C: false, D: true };

/** Alle 52 kort i "ny-kortspil-rækkefølge" (A♠–K♠, A♥–K♥, A♣–K♣, A♦–K♦). */
export const ALL_CARDS: CardId[] = SUITS.flatMap((s) => RANKS.map((r) => `${r}${s}` as CardId));

/** Rækkefølgen i et typisk nyt (amerikansk) kortspil: A♠–K♠, A♦–K♦, K♣–A♣, K♥–A♥. */
export const NEW_DECK_ORDER: CardId[] = [
  ...RANKS.map((r) => `${r}S` as CardId),
  ...RANKS.map((r) => `${r}D` as CardId),
  ...[...RANKS].reverse().map((r) => `${r}C` as CardId),
  ...[...RANKS].reverse().map((r) => `${r}H` as CardId),
];

export function rankOf(c: CardId): Rank {
  return c.slice(0, -1) as Rank;
}
export function suitOf(c: CardId): Suit {
  return c.slice(-1) as Suit;
}
/** Numerisk værdi: A=1 … K=13 */
export function valueOf(c: CardId): number {
  return RANKS.indexOf(rankOf(c)) + 1;
}
export function isRed(c: CardId): boolean {
  return SUIT_IS_RED[suitOf(c)];
}
export function isCardId(s: string): s is CardId {
  return ALL_CARDS.includes(s as CardId);
}

/** Visningslabel, fx "10♥". Danske billedkort kan vises som B/D/K (knægt/dame/konge). */
export function cardLabel(c: CardId, lang: 'da' | 'en' = 'en'): string {
  return `${rankLabel(rankOf(c), lang)}${SUIT_SYMBOL[suitOf(c)]}`;
}
export function rankLabel(r: Rank, lang: 'da' | 'en' = 'en'): string {
  if (lang === 'da') {
    if (r === 'J') return 'B';
    if (r === 'Q') return 'D';
  }
  return r;
}

const RANK_NAMES = {
  da: { A: 'Es', J: 'Knægt', Q: 'Dame', K: 'Konge' } as Record<string, string>,
  en: { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' } as Record<string, string>,
};
const SUIT_NAMES = {
  da: { S: 'spar', H: 'hjerter', C: 'klør', D: 'ruder' },
  en: { S: 'Spades', H: 'Hearts', C: 'Clubs', D: 'Diamonds' },
};

/** Fuldt navn til oplæsning/skærmlæser, fx "hjerter syv" / "Seven of Hearts". */
export function cardName(c: CardId, lang: 'da' | 'en'): string {
  const r = rankOf(c);
  const s = suitOf(c);
  if (lang === 'da') {
    const rn = RANK_NAMES.da[r] ?? r;
    return `${SUIT_NAMES.da[s]} ${rn.toLowerCase()}`;
  }
  const words: Record<string, string> = {
    '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six', '7': 'Seven',
    '8': 'Eight', '9': 'Nine', '10': 'Ten',
  };
  return `${RANK_NAMES.en[r] ?? words[r]} of ${SUIT_NAMES.en[s]}`;
}

/** Alternative skrivemåder for rang (inkl. danske: B=knægt/bonde, D=dame, E=es). */
const RANK_ALIASES: Record<string, Rank> = {
  T: '10', '1': 'A', '14': 'A', '11': 'J', '12': 'Q', '13': 'K', B: 'J', D: 'Q', E: 'A',
};

/**
 * Parser ét kort-token. Accepterer mange formater:
 * "4C", "4c", "10H", "TH", "4♣", "AS", "kh", danske "B" (knægt) og "D" (dame) når entydigt,
 * samt danske kulører: K/klør er tvetydig, så vi bruger S/H/C/D eller symboler.
 */
export function parseCard(raw: string): CardId | null {
  let t = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (!t) return null;
  t = t.replace('♠', 'S').replace('♥', 'H').replace('♣', 'C').replace('♦', 'D')
    .replace('♤', 'S').replace('♡', 'H').replace('♧', 'C').replace('♢', 'D');
  if (t.length < 2) return null;
  const suit = t.slice(-1);
  let rank = t.slice(0, -1);
  rank = RANK_ALIASES[rank] ?? rank;
  if (!'SHCD'.includes(suit)) return null;
  const id = `${rank}${suit}`;
  return isCardId(id) ? (id as CardId) : null;
}

export interface ParseResult {
  cards: CardId[];
  invalid: string[];
}

/** Parser en hel tekst som "4C 2H 7D ..." (komma, mellemrum, linjeskift eller semikolon). */
export function parseCardList(text: string): ParseResult {
  // Indsæt mellemrum mellem kort skrevet sammen med symboler, fx "4♣2♥7♦"
  const normalized = text.replace(/([♠♥♣♦♤♡♧♢])/g, '$1 ');
  const tokens = normalized.split(/[\s,;|/]+/).filter(Boolean);
  const cards: CardId[] = [];
  const invalid: string[] = [];
  for (const tok of tokens) {
    // Fjern positionsnumre som "1." eller "1:" foran kortet
    const clean = tok.replace(/^\d+[.:)]$/, '');
    if (!clean) continue;
    const c = parseCard(clean);
    if (c) cards.push(c);
    else invalid.push(tok);
  }
  return { cards, invalid };
}

export interface ValidationResult {
  ok: boolean;
  filled: number;
  missing: CardId[];
  duplicates: { card: CardId; positions: number[] }[];
  empty: number[]; // 1-baserede positioner uden kort
}

/** Validerer en stak: præcis 52 unikke kort. */
export function validateOrder(order: (CardId | null)[]): ValidationResult {
  const seen = new Map<CardId, number[]>();
  const empty: number[] = [];
  order.forEach((c, i) => {
    if (!c) empty.push(i + 1);
    else seen.set(c, [...(seen.get(c) ?? []), i + 1]);
  });
  for (let i = order.length; i < 52; i++) empty.push(i + 1);
  const missing = ALL_CARDS.filter((c) => !seen.has(c));
  const duplicates = [...seen.entries()]
    .filter(([, p]) => p.length > 1)
    .map(([card, positions]) => ({ card, positions }));
  const filled = order.filter(Boolean).length;
  return {
    ok: order.length === 52 && empty.length === 0 && missing.length === 0 && duplicates.length === 0,
    filled,
    missing,
    duplicates,
    empty,
  };
}

/** Formatér en stak som tekst "4C 2H 7D ..." (til eksport/kopiering). */
export function formatOrder(order: (CardId | null)[]): string {
  return order.map((c) => c ?? '--').join(' ');
}
