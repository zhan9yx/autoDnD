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

- BUG-0004 through BUG-0006 remain open as long-term polish and product-decision work: non-MVP guardrail hardening, first-time setup/action hierarchy polish, and the 3000/500 asset-scale target. Worker H closed the active audio status placement, tool-like item semantics, purchase/use/backpack feedback, and equipment-summary item-name subsets below.
- Browser screenshot blockers from the interrupted Aquinas run are closed for the current tree by the latest full regression. Reopen only if a future runtime UI/static change regresses desktop or mobile proof.
- The working tree remains heavily dirty and includes many untracked generated assets and QA reports from other agents. This report does not imply ownership of those changes.

## Worker A Market/Economy Minimal Closure - 2026-05-25

Scope: market/economy subset only. This evidence narrows BUG-0006 market/economy risk; it does not close purchase/use confirmation, tool-like item semantics, soundscape placement, or broader asset-scale work.

Evidence:

- Market buy/sell are documented and implemented as free-time inventory operations: `market.note`, `market.openTitle`, `market.feedback.buying`, `market.feedback.bought`, and `inventory.feedback.sold` tell players no turn is spent and no round advances.
- Disabled market states are visible and localized for insufficient funds, sold out, already owned, and rule/rules-locked offers. Missing local player state is now exposed through the disabled Market button `title` / `aria-label` and the market drawer status.
- Focused tests cover the above without relying on broad browser work.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/itemCatalog.test.js tests/gameEngineInventory.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js` passed: 42/42.

Non-goals / not claimed:

- No new browser-flow evidence was produced in this narrowed pass.
- `tests/serverRoutes.test.js` timed out waiting for its local test server and is not used as evidence here.
- Superseded below for soundscape status placement. Tool-like item equip/use semantics and purchase/backpack confirmation remain open.

## Worker H Soundscape Status Minimal Closure - 2026-05-25

Scope: closed only the active soundscape/audio status placement and localized copy slice from the open BUG-0006 polish set.

Evidence:

- `public/app.js` now uses the active soundscape label and localized reason in the collapsed table state summary/title and the stage recent-change detail.
- `public/i18n.js` adds `ambience.sceneStatus` in English and Chinese so the status/reason sentence is localized instead of assembled from debug ids.
- `tests/bilingualUi.test.js` verifies the Chinese soundscape status/reason string has no internal English/debug leak.
- `tests/playerUiAccess.test.js` verifies the status strip, stage summary, and shared `soundscapeStatusText()` path.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/bilingualUi.test.js tests/playerUiAccess.test.js` passed: 14/14.

Remaining open:

- Purchase/use confirmation and backpack-added feedback.
- Tool-like item equip/use/non-equippable semantics.
- First-time setup/action hierarchy polish.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.

## Worker I Active Player Guidance Minimal Closure - 2026-05-25

Scope: active-player/action guidance subset from the continuous-depth backlog. This pass did not address reward discoverability, market/economy semantics, auth/session/room access, stage fallback, or asset-scale expansion.

Evidence:

- `public/app.js` now derives `currentActionGuidanceState()` from active turn ownership, local player binding, pending approval state, and selected Action/Chat intent.
- Other-player-turn Action is blocked with localized waiting copy, while Chat remains available as a free, non-turn-spending message path.
- No-local and pending-approval states now have distinct localized placeholders, aria labels, hints, submit labels, and submit errors.
- `tests/workerIActiveGuidance.test.js` covers the new state/copy wiring without relying on browser screenshots.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/workerIActiveGuidance.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/bilingualUi.test.js` passed: 17/17.

Remaining open:

- No browser screenshot QA was run for this slice, so consolidated browser readiness remains open.
- Reward/loot discoverability remains open.
- The broader REQ-201 through REQ-280 implementation line remains incomplete.

## Worker H Tool-Like Item Semantics Minimal Closure - 2026-05-25

Scope: closed only the tool-like item equip/use/non-equippable semantics slice from the open BUG-0006 polish set.

Evidence:

- `src/core/itemCatalog.js` represents utility tools with `tool-utility` use effects and no equipment slot unless the item is explicitly slotted.
- `describeInventoryEntry()` exposes `actions.use.available=true` and `actions.equip.reasonCode="tool-not-equippable"` for `storm-lantern` / similar tools.
- `equipInventoryItem()` rejects non-slotted tools with localized English/Chinese reasons instead of failing silently.
- `public/app.js` item detail uses the action-state reason for the disabled Equip control and action hint copy.
- `tests/itemCatalog.test.js` verifies `暴风提灯` can be used from inventory, is not equippable, keeps quantity when used, and throws localized equip feedback.
- `tests/bilingualUi.test.js` verifies the player-visible English/Chinese copy keys for tool use and non-equippable explanations.

Commands run:

- `node --check src/core/itemCatalog.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/itemCatalog.test.js tests/bilingualUi.test.js` passed: 27/27.

Remaining open:

- Purchase/use confirmation and backpack-added feedback.
- First-time setup/action hierarchy polish.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.
- Broad browser-flow retest for the combined inventory drawer remains recommended before public-launch readiness.
- `node --test tests/playerUiAccess.test.js` remains red on unrelated 0013/player-binding static expectations (`modeSelect.disabled = isChat || !hasPlayerBinding` and a broad v11 player-scoped regex); this tool-semantics pass does not claim that gate.

## Worker H Purchase/Use/Backpack Feedback Minimal Closure - 2026-05-25

Scope: closed only the purchase/use confirmation and backpack-added feedback slice from the open BUG-0006 polish set.

Evidence:

- `market.feedback.bought` now confirms the purchased item was added to the backpack and keeps the existing free-time rule copy unchanged.
- `inventory.feedback.used`, `inventory.feedback.equipped`, and `inventory.feedback.sold` now explicitly state that backpack and/or equipment summary state refreshed after the operation.
- `showRewardToast()` appends `reward.feedback.addedToBackpack`, so reward/loot gain gives a short existing-toast confirmation and next step.
- `tests/itemCatalog.test.js` verifies a buy runtime flow returns `stateDeltas.inventory` with the newly added backpack item.
- `tests/bilingualUi.test.js` verifies English and Chinese copy for buy/use/equip/sell/reward feedback.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/itemCatalog.test.js tests/bilingualUi.test.js` passed: 28/28.

