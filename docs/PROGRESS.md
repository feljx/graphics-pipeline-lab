# Progress
Current direction: floating scene tools supersede the previous milestone roadmap. Lesson stages, walkthrough and preset bookmarks are removed; contextual interactive notes are deferred. Historical entries below describe earlier versions.
- Repository inspected: empty.
- Specification and project conventions saved.
- Milestone A: implemented and validated; audit corrections validated below.
- Milestone B: recorded integration-coverage and coordinate-documentation follow-ups completed.
- Milestone C: continued with responsive/accessibility checks; real mobile touch testing remains.

## Milestone A validation
- Core Three.js scene, inspection orbit, gizmos, editable object/camera, unique vertex selection and six live matrices implemented.
- Typecheck passed; 11 production-math tests passed; production build passed.
- Browser loaded successfully and scene rendered. Found preview panel obscuring scissored output; corrected its transparency.
- No Git repository existed, so milestone commit was unavailable.

## Milestone B
- Seven stages with equations, explanations, keyboard stepping and timed walkthrough.
- Camera preview with aspect containment, separate NDC diagram, 13 experiments, parent example, order experiment, comparison snapshot/ghost.
- Clip/W classifications and deterministic edge case tests pass.
- Remaining: strengthen integration coverage and document viewport coordinate conventions.

## Milestone C
- Translucent responsive UI, compact matrix grid, helper toggles and normal matrix arrows.
- Demand rendering and lifecycle cleanup implemented.
- Browser QA and final verification in progress.

## Final validation — 2026-10-12
- A/B/C feature passes implemented in the local application; checkpoints were developed within one implementation session rather than separate commits.
- TypeScript check: passed.
- Vitest 5.0.4: 15 tests passed across mathematical and actual Three.js object/camera integration suites.
- Production build: passed. Advisory: single Three.js-containing bundle ~558 kB minified (~143 kB gzip).
- npm dependency audit: zero vulnerabilities after updating Vitest.
- Browser QA: scene rendering, scissored scene-camera output, orthographic preset, clipping experiment/vertex selection, and live near-plane input → projection matrix synchronization checked.
- Added explicit logical viewport, canvas CSS and physical drawing-buffer coordinate readouts.
- Fixed helper layer propagation, projection helper replacement, input synchronization, preview opacity, and preservation of edited parent transforms.
- Git initialization attempted; sandbox rejected creation of .git (`Operation not permitted`). No commits created.

### Known limitations
- Browser testing was manual; no automated browser regression suite or exhaustive mobile gesture testing.
- Walkthrough changes stages and textual/numerical representations; no interpolated geometric animation between coordinate spaces.
- Custom R·T·S experiment intentionally uses numeric controls with gizmos disabled.
- Comparison snapshots show ghost geometry and pixel values; no full dual-inspector layout.
- Normal overlay displays six transformed face normals; no per-vertex normal editing.
- Compact stage names, navigation and camera tab were verified in a phone-sized browser viewport; real mobile touch gestures remain unverified.
- Fonts use Google Fonts with local sans-serif/monospace fallbacks.

Run `npm run dev` and open http://localhost:5173. See README.md for controls and conventions.

## Audit corrections and milestone continuation — 2026-10-12

All five Astra findings were confirmed against the installed Three.js controls and application handlers, then corrected with targeted changes:
- Gizmo raycaster now matches layer 1 pickers and drag plane.
- TransformControls `change` events request demand rendering; `objectChange` still synchronizes numeric values.
- Each object retains its transform order; selection restores the order and gizmo availability. Camera edits and projection/reset operations update only the camera.
- Parent rotation toggle recomposes the parent matrix and refreshes selected-parent values, including RTS mode.
- Behind-camera status uses view-space Z, so orthographic W=1 is handled correctly.
- Related verified mismatch corrected: initial gizmo space now matches the UI's local-space selection.
- Model-stage explanation now states the correct application order: local transform first, parent transform second.

Validation after corrections: 20 tests passed; TypeScript check and production build passed. New tests import the actual application and createLab, retaining real Three.js objects, OrbitControls and TransformControls. Only DOM, animation scheduling and GPU renderer are replaced. Regressions cover real handle picking/dragging, orbit locking, numeric synchronization, idle render scheduling, order isolation, camera/model independence, and parent checkbox composition. Orthographic behind-camera classification has a production-pipeline regression.

