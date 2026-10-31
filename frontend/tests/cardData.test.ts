import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cards from '@/lib/data/communicationCards.json';

interface CardEntry {
  id: string;
  category: string;
  en: string;
  hi: string;
  illustration: string;
  verificationStatus: string;
}

const CARDS = cards as CardEntry[];
const REQUIRED_CATEGORIES = [
  'Basic needs',
  'Feelings',
  'Health and safety',
  'Family and home',
  'School and learning',
  'Everyday conversation',
];

describe('communication card data integrity', () => {
  it('has exactly 36 cards', () => {
    expect(CARDS).toHaveLength(36);
  });

  it('has unique ids', () => {
    const ids = CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 6 categories with 6 cards each', () => {
    for (const category of REQUIRED_CATEGORIES) {
      const count = CARDS.filter((c) => c.category === category).length;
      expect(count).toBe(6);
    }
  });

  it('every card has all required fields filled in', () => {
    for (const card of CARDS) {
      expect(card.id).toBeTruthy();
      expect(card.category).toBeTruthy();
      expect(card.en).toBeTruthy();
      expect(card.hi).toBeTruthy();
      expect(card.illustration).toBeTruthy();
      expect(card.verificationStatus).toBe('unverified-placeholder');
    }
  });

  it('every illustration path resolves to a real file under frontend/public', () => {
    // card.illustration is an absolute-from-public path like
    // "/images/cards/basic-01.svg", as served by Next.js static assets.
    const publicDir = join(__dirname, '..', 'public');
    for (const card of CARDS) {
      expect(card.illustration.startsWith('/')).toBe(true);
      const resolved = join(publicDir, card.illustration);
      expect(existsSync(resolved)).toBe(true);
    }
  });

  it('every card id is used by exactly one illustration file (no accidental sharing)', () => {
    const illustrations = CARDS.map((c) => c.illustration);
    expect(new Set(illustrations).size).toBe(illustrations.length);
  });
});
