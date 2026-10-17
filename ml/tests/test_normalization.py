"""
Tests for ml/src/normalization.py using synthetic fixtures. These same
fixtures (numerically) are mirrored in
frontend/tests/landmarkNormalization.test.ts to prove the TypeScript and
Python implementations agree within 1e-6.

Run with: pytest ml/tests (if pytest is installed), documented in
docs/TESTING.md if it is not available in this environment.
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.normalization import (
    Point3D,
    FrameLandmarks,
    centre_and_scale_frame,
    resample_sequence,
    normalize_sequence,
)

TOLERANCE = 1e-6


def approx(a: float, b: float, tol: float = TOLERANCE) -> bool:
    return math.isclose(a, b, abs_tol=tol)


def test_centres_frame_at_shoulder_midpoint():
    frame = FrameLandmarks(
        left_shoulder=Point3D(0, 0, 0),
        right_shoulder=Point3D(10, 0, 0),
        left_hand=[Point3D(5, 0, 0)],
        right_hand=None,
    )
    result = centre_and_scale_frame(frame)
    assert approx(result.left_hand[0].x, 0.0)
    assert approx(result.right_shoulder.x, 0.5)


def test_zeroes_hands_when_shoulders_missing():
    frame = FrameLandmarks(
        left_shoulder=None,
        right_shoulder=None,
        left_hand=[Point3D(1, 2, 3)],
        right_hand=None,
    )
    result = centre_and_scale_frame(frame)
    assert result.left_hand[0] == Point3D(0, 0, 0)


def test_resamples_to_target_frame_count():
    sequence = list(range(10))
    resampled = resample_sequence(sequence, 32)
    assert len(resampled) == 32
    assert resampled[0] == 0
    assert resampled[-1] == 9


def test_resamples_longer_sequence_down():
    sequence = list(range(64))
    resampled = resample_sequence(sequence, 32)
    assert len(resampled) == 32


def test_full_pipeline_runs_end_to_end():
    frames = [
        FrameLandmarks(
            left_shoulder=Point3D(0, i, 0),
            right_shoulder=Point3D(10, i, 0),
            left_hand=[Point3D(5, i, 0)],
            right_hand=[Point3D(6, i, 0)],
        )
        for i in range(5)
    ]
    result = normalize_sequence(frames)
    assert len(result) == 32
