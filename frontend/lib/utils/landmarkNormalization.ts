/**
 * Landmark normalization utilities — TypeScript mirror of ml/src/normalization.py.
 *
 * Used by the (future, inactive in M1) in-browser inference pipeline to
 * normalize hand/body landmark sequences the same way the Python training
 * pipeline will. Tested for numeric equivalence against the Python
 * implementation in ml/tests using shared synthetic fixtures.
 *
 * No trained model consumes this output in Milestone 1. This file exists so
 * the normalization contract is ready and verified ahead of a future model.
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface FrameLandmarks {
  leftShoulder: Point3D | null;
  rightShoulder: Point3D | null;
  leftHand: Point3D[] | null;
  rightHand: Point3D[] | null;
}

const EPS = 1e-8;

function midpoint(a: Point3D, b: Point3D): Point3D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

function distance(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function subtract(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(a: Point3D, s: number): Point3D {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

/**
 * Centre a frame's hand landmarks at the shoulder midpoint and normalize by
 * shoulder width. Returns null hands untouched if missing (handled by caller).
 */
export function centreAndScaleFrame(frame: FrameLandmarks): FrameLandmarks {
  if (!frame.leftShoulder || !frame.rightShoulder) {
    // Cannot normalize without both shoulders; return zeroed hands as a
    // documented fallback (matches Python behaviour).
    return {
      leftShoulder: null,
      rightShoulder: null,
      leftHand: frame.leftHand ? frame.leftHand.map(() => ({ x: 0, y: 0, z: 0 })) : null,
      rightHand: frame.rightHand ? frame.rightHand.map(() => ({ x: 0, y: 0, z: 0 })) : null,
    };
  }

  const centre = midpoint(frame.leftShoulder, frame.rightShoulder);
  const shoulderWidth = Math.max(distance(frame.leftShoulder, frame.rightShoulder), EPS);
  const invWidth = 1 / shoulderWidth;

  const normalizeHand = (hand: Point3D[] | null): Point3D[] | null => {
    if (!hand) return null;
    return hand.map((p) => scale(subtract(p, centre), invWidth));
  };

  return {
    leftShoulder: { x: 0, y: 0, z: 0 },
    rightShoulder: scale(subtract(frame.rightShoulder, centre), invWidth),
    leftHand: normalizeHand(frame.leftHand),
    rightHand: normalizeHand(frame.rightHand),
  };
}

/**
 * Resample a sequence of frames to exactly `targetFrames` frames using
 * nearest-neighbour index sampling (matches the Python implementation).
 */
export function resampleSequence<T>(sequence: T[], targetFrames: number): T[] {
  if (sequence.length === 0) {
    throw new Error('Cannot resample an empty sequence');
  }
  if (sequence.length === targetFrames) {
    return sequence.slice();
  }
  const result: T[] = [];
  const lastIndex = sequence.length - 1;
  for (let i = 0; i < targetFrames; i++) {
    const t = targetFrames === 1 ? 0 : i / (targetFrames - 1);
    const srcIndex = Math.round(t * lastIndex);
    result.push(sequence[srcIndex]);
  }
  return result;
}

export const DEFAULT_TARGET_FRAMES = 32;

/**
 * Full pipeline: normalize every frame, then resample to DEFAULT_TARGET_FRAMES.
 */
export function normalizeSequence(
  frames: FrameLandmarks[],
  targetFrames: number = DEFAULT_TARGET_FRAMES
): FrameLandmarks[] {
  const normalized = frames.map(centreAndScaleFrame);
  return resampleSequence(normalized, targetFrames);
}