Remaining open:

- First-time setup/action hierarchy polish.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.
- Equipment summaries showing actual equipped item names.
- Broad browser-flow retest for the combined inventory drawer remains recommended before public-launch readiness.

## Worker H Equipment Summary Names Minimal Closure - 2026-05-25

Scope: closed only the equipment-summary item-name display slice carried from 0011.

Evidence:

- `public/app.js` now lets `equipmentSlotSummary()` trust `character.equipmentSummary.slots[slot].item` first, then falls back to equipped inventory matching.
- The compact summary string now uses actual item names where present, not just slot category labels.
- `tests/itemCatalog.test.js` verifies `equipmentSummary()` exposes localized actual equipped names such as `匕首`, `守护盾`, and `皮甲`.
- `tests/staticUiStructure.test.js` verifies the frontend summary path uses `inventoryItemName(entry)` for both visible slot values and compact summary values.

Commands run:

- `node --check public/app.js` passed.
- `node --test tests/itemCatalog.test.js tests/staticUiStructure.test.js` passed: 19/19.

Code review follow-up - 2026-05-25:

- Finding: after the frontend started trusting `character.equipmentSummary.slots.offHand.item`, shields and other off-hand equipment could render under the narrower Focus/法器 summary label.
- Fix: `public/app.js` now names the summary slot `slot.offHand`, includes shield/focus matching for the off-hand fallback path, and `public/i18n.js` adds Off hand/副手 copy.
- Tests: `tests/bilingualUi.test.js` now requires the new bilingual `slot.offHand` key, and `tests/playerUiAccess.test.js` asserts the off-hand summary contract.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/bilingualUi.test.js tests/playerUiAccess.test.js tests/staticUiStructure.test.js tests/itemCatalog.test.js` passed: 37/37.

Final review-worker verification:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --check src/core/gameEngine.js` passed.
- `node --check src/core/itemCatalog.js` passed.
- `node --check src/core/localization.js` passed.
- `node --check src/core/rules.js` passed.
- `node --test tests/gameEngine.test.js tests/itemCatalog.test.js tests/rules.test.js tests/localization.test.js tests/stateSummary.test.js` passed: 60/60.
- `node --test tests/bilingualUi.test.js tests/playerUiAccess.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/audioBrowserCompatibility.test.js tests/workerGUiGuidance.test.js tests/workerIActiveGuidance.test.js` passed: 30/30.
- `npm run harness:status` passed and reported `0012-continuous-depth-assets: 43/47`, `0013-public-productization: 33/38`, and `0015-continuous-hardening: 21/28`.
- `npm run lint` passed: `lint ok: 91 JavaScript files checked`.
- `git diff --check` passed.

Remaining open:

- First-time setup/action hierarchy polish.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.
- Broad browser-flow retest remains recommended before public-launch readiness.

## Worker I Reward/Loot Discoverability Minimal Closure - 2026-05-25

Scope: closed focused engine/runtime and browser-visible evidence for reward/loot discoverability. This pass did not alter market/economy rules, add assets, or claim public/browser readiness beyond this narrow path.

