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
- Project-owned generated image assets with recorded provenance: the current generated manifest baseline is tracked in `assets/generated/manifest.json` and must be updated with every asset batch. As of the 0012 merge-prep readout, the manifest records 34 generated sheets, 748 generated raster assets, 475 player-safe assets, and 132 player-safe scene backdrops.

## 0012 Non-MVP Regression Gates

AIDM must not regress to a smoke-test-only MVP. A local-alpha handoff now requires all six product-depth domains to remain documented and covered by automated or Harness evidence:

- Assets gate: generated assets stay manifest-managed, provenance-backed, player-safe by surface, and runtime-bound to scenes, character options, spells, rewards, market items, backpack rows, or item detail views. Raw asset galleries and internal catalog metadata must stay out of the player table.
- Logs gate: AI DM decisions, rules checks, state transitions, combat, memory retrieval, asset selection, soundscape switches, and economy events stay structured with category/action/result fields, bilingual player summaries where visible, and secret redaction.
- Audio gate: soundscape and TTS remain deterministic, local-safe, opt-in where required by the browser, scene-aligned, and testable without paid audio services or copyrighted audio packs.
- UI gate: the player table remains one-screen first, uses drawers/modals for secondary detail, keeps character setup and market/backpack flows localized, and remains eligible for desktop plus 390px mobile browser QA.
- Economy gate: item catalog, market offers, wallet deltas, stock, buy/sell/use/equip flows, sale values, and localized currency labels stay server-authoritative and covered by regression tests.
- Evaluation gate: memory retrieval, production-depth scenarios, smoke flow, simulated campaign, lint, unit tests, and Harness report completeness remain release gates.

## Not Mature Enough For Public Users

- No production account provider, session refresh, passwordless login, or social login.
- No production database migration, backups, restore points, or multi-instance consistency.
- No content safety moderation service for player input or AI output.
- No rate limits, abuse protection, billing enforcement, or room cost budget policy.
- No privacy deletion workflow or user data export.
- No load test against hundreds of rooms and SSE clients.
- No deploy runbook, monitoring, alerting, rollback, or incident process.
- Asset library is now proven and expanded in 0012, but still far below a full commercial marketplace scale: 748 / 3000 generated raster assets and 132 / 500 player-safe scene backdrops are present, leaving 2252 assets and 368 scene backdrops to reach the documented targets.

## Current Production Gate

The product can be reviewed as a local alpha only when:

- `npm run harness:check` passes.
- `npm run smoke` passes against the local server.
- Browser visual QA passes for desktop and 390px mobile.
- The assets, logs, audio, UI, economy, and evaluation gates above remain represented in docs and tests.
- All open P0 bugs in `docs/BUGS.md` are fixed or explicitly deferred with owner and reason.

For 0012 merge review, the earlier no-scroll UI and production-depth blockers are closed in the current evidence set. The confirmed post-patch baseline includes `npm run test` 217/217, `npm run lint`, production-depth 10/10, smoke, desktop/mobile browser regression, and `npm run harness:check` ending with `harness check ok`. Later workers added release-gate-flow, knowledge-context, frontend turn-focus, and guide coverage with focused gates passing. Because this document-sync pass did not rerun the full suite, final staged merge still requires a fresh `npm run test`, `npm run lint`, and Harness rerun to establish the current canonical test total.

The product can be considered public beta only after the V5 launch gates in `docs/ROADMAP.md` are implemented and verified.
