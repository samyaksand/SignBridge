import { describe, expect, it } from 'vitest';
import { resolveAnimationClip, SIGN_ANIMATION_MAP } from '@/lib/data/signAnimationMap';

describe('signAnimationMap', () => {
  it('resolves a known placeholder label to its demo clip', () => {
    const entry = resolveAnimationClip('Thank you');
    expect(entry.clipName).toBe('animation_0');
    expect(entry.verifiedIsl).toBe(false);
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
