# Model card: ISL sign recognition (not trained yet)

## Status

**No model has been trained.** Child Mode's "demo guess" feature uses a
small, fixed list of sample predictions, not a real classifier. This is
clearly labeled as "Demo mode" everywhere it appears in the app.

There are no accuracy numbers to report, because there is no model. Any
number you might see elsewhere claiming otherwise is not accurate, this
document is the source of truth.

## What exists today

- `ml/config/words.json`: a target vocabulary of around 33 words, matched to
  the phrases used in the 36 communication cards.
- `ml/src/normalization.py` and its TypeScript twin
  `frontend/lib/utils/landmarkNormalization.ts`: tested, working code that
  centers and scales hand landmarks, and resamples sequences to 32 frames.
  Both are tested against shared fixtures and agree within 1e-6.
- `ml/scripts/extract_landmarks.py`: a real implementation against the
  installed MediaPipe Tasks API (mediapipe 1.1.1, HandLandmarker +
  PoseLandmarker), executed in this environment only against synthetic
  solid-colour frames (no real hand or body), proving the extraction code
  runs without crashing. It has never been run against a real video.
- `ml/src/model.py`: a PyTorch GRU baseline classifier, with explicit
  seeding (`set_seeds`) for reproducibility.
- `ml/src/splits.py`: a signer-independent train/val/test split function,
  generic enough to use real INCLUDE signer metadata once a developer has
  the CSVs, with an honest fallback (and warning) to a clip-level random
  split if signer ids are missing.
- `ml/src/augmentation.py`: small rotation/scale/translation/time-speed
  augmentation, applied to training data only.
- `ml/scripts/train_smoke_test.py`: runs a real, short PyTorch training
  loop on **randomly generated synthetic landmark sequences for 5 fake
  classes** (`fake_sign_a` .. `fake_sign_e`). This is a smoke test of the
  code path, not a real experiment. See "Synthetic smoke-test numbers"
  below. It writes `ml/artifacts/smoke_test/synthetic_training_result.json`
  and `ml/artifacts/smoke_test/synthetic_gru.pt`.
- `ml/scripts/export_onnx_smoke_test.py`: exports the synthetic-trained
  smoke-test model to `ml/artifacts/smoke_test/model.onnx` plus
  `labels.json`, and checks ONNX Runtime output against PyTorch output
  (max abs diff well under the 1e-4 tolerance in the last real run, see
  `ml/artifacts/smoke_test/onnx_parity_result.json`).
- `ml/tests/`: 30 passing pytest tests (`python -m pytest ml/tests -v`)
  covering normalization (including edge cases: missing shoulders, missing
  hands, zero shoulder width, NaN coordinates, empty clips, single-frame
  clips), the model, splits (including partial signer metadata and
  split-integrity checks), augmentation (including minimal 2-frame
  sequences and finiteness across many seeds), the full synthetic training
  smoke test, ONNX export/parity, and the synthetic MediaPipe extraction
  smoke test. See `docs/TESTING.md` for the full breakdown.

**None of the above constitutes a trained model on real data.** All
numbers from `train_smoke_test.py` and `export_onnx_smoke_test.py` are
synthetic smoke-test numbers, not real accuracy, see the dedicated
section below.

## Synthetic smoke-test numbers, NOT real accuracy, NOT based on real sign data

The last actual run of `python ml/scripts/train_smoke_test.py` in this
environment, on 5 fake classes with randomly generated, trivially
separable placeholder sequences:

- Train loss: started at 1.7528, ended at 0.0257 after 15 epochs (loss
  decreasing proves the training loop works, nothing more).
- Validation accuracy: 1.000. Test accuracy: 1.000.
- These accuracies are at or near 1.0 purely because the synthetic
  classes were deliberately generated to be easy to separate (different
  random centroid per class, small noise). This is expected and
  meaningless as a real-world number. It proves the code runs
  end-to-end, not that any real sign is recognised.
- The ONNX export + ONNX Runtime parity check passed with a max absolute
  difference on the order of 1e-7 between PyTorch and ONNX Runtime output
  (tolerance was 1e-4).

Repeating for emphasis: **these numbers describe fake data and fake
classes.** They are not a benchmark of real ISL recognition and must
never be quoted as one.

## What is left to do, step by step, to get a REAL model

1. Download the INCLUDE dataset (Zenodo record 4010759, confirmed CC BY
   4.0 licensed, 56.8 GB, see `docs/DATASET.md` for the real file listing
   and license text found by fetching the live record).
2. Extract landmarks from each real clip using the already-implemented
   `ml/scripts/extract_landmarks.py` (point `--input-dir` at the real
   clips; the code is ready, just never run against real video here).
3. Normalize every sequence with the shared normalization code (already
   implemented and tested).
4. Recover real per-clip signer ids from INCLUDE's CSV metadata and split
   with `ml/src/splits.py` (`signer_independent` must be True for a
   trustworthy eval).
5. Train `ml/src/model.py`'s `GRUClassifier` on the real extracted,
   normalized, augmented features, following the pattern in
   `train_smoke_test.py` but with real data.
6. Evaluate honestly and record real accuracy, precision, and recall here,
   replacing this section, not papering over it.
7. Export the trained model to ONNX (the export/parity code already
   exists and is tested, just needs a real checkpoint).
8. Load the ONNX model in the browser (for example with onnxruntime-web)
   and wire it into Child Mode, replacing the demo predictions and
   clearly updating all "Demo mode" labels in the UI. This explicitly has
   NOT happened in this checkpoint, Child Mode's UI is unchanged and
   still correctly shows demo/unavailable state.
9. Re-test Child Mode's state machine (`demo`, `loading`, `ready`,
   `capturing`, `low_confidence`, `prediction_pending_confirmation`,
   `confirmed`) against real model output, especially the low-confidence
   path.

## Limits, even once trained

Even after training, this model is expected to cover only the small word
list above. SignBridge will not claim to translate full, fluent ISL. This
is a deliberate choice: a small, honest set of signs that actually works is
more trustworthy than a big claim that does not hold up.
