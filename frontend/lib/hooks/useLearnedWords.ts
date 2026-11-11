'use client';

import { useEffect, useState } from 'react';

const LEARNED_WORDS_STORAGE_KEY = 'signbridge-learned-words';

/**
 * Tracks which ISLRTC dictionary word ids the user has marked as
 * "learned" on this device, following PreferencesContext's own
 * textSize pattern: a get/set pair guarded by try/catch around
 * localStorage, loaded once on mount, a stable "signbridge-" prefixed
 * key. Stored as a plain array of entry.id strings (not full entry
 * objects), so storage stays small and keeps working even if the
 * dictionary itself changes later. This is per-device only, nothing
 * is ever sent to a server, consistent with this project's
 * no-persistent-profiles principle.
 */
function getStoredLearnedWords(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LEARNED_WORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((id): id is string => typeof id === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

function storeLearnedWords(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LEARNED_WORDS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors (private browsing, full storage, etc). Not critical.
  }
}

export function useLearnedWords() {
  const [learnedIds, setLearnedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLearnedIds(getStoredLearnedWords());
    setLoaded(true);
  }, []);

  const isLearned = (id: string) => learnedIds.includes(id);

  const toggleLearned = (id: string) => {
    setLearnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      storeLearnedWords(next);
      return next;
    });
  };

  const markLearned = (id: string) => {
    setLearnedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      storeLearnedWords(next);
      return next;
    });
  };

  return { learnedIds, loaded, isLearned, toggleLearned, markLearned };
}
