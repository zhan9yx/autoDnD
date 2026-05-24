# Test Report

Status: passing as of 2026-05-24.

Completed gates:

- `npm run test`: 110/110 passed as part of `npm run harness:check`.
- `npm run lint`: passed, 67 JavaScript files checked.
- `npm run eval:memory:16h`: passed, 2112 events, 256 queries, recall@5 1.0, MRR 1.0.
- `npm run smoke`: passed outside the sandbox after localhost connection was blocked in sandbox. Latest result after the rain-family smoke assertion update: generatedAssetCount 164, ttsProviders 5, soundscapePresets 19, soundscape `light-rain`, transcript 11, memories 2, combatLog 1, replayHighlights 4.
- `npm run harness:check`: passed outside the sandbox after server-route tests needed localhost bind access: lint ok, 110/110 tests passed, memory eval passed, 5-player campaign simulation passed.
- `node --test tests/generatedAssets.test.js tests/assets.test.js`: passed, generated asset manifest and sheet 008 contracts covered.
- `node --test tests/soundscape.test.js tests/ambienceEngine.test.js`: passed, weather/social ambience families and layer transitions covered.
- `node --test tests/ttsProfiles.test.js tests/publicTts.test.js`: passed, 21 bilingual role profiles and local/open provider catalog covered.
- `node --test tests/logTemplates.test.js tests/gameEngine.test.js`: passed, structured AI DM, dice, chat, reward, inventory, and system logs covered.
- Python/Pillow arm64 validation: default x86_64 Python now exits with an arm64 runtime recommendation; bundled arm64 Python sliced sheet 008 successfully.

Browser QA:

- Frontend worker browser smoke covered room creation, character join, character drawer, backpack detail, settings drawer, chat-channel switch, and party chat.
- Main integrated browser QA is part of the final branch verification.

Smoke notes:

- The current soundscape catalog no longer exposes a single legacy `rain` preset. Rain ambience is represented as a weather family through presets such as `light-rain`, `heavy-rain`, and `thunderstorm`, with `weather:rain` asset hints.
- Sandbox-local `npm run smoke` still fails before assertions with `connect EPERM ::1:4173` / `127.0.0.1:4173`; the same command passes when run with localhost access outside the sandbox.
