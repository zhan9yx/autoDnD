# Test Report

Status: local deployment parity evidence contract added. `GATE-003` remains blocked for public readiness because no real staging or production deployment was performed.

## Evidence Created

- `scripts/deployment-parity.mjs`
- `tests/deploymentParity.test.js`
- `docs/qa/0016-deployment-staging-parity.md`
- `.harness/changes/0016-deployment-staging-parity/spec.md`
- `.harness/changes/0016-deployment-staging-parity/review.md`
- `.harness/changes/0016-deployment-staging-parity/tasks.md`
- `.harness/changes/0016-deployment-staging-parity/test-report.md`

## Commands Run

```bash
node --test tests/deploymentParity.test.js
npm run deployment:parity -- --json
npm run lint
npm run harness:status
```

## Results

- `node --test tests/deploymentParity.test.js`: passed, 3 tests total, 3 passed, 0 failed.
- `npm run deployment:parity -- --json`: passed after rerun in a localhost-permitted environment. Default sandbox attempt failed with `listen EPERM: operation not permitted 127.0.0.1`; the accepted rerun returned `ok: true`, `gate: GATE-003`, `recommendation: partial`, and `aiProvider: local`.
- `npm run lint`: passed, `lint ok: 88 JavaScript files checked`.
- `npm run harness:status`: passed and reported 18 Harness changes. Current 0016-adjacent packages from parallel workers were visible: `0016-deployment-staging-parity`, `0016-load-support`, and `0016-operations-recovery`.

## Local Parity Smoke Details

- Environment profile: `NODE_ENV=production`, generated temporary `PORT`, isolated temporary `AIDM_DATA_FILE`, repo `public` and `assets` directories, `OPENAI_MODEL=gpt-5.4-mini`, `OPENAI_BASE_URL=https://api.openai.com/v1`.
- Secret finding: `OPENAI_API_KEY` was absent, so health reported local AI fallback. This is acceptable for local parity and does not claim production AI-provider readiness.
- Checks passed: initial `/api/health`, static asset manifest, canary room creation, rollback restart `/api/health`, and canary room persistence after restart.

## Gate Recommendation

- Local evidence contract: partial when `npm run deployment:parity -- --json` passes.
- Public `GATE-003`: blocked until the same contract is rerun against a real staging or production deployment with hosting logs, external health output, canary result, rollback evidence, and sign-off.
