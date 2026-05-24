# Review Notes

## Product Direction

- v10 made the product playable, but the next gap is depth: assets must be connected to game state and user actions, not just available in a catalog.
- The player table should remain clean. Market, backpack, progression, guide, and settings belong in drawers or compact modals.
- Scene art, soundscape, and narration must stay aligned as a first-class quality gate.
- Character creation should feel like a game setup flow, with visual choices and clear tradeoffs.

## Worker Ownership

- Asset worker: generated sheet ingestion, asset metadata, dedupe checks, and asset docs.
- UI worker: player-facing character/market/progression surfaces without page scroll.
- Economy worker: item catalog, market logic, equipment/progression state, and tests.
- Evaluation worker: reusable consistency checks and harness gates.
- Audio/TTS worker: soundscape match assertions and profile usability.
- QA worker: browser/player flow and regression coverage.
- Documentation worker: player quickstart, delivery docs, asset boundary, and review handoff.

## Risks

- Asset scale can explode without metadata discipline; every new image batch must be cataloged and referenced through semantic keys.
- Market and equipment logic can create state drift if wallet, quantity, and use effects are not enforced server-side.
- More UI controls can reintroduce clutter; the one-screen player table remains a hard constraint.

## QA / Low-Context Player Feedback

Browser path reviewed on `http://127.0.0.1:4173/` as a new Chinese player: create room -> join -> start scene -> act -> inspect settings/state/character/market -> buy an item -> reload. This is player-facing feedback, not backend architecture review.

### High-Priority Issues

1. [P0] Refreshing the room lost the local seat state in the browser: after reload, the existing party member remained visible, but `我的角色` and `市场` became disabled and the join form returned. A real player can accidentally create duplicate seats.
2. [P0] The active turn stayed on the original refreshed-away player after a duplicate join, so the new visible local player could buy in the market but could not naturally continue the turn.
3. [P0] The one-screen table is still crowded at 1280x720. The action bar and transcript bottom edge are partially clipped while core play is active.
4. [P0] The market can be opened and bought from even when it is not the buyer's turn. This may be intended, but it currently feels like a rules bypass because the action turn remains elsewhere.
5. [P0] Chinese market prices use `CR` inside cards while the wallet uses `克朗`, creating direct currency inconsistency in the same drawer.
6. [P0] Chinese economy log uses English item names after purchase, e.g. `Scroll of Veiled Sleep`, which breaks immersion and localization.
7. [P0] Bought market offers remain visible in the shop as disabled cards, with no sold-out/owned/insufficient-funds reason. The player cannot tell whether stock, wallet, or rule state disabled it.
8. [P0] The first unaffordable market item starts disabled but has no explanation. Low-context players need an explicit `资金不足`/price comparison cue.
9. [P0] The player summary dock showed `暂无角色` immediately after reload while the party status showed an existing character. This state contradiction is confusing even if technically caused by missing local token.
10. [P0] The start/join flow allows the same browser to create another character in an already-started scene after refresh. Product needs a reclaim-seat path before allowing duplicate join.
11. [P1] The top status strip now has five cards and squeezes text; `foreshadowed` remains English in Chinese UI. Encounter state should use player-facing localized labels.
12. [P1] Character creation presents visual cards plus duplicate native selects for species/class. This makes setup feel noisy and invites uncertainty about which control is authoritative.
13. [P1] Builder cards mix English labels (`Human`, `Warrior`, `frontline`) inside Chinese setup. Either localize labels or intentionally mark them as system terms.
14. [P1] Starting spell cards show a symbolic marker but no clear affordance about whether the spell is selected, learned, or only previewed.
15. [P1] The point-buy default says `10 / 27 点 · 剩余 17`, so the first setup state feels unfinished but the join button is enabled. This needs either validation guidance or a deliberate default build.
16. [P1] The scene art matches rain visually, but the stage still labels meters as `Threat` and `Clues` in English in Chinese UI.
17. [P1] The soundscape reason mixes Chinese and English (`mood matched`, `archive`, `complication`). This is visible in Settings and State and reads like debug output.
18. [P1] Soundscape settings are buried in Settings; the stage does not surface the current ambience name or whether audio is actually on, so scene/audio alignment is hard to trust as a player.
19. [P1] Scene objective and log narration are lively, but after a failed clue action the stage art/location did not visibly evolve. The system says pressure rose, yet the scene card looks static.
20. [P1] The state drawer exposes internal terms such as `foreshadowed`, tactical intent phrasing, and route gating in a dense panel. It is useful but not natural for a new player.
21. [P1] The market item art assets are not shown in the market drawer. v11 asset depth should make items visually inspectable at the moment of purchase.
22. [P1] Inventory item detail shows text and actions, but no item art. Starting inventory assets exist and should appear when inspecting items.
23. [P1] Equipment/progression summary uses compact slot text like `武器/护甲/法器/工具`, but there is no immediate mapping to actual equipped items unless the drawer is opened.
24. [P1] The transcript uses `Table`, `Rules`, and `AIDM` mixed with Chinese names. Player-facing speaker labels should be localized or styled as roles.
25. [P1] The latest roll widget is helpful, but failure/success does not explain the consequence in a short badge. Players must read the long narration to understand why pressure changed.
26. [P1] The reward/loot path is not discoverable from normal clue checking. The player needs clearer affordances for searchable containers or reward-bearing actions.
27. [P1] Drawer close labels are now localized, but the global scrim just says `关闭抽屉`; visually it is not obvious that clicking the darkened table closes the drawer.
28. [P1] Market purchase succeeded without a toast or focused confirmation. The only feedback is a log entry and wallet change, which is easy to miss.
29. [P1] After buying a scroll, the player summary equipment slot changed to include `法器`, but no explicit "new item added to backpack" affordance appeared.
30. [P1] `完整日志`, `状态`, `我的角色`, `市场`, `设置`, `指南`, `开始场景` crowd the top bar. The table is clean compared with an admin UI, but the main action hierarchy is still unclear for a first-time player.

