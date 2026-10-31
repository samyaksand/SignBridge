'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, RotateCcw, Play, Pause, Maximize, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { LazyAvatarStage } from '@/components/avatar/LazyAvatarStage';
import { QUICK_MESSAGES } from '@/lib/data/quickMessages';
import cardsData from '@/lib/data/communicationCards.json';
import { resolveAnimationClip, SIGN_ANIMATION_MAP } from '@/lib/data/signAnimationMap';

type Lang = 'en' | 'hi';
type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25;

interface CardEntry {
  id: string;
  category: string;
  en: string;
  hi: string;
}

const CARDS = cardsData as CardEntry[];

/**
 * Finds a curated match for typed/spoken text. This checks against the
 * animation map (frontend/lib/data/signAnimationMap.ts), which is the
 * actual source of truth for "do we have a demo animation for this
 * phrase", not communicationCards.json. The two previously fell out of
 * sync: typing an animation-mapped phrase that was not also a literal
 * Quick Card (e.g. "I am sorry") always fell through to "not yet
 * available" even though an animation existed, because the old lookup
 * only ever searched the cards list. Matching here is case-insensitive and
 * trims surrounding whitespace.
 *
 * When the text also corresponds to a known communication card, that
 * card's bilingual (en/hi) label is used for the on-screen text below the
 * avatar; otherwise a lightweight synthetic entry is returned so the
 * animation can still play for phrases that exist in the animation map but
 * are not (yet) a Quick Card.
 */
function findCuratedMatch(text: string): CardEntry | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  const hasAnimation = SIGN_ANIMATION_MAP.some((entry) => entry.label === normalized);
  if (!hasAnimation) return null;

  const card = CARDS.find((c) => c.en.toLowerCase() === normalized);
  if (card) return card;

  // Animation-mapped phrase with no matching Quick Card: still a genuine
  // curated match, just without a Hindi translation to show alongside it.
  return { id: `anim-${normalized.replace(/\s+/g, '-')}`, category: 'Animation only', en: text.trim(), hi: text.trim() };
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
  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const [fullscreenSupported] = useState(() =>
    typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen)
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Keeps the button's state truthful if the user exits fullscreen via Esc
    // or a browser chrome control instead of this button.
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const hasDemo = useMemo(() => Boolean(match), [match]);
  const animationEntry = useMemo(
    () => (match ? resolveAnimationClip(match.en) : resolveAnimationClip('')),
    [match]
  );

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
    interface SpeechRecognitionResultLike {
      results?: { [index: number]: { [index: number]: { transcript: string } } };
    }
    interface SpeechRecognitionLike {
      lang: string;
      interimResults: boolean;
      onresult: ((event: SpeechRecognitionResultLike) => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    }
    const SpeechRecognitionCtor =
      (window as unknown as {
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
        SpeechRecognition?: new () => SpeechRecognitionLike;
      }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionResultLike) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      setText(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleToggleFullscreen = async () => {
    if (!fullscreenSupported || !avatarContainerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await avatarContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // If the browser refuses (e.g. not a user gesture in some edge case),
      // leave the UI in whatever state it actually ended up in rather than
      // claiming a mode change that did not happen.
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] text-[var(--color-navy-text)]"
      style={{
        background:
          'radial-gradient(60rem 40rem at 15% -10%, rgba(81,70,224,0.16), transparent 55%), radial-gradient(50rem 36rem at 100% 10%, rgba(21,144,153,0.12), transparent 55%), var(--color-navy-950)',
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Parent Mode</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-navy-text-muted)]">
            Type or speak what you want to say. If it matches one of our practiced phrases,
            we will show a reference sign demonstration below.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div ref={avatarContainerRef} className="flex w-full flex-col items-center gap-4 lg:w-1/2">
            <LazyAvatarStage
              clipName={animationEntry.clipName}
              isPlaying={isPlaying && hasDemo}
              speed={speed}
              hasDemo={hasDemo}
            />
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
                          ? 'bg-[var(--color-indigo-500)] text-white'
                          : 'border border-[var(--color-navy-border)] text-[var(--color-navy-text-muted)] hover:border-[var(--color-indigo-400)]'
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
                    className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border text-[var(--color-navy-text)] transition-colors disabled:opacity-40 ${
                      listening
                        ? 'border-[var(--color-teal-400)] bg-[var(--color-teal-600)]/20'
                        : 'border-[var(--color-navy-border)] hover:border-[var(--color-indigo-400)]'
                    }`}
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
                  <div className="flex flex-wrap items-center gap-2">
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
                      onClick={handleToggleFullscreen}
                      disabled={!fullscreenSupported}
                      aria-label={
                        fullscreenSupported
                          ? isFullscreen
                            ? 'Exit fullscreen'
                            : 'View avatar fullscreen'
                          : 'Fullscreen is not supported in this browser'
                      }
                      aria-pressed={isFullscreen}
                      title={
                        fullscreenSupported
                          ? isFullscreen
                            ? 'Exit fullscreen'
                            : 'View avatar fullscreen'
                          : 'Fullscreen is not supported in this browser'
                      }
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-[var(--color-navy-text)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        isFullscreen
                          ? 'border-[var(--color-teal-400)] bg-[var(--color-teal-600)]/20'
                          : 'border-[var(--color-navy-border)]'
                      }`}
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
