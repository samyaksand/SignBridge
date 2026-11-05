'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { SignVideo } from '@/components/isl/SignVideo';
import { getSignOfTheDay, getRelatedSigns } from '@/lib/data/islSigns';

export function SignOfTheDay() {
  const sign = getSignOfTheDay();
  const [replayKey, setReplayKey] = useState(0);

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

  const related = getRelatedSigns(sign);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Sign of the day</h2>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs capitalize text-[var(--color-text-muted)]">
          {sign.category}
        </span>
      </div>
      <h3 className="mt-2 text-xl font-semibold text-[var(--color-indigo-500)]">{sign.title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{sign.explanation}</p>

      <div className="mt-4" key={replayKey}>
        <SignVideo sign={sign} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="md" onClick={() => setReplayKey((k) => k + 1)}>
          <RotateCcw size={16} aria-hidden="true" />
          Replay
        </Button>
        <Link
          href={`/explore?sign=${sign.id}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 text-sm font-medium text-[var(--color-text)] hover:border-[var(--color-teal-400)]"
        >
          Learn this sign <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-5 border-t border-[var(--color-border)] pt-4">
          <h4 className="text-sm font-semibold text-[var(--color-text)]">Related signs</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/explore?sign=${r.id}`}
                className="min-h-[36px] rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:border-[var(--color-teal-400)]"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
