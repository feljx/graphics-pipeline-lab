# Graphics Pipeline Lab
A local browser laboratory built with Three.js, TypeScript and Vite. Dark translucent editor UI surrounding a dominant 3D inspection view, with a distinct scene camera preview.

Pipeline: local → actual matrixWorld → camera matrixWorldInverse → projection → homogeneous clipping → perspective division → top-left viewport pixels. Column vectors, right handed, Y up, negative Z camera forward, WebGL NDC depth [-1,1]. Preserve W with Vector4. Unique logical cube corners. Parent transforms supported.

Controls: object TRS and gizmos in world/local space; camera position and target, perspective/orthographic, FOV, near/far; logical viewport size. Stage navigation and walkthrough, twelve educational presets, comparison, optional helpers. Live six-matrix inspector and coordinate trace. Demand rendering and responsive layout.

Validation: deterministic Vitest tests covering matrices, composition, inversion, projections, clipping, division and screen mapping including the specified 90°/near1/far10 example. Typecheck, tests and production build at each milestone. Browser QA where available. Record honest limitations.
