// Shared ambient type for the MediaPipe Hands constructor loaded from CDN
// (see @mediapipe/hands via jsdelivr in WordSignsClient.tsx). Declared
// once here so TypeScript's global augmentation stays consistent.

export interface MediapipeHandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface MediapipeHandsResults {
  multiHandLandmarks?: MediapipeHandLandmark[][];
  multiHandedness?: { label: string }[];
}

export interface MediapipeHandsInstance {
  setOptions: (opts: Record<string, unknown>) => void;
  onResults: (cb: (results: MediapipeHandsResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
}

export type MediapipeHandsConstructor = new (config: unknown) => MediapipeHandsInstance;

declare global {
  interface Window {
    Hands?: MediapipeHandsConstructor;
  }
}
