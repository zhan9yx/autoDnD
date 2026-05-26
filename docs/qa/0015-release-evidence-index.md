# 0015 Release Evidence Index

Date: 2026-05-25
Worker: I
Scope: evidence index for the 0015 continuous-hardening release gate package.

## Decision

This index improves traceability only. It does not approve public launch and does not mark any public-readiness gate complete.

Every gate in `docs/RELEASE_GATES.md` remains blocked because the public-readiness evidence set is incomplete. The current fresh-browser evidence is useful local acceptance evidence, and the original refresh-recovery P1 has been fixed/rechecked by Worker J. The browser automation evidence is committed Node test coverage, not a full visual/device browser acceptance pack.

## Source Documents

- `.harness/changes/0015-continuous-hardening/spec.md`
- `.harness/changes/0015-continuous-hardening/review.md`
- `.harness/changes/0015-continuous-hardening/tasks.md`
- `.harness/changes/0015-continuous-hardening/test-report.md`
- `docs/RELEASE_GATES.md`
- `docs/qa/0015-public-readiness-gates.md`
- `docs/qa/0015-browser-automation.md`
- `docs/qa/0015-fresh-browser-acceptance.md`
- `docs/qa/0015-visual-checklist.md`
- `docs/qa/0015-consolidated-browser-acceptance.md`
- `docs/qa/0015-integration-preflight.md`
- `docs/qa/0015-consolidated-browser-gap.md`
- `docs/qa/0013-no-account-browser.md`
- `docs/qa/0013-room-auth.md`
- `docs/qa/0013-audio-browser.md`
- `docs/qa/0013-spell-warrior-browser.md`
- `docs/qa/0016-operations-recovery.md`
- `docs/qa/0016-load-support.md`

Visual checklist note: `docs/qa/0015-visual-checklist.md` exists and Worker B screenshot evidence is present under `/private/tmp/aidm-0015-worker-b-visual/`. This closes the missing visual-checklist artifact dependency only.

Consolidated browser note: `docs/qa/0015-consolidated-browser-acceptance.md` now records a local Chrome/CDP consolidated browser pass with 30 screenshots and 22 assertions under `/private/tmp/aidm-0015-consolidated-browser-final3/`. This attaches the missing local browser pack; public readiness remains blocked until Harness review accepts any gate-status change and the non-browser public gates are complete.

## Gate Evidence Matrix

| Gate ID | Domain | Current Evidence | Missing Evidence | Harness Task Mapping |
| --- | --- | --- | --- | --- |
| GATE-001 | Release evidence index | This file indexes current Harness, gate, automated-test, and browser evidence. `docs/RELEASE_GATES.md` defines the gate contract. | A release-candidate index with deployment, operations, security, legal/privacy, load, support, known-risk, and sign-off artifacts. | Still open task: "Implement support and launch evidence: triage workflow, known limitations, support ownership, canary, and release evidence index." |
| GATE-002 | Consolidated browser acceptance | `docs/qa/0015-browser-automation.md` records committed Node test coverage. `docs/qa/0015-fresh-browser-acceptance.md` records a fresh visible-browser run and Worker J's refresh fix/recheck. `docs/qa/0015-visual-checklist.md` records Worker B visual screenshots. `docs/qa/0013-no-account-browser.md`, `docs/qa/0013-room-auth.md`, `docs/qa/0013-audio-browser.md`, and `docs/qa/0013-spell-warrior-browser.md` record supporting local browser inputs. `docs/qa/0015-consolidated-browser-acceptance.md` records the 2026-05-25 local consolidated browser pass with open/password/host-approval rooms, desktop/mobile screenshots, chat/action, state/log/replay, market/backpack, audio settings, refresh recovery, and secret-safety checks. | Harness review has not changed the fail-closed public gate status. The local browser pack exists, but the release-candidate index and non-browser public readiness gates are still incomplete. | Local browser-pack task closed; public `GATE-002` status remains blocked pending Harness review and full public-readiness convergence. |
| GATE-003 | Deployment and staging parity | `docs/RELEASE_GATES.md` names required deployment evidence. No deployment artifact is recorded. | Production-like deployment artifact, staging parity checklist, environment profile, secret validation, health check, canary plan, and rollback smoke result. | Still open task: "Implement production deployment and staging parity evidence." |
| GATE-004 | Operations and data recovery | `docs/qa/0016-operations-recovery.md` records a local `/private/tmp` backup/restore drill, retention/export/delete operations, incident/rollback checklist, and fail-closed monitoring placeholders. | Production monitoring, alert delivery, responder ownership, production backup storage, deployed rollback smoke, reviewed user-data operations, and support handoff. | 0016 local evidence added; public gate remains blocked for production operations evidence. |
| GATE-005 | Security and abuse controls | `docs/SECURITY.md` references the blocked security gate. `docs/qa/0015-browser-automation.md` includes secret-safety snapshot checks for local flow coverage. | Production identity provider review, session rotation policy, rate limits, abuse throttling, secret handling review, redaction proof, and residual-risk acceptance. | Still open task: "Implement production security evidence: identity provider, session rotation, abuse controls, rate limits, secret review, and residual-risk acceptance." |
| GATE-006 | Legal and privacy | `docs/RELEASE_GATES.md` names required legal/privacy evidence. No legal/privacy artifact is recorded, and no external rules source is approved for product retrieval. | Source registry, license/IP review, attribution plan, external-rules allowed-use scope, excluded protected identity terms, privacy requirements, deletion/export workflow, retention schedule, consent/cookie position, user-facing limitation copy, and legal review evidence. | Still open task: "Implement privacy/legal evidence: retention, deletion/export, source/license/IP review, consent/cookie position, and user-facing limitations." |
| GATE-007 | Load and reliability | `docs/qa/0016-load-support.md` and `npm run load:smoke` define partial local evidence for 4 rooms and 12 SSE clients by default. | Repeated release-candidate evidence, staging/prod-like evidence, assigned rollback owner, and final acceptance. | Still open task: "Implement load/reliability evidence for target concurrent rooms and SSE clients." |
| GATE-008 | Support and launch operations | `docs/qa/0016-load-support.md` records support owner placeholders, feedback triage workflow, known limitations, incident template, canary checklist, and public issue intake plan. | Named support owners, live public intake, beta communications, escalation path, support coverage commitment, and sign-off. | Still open task: "Implement support and launch evidence: triage workflow, known limitations, support ownership, canary, and release evidence index." |

