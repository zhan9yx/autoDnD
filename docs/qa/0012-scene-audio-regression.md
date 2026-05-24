# 0012 Scene / Audio Regression

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`

Status note: this file records the earlier red scene-selection state. Later 0012 Harness records show the production-depth rain archive street blocker fixed and `npm run eval:production-depth` green at 10/10 with `passed=true`.

## Scope

- Added focused regression coverage for `rain-archive-street` so an exterior rainy archive street must select `scene.rain.archive.street`, not the indoor sheet032 archive scene.
- Rechecked sheet032 reachability so `scene.ambient.moonlit-rain-archive.v01` is still selected for an explicit indoor/archive reading hall.
- Added audio regression coverage so an exterior archive street keeps rain/street audio and does not pick the indoor archive bed, while an explicit indoor/archive scene keeps archive material.

## Commands Run

### `node --test tests/assetSelection.test.js tests/soundscape.test.js`

Result: failed, 25 passed / 1 failed.

Failure:

- `tests/assetSelection.test.js`: `rainy archive street context selects the exterior street instead of the indoor sheet032 archive`
  - Expected: `scene.rain.archive.street`
  - Actual: `scene.ambient.moonlit-rain-archive.v01`

Audio regression status:

- `tests/soundscape.test.js`: `rainy archive street audio stays exterior while explicit indoor archive keeps archive material` passed.
- The exterior street case selected exterior/rain audio, included `rain.heavy`, and did not include archive-room page/room layers.
- The explicit indoor/archive case kept archive material and avoided market/city crowd layers.

### `npm run eval:production-depth`

Result: failed.

Summary:

- `checkCount=10`
- `passedCount=9`
- `failedCount=1`
- `passRate=0.9`
- `passed=false`

Failed scenario:

- `scenario:rain-archive-street`
  - Expected scene semantic key: `scene.rain.archive.street`
  - Actual scene semantic key: `scene.ambient.moonlit-rain-archive.v01`
  - Missing required scene term: `street`
  - Soundscape check passed with selected soundscape `market-city`, profile weather `wet/heavy-rain`, and layers including `rain.heavy`.

## Current Status

Scene regression is still red in this workspace: sheet032 indoor archive still outranks the dedicated exterior `rain-archive-street` asset in the live `buildPresentation(..., chooseSoundscape(...))` path.

Audio regression is green for the focused coverage added here.
