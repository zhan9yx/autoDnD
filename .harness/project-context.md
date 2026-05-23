# Project Context

## Product

AIDM is an AI DM/KP for DND, COC, and lightweight TRPG rooms. It targets players who have a group but lack an experienced host. The product should reduce cost, scheduling friction, and preparation time while keeping rules and game state coherent.

## MVP Boundary

- Web table instead of native app for the first shippable product.
- Text narration first, with structured extension points for image/video generation.
- Local JSON persistence first, with a storage interface that can later move to Postgres or SQLite.
- Structured keyword memory first, with an embedding/vector implementation as the next scaling step.
- Deterministic rules and dice in code; the AI never computes damage or turn legality.

## Non-Negotiables

- The state machine owns phases, turns, and player action rights.
- Dice and numeric calculations must be tested.
- Room memory is stored outside the model context and retrieved per turn.
- The UI must stay usable without an API key.
- Every feature goes through `.harness/changes/<id>/`.
