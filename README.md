# SignBridge

**Connecting hands, bridging worlds.**

SignBridge is a friendly web app that helps families with a deaf or
hard-of-hearing child practice everyday communication together. It works
right in your browser, with no account, no camera upload, and no hidden
costs.

## What's inside

- **Parent Mode**: type or speak a message and see a reference sign
  demonstration, when one is available.
- **Child Mode**: try a friendly sign-recognition demo, confirm what you
  meant, and build a message.
- **Family Practice**: a guided scenario ("I need help") that parent and
  child can walk through together.
- **Quick Communication Cards**: 36 simple cards for everyday needs, across
  6 categories, ready to use right away.

## Honesty about what this is (and is not)

- Sign recognition in Child Mode is a demo right now, using sample guesses,
  not a trained model. This is labeled clearly wherever it appears.
- Parent Mode's sign demonstrations are placeholder reference media for a
  small set of practiced phrases, not professionally verified ISL
  recordings, and not a general translator.
- SignBridge supports a small, carefully chosen set of words and phrases.
  It is not, and does not claim to be, a full ISL translator.
- Your camera never leaves your device. See `docs/PRIVACY.md` for the full
  story.

## Quick start (one command for everything)

From the project root:

```
npm install
npm run dev
```

This starts the frontend at **http://localhost:3000** and tries to start
the optional backend at **http://localhost:8000**. If Python or its
packages are not installed, you'll see a friendly warning and the frontend
will still run fine on its own. Press `Ctrl+C` to stop everything.

Logs are labeled and colour-coded per service (blue for frontend, green for
backend) so you can tell them apart.

### If `npm run dev` from the root does not work

Run each piece by hand instead:

**Frontend (required):**

```
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

**Backend (optional):**

```
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Then it's available at http://localhost:8000. The frontend works completely
without this. The backend's real dependencies are FastAPI, Uvicorn,
Pydantic, and the OpenAI Python SDK (used to call Requesty's
OpenAI-compatible router), plus pytest and httpx for its own test suite,
see `backend/requirements.txt` for exact version floors.

## Running tests

Frontend tests (Vitest + React Testing Library), from `frontend/`:

```
npm run test
```

Python tests (ML pipeline + backend logic), from the project root:

```
python -m pytest ml/tests backend/tests -v
```

Or run everything (frontend, then Python) from the root in one go:

```
npm run test
```

Lint and type-check, from `frontend/`:

```
npm run lint
npx tsc --noEmit
```

Production build, from `frontend/`:

```
npm run build
```

See `docs/TESTING.md` for exactly what is covered and the real results from
the last run.

## Building for production

```
cd frontend
npm run build
```

## Project layout

```
frontend/   The whole product. Next.js, TypeScript, Tailwind CSS, Three.js avatar stage.
backend/    Optional FastAPI backend with a real, optional Requesty AI integration.
ml/         Real, tested ML pipeline code (normalization, model, splits, ONNX export), not yet trained on real data.
docs/       Architecture, dataset notes, privacy, model status, testing.
scripts/    Small helper scripts used by the root `npm run dev` command.
```

## Completed vs experimental vs not implemented

An honest, at-a-glance summary of what is real, what is a working but
unverified scaffold, and what has not been built. See the linked docs for
full detail; this table is the short version.

| Area | Status | Detail |
|---|---|---|
| Parent Mode, Child Mode, Family Practice, Quick Cards UI | **Completed** | Full state machines, confirm-before-speak gating, accessible roles/labels, all tested. |
| Communication Preferences (mode, text size, reduced motion, speech toggle) | **Completed** | Session-only except text size (localStorage), wired to real CSS attributes and gating real Speak calls. |
| Theme (light/dark) + AmbientBackground | **Completed** | Persisted theme, reduced-motion-aware ambient animation. |
| Sign-recognition in Child Mode | **Experimental demo, not real** | Fixed sample predictions, not a trained model. Clearly labeled "Demo mode" everywhere. |
| Three.js avatar stage | **Experimental** | Real CC-BY-4.0 Khronos `CesiumMan.glb` model, lazy-loaded, with an honest SVG fallback when WebGL is unavailable. No ISL-specific animation exists: `signAnimationMap.ts` marks every entry `verifiedIsl: false`. |
| ML pipeline code (normalization, augmentation, GRU model, signer-independent splits, ONNX export) | **Experimental, code-complete, untrained** | Real, tested code. Runs only on synthetic smoke-test data so far, see `docs/MODEL_CARD.md`. No real model has been trained. |
| INCLUDE dataset integration | **Not implemented** | Dataset researched and documented honestly (`docs/DATASET.md`), 56.8 GB never downloaded in this environment. |
| Requesty AI sentence suggestions (backend) | **Completed, optional, off by default** | Real OpenAI-SDK-based client, exact model priority list, bounded retries on transient errors only, auth errors surface immediately. Fully inactive without a user-supplied `REQUESTY_API_KEY`. |
| Offline support / service worker | **Not implemented** | No service worker exists. The app requires network access to load its JS/assets, documented honestly in `docs/PRIVACY.md`. |
| Accounts, analytics, ads | **Not implemented, by design** | None exist anywhere in the app. |

If Requesty's live calls are turned on later with your own real API key,
normal third-party LLM API usage costs would apply, based on whichever
model from the priority list actually serves each request, and billed by
Requesty/the underlying model providers, not by this project. No cost is
incurred by the default build, since no key is present and no network call
to Requesty is ever made.

## Dataset and model training overview

Short version: not done yet, see `docs/DATASET.md` and
`docs/MODEL_CARD.md` for the honest, detailed version, including the exact
steps still needed (download INCLUDE dataset, extract landmarks, normalize,
train, export to ONNX).

## Privacy and license

- Privacy: see `docs/PRIVACY.md`, and the in-app privacy page at `/privacy`.
- This project does not include a license file. Add one if you plan to
  share or publish this code.

## Deployment notes

The frontend is a standard Next.js app and deploys well to any Next.js
compatible host. The backend is optional and only needed if you want to try
the Requesty-powered suggestion feature with your own API key. Set
`REQUESTY_API_KEY` as a real secret in your hosting provider, never commit
it to the repository (`.env` files are already in `.gitignore`).
