'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Mic, MicOff, Search, SendHorizontal, BookmarkPlus, BookmarkCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { SignVideo } from '@/components/isl/SignVideo';
import { SignCard } from '@/components/isl/SignCard';
import { QUICK_MESSAGES } from '@/lib/data/quickMessages';
import { usePracticeList } from '@/lib/context/PracticeListContext';
import { useSignSearch } from '@/lib/hooks/useSignSearch';
import type { IslSign } from '@/lib/data/islSigns';

type Lang = 'en' | 'hi';

/**
 * Parent Mode no longer renders a 3D avatar. The previous CesiumMan-based
 * avatar had no finger bones and could only play simplified body gestures
 * labeled verifiedIsl:false everywhere; it was never a real ISL
 * demonstration and has been removed from this screen entirely (the
 * component files themselves are untouched, see
 * frontend/components/avatar/, they are simply no longer imported here).
 *
 * This screen is now built around SignBridge's verified ISL reference
 * video library (frontend/lib/data/islSigns.ts). It does not claim to
 * translate arbitrary English or Hindi text into ISL: that capability
 * never existed honestly. It lets a parent search the same verified
 * library used in Explore Signs, watch the real reference videos, and
 * build a simple message out of supported signs.
 */
export function ParentModeClient() {
  const [lang, setLang] = useState<Lang>('en');
  const [messageSigns, setMessageSigns] = useState<IslSign[]>([]);
  const [listening, setListening] = useState(false);
  const { query, setQuery, category, setCategory, categories, results } = useSignSearch();
  const { practiceList, addToPracticeList, removeFromPracticeList, isInPracticeList } =
    usePracticeList();

  const [speechSupported] = useState(() =>
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown })
        .webkitSpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
    )
  );

  const messageText = useMemo(() => messageSigns.map((s) => s.title).join(', '), [messageSigns]);

  const handleMic = () => {
    if (!speechSupported) return;
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
      setQuery(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  const addToMessage = (sign: IslSign) => {
    setMessageSigns((list) => (list.some((s) => s.id === sign.id) ? list : [...list, sign]));
  };
  const removeFromMessage = (id: string) => {
    setMessageSigns((list) => list.filter((s) => s.id !== id));
  };
  const clearMessage = () => setMessageSigns([]);

  const speakMessage = () => {
    // Speech only ever fires after this explicit button press on a
    // message the parent themselves assembled and can see in full,
    // never automatically and never on unconfirmed text.
    if (messageSigns.length === 0) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(messageText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] text-[var(--color-navy-text)]"
      style={{
        background:
          'radial-gradient(60rem 40rem at 15% -10%, rgba(81,70,224,0.16), transparent 55%), radial-gradient(50rem 36rem at 100% 10%, rgba(21,144,153,0.12), transparent 55%), var(--color-navy-950)',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Parent Mode</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-navy-text-muted)]">
            Search our verified ISL reference videos, watch the real demonstration, and build a
            message from the signs we actually have. SignBridge does not translate arbitrary
            text into ISL. For a word we do not have yet, try{' '}
            <Link href="/cards" className="underline">
              Quick Cards
            </Link>{' '}
            or{' '}
            <Link href="/explore" className="underline">
              Explore Signs
            </Link>
            .
          </p>
        </div>

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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-4">
            <Card className="border-[var(--color-navy-border)] bg-[var(--color-navy-800)] p-5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-navy-text-muted)]"
                  />
                  <Input
                    aria-label="Search the verified sign library"
                    placeholder="Search signs, e.g. greetings, conversation..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="border-[var(--color-navy-border)] bg-[var(--color-navy-900)] pl-9 text-[var(--color-navy-text)] placeholder:text-[var(--color-navy-text-muted)]"
                  />
                </div>
                <button
                  onClick={handleMic}
                  disabled={!speechSupported}
                  aria-label={listening ? 'Stop listening' : 'Search by speaking'}
                  aria-pressed={listening}
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
                <p className="mt-2 text-xs text-[var(--color-navy-text-muted)]">
                  Speech input is not supported in this browser. You can still type to search.
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                <button
                  onClick={() => setCategory('all')}
                  aria-pressed={category === 'all'}
                  className={`min-h-[36px] rounded-full border px-3 text-xs font-medium capitalize ${
                    category === 'all'
                      ? 'border-[var(--color-teal-400)] bg-[var(--color-teal-600)]/30'
                      : 'border-[var(--color-navy-border)] text-[var(--color-navy-text-muted)]'
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={`min-h-[36px] rounded-full border px-3 text-xs font-medium capitalize ${
                      category === c
                        ? 'border-[var(--color-teal-400)] bg-[var(--color-teal-600)]/30'
                        : 'border-[var(--color-navy-border)] text-[var(--color-navy-text-muted)]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_MESSAGES.slice(0, 6).map((qm) => (
                  <button
                    key={qm.id}
                    onClick={() => setQuery(qm.en)}
                    className="min-h-[36px] rounded-full border border-[var(--color-navy-border)] px-3 text-xs text-[var(--color-navy-text)] hover:bg-[var(--color-navy-700)]"
                  >
                    {qm.en}
                  </button>
                ))}
              </div>
            </Card>

            {results.length === 0 ? (
              <StatusMessage kind="empty">
                No verified signs match that search. Try a different word or category.
              </StatusMessage>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.map((sign) => (
                  <div key={sign.id} className="flex flex-col gap-2">
                    <SignCard sign={sign} onSelect={addToMessage} />
                    <Button
                      size="md"
                      variant="secondary"
                      onClick={() =>
                        isInPracticeList(sign.id)
                          ? removeFromPracticeList(sign.id)
                          : addToPracticeList(sign)
                      }
                    >
                      {isInPracticeList(sign.id) ? (
                        <>
                          <BookmarkCheck size={14} aria-hidden="true" /> Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={14} aria-hidden="true" /> Save
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card className="border-[var(--color-navy-border)] bg-[var(--color-navy-800)] p-5">
              <h2 className="mb-3 text-sm font-semibold text-[var(--color-navy-text)]">
                Your message
              </h2>
              {messageSigns.length === 0 ? (
                <StatusMessage kind="empty">
                  Tap a sign on the left to add it here. We will show its real reference video.
                </StatusMessage>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {messageSigns.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => removeFromMessage(s.id)}
                        aria-label={`Remove ${s.title}`}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-navy-700)] px-3 text-sm text-[var(--color-navy-text)]"
                      >
                        {s.title} <X size={14} aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={speakMessage} size="lg">
                      <SendHorizontal size={18} aria-hidden="true" />
                      Speak
                    </Button>
                    <Button variant="secondary" onClick={clearMessage} size="lg">
                      Clear
                    </Button>
                  </div>
                  <div className="border-t border-[var(--color-navy-border)] pt-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-navy-text-muted)]">
                      Reference videos
                    </h3>
                    <div className="flex flex-col gap-4">
                      {messageSigns.map((s) => (
                        <SignVideo key={s.id} sign={s} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {practiceList.length > 0 && (
              <Card className="border-[var(--color-navy-border)] bg-[var(--color-navy-800)] p-5">
                <h2 className="mb-2 text-sm font-semibold text-[var(--color-navy-text)]">
                  Saved for practice ({practiceList.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {practiceList.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full bg-[var(--color-navy-700)] px-3 py-1 text-xs text-[var(--color-navy-text)]"
                    >
                      {s.title}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
