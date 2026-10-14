/** Milepæle/badges. Titler og beskrivelser findes i i18n under `badge.<id>` / `badgeDesc.<id>`. */
import { computeStreak } from '../lib/date';
import { isMastered } from '../lib/srs';
import type { AppState } from './types';

export interface Badge {
  id: string;
  icon: string;
  check: (s: AppState) => boolean;
}

function mastered(s: AppState): number {
  const st = s.stacks.find((x) => x.id === s.activeStackId);
  if (!st) return 0;
  return st.order.filter((c) => c && isMastered(s.srs[st.id], c)).length;
}
function streakOf(s: AppState): number {
  return computeStreak(new Set(Object.entries(s.days).filter(([, d]) => d.answers > 0).map(([k]) => k)));
}
function totalAnswers(s: AppState): number {
  return Object.values(s.days).reduce((a, d) => a + d.answers, 0);
}

export const BADGES: Badge[] = [
  { id: 'first', icon: '🎯', check: (s) => Object.values(s.days).some((d) => d.sessions > 0) },
  { id: 'cards10', icon: '🔟', check: (s) => mastered(s) >= 10 },
  { id: 'half', icon: '🌓', check: (s) => mastered(s) >= 26 },
  { id: 'full', icon: '👑', check: (s) => mastered(s) >= 52 },
  { id: 'streak3', icon: '🔥', check: (s) => streakOf(s) >= 3 },
  { id: 'streak7', icon: '📅', check: (s) => streakOf(s) >= 7 },
  { id: 'streak30', icon: '🏆', check: (s) => streakOf(s) >= 30 },
  { id: 'speed20', icon: '⚡', check: (s) => Object.values(s.highscores).some((h) => (h.speed ?? 0) >= 20) },
  { id: 'perfectOrder', icon: '🃏', check: (s) => Object.values(s.highscores).some((h) => !!h.fullOrderMs) },
  { id: 'palace', icon: '🏛️', check: (s) => s.palaces.length > 0 },
  { id: 'images52', icon: '🖼️', check: (s) => Object.keys(s.images).length >= 52 },
  { id: 'answers1000', icon: '💯', check: (s) => totalAnswers(s) >= 1000 },
];
