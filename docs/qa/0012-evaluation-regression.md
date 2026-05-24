# 0012 Evaluation Regression

Date: 2026-05-24
Branch: `codex/0012-continuous-depth-assets`
Role: evaluation/regression QA sub-agent

## Scope

This pass rechecked the current multi-agent working tree for evaluation reuse, long-history recall, production-depth coverage, generated asset display switching, soundscape/TTS behavior, state summary controls, and structured log gates.

No product code was changed in this pass.

## Commands

- `npm run eval:memory:16h -- --no-report`
- `npm run eval:production-depth`
- `node --test tests/evaluation.test.js tests/memory.test.js tests/productionDepth.test.js tests/assetSelection.test.js tests/assets.test.js tests/generatedAssets.test.js tests/staticUiStructure.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/publicTts.test.js tests/ttsProfiles.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/stateSummary.test.js tests/logTemplates.test.js`
- `node --test tests/requirements.test.js tests/maturity.test.js`
- `npm run test`
- `npm run lint`

`eval:memory:16h` normally writes a timestamped report under `evals/reports/`. This pass used the same npm gate with `--no-report` to stay inside the requested write scope.

`npm run harness:check` was not run because it calls `npm run eval:memory` without `--no-report` and would write outside this worker's permitted report files. Its component gates were run directly where they were relevant to this pass.

## Results

| Gate | Result | Evidence |
| --- | --- | --- |
| 16h memory eval | Passed | `recallAt5=1`, `meanReciprocalRank=1`, threshold `0.92/0.85`, 2,112 events, 256 queries |
| Production-depth eval | Passed | 10/10 checks, `passRate=1`, covers scene/audio, memory, logs, event progression, state, combat, economy, assets |
| Focused evaluation/UI/asset/audio/state/log tests | Passed | 96 passed, 0 failed |
| Harness documentation gates | Passed | 8 passed, 0 failed |
| Full unit suite | Passed | `npm run test`: 195 passed, 0 failed |
| Lint | Passed | 71 JavaScript files checked |

## Regression Notes

- Evaluation flow remains reusable. `tests/evaluation.test.js` verifies the 16h dataset shape, npm script targeting, and v2 report format; `tests/productionDepth.test.js` verifies the production-depth CLI can write a reusable JSON report and that the npm gate runs locally without a timestamped report.
- Long-history recall is green on the current gate: 16 session blocks, 2,112 indexed events, 256 queries, `recallAt5=1`, and `MRR=1`.
- Asset display and runtime switching remain covered by generated asset and asset selection tests. The current focused suite validates player-safe generated backdrops, reviewed scene exposure, internal asset isolation, scene/soundscape matching, reward art, item art, alpha-channel PNGs, and server presentation manifest loading.
- Sound and TTS gates are green. Soundscape tests cover weather/location family selection, stale-context guards, scene mismatch guards, clear-weather suppression, localized reasons, combat-tension override, and deterministic fallback. TTS tests cover browser fallback, local open-source provider placeholders, role voice profiles, speaker mapping, language-aware utterance plans, and voice picker structure.
- State and log gates are green. State summary tests cover bounded progress, media state, memory/review context, NPC intent, clocks, consequences, and Chinese labels. Log template and production-depth checks cover structured common fields, bilingual templates, queryable actions/results, AI DM review fields, memory diagnostics, media logs, and redaction.
- The older `test-report.md` blockers for `inventoryActionAvailability` and soundscape mismatch no longer reproduce on this current working tree; full `npm run test` is green.

## Residual Risk

- This pass is automated-test based. It did not perform a fresh browser walkthrough for runtime audio unlock behavior, mobile layout, or actual Web Speech playback.
- `npm run harness:check` still needs a separate run by an agent allowed to accept its default report-writing behavior, or the Harness script should be adjusted to support no-report eval mode.
