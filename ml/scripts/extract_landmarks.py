"""
Landmark extraction placeholder. NOT RUN in this build.

Planned implementation: use MediaPipe Holistic (or similar) to read each
video frame-by-frame, extract shoulder and hand landmarks, and write them to
disk as raw (un-normalized) per-clip sequences, ready for
ml/src/normalization.py to process.

This script intentionally does not import mediapipe or touch any dataset
files, since none are present in this environment.
"""


def main() -> None:
    print("This is a scaffold script. No video files are being processed.")
    print("Install mediapipe and point this script at extracted INCLUDE clips")
    print("to implement real landmark extraction in a future milestone.")


if __name__ == "__main__":
    main()
