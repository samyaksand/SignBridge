'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, RotateCcw, Video, VideoOff, MessageCircle } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { StatusMessage } from '@/components/ui/StatusMessage';
import { usePreferences } from '@/lib/context/PreferencesContext';
import type { IslDictionaryEntry } from '@/lib/data/islDictionary';

/**
 * The video detail view for a single ISLRTC dictionary word. A real
 * YouTube embed with a replay control, clear source attribution, and a
 * link back to the official government dictionary page.
 */
type CameraState = 'off' | 'loading' | 'on' | 'denied';

export function DictionaryWordDialog({
  entry,
  onClose,
}: {
  entry: IslDictionaryEntry | null;
  onClose: () => void;
}) {
  const { reducedMotion } = usePreferences();
  const [playKey, setPlayKey] = useState(0);
  const [mirrorOpen, setMirrorOpen] = useState(false);
  const [cameraState, setCameraState] = useState<CameraState>('off');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopMirrorCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('off');
  }, []);

  // Always stop camera tracks on unmount or when the dialog entry changes,
  // so switching words or closing the dialog never leaves a live stream.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [entry]);

  const startMirrorCamera = async () => {
    setCameraState('loading');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('denied');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraState('on');
    } catch {
      // Camera denied or unavailable: fall back gracefully, never break the dialog.
      setCameraState('denied');
    }
  };

  // Attach the active stream to the <video> element once it exists in the DOM
  // (it only mounts once cameraState is 'on').
  useEffect(() => {
    if (cameraState === 'on' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  const toggleMirror = () => {
    if (mirrorOpen) {
      stopMirrorCamera();
      setMirrorOpen(false);
    } else {
      setMirrorOpen(true);
    }
  };

  if (!entry) return null;

  const whatsappText = encodeURIComponent(
    `Learn to sign "${entry.word}" in Indian Sign Language: ${entry.videoUrl}`
  );
  // WhatsApp's wa.me links can only pre-fill a recipient and text, they
  // cannot attach an image, that is a platform limit, not a choice here.
  // A phone number is optional: with one, the chat opens already pointed at
  // that contact, without one, it opens WhatsApp's own contact picker.
  const digitsOnly = phoneNumber.replace(/[^0-9]/g, '');
  const whatsappHref = `https://wa.me/${digitsOnly}?text=${whatsappText}`;

  return (
    <Dialog open={!!entry} onClose={onClose} title={entry.word}>
      <div className="sb-dialog-panel flex flex-col gap-4">
        <div>
          <h2 className="pr-8 text-xl font-semibold capitalize text-[var(--color-text)]">
            {entry.word}
          </h2>
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs font-medium capitalize text-[var(--color-text-muted)]">
            {entry.category}
          </span>
        </div>

        <div className="aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black">
          <iframe
            key={`${entry.videoId}-${playKey}`}
            src={`https://www.youtube.com/embed/${entry.videoId}?autoplay=1`}
            title={entry.verifiedTitle}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setPlayKey((k) => k + 1)}>
            <RotateCcw size={16} aria-hidden="true" /> Replay
          </Button>
          <a
            href={entry.videoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-green-600)] underline"
          >
            Watch on YouTube <ExternalLink size={14} aria-hidden="true" />
          </a>
          <Button
            variant="secondary"
            onClick={toggleMirror}
            aria-pressed={mirrorOpen}
          >
            {mirrorOpen ? <VideoOff size={16} aria-hidden="true" /> : <Video size={16} aria-hidden="true" />}
            Show my camera
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowPhoneInput((v) => !v)}
            aria-pressed={showPhoneInput}
          >
            <MessageCircle size={16} aria-hidden="true" /> Share on WhatsApp
          </Button>
        </div>

        {showPhoneInput && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <label
              htmlFor="whatsapp-phone"
              className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]"
            >
              Phone number (optional), include the country code
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="whatsapp-phone"
                type="tel"
                inputMode="tel"
                placeholder="e.g. 919876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="min-h-[44px] flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus-visible:shadow-[var(--focus-ring)]"
              />
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => setShowPhoneInput(false)}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-green-600)] px-4 text-sm font-medium text-white transition-[filter] hover:brightness-110"
              >
                <MessageCircle size={14} aria-hidden="true" /> Open WhatsApp
              </a>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Leave this blank to pick a contact inside WhatsApp instead. The message includes
              the word and a real link to this video. WhatsApp links cannot attach an image
              directly, so the picture is not included, only the word and the video link.
            </p>
          </div>
        )}

        {mirrorOpen && (
          <div
            className={`rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 ${
              reducedMotion ? '' : 'transition-all duration-150'
            }`}
          >
            <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
              Your camera (local preview only, never recorded or sent anywhere)
            </p>
            {cameraState === 'on' ? (
              <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-[var(--radius-md)] bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                  aria-label="Your camera preview"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full max-w-sm flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                <VideoOff size={28} aria-hidden="true" />
                <span className="text-sm">Camera is off</span>
              </div>
            )}

            <p className="mt-2 text-sm text-[var(--color-text-muted)]" role="status">
              {cameraState === 'loading' && 'Asking for camera permission...'}
              {cameraState === 'denied' &&
                'We could not turn on your camera. Maybe it is being used by another app, or permission was not given. You can still watch the reference video above.'}
              {cameraState === 'off' && 'Camera is off. Turn it on to practice next to the video.'}
              {cameraState === 'on' && 'Camera is on. It is never recorded or uploaded.'}
            </p>

            {cameraState === 'denied' && (
              <div className="mt-2">
                <StatusMessage kind="warning">
                  Camera permission was not given, or no camera is available. That is okay.
                </StatusMessage>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {cameraState === 'on' ? (
                <Button variant="secondary" size="md" onClick={stopMirrorCamera}>
                  <VideoOff size={16} aria-hidden="true" /> Turn off camera
                </Button>
              ) : (
                <Button
                  size="md"
                  onClick={startMirrorCamera}
                  disabled={cameraState === 'loading'}
                >
                  <Video size={16} aria-hidden="true" /> Turn on camera
                </Button>
              )}
            </div>
          </div>
        )}

        <p className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
          Source: {entry.attribution}, from the official Indian government ISL dictionary at{' '}
          <a
            href={entry.sourcePage}
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            divyangjan.depwd.gov.in/islrtc
          </a>
          . Verified by checking this video&apos;s real YouTube oembed data. This video comes
          from the official Indian government ISL dictionary, not from a community consent
          process.
        </p>
      </div>
    </Dialog>
  );
}
