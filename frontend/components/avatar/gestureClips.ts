import {
  AnimationClip,
  Euler,
  Object3D,
  Quaternion,
  QuaternionKeyframeTrack,
} from 'three';

/**
 * Programmatically-built body/arm/torso gesture clips for the CesiumMan
 * sample rig (frontend/public/avatars/cesium-man.glb).
 *
 * WHY THIS FILE EXISTS: the rig has no finger/hand bones at all (verified by
 * directly parsing the GLB's embedded glTF JSON, see
 * frontend/public/avatars/LICENSE.md for the full investigation). It is
 * physically incapable of showing distinct hand shapes. These clips move
 * only the bones the rig actually has: shoulder/elbow/wrist-equivalent arm
 * joints, the neck, and the torso. They are built as keyframe tracks against
 * the REAL bone names found in the GLB (see the investigation notes), not
 * guessed names.
 *
 * These are honest placeholders. Every one of them is simplified
 * body-level motion, not a verified Indian Sign Language (ISL) sign. See
 * frontend/lib/data/signAnimationMap.ts, where every entry referencing a
 * clip built here carries verifiedIsl: false and an explicit note.
 */

/** Real joint names present in cesium-man.glb's skin (verified by parsing the GLB directly). */
export const RIG_JOINTS = {
  torso1: 'Skeleton_torso_joint_1',
  torso2: 'Skeleton_torso_joint_2',
  torso3: 'torso_joint_3',
  armR1: 'Skeleton_arm_joint_R', // right shoulder
  armR2: 'Skeleton_arm_joint_R__2_', // right elbow
  armR3: 'Skeleton_arm_joint_R__3_', // right wrist
  armL1: 'Skeleton_arm_joint_L__4_', // left shoulder
  armL2: 'Skeleton_arm_joint_L__3_', // left elbow
  armL3: 'Skeleton_arm_joint_L__2_', // left wrist
  neck1: 'Skeleton_neck_joint_1',
  neck2: 'Skeleton_neck_joint_2',
} as const;

type JointName = (typeof RIG_JOINTS)[keyof typeof RIG_JOINTS];

/**
 * One keyframe's local offset rotation for a joint, expressed as an Euler
 * delta in radians applied IN THE JOINT'S OWN LOCAL SPACE on top of its rest
 * pose. Using a local-space delta (rather than guessing which world axis
 * means "raise" for a given joint) keeps this correct regardless of the
 * bind-pose orientation baked into this particular rig.
 */
interface JointOffset {
  joint: JointName;
  /** [x, y, z] radians, applied as an additional local rotation. */
  euler: [number, number, number];
}

interface PoseKeyframe {
  /** Time in seconds for this keyframe. */
  t: number;
  offsets: JointOffset[];
}

interface GestureClipSpec {
  name: string;
  /** Total clip duration in seconds. */
  duration: number;
  keyframes: PoseKeyframe[];
}

/** Finds a joint's REST (bind pose) quaternion by name by walking the loaded scene graph. */
function findRestQuaternions(root: Object3D): Map<string, Quaternion> {
  const map = new Map<string, Quaternion>();
  root.traverse((obj) => {
    if (Object.values(RIG_JOINTS).includes(obj.name as JointName)) {
      map.set(obj.name, obj.quaternion.clone());
    }
  });
  return map;
}

/**
 * Builds a single THREE.AnimationClip from a declarative gesture spec,
 * composing each keyframe's local offset onto the joint's actual rest
 * quaternion (read from the live loaded scene, not assumed), so the result
 * is correct for this rig's real bind pose.
 */
function buildClip(spec: GestureClipSpec, restQuats: Map<string, Quaternion>): AnimationClip {
  const jointTimes = new Map<JointName, number[]>();
  const jointValues = new Map<JointName, number[]>();

  for (const kf of spec.keyframes) {
    for (const offset of kf.offsets) {
      const rest = restQuats.get(offset.joint);
      if (!rest) continue; // Joint not found on this model, skip safely.
      const delta = new Quaternion().setFromEuler(
        new Euler(offset.euler[0], offset.euler[1], offset.euler[2])
      );
      const absolute = rest.clone().multiply(delta);

      if (!jointTimes.has(offset.joint)) {
        jointTimes.set(offset.joint, []);
        jointValues.set(offset.joint, []);
      }
      jointTimes.get(offset.joint)!.push(kf.t);
      jointValues.get(offset.joint)!.push(absolute.x, absolute.y, absolute.z, absolute.w);
    }
  }

  const tracks = Array.from(jointTimes.keys()).map((joint) => {
    return new QuaternionKeyframeTrack(
      `${joint}.quaternion`,
      jointTimes.get(joint)!,
      jointValues.get(joint)!
    );
  });

  return new AnimationClip(spec.name, spec.duration, tracks);
}

