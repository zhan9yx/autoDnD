# 0015 Consolidated Browser Acceptance

Date: 2026-05-25
Worker: 0015-continuous-hardening
Scope: local consolidated desktop/mobile browser acceptance for `GATE-002` evidence. This is not public-launch approval.

## Decision

The local consolidated browser acceptance pack is attached and passed on isolated local data.

`GATE-002` remains blocked in the public-readiness gate matrix because the release-gate contract is fail-closed until Harness review explicitly approves a gate status change. This evidence removes the missing local browser-pack blocker only. Public readiness remains blocked by release-candidate evidence, deployment, operations, security, legal/privacy, load/reliability, support/launch, and sign-off gaps.

## Tooling

Codex in-app Browser was attempted first. The browser plugin listed a Codex In-app Browser instance, but binding to an active browser pane returned `No active Codex browser pane available`. The accepted evidence run used local Google Chrome headless through Chrome DevTools Protocol against the same local AIDM server.

No image assets were created or expanded.

## Run Setup

Server:

```bash
PORT=4231 AIDM_DATA_FILE=/private/tmp/aidm-0015-consolidated-browser-final3/store.json npm run dev
```

Browser runner:

```bash
AIDM_EVIDENCE_DIR=/private/tmp/aidm-0015-consolidated-browser-final3 \
AIDM_BROWSER_BASE_URL=http://127.0.0.1:4231 \
node /private/tmp/aidm-0015-consolidated-browser/cdp-runner.mjs
```

Result:

```json
{
  "ok": true,
  "screenshots": 30,
  "assertions": 22,
  "rooms": {
    "open": "room_52bb41d1fcbf407f",
    "password": "room_0d580bd3f3ba46a1",
    "approval": "room_99a942f13d2d4f59"
  },
  "browserLogs": 5
}
```

Machine-readable report:

```text
/private/tmp/aidm-0015-consolidated-browser-final3/summary.json
```

## Coverage Matrix

| 0014/0015 area | Result | Evidence |
| --- | --- | --- |
| Fresh gateway and host account | Pass | `00-desktop-gateway.png`, `01-desktop-host-registered.png` |
| Open room create/join | Pass | `02-desktop-open-room-created.png`, `03-desktop-host-character-joined.png` |
| Three isolated browser contexts / party rail | Pass | `04-desktop-three-player-party-rail.png`; assertion `party rail shows three seated players` |
| Scene start | Pass | `05-desktop-scene-started.png`; assertion `scene started with stage and table visible` |
| Chat/action split | Pass | `06-desktop-chat-submitted.png`, `07-desktop-action-submitted.png`; room snapshot confirmed chat and action transcript entries |
| Dice/GM/action evidence | Pass | assertion `action produced dice or GM log evidence` |
| State strip, State drawer, replay, full log | Pass | `08-desktop-state-strip-expanded.png`, `09-desktop-state-drawer-replay.png`, `10-desktop-full-log-drawer.png` |
| Market/backpack buy and inventory action | Pass | `11-desktop-market-before-buy.png`, `12-desktop-market-after-buy.png`, `13-desktop-character-backpack-after-buy.png`; assertion `inventory action attempted` |
| Refresh recovery after inventory | Pass | `14-desktop-refresh-backpack-restored.png` |
| Audio settings and refresh persistence | Pass | `15-desktop-audio-settings.png`, `16-desktop-audio-refresh-restored.png` |
| Mobile viewport around 390px | Pass | `17-mobile-main.png`, `18-mobile-state-strip-expanded.png`, `19-mobile-log-drawer.png`, `20-mobile-market-drawer.png` |
| Password room wrong/correct password | Pass | `21-password-room-created.png`, `22-password-wrong-feedback.png`, `23-password-correct-seated.png` |
| Password-room seated refresh recovery | Pass | `24-password-refresh-recovered.png` |
| Host-approval pending/reject/approve | Pass | `25-approval-room-created.png`, `26-approval-pending-player.png`, `27-approval-host-queue.png`, `28-approval-host-after-decisions.png` |
| Approved-player refresh recovery | Pass | `29-approval-approved-refresh-recovered.png` |
| Player-visible secret safety | Pass | 8 visible-page assertions found no `hostToken`, `playerToken`, `passwordHash`, `tokenHash`, `sessionToken`, or bearer token text |

