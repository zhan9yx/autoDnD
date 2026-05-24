# 0012 Localization Polish

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`
Role: player copy/localization work sub-agent

## Scope

Reviewed player-visible localization issues from the player-flow QA pass, limited to focused core localization/replay fixes, `public/i18n.js`, `public/app.js`, and focused tests. No asset or manifest files were edited.

## Fixed

| Area | Status | Notes |
| --- | --- | --- |
| Chinese character creation leaks `Investigator` | Fixed | `public/app.js` now localizes species/class select labels and rewrites archetype option labels/values from the active UI language. `src/core/gameEngine.js` also localizes raw archetype aliases before writing the Chinese join transcript, so stale clients that submit `Investigator` render `调查员`. `public/index.html` still contains English fallback text because it was outside this write scope. |
| Empty-name join feedback | Fixed | Blank player-name submit is blocked client-side with localized feedback and focus restored to the name input. Character name may still default from player name. |
| Blank action/chat feedback | Fixed | Empty action/chat submissions now show localized client-side messages before hitting the API. Known English backend validation messages are also mapped back to the current UI language. |
| Replay fallback and summary copy | Fixed | Empty replay state is synchronized through `noReport`; opening a new room clears stale replay state; `src/core/replay.js` now builds Chinese `shareText` for Chinese rooms instead of `players reached round`. |
| Transcript timestamp locale | Fixed | Transcript timestamps now use `Intl.DateTimeFormat` with `zh-CN` or `en-US` based on the normalized table UI language. |
| Replay high-light lead memory | Fixed | Chinese action memories now use localized result text before replay selects them as highlights, avoiding `tried to` / `Result:` in Chinese replay share copy. |

## Deferred

- Raw player-entered English inside Chinese narration remains player-provided content. The UI continues to render transcript text as stored for auditability.
- Replay chapter titles and Markdown export remain English structure; this pass localized the empty/player summary and replay share line.
- Static fallback strings in `public/index.html` are still English before the app module runs because `public/index.html` was outside this write scope.

## Verification

- `node --test tests/localization.test.js tests/replay.test.js tests/bilingualUi.test.js`
  - Result: 16 passed, 0 failed.
- `node --test tests/playerUiAccess.test.js`
  - Result: 2 passed, 0 failed.
- Browser QA on temporary `http://127.0.0.1:4174/`
  - Chinese join transcript: `定位为调查员`; no `Investigator`.
  - Empty replay: `暂无战报。`; no `No report yet.`
  - Built replay after one action: `1 名玩家推进到第 2 轮`; no `players reached round`, `tried to`, or `Result:`.
