# Release Gates

## Current Decision

AIDM is approved only for local-alpha review. Public launch is blocked until every gate below has a named evidence artifact, a passing command or drill where applicable, and an explicit Harness review decision.

Passing `npm run harness:check` proves the local engineering baseline. It does not pass any public-readiness gate by itself.

This gate package does not claim legal clearance. AIDM remains an original, generic fantasy TRPG prototype; any future use of external rules, settings, art, audio, names, or lore must first pass `GATE-006` with a source registry, license record, attribution plan, allowed-use scope, excluded protected terms, and legal review evidence.

## Gate Matrix

| Gate ID | Domain | Current Status | Required Evidence To Pass |
| --- | --- | --- | --- |
| GATE-001 | Release evidence index | blocked | A single release-candidate evidence index linking Harness change, tests, browser QA, deployment, operations, security, legal/privacy, load, support, known risks, and sign-off. |
| GATE-002 | Consolidated browser acceptance | blocked | Full 0014 browser QA run on isolated local data with desktop and mobile evidence for create/join/start/action/chat/scene/audio/market/backpack/refresh/permissions. |
| GATE-003 | Deployment and staging parity | blocked | Production-like deployment artifact, staging parity checklist, environment profile, secret validation, health-check output, canary plan, and rollback smoke result. |
| GATE-004 | Operations and data recovery | blocked | Monitoring, alerting, incident response, backup/restore drill, data retention operation, rollback owner, and support handoff record. |
| GATE-005 | Security and abuse controls | blocked | Production identity provider review, session rotation policy, rate limits, abuse throttling, secret handling review, sensitive-data redaction proof, and accepted residual-risk list. |
| GATE-006 | Legal and privacy | blocked | Source registry, license/IP review, attribution plan, external-rules allowed-use scope, excluded protected identity terms, privacy policy requirements, data deletion/export workflow, retention schedule, consent/cookie position, user-facing limitation copy, and legal review evidence. |
| GATE-007 | Load and reliability | blocked (partial local smoke) | Target concurrent rooms/SSE clients, repeatable load command, result artifact, latency/error thresholds, degradation policy, and rollback threshold. Current partial evidence: `docs/qa/0016-load-support.md` and `npm run load:smoke`; still missing repeated release-candidate and staging/prod-like evidence plus assigned rollback owner. |
| GATE-008 | Support and launch operations | blocked (partial plan) | Support owner, feedback triage workflow, known limitations, incident templates, beta communications, escalation path, and public issue intake plan. Current partial evidence: `docs/qa/0016-load-support.md`; still missing named owners, live intake, beta communications, escalation path, and sign-off. |

## Current GATE-002 Evidence

The 0015 consolidated browser pass adds local desktop/mobile evidence for open, password, and host-approval rooms. The accepted local evidence artifact is:

```text
docs/qa/0015-consolidated-browser-acceptance.md
```

The machine-readable report and screenshots are under:

```text
/private/tmp/aidm-0015-consolidated-browser-final3/
```

`GATE-002` remains blocked in the public-readiness matrix until Harness review explicitly accepts a gate-status change. The local browser pack does not pass deployment, operations, security, legal/privacy, load/reliability, support, release-candidate index, or sign-off gates.

## Current GATE-003 Evidence

The 0016 deployment parity pass adds executable local evidence for environment inventory, secret masking, production-like start, `/api/health`, static manifest loading, canary room creation, and restart rollback smoke. The accepted local command is:

```bash
npm run deployment:parity -- --json
```

`GATE-003` remains blocked. The local command is only a partial evidence contract; the remaining production evidence is hosting build/start logs, deployed staging URL health output, external canary result, provider rollback or redeploy smoke, environment-profile evidence with secrets redacted, and Harness review approval.

## Current GATE-007 And GATE-008 Evidence

Worker F-0016 adds a local-only reliability smoke and launch-support plan:

```bash
npm run load:smoke
```

The default smoke creates 4 rooms, opens 3 authorized SSE clients per room, reports SSE connect latency separately, verifies stream-open initial snapshots, sends a lightweight chat mutation in each room, and waits for post-mutation SSE broadcasts. The support plan records owner placeholders, triage workflow, known limitations, incident template, canary checklist, and public issue intake requirements in `docs/qa/0016-load-support.md`.

`GATE-007` remains blocked until repeated release-candidate and staging/prod-like evidence exists with an assigned rollback owner. `GATE-008` remains blocked until named owners, live intake, beta communications, escalation path, and sign-off exist.

## Machine-Checked Contract

The focused public-readiness test enforces these invariants:

- The 0015 Harness package exists.
- `docs/RELEASE_GATES.md` and `docs/qa/0015-public-readiness-gates.md` exist.
- `GATE-001` through `GATE-008` remain present.
- Each public-readiness gate above remains `blocked` until a future evidence-backed change intentionally changes the status.
- The gate document keeps local engineering gates separate from public-launch gates.

## Close Procedure For A Future Gate

1. Add or link the evidence artifact named by the gate.
2. Run the gate-specific command, drill, or review.
3. Record the result in the active Harness `test-report.md`.
4. Update the gate status in this file.
5. Add review approval explaining why the evidence is sufficient.

If any step is missing, keep the gate blocked.

## Current GATE-004 Evidence

The 0016 local recovery drill adds executable local evidence for backup/restore, user export/delete, session retention pruning, an incident/rollback checklist, and fail-closed monitoring placeholders. The accepted local command is:

```bash
node scripts/ops-drill.mjs drill \
  --data-file /private/tmp/aidm-0016-ops-drill/aidm-store.json \
  --backup-dir /private/tmp/aidm-0016-ops-drill/backups \
  --export-dir /private/tmp/aidm-0016-ops-drill/exports \
  --report-file /private/tmp/aidm-0016-ops-drill/report.json
```

`GATE-004` remains blocked. The remaining production evidence is real monitoring, alert delivery, named on-call/support ownership, production backup storage, deployed rollback smoke, and reviewed user-data operations.
