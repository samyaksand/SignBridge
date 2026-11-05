'use client';

import { ExternalLink } from 'lucide-react';
import type { IslSign } from '@/lib/data/islSigns';

/**
 * Renders a real YouTube iframe embed for a verified sign, plus clear
 * attribution to the real source channel. This is the project's only
 * video player: a plain iframe, no extra dependency, and it never claims
 * a video exists unless it is passed a real IslSign from the verified
 * library (lib/data/islSigns.ts).
 */
export function SignVideo({ sign, autoplay = false }: { sign: IslSign; autoplay?: boolean }) {
  const src = `https://www.youtube.com/embed/${sign.videoId}${autoplay ? '?autoplay=1' : ''}`;
  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black">
        <iframe
          key={sign.videoId}
          src={src}
          title={sign.verifiedTitle}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Reference: {sign.attribution}. {sign.collaboration}.{' '}
        <a
          href={sign.attributionUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 font-medium text-[var(--color-teal-600)] underline"
        >
          Watch on YouTube <ExternalLink size={12} aria-hidden="true" />
        </a>
      </p>
    </div>
  );
}
