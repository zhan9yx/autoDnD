# Tasks

## Core Rules

- [x] Preserve existing concurrent changes in `src/core/rules.js`, `src/core/gameEngine.js`, `src/core/itemCatalog.js`, `src/core/localization.js`, and related tests.
- [x] Add spell rule cards with tier, purpose, usage tags, status, outcome, and feedback fields.
- [x] Add deterministic known-spell action detection for visible spell use.
- [x] Add bounded action-check influence from equipment, tools, and warrior specializations.
- [x] Add deterministic scene event state with weather, season, pressure, clock, clue, reward, consequence, encounter, and seed fields.
- [x] Expose event state through state summary review/control fields.
- [x] Add English and Chinese localization for rule modifiers and spell-use feedback.

## Tests

- [x] Cover spell rule cards and known-spell use in `tests/rules.test.js`.
- [x] Cover equipment/tool/specialization influence in `tests/itemCatalog.test.js`.
- [x] Cover spell transcript, mana spending, action influence, and scene event state in `tests/gameEngine.test.js`.
- [x] Cover event state summary fields in `tests/stateSummary.test.js`.
- [x] Cover new English and Chinese text in `tests/localization.test.js`.

## Verification

- [x] Run required syntax checks for `src/core/rules.js`, `src/core/gameEngine.js`, `src/core/itemCatalog.js`, and `src/core/localization.js`.
- [x] Run focused core tests for rules, game engine, item catalog, localization, and state summary.
- [x] Run `npm run harness:status`.
- [x] Run `git diff --check`.

## Still Open After This Change

- [x] Browser-visible QA of these new transcript/state fields remains for a later browser worker.
- [ ] Balancing beyond bounded +0 to +3 action modifiers remains needs-playtest after real playtest logs.
