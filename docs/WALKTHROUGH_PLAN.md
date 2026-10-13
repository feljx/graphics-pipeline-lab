# Interactive walkthroughs

Implemented 2026-10-13. This replaces the earlier device-speech-only plan and standalone-Woodland assumptions.

## Experience

Learn in the floating dock opens a compact chooser. Three authored cube demonstrations use the actual numeric controls, scene camera, inspection camera, matrix inspector and pinned output. Woodland users explicitly choose to switch to Cube lab; Exit restores the original scene and selected mesh. The shared renderer remains authoritative.

- Perspective versus orthographic: five beats. Identity cube and parent, camera (0,0,8), FOV 50°, output 800×600, near .1, far 30. Perspective moves Z 0→4, then orthographic height 6 repeats it, then practice. Synchronized center-plane landmarks measure 2× versus 1×; silhouette growth is independently measured (7/3 for this cube in perspective).
- Local versus parent: four beats. Child local position (2,0,0), parent Y 0→90°, measured local/world origin readout, then practice at 45°. Expected world origin (0,0,-2).
- Near clipping: four beats. Cube at origin, camera (0,0,5), near .1→4.5, far 30. Actual transformed vertices have depths 4 and 6; four fail homogeneous z ≥ −w. Explain intersecting-triangle clipping before division, then lower near in practice.

One card supplies captions, Play/Pause, Back, Next, Replay, Sound, Exit & restore and Keep result. Next is explicit: setup/readout beats do not advance on a timer. During motion, both narration and animation must finish before the measured result cue. Next deliberately completes/verifies a motion before advancing. Practice completion reports current measurements without claiming the learner matched an expected answer.

## Implementation

- `src/main.ts`: typed numeric command shared by manual inputs and lessons; application capture/restore adapter. Snapshot includes scene, mesh/vertex, child and parent transforms/orders, camera settings, inspection pose/projection/orbit target and distance limit, gizmo mode/space, overlays, comparison geometry/matrix and open panel.
- `src/learning/lessons.ts`: titles and measured landmarks through actual synchronized matrices. Vector4 is retained until perspective division; near rejection is checked directly in clip coordinates.
- `src/learning/player.ts`: cancellation-token tween. Uses the lab's frame scheduler, not another rendering loop. Reduced motion applies an immediate endpoint.
- `src/learning/ui.ts`: chooser, transport, authored beat transitions, checkpoints, verification, interruptions and real-element highlights. Native CSS outlines follow their elements during scrolling and keyboard changes; resize scrolls the current target into view. Missing targets pause. Phone layout reserves separate regions for controls and explanation; cards remain scrollable on short screens.
- `src/learning/voice.ts` and `speech.worker.ts`: one lazy Kokoro engine, q8/WASM, af_heart only. No system TTS fallback.

Replay restores the beat checkpoint; Back constructs the previous deterministic checkpoint. Manual input, panel dismissal, orbit/gizmo gestures and visibility loss cancel narration and pending motion. Play explicitly replays the checkpoint after an interruption. Practice permits manual edits. Scene changes cancel the previous lesson before switching; stale animation/audio callbacks are invalidated. Exit restores the saved arrangement; Keep result releases it. Generation cancellation terminates a busy worker; exit releases the worker and audio URLs.

## Local speech and static hosting

Inspected installed `kokoro-js` 1.2.1 and Transformers.js 3.8.1. Kokoro fetches just the requested voice, caches voices using CacheStorage when available, and gracefully tolerates cache failure. Transformers handles model caching. Text is sent only to the local worker; requests fetch public model/tokenizer/voice assets, without authentication or a speech backend.

The published q8 file (`model_quantized.onnx`) is **92.4 MB**, versus **326 MB** fp32; no GPU upgrade is selected. The production build additionally emits ~2.21 MB speech worker JavaScript and ~21.60 MB WASM (uncompressed). First use clearly shows download/loading/generation status. Generation and playback share a 90-second bound; errors/timeouts continue with captions. Animation starts on the audio `playing` event, not a synthesis estimate. Navigation, pause, mute, interaction and exit stop audio immediately. Only the current cue is generated; measured claims are generated after verification.

Single-thread WASM and disabled ONNX proxy mode avoid a COOP/COEP requirement. Vite emits worker/runtime URLs using the configured Pages base. Verified local production preview at `/clarity-engine/`, including actual speech-enabled motion completion. No deployment performed.

Sources: [Kokoro API](https://github.com/hexgrad/kokoro/tree/main/kokoro.js), [published model files and sizes](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/tree/main/onnx).

## Validation and limitations

- 41 deterministic tests: actual application controls/matrices, mathematical ratios, parent/clipping endpoints, Replay, restoration including Woodland and RTS parent selection, manual and scene-switch cancellation, stale frame/audio callbacks, speech failure/timeouts/mute, and audio-start gating. Inference is mocked in unit tests; tests download no model.
- `npm test`, `npm run typecheck`, `npm run build` pass. Production subpath build also passes.
- Browser viewports checked: 402×874 portrait, 874×402 landscape, 1280×800 desktop. Checked actual highlights, measured captions, manual edits, preview visibility and transport/restoration. Local production speech ran without browser errors.
- Real phones, mobile Safari audio permissions/caching, native touch/keyboard and speech quality/speed have not been evaluated. Viewport checks are not device tests. Narrow/short layouts use panel/card scrolling. Downloads and browser storage remain device/network dependent; captions are always available.
- npm audit reports seven advisories through Kokoro's Node-side dependency paths (`sharp`, `onnxruntime-node`/logging dependencies and their dependents), with no compatible automatic fix. These Node paths are excluded from the browser bundle. Track upstream updates; do not use this integration as a Node speech service without reviewing them.
- Existing Three.js main bundle size advisory remains; the speech worker/runtime are separate and only requested when speech is used.
