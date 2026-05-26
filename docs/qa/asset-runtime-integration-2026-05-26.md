# Asset Runtime Integration QA

Date: 2026-05-26 CST
Worker: E, end-to-end product QA

## Scope

Closed a practical validation pass after the parallel asset/rules/scene work had mostly settled. This pass focused on AI DM scene switching, generated asset runtime bindings, market/backpack buy and sell, spell acquisition through scroll use, price affordance, and broad regression commands.

I did not change manifest registration, scene selection scoring, production-depth evaluator expectations, or director/rules season logic. Those are recorded below as remaining scene/manifest/rules blockers.

## Fix Applied

Small product-visible market bug fixed:

- `src/core/gameEngine.js`: `getMarket` now accepts `playerId` and passes the current player, character, and wallet into `shopView`.
- `src/server/server.js`: `GET /api/rooms/:roomId/market` passes the authorized player id into `engine.getMarket`.
- `tests/browserAutomation.test.js`: browser QA now asserts an unaffordable market offer is disabled with `reasonCode: "insufficient-funds"`.

Why: before this fix, the market read API returned player-agnostic `purchaseState`, so an offer above the player's wallet could look buyable in the UI and only fail after clicking buy.

## Command Results

- `npm run lint`: passed, `lint ok: 95 JavaScript files checked` before the fix and `97 JavaScript files checked` during `harness:check`.
- `node --test tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/gameEngine.test.js tests/gameEngineInventory.test.js tests/rules.test.js tests/stateSummary.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js`: passed, 82 tests.
- `node --test tests/gameEngineInventory.test.js tests/inventoryEconomy.test.js`: passed, 21 tests after the market fix.
- `npm run test:browser-qa`: initially failed in sandbox with `listen EPERM: operation not permitted 127.0.0.1`; rerun with local binding allowed passed. Final rerun after the market fix passed, 3/3.
- `node --test --test-reporter=spec tests/deploymentParity.test.js`: passed, 4/4 focused.
- `npm run harness:check`: failed at `npm run test`, 330/335 passed. Details below.

## Runtime Smoke

Server:

- `PORT=4173 AIDM_DATA_FILE=/private/tmp/aidm-worker-e-browser-smoke-store.json npm run dev`
- Browser tool note: Codex in-app browser was listed but could not open a pane (`No active Codex browser pane available`). I used the live dev server HTTP/API flow plus the committed browser QA automation instead of manual screenshot evidence.

Live smoke result after the market fix:

- Created room `room_f97c13cf550c45a6`, joined, started scene, opened market.
- Unaffordable offer was correctly disabled: `healing-word-scroll`, price `138`, wallet `26`, `reasonCode: insufficient-funds`.
- Bought and sold `trail-ration`: price `8`, sale value `3`, market art and inventory binding art both `assets/generated/items/aidm-trade-good-016-01.png`; sell transcript action was `sell`.
- Bought and used `sleep-scroll`: price `89`, art `assets/spells/veil-of-sleep.svg`, learned spell `sleep`.
- Submitted an action afterward; transcript tail included `economy`, `economy`, `spell`, `player`, `roll`, `gm`.

Scene-switch smoke:

- Room `room_cb64a091438b4d7d` with two players followed the archive clue then forest travel path.
- State switched correctly: location `雾气缠绕的森林小径`, `lastShiftReason: forest-action`, weather `light rain`, season `spring`, soundscape `forest`.
- Remaining blocker: presentation scene asset stayed archive-themed instead of forest-themed.

## Remaining Blockers

1. `npm run harness:check` is still red.
   - Full test result: 330 passed, 5 failed.
   - Failing areas: deployment parity full-run timeout, deterministic engine loop season knowledge, production-depth evaluator.

2. Scene asset selection is inconsistent with switched scene state.
   - Production-depth failure: `scenario:misty-forest-drizzle` selected `aidm-macro-scene-003-07` / `scene.storm.bridge.checkpoint`; expected forest terms.
   - Runtime smoke reproduced the broader symptom: scene state and soundscape switched to forest, but `presentation.sceneAsset.semanticKey` remained `scene.ambient.moonlit-rain-archive.v01`.

3. Director knowledge can remain stale after scene shift.
   - `tests/flowClosureExtended.test.js:688` expected `shifted.director.knowledge.environment.season === "spring"` but got `autumn`.
   - The room scene itself had `season: spring`; the stale value appears to come from director knowledge being built before the scene shift/atmosphere refresh.

