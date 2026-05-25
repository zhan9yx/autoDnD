# 0014 Browser QA Plan

Date: 2026-05-25
Worker: 0014 QA/Harness worker F
Purpose: provide an executable browser QA procedure for the current product-depth acceptance checklist without modifying product code.

## Run Setup

Use isolated storage so the run does not depend on prior local rooms:

```bash
PORT=4194 AIDM_DATA_FILE=/private/tmp/aidm-0014-browser-qa-data.json npm run dev
```

Open:

```text
http://127.0.0.1:4194/
```

Save screenshots or JSON reports under `/private/tmp/aidm-0014-browser-qa-*`.

## Evidence Matrix

| Flow | Required Evidence |
| --- | --- |
| Create room | Room can be created from visible UI; host token/session state is not shown in URL or player-visible JSON. |
| Login refresh | Register or login a local account, refresh, and verify the account state and owned-room controls persist. |
| Password room | Create password room, verify wrong-password feedback, correct-password join, seated state, and refresh recovery. |
| Approval room | Create host-approval room, request access, verify pending state, approve/reject from host queue, and verify approved player recovery. |
| Join players | Join at least three players or contexts and confirm party rail, active/local labels, and room-scoped storage behave. |
| Action turns | Submit chat and turn-moving action; verify chat does not advance turn and action does. |
| Scene switch | Trigger a forest, market, travel, or weather-changing action; verify stage, state, log, replay, and soundscape metadata align. |
| Market/backpack | Buy an item, inspect backpack, use/equip/sell as allowed, refresh, and verify wallet/stock/inventory consistency. |
| State drawer | Inspect clocks, consequences, rewards, scene/media, replay, and player-safe details; verify secrets/internal catalog data are absent. |
| Audio settings | Toggle ambience and voice after a user gesture, adjust sliders, change scene/weather, mute, refresh, and verify no gameplay block. |

## Manual Steps

1. Start the server with the isolated data command above.
2. Open a clean browser context at `http://127.0.0.1:4194/`.
3. Register a host account from the visible UI.
4. Refresh the page and verify the account remains signed in.
5. Create an open room in Chinese, start as host, and join player one.
6. Open a second clean context and join player two through the visible room URL.
7. Open a third clean context and join player three if the UI supports the path without hidden fields.
8. Verify the party rail remains compact and identifies active/local players correctly.
9. Start the scene from the host context.
10. Submit one party chat and verify the active turn does not move.
11. Submit one action from the active player and verify the round/active turn and dice/log evidence update.
12. Submit a scene-changing action such as travel to market, forest, rain street, or tavern.
13. Verify stage artwork/tint, scene-change summary, State drawer, Log drawer, Replay, and soundscape label/reason all describe the same scene change.
14. Open Market, buy one affordable item, then open My character and verify it appears in the backpack.
15. Select the item and use, equip, or sell only if the item detail says that action is available.
16. Refresh the player tab and verify wallet, backpack, active player, scene, and log state persist.
17. Open Settings, toggle ambience after a click gesture, adjust Master/Music/Environment, then mute and refresh to verify persistence.
18. Create a password room from the host account.
19. Open the password-room URL in a clean player context, enter a wrong password, and verify visible in-page feedback.
20. Enter the correct password and verify the player is seated, action controls appear, and refresh restores the seat.
21. Create a host-approval room from the host account.
22. Open the approval-room URL in a clean player context, request access, and verify pending state blocks player-only actions.
23. From the host context, open the access queue, reject one pending request if available, and approve another.
24. Refresh the approved player context and verify the seat restores and actions/drawers are available.
25. Repeat the visual checks at desktop width and about 390px mobile width.

## Automation Skeleton

This is a script outline for a future browser worker. It is intentionally not committed as a test in this pass.

```js
const baseUrl = "http://127.0.0.1:4194/";

async function expectVisible(page, selector, label) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: "visible", timeout: 10000 });
  console.log(`visible: ${label}`);
}

async function capture(page, name) {
  await page.screenshot({ path: `/private/tmp/aidm-0014-browser-qa-${name}.png`, fullPage: true });
}

// 1. new context: register host, refresh, create open room.
// 2. second and third contexts: join players, verify party rail.
// 3. host: start scene; active player: chat then action; verify turn/log.
// 4. trigger scene change; inspect State, Log, Replay, and soundscape UI.
// 5. market/backpack: buy, inspect, use/equip/sell, refresh.
// 6. password room: wrong password, correct password, seated refresh.
// 7. approval room: pending, blocked action, approve/reject, restored seat.
// 8. audio settings: gesture, toggle, sliders, mute, refresh.
// 9. repeat layout captures at desktop and mobile viewport widths.
```

## Pass Criteria

- No browser console error blocks the main flow.
- No player-visible page exposes tokens, password hashes, session tokens, internal asset metadata, private memos from other players, or raw debug catalogs.
- Every in-page error is visible, localized enough for the selected table language, and recoverable without creating a new room.
- Desktop and mobile layouts show no incoherent overlap in the situation strip, party rail, table log, drawers, action composer, market/backpack, protected-room setup panel, or audio controls.
- The full flow closes from clean room creation through refresh recovery after action, scene change, inventory, and protected-room approval.

## Fail Handling

If a failure is found:

- Record the exact URL, viewport, room mode, account/player state, and screenshot path.
- Separate product-visible failures from sandbox/server permission failures.
- File or update `docs/BUGS.md` only when the issue is reproducible from visible UI or committed API behavior.
- Do not patch product code in this Worker F documentation pass.
