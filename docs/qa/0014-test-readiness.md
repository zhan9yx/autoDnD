# 0014 Test Readiness

Date: 2026-05-25
Worker: 0014 parallel worker I
Scope: automated gate readiness only. This pass does not modify product runtime, public UI, server, core rules, soundscape, item catalog, or asset-selection implementation files.

## Gate Status

| Gate | Result | Notes |
| --- | --- | --- |
| `node --test tests/requirements.test.js tests/maturity.test.js` | PASS | 14/14 passed. Documentation boundary checks are green. |
| `node --test tests/rules.test.js tests/stateSummary.test.js tests/soundscape.test.js tests/itemCatalog.test.js` | PASS | 58/58 passed. Core rules, state summary, soundscape, and item catalog slice is green. |
| `npm run lint` | PASS | Harness lint passed with 79 JavaScript files checked. |
| `npm run test` | PASS | Final rerun passed 273/273 after the bilingual UI test expectation was synced and the concurrent asset-selection failure cleared. |
| `node --test tests/bilingualUi.test.js` | PASS | 8/8 passed after syncing expected Chinese turn cue copy with the current split `turnCue.*` contract. |
| `node --test tests/assetSelection.test.js` | PASS | Final focused rerun passed 7/7. An earlier focused run failed on the lantern tavern scene reachability assertion. |

## Intermediate Failures Observed

The first full `npm run test` pass failed 2 tests:

- `tests/assetSelection.test.js:285` failed because `灯火旅店` did not include `scene.ambient.lantern-tavern-hall.v01` in the selected/relevant scene keys.
- `tests/bilingualUi.test.js:154` failed because expected Chinese turn cue text still used the old long copy while the current `public/i18n.js` contract uses short cue labels plus separate `turnCue.next.*` guidance.

The bilingual UI failure was safe to fix in test expectation only. The asset-selection failure was not changed by this worker and appears to have been cleared by concurrent asset/scene-selection work before the final full rerun.

## Cleared Asset-Selection Failure

Earlier failing test:

`tests/assetSelection.test.js:285`

Failure:

`灯火旅店 should include scene.ambient.lantern-tavern-hall.v01; got scene.production.wayside-inn-bunkroom.v01, scene.production.wayside-inn-bunkroom.v01, scene.production.storm-harbor-quay.v01`

Affected files:

- `tests/assetSelection.test.js`
- `src/core/assetSelection.js`
- `assets/generated/manifest.json`

Most likely owner:

Asset/scene-selection worker. The failure was not a generic test harness problem: `assets/generated/manifest.json` contains `scene.ambient.lantern-tavern-hall.v01`, but the earlier scene ranking returned wayside inn and storm harbor entries for the lantern tavern case. Final focused and full reruns now pass, so treat this as a cleared watch item unless it recurs on the settled tree.

## Rerun Order

1. `node --test tests/assetSelection.test.js`
2. `node --test tests/bilingualUi.test.js`
3. `node --test tests/requirements.test.js tests/maturity.test.js`
4. `node --test tests/rules.test.js tests/stateSummary.test.js tests/soundscape.test.js tests/itemCatalog.test.js`
5. `npm run lint`
6. `npm run test`

Current automated readiness is green on this worker's latest reruns. Because the workspace is still being edited by other workers, rerun the same order once Sagan/Lagrange/Ohm are done before staging or merge decisions.
