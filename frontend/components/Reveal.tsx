'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

// Fades and slightly raises its children in once, the first time they
// scroll into view (or immediately if already on screen at mount, e.g.
// the hero). Uses IntersectionObserver, no animation library needed.
// Both the OS prefers-reduced-motion media query and the in-app
// reducedMotion preference are already handled centrally in globals.css
// (the .sb-reveal rules collapse to a visible, static state either way),
// so this component does not need to branch on motion preference itself.
export function Reveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      // A low threshold, not a fraction of the element's own height: a tall
      // block (e.g. a long grid) may never cross a percentage-of-self
      // threshold if only its top edge is ever in view, leaving it stuck
      // invisible. 1px of intersection is enough to confirm "on screen."
      { threshold: 0 }
    );
    observer.observe(node);

    // Belt and braces: if the observer never fires for any reason, never
    // leave real content permanently invisible.
    const fallback = setTimeout(() => setVisible(true), 1200);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`sb-reveal ${visible ? 'sb-reveal--visible' : ''} ${className}`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
