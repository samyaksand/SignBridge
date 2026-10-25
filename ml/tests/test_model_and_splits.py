"""
Tests for ml/src/model.py, ml/src/splits.py, ml/src/augmentation.py, and an
end-to-end synthetic training + ONNX export smoke test.

All numeric results in this test file come from randomly generated
synthetic data with fake class labels. They prove the pipeline code runs
correctly, they are not, and must never be read as, real model accuracy.
"""

import sys
from pathlib import Path

import numpy as np
import pytest
import torch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.model import GRUClassifier, set_seeds, flatten_frame, FEATURE_DIM
from src.splits import Sample, split_dataset
from src.augmentation import augment_sequence


def test_feature_dim_matches_two_hands_plus_shoulders():
    assert FEATURE_DIM == 3 + 3 + 21 * 3 + 21 * 3


def test_flatten_frame_zero_fills_missing_parts():
    frame = {
        "left_shoulder": {"x": 1.0, "y": 2.0, "z": 3.0},
        "right_shoulder": None,
        "left_hand": None,
        "right_hand": [{"x": 0.1, "y": 0.2, "z": 0.3}] * 21,
    }
    vec = flatten_frame(frame)
    assert vec.shape == (FEATURE_DIM,)
    assert vec[0] == 1.0
    assert vec[3] == 0.0  # missing right shoulder zero-filled


def test_gru_classifier_forward_shape():
    set_seeds(0)
    model = GRUClassifier(input_size=FEATURE_DIM, num_classes=5, hidden_size=16)
    x = torch.randn(4, 32, FEATURE_DIM)
    out = model(x)
    assert out.shape == (4, 5)


def test_set_seeds_is_reproducible():
    set_seeds(123)
    a = torch.randn(3)
    set_seeds(123)
    b = torch.randn(3)
    assert torch.allclose(a, b)


def test_split_dataset_signer_independent_no_overlap():
    samples = [
        Sample(clip_id=f"c{i}", label="x", signer_id=f"signer_{i % 6}")
        for i in range(30)
    ]
    result = split_dataset(samples, train_frac=0.7, val_frac=0.15, seed=1)
    assert result["signer_independent"] is True
    train_signers = {s.signer_id for s in result["train"]}
    val_signers = {s.signer_id for s in result["val"]}
    test_signers = {s.signer_id for s in result["test"]}
    assert not (train_signers & val_signers)
    assert not (train_signers & test_signers)
    assert not (val_signers & test_signers)


def test_split_dataset_falls_back_without_signer_id():
    samples = [Sample(clip_id=f"c{i}", label="x", signer_id=None) for i in range(10)]
    result = split_dataset(samples, seed=1)
    assert result["signer_independent"] is False
    assert len(result["warnings"]) == 1


def test_split_dataset_rejects_empty():
    with pytest.raises(ValueError):
        split_dataset([])


def test_augmentation_preserves_shape():
    rng = np.random.default_rng(0)
    seq = rng.normal(size=(32, 44, 3)).astype(np.float32)
    augmented = augment_sequence(seq, rng)
    assert augmented.shape == seq.shape
    assert augmented.dtype == np.float32


def test_augmentation_changes_values():
    rng = np.random.default_rng(0)
    seq = np.ones((32, 44, 3), dtype=np.float32)
    augmented = augment_sequence(seq, rng)
    assert not np.allclose(seq, augmented)


def test_synthetic_training_smoke_test_runs_end_to_end():
    """Imports and runs the actual synthetic training smoke test (small,
    few epochs) to prove the full training loop executes and loss
    decreases. All numbers here are synthetic, not real accuracy."""
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    from train_smoke_test import main as run_training

    model, sample_input, classes, out_dir = run_training()
    assert len(classes) == 5
    assert sample_input.shape[-1] == FEATURE_DIM
    assert (out_dir / "synthetic_training_result.json").exists()
