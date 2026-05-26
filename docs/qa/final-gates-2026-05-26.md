# Final Gates Rerun

Date: 2026-05-26 CST
Worker: AA final gates rerun
Scope: final gate verification only. No business code was changed in this pass.

## Decision

Local engineering release gates passed on the current dirty tree.

Public launch remains blocked by the existing public-readiness gate matrix. Passing `npm run harness:check` proves the local engineering baseline only; it does not close `GATE-001` through `GATE-008`.

## Dirty Tree Context

Before this report was added, the worktree was already dirty:

```text
git status --short | cut -c1-2 | sort | uniq -c
  55  M
 891 ??

git diff --shortstat
 55 files changed, 232444 insertions(+), 46682 deletions(-)
```

No command failure was reproduced, so there is no failing result to attribute to the current dirty tree.

## Commands Run

### `npm run harness:check`

Result: passed, exit code 0.

Important output:

```text
lint ok: 97 JavaScript files checked
unit tests: 341 passed, 0 failed
long-memory eval: recallAt5=1, meanReciprocalRank=1, passed=true
production-depth eval: checkCount=10, passedCount=10, failedCount=0, passRate=1, passed=true
local smoke: ok=true, assetCount=82, generatedAssetCount=1582, marketOffers=75
campaign simulation: ok=true, players=5, round=6, transcript=110, memories=26
harness check ok
```

This rerun covers the current `harness:check` aggregate gate after the market purchase-state and forest/drizzle/season stale fixes.

### `npm run test`

Result: passed, exit code 0.

Important output:

```text
tests 341
pass 341
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 302589.188209
```

Relevant covered assertions included:

- `market blocked purchase labels are bilingual and never claim purchasable`
- `market offers expose localized disabled reasons and player-specific purchase state`
- `forest drizzle presentation ignores stale archive transcript terms`
- `director keeps explicit spring scene season when leaf ambience suggests autumn`
- `rules prefer explicit scene season over descriptive leaf keywords`
- `state summary keeps latest forest season over stale director knowledge`

### Focused Market Purchase-State Tests

Command:

```bash
node --test --test-concurrency=1 --test-name-pattern "purchase state|purchaseState|market blocked|affordability|disabled reasons|market economy|player-specific purchase state|expanded player-safe market goods" tests/itemCatalog.test.js tests/bilingualUi.test.js tests/inventoryEconomy.test.js tests/browserAutomation.test.js tests/staticUiStructure.test.js
```

Result: passed, exit code 0.

```text
tests 6
pass 6
fail 0
duration_ms 4605.464125
```

The focused command revalidated disabled unaffordable offers, localized blocked labels, player-specific `purchaseState`, and market economy affordance coverage.

### Focused Forest/Drizzle/Season Stale Tests

Command:

```bash
node --test --test-concurrency=1 --test-name-pattern "forest drizzle|stale|season|rainy archive street|clear weather|scene mismatch|latest forest season|explicit spring scene season|explicit scene season|deterministic engine loop" tests/assetSelection.test.js tests/soundscape.test.js tests/stateSummary.test.js tests/rules.test.js tests/director.test.js tests/flowClosureExtended.test.js
```

Result: passed, exit code 0.

```text
tests 16
pass 16
fail 0
duration_ms 11253.986708
```

The focused command revalidated forest drizzle asset selection, stale transcript guardrails, explicit season precedence, current forest season summary, and soundscape mismatch guards.

### `npm run smoke`

Result: passed, exit code 0.

Important output:

```json
{
  "ok": true,
  "assetCount": 82,
  "generatedAssetCount": 1582,
  "language": "zh",
  "ttsProviders": 5,
  "soundscapePresets": 26,
  "marketOffers": 75,
  "purchasedItem": "storm-lantern",
  "rewardItem": "magnifying-lens",
  "rewardValue": 76,
  "rewardSaleValue": 41,
  "soldLootPayout": 41,
  "soundscape": "market-city",
  "transcript": 15,
  "memories": 2,
  "combatLog": 2,
  "replayHighlights": 4
}
```

### `npm run eval:production-depth`

Result: passed, exit code 0.

Important output:

```json
{
  "gate": "production-depth",
  "checkCount": 10,
  "passedCount": 10,
  "failedCount": 0,
  "passRate": 1,
  "thresholds": {
    "minPassRate": 1
  },
  "passed": true
}
```

## Remaining Release Blockers

No local engineering gate blocker was reproduced in this pass.

Public-readiness blockers remain unchanged:

- `GATE-001` release evidence index remains blocked.
- `GATE-002` consolidated browser acceptance remains blocked until Harness review accepts a gate-status change for release-candidate browser evidence.
- `GATE-003` deployment and staging parity remains blocked.
- `GATE-004` operations and data recovery remains blocked.
- `GATE-005` security and abuse controls remains blocked.
- `GATE-006` legal and privacy remains blocked.
- `GATE-007` load and reliability remains blocked with partial local smoke only.
- `GATE-008` support and launch operations remains blocked with partial plan only.

Additional non-command release hygiene remains open: the worktree is not clean, and this pass did not produce a fresh manual desktop/mobile screenshot pack for the current dirty tree.

## Classification Index

AB release-gate classification is recorded in `docs/qa/release-gates-classification-2026-05-26.md`. It separates current local engineering merge status from public launch, deployment, operations, legal/privacy, reliability, support, and sign-off conditions for `GATE-001` through `GATE-008`; it does not change any gate status in `docs/RELEASE_GATES.md`.

## AP Non-Image Final Gate Addendum

AP reran the requested non-image gates on the current dirty tree and recorded the detailed result in `docs/qa/non-image-final-gates-2026-05-26.md`.

Summary:

- `git diff --check`: passed.
- Standalone `npm run test`: failed once with `tests/deploymentParity.test.js` readiness timeout and `tests/loadReliability.test.js` API p95 latency over threshold.
- `npm run harness:check`: passed; its internal `npm run test` phase passed and did not reproduce the two standalone failures.
- `AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1` focused generated/asset/UI tests: passed, `118` pass, `0` fail, `1` skipped visual Chrome gate.

Strict staging judgment: not unconditional staging-ready until the standalone `npm run test` failure is accepted as superseded by the harness-internal rerun or a fresh standalone rerun passes.
