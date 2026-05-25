# 0014 Integration Risk Scan

Worker: AIDM 0014 parallel worker G
Scope: integration risk scan and test blocker localization only
Snapshot date: 2026-05-25

## Current Worktree Snapshot

`git status --short` shows concurrent edits across documentation, browser UI, core runtime, server routes, and tests.

High-conflict shared files:

- `public/app.js`
- `public/styles.css`
- `public/i18n.js`
- `public/index.html`
- `src/core/itemCatalog.js`
- `src/core/rules.js`
- `src/core/soundscape.js`
- `src/core/stateSummary.js`
- `src/server/server.js`
- `tests/playerUiAccess.test.js`
- `tests/staticUiStructure.test.js`
- `tests/bilingualUi.test.js`
- `tests/itemCatalog.test.js`
- `tests/serverRoutes.test.js`

Untracked 0014 files already present before this report:

- `.harness/changes/0014-continuous-product-depth/`
- `docs/qa/0014-acceptance-checklist.md`
- `docs/qa/0014-browser-qa-plan.md`

Late concurrent writes observed after the first verification pass:

- `tests/bilingualUi.test.js`
- `tests/soundscape.test.js`
- `tests/ttsProfiles.test.js`
- `tests/assetSelection.test.js`
- `docs/qa/0014-test-readiness.md`

## Key Diff Risks

### Sagan UI Surface

Files: `public/app.js`, `public/index.html`, `public/styles.css`, `public/i18n.js`, `tests/playerUiAccess.test.js`, `tests/staticUiStructure.test.js`, `tests/bilingualUi.test.js`

- Log density changed from a two-state dense/comfortable flow to `summary`, `dense`, `comfortable`.
- `turnFocusSteps` was added to the turn-focus DOM and translation surface.
- Party status cards now render HP/MP state tags and tighter layout dimensions.
- Scene backdrop now has idle pan motion driven by CSS variables.

Risk: the static UI tests assert exact source snippets and CSS fragments. Any further Sagan UI edits in the same files can cause brittle test failures even when the browser behavior is acceptable. Browser QA is still required because static tests cannot prove layout fit, motion, drawer behavior, or visual overlap.

### Lagrange Market and Backpack Surface

Files: `src/core/itemCatalog.js`, `public/app.js`, `tests/itemCatalog.test.js`, `tests/inventoryEconomy.test.js`, `tests/gameEngineInventory.test.js`, `tests/serverRoutes.test.js`

- `toolUse()` is now defined before catalog use and utility tools are represented as `tool-utility` use effects.
- Shop availability now exposes richer purchase state: `reasonCode`, `label`, `help`, wallet, owned quantity, and purchase limit.
- Economy payloads now carry role metadata for base, inventory, purchase, and resale values.
- UI still has a separate frontend market affordance path in `public/app.js`; this should be checked against backend `purchaseState` after Lagrange finishes.

Risk: repeated changes around `itemCatalog.js` can easily drift between backend availability semantics and frontend market button reasons. Let Lagrange settle first before hand-editing market/backpack tests.

### Ohm Audio and Scene Surface

Files: `src/core/soundscape.js`, `public/ambience.js`, `src/core/assetSelection.js`, `src/core/ttsProfiles.js`, `public/i18n.js`, `tests/ambienceEngine.test.js`, `tests/soundscape.test.js`, `tests/ttsProfiles.test.js`, `tests/assetSelection.test.js`

- Active ambience layers increased from 6 to 10.
- New rain, puddle, market voice, and tavern voice profiles were added.
- Soundscape selection now includes time-of-day and pressure hints.
- Scene visual variant hints now include `time:*` and `pressure:*`.

Risk: Node tests cover soundscape selection and ambience sanitization, but not live Web Audio behavior or browser audio controls. After Ohm finishes, the settings drawer audio path must be checked in the browser.

### Rules, Combat, and Summary Surface

Files: `src/core/rules.js`, `src/core/combat.js`, `src/core/statusEffects.js`, `src/core/stateSummary.js`

- Spell catalog expanded with categories and localized labels.
- Warrior specializations expanded.
- Combat logs and state summaries now try to hide raw debug ids behind localized labels.
- Turn suggestions now include richer action details, spell picks, item picks, exits, and assist targets.

Risk: these changes are cross-module. They currently pass targeted Node tests, but browser state drawer and combat transcript rendering still need live flow verification.

### Server Auth Surface

Files: `src/server/server.js`, `tests/serverRoutes.test.js`

- Stale account sessions are tolerated when a valid room credential is present.
- Protected room reads no longer let an invalid account session override valid room credentials.

Risk: route tests passed. Browser verification should still include refresh/reopen paths because the frontend carries auth, host, player, and pending-player tokens through local storage and headers.

## Known Blocker Check

Known issue: `src/core/itemCatalog.js` previously hit `ReferenceError: toolUse is not defined`.

Current snapshot:

- Text scan finds `function toolUse(toolType, label)` in `src/core/itemCatalog.js`.
- `node --check src/core/itemCatalog.js` passed.
- ESM import check passed with `itemCatalog import ok`.
- No current reproduction of `ReferenceError: toolUse is not defined`.

This worker did not modify `src/core/itemCatalog.js`; if the error returns after Lagrange writes again, assign the fix back to Lagrange.

