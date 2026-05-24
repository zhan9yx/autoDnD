# Subagent Ledger

Use this file when a task is split across multiple agents.

| Agent | Scope | Write Ownership | Status | Close Condition |
| --- | --- | --- | --- | --- |
| Avicenna | Technical architecture research | None | Completed | Result incorporated into docs |
| Curie | Harness design research | None | Completed | Result incorporated into Harness |
| Dirac | UI/UX requirements for mature table polish | None | Completed | Requirements incorporated into change 0005 |
| Heisenberg | Core soundscape strategy and tests | `src/core/soundscape.js`, `tests/soundscape.test.js` | Completed | Patch reviewed and integrated |
| Hubble | Generated asset adaptation and manifest analysis | None | Completed | Recommendations incorporated into implementation |
| Boole | New Chinese player no-scroll review | None | Completed | 25 issues incorporated into feedback 0006 |
| Socrates | Host/DM no-scroll review | None | Completed | 24 issues incorporated into feedback 0006 |
| Mill | Mobile player no-scroll review | None | Completed | 24 issues incorporated into feedback 0006 |
| Gauss | Heavy TRPG user no-scroll review | None | Completed | 24 issues incorporated into feedback 0006 |
| Pauli | Usability/accessibility no-scroll review | None | Completed | 24 issues incorporated into feedback 0006 |
| Schrodinger | 500-scene art taxonomy for imagegen library | None | Completed | Taxonomy incorporated into 0007 catalog |
| Ptolemy | Generated asset audit and replacement scope | None | Completed | Audit incorporated into 0007 implementation |
| Raman | Scene metadata test coverage | `tests/generatedAssets.test.js` | Completed | Patch reviewed and integrated |
| Cicero | UI description surfacing for scene assets | `public/app.js`, `public/index.html`, `public/styles.css`, `public/i18n.js` | Completed | Patch reviewed and integrated |
| Newton | Reusable scene asset evaluation workflow | None | Interrupted | No final result after interrupt; main integration covered workflow in `docs/ASSET_EVALUATION.md`; not closed while running |
| Banach | Soundscape-to-scene mapping plan | None | Completed | Mapping incorporated into scene catalog |
| Bacon | Product review for state flow and media polish | None | Completed, closed | Requirements incorporated into change 0009 |
| Plato | UI/UX review for player table polish | None | Completed, closed | Requirements incorporated into change 0009 |
| Euler | Test/evaluation review for media, voice, and state | None | Completed, closed | Coverage incorporated into change 0009 |
| Peirce | Test worker for TTS, ambience, static UI structure | `tests/` only | Completed, closed | Patch reviewed and integrated |
| Arendt | Low-context player feedback for v10 table polish | None | Completed, closed | P0/P1 feedback incorporated into change 0010 |
| Nietzsche | Product requirements for v10.1-v10.10 | None | Completed | Requirements incorporated into change 0010 |
| Kepler | UI/UX review for Settings, character entry, and one-screen play | None | Completed | Requirements incorporated into change 0010 |
| Kant | Structured log schema and transcript compatibility review | None | Completed | Log plan incorporated into change 0010 |
| Pascal | Soundscape and voice interaction review | None | Completed | Soundscape plan incorporated into change 0010 |
| Hooke | Asset library audit and character option sheet planning | None | Completed | Result incorporated into asset registry |
| Cicero | Python/Pillow Rosetta arm64 remediation | None | Completed, closed | Safe arm64 workaround documented and ingester guard added |
| Rawls | 3000+ asset taxonomy and metadata system | None | Completed, closed | Asset taxonomy incorporated into docs/code |
| Wegener | Open/local voice expansion research | None | Completed, closed | TTS plan incorporated into voice roadmap/code |
| Beauvoir | Player inventory, memo, dice, chat, and party status spec | None | Completed, closed | Requirements incorporated into implementation |
| Zeno | Weather visual and ambience layer composition | None | Completed, closed | Soundscape/weather implementation updated |
| Huygens | Harness/QA gates for v10 | None | Completed, closed | Test plan incorporated into change 0010 |
| Harvey | Worker: player-facing table UI, personal drawer, inventory/memo, party bars, chat channel, dice panel | `public/index.html`, `public/app.js`, `public/styles.css`, `public/i18n.js`, frontend UI tests | Completed, closed | Patch reviewed, integrated, and browser-verified |
| Dewey | Worker: soundscape/weather layers and smart ambience switching | `src/core/soundscape.js`, `public/ambience.js`, soundscape/ambience tests | Completed, closed | Patch reviewed, integrated, and soundscape tests pass |
| Goodall | Worker: structured AI DM log templates | `src/core/logTemplates.js`, `tests/logTemplates.test.js` | Completed, closed | Patch reviewed, integrated, and log tests pass |
| Franklin | Worker: inventory/economy/memo route tests and old inventory assertion migration | `tests/inventoryEconomy.test.js`, `tests/gameEngine.test.js`, server route tests | Completed, closed | Patch reviewed, integrated, and inventory/economy tests pass |
| Locke | Worker: lightweight bilingual TTS profile expansion | `src/core/ttsProfiles.js`, `public/tts.js`, TTS tests, `docs/I18N_TTS.md` | Completed, closed | Patch reviewed, integrated, and TTS tests pass |
| Hooke | Worker: generated asset pipeline docs and manifest inventory checks | `docs/ASSET_PIPELINE.md`, `docs/ASSET_INVENTORY.md`, `scripts/ingest-imagegen-sheet.py`, generated asset tests | Completed, closed | Patch reviewed, integrated, and asset checks pass |
| Sartre | Worker: player-facing UI QA and one-screen interaction polish | `public/app.js`, `public/styles.css`, player UI tests | Completed, closed | Patch reviewed, integrated, and desktop/mobile browser QA pass |
| Pasteur | Worker: structured log and narration punctuation regression | `src/core/localization.js`, `tests/localization.test.js` | Completed, closed | Patch reviewed, integrated, and localization/game/log tests pass |
| Mendel | Worker: asset/TTS player settings and catalog QA | `public/app.js`, `tests/publicTts.test.js`, asset/audio tests | Completed, closed | Patch reviewed, integrated, TTS dropdown browser-verified, and worker closed |
| Nash | Worker: scene asset semantic matching QA | `src/core/assetSelection.js`, asset selection tests | Completed, closed | Patch reviewed, integrated, and rainy archive visual mismatch regression passes |
| Aristotle | Worker: v11 generated asset schema, sheet 009/010 metadata, and asset inventory tests | `assets/generated/manifest.json`, `docs/ASSET_INVENTORY.md`, `docs/ASSET_PIPELINE.md`, `scripts/ingest-imagegen-sheet.py`, generated asset tests | Completed, closed | Patch reviewed; sheet 009/010 registered and generated asset tests pass |
| Fermat | Worker: v11 player UI for character cards, market drawer, progression, and one-screen layout | `public/index.html`, `public/app.js`, `public/styles.css`, `public/i18n.js`, player UI tests | Completed, closed | Patch reviewed; UI tests and browser player flow pass |
| Ramanujan | Worker: v11 item economy, equipment, progression, and state invariants | `src/core/itemCatalog.js`, `src/core/gameEngine.js`, `src/core/stateMachine.js`, `src/core/optionAssets.js`, economy/state tests | Completed, closed | Patch reviewed; economy/progression tests pass |
| Chandrasekhar | Worker: v11 reusable production-depth evaluation gates | `scripts/`, `evals/`, `tests/productionDepth.test.js`, v11 test report | Completed, closed | Patch reviewed; production-depth eval passes |
| Erdos | Worker: v11 soundscape/TTS alignment and role voice coverage | `src/core/soundscape.js`, `src/core/ttsProfiles.js`, `public/ambience.js`, `public/tts.js`, sound/TTS tests | Completed, closed | Patch reviewed; audio/TTS tests pass |
| Bernoulli | Worker: v11 low-context player QA and regression capture | `.harness/changes/0011-production-depth/`, tests | Completed, closed | Feedback incorporated; QA regression tests added |
| Raman | Worker: v11 second batch scene and NPC token asset registration | `assets/generated/manifest.json`, generated asset docs/tests | Interrupted | Lost after user interruption before status could be collected |
| Darwin | Worker: v11 batch asset registration for sheets 011-016 | `assets/generated/manifest.json`, generated asset docs/tests | Completed, closed | Patch reviewed; sheets 011-016 registered and generated asset tests pass |
| Zeno | Worker: v11 batch asset registration for sheets 017-018 | `assets/generated/manifest.json`, generated asset docs/tests | Running | Close after sheets 017-018 are sliced, registered, and tested |
| Lagrange | Worker: v11 localized economy labels | `src/core/itemCatalog.js`, `src/core/gameEngine.js`, economy tests | Running | Close after Chinese market currency labels pass regression |

