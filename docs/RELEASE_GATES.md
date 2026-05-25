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
| GATE-007 | Load and reliability | blocked | Target concurrent rooms/SSE clients, repeatable load command, result artifact, latency/error thresholds, degradation policy, and rollback threshold. |
| GATE-008 | Support and launch operations | blocked | Support owner, feedback triage workflow, known limitations, incident templates, beta communications, escalation path, and public issue intake plan. |

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
