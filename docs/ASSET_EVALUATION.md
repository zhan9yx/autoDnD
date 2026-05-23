# Asset Evaluation Workflow

Use this workflow before promoting generated scene sheets into the main asset library.

## Automated Checks

Run:

```bash
npm run test -- tests/generatedAssets.test.js
```

The scene checks require:

- At least 80 generated raster scene assets in the current 0007 slice.
- `sceneLibrary.targetSceneCount` set to 500.
- Every generated raster scene has a non-empty immersive `description`.
- Every generated raster scene has at least two `soundscapeHints`.
- Every generated raster scene keeps provenance aligned with `manifest.sourceKind`.
- Every referenced sheet, PNG slice, and SVG wrapper exists.

## Manual Review

Review each new sheet before ingestion:

- **Macro environment:** the tile must read as a large playable place, not an icon, prop, portrait, or decorative texture.
- **Style unity:** painterly gaslamp fantasy, consistent color grading, and compatible lighting.
- **Usability:** enough open floor, routes, thresholds, or platforms for characters and interactable objects.
- **Soundscape fit:** the description and hints should clearly map to rain, forest, pond, waterfall, campfire, insects, market-city, mystery, calm-night, or combat-tension.
- **No visual contamination:** no text, watermark, UI, logo, obvious modern object, or accidental close-up character focus.
- **AIDM awareness:** name, description, tags, and soundscape hints must be specific enough for search and automatic scene selection.

## Release Gate

A generated scene batch can merge when:

- The source sheet is copied into `assets/generated/sheets/`.
- Slices are stored under `assets/generated/scenes/`.
- Manifest metadata follows `docs/SCENE_LIBRARY.md`.
- `npm run test` passes.
- `npm run smoke` passes.
- `npm run harness:check` passes.

For the 500-scene target, ship in catalog milestones: 128, 256, 384, then 500 actual generated raster backdrops.
