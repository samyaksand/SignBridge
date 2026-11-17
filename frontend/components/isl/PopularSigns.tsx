'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DictionaryWordCard } from '@/components/isl/DictionaryWordCard';
import { DictionaryWordDialog } from '@/components/isl/DictionaryWordDialog';
import { ISL_DICTIONARY, type IslDictionaryEntry } from '@/lib/data/islDictionary';

/**
 * Real, everyday words a family uses often, 18 total so the grid fills
 * three full rows of six on desktop. "Please" stands in for "Help" since
 * the verified dictionary has no standalone "Help" entry, the same
 * honest real-substitute pattern used elsewhere on this site.
 */
const POPULAR_WORDS = [
  'Hello',
  'Eat',
  'Drink',
  'Water',
  'Please',
  'Happy',
  'Thank You',
  'Sorry',
  'Love',
  'Mother',
  'Father',
  'Friend',
  'Good Morning',
  'Good Night',
  'School',
  'Milk',
  'Sleep',
  'Bath',
];

export function PopularSigns() {
  const [activeWord, setActiveWord] = useState<IslDictionaryEntry | null>(null);

  const entries = useMemo(
    () =>
      POPULAR_WORDS.map((w) => ISL_DICTIONARY.find((e) => e.word === w)).filter(
        (e): e is IslDictionaryEntry => !!e
      ),
    []
  );

  if (entries.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
          Popular signs
        </h2>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-green-600)] underline"
        >
          See all {ISL_DICTIONARY.length.toLocaleString()} signs <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6" role="list">
        {entries.map((entry) => (
          <div role="listitem" key={entry.id}>
            <DictionaryWordCard entry={entry} onSelect={setActiveWord} />
          </div>
        ))}
      </div>
      <DictionaryWordDialog entry={activeWord} onClose={() => setActiveWord(null)} />
    </div>
  );
}