4. Deployment parity has a full-suite timing flake.
   - In full `harness:check`, `scripts/deployment-parity.mjs` timed out requesting `GET /api/rooms` after `5000ms`.
   - Focused `tests/deploymentParity.test.js` passed, so this looks like load/concurrency sensitivity rather than a deterministic logic failure.

Status: market/backpack pricing and runtime buy/sell/spell acquisition are closed for this pass. Scene asset alignment and stale director season knowledge remain blocked for the scene/manifest/rules owners.

## Worker W Scene Runtime Blocker Follow-up

Date: 2026-05-26 CST
Worker: W, scene-runtime blocker

### Fix Applied

- `src/core/assetSelection.js`: forest scene anchoring now uses high-weight current scene/soundscape terms, so low-weight stale transcript terms such as earlier archive investigation text no longer block forest backdrop selection after a scene shift.
- `tests/assetSelection.test.js`: added a regression where a current Mosswood forest drizzle scene with stale archive transcript text must select a forest stage backdrop and keep it first in `relevantScenes`.
- `tests/flowClosureExtended.test.js`: the deterministic archive-to-forest loop now builds presentation after the forest shift and asserts the selected presentation asset is forest-themed, not archive-themed.
- `tests/stateSummary.test.js`: added a stale director knowledge regression proving the summary and prompt pack keep the latest spring forest scene context even if `director.knowledge.environment.season` still says autumn.

### Command Results

- `node --input-type=module -e '...'` focused probe: reproduced the blocker before the fix (`scene.rain.archive.street`) and selected `scene.misty.forest.path` after the fix.
- `node --test tests/assetSelection.test.js tests/stateSummary.test.js tests/flowClosureExtended.test.js`: passed, 26/26.
- `npm run eval:production-depth`: passed, 10/10 with `failedCount: 0`.

### Status

The scene/runtime blocker covered here is closed in the focused scope: forest/drizzle selection no longer falls to an archive-themed presentation asset, `relevantScenes[0]` follows the selected forest asset, and spring season context is preserved in summary/director-facing prompt evidence. No remaining scene/runtime blocker was reproduced by the focused commands above.

## Worker U Runtime Generated PNG Exposure Follow-up

Date: 2026-05-26 CST
Worker: U, runtime-generated-PNG exposure auditor

### Findings

Current runtime direct generated PNG refs across `src` and `public`: 312 occurrences, 209 unique PNG refs, all present in `assets/generated/manifest.json`.

The untracked/runtime-promoted risk set is 102 unique PNG refs after one small fix. Categories: spell 46, icon 29, item 17, status 10, scene 0.

File split for the untracked/internal set:

- `src/core/rules.js`: 85 unique refs, covering spell/rule/class/status bindings.
- `public/app.js`: 32 unique refs, overlapping the rule/spell/icon set through browser fallbacks.
- `src/core/itemCatalog.js`: 19 unique refs, covering 17 item refs and 2 spell-scroll item refs.

Manifest state for those 102 refs: 102/102 `visibility: runtime-promoted`, 102/102 `uiSurface: ["ui-approved-runtime"]`, 102/102 `quality.approved: false`, 96/102 `metadata-registered-internal`, and 6/102 `accept-with-risk`.

### Fix Applied

- `src/core/itemCatalog.js`: retargeted `leather` from untracked/internal `assets/generated/items/aidm-equipment-tool-047-09.png` to tracked/player-safe `assets/generated/items/aidm-wearable-cutout-023-02.png`.
- `tests/itemCatalog.test.js`: updated the focused assertion for the `leather` asset binding.

This reduced the current untracked runtime risk set from 103 to 102.

### Remaining Risk

The remaining 102 refs are real player-visible dependencies, not documentation-only references. The current manifest uses source-bound `runtime-promoted` metadata rather than broad `player-safe` promotion, so they still must not enter generated catalog or resolver pools without separate visual QA. The 058 status/hazard subset still carries `accept-with-risk`.

Detailed grouped asset id/path patterns and counts are recorded in `docs/qa/legacy-asset-reference-audit-2026-05-26.md`.

## Worker T Legacy Asset Reference Audit

Date: 2026-05-26 CST
Worker: T, legacy-asset reference auditor

### Scope

Focused audit only for runtime references that still point at legacy SVG or placeholder asset paths after generated asset import. I did not run full harness, browser screenshots, E2E, manifest generation, or release hygiene tasks.

### Findings

