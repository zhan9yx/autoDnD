# 0014 Audio / Scene Browser QA

Date: 2026-05-25 CST
Worker: 0014 parallel worker M
URL: `http://127.0.0.1:4173/?room=room_7fc5ed607f774c15`

## Scope

Manual Browser QA for the current room's scene visuals, scene/weather metadata, audio settings drawer, and ambience toggle feedback. No product code was changed.

## Screenshots

- `/private/tmp/aidm-0014-audio-scene-browser/01-current-room-scene.png` - current scene, rainy backdrop, scene meta chips, compact table/log layout.
- `/private/tmp/aidm-0014-audio-scene-browser/02-settings-audio-controls.png` - settings drawer with soundscape label, reason, layer chips, ambience controls.
- `/private/tmp/aidm-0014-audio-scene-browser/03-ambience-on.png` - ambience enabled state.
- `/private/tmp/aidm-0014-audio-scene-browser/04-ambience-off.png` - ambience disabled state.
- `/private/tmp/aidm-0014-audio-scene-browser/05-expanded-state-audio-strip.png` - expanded table state strip with compact audio sync card.
- `/private/tmp/aidm-0014-audio-scene-browser/06-state-drawer-scene-media.png` - state drawer scene/media alignment.

JSON sidecars with DOM state were saved next to the screenshots for the same numbered steps.

## Passed

- The existing 4173 service was reachable. The room loaded as `AIDM 跑团桌` with no browser console warnings or errors reported during this pass.
- The main stage showed a rainy street backdrop from `assets/generated/scenes/aidm-macro-scene-003-01.png`, with visible rain streaks and a dark wet-street treatment.
- The visible scene text aligned with the current scene: `封存档案馆外被雨水洗亮的街道`, objective `在黎明前查明是谁偷走了封印账本`.
- Scene meta surfaced weather and motion cues in the stage overlay: `天气`, `潮湿雨势`, `潮湿动态`, `人群变体`, `Market City / 潮湿`.
- DOM scene state also carried deeper visual axes: `data-scene-weather=wet`, `data-scene-rain=wet`, `data-scene-wind=none`, `data-scene-season=unseasoned`, and `data-scene-variant-key` containing `time:dawn` and `pressure:rising`.
- Settings audio controls stayed in the right-side drawer, not the main play surface. The drawer occupied about 460 px of a 1280 px viewport and could be closed.
- The expanded table state strip used a small audio card only: `音频 / 关 · 市场与城市街道`, so synchronized audio status did not take over the primary play area.
- Ambience controls were visible and enabled: soundscape label `市场与城市街道`, reason `地点作为主氛围，并叠加当前天气。`, layer chips for voice/city/weather/water, and sliders for master/music/environment.
- Turning ambience on changed the button to `氛围开`, `aria-pressed=true`, `data-audio-enabled=true`, and the status text to `开 · 市场与城市街道`.
- Turning ambience off restored `氛围关`, `aria-pressed=false`, `data-audio-enabled=false`, and `关 · 市场与城市街道`.
- State drawer scene/media agreed with the stage: scene `封存档案馆外被雨水洗亮的街道`; media `市场与城市街道`; reason `地点作为主氛围，并叠加当前天气。`.

## Issues / Gaps

- Visible scene meta only showed weather/motion/location flavor. `time:dawn` and `pressure:rising` were present in DOM dataset and text context, but not exposed as explicit visible chips.
- Season could not be visually verified in this room because the current state was `data-scene-season=unseasoned`; no seasonal chip or seasonal visual variant appeared.
- The selected soundscape was `market-city` for a rainy archive street. The reason says location plus weather, and layers include weather/water, but the label can read like a market/city mismatch against the specific archive-street scene.
- Actual audio naturalness was not verifiable through Browser automation because the tool cannot listen to local speaker output. This pass verified UI state, Web Audio control feedback, and absence of console errors only.

## Blockers

- None for browser access or screenshot capture.
