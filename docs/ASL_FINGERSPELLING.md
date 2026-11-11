# Letter Lens: ASL fingerspelling detection

## What it does

From the camera button on `/asl-fingerspelling-demo` (linked from the main
nav as "Letter Lens"), a user turns on their webcam and holds an ASL
fingerspelling letter shape (A-Z) in front of it. The page shows a live,
continuously updating "Detected letter" readout, along with the model's
real confidence number for that detection. The camera never starts on its
own, there is an explicit "Start Camera" action, and the stream is stopped
and released on "Stop Camera" or when the page unmounts.

## How it works

1. **Hand tracking.** MediaPipe Hands is loaded from the jsdelivr CDN
   (`@mediapipe/hands@0.4.1675469240`) via a `next/script` tag, the same
   loading pattern already used elsewhere in this project (see
   `frontend/app/word-signs/WordSignsClient.tsx`). Once loaded, it tracks
   one hand per frame and returns 21 hand landmarks, each with `x`, `y`,
   `z` coordinates normalized to the video frame.
2. **Feature extraction.** For each frame with a detected hand,
   `frontend/app/asl-fingerspelling-demo/FishAslDemoClient.tsx` computes a
   79-value feature vector from the 21 landmarks (`extractRobustFeatures`):
   - The 21 landmarks are re-centered on the wrist (landmark 0), then
     scaled by the distance from the wrist to the middle knuckle
     (landmark 9), giving 63 translation- and scale-invariant coordinate
     values.
   - 5 fingertip-to-wrist distances and 5 fingertip-to-knuckle distances
     (10 values), capturing finger curl and fist tightness.
   - A palm normal vector, the cross product of two vectors from the
     wrist to the index and pinky knuckles, normalized (3 values).
   - A hand direction vector, from the wrist to the middle knuckle,
     normalized (3 values).
   - Total: 63 + 10 + 3 + 3 = 79 values, matching the model's real input
     shape (confirmed directly from the shipped `model.json`, see below).
   This is a direct, line-for-line port of the originally vendored ASL
   demo's `index.html`'s `extractRobustFeatures` function, not a
   reimplementation from a written description. That vendored folder was
   not kept on disk once this native port was verified to work, since
   nothing in the frontend embeds or references it any more; see "Real
   provenance" below.
3. **Classification.** TensorFlow.js is loaded from the jsdelivr CDN
   (`@tensorflow/tfjs@4.17.0`) via a second `next/script` tag, the same CDN
   script tag pattern, no npm package. The real shipped model files
   (`model.json` and `group1-shard1of1.bin`, copied unmodified from the
   originally vendored demo's TensorFlow.js model folder before that
   folder was deleted) are served statically by Next.js
   from `frontend/public/asl-fingerspelling-model/`, and loaded in the
   browser with `tf.loadLayersModel('/asl-fingerspelling-model/model.json')`.
   This was verified directly: the real `model.json` is TensorFlow.js
   "layers-model" format (a Keras `Sequential` model: Dense(256, relu) ->
   BatchNorm -> Dropout -> Dense(128, relu) -> BatchNorm -> Dropout ->
   Dense(64, relu) -> Dense(26, softmax)), with a confirmed input shape of
   `[null, 79]` and output shape of `[null, 26]`. The 79-value feature
   vector is passed to `model.predict()`, and the 26-value softmax output
   (one probability per ASL letter A-Z, from `frontend/public/asl-fingerspelling-model/label_map.json`)
   is read with `.dataSync()`. The letter is only shown once its probability
   is at least 0.85 AND it has been the top prediction in at least 7 of the
   last 10 frames (temporal smoothing, ported unchanged from the vendored
   `index.html`'s majority-vote logic). The confidence number shown on
   screen is `Math.max(...probs)` for that frame, the model's real softmax
   output, never adjusted or fabricated.

## Tech stack

- Next.js, React, TypeScript for the page and component.
- MediaPipe Hands, loaded from CDN via a `<Script>` tag (not an npm
  dependency).
- TensorFlow.js, loaded from CDN via a `<Script>` tag (not an npm
  dependency; confirmed there is no `@tensorflow/tfjs` entry in
  `frontend/package.json`).
- No backend service. This feature has no server component at all: no
  Python process to start, no port to check, nothing SignBridge's own
  backend is involved in. Hand tracking, feature extraction, and
  classification all run in the browser, and the model files are static
  assets served by Next.js itself.

## Real provenance

This feature was ported from a vendored, iframed third-party project that
was kept at `fishleadit-asl-demo/` in this repository: **FishLeAdit/Realtime-ASL-recognition-with-Tensorflow.js-And-Mediapipe**
(https://github.com/FishLeAdit/Realtime-ASL-recognition-with-Tensorflow.js-And-Mediapipe).
That folder has since been removed from this repository: once the native
React/TypeScript port below was verified to work on its own (same
hand-tracking, feature extraction, and classification logic, no iframe),
nothing in the frontend embedded or referenced the vendored folder any
more, so it was deleted rather than kept as unused weight. The model files
it shipped were copied into `frontend/public/asl-fingerspelling-model/`
before that deletion, and that copy is unaffected.

**License status: no LICENSE file was found anywhere in the vendored
repository.** This was verified directly in the cloned source at the time
it was vendored, not just inferred from GitHub's UI. With no license file
and no license statement in the upstream README, the repository was "all
rights reserved" by default under copyright law. This integration does
not grant SignBridge, or its users, any rights beyond what that unresolved
license status allows; it reuses the original project's hand-tracking and
feature-extraction approach and the real shipped model weights, with
attribution recorded here. (The in-page UI disclosure of this license
status was removed at the project owner's explicit request; removing it
from the page UI does not change the underlying fact recorded in this
document.) If this feature is to ship to real, external users rather than
stay in local or limited use, the upstream repository's owner should be
asked to add an explicit license, or this feature should be reconsidered.

## Known limitations

- **Real-world accuracy across hands, lighting, and skin tones was never
  independently tested by SignBridge.** What was verified: the real model
  files load successfully in a real `tf.loadLayersModel()` call against a
  live server, the model's input/output shapes match the ported feature
  vector and label map, a forward pass on a sample input produces a real
  26-value softmax output that sums to 1.0, and the CDN scripts for
  MediaPipe Hands and TensorFlow.js both load successfully and expose the
  expected `window.Hands` and `window.tf` globals. What was NOT
  independently verified: detection accuracy with a real hand in front of
  a real camera, performance across different hand sizes, skin tones, or
  lighting conditions, or any accuracy claim from the upstream project.
- The 0.85 confidence threshold and 7-of-10-frame majority vote are
  unchanged from the vendored project's own tuning; SignBridge has not
  independently re-tuned or validated these thresholds.
- Only one hand is tracked at a time in this native port (`maxNumHands: 1`
  in the MediaPipe Hands options), unlike the vendored demo's two-hand
  tracking, since this feature only needs a single fingerspelled letter at
  a time.
- A real bug was found and fixed during this integration: `next/script`
  tracks each CDN script URL as loaded for the whole browser session, not
  per page visit. Revisiting this page (or visiting it after another page
  already loaded the same MediaPipe Hands CDN script) could leave the
  "Loading hand-tracking and letter model..." message stuck forever,
  because `next/script` would not call this component's `onLoad` again.
  The fix checks for already-present `window.Hands` / `window.tf` globals
  on mount, in addition to relying on `onLoad`, with a 15-second timeout
  as a last-resort fallback that shows an honest failure message instead
  of an unexplained spinner.
