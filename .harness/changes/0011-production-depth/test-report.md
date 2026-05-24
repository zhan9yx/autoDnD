# Test Report

Status: production-depth eval worker complete as of 2026-05-24.

Implemented deterministic local gate:

- `evals/production-depth/scenarios.json` defines reusable scene/audio consistency scenarios.
- `scripts/evaluate-production-depth.mjs` runs without online model calls and writes JSON reports.
- `tests/productionDepth.test.js` covers the evaluator API, CLI report writing, scene asset matching, soundscape matching, structured log safety, economy invariants, and generated asset binding checks.
- `package.json` was not changed to avoid conflicting with parallel workers; run the gate directly with `node scripts/evaluate-production-depth.mjs evals/production-depth/scenarios.json`.

Verified:

- `node --test tests/productionDepth.test.js` passed: 2/2.
- `node scripts/evaluate-production-depth.mjs evals/production-depth/scenarios.json` passed: 6/6 checks, passRate 1.
- `npm run lint` passed: 69 JavaScript files checked.

Full-suite status:

- `npm run test` ran 112 tests: 111 passed, 1 failed.
- Failure is outside this worker's write scope: `tests/ambienceEngine.test.js` expects `engine.getState()` without `safetyReasons`, but the current implementation returns `safetyReasons: []`.

Remaining planned v11 gates for other workers:

- `npm run eval:memory:16h`
- `npm run smoke`
- `npm run harness:check`
- Browser QA for one-screen player flow, character creation, market, inventory, scene/audio alignment, and TTS settings.

## QA Worker Update

Status: QA/player-feedback pass complete as of 2026-05-24.

Browser QA covered:

- Create Chinese room from gateway.
- Join as a low-context player.
- Start scene and submit one clue-search action.
- Inspect character drawer, state drawer, settings/audio drawer, and market drawer.
- Reload the same room and test seat continuity.
- Join again after lost local seat state and buy a market item.

Tests added or extended:

- `tests/bilingualUi.test.js`: added production-depth bilingual label coverage for market, player dock, starter spells, character summary, slot labels, and point-budget overflow.
- `tests/playerUiAccess.test.js`: extended player-surface assertions for market drawer, market list, player summary dock, starter spell cards, buy flow, market refresh, and player summary render hooks.
- `tests/gameEngineInventory.test.js`: added a Chinese market economy regression that requires localized item names and localized currency labels in market offers and purchase logs.

Verification:

- `node --test tests/bilingualUi.test.js tests/playerUiAccess.test.js tests/staticUiStructure.test.js` passed: 6/6.
- `node --test tests/gameEngineInventory.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js tests/staticUiStructure.test.js` failed 1/14 as expected from QA finding:
  - `tests/gameEngineInventory.test.js:87` expects Chinese market `priceLabel` to end with `克朗`; current value is `89 CR`.
- `npm run test` currently fails 4 generated-asset tests outside this QA patch:
  - `tests/generatedAssets.test.js:32` expected raster inventory count 9, current 11.
  - `tests/generatedAssets.test.js:68` expected player-safe generated asset count 128, current 164.
  - `tests/generatedAssets.test.js:108` expected player-safe visibility count 128, current 164.
  - `tests/generatedAssets.test.js:248` expected generated reward assets to be player-safe/runtime-addressable, current assertion false.

Primary QA-blocking product issues:

- Refresh/reopen can lose local seat identity and invite duplicate character creation.
- Chinese market cards and economy logs still leak English/currency strings.
- Market disabled states lack reasons.
- Item/market assets are not visible at purchase/inspect time.
- One-viewport table is still crowded at 1280x720, with the action area visually clipped.

## Production-Depth Eval Integration Update

Status: production-depth npm/harness integration complete as of 2026-05-24.

Changes:

- Added reusable `npm run eval:production-depth`.
- The npm gate runs `scripts/evaluate-production-depth.mjs` against `evals/production-depth/scenarios.json` with `--no-report`, so the harness gate is deterministic and does not create timestamped report files.
- Added the production-depth gate to `npm run harness:check` after long-memory eval and before campaign simulation.
- Extended `tests/productionDepth.test.js` to assert the npm script wiring and no-report CLI path.

Verified:

- `node --test tests/productionDepth.test.js` passed: 3/3.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1.
- `npm run lint` passed: 69 JavaScript files checked.
- `npm run test` passed: 130/130.
- `npm run harness:check` passed after local-server sandbox escalation; it ran lint, 130/130 tests, long-memory eval, production-depth eval, five-player campaign simulation, and Harness report completeness checks.

Note:

- A first sandboxed `npm run harness:check` attempt failed at `tests/serverRoutes.test.js` with `listen EPERM: operation not permitted 127.0.0.1`; rerunning with permission to bind the local test server passed.

## UI QA Worker Update

Status: static UI QA pass complete as of 2026-05-24.

Scope covered:

