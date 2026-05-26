# Public Gate Next Execution Plan

Date: 2026-05-26
Scope: next executable tickets for `GATE-003` through `GATE-008`.

## Boundary

This plan does not pass any public launch gate, does not edit
`docs/RELEASE_GATES.md`, and does not replace Harness review. It converts the
current checklist and local evidence package into tickets that can be assigned to
staging, operations, security, legal/privacy, load, and support owners.

Inputs:

- `docs/qa/public-gate-evidence-checklist-2026-05-26.md`
- `docs/qa/public-gate-local-evidence-2026-05-26.md`
- `docs/RELEASE_GATES.md`

Every ticket must record the release-candidate commit, branch, operator,
execution date, staging URL, data-store target, and redacted environment profile
before any gate can be reviewed.

## Shared Execution Setup

Required environment variables:

| Variable | Required for | Notes |
| --- | --- | --- |
| `AIDM_STAGING_URL` | `GATE-003`, `GATE-007`, `GATE-008` | Private staging URL, no trailing slash preferred. |
| `AIDM_STAGING_HEALTH_URL` | `GATE-003`, `GATE-004` | Usually `$AIDM_STAGING_URL/api/health`; set explicitly for hosted rewrites. |
| `AIDM_STAGING_DEPLOYMENT_ID` | `GATE-003` | Hosting artifact or deployment identifier. |
| `AIDM_STAGING_COMMIT` | all gates | Git commit deployed to staging. |
| `AIDM_STAGING_DATA_TARGET` | `GATE-003`, `GATE-004`, `GATE-007` | JSON file, managed database, or other persistence target. |
| `AIDM_MONITORING_URL` | `GATE-004` | Synthetic check or monitoring status endpoint. |
| `AIDM_ALERT_WEBHOOK` | `GATE-004` | Redacted alert route or test webhook identifier. |
| `AIDM_SUPPORT_INTAKE_URL` | `GATE-008` | Private beta issue form, queue, or support channel. |
| `AIDM_LOAD_ROOMS` | `GATE-007` | Defaults can match local smoke first, then raise by review decision. |
| `AIDM_LOAD_SSE_PER_ROOM` | `GATE-007` | Defaults can match local smoke first, then raise by review decision. |

Shared output root:

```text
/private/tmp/aidm-public-gates-2026-05-26/
```

Shared verification commands:

```bash
git rev-parse HEAD
git status --short --branch
npm run harness:status
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```

Shared blockers:

- Any secret, host token, player token, provider key, password, private memo, or
  raw production user data appears in an evidence artifact.
- Staging commit differs from the release-candidate commit without an explicit
  reason and reviewer acceptance.
- A gate owner is missing or refuses sign-off.
- `docs/RELEASE_GATES.md` is changed to passed before evidence and Harness
  review are complete.

## Ticket PG-003A: Staging Deployment Artifact

Gate: `GATE-003`
Owner: `TBD deployment owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: deploy the release-candidate commit to a private staging target and record
the exact artifact, runtime, environment profile, and health output.

Commands:

```bash
npm run deployment:parity -- --json
node --test tests/deploymentParity.test.js
curl -fsS "$AIDM_STAGING_URL/api/health"
curl -fsS "$AIDM_STAGING_URL/assets/manifest.json"
```

Environment variables:

- `AIDM_STAGING_URL`
- `AIDM_STAGING_HEALTH_URL`
- `AIDM_STAGING_DEPLOYMENT_ID`
- `AIDM_STAGING_COMMIT`
- `AIDM_STAGING_DATA_TARGET`
- provider-specific redacted environment export path: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-003-staging-health.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-003-staging-manifest.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-003-provider-build-redacted.md`
- `docs/qa/gate-003-staging-deployment-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Hosting provider build log with artifact ID.
- Node version, start command, deployment region, runtime type, and deployed SHA.
- Redacted environment keys, including absence or redaction of provider secrets.
- Staging `/api/health` response and asset manifest response.
- Data target decision: local JSON file, managed database, or explicitly not
  approved for public traffic.

Blocking conditions:

- Staging URL is public without review-approved access controls.
- Health or manifest request fails.
- Artifact cannot be tied to the release-candidate commit.
- Environment proof exposes a secret.
- Persistence target is not identified.

## Ticket PG-003B: Staging Canary And Rollback

Gate: `GATE-003`
Owner: `TBD deployment owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: prove a staging canary room can be created, read after redeploy or
rollback, and evaluated against explicit rollback criteria.

