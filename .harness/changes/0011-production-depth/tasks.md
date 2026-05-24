# Tasks

- [x] Create v11 Harness change and development branch.
- [x] Spawn parallel worker subagents for asset pipeline, UI/UX, inventory/economy, state/evaluation, TTS/audio, and QA.
- [x] Generate or ingest another project-owned Image Generation sheet for player-usable assets.
- [x] Register new asset metadata with immersive descriptions, semantic keys, surfaces, rarity, culture, and gameplay bindings.
- [x] Expand data-first item/spell/equipment catalog before binding images.
- [x] Improve character creation with icon cards, spell cards, and clearer budget feedback.
- [x] Add player market/shop drawer with buy/sell/use affordances and economy invariants.
- [x] Add XP/level/equipment summary/progression fields to player state.
- [x] Improve compact state tracking for quests, danger, clues, consequences, and current scene.
- [x] Add reusable production-depth evaluation checks for scene/audio/asset/log/economy consistency.
- [x] Run unit tests, lint, smoke, memory eval, harness check, and browser QA.
- [x] Commit, merge through develop, and merge to main.

## Continuation Batch 2026-05-24 18:30 CST

Active worker lanes:

- [x] Register sheets 023-026 as transparent player-safe cutouts with runtime bindings.
- [x] Register sheets 027-028 as player-safe macro scene backdrops with soundscape hints.
- [x] Remove remaining Chinese player-surface English/debug leaks covered by static/state/soundscape regressions.
- [x] Expand lightweight bilingual TTS/voice profiles to 12+ role voices.
- [x] Run low-context player QA against the live table UI and record findings.
- [x] Improve scene evolution, reward discoverability, and progression-loop proof through state, reward, and production-depth eval coverage.

Current QA/process pass, 2026-05-24 19:00 CST:

- [x] Recorded six current worker lanes, risks, and unfinished items in `.harness/agents/subagent-ledger.md`.
- [x] Ran `npm test` in sandbox, then reran with localhost permission to separate EPERM from application results.
- [x] Ran `npm run lint`.
- [x] Ran `npm run smoke` in sandbox and with localhost permission.
- [x] Ran `npm run harness:check` with localhost permission.
- [x] Ran low-context browser QA on `http://127.0.0.1:4173/?room=room_8583ee26e2f84a0e`.
- [x] Fix current `npm run smoke` blocker: `join should expose equipped starting weapon`.
- [x] Fix current `tests/soundscape.test.js` blocker: expected `tavern`, actual `toasting-cheers`.
- [x] Fix browser purchase refresh blocker through spell/item art helper consolidation and smoke/harness coverage.
- [x] Restore/verify player-scoped market discoverability via Settings drawer and player UI tests.

Current main-thread final verification, 2026-05-24:

- [x] `npm run lint` passed: 71 JavaScript files checked.
- [x] `npm run test` passed: 180/180 on the post sheet030 current tree.
- [x] `npm run eval:memory:16h` passed: recallAt5 1, meanReciprocalRank 1 over 2112 events and 256 queries.
- [x] `npm run eval:production-depth` passed: 10/10 checks, passRate 1.
- [x] `npm run smoke` passed on restarted `localhost:4173` with 616 generated assets and 23 market offers; post sheet030 manifest audit shows 616 generated assets/raster assets.
- [x] `npm run harness:check` passed with localhost listen/connect permission.
- [x] `npm run simulate:campaign` passed through the harness gate: 5 players, round 6, 26 memories, replay highlights generated.
- [x] Resource planning worker delivered `docs/assets/asset-expansion-roadmap-2026-05-24.md` for the 3000+ generated image and 500-scene expansion target.

New generated source sheets to keep managed, not exposed as galleries:

- [x] `assets/generated/sheets/aidm-transparent-cutouts-sheet-020.png`
- [x] `assets/generated/sheets/aidm-tools-cutouts-sheet-021.png`
- [x] `assets/generated/sheets/aidm-trophies-cutouts-sheet-022.png`
- [x] `assets/generated/sheets/aidm-wearables-cutouts-sheet-023.png`
- [x] `assets/generated/sheets/aidm-weapons-cutouts-sheet-024.png`
- [x] `assets/generated/sheets/aidm-magic-cutouts-sheet-025.png`
- [x] `assets/generated/sheets/aidm-trade-cutouts-sheet-026.png`
- [x] `assets/generated/sheets/aidm-production-scenes-sheet-027.png`
- [x] `assets/generated/sheets/aidm-weather-scenes-sheet-028.png`
- [x] `assets/generated/sheets/aidm-inventory-expansion-sheet-029.png`
- [x] `assets/generated/sheets/aidm-inventory-expansion-sheet-030.png`

## Requirement Gap Backlog

### P0

- [x] Rerun `npm run smoke` with localhost connect permission on the latest working tree and record the passing result in `test-report.md`.
- [x] Rerun `npm run harness:check` with localhost listen/connect permission on the latest working tree and record the passing result in `test-report.md`.
- [x] Browser-retest refresh/reopen after joining: same room URL should preserve or reclaim the local seat, keep `My character`/`Market` enabled, and not show duplicate character creation unless explicitly choosing a new seat.
- [x] Browser/server-retest duplicate-join/turn ownership edge case after refresh: browser refresh preserved local identity, active turn, and market permissions; server route regression covers duplicate join and action ownership.

### P1

- [ ] Localize remaining Chinese UI leaks on the main play surface: `foreshadowed`, `Threat`, `Clues`, mixed transcript/system role labels, and any similar debug-facing English.
- [ ] Productize and localize soundscape reason text so Settings/State explain scene-audio alignment without mixed English/debug phrases.
- [ ] Add explicit market disabled reasons for insufficient funds, sold out, already owned, turn/rule locked, or missing join state.
- [x] Render data-backed item art in market cards, backpack rows, and item detail using generated manifest surfaces, including promoted sheet 029 market items.
- [ ] Decide whether purchased tool-like items such as `暴风提灯` should be equippable; either add slot/equip binding or show a clear non-equippable reason.
- [ ] Decide and implement the market turn-cost rule: free-time shop action vs turn-consuming action, including player-facing UI copy.
- [ ] Browser-verify character creation is card-first, localized, and not confusing when native species/class selects are present.
- [ ] Clarify starting spell card state: selected, learned, available at start, or preview-only.
- [ ] Add or verify a progression loop: earn XP, level up, learn a spell, update equipment summary, and show stat deltas in player state.
- [ ] Simplify player-facing State drawer language so quest clocks, danger, clues, current scene, and active consequences remain compact and localized.
- [ ] Improve visible scene evolution after important actions so pressure/clue/consequence changes are reflected without abrupt scene jumps.
- [ ] Make reward/loot-bearing actions more discoverable from normal clue-search or exploration play.

### P2

- [ ] Surface current ambience/audio status outside Settings, such as a compact stage chip for active soundscape and audio-on state.
- [ ] Rework topbar action hierarchy so Log, State, My character, Market, Settings, Guide, and Start scene do not compete equally for first-time players.
- [ ] Add focused purchase/use feedback, such as a short confirmation and backpack-added cue.
- [ ] Expand equipment summaries to show actual equipped item names where space allows, not only slot categories.
- [ ] Continue runtime-bound asset batches toward the documented 3000+ total and 500-scene long-term targets.
- [ ] Convert planned sheet 020 transparent cutouts from metadata-only to generated/sliced assets after item-art binding is proven in the player UI.
