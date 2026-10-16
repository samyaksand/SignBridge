/**
 * Requesty model priority list (Milestone 4 scaffold).
 *
 * IMPORTANT: this list is preserved exactly as specified and must not be
 * reordered, renamed, or pruned. It documents the preferred model fallback
 * chain for a FUTURE live integration with https://router.requesty.ai.
 *
 * STATUS: NOT ACTIVE in Milestone 1. No network call in this codebase reads
 * this list at runtime to contact Requesty. See backend/app/suggestions.py
 * for the stub endpoint, which always uses the local curated fallback
 * because no REQUESTY_API_KEY is configured in this environment.
 */
export const REQUESTY_MODEL_PRIORITY = [
  'nvidia/nemotron-3-super-120b-a12b',
  'google/gemma-4-31b-it',
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'novita/ling-3.1-flash',
  'mistral/leanstral-1-5',
  'nvidia/muse-glimmer-30b',
  'novita/inclusionai/ling-3.0-tiny',
] as const;

export type RequestyModelId = (typeof REQUESTY_MODEL_PRIORITY)[number];

/** True only if a key is present in the environment; always false in this demo build. */
export const isRequestyConfigured = (): boolean => {
  return Boolean(process.env.REQUESTY_API_KEY);
};
