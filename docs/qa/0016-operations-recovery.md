# 0016 Operations Recovery Evidence

Worker: D-0016

Scope: `GATE-004 operations and data recovery`.

## Decision

GATE-004 status: blocked.

This pass adds local, temp-file-only operations evidence. It does not close public operations because production monitoring, alert routing, production backup storage, on-call/support ownership, and deployed rollback evidence are still missing.

## Evidence Added

- `scripts/ops-drill.mjs`: temp-file-only backup, restore, export-user, delete-user, retention, monitoring-status, and full drill command.
- `tests/operationsRecovery.test.js`: focused drill, CLI, safety, fail-closed monitoring, and docs assertions.
- `docs/OPERATIONS.md`: backup/restore drill, data retention/export/delete operations, monitoring/alerting placeholders, incident and rollback checklist.
- `docs/RELEASE_GATES.md`: current 0016 local evidence section while keeping `GATE-004` blocked.
- `.harness/changes/0016-operations-recovery/`: Harness package for this worker.

## Local Drill Command

```bash
node scripts/ops-drill.mjs drill \
  --data-file /private/tmp/aidm-0016-ops-drill/aidm-store.json \
  --backup-dir /private/tmp/aidm-0016-ops-drill/backups \
  --export-dir /private/tmp/aidm-0016-ops-drill/exports \
  --report-file /private/tmp/aidm-0016-ops-drill/report.json
```

Expected result:

- `ok: true`
- `before.sha256` equals `after.sha256`
- `backup.sha256` equals `restore.sha256`
- one user export is written
- stale sessions are pruned during the temporary mutation phase
- user and session delete counts are reported during the temporary mutation phase
- final restore returns the data file to its starting checksum
- monitoring and alerting report `blocked` and `failClosed: true` unless both placeholder endpoints are configured

## Safety Boundary

The operations script refuses relative paths and repo-local data paths. It requires absolute paths under `/private/tmp` for data files, backup directories, export directories, and report files.

No command in this package should be run against `data/aidm-store.json`.

## Remaining Blockers

- No production monitoring provider or synthetic-check target is configured.
- No alert webhook or named responder is configured.
- No production backup target exists.
- No deployed rollback smoke has been run.
- User-data deletion/export remains a local technical drill, not a legal/privacy-approved production workflow.
- Support handoff and public issue intake remain under `GATE-008`.
