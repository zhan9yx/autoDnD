# 0002 Productization And Evals

## Requirement

Move AIDM beyond the first MVP toward a product that can credibly be prepared for public users. This change establishes the 5-version / 100-requirement product roadmap, reusable long-history evaluation flow, richer rules foundation, visual asset system, and a more mature room interaction model.

## Acceptance Criteria

- A documented gap assessment states whether the current project is ready for real users.
- `docs/ROADMAP.md` contains 5 major versions and 100 numbered requirements.
- A reusable evaluation command can verify long-history memory retrieval.
- The evaluation dataset includes long campaign history, query expectations, and pass/fail thresholds.
- Visual assets are organized under `assets/` with a manifest and reusable UI references.
- Core rule modules cover character creation, species/classes, equipment, spells, damage, enemies, and NPC strategy.
- The browser UI exposes a more product-like flow for character setup, assets, scene/event progress, and combat state.
- Tests and Harness checks pass before commit.

## Non-Goals

- Public deployment, payment processing, account auth, and model billing enforcement are not performed in this local iteration.
- Video generation remains an async extension point; static reusable assets are sufficient for this version.
