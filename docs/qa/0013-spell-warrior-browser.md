# 0013 Spell / Warrior Browser-Flow Evidence

Date: 2026-05-25 CST
Worker: F plus 0013 public-productization worker
Scope: minimum evidence pass for starting spell visible binding, warrior specialization selection, browser join/action, and scroll learning. This file does not close the broader balance-feel or release-candidate device matrix.

## Result

Status: minimum visible browser flow evidenced; broader matrix remains open.

- Starting spell visible binding is covered by static UI plus focused rules evidence: mage starter cards render with `data-spell-state="known"` and `data-spell-availability="starting-available"`, and the visible copy says learned/available at start rather than optional preview.
- Warrior specialization selection is covered by static UI plus focused rules evidence: the setup UI exposes Weapon Master, Dual Wielder, and Berserker cards, syncs them to `#specializationSelect`, and the join payload includes `specializationId` only for warrior.
- Runtime specialization effect is covered by focused engine/rules tests: `dual-wielder`, `weapon-master`, and `berserker` apply deterministic attribute/equipment/action/resource effects.
- Live browser minimum path is now claimed by the 0013 public-productization worker: headless Chrome DevTools opened a real app page, selected mage and warrior cards, submitted a warrior join, started a scene with API-assisted host setup, submitted an action, bought a spell scroll, clicked visible Use, and observed the learned spell in the character spell list.

## Live Browser Attempts

- Started local dev server with isolated data:
  - `PORT=4199 AIDM_DATA_FILE=/private/tmp/aidm-0013-worker-f-data.json npm run dev`
  - Default sandbox failed with `listen EPERM`; rerun with localhost permission succeeded and served `http://localhost:4199`.
- Tried Codex in-app Browser:
  - Browser connection returned `No active Codex browser pane available`.
- Tried normal Chrome AppleScript DOM inspection:
  - Chrome rejected JavaScript execution because `Allow JavaScript from Apple Events` is disabled.
- Tried isolated headless Google Chrome through CDP:
  - Chrome launched on `ws://127.0.0.1:9333/...`.
  - Page loaded `/`, and app initialization rendered `#starterSpellCards` with `无初始法术`, `#pointBudget` as `10 / 27 点`, and visible warrior setup state in DOM.
  - CDP-triggered create-room submit fell through to the browser default GET URL instead of the app's submit handler.
  - API-created `?room=<id>` open did not reach the visible setup panel before timeout in this tool path.

The Worker F attempts above are superseded for the minimum visible flow by the 0013 public-productization worker run below. They remain useful as historical tooling context.

## 0013 Public-Productization Worker Live Browser Pass

- Local dev server:
  - `PORT=4223 AIDM_DATA_FILE=/private/tmp/aidm-0013-public-productization-worker/store.json npm run dev`
  - Default sandbox failed with localhost `listen EPERM`.
  - Localhost-permitted rerun served `http://localhost:4223`.
- Browser tool:
  - Headless Google Chrome through DevTools on `http://127.0.0.1:4223`.
- Room:
  - `room_13dc9b67f4224c83`, title `0013 Spell Warrior Visible Flow`.
- Assertions:
  - Mage starter spell cards rendered `火矢`, `沉眠咒`, `奥术护盾`, `琉璃回声`, and `风暴弧光` with `data-spell-state="known"` and `data-spell-availability="starting-available"`.
  - Warrior setup selected `dual-wielder`, then joined as `Kara`.
  - Scene started and action submit was visible and completed.
  - `binding-vines-scroll` was bought through the room market API for setup, then the browser showed it in My character.
  - Visible Use was clicked in the browser, and the spell list showed `缚藤术`.
  - Browser warning/error log count was 0 in the successful run.

Screenshots:

- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-01-mage-starting-spells.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-02-warrior-specialization-selected.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-03-warrior-joined.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-04-action-ready.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-05-warrior-action-submitted.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-06-scroll-visible-in-character.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-07-scroll-used-spell-learned.png`
- `/private/tmp/aidm-0013-public-productization-worker/0013-visible-flows-summary.json`

Retry boundary:

- A later attempt to add an extra post-learn spell-cast screenshot hit Chrome DevTools `Runtime.evaluate` / screenshot timeout and is not claimed as passing evidence.
- The passing evidence still covers visible character creation, specialization selection, scene action, scroll learning, and learned-spell visual binding.

## Focused Commands

- `node --check public/app.js`
  - Result: passed.
- `node --test --test-name-pattern "starting spell cards|warrior specializations|joinRoom applies warrior specialization" tests/rules.test.js tests/gameEngine.test.js`
  - Result: 3 tests total, 3 passed, 0 failed.
- `node --test tests/playerUiAccess.test.js tests/rules.test.js tests/gameEngine.test.js`
  - Result: failed in `tests/playerUiAccess.test.js` on unrelated current-tree static assertions around action-control source patterns.
  - The spell/warrior tests in the same run passed.
- `node /private/tmp/aidm-0013-public-productization-worker/0013-visible-flows.mjs`
  - Result: passed in the successful evidence run summarized by `/private/tmp/aidm-0013-public-productization-worker/0013-visible-flows-summary.json`.

## Evidence Files

- Live/automation scratch scripts and isolated data:
  - `/private/tmp/aidm-0013-worker-f-cdp-flow.mjs`
  - `/private/tmp/aidm-0013-worker-f-min-flow.mjs`
  - `/private/tmp/aidm-0013-worker-f-cdp-inspect.mjs`
  - `/private/tmp/aidm-0013-worker-f-click-create.mjs`
  - `/private/tmp/aidm-0013-worker-f-data.json`
- 0013 public-productization worker screenshots and summary:
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-01-mage-starting-spells.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-02-warrior-specialization-selected.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-03-warrior-joined.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-04-action-ready.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-05-warrior-action-submitted.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-06-scroll-visible-in-character.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-spell-warrior-07-scroll-used-spell-learned.png`
  - `/private/tmp/aidm-0013-public-productization-worker/0013-visible-flows-summary.json`

## Closure Boundary

Can treat as evidenced for the minimum visible browser path:

- Starting spell card semantics are not preview-only in static UI/rules evidence.
- Warrior specialization options and payload/effect contracts are present in static UI/rules evidence.
- Mage starting spells render in Chrome with known/starting-available binding.
- Warrior specialization selection, join, scene action, scroll visibility, visible scroll Use, and learned-spell visual binding are recorded in Chrome screenshots.

Must remain open:

- A broader class/device matrix.
- Dedicated post-learn spell-cast screenshot.
- Balance feel.
- Public-readiness or launch-gate approval.