### Regression Coverage Added

- Added `tests/bilingualUi.test.js` coverage for v11 player-visible labels: market, player dock, starter spells, character summary, slots, and point-budget overflow.
- Extended `tests/playerUiAccess.test.js` coverage so the player surface must expose market drawer, market list, player summary dock, starter spell cards, market buy flow, refreshMarket, and renderPlayerSummaryDock hooks.
- Added `tests/gameEngineInventory.test.js` regression for Chinese market economy text and currency labels. This currently fails on `89 CR`, matching the browser finding that Chinese market cards still leak `CR`.

### Product Decisions Still Needed

- Decide whether market buy/sell is free-time inventory management or a turn-consuming table action. The UI should communicate that rule.
- Decide whether refresh should reclaim a seat by token, ask the player to choose an existing seat, or always create a new seat. Current behavior silently duplicates seats.
- Decide whether species/class visual cards replace the native selects or remain as shortcuts. Showing both is functional but noisy.
- Decide where soundscape status belongs: hidden in Settings, surfaced on the stage, or shown as a compact audio chip.
- Decide whether market and inventory must show item art for every item before v11 is considered production-depth complete.

## Documentation Worker Handoff

Updated docs are scoped to `README.md`, `docs/USER_GUIDE.md`, and `docs/ASSET_INVENTORY.md`.

Player-facing guide coverage:

- Room creation/opening, invite URL behavior, and local seat-token expectation after refresh.
- Character creation, species/class cards, starter spells, archetype/preset selection, and point-budget guidance.
- Main table navigation across My character, Market, Team, State, Log, Settings, and Guide.
- Action vs Chat behavior, stale-version retry expectation, and turn-moving action language.
- Market usage, wallet/item purchase behavior, and the unresolved turn-cost rule.
- Backpack inspection, item use/sell/equipment summaries, data-backed item boundary, and server-side state invariants.
- Character memo usage as private player notes, not implementation or asset-management text.
- Browser TTS controls, stable speaker profiles, adaptive ambience, synthesized environment audio, and local storage for mix settings.
- Scene/state/replay behavior and long-memory evaluation commands as delivery quality gates rather than player UI concepts.

