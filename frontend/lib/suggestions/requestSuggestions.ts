/**
 * Client for the optional backend's /suggestions endpoint.
 *
 * This is entirely optional. If the backend is not running, or the request
 * fails for any reason, callers get a clear "unavailable" result instead of
 * a thrown error, the app must keep working with zero backend running.
 *
 * Privacy: the request body below sends ONLY the confirmed words (short
 * strings) and the output language, nothing else. No camera frame, video,
 * or landmark data is ever part of this payload.
 */

export type OutputLanguage = 'en' | 'hi';

export interface SuggestionRequestBody {
  confirmed_words: string[];
  output_language: OutputLanguage;
}

export interface SuggestionResult {
  ok: boolean;
  suggestions: string[];
  usedRequesty: boolean;
  /** Friendly message to show when ok is false, never a raw error. */
  message?: string;
}

const DEFAULT_BACKEND_URL = 'http://localhost:8000';
const REQUEST_TIMEOUT_MS = 6000;

function getBackendUrl(): string {
  // Only a build-time, server-safe public base URL is read here, never an
  // API key. This never exposes REQUESTY_API_KEY to the client bundle.
  return process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL;
}

export async function requestSentenceSuggestions(
  confirmedWords: string[],
  outputLanguage: OutputLanguage
): Promise<SuggestionResult> {
  if (confirmedWords.length === 0) {
    return { ok: false, suggestions: [], usedRequesty: false, message: 'Add a word first.' };
  }

  const body: SuggestionRequestBody = {
    confirmed_words: confirmedWords,
    output_language: outputLanguage,
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBackendUrl()}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        suggestions: [],
        usedRequesty: false,
        message: 'Suggestions are not available right now. You can still build your message by hand.',
      };
    }

    const data = await response.json();
    return {
      ok: true,
      suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      usedRequesty: Boolean(data.used_requesty),
    };
  } catch {
    // Covers: backend not running, network error, timeout/abort. Degrade
    // silently and gracefully, never crash the app over an optional feature.
    return {
      ok: false,
      suggestions: [],
      usedRequesty: false,
      message: 'Suggestions need the optional backend, which is not running right now.',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