## Screenshot Paths

```text
/private/tmp/aidm-0015-consolidated-browser-final3/00-desktop-gateway.png
/private/tmp/aidm-0015-consolidated-browser-final3/01-desktop-host-registered.png
/private/tmp/aidm-0015-consolidated-browser-final3/02-desktop-open-room-created.png
/private/tmp/aidm-0015-consolidated-browser-final3/03-desktop-host-character-joined.png
/private/tmp/aidm-0015-consolidated-browser-final3/04-desktop-three-player-party-rail.png
/private/tmp/aidm-0015-consolidated-browser-final3/05-desktop-scene-started.png
/private/tmp/aidm-0015-consolidated-browser-final3/06-desktop-chat-submitted.png
/private/tmp/aidm-0015-consolidated-browser-final3/07-desktop-action-submitted.png
/private/tmp/aidm-0015-consolidated-browser-final3/08-desktop-state-strip-expanded.png
/private/tmp/aidm-0015-consolidated-browser-final3/09-desktop-state-drawer-replay.png
/private/tmp/aidm-0015-consolidated-browser-final3/10-desktop-full-log-drawer.png
/private/tmp/aidm-0015-consolidated-browser-final3/11-desktop-market-before-buy.png
/private/tmp/aidm-0015-consolidated-browser-final3/12-desktop-market-after-buy.png
/private/tmp/aidm-0015-consolidated-browser-final3/13-desktop-character-backpack-after-buy.png
/private/tmp/aidm-0015-consolidated-browser-final3/14-desktop-refresh-backpack-restored.png
/private/tmp/aidm-0015-consolidated-browser-final3/15-desktop-audio-settings.png
/private/tmp/aidm-0015-consolidated-browser-final3/16-desktop-audio-refresh-restored.png
/private/tmp/aidm-0015-consolidated-browser-final3/17-mobile-main.png
/private/tmp/aidm-0015-consolidated-browser-final3/18-mobile-state-strip-expanded.png
/private/tmp/aidm-0015-consolidated-browser-final3/19-mobile-log-drawer.png
/private/tmp/aidm-0015-consolidated-browser-final3/20-mobile-market-drawer.png
/private/tmp/aidm-0015-consolidated-browser-final3/21-password-room-created.png
/private/tmp/aidm-0015-consolidated-browser-final3/22-password-wrong-feedback.png
/private/tmp/aidm-0015-consolidated-browser-final3/23-password-correct-seated.png
/private/tmp/aidm-0015-consolidated-browser-final3/24-password-refresh-recovered.png
/private/tmp/aidm-0015-consolidated-browser-final3/25-approval-room-created.png
/private/tmp/aidm-0015-consolidated-browser-final3/26-approval-pending-player.png
/private/tmp/aidm-0015-consolidated-browser-final3/27-approval-host-queue.png
/private/tmp/aidm-0015-consolidated-browser-final3/28-approval-host-after-decisions.png
/private/tmp/aidm-0015-consolidated-browser-final3/29-approval-approved-refresh-recovered.png
```

## Browser Log Notes

The report captured five browser network error entries:

- two expected `404` static lookups from browser favicon behavior
- two expected `409 Conflict` entries from stale-version retry paths while the flow recovered and continued
- one expected `403 Forbidden` from the wrong-password password-room check

No blocking page exception, console error, token leak, or unrecovered visible-browser failure was recorded.

## Remaining Public-Readiness Boundary

This evidence is sufficient to attach the missing local consolidated browser pack and to close the `BUG-0012` missing-evidence condition at the local acceptance level. It does not close public readiness. `GATE-001` and `GATE-003` through `GATE-008` remain blocked, and the public `GATE-002` row remains blocked until Harness review accepts this evidence as a gate-status change.
