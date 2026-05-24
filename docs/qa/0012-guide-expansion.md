# 0012 Guide Expansion QA

Date: 2026-05-25
Worker role: B9 beginner manual and starter campaign subagent
Runtime code touched: no
Image assets added: no

## Scope

This pass expands the player-facing documentation for `REQ-241` through `REQ-247` without changing runtime behavior or adding image assets.

## Coverage

- `docs/BEGINNER_TUTORIAL.md`: adds first-session success criteria, character hook worksheet, party relationship prompts, host first-scene script, action-shape examples, voice expectations, weather-season cues, and reconnect recovery practice.
- `docs/USER_GUIDE.md`: adds richer character setup guidance, party relationship patterns, step-by-step player manual, turn cue and character switching guidance, inventory drill, voice fallback expectations, weather/season/audio cue table, host guide, and recovery table.
- `docs/OPERATIONS.md`: adds host runbook, recovery runbook, and starter campaign QA path.
- `docs/SCENE_LIBRARY.md`: adds the five-scene starter campaign `The Rain Bell Ledger`, browser QA path, scene variety plan before new images, and seasonal encounter variants.

## Acceptance Notes

- The campaign uses existing generated scene art, overlays, ambience presets, and item art only.
- No new image assets were added.
- The docs do not claim that future character-hook fields, seat transfer, or multi-character ownership are fully implemented.
- Recovery guidance keeps server state authoritative and avoids telling players to create duplicate seats.
- Voice guidance states that browser-installed voices are variable and transcript remains authoritative.

## Verification

Focused command for this documentation pass:

```bash
node --test tests/guide.test.js tests/staticUiStructure.test.js
```

Expected result: pass.