- Character icon cards: player-facing `button type="button"` builder cards for species/class, wired through local select sync and `aria-pressed`.
- Starter spell cards: rendered from the player class select into `starterSpellCards`; no admin spell-edit hooks exposed.
- Market drawer: default hidden/inert overlay drawer with player wallet, market list, buy action, join prompt, and no market admin/spawn/edit controls.
- Progress summary: player dock plus character progress summary render hooks for level/xp.
- Equipment slots: rendered from player inventory through weapon/armor/focus/kit slot summary and constrained for compact drawer layout.
- No-scroll structure: table remains `100dvh`, body locks scroll during table mode, drawers are fixed overlays, and drawer interiors use internal overflow.

Tests added or extended:

- `tests/noScrollUi.test.js`: added no-scroll constraints for the 5-column player summary strip, character/market drawer internal overflow, card fixed heights, equipment grid, market card grid, and mobile single-column fallbacks.
- `tests/playerUiAccess.test.js`: added a v11 player-scope regression test for role icon cards, starter spell cards, progress summary, equipment slots, market drawer, buy endpoint usage, and absence of admin/edit hooks.
- `tests/staticUiStructure.test.js`: expanded static structure coverage for exact species/class card options, starter spell rendering, progress/equipment hooks, accessibility pressed state, and text-overflow constraints.

Verification:

- `node --test tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/staticUiStructure.test.js` passed: 4/4.

## Final Gate Worker Update

Status: final gate pass attempted on current working tree as of 2026-05-24.

Commands run:

- `npm run lint` passed: 70 JavaScript files checked.
- `npm run test` passed: 134/134.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events.
- `npm run smoke` failed in sandbox before product assertions:
  - `TypeError: fetch failed`
  - `connect EPERM ::1:4173`
  - `connect EPERM 127.0.0.1:4173`
  - Needs main thread rerun with localhost connect permission and a server available at `localhost:4173`.
- `npm run harness:check` failed in sandbox during its internal `npm run test` step:
  - `tests/serverRoutes.test.js:13` / `server routes expose market, buy, sell, memo, and item-use flows`
  - `Error: listen EPERM: operation not permitted 127.0.0.1`
  - Needs main thread rerun with localhost listen permission.

Notes:

- No code or asset files were changed by this worker.
- The earlier direct `npm run test` invocation passed before `harness:check`; the harness failure is recorded as sandbox-localhost related, not as an application assertion failure.

## Browser Player QA Worker Update

Status: browser player QA pass complete as of 2026-05-24.

Environment:

- Reused existing local server: `node src/server/server.js` pid `96369`, health OK at `http://127.0.0.1:4173/api/health`.
- Browser room created during QA: `http://127.0.0.1:4173/?room=room_01ea7856c1d94c7a`.
- Screenshots saved under `/private/tmp/aidm-v11-qa/`.

Browser path verified:

- Gateway create-room flow works in Chinese UI.
  - Evidence: `/private/tmp/aidm-v11-qa/01-gateway.png`, `/private/tmp/aidm-v11-qa/02-room-created.png`.
- Role card selection works: clicked `Elf` and `Mage`; hidden selects updated to `species=elf`, `classId=mage`.
- Budget feedback works: after Mage selection, UI showed `27 / 27 点 · 可加入 · 推荐 心智 + 精神`.
  - Evidence: `/private/tmp/aidm-v11-qa/03-card-select-budget.png`.
- Join works: joined as `QA Player` / `V11 Browser Mage`; setup panel hid; `我的角色` and `市场` became enabled; player dock showed `1 级 · 0 XP · 武器/护甲/-/工具`.
  - Evidence: `/private/tmp/aidm-v11-qa/04-joined-table.png`.
- Market drawer works: wallet showed `120 克朗`; available offers rendered; buying `storm-lantern` reduced wallet to `40 克朗`.
  - Evidence: `/private/tmp/aidm-v11-qa/05-market-open.png`, `/private/tmp/aidm-v11-qa/06-market-after-buy.png`.
- Character/backpack drawer works: inventory listed starter items plus purchased `暴风提灯`; equipment summary showed weapon/armor/tool slots.
  - Evidence: `/private/tmp/aidm-v11-qa/07-character-inventory.png`, `/private/tmp/aidm-v11-qa/08-inventory-item-detail.png`.
- Item use works: bought `festival-wine`, selected `节庆红酒`, `使用` was enabled, clicked it, item was consumed, and transcript recorded `V11 Browser Mage使用了Festival Wine。`
  - Evidence: `/private/tmp/aidm-v11-qa/10-buy-festival-wine.png`, `/private/tmp/aidm-v11-qa/11-wine-detail-before-use.png`, `/private/tmp/aidm-v11-qa/12-after-use.png`.
- Scene image and soundscape are consistent: stage backdrop used `/assets/generated/scenes/aidm-macro-scene-003-01.png`; location was rain-wet archive street; soundscape was `light-rain` / `细雨与湿石`; reason matched `wet` and `雨`.
  - Evidence: `/private/tmp/aidm-v11-qa/13-settings-soundscape.png`.
