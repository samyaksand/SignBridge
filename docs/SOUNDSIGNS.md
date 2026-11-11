# Talk to Sign (SoundSigns): speech to ISL gloss, with real video playback

## What it does

From the user's point of view: open "Talk to Sign" (`/soundsigns`), start the
microphone, speak a sentence, and watch a live transcript build up as you
talk. Nothing is sent anywhere automatically. When you are happy with the
transcript, you press "Confirm and translate" yourself. Only then is the
confirmed text sent to the backend for translation into ISL gloss. The gloss
is shown as text, and the matching real sign-language video clips play back
in sequence. If a browser does not support live speech recognition, a plain
text box is shown instead, with the same explicit confirm step.

If a gloss word has no matching real video clip, that word is shown with an
honest "no video for this word" warning instead of being silently dropped or
having a clip faked for it.

## How it works, step by step

1. **Capture**: `frontend/app/soundsigns/SoundSignsClient.tsx` uses the
   browser's native Web Speech API (`SpeechRecognition` /
   `webkitSpeechRecognition`) to produce a live, interim transcript while the
   user speaks. The microphone is never started automatically; the user must
   press "Start Microphone", and the recognizer is stopped cleanly on "Stop
   Microphone", on confirm, and on unmount.
2. **Confirm**: the live transcript is held in component state only. It is
   never sent to any backend until the user presses "Confirm and translate".
   This is a deliberate gate, consistent with the confirm-before-send pattern
   used elsewhere in SignBridge (for example Child Mode's confirm-before-speak
   step).
3. **Translate**: the confirmed text is POSTed as `{ "text": "<confirmed
   text>" }` to `POST http://localhost:8122/translate`, the existing,
   already-working `soundsigns-service` Flask backend (now at
   `backend/services/soundsigns/`). This is the same endpoint and port the
   originally vendored SoundSigns React frontend called; only the caller
   changed, not the backend contract.
4. **Backend call to Requesty**: `backend/services/soundsigns/transcription.py` calls
   Requesty's OpenAI-compatible router (`https://router.requesty.ai/v1` by
   default) using the same Requesty API key already used elsewhere in
   SignBridge (`backend/app/suggestions.py`), trying models in this order
   until one succeeds:
   - `nvidia/nemotron-3-super-120b-a12b`
   - `google/gemma-4-31b-it`
   - `nvidia/nemotron-3.5-lightning-30b-a3b`
   - `novita/ling-3.1-flash`
   - `mistral/leanstral-1-5`
   - `nvidia/muse-glimmer-30b`
   - `novita/inclusionai/ling-3.0-tiny`

   The response is ISL gloss text. If `REQUESTY_API_KEY` is not configured,
   the backend returns a clear `503` error, never a fabricated gloss.
5. **Gloss to video mapping**: the frontend's own
   `frontend/lib/soundsigns/islGlossVideos.ts` splits the returned gloss into
   words, matches each against the real, known list of word video filenames
   (ported from the originally vendored SoundSigns frontend's own
   `wordDatabase.js`), falls back to per-letter video clips for words with no
   matching whole-word clip (mirroring that vendored app's own
   `videoUtils.js` logic), and marks anything that still has no real video
   (not a letter, digit, or known word) as unresolved rather than guessing a
   path.
6. **Playback**: the resolved clips play back in sequence in a single
   `<video>` element, advancing automatically on each clip's `ended` event.
   Unresolved words are shown in the sequence list with a visible warning and
   are skipped during playback, never silently dropped without disclosure.

The video files themselves are served as static assets directly from this
Next.js app (`frontend/public/soundsigns-videos/`), not from the separate
vendored frontend's own Vite dev server. 151 real `.mp4` files (26 letters,
10 digits, 115 words) were copied as-is from the originally vendored
SoundSigns frontend's `public/videos/` into `frontend/public/soundsigns-videos/`
in the same `letters/`, `numbers/`, `words/` folder layout, and a sample of
filenames was checked to exist on disk after copying (`Hello.mp4`,
`Thank You.mp4`, `A.mp4`, `5.mp4`, among others).

