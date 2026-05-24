# 0012 Browser Release Flow Visual QA

Date: 2026-05-25
Role: browser visual QA subagent
Scope: browser/manual QA evidence only. No product code, runtime tests, generated assets, or existing implementation files were changed.

## Target

- Service: `http://127.0.0.1:4173`
- Main room: `room_7d4c8f318ade49db`
- Equip supplemental room: `room_58c899d8f1d44e02`
- No-local-token mobile room: `room_b698c4ece3a04624`
- Viewports:
  - Desktop: 1280 x 720
  - Mobile: 390 x 844

## Browser Flow Covered

| Area | Browser evidence |
| --- | --- |
| Create room | Created `Visual QA Loop 1779642970809` through the gateway form. |
| Join | Joined local player `Asha Visual` through the character setup form. |
| Second player | Added `Brann QA` through the local API to simulate a second browser/player seat. |
| Start | Began the scene from the browser host controls. |
| Chat | Submitted party text from the browser action form in Chat mode. |
| Action and turn switch | Submitted an advantage action as `Asha Visual`; browser showed turn handoff to `Brann QA`. |
| Market buy | Opened Settings -> Market and bought `Scroll of Veiled Sleep`, then `Trail Ration`. |
| Bag use | Used `Trail Ration`; item was consumed from the inventory list. |
| Bag sell | Sold `Travel Lamp`; wallet feedback remained visible and no turn was spent. |
| Bag equip | Supplemental rogue room equipped `Shortbow`; equipment summary refreshed to `WEAPON Shortbow`. |
| Scene switch | `Brann QA` action moved the room to `Misty forest path` with `lastShiftReason=forest-action`. |
| Replay | Opened State and built Replay; summary reached `replayState=built`. |
| No-local-token | 390px mobile room showed setup panel and no-local action aria copy for an existing started room without local binding. |

## Screenshots

All screenshots are local artifacts:

| Label | Path |
| --- | --- |
| Desktop started | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/01-desktop-started.png` |
| Desktop turn switch | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/02-desktop-turn-switch.png` |
| Desktop market bought | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/03-desktop-market-bought.png` |
| Desktop inventory use/sell | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/04-desktop-inventory-use-sell.png` |
| Desktop scene switch | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/05-desktop-scene-switch.png` |
| Desktop replay built | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/06-desktop-replay-built.png` |
| Desktop equip supplemental | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/07-desktop-equip-supplemental.png` |
| Mobile 390 no-local-token | `/private/tmp/aidm-visual-qa-20260525/browser-visual-qa-cont-1779643093724/08-mobile-390-no-local-token.png` |

## Diagnostics

| Check | Result |
| --- | --- |
| Console errors | 0 in main replay, equip supplemental, and mobile no-local checks. |
| Visible broken images | 0 in the main desktop replay and mobile no-local checks. The equip supplemental DOM reported one hidden `src=""` placeholder image, not a visible broken image. |
| Desktop horizontal overflow | False, `scrollWidth=1280`, `clientWidth=1280`. |
| Mobile horizontal overflow | False, `scrollWidth=390`, `clientWidth=390`. |
| Replay state | Built, with 3 chapters, 4 highlights, and 2 memories. |
| Scene switch state | `Misty forest path`, objective `Follow the wet trail before it disappears under the roots.` |
| No-local-token copy | `No local character selected. Use the browser that joined this room, or join from setup before acting or chatting.` |

## Visual Findings

- P3: Reward toast can remain visible while the State drawer and Replay panel are open. It did not block the Replay result, but it visually overlaps the stage and part of the center log area in the desktop replay screenshot.
- P3: At 390px, topbar button labels are truncated (`My char...`, `Begin s...`). There is no horizontal overflow and core actions remain reachable, but the mobile chrome is dense.

## Assessment

The real browser flow closes the release-gate path across create, join, start, chat, action, market buy, bag use, bag sell, scene switch, replay, no-local-token, and a supplemental equip success path. No blocking visual issue was found. The remaining findings are polish-level UI density/overlay issues.