- Focused runtime scan initially found 22 `ITEM_CATALOG` asset refs under the priority legacy directories `assets/items` and `assets/spells`; no `assets/icons` legacy refs were found in runtime rule bindings.
- After this patch, 19 item catalog refs remain in the priority legacy directories: 10 `spellScroll`, 4 `tool`, 3 `tradeGood`, 1 `quest`, and 1 `consumable`.
- `RULE_ASSET_BINDINGS` has no old `assets/spells`, `assets/icons`, or `assets/items` files. All spell ids have generated spell art bindings.
- Combat skill cards had 2 generated-art misses because `break-line` and `relentless-advance` used `artKey: "movement"` while the generated action binding key is `move`.
- Loot/reward pool audit covered 26 `ITEM_LOOT_POOLS` entries and found 0 priority legacy refs.

### Fix Applied

- `src/core/itemCatalog.js`: promoted `leather` from `assets/items/healer-kit.svg` to `assets/generated/items/aidm-equipment-tool-047-09.png` using the manifest/display-map Leather Armor Cutout binding.
- `src/core/itemCatalog.js`: promoted `healing-word-scroll` from `assets/spells/mend-wounds.svg` to `assets/generated/spells/aidm-spell-scroll-rune-057-08.png`.
- `src/core/itemCatalog.js`: promoted `sleep-scroll` from `assets/spells/veil-of-sleep.svg` to `assets/generated/spells/aidm-spell-scroll-rune-057-10.png`; this supersedes the earlier runtime smoke note that saw the old sleep scroll art.
- `src/core/rules.js`: changed combat skill art keys for `break-line` and `relentless-advance` from `movement` to `move`, so both resolve to generated action icon `aidm-action-icon-042-16`.
- `tests/itemCatalog.test.js` and `tests/rules.test.js`: added focused regressions for these generated bindings.

### Not Fixed

The remaining legacy refs were not hard-mapped because the generated library only showed broad or adjacent candidates for several old assets, not a direct one-to-one replacement in the current runtime data. Examples: `storm-lantern` only had adjacent lantern oil/light overlay candidates, `climbing-rope` had rope ladder/consumable rope candidates, and `moon-silk` had shadow silk/silk bolt candidates. These should be promoted in a follow-up mapping pass with product approval or an explicit description-map row.

### Command Results

- `node --check src/core/itemCatalog.js`: passed.
- `node --check src/core/rules.js`: passed.
- Focused runtime audit script: remaining old item refs `19`; missing spell art `0`; old rule bindings `0`; missing combat skill art `0`; old combat skill art `0`.
- Loot pool audit script: 26 loot pool entries checked, 0 priority legacy refs.
- `node --test tests/itemCatalog.test.js tests/rules.test.js`: passed, 34/34.
- `git diff --check`: passed.

## Worker AE Generated Asset Promotion Policy

Date: 2026-05-26 CST
Worker: AE, generated asset promotion policy

### Fix Applied

- `assets/generated/manifest.json`: the 102 audited runtime-visible Kepler PNG slices now use `visibility: "runtime-promoted"` and `uiSurface: ["ui-approved-runtime"]` instead of `visibility: "internal"` and `uiSurface: ["catalog-internal"]`.
- `scripts/register-generated-description-maps.mjs`: registration now recomputes exact runtime promotions from literal generated PNG refs under `src` and `public`, so the boundary is source-bound and does not promote all 768 Kepler icon/cutout rows.
- Focused tests now assert that the 102 promoted rows carry `runtimePromotion.status: "ui-approved-runtime"`, remain out of player-safe selection pools, and do not enter generated catalog exposure.

### Status

The generated asset boundary blocker for the audited 102 runtime dependencies is closed. These assets are allowed only for audited source-bound UI paths; they are not broad `player-safe` or marketplace assets, and `quality.approved` remains false until separate visual QA.

## Worker U Post-Promotion Reconciliation

Date: 2026-05-26 CST
Worker: U, runtime-generated-PNG exposure auditor

After the source-bound promotion policy landed, I reran the runtime PNG exposure scan and focused tests. Current state:

- Runtime direct generated PNG refs: 312 occurrences, 209 unique refs.
- Untracked runtime dependency union: 102 unique refs, all present in the manifest.
- The 102 refs are now `visibility: "runtime-promoted"` with `uiSurface: ["ui-approved-runtime"]`, not `internal`.
- `quality.approved` remains `false` for all 102; 6 status/hazard assets remain `accept-with-risk`.
- `leather` is currently bound to tracked/player-safe `assets/generated/items/aidm-wearable-cutout-023-02.png`, superseding the earlier internal `aidm-equipment-tool-047-09.png` mapping noted above.

Focused validation after this reconciliation passed: `node --check` for `src/core/itemCatalog.js`, `src/core/rules.js`, and `public/app.js`; the related generated asset/item/rule/UI test command passed 80/80; `git diff --check` passed.
