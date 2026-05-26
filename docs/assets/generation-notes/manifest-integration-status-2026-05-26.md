# Manifest Integration Status

Date: 2026-05-26 Asia/Shanghai.

Worker: asset-manifest integration worker A.

## Status

Manifest registration is not complete. No asset rows have been written into
`assets/generated/manifest.json` in this worker turn, and no tests have been
changed.

## What Was Confirmed

- Current manifest schema is version 2 and uses `generatedSheets` /
  `rasterAssets`, mirrored through `sheets` / `assets`.
- Runtime selection reads `assets/generated/manifest.json` and only treats
  `visibility: "player-safe"` plus `quality.approved: true` and non
  `catalog-internal` surfaces as runtime-visible.
- The three description maps parse successfully and contain the expected 834
  rows:
  - `scene-description-map-042-050.json`: 66 scene rows.
  - `icon-description-map-042-049.json`: 128 icon/item rows.
  - `icon-description-map-050-059.json`: 640 token/icon/cutout rows.
- The six requested representative files exist on disk:
  - `assets/generated/scenes/aidm-scene-backbone-050-01.png`
  - `assets/generated/tokens/aidm-hostile-token-050-01.png`
  - `assets/generated/items/aidm-weapon-cutout-052-01.png`
  - `assets/generated/icons/aidm-faction-overlay-059-64.png`
  - `assets/generated/items/aidm-equipment-tool-047-12.png`
  - `assets/generated/items/aidm-reward-economy-048-11.png`

## Blockers / Risk

- The manifest file is large and has strict existing tests that assume many
  registered raster assets include `svgFile`. The new 042-059 generated slices
  appear to be PNG-only, so a direct append must either avoid breaking that
  contract or update a targeted manifest test contract.
- The requested risk policy cannot be expressed as blanket `player-safe`.
  Conservative registration should mark QA-risk assets as `internal` or carry
  a review status such as `accept-with-risk` / `accept-with-metadata-risk`.
- Known quality decisions that must be preserved during registration:
  - 047: `accept-with-metadata-risk`.
  - 048: `accept`.
  - 058: `accept-with-risk`.
  - 050-49 and 050-50 R3: `accept`.
- Other workers are modifying runtime selection, item catalog, and rules files.
  This worker should continue to avoid those files and only touch the manifest
  plus a focused manifest test.

## Recommended Next Step

Add a small deterministic manifest-registration script or one-shot Node patch
that:

1. Reads the three description map JSON files.
2. Appends exactly the missing 834 entries into `rasterAssets` and mirrors
   `assets = rasterAssets`.
3. Registers generated sheet records for the 18 source sheets and the scene
   backbone groups, then mirrors `sheets = generatedSheets`.
4. Uses conservative visibility:
   - scenes 042 and accepted scene 050 rows: `player-safe` only when stage
     metadata is complete.
   - 047 and 058: `internal` with risk review metadata carried forward.
   - 048 and accepted 050-49/050-50: approved risk status preserved.
   - ambiguous overlays/tokens/cutouts: `internal` unless directly bound to a
     runtime-safe surface.
5. Adds a focused manifest test for the six requested asset ids, checking
   presence, required fields, carried risk status, and PNG file existence.

## Verification Run So Far

- Parsed current manifest with Node successfully.
- Parsed all three description map JSON files successfully.
- Confirmed the six requested representative PNG files exist.

Full manifest write and targeted node test remain pending.