- No page scroll observed at every checked step: `scrollX=0`, `scrollY=0`, `document.body.scrollHeight=720`, `innerHeight=720`, and `body overflow=hidden`.

Issues found:

- Market offer cards still display price labels as `CR` in Chinese UI, while wallet uses `克朗`.
  - Browser evidence: `/private/tmp/aidm-v11-qa/05-market-open.png`; DOM text included `89 CR`, `80 CR`, `28 CR`.
- There is no explicit player UI action to equip a purchased equipment/tool item. The character drawer shows equipped starter slots, but purchased `暴风提灯` only exposed disabled `使用` and enabled `出售`.
  - Browser evidence: `/private/tmp/aidm-v11-qa/08-inventory-item-detail.png`.
- Economy naming in Chinese flow still leaks English item names in transcript after purchase/use, e.g. `Storm Lantern` and `Festival Wine`.
  - Browser evidence: `/private/tmp/aidm-v11-qa/12-after-use.png`.

Tests run:

- `node --test tests/playerUiAccess.test.js tests/noScrollUi.test.js tests/inventoryEconomy.test.js tests/bilingualUi.test.js` passed: 10/10.
- First sandboxed `npm run smoke` failed with localhost connect `EPERM`.
- Reran `npm run smoke` with localhost permission; passed with `ok: true`, `roomId: room_7f0911c4fd074e32`, `assetCount: 82`, `generatedAssetCount: 344`, `soundscape: light-rain`, `transcript: 12`, `soundscapePresets: 19`.

## Browser Player QA Round 2 Update

Status: browser QA retest complete as of 2026-05-24.

Environment:

- Restarted stale local server and retested current working tree at `http://127.0.0.1:4173/`.
- Current QA room: `http://127.0.0.1:4173/?room=room_d27ed591117a44b9`.
- Screenshots saved under `/private/tmp/aidm-v11-qa-round2/`.

Retest coverage:

- Created Chinese room, joined as an elf mage, checked no page scroll at 1280x720.
  - Evidence: `/private/tmp/aidm-v11-qa-round2/01-gateway-current.png`, `/private/tmp/aidm-v11-qa-round2/02-room-current.png`, `/private/tmp/aidm-v11-qa-round2/03-card-select-current.png`, `/private/tmp/aidm-v11-qa-round2/04-joined-current.png`.
- Market drawer now renders Chinese prices consistently with wallet currency; DOM scan found no `CR` leak in the market drawer before buy.
  - Evidence: `/private/tmp/aidm-v11-qa-round2/05-market-current.png`.
- Buying `storm-lantern` in Chinese now writes localized economy text: `当前复测法师购买了暴风提灯，花费 80 克朗。`; DOM scan found no `Storm Lantern`, `Festival Wine`, or `CR` leak after current-server retest.
  - Evidence: `/private/tmp/aidm-v11-qa-round2/06-market-after-buy-current.png`.
- Character drawer shows purchased `暴风提灯` in the backpack with localized value labels.
  - Evidence: `/private/tmp/aidm-v11-qa-round2/07-character-current.png`.
- Equipment action is visible for equippable inventory detail: selecting equipped `橡木杖` shows a disabled `装备` button plus `使用` and `出售`.
  - Evidence: `/private/tmp/aidm-v11-qa-round2/12-equipped-staff-detail-current.png`.
- Scene/soundscape remain semantically aligned: table soundscape is `light-rain`; scene backdrop API selected `assets/generated/scenes/aidm-macro-scene-003-01.png` / `Rain Archive Plaza`; settings show `细雨与湿石`.
  - Evidence: `/private/tmp/aidm-v11-qa-round2/10-settings-soundscape-current.png`, `/private/tmp/aidm-v11-qa-round2/11-final-state-current.png`.
- No-scroll check passed at inspected states: `scrollX=0`, `scrollY=0`, `document.body.scrollHeight=720`, `innerHeight=720`, `body overflow=hidden`.

Round 2 issues still visible:

- Player-facing Chinese UI still leaks English/debug labels in the main play surface: `foreshadowed`, `Threat`, and `Clues`.
- Soundscape reason is only partially localized: settings show `Weather matched wet; location matched 雨; ... director beat hook; tone mystery; pressure 0.17.`
- Market offer disabled states still lack player-facing reasons; unaffordable items and already bought expensive items only disable `购买`.
- Market and inventory item detail still do not display item art. Current browser DOM had no visible `<img>` elements; visible background assets were the avatar and scene backdrop only.
- `暴风提灯` is still not equippable from the player UI because the catalog/API snapshot gives it `slot: null`; this may be intentional tool modeling, but it does not satisfy the earlier low-context expectation that a purchased tool can be equipped.

Verification:

- `node --test tests/gameEngineInventory.test.js` passed: 10/10.
- `node --test tests/serverRoutes.test.js` passed with local listen permission: 3/3.

## Smoke/Harness Worker Update

Status: sandbox smoke/harness pass attempted on current working tree as of 2026-05-24.

Commands run:

- `npm run lint` passed: 70 JavaScript files checked.
- `npm run test` passed: 142/142.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events.
- `npm run simulate:campaign` passed: ok true, players 5, round 6, transcript 107, memories 26, combatLog 18, replayHighlights 8.
- `npm run smoke` failed before product assertions because sandbox localhost connect is blocked:
  - `TypeError: fetch failed`
  - `connect EPERM ::1:4173`
  - `connect EPERM 127.0.0.1:4173`
  - Needs main thread rerun with localhost connect permission and a server available at `localhost:4173`.
- `npm run harness:check` failed during its internal `npm run test` step because sandbox localhost listen is blocked:
  - `tests/serverRoutes.test.js:13` / `server routes expose market, buy, sell, memo, and item-use flows`
  - `tests/serverRoutes.test.js:130` / `server routes keep repeated market buys and Chinese economy labels consistent`
  - `tests/serverRoutes.test.js:205` / `server route equips inventory items with token and version checks`
  - Each failure was `Error: listen EPERM: operation not permitted 127.0.0.1`.
  - Needs main thread rerun with localhost listen/connect permission.

Notes:

- No code or asset files were changed by this worker.
- The direct `npm run test` invocation passed before `harness:check`; the harness failure is recorded as sandbox-localhost related, not an application assertion failure.

## Final Full Test Worker Update

Status: final full non-localhost test pass complete on current working tree as of 2026-05-24 17:13:43 CST.

Commands run:

- `npm run lint` passed: `lint ok: 70 JavaScript files checked`.
- `npm run test` passed: 142/142 tests, 0 failed, duration 4962.825834 ms.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1, dataset `production-depth-v1`, duration 233 ms.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events, dataset `16h-v1`, duration 335 ms.

## Seat Reclaim Worker Update

Status: localStorage/player-token recovery and seat-ownership retest complete as of 2026-05-24.

Changes:

- `public/app.js` now stores joined player sessions under room-scoped keys: `aidm.rooms.<roomId>.playerId` and `aidm.rooms.<roomId>.playerToken`.
- `openRoom()` restores the room-scoped player id/token before rendering, so refreshing or reopening the same room reclaims the existing local seat instead of showing the character creation form.
- If the globally cached `aidm.playerId` belongs to a different room and there is no matching room-scoped saved seat, the current in-memory player id/token are cleared for that room. This keeps the UI in unseated mode and avoids sending another room's token.

Retest coverage:

- Refresh/seat reclaim: `tests/playerUiAccess.test.js` asserts join writes room-scoped session keys and `openRoom()` restores them before assigning/rendering the next room snapshot.
- Duplicate join: `tests/serverRoutes.test.js` asserts repeated `/join` calls create separate seats with separate tokens and keep the first joined player as `activePlayerId`.
- Token ownership: `tests/serverRoutes.test.js` asserts the first seat token cannot chat as the duplicate seat (`403 PLAYER_TOKEN_REQUIRED`).
- Turn ownership: `tests/serverRoutes.test.js` asserts the duplicate seat cannot submit the first action while the original seat owns the active turn.

Verification:

- `node --test tests/playerUiAccess.test.js` passed: 2/2.
- First sandboxed `node --test tests/serverRoutes.test.js` failed before product assertions with `listen EPERM: operation not permitted 127.0.0.1`.
- Reran `node --test tests/serverRoutes.test.js` with local listen permission; passed: 4/4.

Not run by request:

- `npm run smoke` was not run because it requires localhost.
- `npm run harness:check` was not run because it includes localhost-bound smoke/server checks.

Failure summary:

- No failures in the requested non-localhost commands.

## Final Browser Retest Worker 2 Update

Status: final browser retest complete on current working tree as of 2026-05-24 17:52 CST.

Environment:

- Started local server with `npm run dev`; health OK at `http://127.0.0.1:4173/api/health`.
- Browser room: `http://127.0.0.1:4173/?room=room_b29e0b8272e94bf4`.
- Viewport: 1280x720.
- Screenshots saved under `/private/tmp/aidm-v11-qa-final2/`.

Retest coverage and results:

- Backpack detail `<img>`: passed for generated reward item detail. Selecting `雨城地图` in `我的角色` showed a visible detail image at `/assets/generated/items/aidm-market-item-009-09.png`, 62x62, alt `雨城地图`.
  - Evidence: `/private/tmp/aidm-v11-qa-final2/12-backpack-map-detail-img.png`.
- Market item `<img>`: passed. Market cards rendered visible item art for scrolls, consumables, trade goods, and `暴风提灯`; sampled images were 40x40 with localized alt text.
  - Evidence: `/private/tmp/aidm-v11-qa-final2/04-market-open.png`, `/private/tmp/aidm-v11-qa-final2/10-market-after-storm-lantern-buy.png`.
