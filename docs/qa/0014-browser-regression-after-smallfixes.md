# 0014 Browser Regression After Small Fixes

Date: 2026-05-25 10:51 CST
Worker: 0014 parallel worker V
Scope: browser regression recheck for scene meta chips and disabled Market purchase copy after Banach's small fixes.
Service: `http://127.0.0.1:4173`
Room: `room_49dfdd6dff734626`

## Result

Status: passed for the requested browser-visible regression scope.

No business code was changed. No commit was created.

## Screenshots

- `/private/tmp/aidm-0014-worker-v/01-room-scene.png`
- `/private/tmp/aidm-0014-worker-v/02-market-drawer.png`

## Checks

### Scene Meta Chips

Result: pass.

Observed visible chips in the stage meta cluster:

- `天气 潮湿`
- `时段 白天`
- `危势 高`
- `季节 秋季`
- `地点 雨巷与湿石街区`
- `变体 雨巷与湿石街区 / 潮湿`

Visible UI did not show raw `market-city` as the market or scene main label. The visible location and variant labels were localized/human-readable as `雨巷与湿石街区`. The DOM `title` for the variant chip still contains diagnostic preset tokens including `preset:market-city`, but that token is not the visible main label in the screenshot.

Evidence screenshot: `/private/tmp/aidm-0014-worker-v/01-room-scene.png`

### Market Disabled Copy And Aria

Result: pass for current room data.

Opened Settings -> Market in the browser. Market loaded successfully:

- Wallet: `67 克朗`
- Total cards: `65`
- Enabled purchase buttons: `19`
- Disabled purchase buttons: `46`
- Disabled reason groups observed: `资金不足: 46`

Disabled samples no longer exposed `可购买` in visible status, button aria, button title, or card aria. Examples captured from the live DOM:

| Item | Visible Status | Button Aria | Card Aria | Purchase State |
| --- | --- | --- | --- | --- |
| 治疗真言法卷 | `状态：资金不足。` | `无法购买治疗真言法卷：资金不足` | `治疗真言法卷。购买价格: 138 克朗。资金不足。` | `insufficient-funds` |
| 睡眠帷幕法卷 | `状态：资金不足。` | `无法购买睡眠帷幕法卷：资金不足` | `睡眠帷幕法卷。购买价格: 89 克朗。资金不足。` | `insufficient-funds` |
| 火焰箭法卷 | `状态：资金不足。` | `无法购买火焰箭法卷：资金不足` | `火焰箭法卷。购买价格: 125 克朗。资金不足。` | `insufficient-funds` |

Automated browser DOM scan over disabled cards found `blockedAvailableLeaks=[]`.

Evidence screenshot: `/private/tmp/aidm-0014-worker-v/02-market-drawer.png`

## Not Covered

- Current live room only exposed `资金不足` disabled Market states. This pass did not mutate the shared room to force `售罄`, `已拥有`, or `锁定` examples.
- No automated test suite was run; this was a targeted in-app browser regression pass.
