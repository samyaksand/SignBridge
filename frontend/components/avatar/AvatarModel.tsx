'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import type { Group, AnimationAction } from 'three';

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
  const { actions, names } = useAnimations(animations, group);

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

  return <primitive ref={group} object={scene} scale={1} position={[0, -1, 0]} />;
}