- Market disabled reason aria/title: passed. Disabled buy buttons expose localized names such as `购买治疗真言法卷：克朗不足`, `购买暴风提灯：克朗不足` in both `aria-label` and `title`.
- Market disabled reason visible text: still not fully passing. The visible card text only shows item, price, and disabled `购买`; `克朗不足` is not visibly rendered near the disabled button.
  - Evidence: `/private/tmp/aidm-v11-qa-final2/10-market-after-storm-lantern-buy.png`.
- Market Chinese status/economy: mostly passed. Wallet and prices use `克朗`, and buying `暴风提灯` logged `最终复测法师2购买了暴风提灯，花费 80 克朗。`; no `CR`, `Storm Lantern`, or `Festival Wine` leak was observed in the current market/economy path.
- Chinese UI status: partially passing. Main UI is Chinese, but visible role/status text still includes `Mage`; settings voice options intentionally or unintentionally show English IDs in parentheses, e.g. `(narrator)`, `(rules)`, `(mage)`.
  - Evidence: `/private/tmp/aidm-v11-qa-final2/11-character-backpack.png`, `/private/tmp/aidm-v11-qa-final2/16-settings-soundscape.png`.
- Soundscape reason: passed for current scene after travel to market. Settings showed `市场与城市街道` and localized reason text `已匹配当前地点氛围。`; no English debug reason such as `Weather matched`, `director beat`, or `tone mystery` was visible.
  - Evidence: `/private/tmp/aidm-v11-qa-final2/16-settings-soundscape.png`.
- No-scroll: passed in inspected states. Measurements stayed `scrollX=0`, `scrollY=0`, `document.body.scrollHeight=720`, `document.documentElement.scrollHeight=720`, `innerHeight=720`, `body overflow=hidden`.
- Equipment button and equipment summary update: not verified as passing. Selecting currently equipped `橡木杖` shows an `装备` button, but it is disabled because the item is already equipped. Purchased `暴风提灯` and generated `雨城地图` do not expose an equip action. Multiple reward attempts using `old coffer`, `glassfang-dagger`, `aidm-weapon-014-04`, `fallen raider kit`, and `tower-shield` still produced/repeated `雨城地图`, so this browser path never reached an enabled equip button.
  - Evidence: `/private/tmp/aidm-v11-qa-final2/13-equipped-staff-detail.png`, `/private/tmp/aidm-v11-qa-final2/14-after-crisis-shield-reward.png`, `/private/tmp/aidm-v11-qa-final2/15-after-crisis-advantage-reward.png`.

Screenshots:

- `/private/tmp/aidm-v11-qa-final2/01-room-created.png`
- `/private/tmp/aidm-v11-qa-final2/02-character-selected.png`
- `/private/tmp/aidm-v11-qa-final2/03-joined.png`
- `/private/tmp/aidm-v11-qa-final2/04-market-open.png`
- `/private/tmp/aidm-v11-qa-final2/05-after-reward-action.png`
- `/private/tmp/aidm-v11-qa-final2/06-after-weapon-reward-action.png`
- `/private/tmp/aidm-v11-qa-final2/07-after-weapon-reward-submit.png`
- `/private/tmp/aidm-v11-qa-final2/08-after-dagger-reward-submit.png`
- `/private/tmp/aidm-v11-qa-final2/09-after-exact-weapon-reward-submit.png`
- `/private/tmp/aidm-v11-qa-final2/10-market-after-storm-lantern-buy.png`
- `/private/tmp/aidm-v11-qa-final2/11-character-backpack.png`
- `/private/tmp/aidm-v11-qa-final2/12-backpack-map-detail-img.png`
- `/private/tmp/aidm-v11-qa-final2/13-equipped-staff-detail.png`
- `/private/tmp/aidm-v11-qa-final2/14-after-crisis-shield-reward.png`
- `/private/tmp/aidm-v11-qa-final2/15-after-crisis-advantage-reward.png`
- `/private/tmp/aidm-v11-qa-final2/16-settings-soundscape.png`

## Smoke/Harness Worker Current Result

Status: current smoke/harness sandbox pass complete on current working tree as of 2026-05-24. This section records this worker's latest run and should be read after earlier final-gate notes.

Commands run:

- `npm run lint` passed: `lint ok: 70 JavaScript files checked`.
- `npm run test` passed: 142/142 tests, 0 failed, duration 4770.113166 ms.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1, dataset `production-depth-v1`, duration 224 ms.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events, dataset `16h-v1`, duration 310 ms.
- `npm run simulate:campaign` passed: ok true, players 5, round 6, transcript 107, memories 26, combatLog 18, replayHighlights 8, directorBeat `revelation`.
- `npm run smoke` failed before product assertions because sandbox localhost connect is blocked:
  - `TypeError: fetch failed`
  - `connect EPERM ::1:4173`
  - `connect EPERM 127.0.0.1:4173`
  - Needs main thread rerun with localhost connect permission and a server available at `localhost:4173`.
