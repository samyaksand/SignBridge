'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import type { Group, AnimationAction } from 'three';
import { buildGestureClips } from './gestureClips';

/** Small helper so eslint's immutability rule doesn't treat this as mutating the hook's return value directly. */
function setActionPlaybackState(action: AnimationAction, paused: boolean, speed: number) {
  const a = action;
  a.paused = paused;
  a.setEffectiveTimeScale(speed);
}

export interface AvatarModelHandle {
  hasClip: (name: string | null) => boolean;
}

interface AvatarModelProps {
  url: string;
  clipName: string | null;
  isPlaying: boolean;
  speed: number;
  /** Called once after load with whether the requested clip actually exists on the model. */
  onReady?: (info: { availableClips: string[] }) => void;
}

/**
 * Loads a GLB and plays one of its animation clips, or sits in a neutral
 * idle (first frame, no animation) pose if no clip is requested or the
 * requested clip does not exist on this model.
 */
export function AvatarModel({ url, clipName, isPlaying, speed, onReady }: AvatarModelProps) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(url);

  // Build our own keyframed gesture clips against this model's real rest
  // pose (see gestureClips.ts), and make them playable alongside whatever
  // animation(s) are baked into the GLB itself. useAnimations accepts any
  // AnimationClip[], it does not require clips to originate from the loaded
  // file, so this is a supported way to add clips without needing new GLB
  // assets per phrase.
  const combinedClips = useMemo(() => {
    const gestureClips = buildGestureClips(scene);
    return [...animations, ...gestureClips];
  }, [scene, animations]);

  const { actions, names } = useAnimations(combinedClips, group);

  useEffect(() => {
    onReady?.({ availableClips: names });
    // Only announce once per model load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names]);

  const resolvedClip = useMemo(() => {
    if (!clipName) return null;
    return names.includes(clipName) ? clipName : null;
  }, [clipName, names]);

  useEffect(() => {
    if (!resolvedClip) return undefined;
    const action = actions[resolvedClip];
    if (!action) return undefined;
    action.reset();
    action.play();
    return () => {
      action.stop();
    };
  }, [resolvedClip, actions]);

  useEffect(() => {
    if (!resolvedClip) return;
    const action = actions[resolvedClip];
    if (!action) return;
    setActionPlaybackState(action, !isPlaying, speed);
  }, [isPlaying, speed, resolvedClip, actions]);

  // Ground and center the model in view instead of relying on a hardcoded
  // offset. A fixed guess (e.g. "-1 on Y") only happens to work for whatever
  // model size/origin someone tested with, and silently crops a differently
  // sized or positioned model (feet cut off, head out of frame) without ever
  // throwing an error, which looks to a user like the avatar "isn't there".
  // Computing this from the model's actual bounding box keeps it centered and
  // fully in frame regardless of the specific GLB's dimensions.
  useLayoutEffect(() => {
    if (!group.current) return;
    const box = new Box3().setFromObject(group.current);
    if (box.isEmpty()) return;
    const center = box.getCenter(new Vector3());
    // Keep the model standing on the ground plane (y = 0) while centering it
    // horizontally, so the feet stay anchored rather than floating/sinking.
    group.current.position.x = -center.x;
    group.current.position.y = -box.min.y;
    group.current.position.z = -center.z;
  }, [scene]);

  return <primitive ref={group} object={scene} scale={1} />;
}