Commands:

```bash
curl -fsS "$AIDM_STAGING_URL/api/health"
node scripts/smoke-flow.mjs --base-url "$AIDM_STAGING_URL"
curl -fsS "$AIDM_STAGING_URL/api/health"
```

Environment variables:

- `AIDM_STAGING_URL`
- `AIDM_STAGING_DEPLOYMENT_ID`
- `AIDM_STAGING_COMMIT`
- provider rollback command or dashboard action: `TBD`
- canary room ID: `TBD after execution`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-003-canary-before-rollback.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-003-rollback-action-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-003-canary-after-rollback.json`
- `docs/qa/gate-003-staging-deployment-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Canary room ID and timestamp.
- Before rollback or redeploy health result.
- Provider rollback or redeploy action with actor and timestamp.
- After rollback or redeploy health result.
- Canary read expectation and result.

Blocking conditions:

- Rollback owner is missing.
- Canary room is not readable when it should be preserved.
- Rollback command is undocumented or cannot be repeated.
- Staging store behavior is incompatible with expected canary persistence and no
  reviewer accepts the limitation.

## Ticket PG-004A: Monitoring And Alert Delivery

Gate: `GATE-004`
Owner: `TBD operations owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: configure monitoring and prove an alert reaches a named human responder.

Commands:

```bash
npm run ops:drill
node --test tests/operationsRecovery.test.js
node scripts/ops-drill.mjs monitoring-status
curl -fsS "$AIDM_MONITORING_URL"
curl -fsS "$AIDM_STAGING_URL/api/health"
```

Environment variables:

- `AIDM_MONITORING_URL`
- `AIDM_ALERT_WEBHOOK`
- `AIDM_STAGING_URL`
- primary responder: `TBD`
- backup responder: `TBD`
- escalation path: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-004-monitoring-status.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-004-alert-delivery-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-004-responder-roster-redacted.md`
- `docs/qa/gate-004-operations-recovery-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Synthetic check endpoint and expected schedule.
- Alert trigger method and delivery timestamp.
- Named primary responder, backup responder, and escalation route.
- Response target and severity mapping.

Blocking conditions:

- Monitoring URL or alert webhook is unset.
- Alert delivery cannot be proven.
- No named human owns response.
- Evidence includes a live webhook secret.

## Ticket PG-004B: Backup, Restore, And Rollback Drill

Gate: `GATE-004`
Owner: `TBD operations owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: verify backup, restore, retention, export/delete, and deployed rollback
smoke against an approved non-public target.

Commands:

```bash
npm run ops:drill
node scripts/ops-drill.mjs drill \
  --data-file /private/tmp/aidm-public-gates-2026-05-26/gate-004/store.json \
  --backup-dir /private/tmp/aidm-public-gates-2026-05-26/gate-004/backups \
  --export-dir /private/tmp/aidm-public-gates-2026-05-26/gate-004/exports \
  --report-file /private/tmp/aidm-public-gates-2026-05-26/gate-004/ops-drill-report.json
node scripts/smoke-flow.mjs --base-url "$AIDM_STAGING_URL"
```

Environment variables:

- `AIDM_STAGING_URL`
- `AIDM_STAGING_DATA_TARGET`
- approved backup target: `TBD`
- restore verification target: `TBD`
- retention schedule owner: `TBD`
- rollback owner: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-004/ops-drill-report.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-004/backup-restore-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-004/deployed-rollback-smoke.json`
- `docs/qa/gate-004-operations-recovery-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Backup checksum, restore checksum, and equality result.
- Export/delete/retention operation summary.
- Restore into non-public target.
- Deployed create, join, refresh, and canary read smoke after restore or
  rollback.
- Retention and recovery owner sign-off.

Blocking conditions:

- Backup target is repo-local or otherwise not approved.
- Restore is not verified.
- User export/delete workflow lacks legal/privacy owner review.
- Deployed rollback smoke fails.

