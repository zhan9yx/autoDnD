# 0016 Browser Automation

Date: 2026-05-25
Worker: B-0016
Scope: committed automation for the consolidated browser acceptance critical path, using Node's built-in test runner and the existing local HTTP/static contract.

## Command

Run the focused automation:

```bash
npm run test:browser-qa
```

The coverage lives in `tests/browserAutomation.test.js` and remains dependency-light. It does not replace Worker A's visible browser screenshot acceptance pack and does not change release gate status.

## Automated Coverage

- Static browser contract:
  - Drawer openers and hidden inert panels for Party, State, Log, My Character, Market, and Settings.
  - Password and host-approval creation/join controls.
  - Host pending queue selectors and approve/reject button contract.
  - State strip, State drawer, Log drawer, Replay, Market, Backpack, audio dock, voice, and ambience controls.
  - Room-scoped localStorage keys for host, player, and pending-player refresh recovery.
  - `attachRoomAccessHeaders` contract for host/player/pending access headers.
  - Voice settings persistence keys and ambience slider volume wiring.

- Fresh room browser-flow contract:
  - Serves the `?room=<id>` refresh shell.
  - Creates a room, joins a player, starts the scene, and verifies authorized refresh recovery.
  - Fetches TTS providers and soundscape presets.
  - Opens market API path, buys a rendered offer, and verifies backpack/wallet persistence after refresh.
  - Sends chat and action separately, then verifies transcript logs, state summary, media logs, replay JSON, replay Markdown, and post-action refresh recovery.
  - Checks room payloads for token/hash/password leakage.

- Protected-room contract:
  - Password room wrong-password, missing-password, correct-password, seated refresh recovery, and secret-safety checks.
  - Host-approval room public protected lobby, pending join, pending refresh recovery, blocked pending action, host approve, approved-player refresh recovery, approved chat, second pending reject, rejection reason, and secret-safety checks.

## Validation Notes

- Default sandbox blocked local `127.0.0.1` listen with `EPERM`; the focused command passed after rerunning with local-server permission.
- The only test repair during implementation was a static assertion update from a stale function-name/order assumption to the current `syncRoomAccessControls` and DOM ordering.

## Boundary

This is repeatable automation coverage for the critical browser-facing contracts. It is not Playwright, Puppeteer, visual screenshot QA, console sweep, or desktop/mobile evidence. Keep `GATE-002` blocked until Worker A's visible consolidated browser acceptance evidence is attached.
