# 0013 Browser QA Current Status

Date: 2026-05-25
Worker: QA-BROWSER-D
Status: live browser QA completed with access-flow blockers.

## Worker U Protected Room Fix Addendum

Run date: 2026-05-25
Worker: 0013 blocker fix sub-agent U
Status: code-level P0/P1 fixes landed; final live screenshots still required.

Closed at code/test level:

- P0 closed: protected-room player views now keep `#playerSetupPanel` visible for password and host-approval minimal snapshots. The table no longer enters the `in-play` CSS state unless a local seated player is actually visible.
- P0 closed: browser room reads now attach room-scoped host, player, and pending-player credentials from local storage. Pending credentials are also accepted by read authorization, so a player tab can refresh from pending to approved and recover the seat.
- P0 closed: protected/minimal snapshots are normalized into a safe client room with fallback scene, empty player/log arrays, and protected-entry guidance instead of clearing local pending/seat state.
- P1 closed: wrong-password responses are surfaced in `#joinStatus`, mark the password field invalid, and focus the password field for correction.
- P1 closed: pending players receive a safe lobby snapshot containing only their own pending request, allowing the browser to show "pending approval" without exposing the protected room.

Verification:

- `node --check public/app.js public/i18n.js src/core/gameEngine.js src/server/server.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/flowClosureExtended.test.js tests/serverRoutes.test.js`: passed.
- `node --test tests/staticUiStructure.test.js tests/playerUiAccess.test.js`: 6/6 passed.
- `node --test tests/flowClosureExtended.test.js tests/serverRoutes.test.js`: 13/13 passed.
- `git diff --check -- public/app.js public/index.html public/styles.css public/i18n.js src/core/gameEngine.js src/server/server.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/flowClosureExtended.test.js tests/serverRoutes.test.js`: passed.

Still required for browser signoff:

- Re-run live screenshots for password-room wrong-password feedback, correct-password seating, approval pending state, host approve queue, and player-tab approved-seat recovery.
- Re-check desktop and mobile layout after the protected-entry state, especially `#playerSetupPanel`, `#joinStatus`, state strip, party strip, and table log density.
- Re-check browser audio controls separately; Worker U did not touch audio.

## Worker A Live Browser QA Addendum

Run date: 2026-05-25
Worker: final parallel sub-agent A / Browser QA
URL: `http://127.0.0.1:4185`
Mode: local Chrome headless DevTools screenshots against isolated server data file `/private/tmp/aidm-0013-browser-qa-data.json`.

Screenshots saved:

- `/private/tmp/aidm-0013-browser-qa-01-auth-session.png`
- `/private/tmp/aidm-0013-browser-qa-02-create-password-controls.png`
- `/private/tmp/aidm-0013-browser-qa-03-password-room-error.png`
- `/private/tmp/aidm-0013-browser-qa-04-password-room-joined.png`
- `/private/tmp/aidm-0013-browser-qa-05-create-approval-controls.png`
- `/private/tmp/aidm-0013-browser-qa-06-approval-pending.png`
- `/private/tmp/aidm-0013-browser-qa-07-approval-host-queue.png`
- `/private/tmp/aidm-0013-browser-qa-08-approval-approved.png`
- `/private/tmp/aidm-0013-browser-qa-09-state-log-audio.png`

Passed:

- Register flow creates a local host account, and reload restores the signed-in browser session. Screenshot: `01-auth-session`.
- Create-room access controls expose `open`, `password`, and `host-approval`; password mode reveals the room-password field. Screenshots: `02-create-password-controls`, `05-create-approval-controls`.
- Password room can reach a seated state after the correct password is submitted. Screenshot: `04-password-room-joined`.
- Host access queue renders a pending player and exposes Approve/Reject controls after host reload. Screenshot: `07-approval-host-queue`.
- Situation page density work is visible: collapsed/expanded state strip, compact party chip, denser table log entries, scene rain overlay, scene-change note, and soundscape layer chips. Screenshots: `04-password-room-joined`, `09-state-log-audio`.
- Ambience controls expose layered natural sound controls and percentages for voice/weather/city/action layers. Screenshot: `09-state-log-audio`.

Failed / blockers from Worker A live run:

- P0: Protected-room join UI is not a valid visible user path. In both password and host-approval player views, the page shows the table/action area with `需要角色`, but the player setup/join panel and password/pending controls are not visible. The automation could fill hidden form fields, so screenshots `03-password-room-error` and `06-approval-pending` must not be treated as real user-pass evidence.
- P0: Host approval does not close the player loop in the browser. Server data shows the pending player is approved and moved into `players`, but after player-tab reload the UI still shows `需要角色`, stale approval guidance, and no restored seat. Screenshot: `08-approval-approved`.
- P1: Wrong-password feedback is not visibly reachable because the protected-room join panel is hidden in the player view. Screenshot: `03-password-room-error`.

AB code-fix status: fixed pending screenshot recheck. `public/app.js` now preserves protected/minimal pending and seat sessions, keeps protected entry on the visible player setup panel until a real local player binding exists, and refreshes protected rooms through fetch calls that carry room player/pending/host headers instead of relying on headerless EventSource. Wrong-password feedback remains routed through the visible join status element. No new browser screenshots were captured by AB.

Conclusion: auth session, creation controls, layout density, scene presentation, log density, and ambience entry points are browser-visible. Password and host-approval room entry flows require a fresh live browser recheck before this file can be treated as screenshot signoff.

## Pause Gate

QA-BROWSER-D paused final screenshot verification until both P0 fixes were landed or confirmed:

- `public/app.js` no longer crashes at runtime in the auth UI path.
- Read-side authorization is complete for room reads, including `GET /api/rooms/:roomId` and `GET /api/rooms/:roomId/events` SSE.

