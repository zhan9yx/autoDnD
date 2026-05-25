# 0016 Load Reliability And Support Operations

## Requirement

Advance `GATE-007` and `GATE-008` from definition-only blockers to partial, repeatable local evidence while keeping both gates blocked until production-grade evidence and owners exist.

## Scope

- Add a local lightweight load/reliability smoke that creates concurrent rooms, opens authorized SSE clients, verifies initial snapshots, advances room state, and verifies SSE broadcasts.
- Add a focused Node test for the local load smoke with small test-safe concurrency.
- Add QA documentation for load targets, thresholds, degradation policy, rollback threshold, support triage, known limitations, incident template, canary checklist, and public issue intake plan.
- Update release/operations documentation to point to the new evidence without marking public readiness passed.

## Non-Goals

- Do not perform heavy load testing.
- Do not depend on external network services.
- Do not change browser UI, deployment, security, or ops-recovery specialty work.
- Do not mark any public-readiness gate as passed.

## Acceptance Criteria

- `npm run load:smoke` is a repeatable local command.
- `tests/loadReliability.test.js` verifies a small concurrent rooms/SSE path.
- `docs/qa/0016-load-support.md` records targets, thresholds, policies, support workflow, and remaining blockers.
- `docs/RELEASE_GATES.md` and `docs/OPERATIONS.md` keep `GATE-007` and `GATE-008` blocked while linking partial evidence.
- Harness status includes the 0016 package.
