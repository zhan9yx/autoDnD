# 0012 Flow Closure Extended QA

Date: 2026-05-25
Worker: parallel subagent A - closed-loop test expansion

## Scope

This pass adds automated coverage for the player-visible game loop without adding network dependencies or image assets. Runtime code was not changed.

## Added Coverage

- API room creation returns host session separately from public room JSON.
- Two player joins create isolated player tokens and deterministic turn order.
- Start flow exposes active-player turn guidance through `stateSummary.turn`.
- Off-turn action is rejected with the current actor named in the error.
- Wrong player token is rejected with `PLAYER_TOKEN_REQUIRED`.
- Market, buy, item use, and off-turn equip remain free-time operations that do not advance round or active actor.
- Party chat writes a faction-scoped log without advancing the turn.
- Player action writes player, roll, and GM transcript events.
- Turn ownership switches from player one to player two and back to player one after the full round.
- Replay endpoint produces highlights and share text after the loop.
- Deterministic engine flow advances clue state, switches to the forest scene, and keeps active-player guidance aligned after the switch.
- Weather, season, and soundscape state are checked together for a spring light-rain forest scene.
- Transcript, memory, and state summary surfaces are checked after the deterministic loop.
- AI DM rules knowledge randomness is checked for same-input reproducibility and different-action diversity.

## Commands

```bash
node --check tests/flowClosureExtended.test.js
node --test tests/flowClosureExtended.test.js
```

Result:

- `node --check tests/flowClosureExtended.test.js`: pass
- `node --test tests/flowClosureExtended.test.js`: 2/2 pass

## Notes

- The first focused run exposed an overly narrow assertion: a forest travel action can both switch scenes and progress clues, so `stateSummary.progress.sceneChange` may report `clue-progress` instead of `scene-pressure`. The test now asserts a non-`none` scene change plus explicit `summary.scene.lastShiftReason === "forest-action"`.
- The second focused run exposed a non-blocking product risk: rule knowledge season inference can classify a spring forest as autumn when ambience contains leaf language. The current scene state, state summary, and soundscape still report spring correctly. The test uses an explicit spring rules context for the AI DM randomness check and leaves the matcher behavior as a follow-up risk.

## Remaining Risks

- This is automated server/core coverage, not a browser visual pass.
- Off-turn API rejection currently returns an error response with the active actor name; this test does not require a specific HTTP status beyond `>= 400`.
- The rule knowledge season matcher should later prefer explicit `scene.season` over ambience keywords when both are present.