## Ticket PG-005A: Identity, Session, And Secret Review

Gate: `GATE-005`
Owner: `TBD security owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: document production identity, session rotation, revocation, audit logging,
and secret rotation decisions.

Commands:

```bash
node --test tests/securityPrivacy.test.js
node --test tests/serverRoutes.test.js
node --test tests/publicReadinessGates.test.js
npm run harness:check
```

Environment variables:

- identity provider: `TBD`
- session lifetime: `TBD`
- audit log target: `TBD`
- secret owner: `TBD`
- rotation cadence: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-005-security-tests.tap`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-005-secret-review-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-005-session-policy.md`
- `docs/qa/gate-005-security-abuse-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Auth method decision and rejected alternatives.
- Session lifetime, rotation, revocation, recovery, and audit policy.
- Secret inventory with owners and rotation plan.
- Redaction proof for support exports, logs, snapshots, and incident artifacts.

Blocking conditions:

- No production identity decision exists.
- Session revocation or account recovery is undefined.
- Secret owner or rotation path is missing.
- Redaction proof exposes sensitive data.

## Ticket PG-005B: Abuse, Rate Limits, And Residual Risk

Gate: `GATE-005`
Owner: `TBD security owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: define and test abuse controls for auth, room creation, joins, AI calls,
mutations, and SSE connections.

Commands:

```bash
node --test tests/securityPrivacy.test.js tests/serverRoutes.test.js
node --test tests/browserAutomation.test.js tests/flowClosureExtended.test.js
curl -fsS "$AIDM_STAGING_URL/api/health"
```

Environment variables:

- `AIDM_STAGING_URL`
- auth rate limit: `TBD`
- room-create rate limit: `TBD`
- join rate limit: `TBD`
- AI-call rate limit: `TBD`
- SSE connection limit: `TBD`
- WAF or bot-control decision: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-005-abuse-drill-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-005-protected-route-negative-tests.tap`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-005-residual-risk-register.md`
- `docs/qa/gate-005-security-abuse-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Rate-limit matrix for protected surfaces.
- WAF, bot-control, or equivalent edge protection decision.
- Staging abuse drill for repeated login, join, room creation, mutation, AI call,
  and SSE connect attempts.
- Residual-risk table with severity, owner, mitigation, target date, acceptor,
  and expiration date.

Blocking conditions:

- Any public write or read surface lacks an abuse-control decision.
- Residual risks have no owner or acceptance date.
- Staging negative checks expose room data to unauthenticated, pending, rejected,
  wrong-token, or stale-version requests.

## Ticket PG-006A: Source, License, And Attribution Review

Gate: `GATE-006`
Owner: `TBD legal/privacy owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: complete source inventory and allowed-use review for rules, settings,
generated text, art, audio, names, code snippets, fonts, and datasets.

Commands:

```bash
rg -n "DND|SRD|Open Game License|Creative Commons|license|attribution|privacy|cookie|analytics" docs src public assets tests
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```

Environment variables:

- legal reviewer: `TBD`
- source registry owner: `TBD`
- attribution owner: `TBD`
- protected-term reviewer: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-006-source-registry-redacted.csv`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-006-attribution-plan.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-006-protected-term-exclusions.md`
- `docs/qa/gate-006-legal-privacy-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Source URL or file path for every product-visible external source.
- License text, allowed product surfaces, attribution text, and prohibited terms.
- Generated content and asset-description review.
- Legal reviewer name, decision date, approval scope, and renewal condition.

Blocking conditions:

- Any visible source lacks license or allowed-use scope.
- Protected identity terms are used without approval.
- Attribution plan is missing.
- Legal reviewer is missing.

## Ticket PG-006B: Privacy, Retention, Export, Delete, And Consent

Gate: `GATE-006`
Owner: `TBD legal/privacy owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: define privacy requirements and user-data operations for account email,
display name, room state, player state, transcript, localStorage, AI-provider
calls, support exports, cookies, analytics, and consent.

Commands:

```bash
node --test tests/securityPrivacy.test.js
node scripts/ops-drill.mjs export-user \
  --data-file /private/tmp/aidm-public-gates-2026-05-26/gate-006/store.json \
  --export-dir /private/tmp/aidm-public-gates-2026-05-26/gate-006/exports \
  --user-id user_gate_006
