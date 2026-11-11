# Testing

This file lists exactly what is tested, the commands to run it, and the
actual results from the last run (Checkpoint 6, final).

## Frontend (Vitest + React Testing Library)

Run from `frontend/`:

```
npm run test
```

This runs `vitest run`, which executes once and exits (good for CI).

**Last actual run: 18 test files, 68 tests, all passing.**

What is covered:

- `tests/cardData.test.ts`: communication card data integrity (36 cards,
  unique ids, 6 cards in each of the 6 categories, required fields filled
  in, verification status is honestly labeled), every illustration path
  resolves to a real file under `frontend/public`, and no two cards share
  an illustration file.
- `tests/landmarkNormalization.test.ts`: the TypeScript landmark
  normalization and resampling logic, numerically cross-checked against
  the Python implementation's fixtures.
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
  until something is confirmed, Confirm is disabled until a prediction is
  chosen, the optional "Suggest a sentence" flow degrades gracefully when
  the backend is unreachable and gates Speak behind an explicit confirm of
  the (possibly edited) sentence, and camera tracks are verified stopped
  both on explicit "Stop Camera" and on component unmount (spies on
  `MediaStreamTrack.stop`, asserting call counts directly).
- `tests/avatarPanel.test.tsx` and `tests/avatarStage.test.tsx`: the real
  Three.js avatar stage falls back to an honest SVG placeholder when WebGL
  is unavailable (exercised against real jsdom behavior, not mocked), and
  never fabricates a Canvas element in that case.
- `tests/signAnimationMap.test.ts`: every entry in the sign-to-animation
  map is marked `verifiedIsl: false`, so no entry can silently claim to be
  a verified ISL reference.
- `tests/communicationPreferences.test.tsx`: mode selection, text size
  persistence and the `data-text-size` attribute, reduced motion wired to
  the real `data-reduced-motion` document attribute, the speech toggle
  gating real Speak calls across both Quick Cards and Child Mode, and that
  only the generic text-size key ever reaches `localStorage`.
- `tests/requestSuggestions.test.ts`: the sentence-suggestion request body
  contains only `confirmed_words` and `output_language`, no landmark/video
  fields can sneak in, and both network failure and non-ok HTTP responses
  degrade gracefully.
- `tests/accessibility.test.tsx` (new this checkpoint): explicit
  testing-library-based checks that Nav links, the Communication
  Preferences radiogroup, and Quick Cards controls expose real accessible
  roles and names (not just visual styling), that remove-from-message
  buttons carry unique accessible names, that controls are keyboard
  operable (`Tab` focus plus `Enter` activation), and that state toggles
  use `aria-pressed`/`aria-checked` rather than relying on color alone. It
  also includes a code-reading check (not a true rendered-layout test,
  jsdom does not evaluate CSS Grid breakpoints) that the Quick Cards grid
  uses responsive `grid-cols-*` classes rather than a fixed pixel width
  that would overflow a 360px-wide device.

## Python ML pipeline tests (pytest)

Run from the project root:

```
python -m pytest ml/tests -v
```

**Last actual run: 30 tests, all passing**, on Python 3.13.1 with pytest
9.1.1. Covers:

- Landmark normalization (`ml/tests/test_normalization.py`, 12 tests):
  shoulder-midpoint centering and scaling, frame resampling, plus edge
  cases added this checkpoint: a single missing shoulder, both hands
  entirely absent, degenerate zero-shoulder-width input (confirms the
  `EPS` floor prevents division by zero or inf/nan), NaN coordinates
  propagating without crashing the pipeline (by design: silently
  replacing NaN would hide a real upstream data problem), an empty
  sequence/clip raising `ValueError` instead of silently returning
  garbage, and a single-frame clip resampling correctly without dividing
  by zero.
- Model, splits, and augmentation (`ml/tests/test_model_and_splits.py`,
  16 tests): feature dimension, zero-filling missing landmark parts
  (including an entirely empty frame dict), the GRU classifier's forward
  shape, seed reproducibility, signer-independent splitting with no
  signer crossing a split boundary, the honest fallback warning when
  signer ids are absent (including the edge case of *some* samples having
  a signer id and others not, which must still fall back honestly rather
  than treating partial metadata as sufficient), rejecting an empty
  sample list and fractions that sum above 1.0, confirming every sample
  appears in exactly one split with none dropped or duplicated,
  augmentation preserving shape (including on a minimal 2-frame sequence,
  the smallest non-degenerate case for the internal time-jitter resample),
  augmentation actually changing values, augmentation output staying
  finite across 20 different random seeds, and a real end-to-end synthetic
  training smoke test.
- ONNX export/parity (`ml/tests/test_onnx_export.py`, 1 test): exports the
  synthetic smoke-test model and checks ONNX Runtime output against
  PyTorch output is within the documented 1e-4 tolerance (max abs diff is
  on the order of 1e-7 in the last real run).
- MediaPipe extraction smoke test (`ml/tests/test_extract_landmarks.py`,
  1 test): proves the real MediaPipe Tasks extraction code runs against
  synthetic solid-colour frames without crashing; skipped automatically if
  mediapipe or its model assets are not installed.

