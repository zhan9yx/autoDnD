# 0015 Browser QA Automation

Date: 2026-05-25
Worker: C
Purpose: convert the recurring browser QA checklist into committed automated coverage without adding a browser dependency.

## Command

Run the focused coverage:

```bash
npm run test:browser-qa
```

The test is also included in the default suite because `npm test` runs `tests/*.test.js`.

## Coverage

- Static browser contract: committed DOM has openers and hidden inert panels for Party, State, Log, My Character, Market, and Settings drawers.
- Drawer behavior contract: `openDrawer`/`closeDrawers` continue to toggle `open`, `aria-hidden`, `inert`, the drawer scrim, and `body.drawer-open`; Market opening refreshes the shop.
- Refresh contract: room-scoped local storage keys and `attachRoomAccessHeaders` still provide player/host access headers after reload.
- Mobile no-overflow contract: table-active shell locks to one viewport, drawers stay viewport-bounded, and mobile topbar/action composer use `minmax(0, 1fr)` grids.
- Fresh local room flow: a temp-data server creates a new Chinese room, joins a player, starts the scene, opens the market API path, buys a rendered offer, verifies backpack/wallet persistence after a simulated reload, sends chat, submits an action, builds replay, and verifies post-action refresh recovery at the Node/API contract layer.
- Secret safety: room snapshots used by the flow are checked for host/player token value leaks and token/hash field names.

## Scope Notes

This is not a Playwright visual screenshot pass. The repo does not currently carry Playwright, Puppeteer, jsdom, or a comparable committed browser runner, so the automation stays inside Node's built-in test runner and the existing local HTTP server pattern. It gives committed regression coverage for the browser-visible contracts that the 0014 manual plan repeated most often, while leaving full screenshot/device inspection as a manual or future dependency-backed pass.

No `public/*` files were changed for this automation.

This automation does not supersede visible-browser evidence. Worker J later fixed/rechecked the local fresh-browser `?room=<id>` refresh path, and Worker B visual checklist evidence is now indexed. Keep `GATE-002` blocked until the full consolidated desktop/mobile browser acceptance pack exists; `docs/qa/0015-consolidated-browser-gap.md` records the remaining browser evidence gap.
