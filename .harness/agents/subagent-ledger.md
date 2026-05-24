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

## Rules

- Assign disjoint write ownership before asking a worker to edit files.
- Explorers should not edit files.
- Do not close a running subagent until its status is complete or the work is explicitly cancelled.
- Main agent owns integration, final gates, and branch merges.