Implementation files were not changed by this worker.

## Worker E Sync Addendum

- Later static/source checks show visible auth, password-room, and host-approval UI hooks in `public/index.html` and `public/app.js`.
- Later server/source checks show read-side authorization on room read, replay, events, and market routes.
- Escalated `npm run harness:check` passed on the integrated tree after the default sandbox run hit localhost `EPERM`.
- Final browser screenshot verification is still not recorded. Treat this file as a resume note, not as browser signoff.
- The preliminary state-strip visibility issue remains a re-test item; static tests cover the expanded CSS selector, but no final browser screenshot has confirmed it.

## Pre-Pause Notes

- An isolated dev server was started on `PORT=4183` with `AIDM_DATA_FILE=/private/tmp/aidm-0013-browser-worker-d.json`, then stopped after the pause request.
- The default `4173` port was already occupied by an existing Node listener.
- Browser screenshot capture through the in-app browser timed out before any final screenshot set was produced.
- Preliminary DOM-only smoke reached create-room, join, and begin-scene paths. Treat these observations as non-final because QA is paused pending the P0 auth/read-authorization fixes.
- A visible issue candidate observed before the pause: the table state strip toggle updated `data-expanded="true"` and `aria-expanded="true"`, but `#tableStateDetails` still computed as `visibility: hidden` and `opacity: 0`. Re-test this after the P0 fixes before filing it as confirmed.

## Resume Preconditions

Before running final QA:

```bash
PORT=4183 AIDM_DATA_FILE=/private/tmp/aidm-0013-browser-worker-d.json npm run dev
curl -sS http://127.0.0.1:4183/api/health
```

Then verify:

- Auth UI register/login/create password or approval room path does not crash in a real browser.
- `GET /api/rooms/:roomId` returns only the allowed lobby/minimal shape or rejects unauthorized protected-room reads where expected.
- `GET /api/rooms/:roomId/events` SSE is protected consistently with room read rules.
- Open room non-auth flow still renders.
- Password-room and host-approval-room flows work through visible UI if exposed; otherwise use API-assisted setup and verify visible blocked/approved states.

## Browser Script Skeleton

Use after the P0 fixes only.

```js
if (!globalThis.agent) {
  const { setupBrowserRuntime } = await import("/Users/yixuan.zhang/.codex/plugins/cache/openai-bundled/browser/26.519.31651/scripts/browser-client.mjs");
  await setupBrowserRuntime({ globals: globalThis });
}
if (!globalThis.browser) {
  globalThis.browser = await agent.browsers.get("iab");
}
await browser.nameSession("AIDM 0013 Browser QA");
if (typeof tab === "undefined" || !tab) {
  globalThis.tab = await browser.tabs.new();
}
await tab.goto("http://127.0.0.1:4183/");
await tab.playwright.waitForLoadState({ state: "domcontentloaded", timeoutMs: 10000 });

// Create/open room, register/login if UI is exposed, then verify no runtime errors.
// Capture screenshots after each stable state to:
// /private/tmp/aidm-0013-browser-01-gateway.png
// /private/tmp/aidm-0013-browser-02-auth-room.png
// /private/tmp/aidm-0013-browser-03-table-dense.png
// /private/tmp/aidm-0013-browser-04-state-strip.png
// /private/tmp/aidm-0013-browser-05-party-log-scene.png
// /private/tmp/aidm-0013-browser-06-protected-room.png
```

## Final QA Checklist

- State strip collapsed by default, expands visibly, and closes on Escape.
- Party strip remains compact with one and multiple players.
- Dense log shows compact transcript entries; comfortable toggle changes density; full log drawer shows all entries.
- Scene dynamics update backdrop, canvas effects, scene-change summary, soundscape label/reason, and state drawer.
- Register/login session persists across reload if UI exists.
- Password room requires correct password before player access if UI exists.
- Host-approval room keeps pending joins out of player-only drawers/actions until approval.
- API-assisted setup is acceptable only for room modes whose visible UI is not yet landed.
- Save final screenshots under `/private/tmp` and report obvious visual issues only after the P0 fixes are confirmed.

## AD Protected-Room Final Recheck

Run date: 2026-05-25
Worker: AD protected-room browser recheck
URL: `http://127.0.0.1:4186` / `http://localhost:4186`
Mode: real headless Chrome DevTools run against isolated local server data file `/private/tmp/aidm-0013-protected-room-final-data.json`.

Result: passed. This recheck supersedes the earlier protected-room blockers in this file for the password-room and host-approval room entry loops.

Screenshots saved:

- `/private/tmp/aidm-0013-protected-room-final-01-password-panel.png`
- `/private/tmp/aidm-0013-protected-room-final-02-password-error.png`
- `/private/tmp/aidm-0013-protected-room-final-03-password-seated.png`
- `/private/tmp/aidm-0013-protected-room-final-04-approval-pending.png`
- `/private/tmp/aidm-0013-protected-room-final-05-host-queue.png`
- `/private/tmp/aidm-0013-protected-room-final-06-approval-restored.png`

Verified:

- Password-room player view shows the visible join panel and visible room-password field.
- Wrong password keeps the join panel visible and shows the localized error `房间密码不正确。`.
- Correct password seats the player: table enters `in-play`, setup panel is hidden, My Character is enabled, and the action form is visible.
- Host-approval room shows a visible pending state after the player requests access; the join submit button is disabled while waiting.
- Host opens the room through the visible Existing room ID flow, opens Settings, and sees the pending queue with Approve/Reject controls.
- After host approval, the player refreshes the room and restores the approved seat: table is `in-play`, setup panel is hidden, My Character is enabled, and the action form is visible.

No protected-room browser blocker remains from this recheck. General deployment / launch-readiness gates remain tracked separately.
