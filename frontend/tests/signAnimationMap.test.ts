import { describe, expect, it } from 'vitest';
import { resolveAnimationClip, SIGN_ANIMATION_MAP } from '@/lib/data/signAnimationMap';

describe('signAnimationMap', () => {
  it('resolves a known placeholder label to its demo clip', () => {
    const entry = resolveAnimationClip('Thank you');
    expect(entry.clipName).toBe('gesture_hands_together_chest');
    expect(entry.verifiedIsl).toBe(false);
  });

  it('is case-insensitive and trims whitespace when matching', () => {
    const entry = resolveAnimationClip('   THANK you  ');
    expect(entry.clipName).toBe('gesture_hands_together_chest');
  });

  it('contains at least 20 curated phrases', () => {
    expect(SIGN_ANIMATION_MAP.length).toBeGreaterThanOrEqual(20);
  });

  it('assigns visually distinct clips to a broad sample of different phrases', () => {
    const sampleLabels = ['hello', 'yes', 'no', 'i love you', 'i am sorry', 'i want to play'];
    const clipNames = sampleLabels.map((l) => resolveAnimationClip(l).clipName);
    expect(new Set(clipNames).size).toBe(sampleLabels.length);
  });

  it('safely falls back to a neutral idle pose for an unknown label, never crashing or fabricating a match', () => {
    const entry = resolveAnimationClip('some random unmapped phrase xyz');
    expect(entry.clipName).toBeNull();
    expect(entry.verifiedIsl).toBe(false);
  });

  it('falls back safely for an empty label', () => {
    const entry = resolveAnimationClip('');
    expect(entry.clipName).toBeNull();
  });

  it('never marks any placeholder entry as verified ISL', () => {
    expect(SIGN_ANIMATION_MAP.every((e) => e.verifiedIsl === false)).toBe(true);
  });
});
