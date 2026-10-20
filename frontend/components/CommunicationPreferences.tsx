'use client';

import { Hand, Type, Image as ImageIcon, Layers, TextCursorInput, Wand2, Volume2, VolumeX } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import {
  usePreferences,
  CommunicationMode,
  TextLanguage,
  TextSize,
} from '@/lib/context/PreferencesContext';

const MODES: Array<{ value: CommunicationMode; icon: typeof Hand; label: string; body: string }> = [
  {
    value: 'isl',
    icon: Hand,
    label: 'ISL references',
    body: 'Show sign language references first, like the demo in Parent Mode.',
  },
  {
    value: 'text',
    icon: Type,
    label: 'Written text',
    body: 'Show plain written words in English or Hindi.',
  },
  {
    value: 'pictures',
    icon: ImageIcon,
    label: 'Picture cards',
    body: 'Show simple pictures first, like Quick Cards.',
  },
  {
    value: 'combination',
    icon: Layers,
    label: 'A combination',
    body: 'Show signs, text, and pictures together wherever we can.',
  },
];

const TEXT_SIZES: Array<{ value: TextSize; label: string }> = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export function CommunicationPreferences() {
  const {
    communicationMode,
    setCommunicationMode,
    textLanguage,
    setTextLanguage,
    textSize,
    setTextSize,
    reducedMotion,
    setReducedMotion,
    speechEnabled,
    setSpeechEnabled,
    speechSupported,
  } = usePreferences();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="communication-prefs-heading">
      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <Wand2 aria-hidden="true" size={24} className="mt-1 shrink-0 text-[var(--color-indigo-500)]" />
          <div>
            <h2 id="communication-prefs-heading" className="text-xl font-semibold text-[var(--color-text)]">
              Many ways to communicate
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">
              Tell us how you like to see things. This changes how information looks across
              SignBridge, it does not add a new translation feature. These choices last for
              this visit only, except text size, which is saved like your light or dark theme.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">How should we show you information?</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Communication style">
            {MODES.map((mode) => {
              const active = communicationMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCommunicationMode(mode.value)}
                  className={`flex flex-col items-start gap-2 rounded-[var(--radius-md)] border p-4 text-left transition-colors ${
                    active
                      ? 'border-[var(--color-indigo-500)] bg-[var(--color-indigo-500)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-indigo-400)]'
                  }`}
                >
                  <mode.icon
                    aria-hidden="true"
                    size={22}
                    className={active ? 'text-[var(--color-indigo-500)]' : 'text-[var(--color-text-muted)]'}
                  />
                  <span className="font-medium text-[var(--color-text)]">{mode.label}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{mode.body}</span>
                </button>
              );
            })}
          </div>

          {(communicationMode === 'text' || communicationMode === 'combination') && (
            <div className="mt-4 flex items-center gap-3">
              <TextCursorInput aria-hidden="true" size={18} className="text-[var(--color-text-muted)]" />
              <span className="text-sm text-[var(--color-text)]">Written text language:</span>
              <div className="flex gap-2" role="group" aria-label="Text language">
                {(['en', 'hi'] as TextLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    aria-pressed={textLanguage === lang}
                    onClick={() => setTextLanguage(lang)}
                    className={`min-h-[40px] rounded-full border px-4 text-sm font-medium transition-colors ${
                      textLanguage === lang
                        ? 'border-[var(--color-teal-500)] bg-[var(--color-teal-500)] text-white'
                        : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-teal-400)]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : 'Hindi'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Text size</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Makes text bigger or smaller everywhere on the site.
            </p>
            <div className="mt-3 flex gap-2" role="group" aria-label="Text size">
              {TEXT_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  aria-pressed={textSize === size.value}
                  onClick={() => setTextSize(size.value)}
                  className={`min-h-[44px] rounded-[var(--radius-md)] border px-4 text-sm font-medium transition-colors ${
                    textSize === size.value
                      ? 'border-[var(--color-indigo-500)] bg-[var(--color-indigo-500)] text-white'
                      : 'border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-indigo-400)]'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Reduce motion</h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Turns off the drifting background and other gentle animations.
            </p>
            <div className="mt-3">
              <Button
                variant={reducedMotion ? 'primary' : 'secondary'}
                size="md"
                aria-pressed={reducedMotion}
                onClick={() => setReducedMotion(!reducedMotion)}
              >
                {reducedMotion ? 'Motion reduced' : 'Reduce motion'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">Speech</h3>
          <p className="mt-1 max-w-xl text-xs text-[var(--color-text-muted)]">
            Lets Quick Cards and Child Mode read your message out loud when you choose the
            Speak button. This never speaks on its own, it only turns the Speak button on
            or off.
          </p>
          <div className="mt-3">
            {speechSupported ? (
              <Button
                variant={speechEnabled ? 'primary' : 'secondary'}
                size="md"
                aria-pressed={speechEnabled}
                onClick={() => setSpeechEnabled(!speechEnabled)}
              >
                {speechEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
                {speechEnabled ? 'Speech turned on' : 'Speech turned off'}
              </Button>
            ) : (
              <StatusMessage kind="warning">
                This browser does not support spoken readouts, so Speak buttons will stay off.
              </StatusMessage>
            )}
          </div>
        </div>
      </Card>
    </section>
  );
}
