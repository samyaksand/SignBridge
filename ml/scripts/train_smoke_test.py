"""
SYNTHETIC SMOKE TEST ONLY. Do not read any number this script prints as a
real model accuracy. There is no real trained model and no real dataset
behind these numbers.

Purpose: prove the training/eval/export code path (GRU model, signer-
independent split function, augmentation, training loop, confusion
matrix, ONNX export, ONNX Runtime parity check) actually executes, end to
end, without crashing, using a small randomly generated placeholder
dataset of fake landmark sequences for a handful of fake classes.

Run with: python ml/scripts/train_smoke_test.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.model import GRUClassifier, set_seeds, FEATURE_DIM
from src.splits import Sample, split_dataset
from src.augmentation import augment_sequence

SYNTHETIC_CLASSES = ["fake_sign_a", "fake_sign_b", "fake_sign_c", "fake_sign_d", "fake_sign_e"]
NUM_POINTS = FEATURE_DIM // 3  # 44 points, 3 coords each
TARGET_FRAMES = 32
SAMPLES_PER_CLASS = 20
SIGNERS_PER_CLASS = 10


def make_synthetic_dataset(seed: int = 42):
    """Generate a small, clearly-fake dataset: each class is a different
    random-but-fixed 'centroid' sequence plus noise, purely so the model
    has SOMETHING separable to learn, proving the training loop can at
    least reduce loss. This is not derived from any real sign data."""
    rng = np.random.default_rng(seed)
    class_centroids = {
        label: rng.normal(scale=1.0, size=(TARGET_FRAMES, NUM_POINTS, 3))
        for label in SYNTHETIC_CLASSES
    }

    samples = []
    sequences = {}
    for label in SYNTHETIC_CLASSES:
        for i in range(SAMPLES_PER_CLASS):
            signer_id = f"synthetic_signer_{i % SIGNERS_PER_CLASS}"
            clip_id = f"{label}__{i}"
            noise = rng.normal(scale=0.15, size=(TARGET_FRAMES, NUM_POINTS, 3))
            sequences[clip_id] = (class_centroids[label] + noise).astype(np.float32)
            samples.append(Sample(clip_id=clip_id, label=label, signer_id=signer_id))

    return samples, sequences


def to_tensor_dataset(samples, sequences, label_to_idx, augment: bool, rng: np.random.Generator):
    xs, ys = [], []
    for s in samples:
        seq = sequences[s.clip_id]
        if augment:
            seq = augment_sequence(seq, rng)
        xs.append(seq.reshape(TARGET_FRAMES, -1))
        ys.append(label_to_idx[s.label])
    return torch.tensor(np.stack(xs), dtype=torch.float32), torch.tensor(ys, dtype=torch.long)


def main():
    set_seeds(42)
    rng = np.random.default_rng(42)

    samples, sequences = make_synthetic_dataset()
    split = split_dataset(samples, train_frac=0.7, val_frac=0.15, seed=42)
    print(f"[SYNTHETIC] signer_independent split: {split['signer_independent']}")
    for w in split["warnings"]:
        print(f"[SYNTHETIC] warning: {w}")
    print(f"[SYNTHETIC] train={len(split['train'])} val={len(split['val'])} test={len(split['test'])}")

    label_to_idx = {label: i for i, label in enumerate(SYNTHETIC_CLASSES)}

    x_train, y_train = to_tensor_dataset(split["train"], sequences, label_to_idx, augment=True, rng=rng)
    x_val, y_val = to_tensor_dataset(split["val"], sequences, label_to_idx, augment=False, rng=rng)
    x_test, y_test = to_tensor_dataset(split["test"], sequences, label_to_idx, augment=False, rng=rng)

    model = GRUClassifier(input_size=FEATURE_DIM, num_classes=len(SYNTHETIC_CLASSES), hidden_size=32)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-2)
    loss_fn = nn.CrossEntropyLoss()

    print("\n[SYNTHETIC SMOKE TEST] Training on fake data, fake classes. NOT real accuracy.")
    epoch_losses = []
    num_epochs = 15
    for epoch in range(num_epochs):
        model.train()
        optimizer.zero_grad()
        logits = model(x_train)
        loss = loss_fn(logits, y_train)
        loss.backward()
        optimizer.step()
        epoch_losses.append(loss.item())
        print(f"  epoch {epoch + 1:2d}/{num_epochs}  synthetic_train_loss={loss.item():.4f}")

    model.eval()
    with torch.no_grad():
        val_logits = model(x_val)
        val_loss = loss_fn(val_logits, y_val).item()
        val_preds = val_logits.argmax(dim=1)
        val_acc = (val_preds == y_val).float().mean().item()

        test_logits = model(x_test)
        test_preds = test_logits.argmax(dim=1)
        test_acc = (test_preds == y_test).float().mean().item()

    num_classes = len(SYNTHETIC_CLASSES)
    confusion = np.zeros((num_classes, num_classes), dtype=int)
    for true_label, pred_label in zip(y_test.tolist(), test_preds.tolist()):
        confusion[true_label, pred_label] += 1

    print(f"\n[SYNTHETIC, NOT REAL] final train loss: {epoch_losses[-1]:.4f} (started at {epoch_losses[0]:.4f})")
    print(f"[SYNTHETIC, NOT REAL] val loss: {val_loss:.4f}  val accuracy: {val_acc:.3f}")
    print(f"[SYNTHETIC, NOT REAL] test accuracy: {test_acc:.3f}")
    print("[SYNTHETIC, NOT REAL] confusion matrix (rows=true, cols=pred):")
    print(confusion)

    result = {
        "label": "SYNTHETIC SMOKE TEST ONLY, NOT real accuracy, NOT based on real sign data",
        "classes": SYNTHETIC_CLASSES,
        "num_epochs": num_epochs,
        "train_loss_first": epoch_losses[0],
        "train_loss_last": epoch_losses[-1],
        "val_loss": val_loss,
        "val_accuracy": val_acc,
        "test_accuracy": test_acc,
        "confusion_matrix": confusion.tolist(),
        "signer_independent_split": split["signer_independent"],
    }

    out_dir = Path(__file__).resolve().parents[1] / "artifacts" / "smoke_test"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "synthetic_training_result.json").write_text(json.dumps(result, indent=2))
    print(f"\nWrote {out_dir / 'synthetic_training_result.json'} (synthetic smoke-test numbers only)")

    torch.save(model.state_dict(), out_dir / "synthetic_gru.pt")
    print(f"Wrote {out_dir / 'synthetic_gru.pt'} (synthetic-trained weights, not a real model)")

    # Hand off the trained (synthetic) model + a sample input for ONNX export.
    return model, x_test[:1], SYNTHETIC_CLASSES, out_dir


if __name__ == "__main__":
    main()
