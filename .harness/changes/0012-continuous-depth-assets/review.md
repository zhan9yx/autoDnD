# Requirement Review

Decision: merge-green as a Harness traceability pass after the post-patch gates and browser recovery. This is not a public-launch approval and it does not claim the 3000/500 asset-scale target is complete.

## Merge-Prep Readout - 2026-05-25

| Area | Status | Evidence |
| --- | --- | --- |
| Requirement record | Reviewable | `spec.md`, `review.md`, `tasks.md`, and `test-report.md` exist under `.harness/changes/0012-continuous-depth-assets/`. |
| Requirement review | Reviewable | This file records concrete gates, risks, and open decisions instead of placeholder approval. |
| Implementation | Reviewable, owned by other workers | The current working tree includes runtime, test, doc, and asset updates. This merge-prep worker did not edit product code. |
| Tests and gates | Green baseline plus follow-up focused gates | The latest `test-report.md` records the post-patch baseline: `npm run test` 217/217, lint, memory eval `recallAt5=1`/`MRR=1`, production-depth 10/10, smoke passed, campaign simulation passed, and `npm run harness:check` ended with `harness check ok`. Later release-gate-flow, knowledge-context, frontend turn-focus, and guide workers added coverage; final staged gates must establish the current canonical totals. |
| Bug tracking | Reviewable | `docs/BUGS.md` keeps BUG-0004 through BUG-0006 open for non-MVP drift, market/economy semantics, and continuous-depth polish; BUG-0007 and BUG-0008 are fixed in the current tree. |
| Asset scale | Expanded but incomplete | `assets/generated/manifest.json` currently records 34 generated sheets, 748 raster assets, 475 player-safe assets, and 132 player-safe scene backdrops. The remaining documented gap is 2252 assets and 368 scenes. |

## Findings

- CLOSED: The branch now has a complete 0012 Harness record before handoff.
  - Evidence: `.harness/workflows/change-flow.md` requires `spec.md`, `review.md`, `tasks.md`, and `test-report.md`.
  - Current action: all four files exist under `.harness/changes/0012-continuous-depth-assets/`, and the report no longer uses placeholder status.

- CLOSED: The product is no longer described as an MVP or as public-launch ready.
  - Evidence: `docs/MATURITY_AUDIT.md` says the project is local-alpha mature, not mature for open internet users.
  - Current action: maturity and roadmap docs preserve the local-alpha/public-launch boundary, and maturity tests guard the language.

- CLOSED: Quality gates cover every current production-depth lane, and the latest gate result is green.
  - Evidence: v11 closeout and review records covered generated assets, structured logs, soundscape/TTS, one-screen UI, market/economy, memory and production-depth evals.
  - Current action: assets, logs, audio, UI, economy, and evaluation are explicit gate domains in docs and tests; post-patch gates passed.

- CLOSED before merge-green: current no-scroll UI and production-depth gates are passing.
  - Evidence: earlier `test-report.md` history recorded `tests/noScrollUi.test.js:57` expecting `.dice-final-score` font `900 1rem ui-monospace`, while `public/styles.css` used `1.16rem`; it also recorded `scenario:rain-archive-street` selecting `scene.ambient.moonlit-rain-archive.v01` instead of `scene.rain.archive.street`.
  - Current action: those regressions are fixed; the post-patch `npm run test` baseline passed 217/217, production-depth passed 10/10, and the Harness baseline passed. Later added tests require a fresh staged full-suite count before merge.

- MUST FIX before claiming asset-scale maturity: the long-term generated asset target is still incomplete.
  - Evidence: the current generated manifest records 748 / 3000 generated raster assets and 132 / 500 player-safe scene backdrops.
  - Suggested action: keep the current expansion reviewable, but carry forward the 2252-asset and 368-scene gaps in tasks, roadmap, maturity audit, and asset docs.

- MUST FIX before final launch readiness: unfinished product work must stay visible rather than being silently treated as done.
  - Evidence: v11 closeout still lists market turn cost, purchase feedback, audio/status placement, UI hierarchy, setup copy, and asset scale as residual risks.
  - Suggested action: keep BUG-0004 through BUG-0006 open until their close conditions have direct tests or browser QA evidence.

- CLOSED: The previously interrupted browser/static evidence has been refreshed.
  - Evidence: this worker is scoped to merge-prep records only, not frontend or server implementation.
  - Current action: static/API serving was reverified, complete desktop and 390px mobile browser regressions passed with `issues=[]`, and final `npm run harness:check` passed.

## Quality Gate Matrix

| Domain | Gate | Evidence |
| --- | --- | --- |
| Assets | Generated assets stay manifest-managed, player-safe, provenance-backed, and runtime-bound. Current count is reviewable at 748 / 3000 assets and 132 / 500 scenes. | `assets/generated/manifest.json`, `docs/MATURITY_AUDIT.md`, `docs/ROADMAP.md`, generated asset tests |
| Logs | Player and system logs stay structured, redacted, bilingual where visible, and queryable. | `tests/logTemplates.test.js`, production-depth eval |
| Audio | Soundscape and TTS stay scene-aligned, local-safe, and deterministic. | `tests/soundscape.test.js`, `tests/ttsProfiles.test.js`, production-depth eval |
| UI | Player UI stays one-screen first, drawer-based, localized, and browser-QA eligible. | UI structure tests, no-scroll tests, browser QA records |
| Economy | Inventory and market rules preserve wallet, stock, use, equip, sell, and localized currency invariants. | economy and item catalog tests |
| Evaluation | Memory, production-depth, smoke, simulation, lint, unit, and Harness checks stay required gates. Baseline evidence is green: 217/217 tests, production-depth 10/10, smoke passed, campaign simulation passed, and Harness passed. Later focused gates expanded coverage; final staged full-suite/lint/Harness runs must set the current totals. | `npm run test`, `npm run lint`, `npm run eval:memory:16h -- --no-report`, `npm run eval:production-depth`, `npm run smoke`, `npm run simulate:campaign`, `npm run harness:check` |

## Open Product Decisions

- Decide whether market buy/sell is free-time inventory management or a turn-consuming table action.
- Decide how purchased tool-like items communicate equip, use, or non-equippable status.
- Decide where active soundscape/audio status belongs outside Settings.
- Decide whether purchase/use feedback needs a focused confirmation pattern.
- Continue asset expansion from the current 748 generated raster assets and 132 player-safe scene backdrops toward the documented 3000+ generated asset and 500-scene targets.
