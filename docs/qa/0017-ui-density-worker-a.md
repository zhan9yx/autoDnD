# 0017 UI Density Worker A QA

Date: 2026-05-25

## Scope

Focused frontend product-experience pass for the situation page and game table.

## Evidence Targets

- Compact table-state strip remains hidden by default and expands by button/Escape behavior already covered by static tests.
- Party cards retain fixed height while adding current scene/status text for active/local/player-state scanning.
- Transcript rows expose timeline grouping and expandable details without forcing every row into a tall card.
- Scene visual chips and overlays continue to reuse existing assets only.
- Desktop/mobile overflow risk remains covered by focused no-scroll assertions.

## Browser Evidence

Live browser evidence was captured on 2026-05-25 with:

- Server: `PORT=4217 AIDM_DATA_FILE=/private/tmp/aidm-0017-ui-density-worker-a-store.json npm run dev`
- Room: `room_1d84af28acd943df`
- Viewports: desktop `1280x900`, mobile `390x844`
- Party state: 6 players after one browser-local UI join, exercising crowded party rail behavior.

Screenshot paths:

- `/private/tmp/aidm-0017-ui-density-desktop-collapsed.png` - desktop collapsed state strip, summary log, party rail, scene overlay.
- `/private/tmp/aidm-0017-ui-density-desktop-expanded.png` - desktop expanded table state strip.
- `/private/tmp/aidm-0017-ui-density-desktop-dense-detail.png` - desktop dense log with one detail row expanded.
- `/private/tmp/aidm-0017-ui-density-mobile-collapsed.png` - mobile collapsed state strip, summary log, party rail, scene overlay.
- `/private/tmp/aidm-0017-ui-density-mobile-expanded.png` - mobile expanded table state strip.
- `/private/tmp/aidm-0017-ui-density-mobile-expanded-dense-detail.png` - mobile dense log with one detail row expanded.

Live browser assertions:

- No obvious horizontal overflow in either viewport; measured document/body scroll width equals viewport width at `1280` and `390`.
- Key controls were not visually blocked: table state toggle, party/state/full-log controls, log density toggle, and full-log button all resolved as topmost at their center points.
- Party rail stayed height-stable across collapsed/expanded state strip and dense/detail log states: `48px` desktop, `40px` mobile.
- Summary log did not inflate every row: desktop `4` detail blocks with `0` open; mobile `3` detail blocks with `0` open.
- Expanded detail state stayed readable: desktop dense mode opened `1/4` detail blocks; mobile dense mode opened `1/2`.
- Scene image overlay remained visible in both viewports: generated rainy city scene, canvas effects, visual chips, heavy-rain overlay, gale wind, and close-thunder tokens were present.

Finding: no blocking UI bug was found during this evidence pass. Hubble's live screenshot evidence gap is closed for the 0017 UI density worker scope.

Command-level evidence:

- `node --check public/app.js`: passed.
- `node --check public/i18n.js`: passed.
- `node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js`: passed, 24 tests passed, 0 failed.
- `npm run harness:status`: passed and reported `0017-ui-density-worker-a` at 14/14 tasks complete.
- `GIT_INDEX_FILE=/private/tmp/aidm-0017-ui-density-git-index-2 GIT_OBJECT_DIRECTORY=/private/tmp/aidm-0017-ui-density-git-objects GIT_ALTERNATE_OBJECT_DIRECTORIES=/Users/yixuan.zhang/Documents/AIDM/.git/objects git diff --check -- .harness/changes/0017-ui-density-worker-a/test-report.md docs/qa/0017-ui-density-worker-a.md`: passed.