Evidence:

- Investigation/search/clue actions create `scene.rewardHints` that tell the player which source is searchable and how to claim it before reward grant.
- Claim/open/search actions against the hinted source still drive the existing reward flow, and the transcript copy now confirms the reward is in the backpack and viewable in My character.
- `tests/gameEngine.test.js` verifies the English and Chinese flow: hint first, no premature reward, then reward source + backpack-view cue after claim.
- Browser QA in `docs/qa/0011-reward-loot-browser.md` verifies the State drawer reward hint, reward toast backpack cue, and My Character backpack item.
- Existing bilingual/static player tests remain green with the reward hint, reward toast, and backpack copy.

Commands run:

- `node --check src/core/localization.js` passed.
- `node --check src/core/gameEngine.js` passed.
- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/gameEngine.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js` passed: 33/33.

Remaining open:

- Public readiness and consolidated browser QA.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.

## Worker H First-Time Setup / Action Hierarchy Minimal Closure - 2026-05-25

Scope: closed only the first-time setup localization/action hierarchy polish carried in 0012. This pass did not change auth, market/economy rules, character rules, stage behavior, or generated assets.

Evidence:

- The topbar now gives Start scene explicit primary priority, with My character/Team/State as secondary controls and Log/Settings/status as utility controls.
- The setup form groups the Join table submit action with a compact Guide button so first-time help is adjacent to the primary setup step.
- Start scene now has localized disabled/ready `title` and `aria-label` reasons for no players, host-only access, scene already started, and ready state.
- English and Chinese setup guidance copy now tells players they can open Guide before joining.
- Static/UI tests assert the priority attributes, setup button group, localized copy, no-scroll topbar constraints, and player-scoped control boundaries.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/staticUiStructure.test.js tests/bilingualUi.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js` passed: 24/24.

Remaining open:

- No live browser screenshot QA was run for this narrowed closure.
- Public readiness and consolidated browser QA.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.

## Worker H Progression Loop Runtime/Static Closure - 2026-05-25

Scope: recorded the 0011 progression-loop closure in the carried 0012 evidence set. This pass did not change asset counts or browser/release gates.

Evidence:

- XP gain is runtime-backed through `field-primer`; use grants 120 XP, levels the character to 2, and records progression action/resource unlocks in `stateDeltas.progression`.
- Spell learning is runtime-backed through spell scroll use; the scroll is consumed on success, the spell is added to known spells, and transcript copy uses localized spell names.
- Equipment summary/stat deltas are runtime-backed through equip; focused catalog tests verify equipped item deltas and defense stat deltas.
- Player-visible surfaces are covered by static tests: My character renders level/XP, HP/MP, defense, initiative, known spells, and equipment summary; the compact State/player summary uses refreshed level/XP/equipment.
- `docs/USER_GUIDE.md` describes where players see the loop: transcript, My character, and State summary.

Commands run:

- `node --check src/core/gameEngine.js` passed.
- `node --check src/core/localization.js` passed.
- `node --check public/app.js` passed.
- `node --test tests/localization.test.js` passed: 8/8.
- `node --test tests/gameEngine.test.js tests/itemCatalog.test.js tests/staticUiStructure.test.js` passed: 34/34.
- `node --test tests/rules.test.js tests/guide.test.js` passed: 16/16.
- `node --test tests/guide.test.js` passed: 3/3 after guide wording.

Remaining open:

- No live browser QA was run for this narrowed progression loop.
- Public readiness and consolidated browser QA.
- Asset-scale expansion toward 3000 generated assets and 500 player-safe scene backdrops.

## Remaining Boundary Worker Browser Attempt - 2026-05-25

Scope: attempted to close the carried 0012 note that asks for one uninterrupted combined desktop/mobile browser pass before broader release handoff. The attempt was intentionally non-auth and non-asset-expansion to avoid the 0013 auth/audio/spell-warrior boundary and the image-asset expansion restriction.

Evidence:

- `docs/qa/0014-non-auth-combined-browser-attempt.md`
- `/private/tmp/aidm-0014-combined-browser-qa/report.json`

Result:

- Not closed. The local Headless Chrome/CDP runner failed before producing a complete combined desktop/mobile evidence pack.
- No product bug was opened from this attempt; failures were local automation and runner synchronization issues.
- The 0012 task `Run one uninterrupted combined desktop/mobile browser pass before broader release handoff` remains unchecked.

Commands run:

- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js` passed: 24/24.
- `node --test tests/maturity.test.js tests/requirements.test.js tests/publicReadinessGates.test.js` passed: 18/18.
- `npm run harness:status` passed and reported `0012-continuous-depth-assets: 43/47`.
