"""
SYNTHETIC SMOKE TEST ONLY. Exports the synthetic-trained GRU from
ml/scripts/train_smoke_test.py to ONNX, then validates that ONNX Runtime
produces output matching the original PyTorch model within tolerance.

This proves the export/inference code path works. It is NOT a real model
and must never be presented as one. Output artifacts are written to
ml/artifacts/smoke_test/ precisely so they cannot be mistaken for a
production model directory.

Run with: python ml/scripts/export_onnx_smoke_test.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import torch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.train_smoke_test import main as run_training

TOLERANCE = 1e-4


def main() -> None:
    model, sample_input, classes, out_dir = run_training()

    model.eval()
    onnx_path = out_dir / "model.onnx"
    labels_path = out_dir / "labels.json"

    torch.onnx.export(
        model,
        sample_input,
        str(onnx_path),
        input_names=["landmarks"],
        output_names=["logits"],
        dynamic_axes={"landmarks": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
        dynamo=False,
    )
    print(f"\nExported ONNX model (synthetic-trained, smoke-test only) to {onnx_path}")

    labels_path.write_text(json.dumps({
        "note": "SYNTHETIC SMOKE TEST LABELS, not a real ISL vocabulary mapping",
        "classes": classes,
    }, indent=2))
    print(f"Wrote {labels_path}")

    import onnxruntime as ort

    with torch.no_grad():
        torch_output = model(sample_input).numpy()

    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    ort_output = session.run(None, {"landmarks": sample_input.numpy().astype(np.float32)})[0]

    max_abs_diff = float(np.max(np.abs(torch_output - ort_output)))
    print(f"\n[SYNTHETIC] PyTorch vs ONNX Runtime max abs diff: {max_abs_diff:.8f} (tolerance {TOLERANCE})")
    within_tolerance = max_abs_diff < TOLERANCE
    print(f"[SYNTHETIC] Within tolerance: {within_tolerance}")

    parity_result = {
        "note": "SYNTHETIC SMOKE TEST ONLY, not a real model parity check",
        "max_abs_diff": max_abs_diff,
        "tolerance": TOLERANCE,
        "within_tolerance": within_tolerance,
    }
    (out_dir / "onnx_parity_result.json").write_text(json.dumps(parity_result, indent=2))
    print(f"Wrote {out_dir / 'onnx_parity_result.json'}")

    if not within_tolerance:
        raise SystemExit("ONNX parity check FAILED (outside tolerance)")


if __name__ == "__main__":
    main()
