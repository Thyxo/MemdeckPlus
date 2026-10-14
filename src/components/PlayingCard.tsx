/**
 * Egne SVG-spillekort (ingen ophavsretsbeskyttet grafik).
 * 200×280 koordinatsystem, klare indekser, rød/sort, guld-detaljer på billedkort.
 */
import { memo, useId } from 'react';
import { type CardId, cardName, rankLabel, rankOf, suitOf, valueOf } from '../data/cards';
import { useApp } from '../store/store';
import { SUIT_PATHS as SUIT_PATH_CACHE, SuitPath, suitColor } from './SuitIcon';

type Pip = [number, number, boolean?];
const L = 58, C = 100, R = 142;
const PIPS: Record<number, Pip[]> = {
  2: [[C, 62], [C, 218, true]],
  3: [[C, 62], [C, 140], [C, 218, true]],
  4: [[L, 62], [R, 62], [L, 218, true], [R, 218, true]],
  5: [[L, 62], [R, 62], [C, 140], [L, 218, true], [R, 218, true]],
  6: [[L, 62], [R, 62], [L, 140], [R, 140], [L, 218, true], [R, 218, true]],
  7: [[L, 62], [R, 62], [C, 101], [L, 140], [R, 140], [L, 218, true], [R, 218, true]],
  8: [[L, 62], [R, 62], [C, 101], [L, 140], [R, 140], [C, 179, true], [L, 218, true], [R, 218, true]],
  9: [[L, 62], [R, 62], [L, 114], [R, 114], [C, 140], [L, 166, true], [R, 166, true], [L, 218, true], [R, 218, true]],
  10: [[L, 62], [R, 62], [C, 88], [L, 114], [R, 114], [L, 166, true], [R, 166, true], [C, 192, true], [L, 218, true], [R, 218, true]],
};

const CROWN = 'M8 78 L4 28 L28 52 L50 12 L72 52 L96 28 L92 78 Z M8 84 H92 V94 H8 Z';
const TIARA = 'M6 80 Q50 10 94 80 Q72 62 50 64 Q28 62 6 80 Z M44 30 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z M6 84 H94 V92 H6 Z';
const PLUME = 'M50 6 C70 26 74 52 54 80 L54 94 H46 V80 C26 52 30 26 50 6 Z M50 20 C42 34 42 52 50 70 C58 52 58 34 50 20 Z';

export interface PlayingCardProps {
  card?: CardId | null;
  width?: number | string;
  faceDown?: boolean;
  state?: 'ok' | 'bad' | 'sel' | 'dim';
  className?: string;
  title?: string;
}

function CardFace({ card }: { card: CardId }) {
  const { settings } = useApp();
  const uid = useId().replace(/:/g, '');
  const suit = suitOf(card);
  const v = valueOf(card);
  const rank = rankOf(card);
  const label = rankLabel(rank, settings.danishRanks ? 'da' : 'en');
  const color = suitColor(suit);
  const isCourt = v > 10;
  return (
    <>
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--card-face)" />
          <stop offset="1" stopColor="var(--card-face-2)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="196" height="276" rx="16" fill={`url(#g${uid})`} stroke="var(--card-edge)" strokeWidth="2" />
      {/* Indeks øverst til venstre og nederst til højre (roteret) */}
      {[false, true].map((flip) => (
        <g key={String(flip)} transform={flip ? 'rotate(180 100 140)' : undefined}>
          <text x="25" y="46" textAnchor="middle" fontSize={label.length > 1 ? 31 : 38} fontWeight="800" fill={color} fontFamily="var(--font-ui)" letterSpacing="-2">
            {label}
          </text>
          <SuitPath suit={suit} x={12} y={54} size={26} />
        </g>
      ))}
      {v === 1 && (
        <g>
          <circle cx="100" cy="140" r="58" fill="none" stroke="var(--gold)" strokeWidth="2" opacity={suit === 'S' ? 0.9 : 0.35} />
          <SuitPath suit={suit} x={58} y={98} size={84} />
        </g>
      )}
      {v >= 2 && v <= 10 && PIPS[v].map(([x, y, f], i) => <SuitPath key={i} suit={suit} x={x - 17} y={y - 17} size={34} flip={!!f} />)}
      {isCourt && (
        <g>
          <rect x="44" y="40" width="112" height="200" rx="10" fill={color} fillOpacity="0.07" stroke="var(--gold)" strokeWidth="2.5" />
          <rect x="50" y="46" width="100" height="188" rx="7" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.6" />
          <path d={v === 13 ? CROWN : v === 12 ? TIARA : PLUME} transform="translate(76 58) scale(0.48)" fill="var(--gold)" />
          <text x="100" y="168" textAnchor="middle" fontSize="78" fontWeight="700" fill={color} fontFamily="var(--font-display)">
            {label}
          </text>
          <SuitPath suit={suit} x={84} y={186} size={32} />
        </g>
      )}
    </>
  );
}

