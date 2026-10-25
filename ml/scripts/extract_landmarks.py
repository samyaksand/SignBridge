"""
Landmark extraction for ISL video clips, implemented against the real
MediaPipe Tasks API (mediapipe 1.1.1, installed in this environment).

IMPORTANT, read before trusting any numbers from this file: this script has
been executed in this environment only against synthetic test images (solid
colour frames with no real hand or body present), to prove the MediaPipe
Tasks pipeline (model loading, image wrapping, landmark result parsing,
handedness-based left/right hand assignment) runs end to end without
crashing. It has NOT been run against any real ISL video or any frame
containing a real human body, because no dataset video files exist in this
environment (see docs/DATASET.md for why). Do not read any landmark values
produced by the synthetic smoke test as describing real hand or body poses.

Real usage (once a developer has downloaded INCLUDE locally):

    python ml/scripts/extract_landmarks.py \
        --input-dir /path/to/include/clips \
        --output-dir ml/data/landmarks_raw \
        --hand-model ml/models/hand_landmarker.task \
        --pose-model ml/models/pose_landmarker_lite.task

Model assets: this script expects two MediaPipe Tasks model bundles
(hand_landmarker.task and pose_landmarker_lite.task). These are NOT the
INCLUDE dataset, they are MediaPipe's own pretrained landmark detector
weights, hosted by Google at:

    https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
    https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task

Both were reachable and downloadable (HTTP 200, ~7.8MB and ~5.8MB
respectively) when checked in this environment with curl. They can be
downloaded with `download_mediapipe_models()` below, or manually.

Output format: one JSON (or .npy, see --format) file per input video,
containing a list of per-frame landmark records matching
ml/src/normalization.FrameLandmarks: left_shoulder, right_shoulder (each
either null or {x,y,z}), left_hand, right_hand (each either null or a list
of 21 {x,y,z} points). This is exactly the shape ml/src/normalization.py
consumes.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from dataclasses import asdict
from pathlib import Path
from typing import List, Optional

MEDIAPIPE_MODEL_URLS = {
    "hand_landmarker.task": (
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
        "hand_landmarker/float16/1/hand_landmarker.task"
    ),
    "pose_landmarker_lite.task": (
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
        "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
    ),
}

# MediaPipe Pose landmark indices used for shoulders/elbows/wrists.
# See https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
POSE_LEFT_SHOULDER = 11
POSE_RIGHT_SHOULDER = 12
POSE_LEFT_ELBOW = 13
POSE_RIGHT_ELBOW = 14
POSE_LEFT_WRIST = 15
POSE_RIGHT_WRIST = 16


def download_mediapipe_models(dest_dir: Path) -> None:
    """Download the small (<10MB each) MediaPipe Tasks model bundles.

    These are MediaPipe's own pretrained detector weights, not the INCLUDE
    dataset. Verified reachable in this environment via curl -I (HTTP 200).
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    for filename, url in MEDIAPIPE_MODEL_URLS.items():
        dest = dest_dir / filename
        if dest.exists():
            print(f"Already present: {dest}")
            continue
        print(f"Downloading {url} -> {dest}")
        urllib.request.urlretrieve(url, dest)
        print(f"  wrote {dest.stat().st_size} bytes")


def _point_from_landmark(lm) -> dict:
    return {"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)}


class LandmarkExtractor:
    """Wraps MediaPipe HandLandmarker + PoseLandmarker (image/IMAGE mode).

    Built against the real mediapipe==1.1.1 Tasks API available in this
    environment (mediapipe.tasks.python.vision.HandLandmarker /
    PoseLandmarker). Video (VIDEO running mode) is used for real clips so
    MediaPipe can exploit temporal smoothing; IMAGE mode is used for the
    synthetic single-frame smoke test below.
    """

    def __init__(self, hand_model_path: str, pose_model_path: str, running_mode: str = "VIDEO"):
        import mediapipe as mp
        from mediapipe.tasks.python import vision, BaseOptions

        self._mp = mp
        self._vision = vision
        mode = {
            "IMAGE": vision.RunningMode.IMAGE,
            "VIDEO": vision.RunningMode.VIDEO,
        }[running_mode]

        hand_options = vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=hand_model_path),
            running_mode=mode,
            num_hands=2,
        )
        pose_options = vision.PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=pose_model_path),
            running_mode=mode,
        )
        self.hand_landmarker = vision.HandLandmarker.create_from_options(hand_options)
        self.pose_landmarker = vision.PoseLandmarker.create_from_options(pose_options)
        self._running_mode = running_mode

    def close(self) -> None:
        self.hand_landmarker.close()
        self.pose_landmarker.close()

    def process_frame(self, rgb_frame, timestamp_ms: int) -> dict:
        """Process a single RGB numpy frame (H, W, 3 uint8). Returns a dict
        matching ml/src/normalization.FrameLandmarks field names."""
        mp_image = self._mp.Image(image_format=self._mp.ImageFormat.SRGB, data=rgb_frame)

        if self._running_mode == "VIDEO":
            hand_result = self.hand_landmarker.detect_for_video(mp_image, timestamp_ms)
            pose_result = self.pose_landmarker.detect_for_video(mp_image, timestamp_ms)
        else:
            hand_result = self.hand_landmarker.detect(mp_image)
            pose_result = self.pose_landmarker.detect(mp_image)

        left_hand: Optional[List[dict]] = None
        right_hand: Optional[List[dict]] = None

        # Assign each detected hand to left/right using MediaPipe's own
        # handedness classification (handedness[i] corresponds to
        # hand_landmarks[i]). Note MediaPipe reports handedness from the
        # subject's own perspective (mirrored for a front-facing camera is
        # a separate, app-level concern, not handled here).
        for idx, handedness in enumerate(hand_result.handedness or []):
            label = handedness[0].category_name  # "Left" or "Right"
            points = [_point_from_landmark(lm) for lm in hand_result.hand_landmarks[idx]]
            if label == "Left":
                left_hand = points
            elif label == "Right":
                right_hand = points

        left_shoulder = None
        right_shoulder = None
        if pose_result.pose_landmarks:
            pose_landmarks = pose_result.pose_landmarks[0]
            left_shoulder = _point_from_landmark(pose_landmarks[POSE_LEFT_SHOULDER])
            right_shoulder = _point_from_landmark(pose_landmarks[POSE_RIGHT_SHOULDER])

        return {
            "left_shoulder": left_shoulder,
            "right_shoulder": right_shoulder,
            "left_hand": left_hand,
            "right_hand": right_hand,
        }


