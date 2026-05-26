# Public Gate Evidence Checklist

Date: 2026-05-26
Scope: executable evidence checklist for `GATE-003` through `GATE-008`.

## Decision Boundary

This document does not pass any public launch gate and does not change the fail-closed status in `docs/RELEASE_GATES.md`. It turns the current blocked or local-partial gate state into an execution checklist for the next release-candidate evidence pass.

Use this file as the working checklist for gathering evidence. A gate can move out of blocked state only after the evidence file exists, the listed commands or manual checks complete, and the active Harness review explicitly accepts the gate status change.

## Shared Evidence Rules

- Record the release-candidate commit, branch, operator, date, environment, and data-store target in every output file.
- Redact secrets, passwords, session tokens, player tokens, host tokens, provider keys, private memos, and raw production user data.
- Store machine-readable results under `/private/tmp/aidm-public-gates-2026-05-26/` during execution.
- Copy only redacted summaries into `docs/qa/` after review.
- Keep `docs/RELEASE_GATES.md` blocked until the gate owner signs off.

## Gate Checklist

| Gate | Current status | Blocking level | Existing local evidence | Output file to create |
| --- | --- | --- | --- | --- |
| `GATE-003` deployment and staging parity | blocked with local-partial contract | P0 public launch blocker | `docs/qa/0016-deployment-staging-parity.md`, `tests/deploymentParity.test.js`, `npm run deployment:parity -- --json` | `docs/qa/gate-003-staging-deployment-evidence-YYYY-MM-DD.md` |
| `GATE-004` operations and data recovery | blocked with temp-file local drill | P0 public launch blocker | `docs/qa/0016-operations-recovery.md`, `tests/operationsRecovery.test.js`, `npm run ops:drill` | `docs/qa/gate-004-operations-recovery-evidence-YYYY-MM-DD.md` |
| `GATE-005` security and abuse controls | blocked with local security boundaries | P0 public launch blocker | `docs/qa/0016-security-privacy.md`, `docs/SECURITY.md`, `tests/securityPrivacy.test.js` | `docs/qa/gate-005-security-abuse-evidence-YYYY-MM-DD.md` |
| `GATE-006` legal and privacy | blocked with templates only | P0 public launch blocker | `docs/qa/0016-security-privacy.md` source registry and privacy templates | `docs/qa/gate-006-legal-privacy-evidence-YYYY-MM-DD.md` |
| `GATE-007` load and reliability | blocked with partial local smoke | P0 public launch blocker | `docs/qa/0016-load-support.md`, `tests/loadReliability.test.js`, `npm run load:smoke` | `docs/qa/gate-007-load-reliability-evidence-YYYY-MM-DD.md` |
| `GATE-008` support and launch operations | blocked with support plan placeholder | P0 public launch blocker | `docs/qa/0016-load-support.md` | `docs/qa/gate-008-support-launch-evidence-YYYY-MM-DD.md` |

## GATE-003: Deployment And Staging Parity

Current status: blocked. The project has a local production-like parity command, but no external staging deployment evidence.

Missing evidence:

- Hosting build log, artifact identifier, runtime command, Node version, and deployed commit.
- Private staging URL health output from `/api/health`.
- Static asset manifest result from `/assets/manifest.json`.
- Staging canary room creation with timestamp, operator, room ID, and rollback criteria.
- Provider rollback or redeploy smoke with before and after health output.
- Environment profile evidence with secrets redacted.
- Managed persistence decision for staging and public launch.
- Production secret owner and rotation owner.

Executable commands:

```bash
npm run deployment:parity -- --json
node --test tests/deploymentParity.test.js
curl -fsS "$AIDM_STAGING_URL/api/health"
curl -fsS "$AIDM_STAGING_URL/assets/manifest.json"
```

Manual validation steps:

1. Deploy the release-candidate commit to a private staging URL.
2. Capture provider build output, artifact ID, Node/runtime version, start command, and commit SHA.
3. Export or screenshot provider environment keys with values redacted.
4. Run the health and manifest requests against the staging URL.
5. Create one canary room on staging, record the room ID, then perform a provider rollback or redeploy.
6. Re-run health, manifest, and canary-room read checks after rollback or redeploy.
7. Record whether the staging data store is JSON-file based, managed database backed, or explicitly not approved for public traffic.

Required output:

- Redacted machine output: `/private/tmp/aidm-public-gates-2026-05-26/gate-003-staging-deployment.json`
- Reviewable summary: `docs/qa/gate-003-staging-deployment-evidence-YYYY-MM-DD.md`

Acceptance signal: all local and staging checks pass, rollback/redeploy preserves the canary expectation, secrets remain redacted, and Harness review accepts the staging parity evidence.

## GATE-004: Operations And Data Recovery

Current status: blocked. The project has a safe temp-file local drill, but no production monitoring, alerting, backup storage, responder, or deployed rollback evidence.

Missing evidence:

