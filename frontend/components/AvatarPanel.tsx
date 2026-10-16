export function AvatarPanel({ active }: { active: boolean }) {
  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-navy-border)] bg-[var(--color-navy-800)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(58,107,240,0.35), transparent 60%)',
        }}
      />
      <svg
        viewBox="0 0 200 220"
        width="70%"
        role="img"
        aria-label={
          active
            ? 'Animated placeholder avatar showing a sign demonstration is playing'
            : 'Placeholder avatar, sign demonstration not available yet'
        }
        className={active ? 'motion-safe:animate-[sb-sway_2.4s_ease-in-out_infinite]' : ''}
      >
        <ellipse cx="100" cy="205" rx="60" ry="10" fill="rgba(0,0,0,0.25)" />
        <rect x="55" y="110" width="90" height="90" rx="30" fill="#2b3a63" />
        <circle cx="100" cy="70" r="42" fill="#3a4b7a" />
        <circle cx="84" cy="66" r="5" fill="#eef1fb" />
        <circle cx="116" cy="66" r="5" fill="#eef1fb" />
        <path d="M82 84c6 6 30 6 36 0" stroke="#eef1fb" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path
          d="M55 140c-15 10-20 30-15 45"
          stroke="#6a8ef6"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M145 140c15 10 20 30 15 45"
          stroke="#6a8ef6"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-[var(--color-navy-text-muted)]">
        Avatar placeholder, coming soon
      </span>
      <style>{`
        @keyframes sb-sway {
          0%, 100% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
        }
      `}</style>
    </div>
  );
}
