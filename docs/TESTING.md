# Testing

This file lists exactly what is tested, the commands to run it, and the
actual results from the last run.

## Frontend (Vitest + React Testing Library)

Run from `frontend/`:

```
npm run test
```

This runs `vitest run`, which executes once and exits (good for CI).

**Last actual run: 9 test files, 29 tests, all passing.**

What is covered:

- `tests/cardData.test.ts`: communication card data integrity (36 cards,
  unique ids, 6 cards in each of the 6 categories, required fields filled
  in, verification status is honestly labeled).
- `tests/landmarkNormalization.test.ts`: the TypeScript landmark
  normalization and resampling logic.
- `tests/nav.test.tsx`: navigation links to all four experiences, active
  link marked with `aria-current`.
- `tests/themeToggle.test.tsx`: light/dark theme toggle updates the page and
  is remembered.
- `tests/cardsClient.test.tsx`: Quick Cards search, category filter, adding
  and removing a card from the message, clearing the message, empty state
  when nothing matches.
- `tests/parentMode.test.tsx`: Parent Mode's honest fallback for text with
  no demo available, a working demo for a Quick Message, and Clear
  resetting everything.
- `tests/familyPractice.test.tsx`: the full "I need help" scenario end to
  end, situation, parent reference, child's choice, confirm, complete.
- `tests/childMode.test.tsx`: demo-mode labeling is visible, camera denial
  shows a friendly fallback instead of breaking the app, Speak stays hidden
  until something is confirmed, and Confirm is disabled until a prediction
  is chosen.
- `tests/avatarPanel.test.tsx`: the placeholder avatar renders with a
  truthful label (not a claim of a real avatar).

## Python normalization tests (pytest)

Run from the project root:

```
python -m pytest ml/tests -v
```

**Last actual run: 5 tests, all passing**, on Python 3.13.1 with pytest
9.1.1 (already available in this environment, no install needed).

## Backend tests (pytest)

Run from the project root:

```
python -m pytest backend/tests -v
```

**Last actual run: 4 tests, all passing.** These tests only exercise
`app/suggestions.py`, which has no FastAPI dependency, so they pass even
without FastAPI installed. If you want to run the actual FastAPI server,
install `backend/requirements.txt` first.

## Build check

Run from `frontend/`:

```
npm run build
```

**Last actual run: build completed successfully**, all 7 routes (`/`,
`/parent`, `/child`, `/family-practice`, `/cards`, `/privacy`, plus the
404 page) compiled and statically generated with no errors or warnings.
