# Test Report

Status: the previously blocking 0012 gates are fixed in the confirmed post-patch baseline, with later focused gates added by follow-up workers. A final staged full-suite, lint, and Harness run is still required after concurrent work settles.

## Scope

This report records the integrated Harness and browser evidence. Documentation updates did not add generated assets.

The 2026-05-25 product/requirements pass appended `REQ-201` through `REQ-260` as future backlog only. It did not change runtime code.

## Tree Observation

- Branch: `codex/0012-continuous-depth-assets`.
- The tree was actively changing during earlier observation. Recent writes included sheet031 promotion files, localization/replay work, browser-flow QA notes, and Harness report updates by other agents.
- The current report records the latest handoff facts from the runtime/browser workers plus fresh post-patch gate reruns. Later workers added additional tests after the 217/217 baseline, so this report treats that count as historical baseline evidence rather than the current canonical total.
- Sheet031 inventory assets were present before validation: `assets/generated/sheets/aidm-inventory-expansion-sheet-031.png` plus 64 PNG and 64 SVG item slices under `assets/generated/items/`.

## Quality Gate Matrix

- Assets: pass for the current merge-green gate. Sheet031 generated asset and catalog coverage remains green, and production-depth scene asset selection now passes.
- Logs: pass in the full test run and production-depth evaluation.
- Audio: pass in focused soundscape/ambience coverage and production-depth evaluation.
- UI: pass for the current fixed-size one-viewport gate; the `syncSetupGuidance is not defined` browser runtime regression was found, fixed by another worker, and followed by green static UI focused tests.
- Economy: pass in full inventory, market, buy, sell, use, equip, and sheet031 economy tests.
- Evaluation: pass for the confirmed baseline release gate set recorded here. Full tests, lint, production-depth, memory eval, smoke, campaign simulation, Harness check, focused static UI checks, static/API preflight, and browser regression were green at that baseline. Later release-gate-flow, knowledge-context, frontend turn-focus, and guide focused gates also passed, but final staged full-suite and Harness evidence must set the current total.

## Commands Run

- `node --test tests/assetSelection.test.js tests/assets.test.js tests/generatedAssets.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/bilingualUi.test.js tests/localization.test.js tests/publicTts.test.js tests/ttsProfiles.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/replay.test.js`
- `npm run test`
- `npm run lint`
- `npm run eval:memory:16h -- --no-report`
- `npm run eval:production-depth`
- `npm run smoke`
- `npm run harness:check`
- `node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/bilingualUi.test.js`
- `node --input-type=module -e "...runProductionDepthEval({ datasetPath: 'evals/production-depth/scenarios.json' })..."`
- `node --test tests/requirements.test.js tests/maturity.test.js`
- Static/API preflight for `/`, `/app.js`, `/styles.css`, `/i18n.js`, and `/api/health`
- Browser regression: `/private/tmp/aidm-visual-qa-20260524/aquinas-postfix-20260525-003624/regression-report.json`
- Browser regression: `/private/tmp/aidm-visual-qa-20260525/aquinas-postfix-nolocal-20260525-004000/regression-report.json`
- Browser regression after binding-aware UI patch: `/private/tmp/aidm-visual-qa-20260525/main-after-binding-ux/regression-report.json`
- Product requirements expansion check: `node --test tests/requirements.test.js tests/maturity.test.js`
- Release-gate-flow focused check: `node --test tests/releaseGateFlow.test.js`
- Knowledge-context focused check: `node --test tests/knowledgeContextQa.test.js tests/director.test.js tests/rules.test.js tests/localization.test.js tests/logTemplates.test.js`
- Guide expansion focused check: `node --test tests/guide.test.js tests/staticUiStructure.test.js`

## Results

