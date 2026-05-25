# Bug Tracker

## BUG-0004 Non-MVP guardrails can drift out of docs and tests

- Status: open in `0012-continuous-depth-assets`
- Found by: QA/Harness maturity review.
- Reproduction: If future changes only keep smoke or unit tests green while removing explicit gates for assets, logs, audio, UI, economy, or evaluation, the project could again be described as an MVP-grade demo without failing documentation-backed tests.
- Impact: release notes and merge reviews could overstate maturity and miss production-depth regressions.
- Current gate: `tests/requirements.test.js` and `tests/maturity.test.js` now require the 0012 Harness record and six non-MVP gate domains to stay documented.
- Current 0012 status: the previous merge-green blockers are fixed. The confirmed post-patch baseline was green (`npm run test` 217/217, lint, production-depth 10/10, memory eval recallAt5=1/MRR=1, smoke passed with 748 generated assets and 52 market offers, and `npm run harness:check` ended with `harness check ok`). Later workers added release-gate-flow, knowledge-context, frontend turn-focus, and guide coverage, so the final staged full-suite/Harness run must establish the current canonical count. The macOS/OS sandbox EPERM blocker was cleared by user authorization. This bug stays open until the six domains are protected by direct source/runtime tests or an equivalent Harness gate.
- Close condition: close only after the six domains are enforced by direct source/runtime tests or an equivalent Harness gate, not only by documentation.

## BUG-0005 Market and economy turn-cost semantics remain unresolved

- Status: open in `0012-continuous-depth-assets`
- Found by: v11 QA closeout and 0012 maturity review.
- Reproduction: Market buy/sell can be treated as inventory management or a turn-consuming table action, but the current product record does not make the rule final.
- Impact: players can misunderstand whether shopping competes with scene actions, and stricter economy/turn invariants cannot be claimed.
- Current gate: the unresolved decision is carried in the 0012 Harness tasks and roadmap open items.
- Current 0012 status: the restarted runtime now confirms the implemented free-time contract for buy/sell (`turnCost=free-time`, stock deltas present, round/active player unchanged, wallet changed, and GET `/market` stock static), but the product decision stays open until the rule is documented, localized player-facing copy is finalized, and browser-flow or economy regression evidence is attached.
- Close condition: implement or document the rule, localize the player-facing copy, and cover it with economy or browser-flow regression tests.

## BUG-0006 Continuous-depth polish remains below public-launch quality

- Status: open in `0012-continuous-depth-assets`
- Found by: v11 QA closeout and 0012 maturity review.
- Reproduction: Purchase/use feedback remains subtle, tool-like item equip/use semantics need clearer UI copy, active soundscape status is mostly hidden in Settings, first-time setup/action hierarchy still need polish, and asset scale remains below the 3000+ asset and 500-scene targets.
- Impact: the local alpha can be reviewed, but the table still should not be represented as a mature public-launch product.
- Current gate: `docs/MATURITY_AUDIT.md`, `docs/ROADMAP.md`, and 0012 tests keep these items visible.
- Current 0012 status: the no-scroll UI and production-depth scene-selection blockers are fixed, the latest confirmed engineering gates are green, and the `#marketStatus` free-time copy CSS issue is fixed by focused code/static checks plus browser regression. Static/API serving is reverified and the latest desktop/mobile browser reports passed with `issues=[]`, but purchase/backpack feedback, tool-like item copy, soundscape visibility, and setup/action hierarchy polish stay open for local-alpha refinement and public-launch readiness.
- Close condition: close individual polish gaps with browser QA evidence and keep asset-scale progress tied to manifest-backed generated assets.

## BUG-0012 Consolidated 0014 browser acceptance evidence is missing

