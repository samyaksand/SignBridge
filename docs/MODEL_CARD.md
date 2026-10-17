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
- `ml/scripts/prepare_dataset.py` and `ml/scripts/extract_landmarks.py`:
  placeholder scripts that print an honest explanation of what they would
  do, without touching any real dataset.

## What is left to do, step by step

1. Download the INCLUDE dataset (Zenodo record 4010759).
2. Extract landmarks from each clip for the words in `ml/config/words.json`.
3. Normalize every sequence with the shared normalization code.
4. Split into train and test sets.
5. Train a small sequence classifier (a small transformer or temporal CNN
   would both work well for this scale of data).
6. Evaluate honestly and record real accuracy, precision, and recall here.
7. Export the trained model to ONNX.
8. Load the ONNX model in the browser (for example with onnxruntime-web) and
   wire it into Child Mode, replacing the demo predictions and clearly
   updating all "Demo mode" labels in the UI.
9. Re-test Child Mode's state machine (`demo`, `loading`, `ready`,
   `capturing`, `low_confidence`, `prediction_pending_confirmation`,
   `confirmed`) against real model output, especially the low-confidence
   path.

## Limits, even once trained

Even after training, this model is expected to cover only the small word
list above. SignBridge will not claim to translate full, fluent ISL. This
is a deliberate choice: a small, honest set of signs that actually works is
more trustworthy than a big claim that does not hold up.
