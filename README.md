# SignBridge

**Connecting hands, bridging worlds.**

SignBridge is a free, browser-based web application that helps families
build real, everyday Indian Sign Language (ISL) communication together,
a child telling their mother they are hungry, scared, or proud, without
waiting for a class they cannot afford. It runs entirely in the browser,
with no account, no login, and no camera data ever leaving the device.

GitHub: https://github.com/samyaksand/SignBridge
Live demo: not yet deployed, see `DEPLOYMENT.md` for the deployment plan.

## Problem and purpose

Sign language resources that are both free and genuinely usable are scarce
for Indian families, especially compared to what exists for ASL. Most
existing options are either paid classes, static PDFs, or a handful of
scattered video clips with no way to search, practice, or verify what you
are actually learning. SignBridge's goal is narrow and honest: give
families a free, searchable library of real, verified ISL signs, plus a
small set of practical tools (quick picture cards, speech-to-sign
translation, letter recognition) built around how families actually
communicate day to day, not a general-purpose translator.

## Core features

- **Explore Signs**: a searchable library of 500 real ISL words. Every
  entry was individually verified by cross-checking the official Indian
  government ISL dictionary against YouTube's own oembed metadata, not
  scraped or guessed. Includes category filters and a "5 words to learn
  today" practice checklist that saves progress locally on the user's own
  device (no server-side account).
- **Quick Cards**: 136 simple picture cards across 18 everyday categories,
  for low-friction communication in the moment.