Asset/delivery guide coverage:

- Generated image assets remain manifest-managed and are exposed only through player-safe gameplay surfaces.
- Market, backpack, reward, item detail, equipment, quest clue, spell, NPC, status, character, and scene art must be bound to runtime definitions or room state before player exposure.
- Internal placeholders, `catalog-internal` assets, source/provenance metadata, prompt IDs, duplicate-risk notes, and batch maintenance details stay out of player UI.
- README now points maintainers to the player guide, asset inventory, and long-memory/production-depth quality gates.

No code or UI strings were changed by this documentation pass.

## Asset Count / Transparency Audit

Audited against `assets/generated/manifest.json` on 2026-05-24. The original audit below covered the earlier worker state; the post sheet030 closeout count is now 31 generated sheets, with `assets` and `rasterAssets` both at 616 registrations.

- Generated sheet count: 20, with `assets` and `rasterAssets` both at 344 registrations.
- Visibility split: 308 `player-safe` assets and 36 `internal` assets.
- Transparent cutout registrations: sheet 010 has 16 player-safe consumable cutouts and sheet 019 has 16 player-safe accessory cutouts.
- Transparent alpha gate: `tests/generatedAssets.test.js` confirms all registered 010/019 transparent cutout PNGs are 8-bit RGBA and include both fully transparent background pixels and fully opaque item pixels.
- Sheet 020 remains metadata-only: `sheet-020-transparent-cutouts` is `metadata-pattern-ready`, with no generated sheet entry and 0 raster assets under `aidm-transparent-cutouts-sheet-020`.

Validation:

- `node --test tests/generatedAssets.test.js` passed: 20/20 tests.
- `npm run test -- tests/generatedAssets.test.js` also passed under the repo test script expansion: 142/142 tests.

## Requirement Gap Audit

Source pass: v11 spec, current test report, `docs/USER_GUIDE.md`, and `docs/ASSET_INVENTORY.md` as of 2026-05-24. This section lists remaining gaps against the original v11 goal of a production-depth tabletop product. Items marked "not reverified" should remain open until a browser or harness pass explicitly proves them fixed on the current working tree.

### P0 Release Blockers

1. [P0] Final localhost-dependent gates are not proven green on the latest tree. The latest final full test worker passed lint, unit tests, production-depth eval, and long-memory eval, but `npm run smoke` and `npm run harness:check` were still recorded as sandbox-blocked by localhost connect/listen. Before merge, rerun both with localhost permission and record the passing output.
2. [P0] Seat refresh/reclaim remains not reverified. Earlier browser QA found reload lost the local seat token, re-enabled character creation, contradicted party/player summary state, and allowed duplicate joins in an already-started room. Round 2 QA did not document a reload/reclaim retest, so the "joined player can safely return after refresh" requirement remains open until proven fixed.
3. [P0] Duplicate-join turn ownership remains not reverified. Earlier QA found the active turn could stay on the refreshed-away character while the newly visible local character could still use market actions. This can break the core table loop unless either seat reclaim is fixed or duplicate-join behavior is blocked/clearly resolved.

### P1 Product-Depth Gaps

