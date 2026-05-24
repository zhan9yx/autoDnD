# 0012 Browser Current QA

Status: current browser/runtime QA blocker fixed and browser-regression evidence attached for the 0012 merge-green handoff.

## Scope

- Record the current browser QA result after the 0012 merge-green fixes.
- No generated assets were added or changed by this documentation pass.
- No `public/`, `src/`, or `tests/` files were changed by this documentation pass.

## Findings

- Browser QA found a frontend runtime failure: `syncSetupGuidance is not defined`.
- Another worker fixed the runtime bug before this documentation pass.
- Follow-up static UI focused tests passed: 12 tests, 12 passed.
- The `#marketStatus` long free-time copy clipping issue is fixed by code/static checks: `node --test tests/noScrollUi.test.js tests/staticUiStructure.test.js` passed 2/2, and `node --check public/app.js public/i18n.js` passed.
- Browser screenshot regression evidence is now complete for the current UI state. Static resource EPERM/404 was cleared after permission recovery, static/API preflight returned stable 200 responses, and the follow-up desktop plus 390px mobile browser reports passed with `issues=[]`.
- The no-local-token regression is fixed in browser evidence: both latest reports show visible join paths for desktop and mobile.
- After the later binding-aware setup/market/memo/inventory feedback patch, another desktop plus 390px mobile browser regression passed with `issues=[]`: `/private/tmp/aidm-visual-qa-20260525/main-after-binding-ux/regression-report.json`.

## Smoke Evidence

- `npm run smoke` first failed under sandbox localhost restrictions with `EPERM`.
- After running with the required localhost permission, `npm run smoke` passed.
- Latest passing smoke returned `generatedAssetCount=748`, `marketOffers=52`, `language=zh`, `soundscape=market-city`, `combatLog=1-2`, and `replayHighlights=4`.

## Gate Evidence

- `npm run test` passed at the post-patch baseline: 217 tests, 217 passed. Later workers added tests and reported focused gates passing; use the final staged full-suite rerun for the current canonical total.
- `npm run lint` passed at the post-patch baseline; later JavaScript file counts changed as tests were added.
- `npm run eval:production-depth` passed: 10 checks, 10 passed, `passed=true`.
- `npm run eval:memory:16h -- --no-report` passed with `recallAt5=1` and `meanReciprocalRank=1`.
- `npm run harness:check` passed after localhost escalation and with the 4173 dev server running. Its baseline run included 217/217 tests, green memory eval, green production-depth eval, green smoke, green campaign simulation, and `harness check ok`.
- Earlier Harness attempts during concurrent edits or without localhost service are superseded by the later direct 217/217 baseline test run and green Harness baseline.

## Current Handoff

- The browser/runtime blocker is fixed for the current merge-green state.
- Static resource EPERM/404 and the partial Aquinas browser rerun are no longer current blockers; keep the latest passing reports as the current screenshot evidence.
- BUG-0004 through BUG-0006 remain open for long-term non-MVP guardrail hardening, market/economy product decisions, and continuous-depth polish.
