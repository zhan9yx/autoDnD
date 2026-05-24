# 0012 Continuous Depth Assets

## Requirement

This QA/Harness pass preserves the production-depth gains from v11 and prevents the project from regressing into a thin MVP. The change records the current 0012 handoff, keeps unfinished depth work visible, and adds regression tests for the quality gates that now define a mature local AIDM review build.

## Scope

- Create the 0012 Harness change record: `spec.md`, `review.md`, `tasks.md`, and `test-report.md`.
- Update maturity and roadmap documentation so local-alpha maturity cannot be claimed without explicit gates for assets, logs, audio, UI, economy, and evaluation.
- Record current unfinished product risks in `docs/BUGS.md` and keep unresolved items separated from launch-readiness claims.
- Extend `tests/requirements.test.js` and `tests/maturity.test.js` so documentation and Harness records must keep these gates present.
- Run focused QA/Harness tests and record the results.

## Non-MVP Regression Gates

- Assets: generated image assets remain manifest-managed, player-safe, runtime-bound, and not exposed as raw galleries.
- Logs: AI DM, rules, economy, state, asset, and soundscape events remain structured, bilingual where player-facing, redacted, and queryable.
- Audio: soundscape and TTS controls remain deterministic, local-safe, scene-aligned, and tested without requiring paid audio services.
- UI: the player table remains one-screen first, drawer-based for secondary detail, localized, and browser-QA eligible on desktop and mobile.
- Economy: market, wallet, inventory, item use, equip, sale, stock, and localized currency labels remain server-authoritative and tested.
- Evaluation: memory, production-depth, smoke, simulated campaign, unit, lint, and Harness checks remain the release gate set.

## Acceptance Criteria

- The 0012 Harness record exists and names concrete acceptance criteria, risks, tasks, open items, and test results.
- `docs/MATURITY_AUDIT.md` states that AIDM is no longer a thin MVP, but still not a mature public-launch product.
- `docs/MATURITY_AUDIT.md` and `docs/ROADMAP.md` both carry the six non-MVP gate domains: assets, logs, audio, UI, economy, and evaluation.
- `docs/BUGS.md` records current open quality risks without marking them fixed.
- `tests/requirements.test.js` verifies the 0012 Harness record and report contract.
- `tests/maturity.test.js` verifies the non-MVP maturity gates and unfinished-item tracking.
- Focused tests pass before handoff.

## Non-Goals

- Do not change runtime product behavior in this QA/Harness pass.
- Do not generate or ingest additional image assets in this pass.
- Do not claim public launch readiness.
- Do not close unresolved product decisions such as market turn cost, tool equip semantics, or final audio/status placement without product approval.
