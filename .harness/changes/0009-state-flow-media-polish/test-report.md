# Test Report

## Automated

- `npm run test`: passed, 83/83 tests.
- `npm run lint`: passed, 59 JavaScript files checked.
- `npm run smoke`: passed against `http://localhost:4173`; latest smoke room `room_25761c975a6c4f07`, generated asset count 148, soundscape `rain`, TTS providers 3, combat log 2, replay highlights 4.
- `npm run harness:check`: passed; reran lint, 83 tests, 16-hour long-memory evaluation, and five-player campaign simulation.

## Long-Memory Gate

- Dataset: `evals/long-memory/campaign-history-16h.json`.
- Events: 2,112.
- Queries: 256.
- `recallAt5 = 1`.
- `meanReciprocalRank = 1`.
- Thresholds passed: `0.92 / 0.85`.

## Browser QA

- In-app browser verified `http://localhost:4173/?room=room_25761c975a6c4f07`.
- State drawer opens with `aria-hidden=false`; closed drawers remain `opacity: 0`, `visibility: hidden`, and off-screen.
- Player table remains one viewport high: `scrollHeight = innerHeight = 803`.
- Player UI does not expose asset management surfaces (`assetGrid`, `assetSearch`, evaluation tab absent).
- Stage backdrop receives a generated image URL and localized Chinese `aria-label`.
- State summary shows objective, clue/danger/deadline clocks, active quest progress, latest change, scene route, and soundscape reason.
- Encounter rows localize enemy role, enemy intent, and combat log text in Chinese.

## Notes

- Browser screenshot capture timed out in the in-app browser backend; QA evidence is DOM and interaction based.
