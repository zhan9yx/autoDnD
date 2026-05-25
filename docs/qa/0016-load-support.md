# 0016 Load Reliability And Support Operations

Date: 2026-05-25
Worker: F-0016
Scope: local lightweight `GATE-007` load/reliability smoke and partial `GATE-008` support/launch operations evidence.

## Decision

`GATE-007` and `GATE-008` remain blocked.

This pass adds a repeatable local load/reliability smoke and support/launch operating plan. It is intentionally not a production load test, does not use external network services, does not validate hosted infrastructure, and does not prove public-launch readiness.

N-0016 backfill status: focused local load/support verification is passed/partial after Worker F's SSE measurement boundary and presentation-cache fixes. This does not change the public gate decision.

## Load Smoke Target

Default command:

```bash
npm run load:smoke
```

Focused command used by the Node test:

```bash
node --test tests/loadReliability.test.js
```

Default local target:

- 4 concurrent rooms.
- 3 authorized SSE clients per room.
- 12 total SSE clients.
- Per-room create, join, SSE connect, stream-open initial snapshot, start, player chat mutation, and SSE broadcast verification.
- Room setup and room mutations are paced sequentially because the local JSON store writes through a single temp file; the concurrent surface under test is multiple live rooms with multiple simultaneous SSE clients.
- Temporary `AIDM_DATA_FILE` under the OS temp directory when the script starts its own server.
- No external network dependency.

Default local thresholds:

- API p95 latency: `<= 15000ms`.
- SSE connect p95 latency: `<= 1000ms`, reported separately from steady-state stream metrics.
- SSE initial snapshot p95 latency after the stream is open: `<= 1000ms`.
- SSE post-action broadcast p95 latency: `<= 1000ms`.
- Error rate: `0`.
- Per-wait timeout: `8000ms`.

Config knobs:

- `AIDM_LOAD_SMOKE_ROOMS`
- `AIDM_LOAD_SMOKE_SSE_PER_ROOM`
- `AIDM_LOAD_SMOKE_API_P95_MS`
- `AIDM_LOAD_SMOKE_SSE_CONNECT_P95_MS`
- `AIDM_LOAD_SMOKE_SSE_INITIAL_P95_MS`
- `AIDM_LOAD_SMOKE_SSE_BROADCAST_P95_MS`
- `AIDM_LOAD_SMOKE_MAX_ERROR_RATE`
- `AIDM_LOAD_SMOKE_TIMEOUT_MS`

CLI overrides:

```bash
node scripts/load-smoke.mjs --rooms 4 --sse-clients-per-room 3
node scripts/load-smoke.mjs --base-url http://127.0.0.1:4173 --rooms 4 --sse-clients-per-room 3
```

## Degradation Policy

For local-alpha sessions, treat any of the following as degradation:

- API p95 exceeds the selected local-alpha threshold for two consecutive local smoke runs.
- SSE stream-open initial snapshot or broadcast p95 exceeds threshold for two consecutive local smoke runs.
- Any smoke request returns an unexpected non-2xx response.
- Any SSE client fails to receive its initial snapshot or the post-action snapshot before timeout.
- Room state advances but connected clients do not converge on the same room version.

Immediate operator response:

1. Stop opening new public or beta tables.
2. Preserve the smoke JSON output, server stderr/stdout, `AIDM_DATA_FILE` path, local commit, and command line.
3. Restart the local service with a fresh temp data file and rerun `npm run load:smoke`.
4. If the rerun passes, record the incident as transient and keep the gate blocked until the cause is understood.
5. If the rerun fails, open a release-blocking issue and do not continue canary expansion.

## Rollback Threshold

For a future staged/canary release, roll back or halt rollout when any of these occur:

- Local or staging load smoke fails once during release validation.
- API p95 is above target by more than 50% in release validation.
- SSE broadcast p95 is above target by more than 50% in release validation.
- Error rate is greater than `0` for the smoke target.
- Any room data loss, duplicate turn advancement, unauthorized room-read exposure, or stuck SSE recovery is observed.

Rollback owner is still a placeholder and must be assigned before `GATE-007` or `GATE-008` can pass.

