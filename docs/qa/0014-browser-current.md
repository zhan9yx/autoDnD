# 0014 Browser Current QA

Date: 2026-05-25 10:40 CST
Worker: 0014 parallel worker H
Scope: in-app browser visual and basic flow QA against the currently running local service.
Primary URL: `http://127.0.0.1:4173/?room=room_7fc5ed607f774c15`

## Result

Status: completed with no P0/P1 blocker observed in the current desktop viewport.

Service state:

- Primary room loaded successfully in the in-app browser.
- Console warnings/errors from room, gateway, and access-entry tabs: none captured.
- Existing room was in guest/player state with two visible players: `雨档侦探` and `alc`.
- A separate gateway tab registered a local account and created an open room through the visible UI.

## Screenshots

- `/private/tmp/aidm-0014-browser-qa/001-room-initial.png`
- `/private/tmp/aidm-0014-browser-qa/002-state-strip-expanded.png`
- `/private/tmp/aidm-0014-browser-qa/003-state-drawer.png`
- `/private/tmp/aidm-0014-browser-qa/003-party-drawer.png`
- `/private/tmp/aidm-0014-browser-qa/003-character-drawer.png`
- `/private/tmp/aidm-0014-browser-qa/003-log-drawer.png`
- `/private/tmp/aidm-0014-browser-qa/003-settings-drawer.png`
- `/private/tmp/aidm-0014-browser-qa/004-market-drawer.png`
- `/private/tmp/aidm-0014-browser-qa/005-after-action-submit.png`
- `/private/tmp/aidm-0014-browser-qa/006-log-density-toggle.png`
- `/private/tmp/aidm-0014-browser-qa/007-settings-audio-scrolled.png`
- `/private/tmp/aidm-0014-browser-qa/008-gateway-initial.png`
- `/private/tmp/aidm-0014-browser-qa/009-gateway-after-register.png`
- `/private/tmp/aidm-0014-browser-qa/010-created-room.png`
- `/private/tmp/aidm-0014-browser-qa/011-access-password-entry.png`
- `/private/tmp/aidm-0014-browser-qa/012-access-approval-entry.png`

## Passed Checks

- Current room entry: `room_7fc5ed607f774c15` opened and rendered the active table, scene, party rail, compact state strip, log, and action composer.
- Situation/status density: collapsed state strip stayed one line; expanded strip exposed turn, round, encounter, sync, player, and audio/scene summary without incoherent overlap.
- Party rail: two-player state was readable; active/local player labels were distinct. A 3+ player state was not available in this current room without creating extra player contexts.
- Current action guidance: before action, the log panel clearly said it was `雨档侦探`'s turn and instructed the user to choose an action. After action, it changed to `等待 alc 行动` with a non-turn guidance line.
- Action submit: submitted `沿着湿脚印追到雨棚集市，询问夜间守摊人是否见过封印账本。`; the UI recorded player, dice, narrator, reward entries and advanced the active turn to `alc`.
- Scene change feel: after the action, stage image, stage caption, latest-change card, objective text, dice result, and log content changed from the archive street setup to a market/street pursuit state.
- Drawers: Status, Party, My Character/backpack, Full Log, Settings, and Market all opened from visible controls and closed normally.
- Log density: density toggle changed from `摘要` to `紧凑`, and the log remained readable with a denser transcript.
- Audio settings: Settings exposed `自适应氛围`, `氛围关`, `停止音频`, layer chips, volume sliders, voice toggle, voice selector, rate, and pitch controls. State strip expansion also summarized audio as `关 · 市场与城市街道`.
- Auth/gateway: gateway showed guest login/register controls; registering `QA0014H-...` logged in locally and exposed logout plus account pill.
- Create/open room: visible gateway `创建房间` created an open room and navigated to `room_d11b5bd272e143dc`.
- Password/approval entry: `访问方式` exposed `开放`, `密码`, and `主持审批`; password mode showed `邀请密码`, and approval mode showed the pending-approval explanation.

## Issues

- P2: Market affordability status is contradictory for unaffordable items. Repro: open Settings, click Market, inspect wallet `120 克朗` and first item `治疗真言法卷` priced `138 克朗`. The purchase button is disabled, but the card still shows `可购买`, and the button aria label captured as `购买治疗真言法卷：可购买`.
- P2: Reward toast can cover the lower-right log/action composer area after a successful action. Repro: submit the action above and observe the reward toast in `/private/tmp/aidm-0014-browser-qa/005-after-action-submit.png`. It is dismissible and did not block the verified flow, but it visually competes with current action controls.

## Not Covered / Blockers

- No P0/P1 blocker observed in this current pass.
- Full protected-room wrong-password/correct-password/host-approve loop was not re-run; this pass only verified the password and approval creation entry points from the gateway.
- Mobile-width QA was not run in this pass.
- Audio was inspected visually; playback was not enabled or audibly verified.
