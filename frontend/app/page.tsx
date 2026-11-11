'use client';

import Link from 'next/link';
import { LayoutGrid, ShieldCheck, Sparkles, Mic, ScanEye } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';
import { Reveal } from '@/components/Reveal';
import { SignOfTheDay } from '@/components/isl/SignOfTheDay';
import { HomeExplorePreview } from '@/components/isl/HomeExplorePreview';

const ENTRIES: Array<{
  href: string;
  icon: typeof LayoutGrid;
  title: string;
  body: string;
  cta: string;
  accent: string;
}> = [
  {
    href: '/cards',
    icon: LayoutGrid,
    title: 'Quick Cards',
    body: '136 simple cards for things you need to say right now.',
    cta: 'Browse cards',
    accent: 'var(--color-green-500)',
  },
  {
    href: '/soundsigns',
    icon: Mic,
    title: 'Talk to Sign',
    body: 'Speak a sentence and watch it come to life in sign language, right in your browser.',
    cta: 'Try it',
    accent: 'var(--color-gold-600)',
  },
  {
    href: '/asl-fingerspelling-demo',
    icon: ScanEye,
    title: 'Letter Lens',
    body: 'Spell out letters with your hands and watch SignBridge read them back, live.',
    cta: 'Try it',
    accent: 'var(--color-gold-400)',
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={56} withWordmark={false} />
          </div>
          <p className="mb-3 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-green-600)]">
            <span className="rounded-full border border-[var(--color-green-400)] px-3 py-1">
              Free
            </span>
            <span className="rounded-full border border-[var(--color-green-400)] px-3 py-1">
              No login
            </span>
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">
            Signing is how your family already talks. We just help you learn it together.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-text-muted)]">
            For a deaf or hard-of-hearing child, sign language is not something to fix or
            translate away, it is a first language. SignBridge helps families build real,
            everyday communication at home: a child telling their mother they are hungry,
            scared, or proud, without waiting for a class they cannot afford or a slot that
            is not open yet. Classes cost money and time many families do not have. We built
            this because the real gap is not ability, it is access.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <HomeExplorePreview />
        </Reveal>
      </section>

      <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ENTRIES.map((entry, i) => {
            return (
              <Reveal key={entry.href} delayMs={i * 60}>
                <Card className="sb-mode-card group flex h-full flex-col gap-3 p-6">
                  <entry.icon aria-hidden="true" size={28} style={{ color: entry.accent }} />
                  <h2 className="text-xl font-semibold text-[var(--color-text)]">{entry.title}</h2>
                  <p className="flex-1 text-sm text-[var(--color-text-muted)]">{entry.body}</p>
                  <Link
                    href={entry.href}
                    className="inline-flex min-h-[48px] w-fit items-center rounded-[var(--radius-md)] px-5 text-sm font-medium text-white transition-[filter] hover:brightness-110"
                    style={{ background: entry.accent }}
                  >
                    {entry.cta}
                  </Link>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SignOfTheDay />
        </Reveal>
      </section>

      <section className="mx-auto mt-12 w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex gap-3 p-6">
            <ShieldCheck aria-hidden="true" size={24} className="shrink-0 text-[var(--color-gold-500)]" />
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
