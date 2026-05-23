# Technical Stack

## Chosen Stack

- Runtime: Node.js 20+ native ESM.
- Frontend: browser HTML/CSS/JavaScript served by the app server.
- Backend: Node `http` module with REST endpoints and Server-Sent Events.
- Tests: built-in `node:test`.
- Persistence: JSON file through `src/core/storage.js`.
- AI adapter: OpenAI Responses API via native `fetch`, with deterministic local fallback.

## Why This Stack

The first product needs strict control over state and cost more than framework breadth. A dependency-light Node app is easy to run, test, deploy, and inspect. The server owns game state while the browser is a thin table client.

## Pain Point Mapping

- Long-term memory: `MemoryIndex` stores facts/events and retrieves relevant entries by term overlap. This can later be replaced by embeddings without changing route code.
- Rules rigor: `dice.js` and `stateMachine.js` own rolls, checks, and turns.
- Multiplayer sync: Server-Sent Events broadcast room snapshots after every change.
- Generation speed: text narration is immediate; image/video are deferred extension points.
- Cost: local deterministic GM is free; OpenAI calls happen only when `OPENAI_API_KEY` is present. Default model is `gpt-5.4-mini`.
- Context control: prompts receive compact room state plus retrieved memories, not the full transcript.

## Upgrade Path

- Replace `JsonRoomStore` with SQLite/Postgres.
- Replace `MemoryIndex.retrieve` with embedding/vector search.
- Add asset jobs for scene images and pre-generated video loops.
- Add authentication and payment before public internet deployment.

## Production-Scale Target Stack

When the MVP moves beyond local deployment, the recommended production stack is:

- Next.js or a retained Node API service behind a managed edge platform.
- Postgres with row-level transactions for room state.
- pgvector or a managed vector index for campaign memory.
- WebSocket or managed realtime channels for lower-latency multiplayer.
- Object storage for generated scene images, NPC portraits, and replay exports.
- A job queue for image/video pre-generation and battle report rendering.
