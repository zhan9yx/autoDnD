# Test Report

Status: focused local load-smoke verification passed after splitting SSE connect and initial snapshot measurement. Public `GATE-007` and `GATE-008` remain blocked.

## Evidence Created

- `scripts/load-smoke.mjs`
- `tests/loadReliability.test.js`
- `docs/qa/0016-load-support.md`
- `.harness/changes/0016-load-support/spec.md`
- `.harness/changes/0016-load-support/review.md`
- `.harness/changes/0016-load-support/tasks.md`
- `.harness/changes/0016-load-support/test-report.md`

## Commands Run

```bash
node --test tests/loadReliability.test.js
npm run load:smoke
npm run harness:status
```

## Results

- `node --test tests/loadReliability.test.js`: passed, 1 test passed, 0 failed, duration `15352.551917ms`.
- `npm run load:smoke`: default sandbox attempt failed with `listen EPERM: operation not permitted 127.0.0.1`; localhost-permitted rerun passed.
- `npm run harness:status`: passed in the previous load-support verification pass.
- `node --check scripts/load-smoke.mjs`: passed in O-0016 integration review.
- `git diff --check`: passed in O-0016 integration review.
- N-0016 backfill `node --test tests/loadReliability.test.js`: passed, 1 test passed, 0 failed, duration `16618.017625ms`.
- N-0016 backfill `node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js`: passed, 18 tests passed, 0 failed, duration `1762.656959ms`.
- N-0016 backfill `npm run harness:status`: passed. Reported 19 Harness changes; `0016-load-support` remains `7/11` tasks complete because public owner/staging/intake blockers stay open.

Default `npm run load:smoke` result:

```json
{
  "target": {
    "rooms": 4,
    "sseClientsPerRoom": 3,
    "totalSseClients": 12
  },
  "thresholds": {
    "apiP95Ms": 15000,
    "sseConnectP95Ms": 1000,
    "sseInitialP95Ms": 1000,
    "sseBroadcastP95Ms": 1000,
    "maxErrorRate": 0
  },
  "metrics": {
    "api": {
      "count": 17,
      "p95Ms": 5335.5
    },
    "sseConnect": {
      "count": 12,
      "p95Ms": 282.6
    },
    "sseInitial": {
      "count": 12,
      "p95Ms": 45.8
    },
    "sseBroadcast": {
      "count": 12,
      "p95Ms": 66.4
    },
    "errors": 0,
    "errorRate": 0
  }
}
```

## Current Follow-Up

Earlier failed attempts showed why the original `sseInitial` metric was misleading: it measured from before opening the SSE fetch, so connection setup, room-read authorization, and cold snapshot path overhead were included in the p95. The fixed smoke reports `sseConnect` separately and starts `sseInitial` after the stream is open.

## Gate Decision

- `GATE-007`: blocked with partial local evidence.
- `GATE-008`: blocked with partial support/launch operations documentation.

Remaining `GATE-007` blockers: repeated release-candidate evidence, staging/prod-like evidence, assigned rollback owner, and proof outside the single-process JSON-store local setup.
