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

## Current Player-Flow Residual Risks - 2026-05-24

Context: main thread reported the full harness gate green on the current branch: 165/165 tests, memory eval, production-depth eval, smoke, and simulation all passed. The remaining notes below are browser QA/product risks from a low-context pass on `http://localhost:4185/`.

### P0/P1 Risks

- [P0] Core action controls are partially clipped at 1280x720: the composer measured `bottom=738` in a 720px viewport.
- [P1] Chinese player flow still leaks English/internal terms: native setup options (`Human`, `Warrior`), join role `Investigator`, and scroll-use result `sleep`.
- [P1] Market discoverability is weak because the market is only reached through Settings in this pass.
- [P1] Purchase confirmation is too quiet; wallet/log updates are present, but no focused confirmation or backpack-added cue appears.
- [P1] Market post-purchase state is ambiguous because the bought item remains visible and only reports `克朗不足`, not sold out, owned, or depleted.
- [P1] Item economy labeling is unclear because purchase price and backpack/detail value differ without explanation.
- [P1] Equipment affordance is unclear for tool-like items: an empty `工具` slot is visible, but a starter lantern exposes no equip path.

### P2 Risks

- Ambience label can feel semantically off from the current scene (`市场与城市街道` while viewing a rain-wet archive street).
- Voice profile labels include technical locale tags (`zh-CN`, `zh-TW`) in the player UI.
- Chat, fresh dice resolution, state drawer content, and reload recovery were not reverified in the interrupted `localhost:4185` pass.
