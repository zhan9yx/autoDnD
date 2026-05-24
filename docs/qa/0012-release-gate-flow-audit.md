# 0012 Release Gate Flow Audit

Date: 2026-05-25
Role: test/release gate subagent
Scope: tests and QA records only. No product code, generated assets, or runtime implementation files were changed.

## Coverage Audit

Existing automated coverage already covered these release-gate areas:

| Area | Existing evidence |
| --- | --- |
| Create, join, start, action, chat | `scripts/smoke-flow.mjs`, `tests/gameEngine.test.js`, `tests/serverRoutes.test.js` |
| Market, buy, sell, item use, item equip | `tests/serverRoutes.test.js`, `tests/inventoryEconomy.test.js`, `tests/gameEngineInventory.test.js` |
| Scene switch and replay | `tests/gameEngine.test.js`, `tests/replay.test.js`, `scripts/smoke-flow.mjs` |
| Weather and ambience selection | `tests/soundscape.test.js`, `tests/ambienceEngine.test.js` |
| TTS profiles and provider metadata | `tests/publicTts.test.js`, `tests/ttsProfiles.test.js`, `scripts/smoke-flow.mjs` |
| No-local-token UI constraints | `tests/playerUiAccess.test.js`, `tests/staticUiStructure.test.js` |
| Static serving and route errors | `tests/serverRoutes.test.js`, `scripts/smoke-flow.mjs` |

The gap was not isolated feature coverage; it was a single release-gate chain that proves the core table loop can complete across static serving, API auth, inventory economy, turn handoff, media state, and replay.

## Added Coverage

Added `tests/releaseGateFlow.test.js` with two release-gate tests:

1. API loop through an isolated local server:
   - Static files: `/`, `/app.js`, `/styles.css`, `/i18n.js`
   - Health, TTS providers, soundscape catalog
   - Create room, join two players, start scene
   - No-local-token rejection on action submission
   - Market buy, backpack item use, item equip, item sell
   - Party chat without spending the active turn
   - Two action submissions proving active character switch and round advance
   - Presentation/media logs and replay generation

2. Deterministic engine loop:
   - Two-player turn order
   - Successful clue action
   - Scene switch into forest route
   - Weathered forest soundscape with rain layer
   - Replay generation from the completed scene path

## Commands Run

| Command | Result | Notes |
| --- | --- | --- |
| `node --test tests/releaseGateFlow.test.js` | Pass | Required localhost escalation; sandboxed run failed because spawned local HTTP server returned a sandbox-related failure. |
| `node --test tests/releaseGateFlow.test.js tests/serverRoutes.test.js tests/soundscape.test.js tests/replay.test.js tests/publicTts.test.js tests/playerUiAccess.test.js` | Pass | 39/39 tests passed with localhost escalation. |
| `npm run test` | Pass | 222/222 tests passed with localhost escalation. |
| `npm run lint` | Pass | `lint ok: 72 JavaScript files checked`. |

## Localhost Permission Note

The focused server tests start temporary HTTP servers and call `127.0.0.1`. In this environment, sandboxed execution can fail those flows even when the product path is valid. For full release verification, run server-backed tests and `npm run harness:check` with localhost permission or with the existing approved escalation for local test servers.

The current in-app/browser service at `http://127.0.0.1:4173` is useful for manual QA, but this release-gate test does not depend on that long-running process. It starts its own isolated server and temp data file.

## Release Gate Assessment

Automated test coverage now has a closed-loop gate for:

- static serving
- create/join/start
- no-local-token rejection
- active character switching
- action/chat separation
- market and backpack use/equip/sell
- scene switch
- weather and ambience selection
- replay

Remaining release work belongs to product implementation or browser/manual QA agents, not this test-only subagent: richer handbook content, broader voice asset realism, more obvious turn guidance, deeper random AI DM content, and any additional 200-requirement product backlog execution.
