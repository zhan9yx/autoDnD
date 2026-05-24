# AIDM

AIDM is an AI tabletop game master for TRPG rooms. The current product is a deployable web MVP: a Node server, a browser table, persistent room state, deterministic dice/rules, structured memory retrieval, Server-Sent Events for multiplayer sync, and an optional OpenAI narration adapter.

The app runs without third-party packages. If `OPENAI_API_KEY` is not configured, it uses a deterministic local GM so development and tests stay cheap and reproducible.

## Run

```bash
npm run dev
```

Open `http://localhost:4173`.

## Player And Delivery Docs

- `docs/USER_GUIDE.md` is the player-facing guide for creating rooms, joining with a character, using point-buy attributes, acting/chatting, managing market and backpack items, saving memos, and using ambience/TTS controls.
- `docs/ASSET_INVENTORY.md` is the delivery inventory for generated visual assets. It defines which player-safe assets may appear in the stage, market, inventory, rewards, character builder, spells, NPC tokens, and status surfaces.
- Player UI should stay focused on play. Asset provenance, catalog management, internal placeholders, and evaluation implementation details belong in docs, manifests, and tests rather than in the table UI.

## Quality Gates

```bash
npm run test
npm run lint
npm run eval:memory
npm run eval:memory:v1
npm run eval:memory:v2
npm run simulate:campaign
npm run smoke
npm run harness:check
```

Long-memory delivery is checked through the memory evaluation commands above. Production-depth consistency checks live in the v11 harness/evaluation path and should be run before merging a release branch.

## Harness Workflow

All product work starts in `.harness/changes/<id>/` and moves through:

1. Requirement proposal in `spec.md`
2. Requirement review in `review.md`
3. Task breakdown in `tasks.md`
4. Development and tests
5. `npm run harness:check`
6. Merge from feature branch to `develop`, then to `main`

See `.harness/README.md` and `.harness/workflows/change-flow.md`.