Milestone B follow-up: application interaction coverage added; viewport coordinate conventions remain documented in README and live inspector. These recorded B follow-ups are complete.
Milestone C continued: browser verified parent rotation values and immediate rotate-gizmo rendering. Phone-sized browser viewport reached (325×703 CSS pixels at the browser's existing zoom); compact controls and scrolling inspector remain available. Added explicit stage button accessible names because the compact layout hides stage text. Final checks follow this accessibility change.


Final correction checks: 20 tests passed, type checking passed, production build passed. Browser verification also confirmed real gizmo dragging changes object position, inspector values and vertex trace together. Compact stage navigation and camera-tab switching were exercised; viewport override was reset afterward. The existing Three.js bundle-size advisory remains (~557 kB minified). No unrelated UI redesign or dependency changes were made.

## GitHub Pages setup — 2026-10-13
- User requested GitHub Pages hosting and phone-compatible GitHub authentication; public Pages is acceptable if private access is unavailable.
- Verified private Pages requires an Enterprise Cloud organization; personal-account Pages is public.
- Added an Actions workflow with tests, type checking, production build, dynamic repository base path, and Pages artifact/deployment actions pinned to the official Vite guide's commit references.
- GitHub CLI 2.102.0 installed and Git repository initialized on main. Device authentication completed by the user; GitHub CLI authenticated as feljx.
- Validation: all 20 tests passed; type checking and production build with a repository subpath passed. GitHub repository and Pages deployment completed (see below).


## GitHub Pages deployed — 2026-10-13
- Public repository: https://github.com/feljx/graphics-pipeline-lab
- Live application: https://felixsuhl.com/graphics-pipeline-lab/
- The project inherits the account's existing Pages custom domain. HTTPS is enforced for this project; the account domain configuration was not changed.
- GitHub Actions run 38321778061 completed successfully: clean npm install, 20 tests, TypeScript/production build, artifact upload and deployment.
- Live page, JavaScript and CSS assets all returned HTTP 200 over HTTPS.
- Commits use GitHub's no-reply email. Pushes to main deploy automatically; manual deployments are available in Actions.
- Documentation-only deployment notes committed with [skip ci] to avoid rebuilding unchanged application assets.


## Unified responsive workbench — 2026-10-13
- Replaced the compressed desktop/mobile overrides with one shared workbench and five accessible tabs: Object, Camera, Pipeline, Math, View. No duplicated mobile controls or state.
- Phones place the live scene above a scrollable workbench; desktop and landscape place them side by side. Collapsing controls expands the actual canvas and keeps navigation available.
- Added touch-sized controls, larger numeric inputs, dynamic viewport/safe-area sizing, keyboard tab navigation, and reduced-motion support. Scene-camera preview stays inside the renderer host and follows its resize.
- Pipeline lessons, matrices, projected vertices, overlays and comparison are reachable at every size. Mathematical and scene-state implementations are unchanged.
- Validation: 22 tests passed, type checking and production build passed. New regressions cover shared control state, collapse/reopen, panel visibility and keyboard tabs. Browser checked 390×844 portrait, 740×390 landscape and 1280×800 desktop: no horizontal overflow; scene and controls fit; collapsed canvas fills available space. Native phone touch/keyboard behavior remains unverified. Existing Three.js bundle-size advisory remains.


## Drag responsiveness — 2026-10-13
- Coalesce gizmo object changes into one inspector update immediately before rendering each frame, rather than rebuilding DOM for every pointer event. Final transforms and numerical inspection remain synchronized.
- Resize the WebGL drawing buffer and update inspection projection only when host dimensions change.
- Increase orbit damping factor from the Three.js default 0.05 to 0.15 for faster response; explicitly continue frames while damping changes the camera, then stop when settled.
- Validation: 25 tests passed, TypeScript and production build passed. Regressions cover burst coalescing, final inspector values, resize-only-on-change, and real OrbitControls mouse/touch pointer paths through movement, release, damping and idle. Browser verified real gizmo drags at desktop and 390×844 phone size update position and trace together. Native-device performance remains unmeasured.


## Floating scene tools — 2026-10-13
- Replaced the fixed workbench with a full-screen scene and one reusable, non-modal floating panel. Object, Camera, Inspect and View icons open it; outside touch/click, the same icon, close button or Escape dismiss it. Outside gestures continue to the scene. The camera output is a permanently pinned panel.
- Default dark panels have subtle borders and slight transparency. Phone layout uses safe areas and the visual viewport for keyboard space. Portrait framing leaves the cube above the panel; Fit centers and scales the current cube using its actual world bounds. Resizing preserves orbit direction/target and relative zoom.
- Gizmos scale with available screen size and use softer axis colors. Removed redundant world axes; shorter local axes and the camera frustum are opt-in. Canceled touch drags release the gizmo/orbit lock. Previous drag batching and resize optimizations remain.
- Removed lesson stages, timed walkthrough, preset loading and their shortcuts. Previous future milestone plans are superseded. Interactive contextual notes tied to the current scene are a future direction only; no replacement lesson system was added.
- Validation: 27 deterministic tests pass, with regressions for outside dismissal without event cancellation, retained edits, Escape, portrait fit/rotation resize, canceled drags and visual-viewport keyboard resizing. Type checking and production build pass. Browser checked 402×874 portrait, 874×402 landscape and 1280×800 desktop; no horizontal overflow, pinned output remains visible, camera projection switching works, and an outside gizmo drag both dismisses the panel and changes numeric position. Native iPhone touch/keyboard and device performance remain unverified.


## Woodland scene integration — 2026-10-13
- Integrated the Kenney CC0 Nature Kit campsite through the existing renderer and floating workbench; Scene selector switches between Cube lab and Woodland campsite.
- Shared renderer-independent loader supplies deterministic trees, tent, logs, rocks and mushrooms, with vendored OBJ/MTL files and original license.
- Clicking geometry selects an actual triangle vertex. Existing transforms, gizmos, live matrices, homogeneous traces, projection plot, scene-camera preview and comparison use the selected mesh. Parent transforms target its real scene parent.
- Woodland camera starts with an orthographic game view; inspection remains orbitable. Fit frames the whole diorama, reset restores authored woodland transforms.
- Standalone woodland preview remains available for reference.
- Validation: TypeScript passed; 29 tests passed, including deterministic loading of the actual vendored OBJ/MTL assets and application integration coverage for selected meshes, parent transforms, preview projection, ghost comparison, reset and scene switching. Browser confirmed imported tree picking, numeric edit synchronization, live matrices/vertex trace and the shared orthographic scene-camera preview.
- Production build passed (~586 kB JavaScript minified); existing bundle-size advisory remains. Background selection persists across demand renders.
