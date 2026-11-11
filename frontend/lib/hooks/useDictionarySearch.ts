'use client';

import { useMemo, useState } from 'react';
import {
  ISL_DICTIONARY,
  getDictionaryCategories,
  type IslDictionaryEntry,
} from '@/lib/data/islDictionary';

/**
 * Search/filter logic for the large ISLRTC word dictionary. Filtering
 * runs client-side over the bundled JSON (a few thousand plain objects),
 * which stays well within an instant, no-lag budget, so no debounce is
 * needed for correctness, only a readable loading state for very brief
 * first paint.
 */
export function useDictionarySearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | 'all'>('all');

  const categories = useMemo(() => getDictionaryCategories(), []);

  const results = useMemo<IslDictionaryEntry[]>(() => {
    const q = query.trim().toLowerCase();
    return ISL_DICTIONARY.filter((entry) => {
      const matchesQuery = !q || entry.word.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || entry.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return { query, setQuery, category, setCategory, categories, results };
}
