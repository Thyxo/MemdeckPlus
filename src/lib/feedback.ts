/** Haptik (navigator.vibrate) og små lydeffekter (WebAudio – ingen lydfiler, virker offline). */
import { getState } from '../store/store';

export function haptic(pattern: number | number[] = 10) {
  if (!getState().settings.haptics) return;
  try { navigator.vibrate?.(pattern); } catch { /* ikke understøttet */ }
}

let ctx: AudioContext | null = null;
function tone(freq: number, dur: number, type: OscillatorType = 'sine', when = 0, gain = 0.06) {
  if (!getState().settings.sound) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch { /* lyd ikke tilgængelig */ }
}

export const sfx = {
  correct() { tone(660, 0.12, 'sine'); tone(990, 0.16, 'sine', 0.08); haptic(12); },
  wrong() { tone(200, 0.22, 'triangle', 0, 0.08); haptic([30, 40, 30]); },
  tap() { haptic(6); },
  success() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'sine', i * 0.09)); haptic([15, 30, 15]); },
};
