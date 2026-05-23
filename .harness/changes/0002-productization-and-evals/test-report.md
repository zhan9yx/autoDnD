# Test Report

## Commands

- `npm run test`
- `npm run lint`
- `npm run eval:memory`
- `npm run simulate:campaign`
- `npm run smoke`
- `npm run harness:check`

## Result

- Unit tests: 36 passed.
- Lint: 35 JavaScript files checked.
- Long-memory evaluation v2: 500 events / 50 queries, `recallAt5 = 0.92`, `meanReciprocalRank = 1`, thresholds passed.
- Five-player simulation: 5 players, reached at least round 5, produced at least 20 memories, combat logs, and 8 replay highlights.
- Smoke flow: created a room, persisted host/player tokens, joined an `automaton` `occultist`, started play, sent non-advancing chat, advanced actions, wrote memory, exposed director beat, produced combat log, and generated replay highlights.
- Harness check: passed.
- Browser visual QA: desktop and 390px mobile views render character setup, message type, director, encounter, replay, and asset library.

## Known Gaps

- This change improves production readiness but does not deploy to public infrastructure.
- Public launch is still blocked by production account auth, persistent database migration, backup/restore, rate limits, content safety, privacy deletion, load testing, and hosted infrastructure work listed in `docs/ROADMAP.md`.