- Confirmed baseline release gate handoff, post-patch 2026-05-25 CST:
  - `npm run test` passed at the baseline: 217 tests, 217 passed.
  - `npm run lint` passed at the baseline.
  - `npm run eval:production-depth` passed: 10 checks, 10 passed, `passed=true`.
  - `npm run eval:memory:16h -- --no-report` passed: 16 session blocks, 2,112 events, 2,112 indexed events, 256 queries, `recallAt5=1`, `meanReciprocalRank=1`.
  - `npm run smoke` first failed under sandbox localhost restrictions with `EPERM`, then passed after escalation. Passing smoke returned `generatedAssetCount=748`, `marketOffers=52`, `language=zh`, `soundscape=market-city`, `combatLog=1-2`, and `replayHighlights=4`.
  - `npm run harness:check` passed after localhost escalation and with the 4173 dev server running. Its baseline run included `npm run test` 217/217, memory eval passed, production-depth 10/10 passed, smoke passed, campaign simulation passed with 5 players, round 6, transcript 105, memories 26, combatLog 16, replayHighlights 8, and `harness check ok`.
  - Browser QA found and another worker fixed the frontend runtime error `syncSetupGuidance is not defined`.
  - Follow-up static UI focused tests passed: 12 tests, 12 passed.
  - `node --test tests/requirements.test.js tests/maturity.test.js` passed in the previous report refresh: 9 tests, 9 passed.
  - Product/requirements expansion rerun of `node --test tests/requirements.test.js tests/maturity.test.js` passed after adding `REQ-201` through `REQ-260`: 9 tests, 9 passed.
  - Static/API preflight returned 200 for `/`, `/app.js`, `/styles.css`, `/i18n.js`, and `/api/health`.
  - Complete desktop and 390px mobile browser regressions passed with `issues=[]`, `brokenImages=[]`, `maxOverflowX=0`, no console errors, and visible no-local-token join paths.
  - A follow-up browser regression after the binding-aware setup/market/memo/inventory feedback patch also passed with `issues=[]`.
  - Transient `npm run harness:check` attempts during concurrent edits, without localhost permission, or without the 4173 service are superseded by the later direct `npm run test` and final `npm run harness:check` runs.
  - Later release-gate-flow, knowledge-context, frontend turn-focus, and guide workers reported focused gates passing after adding tests. This report does not replace the final staged full-suite count because this documentation-sync pass did not rerun `npm run test`.

## Resolved Merge-Green Blockers

1. The no-scroll UI gate is no longer blocking.
   - Previous symptom: `tests/noScrollUi.test.js:57` expected `.dice-final-score` to use `font: 900 1rem ui-monospace`, while `public/styles.css` used `1.16rem`.
   - Current evidence: the baseline full `npm run test` was green at 217/217, the Harness baseline was green, and follow-up static UI focused tests are green at 12/12. Later frontend turn-focus focused gates also passed.

2. The production-depth rain archive street gate is no longer blocking.
   - Previous symptom: `scenario:rain-archive-street` selected `scene.ambient.moonlit-rain-archive.v01` / `aidm-ambient-scene-032-01` instead of `scene.rain.archive.street`.
   - Current evidence: `npm run eval:production-depth` is green at 10/10 with `passed=true`.

3. The historical production-depth failure entries are now superseded and do not describe the current handoff state.
   - Previously failing checks:
     - `production-depth evaluator covers scene, audio, logs, economy, and asset bindings`
     - `production-depth evaluator CLI writes a reusable JSON report`
     - `production-depth npm gate runs locally without writing a timestamped report`
   - Current evidence: the baseline full `npm run test` was green at 217/217, and later focused release-gate/knowledge/UI/docs tests reported green.

## Superseded Report Contract Failure

- The earlier full-suite run also failed `0012 Harness record preserves non-MVP depth gates and open work` because another agent's intermediate report omitted `node --test tests/requirements.test.js tests/maturity.test.js`.
- This report refresh restores that command record and the required Assets, Logs, Audio, UI, Economy, and Evaluation gate readout.
- Focused rerun `node --test tests/requirements.test.js tests/maturity.test.js` now passes 9/9, and the final full-suite rerun no longer includes this failure.

## Browser Regression

- Browser screenshot QA was rerun after static/API recovery and the no-local-player setup fix.
- Latest reports:
  - `/private/tmp/aidm-visual-qa-20260524/aquinas-postfix-20260525-003624/regression-report.json`
  - `/private/tmp/aidm-visual-qa-20260525/aquinas-postfix-nolocal-20260525-004000/regression-report.json`
  - `/private/tmp/aidm-visual-qa-20260525/main-after-binding-ux/regression-report.json`
- Both latest reports passed with `issues=[]`; no-local-token desktop and mobile states have visible join paths.

## Write-Scope Caveat

- `npm run eval:memory:16h` defaults to writing a timestamped report under `evals/reports/`, which is outside this worker's requested write scope. This worker ran the same gate as `npm run eval:memory:16h -- --no-report`.

## Remaining Risk

- BUG-0004 through BUG-0006 remain open as long-term polish and product-decision work: non-MVP guardrail hardening, market turn-cost semantics, purchase/use feedback, tool-like item semantics, active audio status placement, first-time setup/action hierarchy polish, and the 3000/500 asset-scale target.
- Browser screenshot blockers from the interrupted Aquinas run are closed for the current tree by the latest full regression. Reopen only if a future runtime UI/static change regresses desktop or mobile proof.
- The working tree remains heavily dirty and includes many untracked generated assets and QA reports from other agents. This report does not imply ownership of those changes.
