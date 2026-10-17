# Dataset notes

SignBridge's future sign-recognition model is planned to use the INCLUDE
dataset (Zenodo record 4010759), a dataset of Indian Sign Language videos.

## Status right now

Nothing has been downloaded. `ml/` only has a scaffold: a word list
(`ml/config/words.json`), placeholder scripts, and normalization code. No
videos, no landmarks, no trained weights exist in this repository.

## What would happen next (not done yet)

1. Download the INCLUDE archive from Zenodo.
2. Keep only the clips for the words in `ml/config/words.json`, our small,
   honest vocabulary.
3. Run a hand and body landmark extractor (for example MediaPipe Holistic)
   over each clip, frame by frame.
4. Normalize each sequence with `ml/src/normalization.py`:
   - center on the midpoint between the two shoulders,
   - scale by shoulder width, so it does not matter how close someone is to
     the camera,
   - resample every sequence to exactly 32 frames, so clips of different
     length can be compared fairly.
5. Save the normalized sequences and train a small classifier.
6. Export the trained model to ONNX so it can run in the browser.

## Why we are not doing this inside this task

Downloading a real dataset and training a model takes real compute time and
storage, and isn't something that can honestly happen inside this build
step. Doing it properly, with a real training run and real accuracy
numbers, is future work, tracked in `docs/MODEL_CARD.md`.
