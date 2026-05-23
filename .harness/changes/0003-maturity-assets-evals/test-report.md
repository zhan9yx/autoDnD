# Test Report

## Summary

Status: passed for local-alpha review. This change does not claim public-launch maturity.

## Functional Bug Discovery

- `BUG-0001`: five-player simulation could crash when the active player was already defeated. Fixed in `src/core/gameEngine.js` and covered by `tests/gameEngine.test.js`.
- `BUG-0002`: ChatGPT generated raster assets existed on disk but were not visible in the product asset library. Fixed by loading `/assets/generated/manifest.json`, serving PNG content types, and prioritizing raster previews.

## Commands

- `npm run assets:generate`: passed; regenerated checked-in deterministic SVG manifest as schema version 2.
- `npm run test`: passed, 49/49 tests.
- `npm run lint`: passed, 40 JavaScript files checked.
- `npm run eval:memory`: passed against `campaign-history-16h.json`; 16 blocks, 2,112 events, 256 queries, `recallAt5 = 1`, `MRR = 1`, thresholds `0.92 / 0.85`.
- `npm run simulate:campaign`: passed; 5 players, round 6, 109 transcript entries, 26 memories, 20 combat log entries, 8 replay highlights.
- `npm run smoke`: passed after localhost sandbox escalation; `assetCount = 82`, `generatedAssetCount = 52`, encounter/director/replay checks passed.
- `npm run harness:check`: passed; reran lint, 49/49 tests, 16-hour eval, five-player campaign simulation, and Harness report completeness checks.

## Browser Visual QA

- Opened `http://localhost:4173/?room=room_ca696939679a4413` in the Codex in-app browser.
- Verified no console errors.
- Verified asset library reports `134 assets / 2 sheets`.
- Verified generated raster scene cards are visible in the Scenes preview and show `chatgpt-image-generation` provenance.
- Verified Guide drawer opens, Quick start is active, Escape/close controls are available, and viewport has no horizontal overflow at the tested 524px browser width.
- Screenshots saved:
  - `/private/tmp/aidm-v2-guide.png`
  - `/private/tmp/aidm-v2-generated-scenes.png`
  - `/private/tmp/aidm-v2-table-full.png`

## Generated Asset Evidence

- ChatGPT image generation output sheet: `assets/generated/sheets/aidm-marketplace-sheet-001.png`.
- ChatGPT image generation scene sheet: `assets/generated/sheets/aidm-scenes-sheet-001.png`.
- Sliced raster registrations: 52.
- Transparent icon PNG/SVG wrappers: `assets/generated/icons/`.
- Scene card PNG/SVG wrappers: `assets/generated/scenes/`.
- Provenance includes prompt id, prompt text, source sheet path, source SHA-256, and generation timestamp.
