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
any of the four experiences (Parent Mode, Child Mode, Family Practice, Quick
Cards). Everything runs in the browser.

## Frontend

- Next.js 16 with the App Router and TypeScript.
- Tailwind CSS v4, with a custom token layer in `app/globals.css` (colors,
  spacing, radii, shadows, motion, focus rings).
- `components/` holds shared UI (Button, Card, Input, Dialog, StatusMessage,
  Nav, Footer, Logo, ThemeToggle, AvatarPanel).
- `lib/data/` holds the curated content: `communicationCards.json` (36
  cards), `familyScenarios.json` (the "I need help" scenario), and small
  TypeScript data files for quick messages and demo predictions.
- `lib/config/requestyModels.ts` holds the Requesty model list, kept exactly
  as specified, for a future integration.
- `lib/utils/landmarkNormalization.ts` is a TypeScript copy of the Python
  normalization logic in `ml/src/normalization.py`, kept in sync and tested
  for numeric equivalence.

## Backend (optional)

A small FastAPI app with one real endpoint, `/suggestions`. It always uses a
local, curated fallback for suggestions. It only tries a real Requesty call
if you set `REQUESTY_API_KEY` in `backend/.env`, which nobody has to do.

## ML (scaffold only)

`ml/` holds the shape of a future training pipeline: a word list, data prep
scripts, and normalization code, with no dataset downloaded and no model
trained. See `docs/MODEL_CARD.md` for exactly what is and is not done.

## Why things are built this way

- No account, no server database, no camera upload: everything about a
  person's practice session lives only in the browser tab, and disappears
  when it closes.
- Clear state labels everywhere (demo, loading, unavailable, low confidence)
  so the app never pretends to be smarter than it is.
- The 36 cards and the one Family Practice scenario are structured as plain
  JSON data, so more can be added later without touching the page code.
