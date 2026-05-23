# AI Boundary

AI narration is non-authoritative. It can propose fiction and summarize consequences, but code owns the room state.

## AI May

- Narrate scenes, NPC reactions, and consequences.
- Suggest checks in future versions.
- Summarize scenes into memory candidates.
- Generate shareable battle reports.

## AI Must Not

- Roll dice.
- Decide final success totals.
- Mutate HP, inventory, room phase, turn order, or memory directly.
- Accept out-of-turn player actions.
- Read or expose API keys.

## Implementation Boundary

- Provider code lives in `src/core/aiProvider.js`.
- Rule code lives in `src/core/dice.js` and `src/core/gameEngine.js`.
- State ownership lives in `src/core/stateMachine.js`.
- Persistence lives in `src/core/storage.js`.
