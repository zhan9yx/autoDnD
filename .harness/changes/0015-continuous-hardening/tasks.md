# Tasks

## Harness Package

- [x] Read 0014 Harness package and current readiness docs.
- [x] Create `.harness/changes/0015-continuous-hardening/spec.md`.
- [x] Create `.harness/changes/0015-continuous-hardening/review.md`.
- [x] Create `.harness/changes/0015-continuous-hardening/tasks.md`.
- [x] Create `.harness/changes/0015-continuous-hardening/test-report.md`.

## Gate Definition

- [x] Add `docs/RELEASE_GATES.md` with fail-closed public-readiness gate IDs.
- [x] Add `docs/qa/0015-public-readiness-gates.md` with the current gate decision and verification commands.
- [x] Update readiness status docs to link 0015 gate boundaries.
- [x] Track the missing executable public-readiness gates in `docs/BUGS.md`.

## Tests

- [x] Add focused public-readiness gate assertions.
- [x] Verify required gate docs exist.
- [x] Verify blocked public gates cannot be marked as passed in this change.
- [x] Avoid browser automation overlap during the initial gate-definition pass.

## Worker Evidence Coordination

- [x] Index Worker I release-evidence matrix without marking any public-readiness gate passed.
- [x] Index Worker C browser-automation evidence as committed Node coverage, not a full visual/device acceptance pack.
- [x] Index Worker A fresh-browser evidence as partial acceptance with refresh recovery failing.
- [x] Index Worker H integration preflight as point-in-time evidence, not a final merge gate.
- [x] Index Worker B visual checklist evidence without marking consolidated browser acceptance or public readiness complete.
- [x] Index Worker J refresh-recovery fix evidence as local `?room=<id>` P1 fixed-awaiting-browser-recheck, without closing broader public `GATE-002`.
- [x] Index Worker D 0013 auth/access protected-room browser evidence as local `GATE-002` input only, without closing consolidated browser acceptance or public readiness.
- [x] Index 0013 public-productization worker evidence for host rejection click-through, foreground audio controls, and minimum spell/warrior browser flow as local `GATE-002` input only.
- [x] Attach 0015 consolidated desktop/mobile browser acceptance evidence as a local `GATE-002` evidence pack, without marking public readiness passed.

## Closed In This Worker

- [x] Execute and attach the full 0014/0015 consolidated browser acceptance pack with desktop/mobile screenshots, isolated local data, password-room flow, host-approval flow, refresh recovery, browser log notes, and secret-safety assertions.

## Public Readiness Still Open After This Change

- [ ] Implement production deployment and staging parity evidence.
- [ ] Implement operations evidence: monitoring, alerting, backup/restore, rollback, incident response, and support handoff.
- [ ] Implement production security evidence: identity provider, session rotation, abuse controls, rate limits, secret review, and residual-risk acceptance.
- [ ] Implement privacy/legal evidence: retention, deletion/export, source/license/IP review, consent/cookie position, and user-facing limitations.
- [ ] Implement load/reliability evidence for target concurrent rooms and SSE clients.
- [ ] Implement support and launch evidence: triage workflow, known limitations, support ownership, canary, and release evidence index.
