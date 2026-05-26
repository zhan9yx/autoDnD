# Asset Externalized Payload Reconciliation

Date: 2026-05-26 Asia/Shanghai.

Worker: parallel worker C.

Scope: read-only reconciliation for generated raster externalization and tracking
closure across `assets/generated/manifest.json`, `docs/assets/generation-notes`,
`docs/assets/description-maps`, and Harness changes 0011, 0012, 0019, and
0020. This pass did not edit images, manifests, runtime code, Harness tasks, or
existing documents.

## Executive Result

- Git-tracked generated PNG payloads under `assets/generated`: 0.
- Ignored local generated PNG payloads under `assets/generated`: 1634.
- Current manifest records 1582 raster asset PNGs and 52 source sheet PNGs.
  The ignored local total equals those two manifest groups: 1582 + 52 = 1634.
- Current manifest records 541 `player-safe` raster assets, 939 `internal`
  raster assets, and 102 `runtime-promoted` raster assets.
- Current manifest records 198 generated raster scene assets and 52 generated
  sheets, including 9 scene sheets.
- All 834 description-map rows have files on disk and match a manifest raster
  asset by `id` or `sourceAssetId`, but the description-map row status still
  says `manifest-ready-pending-registration`. Treat this as a tracking label
  lag, not a missing manifest registration.
- Harness `0019` and `0020` task checkboxes are stale relative to the current
  count, manifest, and report evidence. They should be reconciled by a Harness
  owner, not silently treated as current truth.

## Externalized Payload Contract

The current generated raster payload contract is:

1. PNG binaries in `assets/generated/**/*.png` are externalized from Git and
   ignored locally.
2. `assets/generated/manifest.json` is the tracked contract for runtime-visible
   and internal generated assets.
3. Runtime promotion is narrower than broad player-safety:
   `runtime-promoted` assets use `ui-approved-runtime` surfaces and remain
   separate from broad `player-safe` catalog promotion.
4. `catalog-internal` remains the default safe surface for unreviewed or
   internal-only generated slices.
5. Player-facing promotion requires reviewed metadata, approved quality, a
   non-internal player surface, and data-backed gameplay binding where
   applicable.

The payload externalization is internally consistent today: no generated PNG is
tracked, all local generated PNGs are ignored, and every manifest file path for
both raster assets and sheets exists on disk in this checkout.

## Current Counts

### Git and local file counts

| Check | Count | Source |
| --- | ---: | --- |
| Tracked generated PNGs | 0 | `git ls-files assets/generated | rg '\.png$' | wc -l` |
| Ignored local generated PNGs | 1634 | `find assets/generated -type f -name '*.png' -print | git check-ignore --stdin | wc -l` |
| Local generated PNGs | 1634 | `find assets/generated -type f -name '*.png' -print | wc -l` |

Ignored local PNGs by directory:

| Directory | Count |
| --- | ---: |
| `icons` | 244 |
| `items` | 868 |
| `options` | 16 |
| `scenes` | 198 |
| `sheets` | 52 |
| `spells` | 96 |
| `tokens` | 144 |
| `weapons` | 16 |

Ignore rule spot check:

```text
.gitignore:13:assets/generated/**/*.png assets/generated/scenes/aidm-scene-backbone-050-01.png
.gitignore:13:assets/generated/**/*.png assets/generated/sheets/aidm-hostile-token-icons-sheet-050.png
.gitignore:13:assets/generated/**/*.png assets/generated/items/aidm-weapon-cutout-052-01.png
```

Note: `git status --ignored --short assets/generated` may collapse ignored
directories such as `assets/generated/sheets/` and therefore can under-report
individual ignored PNGs. `git check-ignore --stdin` over the file list is the
reliable count for this reconciliation.

### Manifest counts

| Manifest field or derivation | Count |
| --- | ---: |
| `rasterAssets` | 1582 |
| `assets` mirror | 1582 |
| `sheets` | 52 |
| `generatedSheets` mirror | 52 |
| `assetCatalog.actualGeneratedRasterAssets` | 1582 |
| `assetCatalog.playerSafeAssets` | 541 |
| `assetCatalog.internalAssets` | 939 |
| `assetCatalog.runtimePromotedAssets` | 102 |
| Raster assets with `categoryId: "scenes"` | 198 |
| Raster assets whose type includes scene | 198 |
| Scene sheets with `categoryId: "scenes"` | 9 |
| `sceneLibrary.actualGeneratedRasterScenes` | 198 |
| `sceneLibrary.targetSceneCount` | 500 |
| `assetCatalog.targetAssetCount` | 3000 |

Visibility split by category:

| Category / visibility | Count |
| --- | ---: |
| `characters / internal` | 131 |
| `characters / player-safe` | 32 |
| `characters / runtime-promoted` | 13 |
| `equipment / internal` | 572 |
| `equipment / player-safe` | 279 |
| `equipment / runtime-promoted` | 17 |
| `generated / internal` | 36 |
| `rules / internal` | 150 |
| `rules / player-safe` | 16 |
| `rules / runtime-promoted` | 26 |
| `scenes / player-safe` | 198 |
| `spells / internal` | 50 |
| `spells / player-safe` | 16 |
| `spells / runtime-promoted` | 46 |

