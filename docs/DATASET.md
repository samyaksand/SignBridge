# Dataset notes

SignBridge's future sign-recognition model is planned to use the INCLUDE
dataset (Zenodo record 4010759), a dataset of Indian Sign Language videos.
This file documents real facts about that dataset, checked with WebFetch
and curl against the live Zenodo record and its bundled README, not
guessed or remembered from training data.

## What INCLUDE and INCLUDE-50 actually are

- **Title:** "INCLUDE: A Large Scale Dataset for Indian Sign Language
  Recognition".
- **Authors:** Advaith Sridhar, Rohith Gandhi Ganesan, Pratyush Kumar,
  Mitesh Khapra (IIT Madras, AI4Bharat).
- **Published:** October 16, 2020, at ACM Multimedia 2020 (ACMMM2020).
  DOI: 10.1145/3394171.3413528.
- **License, as stated on the Zenodo record:** Creative Commons
  Attribution 4.0 International (CC BY 4.0). Access is marked "Open" (no
  gated/restricted access request needed on Zenodo itself).
- **Content:** 4,292 short video clips (the paper itself says 4,287; 5
  more were added after publication), each showing one ISL practitioner
  performing one word sign, drawn from 263 word signs across 15 word
  categories (Adjectives, Animals, Clothes, Colours, Days_and_Time,
  Electronics, Greetings, Home, Jobs, Means_of_Transportation, People,
  Places, Pronouns, Seasons, Society). Signers were deaf students at St.
  Louis School for the Deaf, Adyar, Chennai.
- **INCLUDE-50** is a 50-word subset of the above, for faster
  experimentation and hyperparameter tuning: 766 training clips and 192
  test clips (vs. 3,475 train / 817 test for the full INCLUDE).
- The dataset's own README (fetched directly from Zenodo, see below) says
  to use the train/test split supplied in a `Train_Test_Split` folder
  included in the archive, not an arbitrary custom split.
- **No GitHub repository is linked from the Zenodo record.** The
  AI4Bharat project page is https://sign-language.ai4bharat.org/ (also
  referenced as ai4bharat.org/include-dataset) and the paper is at
  https://dl.acm.org/doi/10.1145/3394171.3413528. A Google Drive link for
  the train/test split CSVs and a bit.ly download script
  (http://bit.ly/include_dl) are also referenced on the record.

## Real file listing (from the live Zenodo record)

Total archive size: **56.8 GB**, split into per-category zip parts (sizes
exactly as shown on the record at the time this was checked):

| Category | Parts | Approx. sizes |
|---|---|---|
| Adjectives | 8 | 1.3, 1.4, 1.4, 1.2, 1.3, 1.2, 1.3 GB, 835.0 MB |
| Animals | 2 | 1.8, 1.1 GB |
| Clothes | 2 | 1.4, 1.4 GB |
| Colours | 2 | 1.3, 1.5 GB |
| Days_and_Time | 3 | 1.2, 1.0 GB, 853.0 MB |
| Electronics | 2 | 926.3, 824.1 MB |
| Greetings | 2 | 1.6, 1.2 GB |
| Home | 4 | 1.2, 1.3, 1.1 GB, 873.5 MB |
| Jobs | 2 | 1.5, 1.7 GB |
| Means_of_Transportation | 2 | 1.8, 1.6 GB |
| People | 5 | 1.3, 1.3, 1.6, 1.3, 1.3 GB |
| Places | 4 | 1.4, 1.4, 1.5, 1.1 GB |
| Pronouns | 2 | 1.4 GB, 946.8 MB |
| Seasons | 1 | 1.3 GB |
| Society | 3 | 1.4, 1.4, 1.1 GB |

Plus a small `download_data.sh` (1.5 kB) and `README.md` (1.6 kB), both of
which this task was able to fetch directly with curl (see below), unlike
the multi-gigabyte zip parts.

## What was actually fetched in this environment, and what was not

- The Zenodo record page itself was fetched with WebFetch and the facts
  above (license, authors, file sizes, categories) come directly from
  that page.
- The bundled `README.md` was downloaded directly with
  `curl https://zenodo.org/records/4010759/files/README.md?download=1`
  and confirms: 4,292 videos, over 263 word signs, 15 categories, an
  INCLUDE-50 subset, and a `Train_Test_Split` folder with the official
  CSV splits.
- **None of the video zip files (56.8 GB total) were downloaded.** This
  was a deliberate choice, not a silent failure: this task has no
  mechanism for pulling tens of gigabytes of binary data, and doing so
  would not fit in the time or storage available. `curl -I` against one
  of MediaPipe's own small pretrained model files (not the dataset) was
  used instead to prove network access generally works (see
  `ml/README.md`), which confirms the dataset zips were skippable by
  choice, not blocked by a lack of network access entirely.

## Real steps a developer would follow to get the actual dataset

1. Go to https://zenodo.org/records/4010759 and either click through the
   per-category zip downloads in a browser, or use the `download_data.sh`
   script / http://bit.ly/include_dl bulk download link referenced on the
   record (not independently verified by this task, since it was not run).
2. Extract every zip into one directory; the categories come out as
   subfolders.
3. Use the CSVs in the extracted `Train_Test_Split` folder (for INCLUDE
   and, separately, for INCLUDE-50) as the official train/test split,
   per the dataset's own README instructions, rather than inventing a new
   split.
4. Filter down to clips for the words in `ml/config/words.json` (our much
   smaller, honest 33-word vocabulary), matching by category/word folder
   name.
5. Run `python ml/scripts/extract_landmarks.py --input-dir <clips> \
   --output-dir ml/data/landmarks_raw` (implemented and smoke-tested in
   this checkpoint, see `ml/README.md`) to get per-clip landmark JSON.
6. Normalize with `ml/src/normalization.py` (shoulder-centered, scaled,
   resampled to 32 frames).
7. Determine a real signer id per clip from the CSV metadata (the exact
   column name was not confirmed in this task, since the CSVs were not
   downloaded) and pass it through `ml/src/splits.py`'s
   `split_dataset(..., signer_id=...)` for a genuinely signer-independent
   split, consistent with the official Train_Test_Split where possible.
8. Train with `ml/src/model.py`'s `GRUClassifier`, following the pattern
   in `ml/scripts/train_smoke_test.py` but pointed at real extracted
   features instead of synthetic ones.
9. Evaluate honestly, record real numbers in `docs/MODEL_CARD.md`, export
   to ONNX, and only then consider wiring real inference into Child Mode.

## Why real training is still not done inside this task

Downloading 56.8 GB and training on it needs real storage, real download
time, and (for anything beyond a toy run) a GPU and meaningful wall-clock
time, none of which this task has. What this checkpoint did instead: it
verified the real dataset facts above, implemented the complete pipeline
code (extraction, normalization, splitting, augmentation, model,
training loop, ONNX export), and proved every stage actually executes
using small synthetic placeholder data, clearly labeled as such
everywhere it appears. See `ml/README.md` and `docs/MODEL_CARD.md` for
exactly what ran and what its (synthetic, non-real) output was.