node scripts/ops-drill.mjs delete-user \
  --data-file /private/tmp/aidm-public-gates-2026-05-26/gate-006/store.json \
  --user-id user_gate_006
```

Environment variables:

- privacy reviewer: `TBD`
- retention owner: `TBD`
- export/delete owner: `TBD`
- cookie/analytics decision owner: `TBD`
- AI-provider data-flow owner: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-006-privacy-worksheet-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-006-data-flow-map.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-006-export-delete-drill-redacted.md`
- `docs/qa/gate-006-legal-privacy-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Data-flow map for hosted use.
- Privacy policy requirements.
- Retention schedule and owner.
- Export/delete workflow and owner.
- Cookie, localStorage, analytics, AI-provider, and consent decisions.
- User-facing limitation copy for AI narration, data durability, audio, and
  prototype boundaries.

Blocking conditions:

- No approved retention schedule exists.
- Export/delete workflow is unreviewed.
- AI-provider data flow is undefined.
- Cookie, localStorage, analytics, or consent decision is missing.

## Ticket PG-007A: Staging Load And Reliability

Gate: `GATE-007`
Owner: `TBD reliability owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: repeat local load smoke on the release candidate and run staging or
production-like load smoke with explicit thresholds.

Commands:

```bash
npm run load:smoke
node --test tests/loadReliability.test.js
node scripts/load-smoke.mjs --rooms "${AIDM_LOAD_ROOMS:-4}" --sse-clients-per-room "${AIDM_LOAD_SSE_PER_ROOM:-3}"
node scripts/load-smoke.mjs --base-url "$AIDM_STAGING_URL" --rooms "${AIDM_LOAD_ROOMS:-4}" --sse-clients-per-room "${AIDM_LOAD_SSE_PER_ROOM:-3}"
```

Environment variables:

- `AIDM_STAGING_URL`
- `AIDM_LOAD_ROOMS`
- `AIDM_LOAD_SSE_PER_ROOM`
- API p95 threshold: `TBD`
- SSE initial p95 threshold: `TBD`
- SSE broadcast p95 threshold: `TBD`
- error-rate threshold: `0 unless review changes it`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-007-local-load-smoke-runs.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-007-staging-load-smoke.json`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-007-latency-summary.md`
- `docs/qa/gate-007-load-reliability-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Three release-candidate local runs.
- One staging run, then more if thresholds are tuned.
- p95 API, SSE connect, initial snapshot, broadcast latency, and error rate.
- Room IDs, commit, environment, data-store target, and operator.
- Confirmation that room data did not duplicate, leak, or get stuck.

Blocking conditions:

- Staging load run is missing.
- Error rate exceeds threshold.
- API or SSE p95 exceeds accepted thresholds.
- Data-store target or multi-instance behavior is undefined.

## Ticket PG-007B: Rollback Thresholds And Reliability Limits

Gate: `GATE-007`
Owner: `TBD reliability owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: define canary expansion, degradation policy, rollback owner, and reliability
limits for the current architecture.

Commands:

```bash
npm run harness:status
node --test tests/loadReliability.test.js tests/publicReadinessGates.test.js
```

Environment variables:

- rollback owner: `TBD`
- rollback command: `TBD`
- canary expansion owner: `TBD`
- persistence decision owner: `TBD`
- multi-instance decision owner: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-007-rollback-thresholds.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-007-architecture-limits.md`
- `docs/qa/gate-007-load-reliability-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Halt threshold and rollback threshold.
- Canary expansion criteria.
- Accepted JSON-store and in-memory SSE fanout limits, or migration requirement.
- Owner acceptance for public traffic level.

Blocking conditions:

- No rollback owner or command exists.
- No accepted traffic target exists.
- JSON store and in-memory SSE limits are not accepted or mitigated.

## Ticket PG-008A: Support Intake And Triage Drill

