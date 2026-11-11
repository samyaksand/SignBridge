'use client';

import { useMemo, useState } from 'react';
import { Shuffle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ISL_DICTIONARY, type IslDictionaryEntry } from '@/lib/data/islDictionary';
import { useLearnedWords } from '@/lib/hooks/useLearnedWords';

const WORDS_PER_SET = 5;

function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function pickTodaysWords(learnedIds: string[]): IslDictionaryEntry[] {
  const notLearned = ISL_DICTIONARY.filter((entry) => !learnedIds.includes(entry.id));
  if (notLearned.length >= WORDS_PER_SET) {
    return pickRandom(notLearned, WORDS_PER_SET);
  }
  // Everything (or almost everything) is already learned, fall back to a
  // fully random set so the checklist still has something to show.
  return pickRandom(ISL_DICTIONARY, WORDS_PER_SET);
}

/**
 * "Give me 5 words to learn today": a small, honest checklist that picks
 * 5 random dictionary words (preferring words not yet marked learned),
 * lets the user check them off, and reopens the real word dialog when a
 * word is clicked. Learned state lives only in localStorage on this
 * device (see useLearnedWords), nothing is sent anywhere, and no
 * progress numbers here are invented, they are a plain count of what the
 * user actually checked off.
 */
export function DailyPracticeChecklist({
  onSelectWord,
}: {
  onSelectWord: (entry: IslDictionaryEntry) => void;
}) {
  const { learnedIds, isLearned, toggleLearned } = useLearnedWords();
  const [todaysWords, setTodaysWords] = useState<IslDictionaryEntry[]>(() =>
    pickTodaysWords([])
  );

  const learnedCount = useMemo(
    () => todaysWords.filter((entry) => isLearned(entry.id)).length,
    [todaysWords, isLearned]
  );

  const reroll = () => {
    setTodaysWords(pickTodaysWords(learnedIds));
  };

  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            5 words to learn today
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {learnedCount} of {todaysWords.length} learned today
          </p>
        </div>
        <Button type="button" variant="secondary" size="md" onClick={reroll}>
          <Shuffle size={16} aria-hidden="true" />
          Give me a new set
        </Button>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {todaysWords.map((entry) => {
          const learned = isLearned(entry.id);
          return (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
            >
              <button
                type="button"
                onClick={() => toggleLearned(entry.id)}
                aria-pressed={learned}
                aria-label={learned ? `Mark ${entry.word} as not learned yet` : `Mark ${entry.word} as learned`}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  learned
                    ? 'border-[var(--color-green-500)] bg-[var(--color-green-500)] text-white'
                    : 'border-[var(--color-border)] text-transparent'
                }`}
              >
                <Check size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onSelectWord(entry)}
                className={`flex-1 text-left text-sm font-medium capitalize text-[var(--color-text)] ${
                  learned ? 'line-through opacity-60' : ''
                }`}
              >
                {entry.word}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
