# 0012 Flow Closure Extended QA

Date: 2026-05-25
Worker: parallel subagent A - closed-loop test expansion; M4 follow-up test hardening

## Scope

This pass adds automated coverage for the player-visible game loop without adding network dependencies or image assets. Follow-up verification now covers explicit season priority in the rules knowledge layer plus static UI guards for drawer/toast, Replay Build, and Market loading feedback.

This file records automated server/core/static coverage only. It does not replace the browser post-P3 sign-off tracked in `docs/qa/0012-browser-post-p3-fix.md`.

## Added Coverage

- API room creation returns host session separately from public room JSON.
- Two player joins create isolated player tokens and deterministic turn order.
- Start flow exposes active-player turn guidance through `stateSummary.turn`.
- Off-turn action is rejected with the current actor named in the error.
- Wrong player token is rejected with `PLAYER_TOKEN_REQUIRED`.
- Market buy failure paths reject copied tokens and unknown items, then a subsequent Market load still succeeds with the same room version and offer list.
- Market, buy, item use, and off-turn equip remain free-time operations that do not advance round or active actor.
- Party chat writes a faction-scoped log without advancing the turn.
- Player action writes player, roll, and GM transcript events.
- Turn ownership switches from player one to player two and back to player one after the full round.
- Replay endpoint produces chapters, highlights, memory count, and share text after the loop.
- Static player UI tests cover drawer-open reward toast suppression, drawer/scrim/toast layering, Replay Build busy/built/error states, and Market loading success/error feedback reset.
- Deterministic engine flow advances clue state, switches to the forest scene, and keeps active-player guidance aligned after the switch.
- Weather, season, and soundscape state are checked together for a spring light-rain forest scene.
- Rules knowledge now verifies explicit `scene.season` / `scene.atmosphere.season` / `season:*` soundscape tags win over descriptive leaf or harvest language.
- Transcript, memory, and state summary surfaces are checked after the deterministic loop.
- AI DM rules knowledge randomness is checked for same-input reproducibility and different-action diversity.

## Commands

```bash
node --check tests/flowClosureExtended.test.js
node --test tests/flowClosureExtended.test.js tests/knowledgeContextQa.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/director.test.js tests/rules.test.js
npm run lint
npm run test
npm run harness:check
```

Result:

- `node --check tests/flowClosureExtended.test.js`: pass
- `node --test tests/flowClosureExtended.test.js`: 2/2 pass
- `node --test tests/flowClosureExtended.test.js tests/knowledgeContextQa.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/director.test.js tests/rules.test.js`: 25/25 pass
- `npm run lint`: pass, 79 JavaScript files checked
- `npm run test`: 241/241 pass
- `npm run harness:check`: pass after rerun in an environment allowed to bind `127.0.0.1`; output ended with `harness check ok`

## Notes

- The first focused run exposed an overly narrow assertion: a forest travel action can both switch scenes and progress clues, so `stateSummary.progress.sceneChange` may report `clue-progress` instead of `scene-pressure`. The test now asserts a non-`none` scene change plus explicit `summary.scene.lastShiftReason === "forest-action"`.
- The second focused run exposed a non-blocking product risk: rule knowledge season inference could classify a spring forest as autumn when ambience contained leaf language. The follow-up fix gives explicit scene and atmosphere season fields priority over descriptive ambience keywords, and the flow test now asserts spring directly.

## Remaining Risks

- This is automated server/core coverage, not a browser visual pass.
- This does not sign off the post-P3 browser UI fixes; see `docs/qa/0012-browser-post-p3-fix.md` for the current browser revalidation status.
- Current post-P3 browser revalidation is no longer blocked in `docs/qa/0012-browser-post-p3-fix.md`; the remaining caveat is coverage shape, with focused passes recorded instead of one uninterrupted desktop/mobile run.
- The sandboxed Harness attempt hit `listen EPERM` on `127.0.0.1`; the escalated rerun passed and is the canonical Harness result.
- Off-turn API rejection currently returns an error response with the active actor name; this test does not require a specific HTTP status beyond `>= 400`.