## Support Owner Placeholder

Support owner: `TBD before beta`.

Required before beta:

- Primary support owner name.
- Backup support owner name.
- Escalation engineer for auth/room-state incidents.
- Escalation engineer for deployment/rollback incidents.
- Coverage window and expected response time.

## Feedback Triage Workflow

1. Intake feedback through the planned public issue form or private beta channel.
2. Label each item as `bug`, `reliability`, `security/privacy`, `support`, `content`, `ux`, or `question`.
3. Assign severity:
   - `P0`: data exposure, data loss, service unavailable, or unsafe public behavior.
   - `P1`: blocked table, broken join/recovery, broken action loop, or repeated SSE failure.
   - `P2`: degraded feature with workaround.
   - `P3`: copy, polish, or low-impact suggestion.
4. Reproduce locally with isolated `AIDM_DATA_FILE` when possible.
5. Attach evidence: URL, room ID, role, browser/device, command output, screenshot if relevant, and expected vs actual behavior.
6. Route security/privacy items out of public issue discussion until reviewed.
7. Close only after fix evidence, regression command, and user-facing response are recorded.

## Known Limitations

- AIDM is still approved only for local-alpha review.
- The room store is JSON-file backed and not a production database.
- The current local smoke is a small reliability signal, not a capacity benchmark.
- Public authentication, rate limits, abuse throttling, monitoring, alerting, backup/restore, legal/privacy review, and deployment parity are still blocked gates.
- SSE connections are in-memory per server process; multi-instance fanout is not proven.
- JSON store writes are paced in the smoke; cross-room concurrent write safety is not proven.
- SSE connect latency is reported separately because it includes HTTP connection setup, room-read authorization, and cold snapshot path overhead. `GATE-007` remains blocked until a release-candidate environment can prove both connect and steady-state behavior.
- Voice and ambience are browser-local optional features and are not covered by this load smoke.

## Incident Template

```markdown
# Incident: <short title>

Date/time:
Reporter:
Support owner:
Severity: P0/P1/P2/P3
Gate affected: GATE-00X

## Summary

## Customer impact

## Detection

## Timeline

## Evidence

- Command:
- Commit:
- Environment:
- Room ID(s):
- Screenshot/log path:

## Mitigation

## Root cause

## Follow-up tasks

## User communication
```

## Canary And Release Evidence Checklist

Before any canary or beta expansion:

- Release candidate commit is recorded.
- `npm run harness:check` passes on the release candidate.
- `npm run load:smoke` passes and JSON output is attached.
- Full browser acceptance evidence is attached for desktop and mobile.
- Deployment/staging parity evidence is attached.
- Operations recovery evidence is attached.
- Security/privacy/legal evidence is attached.
- Support owner and backup are assigned.
- Known limitations are published in the beta note.
- Rollback decision owner and rollback command are recorded.
- Public issue intake path is live and monitored.

## Public Issue Intake Plan

Use a structured issue form before public beta. Required fields:

- Issue type.
- Severity from the user's perspective.
- Browser and device.
- Room ID or approximate time if room ID cannot be shared.
- Role: host, player, pending player, observer, or support.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Screenshot or log attachment.
- Consent checkbox for attaching redacted room metadata.

Do not request passwords, session tokens, player tokens, private memos, or secrets in the public form.

## Verification Commands

```bash
node --test tests/loadReliability.test.js
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
npm run load:smoke
npm run harness:status
```

## N-0016 Backfill Verification

- `node --test tests/loadReliability.test.js`: passed, 1 test passed, 0 failed, duration `16618.017625ms`.
- `node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js`: passed, 18 tests passed, 0 failed, duration `1762.656959ms`.
- `npm run harness:status`: passed. Reported 19 Harness changes; `0016-load-support` remains `7/11` tasks complete while public support, rollback-owner, and staging/prod-like blockers stay open.

## Remaining Blockers

- `GATE-007` needs repeated release-candidate evidence, staging/prod-like evidence, and an assigned rollback owner before it can pass.
- `GATE-008` needs named support owners, live intake, beta communications, escalation path, and sign-off before it can pass.