- `npm run harness:check` failed during its internal `npm run test` step because sandbox localhost listen is blocked:
  - `tests/serverRoutes.test.js:13` / `server routes expose market, buy, sell, memo, and item-use flows`
  - `tests/serverRoutes.test.js:130` / `server routes keep repeated market buys and Chinese economy labels consistent`
  - `tests/serverRoutes.test.js:205` / `server route equips inventory items with token and version checks`
  - Each failure was `Error: listen EPERM: operation not permitted 127.0.0.1`.
  - Needs main thread rerun with localhost listen/connect permission.

Failure summary:

- No application assertion failures were observed in direct lint, test, production-depth eval, memory eval, or campaign simulation.
- Smoke and full harness remain blocked in this sandbox only by localhost permission.

## Smoke/Harness Prep Worker Update

Status: smoke and harness v11 coverage prep complete as of 2026-05-24 17:17:14 CST.

Changes made:

- `scripts/smoke-flow.mjs`: added lightweight v11 assertions for generated market item, production scene, and equipment-fashion sheet counts; production scene soundscape hints; Chinese market price localization; market buy inventory/economy mutation; equipped starting gear; and the item equip endpoint/equipment summary.
- `scripts/harness.mjs`: added `npm run smoke` to `harness:check` after memory and production-depth evals, so the harness gate now includes the smoke assertions before campaign simulation.

Verification run:

- `node --check scripts/smoke-flow.mjs` passed.
- `node --check scripts/harness.mjs` passed.
- `npm run lint` passed: 70 JavaScript files checked.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1.

Not run in this worker:

- `npm run smoke` needs a local server at `localhost:4173` and localhost connect permission.
- `npm run harness:check` now includes `npm run smoke` plus localhost-bound server route tests, so it needs main thread localhost permissions.

## Final Browser Retest Worker Update

Status: final browser retest complete on current working tree as of 2026-05-24 17:18 CST.

Environment:

- Started local dev server with `npm run dev` at `http://localhost:4173`.
- Browser retest used `http://127.0.0.1:4173/`.
- Screenshots saved under `/private/tmp/aidm-v11-qa-final/`.

Retest coverage and result:

- Chinese state/status labels are fixed in the main play surface and drawers. Browser text showed `有征兆`, `威胁`, and `线索`; page-wide leak check found no visible `foreshadowed`, `Threat`, or `Clues`.
  - Evidence: `/private/tmp/aidm-v11-qa-final/02-room-created.png`, `/private/tmp/aidm-v11-qa-final/05-started.png`, `/private/tmp/aidm-v11-qa-final/17-state-drawer.png`.
- Soundscape reason debug text is fixed for this path. Settings and State both showed `细雨与湿石` plus `已匹配当前天气氛围。`; page-wide leak check found no `Weather matched`, `director beat`, `tone mystery`, or `pressure` debug phrasing.
  - Evidence: `/private/tmp/aidm-v11-qa-final/16-settings-soundscape.png`, `/private/tmp/aidm-v11-qa-final/17-state-drawer.png`.
- Market item art is fixed. The market drawer rendered 12 item `<img>` elements, including disabled and purchasable offers.
  - Evidence: `/private/tmp/aidm-v11-qa-final/06-market-open.png`, `/private/tmp/aidm-v11-qa-final/07-market-after-buy.png`.
- Market disabled reasons are partially fixed. Disabled buy buttons now expose localized `克朗不足` in `title` and `aria-label`, but the visible card text still only shows a disabled `购买` button without a directly visible reason.
  - Evidence: `/private/tmp/aidm-v11-qa-final/06-market-open.png`, `/private/tmp/aidm-v11-qa-final/07-market-after-buy.png`.
- Backpack/item detail art is not fixed. Character inventory and item detail still rendered fallback glyphs such as `暴`, `现`, and `短`; inspected backpack/detail DOM had `imgCount: 0`.
  - Evidence: `/private/tmp/aidm-v11-qa-final/08-character-inventory.png`, `/private/tmp/aidm-v11-qa-final/09-storm-lantern-detail.png`, `/private/tmp/aidm-v11-qa-final/13-shortbow-detail-before-equip.png`.
- Equipment button/API remains product-visible problematic. `暴风提灯` and `现场札记` still expose no `装备` button because they have no slot. A Rogue route showed `短弓` detail with a disabled `装备` button even though the equipment summary still showed `匕首` in the weapon slot; stored room state had both `dagger` and `shortbow` marked `equipped: true`, so the UI could not equip/switch by button.
  - Evidence: `/private/tmp/aidm-v11-qa-final/09-storm-lantern-detail.png`, `/private/tmp/aidm-v11-qa-final/10-field-notes-detail-before-equip.png`, `/private/tmp/aidm-v11-qa-final/13-shortbow-detail-before-equip.png`, `/private/tmp/aidm-v11-qa-final/14-rogue-equip-current.png`.

