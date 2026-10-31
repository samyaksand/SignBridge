/**
 * Generic mapping from a sign label to an animation clip name/index on the
 * currently loaded avatar model.
 *
 * IMPORTANT, read before editing: every entry below is a PLACEHOLDER/DEMO
 * mapping only. The clip names refer to generic motion available on the
 * sample Khronos "CesiumMan" model (see frontend/public/avatars/LICENSE.md),
 * which has no Indian Sign Language (ISL) content at all and, critically,
 * has NO finger or hand bones in its rig at all (verified by directly
 * parsing the GLB's glTF JSON, see LICENSE.md for the investigation). It is
 * physically incapable of showing distinct hand shapes.
 *
 * The clips referenced here (gesture_*) are built programmatically in
 * frontend/components/avatar/gestureClips.ts from real keyframes applied to
 * this rig's actual arm/torso/neck joints. They give each curated phrase a
 * genuinely distinct body-level animation (different joints, timing, and
 * pose), but they are simplified reference gestures, not hand shapes, and
 * absolutely NOT verified ISL signs. Nothing in this file should ever be
 * presented to a user as a verified ISL sign. It exists so the
 * animation-mapping plumbing is ready to be populated with real, verified
 * ISL clip data later, once such clips exist.
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

const PLACEHOLDER_NOTE =
  'Placeholder demonstration only: simplified body/arm gesture built on a generic sample rig with no hand or finger bones. Not a verified ISL sign.';

/**
 * Demo-only placeholder entries. Phrases are reused from the project's
 * existing communication cards and quick messages (see
 * frontend/lib/data/communicationCards.json and
 * frontend/lib/data/quickMessages.ts) so the same wording works consistently
 * across Parent Mode, Quick Cards, and Family Practice. Each entry's
 * clipName points at a visually distinct gesture clip (different joints
 * and/or timing), never the same motion relabeled under a new name.
 */
export const SIGN_ANIMATION_MAP: SignAnimationEntry[] = [
  { label: 'i need help', clipName: 'gesture_self_point_pulse', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i need help with this', clipName: 'gesture_self_point_pulse', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'thank you', clipName: 'gesture_hands_together_chest', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'hello', clipName: 'gesture_wave_greeting', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'hello!', clipName: 'gesture_wave_greeting', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'yes', clipName: 'gesture_nod_affirm', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'no', clipName: 'gesture_head_shake_negate', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i love you', clipName: 'gesture_cross_arms_embrace', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i am proud of you', clipName: 'gesture_cross_arms_embrace', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i am hungry', clipName: 'gesture_self_point_pulse', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'are you hungry?', clipName: 'gesture_self_point_pulse', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i need water', clipName: 'gesture_offer_forward', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i need food', clipName: 'gesture_offer_forward', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'please wait', clipName: 'gesture_palm_hold_wait', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'it is time to go', clipName: 'gesture_arm_sweep_point', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'please come here', clipName: 'gesture_arm_sweep_point', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i am sorry', clipName: 'gesture_bow_apologetic', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i want to play', clipName: 'gesture_arms_up_excited', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i want to go home', clipName: 'gesture_arm_sweep_point', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i have a question', clipName: 'gesture_palm_hold_wait', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i do not understand', clipName: 'gesture_head_shake_negate', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i need a doctor', clipName: 'gesture_self_point_pulse', verifiedIsl: false, note: PLACEHOLDER_NOTE },
  { label: 'i feel unwell', clipName: 'gesture_bow_apologetic', verifiedIsl: false, note: PLACEHOLDER_NOTE },
];

export const NEUTRAL_IDLE_CLIP_NAME = null;

/**
 * Looks up the animation clip name for a requested sign label. Always falls
 * back safely to a neutral idle pose (null clip name) for unknown labels, it
 * never throws and never fabricates a plausible-looking match. Matching is
 * case-insensitive and trims surrounding whitespace, consistent with how
 * Parent Mode's free-text input is normalized before this lookup runs.
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
