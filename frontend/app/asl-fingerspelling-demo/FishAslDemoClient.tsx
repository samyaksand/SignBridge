'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import type {
  MediapipeHandLandmark,
  MediapipeHandsInstance,
  MediapipeHandsResults as HandsResults,
} from '@/lib/alphabet-recognition/mediapipeHandsGlobal';

type LoadState = 'loading' | 'ready' | 'failed';

// Mirrors the temporal smoothing from the original vendored ASL demo this
// page was ported from (no longer kept on disk, see docs/ASL_FINGERSPELLING.md):
// a majority vote over the last 10 frames, requiring 7+ agreeing votes
// before a letter is considered stable enough to show.
const HISTORY_SIZE = 10;
const VOTE_THRESHOLD = 7;
const CONFIDENCE_THRESHOLD = 0.85;

// tfjs is loaded globally from CDN (see the Script tag below), the same
// pattern this project already uses for MediaPipe Hands.
declare global {
  interface Window {
    tf?: {
      loadLayersModel: (path: string) => Promise<TfModel>;
      tensor2d: (data: number[][]) => TfTensor;
      tidy: <T>(fn: () => T) => T;
    };
  }
}

interface TfTensor {
  dataSync: () => Float32Array | Int32Array | Uint8Array;
  dispose?: () => void;
}

interface TfModel {
  predict: (input: TfTensor) => TfTensor;
  dispose: () => void;
}

/**
 * Extracts the same translation-invariant, scale-invariant, orientation-aware
 * 79-value feature vector as the original vendored ASL demo's
 * extractRobustFeatures() (see docs/ASL_FINGERSPELLING.md for provenance):
 * 21 landmarks centered on the wrist and scaled by
 * the middle-knuckle distance (63 values), 5 fingertip-to-origin distances
 * plus 5 fingertip-to-knuckle distances (10 values), a palm normal vector
 * (3 values) and a hand direction vector (3 values).
 */
function extractRobustFeatures(landmarks: MediapipeHandLandmark[]): number[] {
  const wrist = landmarks[0];
  const lmCentered = landmarks.map((p) => [p.x - wrist.x, p.y - wrist.y, p.z - wrist.z]);

  const mKnuckle = lmCentered[9];
  const scale = Math.hypot(mKnuckle[0], mKnuckle[1], mKnuckle[2]) || 1.0;
  const lmScaled = lmCentered.map((p) => [p[0] / scale, p[1] / scale, p[2] / scale]);

  const fingerTips = [4, 8, 12, 16, 20];
  const knuckles = [2, 5, 9, 13, 17];
  const distances: number[] = [];

  fingerTips.forEach((tip) => {
    const p = lmScaled[tip];
    distances.push(Math.hypot(p[0], p[1], p[2]));
  });

  for (let i = 0; i < fingerTips.length; i++) {
    const tip = lmScaled[fingerTips[i]];
    const knuck = lmScaled[knuckles[i]];
    distances.push(Math.hypot(tip[0] - knuck[0], tip[1] - knuck[1], tip[2] - knuck[2]));
  }

  const v5_0 = [
    lmScaled[5][0] - lmScaled[0][0],
    lmScaled[5][1] - lmScaled[0][1],
    lmScaled[5][2] - lmScaled[0][2],
  ];
  const v17_0 = [
    lmScaled[17][0] - lmScaled[0][0],
    lmScaled[17][1] - lmScaled[0][1],
    lmScaled[17][2] - lmScaled[0][2],
  ];

  let palmNormal = [
    v5_0[1] * v17_0[2] - v5_0[2] * v17_0[1],
    v5_0[2] * v17_0[0] - v5_0[0] * v17_0[2],
    v5_0[0] * v17_0[1] - v5_0[1] * v17_0[0],
  ];
  const normLen = Math.hypot(palmNormal[0], palmNormal[1], palmNormal[2]) || 1.0;
  palmNormal = palmNormal.map((v) => v / normLen);

  let handDirection = [
    lmScaled[9][0] - lmScaled[0][0],
    lmScaled[9][1] - lmScaled[0][1],
    lmScaled[9][2] - lmScaled[0][2],
  ];
  const dirLen = Math.hypot(handDirection[0], handDirection[1], handDirection[2]) || 1.0;
  handDirection = handDirection.map((v) => v / dirLen);

  const flatFeatures: number[] = [];
  lmScaled.forEach((p) => flatFeatures.push(...p));
  flatFeatures.push(...distances);
  flatFeatures.push(...palmNormal);
  flatFeatures.push(...handDirection);

  return flatFeatures;
}

