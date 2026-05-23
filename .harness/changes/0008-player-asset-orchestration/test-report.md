# Test Report

## Commands

- `npm run test`: passed, 74/74 tests.
- `npm run lint`: passed, 54 JavaScript files checked.
- `npm run harness:check`: passed. This ran lint, 74 tests, the 16-hour long-memory evaluation, and campaign simulation.
- `npm run smoke`: passed after localhost sandbox escalation; generated asset count was 148 and the flow covered Chinese room creation, soundscape, TTS provider catalog, action resolution, combat, memory, director beat, and replay.

## Evaluation

- Long-memory gate: `evals/long-memory/campaign-history-16h.json`
- Events: 2,112
- Queries: 256
- `recallAt5`: 1.000
- `meanReciprocalRank`: 1.000

## Browser QA

- Restarted the local AIDM server on `http://localhost:4173`.
- Created `room_1ee07d5746904a5a`, joined `Lantern Fox`, started the scene, and submitted a successful reward action.
- Verified the player table does not expose `assetGrid`, `assetSearch`, asset detail, asset library, Director, or evaluation UI.
- Verified the stage uses `presentation.sceneAsset`, the transcript renders a reward item image, and the reward toast displays the generated item image plus localized Chinese reward description.
- Verified Chinese UI hides English-only generated scene descriptions instead of showing asset-library prose to players.

## Asset QA

- Added 2 ChatGPT Image Generation sheets:
  - `assets/generated/sheets/aidm-reward-items-sheet-006.png`
  - `assets/generated/sheets/aidm-cultural-equipment-sheet-007.png`
- Cropped and registered 32 new player-safe item/equipment raster assets with SVG wrappers.
- Generated raster assets now total 148. Player-safe assets total 112; internal-only catalog assets total 36.
