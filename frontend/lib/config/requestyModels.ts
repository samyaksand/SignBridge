/**
 * Requesty model priority list.
 *
 * IMPORTANT: this list is preserved exactly as specified and must not be
 * reordered, renamed, or pruned. It documents the preferred model fallback
 * chain used by the optional backend's live integration with
 * https://router.requesty.ai.
 *
 * STATUS: the backend (backend/app/suggestions.py) mirrors this exact list
 * and uses it only when REQUESTY_API_KEY is configured in its environment.
 * In this repository's default environment, no key is configured, so every
 * request is served from the local curated fallback and no network call to
 * Requesty is ever made. This file itself is never read at runtime by the
 * frontend to contact Requesty, it only documents the chain and is used to
 * confirm the backend's copy stays in sync.
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
