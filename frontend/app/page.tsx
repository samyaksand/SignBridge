import Link from 'next/link';
import { HeartHandshake, Baby, Users, LayoutGrid, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';

const ENTRIES = [
  {
    href: '/parent',
    icon: HeartHandshake,
    title: 'Parent Mode',
    body: 'Type or speak a message and see what sign support is ready for it.',
    cta: 'Open Parent Mode',
  },
  {
    href: '/child',
    icon: Baby,
    title: 'Child Mode',
    body: 'Try sign recognition in a friendly demo and build your own message.',
    cta: 'Open Child Mode',
  },
  {
    href: '/family-practice',
    icon: Users,
    title: 'Family Practice',
    body: 'Learn and practice everyday phrases together, step by step.',
    cta: 'Start practicing',
  },
  {
    href: '/cards',
    icon: LayoutGrid,
    title: 'Quick Cards',
    body: '36 simple cards for things you need to say right now.',
    cta: 'Browse cards',
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={56} withWordmark={false} />
          </div>
          <h1 className="text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">
            SignBridge
          </h1>
          <p className="mt-2 text-lg font-medium text-[var(--color-teal-600)]">
            Connecting hands, bridging worlds.
          </p>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-text-muted)]">
            Many families with a deaf or hard-of-hearing child want to talk more easily at
            home, but learning a whole new language together takes time. SignBridge gives you
            small, honest tools you can use today: quick cards for urgent needs, simple
            practice together, and a friendly space to try sign recognition, no camera
            required to get started.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ENTRIES.map((entry) => (
            <Card key={entry.href} className="flex flex-col gap-3 p-6">
              <entry.icon aria-hidden="true" size={28} className="text-[var(--color-teal-600)]" />
              <h2 className="text-xl font-semibold text-[var(--color-text)]">{entry.title}</h2>
              <p className="flex-1 text-sm text-[var(--color-text-muted)]">{entry.body}</p>
              <Link
                href={entry.href}
                className="inline-flex min-h-[48px] w-fit items-center rounded-[var(--radius-md)] bg-[var(--color-teal-600)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-teal-500)]"
              >
                {entry.cta}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex gap-3 p-6">
            <ShieldCheck aria-hidden="true" size={24} className="shrink-0 text-[var(--color-teal-600)]" />
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">Your privacy comes first</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Nothing from your camera or messages is uploaded anywhere. No account, no ads,
                no tracking. Everything happens right in your browser.
              </p>
            </div>
          </Card>
          <Card className="flex gap-3 p-6">
            <Sparkles aria-hidden="true" size={24} className="shrink-0 text-[var(--color-warning)]" />
            <div>
              <h3 className="font-semibold text-[var(--color-text)]">Still learning, like us</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Sign recognition here is experimental and shown in demo mode. SignBridge covers
                a small, carefully chosen set of words, not full ISL translation.
              </p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
