'use client';

import { useMemo, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, Play, Pause, Maximize, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { AvatarPanel } from '@/components/AvatarPanel';
import { QUICK_MESSAGES } from '@/lib/data/quickMessages';
import cardsData from '@/lib/data/communicationCards.json';

type Lang = 'en' | 'hi';
type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25;

interface CardEntry {
  id: string;
  category: string;
  en: string;
  hi: string;
}

const CARDS = cardsData as CardEntry[];

function findCuratedMatch(text: string): CardEntry | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;
  return CARDS.find((c) => c.en.toLowerCase() === normalized) ?? null;
}

export function ParentModeClient() {
  const [text, setText] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [submitted, setSubmitted] = useState('');
  const [match, setMatch] = useState<CardEntry | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [listening, setListening] = useState(false);
  const [speechSupported] = useState(() =>
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }).webkitSpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition)
  );
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const hasDemo = useMemo(() => Boolean(match), [match]);

  const handleShow = () => {
    setSubmitted(text);
    setMatch(findCuratedMatch(text));
    setIsPlaying(false);
  };

  const handleQuickMessage = (en: string) => {
    setText(en);
    setSubmitted(en);
    setMatch(findCuratedMatch(en));
    setIsPlaying(false);
  };

  const handleClear = () => {
    setText('');
    setSubmitted('');
    setMatch(null);
    setIsPlaying(false);
  };

  const handleMic = () => {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognitionCtor =
      (window as unknown as { webkitSpeechRecognition?: new () => any; SpeechRecognition?: new () => any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      setText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-navy-950)] text-[var(--color-navy-text)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Parent Mode</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-navy-text-muted)]">
            Type or speak what you want to say. If it matches one of our practiced phrases,
            we will show a reference sign demonstration below.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div className="flex w-full flex-col items-center gap-4 lg:w-1/2">
            <AvatarPanel active={isPlaying && hasDemo} />
            {submitted && (
              <p className="text-center text-lg font-medium" aria-live="polite">
                {lang === 'hi' && match ? match.hi : submitted}
              </p>
            )}
          </div>

          <div className="w-full lg:w-1/2">
            <Card className="border-[var(--color-navy-border)] bg-[var(--color-navy-800)] p-5 text-[var(--color-navy-text)]">
              <div className="flex flex-col gap-4">
                <div className="flex gap-2" role="radiogroup" aria-label="Choose language">
                  {(['en', 'hi'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      role="radio"
                      aria-checked={lang === l}
                      onClick={() => setLang(l)}
                      className={`min-h-[44px] rounded-[var(--radius-md)] px-4 text-sm font-medium transition-colors ${
                        lang === l
                          ? 'bg-[var(--color-teal-500)] text-white'
                          : 'border border-[var(--color-navy-border)] text-[var(--color-navy-text-muted)]'
                      }`}
                    >
                      {l === 'en' ? 'English' : 'हिन्दी'}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    aria-label="Message to show in ISL"
                    placeholder="Type your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="border-[var(--color-navy-border)] bg-[var(--color-navy-900)] text-[var(--color-navy-text)] placeholder:text-[var(--color-navy-text-muted)]"
                  />
                  <button
                    onClick={handleMic}
                    disabled={!speechSupported}
                    aria-label={listening ? 'Stop listening' : 'Speak your message'}
                    aria-pressed={listening}
                    title={
                      speechSupported
                        ? 'Speak your message'
                        : 'Speech input is not supported in this browser'
                    }
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-navy-border)] text-[var(--color-navy-text)] disabled:opacity-40"
                  >
                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
                {!speechSupported && (
                  <p className="text-xs text-[var(--color-navy-text-muted)]">
                    Speech input is not supported in this browser. You can still type your
                    message.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {QUICK_MESSAGES.map((qm) => (
                    <button
                      key={qm.id}
                      onClick={() => handleQuickMessage(qm.en)}
                      className="min-h-[44px] rounded-full border border-[var(--color-navy-border)] px-4 text-sm text-[var(--color-navy-text)] transition-colors hover:bg-[var(--color-navy-700)]"
                    >
                      {qm.en}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleShow} className="flex-1" size="lg">
                    <SendHorizontal size={18} aria-hidden="true" />
                    Show in ISL
                  </Button>
                  <Button variant="secondary" onClick={handleClear} size="lg">
                    <RotateCcw size={18} aria-hidden="true" />
                    Clear
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="mt-4 border-[var(--color-navy-border)] bg-[var(--color-navy-800)] p-5">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy-text)]">
                Playback
              </h2>
              {hasDemo ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying((p) => !p)}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-teal-500)] text-white"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      onClick={() => setIsPlaying(false)}
                      aria-label="Reset"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-navy-border)] text-[var(--color-navy-text)]"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      aria-label="Fullscreen (not needed for this placeholder demo)"
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-navy-border)] text-[var(--color-navy-text)]"
                    >
                      <Maximize size={16} />
                    </button>
                    <div className="ml-auto flex gap-1" role="group" aria-label="Playback speed">
                      {[0.5, 0.75, 1, 1.25].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s as PlaybackSpeed)}
                          aria-pressed={speed === s}
                          className={`min-h-[36px] rounded-[var(--radius-sm)] px-2 text-xs font-medium ${
                            speed === s
                              ? 'bg-[var(--color-teal-500)] text-white'
                              : 'border border-[var(--color-navy-border)] text-[var(--color-navy-text-muted)]'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>
                  <StatusMessage kind="info">
                    This is a placeholder reference demonstration for &quot;{match?.en}&quot;,
                    not a professionally verified ISL recording yet. Real licensed sign videos
                    are planned for a future update.
                  </StatusMessage>
                </div>
              ) : (
                <StatusMessage kind="warning">
                  Sign demonstration not yet available for this phrase. SignBridge only has a
                  small set of practiced phrases so far. Try one of the quick messages above,
                  or check the Quick Cards page.
                </StatusMessage>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
