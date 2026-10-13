# Graphics Pipeline Lab
A local browser laboratory built with Three.js, TypeScript and Vite. Full-screen 3D inspection view with dark, subtly translucent floating control panels and a pinned scene camera preview.

Pipeline: local → actual matrixWorld → camera matrixWorldInverse → projection → homogeneous clipping → perspective division → top-left viewport pixels. Column vectors, right handed, Y up, negative Z camera forward, WebGL NDC depth [-1,1]. Preserve W with Vector4. Unique logical cube corners. Parent transforms supported.

Controls: object TRS and gizmos in world/local space; camera position and target, perspective/orthographic, FOV, near/far; logical viewport size. Floating Object, Camera, Inspect and View panels open from icons and dismiss on outside touch. Comparison and optional helpers remain. Live six-matrix inspector and coordinate trace. Demand rendering and responsive layout.

Validation: deterministic Vitest tests covering matrices, composition, inversion, projections, clipping, division and screen mapping including the specified 90°/near1/far10 example. Typecheck, tests and production build at each milestone. Browser QA where available. Record honest limitations.

Product direction (2026-10-13): previous lesson stages, timed walkthrough and setting-loading experiment bookmarks have been removed. Previous future milestone plans are superseded. A later system will provide interactive notes/explanations relevant to the current scene; it is intentionally not implemented in this change.
