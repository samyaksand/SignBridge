# SignBridge architecture

This is a simple, honest overview of how the pieces fit together.

## Big picture

```
frontend/   Next.js app, the whole product lives here right now
backend/    Optional FastAPI stub, not required to use the app
ml/         Scaffolding for a future trained model, nothing trained yet
docs/       This folder
```

The frontend works completely on its own. No backend call is required for
any of the three experiences (Parent Mode, Child Mode, Quick
Cards). Everything runs in the browser. The backend is a genuinely optional
enhancement (AI sentence suggestions), never a dependency.

## Frontend

- Next.js 16 with the App Router and TypeScript.
- Tailwind CSS v4, with a custom token layer in `app/globals.css` (colors,
  spacing, radii, shadows, motion, focus rings).
- `components/` holds shared UI (Button, Card, Input, Dialog, StatusMessage,
  Nav, Footer, Logo, ThemeToggle, AvatarPanel, CommunicationPreferences,
  AmbientBackground).
- `components/avatar/` holds the real Three.js avatar stage
  (`AvatarStage.tsx`, `AvatarModel.tsx`, `LazyAvatarStage.tsx`,
  `WebglSupport.ts`): it renders the real CC-BY-4.0 Khronos `CesiumMan.glb`
  model (`frontend/public/avatars/`), lazy-loaded so the Three.js bundle
  only downloads when the stage is actually shown, and falls back to an
  honest static SVG placeholder (`AvatarPanel.tsx`) when WebGL is
  unavailable. There is no ISL-specific animation: every entry in
  `lib/data/signAnimationMap.ts` is marked `verifiedIsl: false`.
- `lib/data/` holds the curated content: `communicationCards.json` (36
  cards), `familyScenarios.json` (the "I need help" scenario), and small
  TypeScript data files for quick messages, demo predictions, and the sign
  animation map.
- `lib/config/requestyModels.ts` holds the exact Requesty model priority
  list, mirrored verbatim in `backend/app/suggestions.py` and tested for
  that exact match.
- `lib/suggestions/requestSuggestions.ts` is the frontend client for the
  optional `/suggestions` backend endpoint: sends only confirmed word
  labels and an output language, degrades gracefully to a friendly message
  if the backend is unreachable or returns a non-ok response.
- `lib/context/PreferencesContext.tsx` holds Communication Preferences
  state (communication mode, text language, text size, reduced motion,
  speech on/off). All of it is session-only (resets on reload) except text
  size, which persists in `localStorage` the same way the theme does.
- `lib/utils/landmarkNormalization.ts` is a TypeScript copy of the Python
  normalization logic in `ml/src/normalization.py`, kept in sync and tested
  for numeric equivalence to within 1e-6.

## Backend (optional)

A small FastAPI app with two real endpoints, `/health` and `/suggestions`.
`/suggestions` always uses a local, curated fallback unless
`REQUESTY_API_KEY` is set in `backend/.env`, which nobody has to do. When a
key is set, it calls Requesty's OpenAI-compatible router
(`https://router.requesty.ai/v1`) using the real OpenAI Python SDK, cycling
through a bounded number of models from the priority list only on
transient errors (timeouts, 5xx, 429, model-unavailable); authentication
failures (401/403) surface immediately instead of silently falling back,
so a misconfigured key is visible rather than masked. The request schema
(`SuggestionRequest` in `app/main.py`) only accepts a short list of word
strings and a two-letter language code, making it structurally impossible
to send camera frames, video, or landmark arrays through this endpoint even
by accident.

## ML (code-complete pipeline, untrained)

`ml/` holds real, tested code for a future training pipeline: a word list,
MediaPipe-based landmark extraction, normalization (mirrored in the
frontend and tested for numeric equivalence), a PyTorch GRU classifier,
signer-independent train/val/test splitting with an honest fallback
warning, augmentation, and ONNX export with a documented parity tolerance.
No dataset has been downloaded and no model has been trained on real data;
all numeric results in the test suite come from randomly generated
synthetic data. See `docs/MODEL_CARD.md` for exactly what is and is not
done, and `docs/DATASET.md` for the real, honestly researched INCLUDE
dataset facts.

## Why things are built this way

- No account, no server database, no camera upload: everything about a
  person's practice session lives only in the browser tab, and disappears
  when it closes.
- Clear state labels everywhere (demo, loading, unavailable, low confidence)
  so the app never pretends to be smarter than it is.
- The 36 cards are structured as plain
  JSON data, so more can be added later without touching the page code.
- Every placeholder or unverified piece (demo predictions, the avatar's
  lack of ISL-specific animation, the Requesty suggestions being
  AI-generated rather than verified translations) is labeled honestly in
  the UI itself, not just in these docs.
