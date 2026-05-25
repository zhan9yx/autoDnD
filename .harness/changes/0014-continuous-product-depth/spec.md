# 0014 Continuous Product Depth Acceptance

## Requirement

Carry the 0013 public-productization batch into an executable QA and Harness acceptance layer without changing runtime code, adding assets, or treating bugfixes as new requirements. The project already has `REQ-001` through `REQ-400`; this change defines how the current product-depth surfaces must be verified in browser and test evidence before any future public-launch claim.

0014 is a documentation, QA design, and readiness-boundary change. It records what can be accepted now, what must be rechecked in the browser, and what remains a prerequisite for public launch.

## Scope

- Create the 0014 Harness document set: `spec.md`, `review.md`, `tasks.md`, and `test-report.md`.
- Add a 0014 acceptance checklist covering situation page density, table log density, party rail behavior, multiplayer recovery, scene changes, environment audio, spells and classes, market and backpack, login and room permissions, turn guidance, and complete player-flow closure.
- Add a browser QA procedure that can be run against a local isolated data file and that covers room creation, login refresh, password rooms, host-approval rooms, multiple player joins, action turn advancement, scene switching, market and backpack use, state drawer inspection, and audio settings.
- Update current documentation so it keeps the 0013/0014 boundary accurate: automated gates and selected browser loops have evidence, but public readiness is still blocked by deployment, operations, compliance, security hardening, load, and launch evidence.
- Keep `docs/REQUIREMENTS_200.md` unchanged and continue treating `REQ-001` through `REQ-400` as the current requirement ledger.

## Implemented In This Change

- Harness evidence package and task ledger for 0014.
- Browser QA runbook and acceptance checklist under `docs/qa/`.
- Documentation sync in project status docs and player guide surfaces.
- Verification through requirement/maturity tests, plus Harness check if localhost permissions allow it.

## Not Implemented In This Change

- No product code changes.
- No public UI changes.
- No server, auth, storage, rule, audio, or asset changes.
- No image asset expansion.
- No new numbered feature requirements beyond the existing `REQ-001` through `REQ-400` ledger.
- No deployment, production database, production identity provider, observability, moderation, legal, load, or launch-runbook implementation.

## Acceptance Criteria

- The 0014 Harness directory has all four required Harness files and none of them use placeholder completion language.
- The 0014 acceptance checklist names the required coverage domains and distinguishes accepted evidence, browser recheck needs, and launch prerequisites.
- The 0014 browser QA plan is executable by a future worker without modifying product code.
- Project status docs avoid `public-ready` or `launch-ready` claims.
- Old status wording is adjusted so protected-room browser fixes are no longer described as entirely unverified, while broader public launch evidence remains open.
- Focused requirement and maturity tests pass after the documentation change.

## Public Launch Prerequisites That Remain Outside 0014

- Production account provider review, session rotation policy, recovery flows, and abuse throttling.
- Production database migration, backup, restore, data retention, and rollback drills.
- Deployment configuration, staging parity, secrets validation, health checks, monitoring, alerting, incident response, and support runbooks.
- Content safety, privacy deletion, export, legal/IP review, rate limits, load testing, canary plan, and accepted residual-risk index.
- Full browser evidence pack attached to a release candidate, including desktop and mobile screenshots and interaction proof for the acceptance checklist.
