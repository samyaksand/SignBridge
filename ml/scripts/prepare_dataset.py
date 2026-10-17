"""
Dataset preparation placeholder for the INCLUDE dataset (Zenodo record
4010759). NOT RUN in this build. Downloading and processing the full dataset
is out of scope for Milestone 1.

Planned steps (not yet implemented):
  1. Download the INCLUDE dataset archive from Zenodo.
  2. Filter videos to the word list in ml/config/words.json.
  3. Extract frame-level hand and shoulder landmarks per video (e.g. with
     MediaPipe Holistic).
  4. Save raw landmark sequences as .npy or .parquet files per clip.
  5. Run ml/src/normalization.py over each sequence and save normalized
     tensors for training.

Running this script today will simply explain that it is a scaffold.
"""


def main() -> None:
    print("This is a scaffold script. The INCLUDE dataset has not been")
    print("downloaded, and no landmarks have been extracted yet.")
    print("See ml/README.md and docs/MODEL_CARD.md for the real next steps.")


if __name__ == "__main__":
    main()
