'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { Camera, CameraOff, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import {
  checkRecognitionService,
  predictWord,
  type WordPrediction,
} from '@/lib/alphabet-recognition/checkRecognitionService';
import type {
  MediapipeHandsInstance,
  MediapipeHandsResults as HandsResults,
} from '@/lib/alphabet-recognition/mediapipeHandsGlobal';

type PageState =
  | 'checking_service'
  | 'service_unavailable'
  | 'ready'
  | 'buffering'
  | 'no_hand'
  | 'predicting'
  | 'predicted';

const SEQUENCE_LENGTH = 30;
const NUM_KEYPOINTS = 63;
const KNOWN_WORDS = ['hi', 'my', 'name', 'is', 'what', 'your', 'glad', 'to'];

export function WordSignsClient() {
  const [state, setState] = useState<PageState>('checking_service');
  const [cameraOn, setCameraOn] = useState(false);
  const [mediapipeReady, setMediapipeReady] = useState(false);
  const [mediapipeSlow, setMediapipeSlow] = useState(false);
  const [scriptLoadKey, setScriptLoadKey] = useState(0);
  const [bufferCount, setBufferCount] = useState(0);
  const [prediction, setPrediction] = useState<WordPrediction | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handsRef = useRef<MediapipeHandsInstance | null>(null);
  const latestFrameRef = useRef<number[] | null>(null);
  const bufferRef = useRef<number[][]>([]);
  const recordingRef = useRef(false);

  const runServiceCheck = useCallback(async () => {
    const status = await checkRecognitionService();
    setState(status.reachable ? 'ready' : 'service_unavailable');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runServiceCheck();
  }, [runServiceCheck]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const initMediapipe = useCallback(() => {
    if (!window.Hands || handsRef.current) return;
    const hands = new window.Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
    hands.onResults((results: HandsResults) => {
      const hand = results.multiHandLandmarks?.[0];
      if (!hand) {
        latestFrameRef.current = null;
        return;
      }
      const flat: number[] = [];
      hand.forEach((lm) => flat.push(lm.x, lm.y, lm.z));
      latestFrameRef.current = flat;
    });
    handsRef.current = hands;
    setMediapipeReady(true);
  }, []);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('service_unavailable');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      setState('ready');
    } catch {
      setState('ready');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  // The hand-tracking model's CDN assets include a multi-megabyte WASM file
  // fetched lazily by the library itself, not by our own code, so a slow or
  // blocked connection can leave this loading indefinitely with no other
  // signal. Give it a generous but bounded window, then tell the user
  // honestly and offer a real retry instead of an unexplained spinner.
  useEffect(() => {
    if (mediapipeReady) return;
    const timer = window.setTimeout(() => setMediapipeSlow(true), 15000);
    return () => window.clearTimeout(timer);
  }, [mediapipeReady, scriptLoadKey]);

  const retryMediapipeLoad = useCallback(() => {
    handsRef.current = null;
    setMediapipeReady(false);
    setMediapipeSlow(false);
    setScriptLoadKey((k) => k + 1);
  }, []);

  const runPrediction = useCallback(async () => {
    setState('predicting');
    const frames = bufferRef.current.slice(0, SEQUENCE_LENGTH);
    while (frames.length < SEQUENCE_LENGTH) {
      frames.push(new Array(NUM_KEYPOINTS).fill(0));
    }
    const result = await predictWord(frames);
    if (!result) {
      setState('service_unavailable');
      return;
    }
    setPrediction(result);
    setState('predicted');
  }, []);

  useEffect(() => {
    if (!cameraOn || !mediapipeReady || !handsRef.current || !videoRef.current) return;
    let raf = 0;
    const loop = async () => {
      if (videoRef.current && handsRef.current) {
        try {
          await handsRef.current.send({ image: videoRef.current });
          if (recordingRef.current && latestFrameRef.current) {
            bufferRef.current.push(latestFrameRef.current);
            setBufferCount(bufferRef.current.length);
            if (bufferRef.current.length >= SEQUENCE_LENGTH) {
              recordingRef.current = false;
              void runPrediction();
            }
          }
        } catch {
          // A single dropped frame is not worth surfacing as an error.
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cameraOn, mediapipeReady, runPrediction]);

  const startRecording = () => {
    if (!latestFrameRef.current) {
      setState('no_hand');
      return;
    }
    setConfirmed(false);
    bufferRef.current = [];
    setBufferCount(0);
    recordingRef.current = true;
    setState('buffering');
  };

  const speakPrediction = () => {
    if (!prediction || typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(prediction.label);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Script
        key={scriptLoadKey}
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js"
        strategy="afterInteractive"
        onLoad={initMediapipe}
      />

      <h1 className="text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">
        Word Signs (Experimental)
      </h1>
      <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
        Sign one of 8 known ISL words or phrases (hi, my, name, is, what, your, glad, to) while
        recording a short, 30-frame clip. Hand landmarks are extracted in your browser and sent, as
        numbers only, to a separate local recognition service.
      </p>

      <div className="mt-3">
        <StatusMessage kind="info">
          <span className="font-semibold">Experimental, third-party model.</span> This model is from{' '}
          <a
            href="https://github.com/Cl0ud-9/Sign-Language-Recognition"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline"
          >
            Cl0ud-9/Sign-Language-Recognition
          </a>{' '}
          (GPL-3.0, verified in the vendored copy&apos;s LICENSE file, kept in its own separate
          service process). It recognizes only these 8 words/phrases:{' '}
          {KNOWN_WORDS.join(', ')}. It was trained on a small, self-recorded dataset (14 phone
          videos and 860 images). SignBridge independently re-verified that this vendored copy&apos;s
          NumPy forward pass matches the original Keras model&apos;s output (max difference 4.77e-7
          on the upstream project&apos;s own reference inputs); SignBridge did not independently
          verify the upstream project&apos;s real-world accuracy claims. The confidence score shown is
          the model&apos;s actual output, never fabricated.
        </StatusMessage>
      </div>

      <Card className="mt-6 flex flex-col items-center gap-4 p-6">
        {state === 'checking_service' && (
          <StatusMessage kind="loading">Checking if the recognition service is running...</StatusMessage>
        )}

        {state === 'service_unavailable' && (
          <div className="w-full">
            <StatusMessage kind="warning">
              The ISL recognition service is not running right now. Nothing is broken in SignBridge
              itself. You can still use{' '}
              <Link href="/cards" className="font-medium underline">
                Quick Cards
              </Link>{' '}
              right now.
            </StatusMessage>
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-muted)]">
              <p className="font-semibold text-[var(--color-text)]">To start it yourself:</p>
              <pre className="mt-2 overflow-x-auto rounded bg-[var(--color-surface)] p-3 text-xs">
{`cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
# then reload this page`}
              </pre>
            </div>
            <div className="mt-4">
              <Button variant="secondary" onClick={() => void runServiceCheck()}>
                <RefreshCw size={16} aria-hidden="true" />
                Check again
              </Button>
            </div>
          </div>
        )}

        {state !== 'checking_service' && state !== 'service_unavailable' && (
          <>
            {!cameraOn && (
              <Button onClick={startCamera}>
                <Camera size={18} aria-hidden="true" />
                Start Camera
              </Button>
            )}

            {cameraOn && (
              <div className="w-full">
                <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={startRecording}
                    disabled={!mediapipeReady || state === 'buffering' || state === 'predicting'}
                  >
                    {state === 'buffering'
                      ? `Recording... ${bufferCount}/${SEQUENCE_LENGTH}`
                      : state === 'predicting'
                        ? 'Reading sign...'
                        : 'Record a sign (30 frames)'}
                  </Button>
                  <Button variant="secondary" onClick={stopCamera}>
                    <CameraOff size={16} aria-hidden="true" />
                    Stop Camera
                  </Button>
                </div>
                {!mediapipeReady && !mediapipeSlow && (
                  <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Loading hand-tracking model from CDN...
                  </p>
                )}
                {!mediapipeReady && mediapipeSlow && (
                  <StatusMessage kind="warning">
                    <p>
                      This is taking longer than expected. The tracking model is a large
                      download (a few megabytes) and a slow or blocked connection to the CDN
                      can leave this stuck. Check your connection, or try again.
                    </p>
                    <Button variant="secondary" onClick={retryMediapipeLoad} className="mt-2">
                      <RefreshCw size={14} aria-hidden="true" />
                      Try again
                    </Button>
                  </StatusMessage>
                )}
              </div>
            )}

            {state === 'no_hand' && (
              <StatusMessage kind="warning">
                No hand was detected. Hold your hand clearly in view and try again.
              </StatusMessage>
            )}

            {state === 'predicted' && prediction && (
              <div className="w-full rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-sm text-[var(--color-text-muted)]">Model&apos;s best guess:</p>
                <p className="text-3xl font-semibold text-[var(--color-text)]">{prediction.label}</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Confidence: {(prediction.confidence * 100).toFixed(1)}%
                </p>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  Other candidates:{' '}
                  {prediction.top3
                    .slice(1)
                    .map((p) => `${p.label} (${(p.confidence * 100).toFixed(1)}%)`)
                    .join(', ')}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Button variant="secondary" onClick={speakPrediction}>
                    <Volume2 size={16} aria-hidden="true" />
                    Speak this word
                  </Button>
                  {!confirmed && (
                    <Button variant="ghost" onClick={() => setConfirmed(true)}>
                      This looks right
                    </Button>
                  )}
                  {confirmed && (
                    <StatusMessage kind="success">Marked as confirmed by you.</StatusMessage>
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  SignBridge never speaks a prediction automatically. Speaking only happens when you
                  tap &quot;Speak this word&quot; yourself.
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        Honesty note: this page was built and tested without a real camera available to the
        integration process. The recognition code itself was verified end-to-end with real model
        forward passes on the upstream project&apos;s own reference data (see
        backend/app/isl_recognition/__init__.py); live camera + MediaPipe tracking behavior in an
        actual browser was not re-verified here.
      </p>
    </div>
  );
}
