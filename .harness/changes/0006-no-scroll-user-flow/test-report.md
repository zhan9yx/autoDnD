# Test Report

## Automated Checks

- `npm run test`: passed, 67/67 tests.
- `npm run smoke`: passed with localhost network escalation after the sandboxed run was blocked by `EPERM`; smoke created a room, joined a player, started a scene, exercised actions, soundscape, combat intent, replay, and asset counts.
- `npm run harness:check`: passed with localhost network escalation. It ran lint on 51 JavaScript files, 67/67 tests, the 16-hour long-memory gate, simulated campaign, and Harness report validation.

## Browser QA

Local server: `http://localhost:4173`.

Verified with the in-app Browser at a narrow viewport reported as `560x803`:

- Open started room `room_ad2927e409d34d57`.
- Page-level scroll is removed: `scrollHeight=803`, `clientHeight=803`, `bodyOverflow=hidden`.
- Action composer is visible after the mobile-stage compression: action rect `top=718.45`, `bottom=773.45`, viewport height `803`.
- Stage and transcript both remain visible: stage rect `top=345.70`, `bottom=546.45`; transcript rect `top=556.45`, `bottom=795`.
- Raw i18n keys were not visible: `rawKeys=[]`.
- Party drawer opens as an overlay and removes its `inert` attribute while GM/log drawers keep `inert`.

## Product Review Evidence

- Five simulated human-user subagents completed read-only reviews.
- `docs/USER_FEEDBACK_0006.md` records 121 concrete issues and product response decisions.
- Implemented P0/P1 decisions in this change: one-viewport table shell, Party/GM/Full Log drawers, compact latest transcript, drawer scrim/close/Escape handling, closed-drawer `inert`, bilingual drawer/state copy, and mobile stage compression.

## Known Follow-Ups

- Browser plugin's DOM evaluation surface could not reliably confirm `document.activeElement` focus after opening drawers because its evaluation wrapper lacks native element `focus()`. The production code explicitly focuses the drawer close button with a delayed focus call; a future Playwright setup with full viewport/focus APIs should cover focus trap assertions.
- Advanced audio/voice settings are still inline on desktop and compacted on small screens; a future drawer-specific audio settings panel should finish the hierarchy cleanup.
- Role-based host/player visibility, host command bar, full combat tracker, content-level Chinese localization, and form error toasts remain in the 121-issue backlog.