1. [P1] Chinese player UI still leaks English/debug labels on the main play surface: Round 2 QA still saw `foreshadowed`, `Threat`, and `Clues`. This conflicts with the guide promise that table language covers UI, deterministic narration, system events, market text, and guide copy.
2. [P1] Soundscape reasoning is still partially debug-facing and mixed-language. Round 2 QA saw `Weather matched wet; location matched 雨; ... director beat hook; tone mystery; pressure 0.17.` in Settings. The v11 requirement is scene/soundscape/narrative alignment, but the explanation exposed to players should be localized and productized.
3. [P1] Market disabled states still lack player-facing reasons. Round 2 QA notes unaffordable or unavailable offers only disable `购买`; the user guide says offers have prices and buy actions, but production-depth shop UX needs explicit reasons such as insufficient funds, sold out, already owned, or rule-locked.
4. [P1] Market and inventory item art still does not appear in the player flow. Round 2 QA found no visible item `<img>` elements in market or inventory detail even though `docs/ASSET_INVENTORY.md` declares `market-item`, `inventory-item`, and `item-detail` as allowed surfaces, and `docs/USER_GUIDE.md` says item art should decorate data-backed items.
5. [P1] Equipment affordance is incomplete for purchased tool-like items. Round 2 QA confirmed an equip action exists for already equipped staff, but `暴风提灯` remained non-equippable because its runtime snapshot had `slot: null`. If this is intentional item modeling, the UI needs a clear explanation; if not, the catalog/API binding needs a slot and equip path.
6. [P1] Market turn-cost rule is still undecided in product docs. `docs/USER_GUIDE.md` explicitly says the product still needs a final rule decision for whether market actions are free-time inventory management or turn-consuming table actions. This weakens turn/economy invariants and should be reflected in UI copy once decided.
7. [P1] Character creation still risks mixed-control confusion unless browser-verified otherwise. Existing review feedback says visual species/class cards coexist with native selects and mixed English labels; the spec wants character setup to feel like a game setup flow with clear tradeoffs. Keep open until the setup surface is verified as localized, non-duplicative, and card-first.
8. [P1] Starting spell cards are visible, but their state meaning is not documented as clearly selected, learned, or preview-only. The spec asks for starting spell cards and progression hooks; players need the card state to map to known/learnable/current spells.
9. [P1] Progression is structurally present but not yet a satisfying loop. XP, level, learned spells, equipment summaries, and stat deltas exist in state/docs, but there is no documented browser proof of earning XP, leveling, learning a spell, and seeing stat deltas update after play.
10. [P1] State tracking still exposes internal terms and dense route/intent phrasing. The spec asks for player-useful quest clocks, danger, clues, current scene, and active consequences without clutter; Round 2 still reports debug-like labels and partial localization in visible state/media explanations.
11. [P1] Scene evolution after actions remains shallow. Earlier QA saw pressure rise after a failed clue action while stage art/location stayed static. The spec asks AIDM to prevent abrupt jumps, but production depth also needs visible, coherent scene progression when danger, clues, or consequences change.
12. [P1] Reward/loot discovery remains under-signaled. Earlier QA noted reward paths are not discoverable from normal clue checking. This matters because v11 asset depth and inventory depth should make reward-bearing actions and usable items feel connected to play.

### P2 Follow-Ups

1. [P2] Soundscape status is buried in Settings. The current scene/audio alignment is hard for players to trust without a compact ambience chip or stage-level status showing active soundscape and audio-on state.
2. [P2] Topbar hierarchy is crowded. `Log`, `State`, `My character`, `Market`, `Settings`, `Guide`, and `Start scene` compete in the first-screen controls; the one-screen constraint is technically protected, but the first-time action hierarchy still needs polish.
3. [P2] Purchase/use feedback is quiet. Earlier QA noted market purchases rely on transcript and wallet changes, with no focused confirmation/toast or backpack-added cue.
4. [P2] Equipment summaries use compact slot labels but do not immediately show actual equipped item names without opening the drawer. This is space-efficient but weak for low-context players.
5. [P2] Asset scale remains far from the long-term target. The inventory has 344 raster assets, including 96 scene backdrops, against the documented 3000+ total and 500-scene long-term targets. This is not a v11 blocker, but the production-depth roadmap should keep adding reviewable, runtime-bound batches.
6. [P2] Sheet 020 transparent cutouts are metadata-only. This is correctly documented and should stay out of counts, but it is an obvious next asset-pipeline follow-up once current player-facing item-art binding is fixed.

## QA Worker Browser Pass - 2026-05-24

Scope: low-context first-player pass on `http://127.0.0.1:4173/` at the default 1280x720 in-app browser viewport. Flow covered landing -> create room -> join -> start scene -> open settings/market/character/state/team -> buy an item -> inspect backpack item detail -> submit one action -> reload recovery. This is player QA evidence, not product architecture review.

Screenshots saved under `.harness/changes/0011-production-depth/screenshots/`.

