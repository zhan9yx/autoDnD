# 0012 Browser Post-P3 Fix Revalidation

Date: 2026-05-25
Role: M6 documentation sync worker; P6 QA aggregation follow-up
Scope: documentation status only. No product code, tests, assets, staging, or commits were changed in this pass.

## Status

Focused browser sign-off passed for the previously blocked P3 follow-up paths.

The current working tree contains uncommitted P3 follow-up changes for reward-toast drawer behavior and 390px topbar wrapping, plus season-priority runtime/test updates. The early browser attempts below found real blockers, but later focused checks closed them: Replay/drawer/toast, Market, Equip, scene switch, no-local-token, 390px topbar, and visible-image diagnostics now have current-tree pass evidence.

This file remains the current status source for the post-P3 browser revalidation. A single combined desktop/mobile run is still recommended for release confidence, but the known P3 blockers are no longer open.

Final gates after the current fixes:

- `node --check public/app.js public/i18n.js src/core/rules.js`: pass
- Focused flow/static/knowledge tests: 25/25 pass
- `npm run test`: 241/241 pass
- `npm run lint`: pass, 79 JavaScript files checked
- `npm run harness:check`: pass after rerun in an environment allowed to bind `127.0.0.1`, ending with `harness check ok`

## Current Evidence Summary

Current-tree focused checks now close the previously observed P3 follow-up blockers:

- Replay, State drawer, and reward-toast overlap: passed in P2.
- Market, bag buy/use/sell, Equip, and scene switch: passed in the main-agent follow-up.
- Latest action submit and Market Buy realtime-pause/timeout hardening: passed in W2 and the main-agent DOM browser check.
- No-local-token guardrail, desktop overflow, console diagnostics, and visible-image diagnostics: passed in the main-agent diagnostic pass.
- 390px mobile topbar, drawer/toast overlap, Replay, and Market visibility: passed in P5/W5.

The remaining note is coverage shape, not an open blocker: these passes are split across focused desktop/mobile runs rather than one uninterrupted combined browser pass.

## Historical Browser Evidence

Earlier interrupted post-P3 browser attempt:

- Room: `room_8d9782babf534519`
- Screenshots:
  - `/private/tmp/aidm-browser-post-p3-qa/01-desktop-started.png`
  - `/private/tmp/aidm-browser-post-p3-qa/02-desktop-after-asha-action.png`
  - `/private/tmp/aidm-browser-post-p3-qa/03-desktop-state-with-reward-toast.png`
  - `/private/tmp/aidm-browser-post-p3-qa/04-desktop-state-replay-with-reward-toast.png`
  - `/private/tmp/aidm-browser-post-p3-qa/05-desktop-market-open.png`

Confirmed in that attempt:

- Create, first join, second join, start, and first action reached a playable room.
- Asha action switched the turn to Brann and produced roll, GM narration, and reward toast.
- Console errors were 0 in the checked stages.
- Desktop horizontal overflow stayed at `1280/1280`.

Historical blockers observed in that interrupted attempt, later superseded by focused passes:

- Reward toast no longer blocked the stage, but still overlapped the bottom of the State drawer in the reported browser attempt.
- Replay did not complete: after clicking Build, `#replaySummary` still showed `No report yet` and `data-replay-state=empty`.
- Market UI did not complete: Settings -> Market stayed at `Loading market...` with no Buy button, although the direct `/api/rooms/<id>/market` request returned 200.
- Bag use, bag sell, bag equip, scene switch, no-local-token, and 390px mobile replay/market flow were not completed before interruption.

Later focused post-P3 evidence reported by browser workers:

- Replay recovery: one browser run reached Replay Build success after request sequencing, busy/error/finally handling, timeout handling, and realtime pause hardening. That run did not complete the full Market and visual sign-off path.
- Market recovery: room `room_4e0d59f63c1d49d0` opened Settings -> Market successfully, showed 52 Buy buttons, bought `healing-draught`, used `Healing Draught`, sold `Travel Lamp`, sold `Guard Shield`, and bought `Signet Ring`.
- Visual recovery: room `room_a860622ae3d34938` reached create, join, start, action, and State drawer. The saved State drawer screenshot did not show obvious reward-toast obstruction, and the checked console error count was 0.
- Screenshots for the partial Market recovery:
  - `/private/tmp/aidm-browser-n1-post-p3-1779644976074/06-desktop-market-open.png`
  - `/private/tmp/aidm-browser-n1-post-p3-1779644976074/07-desktop-market-bought.png`
  - `/private/tmp/aidm-browser-n1-post-p3-1779644976074/09-desktop-bag-use.png`
  - `/private/tmp/aidm-browser-n1-post-p3-1779644976074/10-desktop-bag-sell.png`
  - `/private/tmp/aidm-browser-n1-post-p3-1779644976074/14-desktop-market-buy-signet.png`
- Screenshots for the partial visual recovery:
  - `/private/tmp/aidm-n3-post-p3-visual-qa/01-desktop-reward-toast.png`
  - `/private/tmp/aidm-n3-post-p3-visual-qa/02-desktop-state-drawer.png`

Historical open items after P1-P5, superseded by later focused checks:

- Equip originally failed in the P1 run below, then passed after the main-agent follow-up added inventory action timeout/realtime-pause handling.
- Reward toast / State drawer / Replay overlap passed in P2 and was also rechecked by the main-agent follow-up.
- Replay success was not initially combined with Market, bag, scene switch, no-local-token, mobile, console, overflow, and broken-image checks in one current-tree sign-off pass.
- Scene switch was revalidated by the main-agent follow-up: the action moved the stage to `Misty forest path` with Deep Forest audio and a successful roll.
- No-local-token was later revalidated by the main-agent follow-up.
- 390px mobile topbar and narrow key flow are now covered by P5 below; 390px replay/market flow remains outside that narrow pass.
- Final console error, horizontal overflow, and visible broken-image summary was later completed for the focused no-local diagnostic page.

## P2 Narrow Replay / Drawer / Toast Revalidation

Date/time: 2026-05-25 02:06 CST
Scope: Replay + State drawer + reward toast only. No code, tests, assets, staging, or commits were changed. This pass used the current dev server at `http://localhost:4173`.

Setup notes:

- Initial UI action attempt in `room_8746077789664c92` blocked with the action button stuck at `裁定中...` for more than 30 seconds and no console errors. That room was abandoned as contaminated by a pending request.
- Browser text entry was blocked by the browser automation environment's virtual clipboard path, so the successful verification used local API setup for create/join/start/action/reward generation, then verified the target UI behavior in the browser.
- Verified room: `room_58f8c0e1759d4548`.
- Player: `player_936546f6bd6a4db1` / `Mira P2`.
- Reward generated by the second action: `雨痕航图`.

Screenshots:

- `/private/tmp/aidm-p2-replay-state-toast-qa/01-reward-toast-before-drawer.png`
- `/private/tmp/aidm-p2-replay-state-toast-qa/02-state-drawer-with-toast-state.png`
- `/private/tmp/aidm-p2-replay-state-toast-qa/03-replay-built-state-drawer.png`

Measured result:

- Before opening State drawer: reward toast was visible with `aria-hidden=false`, `display=grid`, `opacity=1`, and rect `420 x 155.140625` at `x=842`, `y=546.859375`.
- After opening State drawer: reward toast became hidden with `aria-hidden=true`, `display=none`, `visibility=hidden`, `opacity=0`, `pointer-events=none`, rect `0 x 0`, and `z-index=26`.
- State drawer was visible with rect `460 x 692` at `x=806`, `y=14`, `z-index=28`.
- Replay Build completed: `#replaySummary[data-replay-state="built"]`.
- Replay summary text reported `2 章 / 4 个高光 / 2 条记忆`.
- Visible toast-to-drawer overlap: `0 px^2`.
- Visible toast-to-replay overlap: `0 px^2`.
- Geometric toast-to-drawer overlap after drawer opened: `0 px^2`.
- Geometric toast-to-replay overlap after drawer opened: `0 px^2`.
- Console errors: `0`.