## V11 Current-Round Coordination - 2026-05-24 19:00 CST

This QA/process pass did not close existing running workers or edit their product files. It records the current six-lane handoff state from the latest visible working tree.

| Lane | Current Task | Observed Status | Risk / Unfinished Item |
| --- | --- | --- | --- |
| Asset/runtime binding | Keep sheets 023-028 registered through semantic runtime surfaces, not galleries. | Partly verified by generated-asset tests and browser market/backpack art. | Stage scene currently uses `assets/generated/scenes/aidm-macro-scene-003-01.png`, which reads as a multi-panel/collage image in the player stage; confirm it is a sliced player-safe scene, not a sheet-like dump. |
| UI/localization | Remove Chinese player-surface English/debug leaks and keep one-screen table. | Improved: main labels use Chinese and page scroll stayed locked at 720px. | Character setup still exposes `builder.*` keys and English native selects; state still exposes `No report yet.` and dice text uses `DC`; action composer remains visually cramped. |
| Inventory/economy | Keep market/backpack/use/equip state coherent with localized labels. | Market prices and disabled reasons were localized; backpack and item detail showed art after reload. | Buying `睡眠帷幕法卷` first surfaced `spellArtMarkup is not defined`; wallet changed before the drawer refreshed, and the item appeared only after reload. Smoke also fails on the starting weapon summary assertion. |
| State/evaluation | Keep production-depth gates deterministic and scene/audio/state coherent. | `npm run eval:production-depth` is indirectly covered by the earlier full gate notes, and state drawer is more player-facing. | Current `node --test tests/soundscape.test.js` fails: expected `tavern`, actual `toasting-cheers`; `npm run harness:check` stops at the same internal test failure. |
| TTS/audio | Expand role voices and productize ambience status. | Settings exposes voice profiles, sliders, ambience toggle, and localized soundscape reason after scene context. | Audio status remains inside Settings; voice list still includes technical/provider-ish strings such as `NPC`, `zh-CN`, and `zh-TW`. |
| QA/process | Run gates and low-context browser QA on current working tree. | Completed this pass and appended results to v11 Harness docs. | Release remains blocked by failing smoke/harness gates and the runtime purchase refresh error. |

