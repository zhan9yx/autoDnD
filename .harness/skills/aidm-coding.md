# AIDM Coding Skill

Use this SOP for every implementation task in this repository.

1. Read `.harness/project-context.md` and the active change directory.
2. Identify deterministic rules first: state machine, dice, memory, storage, access control.
3. Write or update tests for those deterministic rules.
4. Implement UI only after the API contract is stable.
5. Keep AI providers behind `src/core/aiProvider.js`; never scatter provider calls through UI or routes.
6. Persist product state through `src/core/storage.js`.
7. Run `npm run harness:check`.
8. Update the active change `test-report.md`.

## AI Boundary

AI may narrate, summarize, and propose consequences. Code must own:

- turn ownership
- dice rolls
- health and inventory deltas
- phase transitions
- memory writes
- persistence
- player identity and room membership