- Status: open in `0014-continuous-product-depth`
- Found by: 0014 QA/Harness acceptance review.
- Reproduction: The current evidence set is split across 0012/0013 focused tests, Harness reports, and selected browser rechecks. A reviewer cannot yet point to one release-candidate browser pack that proves situation page density, log density, party rail, multiplayer, scene change, environment audio, spell/class, market/backpack, login/room permissions, turn guidance, and full flow closure together.
- Impact: automated gates may be green while product-visible regressions remain unverified, and status docs could accidentally imply public readiness from partial evidence.
- Current gate: `.harness/changes/0014-continuous-product-depth/*`, `docs/qa/0014-acceptance-checklist.md`, and `docs/qa/0014-browser-qa-plan.md` define the required acceptance pass.
- Current 0014 status: protected-room browser recheck evidence from 0013 is useful input, automated coverage is broad, and the 0015 refresh-recovery P1 has local fix evidence. The consolidated 0014 browser run has not been executed in this documentation pass, so refresh recovery is still fixed-awaiting-browser-recheck for `GATE-002`.
- Close condition: run the 0014 browser plan on isolated local data, attach desktop/mobile screenshots or a machine-readable report, record failures or deferrals with owners, and keep public-launch prerequisites separate from local browser acceptance.

## BUG-0013 Public-readiness gates are defined but not implemented

- Status: open in `0015-continuous-hardening`
- Found by: public-readiness gate review.
- Reproduction: Inspect `docs/RELEASE_GATES.md`; `GATE-001` through `GATE-008` are intentionally blocked because required evidence for release index, consolidated browser acceptance, deployment, operations, security, legal/privacy, load, and support does not exist yet.
- Impact: AIDM can pass local Harness gates while still being unsuitable for public internet users.
- Current gate: `tests/publicReadinessGates.test.js` requires the 0015 gate package and fails if the public-readiness gates are marked passed in this change. Local refresh-recovery fix evidence does not close `GATE-002` or any public-readiness gate.
- Close condition: close only after every gate in `docs/RELEASE_GATES.md` has evidence, a passing command or drill where applicable, and explicit Harness review approval.

## BUG-0007 Full test suite fails on runtime inventory action helper

- Status: fixed in current working tree.
- Found by: `npm run test` during 0012 QA/Harness verification.
- Reproduction: run `npm run test`; many gameplay, economy, server-route, replay, localization, and production-depth tests fail with `ReferenceError: inventoryActionAvailability is not defined` from `src/core/itemCatalog.js:879`.
- Impact: full unit coverage and production-depth evaluation are red until the runtime helper is defined or imported correctly.
- Fix: `src/core/itemCatalog.js` now provides the inventory action availability helper used by item detail, market, buy, sell, use, and equip flows.
- Verification: focused inventory/catalog tests pass, `npm run eval:production-depth` passes, and `npm run test` is green without reproducing this runtime helper failure.

## BUG-0008 Soundscape scene mismatch guard regression

- Status: fixed in current working tree.
- Found by: `npm run test` during 0012 QA/Harness verification.
- Reproduction: `tests/soundscape.test.js` fails `scene mismatch guards prevent recent text from hijacking the current audio bed` with `false !== true`.
- Impact: the audio gate is not fully green, so scene/audio alignment cannot be claimed as passing on the current tree.
- Fix: `src/core/soundscape.js` now keeps current-scene location, weather, and mood evidence separate from stale transcript matches before applying mismatch guards.
- Verification: focused soundscape tests pass, `npm run eval:production-depth` passes, and `npm run test` is green without reproducing this guard failure.

## BUG-0009 No-scroll dice score CSS contract regression

- Status: fixed in current working tree.
- Found by: `tests/noScrollUi.test.js` during 0012 release-gate verification.
- Reproduction: the one-viewport UI assertion expected `.dice-final-score` to use the fixed `font: 900 1rem ui-monospace` contract, but an intermediate stylesheet state used a larger `1.16rem` size.
- Impact: the local-alpha UI gate was red even though the broader player table, drawer, bilingual UI, and TTS tests were otherwise healthy.
- Fix: another worker restored the dice score CSS contract and followed with static UI focused coverage.
- Verification: the post-patch `npm run test` baseline was green at 217/217, the Harness baseline was green, and the follow-up static UI focused tests are green at 12/12. Later frontend turn-focus changes also reported focused UI/browser gates passing; final staged full-suite verification still needs to establish the current total.

## BUG-0010 Rain archive street production-depth scene-selection regression

