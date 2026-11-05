'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, BookmarkPlus, BookmarkCheck, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { Reveal } from '@/components/Reveal';
import { SignCard } from '@/components/isl/SignCard';
import { SignVideo } from '@/components/isl/SignVideo';
import { usePracticeList } from '@/lib/context/PracticeListContext';
import { useSignSearch } from '@/lib/hooks/useSignSearch';
import { ISL_SIGNS, getRelatedSigns, getSignById, type IslSign } from '@/lib/data/islSigns';

export function ExploreSignsClient() {
  const { query, setQuery, category, setCategory, categories, results } = useSignSearch();
  const { practiceList, addToPracticeList, removeFromPracticeList, isInPracticeList } =
    usePracticeList();
  const searchParams = useSearchParams();
  const signIdFromUrl = searchParams?.get('sign') ?? null;
  const initialSelected =
    (signIdFromUrl ? getSignById(signIdFromUrl) : null) ?? ISL_SIGNS[0] ?? null;
  const [selected, setSelected] = useState<IslSign | null>(initialSelected);
  const [showPracticeDrawer, setShowPracticeDrawer] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
          Explore Signs
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
          A small, honestly verified library of real ISL reference videos. We do not have a
          sign for every word yet. Search or browse by category below.
        </p>
      </Reveal>

      <Reveal delayMs={60} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <Input
            aria-label="Search signs"
            placeholder="Search by word or topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
            className={`min-h-[40px] rounded-full border px-4 text-sm font-medium capitalize transition-colors ${
              category === 'all'
                ? 'border-[var(--color-teal-500)] bg-[var(--color-teal-500)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-teal-400)]'
            }`}
          >
            All ({ISL_SIGNS.length})
          </button>
          {categories.map((c) => {
            const count = ISL_SIGNS.filter((s) => s.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-medium capitalize transition-colors ${
                  category === c
                    ? 'border-[var(--color-teal-500)] bg-[var(--color-teal-500)] text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-teal-400)]'
                }`}
              >
                {c} ({count})
              </button>
            );
          })}
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowPracticeDrawer((v) => !v)}
          aria-expanded={showPracticeDrawer}
        >
          {showPracticeDrawer ? <BookmarkCheck size={16} aria-hidden="true" /> : <BookmarkPlus size={16} aria-hidden="true" />}
          Practice list ({practiceList.length})
        </Button>
      </Reveal>

      {showPracticeDrawer && (
        <Reveal className="mt-4">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">
                Your practice list
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                This list is only for this visit, it clears when you reload.
              </p>
            </div>
            {practiceList.length === 0 ? (
              <StatusMessage kind="empty">
                Nothing saved yet. Use &quot;Save to practice list&quot; on any sign below.
              </StatusMessage>
            ) : (
              <div className="flex flex-wrap gap-2">
                {practiceList.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-sm text-[var(--color-text)]"
                  >
                    {s.title}
                    <button
                      type="button"
                      aria-label={`Remove ${s.title} from practice list`}
                      onClick={() => removeFromPracticeList(s.id)}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <Reveal delayMs={90}>
          {results.length === 0 ? (
            <StatusMessage kind="empty">
              No signs match your search. Try a different word, or clear the category filter.
            </StatusMessage>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1" role="list">
              {results.map((sign) => (
                <div role="listitem" key={sign.id}>
                  <SignCard sign={sign} selected={selected?.id === sign.id} onSelect={setSelected} />
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delayMs={120}>
          {selected ? (
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-[var(--color-text)]">{selected.title}</h2>
              <p className="mt-1 text-sm capitalize text-[var(--color-text-muted)]">
                {selected.category}
              </p>
              <p className="mt-3 text-sm text-[var(--color-text)]">{selected.explanation}</p>
              <div className="mt-4">
                <SignVideo sign={selected} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    isInPracticeList(selected.id)
                      ? removeFromPracticeList(selected.id)
                      : addToPracticeList(selected)
                  }
                  variant={isInPracticeList(selected.id) ? 'secondary' : 'primary'}
                >
                  {isInPracticeList(selected.id) ? (
                    <>
                      <BookmarkCheck size={16} aria-hidden="true" /> Saved to practice list
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={16} aria-hidden="true" /> Save to practice list
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Related signs</h3>
                {getRelatedSigns(selected).length === 0 ? (
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    No other verified signs in this category yet.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {getRelatedSigns(selected).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className="min-h-[36px] rounded-full border border-[var(--color-border)] px-3 text-sm text-[var(--color-text)] hover:border-[var(--color-teal-400)]"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <StatusMessage kind="warning">
              SignBridge does not have any verified reference videos yet. Check back soon.
            </StatusMessage>
          )}
        </Reveal>
      </div>
    </div>
  );
}
