// Checks whether SignBridge's own backend (backend/app, started by
// scripts/run-backend.js) is reachable, specifically its /isl-recognition
// endpoints. Failing to reach it is an expected, normal state: the backend
// is optional and is not started by default.

export const RECOGNITION_SERVICE_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000') + '/isl-recognition';

export interface RecognitionServiceStatus {
  reachable: boolean;
  message?: string;
}

export async function checkRecognitionService(): Promise<RecognitionServiceStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${RECOGNITION_SERVICE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { reachable: false, message: 'The recognition service responded with an error.' };
    }
    return { reachable: true };
  } catch {
    return {
      reachable: false,
      message:
        'The ISL recognition service is not running right now. It is a separate, optional service.',
    };
  }
}

export interface WordPrediction {
  label: string;
  confidence: number;
  top3: { label: string; confidence: number }[];
  note: string;
}

export async function predictWord(frames: number[][]): Promise<WordPrediction | null> {
  try {
    const controller = new AbortController();
    // Generous timeout: a free-tier host can take 30-60 seconds to wake a
    // sleeping instance on the first request after being idle.
    const timeout = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${RECOGNITION_SERVICE_URL}/predict/word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return (await res.json()) as WordPrediction;
  } catch {
    return null;
  }
}