function CardBack() {
  const uid = useId().replace(/:/g, '');
  return (
    <>
      <defs>
        <pattern id={`p${uid}`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="16" height="16" fill="var(--back-1)" />
          <path d="M0 8 H16 M8 0 V16" stroke="var(--gold)" strokeOpacity="0.28" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="196" height="276" rx="16" fill="var(--back-2)" stroke="var(--card-edge)" strokeWidth="2" />
      <rect x="14" y="14" width="172" height="252" rx="10" fill={`url(#p${uid})`} stroke="var(--gold)" strokeWidth="2" />
      <circle cx="100" cy="140" r="34" fill="var(--back-2)" stroke="var(--gold)" strokeWidth="2" />
      <SuitPath suit="S" x={80} y={120} size={40} fill="var(--gold)" />
    </>
  );
}

/** Statisk kort. */
export const PlayingCard = memo(function PlayingCard({ card, width = 120, faceDown, state, className, title }: PlayingCardProps) {
  const { settings } = useApp();
  const label = card ? cardName(card, settings.lang) : undefined;
  return (
    <svg
      viewBox="0 0 200 280"
      width={width}
      className={`pcard ${state ? 'pcard-' + state : ''} ${className ?? ''}`}
      role="img"
      aria-label={faceDown || !card ? title ?? 'Kort' : title ?? label}
    >
      {faceDown || !card ? <CardBack /> : <CardFace card={card} />}
    </svg>
  );
});

/** Kort der kan vendes med 3D-flip. */
export function FlipCard({ card, flipped, width = 160, onClick }: { card: CardId; flipped: boolean; width?: number | string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={`flip ${flipped ? 'is-flipped' : ''}`}
      style={{ width }}
      onClick={onClick}
      aria-pressed={flipped}
    >
      <span className="flip-inner">
        <span className="flip-face flip-back"><PlayingCard faceDown width="100%" /></span>
        <span className="flip-face flip-front"><PlayingCard card={card} width="100%" /></span>
      </span>
    </button>
  );
}

/** Kompakt kort-chip til lister/tabeller, fx "10♥". */
export function CardChip({ card, size = 'md' }: { card: CardId | null; size?: 'sm' | 'md' | 'lg' }) {
  const { settings } = useApp();
  if (!card) return <span className={`chip chip-${size} chip-empty`}>—</span>;
  const suit = suitOf(card);
  const red = suit === 'H' || suit === 'D';
  return (
    <span className={`chip chip-${size} ${red ? 'chip-red' : 'chip-black'}`} aria-label={cardName(card, settings.lang)}>
      <b>{rankLabel(rankOf(card), settings.danishRanks ? 'da' : 'en')}</b>
      <svg viewBox="0 0 100 100" aria-hidden="true"><path d={SUIT_PATH_CACHE[suit]} fill="currentColor" /></svg>
    </span>
  );
}

