import raw from './islDictionary.json';

/**
 * A single verified entry in SignBridge's ISLRTC word dictionary.
 *
 * This is a DIFFERENT library from islSigns.ts. islSigns.ts holds 10
 * curated, individually-explained NCERT course session videos. This file
 * holds many individual single-word sign clips pulled from the official
 * Indian government ISLRTC dictionary (divyangjan.depwd.gov.in/islrtc).
 * See islDictionary.json's own _readme for the full verification method.
 */
export interface IslDictionaryEntry {
  id: string;
  word: string;
  videoId: string;
  videoUrl: string;
  verifiedTitle: string;
  verifiedViaMethod: 'oembed';
  category: string;
  attribution: string;
  thumbnailUrl: string;
  sourcePage: string;
}

interface IslDictionaryFile {
  _readme: string[];
  entries: IslDictionaryEntry[];
}

const data = raw as IslDictionaryFile;

/** The full verified ISLRTC word dictionary. Every entry here was found via
 * the real site's own alphabetical listing pages and individually confirmed
 * via YouTube's oembed endpoint against the real ISLRTC channel. Never add
 * an entry here without a real, fetched videoId that passed verification. */
export const ISL_DICTIONARY: IslDictionaryEntry[] = data.entries;

export const ISL_DICTIONARY_NOTES: string[] = data._readme;

export function getDictionaryCategories(): string[] {
  const set = new Set<string>();
  for (const entry of ISL_DICTIONARY) set.add(entry.category);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getDictionaryEntriesByCategory(category: string): IslDictionaryEntry[] {
  return ISL_DICTIONARY.filter((e) => e.category === category);
}

export function getDictionaryEntryById(id: string): IslDictionaryEntry | null {
  return ISL_DICTIONARY.find((e) => e.id === id) ?? null;
}

export function searchDictionary(query: string, category: string | 'all' = 'all'): IslDictionaryEntry[] {
  const q = query.trim().toLowerCase();
  return ISL_DICTIONARY.filter((e) => {
    const matchesQuery = !q || e.word.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    const matchesCategory = category === 'all' || e.category === category;
    return matchesQuery && matchesCategory;
  });
}
