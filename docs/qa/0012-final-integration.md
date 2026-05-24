# 0012 Final Integration QA

Status: historical blocked snapshot on the multi-agent working tree as of 2026-05-24 21:01:33 CST.

Superseded note: later 0012 Harness records show the no-scroll UI and production-depth blockers fixed, the post-patch `npm run test` baseline green at 217/217, and `npm run harness:check` ending with `harness check ok`. Follow-up workers added more focused tests after that baseline, so keep this file as integration failure history, not the current closeout status.

## Scope

This final integration worker observed the active tree, waited for sheet031 and follow-on product/test edits to settle, ran the requested gates, and wrote only:

- `.harness/changes/0012-continuous-depth-assets/test-report.md`
- `docs/qa/0012-final-integration.md`

No product code, tests, generated assets, or Harness scripts were edited by this worker.

## Observation Summary

- Branch confirmed as `codex/0012-continuous-depth-assets`.
- Initial observation found active concurrent writes from other agents across asset promotion, localization, replay, browser QA, release smoke, and Harness report files.
- Validation started after a quiet window with no recent writes in `assets/`, `public/`, `src/`, `tests/`, `docs/`, or `.harness/` for the previous two minutes.
- Sheet031 was present at validation time: one sheet PNG plus 64 PNG and 64 SVG item slices. Focused generated asset tests confirm seven sheet031 items are promoted as player-safe gameplay items while the rest remain internal.

## Commands And Results

- `node --test tests/assetSelection.test.js tests/assets.test.js tests/generatedAssets.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/bilingualUi.test.js tests/localization.test.js tests/publicTts.test.js tests/ttsProfiles.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/replay.test.js`
  - Failed: 95 tests, 94 passed, 1 failed.
- `npm run test`
  - Failed after Harness report refresh: 206 tests, 202 passed, 4 failed.
- `npm run lint`
  - Passed: 71 JavaScript files checked.
- `npm run eval:memory:16h -- --no-report`
  - Passed: 16 blocks, 2,112 indexed events, 256 queries, `recallAt5=1`, `meanReciprocalRank=1`.
- `npm run eval:production-depth`
  - Failed: 10 checks, 9 passed, 1 failed, `passRate=0.9`, required `minPassRate=1`.
- `node --input-type=module -e "...runProductionDepthEval({ datasetPath: 'evals/production-depth/scenarios.json' })..."`
  - Confirmed the single failed result is `scenario:rain-archive-street`.
- `node --test tests/requirements.test.js tests/maturity.test.js`
  - Passed after Harness report refresh: 8 tests, 8 passed.

## Current Blockers

1. One-viewport UI CSS contract is red.
   - Failing test: `tests/noScrollUi.test.js:57`.
   - Expected: `.dice-final-score` includes `font: 900 1rem ui-monospace`.
   - Current CSS: `public/styles.css:1254` uses `font: 900 1.16rem ui-monospace, SFMono-Regular, Menlo, monospace;`.

2. Production-depth scene/audio consistency is red.
   - Failing scenario: `scenario:rain-archive-street`.
   - Expected asset semantic key: `scene.rain.archive.street`.
   - Actual selected asset: `aidm-ambient-scene-032-01`.
   - Actual semantic key: `scene.ambient.moonlit-rain-archive.v01`.
   - Missing required scene term: `street`.
   - The soundscape has heavy-rain evidence, but selected soundscape id is `market-city`.

3. Full-suite production-depth tests fail because the production-depth evaluator returns `passed: false`.
   - `production-depth evaluator covers scene, audio, logs, economy, and asset bindings`
   - `production-depth evaluator CLI writes a reusable JSON report`
   - `production-depth npm gate runs locally without writing a timestamped report`

## Superseded During This Worker

- The first full-suite run showed one extra failure in `0012 Harness record preserves non-MVP depth gates and open work` because the intermediate Harness report did not include `node --test tests/requirements.test.js tests/maturity.test.js`.
- This worker updated the allowed Harness report file, reran `node --test tests/requirements.test.js tests/maturity.test.js`, and confirmed 8/8 pass.
- A second `npm run test` rerun now shows only the 4 blockers listed above.

## Passing Coverage

- Asset coverage is mostly healthy: sheet031 generated assets, sheet031 market goods, catalog bindings, alpha checks, player-safe visibility, and generated manifest loading pass.
- Audio coverage is mostly healthy: soundscape catalog, weather mixes, scene mismatch guards, localized reasons, ambience engine behavior, and TTS role profiles pass.
- Economy coverage passes for wallet, stock, repeated buys, use, equip, sell, localized labels, and sheet031 promoted goods.
- Localization and replay focused tests pass.
- Lint and 16h memory eval pass.

## Remaining Risk

- Release should stay blocked until both current blockers are fixed and `npm run test` plus `npm run eval:production-depth` are rerun green.
- The tree is still a multi-agent dirty tree with untracked generated assets and multiple QA reports. This document records the observed integration state; it does not claim those other changes are reviewed or owned by this worker.
- `npm run eval:memory:16h` was run with `-- --no-report` to respect the requested write scope and avoid creating timestamped files under `evals/reports/`.