- Production monitoring provider or synthetic check endpoint.
- Alert route that reaches a named human responder.
- Named primary responder, backup responder, and escalation path.
- Production backup target, retention policy, restore scope, and restore owner.
- Deployed rollback smoke on staging or production-like infrastructure.
- Legal/privacy-approved user export, deletion, and retention workflow.
- Support handoff record linked to `GATE-008`.

Executable commands:

```bash
npm run ops:drill
node --test tests/operationsRecovery.test.js
node scripts/ops-drill.mjs monitoring-status
curl -fsS "$AIDM_MONITORING_URL"
```

Manual validation steps:

1. Run `npm run ops:drill` and preserve the generated JSON report.
2. Configure the intended monitoring URL and alert webhook in a staging or production-like environment.
3. Trigger a synthetic alert or documented test alert and record delivery to the named responder.
4. Create a backup using the approved backup target, then restore into a non-public verification target.
5. Run a deployed create, join, refresh, and canary-room read smoke after restore or rollback.
6. Attach the responder roster, escalation path, backup retention policy, and support handoff.

Required output:

- Redacted machine output: `/private/tmp/aidm-public-gates-2026-05-26/gate-004-ops-drill-report.json`
- Alert proof: `/private/tmp/aidm-public-gates-2026-05-26/gate-004-alert-delivery-redacted.md`
- Reviewable summary: `docs/qa/gate-004-operations-recovery-evidence-YYYY-MM-DD.md`

Acceptance signal: backup and restore are verified against an approved target, alerts reach the named responder, deployed rollback smoke passes, and Harness review accepts the operations evidence.

## GATE-005: Security And Abuse Controls

Current status: blocked. Local auth, permission, throttling, and redaction tests exist, but they are not a production security program.

Missing evidence:

- Production identity provider selection and review.
- Device-session, session rotation, revocation, account recovery, and audit logging policy.
- Distributed rate limiting for auth, room creation, joins, AI calls, room mutations, and SSE usage.
- WAF, bot control, or equivalent edge protection decision.
- Secret handling and rotation review for provider keys and hosting settings.
- Abuse operations workflow, incident routing, and security triage owner.
- Sensitive-data redaction proof for logs, snapshots, support exports, and incident artifacts.
- Accepted residual-risk list with owners and expiration dates.

Executable commands:

```bash
node --test tests/securityPrivacy.test.js
node --test tests/serverRoutes.test.js
node --test tests/publicReadinessGates.test.js
npm run harness:check
```

Manual validation steps:

1. Record identity-provider decision, allowed auth methods, session duration, recovery flow, revocation flow, and audit-log retention.
2. Configure or document distributed rate limits for every protected surface.
3. Run protected-room negative checks against staging for unauthenticated, pending, rejected, wrong-token, and stale-version requests.
4. Export representative logs, support payloads, and room snapshots with secrets redacted.
5. Run an abuse drill for repeated login, join, room create, mutation, AI call, and SSE connect attempts.
6. Create a residual-risk table with severity, owner, mitigation, target date, and acceptor.

Required output:

- Redacted machine output: `/private/tmp/aidm-public-gates-2026-05-26/gate-005-security-tests.json`
- Abuse drill record: `/private/tmp/aidm-public-gates-2026-05-26/gate-005-abuse-drill-redacted.md`
- Reviewable summary: `docs/qa/gate-005-security-abuse-evidence-YYYY-MM-DD.md`

Acceptance signal: production security controls are documented, tested, and owned; residual risks are accepted; secrets remain redacted; and Harness review accepts the security evidence.

## GATE-006: Legal And Privacy

Current status: blocked. The project has source-registry and privacy-checklist templates only. Legal clearance is not complete.

Missing evidence:

- Completed source inventory for rules, settings, generated text, art, audio, names, code snippets, fonts, and datasets.
- License/IP review and allowed-use scope for every non-original source.
- Attribution plan and protected-term exclusion list.
- Privacy policy requirements for hosted use.
- Data retention schedule and owner.
- Production user export and deletion workflow.
- Cookie, localStorage, analytics, AI-provider, and consent decision.
- User-facing limitation copy for AI narration, data durability, audio, and local/prototype boundaries.
- Legal reviewer, decision date, and expiration or renewal condition.

Executable commands:

```bash
node --test tests/securityPrivacy.test.js
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
rg -n "DND|SRD|Open Game License|Creative Commons|license|attribution|privacy|cookie|analytics" docs src public assets tests
```

Manual validation steps:

1. Complete the source registry for every product-visible external source or confirm the item is project-original.
2. For each external source, attach source URL or file path, license text, allowed product surfaces, attribution text, and prohibited terms.
3. Review generated content, rules references, prompts, asset descriptions, audio labels, and item/spell names for protected identity terms.
4. Draft privacy policy requirements and data-flow notes for account email, display name, room state, player state, transcript, localStorage, AI-provider calls, and support exports.
5. Validate export, deletion, retention, cookie, analytics, and consent decisions with legal/privacy owner.
6. Attach reviewer name, approval scope, decision date, and renewal condition.

Required output:

