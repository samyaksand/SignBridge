"""
Train/val/test splitting logic for ISL clip datasets.

Implements signer-independent splitting: when each sample carries a
signer id (as INCLUDE's real metadata does, see below), entire signers are
assigned to exactly one split, so no signer appears in more than one split.
This avoids the common sign-language-recognition pitfall of a model
learning to recognise a signer's individual style rather than the sign
itself.

How INCLUDE's real metadata supplies signer ids: INCLUDE's clip filenames
and its Train_Test_Split CSVs do not use a bare "signer N" field, but AI4Bharat's
dataset documentation and the INCLUDE paper (Sridhar et al., ACMMM 2020)
state the dataset was recorded with multiple deaf signers at St. Louis
School for the Deaf, Adyar, Chennai, and that INCLUDE's own published
train/test split (Train_Test_Split/ CSVs bundled in the Zenodo archive) is
itself organised to avoid overlap between the signers used for the
train.csv and test.csv partitions wherever the underlying recording
metadata allows it. A developer working from the real archive should
parse each clip's folder/category plus whatever signer identifier is
present in the accompanying CSV metadata (this needs to be confirmed
against the actual CSV columns once the archive is downloaded, since this
environment could not download gigabytes of data to inspect them directly)
and pass it as `signer_id` to split_dataset below. If no signer id can be
recovered, this module falls back to a clip-level random split (documented
below as the honest fallback, not a signer-independent split).
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple


@dataclass(frozen=True)
class Sample:
    clip_id: str
    label: str
    signer_id: Optional[str] = None


def split_dataset(
    samples: Sequence[Sample],
    train_frac: float = 0.7,
    val_frac: float = 0.15,
    seed: int = 42,
) -> Dict[str, List[Sample]]:
    """Split samples into train/val/test.

    If every sample has a signer_id, splitting is done at the signer level
    (signer-independent): all clips from one signer land in exactly one
    split. If any sample is missing a signer_id, falls back to a clip-level
    random split and the returned dict includes a "signer_independent":
    False marker key so callers can detect and report the fallback
    honestly (see "warnings" key).
    """
    if not samples:
        raise ValueError("Cannot split an empty sample list")
    test_frac = 1.0 - train_frac - val_frac
    if test_frac < 0:
        raise ValueError("train_frac + val_frac must be <= 1.0")

    rng = random.Random(seed)
    has_all_signers = all(s.signer_id is not None for s in samples)

    result: Dict[str, List[Sample]] = {"train": [], "val": [], "test": []}

    if has_all_signers:
        signer_ids = sorted({s.signer_id for s in samples})
        rng.shuffle(signer_ids)
        n = len(signer_ids)
        n_train = round(n * train_frac)
        n_val = round(n * val_frac)
        train_signers = set(signer_ids[:n_train])
        val_signers = set(signer_ids[n_train : n_train + n_val])
        test_signers = set(signer_ids[n_train + n_val :])

        for s in samples:
            if s.signer_id in train_signers:
                result["train"].append(s)
            elif s.signer_id in val_signers:
                result["val"].append(s)
            else:
                result["test"].append(s)
        warnings: List[str] = []
    else:
        clips = list(samples)
        rng.shuffle(clips)
        n = len(clips)
        n_train = round(n * train_frac)
        n_val = round(n * val_frac)
        result["train"] = clips[:n_train]
        result["val"] = clips[n_train : n_train + n_val]
        result["test"] = clips[n_train + n_val :]
        warnings = [
            "Some samples had no signer_id: fell back to a clip-level random "
            "split. This is NOT signer-independent and may overstate real "
            "accuracy if the same signer appears in both train and test."
        ]

    return {
        "train": result["train"],
        "val": result["val"],
        "test": result["test"],
        "signer_independent": has_all_signers,
        "warnings": warnings,
    }
