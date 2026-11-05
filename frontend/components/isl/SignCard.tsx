'use client';

import Image from 'next/image';
import type { IslSign } from '@/lib/data/islSigns';

export function SignCard({
  sign,
  onSelect,
  selected = false,
}: {
  sign: IslSign;
  onSelect: (sign: IslSign) => void;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(sign)}
      aria-pressed={selected}
      className={`flex w-full flex-col gap-2 rounded-[var(--radius-md)] border p-3 text-left transition-colors ${
        selected
          ? 'border-[var(--color-indigo-500)] bg-[var(--color-indigo-500)]/10'
          : 'border-[var(--color-border)] hover:border-[var(--color-teal-400)]'
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)]">
        {/* Real oembed-sourced thumbnail for a verified video id, never a stock photo. */}
        <Image
          src={sign.thumbnailUrl}
          alt=""
          aria-hidden="true"
          fill
          unoptimized
          className="object-cover"
        />
      </div>
      <span className="text-sm font-semibold text-[var(--color-text)]">{sign.title}</span>
      <span className="text-xs capitalize text-[var(--color-text-muted)]">{sign.category}</span>
    </button>
  );
}
