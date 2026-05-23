# 0001 Bootstrap AIDM

## Requirement

Create the initial AIDM product from an empty repository. The first version must include a Harness workflow and a usable web MVP for an AI tabletop game master.

## Product Acceptance Criteria

- Users can create a room, join as a player, and submit turn actions.
- Multiple browser tabs can observe room updates through server-sent events.
- The game engine enforces active-player turns.
- Dice rolls and checks are calculated in code, not by the AI model.
- Room transcript, players, scene state, and memory persist to a local JSON file.
- The app can run without `OPENAI_API_KEY` using deterministic local narration.
- If `OPENAI_API_KEY` exists, narration can use `gpt-5.4-mini` by default.

## Engineering Acceptance Criteria

- Harness files exist under `.harness/`.
- `npm run test`, `npm run lint`, and `npm run harness:check` pass.
- Core deterministic modules have tests.
- Documentation covers architecture, tech stack, operations, and product scope.
