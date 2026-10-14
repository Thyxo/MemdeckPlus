/**
 * Egne kulør-symboler som SVG-stier (100×100 boks). Undgår at ♥/♦ vises som emoji på iOS/Android.
 */
import type { Suit } from '../data/cards';

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

export const SUIT_PATHS: Record<Suit, string> = {
  H: 'M50 90 C22 68 4 50 4 30 C4 14 16 5 29 5 C39 5 46 11 50 20 C54 11 61 5 71 5 C84 5 96 14 96 30 C96 50 78 68 50 90 Z',
  D: 'M50 3 Q68 28 88 50 Q68 72 50 97 Q32 72 12 50 Q32 28 50 3 Z',
  S: 'M50 5 C60 24 95 42 95 63 C95 77 84 85 73 85 C64 85 57 80 54 73 C55 83 59 91 67 96 L33 96 C41 91 45 83 46 73 C43 80 36 85 27 85 C16 85 5 77 5 63 C5 42 40 24 50 5 Z',
  C:
    circle(50, 28, 21) + ' ' + circle(27, 60, 21) + ' ' + circle(73, 60, 21) + ' ' + circle(50, 52, 12) +
    ' M46 60 C46 80 42 90 33 96 L67 96 C58 90 54 80 54 60 Z',
};

export function suitColor(s: Suit) {
  return s === 'H' || s === 'D' ? 'var(--card-red)' : 'var(--card-black)';
}

/** Kulør som selvstændigt inline-ikon (fx i knapper og tekst). */
export function SuitIcon({ suit, size = 18, color, title }: { suit: Suit; size?: number; color?: string; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} className="suit-icon">
      {title && <title>{title}</title>}
      <path d={SUIT_PATHS[suit]} fill={color ?? suitColor(suit)} />
    </svg>
  );
}

/** Kulør-sti placeret i et SVG-koordinatsystem (bruges inde i kortet). */
export function SuitPath({ suit, x, y, size, flip = false, fill }: { suit: Suit; x: number; y: number; size: number; flip?: boolean; fill?: string }) {
  const s = size / 100;
  const tf = flip
    ? `translate(${x + size / 2} ${y + size / 2}) rotate(180) translate(${-size / 2} ${-size / 2}) scale(${s})`
    : `translate(${x} ${y}) scale(${s})`;
  return <path d={SUIT_PATHS[suit]} transform={tf} fill={fill ?? suitColor(suit)} />;
}
