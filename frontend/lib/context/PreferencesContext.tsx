'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

export type TextSize = 'small' | 'medium' | 'large';
export type SpeechLanguage = 'en' | 'hi';

export interface Preferences {
  textSize: TextSize;
  reducedMotion: boolean;
  speechEnabled: boolean;
  speechLanguage: SpeechLanguage;
}

interface PreferencesContextValue extends Preferences {
  setTextSize: (size: TextSize) => void;
  setReducedMotion: (value: boolean) => void;
  setSpeechEnabled: (value: boolean) => void;
  setSpeechLanguage: (value: SpeechLanguage) => void;
  speechSupported: boolean;
}

const TEXT_SIZE_STORAGE_KEY = 'signbridge-text-size';

const DEFAULT_PREFERENCES: Preferences = {
  textSize: 'medium',
  reducedMotion: false,
  speechEnabled: true,
  speechLanguage: 'en',
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getStoredTextSize(): TextSize | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    return value === 'small' || value === 'medium' || value === 'large' ? value : null;
  } catch {
    return null;
  }
}

function storeTextSize(size: TextSize): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size);
  } catch {
    // Ignore storage errors (private browsing, etc). Not critical.
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  // Reduced motion and speech are session-only: they reset on reload and are
  // never written to localStorage or any backend. This matches the
  // project's "no persistent child profiles" principle.
  // Text size is a generic site display preference, not tied to any profile,
  // so it is allowed to persist the same way the existing ThemeToggle does.
  const [textSize, setTextSizeState] = useState<TextSize>(DEFAULT_PREFERENCES.textSize);
  const [reducedMotion, setReducedMotion] = useState<boolean>(DEFAULT_PREFERENCES.reducedMotion);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(DEFAULT_PREFERENCES.speechEnabled);
  // Speech language is session-only, same as reducedMotion/speechEnabled:
  // it resets on reload and is never written to localStorage or any backend.
  const [speechLanguage, setSpeechLanguage] = useState<SpeechLanguage>(
    DEFAULT_PREFERENCES.speechLanguage
  );
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    const stored = getStoredTextSize();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTextSizeState(stored);
    }
    setSpeechSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-text-size', textSize);
  }, [textSize]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  const setTextSize = (size: TextSize) => {
    setTextSizeState(size);
    storeTextSize(size);
  };

  const value = useMemo<PreferencesContextValue>(
    () => ({
      textSize,
      reducedMotion,
      speechEnabled,
      speechLanguage,
      speechSupported,
      setTextSize,
      setReducedMotion,
      setSpeechEnabled,
      setSpeechLanguage,
    }),
    [textSize, reducedMotion, speechEnabled, speechLanguage, speechSupported]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}