1. [Pass] Landing is player-clean: the first screen shows room creation/open-room controls only, with no generated asset gallery exposed.
2. [Pass] Generated scene art is bound to the stage, not shown as a catalog. The rainy street backdrop visually matches the rain/archive premise.
3. [Pass] Body/page scroll is blocked at 1280x720 after play starts: `body.scrollHeight` and `document.scrollHeight` both stayed at 720, with `body { overflow-y: hidden }`.
4. [Issue] The action composer still clips below the viewport. The final layout audit showed the intent select, roll-mode select, action input, and action button at `y=696`, `bottom=738`, so the bottom 18px is outside the 720px viewport.
5. [Pass] Character creation is only visible before seating in the happy path. After joining and after reload, no visible `创建你的角色` or `加入牌桌` controls remained.
6. [Issue] Character setup before seating still feels noisy: visual species/class cards are paired with native selects, and the visible labels remain English (`Human`, `Warrior`, `Investigator`, `frontline`).
7. [Issue] The setup panel relies on an internal scroll before seating: `player-setup-panel` had `clientHeight=440` and `scrollHeight=750`, so first-time setup is clipped in the one-screen layout.
8. [Pass] Settings now carries non-core audio/voice controls naturally: ambience on/off, stop audio, music/environment sliders, total volume, voice toggle, read-latest, voice profile, rate, and pitch are all in the settings drawer.
9. [Issue] Market is discoverable only through Settings in this pass. There is no visible top-level `市场` button after seating; the player must open Settings, then click Market, which makes a core economy surface look like a preference.
10. [Pass] Market cards use item art rather than a gallery dump. The drawer shows item images, localized names, category, description, price, and buy state in context.
11. [Issue] Several market art refs are broken. Browser image audit showed `naturalWidth=0` for `/assets/spells/ember-lance.svg` and `/assets/spells/gold-ward.svg`; the new static test also found missing `assets/spells/star-shield.svg` and `assets/spells/sun-sigil.svg`.
12. [Issue] Backpack and item detail still use single-character placeholder tiles (`旅`, `睡`) instead of item art, even for the purchased spell scroll whose market card had an image.
13. [Issue] Purchased item pricing is confusing: the market purchase log says `睡眠帷幕法卷` cost 89 克朗, but the backpack row/detail shows 71 克朗 without labeling it as resale value or condition-adjusted value.
14. [Issue] Buying an item has quiet feedback. Wallet changes and a log entry appear, but there is no focused purchase confirmation or "added to backpack" cue.
15. [Issue] After purchase, the bought market item remains in the market and only becomes `克朗不足`; it does not communicate sold out, already bought, or one-stock ownership.
16. [Pass] Party status is much more natural than earlier notes: avatar art, active outline, HP/MP bars, class label, defense, initiative, and attributes are visible without opening backend state.
17. [Pass] Dice result is understandable after an action: the latest-roll widget shows final value, settled state, success/DC, formula, and raw d20 result.
18. [Issue] Dice/log presentation still clips vertically in the transcript area after an action; the top of the log panel and latest-roll area are partially hidden while the action composer is pinned at the bottom.
19. [Issue] Speaker localization changes after reload. Before reload the live transcript used `AIDM`, `Table`, and `Rules`; after reload the same events showed `主持人`, `牌桌系统`, and `规则裁定`. Player-facing labels should be stable without refresh.
20. [Issue] State drawer is mostly useful, but still exposes one English/debug seam: `No report yet.` appears under 战报, and encounter intent reads like system-rule phrasing rather than player narration.

Static regression added:

- Added a narrow check in `tests/itemCatalog.test.js` that every `ITEM_CATALOG` `assetRef.file` resolves to a real asset.
- `node --test tests/itemCatalog.test.js` currently fails as expected on missing refs: `firebolt-scroll: assets/spells/ember-lance.svg`, `ward-scroll: assets/spells/gold-ward.svg`, `arcane-shield-scroll: assets/spells/star-shield.svg`, and `radiant-bolt-scroll: assets/spells/sun-sigil.svg`.

Commands run:

