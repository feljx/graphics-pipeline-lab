# Progress
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