P2 decision:

- Passed for the narrow Replay + State drawer + reward toast scope.
- This closed the narrow Replay + State drawer + reward toast scope. Market, equip, scene switch, no-local-token, 390px, overflow, and broken-image checks are covered by later focused passes in this file.

## P5 Narrow 390px Mobile Topbar / Key Flow Revalidation

Date/time: 2026-05-25 02:06 CST
Scope: 390px mobile topbar and key flow only. No code, tests, assets, staging, or commits were changed. The browser capability connection timed out, so this pass used Headless Chrome with explicit mobile metrics `390 x 844` against the current dev server at `http://localhost:4173`.

Verified rooms:

- Chinese/browser-default run: `room_9b75c21d5b994e22`
- Forced-English run for long labels: `room_57bb19512a8a4555`

Screenshots:

- `/private/tmp/aidm-p5-mobile-qa-1779645904240/04-mobile-after-start.png`
- `/private/tmp/aidm-p5-mobile-qa-1779645904240/08-mobile-after-action.png`
- `/private/tmp/aidm-p5-mobile-qa-1779646014836/04-mobile-after-start.png`
- `/private/tmp/aidm-p5-mobile-qa-1779646014836/08-mobile-after-action.png`

Measured result:

- Key flow completed in both runs: create room, join character, begin scene, open State drawer, open Settings drawer, open My character drawer, submit one scene action.
- Final viewport in both runs: `innerWidth=390`, `innerHeight=844`, `deviceScaleFactor=1`.
- Final document width in both runs: `clientWidth=390`, `scrollWidth=390`, `bodyScrollWidth=390`, so horizontal overflow was `false`.
- Topbar action grid used 4 columns of `83.5px`; topbar and topbar-actions had no horizontal or vertical overflow.
- English topbar labels `My character`, `Team`, `State`, `Full log`, `Settings`, and `Begin scene` all fit: `text-overflow=clip`, `white-space=normal`, horizontal fit `true`, vertical fit `true`, and within viewport `true`.
- Core buttons were reachable in the mobile viewport. State, Settings, and My character drawers opened and closed through visible controls; the action input and Act button were reachable after joining/starting.
- Flow blockers for this narrow P5 scope: `0`.
- Console diagnostics: one non-flow error in each run, `/favicon.ico` returned 404. No application JavaScript exception was recorded.

P5 decision:

- Passed for the narrow 390px mobile topbar and key flow scope.
- This closed the narrow 390px mobile topbar and key flow scope. Replay, Market, bag, scene-switch, no-local-token, and visible-image diagnostics are covered by other focused passes in this file.

## Documentation Alignment

- `docs/qa/0012-browser-release-flow-visual-qa.md` now records the older complete browser pass separately from the current post-P3 follow-up status.
- `.harness/changes/0012-continuous-depth-assets/tasks.md` already carries an open item to run a fresh desktop and mobile browser QA pass after runtime UI changes, so the Harness task status remains consistent.
- The post-P3 browser follow-up is marked passed by focused current-tree checks for Replay, Market, bag actions including equip, scene switch, no-local-token, 390px topbar, and final no-local diagnostics. A single combined desktop/mobile run remains recommended before a broader release handoff.

## Gate Decision

Pass for post-P3 blocker closure. No known P3 blocker remains open in the current-tree evidence recorded here.

The current uncommitted P3 follow-up can be submitted as focused browser-verified for the previously known blockers. The only remaining caveat is coverage shape: the evidence is split across focused browser passes instead of one uninterrupted desktop/mobile run, so a combined pass is recommended before broader release handoff but is not recorded as a current blocker in this document.

## P1 Equip-Only Browser Attempt

Role: P1 narrow browser agent
Scope: Equip only. No product code, tests, staging, or commits were changed in this pass.

Room: `room_15b47fc8fcf2478a`

Confirmed setup:

