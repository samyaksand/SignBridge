"""
SignBridge ISL recognition module.

IMPORTANT, READ BEFORE DISTRIBUTING THIS CODEBASE: this module vendors a
GPL-3.0-licensed component (the "Dynamic ISL word/phrase classifier" below,
from Cl0ud-9/Sign-Language-Recognition) and is now directly imported into
SignBridge's own first-party backend (backend/app/). This was a deliberate,
informed decision: an earlier version of this project kept this exact code
in a fully separate process specifically to avoid combining GPL-3.0 code
with SignBridge's own backend/frontend, because GPL-3.0 is a copyleft
license. By importing sign_model.py directly into this package, the
combined work in backend/app/ is now itself subject to GPL-3.0's terms if
this codebase is distributed. The real, unmodified GPL-3.0 license text is
saved alongside this file as LICENSE-GPL-3.0-Cl0ud9.txt. If you intend to
distribute or publish backend/app/ beyond private/internal use, you should
treat backend/app/ as GPL-3.0-licensed as a whole, or re-isolate this
module back into its own separate process (see backend/services/ for the
history of how that isolation previously worked, if you want to revert
this decision).

This module wraps two vendored, third-party, pre-trained models found
during an evaluation of several external sign-language GitHub repositories.

1. Static ISL alphabet (A-Z) classifier
   Source: BawaHarshit-Creator/sign-ISL-alphabet-recognition
   https://github.com/BawaHarshit-Creator/sign-ISL-alphabet-recognition
   License: none found in the upstream repository (no LICENSE file). Treated
   as all-rights-reserved, evaluation-only, beyond this integration. Only
   the trained model artifacts (isl_model.pkl, a scikit-learn
   RandomForestClassifier, and label_encoder.pkl) are vendored, unmodified.
   The inference code here is written fresh for SignBridge, following the
   same feature-column layout described in the upstream README: 126
   features, left and right hand, 21 landmarks each, x/y/z.
   Upstream README claims 95.19% test accuracy on a 1,040-sample
   self-recorded dataset. That number is not independently verified here,
   the upstream repository ships no eval script or held-out test set.

2. Dynamic ISL word/phrase classifier (8 classes: hi, my, name, is, what,
   your, glad, to)
   Source: Cl0ud-9/Sign-Language-Recognition
   https://github.com/Cl0ud-9/Sign-Language-Recognition
   License: GPL-3.0, confirmed directly by fetching the real raw LICENSE
   file from that repository (35,149 bytes, the standard GNU GPLv3 text,
   saved unmodified as LICENSE-GPL-3.0-Cl0ud9.txt in this same folder).
   Vendors that project's model.npz and its standalone sign_model.py (a
   pure NumPy re-implementation of a trained Keras LSTM's forward pass,
   copied byte-for-byte from upstream). The NumPy forward pass was
   independently re-verified against the upstream repository's own
   tests/fixtures/reference.npz (computed by the original Keras model):
   max absolute difference 4.77e-7 across all 17 reference inputs, with
   matching argmax predictions on all of them.

Both models expect hand-landmark features, not raw images: the caller (the
SignBridge frontend) runs MediaPipe Hands in the browser to extract
landmarks and sends only the resulting numeric arrays here. This module
never receives or stores camera frames or video.

Honesty notes carried through to the API responses: confidence scores
returned are the real softmax/predict_proba outputs of the vendored models
for whatever input was sent, never adjusted, rounded up, or invented.
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import List

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .sign_model import SignModel

ROOT = Path(__file__).resolve().parent

with open(ROOT / "isl_model.pkl", "rb") as f:
    ALPHABET_MODEL = pickle.load(f)
with open(ROOT / "label_encoder.pkl", "rb") as f:
    ALPHABET_LABEL_ENCODER = pickle.load(f)

ALPHABET_NUM_FEATURES = 126  # left+right hand, 21 landmarks, x/y/z each

WORD_MODEL = SignModel.load(ROOT / "model.npz")
# Exact class order from the upstream repository's function.py.
WORD_LABELS = ["to", "my", "glad", "hi", "is", "what", "your", "name"]
WORD_SEQUENCE_LENGTH = 30
WORD_NUM_KEYPOINTS = 63  # 21 landmarks x (x, y, z), one hand

router = APIRouter(prefix="/isl-recognition", tags=["isl-recognition"])


class AlphabetRequest(BaseModel):
    landmarks: List[float] = Field(..., min_length=126, max_length=126)


class AlphabetTopPrediction(BaseModel):
    label: str
    confidence: float


class AlphabetResponse(BaseModel):
    label: str
    confidence: float
    top3: List[AlphabetTopPrediction]
    note: str


class WordRequest(BaseModel):
    frames: List[List[float]] = Field(..., min_length=30, max_length=30)


class WordTopPrediction(BaseModel):
    label: str
    confidence: float


class WordResponse(BaseModel):
    label: str
    confidence: float
    top3: List[WordTopPrediction]
    note: str


@router.get("/health")
def health():
    return {
        "status": "ok",
        "models": {
            "alphabet": {
                "source": "BawaHarshit-Creator/sign-ISL-alphabet-recognition",
                "license": "none found upstream (evaluation only)",
                "classes": list(ALPHABET_LABEL_ENCODER.classes_),
            },
            "word": {
                "source": "Cl0ud-9/Sign-Language-Recognition",
                "license": "GPL-3.0 (see LICENSE-GPL-3.0-Cl0ud9.txt, combined into this backend)",
                "classes": WORD_LABELS,
            },
        },
    }


@router.post("/predict/alphabet", response_model=AlphabetResponse)
def predict_alphabet(req: AlphabetRequest):
    if len(req.landmarks) != ALPHABET_NUM_FEATURES:
        raise HTTPException(400, f"Expected {ALPHABET_NUM_FEATURES} landmark values.")
    x = np.asarray(req.landmarks, dtype=np.float32).reshape(1, -1)
    proba = ALPHABET_MODEL.predict_proba(x)[0]
    order = np.argsort(proba)[::-1]
    classes = ALPHABET_LABEL_ENCODER.classes_
    top3 = [
        AlphabetTopPrediction(label=str(classes[i]), confidence=float(proba[i]))
        for i in order[:3]
    ]
    best = order[0]
    return AlphabetResponse(
        label=str(classes[best]),
        confidence=float(proba[best]),
        top3=top3,
        note=(
            "Real RandomForestClassifier output (predict_proba) on the "
            "landmarks you sent. This is the model's best guess, not a "
            "verified correct answer."
        ),
    )


@router.post("/predict/word", response_model=WordResponse)
def predict_word(req: WordRequest):
    for frame in req.frames:
        if len(frame) != WORD_NUM_KEYPOINTS:
            raise HTTPException(400, f"Each frame must have {WORD_NUM_KEYPOINTS} values.")
    x = np.asarray(req.frames, dtype=np.float32).reshape(1, WORD_SEQUENCE_LENGTH, WORD_NUM_KEYPOINTS)
    probs = WORD_MODEL.predict(x)[0]
    order = np.argsort(probs)[::-1]
    top3 = [
        WordTopPrediction(label=WORD_LABELS[i], confidence=float(probs[i]))
        for i in order[:3]
    ]
    best = order[0]
    return WordResponse(
        label=WORD_LABELS[best],
        confidence=float(probs[best]),
        top3=top3,
        note=(
            "Real NumPy forward pass of the vendored LSTM (verified to "
            "match the upstream Keras model's own reference outputs to "
            "within 4.77e-7). This is the model's best guess, not a "
            "verified correct answer."
        ),
    )
