import '@testing-library/jest-dom/vitest';

// jsdom does not implement SpeechSynthesis. Provide a minimal mock so
// features that check for support (and tests that exercise them) behave
// as they would in a real browser that supports speech.
if (typeof window !== 'undefined' && !('speechSynthesis' in window)) {
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: () => {}, cancel: () => {} },
    configurable: true,
    writable: true,
  });
}
if (typeof window !== 'undefined' && !('SpeechSynthesisUtterance' in window)) {
  // @ts-expect-error minimal test stub
  window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text: string) {
    return { text };
  };
}
