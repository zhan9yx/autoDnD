# Test Report

Status: reconciled for generated-image, slicing, manifest registration, description-map, and focused generated-asset tests. Fresh browser QA, external generated PNG payload delivery, and owner risk acceptance remain open.

This report replaces the earlier source-workflow placeholder after the generated-image, slicing, manifest registration, description-map, and runtime-scoped QA passes were reconciled against `docs/qa/asset-external-payload-reconciliation-2026-05-26.md`.

## Asset Completion Summary

- Binary generation and slicing are count-complete for the `042..059` generated asset wave: 66 scene backbones, 18 source sheets, and 768 icon/token/cutout slices.
- `assets/generated/manifest.json` contains registration output for all 834 `042..059` description-map rows.
- Description-map registration is represented in the current tree by 834 description-map rows mapping to 834 registered raster assets and 18 registered source sheets, with 0 registered local file misses in the reconciliation audit.
- Governance split is preserved: 66 scene backbones are `player-safe`, 102 source-bound runtime dependencies are `runtime-promoted`, and 666 icon/token/cutout rows remain `internal`.
- Sheet 053 naming normalization is covered: 64 `aidm-armor-outfit-cutout-053-*` entries use normalized ids, files, and source asset ids.
- Generated PNG payloads are external to Git: `git ls-files 'assets/generated/**/*.png'` returns 0 tracked PNGs while local generated PNG files remain ignored.

## Manifest And Description Mapping Evidence

- Worker N semantic QA confirmed 834 description-map rows, 834 registered Kepler assets, 66 Kepler scenes, 768 Kepler internal assets, 64 sheet 053 entries, and 0 issues.
- Worker P final manifest regression confirmed the manifest hash stayed stable before and after the registration rerun: `381ee3f93f283239d9872723fdb8d1527b3a2519ded52d68bcbe15cb42739d76`.
- Worker R runtime closure confirmed 834 description-map rows, 834 manifest registrations, 1582 manifest raster assets, and 198 player-safe generated scene assets visible to runtime selection.
- `docs/qa/asset-external-payload-reconciliation-2026-05-26.md` confirmed `042..059` has 834 registered rows, 18 registered sheets, and 0 registered file misses on the local machine.

## Test Evidence

- `node --check scripts/register-generated-description-maps.mjs`
  - Passed.
- `node scripts/register-generated-description-maps.mjs`
  - Passed as an idempotent rerun with `rows: 834`, `addedAssets: 0`, `mergedAssets: 834`, `addedSheets: 0`, `mergedSheets: 18`, `missingFiles: []`, `duplicateInputIds: []`, and `duplicateInputSemanticKeys: []`.
- `node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js tests/assets.test.js tests/assetSelection.test.js tests/stateSummary.test.js tests/itemCatalog.test.js`
  - Passed: 79 tests, 0 failed.
- `node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js`
  - Passed in the external-payload reconciliation evidence: 37 tests, 0 failed.
- `node --test tests/sceneRuntimeIntegration.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/assetSelection.test.js tests/stateSummary.test.js`
  - Passed: 29 tests, 0 failed.
- `node scripts/smoke-flow.mjs`
  - Passed with generated asset runtime evidence: `generatedAssetCount=1582`, `marketOffers=75`, reward item `magnifying-lens`, level-up learned spell `ember-lance`, progression action `recover-mana`, combat log count `2`, and replay highlights `4`.
- `npm run test`
  - Final Worker K direct rerun passed: 337 tests, 337 passed, 0 failed.
  - Final Harness-internal rerun passed: 339 tests, 339 passed, 0 failed.
- `npm run harness:check`
  - Code gates passed through lint, unit tests, long-memory eval, production-depth eval, local smoke, and campaign simulation in Worker K's full harness pass.
  - The only remaining blocker from that run was Harness report completeness, now addressed by this report update and the 0013 false-positive text cleanup.

## Remaining Risk

- This report closes the Harness report-completeness placeholder for 0019 and records the current generated-asset registration/runtime evidence. It does not claim pixel-level approval of every generated raster or final public launch readiness.
- Non-scene icon/token/cutout assets intentionally remain internal or source-bound runtime-promoted rather than broadly player-facing.
- Fresh visible desktop/mobile browser QA is still required on the current RC.
- External generated PNG payload delivery or deployment hydration is still required for clean checkout if generated art must render instead of fallbacks.
- Sheet `047` keeps `accept-with-metadata-risk`; sheet `058` keeps `accept-with-risk` until owner acceptance or targeted regeneration.
- Older coordination files may still contain historical checkboxes or early workflow notes, but this `test-report.md` now reflects the completed current manifest, mapping, and focused generated-asset evidence.
