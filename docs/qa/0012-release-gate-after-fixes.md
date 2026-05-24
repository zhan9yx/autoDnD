# 0012 Release Gate After Fixes

Status: historical blocked snapshot as of 2026-05-24 21:23:07 CST.

Superseded note: later 0012 Harness records show the post-patch `npm run test` baseline green at 217/217, production-depth green at 10/10, and `npm run harness:check` ending with `harness check ok`. Follow-up workers added more focused tests after that baseline, so keep this file as failure history, not the current release-gate status.

## Scope

Release gate worker 1 reran the requested gate commands on branch `codex/0012-continuous-depth-assets` after checking the current multi-agent working tree. This worker did not change product code, tests, generated assets, or Harness scripts.

## Commands

| Command | Result | Notes |
| --- | --- | --- |
| `npm run test` | Fail | 206 tests, 202 passed, 4 failed. |
| `npm run lint` | Pass | `lint ok: 71 JavaScript files checked`. |
| `npm run eval:production-depth` | Fail | 10 checks, 9 passed, 1 failed, `passRate=0.9`, threshold `minPassRate=1`. |
| `npm run eval:memory:16h -- --no-report` | Pass | 16 blocks, 2,112 indexed events, 256 queries, `recallAt5=1`, `meanReciprocalRank=1`. |

## Blocking Failures

1. `tests/noScrollUi.test.js:57`
   - Failing test: `open table uses one-viewport shell with overlay drawers`.
   - Assertion still expects `.dice-final-score` to match `font: 900 1rem ui-monospace`.

2. `tests/productionDepth.test.js`
   - Failing tests:
     - `production-depth evaluator covers scene, audio, logs, economy, and asset bindings`
     - `production-depth evaluator CLI writes a reusable JSON report`
     - `production-depth npm gate runs locally without writing a timestamped report`
   - The production-depth CLI still reports `passed: false`.

3. `npm run eval:production-depth`
   - Output summary:

```json
{
  "dataset": "AIDM production-depth deterministic scenarios",
  "datasetPath": "evals/production-depth/scenarios.json",
  "datasetVersion": "production-depth-v1",
  "gate": "production-depth",
  "checkCount": 10,
  "passedCount": 9,
  "failedCount": 1,
  "passRate": 0.9,
  "thresholds": {
    "minPassRate": 1
  },
  "passed": false
}
```

## Passing Gates

- `npm run lint`
- `npm run eval:memory:16h -- --no-report`

## Release Decision

Not releasable. The requested post-fix release gate still has the no-scroll UI blocker and the production-depth blocker.
