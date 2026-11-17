/**
 * A simple, hand-drawn-style illustration of two children signing to each
 * other. Plain inline SVG, no external image or illustration library, so
 * it loads instantly and needs no attribution.
 */
export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      role="img"
      aria-label="Two children smiling and signing to each other"
      className="h-auto w-full max-w-md"
    >
      <circle cx="110" cy="90" r="70" fill="var(--color-green-400)" opacity="0.18" />
      <circle cx="300" cy="170" r="85" fill="var(--color-gold-400)" opacity="0.16" />

      {/* Left child */}
      <g>
        <circle cx="120" cy="110" r="38" fill="#f4c89b" />
        <path d="M86 100c0-24 16-40 34-40s34 16 34 40" fill="#4a3324" />
        <circle cx="106" cy="108" r="4" fill="#2b2b2b" />
        <circle cx="134" cy="108" r="4" fill="#2b2b2b" />
        <path d="M108 124q12 10 24 0" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <rect x="90" y="148" width="60" height="80" rx="18" fill="var(--color-green-500)" />
        {/* waving hand */}
        <path
          d="M150 160c18-6 30-24 28-40"
          stroke="#f4c89b"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="179" cy="118" r="11" fill="#f4c89b" />
      </g>

      {/* Right child */}
      <g>
        <circle cx="270" cy="130" r="38" fill="#e8a46a" />
        <path d="M232 118c0-26 18-42 38-42s38 16 38 42" fill="#241a12" />
        <circle cx="256" cy="128" r="4" fill="#2b2b2b" />
        <circle cx="284" cy="128" r="4" fill="#2b2b2b" />
        <path d="M258 144q12 10 24 0" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" fill="none" />
        <rect x="238" y="168" width="64" height="80" rx="18" fill="var(--color-gold-500)" />
        {/* hand signing back, near the chin */}
        <path
          d="M232 150c-14-2-22-16-20-30"
          stroke="#e8a46a"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="213" cy="120" r="11" fill="#e8a46a" />
      </g>

      {/* small sparkle accents between them, purely decorative */}
      <g aria-hidden="true" opacity="0.7">
        <path d="M200 90l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="var(--color-gold-400)" />
        <circle cx="210" cy="60" r="4" fill="var(--color-green-400)" />
      </g>
    </svg>
  );
}
