/** Tegner cheat sheets direkte på canvas og eksporterer som PNG (A4-format, printvenligt). */
import { type CardId, RANKS, SUITS, type Suit, rankLabel, rankOf, suitOf } from '../data/cards';
import { SUIT_PATHS } from '../components/SuitIcon';

const W = 1240;
const H = 1754;
const RED = '#c62828';
const BLACK = '#15181c';
const GOLD = '#a8841c';

function suit(ctx: CanvasRenderingContext2D, s: Suit, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = s === 'H' || s === 'D' ? RED : BLACK;
  ctx.fill(new Path2D(SUIT_PATHS[s]));
  ctx.restore();
}

function header(ctx: CanvasRenderingContext2D, title: string, sub: string) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#0b1d17';
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = '#d4af37';
  ctx.font = '700 56px "Playfair Display", Georgia, serif';
  ctx.fillText(title, 70, 92);
  ctx.fillStyle = '#cfd8d3';
  ctx.font = '500 26px "Inter Variable", system-ui, sans-serif';
  ctx.fillText(sub, 72, 130);
}

function cardText(ctx: CanvasRenderingContext2D, c: CardId, x: number, y: number, size: number, danish: boolean) {
  const s = suitOf(c);
  ctx.fillStyle = s === 'H' || s === 'D' ? RED : BLACK;
  ctx.font = `800 ${size}px "Inter Variable", system-ui, sans-serif`;
  const label = rankLabel(rankOf(c), danish ? 'da' : 'en');
  ctx.fillText(label, x, y);
  const w = ctx.measureText(label).width;
  suit(ctx, s, x + w + 6, y - size * 0.82, size * 0.85);
}

export async function renderListPng(name: string, order: CardId[], danish: boolean, sub: string): Promise<Blob> {
  await document.fonts?.ready;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  header(ctx, `${name} · 1–52`, sub);
  const colW = (W - 140) / 4;
  const rowH = (H - 260) / 13;
  for (let i = 0; i < 52; i++) {
    const col = Math.floor(i / 13);
    const row = i % 13;
    const x = 70 + col * colW;
    const y = 220 + row * rowH;
    if (row % 2 === 0) { ctx.fillStyle = '#f6f2e6'; ctx.fillRect(x - 10, y - 62, colW - 10, rowH - 4); }
    ctx.fillStyle = GOLD;
    ctx.font = '800 40px "Inter Variable", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1), x + 60, y);
    ctx.textAlign = 'left';
    cardText(ctx, order[i], x + 90, y, 46, danish);
  }
  return new Promise((r) => c.toBlob((b) => r(b!), 'image/png'));
}

export async function renderGridPng(name: string, order: CardId[], danish: boolean, sub: string): Promise<Blob> {
  await document.fonts?.ready;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  header(ctx, `${name} · 52-grid`, sub);
  const pos = new Map(order.map((card, i) => [card, i + 1]));
  // Liggende tabel: rækker = værdier (13), kolonner = kulører (4)
  const left = 220;
  const top = 260;
  const colW = (W - left - 70) / 4;
  const rowH = (H - top - 60) / 13;
  SUITS.forEach((s, j) => suit(ctx, s, left + j * colW + colW / 2 - 30, 180, 60));
  RANKS.forEach((r, i) => {
    const y = top + i * rowH;
    if (i % 2 === 0) { ctx.fillStyle = '#f6f2e6'; ctx.fillRect(70, y, W - 140, rowH); }
    ctx.fillStyle = BLACK;
    ctx.font = '800 46px "Inter Variable", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(rankLabel(r, danish ? 'da' : 'en'), 140, y + rowH * 0.68);
    SUITS.forEach((s, j) => {
      const p = pos.get(`${r}${s}` as CardId);
      ctx.fillStyle = s === 'H' || s === 'D' ? RED : BLACK;
      ctx.font = '700 48px "Inter Variable", system-ui, sans-serif';
      ctx.fillText(p ? String(p) : '–', left + j * colW + colW / 2, y + rowH * 0.68);
    });
    ctx.textAlign = 'left';
  });
  return new Promise((r) => c.toBlob((b) => r(b!), 'image/png'));
}
