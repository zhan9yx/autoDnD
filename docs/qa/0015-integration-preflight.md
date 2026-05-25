# 0015 Integration Preflight

Worker: H
Scope: parallel-change integration preflight and low-risk guardrail repair.
Date: 2026-05-25

## Summary

No current syntax, lint, whitespace, or focused test failure blocks integration. The worktree is still moving because multiple workers are active, so this is a point-in-time preflight, not a final merge gate.

Two small mechanical issues were fixed:

- `tests/publicReadinessGates.test.js` now treats `docs/qa/0015-release-evidence-index.md` as a required 0015 gate artifact because the 0015 report and QA docs already reference it.
- `tests/staticUiStructure.test.js` now verifies every public UI i18n key referenced by `public/index.html` and `public/app.js` resolves in both English and Chinese.

## Current Worktree Shape

Latest `git status --short` shows parallel edits across docs, public UI, core rules/state/server files, and tests. Notable untracked 0015 artifacts:

- `.harness/changes/0015-continuous-hardening/`
- `docs/RELEASE_GATES.md`
- `docs/SECURITY.md`
- `docs/qa/0015-browser-automation.md`
- `docs/qa/0015-fresh-browser-acceptance.md`
- `docs/qa/0015-integration-preflight.md`
- `docs/qa/0015-open-items-matrix.md`
- `docs/qa/0015-public-readiness-gates.md`
- `docs/qa/0015-release-evidence-index.md`
- `docs/qa/0015-visual-checklist.md`
- `tests/browserAutomation.test.js`
- `tests/publicReadinessGates.test.js`

Latest `git diff --stat` reported 27 tracked files changed, with the largest active surfaces in `src/core/rules.js`, `public/app.js`, `src/core/stateSummary.js`, `tests/staticUiStructure.test.js`, and related tests. Untracked files are not included in that stat.

`git diff --check` passed with no whitespace errors.

## Harness Status

`0015-continuous-hardening` has the required Harness files:

- `.harness/changes/0015-continuous-hardening/spec.md`
- `.harness/changes/0015-continuous-hardening/review.md`
- `.harness/changes/0015-continuous-hardening/tasks.md`
- `.harness/changes/0015-continuous-hardening/test-report.md`

`npm run harness:status` passed and reported `0015-continuous-hardening: 13/20 tasks complete`. The 7 remaining tasks are public-readiness evidence gates and should remain owned by the Harness/public-readiness track, not by integration preflight.

## Checks Run

```bash
git status --short
git diff --stat
git diff --check
node --check src/core/rules.js src/core/knowledgeBriefs.js src/core/soundscape.js src/core/stateMachine.js src/core/stateSummary.js src/server/server.js tests/browserAutomation.test.js tests/publicReadinessGates.test.js tests/rules.test.js tests/serverRoutes.test.js tests/soundscape.test.js tests/stateMachine.test.js tests/stateSummary.test.js tests/req261RuntimeEnhancements.test.js
npm run lint
npm run test:browser-qa
node --test tests/publicReadinessGates.test.js tests/rules.test.js tests/serverRoutes.test.js tests/soundscape.test.js tests/stateMachine.test.js tests/stateSummary.test.js tests/req261RuntimeEnhancements.test.js
npm run harness:status
node --check public/app.js public/i18n.js tests/noScrollUi.test.js tests/publicReadinessGates.test.js
node --test tests/noScrollUi.test.js tests/publicReadinessGates.test.js
node --test tests/publicReadinessGates.test.js
node --check src/core/logTemplates.js tests/flowClosureExtended.test.js tests/logTemplates.test.js tests/staticUiStructure.test.js public/app.js public/i18n.js
node --test tests/flowClosureExtended.test.js tests/logTemplates.test.js tests/staticUiStructure.test.js
node --check tests/staticUiStructure.test.js public/app.js public/i18n.js tests/noScrollUi.test.js tests/browserAutomation.test.js
node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/browserAutomation.test.js
```

Results:

