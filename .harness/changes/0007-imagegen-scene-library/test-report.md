# Test Report

## Automated Verification

- `node --test tests/generatedAssets.test.js` passed: 4/4 tests.
- `node --check public/app.js` passed.
- `node --check public/i18n.js` passed.
- `npm run test` passed: 68/68 tests.
- `npm run smoke` passed against `http://localhost:4173`.
- `npm run harness:check` passed: lint, tests, 16-hour memory eval, and campaign simulation.

## Asset Library Gate

- Generated raster scene assets: 80.
- Described raster scene assets: 80.
- Raster scene assets with at least two soundscape hints: 80.
- Catalog target recorded in manifest: 500 macro scene backdrops.

## Manual Integration Notes

- The source sheets for 0007 are stored under `assets/generated/sheets/`.
- The scene slices for 0007 are stored under `assets/generated/scenes/`.
- Scene metadata now includes names, descriptions, soundscape hints, taxonomy, narrative uses, style preset, and provenance.
- The UI surfaces scene descriptions in the stage and asset detail surfaces.

## Browser QA

- Chrome headless opened `http://127.0.0.1:4173/` and rendered the Chinese gateway.
- Chrome headless opened an active room at `http://127.0.0.1:4173/?room=room_6ed7010a1ec14e6b`.
- The room screenshot showed the generated scene backdrop, visible scene description, scene rail thumbnails, weather effects, adaptive ambience controls, voice controls, and table action controls.