/**
 * Declarative specs for each curated gesture. Every spec is intentionally
 * different in timing, joints moved, and pose shape, so the resulting clips
 * are visually distinct from one another (not the same motion relabeled).
 * Values are hand-authored in radians, small enough to stay within this
 * rig's natural joint limits.
 */
const GESTURE_SPECS: GestureClipSpec[] = [
  {
    // Both arms rise and open outward, a bit like an open welcoming gesture.
    name: 'gesture_wave_greeting',
    duration: 1.6,
    keyframes: [
      { t: 0, offsets: [] },
      {
        t: 0.5,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0, 0, 0.9] },
          { joint: RIG_JOINTS.armR2, euler: [0.3, 0, 0] },
        ],
      },
      {
        t: 0.9,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0, 0, 0.5] },
          { joint: RIG_JOINTS.armR2, euler: [-0.2, 0, 0] },
        ],
      },
      {
        t: 1.3,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0, 0, 0.9] },
          { joint: RIG_JOINTS.armR2, euler: [0.3, 0, 0] },
        ],
      },
      { t: 1.6, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0, 0, 0] }, { joint: RIG_JOINTS.armR2, euler: [0, 0, 0] }] },
    ],
  },
  {
    // Both hands come together at chest height and hold, like "please"/gratitude.
    name: 'gesture_hands_together_chest',
    duration: 1.8,
    keyframes: [
      { t: 0, offsets: [] },
      {
        t: 0.6,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0.6, 0, 0.5] },
          { joint: RIG_JOINTS.armR2, euler: [0.9, 0, 0] },
          { joint: RIG_JOINTS.armL1, euler: [0.6, 0, -0.5] },
          { joint: RIG_JOINTS.armL2, euler: [0.9, 0, 0] },
          { joint: RIG_JOINTS.neck1, euler: [0.15, 0, 0] },
        ],
      },
      {
        t: 1.2,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0.6, 0, 0.5] },
          { joint: RIG_JOINTS.armR2, euler: [0.9, 0, 0] },
          { joint: RIG_JOINTS.armL1, euler: [0.6, 0, -0.5] },
          { joint: RIG_JOINTS.armL2, euler: [0.9, 0, 0] },
          { joint: RIG_JOINTS.neck1, euler: [0.15, 0, 0] },
        ],
      },
      { t: 1.8, offsets: [] },
    ],
  },
  {
    // Right hand raises and taps toward chest twice, like pointing to self for need/want.
    name: 'gesture_self_point_pulse',
    duration: 1.4,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.3, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.7, 0, 0.3] }, { joint: RIG_JOINTS.armR2, euler: [1.1, 0, 0] }] },
      { t: 0.55, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.5, 0, 0.3] }, { joint: RIG_JOINTS.armR2, euler: [0.8, 0, 0] }] },
      { t: 0.8, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.7, 0, 0.3] }, { joint: RIG_JOINTS.armR2, euler: [1.1, 0, 0] }] },
      { t: 1.05, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.5, 0, 0.3] }, { joint: RIG_JOINTS.armR2, euler: [0.8, 0, 0] }] },
      { t: 1.4, offsets: [] },
    ],
  },
  {
    // Slow single nod, used for agreement/affirmation style phrases.
    name: 'gesture_nod_affirm',
    duration: 1.2,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.4, offsets: [{ joint: RIG_JOINTS.neck1, euler: [0.35, 0, 0] }] },
      { t: 0.7, offsets: [{ joint: RIG_JOINTS.neck1, euler: [0, 0, 0] }] },
      { t: 1.0, offsets: [{ joint: RIG_JOINTS.neck1, euler: [0.2, 0, 0] }] },
      { t: 1.2, offsets: [] },
    ],
  },
  {
    // Side-to-side head turn, used for negation style phrases. Distinct axis
    // (yaw vs nod's pitch) and distinct timing/duration from the nod clip.
    name: 'gesture_head_shake_negate',
    duration: 1.4,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.35, offsets: [{ joint: RIG_JOINTS.neck2, euler: [0, 0.4, 0] }] },
      { t: 0.7, offsets: [{ joint: RIG_JOINTS.neck2, euler: [0, -0.4, 0] }] },
      { t: 1.05, offsets: [{ joint: RIG_JOINTS.neck2, euler: [0, 0.4, 0] }] },
      { t: 1.4, offsets: [{ joint: RIG_JOINTS.neck2, euler: [0, 0, 0] }] },
    ],
  },
  {
    // Right arm sweeps outward low, like gesturing toward an object/direction.
    name: 'gesture_arm_sweep_point',
    duration: 1.5,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.5, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.2, 0, 1.1] }, { joint: RIG_JOINTS.armR3, euler: [0, 0, 0.4] }] },
      { t: 1.0, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.2, 0, 1.1] }, { joint: RIG_JOINTS.armR3, euler: [0, 0, 0.4] }] },
      { t: 1.5, offsets: [] },
    ],
  },
  {
    // Both arms cross toward chest and hold, a hugging/self-embrace shape,
    // reused for affection-related phrases.
    name: 'gesture_cross_arms_embrace',
    duration: 1.8,
    keyframes: [
      { t: 0, offsets: [] },
      {
        t: 0.7,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0.5, 0, 0.9] },
          { joint: RIG_JOINTS.armR2, euler: [0.6, 0, 0] },
          { joint: RIG_JOINTS.armL1, euler: [0.5, 0, -0.9] },
          { joint: RIG_JOINTS.armL2, euler: [0.6, 0, 0] },
          { joint: RIG_JOINTS.torso3, euler: [0.08, 0, 0] },
        ],
      },
      {
        t: 1.3,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0.5, 0, 0.9] },
          { joint: RIG_JOINTS.armR2, euler: [0.6, 0, 0] },
          { joint: RIG_JOINTS.armL1, euler: [0.5, 0, -0.9] },
          { joint: RIG_JOINTS.armL2, euler: [0.6, 0, 0] },
          { joint: RIG_JOINTS.torso3, euler: [0.08, 0, 0] },
        ],
      },
      { t: 1.8, offsets: [] },
    ],
  },
  {
    // Right hand rises slowly and settles, like a calm "wait"/"please wait" palm-out hold.
    name: 'gesture_palm_hold_wait',
    duration: 1.6,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.6, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.9, 0, 0.6] }, { joint: RIG_JOINTS.armR2, euler: [0.2, 0, 0] }] },
      { t: 1.2, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.9, 0, 0.6] }, { joint: RIG_JOINTS.armR2, euler: [0.2, 0, 0] }] },
      { t: 1.6, offsets: [] },
    ],
  },
  {
    // Torso leans forward slightly with head down, like an apologetic posture.
    name: 'gesture_bow_apologetic',
    duration: 1.5,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.5, offsets: [{ joint: RIG_JOINTS.torso2, euler: [0.25, 0, 0] }, { joint: RIG_JOINTS.neck1, euler: [0.2, 0, 0] }] },
      { t: 1.0, offsets: [{ joint: RIG_JOINTS.torso2, euler: [0.25, 0, 0] }, { joint: RIG_JOINTS.neck1, euler: [0.2, 0, 0] }] },
      { t: 1.5, offsets: [] },
    ],
  },
  {
    // Both arms raise high overhead, an energetic "excited/want to play" pose.
    name: 'gesture_arms_up_excited',
    duration: 1.3,
    keyframes: [
      { t: 0, offsets: [] },
      {
        t: 0.4,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0, 0, 1.6] },
          { joint: RIG_JOINTS.armL1, euler: [0, 0, -1.6] },
        ],
      },
      {
        t: 0.8,
        offsets: [
          { joint: RIG_JOINTS.armR1, euler: [0, 0, 1.8] },
          { joint: RIG_JOINTS.armL1, euler: [0, 0, -1.8] },
        ],
      },
      { t: 1.3, offsets: [] },
    ],
  },
  {
    // Right arm extends forward and slightly down with an open palm, a calm
    // "offering/here you go" shape, used for handing-over style phrases.
    name: 'gesture_offer_forward',
    duration: 1.4,
    keyframes: [
      { t: 0, offsets: [] },
      { t: 0.5, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.8, 0, 0.2] }, { joint: RIG_JOINTS.armR2, euler: [0.1, 0, 0] }, { joint: RIG_JOINTS.armR3, euler: [0.2, 0, 0] }] },
      { t: 1.0, offsets: [{ joint: RIG_JOINTS.armR1, euler: [0.8, 0, 0.2] }, { joint: RIG_JOINTS.armR2, euler: [0.1, 0, 0] }, { joint: RIG_JOINTS.armR3, euler: [0.2, 0, 0] }] },
      { t: 1.4, offsets: [] },
    ],
  },
];

export const GESTURE_CLIP_NAMES = GESTURE_SPECS.map((s) => s.name);

/**
 * Builds all gesture clips against a loaded model's actual rest pose. Call
 * once per loaded scene (e.g. in a useMemo keyed on the scene instance).
 */
export function buildGestureClips(root: Object3D): AnimationClip[] {
  const restQuats = findRestQuaternions(root);
  return GESTURE_SPECS.map((spec) => buildClip(spec, restQuats));
}
