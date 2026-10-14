/** Hele appens persisterede datamodel. */
import type { CardId } from '../data/cards';
import type { Stack } from '../data/stacks';
import type { SrsMap } from '../lib/srs';

export type Lang = 'da' | 'en';
export type Theme = 'dark' | 'light' | 'system';
/** Standard-retning i træning. 'both' = blandet kort→position og position→kort. */
export type DirPref = 'c2p' | 'p2c' | 'both';
export type Method = 'images' | 'palace' | 'rote';

export interface Settings {
  lang: Lang;
  theme: Theme;
  haptics: boolean;
  sound: boolean;
  direction: DirPref;
  /** Antal svar pr. dag, der udgør dagens mål. */
  dailyGoal: number;
  /** Antal spørgsmål pr. træningssession. */
  sessionSize: number;
  /** Nye kort pr. dag i dagens træning. */
  newPerDay: number;
  /** Sekunder pr. spørgsmål (0 = ingen tidsgrænse). */
  timePerQuestion: number;
  /** Vis danske billedkort-bogstaver (B/D/K) i stedet for J/Q/K. */
  danishRanks: boolean;
  method: Method;
  reminders: { enabled: boolean; time: string };
  onboarded: boolean;
}

export type ImageKind = 'emoji' | 'person' | 'object' | 'text' | 'photo';

export interface CardImage {
  kind: ImageKind;
  text: string;
  emoji?: string;
  photoId?: string;
  credit?: string;
}

export interface PalaceStop {
  id: string;
  name: string;
  emoji: string;
  note?: string;
}

export interface Palace {
  id: string;
  name: string;
  stackId: string;
  perStop: number; // 3 eller 4 kort pr. stop
  /** Første position i stakken, ruten starter ved (normalt 1). */
  startPos: number;
  stops: PalaceStop[];
  createdAt: number;
}

export interface PatternNote {
  id: string;
  from: number;
  to: number;
  text: string;
}

export interface LearnProgress {
  chunkSize: number;
  passed: number[]; // indeks på bidder, der er bestået
}

export interface DayLog {
  answers: number;
  correct: number;
  ms: number;
  sessions: number;
  /** Beherskelse (%) pr. stack ved dagens slutning – til fremgangsgraf. */
  mastery?: Record<string, number>;
}

export interface Highscores {
  speed?: number;
  fullOrderMs?: number;
}

export interface AppState {
  version: 1;
  settings: Settings;
  stacks: Stack[];
  activeStackId: string;
  images: Partial<Record<CardId, CardImage>>;
  /** Historie-kobling fra position p til p+1, pr. stack. */
  stories: Record<string, Record<number, string>>;
  palaces: Palace[];
  srs: Record<string, SrsMap>;
  learn: Record<string, LearnProgress>;
  days: Record<string, DayLog>;
  highscores: Record<string, Highscores>;
  badges: Record<string, number>;
  patternNotes: Record<string, PatternNote[]>;
  lastReminder?: string;
}
