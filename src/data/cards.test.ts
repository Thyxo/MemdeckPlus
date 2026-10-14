import { describe, expect, it } from 'vitest';
import { ALL_CARDS, NEW_DECK_ORDER, parseCard, parseCardList, validateOrder } from './cards';
import { MNEMONICA, eightKings, siStebbins } from './stacks';
import { findPatterns } from '../lib/patterns';
import { buildDailyQueue, review, isMastered } from '../lib/srs';

describe('cards', () => {
  it('har 52 unikke kort', () => {
    expect(new Set(ALL_CARDS).size).toBe(52);
    expect(new Set(NEW_DECK_ORDER).size).toBe(52);
  });
  it('parser mange formater', () => {
    expect(parseCard('4C')).toBe('4C');
    expect(parseCard('th')).toBe('10H');
    expect(parseCard('10♦')).toBe('10D');
    expect(parseCard('A♠')).toBe('AS');
    expect(parseCard('BH')).toBe('JH');
    expect(parseCard('DS')).toBe('QS');
    expect(parseCard('XX')).toBeNull();
    expect(parseCardList('4♣2♥7♦').cards).toEqual(['4C', '2H', '7D']);
    expect(parseCardList('1. 4C, 2: 2H; 3) 7D').cards).toEqual(['4C', '2H', '7D']);
  });
  it('validerer dubletter og manglende', () => {
    const order = [...MNEMONICA] as (typeof MNEMONICA[number] | null)[];
    order[1] = '4C';
    order[51] = null;
    const v = validateOrder(order);
    expect(v.ok).toBe(false);
    expect(v.duplicates[0]).toEqual({ card: '4C', positions: [1, 2] });
    expect(v.missing.sort()).toEqual(['2H', '9D'].sort());
    expect(v.empty).toEqual([52]);
  });
});

describe('stacks', () => {
  it('Mnemonica er komplet og korrekt forankret', () => {
    expect(validateOrder(MNEMONICA).ok).toBe(true);
    expect(MNEMONICA[0]).toBe('4C');
    expect(MNEMONICA[8]).toBe('9S');
    expect(MNEMONICA[25]).toBe('KD');
    expect(MNEMONICA[51]).toBe('9D');
  });
  it('Si Stebbins og Eight Kings er gyldige', () => {
    expect(validateOrder(siStebbins()).ok).toBe(true);
    expect(siStebbins().slice(0, 4)).toEqual(['AC', '4H', '7S', '10D']);
    expect(validateOrder(eightKings()).ok).toBe(true);
  });
  it('finder mønstre i Mnemonica', () => {
    const p = findPatterns(MNEMONICA);
    expect(p.some((x) => x.kind === 'valuePos' && x.positions[0] === 9)).toBe(true); // 9♠ på 9
    expect(p.filter((x) => x.kind === 'fours')).toHaveLength(13);
  });
});

describe('srs (Leitner)', () => {
  it('rykker op ved rigtigt svar og ned ved forkert', () => {
    let it1 = review(undefined, true, 1000, '2026-01-01');
    expect(it1.box).toBe(1);
    expect(it1.due).toBe('2026-01-01');
    it1 = review(it1, true, 1000, '2026-01-01');
    expect(it1.box).toBe(2);
    expect(it1.due).toBe('2026-01-02');
    const notDue = review(it1, true, 1000, '2026-01-01');
    expect(notDue.box).toBe(2);
    const wrong = review(it1, false, 1000, '2026-01-01');
    expect(wrong.box).toBe(1);
  });
  it('bygger dagens kø med nye kort', () => {
    const q = buildDailyQueue(MNEMONICA, {}, { dirs: ['c2p', 'p2c'], size: 20, newLimit: 5 });
    expect(q).toHaveLength(10);
    expect(new Set(q.map((x) => x.card)).size).toBe(5);
    expect(isMastered({}, '4C')).toBe(false);
  });
});
