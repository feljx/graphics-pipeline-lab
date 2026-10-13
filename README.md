# Graphics Pipeline Lab

An interactive Three.js graphics mathematics laboratory.

```sh
npm install
npm run dev
```

Open http://localhost:5173. `npm test`, `npm run typecheck`, and `npm run build` validate the project.

Use the Object, Camera, Pipeline, Math and View tabs in the shared workbench. On phones, controls sit below the scene; collapse them with the chevron for more scene space.

Drag to orbit, pinch or scroll to zoom, click cube corners, and use W/E/R for move/rotate/scale. Arrow keys navigate stages; Space starts or pauses the walkthrough. The scene camera is independent from the inspection view. Camera controls use an explicit position and look-at target. Scene geometry is layer 0; inspection helpers are layer 1.

Screen coordinates are logical viewport pixels with top-left origin. The camera preview contains this aspect ratio. Canvas CSS coordinates account for its fitted position; drawing-buffer coordinates multiply by renderer DPR (capped at 2). These coordinates can lie outside the preview when a point is clipped. Clipping labels classify vertices, not entire triangles.

Custom R·T·S order uses a manual local matrix and numerical controls. Gizmos are disabled in this mode to avoid inconsistent TRS decomposition. Capture comparison stores the current vertex trace and world transform as ghost geometry.

See docs/SPEC.md and docs/PROGRESS.md for requirements and validation notes.

## GitHub Pages

The `.github/workflows/pages.yml` workflow tests, type checks, builds and deploys pushes to `main`, or manual workflow runs. In repository Settings → Pages, select **GitHub Actions** as the source. The build uses Pages' configured base path so assets load under the repository URL. No separate hosting service or local server is required after deployment.

Personal-account Pages sites are public, including sites built from private repositories on eligible paid plans. Private Pages requires a GitHub Enterprise Cloud organization with access control configured.

Live app: https://felixsuhl.com/graphics-pipeline-lab/  
Repository: https://github.com/feljx/graphics-pipeline-lab
