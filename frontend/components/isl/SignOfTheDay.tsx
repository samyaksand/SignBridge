'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { SignVideo } from '@/components/isl/SignVideo';
import { getSignOfTheDay, getRelatedSigns } from '@/lib/data/islSigns';

// How many signs to show in the "pack of the day": the deterministic sign
// of the day itself, plus a few related signs from the same category.
// Capped between 3 and 5 depending on how many related signs actually
// exist, never padded with anything fabricated.
const PACK_SIZE = 5;

export function SignOfTheDay() {
  const sign = getSignOfTheDay();
  const [replayKey, setReplayKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!sign) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Sign of the day</h2>
        <StatusMessage kind="warning">
          SignBridge does not have any verified ISL reference videos yet. Check back soon, or
          visit Explore Signs for updates.
        </StatusMessage>
      </Card>
    );
  }

  const related = getRelatedSigns(sign, PACK_SIZE - 1);
  const pack = [sign, ...related];
  const active = pack[activeIndex] ?? sign;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Sign pack of the day</h2>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs capitalize text-[var(--color-text-muted)]">
          {active.category}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {pack.length === 1
          ? 'A sign to learn today.'
          : `${pack.length} signs to learn today, starting with the sign of the day.`}
      </p>

      {pack.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Signs in today's pack">
          {pack.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveIndex(i);
                setReplayKey((k) => k + 1);
              }}
              aria-pressed={activeIndex === i}
              className={`min-h-[36px] rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeIndex === i
                  ? 'border-[var(--color-gold-500)] bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-green-400)]'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      <h3 className="mt-3 text-xl font-semibold text-[var(--color-gold-500)]">{active.title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{active.explanation}</p>

      <div className="mt-4" key={replayKey}>
        <SignVideo sign={active} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="md" onClick={() => setReplayKey((k) => k + 1)}>
          <RotateCcw size={16} aria-hidden="true" />
          Replay
        </Button>
        <Link
          href={`/explore?sign=${active.id}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-green-400)]"
        >
          Learn this sign <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