- Syntax checks passed.
- `npm run lint` passed after the latest public UI changes: `lint ok: 81 JavaScript files checked`.
- `npm run test:browser-qa` failed inside the default sandbox with `listen EPERM: operation not permitted 127.0.0.1`, then passed when rerun with localhost binding permission: 2 tests passed.
- Related core/server/rules/soundscape/state tests passed: 64 tests passed.
- Latest no-scroll and 0015 public-readiness focused tests passed: 6 tests passed.
- Focused rerun after the test guardrail repair passed: 3 tests passed.
- Event-flow, structured-log, and static UI tests passed: 15 tests passed.
- Worker K/J frontend overlap checks passed: syntax passed; `tests/staticUiStructure.test.js`, `tests/noScrollUi.test.js`, and `tests/browserAutomation.test.js` passed together with 8 tests passed.
- Duplicate declaration scan of `public/app.js` found no duplicate function or arrow-function declarations.
- Public UI i18n scan found all 361 referenced public keys resolve in both English and Chinese.

## Conflict and Blocker Findings

### Prompt seed ReferenceError

Worker F reported `src/core/rules.js:1312 ReferenceError: promptSeed is not defined`. Current `src/core/rules.js` defines `function promptSeed(definition)` later in the same module, which is hoisted. `node --check`, `npm run lint`, and `tests/rules.test.js` all passed, so this is not currently reproducing as an integration blocker. Worker E should keep ownership of rules behavior.

### Browser refresh recovery

This preflight originally observed Worker A's visible-browser refresh recovery failure while the automated `tests/browserAutomation.test.js` refresh contract passed. Worker J later fixed/rechecked the local fresh-browser `?room=<id>` refresh path and Worker S indexed that evidence in `docs/qa/0015-fresh-browser-acceptance.md` and the 0015 test report. The remaining issue is the consolidated desktop/mobile browser acceptance gap recorded in `docs/qa/0015-consolidated-browser-gap.md`.

### Worker K/J frontend overlap

`public/app.js`, `public/i18n.js`, `public/styles.css`, `tests/noScrollUi.test.js`, and `tests/staticUiStructure.test.js` now overlap across the visual layout and URL-refresh tracks. Current findings:

- No syntax failure in `public/app.js`, `public/i18n.js`, `tests/noScrollUi.test.js`, `tests/staticUiStructure.test.js`, or `tests/browserAutomation.test.js`.
- No duplicate function or arrow-function declaration was found in `public/app.js`.
- URL auto-open is covered by static browser QA assertions for `startupAuthRestore`, `initializeRoomFromUrl(startupAuthRestore)`, `roomIdFromCurrentUrl()`, `setJoinByIdValue(roomId)`, `openRoomById(roomId)`, and room access header restoration. This is not yet a real browser reload test that opens a `?room=` URL from the DOM; final visible-browser acceptance should still verify it.
- `event.progression` log rendering is covered by static UI assertions for `localizedTranscriptType`, `transcriptTypeLabelKey`, `transcriptMainText`, `eventProgressionDetail`, clock delta formatting, and the required i18n keys. Backend structured-log template tests also pass. This is source-level render coverage, not a DOM snapshot test.
- `room.openingFromUrl`, `log.type.eventResolution`, `log.detail.eventProgression`, `log.detail.warnPrefix`, `log.detail.noImpact`, `log.detail.eventNextDefault`, and `log.detail.eventFallback` all resolve in English and Chinese.

### Public readiness gates

The 0015 gate package is intentionally fail-closed. Public readiness remains blocked by deployment, operations, production security, legal/privacy, load/reliability, support/launch, and consolidated browser-acceptance evidence. This is expected, not an integration conflict.

### Moving worktree

During this preflight, new `public/` and `docs/qa/0015-visual-checklist.md` changes appeared from other workers. They passed the focused syntax, lint, no-scroll, and browser-QA checks above, but final integration should rerun the full selected gate after all workers stop writing.

## Low-Risk Fix Applied

- Added `docs/qa/0015-release-evidence-index.md` to `requiredFiles` in `tests/publicReadinessGates.test.js`.
- Added a public UI i18n reference-resolution test to `tests/staticUiStructure.test.js`.

No business logic, UI behavior, or rules implementation was changed by Worker H.

## Recommended Final Convergence Gate

After the active workers finish, rerun:

```bash
git diff --check
npm run lint
npm run test:browser-qa
node --test tests/publicReadinessGates.test.js tests/noScrollUi.test.js tests/staticUiStructure.test.js tests/browserAutomation.test.js tests/flowClosureExtended.test.js tests/logTemplates.test.js tests/rules.test.js tests/serverRoutes.test.js tests/soundscape.test.js tests/stateMachine.test.js tests/stateSummary.test.js tests/req261RuntimeEnhancements.test.js
```

If time allows at final merge, run the full Harness gate:

```bash
npm run harness:check
```