export function FishAslDemoClient() {
  const [cameraOn, setCameraOn] = useState(false);
  const [handsState, setHandsState] = useState<LoadState>('loading');
  const [modelState, setModelState] = useState<LoadState>('loading');
  const [scriptLoadKey, setScriptLoadKey] = useState(0);
  const [detectedLetter, setDetectedLetter] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [noHand, setNoHand] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<MediapipeHandsInstance | null>(null);
  const modelRef = useRef<TfModel | null>(null);
  const labelMapRef = useRef<Record<string, string>>({});
  const historyRef = useRef<string[]>([]);
  const latestLetterRef = useRef<{ letter: string; confidence: number } | null>(null);

  const initMediapipe = useCallback(() => {
    if (!window.Hands || handsRef.current) return;
    try {
      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      hands.onResults((results: HandsResults) => {
        const hand = results.multiHandLandmarks?.[0];
        if (!hand) {
          latestLetterRef.current = null;
          historyRef.current = [];
          setNoHand(true);
          setDetectedLetter(null);
          setConfidence(null);
          return;
        }
        setNoHand(false);

        const model = modelRef.current;
        const tf = window.tf;
        if (!model || !tf) return;

        tf.tidy(() => {
          const features = extractRobustFeatures(hand);
          const input = tf.tensor2d([features]);
          const output = model.predict(input);
          const probs = Array.from(output.dataSync());
          const maxProb = Math.max(...probs);
          const predIndex = probs.indexOf(maxProb);

          let letter: string | null = null;
          if (maxProb >= CONFIDENCE_THRESHOLD) {
            letter = labelMapRef.current[String(predIndex)] ?? null;
          }

          const hist = historyRef.current;
          if (letter !== null) hist.push(letter);
          if (hist.length > HISTORY_SIZE) hist.shift();

          const counts: Record<string, number> = {};
          let best: string | null = null;
          let bestCount = 0;
          for (const l of hist) {
            counts[l] = (counts[l] || 0) + 1;
            if (counts[l] > bestCount) {
              bestCount = counts[l];
              best = l;
            }
          }

          if (bestCount >= VOTE_THRESHOLD && best) {
            latestLetterRef.current = { letter: best, confidence: maxProb };
            setDetectedLetter(best);
            setConfidence(maxProb);
          }
        });
      });
      handsRef.current = hands;
      setHandsState('ready');
    } catch {
      setHandsState('failed');
    }
  }, []);

  const initModel = useCallback(async () => {
    const tf = window.tf;
    if (!tf) {
      setModelState('failed');
      return;
    }
    try {
      const model = await tf.loadLayersModel('/asl-fingerspelling-model/model.json');
      const resp = await fetch('/asl-fingerspelling-model/label_map.json');
      const labelMap = (await resp.json()) as Record<string, string>;
      modelRef.current = model;
      labelMapRef.current = labelMap;
      setModelState('ready');
    } catch {
      setModelState('failed');
    }
  }, []);

  const handleTfLoad = useCallback(() => {
    void initModel();
  }, [initModel]);

  // next/script tracks each <script src> as loaded for the whole page
  // session (across mounts, not just this component). If the CDN script was
  // already loaded earlier (for example, this page was visited before, or
  // another page loaded the same MediaPipe Hands script), next/script will
  // not call onLoad again for a new mount of this component, since from its
  // point of view the script has already loaded. Without this check, that
  // leaves this component stuck showing "loading" forever even though the
  // library is already available on window. Covering both cases: the normal
  // first-load path (Script's onLoad below) and this already-loaded path.
  useEffect(() => {
    if (window.Hands && !handsRef.current) initMediapipe();
    if (window.tf && !modelRef.current) void initModel();
  }, [initMediapipe, initModel]);

  // Defensive fallback: if neither path above ever resolves (a genuinely
  // blocked or very slow CDN connection), tell the user honestly instead of
  // leaving an unexplained spinner forever.
  useEffect(() => {
    if (handsState !== 'loading' && modelState !== 'loading') return;
    const timer = window.setTimeout(() => {
      if (handsState === 'loading' && !window.Hands) setHandsState('failed');
      if (modelState === 'loading' && !modelRef.current) setModelState('failed');
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [handsState, modelState, scriptLoadKey]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      modelRef.current?.dispose();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      // Camera permission denied or unavailable, stay in the off state.
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setDetectedLetter(null);
    setConfidence(null);
    setNoHand(false);
    historyRef.current = [];
    latestLetterRef.current = null;
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  const retryLoad = useCallback(() => {
    handsRef.current = null;
    modelRef.current = null;
    setHandsState('loading');
    setModelState('loading');
    setScriptLoadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!cameraOn || !handsRef.current || !videoRef.current || handsState !== 'ready') return;
    let raf = 0;
    const loop = async () => {
      if (videoRef.current && handsRef.current) {
        try {
          await handsRef.current.send({ image: videoRef.current });
        } catch {
          // A single dropped frame is not worth surfacing as an error.
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraOn, handsState]);

  const bothReady = handsState === 'ready' && modelState === 'ready';
  const eitherFailed = handsState === 'failed' || modelState === 'failed';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Script
        key={`tf-${scriptLoadKey}`}
        src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"
        strategy="afterInteractive"
        onLoad={handleTfLoad}
      />
      <Script
        key={`hands-${scriptLoadKey}`}
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js"
        strategy="afterInteractive"
        onLoad={initMediapipe}
      />

      <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
        Letter Lens
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
        Spell out the ASL alphabet (A-Z) with your hand in front of the camera, and see what
        letter SignBridge reads back, live. Everything runs in your browser. Nothing from your
        camera leaves your device.
      </p>

      <Card className="mt-6 flex flex-col items-center gap-4 p-6">
        {!bothReady && !eitherFailed && (
          <StatusMessage kind="loading">Loading hand-tracking and letter model from CDN...</StatusMessage>
        )}

        {eitherFailed && (
          <StatusMessage kind="warning">
            <p>
              {handsState === 'failed' && modelState === 'failed'
                ? 'The hand-tracking library and the letter model both failed to load.'
                : handsState === 'failed'
                  ? 'The hand-tracking library failed to load.'
                  : 'The letter model failed to load.'}{' '}
              This usually means a slow or blocked connection to the CDN. Check your connection
              and try again.
            </p>
            <Button variant="secondary" onClick={retryLoad} className="mt-2">
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </Button>
          </StatusMessage>
        )}

        {bothReady && !cameraOn && (
          <Button onClick={startCamera}>
            <Camera size={18} aria-hidden="true" />
            Start Camera
          </Button>
        )}

        {bothReady && cameraOn && (
          <div className="w-full">
            <div className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={stopCamera}>
                <CameraOff size={16} aria-hidden="true" />
                Stop Camera
              </Button>
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
              {detectedLetter ? (
                <>
                  <p className="text-sm text-[var(--color-text-muted)]">Detected letter:</p>
                  <p className="text-4xl font-semibold text-[var(--color-text)]">{detectedLetter}</p>
                  {confidence !== null && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Confidence: {(confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </>
              ) : noHand ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  No hand detected. Hold your hand clearly in view.
                </p>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">
                  Hold a steady letter shape in view to see a detection here.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
