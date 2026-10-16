export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-sm text-[var(--color-text-muted)] sm:px-6">
        <p>
          SignBridge never records or uploads your camera. Everything stays on your own
          device. Read our{' '}
          <a href="/privacy" className="font-medium text-[var(--color-teal-600)] underline">
            privacy page
          </a>{' '}
          for the full story.
        </p>
        <p>
          Sign recognition in Child Mode is a work in progress and shown as a demo right now.
          SignBridge is not a full ISL translator, it supports a small, honest set of words and
          phrases.
        </p>
        <p className="text-xs">© {new Date().getFullYear()} SignBridge. Made with care.</p>
      </div>
    </footer>
  );
}
