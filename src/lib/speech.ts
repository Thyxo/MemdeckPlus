/** Oplæsning via Web Speech API (fungerer offline med enhedens stemmer). */
import type { CardId } from '../data/cards';
import { cardName } from '../data/cards';
import type { Lang } from '../store/types';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, lang: Lang) {
  if (!speechSupported) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === 'da' ? 'da-DK' : 'en-US';
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
  if (voice) u.voice = voice;
  u.rate = 1.05;
  window.speechSynthesis.speak(u);
}

export function speakCard(card: CardId, lang: Lang, prefix?: string) {
  speak(`${prefix ? prefix + ', ' : ''}${cardName(card, lang)}`, lang);
}

export function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
}
