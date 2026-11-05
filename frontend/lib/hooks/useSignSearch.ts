'use client';

import { useMemo, useState } from 'react';
import { ISL_SIGNS, getAllCategories, type IslSign, type SignCategory } from '@/lib/data/islSigns';

/**
 * Shared search/filter logic for the verified ISL sign library, used by
 * both Explore Signs and Parent Mode so the matching behavior never
 * drifts between the two surfaces.
 */
export function useSignSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SignCategory | 'all'>('all');

  const categories = useMemo(() => getAllCategories(), []);

  const results = useMemo<IslSign[]>(() => {
    const q = query.trim().toLowerCase();
    return ISL_SIGNS.filter((sign) => {
      const matchesQuery =
        !q ||
        sign.title.toLowerCase().includes(q) ||
        sign.category.toLowerCase().includes(q) ||
        sign.explanation.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || sign.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return { query, setQuery, category, setCategory, categories, results };
}
