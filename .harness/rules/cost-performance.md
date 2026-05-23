# Cost And Performance

## MVP Defaults

- `OPENAI_API_KEY` is optional.
- Default model is `gpt-5.4-mini`.
- Local deterministic narration is the CI and demo fallback.
- Video generation is not synchronous in the MVP.

## Budget Rules

- Do not call an AI model for every chat message.
- Call AI only when the state machine needs GM narration.
- Send compact room state and retrieved memories, not the full transcript.
- Keep memory retrieval top-K small.
- Track provider, call count, latency, prompt characters, and completion characters.

## Degradation

- AI unavailable: local narration continues.
- Memory retrieval weak: use latest transcript plus structured state.
- SSE disconnected: browser reconnects automatically.
- Video/image unavailable: scene canvas and text remain usable.
