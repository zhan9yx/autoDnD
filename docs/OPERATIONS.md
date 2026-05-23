# Operations

## Local

```bash
npm run dev
```

Default URL: `http://localhost:4173`

## Environment

Copy `.env.example` into your shell environment or hosting provider settings.

- `OPENAI_API_KEY`: optional.
- `OPENAI_MODEL`: defaults to `gpt-5.4-mini`.
- `OPENAI_BASE_URL`: defaults to `https://api.openai.com/v1`.
- `PORT`: defaults to `4173`.
- `AIDM_DATA_FILE`: defaults to `data/aidm-store.json`.

## Smoke Test

1. Start the server.
2. Create a room.
3. Join as two players from two browser tabs.
4. Submit an action as the active player.
5. Confirm the inactive player is blocked from acting out of turn.
6. Restart the server and refresh the room.

## Deployment Notes

The MVP is deployable as a single Node web service. Before internet exposure, add authentication, rate limiting, payment controls, and a database-backed room store.