- Status: fixed in current working tree.
- Found by: `npm run eval:production-depth` during 0012 release-gate verification.
- Reproduction: `scenario:rain-archive-street` selected `scene.ambient.moonlit-rain-archive.v01` / `aidm-ambient-scene-032-01` instead of the required `scene.rain.archive.street` semantic key.
- Impact: production-depth was red at 9/10, which also made full-suite production-depth tests fail.
- Fix: another worker restored scene-selection precedence so the rain archive street scenario selects the required semantic key.
- Verification: `npm run eval:production-depth` is green at 10/10 with `passed=true`, the post-patch `npm run test` baseline was green at 217/217, and the Harness baseline was green. Later added tests require a fresh staged full-suite run for the current total.

## BUG-0011 Static resource EPERM/404 blocks complete browser regression

- Status: fixed in current working tree.
- Found by: 0012 browser/Harness closeout.
- Reproduction: During the post-fix browser regression, static resources that had previously returned 200 were later observed as unavailable or 404, likely because filesystem EPERM or cwd/static-root access problems were surfaced as HTTP 404. Aquinas produced only a partial browser report rather than a complete regression pass.
- Impact: the UI code/test fixes can be recorded, but complete browser screenshot regression cannot be claimed until the server reliably serves `/`, `/app.js`, `/i18n.js`, `/styles.css`, and `/api/health`.
- Current gate: `#marketStatus` CSS is fixed by focused tests, the macOS/OS sandbox EPERM blocker was cleared by user authorization, and the earlier 213/213 release-gate baseline is superseded by the post-patch 217/217 run. Later test additions make a final staged full-suite count necessary before merge.
- Current 0012 status: static/API routes are reverified after permission recovery, complete desktop/mobile browser regression reports are attached, and release gates are rerun on the post-test-patch tree.
- Close condition: stable 200 responses for the app shell/static assets/API health, followed by a complete browser regression rerun that verifies the post-fix UI.
- Fix evidence: static/API preflight returned 200 for `/`, `/app.js`, `/styles.css`, `/i18n.js`, and `/api/health`; browser reports `/private/tmp/aidm-visual-qa-20260524/aquinas-postfix-20260525-003624/regression-report.json` and `/private/tmp/aidm-visual-qa-20260525/aquinas-postfix-nolocal-20260525-004000/regression-report.json` passed with `issues=[]`; `npm run harness:check` ended with `harness check ok`.

## BUG-0001 Defeated active player can crash campaign simulation

- Status: fixed in `0003-maturity-assets-evals`
- Found by: `npm run harness:check`
- Reproduction: five-player simulation can advance to a turn where the active player has `hp = 0`; a hostile action then calls `playerAttackEnemy`, which rejects dead attackers with `player is not alive`.
- Impact: long-running games can crash during combat-heavy sessions instead of handling defeat gracefully.
- Fix: combat exchange now skips player attacks for defeated actors, targets only living players for enemy actions, and marks defeat when no living player remains.

## BUG-0002 Generated raster assets not visible in the product asset library

- Status: fixed in `0003-maturity-assets-evals`
- Found by: maturity review and browser visual QA.
- Reproduction: generated ChatGPT image assets existed under `assets/generated/`, but the app loaded only `/assets/manifest.json`; scene raster assets were also hidden behind older vector scene cards in the preview order.
- Impact: the product could claim generated image assets existed while users still saw mostly deterministic SVG placeholders.
- Fix: the web app now loads and merges `/assets/generated/manifest.json`, serves PNGs with the correct content type, reports `134 assets / 2 sheets`, and prioritizes raster cards in category previews.

## BUG-0003 Production depth gate missed log/state drift

- Status: fixed in `codex/v11-production-depth`
- Found by: production-depth status/log/evaluation review.
- Reproduction: the production-depth evaluator covered scene/audio, economy, and asset bindings, but did not fail when AI DM logs lacked reviewable clock/context fields, event timelines jumped scenes without explicit markers, or state summaries omitted quest clock / NPC intent control surfaces.
- Impact: regressions could keep tests green while making AI DM decisions hard to search, replay, or diagnose after long sessions.
- Fix: AI DM logs now carry bilingual templates with quest, danger, clue, consequence, scene-change, NPC-intent, and memory-reference hooks; state summaries expose compact trackers; the production-depth gate checks long-memory retrieval, event monotonicity, and state controllability.
