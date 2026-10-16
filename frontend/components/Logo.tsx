export function Logo({ size = 32, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="SignBridge logo"
      >
        <circle cx="24" cy="24" r="22" fill="url(#sb-grad)" />
        <path
          d="M14 28c2-6 6-10 10-10s8 4 10 10"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="14" cy="28" r="3" fill="white" />
        <circle cx="34" cy="28" r="3" fill="white" />
        <defs>
          <linearGradient id="sb-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0e7c86" />
            <stop offset="1" stopColor="#3a6bf0" />
          </linearGradient>
        </defs>
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-[var(--color-text)]">
          SignBridge
        </span>
      )}
    </span>
  );
}
