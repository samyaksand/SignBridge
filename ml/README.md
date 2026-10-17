# ML scaffold

This folder is a scaffold for a future ISL sign-recognition model. **No
model has been trained.** See `docs/MODEL_CARD.md` for the full honest
picture and the exact steps still left to do.

## What is here

- `config/words.json`: the target word list.
- `src/normalization.py`: tested normalization code (shoulder-centering,
  scaling, resampling to 32 frames), mirrored in
  `frontend/lib/utils/landmarkNormalization.ts`.
- `scripts/prepare_dataset.py` and `scripts/extract_landmarks.py`:
  placeholder scripts, they print an explanation instead of doing real work,
  since no dataset is downloaded here.
- `tests/test_normalization.py`: tests for the normalization code, run with
  `python -m pytest ml/tests -v` from the project root.

## Running the tests

```
python -m pytest ml/tests -v
```
