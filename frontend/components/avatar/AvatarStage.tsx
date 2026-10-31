'use client';

import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AvatarModel } from './AvatarModel';
import { AvatarPanel } from '@/components/AvatarPanel';
import { isWebglSupported } from './WebglSupport';

/**
 * Points the camera at the avatar's vertical center (roughly chest height)
 * instead of relying on @react-three/fiber's default look-at-origin, which
 * looks at the model's feet and crops the head out of frame for a
 * human-sized figure standing on the ground plane.
 */
function CameraAim() {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(0, 0.75, 0);
  }, [camera]);
  return null;
}

const AVATAR_MODEL_URL = '/avatars/cesium-man.glb';

export interface AvatarStageProps {
  /** Animation clip name to play, or null for neutral idle pose. */
  clipName: string | null;
  isPlaying: boolean;
  speed: number;
  /** True only when a real clip is genuinely available for the current phrase. */
  hasDemo: boolean;
}

interface BoundaryState {
  failed: boolean;
}

/** Catches render-time errors from the GLB/Three.js tree and reports up so we can fall back. */
class AvatarErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function AvatarLoadingFallback() {
  return (
    <div className="flex aspect-square w-full max-w-sm items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-navy-border)] bg-[var(--color-navy-800)] text-sm text-[var(--color-navy-text-muted)]">
      Loading avatar...
    </div>
  );
}

/**
 * Progressive-enhancement 3D avatar stage. Renders a real Three.js scene and
 * GLB model when WebGL is available and the asset loads successfully. Falls
 * back to the existing SVG/CSS AvatarPanel placeholder on any failure, so
 * nothing ever appears broken. This component never claims any movement it
 * shows is a verified ISL sign, see frontend/lib/data/signAnimationMap.ts.
 */
export function AvatarStage({ clipName, isPlaying, speed, hasDemo }: AvatarStageProps) {
  const [supportChecked, setSupportChecked] = useState(false);
  const [supported, setSupported] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSupported(isWebglSupported());
      setSupportChecked(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (!supportChecked) {
    return <AvatarLoadingFallback />;
  }

  if (!supported || failed) {
    return <AvatarPanel active={isPlaying && hasDemo} />;
  }

  return (
    <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-navy-border)] bg-[var(--color-navy-800)]">
      <AvatarErrorBoundary onError={() => setFailed(true)}>
        <Suspense fallback={<AvatarLoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0.75, 2.8], fov: 40 }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener(
                'webglcontextlost',
                (e) => {
                  e.preventDefault();
                  setFailed(true);
                },
                { once: true }
              );
            }}
          >
            <CameraAim />
            <hemisphereLight args={[0xffffff, 0x444466, 1.1]} />
            <directionalLight position={[2, 4, 3]} intensity={1.2} />
            <directionalLight position={[-3, 2, -2]} intensity={0.4} />
            <AvatarModel url={AVATAR_MODEL_URL} clipName={clipName} isPlaying={isPlaying} speed={speed} />
          </Canvas>
        </Suspense>
      </AvatarErrorBoundary>
      {!hasDemo && (
        <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-[var(--color-navy-text-muted)]">
          Neutral pose, no sign demonstration available for this phrase
        </span>
      )}
    </div>
  );
}
