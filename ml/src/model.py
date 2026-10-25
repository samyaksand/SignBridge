"""
PyTorch GRU baseline for ISL sign classification from normalized landmark
sequences.

IMPORTANT: no real weights exist. Any checkpoint produced by this file in
this environment comes only from the synthetic smoke test in
ml/scripts/train_smoke_test.py, trained on randomly generated placeholder
data for a handful of fake classes. Never present numbers produced from
this synthetic data as real model accuracy. See docs/MODEL_CARD.md.
"""

from __future__ import annotations

import random
from typing import Optional

import numpy as np
import torch
from torch import nn


def set_seeds(seed: int = 42) -> None:
    """Set all relevant RNG seeds for reproducibility (torch, numpy, and
    the stdlib random module)."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


class GRUClassifier(nn.Module):
    """A small GRU sequence classifier.

    Input: (batch, frames, input_size) where input_size is the flattened
    landmark feature dimension (e.g. 2 hands x 21 points x 3 coords + 2
    shoulder points x 3 coords = 132). Output: (batch, num_classes) logits.
    """

    def __init__(
        self,
        input_size: int,
        num_classes: int,
        hidden_size: int = 64,
        num_layers: int = 1,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_size, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: (batch, frames, input_size)
        _, hidden = self.gru(x)
        last_hidden = hidden[-1]  # (batch, hidden_size)
        return self.classifier(self.dropout(last_hidden))


def flatten_frame(frame: dict, num_hand_points: int = 21) -> np.ndarray:
    """Flatten one FrameLandmarks-shaped dict (as produced by
    ml/src/normalization.py / extract_landmarks.py) into a fixed-size
    feature vector: [left_shoulder(3), right_shoulder(3),
    left_hand(21*3), right_hand(21*3)] = 132 dims. Missing parts are
    zero-filled (normalization.py already zero-fills missing hands when
    shoulders are missing; this handles the remaining None cases, e.g. one
    hand absent from frame but shoulders present)."""

    def point_to_arr(p: Optional[dict]) -> np.ndarray:
        if p is None:
            return np.zeros(3, dtype=np.float32)
        return np.array([p["x"], p["y"], p["z"]], dtype=np.float32)

    def hand_to_arr(hand: Optional[list]) -> np.ndarray:
        if hand is None:
            return np.zeros(num_hand_points * 3, dtype=np.float32)
        return np.concatenate([point_to_arr(p) for p in hand])

    return np.concatenate(
        [
            point_to_arr(frame.get("left_shoulder")),
            point_to_arr(frame.get("right_shoulder")),
            hand_to_arr(frame.get("left_hand")),
            hand_to_arr(frame.get("right_hand")),
        ]
    )


FEATURE_DIM = 3 + 3 + 21 * 3 + 21 * 3  # = 132
