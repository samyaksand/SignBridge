import raw from './islSigns.json';

export type SignCategory =
  | 'greetings'
  | 'family'
  | 'food'
  | 'numbers'
  | 'emotions'
  | 'everyday objects'
  | 'daily routines'
  | 'common conversations';

export interface IslSign {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  verifiedTitle: string;
  verifiedViaMethod: 'oembed' | 'direct fetch';
  category: SignCategory;
  explanation: string;
  attribution: string;
  attributionUrl: string;
  collaboration: string;
  sourcePage: string;
  thumbnailUrl: string;
}

interface IslSignsFile {
  _readme: string[];
  signs: IslSign[];
}

const data = raw as IslSignsFile;

/** The full verified ISL reference video library. Every entry here was
 * confirmed real via YouTube's oembed endpoint (see islSigns.json's
 * _readme for the exact verification process). Never add an entry here
 * without a real, fetched videoId. */
export const ISL_SIGNS: IslSign[] = data.signs;

export const ISL_LIBRARY_NOTES: string[] = data._readme;

export function getAllCategories(): SignCategory[] {
  const set = new Set<SignCategory>();
  for (const sign of ISL_SIGNS) set.add(sign.category);
  return Array.from(set);
}

export function getSignsByCategory(category: SignCategory): IslSign[] {
  return ISL_SIGNS.filter((s) => s.category === category);
}

export function getSignById(id: string): IslSign | null {
  return ISL_SIGNS.find((s) => s.id === id) ?? null;
}

export function searchSigns(query: string): IslSign[] {
  const q = query.trim().toLowerCase();
  if (!q) return ISL_SIGNS;
  return ISL_SIGNS.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.explanation.toLowerCase().includes(q)
  );
}

export function getRelatedSigns(sign: IslSign, limit = 3): IslSign[] {
  return ISL_SIGNS.filter((s) => s.category === sign.category && s.id !== sign.id).slice(0, limit);
}

/** Deterministic "sign of the day": same sign all day, changes daily.
 * Based on day-of-year modulo library size, never random. */
export function getSignOfTheDay(date: Date = new Date()): IslSign | null {
  if (ISL_SIGNS.length === 0) return null;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.floor((current - start) / 86400000);
  const index = dayOfYear % ISL_SIGNS.length;
  return ISL_SIGNS[index];
}
