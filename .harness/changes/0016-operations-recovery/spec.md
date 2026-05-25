# 0016 Operations Recovery

## Requirement

Advance `GATE-004 operations and data recovery` with local, executable evidence for JSON persistence recovery without touching real repo data.

## Scope

- Read the existing operations and release gate docs.
- Inspect JSON persistence boundaries.
- Add temp-file-only backup/restore drill coverage.
- Add local user export/delete and retention operation evidence.
- Add incident/rollback checklist and fail-closed monitoring/alerting placeholders.
- Keep public operations blocked until production monitoring, alerting, backup storage, rollback, and support handoff evidence exist.

## Non-Goals

- Do not change security, load, browser QA, asset, AI provider, or gameplay behavior.
- Do not run destructive operations against `data/aidm-store.json`.
- Do not mark `GATE-004` passed.
- Do not commit this worker package.

## Acceptance

- `scripts/ops-drill.mjs` runs on `/private/tmp` data paths and refuses repo-local data paths.
- Focused tests cover backup/restore, export/delete, retention, fail-closed monitoring, and documentation status.
- `docs/OPERATIONS.md`, `docs/RELEASE_GATES.md`, and `docs/qa/0016-operations-recovery.md` describe the local evidence and remaining blockers.
- Harness `tasks.md` and `test-report.md` record this ops work.