## Commands Run

```bash
git status --short
git diff --name-only
git diff --stat
rg -n "AIDM|0014|itemCatalog|toolUse|harness:check" /Users/yixuan.zhang/.codex/memories/MEMORY.md
rg -n "toolUse|TOOL_USE|tool use|tools" src/core/itemCatalog.js src/core tests public
git diff -- src/core/itemCatalog.js
git diff -- tests/playerUiAccess.test.js tests/staticUiStructure.test.js
sed -n '1,220p' package.json
node --check <each modified JavaScript file>
npm run lint
node --input-type=module --eval "await import('./src/core/itemCatalog.js'); console.log('itemCatalog import ok')"
node --test tests/playerUiAccess.test.js tests/staticUiStructure.test.js
node --test tests/ambienceEngine.test.js tests/combat.test.js tests/gameEngineInventory.test.js tests/inventoryEconomy.test.js tests/itemCatalog.test.js tests/localization.test.js tests/logTemplates.test.js tests/noScrollUi.test.js tests/rules.test.js tests/rulesEngine.test.js tests/serverRoutes.test.js tests/stateSummary.test.js tests/statusEffects.test.js tests/playerUiAccess.test.js tests/staticUiStructure.test.js
git diff --check
git status --short
git diff --name-only
git diff -- tests/bilingualUi.test.js
node --check tests/bilingualUi.test.js
node --test tests/bilingualUi.test.js
git diff -- tests/soundscape.test.js
node --check tests/soundscape.test.js
node --test tests/soundscape.test.js
git diff -- tests/ttsProfiles.test.js
node --check tests/ttsProfiles.test.js
node --test tests/ttsProfiles.test.js
git diff -- tests/assetSelection.test.js
node --check tests/assetSelection.test.js
node --test tests/assetSelection.test.js
```

## Results

- `node --check <each modified JavaScript file>`: passed for all modified JS files in `public/`, `src/`, and `tests/`.
- `npm run lint`: passed, `lint ok: 79 JavaScript files checked`.
- `itemCatalog` ESM import: passed, `itemCatalog import ok`.
- `node --test tests/playerUiAccess.test.js tests/staticUiStructure.test.js`: passed, 6 tests, 6 passed.
- Broader targeted Node suite over changed runtime/test surfaces: passed, 111 tests, 111 passed, 0 failed.
- Late `tests/bilingualUi.test.js` check: `node --check` passed, `node --test` passed with 8 tests, 8 passed.
- Late `tests/soundscape.test.js` check: `node --check` passed, `node --test` passed with 23 tests, 23 passed.
- Late `tests/ttsProfiles.test.js` check: `node --check` passed, `node --test` passed with 4 tests, 4 passed.
- Late `tests/assetSelection.test.js` check: `node --check` passed, `node --test` passed with 8 tests, 8 passed.
- `git diff --check`: passed, no whitespace errors.

No first real test error was found in this snapshot.

## Recommended Integration Order

1. Wait for Lagrange before finalizing `src/core/itemCatalog.js`, market/backpack tests, or server market assertions. This is the most stateful backend contract surface and includes the known `toolUse` history.
2. Wait for Sagan before finalizing `public/app.js`, `public/styles.css`, `public/index.html`, `public/i18n.js`, `tests/playerUiAccess.test.js`, and `tests/staticUiStructure.test.js`. UI static tests are brittle and should be reconciled after the last UI write.
3. Wait for Ohm before finalizing `src/core/soundscape.js`, `public/ambience.js`, `src/core/ttsProfiles.js`, and `tests/ambienceEngine.test.js`.
4. Re-run syntax and lint after all workers stop writing.
5. Run targeted tests in this order:
   - `node --test tests/itemCatalog.test.js tests/inventoryEconomy.test.js tests/gameEngineInventory.test.js`
   - `node --test tests/ambienceEngine.test.js tests/stateSummary.test.js tests/rules.test.js tests/combat.test.js tests/statusEffects.test.js`
   - `node --test tests/serverRoutes.test.js`
   - `node --test tests/playerUiAccess.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js`
6. Only then run the full gate:
   - `npm run test`
   - `npm run harness:check`

## Browser Paths Still Required

Static and Node tests are green, but the following browser paths remain required before release confidence:

- Create open room, join as player, begin scene, submit Action, submit Chat.
- Toggle log density through summary, dense, and comfortable; check main log and full log drawer.
- Open Team drawer and verify party cards with active/local/critical/low-mana tags do not overlap at desktop and mobile widths.
- Open My character, inspect inventory, use a utility tool, equip an item, sell an item.
- Open Market, buy affordable and unaffordable items, verify wallet, stock, disabled reason, and purchase feedback.
- Switch to Chinese and repeat market/inventory/error-label checks for raw ids.
- Enable ambience in Settings, verify new rain/market/tavern layers do not exceed usable volume or stall audio.
- Refresh/reopen authenticated, password, and host-approval room paths to verify stale account session tolerance with player/host tokens.

## Current Gate Decision

Current snapshot has no JS syntax, lint, targeted Node test, or `itemCatalog` module-load blocker. The remaining risk is integration timing and browser behavior, not a reproduced test failure.
