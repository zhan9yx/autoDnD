# 0015 Fresh-Data Browser Acceptance

Date: 2026-05-25
Worker: A
Scope: fresh local data visible-browser acceptance for the player loop left open after 0014.

## Run Setup

Command attempted in the default sandbox:

```bash
PORT=4215 AIDM_DATA_FILE=/private/tmp/aidm-0015-worker-a-fresh-data.json npm run dev
```

Result: blocked by local listen permission:

```text
Error: listen EPERM: operation not permitted 0.0.0.0:4215
```

Command rerun with localhost permission:

```bash
PORT=4215 AIDM_DATA_FILE=/private/tmp/aidm-0015-worker-a-fresh-data.json npm run dev
```

Result: server started at `http://localhost:4215`.

Browser target:

```text
http://127.0.0.1:4215/
```

Evidence directory:

```text
/private/tmp/aidm-0015-worker-a-fresh-browser
```

Fresh data file:

```text
/private/tmp/aidm-0015-worker-a-fresh-data.json
```

Room created:

```text
room_2d23bc7ab0ab438e
http://127.0.0.1:4215/?room=room_2d23bc7ab0ab438e
```

## Flow Result

| Check | Result | Evidence |
| --- | --- | --- |
| Gateway loaded on fresh data | Pass | `00-gateway.png` |
| Host local account registered | Pass | `01-registered.png` |
| Open room created from visible UI | Pass | `02-room-created.png` |
| Character created and joined | Pass | `03-character-joined.png` |
| Scene started | Pass | `04-scene-started.png` |
| Chat submitted without blocking play | Pass | `05-chat-submitted.png` |
| First turn action submitted with dice/log update | Pass | `06-action-submitted.png` |
| State strip expanded | Pass | `07-state-strip-expanded.png` |
| State drawer opened and verified | Pass | `08-state-drawer.png` |
| Full Log drawer opened and verified | Pass | `09-log-drawer.png` |
| Team drawer opened and verified | Pass | `10-team-drawer.png` |
| My character drawer opened and verified | Pass | `11-my-character-drawer.png` |
| Market drawer opened and verified | Pass | `12-market-drawer.png` |
| Settings drawer opened and verified | Pass | `13-settings-drawer.png` |
| Guide opened from player menu | Pass | `14-guide.png` |
| Market purchase attempted and backpack revisited | Pass | `15-market-after-buy.png`, `16-character-after-market.png` |
| Browser console errors during checked flow | Pass | `tab.dev.logs({ levels: ["error", "warning"] })` returned no entries after the refresh failure was reproduced. |
| Refresh recovery from room URL | Fixed/rechecked after Worker J | Original failure: `18-refresh-failed-gateway.png`. Recheck: `http://127.0.0.1:4216/?room=room_497dde73cd9f4d78` reload restored the table with gateway hidden and local character controls enabled. |

## Current Refresh Status

Worker A's original visible-browser run found a refresh-recovery P1 failure from `?room=<id>`. Worker J fixed and rechecked that local fresh-browser P1 on 2026-05-25. The recheck confirmed that reloading `http://127.0.0.1:4216/?room=room_497dde73cd9f4d78` waits for auth restore, opens the room through `openRoomById()`, hides the gateway, shows the table, enables local character controls, and leaves browser error/warning logs clean.

This closes the local refresh P1 evidence dependency only. It does not close broader public `GATE-002`; the full consolidated desktop/mobile browser acceptance pack is still required.

## Refresh Recovery Failure

After the visible flow reached `http://127.0.0.1:4215/?room=room_2d23bc7ab0ab438e`, a browser reload left the user on the gateway instead of reopening the table. The URL still contained the room query parameter, the account showed as restored, but `#table` remained hidden and the room was not loaded.

Observed after waiting beyond load:

```text
http://127.0.0.1:4215/?room=room_2d23bc7ab0ab438e
Visible screen: gateway/create-room form
Auth status: Worker A Host restored
Expected: Worker A Fresh Acceptance table restored with Aster Fresh bound
```

Manual recovery works: entering `room_2d23bc7ab0ab438e` in the visible "已有房间 ID" form reopens the same room with the player binding, log, scene, reward, and action controls restored. This confirms persistence exists, but automatic refresh recovery from the room URL is not accepted.

## Screenshot Paths

```text
/private/tmp/aidm-0015-worker-a-fresh-browser/00-gateway.png
/private/tmp/aidm-0015-worker-a-fresh-browser/01-registered.png
/private/tmp/aidm-0015-worker-a-fresh-browser/02-room-created.png
/private/tmp/aidm-0015-worker-a-fresh-browser/03-character-joined.png
/private/tmp/aidm-0015-worker-a-fresh-browser/04-scene-started.png
/private/tmp/aidm-0015-worker-a-fresh-browser/05-chat-submitted.png
/private/tmp/aidm-0015-worker-a-fresh-browser/06-action-submitted.png
/private/tmp/aidm-0015-worker-a-fresh-browser/07-state-strip-expanded.png
/private/tmp/aidm-0015-worker-a-fresh-browser/08-state-drawer.png
/private/tmp/aidm-0015-worker-a-fresh-browser/09-log-drawer.png
/private/tmp/aidm-0015-worker-a-fresh-browser/10-team-drawer.png
/private/tmp/aidm-0015-worker-a-fresh-browser/11-my-character-drawer.png
/private/tmp/aidm-0015-worker-a-fresh-browser/12-market-drawer.png
/private/tmp/aidm-0015-worker-a-fresh-browser/13-settings-drawer.png
/private/tmp/aidm-0015-worker-a-fresh-browser/14-guide.png
/private/tmp/aidm-0015-worker-a-fresh-browser/15-market-after-buy.png
/private/tmp/aidm-0015-worker-a-fresh-browser/16-character-after-market.png
/private/tmp/aidm-0015-worker-a-fresh-browser/18-refresh-failed-gateway.png
```

## Gate Decision

Fresh-data visible browser acceptance is fixed/rechecked for the local `?room=<id>` refresh P1 after Worker J. The player loop can be created, joined, started, acted, inspected through the required drawers, manually recovered by room ID in the original Worker A evidence, and automatically restored from the room URL in the Worker J recheck.

Public browser readiness is still not closed. This document is local fresh-browser evidence and does not replace the full consolidated desktop/mobile browser acceptance pack required by `GATE-002`.

## Worker J Fix Appendix

Date: 2026-05-25
Worker: J
Scope: P1 refresh recovery from `?room=<id>`.

Fix:

- `public/app.js` now runs URL room recovery through `initializeRoomFromUrl(startupAuthRestore)`.
- The URL recovery path waits for auth-session restoration, pre-fills the "Existing room ID" field, displays a loading status, then calls the same `openRoomById` path used by manual room entry.
- If the link cannot be opened, the gateway stays available with the room ID already filled so the user can retry or join instead of landing on an empty create-room state.

Verification:

- Added static browser QA coverage for `URLSearchParams`, `openRoomById`, auth-restore ordering, room ID prefill, and room-scoped access header recovery.
- `node --check public/app.js` passed.
- `node --test tests/browserAutomation.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/flowClosureExtended.test.js` passed: 12 tests.
- `npm run test:browser-qa` passed after rerun with localhost listen permission: 2 tests.
- Visible browser smoke on `http://127.0.0.1:4216/?room=room_497dde73cd9f4d78` passed after reload: gateway hidden, table visible, local character controls enabled, no browser error/warning logs.