Current final browser verdict:

- Fixed: Chinese status/Threat/Clues, soundscape debug reason text, market item art.
- Partially fixed: market disabled reasons are accessible via title/aria but not visible on the card.
- Still open: backpack/item detail art and equipment switch affordance for the tested inventory paths.
- `node --test tests/playerUiAccess.test.js tests/noScrollUi.test.js tests/inventoryEconomy.test.js tests/bilingualUi.test.js tests/gameEngineInventory.test.js tests/serverRoutes.test.js tests/soundscape.test.js tests/assetSelection.test.js` passed 32/35 in sandbox and failed only the three `tests/serverRoutes.test.js` cases with `listen EPERM: operation not permitted 127.0.0.1`; those same server route tests passed when rerun with local listen permission.

Notes:

- The first browser attempt in this round reused stale server pid `96369` and still showed `Storm Lantern`; that was discarded after restart because unit tests and the current server both confirm the localization fix.
- No files outside `.harness/changes/0011-production-depth/test-report.md` were changed by this QA worker.

## Final Gate Worker Update 2

Status: final gate rerun attempted on current working tree as of 2026-05-24.

Commands run:

- `npm run lint` passed: 70 JavaScript files checked.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events.
- `npm run test` failed: 139/140 passed.
  - Blocking failure: `tests/guide.test.js:17` / `guide documents exist and cover core user flows`.
  - The test expects `docs/USER_GUIDE.md` to contain a heading matching `/## .*Opening\s+a\s+Room/i`; current guide uses `## Rooms` and the beginner tutorial uses `## Step 1: Open A Room`.
- `npm run smoke` failed in sandbox before product assertions:
  - `TypeError: fetch failed`
  - `connect EPERM ::1:4173`
  - `connect EPERM 127.0.0.1:4173`
  - Needs main thread rerun with localhost connect permission and a server available at `localhost:4173`.
- `npm run harness:check` failed.
  - Product/test blocker: same `tests/guide.test.js:17` heading mismatch described above.
  - Sandbox-localhost blockers: three `tests/serverRoutes.test.js` cases failed with `listen EPERM: operation not permitted 127.0.0.1`; these need main thread rerun with localhost listen permission after the guide failure is fixed.

Notes:

- No code, asset, or docs files were changed by this worker.
- Final gate remains blocked until the guide heading regression is fixed and localhost-dependent smoke/harness paths are rerun with permission.

## Final Full Test Worker Current Result

Status: current final full non-localhost test pass complete on current working tree as of 2026-05-24 17:13:43 CST. This supersedes earlier final-gate records above from older working-tree states.

Commands run:

- `npm run lint` passed: `lint ok: 70 JavaScript files checked`.
- `npm run test` passed: 142/142 tests, 0 failed, duration 4962.825834 ms.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1, dataset `production-depth-v1`, duration 233 ms.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events, dataset `16h-v1`, duration 335 ms.

Not run by request:

- `npm run smoke` was not run because it requires localhost.
- `npm run harness:check` was not run because it includes localhost-bound smoke/server paths.

Failure summary:

- No failures in the requested non-localhost commands.

## Smoke/Harness Worker Current Result 2

Status: current smoke/harness sandbox pass complete on current working tree as of 2026-05-24. This is the latest result from this worker and supersedes earlier smoke/harness notes in this report.

Commands run:

- `npm run lint` passed: `lint ok: 70 JavaScript files checked`.
- `npm run test` passed: 142/142 tests, 0 failed, duration 4770.113166 ms.
- `npm run eval:production-depth` passed: 6/6 checks, passRate 1, dataset `production-depth-v1`, duration 224 ms.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events, dataset `16h-v1`, duration 310 ms.
- `npm run simulate:campaign` passed: ok true, players 5, round 6, transcript 107, memories 26, combatLog 18, replayHighlights 8, directorBeat `revelation`.
- `npm run smoke` failed before product assertions because sandbox localhost connect is blocked:
  - `TypeError: fetch failed`
  - `connect EPERM ::1:4173`
  - `connect EPERM 127.0.0.1:4173`
  - Needs main thread rerun with localhost connect permission and a server available at `localhost:4173`.
- `npm run harness:check` failed during its internal `npm run test` step because sandbox localhost listen is blocked:
  - `tests/serverRoutes.test.js:13` / `server routes expose market, buy, sell, memo, and item-use flows`
  - `tests/serverRoutes.test.js:130` / `server routes keep repeated market buys and Chinese economy labels consistent`
  - `tests/serverRoutes.test.js:205` / `server route equips inventory items with token and version checks`
  - Each failure was `Error: listen EPERM: operation not permitted 127.0.0.1`.
  - Needs main thread rerun with localhost listen/connect permission.

