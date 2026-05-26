# 0015 Open Items Matrix

Date: 2026-05-25
Worker: R
Last aligned by: 0015 continuous-hardening worker
Scope: waiting-item tracking after Worker N visual evidence indexing, Worker J refresh-recovery evidence, and the 0015 consolidated browser acceptance pass.

## Current Decision

0015 remains blocked for public readiness. The current task snapshot advances the local consolidated browser evidence item to complete; open work is now concentrated in public-readiness evidence and final convergence testing.

Worker J has added refresh-recovery fix evidence in `docs/qa/0015-fresh-browser-acceptance.md`, including focused tests and a visible browser smoke pass. The 0015 consolidated browser pass now includes refresh recovery in the local browser pack.

## Open Items

| Item | Status | Blocking Evidence Needed | Source / Owner Track |
| --- | --- | --- | --- |
| Refresh recovery P1 from `?room=<id>` | fixed-rechecked-in-consolidated-pack | Included in the 0015 consolidated desktop/mobile browser acceptance pack. | Worker J appendix in `docs/qa/0015-fresh-browser-acceptance.md`; `docs/qa/0015-consolidated-browser-acceptance.md`. |
| `GATE-001` release-candidate evidence index | blocked | Release-candidate index that includes deployment, operations, security, legal/privacy, load, support, known-risk, and sign-off artifacts. | `docs/qa/0015-release-evidence-index.md`; public-readiness track. |
| `GATE-002` consolidated browser acceptance | blocked with local pack attached | Harness review has not changed the fail-closed public gate status. Local evidence exists with desktop/mobile screenshots, refresh recovery, market/backpack, protected/access flows, browser log notes, and no unresolved visible-browser blockers. | `docs/qa/0015-consolidated-browser-acceptance.md`; `docs/qa/0015-release-evidence-index.md`; `docs/qa/0014-browser-qa-plan.md`. |
| `GATE-003` deployment and staging parity | blocked | Production-like deployment artifact, staging parity checklist, environment profile, secret validation, health check, canary plan, and rollback smoke result. | `docs/RELEASE_GATES.md`; public-readiness track. |
| `GATE-004` operations and data recovery | blocked | 0016 adds local temp-file backup/restore, retention/export/delete, incident checklist, and fail-closed placeholders. Still missing production monitoring, alert delivery, responder ownership, production backup storage, deployed rollback smoke, reviewed user-data operations, and support handoff evidence. | `docs/RELEASE_GATES.md`; `docs/OPERATIONS.md`; `docs/qa/0016-operations-recovery.md`; public-readiness track. |
| `GATE-005` security and abuse controls | blocked | Production identity-provider review, session-rotation policy, rate limits, abuse throttling, secret handling review, redaction proof, and residual-risk acceptance. | `docs/RELEASE_GATES.md`; `docs/SECURITY.md`; public-readiness track. |
| `GATE-006` legal and privacy | blocked | Source/license/IP review, privacy requirements, deletion/export workflow, retention schedule, consent/cookie position, and user-facing limitation copy. | `docs/RELEASE_GATES.md`; public-readiness track. |
| `GATE-007` load and reliability | blocked | Target concurrent rooms/SSE clients, repeatable load command, result artifact, latency/error thresholds, degradation policy, and rollback threshold. | `docs/RELEASE_GATES.md`; public-readiness track. |
| `GATE-008` support and launch operations | blocked | Support owner, feedback triage workflow, known limitations, incident templates, beta communications, escalation path, public issue intake, and sign-off. | `docs/RELEASE_GATES.md`; public-readiness track. |
| BUG-0012 consolidated 0014 browser evidence | fixed-local-evidence-attached | Reviewable browser pack exists on isolated local data with screenshots and a machine-readable report. | `docs/BUGS.md`; `docs/qa/0015-consolidated-browser-acceptance.md`. |
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
