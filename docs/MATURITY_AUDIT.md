# AIDM Maturity Audit

## Verdict

AIDM is no longer a thin MVP, but it is not yet a mature public-launch product. It has a meaningful productized local foundation: Harness workflow, deterministic rules, combat exchange, director clocks, replay, generated assets, and reusable evaluation. It still lacks the production controls required for open internet users.

## What Is Mature Enough For Local Review

- Harness-managed changes with requirement review, tasks, test report, and merge discipline.
- Deterministic rules for character creation, combat, status effects, enemies, NPC strategy, and replay.
- Reusable evaluation commands with pass/fail thresholds.
- Five-player simulated campaign gate for multiplayer state pressure.
- Host/player local tokens and stale version conflict rejection.
- Browser UI with role setup, action/chat split, director, encounter, replay, and asset panels.
- Project-owned generated image assets with recorded provenance: 52 sliced raster registrations from 2 ChatGPT image generation sheets.

## Not Mature Enough For Public Users

- No production account provider, session refresh, passwordless login, or social login.
- No production database migration, backups, restore points, or multi-instance consistency.
- No content safety moderation service for player input or AI output.
- No rate limits, abuse protection, billing enforcement, or room cost budget policy.
- No privacy deletion workflow or user data export.
- No load test against hundreds of rooms and SSE clients.
- No deploy runbook, monitoring, alerting, rollback, or incident process.
- Asset library is now proven but still far below a full commercial marketplace scale such as thousands of curated assets.

## Current Production Gate

The product can be reviewed as a local alpha only when:

- `npm run harness:check` passes.
- `npm run smoke` passes against the local server.
- Browser visual QA passes for desktop and 390px mobile.
- All open P0 bugs in `docs/BUGS.md` are fixed or explicitly deferred with owner and reason.

The product can be considered public beta only after the V5 launch gates in `docs/ROADMAP.md` are implemented and verified.
