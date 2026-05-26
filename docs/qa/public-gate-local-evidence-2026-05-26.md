# Public Gate Local Evidence Package

Date: 2026-05-26
Branch: `main`
Commit: `d5919ee`
Evidence root: `/private/tmp/aidm-public-gates-2026-05-26/`

## Boundary

This package records local release-gate evidence only. It does not change `docs/RELEASE_GATES.md`, does not approve any public launch gate, and does not replace real staging, legal, security, operations, support, or human sign-off evidence.

The worktree was clean before this summary was added, and `git ls-files 'assets/generated/**/*.png' | wc -l` returned `0`, so generated PNG payloads remain outside Git tracking.

## Local Results

| Gate | Local command evidence | Result | Evidence files |
| --- | --- | --- | --- |
| `GATE-003` deployment and staging parity | `npm run --silent deployment:parity -- --json`; `node --test tests/deploymentParity.test.js` | Local production-like parity passed with `recommendation: partial`; 5 local checks passed. Focused test passed 4/4. | `gate-003-deployment-parity.json`, `gate-003-deployment-parity-test.tap` |
| `GATE-004` operations and recovery | `node scripts/ops-drill.mjs drill ...`; `node scripts/ops-drill.mjs monitoring-status`; `node --test tests/operationsRecovery.test.js` | Temp-file backup, export, delete, restore drill passed; monitoring remains blocked/fail-closed because `AIDM_MONITORING_URL` and `AIDM_ALERT_WEBHOOK` are not configured. Focused test passed 5/5. | `gate-004-ops-drill-report.json`, `gate-004-monitoring-status.json`, `gate-004-operations-recovery-test.tap`, `gate-004-backups/`, `gate-004-exports/` |
| `GATE-005` security and abuse controls | `node --test tests/securityPrivacy.test.js tests/serverRoutes.test.js tests/publicReadinessGates.test.js` | Local auth, protected-room boundaries, throttling, redaction, room-session behavior, and fail-closed public-readiness checks passed 19/19. | `gate-005-security-privacy-tests.tap` |
| `GATE-006` legal and privacy | `rg -n "DND|SRD|Open Game License|Creative Commons|license|attribution|privacy|cookie|analytics" docs src public assets tests`; `node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js` | Keyword scan produced 3677 local references for legal/privacy review. This is discovery evidence only, not legal clearance. Shared readiness tests passed 18/18 and keep gates fail-closed. | `gate-006-source-privacy-keyword-scan.txt`, `gate-008-public-readiness-maturity-requirements.tap` |
| `GATE-007` load and reliability | `npm run --silent load:smoke` run 3 times; `node --test tests/loadReliability.test.js` | Three local load smoke runs passed for 4 rooms and 12 total SSE clients, with 0 errors in every run. API p95 values were `1413.5ms`, `1114ms`, and `1148.5ms`; SSE initial p95 values were `5.2ms`, `3.5ms`, and `3.4ms`; SSE broadcast p95 values were `7.1ms`, `5.6ms`, and `6.6ms`. Focused test passed 1/1. | `gate-007-local-load-smoke-runs.json`, `gate-007-local-load-smoke-run-1.json`, `gate-007-local-load-smoke-run-2.json`, `gate-007-local-load-smoke-run-3.json`, `gate-007-load-reliability-test.tap` |
| `GATE-008` support and launch operations | `npm run --silent harness:status`; `node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js` | Harness status still shows open tasks across the public readiness and asset tracks. Shared readiness tests passed 18/18 and keep gates fail-closed. | `gate-008-harness-status.txt`, `gate-008-public-readiness-maturity-requirements.tap` |

## Remaining Blockers

- `GATE-003` still needs a real private staging deployment URL, provider build log, artifact ID, runtime command, redacted environment evidence, staging canary room, rollback or redeploy smoke, managed persistence decision, and production secret owner.
- `GATE-004` still needs real monitoring, alert delivery to a named responder, production backup storage, restore into an approved non-public target, deployed rollback smoke, named responders, escalation path, and support handoff.
- `GATE-005` still needs production identity-provider review, distributed rate limits, WAF or bot-control decision, audit logging, staging abuse drill, incident routing, secret rotation review, and accepted residual-risk owners.
- `GATE-006` still needs completed source registry, license/IP review, attribution plan, privacy policy requirements, retention/export/deletion approval, cookie/consent position, legal/privacy reviewer, decision date, and renewal condition.
- `GATE-007` still needs staging or production-like load smoke, rollback owner, halt thresholds, canary expansion criteria, persistence/multi-instance decision, and review acceptance.
- `GATE-008` still needs support owners, backup coverage, live intake channel, support drill, severity/SLA definitions, incident templates, known-limitations publication, and product/engineering/operations/security/privacy/legal/support sign-off.

## Notes

- Local commands that start temporary localhost services require execution outside the default sandbox; the final evidence files above are from the successful localhost-permitted runs.
- No product code, generated image payloads, or `docs/RELEASE_GATES.md` status entries were changed by this evidence pass.