## Tech stack actually used

- **Frontend**: Next.js, React, TypeScript. The Web Speech API is a native
  browser API, not an npm package; no new frontend dependency was added for
  speech capture. UI is built from SignBridge's own existing primitives
  (`components/ui/Button.tsx`, `components/ui/Card.tsx`,
  `components/ui/StatusMessage.tsx`) and `lucide-react` icons, already used
  throughout the rest of the app.
- **Backend** (unchanged by this work): Flask, flask-cors, the `openai`
  Python SDK (used only to talk to Requesty's OpenAI-compatible endpoint),
  python-dotenv, gunicorn, httpx. See `backend/services/soundsigns/requirements.txt`.
- **LLM access**: Requesty's router, using the same `REQUESTY_API_KEY`
  environment variable already used by `backend/app/suggestions.py`
  elsewhere in SignBridge, not a separate OpenAI key.

## Real provenance

The original feature was ported into SignBridge as a vendored, iframed demo
and has now been rebuilt as a native page that calls the same backend
directly. The underlying code and video clips are used with explicit
permission from the original SoundSigns project's authors, not under an
open-source license. The upstream SoundSigns repository is a completed
academic capstone project, not accepting further contributions. This fact
has not changed: only the in-page UI text disclosing it to end users was
removed, at the explicit request of the SignBridge project owner. The full
original disclosure still lives on disk in
`backend/services/soundsigns/README.md`, and is unchanged by this work.

The ~150 video clips themselves were, per the original authors' own
disclosure, originally sourced by them from a separate third party,
JS-Coderr's "Text-Speech to Sign Language Generator" project (2024, GitHub).
SignBridge's own permission to use these clips was separately confirmed with
the SignBridge project owner. The originally vendored SoundSigns frontend
app (`soundsigns-frontend/`) has since been deleted: once this native page
was verified to work against the same backend, nothing in the frontend
embedded or referenced that vendored app any more, so it was removed as
unused weight. `backend/services/soundsigns/` (the backend) remains on disk
as the real, vendored source of what was ported, and it was not modified
as part of this work beyond its relocation first into `vendored/` and
later into `backend/services/` for repository organization.

## Known limitations, what is verified and what is not

- **Microphone capture and confirm gating**: verified. Starting and stopping
  the Web Speech API recognizer, the live transcript updating as interim and
  final results arrive, and the explicit confirm step gating what gets sent
  to the backend were all exercised through the component's logic and its
  test suite.
- **Video asset existence**: verified for a sample of filenames after
  copying all 151 `.mp4` files into `frontend/public/soundsigns-videos/`
  (full `letters/` A to Z, full `numbers/` 0 to 9, and the 115-word list from
  the vendored word database), not individually played back end to end for
  every one of the 151 files in this pass.
- **Gloss-to-video mapping logic**: the matching and letter-fallback rules in
  `frontend/lib/soundsigns/islGlossVideos.ts` mirror the vendored app's own
  `videoUtils.js` and are covered by this feature's test suite, but were not
  exercised against a real Requesty-generated gloss string, since that
  requires a funded Requesty API key.
- **Real Requesty-backed translation, end to end**: still **not** verified
  with a real, funded Requesty API key in this environment, same as noted in
  `backend/services/soundsigns/README.md`. The backend's request logic (model
  fallback list, timeout, error classification) is unchanged and was already
  verified separately by that service's own tests; what remains unverified
  is a real live call through to Requesty's router producing a real gloss
  string that this frontend then renders.
- **Browsers without Web Speech API support**: the text-input fallback path
  is implemented and shown when `SpeechRecognition` /
  `webkitSpeechRecognition` is not present on `window`, and is covered by
  this feature's test suite, but was not manually checked in a real browser
  that lacks the API (for example older Firefox).