- `npm run dev`
- Browser URL: `http://127.0.0.1:4173/?room=room_32d74e5a769e488e`
- `node --test tests/itemCatalog.test.js`

## Browser QA Worker 4185 Addendum - 2026-05-24

Scope: low-context Chinese player pass on `http://localhost:4185/`. Flow covered landing, create room, join character, start scene, character/backpack/item detail, settings/audio/voice, market, purchase, and purchased-item use. The run was stopped before further probing after the main thread reported the full harness gate green.

### Current Passes

- Character creation/join controls appeared only before seating in the happy path; after joining, `创建你的角色` and `加入牌桌` were no longer visible.
- The main table did not expose an asset library stack; generated scene art was bound to the stage, and item art appeared in market/backpack/detail contexts.
- The stage and status strip were substantially localized: `回合`, `轮次`, `遭遇`, `同步`, `玩家`, `威胁`, and `线索` were visible in Chinese.
- Party status felt player-facing: avatar, active outline, class label, HP bar, and MP bar were visible without opening backend state.
- Settings grouped ambience and voice controls naturally, including ambience toggle, stop audio, volume sliders, voice toggle, read-latest, profile select, rate, and pitch.
- Market cards used localized names, localized `克朗` prices, descriptions, item art, and disabled affordability reasons.
- Buying `睡眠帷幕法卷` updated wallet from 120 to 31 克朗 and logged a localized purchase event.
- The purchased scroll appeared in the backpack with art, detail text, value, `使用`, and `出售`.

### Residual Risks

- [P0] The action composer still sits at the viewport bottom (`y=696`, `bottom=738` in a 720px viewport), so the core action controls are partially clipped.
- [P1] Setup still exposes English system/content terms through native selects and logs: `Human`, `Elf`, `Warrior`, `Mage`, and the join log role `Investigator`.
- [P1] Market is only reachable through Settings in this pass; a core economy surface feels hidden behind preferences.
- [P1] Purchase feedback is quiet: wallet and transcript update, but there is no focused confirmation or "added to backpack" cue.
- [P1] Bought market items remain in the shop and only communicate `克朗不足`; they do not distinguish sold out, already owned, or insufficient funds.
- [P1] Purchase price vs backpack value is unclear: the scroll cost 89 克朗, but backpack/detail showed 71 克朗 without labeling resale or condition value.
- [P1] Using the scroll leaked an English/internal spell id in Chinese UI: `雨巷法师研读法卷，学会了sleep。`
- [P1] Tool equipment affordance remains unclear: the character has an empty `工具` slot, but `旅行提灯` shows disabled `使用` and no `装备`.
- [P2] The ambience label `市场与城市街道` felt slightly off while the visible scene was a rain-wet archive street.
- [P2] Voice options include locale-code labels like `婷婷 (zh-CN)` and `美嘉 (zh-TW)`, which read as technical tags in an otherwise Chinese player UI.
- [P2] Chat, dice resolution after a new action, state drawer, and reload recovery were not reverified after the interruption; keep previous QA coverage for those paths until a fresh targeted pass confirms them.

## Final Review Decision - 2026-05-24

The earlier P0 gate failures in this review were intermediate states from worker branches, stale local servers, or sandbox localhost restrictions. The main-thread final verification supersedes them:

- `npm run lint` passed.
- `npm run test` passed: 180/180 on the post sheet030 current tree.
- `npm run eval:memory:16h` passed with recallAt5 1 and meanReciprocalRank 1 over the 16-hour benchmark.
- `npm run eval:production-depth` passed: 10/10.
- `npm run smoke` passed on restarted `localhost:4173` with 616 generated assets and 23 market offers; latest manifest audit after sheet030 shows 616 generated asset/raster registrations.
- `npm run harness:check` passed with localhost listen/connect permission, including smoke and five-player campaign simulation.

Release assessment for this branch: acceptable for the current v11 production-depth handoff. Remaining issues are product polish and roadmap items rather than failing gates: market visibility hierarchy, visible purchase feedback, some first-time setup wording, promotion of the remaining 116 sheet 029/030 review assets, and continued asset-scale expansion toward the long-term 3000+/500-scene targets.
