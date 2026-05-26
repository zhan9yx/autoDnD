# Tasks

This task list belongs to Worker F for 0014 QA/Harness coordination. It records documentation and acceptance-design work only.

## Harness Package

- [x] Read `.harness/changes/0013-public-productization/*` before writing the 0014 package.
- [x] Read current `docs/qa/0013-*.md` evidence before writing the 0014 package.
- [x] Create `.harness/changes/0014-continuous-product-depth/spec.md`.
- [x] Create `.harness/changes/0014-continuous-product-depth/tasks.md`.
- [x] Create `.harness/changes/0014-continuous-product-depth/review.md`.
- [x] Create `.harness/changes/0014-continuous-product-depth/test-report.md`.
- [x] Keep this pass documentation-only and avoid `public/`, `src/`, and `docs/REQUIREMENTS_200.md`.

## Acceptance Design

- [x] Create a 0014 acceptance checklist for situation page, log density, party rail, multiplayer, scene changes, environment audio, spells/classes, market/backpack, login/room permissions, turn guidance, and complete flow closure.
- [x] Create browser QA steps for create room, login refresh, password room, approval room, joining players, action turns, scene switching, market/backpack, state drawer, and audio settings.
- [x] Mark 0013 protected-room browser recheck evidence as a useful input without treating it as full public-launch evidence.
- [x] Record that bugfixes are not counted as new requirements and that `REQ-001` through `REQ-400` remains the active requirement ledger.

## Documentation Sync

- [x] Update roadmap status with the 0014 acceptance layer and remaining launch prerequisites.
- [x] Update readiness gap and maturity docs so stale MVP-era gaps do not hide the current public-launch blockers.
- [x] Update bug tracker with the 0014 acceptance-evidence gap.
- [x] Update README and user guide to point to the current QA and local-prototype access-control boundary.

## Verification

- [x] Run focused requirements and maturity tests.
- [x] Run full `npm run harness:check` in this pass if localhost sandbox permissions allow it.
  Evidence: Faraday/final-gate observation recorded default-sandbox localhost `EPERM`, then a localhost-capable `npm run harness:check` pass ending with `harness check ok`; see `docs/qa/0014-final-gate-observation.md` and `docs/qa/0014-final-evidence.md`.
- [x] If default sandbox blocks localhost-backed tests, record the exact limitation in `test-report.md`.
- [x] Check Git status and leave no scratch files, generated assets, or runtime artifacts in the worktree.

## Still Open After This Change

- [ ] Execute the 0014 browser QA plan on a fresh local data file and attach screenshots or reports.
  Evidence reviewed by Worker AA: `docs/qa/0014-mobile-layout-browser.md` used fresh local data and attached responsive screenshots, and `docs/qa/0014-browser-current.md` / `docs/qa/0014-browser-regression-after-smallfixes.md` cover useful desktop and Market/scene slices. This remains unchecked because protected-room wrong/correct password and host-approval browser loops, multi-context join, full market use/equip/sell, refresh recovery, and audio persistence were not all executed as the full QA plan.
  Remaining-boundary attempt: `docs/qa/0014-non-auth-combined-browser-attempt.md` records a non-auth combined browser runner attempt that failed on local Chrome/CDP instability before a complete evidence pack. This does not close the task.
- [ ] Run desktop and mobile visual checks for the entire acceptance checklist after the next runtime/UI change.
  Evidence reviewed by Worker AA and updated after Worker Z: current desktop and responsive screenshots exist, and the known 375 px P1 issues are fixed by a focused 375x667 smoke pass. Keep unchecked because the full desktop/mobile acceptance checklist has not been rerun after the latest UI fixes.
  Remaining-boundary attempt: not closed for the same reason; no complete desktop/mobile visual report was produced.
- [ ] Convert any recurring browser QA script from this plan into committed automated coverage in a later code/test change.
- [ ] Complete deployment, operations, security, legal, load, and support gates before any public-readiness claim.