Gate: `GATE-008`
Owner: `TBD support owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: create a live private beta intake channel and prove a test issue can be
received, labeled, assigned, handled, and closed.

Commands:

```bash
npm run harness:status
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
curl -fsS "$AIDM_SUPPORT_INTAKE_URL"
```

Environment variables:

- `AIDM_SUPPORT_INTAKE_URL`
- primary support owner: `TBD`
- backup support owner: `TBD`
- coverage window: `TBD`
- severity definitions owner: `TBD`
- escalation engineer for auth/room-state: `TBD`
- escalation engineer for deployment/rollback: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-intake-proof-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-support-drill-redacted.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-triage-labels.md`
- `docs/qa/gate-008-support-launch-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Intake URL or private channel proof.
- Test issue ID, label, severity, assignee, response, and closure.
- Coverage window, response targets, and escalation SLA.
- Redacted evidence attachment procedure.

Blocking conditions:

- No live intake exists.
- No primary or backup owner exists.
- Test issue cannot be routed and closed.
- Security/privacy issues can be exposed publicly by the intake workflow.

## Ticket PG-008B: Launch Sign-Off And Communications

Gate: `GATE-008`
Owner: `TBD launch owner`
Backup owner: `TBD`
Reviewer: `TBD Harness reviewer`
Priority: P0 public launch blocker

Goal: publish known limitations, incident templates, beta communications, and
collect final owner sign-off.

Commands:

```bash
npm run harness:status
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```

Environment variables:

- product sign-off owner: `TBD`
- engineering sign-off owner: `TBD`
- operations sign-off owner: `TBD`
- security/privacy sign-off owner: `TBD`
- legal/privacy sign-off owner: `TBD`
- support sign-off owner: `TBD`

Output files:

- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-known-limitations.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-incident-templates.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-beta-communications.md`
- `/private/tmp/aidm-public-gates-2026-05-26/gate-008-signoff-register.md`
- `docs/qa/gate-008-support-launch-evidence-YYYY-MM-DD.md`

Acceptance evidence to gather:

- Known limitations for data durability, auth hardening, rate limits,
  monitoring, privacy/legal, audio, AI narration, load limits, and support.
- Incident templates for outage, data issue, auth issue, security/privacy report,
  and rollback.
- Beta user communications and response expectations.
- Product, engineering, operations, security/privacy, legal/privacy, and support
  sign-off.

Blocking conditions:

- Any required sign-off owner is missing.
- Known limitations are unpublished.
- Security/privacy or legal/privacy gate remains blocked without explicit launch
  deferral decision.
- Incident communication path is not defined.

## Recommended Parallel Assignment

| Worker | Tickets | Notes |
| --- | --- | --- |
| Worker 1 | `PG-003A`, `PG-003B` | Deployment/staging owner; depends on provider access. |
| Worker 2 | `PG-004A`, `PG-004B` | Operations owner; depends on monitoring and backup decisions. |
| Worker 3 | `PG-005A`, `PG-005B` | Security owner; depends on identity and abuse-control decisions. |
| Worker 4 | `PG-006A`, `PG-006B` | Legal/privacy owner; depends on human review. |
| Worker 5 | `PG-007A`, `PG-007B`, `PG-008A`, `PG-008B` | Reliability/support owner; may split if staging access is available. |

## Remaining P0 After This Plan

- `GATE-003`: no real private staging deployment, canary, rollback, provider
  artifact, redacted environment profile, or persistence decision is approved.
- `GATE-004`: no real monitoring, alert delivery, production backup target,
  non-public restore proof, deployed rollback smoke, or named responder roster is
  approved.
- `GATE-005`: no production identity decision, distributed rate-limit matrix,
  WAF/bot-control decision, secret rotation owner, audit policy, staging abuse
  drill, or residual-risk acceptance is approved.
- `GATE-006`: no completed source/license/IP registry, attribution plan,
  privacy policy requirements, retention/export/delete approval, consent/cookie
  decision, or legal/privacy sign-off is approved.
- `GATE-007`: no staging load run, canary thresholds, rollback owner, accepted
  traffic target, or architecture limit acceptance is approved.
- `GATE-008`: no live support intake, named support coverage, support drill,
  incident communication templates, beta communications, or cross-functional
  launch sign-off is approved.

## Verification For This Plan

Recommended commands after editing:

```bash
git diff --check -- docs/qa/public-gate-next-execution-plan-2026-05-26.md
node --test tests/publicReadinessGates.test.js
```
