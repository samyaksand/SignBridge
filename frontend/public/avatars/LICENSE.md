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