Integrity checks:

| Check | Result |
| --- | --- |
| Missing manifest raster files | 0 |
| Missing manifest sheet files | 0 |
| Duplicate raster ids | 0 |
| Duplicate sheet ids | 0 |

## Description Map Reconciliation

Current description-map rows:

| File | Rows | Status value |
| --- | ---: | --- |
| `scene-description-map-042-050.json` | 66 | `manifest-ready-pending-registration` |
| `icon-description-map-042-049.json` | 128 | `manifest-ready-pending-registration` |
| `icon-description-map-050-059.json` | 640 | `manifest-ready-pending-registration` |
| Total | 834 | `manifest-ready-pending-registration` |

Reconciliation result:

| Check | Result |
| --- | --- |
| Description-map rows | 834 |
| Rows matched to manifest by `assetId` or `sourceAssetId` | 834 |
| Missing description-map files on disk | 0 |

Interpretation:

- The current manifest and local externalized payloads close the 834-row
  registration loop for the current checkout.
- The row-level `status` values in the map files still read as pending. That is
  now a tracking mismatch because all 834 rows match manifest entries.
- Earlier generation notes that said representative 042..059 ids were absent
  from the manifest are superseded by current manifest state and by the 0019
  `test-report.md`.
- This worker did not edit those source tracking files because the requested
  write scope only allows this QA reconciliation document.

## Harness Reconciliation

### 0011 production-depth

`npm run harness:status` reports `0011-production-depth: 67/69 tasks complete`.
The two unchecked task items are:

- Continue runtime-bound asset batches toward the documented 3000+ total and
  500-scene long-term targets.
- Convert planned sheet 020 transparent cutouts from metadata-only to
  generated/sliced assets after item-art binding is proven in the player UI.

Current evidence:

- The 3000/500 scale target remains open: current manifest is 1582/3000 raster
  assets and 198/500 generated raster scenes.
- Sheet 020 is no longer metadata-only in the manifest: 16
  `aidm-transparent-cutout-020-*` raster assets and
  `aidm-transparent-cutouts-sheet-020.png` exist and are manifest-registered.
- `plannedSheets` still records sheet 020, and all other planned sheet ids, as
  ingestion-oriented statuses even though the generated sheet ids now exist in
  `generatedSheets`.

Recommendation:

- Keep the 3000/500 scale item open.
- Sheet 020 can be closed for generation/slicing/manifest-registration if a
  Harness owner accepts the current manifest state, but it should remain open if
  the intended closure requires fresh player-flow browser proof for those exact
  sheet 020 items.

### 0012 continuous-depth-assets

`npm run harness:status` reports `0012-continuous-depth-assets: 43/47 tasks
complete`.

Open items:

- Implement and test `REQ-201` through `REQ-280`.
- Continue generated asset expansion from the older 748/3000 and 132/500 counts.
- Keep generated asset ledger and inventory docs synchronized with the manifest
  if asset workers change counts again before merge.
- Run one uninterrupted combined desktop/mobile browser pass before broader
  release handoff.

Current evidence:

- Counts in the task text are stale. Current manifest counts are 1582/3000
  generated raster assets and 198/500 generated raster scenes.
- Focused browser evidence exists in the 0012 report, but the uninterrupted
  combined desktop/mobile browser pass remains explicitly open.

Recommendation:

- Close only the stale-count portion after the owner updates the ledger wording
  to 1582/3000 and 198/500.
- Keep `REQ-201..280`, asset-scale growth, ledger synchronization, and
  combined desktop/mobile browser acceptance open.

### 0019 missing-asset-generation

`npm run harness:status` reports `0019-missing-asset-generation: 1/16 tasks
complete`, but the current `test-report.md` says the current generated-asset
registration and QA closure is completed.

Current report evidence:

- Binary generation and slicing are count-complete for 66 scene backbones, 18
  source sheets, and 768 icon/token/cutout slices.
- Manifest contains the Kepler registration output for all 834 description-map
  rows.
- Governance split is preserved: 66 scene backbones are player-safe for
  stage/relevant-scene surfaces, while 768 icon/token/cutout entries remain
  internal `catalog-internal` assets.
- The report records generated asset tests, runtime selection tests, smoke, full
  test runs, and Harness gate evidence.

Current independent check from this worker:

- All 834 description-map rows match manifest entries.
- No manifest raster or sheet file is missing on disk.
- The current manifest has 1582 raster assets and 198 scene raster assets.

Recommendation:

- The 0019 task checklist is stale. A Harness owner can safely close the current
  image generation, slicing, manifest registration, description-map binding, and
  focused generated-asset/runtime QA items based on the 0019 report plus this
  reconciliation.
