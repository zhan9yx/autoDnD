# Visual UI Closure Fix

Date: 2026-05-26 CST
Worker: AIDM visual UI closure fix worker
Scope: fix and re-verify full log drawer plus character/backpack/leveling drawer rendering.

## Root Cause

The visual blocker was a client-side render exception, not missing room data.

`ruleAssetMarkup()` rendered progression fallback art with `initialsForName(...)`, but the app only defines `initials(...)`. When a leveled character had learned rule entries without direct art, `renderCharacterProgress()` threw a `ReferenceError`. Because `render()` calls `renderCharacterDrawer()` before `renderTranscript()`, the exception stopped the rest of the render pass:

- full log drawer stayed at `0 条记录` even though the room had transcript entries.
- character drawer rendered only the header/vitals and never reached equipment, spells, inventory, or leveling details.

Temporary CDP diagnosis before the fix captured:

```text
ReferenceError: initialsForName is not defined
    at ruleAssetMarkup
    at ruleEntryChipMarkup
    at learnedRuleSectionMarkup
    at levelingSummaryMarkup
    at renderCharacterProgress
    at renderCharacterDrawer
    at render
```

## Fix

- `public/app.js`: changed progression fallback rendering from `initialsForName(...)` to the existing `initials(...)` helper.
- `tests/levelingUi.test.js`: added a regression assertion that `ruleAssetMarkup()` uses `initials(...)` and does not reference `initialsForName`.
- `tests/levelingUi.test.js`: added a narrow render-path contract that character drawer rendering still reaches progress, equipment, spells, inventory, and full transcript rendering.

## Verification

Commands:

```bash
node --check public/app.js
node --test tests/levelingUi.test.js tests/browserAutomation.test.js
npm run smoke http://127.0.0.1:4246
```

Results:

- `node --check public/app.js`: passed.
- `node --test tests/levelingUi.test.js tests/browserAutomation.test.js`: passed, 6 tests.
- `npm run smoke http://127.0.0.1:4246`: passed after rerun outside the sandbox. First sandboxed run hit local `ECONNRESET`; health stayed green and the same smoke command passed with localhost access unrestricted.

Smoke key output:

```json
{
  "ok": true,
  "transcript": 15,
  "levelUp": {
    "level": 2,
    "learnedSpells": ["ember-lance"],
    "progressionActions": ["recover-mana"]
  },
  "replayHighlights": 4
}
```

## Fresh Visual Evidence

Server:

```bash
PORT=4246 AIDM_DATA_FILE=/private/tmp/aidm-ac-visual-closure/store.json npm run dev
```

Screenshot runner:

```bash
AIDM_BROWSER_BASE_URL=http://127.0.0.1:4246 \
AIDM_CDP_URL=http://127.0.0.1:9347/json/version \
AIDM_EVIDENCE_DIR=/private/tmp/aidm-visual-ui-closure-fix \
node /private/tmp/aidm-screenshot-cdp.mjs
```

Machine report: `/private/tmp/aidm-visual-ui-closure-fix/visual-ui-closure-fix-report.json`

Report metrics:

```json
{
  "ok": true,
  "transcriptCount": 11,
  "logCount": "11 条日志",
  "fullRows": 11,
  "inventoryItems": 5,
  "equipment": "装备槽 武器 橡木杖 护甲 旅行长袍 副手 空 工具 空",
  "spells": "法术 火矢沉眠咒奥术护盾琉璃回声风暴弧光余烬长矛",
  "leveling": "升级收益 ... 战技 回收法力 ...",
  "browserLogs": []
}
```

Screenshots:

| Area | Screenshot |
| --- | --- |
| Desktop full log drawer | `/private/tmp/aidm-visual-ui-closure-fix/screenshots/desktop-log-drawer.png` |
| Desktop character/leveling drawer top | `/private/tmp/aidm-visual-ui-closure-fix/screenshots/desktop-character-leveling-top.png` |
| Desktop backpack detail drawer | `/private/tmp/aidm-visual-ui-closure-fix/screenshots/desktop-backpack-detail-drawer.png` |
| Mobile full log drawer, 390x844 | `/private/tmp/aidm-visual-ui-closure-fix/screenshots/mobile-log-drawer.png` |
| Mobile character/leveling drawer top, 390x844 | `/private/tmp/aidm-visual-ui-closure-fix/screenshots/mobile-character-leveling-top.png` |
| Mobile backpack detail drawer, 390x844 | `/private/tmp/aidm-visual-ui-closure-fix/screenshots/mobile-backpack-detail-drawer.png` |

## Closure Decision

The two AC visual blockers are closed:

- Full log drawer now renders existing transcript rows and count.
- Character/backpack/leveling drawer now renders inventory, equipment, spells, and level gains.

Remaining visual blocker: none observed in this focused pass.
