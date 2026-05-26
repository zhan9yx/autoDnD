# Release Evidence Consolidation

Date: 2026-05-26 CST
Worker: U2 final evidence consolidation
Scope: lightweight evidence consolidation only. This pass did not modify business code and did not run full `npm test` or `npm run harness:check`.

## Sources Read

- `docs/qa/asset-runtime-integration-2026-05-26.md`
- `.harness/changes/0019-missing-asset-generation/test-report.md`
- `.harness/changes/0013-public-productization/test-report.md`
- Current `git status` / `git diff` summaries

## Current Evidence Summary

| Area | Current Evidence | Source |
| --- | --- | --- |
| Asset generation complete | Kepler generated asset batch is count-complete: 66 scene backbones, 18 source sheets, and 768 icon/token/cutout slices. The 0019 report records all 834 description-map rows as registered and current. | `.harness/changes/0019-missing-asset-generation/test-report.md`; `docs/qa/asset-runtime-integration-2026-05-26.md` |
| Manifest registration | `assets/generated/manifest.json` contains all 834 Kepler rows. Registration rerun was idempotent with `addedAssets: 0`, `mergedAssets: 834`, `addedSheets: 0`, `mergedSheets: 18`, `missingFiles: []`, and no duplicate input ids or semantic keys. Manifest hash stayed stable at `381ee3f93f283239d9872723fdb8d1527b3a2519ded52d68bcbe15cb42739d76`. | `.harness/changes/0019-missing-asset-generation/test-report.md`; Worker N/P sections in `docs/qa/asset-runtime-integration-2026-05-26.md` |
| Runtime visibility governance | Governance split is preserved: 66 Kepler scene backbones are `player-safe` stage/relevant-scene assets, while 768 icon/token/cutout assets remain internal `catalog-internal` entries. Player UI access tests cover that raw generated manifest/catalog primitives are not exposed. | `.harness/changes/0019-missing-asset-generation/test-report.md`; Worker M section in `docs/qa/asset-runtime-integration-2026-05-26.md` |
| AI DM scene switching | Runtime closure confirmed six representative 050 scenes selected for tavern, market, camp, dungeon, battlefield, and archive contexts. Scene descriptions flow through `presentation.sceneAsset`, `summary.scene.asset`, and `summary.media.sceneAsset`. Smoke evidence also records switching to a market scene with `soundscape: market-city`. | Worker L/R sections in `docs/qa/asset-runtime-integration-2026-05-26.md` |
| Backpack and sell flow | Smoke/API evidence covers buying `storm-lantern`, retaining equipped `staff` and `robe`, receiving generated reward loot, reward value and sale value, selling loot for localized crowns, and backpack removal. Final runtime closure records reward item `magnifying-lens`, value `76`, sale value `41`, and sold-loot payout `41`. | Worker L/R sections in `docs/qa/asset-runtime-integration-2026-05-26.md`; `.harness/changes/0019-missing-asset-generation/test-report.md` |
| Upgrade, spells, and skills | `field-primer` was made reachable through the market and mapped to generated art. Runtime closure confirms level 2 progression grants `ember-lance` and `recover-mana`; rule cards map to generated icon/scroll art with readable purpose/outcome/summary text. 0013 also has minimum visible spell/warrior supporting evidence for starter spell cards, warrior specialization, scroll use, and visible learned spell text. | Worker L/R sections in `docs/qa/asset-runtime-integration-2026-05-26.md`; `.harness/changes/0013-public-productization/test-report.md` |
| `serverRoutes` | Narrow market/economy route reruns passed. Worker O reproduced and stabilized the full heavy `tests/serverRoutes.test.js` suite, then reran it successfully: 11 tests, 0 failed. The prior timeout was recorded as local resource/startup budget contention rather than a product route assertion failure. | Worker L/O sections in `docs/qa/asset-runtime-integration-2026-05-26.md` |
| `npm run test` | Final Worker K direct rerun passed: 337 tests, 337 passed, 0 failed. Final Harness-internal rerun passed: 339 tests, 339 passed, 0 failed. Older 0013 evidence records a 264/264 baseline, superseded by the 2026-05-26 asset/runtime gate. | `.harness/changes/0019-missing-asset-generation/test-report.md`; Worker K section in `docs/qa/asset-runtime-integration-2026-05-26.md`; `.harness/changes/0013-public-productization/test-report.md` |
| `npm run harness:check` | Worker K follow-up records final `npm run harness:check` passed after report-completeness cleanup. Gates passed: lint over 97 JavaScript files, 339/339 unit tests, long-memory eval, production-depth eval 10/10, local smoke with `generatedAssetCount=1582` and `marketOffers=75`, campaign simulation, and final `harness check ok`. | Worker K follow-up in `docs/qa/asset-runtime-integration-2026-05-26.md`; `.harness/changes/0019-missing-asset-generation/test-report.md` |