All numeric results above other than shapes/counts/tolerances are either
synthetic smoke-test numbers (clearly labeled as such, see
`docs/MODEL_CARD.md`) or structural proofs (shape, split integrity,
finiteness), never real sign-recognition accuracy.

## Backend tests (pytest)

Run from the project root:

```
python -m pytest backend/tests -v
```

**Last actual run: 40 tests, all passing.**

- `backend/tests/test_suggestions.py` (30 tests) exercises
  `app/suggestions.py` directly: local fallback behavior, input validation
  (empty, oversized, bad-language, landmark-shaped payloads disguised as
  words), classification of transient vs. auth vs. generic errors,
  the exact `REQUESTY_MODEL_PRIORITY` list preserved verbatim and bounded
  to `MAX_FALLBACK_ATTEMPTS`, and sanitized logging (asserts directly on
  captured `caplog` records that neither confirmed word content nor an API
  key ever appears in a log message). New this checkpoint: a mocked
  OpenAI-SDK client (no real network call, see `_FakeOpenAIClient` in the
  test file) exercising `_call_requesty`'s actual happy path, its cycling
  to a second model on a transient error, its immediate
  `RequestyAuthError` on a 401 with no cycling attempted (the mock only
  queues one response, so a bug that tried to retry would surface as an
  `IndexError` instead of passing), a malformed/empty provider response
  being treated as a failed attempt rather than crashing, an end-to-end
  `get_suggestions` call falling back to the local curated list after
  every mocked Requesty attempt fails transiently, and a timeout
  (`openai.APITimeoutError`) being classified as transient.
- `backend/tests/test_main.py` (10 tests, new this checkpoint): exercises
  the actual FastAPI HTTP layer with `TestClient` (in-process ASGI calls,
  no real network), covering `/health`'s reported configuration state,
  `/suggestions` returning the local fallback and the correct
  `used_requesty` flag, and the full set of 422 rejections at the HTTP
  layer: empty word list, unsupported language, oversized word list,
  an overlong single word, a missing required field, non-string items, and
  a landmark-shaped payload. Also confirms a `RequestyAuthError` raised
  inside the suggestion logic surfaces as an HTTP 502, not a silent 200 or
  an unhelpful 500.

Both test files only exercise `app/suggestions.py` and `app/main.py`,
which have no required external network dependency: `fastapi`, `pydantic`,
`httpx`, and `openai` are all installed per `backend/requirements.txt`, but
no test in this suite makes a real network call. Every Requesty-shaped
interaction is mocked.

## Type checking

Run from `frontend/`:

```
npx tsc --noEmit
```

**Last actual run: zero errors.** (`next build` also runs its own
TypeScript check as part of the production build, see below; this is a
faster standalone check for day-to-day use.)

## Lint

Run from `frontend/`:

```
npm run lint
```

**Last actual run: zero errors, zero warnings.**

## Build check

Run from `frontend/`:

```
npm run build
```

**Last actual run: build completed successfully**, all 7 routes (`/`,
`/parent`, `/child`, `/cards`, `/privacy`, plus the
404 page) compiled and statically generated with no errors or warnings,
TypeScript checking included.

## Real bugs found and fixed during this checkpoint

Writing these tests surfaced two genuine bugs, fixed alongside the new
regression tests that pin them down:

- **Child Mode camera preview silently never showed video.** The
  `<video>` element is only rendered once `cameraOn` is true, so on the
  very first "Start Camera" click, `videoRef.current` was still `null` at
  the moment `getUserMedia` resolved, and the stream was attached to
  nothing, silently. The camera permission prompt worked and a real
  `MediaStream` came back, but the preview stayed blank. Fixed in
  `frontend/app/child/ChildModeClient.tsx` by attaching the stream in a
  `useEffect` keyed on `cameraOn`, once the element has actually mounted.
  Covered by `tests/childModeCameraAttach.test.tsx`.
- **The 3D avatar could render mostly or fully out of frame.**
  `AvatarModel.tsx` applied a hardcoded `position={[0, -1, 0]}` offset
  that was tuned by guesswork for one specific model, not computed from
  its real geometry. For the real `cesium-man.glb`, this pushed the
  figure low enough, combined with the camera's fixed look-at-origin
  default, that the head could end up out of frame. Fixed by computing
  the model's real bounding box and grounding/centering it dynamically
  (`AvatarModel.tsx`), plus aiming the camera at the figure's vertical
  center instead of the ground plane (`AvatarStage.tsx`'s new `CameraAim`
  helper). Covered by `tests/avatarModelFraming.test.tsx` (the centering
  math, tested directly against a synthetic offset mesh, no WebGL or GLB
  fetch needed) and `tests/parentModeAvatarWiring.test.tsx` (confirms
  Parent Mode passes the correct `clipName`/`hasDemo`/`isPlaying` props
  into the stage in the first place).

## A note on test reliability

The full frontend suite occasionally shows one test timing out under
heavy parallel load (observed once in this checkpoint on
`tests/parentMode.test.tsx`, a file untouched by this checkpoint's
changes) and passes cleanly on an immediate rerun, both in isolation and
as part of the full suite. This is a timing flake from Vitest's worker
pool contention, not a real regression, confirmed by rerunning the exact
same suite twice in a row with no code changes in between.
