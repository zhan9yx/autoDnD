# 0011 Production Depth QA Closeout

Date: 2026-05-24
Worker: QA/Harness
Change: `.harness/changes/0011-production-depth`
Version record: package `0.10.0`, Harness change `0011-production-depth`, no package version bump in this QA pass.

## Requirement Record

Primary requirement source: `.harness/changes/0011-production-depth/spec.md`.

Covered acceptance areas:

- Harness ownership and completion status are recorded in `tasks.md` and `.harness/agents/subagent-ledger.md`.
- Generated assets are manifest-managed and bound to gameplay surfaces rather than exposed as a gallery.
- Character setup, market, inventory, equipment, progression, state tracking, scene/audio alignment, and production-depth evaluation are all represented in the Harness record.
- Browser QA and final gate results are recorded in `review.md` and `test-report.md`.

Current requirement status:

- Core v11 gates are recorded as passed in the main-thread final verification.
- `tasks.md` still contains open P1/P2 backlog items, so the change is closeable for v11 handoff but not a full public-launch maturity claim.
- Final integration remains open until the branch is committed and merged through `develop` and `main`.

## User Feedback

Primary feedback sources:

- `.harness/changes/0011-production-depth/review.md`
- `docs/USER_FEEDBACK_0006.md`

Closed or improved feedback themes:

- Player path no longer exposes generated assets as a raw catalog.
- Character creation hides after join in the happy path.
- Main status labels, market prices, purchase logs, item art, soundscape reason text, and player inventory surfaces were retested and improved across the v11 pass.
- Seat refresh/reclaim and duplicate-turn ownership received regression coverage.

Open feedback themes:

- Market remains lower in the navigation hierarchy than expected for a core economy surface.
- Purchase feedback is still quiet compared with a mature tabletop product.
- Some first-time setup wording and role labels can still read like content/system terms rather than polished Chinese player copy.
- The market turn-cost rule is still a product decision for the next iteration.

## Product Acceptance

Accepted for local v11 handoff:

- Local alpha table flow is testable and covered by Harness gates.
- Deterministic gameplay, inventory/economy, generated assets, soundscape alignment, and structured logs have automated regression coverage.
- Browser QA evidence exists for create room, join, start scene, inspect character, open market, buy, inspect/use item, settings/audio, and scene/soundscape checks.

Not accepted as public launch maturity:

- `docs/MATURITY_AUDIT.md` still correctly says AIDM is not yet a mature public-launch product.
- Production account, moderation, rate limit, billing, privacy deletion, load test, deployment runbook, monitoring, and incident response remain outside v11.
- Asset scale remains below the long-term 3000+ asset and 500-scene targets.

## Test Report

Latest recorded green gate in `.harness/changes/0011-production-depth/test-report.md`:

- `npm run lint` passed.
- `npm run test` passed with localhost listen permission: 174/174.
- `npm run eval:memory:16h` passed.
- `npm run eval:production-depth` passed: 10/10 checks.
- `npm run smoke` passed on restarted `localhost:4173` with 552 generated assets and 17 market offers.
- `npm run harness:check` passed after restarting the local server with localhost listen/connect permission.

QA/Harness worker check in this pass:

- `npm run harness:status` reported 11 Harness changes.
- `0011-production-depth` reported 46/66 checklist items complete, reflecting completed v11 gates plus open backlog items.
- `node --test tests/requirements.test.js tests/maturity.test.js` passed: 5/5.
- `npm run lint` passed: 71 JavaScript files checked.
- A later main-thread run superseded the intermediate 3/169 full-suite failure from the multi-worker tree: `npm run test` now passes 174/174, and `npm run harness:check` now passes on the current tree.

## Version Record

Release identity:

- Package version: `0.10.0`.
- Harness change: `0011-production-depth`.
- Release type: local alpha production-depth handoff.

Version notes:

- This QA pass does not change product runtime code, core gameplay, or UI.
- The v11 record should be merged only with its residual risk list preserved.
- A future version should decide whether remaining P1/P2 items become blockers, backlog, or explicit non-goals.

## Merge Risk List

P0:

- Full harness verification depends on localhost listen/connect permission; rerun `npm run harness:check` in the merge environment if the sandbox does not allow local server tests.

P1:

- Market discoverability remains weak if the primary path is still through Settings rather than an obvious player economy control.
- Purchase feedback and backpack-added confirmation remain subtle.
- Market disabled reasons may be accessible but not always visibly explanatory enough.
- Setup and voice/profile labels still need a final Chinese player-copy pass.
- Equipment affordance for tool-like items needs a product decision: equip slot, usable item, or explicit non-equippable reason.
- Market action turn-cost remains unresolved and should be decided before stricter economy/turn invariants are claimed.

P2:

- Asset count remains below long-term production scale.
- Soundscape status could be more visible outside Settings.
- Topbar/action hierarchy needs future simplification for first-time players.
