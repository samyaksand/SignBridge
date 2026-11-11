'use client';

import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type { IslSign } from '@/lib/data/islSigns';

interface PracticeListContextValue {
  practiceList: IslSign[];
  addToPracticeList: (sign: IslSign) => void;
  removeFromPracticeList: (id: string) => void;
  isInPracticeList: (id: string) => boolean;
  clearPracticeList: () => void;
}

const PracticeListContext = createContext<PracticeListContextValue | null>(null);

/**
 * Session-only practice list, consistent with PreferencesContext's
 * reducedMotion/speechEnabled: plain useState, nothing
 * written to localStorage or any backend, resets on reload. This matches
 * the project's no-persistent-profiles principle (the only sanctioned
 * exception is textSize, handled separately in PreferencesContext).
 */
export function PracticeListProvider({ children }: { children: ReactNode }) {
  const [practiceList, setPracticeList] = useState<IslSign[]>([]);

  const value = useMemo<PracticeListContextValue>(
    () => ({
      practiceList,
      addToPracticeList: (sign) =>
        setPracticeList((list) => (list.some((s) => s.id === sign.id) ? list : [...list, sign])),
      removeFromPracticeList: (id) => setPracticeList((list) => list.filter((s) => s.id !== id)),
      isInPracticeList: (id) => practiceList.some((s) => s.id === id),
      clearPracticeList: () => setPracticeList([]),
    }),
    [practiceList]
  );

  return <PracticeListContext.Provider value={value}>{children}</PracticeListContext.Provider>;
}

export function usePracticeList(): PracticeListContextValue {
  const ctx = useContext(PracticeListContext);
  if (!ctx) {
    throw new Error('usePracticeList must be used within a PracticeListProvider');
  }
  return ctx;
}
