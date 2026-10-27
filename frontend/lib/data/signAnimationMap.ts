/**
 * Generic mapping from a sign label to an animation clip name/index on the
 * currently loaded avatar model.
 *
 * IMPORTANT, read before editing: every entry below is a PLACEHOLDER/DEMO
 * mapping only. The clip names refer to generic motion available on the
 * sample Khronos "CesiumMan" model (see frontend/public/avatars/LICENSE.md),
 * which has no Indian Sign Language (ISL) content at all. Nothing in this
 * file should ever be presented to a user as a verified ISL sign. It exists
 * so the animation-mapping plumbing is ready to be populated with real,
 * verified ISL clip data later, once such clips exist.
 */

export interface SignAnimationEntry {
  /** Lowercased, trimmed English phrase this entry matches. */
  label: string;
  /** Name of the animation clip on the loaded GLB, or null if none assigned. */
  clipName: string | null;
  /** Always false until real verified ISL clips are wired in. Never set true for placeholder data. */
  verifiedIsl: boolean;
  /** Short human-readable note shown in dev tooling / tests, never user-facing copy. */
  note: string;
}

/**
 * Demo-only placeholder entries. These intentionally reuse the single demo
 * clip from the generic sample model so the framework has something real to
 * play, not because this movement means anything in ISL.
 */
export const SIGN_ANIMATION_MAP: SignAnimationEntry[] = [
  {
    label: 'i need help',
    clipName: 'animation_0',
    verifiedIsl: false,
    note: 'Placeholder demo clip only, generic sample model motion, not an ISL sign.',
  },
  {
    label: 'thank you',
    clipName: 'animation_0',
    verifiedIsl: false,
    note: 'Placeholder demo clip only, generic sample model motion, not an ISL sign.',
  },
];

export const NEUTRAL_IDLE_CLIP_NAME = null;

/**
 * Looks up the animation clip name for a requested sign label. Always falls
 * back safely to a neutral idle pose (null clip name) for unknown labels, it
 * never throws and never fabricates a plausible-looking match.
 */
export function resolveAnimationClip(label: string): SignAnimationEntry {
  const normalized = label.trim().toLowerCase();
  const found = SIGN_ANIMATION_MAP.find((entry) => entry.label === normalized);
  if (found) return found;
  return {
    label: normalized,
    clipName: NEUTRAL_IDLE_CLIP_NAME,
    verifiedIsl: false,
    note: 'No mapping found, falling back to neutral idle pose.',
  };
}
