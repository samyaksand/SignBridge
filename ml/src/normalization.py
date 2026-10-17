"""
Landmark normalization for the (future, not yet trained) ISL sign recognition
model. This mirrors frontend/lib/utils/landmarkNormalization.ts exactly, and
the two are tested for numeric equivalence in ml/tests and
frontend/tests/landmarkNormalization.test.ts using shared synthetic fixtures.

No model consumes this output today. This file is a scaffold for Milestone 3.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional, Sequence, TypeVar

EPS = 1e-8

T = TypeVar("T")


@dataclass(frozen=True)
class Point3D:
    x: float
    y: float
    z: float


@dataclass(frozen=True)
class FrameLandmarks:
    left_shoulder: Optional[Point3D]
    right_shoulder: Optional[Point3D]
    left_hand: Optional[List[Point3D]]
    right_hand: Optional[List[Point3D]]


def _midpoint(a: Point3D, b: Point3D) -> Point3D:
    return Point3D((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)


def _distance(a: Point3D, b: Point3D) -> float:
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)


def _subtract(a: Point3D, b: Point3D) -> Point3D:
    return Point3D(a.x - b.x, a.y - b.y, a.z - b.z)


def _scale(a: Point3D, s: float) -> Point3D:
    return Point3D(a.x * s, a.y * s, a.z * s)


def centre_and_scale_frame(frame: FrameLandmarks) -> FrameLandmarks:
    """Centre a frame's hand landmarks at the shoulder midpoint and scale by
    shoulder width. Missing shoulders fall back to zeroed hand landmarks."""
    if frame.left_shoulder is None or frame.right_shoulder is None:
        zero_hand = lambda hand: [Point3D(0, 0, 0) for _ in hand] if hand else None
        return FrameLandmarks(
            left_shoulder=None,
            right_shoulder=None,
            left_hand=zero_hand(frame.left_hand),
            right_hand=zero_hand(frame.right_hand),
        )

    centre = _midpoint(frame.left_shoulder, frame.right_shoulder)
    shoulder_width = max(_distance(frame.left_shoulder, frame.right_shoulder), EPS)
    inv_width = 1.0 / shoulder_width

    def normalize_hand(hand: Optional[List[Point3D]]) -> Optional[List[Point3D]]:
        if hand is None:
            return None
        return [_scale(_subtract(p, centre), inv_width) for p in hand]

    return FrameLandmarks(
        left_shoulder=Point3D(0, 0, 0),
        right_shoulder=_scale(_subtract(frame.right_shoulder, centre), inv_width),
        left_hand=normalize_hand(frame.left_hand),
        right_hand=normalize_hand(frame.right_hand),
    )


def resample_sequence(sequence: Sequence[T], target_frames: int) -> List[T]:
    """Resample a sequence to exactly target_frames using nearest-neighbour
    index sampling (matches the TypeScript implementation)."""
    if len(sequence) == 0:
        raise ValueError("Cannot resample an empty sequence")
    if len(sequence) == target_frames:
        return list(sequence)

    result: List[T] = []
    last_index = len(sequence) - 1
    for i in range(target_frames):
        t = 0.0 if target_frames == 1 else i / (target_frames - 1)
        src_index = round(t * last_index)
        result.append(sequence[src_index])
    return result


DEFAULT_TARGET_FRAMES = 32


def normalize_sequence(
    frames: Sequence[FrameLandmarks], target_frames: int = DEFAULT_TARGET_FRAMES
) -> List[FrameLandmarks]:
    """Full pipeline: normalize every frame, then resample to target_frames."""
    normalized = [centre_and_scale_frame(f) for f in frames]
    return resample_sequence(normalized, target_frames)
