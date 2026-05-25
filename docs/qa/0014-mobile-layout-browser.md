# 0014 Mobile Layout Browser QA

Date: 2026-05-25 CST
Worker: 0014 parallel worker S
URL: `http://127.0.0.1:4173/?room=room_49dfdd6dff734626`
Data file: `/private/tmp/aidm-0014-mobile-layout-store.json`

## Scope

Browser QA for responsive table layout at 375, 430, 768, and 1280 px widths. This pass covered the state strip expand/collapse behavior, party rail, log density toggle, action prompt/composer, market drawer, character/backpack drawer, settings/audio entry, page-level scroll, visible overlap, and log capacity.

No product code was changed.

## Test State

- Created a fresh Chinese open room from the visible UI.
- Joined one local player through the visible UI.
- Added two extra party members through the local room API to stress the party rail.
- Started the scene, submitted several turn actions/chats, bought one market item, then verified the item in the backpack drawer.
- Browser viewport heights used: 375 x 812, 430 x 932, 768 x 900, 1280 x 720.

## Screenshots

Saved under `/private/tmp/aidm-0014-mobile-layout-browser/`:

- `01-1280-main-collapsed.png` - desktop table, state strip collapsed, party rail, log, action composer.
- `02-1280-state-expanded.png` - desktop table, state strip expanded.
- `03-768-log-density.png` - tablet width after log density toggle.
- `04-768-settings-audio.png` - tablet settings/audio drawer.
- `05-430-state-expanded.png` - narrow width state strip expanded with action composer.
- `06-430-market-drawer.png` - narrow market drawer.
- `07-375-main-collapsed.png` - 375 width after clicking state collapse; detail panel still visually open because focus remains.
- `08-375-state-expanded.png` - 375 width state strip expanded.
- `09-375-character-backpack.png` - 375 character drawer top.
- `10-375-settings-audio.png` - 375 settings/audio drawer.
- `11-375-log-density-after-blur.png` - 375 collapsed state after moving focus to log density.
- `12-375-full-log-drawer.png` - 375 full log drawer with many entries.
- `13-375-character-backpack-scrolled.png` - 375 backpack list after market purchase.
- `14-375-action-density-cycle-end.png` - 375 action composer after cycling log density modes.
- `layout-metrics.json` - DOM/layout metrics sidecar for the captured states.

## Findings

### Post-QA Fix Note

Worker Z later fixed the two P1 findings from this pass. In a focused 375x667 smoke, summary, dense, and comfortable log-density modes all kept the `行动` button inside the viewport; body and document scroll height stayed at 667; and the collapsed state details had `aria-hidden=true`, `inert`, and `visibility:hidden`. Screenshot: `/private/tmp/aidm-0014-worker-z-375.png`.

### P0

- None found.

### P1

- Closed by Worker Z after this pass: the primary `行动` submit button no longer falls below the 375 px viewport in the focused smoke.
- Closed by Worker Z after this pass: collapsed state details no longer remain visible while `aria-expanded=false`; the details element now has `aria-hidden=true`, `inert`, and hidden visibility when collapsed.

### P2

- 768 px: the topbar action row wraps, but the second row is clipped by the topbar overflow. In the 768 metrics, `在线` and `开始场景` render below the topbar bottom (`top=160/153`, `bottom=188/195`, topbar bottom `142`). Screenshot `03-768-log-density.png` shows the status/start area cut off. Settings remains reachable, so this did not block the audio drawer check.
- 375 px: the party rail intentionally scrolls horizontally; the third party card extends beyond the viewport (`right=390` on a 375 px viewport) but is contained by the rail and does not create body-level horizontal scroll. This is acceptable, but it should stay treated as an intentional rail scroll, not a page overflow.

## Passed

- No body-level uncontrolled scroll in captured states. Metrics reported `horizontalOverflow=false`, `verticalOverflow=false`, and `body overflow=hidden` for 375, 430, 768, and 1280.
- 1280 px desktop layout kept the topbar, collapsed/expanded state strip, party rail, stage, log, and action composer inside the viewport with no visible overlap.
- 430 px layout kept the expanded state strip, stage, log panel, and full action composer visible; the action button remained reachable.
- Full log drawer at 375 px displayed many history entries and remained internally scrollable without page scroll.
- Log density toggle worked and cycled through `舒展`, `摘要`, and `紧凑` labels; it did not create body overflow.
- Market drawer at 430 px opened as a narrow bottom/full-height drawer, listed multiple items, and kept purchase buttons inside the drawer.
- Character/backpack drawer at 375 px showed the purchased `Bitterleaf Ampoule` after internal drawer scroll.
- Settings/audio drawer opened at 768 and 375 px. Market/guide entry, language selector, ambience label, ambience toggle, layer chips, and sliders were visible and internally scrollable.
- Party rail with three players did not squeeze the main action composer at 430 or desktop widths; at 375 it used horizontal rail overflow rather than body overflow.

## Blockers

- None for browser access or screenshot capture.
