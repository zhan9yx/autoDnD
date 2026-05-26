# Test Report

Status: focused frontend density pass complete. Live desktop/mobile browser screenshot evidence captured on 2026-05-25.

## Scope

Worker A changed the in-play frontend density layer:

- Party rail cards now include compact scene/status context.
- Table-log rows now carry timeline group markers and expandable detail disclosure.
- Focused static/no-scroll/player tests now cover the new density affordances.

## Commands

```bash
node --check public/app.js
node --check public/i18n.js
node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js
npm run harness:status
GIT_INDEX_FILE=/private/tmp/aidm-0017-ui-density-git-index-2 GIT_OBJECT_DIRECTORY=/private/tmp/aidm-0017-ui-density-git-objects GIT_ALTERNATE_OBJECT_DIRECTORIES=/Users/yixuan.zhang/Documents/AIDM/.git/objects git diff --check -- .harness/changes/0017-ui-density-worker-a/test-report.md docs/qa/0017-ui-density-worker-a.md
```

## Results

- `node --check public/app.js`: passed.
- `node --check public/i18n.js`: passed.
- `node --test tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/bilingualUi.test.js tests/playerUiAccess.test.js`: passed, 24 tests passed, 0 failed.
- `npm run harness:status`: passed and reported `0017-ui-density-worker-a` at 14/14 tasks complete.
- `GIT_INDEX_FILE=/private/tmp/aidm-0017-ui-density-git-index-2 GIT_OBJECT_DIRECTORY=/private/tmp/aidm-0017-ui-density-git-objects GIT_ALTERNATE_OBJECT_DIRECTORIES=/Users/yixuan.zhang/Documents/AIDM/.git/objects git diff --check -- .harness/changes/0017-ui-density-worker-a/test-report.md docs/qa/0017-ui-density-worker-a.md`: passed, no whitespace errors in this worker's touched untracked files.

## Browser / Screenshot Evidence

Local server:

- `PORT=4217 AIDM_DATA_FILE=/private/tmp/aidm-0017-ui-density-worker-a-store.json npm run dev`
- Seeded room `room_1d84af28acd943df` with 5 API players, then joined one browser-local Evidence player from the UI to exercise the crowded 6-person party rail.

Screenshots:

- `/private/tmp/aidm-0017-ui-density-desktop-collapsed.png` - 1280x900, state strip collapsed, summary log.
- `/private/tmp/aidm-0017-ui-density-desktop-expanded.png` - 1280x900, state strip expanded.
- `/private/tmp/aidm-0017-ui-density-desktop-dense-detail.png` - 1280x900, dense log with one message detail expanded.
- `/private/tmp/aidm-0017-ui-density-mobile-collapsed.png` - 390x844, state strip collapsed, summary log.
- `/private/tmp/aidm-0017-ui-density-mobile-expanded.png` - 390x844, state strip expanded.
- `/private/tmp/aidm-0017-ui-density-mobile-expanded-dense-detail.png` - 390x844, dense log with one message detail expanded.

Assertions from live browser metrics and visual screenshot review:

- Desktop and mobile report no horizontal overflow: document/body scroll width equals viewport width at 1280 and 390.
- Top controls, table state toggle, log density toggle, full log, party, and state buttons were unobscured at their center points.
- Party rail remained stable across state strip expansion and log detail expansion: 48px high on desktop, 40px high on mobile, with 6 crowded-party cards.
- Summary log defaults kept details collapsed: desktop 4 details / 0 open, mobile 3 details / 0 open.
- Dense/detail checks opened exactly one detail row: desktop 4 details / 1 open, mobile 2 details / 1 open.
- Scene visual overlay was present and visible in both viewports, with heavy rain, gale wind, close thunder, visual-meta chips, canvas, and generated scene backdrop visible.

Conclusion: this closes the live screenshot evidence gap for Hubble's reviewed 0017 UI density surface. No product-code fix was required during this evidence pass.