## Completed Evidence In This Index

- 0015 Harness package exists and defines the public-readiness gate boundary.
- `docs/RELEASE_GATES.md` lists `GATE-001` through `GATE-008` as blocked.
- `docs/qa/0015-public-readiness-gates.md` records the blocked current decision and verification commands.
- `docs/qa/0015-browser-automation.md` records committed browser-contract test coverage via `npm run test:browser-qa`.
- `docs/qa/0015-fresh-browser-acceptance.md` records visible browser screenshots, preserves the original Worker A refresh-recovery failure, and records Worker J's fixed/rechecked local refresh P1 evidence.
- `docs/qa/0015-visual-checklist.md` exists and Worker B screenshots cover desktop, tablet, `<=430px` mobile, and 375px mobile visual checks under `/private/tmp/aidm-0015-worker-b-visual/`.
- `docs/qa/0015-consolidated-browser-acceptance.md` records the missing local consolidated desktop/mobile browser pack with 30 screenshot paths and 22 assertions under `/private/tmp/aidm-0015-consolidated-browser-final3/`.
- `docs/qa/0015-integration-preflight.md` records a point-in-time preflight; final convergence still needs a rerun after active workers stop writing.
- `docs/qa/0015-consolidated-browser-gap.md` records the remaining `GATE-002` consolidated browser evidence gap after the local refresh P1 fix/recheck and visual checklist indexing.
- `docs/qa/0013-no-account-browser.md` records Worker H's local no-account desktop/mobile browser smoke for homepage, open-room creation, guest join, scene start, action submit, My character, State, Full log, Settings, and Market. This is useful `GATE-002` input only.
- `docs/qa/0013-room-auth.md`, `docs/qa/0013-audio-browser.md`, and `docs/qa/0013-spell-warrior-browser.md` record the 0013 public-productization worker's local host-rejection click-through, foreground audio control, and minimum spell/warrior browser evidence. These are useful `GATE-002` inputs only.
- Worker M documentation review added minimum user-guide coverage for AI DM bounded randomness, player action prompts, weather/season pressure, spell roles, and warrior advancement cues.
- Worker D-0016 added local operations recovery evidence in `docs/qa/0016-operations-recovery.md`; this improves `GATE-004` traceability but does not close production operations.
- Worker F-0016 added a local load/reliability smoke and support/launch operations plan in `docs/qa/0016-load-support.md`; `GATE-007` and `GATE-008` remain blocked.

## Blocking Gaps

- No gate has a complete public-release evidence set.
- Consolidated browser acceptance now has a local desktop/mobile pack attached, but the public `GATE-002` row remains fail-closed until Harness review accepts the evidence as a gate-status change. Worker H's no-account desktop/mobile smoke and the 0013 public-productization worker's host-rejection/audio/spell-warrior evidence remain indexed as local supporting evidence.
- Deployment, security, and legal/privacy evidence are definition-only in this change; operations has local 0016 drill evidence only, and load/support have partial local 0016 evidence but still lack release-candidate/staging proof, named owners, live intake, and sign-off. Legal/privacy definition-only status means there is no source registry, attribution approval, external-rules approval, or legal clearance.
- Worker B visual checklist evidence is indexed, but it is not a public-readiness approval and does not replace the full consolidated browser acceptance pack.
- Refresh recovery P1 is fixed/rechecked by Worker J for the local fresh-browser `?room=<id>` path and included in the consolidated browser pack through open-room, password-room, and approved-player refresh screenshots.

## Verification Commands

Run after editing this index:

```bash
npm run harness:status
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```

Worker M focused verification:

```bash
node --test tests/rules.test.js tests/stateSummary.test.js tests/soundscape.test.js tests/req261RuntimeEnhancements.test.js
node --test tests/guide.test.js tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```
