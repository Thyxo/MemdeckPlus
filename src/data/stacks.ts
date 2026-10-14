/**
 * Stack-data: indbyggede stacks og skabeloner.
 * Tilføj nye indbyggede stacks ved at udvide BUILTIN_STACKS eller TEMPLATES.
 */
import { type CardId, RANKS, parseCardList } from './cards';

/** En stack (memoreret kortspil). `order[i]` er kortet på position i+1 (null = tom plads). */
export interface Stack {
  id: string;
  name: string;
  description?: string;
  author?: string;
  order: (CardId | null)[];
  builtIn?: boolean;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Mnemonica (Juan Tamariz), position 1 → 52 fra toppen.
 * Verificeret mod flere uafhængige kilder (Electricks, Magnetic Memory Method, Vanishing Inc.).
 */
export const MNEMONICA_TEXT =
  '4C 2H 7D 3C 4H 6D AS 5H 9S 2S QH 3D QC 8H 6S 5S 9H KC 2D JH 3S 8S 6H 10C 5D KD ' +
  '2C 3H 8D 5C KS JD 8C 10S KH JC 7S 10H AD 4S 7H 4D AC 9C JS QD 7C QS 10D 6C AH 9D';

export const MNEMONICA: CardId[] = parseCardList(MNEMONICA_TEXT).cards;

/** Si Stebbins: +3 i værdi, kulører i rækkefølgen ♣♥♠♦ (CHaSeD). Matematisk system, fri at bruge. */
export function siStebbins(start: CardId = 'AC'): CardId[] {
  const suits = ['C', 'H', 'S', 'D'] as const;
  let r = RANKS.indexOf(start.slice(0, -1) as (typeof RANKS)[number]);
  let s = suits.indexOf(start.slice(-1) as (typeof suits)[number]);
  const out: CardId[] = [];
  for (let i = 0; i < 52; i++) {
    out.push(`${RANKS[r]}${suits[s]}` as CardId);
    r = (r + 3) % 13;
    s = (s + 1) % 4;
  }
  return out;
}

/** "Eight Kings Threatened to Save Ninety-five Queens For One Sick Knave" + CHaSeD. Klassisk, fri. */
export function eightKings(): CardId[] {
  const ranks = ['8', 'K', '3', '10', '2', '7', '9', '5', 'Q', '4', 'A', '6', 'J'];
  const suits = ['C', 'H', 'S', 'D'];
  return Array.from({ length: 52 }, (_, i) => `${ranks[i % 13]}${suits[i % 4]}` as CardId);
}

export interface StackTemplate {
  id: string;
  name: string;
  author: string;
  /** i18n-nøgle til beskrivelse */
  descKey: 'tplAronson' | 'tplRedford' | 'tplSiStebbins' | 'tplEightKings' | 'tplBlank';
  /** Hvis rækkefølgen kan genereres (fri/algoritmisk), ellers udfylder brugeren selv. */
  generate?: () => CardId[];
}

export const TEMPLATES: StackTemplate[] = [
  { id: 'aronson', name: 'Aronson', author: 'Simon Aronson', descKey: 'tplAronson' },
  { id: 'redford', name: 'Redford', author: 'Patrick Redford', descKey: 'tplRedford' },
  { id: 'si-stebbins', name: 'Si Stebbins', author: 'William Henry Coffrin', descKey: 'tplSiStebbins', generate: () => siStebbins() },
  { id: 'eight-kings', name: 'Eight Kings', author: 'Traditionel', descKey: 'tplEightKings', generate: eightKings },
  { id: 'blank', name: '', author: '', descKey: 'tplBlank' },
];

export const MNEMONICA_ID = 'mnemonica';

export function builtinStacks(): Stack[] {
  const now = Date.now();
  return [
    {
      id: MNEMONICA_ID,
      name: 'Mnemonica',
      author: 'Juan Tamariz',
      description: '',
      order: [...MNEMONICA],
      builtIn: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function emptyOrder(): (CardId | null)[] {
  return Array.from({ length: 52 }, () => null);
}

/** Lille id-generator (tilstrækkelig til lokale data). */
export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
