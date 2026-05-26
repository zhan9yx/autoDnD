# Asset External Payload Reconciliation 2026-05-26

Date: 2026-05-26 Asia/Shanghai.

Scope: read-only reconciliation for the `0019-missing-asset-generation` and
`0020-asset-prompt-expansion` asset externalization boundary. This pass did not
edit `assets/generated`, `assets/generated/manifest.json`, product code,
`.harness`, or any historical Mencius worker state. Only this QA note was
written.

## Executive Result

The current tree supports this release boundary:

- Generated PNG payloads are external to Git: `git ls-files
  'assets/generated/**/*.png'` returns 0 tracked PNGs, while 1634 local generated
  PNGs are present and ignored by `.gitignore`.
- The `042..059` generated asset wave is registered in
  `assets/generated/manifest.json`: 834 description-map rows map to 834
  registered raster assets and 18 registered source sheets, with 0 registered
  files missing on the local machine.
- The visibility split is conservative: 66 generated scenes are `player-safe`,
  102 source-bound runtime dependencies are `runtime-promoted`, and 666
  generated icon/token/cutout rows remain `internal`.
- The physical generation and slicing quantity loop is closed for this wave:
  66 scenes, 18 source sheets, and 768 icon/token/cutout slices are present.

This does not close final product/browser readiness:

- Browser-visible RC proof is still needed after the current concurrent app
  changes settle.
- Clean checkout still needs the external binary payload delivery step, CDN
  hydration, or committed fallbacks for surfaces that request generated PNGs.
- The `0019` and `0020` Harness task files are stale relative to later worker
  evidence and should not be auto-checked without a separate Harness
  reconciliation pass.

## Evidence Snapshot

| Check | Current result | Evidence |
| --- | ---: | --- |
| Tracked generated PNG files | 0 | `git ls-files 'assets/generated/**/*.png'` |
| Local generated PNG files | 1634 | `rg --files assets/generated -g '*.png'` |
| Ignored generated PNG samples | pass | `.gitignore:13:assets/generated/**/*.png` matched representative scene, sheet, and item PNGs |
| Manifest schema | version 2 | `assets/generated/manifest.json` |
| Manifest generated sheets | 52 total, 18 in `042..059` | Node manifest audit |
| Manifest raster assets | 1582 total, 834 in `042..059` | Node manifest audit |
| Description-map rows | 66 scenes + 128 `042..049` icons + 640 `050..059` icons = 834 | Node JSON parse |
| Registered local file misses | 0 | Node file existence audit for registered `042..059` rows |
| Focused asset registration tests | pass, 37/37 | `node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js` |
| Harness status command | pass, but open tasks remain | `npm run harness:status` reported `0019` at 1/16 and `0020` at 12/18 |

Representative manifest spot checks all returned present:

| Asset id | Manifest presence |
| --- | --- |
| `aidm-scene-backbone-042-01` | yes |
| `aidm-scene-backbone-050-01` | yes |
| `aidm-hostile-token-050-01` | yes |
| `aidm-weapon-cutout-052-01` | yes |
| `aidm-equipment-tool-047-12` | yes |
| `aidm-reward-economy-048-11` | yes |
| `aidm-faction-overlay-059-64` | yes |

## Range Reconciliation

| Range | Expected files | Local files | Manifest rows | Status |
| --- | ---: | ---: | ---: | --- |
| `042` scenes | 16 | 16 | 16 | generated, reviewed, registered |
| `042` action icons | 16 | 16 | 16 | sliced, reviewed, registered |
| `043` spell icons | 16 | 16 | 16 | sliced, reviewed, registered |
| `044` scroll icons | 16 | 16 | 16 | sliced, reviewed, registered |
| `045` status icons | 16 | 16 | 16 | sliced, reviewed, registered |
| `046` class badges | 16 | 16 | 16 | sliced, reviewed, registered |
| `047` equipment/tools | 16 | 16 | 16 | R4 accepted with metadata risk, registered |
| `048` reward/economy | 16 | 16 | 16 | R4 accepted, registered |
| `049` weather overlays | 16 | 16 | 16 | sliced, reviewed, registered |
| `050` scenes | 50 | 50 | 50 | generated, reviewed, registered |
| `050` hostile tokens | 64 | 64 | 64 | sliced, registered, internal/runtime-scoped only |
| `051..059` icon sheets | 576 | 576 | 576 | sliced, registered, mostly internal |

Visibility and review-state split for the registered `042..059` set:

| Field | Count | Meaning |
| --- | ---: | --- |
| `visibility: player-safe` | 66 | Scene backdrops available to stage/relevant-scene selection. |
| `visibility: runtime-promoted` | 102 | Source-bound UI dependencies only; not broad catalog/player-safe exposure. |
| `visibility: internal` | 666 | Catalog-internal generated rows held out from player-facing pools. |
| `reviewStatus: metadata-approved` | 66 | Scene metadata registration approved. |
| `reviewStatus: metadata-registered-internal` | 672 | Registered but still internal or source-bound. |
| `reviewStatus: accept-with-metadata-risk` | 16 | Sheet 047 R4 risk carried forward. |
| `reviewStatus: accepted-metadata` | 16 | Sheet 048 R4 accepted metadata. |
| `reviewStatus: accept-with-risk` | 64 | Sheet 058 alpha/content risk carried forward. |

## 0019 Checklist Judgment

