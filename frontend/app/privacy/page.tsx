export const metadata = { title: 'Privacy, SignBridge' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">Privacy, in plain words</h1>
      <div className="mt-5 flex flex-col gap-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
        <p>
          Your camera never leaves your device. SignBridge reads the video right in your
          browser and never uploads or records it, not even for a second.
        </p>
        <p>
          There is no account to make. We do not store any history of what you or your child
          practiced. When you close the tab, it is gone.
        </p>
        <p>No ads, no trackers, no analytics scripts watching what you do.</p>
        <p>
          Family Practice and Child Mode only keep things in memory while the page is open.
          Nothing is saved to a server.
        </p>
        <p>
          If a future version adds optional AI-powered suggestions (through a service called
          Requesty), it will only ever send the words you already confirmed, never raw video
          or camera data, and only if you or a grown-up turns it on with their own API key.
        </p>
        <p>
          Read the full technical details in{' '}
          <code className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5">
            docs/PRIVACY.md
          </code>{' '}
          in this project&apos;s repository.
        </p>
      </div>
    </div>
  );
}
