# Avatar asset licensing

## cesium-man.glb

- **Source:** [KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CesiumMan) (the official Khronos Group glTF sample model repository).
- **Fetched from:** `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF-Binary/CesiumMan.glb`
- **License:** Creative Commons Attribution 4.0 International (CC-BY-4.0). Full text: https://creativecommons.org/licenses/by/4.0/legalcode
- **Attribution:** Model created by Cesium (https://cesium.com), distributed by the Khronos Group as part of the public glTF Sample Assets collection. This license excludes the Cesium logo/trademark itself, which is covered by a separate trademark notice in the upstream repository.
- **What it is:** A rigged, skinned humanoid character with a single built-in walk-cycle animation clip. It is a generic sample model used by the glTF ecosystem to test skeletal animation support. It is **not** an Indian Sign Language (ISL) performer and contains **no ISL-specific sign animations**.
- **Why it is here:** SignBridge's Checkpoint 4 goal was to build a real, working Three.js avatar rendering and animation pipeline. No downloadable, appropriately licensed, ISL-specific rigged avatar exists publicly. This model was used only to prove that the rendering/animation framework (GLB loading, skeleton, clip playback, playback controls) genuinely works end-to-end, using honestly-sourced placeholder geometry and motion.
- **Do not** interpret any pose or motion produced by this model as a verified ISL sign. SignBridge does not claim this model performs sign language, and the application UI says so explicitly wherever the 3D stage is shown.

## Investigated but not used

- **Mixamo (Adobe):** Offers free rigged characters and animation retargeting, but downloads require an interactive Adobe account login (OAuth-style web flow) and manual browser interaction. Not scriptable or fetchable by an automated tool in this environment. Not used.
- **Ready Player Me:** Has a developer API for generating avatars, but avatar generation requires an API key/app registration and produces avatars under Ready Player Me's own platform terms, which include usage restrictions tied to their platform. Not fetched in this checkpoint given the added account/licensing complexity and lack of clear benefit over the Khronos sample (no ISL-specific motion is possible via either route). Not used.
- **Sketchfab (CC-licensed Mixamo-rigged models):** Many individual uploads exist under CC licenses, but bulk/direct downloads of specific files generally require a logged-in Sketchfab account and interactive download flow (and licenses vary per-model and need manual per-file verification). Not scriptable without interactive login. Not used.
- **Khronos glTF-Sample-Assets (used):** Directly downloadable via raw GitHub URLs, no login required, clear per-model LICENSE.md in the repository. This is why it was the only option actually fetched and verified in this checkpoint.

## Rig investigation (follow-up checkpoint): does CesiumMan or any other Khronos sample have finger bones?

Verified directly, not assumed: `cesium-man.glb`'s embedded glTF JSON chunk was parsed with a small Node script that reads the GLB header and decodes the JSON chunk's `nodes` and `skins` arrays. The result: its single skin has 19 joints total, named
`Skeleton_torso_joint_1`, `Skeleton_torso_joint_2`, `torso_joint_3`,
`leg_joint_{R,L}_{1,2,3,5}`, `Skeleton_arm_joint_R` (+ `__2_`, `__3_` for
elbow/wrist), `Skeleton_arm_joint_L__4_` (+ `__3_`, `__2_` for elbow/wrist),
and `Skeleton_neck_joint_1`/`_2`. There are **no finger, hand, or thumb
joints anywhere in this rig**. It physically cannot pose individual
fingers no matter what animation code is written for it.

Checked whether a better Khronos sample exists before concluding this:
- Listed the full `KhronosGroup/glTF-Sample-Assets` `Models` directory via
  `https://api.github.com/repos/KhronosGroup/glTF-Sample-Assets/contents/Models`
  (no login required). Most entries are inanimate test objects (boxes,
  material comparison scenes, props). The only other rigged/animated
  humanoid-scale sample is `BrainStem`.
- Fetched `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BrainStem/glTF-Binary/BrainStem.glb`
  and parsed it the same way. Its node names are stripped/undefined in the
  exported file, and it is a robotic/mechanical rig (not humanoid hands)
  regardless. It offers no finger articulation either and is not a better
  option for this purpose.
- Conclusion: **no directly-downloadable, appropriately-licensed, hand/finger-rigged humanoid model exists in the Khronos sample set**, and the three gated sources already investigated above (Mixamo, Ready Player Me, Sketchfab) remain gated behind interactive login, confirmed again rather than assumed. This is the honest, final answer for this environment: it is not available without a login flow this tool cannot perform.

## Honest fallback actually implemented

Given the above, `frontend/components/avatar/gestureClips.ts` builds a set of
programmatic `THREE.AnimationClip`s using `QuaternionKeyframeTrack`s against
this rig's REAL joint names (verified above), moving only
shoulder/elbow/wrist/neck/torso joints. Each curated phrase in
`frontend/lib/data/signAnimationMap.ts` points at one of these clips, with
distinct joints, timing, and poses per phrase so they are visibly different
from each other. Every one of them is labeled `verifiedIsl: false` with an
explicit note, and the Parent Mode UI explicitly calls these "placeholder
reference demonstrations," never verified ISL signs. This is a simplified
body-gesture placeholder, not a substitute for real hand-shape ISL content,
which remains future work pending a real licensed/verified asset.
