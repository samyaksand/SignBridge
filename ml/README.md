# ML pipeline

This folder implements the full ISL sign-recognition pipeline code. **No
model has been trained on real data.** See `docs/MODEL_CARD.md` for the
full honest picture, including clearly labeled synthetic smoke-test
numbers, and `docs/DATASET.md` for real, fetched facts about the INCLUDE
dataset this is designed to eventually train on.

## Environment, checked in this build

| Package | Status | Version |
|---|---|---|
| torch | already installed | 2.14.1+cpu |
| numpy | already installed | 2.5.3 |
| mediapipe | installed in this task (`pip install mediapipe`) | 1.1.1 |
| onnx | installed in this task (`pip install onnx onnxruntime`) | 1.23.2 |
| onnxruntime | installed in this task | 1.31.0 |
| onnxscript | installed in this task (needed by torch.onnx) | 0.7.2 |
| opencv-python | installed in this task (for video frame reading) | 5.0.0 |

All installs succeeded with no errors, CPU only, no GPU used or required
for anything in this checkpoint.

Note: mediapipe 1.1.1 ships only the newer `mediapipe.tasks` API
(`HandLandmarker`, `PoseLandmarker`). The older `mediapipe.solutions`
module referenced in some older tutorials/placeholders does not exist in
this version (`ModuleNotFoundError: No module named 'mediapipe.python'`
when tried), so `extract_landmarks.py` is written against the Tasks API.

## What is here

- `config/words.json`: the target word list (33 words).
- `src/normalization.py`: tested normalization code (shoulder-centering,
  scaling, resampling to exactly 32 frames, safe handling of missing
  hands/shoulders), mirrored in
  `frontend/lib/utils/landmarkNormalization.ts`.
- `src/model.py`: a PyTorch `GRUClassifier` baseline (input size 132 =
  2 shoulders + 2 hands x 21 points x 3 coords), `set_seeds()` for
  reproducibility, and `flatten_frame()` to convert extractor/normalizer
  output into model input vectors.
- `src/splits.py`: `split_dataset()`, a signer-independent train/val/test
  splitter. Splits by signer id when every sample has one (no signer
  appears in more than one split); otherwise falls back to a clip-level
  random split and reports this honestly via a `warnings` list, since a
  clip-level split can overstate accuracy if a signer appears in both
  train and test.
- `src/augmentation.py`: small rotation, scale, translation, and
  time-speed jitter, meant to be applied to training data only.
- `scripts/extract_landmarks.py`: a real implementation using MediaPipe's
  `HandLandmarker` and `PoseLandmarker` (Tasks API). Includes
  `--download-models` (fetches MediaPipe's own small pretrained detector
  weights, ~7.8MB and ~5.8MB, confirmed downloadable from
  storage.googleapis.com in this environment) and
  `--synthetic-smoke-test` (runs the real extractor against solid-colour
  placeholder frames to prove the code path works, see below). Real
  `--input-dir` video processing is implemented and ready, but has never
  been run against a real clip in this environment, because no dataset
  video exists here (see `docs/DATASET.md`).
- `scripts/prepare_dataset.py`: still a placeholder, see its docstring,
  because no dataset archive exists here to prepare.
- `scripts/train_smoke_test.py`: runs a real short PyTorch training loop
  on **randomly generated placeholder landmark sequences for 5 fake
  classes** (`fake_sign_a` .. `fake_sign_e`). Proves the model, splits,
  and augmentation code work together end to end. Writes
  `ml/artifacts/smoke_test/synthetic_training_result.json` and
  `synthetic_gru.pt`. All numbers it prints are explicitly labeled
  synthetic and are not real accuracy.
- `scripts/export_onnx_smoke_test.py`: exports the synthetic-trained
  smoke-test model to ONNX and checks ONNX Runtime output against
  PyTorch within 1e-4 tolerance. Writes `ml/artifacts/smoke_test/model.onnx`,
  `labels.json`, and `onnx_parity_result.json`.
- `artifacts/smoke_test/`: output of the two scripts above. The directory
  name is deliberate, everything in it is a smoke-test artifact from
  synthetic data, not a production model. Do not copy `model.onnx` from
  here into the frontend as if it were real.
- `models/`: MediaPipe's own pretrained `hand_landmarker.task` and
  `pose_landmarker_lite.task` detector weights (downloaded in this task
  via `--download-models`). These are generic hand/pose detectors from
  Google, not anything specific to ISL or trained by this project.
- `tests/`: pytest tests, see below.

## Running the tests

```
python -m pytest ml/tests -v
```

**Last actual run in this environment: 17 tests, all passing**, covering:
normalization (5 tests), the MediaPipe synthetic extraction smoke test (1
test, auto-skips if mediapipe or the model assets are missing), the GRU
model/splits/augmentation/synthetic-training-smoke-test (9 tests), and
ONNX export/parity (1 test, auto-skips if onnxruntime is missing).

## Running the smoke tests directly

```
python ml/scripts/extract_landmarks.py --download-models --models-dir ml/models
python ml/scripts/extract_landmarks.py --synthetic-smoke-test --models-dir ml/models
python ml/scripts/train_smoke_test.py
python ml/scripts/export_onnx_smoke_test.py
```

All four ran successfully the last time this was checked in this
environment. None of them touch real video or real sign data.

## What a developer needs to do for a REAL trained model

See the step-by-step list in `docs/MODEL_CARD.md` and the real dataset
facts (license, file sizes, download steps) in `docs/DATASET.md`. In
short: download the 56.8 GB INCLUDE archive from Zenodo (CC BY 4.0
licensed), extract real landmarks with the already-implemented
`extract_landmarks.py`, get real signer ids from the dataset's CSV
metadata, train `GRUClassifier` for real, record real accuracy, then (and
only then) wire a real ONNX model into Child Mode.
