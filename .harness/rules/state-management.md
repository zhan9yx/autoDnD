# State Management

## Authoritative State

Each room has one authoritative snapshot:

- `phase`
- `round`
- `activePlayerId`
- `turnOrder`
- `players`
- `scene`
- `transcript`
- `memories`
- `metrics`

## Event Flow

```text
client action
-> server validates actor and room
-> rules calculate check
-> AI narrates from calculated result
-> memory candidate is written
-> turn advances
-> snapshot persists
-> SSE broadcasts snapshot
```

## Concurrency

The server keeps a lightweight per-room lock. Future database versions must use transactions or row locks around the same reducer boundary.

## Tests Required

- Active player enforcement.
- Turn advancement.
- Dice/check calculation.
- Memory write after resolved action.
