# 0014 Final Gate Observation

Date: 2026-05-25 10:35 CST
Worker: AIDM 0014 parallel worker K - final quality gate observer
Scope: observation only. This worker did not modify product code, tests, Harness files, or existing docs. The only intended write is this QA note.

## Worktree Snapshot

Initial command:

```bash
git status --short
```

Result: dirty tree already contained broad concurrent 0014 edits across docs, public UI, core runtime, server, and tests. Untracked 0014 outputs were already present:

- `.harness/changes/0014-continuous-product-depth/`
- `docs/qa/0014-acceptance-checklist.md`
- `docs/qa/0014-browser-qa-plan.md`
- `docs/qa/0014-integration-risk.md`
- `docs/qa/0014-test-readiness.md`

After a short wait, `git status --short` was unchanged. After gate execution, a new untracked file appeared:

- `docs/qa/0014-localization-leak-check.md`

Observation: concurrent worker output was still landing during this pass. Treat this gate as a strong observation, not the final main-agent merge gate.

## Commands And Results

| Command | Result |
| --- | --- |
| `npm run lint` | PASS. `lint ok: 79 JavaScript files checked`. |
| `npm run test` | PASS. 274 tests, 274 passed, 0 failed, 0 skipped, 0 todo. |
| `npm run harness:status` | PASS. Reported 14 Harness changes. `0014-continuous-product-depth` is still `18/23` tasks complete. Older change directories also remain partially complete: `0008` 8/9, `0009` 6/7, `0011` 52/69, `0012` 39/47, `0013` 25/36. |
| `npm run harness:check` in default sandbox | FAIL due to environment permission. The first failure was `Error: listen EPERM: operation not permitted 127.0.0.1` during the internal `npm run test` unit-test gate. No product assertion failure was identified in this run. |
| `npm run harness:check` with localhost permission | PASS. Ended with `harness check ok`. |

## Escalated Harness Evidence

The localhost-capable Harness run passed all stages:

- Internal lint: 79 JavaScript files checked.
- Internal unit tests: 274 total, 274 passed, 0 failed, 0 skipped, 0 todo.
- Long-memory eval: recall@5 1, mean reciprocal rank 1, `passed=true`.
- Production-depth eval: 10/10 checks, `passed=true`.
- Local smoke: `ok=true`, generatedAssetCount 748, soundscapePresets 26, marketOffers 65, replayHighlights 4.
- Campaign simulation: `ok=true`, players 5, round 6, transcript 106, memories 26, combatLog 17, replayHighlights 8.

## First Failure And Ownership

First observed failure:

```text
Error: listen EPERM: operation not permitted 127.0.0.1
```

Context: only occurred inside default-sandbox `npm run harness:check`, while direct `npm run test` passed and the localhost-permitted `npm run harness:check` passed.

Ownership suggestion: runner/environment ownership, not a product-code owner. Final Harness execution needs a localhost-capable runner for server-backed tests and smoke.

No real product assertion failure was found by this worker.

## Final Rerun Recommendation

Main agent should rerun the final gate after all parallel workers stop writing because:

- the worktree is still broadly dirty and uncommitted;
- a new untracked QA file appeared during this observation pass;
- `harness:status` still reports `0014-continuous-product-depth` as `18/23`;
- default-sandbox Harness is not authoritative for localhost-backed tests.

Recommended final sequence:

```bash
git status --short
npm run lint
npm run test
npm run harness:status
npm run harness:check
```

Use a localhost-capable runner for `npm run harness:check`.
