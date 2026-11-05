'use client';

import Link from 'next/link';
import { HeartHandshake, Baby, Users, LayoutGrid, ShieldCheck, Sparkles, Hand } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/Logo';
import { CommunicationPreferences } from '@/components/CommunicationPreferences';
import { HeroVisual } from '@/components/HeroVisual';
import { Reveal } from '@/components/Reveal';
import { SignOfTheDay } from '@/components/isl/SignOfTheDay';
import { usePreferences, CommunicationMode } from '@/lib/context/PreferencesContext';

const ENTRIES: Array<{
  href: string;
  icon: typeof HeartHandshake;
  title: string;
  body: string;
  cta: string;
  accent: string;
  matches: CommunicationMode[];
}> = [
  {
    href: '/parent',
    icon: HeartHandshake,
    title: 'Parent Mode',
    body: 'Type or speak a message and see what sign support is ready for it.',
    cta: 'Open Parent Mode',
    accent: 'var(--color-indigo-500)',
    matches: ['isl', 'text'],
  },
  {
    href: '/child',
    icon: Baby,
    title: 'Child Mode',
    body: 'Try sign recognition in a friendly demo and build your own message.',
    cta: 'Open Child Mode',
    accent: 'var(--color-teal-600)',
    matches: ['isl'],
  },
  {
    href: '/family-practice',
    icon: Users,
    title: 'Family Practice',
    body: 'Learn and practice everyday phrases together, step by step.',
    cta: 'Start practicing',
    accent: 'var(--color-violet-500)',
    matches: ['isl', 'combination'],
  },
  {
    href: '/cards',
    icon: LayoutGrid,
    title: 'Quick Cards',
    body: '36 simple cards for things you need to say right now.',
    cta: 'Browse cards',
    accent: 'var(--color-teal-500)',
    matches: ['pictures'],
  },
  {
    href: '/explore',
    icon: Hand,
    title: 'Explore Signs',
    body: 'Search our honestly verified library of real ISL reference videos.',
    cta: 'Explore Signs',
    accent: 'var(--color-blue-500)',
    matches: ['isl', 'combination'],
  },
];

export default function Home() {
  const { communicationMode } = usePreferences();

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <Logo size={56} withWordmark={false} />
          </div>
          <h1 className="text-3xl font-semibold text-[var(--color-text)] sm:text-4xl">
            Every family deserves to understand each other.
          </h1>
          <p className="mt-2 text-lg font-medium text-[var(--color-indigo-500)]">
            Connecting hands, bridging worlds.
          </p>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-text-muted)]">
            SignBridge gives families with a deaf or hard-of-hearing child small, honest
            tools to talk more easily at home: quick cards for urgent needs, simple practice
            together, and a friendly space to try sign recognition. No camera required to
            get started.
          </p>
        </Reveal>

        <Reveal className="mt-10" delayMs={120}>
          <HeroVisual />
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ENTRIES.map((entry, i) => {
            const highlighted = entry.matches.includes(communicationMode);
            return (
              <Reveal key={entry.href} delayMs={i * 60}>
                <Card
                  data-highlighted={highlighted}
                  className="sb-mode-card group flex h-full flex-col gap-3 p-6"
                >
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

      <section className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SignOfTheDay />
        </Reveal>
      </section>

      <CommunicationPreferences />

      <section className="mx-auto mt-12 w-full max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="flex gap-3 p-6">
            <ShieldCheck aria-hidden="true" size={24} className="shrink-0 text-[var(--color-indigo-500)]" />
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
