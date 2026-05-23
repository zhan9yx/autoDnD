# 0009 State Flow Media Polish

## Requirement

AIDM needs a more mature player-facing state and media loop. The player table should show enough state to understand what changed, why it matters, and what to do next, without exposing internal director/debug details. Scene art, rewards, voice, ambience, and story progression should be testable as one coherent play loop.

## Acceptance Criteria

- Product and UI/UX review outputs are converted into scoped player-facing requirements.
- The State drawer exposes concise progress tracking for objective, clues, danger, deadline, current beat, scene changes, and latest reward.
- The main table keeps one-viewport play clean while still offering a small "what changed" summary after actions.
- Scene art and soundscape changes are driven by room state and can be verified in tests.
- Voice plans remain lightweight but include naturalness constraints that are testable without paid TTS.
- The game engine records a bounded state summary so AIDM state is controllable and not only hidden in raw room JSON.
- Tests cover asset display/switching, reward image display, soundscape changes, voice plan naturalness, state summary, and narrative coherence guardrails.

## Non-Goals

- Do not add a backend/admin console.
- Do not expose raw director directives, metrics, manifest details, or asset catalog browsing to players.
- Do not add paid external TTS or music dependencies.
