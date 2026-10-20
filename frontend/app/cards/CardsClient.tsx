'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Search, X, Volume2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { usePreferences } from '@/lib/context/PreferencesContext';
import cardsData from '@/lib/data/communicationCards.json';

interface CardEntry {
  id: string;
  category: string;
  en: string;
  hi: string;
  illustration: string;
  verificationStatus: string;
}

const CARDS = cardsData as CardEntry[];
const CATEGORIES = Array.from(new Set(CARDS.map((c) => c.category)));

export function CardsClient() {
  const { speechEnabled, speechSupported } = usePreferences();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [message, setMessage] = useState<CardEntry[]>([]);

  const filtered = useMemo(() => {
    return CARDS.filter((c) => {
      const matchesQuery =
        !query.trim() ||
        c.en.toLowerCase().includes(query.toLowerCase()) ||
        c.hi.includes(query);
      const matchesCategory = !category || c.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const addToMessage = (card: CardEntry) => setMessage((m) => [...m, card]);
  const removeWord = (index: number) =>
    setMessage((m) => m.filter((_, i) => i !== index));
  const clearMessage = () => setMessage([]);

  const speak = () => {
    if (message.length === 0) return;
    // Speech is gated by the Communication Preferences "Speech" setting on
    // the homepage, in addition to actual browser support.
    if (!speechEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(message.map((c) => c.en).join('. '));
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
        Quick Communication Cards
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-muted)]">
        Pick a card to say what you need right now. These are simple communication helpers,
        not verified ISL signs yet.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <Input
            aria-label="Search cards"
            placeholder="Search for a word or phrase..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <button
          onClick={() => setCategory(null)}
          aria-pressed={category === null}
          className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${
            category === null
              ? 'border-[var(--color-indigo-500)] bg-[var(--color-indigo-500)] text-white'
              : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-indigo-400)]'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            aria-pressed={category === cat}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${
              category === cat
                ? 'border-[var(--color-indigo-500)] bg-[var(--color-indigo-500)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-indigo-400)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {message.length > 0 && (
        <div className="sticky top-16 z-10 mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 shadow-[var(--shadow-md)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">Your message:</span>
            {message.map((c, i) => (
              <button
                key={`${c.id}-${i}`}
                onClick={() => removeWord(i)}
                aria-label={`Remove ${c.en} from message`}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-surface-muted)] px-3 text-sm text-[var(--color-text)]"
              >
                {c.en} <X size={14} aria-hidden="true" />
              </button>
            ))}
            <div className="ml-auto flex gap-2">
              <Button
                size="md"
                onClick={speak}
                disabled={!speechSupported || !speechEnabled}
                title={
                  !speechSupported
                    ? 'Speech is not supported in this browser'
                    : !speechEnabled
                      ? 'Speech is turned off in Communication Preferences'
                      : undefined
                }
              >
                <Volume2 size={16} aria-hidden="true" />
                Speak
              </Button>
              <Button size="md" variant="secondary" onClick={clearMessage}>
                Clear message
              </Button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-8">
          <StatusMessage kind="empty">
            No cards match your search. Try a different word, or clear your filters.
          </StatusMessage>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((card) => (
            <button
              key={card.id}
              onClick={() => addToMessage(card)}
              className="flex min-h-[48px] flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 text-center transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-[var(--color-teal-400)] hover:shadow-[var(--shadow-md)]"
            >
              <Image src={card.illustration} alt="" width={56} height={56} aria-hidden="true" />
              <span className="text-xs font-semibold text-[var(--color-text)]">{card.en}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{card.hi}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
