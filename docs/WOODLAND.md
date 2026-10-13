# Woodland campsite

The main app integrates the campsite through **Scene → Woodland campsite**. It uses the finished floating workbench, shared renderer, transform gizmos, camera preview, matrix inspector, vertex trace and comparison tools. Click a prop to select an actual triangle vertex. Fit frames the full diorama; Reset scene restores the authored transforms. Cube lab remains available in the selector.

## Assets and style
Kenney Nature Kit: https://kenney.nl/assets/nature-kit, CC0. Chunky low-poly rather than strict voxel art. Ten original OBJ models and their MTL materials are vendored in public/assets/nature with the original license. No remote requests at runtime. Procedural earth, moss and stepping stones compose a woodland campsite with a tent, fire ring, logs, boulders, mushrooms and eight trees. Layout is deterministic.

## Architecture
`loadWoodland()` in src/scene/woodland-assets.ts returns `{world, meshes}` without creating a renderer or UI. Main app attaches this group to the lab scene. Instance materials are cloned so wireframe inspection affects only the selected mesh. Mesh geometry remains shared.

Inspection reads synchronized mesh.matrixWorld, camera.matrixWorldInverse and projectionMatrix. Homogeneous Vector4 values stay intact through clip space. Real geometry uses layer 0; bounds, axes, normals and vertex marker use layer 1. The scene camera starts orthographic with an isometric angle; the independent inspection camera remains orbitable.

The standalone `/woodland.html` development preview remains available, using the same asset loader. It is not an additional production build entry. Main-app integration and all local model assets are included in the standard production build.

## Validation
TypeScript passed; all 29 tests passed. Tests load actual vendored OBJ/MTL data deterministically and cover application selection, mesh and parent transforms, camera projection, comparison and reset/switching. Browser confirmed imported tree picking, numeric edits and live matrix/vertex trace. Production build passed, with the existing bundle-size advisory (~586 kB minified).
