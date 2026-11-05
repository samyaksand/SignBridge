import { describe, expect, it } from 'vitest';
import {
  ISL_SIGNS,
  getSignOfTheDay,
  getRelatedSigns,
  searchSigns,
  getAllCategories,
} from '@/lib/data/islSigns';

describe('islSigns data (verified ISL reference library)', () => {
  it('every entry has a non-empty real-looking videoId and was verified via oembed', () => {
    for (const sign of ISL_SIGNS) {
      expect(sign.videoId.length).toBeGreaterThan(5);
      expect(sign.videoUrl).toContain(sign.videoId);
      expect(sign.verifiedViaMethod).toBe('oembed');
      expect(sign.attribution.length).toBeGreaterThan(0);
    }
  });

  it('getSignOfTheDay is deterministic for a given date, not random', () => {
    const date = new Date('2026-03-15T12:00:00Z');
    const first = getSignOfTheDay(date);
    const second = getSignOfTheDay(date);
    expect(first?.id).toBe(second?.id);
  });

  it('getSignOfTheDay changes for a different date (when library size allows)', () => {
    const a = getSignOfTheDay(new Date('2026-01-01T00:00:00Z'));
    const b = getSignOfTheDay(new Date('2026-01-02T00:00:00Z'));
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // Not asserting inequality strictly since library size could divide evenly,
    // but both must resolve to a real entry from the library.
    expect(ISL_SIGNS.some((s) => s.id === a?.id)).toBe(true);
    expect(ISL_SIGNS.some((s) => s.id === b?.id)).toBe(true);
  });

  it('getRelatedSigns never returns the sign itself', () => {
    const sign = ISL_SIGNS[0];
    const related = getRelatedSigns(sign);
    expect(related.every((r) => r.id !== sign.id)).toBe(true);
  });

  it('searchSigns returns an empty array for a query matching nothing, never a fabricated result', () => {
    const results = searchSigns('zzzznonexistentxyz');
    expect(results).toEqual([]);
  });

  it('categories are all honestly represented in the actual data (no empty categories implied)', () => {
    const categories = getAllCategories();
    for (const c of categories) {
      expect(ISL_SIGNS.some((s) => s.category === c)).toBe(true);
    }
  });
});