- Do not use 0019 to claim pixel-level approval of every generated raster; its
  own report explicitly does not claim that.

### 0020 asset-prompt-expansion

`npm run harness:status` reports `0020-asset-prompt-expansion: 12/18 tasks
complete`.

The completed 0020 package was planning-only. Its unchecked downstream items
cover generation, source sheets, slicing, manifest registration, runtime
binding, and generated-asset/browser QA for `scene-050-*` and
`icon-sheet-050-*` through `icon-sheet-059-*`.

Current evidence:

- Count notes show `scene-050-01..50` are 50/50.
- Source sheets `050..059` are 10/10.
- Slices `050..059` are 640/640.
- Final count notes carry forward accepted status for 047 R4, 048 R4,
  050-49/50 R3, and 058 alpha risk.
- Current manifest and description-map reconciliation show all 834 rows are
  registered and file-present.

Recommendation:

- The 0020 planning package is already safe to treat as complete.
- The downstream 0020 generation/sheet/slicing/manifest/mapping items can be
  closed for count and manifest registration, because the real local ignored
  PNG payload and manifest entries now exist.
- Keep them open if the owner requires per-asset pixel approval, alpha approval
  for every sheet, or a consolidated browser QA pass that proves all promoted
  050..059 assets in player-visible flows. Current evidence supports focused
  runtime closure, not full public-readiness browser acceptance.

## Safe To Close vs Must Wait

Safe to close now, subject to a Harness owner updating the stale checkboxes:

- 0019 current generated-image and slicing quantity loop for the 042..059 /
  042..050 description-map wave.
- 0019 manifest registration and description-map binding loop for all 834 rows.
- 0019 focused generated-asset/runtime QA loop recorded in its current
  `test-report.md`.
- 0020 planning-only scope.
- 0020 downstream count and manifest-registration portions for 050 scenes and
  050..059 sheets/slices.
- 0011 sheet 020 generation/slicing/manifest-registration portion, because the
  manifest and local ignored payload now contain the 020 sheet and 16 slices.

Must wait or remain open:

- 0011 and 0012 3000/500 asset-scale targets: current state is 1582/3000 and
  198/500.
- 0012 `REQ-201..280` product expansion.
- 0012 full uninterrupted combined desktop/mobile browser pass before broader
  release handoff.
- Any claim that every generated raster has pixel-level visual approval.
- Any claim that every 050..059 sheet has alpha/prompt-compliance approval in
  final player-facing context.
- Any player-safe promotion beyond current manifest visibility, especially for
  internal icon/token/cutout entries.
- Any broad public-readiness or release-readiness browser acceptance that is not
  covered by the focused evidence in the current reports.

Tracking alignment still needed:

- Description-map row statuses should eventually be updated away from
  `manifest-ready-pending-registration` or documented as source-map provenance
  status rather than current manifest status.
- `plannedSheets` statuses should be reconciled with `generatedSheets` for
  sheets that now exist in the generated manifest.
- Older count notes that predate final manifest registration should be treated
  as historical unless a later note or current manifest check confirms them.

## Read-only Verification Commands

```bash
git ls-files assets/generated | rg '\.png$' | wc -l
```

Result:

```text
0
```

```bash
find assets/generated -type f -name '*.png' -print | git check-ignore --stdin | wc -l
```

Result:

```text
1634
```

```bash
find assets/generated -type f -name '*.png' -print | awk -F/ '{print $3}' | sort | uniq -c
```

Result:

```text
244 icons
868 items
16 options
198 scenes
52 sheets
96 spells
144 tokens
16 weapons
```

```bash
npm run harness:status
```

Result:

```text
AIDM Harness: 25 change(s)
0011-production-depth: 67/69 tasks complete
0012-continuous-depth-assets: 43/47 tasks complete
0019-missing-asset-generation: 1/16 tasks complete
0020-asset-prompt-expansion: 12/18 tasks complete
```

```bash
node <manifest-and-description-map-reconciliation-script>
```

Result:

```json
{
  "rasterCount": 1582,
  "sheetCount": 52,
  "rasterMissingFiles": 0,
  "sheetMissingFiles": 0,
  "duplicateRasterIds": 0,
  "duplicateSheetIds": 0,
  "descriptionMapRows": 834,
  "descriptionMapRowsMatchedToManifestByIdOrSourceAssetId": 834,
  "descriptionMapMissingFiles": 0,
  "descriptionMapStatus": {
    "manifest-ready-pending-registration": 834
  }
}
```

```bash
git diff --check -- docs/qa/asset-externalized-payload-reconciliation-2026-05-26.md
```

Result: tracked-diff check passes. Because this QA document is a new untracked
file, this worker also ran:

```bash
git diff --check --no-index -- /dev/null docs/qa/asset-externalized-payload-reconciliation-2026-05-26.md
```

Result:

```text
git diff --check --no-index: differences expected for new file; no whitespace diagnostics above
```