## Still Waiting For Other Worker Evidence

- Visual screenshots: Worker J could not capture fresh desktop/mobile screenshots because Codex Browser and Chrome automation were unavailable. Existing 0013/0015 screenshot packs are useful supporting evidence, but this consolidation does not claim a fresh pixel-level pass for the current 2026-05-26 dirty tree or every generated raster.
- E2E real flow: API, DOM/static contract, smoke, and browser-QA tests are strong, but a release-candidate real browser flow for the current dirty tree still needs explicit signoff. The 0013 report continues to mark broader release-candidate desktop/mobile browser acceptance, balance feel, audio quality, and device coverage as open.
- Old asset residual audit: targeted gaps were fixed or covered, including sheet 053 `sourceAssetId` normalization and `field-primer` moving from legacy `assets/items/silver-ledger.svg` to generated art. A full old/legacy asset residual audit across all runtime/UI/rules paths is not yet claimed here.
- Worktree clean/commit state: current worktree is not clean. Point-in-time status summary from this pass shows 53 tracked modified files and 888 untracked paths, with tracked diff shortstat of 53 files changed, 232305 insertions, and 46678 deletions. Commit-ready clean state remains pending.

## Commands Run In This Consolidation Pass

This worker only ran lightweight reads and diff hygiene checks.

```bash
git status --short
git status --short | cut -c1-2 | sort | uniq -c
git diff --stat
git diff --shortstat
sed -n '1,260p' docs/qa/asset-runtime-integration-2026-05-26.md
sed -n '261,620p' docs/qa/asset-runtime-integration-2026-05-26.md
sed -n '1,260p' .harness/changes/0019-missing-asset-generation/test-report.md
sed -n '1,620p' .harness/changes/0013-public-productization/test-report.md
rg -n "npm run test|npm test|harness:check|serverRoutes|smoke-flow|generatedAssetCount|marketOffers|sell|level|spell|combat|scene|manifest|337|339|passed" docs/qa/asset-runtime-integration-2026-05-26.md .harness/changes/0019-missing-asset-generation/test-report.md .harness/changes/0013-public-productization/test-report.md
```

Observed lightweight results before this file was added:

- `git status --short | cut -c1-2 | sort | uniq -c`: `53 M`, `888 ??`.
- `git diff --shortstat`: `53 files changed, 232305 insertions(+), 46678 deletions(-)`.
- After this file was written, `git status --short | cut -c1-2 | sort | uniq -c` reported `53 M`, `889 ??`; the extra untracked path is this consolidation file.
- Target evidence files were readable.
- No full test, browser test, or harness command was run by this worker.

## Final Local Check

Run after writing this file:

```bash
git diff --no-index --check -- /dev/null docs/qa/release-evidence-2026-05-26.md
```

Result: no whitespace or conflict-marker warnings were printed. The command exited `1` because `--no-index` compares `/dev/null` with a new untracked file and reports a file difference even when the whitespace check is clean.
