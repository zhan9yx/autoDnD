# 0012 Release Smoke

Status: historical blocked snapshot on the multi-agent working tree.

Superseded note: later 0012 Harness records show the no-scroll UI and production-depth blockers fixed, the post-patch `npm run test` baseline green at 217/217, smoke passed after localhost escalation, and `npm run harness:check` ending with `harness check ok`. Follow-up workers added more focused tests after that baseline, so keep this file as release-smoke failure history, not the current closeout status.

Recorded at: 2026-05-24 20:52:29 CST

## Scope

This worker ran release smoke gates for branch `codex/0012-continuous-depth-assets`.
It did not change product code, tests, generated assets, server routes, or scripts.

Allowed write scope used:

- `docs/qa/0012-release-smoke.md`
- `.harness/changes/0012-continuous-depth-assets/test-report.md`

## Commands Run

- `npm run test`
- `npm run lint`
- `npm run eval:memory:16h -- --no-report`
- `npm run eval:production-depth`
- `node --test tests/generatedAssets.test.js tests/noScrollUi.test.js tests/productionDepth.test.js`
- `node --input-type=module -e "...runProductionDepthEval({ reportPath: null })..."`

## Results

- `npm run test` failed on the latest current tree: 199 tests, 195 passed, 4 failed, duration about 8.0s.
- `npm run lint` passed: 71 JavaScript files checked.
- `npm run eval:memory:16h -- --no-report` passed on `campaign-history-16h.json`: 16 session blocks, 2,112 indexed events, 256 queries, `recallAt5=1`, `meanReciprocalRank=1`, thresholds `0.92/0.85`.
- `npm run eval:production-depth` failed: 10 checks, 9 passed, 1 failed, `passRate=0.9`, threshold `minPassRate=1`.
- Focused rerun `node --test tests/generatedAssets.test.js tests/noScrollUi.test.js tests/productionDepth.test.js` failed: 32 tests, 28 passed, 4 failed.

## Current Blockers

1. `tests/noScrollUi.test.js:57` fails the dice score CSS contract.
   - Expected pattern: `.dice-final-score { ... font: 900 1rem ui-monospace ... }`
   - Current `public/styles.css:1254`: `font: 900 1.16rem ui-monospace, SFMono-Regular, Menlo, monospace;`

2. `tests/productionDepth.test.js` fails because the production-depth evaluator is red.
   - Summary: `checkCount=10`, `passedCount=9`, `failedCount=1`, `passRate=0.9`, `passed=false`.
   - Failed scenario: `scenario:rain-archive-street`.
   - Expected scene semantic key: `scene.rain.archive.street`.
   - Actual selected scene asset: `aidm-ambient-scene-032-01`.
   - Actual selected scene semantic key: `scene.ambient.moonlit-rain-archive.v01`.
   - Failed subchecks: semantic key mismatch and missing required `street` scene term.

3. The production-depth failures cascade into three failing tests:
   - `production-depth evaluator covers scene, audio, logs, economy, and asset bindings`
   - `production-depth evaluator CLI writes a reusable JSON report`
   - `production-depth npm gate runs locally without writing a timestamped report`

## Notes

- An earlier full `npm run test` during concurrent multi-agent edits showed 6 failures, including `aidm-inventory-expansion-031-02` missing `variantAxes.culture`.
- A later focused rerun and final full rerun show those generated asset contract failures no longer reproduce. The current recorded blocker set is the latest 4 failures above.
- The exact no-argument `npm run eval:memory:16h` command was not used because the script writes a timestamped `evals/reports/long-memory-*.json` by default, outside this worker's requested write scope. The same gate was run with `--no-report`.
- `npm run smoke` was not run because release smoke is already blocked by `npm run test` and `npm run eval:production-depth`.