- Source inventory: `/private/tmp/aidm-public-gates-2026-05-26/gate-006-source-registry-redacted.csv`
- Privacy worksheet: `/private/tmp/aidm-public-gates-2026-05-26/gate-006-privacy-worksheet-redacted.md`
- Reviewable summary: `docs/qa/gate-006-legal-privacy-evidence-YYYY-MM-DD.md`

Acceptance signal: every source and data flow is reviewed, required attribution and user-facing notices are defined, legal/privacy owners approve the scope, and Harness review accepts the legal/privacy evidence.

## GATE-007: Load And Reliability

Current status: blocked with partial local smoke. The local default covers 4 rooms and 12 SSE clients; it is not repeated release-candidate or staging/prod-like reliability evidence.

Missing evidence:

- Repeated release-candidate load smoke results on the final commit.
- Staging or production-like run against a deployed target.
- Attached JSON result artifacts and latency summaries.
- Assigned rollback owner and rollback command.
- Reliability thresholds for canary expansion.
- Evidence that degradation policy and rollback threshold were applied in review.
- Multi-instance or managed persistence decision if public traffic requires it.

Executable commands:

```bash
npm run load:smoke
node --test tests/loadReliability.test.js
node scripts/load-smoke.mjs --rooms 4 --sse-clients-per-room 3
node scripts/load-smoke.mjs --base-url "$AIDM_STAGING_URL" --rooms 4 --sse-clients-per-room 3
```

Manual validation steps:

1. Run the local smoke at least three times on the release-candidate commit and save all result JSON.
2. Run the same target against the private staging URL.
3. Record p95 API, SSE connect, initial snapshot, broadcast latency, error rate, room IDs, commit, environment, and data-store target.
4. Confirm no room data loss, duplicate turn advancement, unauthorized room-read exposure, or stuck SSE recovery occurred.
5. Assign rollback owner, rollback command, halt threshold, and escalation path.
6. Decide whether the current JSON store and in-memory SSE fanout are acceptable for the planned public traffic level.

Required output:

- Local repeated smoke results: `/private/tmp/aidm-public-gates-2026-05-26/gate-007-local-load-smoke-runs.json`
- Staging smoke result: `/private/tmp/aidm-public-gates-2026-05-26/gate-007-staging-load-smoke.json`
- Reviewable summary: `docs/qa/gate-007-load-reliability-evidence-YYYY-MM-DD.md`

Acceptance signal: repeated local and staging runs meet thresholds, rollback owner and halt criteria are assigned, reliability limits are accepted, and Harness review accepts the load/reliability evidence.

## GATE-008: Support And Launch Operations

Current status: blocked with placeholder support plan. There are no named support owners, live intake channel, beta communications, escalation path, or sign-off.

Missing evidence:

- Primary support owner, backup support owner, and coverage window.
- Escalation engineer for auth/room-state incidents.
- Escalation engineer for deployment/rollback incidents.
- Live issue intake form or private beta channel.
- Triage labels, severity definitions, response targets, and escalation SLA.
- Public or beta known-limitations note.
- User communication template for incidents and resolved issues.
- Final sign-off from product, engineering, operations, security/privacy, and legal owners.

Executable commands:

```bash
npm run harness:status
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```

Manual validation steps:

1. Assign named owners and backups for support, engineering escalation, deployment rollback, security/privacy, and legal/privacy.
2. Create the live intake form or private beta issue channel and verify the team can receive, label, assign, and close a test issue.
3. Publish the known-limitations note covering JSON storage, SSE fanout, load limits, auth hardening, monitoring, privacy/legal, voice/audio, and AI-generated narration.
4. Run a support drill: file a test issue, triage severity, attach redacted evidence, route to owner, decide response, and record closure.
5. Record incident communication templates for outage, data issue, auth issue, security/privacy report, and rollback.
6. Capture final sign-off lines for product, engineering, operations, security/privacy, legal/privacy, and support.

Required output:

- Support drill record: `/private/tmp/aidm-public-gates-2026-05-26/gate-008-support-drill-redacted.md`
- Intake proof: `/private/tmp/aidm-public-gates-2026-05-26/gate-008-intake-proof-redacted.md`
- Reviewable summary: `docs/qa/gate-008-support-launch-evidence-YYYY-MM-DD.md`

Acceptance signal: staffed intake and escalation exist, the support drill is complete, known limitations are published, required owners sign off, and Harness review accepts the support/launch evidence.

## Recommended Execution Order

1. Run local command baselines for `GATE-003`, `GATE-004`, `GATE-005`, and `GATE-007`.
2. Deploy the release candidate to private staging.
3. Execute staging health, canary, rollback, load, and support drills.
4. Complete legal/privacy source and data-flow review.
5. Consolidate redacted outputs into one release-candidate evidence index.
6. Only then open a Harness review to consider changing gate status.

## Verification For This Checklist

Recommended commands after editing this file:

```bash
git diff --check -- docs/qa/public-gate-evidence-checklist-2026-05-26.md
node --test tests/publicReadinessGates.test.js
```
