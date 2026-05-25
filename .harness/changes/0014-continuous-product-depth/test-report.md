# Test Report

Status: documentation and QA acceptance-design pass prepared. Public readiness is not approved.

## Scope

Worker F changed Harness and documentation only. This pass did not modify product code, tests, public UI files, core rules, server routes, runtime storage, generated assets, or `docs/REQUIREMENTS_200.md`.

## Evidence Created

- 0014 Harness package:
  - `.harness/changes/0014-continuous-product-depth/spec.md`
  - `.harness/changes/0014-continuous-product-depth/review.md`
  - `.harness/changes/0014-continuous-product-depth/tasks.md`
  - `.harness/changes/0014-continuous-product-depth/test-report.md`
- 0014 QA documents:
  - `docs/qa/0014-acceptance-checklist.md`
  - `docs/qa/0014-browser-qa-plan.md`
  - `docs/qa/0014-final-evidence.md`
- Status documentation updates:
  - `docs/ROADMAP.md`
  - `docs/BUGS.md`
  - `docs/GAP_ASSESSMENT.md`
  - `docs/MATURITY_AUDIT.md`
  - `README.md`
  - `docs/USER_GUIDE.md`

## Commands Run By Worker F

```bash
node --test tests/requirements.test.js tests/maturity.test.js
npm run harness:status
git diff --check
rg -n "^(<<<<<<<|=======|>>>>>>>)" .harness docs README.md
rg -n 'public-ready|launch-ready|public beta ready|public launch ready|all `REQ-281` through `REQ-400` are complete|all 400 requirements' .harness/changes/0014-continuous-product-depth docs/qa/0014-*.md README.md docs/ROADMAP.md docs/BUGS.md docs/GAP_ASSESSMENT.md docs/MATURITY_AUDIT.md docs/USER_GUIDE.md
git status --short --untracked-files=all
```

## Results

- `node --test tests/requirements.test.js tests/maturity.test.js`: passed, 14 tests total, 14 passed, 0 failed, 0 TODO.
- `npm run harness:status`: passed and reported 14 Harness changes; `0014-continuous-product-depth` is 18/23 tasks complete.
- Worker P reran `npm run harness:status` after Faraday evidence convergence; it passed and reported `0014-continuous-product-depth` at 19/23 tasks complete.
- `git diff --check`: passed, no whitespace errors.
- Conflict-marker scan over `.harness`, `docs`, and `README.md`: passed, no matches.
- Public-readiness overclaim scan: remaining matches are negative boundary statements such as "not public-ready", "only be called public-ready after", "does not approve", or prohibited-claim examples. No affirmative launch-ready claim was introduced.
- `git status --short --untracked-files=all`: shows Worker F documentation changes plus concurrent code/test changes in `public/`, `src/`, and `tests/` that are outside this worker's write scope.

## Full Harness Status

Initial Worker F did not run `npm run harness:check`, but later Faraday/final-gate evidence closed the full Harness task for the 0014 package:

- `npm run lint`: passed, `lint ok: 79 JavaScript files checked`.
- `npm run test`: passed, 274 tests total, 274 passed, 0 failed.
- `npm run harness:status`: passed before convergence and reported `0014-continuous-product-depth` at 18/23.
- Default-sandbox `npm run harness:check`: failed on environment-localhost permission with `Error: listen EPERM: operation not permitted 127.0.0.1`; no product assertion failure was identified.
- Localhost-capable `npm run harness:check`: passed and ended with `harness check ok`.
- Internal Harness stages in that pass included lint, 274/274 unit tests, memory eval `recall@5=1` and `mean reciprocal rank=1`, production-depth 10/10, smoke `ok=true`, and campaign simulation `ok=true`.

This closes only the automated Harness-check task. It does not close the fresh-data 0014 browser acceptance run, desktop/mobile full visual signoff, future browser automation conversion, or public-launch prerequisite gates.

## AA Final QA Collation

Worker AA reviewed the available 0014 QA files at 2026-05-25 10:57 CST, including browser-current, mobile-layout, audio-scene, browser-regression-after-smallfixes, localization leak check, integration risk, final gate, test readiness, final diff summary, and the 0013 protected-room auth evidence.

Current severity status from the evidence pack:

- P0: no current P0 blocker was found in the available browser, responsive, audio/scene, regression, or automated-gate evidence.
- P1 closed/non-current: automated gate blockers are closed in current evidence; the prior item-catalog `toolUse` risk is non-current; focused localization leak classes are covered by 32/32 passing tests; the Market insufficient-funds "disabled but says purchasable" browser issue is closed for current room data by the targeted regression recheck; and worker Z closed the 375 px mobile action/state-strip P1 issues with focused 375x667 browser smoke plus `tests/noScrollUi.test.js` / `tests/staticUiStructure.test.js`.
- P1 still open: none in the current evidence pack after worker Z's 375 px focused regression.
- P2/watch items still open: reward toast visual competition, pending post-fix 768 px topbar screenshot, intentional 375 px party-rail horizontal overflow, unverified actual audio output/mute persistence, incomplete live coverage for sold-out/owned/locked Market disabled states, and live first-paint/default-language behavior.

The fresh-data browser task remains unchecked because the fresh mobile run did not execute the full `docs/qa/0014-browser-qa-plan.md` flow: protected-room wrong/correct password and host-approval browser loops, multi-context join, full market use/equip/sell, refresh recovery, and audio persistence are still incomplete. The desktop/mobile visual-check task also remains unchecked because worker Z only performed a focused 375 px regression after fixing the P1 issues, not a full rerun of the entire desktop/mobile acceptance checklist.

## Expected Sandbox Boundary

If `npm run harness:check` fails in the default sandbox with `listen EPERM` or `connect EPERM` on `127.0.0.1` or `::1`, treat that as an environment permission failure for localhost-backed tests. The 0014 evidence includes exactly this default-sandbox failure and a localhost-capable Harness pass.

## Current Gate Decision

This change can be reviewed as a local-alpha product-depth batch because focused tests, the full unit suite, and the localhost-backed Harness gate pass. It does not close the full browser acceptance run itself, does not close full desktop/mobile visual signoff, and does not close public-launch prerequisites.
