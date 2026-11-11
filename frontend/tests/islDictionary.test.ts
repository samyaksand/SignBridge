import { describe, expect, it } from 'vitest';
import { ISL_DICTIONARY, getDictionaryCategories } from '@/lib/data/islDictionary';
import { ISL_SIGNS } from '@/lib/data/islSigns';

describe('ISL_DICTIONARY data integrity', () => {
  it('has no duplicate word entries (same word listed twice)', () => {
    const words = ISL_DICTIONARY.map((e) => e.word.trim().toLowerCase());
    const unique = new Set(words);
    expect(unique.size).toBe(words.length);
  });

  it('has no duplicate ids', () => {
    const ids = ISL_DICTIONARY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never maps the same real video id to two different words', () => {
    const videoToWord = new Map<string, string>();
    for (const entry of ISL_DICTIONARY) {
      const existing = videoToWord.get(entry.videoId);
      if (existing) {
        expect(existing.toLowerCase()).toBe(entry.word.toLowerCase());
      } else {
        videoToWord.set(entry.videoId, entry.word);
      }
    }
  });

  it('every entry has a real-looking YouTube video id and oembed verification method', () => {
    for (const entry of ISL_DICTIONARY) {
      expect(entry.videoId.length).toBeGreaterThanOrEqual(6);
      expect(entry.verifiedViaMethod).toBe('oembed');
      expect(entry.videoUrl).toContain(entry.videoId);
      expect(entry.attribution.length).toBeGreaterThan(0);
    }
  });

  it('getDictionaryCategories returns only categories actually present in the data', () => {
    const categories = getDictionaryCategories();
    const presentCategories = new Set(ISL_DICTIONARY.map((e) => e.category));
    for (const c of categories) {
      expect(presentCategories.has(c)).toBe(true);
    }
  });

  it('the original 10 curated islSigns entries remain intact and untouched', () => {
    expect(ISL_SIGNS.length).toBe(10);
    for (const sign of ISL_SIGNS) {
      expect(sign.verifiedViaMethod).toBe('oembed');
      expect(sign.videoId.length).toBeGreaterThan(0);
    }
  });
});
