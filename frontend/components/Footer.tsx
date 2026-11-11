export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-[var(--color-text-muted)] sm:px-6">
        <p>
          SignBridge never records or uploads your camera. Everything stays on your own
          device. Read our{' '}
          <a href="/privacy" className="font-medium text-[var(--color-green-600)] underline">
            privacy page
          </a>{' '}
          for the full story.
        </p>
        <p>
          SignBridge is not a full ISL translator, it supports a small, honest set of words and
          phrases.
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span>© {new Date().getFullYear()} SignBridge. Made with care.</span>
          <a href="/deafblind-guide" className="font-medium underline">
            For deafblind caregivers
          </a>
        </div>
        <p className="text-xs">
          Built with ❤️ by Samyak Sanjay Sand.{' '}
          <a
            href="https://github.com/samyaksand/SignBridge"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--color-green-600)] underline"
          >
            GitHub
          </a>{' '}
          <a
            href="https://www.linkedin.com/in/samyak-sand/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--color-green-600)] underline"
          >
            LinkedIn
          </a>
        </p>
      </div>
    </footer>
  );
}
