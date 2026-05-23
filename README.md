# AIDM

AIDM is an AI tabletop game master for TRPG rooms. The current product is a deployable web MVP: a Node server, a browser table, persistent room state, deterministic dice/rules, structured memory retrieval, Server-Sent Events for multiplayer sync, and an optional OpenAI narration adapter.

The app runs without third-party packages. If `OPENAI_API_KEY` is not configured, it uses a deterministic local GM so development and tests stay cheap and reproducible.

## Run

```bash
npm run dev
```

Open `http://localhost:4173`.

## Quality Gates

```bash
npm run test
npm run lint
npm run eval:memory
npm run eval:memory:v1
npm run simulate:campaign
npm run smoke
npm run harness:check
```

## Harness Workflow

All product work starts in `.harness/changes/<id>/` and moves through:

1. Requirement proposal in `spec.md`
2. Requirement review in `review.md`
3. Task breakdown in `tasks.md`
4. Development and tests
5. `npm run harness:check`
6. Merge from feature branch to `develop`, then to `main`

See `.harness/README.md` and `.harness/workflows/change-flow.md`.
