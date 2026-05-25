# 0015 Open Items Matrix

Date: 2026-05-25
Worker: R
Last aligned by: Worker V
Scope: waiting-item tracking after Worker N visual evidence indexing and Worker J refresh-recovery evidence.

## Current Decision

0015 remains blocked for public readiness. The current task snapshot is 19/26 complete from `npm run harness:status` after the Worker R matrix pass, with open work concentrated in consolidated browser acceptance, public-readiness evidence, and final convergence testing.

Worker J has added refresh-recovery fix evidence in `docs/qa/0015-fresh-browser-acceptance.md`, including focused tests and a visible browser smoke pass. Treat the local refresh P1 as fixed but awaiting consolidated browser recheck. It still needs to be included in the final desktop/mobile browser acceptance pack before `GATE-002` can pass.

## Open Items

| Item | Status | Blocking Evidence Needed | Source / Owner Track |
| --- | --- | --- | --- |
| Refresh recovery P1 from `?room=<id>` | fixed-awaiting-browser-recheck | Include refresh recovery in the consolidated desktop/mobile browser acceptance pack. | Worker J appendix in `docs/qa/0015-fresh-browser-acceptance.md`; final browser acceptance track. |
| `GATE-001` release-candidate evidence index | blocked | Release-candidate index that includes deployment, operations, security, legal/privacy, load, support, known-risk, and sign-off artifacts. | `docs/qa/0015-release-evidence-index.md`; public-readiness track. |
| `GATE-002` consolidated browser acceptance | blocked | Full 0014 consolidated browser acceptance pack with desktop and mobile evidence, including refresh recovery, market/backpack, protected/access flows, and no unresolved visible-browser blockers. | `docs/qa/0015-release-evidence-index.md`; `docs/qa/0014-browser-qa-plan.md`; BUG-0012. |
| `GATE-003` deployment and staging parity | blocked | Production-like deployment artifact, staging parity checklist, environment profile, secret validation, health check, canary plan, and rollback smoke result. | `docs/RELEASE_GATES.md`; public-readiness track. |
| `GATE-004` operations and data recovery | blocked | 0016 adds local temp-file backup/restore, retention/export/delete, incident checklist, and fail-closed placeholders. Still missing production monitoring, alert delivery, responder ownership, production backup storage, deployed rollback smoke, reviewed user-data operations, and support handoff evidence. | `docs/RELEASE_GATES.md`; `docs/OPERATIONS.md`; `docs/qa/0016-operations-recovery.md`; public-readiness track. |
| `GATE-005` security and abuse controls | blocked | Production identity-provider review, session-rotation policy, rate limits, abuse throttling, secret handling review, redaction proof, and residual-risk acceptance. | `docs/RELEASE_GATES.md`; `docs/SECURITY.md`; public-readiness track. |
| `GATE-006` legal and privacy | blocked | Source/license/IP review, privacy requirements, deletion/export workflow, retention schedule, consent/cookie position, and user-facing limitation copy. | `docs/RELEASE_GATES.md`; public-readiness track. |
| `GATE-007` load and reliability | blocked | Target concurrent rooms/SSE clients, repeatable load command, result artifact, latency/error thresholds, degradation policy, and rollback threshold. | `docs/RELEASE_GATES.md`; public-readiness track. |
| `GATE-008` support and launch operations | blocked | Support owner, feedback triage workflow, known limitations, incident templates, beta communications, escalation path, public issue intake, and sign-off. | `docs/RELEASE_GATES.md`; public-readiness track. |
| BUG-0012 consolidated 0014 browser evidence | open | One reviewable browser pack that proves the full 0014 plan on isolated local data with screenshots or a machine-readable report. | `docs/BUGS.md`; browser acceptance track. |
| BUG-0013 public-readiness gates | open | All `GATE-001` through `GATE-008` have evidence, passing commands or drills where applicable, and Harness review approval. | `docs/BUGS.md`; public-readiness track. |
| Final integration convergence | waiting-final-full-test | Re-run the selected/full gate after active parallel workers stop writing, then update the canonical task count and test totals. | `docs/qa/0015-integration-preflight.md`; `.harness/changes/0015-continuous-hardening/test-report.md`. |

## Non-Blocking Evidence Already Indexed

- Worker B visual checklist evidence is indexed in `docs/qa/0015-visual-checklist.md` and in `docs/qa/0015-release-evidence-index.md`.
- Worker C browser automation evidence is useful committed Node coverage, but it is not a full visual/device acceptance pack.
- Worker H integration preflight is point-in-time evidence only; it explicitly calls for a final rerun after concurrent edits settle.
- Worker M/O documentation consistency checks improve guide and roadmap alignment without closing public-readiness gates.
- Worker W consolidated-browser-gap review confirms no additional 0015 task should close without a complete desktop/mobile browser acceptance pack.
- Worker D-0016 operations recovery evidence is local and temp-file-only; it reduces `GATE-004` evidence gaps but does not pass public operations.

## Verification Scope For This Matrix

This document is a tracking artifact only. It does not modify code, public UI, release-gate status, or BUG status.

Run after editing:

```bash
npm run harness:status
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```
