# Product Readiness Gap Assessment

## Verdict

The current AIDM MVP is not ready for public users to start real paid or open internet campaigns. It is a good technical seed, but it lacks enough product depth, safety controls, evaluators, combat rules, onboarding, and visual assets.

## P0 Gaps

- No reusable long-history memory evaluation flow.
- Character creation is too shallow: no species, classes, point buy, skills, equipment, spell choices, or derived stats.
- Combat is not complete: no enemies, initiative variants, damage types, resistance/weakness, status effects, or NPC tactics.
- The UI does not yet feel like a mature game table: it lacks guided setup, campaign progress, asset browsing, combat panels, and clear action affordances.
- No production auth, rate limiting, abuse controls, secrets workflow, or operational monitoring.
- No data migration path from local JSON to a production database.

## P1 Gaps

- Asset system is missing reusable scenes, occupations, races/species, weapons, spells, and UI icons.
- Memory is keyword-based only and lacks regression datasets, scoring, compaction, conflict handling, and recall thresholds.
- Event progress is not structured enough for multi-session campaigns.
- AI output has no structured validation rubric in the runtime.
- No battle report/replay export.
- Multiplayer is SSE-based and workable, but lacks reconnect conflict UX and room permissions.

## P2 Gaps

- No marketplace/module import flow.
- No mobile PWA installation polish.
- No image/video generation job queue.
- No creator tooling for custom campaigns and rule packs.

## Release Standard

AIDM should only be called public-ready after the v5 gates in `docs/ROADMAP.md` pass, including long-history evals, combat regression tests, browser E2E, operations checklist, and a real persistence/auth plan.
