# 0012 Browser After Fixes QA

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`
Role: browser verification worker
Scope: player-visible browser verification after main-agent fixes.

## Summary

Result: PASS.

The player interface still does not expose a raw asset gallery, asset-management surface, internal catalog, admin panel, or director/GM controls. Settings, dice, market, backpack, and scene switching were usable through the local browser flow.

This worker did not edit product code or tests. The only intended write from this pass is this QA note.

## Environment

- Local service: `http://127.0.0.1:4183`
- Health check: `ok=true`, version `0.11.0-production-depth`, store `json`, provider `local`
- Browser URL: `http://127.0.0.1:4183/?room=room_e2012fd64b6f4afb`
- Room title: `0012 Browser After Fixes QA`
- Browser console warn/error logs: `[]`

## Browser Walkthrough Evidence

- Created a Chinese room through the visible landing UI.
- Joined as `QA 玩家` / `雨档案巡查员`, species `精灵`, class `法师`.
- Started the scene from the lobby. After start, character creation was hidden and `开始场景` became disabled.
- Opened settings drawer. It contained table/player controls only:
  - `languageSelect`
  - `ambienceToggle`
  - `ambienceMaster`
  - `ambienceMusic`
  - `ambienceEnvironment`
  - `voiceToggle`
  - `readLatestButton`
  - `stopVoiceButton`
  - `voiceSelect`
  - `voiceRate`
  - `voicePitch`
- Settings drawer did not contain `#joinForm`, `#speciesSelect`, `#classSelect`, or `#starterSpellCards`.
- Opened market from settings and bought `睡眠帷幕法卷`.
  - Market offer count at open: `39`
  - Wallet changed from `120 克朗` to `31 克朗`
  - Transcript recorded the purchase.
- Opened `我的角色` drawer and verified backpack.
  - Backpack listed `旅行提灯`, `现场札记`, `橡木杖`, `旅行长袍`, and purchased `睡眠帷幕法卷`.
  - Purchased item detail rendered category/value/trade/use state and enabled `使用` and `出售`.
- Submitted action: `沿市场路线前进，寻找暴风提灯能照出的银账本线索`.
  - Dice panel landed: total `22`, expression `1d20+7`, DC `12`, success margin `超过 DC 10`.
- Submitted route action with advantage: `沿城外古林路线离开雨档案馆，切换到森林场景调查银账本`.
  - Dice panel landed: total `26`, expression `1d20+7`, rolls `19, 18`, DC `12`, success margin `超过 DC 14`.
  - Scene switched from `封存档案馆外被雨水洗亮的街道` to `雾气缠绕的森林小径`.
  - Objective switched to `在湿脚印消失到树根下之前继续追踪。`
- Opened state drawer after route attempts.
  - State drawer showed objective, clue/threat/deadline clocks, quest progress, latest change, scene/media, available routes, encounter, rewards, and replay area.

## Clean Surface Checks

Runtime visible-text scans across the exercised player surfaces found no visible:

- `Asset Library`
- `资产库`
- `asset-grid`
- `raw asset`
- `catalog-internal`
- `internal catalog`
- `后台`
- `管理后台`
- `Director`
- `导演推进`
- `GM controls`
- `gm-drawer`

Player drawer buttons observed at runtime were limited to player-facing surfaces:

- `我的角色`
- `队伍`
- `状态`
- `完整日志`
- `设置`
- `市场`

## Coverage Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| No raw asset gallery | Pass | Runtime forbidden-term scan returned `[]`; no asset gallery/search/grid surfaced while exercising room, settings, market, character, state, and action flow. |
| No internal catalog | Pass | Runtime scan returned no `catalog-internal` or `internal catalog`; visible drawers were player-facing only. |
| Settings drawer usable | Pass | Settings opened and exposed language, ambience, volume, voice, read-latest, and stop controls. |
| Dice usable | Pass | Two player actions produced landed dice panels: `22` success and `26` success with visible formulas, rolls, DCs, and margins. |
| Market usable | Pass | Market opened with 39 offers; buying `睡眠帷幕法卷` succeeded and wallet updated to `31 克朗`. |
| Backpack usable | Pass | Character drawer opened, inventory rendered, purchased item detail rendered, and `使用`/`出售` actions were available. |
| Scene switching usable | Pass | Successful route action changed location to `雾气缠绕的森林小径` and updated the objective. |

## Notes

- No product code, tests, generated assets, or existing QA docs were modified by this worker.
- The dev server was started on port `4183` to avoid colliding with other active workers.
