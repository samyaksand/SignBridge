"""
Tests the MediaPipe Tasks based landmark extractor against synthetic
(solid-colour, no real person) frames. Skipped automatically if mediapipe
is not installed or the small MediaPipe model assets have not been
downloaded (see ml/scripts/extract_landmarks.py --download-models).

This never exercises real video or real hand/body landmarks, only proves
the extraction code runs against the real MediaPipe binaries without
crashing. See docs/DATASET.md for why no real video exists here.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

mediapipe = pytest.importorskip("mediapipe")

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"
HAND_MODEL = MODELS_DIR / "hand_landmarker.task"
POSE_MODEL = MODELS_DIR / "pose_landmarker_lite.task"

requires_models = pytest.mark.skipif(
    not (HAND_MODEL.exists() and POSE_MODEL.exists()),
    reason="MediaPipe model assets not downloaded, run extract_landmarks.py --download-models",
)


@requires_models
def test_synthetic_smoke_test_runs_without_crashing():
    from scripts.extract_landmarks import run_synthetic_smoke_test

    result = run_synthetic_smoke_test(MODELS_DIR)
    assert result["frame_count"] == 5
    assert "SYNTHETIC" in result["note"]
    for frame in result["frames"]:
        assert set(frame.keys()) == {"left_shoulder", "right_shoulder", "left_hand", "right_hand"}
