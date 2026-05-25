# 0016 Script Integration Review

Date: 2026-05-25
Worker: J-0016
Scope: deployment, operations, and load script/package integration review.

## Files Reviewed

- `package.json`
- `scripts/deployment-parity.mjs`
- `scripts/ops-drill.mjs`
- `scripts/load-smoke.mjs`
- `tests/deploymentParity.test.js`
- `tests/operationsRecovery.test.js`
- `tests/loadReliability.test.js`

## Findings And Fixes

- Fixed `ops:drill`: the package script previously invoked `node scripts/ops-drill.mjs drill` without the required explicit paths, so the npm command failed before producing evidence. It now passes `/private/tmp/aidm-0016-ops-drill/...` data, backup, export, and report paths.
- Fixed deployment parity data-path validation: the script already defaulted to an OS temp file and rejected `data/aidm-store.json`, but a caller could still pass another repo-local `--data-file`. Validation now rejects any `AIDM_DATA_FILE` inside the repo root.
- No naming mismatch found for `deployment:parity`, `ops:drill`, or `load:smoke`.
- No JSON syntax issue found in `package.json`.

## Safety Review

- `deployment:parity` defaults to an isolated OS temp data file and now refuses repo-local explicit data files. It still permits explicit non-repo paths for staging-style local checks.
- `ops:drill` requires absolute `/private/tmp` paths for data, backup, export, and report outputs. The npm script now uses those explicit paths.
- `load:smoke` starts its own local server by default with an OS temp `AIDM_DATA_FILE`, or can target an explicit existing `--base-url`. It does not default to repo data.

## Verification

Completed in this review after the integration fixes:

```bash
node --check scripts/deployment-parity.mjs                                  # passed
node --check scripts/ops-drill.mjs                                          # passed
node --check scripts/load-smoke.mjs                                         # passed
node --check tests/deploymentParity.test.js                                 # passed
node --check tests/operationsRecovery.test.js                               # passed
node --check tests/loadReliability.test.js                                  # passed
node --test tests/deploymentParity.test.js                                  # passed, 4 tests
node --test tests/operationsRecovery.test.js                                # passed, 5 tests
npm run ops:drill                                                           # passed, writes under /private/tmp/aidm-0016-ops-drill
npm run deployment:parity -- --json                                         # passed with localhost permission
npm run harness:status                                                      # passed, 19 Harness changes reported
```

Failed verification:

```bash
node --test tests/loadReliability.test.js
```

Result: failed. The single load reliability test completed its local server flow but exceeded the SSE initial snapshot threshold in this run: `SSE initial snapshot p95 latency 3937.8ms exceeded 1000ms`.

Combined focused-test note: running `node --test tests/deploymentParity.test.js tests/operationsRecovery.test.js tests/loadReliability.test.js` also failed because deployment parity's 20s child-process timeout and load smoke thresholds are sensitive to concurrent local server tests. Running deployment and operations tests separately passed.
