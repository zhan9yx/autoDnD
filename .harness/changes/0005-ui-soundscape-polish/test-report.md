# Test Report

## Automated Verification

- `npm run lint`: passed, 50 JavaScript files checked.
- `npm run test`: passed, 66/66 tests.
- `npm run harness:check`: passed after structure checks, lint, unit tests, 16-hour memory evaluation, campaign simulation, and report completeness checks.
- `npm run smoke`: passed, with 82 deterministic assets, 68 generated raster assets, 3 TTS providers, 10 soundscape presets, Chinese room creation, rain soundscape selection, combat log, memory writes, and replay highlights.
- `tests/soundscape.test.js`: covers rain, forest, pond, waterfall, campfire, insects, market/city, combat tension, mystery, calm night, determinism, intensity bounds, and combat override behavior.
- `tests/generatedAssets.test.js`: verifies the new `aidm-ambience-scenes-sheet-002` sheet, 68 generated raster registrations, and soundscape hints on ambience scene assets.
- `tests/bilingualUi.test.js`: verifies ambience controls, scene backdrop, scene rail, asset search/detail hooks, Web Audio engine, and soundscape API wiring.

## Browser Verification

- Opened `http://localhost:4173` in the in-app browser.
- Created Chinese room `room_12e19863d9394947`.
- Verified mobile viewport width 560px has no horizontal overflow.
- Verified generated stage background loads from `/assets/generated/scenes/aidm-ambience-scene-01.png`.
- Verified stage moved ahead of roster on mobile: topbar first, generated scene stage second, transcript/audio third, roster later.
- Verified `soundscape` auto-selected `rain`, with localized Chinese label `雨声与湿石` and layers `天气 76%`, `水声 46%`, `天气 24%`.
- Verified ambience toggle changes to `氛围开`, sets `aria-pressed="true"`, and `Stop audio` returns control.
- Verified asset detail drawer opens from an asset card and shows preview, group, file, source, and tags.
- Captured screenshot at `/private/tmp/aidm-ui-soundscape-mobile.png`.

## Asset Evidence

- New generated source sheet: `assets/generated/sheets/aidm-ambience-scenes-sheet-002.png`.
- New sliced scene backdrops: `assets/generated/scenes/aidm-ambience-scene-01.png` through `aidm-ambience-scene-16.png`, each with SVG wrapper.
- `assets/generated/manifest.json` now has 3 generated sheets and 68 generated raster assets.

## Notes

Ambience is implemented as local browser Web Audio synthesis, not a paid or copyrighted audio pack. The code-generated layer is limited to audio synthesis and visual overlays such as rain, mist, embers, motes, and danger pulse; the concrete scene presentation is driven by generated image assets.
