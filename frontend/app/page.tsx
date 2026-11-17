'use client';

import Link from 'next/link';
import { Hand, LayoutGrid, Mic, ScanEye, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/Reveal';
import { HeroIllustration } from '@/components/HeroIllustration';
import { SignOfTheDay } from '@/components/isl/SignOfTheDay';
import { PopularSigns } from '@/components/isl/PopularSigns';

const FEATURES: Array<{
  href: string;
  icon: typeof Hand;
  title: string;
  body: string;
  cta: string;
  accent: string;
  experimental?: boolean;
}> = [
  {
    href: '/explore',
    icon: Hand,
    title: 'Explore Signs',
    body: 'Discover everyday signs.',
    cta: 'Start learning',
    accent: 'var(--color-green-600)',
  },
  {
    href: '/cards',
    icon: LayoutGrid,
    title: 'Quick Cards',
    body: 'Communicate everyday needs and feelings.',
    cta: 'Browse cards',
    accent: 'var(--color-green-500)',
  },
  {
    href: '/soundsigns',
    icon: Mic,
    title: 'Talk to Sign',
    body: 'Explore speech-to-sign demonstrations.',
    cta: 'Try it',
    accent: 'var(--color-gold-600)',
    experimental: true,
  },
  {
    href: '/asl-fingerspelling-demo',
    icon: ScanEye,
    title: 'Letter Lens',
    body: 'Explore fingerspelling.',
    cta: 'Try it',
    accent: 'var(--color-gold-400)',
    experimental: true,
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <Reveal className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-bold text-[var(--color-text)] sm:text-5xl">
              Let&apos;s learn to sign!
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[var(--color-text-muted)]">
              Learn new signs. Share your feelings. Talk with everyone.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href="/explore">
                <Button variant="primary" size="lg">
                  Start Learning
                </Button>
              </Link>
              <Link href="/cards">
                <Button variant="secondary" size="lg">
                  Explore Quick Cards
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <HeroIllustration />
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.href} delayMs={i * 60}>
              <Card className="sb-mode-card group flex h-full flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <feature.icon aria-hidden="true" size={30} style={{ color: feature.accent }} />
                  {feature.experimental && (
                    <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]">
                      Experimental
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">{feature.title}</h2>
                <p className="flex-1 text-sm text-[var(--color-text-muted)]">{feature.body}</p>
                <Link
                  href={feature.href}
                  className="inline-flex min-h-[48px] w-fit items-center rounded-[var(--radius-md)] px-5 text-sm font-medium text-white transition-[filter] hover:brightness-110"
                  style={{ background: feature.accent }}
                >
                  {feature.cta}
                </Link>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <PopularSigns />
        </Reveal>
      </section>

      <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <SignOfTheDay />
        </Reveal>
      </section>

      <section className="mx-auto mt-12 w-full max-w-7xl px-4 pb-16 sm:px-6">
        <Card className="flex items-start gap-3 p-6">
          <ShieldCheck aria-hidden="true" size={24} className="shrink-0 text-[var(--color-gold-500)]" />
          <div>
            <h3 className="font-semibold text-[var(--color-text)]">Your privacy comes first</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Nothing from your camera or messages is uploaded anywhere. No account, no ads, no
              tracking.{' '}
              <Link href="/privacy" className="font-medium text-[var(--color-green-600)] underline">
                Read our privacy page
              </Link>
              .
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