- The browser had a local player binding for `P1 Equip` (`party-status-card local-player`).
- Market buy path was used to buy `Signet Ring` / `signet-ring-87a0e594`.
- After reloading the room, the transcript showed `P1 Equip购买了印戒，花费 90 克朗。`.
- Server state showed the local player wallet at `30`, with `signet-ring-87a0e594` in inventory, `slot=accessory`, `equipped=false`.

Equip result:

- Opened `我的角色`, selected `Signet Ring` in the backpack, and clicked the real UI button `装备Signet Ring。装备到饰品。`.
- The button entered `装备中...` and stayed disabled.
- The character drawer did not show the ring in the equipment summary; accessory/focus/tool style summary remained `武器/护甲/-/-`.
- `#inventoryStatus` remained empty after waiting.
- Server state still showed `signet-ring-87a0e594` as `equipped=false`, and `equipmentSummary.slots.accessory.item=null`.
- Console errors/warnings in the checked browser stages: `0`.

Screenshot:

- `/private/tmp/aidm-p1-equip-qa/01-equip-click-stuck.png`

Gate decision:

- Superseded by the main-agent follow-up below. P1 remains useful as the failure repro: the buy precondition reached server state, but the UI Equip request did not resolve before inventory actions were given request timeout/realtime-pause handling.

## Main-Agent Follow-Up Browser Checks

Role: main integration agent
Scope: focused browser checks after the P1 equip failure and Replay/Market fixes.

Room: `room_ff7f6f342621476d`

Screenshots:

- `/private/tmp/aidm-main-browser-gate-1779645965689/01-after-action-submit.png`
- `/private/tmp/aidm-main-browser-gate-1779645965689/02-replay-built-state-drawer.png`
- `/private/tmp/aidm-main-browser-gate-1779645965689/03-market-open-retry.png`
- `/private/tmp/aidm-main-browser-gate-1779645965689/04-signet-buy.png`
- `/private/tmp/aidm-main-browser-gate-1779645965689/05-character-after-signet-buy.png`
- `/private/tmp/aidm-main-browser-gate-1779645965689/06-signet-equipped-after-fix.png`

Confirmed:

- Scene action submitted through the UI and switched the stage to `Misty forest path`, with Deep Forest audio and `Success 18 vs DC 12`.
- Replay Build completed in the State drawer: `#replaySummary[data-replay-state="built"]`, with summary text `1 chapters / 2 highlights / 1 memories`.
- Reward toast was hidden while the State drawer and Replay panel were open: visible toast-to-drawer overlap `0 px^2`, visible toast-to-replay overlap `0 px^2`.
- Settings -> Market opened without the previous `Loading market...` hang and displayed 52 Buy buttons.
- Market buy completed for `Signet Ring`: status showed `Bought Signet Ring for 90 CR. Wallet: 30 CR`.
- My character -> Signet Ring -> Equip completed after inventory action timeout/realtime-pause handling: transcript showed `Asha Gate equipped Signet Ring`, inventory detail changed to `Already equipped`, and `#inventoryStatus` showed `Equipped Signet Ring to accessory. Equipment summary is refreshed.`

Coverage caveat, not a current blocker for the known P3 fixes:

- A single combined desktop/mobile browser run that covers all subpaths end to end remains desirable, although the previously blocked Replay, Market, Equip, scene-switch, and 390px topbar items now have focused pass evidence.

## W2 Scene-Switch Revalidation After Action Timeout Patch

Role: W2 browser worker
Scope: current-tree create, join, start, and UI action submit after action POST timeout/realtime-pause handling.

Room: `room_427cb85ba0684423`

Screenshot:

- `/private/tmp/aidm-w2-chrome-cdp-1779647569583/01-after-scene-switch.png`

Confirmed:

- Created, joined, and started a room through the browser UI.
- Submitted an action through the UI.
- Scene switched to `Misty forest path`.
- Transcript and dice panel updated.
- Submit button recovered to `Act` with `aria-busy=false` and not disabled.
- Console error count was `0`.

