# Requirement Review

## Decision

Approved for iterative productization. The current MVP is not ready for public users because it lacks production-grade onboarding, robust rules, long-history evals, combat, asset management, operational controls, and a complete UI.

## MUST FIX

- Build a reusable long-history evaluation flow before claiming memory reliability.
- Add deterministic rule modules for character creation, damage, encounter generation, and NPC decisions.
- Add a product roadmap with at least 100 atomic requirements so the project can continue through Harness-controlled iterations.
- Improve visual/interaction depth with reusable assets instead of a single canvas-only scene.
- Record version gates and test reports.

## LOW

- Native app shell can wait because web/PWA is enough for early deployment.
- Generated video can wait because it is too slow and expensive for synchronous play.

## Deferred

- Real payment/account/auth stack.
- Managed database and vector database migration.
