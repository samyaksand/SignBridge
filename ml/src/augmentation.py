"""
Basic augmentation for normalized landmark sequences, applied to training
data only. Operates on numpy arrays shaped (frames, features) where
features are flattened (x, y, z) coordinates, matching what
ml/src/model.py expects as input.

Augmentations:
  - small 2D rotation (about the x/y plane, since landmarks are already
    centred at the shoulder midpoint),
  - small uniform scale jitter,
  - small translation jitter,
  - time-speed jitter (resample the sequence to a slightly different
    effective frame count, then resample back to the fixed target length),

All are small perturbations intended to make the trained model more
robust to camera angle, distance, and signing speed, never to distort the
sign itself.
"""

from __future__ import annotations

import numpy as np


def _rotate_xy(sequence: np.ndarray, angle_rad: float) -> np.ndarray:
    """Rotate the x,y coordinates of every point by angle_rad. sequence is
    shaped (frames, num_points, 3)."""
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    rot = np.array([[cos_a, -sin_a], [sin_a, cos_a]])
    rotated = sequence.copy()
    xy = sequence[..., :2]
    rotated[..., :2] = xy @ rot.T
    return rotated


def augment_sequence(
    sequence: np.ndarray,
    rng: np.random.Generator,
    max_rotation_deg: float = 10.0,
    max_scale_jitter: float = 0.1,
    max_translation: float = 0.05,
    max_time_jitter_frac: float = 0.15,
) -> np.ndarray:
    """Apply one random augmentation draw to a single sequence.

    sequence: shape (frames, num_points, 3).
    Returns an array of the SAME shape (frames preserved by resampling back
    to the original frame count after time jitter).
    """
    frames = sequence.shape[0]

    angle_deg = rng.uniform(-max_rotation_deg, max_rotation_deg)
    out = _rotate_xy(sequence, np.deg2rad(angle_deg))

    scale = 1.0 + rng.uniform(-max_scale_jitter, max_scale_jitter)
    out = out * scale

    translation = rng.uniform(-max_translation, max_translation, size=(1, 1, 3))
    out = out + translation

    time_jitter_frac = rng.uniform(-max_time_jitter_frac, max_time_jitter_frac)
    jittered_len = max(2, round(frames * (1.0 + time_jitter_frac)))
    if jittered_len != frames:
        src_indices = np.linspace(0, frames - 1, jittered_len)
        warped = np.stack(
            [np.interp(src_indices, np.arange(frames), out[:, p, d])
             for p in range(out.shape[1]) for d in range(out.shape[2])],
            axis=-1,
        ).reshape(jittered_len, out.shape[1], out.shape[2])
        final_indices = np.linspace(0, jittered_len - 1, frames)
        out = np.stack(
            [np.interp(final_indices, np.arange(jittered_len), warped[:, p, d])
             for p in range(out.shape[1]) for d in range(out.shape[2])],
            axis=-1,
        ).reshape(frames, out.shape[1], out.shape[2])

    return out.astype(np.float32)
