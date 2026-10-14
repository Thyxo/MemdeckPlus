/**
 * Global app-store: én state, persisteret i localStorage (fotos i IndexedDB).
 * Brug `useApp()` i komponenter og `actions.*` til ændringer.
 */
import { useSyncExternalStore } from 'react';
import type { CardId } from '../data/cards';
import { ALL_CARDS, isCardId } from '../data/cards';
import { builtinStacks, MNEMONICA_ID, type Stack, uid } from '../data/stacks';
import { computeStreak, ymd } from '../lib/date';
import { review, type Direction, isMastered, stackMastery } from '../lib/srs';
import { BADGES } from './badges';
import type { AppState, CardImage, Palace, PatternNote, Settings } from './types';

export const STORAGE_KEY = 'stackmaster:v1';

export const DEFAULT_SETTINGS: Settings = {
  lang: 'da',
  theme: 'dark',
  haptics: true,
  sound: true,
  direction: 'both',
  dailyGoal: 40,
  sessionSize: 20,
  newPerDay: 5,
  timePerQuestion: 0,
  danishRanks: false,
  method: 'images',
  reminders: { enabled: false, time: '19:00' },
  onboarded: false,
};

export function defaultState(): AppState {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    stacks: builtinStacks(),
    activeStackId: MNEMONICA_ID,
    images: {},
    stories: {},
    palaces: [],
    srs: {},
    learn: {},
    days: {},
    highscores: {},
    badges: {},
    patternNotes: {},
  };
}

/** Sikrer at indlæste/importerede data har alle felter (fremadkompatibel migrering). */
export function normalizeState(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  const stacks = Array.isArray(r.stacks) && r.stacks.length ? r.stacks : base.stacks;
  // Sørg for at den indbyggede Mnemonica altid findes
  if (!stacks.some((s) => s.id === MNEMONICA_ID)) stacks.unshift(base.stacks[0]);
  for (const s of stacks) {
    s.order = Array.from({ length: 52 }, (_, i) => {
      const c = s.order?.[i];
      return c && isCardId(c) ? c : null;
    });
  }
  const st: AppState = {
    ...base,
    ...r,
    version: 1,
    settings: { ...base.settings, ...(r.settings ?? {}), reminders: { ...base.settings.reminders, ...(r.settings?.reminders ?? {}) } },
    stacks,
  };
  if (!st.stacks.some((s) => s.id === st.activeStackId)) st.activeStackId = st.stacks[0].id;
  return st;
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();
let saveTimer: number | undefined;
export let storageError = false;

function persist() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageError = false;
    } catch {
      storageError = true;
      emit('toast', 'storageFull');
    }
  }, 250);
}

// Gem straks, når appen lukkes/skjules
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignoreres */ }
  });
}

export function getState(): AppState {
  return state;
}

/** Opdatér state via en mutator på en dyb kopi (simpelt og sikkert for denne datamængde). */
export function update(fn: (draft: AppState) => void) {
  const draft = structuredClone(state);
  fn(draft);
  state = draft;
  persist();
  listeners.forEach((l) => l());
}