def extract_video(extractor: LandmarkExtractor, video_path: Path) -> List[dict]:
    """Extract per-frame landmarks from a real video file using OpenCV."""
    import cv2

    cap = cv2.VideoCapture(str(video_path))
    frames: List[dict] = []
    frame_index = 0
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    try:
        while True:
            ok, bgr_frame = cap.read()
            if not ok:
                break
            rgb_frame = bgr_frame[:, :, ::-1].copy()
            timestamp_ms = int(frame_index * (1000.0 / fps))
            frames.append(extractor.process_frame(rgb_frame, timestamp_ms))
            frame_index += 1
    finally:
        cap.release()
    return frames


def run_synthetic_smoke_test(models_dir: Path) -> dict:
    """Run the real extractor against synthetic (solid-colour, no real
    person) frames, to prove the pipeline code executes end to end in this
    environment. Returns the raw per-frame landmark dict for inspection.

    This is NOT a claim that real hand/body detection has been validated,
    solid-colour frames are expected to produce NO hand detections and
    (likely) no pose detections. The point is only that model loading,
    the Tasks API calls, and the output-shape conversion all run without
    raising, with real installed MediaPipe binaries.
    """
    import numpy as np

    hand_model = models_dir / "hand_landmarker.task"
    pose_model = models_dir / "pose_landmarker_lite.task"
    if not hand_model.exists() or not pose_model.exists():
        raise FileNotFoundError(
            "Model assets missing, run with --download-models first: "
            f"{hand_model} / {pose_model}"
        )

    extractor = LandmarkExtractor(str(hand_model), str(pose_model), running_mode="IMAGE")
    try:
        # A synthetic "clip" of 5 solid-grey frames. Not a real sign, not a
        # real person, purely to exercise the code path.
        synthetic_frames = [
            (np.ones((480, 640, 3), dtype="uint8") * (50 + 20 * i)) for i in range(5)
        ]
        results = [extractor.process_frame(f, 0) for f in synthetic_frames]
    finally:
        extractor.close()

    return {
        "note": "SYNTHETIC SMOKE TEST ONLY: solid-colour frames, no real hand or body present.",
        "frame_count": len(results),
        "frames": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=str, default=None, help="Directory of real video clips")
    parser.add_argument("--output-dir", type=str, default="ml/data/landmarks_raw")
    parser.add_argument("--models-dir", type=str, default="ml/models")
    parser.add_argument("--download-models", action="store_true")
    parser.add_argument("--synthetic-smoke-test", action="store_true")
    args = parser.parse_args()

    models_dir = Path(args.models_dir)

    if args.download_models:
        download_mediapipe_models(models_dir)
        return

    if args.synthetic_smoke_test:
        result = run_synthetic_smoke_test(models_dir)
        print(json.dumps({k: v for k, v in result.items() if k != "frames"}, indent=2))
        print(f"Processed {result['frame_count']} synthetic frames without crashing.")
        return

    if args.input_dir is None:
        print("No --input-dir given. Nothing to extract.")
        print("Real INCLUDE clips are not present in this environment (see docs/DATASET.md).")
        print("Use --download-models to fetch MediaPipe's small detector models, or")
        print("--synthetic-smoke-test to prove the extraction code runs end to end.")
        sys.exit(0)

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    hand_model = models_dir / "hand_landmarker.task"
    pose_model = models_dir / "pose_landmarker_lite.task"

    extractor = LandmarkExtractor(str(hand_model), str(pose_model), running_mode="VIDEO")
    try:
        video_files = sorted(input_dir.glob("**/*.mp4"))
        print(f"Found {len(video_files)} .mp4 files under {input_dir}")
        for video_path in video_files:
            frames = extract_video(extractor, video_path)
            out_path = output_dir / (video_path.stem + ".json")
            out_path.write_text(json.dumps(frames))
            print(f"  {video_path.name}: {len(frames)} frames -> {out_path}")
    finally:
        extractor.close()


if __name__ == "__main__":
    main()