Failure summary:

- No application assertion failures were observed in direct lint, test, production-depth eval, memory eval, or campaign simulation.
- Smoke and full harness remain blocked in this sandbox only by localhost permission.

## Structured AI DM Log Worker Update

Status: structured log and AI DM template hardening passed on current working tree as of 2026-05-24 18:22:33 CST.

Scope changed:

- `src/core/logTemplates.js`: added top-level `category`, `action`, `result`, `messageKey`, and bilingual `template` fields for AI DM decisions, state transitions, rules checks, inventory mutations, soundscape switches, asset selections, chat, errors, and generic transcript events.
- `src/core/stateMachine.js` and `src/core/gameEngine.js`: transcript structured logs now preserve readable AI DM narration action/result fields, rules check fields, reward asset result fields, and start-room transition metadata.
- `src/server/server.js`: presentation-decorated room snapshots now include `mediaLogs` entries for selected soundscape and selected scene asset.
- `scripts/evaluate-production-depth.mjs`: log-safety checks now require the structured template fields; scene/audio family checks accept the current layered soundscape model when the expected weather/location family appears in profile/layers/hints.

Commands run:

- `node --test tests/logTemplates.test.js tests/gameEngine.test.js tests/productionDepth.test.js` passed: 18/18 tests, 0 failed, duration 2041.294167 ms.
- `node --test tests/serverRoutes.test.js` first failed in sandbox with `listen EPERM: operation not permitted 127.0.0.1`; reran with localhost listen permission and passed: 4/4 tests, 0 failed, duration 3865.554916 ms.
- `node --test tests/logTemplates.test.js tests/gameEngine.test.js tests/serverRoutes.test.js tests/productionDepth.test.js` reran with localhost listen permission and passed: 22/22 tests, 0 failed, duration 4136.232958 ms.

Coverage added:

- AI DM logs expose readable `category/action/result/messageKey/template` fields with Chinese and English template strings.
- Rules check logs expose `rules.check.resolved` and `resolve-check` fields.
- Server route snapshots expose soundscape and scene asset `mediaLogs` with `soundscape.switch` and `asset.selection` template keys.

Failure summary:

- No application assertion failures remain in the related structured-log test set.

## Main-Thread Final Verification - 2026-05-24

This section supersedes earlier intermediate failures in this report. The earlier failures were captured while subagents were still editing or while sandbox localhost access was blocked. After integrating the worker changes, fixing the starting-equipment snapshot and tavern/toast soundscape ranking regressions, and restarting the stale `localhost:4173` server, the current tree passed the full Harness gate.

Commands run:

- `npm run lint` passed: `lint ok: 71 JavaScript files checked`.
- `npm test` passed: 165/165 tests, 0 failed.
- `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1, 256 queries over 2112 events.
- `npm run eval:production-depth` passed: 9/9 checks, passRate 1.
- `npm run smoke` passed on refreshed `localhost:4173`.
- `npm run harness:check` passed with localhost listen/connect permission. It ran lint, 165/165 tests, 16-hour long-memory eval, production-depth eval, smoke, five-player campaign simulation, and Harness report completeness checks.

Latest smoke payload:

```json
{
  "ok": true,
  "generatedAssetCount": 488,
  "language": "zh",
  "ttsProviders": 5,
  "soundscapePresets": 21,
  "marketOffers": 12,
  "purchasedItem": "storm-lantern",
  "equippedItems": ["staff", "robe"],
  "memories": 2,
  "replayHighlights": 4
}
```

Current residual risks are product polish, not failing gates:

- Asset scale is 488 generated raster assets and 128 generated scene backdrops, below the long-term 3000+ asset and 500-scene targets, but the pipeline and metadata gates are in place.
- Some player QA notes still point to future polish around market discoverability, visible disabled reasons, and first-time setup wording.
- The market turn-cost rule remains documented as a product decision for the next iteration.

## Browser QA Worker 4185 Documentation Result

Status: low-context player browser QA documentation complete as of 2026-05-24.

Scope:

- Reviewed the current player flow on the main-thread server at `http://localhost:4185/`.
- Flow covered: landing -> create room -> join as a Chinese player -> start scene -> inspect character/backpack/item detail -> settings/audio/voice -> market -> buy a scroll -> inspect and use the purchased item.
- Stopped further exploration when the main thread reported the full harness gate green: 165/165 tests, memory eval, production-depth eval, smoke, and simulate all passed.

Documentation changed:

- `.harness/changes/0011-production-depth/review.md`: appended the current low-context browser QA findings and residual risks.
- `docs/USER_FEEDBACK_0006.md`: appended 27 concrete player-facing feedback items with P0/P1/P2 severity and pass/issue/risk status.
- `docs/GAP_ASSESSMENT.md`: appended the current player-flow residual risk summary.

No code, asset manifest, product tests, or product assets were changed by this worker.