## W5 Mobile Visual Revalidation

Role: W5 mobile/visual worker
Scope: `390 x 844` mobile viewport topbar, drawer/toast, Replay, Market visibility, and overflow.

Room: `room_bb802bc81baf4f74`

Screenshots:

- `/private/tmp/aidm-w5-mobile-visual-1779647696507/01-mobile-after-start-topbar.png`
- `/private/tmp/aidm-w5-mobile-visual-1779647696507/04-mobile-state-drawer-replay-built.png`
- `/private/tmp/aidm-w5-mobile-visual-1779647696507/05-mobile-market-drawer.png`
- `/private/tmp/aidm-w5-mobile-visual-1779647696507/06-mobile-reward-toast-visible-before-state.png`
- `/private/tmp/aidm-w5-mobile-visual-1779647696507/07-mobile-state-drawer-after-visible-toast.png`

Confirmed:

- Topbar buttons wrapped cleanly at `390px` without truncation or horizontal overflow.
- `clientWidth=390` and `scrollWidth=390` across checked stages.
- Reward toast was visible before opening State, then changed to `display:none` after State drawer opened; toast/drawer overlap was `0`.
- Replay built successfully in State with `2 chapters / 6 highlights / 3 memories`.
- Market drawer loaded 52 Buy buttons with no obvious first-screen obstruction.
- Only non-blocking browser noise was `/favicon.ico` 404.

## Main-Agent Current-Tree Market Buy DOM Check

Role: main integration agent
Scope: latest Market Buy POST realtime-pause/timeout hardening after the main-agent patch.

Room: `room_382b1b4223474194`

Diagnostic directory:

- `/private/tmp/aidm-main-market-buy-qa-1779647734755`

Confirmed:

- Market drawer loaded 52 Buy buttons, 42 enabled, with wallet at `120 CR`.
- Bought `Scroll of Veiled Sleep` through the UI.
- Status updated to `Bought Scroll of Veiled Sleep for 89 CR. Wallet: 31 CR. Free-time inventory: no turn spent, no round advanced. Open My character to use, equip, or sell.`
- Transcript recorded `Asha Main bought Scroll of Veiled Sleep for 89 crowns.`
- My character inventory showed `Scroll of Veiled Sleep Spell scroll`.
- Market busy state recovered to `aria-busy=false`; no market buttons remained busy.
- Action submit button remained `aria-busy=false`.
- Desktop width stayed stable: `clientWidth=1280`, `scrollWidth=1280`.
- Console error logs were empty.

Note:

- The main-agent screenshot command timed out at the CDP `Page.captureScreenshot` layer, but the UI DOM state and console diagnostics above completed after the Market Buy flow. W5 supplies current-tree Market drawer screenshots, and W2 supplies current-tree scene-switch screenshots.

## Main-Agent No-Local And Image Diagnostics

Role: main integration agent
Scope: no-local-token and visible-image diagnostics after focused fixes.

Room: `room_acf5c8b439b4436d`

Screenshot:

- `/private/tmp/aidm-main-browser-gate-1779645965689/07-no-local-token.png`

Confirmed:

- Opened a room that had no matching local player binding.
- `My character` was disabled.
- `Market` was disabled.
- `Begin scene` was disabled.
- The action input was disabled and the UI showed the create-character setup panel.
- `#playerSummaryDock` showed `No character`.
- Party status had `0` erroneous `YOU` / `你` local-player labels.
- Desktop width stayed stable: `clientWidth=1280`, `scrollWidth=1280`.
- Browser console error logs were empty in the final diagnostic read.
- Visible images loaded. The only image-like non-loaded element found was `#rewardToastImage` with no `src` and `0 x 0` size, so it was not a visible broken image.

Coverage caveat, not a current blocker for the known P3 fixes:

- A single combined desktop/mobile browser run that covers all subpaths end to end remains desirable, although focused passes now cover the previously blocked Replay, Market, Equip, scene-switch, no-local-token, visible-image, and 390px topbar items.
