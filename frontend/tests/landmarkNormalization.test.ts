import { describe, expect, it } from 'vitest';
import {
  centreAndScaleFrame,
  resampleSequence,
  normalizeSequence,
  FrameLandmarks,
} from '@/lib/utils/landmarkNormalization';

describe('landmark normalization', () => {
  it('centres a frame at the shoulder midpoint', () => {
    const frame: FrameLandmarks = {
      leftShoulder: { x: 0, y: 0, z: 0 },
      rightShoulder: { x: 10, y: 0, z: 0 },
      leftHand: [{ x: 5, y: 0, z: 0 }],
      rightHand: null,
    };
    const result = centreAndScaleFrame(frame);
    // Midpoint is (5,0,0); shoulder width is 10, so left hand at (5,0,0) is
    // centred to (0,0,0) and scaled by 1/10 -> (0,0,0).
    expect(result.leftHand?.[0].x).toBeCloseTo(0, 6);
    expect(result.rightShoulder?.x).toBeCloseTo(0.5, 6);
  });

  it('returns zeroed hands when shoulders are missing', () => {
    const frame: FrameLandmarks = {
      leftShoulder: null,
      rightShoulder: null,
      leftHand: [{ x: 1, y: 2, z: 3 }],
      rightHand: null,
    };
    const result = centreAndScaleFrame(frame);
    expect(result.leftHand?.[0]).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('resamples a sequence to the target frame count', () => {
    const sequence = Array.from({ length: 10 }, (_, i) => i);
    const resampled = resampleSequence(sequence, 32);
    expect(resampled).toHaveLength(32);
    expect(resampled[0]).toBe(0);
    expect(resampled[31]).toBe(9);
  });

  it('resamples a longer sequence down to 32 frames', () => {
    const sequence = Array.from({ length: 64 }, (_, i) => i);
    const resampled = resampleSequence(sequence, 32);
    expect(resampled).toHaveLength(32);
  });

  it('runs the full normalize pipeline end to end', () => {
    const frames: FrameLandmarks[] = Array.from({ length: 5 }, (_, i) => ({
      leftShoulder: { x: 0, y: i, z: 0 },
      rightShoulder: { x: 10, y: i, z: 0 },
      leftHand: [{ x: 5, y: i, z: 0 }],
      rightHand: [{ x: 6, y: i, z: 0 }],
    }));
    const result = normalizeSequence(frames);
    expect(result).toHaveLength(32);
  });
});