## V11 Final Coordination Update - 2026-05-24

| Lane | Final Status | Evidence |
| --- | --- | --- |
| Asset/runtime binding | Completed and closed. Sheets 023-026 are player-safe cutouts; sheets 027-028 are player-safe scene backdrops; default x86_64 Python now re-execs to bundled arm64 Python before Pillow import. | `node --test tests/generatedAssets.test.js tests/assets.test.js` passed in the asset worker; full `npm test` passed 165/165 in main thread. |
| UI/localization | Completed and closed. Player UI remains player-scoped, hides character creation after seating, uses drawers for secondary controls, and renders image-backed character/spell/item surfaces without exposing a raw asset gallery. | UI worker: 11/11 targeted UI tests passed; main thread full gate passed. |
| Inventory/economy | Completed and closed. Starting equipment summary, market buy/sell, item use, equip, memo, localized economy labels, and asset refs are covered. | Economy worker: 27/27 targeted tests passed; main thread smoke confirmed equipped `staff` and `robe`. |
| State/log/evaluation | Completed and closed. AI DM logs are structured and searchable; state trackers cover quest/danger/clue/consequence/scene/NPC intent; memory and production-depth evaluators expose reusable diagnostics. | State/eval worker: 22/22 targeted tests passed; full gate passed memory recall and production-depth checks. |
| TTS/audio | Completed and closed. Soundscape families cover weather, nature, water, fire, urban, tavern/social layers, and more role voices; clear scene assets suppress stale storm ambience. | Audio worker: 28/28 targeted tests passed; main thread full gate passed. |
| QA/process | Completed and closed for this pass. Intermediate failures were retained as history; final main-thread verification supersedes them. | `npm run harness:check` passed with localhost permission on the final tree. |

## Rules

- Assign disjoint write ownership before asking a worker to edit files.
- Explorers should not edit files.
- Do not close a running subagent until its status is complete or the work is explicitly cancelled.
- Main agent owns integration, final gates, and branch merges.
