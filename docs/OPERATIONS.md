# Operations

## Local

```bash
npm run dev
```

Default URL: `http://localhost:4173`

## Environment

Copy `.env.example` into your shell environment or hosting provider settings.

- `OPENAI_API_KEY`: optional.
- `OPENAI_MODEL`: defaults to `gpt-5.4-mini`.
- `OPENAI_BASE_URL`: defaults to `https://api.openai.com/v1`.
- `PORT`: defaults to `4173`.
- `AIDM_DATA_FILE`: defaults to `data/aidm-store.json`.

## Smoke Test

1. Start the server.
2. Create a room.
3. Join as two players from two browser tabs.
4. Submit an action as the active player.
5. Confirm the inactive player is blocked from acting out of turn.
6. Restart the server and refresh the room.

## Host Runbook

Use this checklist when running a local table or QA session.

### Before Players Join

1. Start `npm run dev` and open `http://localhost:4173`.
2. Create a room with a clear title, campaign tone, and language.
3. Copy the room URL and keep it available for reconnects.
4. Tell players that voice and ambience are optional local browser features.
5. Ask each player for a goal, fear, bond, secret, and safety line. If a field is not available in the character builder, ask them to put the short version in memo after joining.

### During The First Scene

1. Start only after at least one player has joined.
2. Read the objective, weather, threat clock, and clue clock.
3. Confirm whether play is free-form, spotlighted, or strict initiative.
4. When the active actor cue changes, name the expected player and offer one short suggestion if needed.
5. Treat `Chat` as table talk and `Action` as the move that can change clocks, rewards, scene, or turn state.

### Scene Handback

After a major success, failure, combat, or travel result, state:

- what changed in the scene;
- what danger or clue remains;
- which exits or next scenes are visible;
- which item, spell, or relationship might help next;
- whether market, rest, or recovery is free-time preparation.

## Recovery Runbook

| Case | Operator Check | Player Instruction | Completion Signal |
| --- | --- | --- | --- |
| Same browser refresh | Confirm room URL is unchanged. | Refresh and wait for room, character, log, and scene to render. | Player can act or chat with the same character. |
| Different browser or device | Confirm the shared `room_...` ID. | Open the exact room URL and use setup only if no local binding exists. | Setup panel is visible or the owned character is recovered. |
| Lost token | Do not delete existing room data. | Avoid duplicate character creation until host confirms the intended seat. | One valid seat remains in the roster. |
| Stale action error | Check whether the round or log advanced. | Reload, read latest state, then resubmit only if the action still applies. | New action is accepted against current state. |
| Audio unavailable | Check browser mute, tab focus, and user gesture. | Click the page, then toggle voice or ambience. | Transcript remains usable even if audio stays unavailable. |

Record repeated recovery failures in `docs/BUGS.md` or the active Harness QA note with room ID, browser, viewport, and reproduction steps.

## Starter Campaign QA Path

The starter campaign path for a release smoke should cover:

1. Create room and join a character with memo hooks.
2. Investigate the opening urban mystery scene.
3. Move to a market or civic scene and buy or inspect one item.
4. Travel through weather or season pressure.
5. Resolve a social or optional combat scene.
6. Return to exploration or downtime, build replay, then refresh and confirm recovery.

Do not require new image assets for this path. Reuse generated scenes, overlays, ambience presets, and item art already present in the manifest.

## Deployment Notes

The MVP is deployable as a single Node web service. Before internet exposure, add authentication, rate limiting, payment controls, and a database-backed room store.
