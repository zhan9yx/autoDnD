# 0012 Localization After Fixes QA

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`
Role: localization QA worker

## Scope

Checked the Chinese replay/status/archetype fixes after the localization polish pass. Product code was not changed in this QA pass; only an additional assertion was added to `tests/bilingualUi.test.js`.

## Result

PASS with one documented residual that is outside this QA write scope.

| Area | Result | Evidence |
| --- | --- | --- |
| Chinese replay share copy | Pass | `tests/replay.test.js` verifies Chinese rooms produce `雨档案馆：1 名玩家推进到第 2 轮。线索已确认` and do not expose `players reached round` or `No report yet`. |
| Empty replay/status fallback | Pass at runtime | `tests/bilingualUi.test.js` now asserts the client uses `t(uiLanguage, "noReport")` for empty replay state and `localizedReplayShareText()` for built replay state. |
| Archetype join leakage | Pass | `tests/localization.test.js` verifies a stale raw `Investigator` submit renders `定位为调查员` in Chinese transcript and does not leak `Investigator`. |
| Archetype select options | Pass | `tests/bilingualUi.test.js` now asserts the client stores archetype ids and rewrites option text/value to the localized label. |
| Player-visible status labels | Pass | `tests/bilingualUi.test.js` verifies Chinese labels for encounter state, threat, clues, speaker names, and replay strings avoid internal English terms. |

## Residual

- `public/index.html` still contains static fallback text `No report yet.` in the initial replay summary markup. Runtime code overwrites it through localized sync, and `public/index.html` is outside this worker's write scope. If zero static English fallback is required, a product-code owner should replace the static text with a localized bootstrapping path.

## Verification

- `node --test tests/localization.test.js tests/replay.test.js tests/bilingualUi.test.js`
  - Result: 17 passed, 0 failed.
- `node --test tests/playerUiAccess.test.js`
  - Result: 2 passed, 0 failed.