| Checklist area | Evidence-supported state | Judgment |
| --- | --- | --- |
| Generate/save P1 scenes `042-01..08` | All 8 files exist; `042-01..04` are in the global status/coordination docs, `042-04..08` have per-worker note coverage. | Supported, but central status file is stale. |
| Generate/save P2 scenes `042-09..16` | All 8 files exist and scene generation notes/reviews exist. | Supported, but central status file is stale. |
| Generate source sheets `042..049` | All 8 source sheets exist; slicing reviews cover `042..045` and `046..049`. | Supported. |
| Add per-prompt generation status document | `docs/assets/missing-asset-generation-status-2026-05-25.md` exists. | Supported. |
| Update status document after each accepted source | Global status still shows many `pending-generation` rows despite current files and later notes. | Not closed in the central tracker. |
| Record failed/regenerated prompts | Regeneration and risk notes exist for `047`, `048`, `050-49/50`, and `058`; not all are merged into the global status table. | Partially supported. |
| Original guardrail: no manifest/runtime changes in 0019 | Later downstream workers intentionally superseded this by registering and runtime-scoping the generated wave. | Historical guardrail no longer describes current tree. |
| Slice icon sheets | 128/128 `042..049` slices present; review notes pass after R4 updates. | Supported. |
| Register generated assets in manifest | `042..049` and `042` scenes are present in manifest with local files. | Supported. |
| Bind descriptions/runtime surfaces | Scenes are `player-safe`; 102 runtime refs are source-bound promoted; most icons remain internal. | Partially supported. |
| Generated asset tests | Focused manifest/generated-asset tests pass 37/37. | Supported. |
| Browser QA after integration | No fresh visible desktop/mobile RC browser pass was run in this worker. | Open. |

## 0020 Checklist Judgment

| Checklist area | Evidence-supported state | Judgment |
| --- | --- | --- |
| Planning prompts `scene-050-01..50` and `icon-sheet-050..059` | 0020 planning Harness scope is complete; prompts and description maps exist. | Supported. |
| Generate scene images | 50/50 `050` scene PNGs exist and are registered. | Supported. |
| Generate `050..059` icon sheets | 10/10 source sheet PNGs exist. | Supported. |
| Slice icon sheets | 640/640 slices exist. | Supported. |
| Alpha cleanup / visual QA | Counts pass; `058` is accepted with risk, `057` now has a slicing note, several sheets have metadata/alpha follow-up carried in notes. | Supported with residual QA risk. |
| Register in manifest | 690 `050..059` rows and 10 source sheets are registered. | Supported. |
| Bind descriptions/runtime surfaces | `050` scenes are player-safe; icons/tokens/cutouts mostly remain internal, with only source-bound runtime promotions where referenced. | Partially supported. |
| Browser QA | No fresh visible browser pass was run here for `050..059` surfaces. | Open. |

## Open Gaps

1. Fresh visible browser evidence is still required: desktop, 390 px, and 430 px
   mobile screenshots plus console/network/broken-image sweep on the current RC.
2. External binary payload delivery is still a release dependency if the final
   product should show the generated PNG art instead of committed fallbacks.
3. `0019` and `0020` Harness tasks need a focused reconciliation update after
   owner review; the task checkbox counts still understate completed downstream
   work.
4. Sheet 058 remains `accept-with-risk`; sheet 047 remains
   `accept-with-metadata-risk`; those risks should stay visible until product
   owners accept them or request regeneration.
5. The broad external-binary focused command with `playerUiAccess` is currently
   blocked by a concurrent `public/app.js` static-contract change, not by asset
   manifest registration. The narrower generated manifest/asset tests pass.

## Commands Run

| Command | Result |
| --- | --- |
| `git status --short --branch` | Showed unrelated concurrent worker changes; this worker did not touch them. |
| `git ls-files 'assets/generated/**/*.png'` | 0 tracked generated PNGs. |
| `git check-ignore -v <representative generated PNGs>` | Matched `.gitignore:13:assets/generated/**/*.png`. |
| Node manifest/description-map/file existence audit | Passed; `834` registered `042..059` rows, `0` missing registered files. |
| `npm run harness:status` | Passed; reports `0019` 1/16 and `0020` 12/18. |
| `node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js` | Passed, 37/37. |
| `AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js tests/playerUiAccess.test.js tests/itemCatalog.test.js tests/levelingSkills.test.js tests/levelingUi.test.js` | 67/68 passed; one `playerUiAccess` static assertion failed against current concurrent `public/app.js` text. |

## Recommended Worker Split

| Worker | Scope | Output |
| --- | --- | --- |
| External payload delivery owner | Define and verify the non-Git binary payload delivery path: artifact hydration, CDN, or deployment-time sync. | QA doc plus clean-checkout proof with generated PNG payload absent/present cases. |
| 0019/0020 Harness reconciler | Update only `.harness/changes/0019-*` and `.harness/changes/0020-*` after reviewing this evidence and owner approval. | Accurate task/test-report/review state without inflating browser/public gates. |
| Browser RC asset QA | Run fresh visible desktop and mobile browser passes for scene switching, inventory, market, spell/skill art, no broken image requests, and no console errors. | Screenshots and `docs/qa` browser evidence. |
| Residual asset QA owner | Decide whether `047` metadata risk and `058` alpha/content risk are acceptable for release, or regenerate targeted cells. | Risk acceptance note or regeneration queue. |