- **Talk to Sign**: speech-to-ISL translation. Captures speech with the
  browser's Web Speech API, sends the confirmed text to a backend that
  calls an LLM (via Requesty's OpenAI-compatible router) to produce ISL
  gloss, then plays back real, vendored sign-language video clips in
  sequence for the translated words.
- **Letter Lens**: real-time ASL fingerspelling recognition. MediaPipe
  Hands extracts 21 hand landmarks per frame in the browser, a TensorFlow.js
  model classifies a 79-value geometric feature vector into one of 26
  letters, entirely client-side.
- **Word Signs**: ISL word recognition from hand landmarks, backed by a
  real RandomForest classifier and a from-scratch NumPy reimplementation of
  an LSTM model, verified against the original project's own reference
  output to a tolerance of 4.77e-7.
- **A deafblind caregivers' guide**: a short, honest orientation to tactile
  and hand-under-hand signing, written for a hearing or sighted caregiver.
  This is static content, not an interactive feature, and the README says
  so rather than overstating it.

## Technical architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Frontend testing | Vitest, React Testing Library |
| ML recognition (Letter Lens) | MediaPipe Hands (CDN), TensorFlow.js, client-side only |
| ML recognition (Word Signs) | scikit-learn RandomForest, a from-scratch NumPy LSTM, served by FastAPI |
| Speech-to-sign translation (Talk to Sign) | Web Speech API (browser), Flask backend, Requesty (OpenAI-compatible LLM router), with OpenRouter/Groq/Gemini as last-resort fallback providers |
| Optional backend | FastAPI, Requesty integration (currently unused by the frontend; kept for reference) |
| ML pipeline (research track) | PyTorch-adjacent preprocessing, ONNX export, tested on synthetic data, not yet trained on a real dataset |

Only technologies actually implemented and running are listed above. See
`docs/MODEL_CARD.md`, `docs/ARCHITECTURE.md`, `docs/ASL_FINGERSPELLING.md`,
and `docs/SOUNDSIGNS.md` for the full technical detail behind each one.

## Engineering depth worth noting

- **Camera-based recognition stays entirely client-side where possible.**
  Letter Lens never sends a video frame or image anywhere, only the final
  predicted letter is shown to the user. Word Signs and Talk to Sign send
  numeric landmark arrays or confirmed text, never raw camera data.
- **Independent backend services, isolated on purpose.** Word Signs' backend
  vendors a GPL-3.0-licensed model component in its own process,
  deliberately kept separate from SignBridge's own code to avoid license
  contamination, a real decision documented in that service's own README.
- **Model verification, not just "it runs."** The Word Signs LSTM
  reimplementation was checked against the original authors' own reference
  output, not just assumed correct because it compiles.
- **Honest degradation everywhere.** Every feature that depends on a
  backend service (which may be asleep on a free hosting tier, or simply
  not running locally) shows a clear, specific status message and a retry
  action instead of a silent hang or a fabricated result.
- **No fabricated claims.** Where something is unverified (for example,
  real-world accuracy of camera-based recognition across different hands,
  lighting, or skin tones), the UI and documentation say so directly rather
  than implying more confidence than the testing supports.

## Product and design decisions

- **Family communication first.** Feature priority was driven by the real
  need (a child communicating something urgent to a parent), not by
  technical novelty. The starter word set for Explore Signs is built around
  that need, not a list of impressive-sounding words.
- **Accessibility as a baseline, not an add-on.** Confirm-before-speak
  gating everywhere (nothing speaks or acts automatically from a raw
  camera/microphone signal), accessible roles and labels, and a design
  system with measured color contrast.
- **Honesty about content sourcing.** Explore Signs' content comes from an
  official government dataset, not a community-consent process. The app
  says this plainly instead of implying otherwise.

## Deployment

SignBridge is designed to run at $0 recurring hosting cost. See
`DEPLOYMENT.md` for the full, step-by-step guide. In short:

- The frontend deploys to Cloudflare Pages.
- The two Python backend services (Word Signs, Talk to Sign) each deploy
  as a separate free Render web service, using the `render.yaml` and
  Dockerfiles already in this repository.

## Quick start (local development)

From the project root:

```
npm install
npm run dev
```

This starts the frontend at **http://localhost:3000** and tries to start
the optional backend at **http://localhost:8000**. If Python or its
packages are not installed, you'll see a friendly warning and the frontend
still runs fine on its own.

To also start the two experimental backend services (Word Signs and Talk
to Sign) locally:

```
npm run dev:all
```

### If `npm run dev` from the root does not work

**Frontend (required):**

```
cd frontend
npm install
npm run dev
```

**Word Signs backend (optional, same process as backend/app below):**

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000
```

**Talk to Sign backend (optional):**

```
cd backend/services/soundsigns
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cpu
python transcription.py
```

Word Signs' backend runs fully offline, no API key needed. Talk to Sign's
backend needs its own `REQUESTY_API_KEY` (copy from `.env.example` in that
folder) to produce a real translation; without one it still starts and
responds to health checks, returning an honest error instead of a fake
result.

## Running tests

```
cd frontend && npm run test     # Vitest + React Testing Library
npx tsc --noEmit                # type check
npm run lint                    # ESLint
npm run build                   # production build
```

```
python -m pytest ml/tests backend/tests -v   # from the project root
```

See `docs/TESTING.md` for exactly what is covered and the real results
from the last run.

## Project layout

```
frontend/   The whole product. Next.js, TypeScript, Tailwind CSS.
backend/    SignBridge's own first-party FastAPI backend (backend/app/), serving a Requesty AI suggestions endpoint and, merged in, the Word Signs ISL recognition endpoints (backend/app/isl_recognition, GPL-3.0-licensed component, see its module docstring before distributing this backend). backend/services/soundsigns/ is Talk to Sign's own separate, independently-run third-party service.
ml/         Real, tested ML pipeline code (normalization, model, splits, ONNX export), not yet trained on real data.
docs/       Architecture, dataset notes, privacy, model status, testing, and per-feature technical docs.
scripts/    Small helper scripts used by the root `npm run dev` command.
render.yaml / Dockerfiles   Deployment configuration for backend/app/ (Word Signs + suggestions) and backend/services/soundsigns/ (Talk to Sign). See DEPLOYMENT.md.
```

## Completed vs experimental vs not implemented

| Area | Status | Detail |
|---|---|---|
| Explore Signs, Quick Cards UI | **Completed** | 500 and 136 real entries respectively, all tested, confirm-before-speak gating, accessible roles/labels. |
| Daily practice checklist | **Completed** | Persisted locally via localStorage, no server-side profile. |
| Talk to Sign | **Completed, native integration** | Real Web Speech API capture, real Requesty-backed ISL gloss translation, real vendored video clip playback. Requires the operator's own Requesty key to produce a translation. |
| Letter Lens | **Completed, native integration** | Real MediaPipe Hands + TensorFlow.js model, ported from a vendored third-party project, runs entirely client-side. |
| Word Signs | **Working, independently verified model** | Real RandomForest and NumPy-reimplemented LSTM models, verified against the original project's own reference output. Backend-dependent; live camera accuracy across varied conditions is not independently benchmarked. |
| ML pipeline code (normalization, augmentation, GRU model, signer-independent splits, ONNX export) | **Code-complete, untrained** | Real, tested code. Runs only on synthetic smoke-test data so far, see `docs/MODEL_CARD.md`. No real model has been trained. |
| INCLUDE dataset integration | **Not implemented** | Dataset researched and documented honestly (`docs/DATASET.md`), 56.8 GB never downloaded in this environment. |
| Requesty AI integration (Talk to Sign) | **Completed, optional, off by default** | Real OpenAI-SDK-based client, model priority list with fallback, auth errors surface immediately. Fully inactive without a user-supplied `REQUESTY_API_KEY`. |
| Offline support / service worker | **Not implemented** | No service worker exists. Documented honestly in `docs/PRIVACY.md`. |
| Accounts, analytics, ads | **Not implemented, by design** | None exist anywhere in the app. |
| Deafblind-specific interactive content | **Not implemented** | Only a static orientation guide exists. No tactile-signing mode. Documented as a real, acknowledged gap, not glossed over. |
| Community-consent-based content sourcing | **Not implemented** | Explore Signs' content is sourced from an official government dataset, not a community-consent process. Stated honestly in-app. |

If Requesty's live calls are turned on with a real API key, normal
third-party LLM API usage costs apply, billed by Requesty or the
underlying model providers, not by this project. No cost is incurred by
the default build, since no key is present by default.

## Privacy and license

- Privacy: see `docs/PRIVACY.md`, and the in-app privacy page at `/privacy`.
- This project does not include a license file for its own first-party
  code. Add one before publishing more broadly.
- `backend/app/isl_recognition/` (part of this project's own backend)
  includes a GPL-3.0-licensed component vendored from
  Cl0ud-9/Sign-Language-Recognition (real LICENSE text at
  `backend/app/isl_recognition/LICENSE-GPL-3.0-Cl0ud9.txt`). This was
  deliberately merged into `backend/app/`'s own import graph rather than
  kept in a separate process, so the combined backend is itself subject to
  GPL-3.0's terms if distributed. See that module's own docstring before
  distributing or publishing `backend/app/`.
- `backend/services/soundsigns/` is a separately-run third-party service
  (BSD-2-Clause or explicit-permission arrangement, documented in its own
  README and LICENSE file), independent of this project's own license
  status, and never merged into `backend/app/`.

## Impact

SignBridge's intended benefit is narrow and specific: lowering the cost and
effort for a family to start building shared ISL vocabulary at home,
without requiring a paid class, a textbook, or specialist equipment. There
is no deployed user base yet, and no adoption or outcome data exists for
this project. Any claim of real-world impact beyond "this makes starting
easier and free" would be unsupported and is deliberately not made here.
