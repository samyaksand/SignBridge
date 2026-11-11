'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Hand, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { DictionaryWordCard } from '@/components/isl/DictionaryWordCard';
import { DictionaryWordDialog } from '@/components/isl/DictionaryWordDialog';
import { ISL_DICTIONARY, type IslDictionaryEntry } from '@/lib/data/islDictionary';

/**
 * The words a child most often needs to tell a parent: hungry, scared,
 * proud, mother, help, "I love you." Only real dictionary entries are
 * shown, so the closest real matches are used (Eat for hungry, Please
 * for help, Love for "I love you").
 */
const STARTER_WORDS = ['Eat', 'Afraid, Scared', 'Proud', 'Mother', 'Please', 'Love'];

/**
 * Small named phrase packs shown as chips above the starter grid. Every
 * word below was confirmed to exist in lib/data/islDictionary.json before
 * being added here. Where a pack's natural word was not in the real
 * dictionary, the closest real substitute was used and is noted inline,
 * the same honest pattern as STARTER_WORDS above:
 * - Daily needs: everyday routine words a family uses often.
 * - Feelings: core emotion words a child might want to express.
 * - Bedtime: words around the evening routine. "Good Night" stands in
 *   for a bedtime greeting, and "Mother" is included since bedtime is
 *   often a moment a child wants to say something to a parent.
 */
const PHRASE_PACKS: Array<{ id: string; label: string; words: string[] }> = [
  { id: 'daily-needs', label: 'Daily needs', words: ['Eat', 'Drink', 'Water', 'Milk', 'Bath', 'Sleep'] },
  { id: 'feelings', label: 'Feelings', words: ['Happy', 'Sad', 'Afraid, Scared', 'Proud', 'Love'] },
  { id: 'bedtime', label: 'Bedtime', words: ['Sleep', 'Bath', 'Good Night', 'Water', 'Mother'] },
];

/**
 * A live, above-the-fold preview of the real Explore Signs search and
 * card UI, reusing the same dictionary data and components as the full
 * /explore page. Shows the starter set by default; typing a real search
 * term filters across the whole verified dictionary, same as the full
 * page would.
 */
export function HomeExplorePreview() {
  const [query, setQuery] = useState('');
  const [activeWord, setActiveWord] = useState<IslDictionaryEntry | null>(null);
  const [activePackId, setActivePackId] = useState<string | null>(null);

  const starterEntries = useMemo(
    () => STARTER_WORDS.map((w) => ISL_DICTIONARY.find((e) => e.word === w)).filter(
      (e): e is IslDictionaryEntry => !!e
    ),
    []
  );

  const packEntries = useMemo(() => {
    const map = new Map<string, IslDictionaryEntry[]>();
    for (const pack of PHRASE_PACKS) {
      map.set(
        pack.id,
        pack.words
          .map((w) => ISL_DICTIONARY.find((e) => e.word === w))
          .filter((e): e is IslDictionaryEntry => !!e)
      );
    }
    return map;
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ISL_DICTIONARY.filter((entry) => entry.word.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const shown = searchResults ?? (activePackId ? packEntries.get(activePackId) ?? [] : starterEntries);

  const handlePackClick = (packId: string) => {
    setQuery('');
    setActivePackId((current) => (current === packId ? null : packId));
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-md)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Hand size={22} className="text-[var(--color-green-600)]" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-[var(--color-text)] sm:text-2xl">
            Explore Signs
          </h2>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-green-600)] underline"
        >
          See all {ISL_DICTIONARY.length.toLocaleString()} signs <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
        Real ISL reference videos, sourced from the official Indian government ISL dictionary,
        not from a community consent process. Start with words families use every day, or
        search for your own.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Phrase packs">
        {PHRASE_PACKS.map((pack) => (
          <button
            key={pack.id}
            type="button"
            onClick={() => handlePackClick(pack.id)}
            aria-pressed={activePackId === pack.id}
            className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              activePackId === pack.id
                ? 'border-[var(--color-green-500)] bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-green-400)]'
            }`}
          >
            {pack.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="home-explore-search" className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
          Search for any word
        </label>
        <div className="relative max-w-sm">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <Input
            id="home-explore-search"
            placeholder="Try hungry, help, happy..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-5">
        {shown.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No words match your search yet. Try a different spelling, or browse the full
            library.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6" role="list">
            {shown.map((entry) => (
              <div role="listitem" key={`${activePackId ?? 'starter'}-${entry.id}`}>
                <DictionaryWordCard entry={entry} onSelect={setActiveWord} />
              </div>
            ))}
          </div>
        )}
      </div>

      <DictionaryWordDialog entry={activeWord} onClose={() => setActiveWord(null)} />
    </div>
  );
}
