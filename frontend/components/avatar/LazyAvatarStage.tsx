'use client';

import dynamic from 'next/dynamic';
import { AvatarPanel } from '@/components/AvatarPanel';
import type { AvatarStageProps } from './AvatarStage';

/**
 * Dynamically-imported wrapper around AvatarStage so the Three.js/
 * @react-three/fiber bundle is only fetched when Parent Mode actually
 * renders this component, never as part of the initial/shared bundle or
 * other routes.
 */
const AvatarStage = dynamic<AvatarStageProps>(
  () => import('./AvatarStage').then((m) => m.AvatarStage),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square w-full max-w-sm items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-navy-border)] bg-[var(--color-navy-800)] text-sm text-[var(--color-navy-text-muted)]">
        Loading avatar...
      </div>
    ),
  }
);

export function LazyAvatarStage(props: AvatarStageProps) {
  return <AvatarStage {...props} />;
}

export { AvatarPanel as AvatarStageFallbackPanel };
