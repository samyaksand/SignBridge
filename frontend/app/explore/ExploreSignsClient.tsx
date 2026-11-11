'use client';

import { useState } from 'react';
import { Search, Library, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { Reveal } from '@/components/Reveal';
import { DictionaryWordCard } from '@/components/isl/DictionaryWordCard';
import { DictionaryWordDialog } from '@/components/isl/DictionaryWordDialog';
import { DailyPracticeChecklist } from '@/components/isl/DailyPracticeChecklist';
import { useDictionarySearch } from '@/lib/hooks/useDictionarySearch';
import { ISL_DICTIONARY, type IslDictionaryEntry } from '@/lib/data/islDictionary';

export function ExploreSignsClient() {
  const dict = useDictionarySearch();
  const [activeWord, setActiveWord] = useState<IslDictionaryEntry | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <div className="flex items-center gap-2">
          <Library size={24} className="text-[var(--color-green-600)]" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
            Explore Signs
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          {ISL_DICTIONARY.length.toLocaleString()} real, individually verified single-word sign
          videos from the official Indian government ISL dictionary (
          <a
            href="https://divyangjan.depwd.gov.in/islrtc/"
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            divyangjan.depwd.gov.in/islrtc
          </a>
          ). Each one was checked against YouTube&apos;s own data before being added here. We do
          not have a sign for every word yet, search or browse by category below.
        </p>
      </Reveal>

      <Reveal
        delayMs={45}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]"
      >
        <BadgeCheck size={14} className="text-[var(--color-green-600)]" aria-hidden="true" />
        Sourced and verified against ISLRTC / divyangjan.depwd.gov.in
      </Reveal>

      <Reveal delayMs={55} className="mt-5">
        <DailyPracticeChecklist onSelectWord={setActiveWord} />
      </Reveal>

      <Reveal delayMs={60} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="explore-search" className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
            Search for any word
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <Input
              id="explore-search"
              placeholder="Search for any word..."
              value={dict.query}
              onChange={(e) => dict.setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Reveal>

      <Reveal delayMs={90} className="mt-3 flex flex-wrap gap-2">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => dict.setCategory('all')}
            aria-pressed={dict.category === 'all'}
            className={`inline-flex min-h-[44px] items-center rounded-full border px-3 text-xs font-medium capitalize transition-colors ${
              dict.category === 'all'
                ? 'border-[var(--color-green-500)] bg-[var(--color-green-500)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-green-400)]'
            }`}
          >
            All words ({ISL_DICTIONARY.length})
          </button>
          {dict.categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => dict.setCategory(c)}
              aria-pressed={dict.category === c}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-3 text-xs font-medium capitalize transition-colors ${
                dict.category === c
                  ? 'border-[var(--color-green-500)] bg-[var(--color-green-500)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-green-400)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-6">
        {dict.results.length === 0 ? (
          <StatusMessage kind="empty">
            No words match your search. Try a different spelling, or clear the category filter.
          </StatusMessage>
        ) : (
          <>
            <p className="mb-3 text-xs text-[var(--color-text-muted)]">
              Showing {dict.results.length.toLocaleString()} word
              {dict.results.length === 1 ? '' : 's'}
            </p>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              role="list"
            >
              {dict.results.slice(0, 200).map((entry) => (
                <div role="listitem" key={entry.id}>
                  <DictionaryWordCard entry={entry} onSelect={setActiveWord} />
                </div>
              ))}
            </div>
            {dict.results.length > 200 && (
              <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
                Showing the first 200 matches. Narrow your search or category to see more
                specific words.
              </p>
            )}
          </>
        )}
      </div>

      <DictionaryWordDialog entry={activeWord} onClose={() => setActiveWord(null)} />
    </div>
  );
}
