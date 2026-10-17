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
without this.

## Running tests

Frontend tests (Vitest + React Testing Library), from `frontend/`:

```
npm run test
```

Python tests (normalization + backend logic), from the project root:

```
python -m pytest ml/tests backend/tests -v
```

Or run everything from the root in one go:

```
npm run test
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
frontend/   The whole product. Next.js, TypeScript, Tailwind CSS.
backend/    Optional FastAPI stub for a future AI-suggestion feature.
ml/         Scaffolding for a future trained sign-recognition model.
docs/       Architecture, dataset notes, privacy, model status, testing.
scripts/    Small helper scripts used by the root `npm run dev` command.
```

## What's scaffolded but not active yet

- **A trained sign-recognition model.** `ml/` has normalization code and a
  word list, but no dataset has been downloaded and no model has been
  trained. Full details and next steps: `docs/MODEL_CARD.md`.
- **Live Requesty AI suggestions.** `frontend/lib/config/requestyModels.ts`
  and `backend/app/suggestions.py` are ready to go, but no API key is
  configured, so the backend always uses a local, curated fallback. No live
  network calls are made to Requesty in this build.
- **A 3D or licensed avatar.** Parent Mode shows a polished animated
  placeholder avatar instead, clearly labeled as "coming soon."

If Milestone 4 (live Requesty calls) is turned on later with a real API
key, normal LLM API usage costs would apply, based on whichever model from
the priority list actually serves each request. No cost is incurred by this
build, since no key is present and no call is made.

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
