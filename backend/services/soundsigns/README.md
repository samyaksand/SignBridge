# SoundSigns speech-to-ISL service (experimental)

This is an isolated Flask service. It lives under `backend/services/` only
for folder organization; it is still a genuinely separate process with its
own dependencies, not part of SignBridge's own first-party backend code at
`backend/app/`. It vendors, with permission, the text-to-ISL-gloss
translation logic from the SoundSigns project.

## Permission and license disclosure

This code and the accompanying video clips are used with explicit
permission from the original SoundSigns project's authors. This project is not open source; it is not
redistributable without the original authors' separate permission. The upstream SoundSigns
repository ships no open-source license; its README states the project is
a completed academic capstone that is "no longer under active development"
and is "not accepting contributions or pull requests." It is used here
strictly on the basis of the authors' direct permission granted to this
project, not any open-source license grant.

The ~150 video clips vendored alongside this service (see below) were
originally sourced by the SoundSigns team from a separate third party,
JS-Coderr's "Text-Speech to Sign Language Generator" project (2024,
GitHub). Permission to use these clips in SignBridge was separately
confirmed by the SignBridge project owner.

## What is vendored here

- `transcription.py`: adapted from the original SoundSigns
  `backend/transcription.py`. The Flask routes (`POST /translate`,
  `GET /health`) and the ISL gloss system prompt are preserved from the
  original. The translation call itself was rewritten to use Requesty's
  OpenAI-compatible router (the same integration already used elsewhere in
  this project, at `backend/app/suggestions.py`) instead of a standalone
  OpenAI API key, so this feature shares the one Requesty key the rest of
  SignBridge uses rather than requiring a second, separate key. The model
  priority list, transient-error/auth-error classification, and bounded
  fallback-attempt logic are copied from `backend/app/suggestions.py`.
- `requirements.txt`: copied from the original SoundSigns backend
  (Flask, flask-cors, the `openai` Python SDK used here only to talk to
  Requesty's compatible endpoint, python-dotenv, gunicorn, httpx).

The original SoundSigns frontend (its real Vite/React app: `Microphone.jsx`,
`ISLVideoPlayer.jsx`, `ISLGlossSection.jsx`, `wordDatabase.js`,
`videoUtils.js`, the `useSpeechRecognition` hook, and all 151 real video
clips in their original `public/videos/` layout) was originally vendored,
largely unmodified, in a separate top-level folder (`soundsigns-frontend/`),
embedded into SignBridge via an iframe. That folder has since been
deleted: `frontend/app/soundsigns/` now calls this backend directly as a
native page instead of iframing the vendored frontend, so nothing in the
frontend referenced that vendored folder any more. See `docs/SOUNDSIGNS.md`
for the full history. The video clips themselves were copied into
`frontend/public/soundsigns-videos/` before that deletion and are
unaffected.

This Flask service only ever returns ISL gloss text; it never touches the
video files.

## Requires your own Requesty API key

This feature genuinely cannot produce a real translation without an LLM
call. There is no free or local path for the English-to-ISL-gloss
translation step. If `REQUESTY_API_KEY` is not set:

- `GET /health` still responds normally.
- `POST /translate` returns a clear `503` error explaining that a key is
  required, never a fabricated or placeholder translation.

To enable real translations, copy `.env.example` to `.env` in this folder
and fill in `REQUESTY_API_KEY` with your own key (the same key used
elsewhere in SignBridge; see `backend/.env.example`). Never commit `.env`.

## Running it

```bash
cd backend/services/soundsigns
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python transcription.py
# listens on http://127.0.0.1:8122
```

Or let `npm run dev:all` from the repo root start it automatically
alongside the other experimental services (see
`scripts/run-experimental-services.js`).

## What was actually verified during integration

- The Flask app starts and `GET /health` returns
  `{"status": "healthy", "service": "ISL Translator"}`.
- With no `REQUESTY_API_KEY` set, `POST /translate` returns a `503` with a
  clear, honest error message instead of crashing or fabricating output.
- A real Requesty-backed translation was **not** verified end-to-end during
  this integration, since that requires a real, funded Requesty API key
  which was not available in the integration environment. The request
  logic mirrors `backend/app/suggestions.py`'s already-used-in-production
  pattern, but the actual network call to Requesty's router was not
  exercised here.