export function replaceState(next: AppState) {
  state = normalizeState(next);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

// ---------- Hændelser (toast, badges, konfetti) ----------
type Events = { toast: string; badge: string; confetti: void };
const bus = new Map<keyof Events, Set<(p: never) => void>>();
export function on<K extends keyof Events>(k: K, fn: (p: Events[K]) => void) {
  if (!bus.has(k)) bus.set(k, new Set());
  bus.get(k)!.add(fn as (p: never) => void);
  return () => bus.get(k)!.delete(fn as (p: never) => void);
}
export function emit<K extends keyof Events>(k: K, p?: Events[K]) {
  bus.get(k)?.forEach((fn) => (fn as (p: Events[K] | undefined) => void)(p));
}

// ---------- Afledte værdier ----------
export function activeStack(s: AppState = state): Stack {
  return s.stacks.find((x) => x.id === s.activeStackId) ?? s.stacks[0];
}

/** Rækkefølgen som rene kort (kun gyldige stacks bruges til træning). */
export function fullOrder(stack: Stack): CardId[] {
  return stack.order.filter((c): c is CardId => !!c);
}

export function isComplete(stack: Stack): boolean {
  const cards = fullOrder(stack);
  return cards.length === 52 && new Set(cards).size === 52;
}

export function activeDays(s: AppState = state): Set<string> {
  return new Set(Object.entries(s.days).filter(([, d]) => d.answers > 0).map(([k]) => k));
}

export function streak(s: AppState = state): number {
  return computeStreak(activeDays(s));
}

export function masteryOf(s: AppState, stack: Stack): number {
  return stackMastery(s.srs[stack.id], fullOrder(stack));
}

export function masteredCount(s: AppState, stackId: string): number {
  const st = s.stacks.find((x) => x.id === stackId);
  if (!st) return 0;
  return fullOrder(st).filter((c) => isMastered(s.srs[stackId], c)).length;
}

// ---------- Actions ----------
export const actions = {
  setSettings(patch: Partial<Settings>) {
    update((d) => { d.settings = { ...d.settings, ...patch }; });
  },
  setActiveStack(id: string) {
    update((d) => { d.activeStackId = id; });
  },

  // Stacks
  saveStack(stack: Stack) {
    update((d) => {
      const i = d.stacks.findIndex((s) => s.id === stack.id);
      const next = { ...stack, updatedAt: Date.now() };
      if (i >= 0) d.stacks[i] = next;
      else d.stacks.push(next);
    });
  },
  createStack(partial: Partial<Stack> & { name: string }): string {
    const id = uid('stack');
    const now = Date.now();
    update((d) => {
      d.stacks.push({
        order: Array.from({ length: 52 }, () => null),
        ...partial,
        id,
        createdAt: now,
        updatedAt: now,
        builtIn: false,
      } as Stack);
    });
    return id;
  },
  duplicateStack(id: string, name: string): string {
    const src = state.stacks.find((s) => s.id === id);
    if (!src) return id;
    const { id: _omit, ...rest } = structuredClone(src);
    void _omit;
    return actions.createStack({ ...rest, name });
  },
  renameStack(id: string, name: string) {
    update((d) => {
      const s = d.stacks.find((x) => x.id === id);
      if (s) { s.name = name; s.updatedAt = Date.now(); }
    });
  },
  deleteStack(id: string) {
    update((d) => {
      d.stacks = d.stacks.filter((s) => s.id !== id || s.builtIn);
      delete d.srs[id];
      delete d.learn[id];
      delete d.stories[id];
      delete d.highscores[id];
      delete d.patternNotes[id];
      d.palaces = d.palaces.filter((p) => p.stackId !== id);
      if (d.activeStackId === id) d.activeStackId = d.stacks[0].id;
    });
  },

  // Træning
  recordAnswer(stackId: string, card: CardId, dir: Direction, correct: boolean, ms: number) {
    const today = ymd();
    update((d) => {
      const map = (d.srs[stackId] ??= {});
      const key = `${card}|${dir}`;
      map[key] = review(map[key], correct, ms, today);
      const day = (d.days[today] ??= { answers: 0, correct: 0, ms: 0, sessions: 0 });
      day.answers++;
      if (correct) day.correct++;
      day.ms += Math.min(ms, 60000);
      const st = d.stacks.find((s) => s.id === stackId);
      if (st) (day.mastery ??= {})[stackId] = stackMastery(d.srs[stackId], fullOrder(st));
    });
  },
  finishSession() {
    const today = ymd();
    update((d) => {
      const day = (d.days[today] ??= { answers: 0, correct: 0, ms: 0, sessions: 0 });
      day.sessions++;
    });
    checkBadges();
  },
  setHighscore(stackId: string, patch: { speed?: number; fullOrderMs?: number }): boolean {
    let improved = false;
    update((d) => {
      const h = (d.highscores[stackId] ??= {});
      if (patch.speed !== undefined && patch.speed > (h.speed ?? 0)) { h.speed = patch.speed; improved = true; }
      if (patch.fullOrderMs !== undefined && (!h.fullOrderMs || patch.fullOrderMs < h.fullOrderMs)) {
        h.fullOrderMs = patch.fullOrderMs; improved = true;
      }
    });
    return improved;
  },
  awardBadge(id: string) {
    if (state.badges[id]) return;
    update((d) => { d.badges[id] = Date.now(); });
    emit('badge', id);
    emit('confetti');
  },

  // Lær
  setChunkSize(stackId: string, size: number) {
    update((d) => { d.learn[stackId] = { chunkSize: size, passed: [] }; });
  },
  passChunk(stackId: string, idx: number) {
    update((d) => {
      const l = (d.learn[stackId] ??= { chunkSize: 8, passed: [] });
      if (!l.passed.includes(idx)) l.passed.push(idx);
    });
  },
  setImage(card: CardId, img: CardImage | null) {
    update((d) => {
      if (img) d.images[card] = img;
      else delete d.images[card];
    });
    if (ALL_CARDS.every((c) => getState().images[c])) actions.awardBadge('images52');
  },
  setImages(all: Partial<Record<CardId, CardImage>>) {
    update((d) => { d.images = { ...d.images, ...all }; });
    if (ALL_CARDS.every((c) => getState().images[c])) actions.awardBadge('images52');
  },
  setStory(stackId: string, pos: number, text: string) {
    update((d) => {
      const m = (d.stories[stackId] ??= {});
      if (text.trim()) m[pos] = text;
      else delete m[pos];
    });
  },
  savePalace(p: Palace) {
    update((d) => {
      const i = d.palaces.findIndex((x) => x.id === p.id);
      if (i >= 0) d.palaces[i] = p;
      else d.palaces.push(p);
    });
    actions.awardBadge('palace');
  },
  deletePalace(id: string) {
    update((d) => { d.palaces = d.palaces.filter((p) => p.id !== id); });
  },
  savePatternNote(stackId: string, note: PatternNote) {
    update((d) => {
      const list = (d.patternNotes[stackId] ??= []);
      const i = list.findIndex((n) => n.id === note.id);
      if (i >= 0) list[i] = note;
      else list.push(note);
    });
  },
  deletePatternNote(stackId: string, id: string) {
    update((d) => { d.patternNotes[stackId] = (d.patternNotes[stackId] ?? []).filter((n) => n.id !== id); });
  },
  resetProgress(stackId?: string) {
    update((d) => {
      if (stackId) { delete d.srs[stackId]; delete d.learn[stackId]; delete d.highscores[stackId]; }
      else { d.srs = {}; d.learn = {}; d.highscores = {}; d.days = {}; d.badges = {}; }
    });
  },
};

/** Tjekker alle badge-betingelser og tildeler nye. */
export function checkBadges() {
  for (const b of BADGES) {
    if (!state.badges[b.id] && b.check(state)) actions.awardBadge(b.id);
  }
}

