"""
Tests the ONNX export + ONNX Runtime parity path using the synthetic
smoke-test model. All results are synthetic, see
ml/scripts/export_onnx_smoke_test.py and docs/MODEL_CARD.md.
"""

import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

onnxruntime = pytest.importorskip("onnxruntime")


def test_onnx_export_matches_pytorch_within_tolerance():
    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
    from export_onnx_smoke_test import main as run_export, TOLERANCE

    run_export()

    out_dir = Path(__file__).resolve().parents[1] / "artifacts" / "smoke_test"
    assert (out_dir / "model.onnx").exists()
    assert (out_dir / "labels.json").exists()

    import json

    parity = json.loads((out_dir / "onnx_parity_result.json").read_text())
    assert parity["within_tolerance"] is True
    assert parity["max_abs_diff"] < TOLERANCE
