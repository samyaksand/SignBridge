'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import type { IslDictionaryEntry } from '@/lib/data/islDictionary';

/**
 * A single word card in the ISLRTC dictionary grid. Shows the real,
 * oembed-sourced YouTube thumbnail with a graceful fallback if the image
 * fails to load, so a bad network response never leaves a broken image
 * icon or an empty gap in the grid.
 */
export function DictionaryWordCard({
  entry,
  onSelect,
}: {
  entry: IslDictionaryEntry;
  onSelect: (entry: IslDictionaryEntry) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="sb-word-card group flex w-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-left"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-surface-muted)]">
        {imgFailed ? (
          <div className="sb-thumb-fallback">
            <ImageOff size={24} aria-hidden="true" />
          </div>
        ) : (
          <Image
            src={entry.thumbnailUrl}
            alt=""
            aria-hidden="true"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-sm font-semibold capitalize text-[var(--color-text)]">
          {entry.word}
        </span>
        <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] font-medium capitalize text-[var(--color-text-muted)]">
          {entry.category}
        </span>
      </div>
    </button>
  );
}
