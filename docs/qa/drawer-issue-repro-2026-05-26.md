# Drawer Issue Repro 2026-05-26

Date: 2026-05-26 CST
Worker: AO independent reproducer
Scope: current dirty tree reproduction for blank full-log drawer and missing character/backpack/progression drawer details.

## Result

Status: not reproduced in the current dirty tree.

The current dirty tree rendered both target drawer surfaces with non-empty content in desktop and mobile headless Chrome/CDP checks:

- Full log drawer opened with transcript rows.
- Character drawer opened with inventory, selected backpack item detail, equipment slots, known spells, level/xp cards, and progression summary.
- No browser runtime `ReferenceError`, `TypeError`, `SyntaxError`, or uncaught runtime exception was captured by the CDP repro script.

No product implementation files were changed by this pass. In particular, AO did not edit `public/app.js` or `public/styles.css`.

## Browser Evidence

Evidence root:

- `/private/tmp/aidm-drawer-issue-repro-2026-05-26/report.json`
- `/private/tmp/aidm-drawer-repro-run.mjs`

Screenshots:

- `/private/tmp/aidm-drawer-issue-repro-2026-05-26/desktop-log-drawer.png`
- `/private/tmp/aidm-drawer-issue-repro-2026-05-26/desktop-character-drawer.png`
- `/private/tmp/aidm-drawer-issue-repro-2026-05-26/mobile-log-drawer.png`
- `/private/tmp/aidm-drawer-issue-repro-2026-05-26/mobile-character-drawer.png`

Scenario:

- Server: `http://127.0.0.1:4258`
- Data file: `/private/tmp/aidm-drawer-issue-repro-2026-05-26-store.json`
- Room: `room_c8b444aa341c4296`
- Browser path: create room through API seed, join as local mage, buy and use `field-primer`, start scene, inject room-local player/host session into localStorage, open `/?room=<roomId>`, then click the visible drawer controls.

## Observed DOM

Desktop viewport: `1440x960`

- Log drawer: `open=true`, `aria-hidden=false`, `inert=false`.
- Log transcript: `messageCount=5`, `countText="5 条日志"`, text length `727`.
- Character drawer: `open=true`, `aria-hidden=false`, `inert=false`.
- Character details: `inventoryItems=4`, `inventoryDetailCards=1`, `inventoryActionHints=3`, `equipmentCards=4`, `spellChips=6`, `progressCards=2`, `levelingSummary=true`.
- Progress text included `等级 2`, `经验 120/200`, `升级收益`, `已学法术`, `战技`, and `法术可选项`.
- Equipment text included `装备槽`, `橡木杖`, and `旅行长袍`.
- Inventory detail text included `旅行提灯`, item description, condition, rarity, resale value, usability, equip/use/sell hints, and action buttons.

Mobile viewport: `390x844`

- Log drawer: `open=true`, `aria-hidden=false`, `inert=false`.
- Log transcript: `messageCount=5`, `countText="5 条日志"`, text length `727`.
- Character drawer: `open=true`, `aria-hidden=false`, `inert=false`.
- Character details matched desktop counts: `inventoryItems=4`, `inventoryDetailCards=1`, `inventoryActionHints=3`, `equipmentCards=4`, `spellChips=6`, `progressCards=2`, `levelingSummary=true`.

## Expected Contract

This is the independent pass/fail contract AO used for the drawer issue:

- Full log drawer should open through `[data-drawer-open="log"]`.
- `[data-drawer="log"]` should have `.open`, `aria-hidden="false"`, and `inert=false`.
- `#fullTranscript .message` count should be greater than `0`.
- `#logCount` should not report zero after the seeded transcript exists.
- Character drawer should open through `#myCharacterButton`.
- `[data-drawer="character"]` should have `.open`, `aria-hidden="false"`, and `inert=false`.
- `#inventoryList .inventory-item-button` count should be greater than `0`.
- Clicking an inventory item should render `#inventoryDetail .inventory-detail-card`.
- `#equipmentSummary article` count should be greater than `0`.
- `#spellList` should show learned spells when the character has spells.
- `#characterProgressSummary` should show level/xp cards and `[data-leveling-summary]` should be present after progression data exists.

Because the current dirty tree passed the browser repro, AO did not add `tests/drawerIssueRepro.test.js` in this pass.

## Commands

- `PORT=4258 AIDM_DATA_FILE=/private/tmp/aidm-drawer-issue-repro-2026-05-26-store.json npm run dev`
  - Default sandbox result: failed with `listen EPERM` on local port bind.
  - Escalated local run: passed; server listened on `http://localhost:4258`.
- Codex in-app Browser attempt:
  - Result: unavailable, `No active Codex browser pane available`.
- `AIDM_RUN_VISUAL_UI_CLOSURE=1 node --test tests/visualUiClosure.test.js`
  - Result: environment failure before product assertions: `Timed out waiting for Chrome CDP on 57943`.
  - Interpretation: not counted as product failure because the test never reached drawer assertions.
- `node /private/tmp/aidm-drawer-repro-run.mjs`
  - Result: passed after seed adjustment; generated `report.json` and four screenshots.
  - First seed attempt failed with `Not enough currency` after buying two market items; the repro was adjusted to buy only `field-primer`, which still exercises progression, spells, inventory, and drawer rendering.
- `node --test tests/levelingUi.test.js`
  - Result: passed, `3 pass, 0 fail`.
  - Covered static render contracts for character drawer progress/equipment/spells/inventory and full transcript drawer rendering.
- `npm run test:browser-qa`
  - Result: passed, `3 pass, 0 fail`.
  - Covered drawer wiring, refresh storage, mobile no-overflow hooks, market/backpack/action/replay/refresh flow, password rooms, and host approval flows.

## Heisenberg Boundary

AO does not have a current reproduction that blocks Heisenberg. From this independent repro pass, there is no need to wait for Heisenberg before recording current evidence.

If Heisenberg continues changing `public/app.js` or `public/styles.css`, rerun the same focused checks before merge because this report only reflects the dirty tree at the time of the 2026-05-26 16:05 CST CDP capture.
