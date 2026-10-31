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

import pytest

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


# --- Edge cases: missing landmarks, invalid coordinates, empty clips -----


def test_zeroes_hands_when_only_one_shoulder_missing():
    """Even a single missing shoulder (not both) should trigger the
    documented zero-fill fallback, since a midpoint needs both points."""
    frame = FrameLandmarks(
        left_shoulder=Point3D(0, 0, 0),
        right_shoulder=None,
        left_hand=[Point3D(1, 2, 3)],
        right_hand=[Point3D(4, 5, 6)],
    )
    result = centre_and_scale_frame(frame)
    assert result.left_shoulder is None
    assert result.right_shoulder is None
    assert result.left_hand[0] == Point3D(0, 0, 0)
    assert result.right_hand[0] == Point3D(0, 0, 0)


def test_handles_missing_hand_landmarks_without_crashing():
    """A frame with valid shoulders but no detected hands at all (both None,
    e.g. hands out of frame) must normalize without error and keep both
    hands as None rather than fabricating zero vectors for a hand that was
    never present."""
    frame = FrameLandmarks(
        left_shoulder=Point3D(0, 0, 0),
        right_shoulder=Point3D(10, 0, 0),
        left_hand=None,
        right_hand=None,
    )
    result = centre_and_scale_frame(frame)
    assert result.left_hand is None
    assert result.right_hand is None


def test_zero_shoulder_width_does_not_raise_or_produce_infinite_values():
    """Degenerate input where both shoulders are detected at the exact same
    point (zero width, e.g. a tracking glitch) must not divide by zero or
    propagate inf/nan, the EPS floor must kick in."""
    same_point = Point3D(3.0, 3.0, 3.0)
    frame = FrameLandmarks(
        left_shoulder=same_point,
        right_shoulder=same_point,
        left_hand=[Point3D(3.0, 3.0, 3.0)],
        right_hand=None,
    )
    result = centre_and_scale_frame(frame)
    assert math.isfinite(result.left_hand[0].x)
    assert math.isfinite(result.left_hand[0].y)
    assert math.isfinite(result.left_hand[0].z)
    # Shoulder width floors to EPS, so scaling by 1/EPS on a zero offset
    # (hand sits exactly at the shoulder midpoint) must still be exactly 0,
    # not inf or nan.
    assert result.left_hand[0] == Point3D(0.0, 0.0, 0.0)


def test_invalid_nan_coordinates_propagate_but_do_not_crash_the_pipeline():
    """NaN input coordinates (e.g. a corrupt landmark read) should not raise
    an exception, NaN propagates through arithmetic honestly rather than
    being silently replaced, since silently replacing it could hide a real
    upstream data problem. Downstream training code is responsible for
    filtering/rejecting NaN-containing samples, this function's job is only
    to not crash."""
    frame = FrameLandmarks(
        left_shoulder=Point3D(0, 0, 0),
        right_shoulder=Point3D(10, 0, 0),
        left_hand=[Point3D(float("nan"), 1.0, 1.0)],
        right_hand=None,
    )
    result = centre_and_scale_frame(frame)
    assert math.isnan(result.left_hand[0].x)


def test_resample_rejects_empty_sequence():
    with pytest.raises(ValueError):
        resample_sequence([], 32)


def test_normalize_sequence_rejects_empty_clip():
    """An entirely empty clip (zero frames extracted) must raise clearly
    rather than silently producing a zero-length or garbage result that
    could be mistaken for a valid, very short sign."""
    with pytest.raises(ValueError):
        normalize_sequence([], target_frames=32)


def test_resample_single_frame_sequence_to_target_length():
    """A one-frame clip (degenerate but real possibility from a very short
    or dropped-frame capture) must still resample to exactly target_frames
    by repeating that single frame, not divide by zero on (len - 1)."""
    resampled = resample_sequence([42], 32)
    assert len(resampled) == 32
    assert all(v == 42 for v in resampled)


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
