'use client';

import { Hand, Type, Image as ImageIcon } from 'lucide-react';
import { usePreferences } from '@/lib/context/PreferencesContext';

// A small, focused visual inside the hero: three chips standing for signs,
// text, and pictures, the three ways SignBridge presents information. The
// chip matching the visitor's chosen communication style is highlighted, so
// the choice someone makes in "Many ways to communicate" visibly shows up
// here too, not just further down the page.
export function HeroVisual() {
  const { communicationMode } = usePreferences();
  const showIsl = communicationMode === 'isl' || communicationMode === 'combination';
  const showText = communicationMode === 'text' || communicationMode === 'combination';
  const showPictures = communicationMode === 'pictures' || communicationMode === 'combination';

  return (
    <div className="sb-hero-visual" role="img" aria-label="Signs, text, and pictures, connected">
      <div className="sb-hero-visual__chip" data-active={showIsl}>
        <Hand aria-hidden="true" size={26} className={showIsl ? 'sb-hero-visual__pulse text-[var(--color-indigo-500)]' : 'text-[var(--color-text-muted)]'} />
        <span>Signs</span>
      </div>
      <div className="sb-hero-visual__chip" data-active={showText}>
        <Type aria-hidden="true" size={26} className={showText ? 'sb-hero-visual__pulse text-[var(--color-teal-600)]' : 'text-[var(--color-text-muted)]'} />
        <span>Text</span>
      </div>
      <div className="sb-hero-visual__chip" data-active={showPictures}>
        <ImageIcon aria-hidden="true" size={26} className={showPictures ? 'sb-hero-visual__pulse text-[var(--color-violet-500)]' : 'text-[var(--color-text-muted)]'} />
        <span>Pictures</span>
      </div>
    </div>
  );
}
