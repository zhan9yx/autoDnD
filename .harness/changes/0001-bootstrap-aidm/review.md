# Requirement Review

## Decision

Approved for MVP implementation.

## Risks

- `MUST FIX`: LLM context loss can break long campaigns. Mitigation: persist structured room memory and retrieve relevant memories per turn.
- `MUST FIX`: LLM arithmetic can produce wrong results. Mitigation: deterministic dice parser and state machine own numeric decisions.
- `MUST FIX`: Multiplayer free-form chat can create action conflicts. Mitigation: active-player turn enforcement in the server.
- `LOW`: Text-only MVP does not satisfy the full multimodal vision. Mitigation: add asset pipeline extension points and document video/image pre-generation as later work.
- `LOW`: Local JSON storage is not production-scale. Mitigation: keep a storage interface so Postgres/Supabase can replace it later.

## Confirmation

Proceed with a web MVP because it is cheapest to build, easiest to deploy, and sufficient to validate the core AIDM loop before native app work.
