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

## Rules

- Assign disjoint write ownership before asking a worker to edit files.
- Explorers should not edit files.
- Do not close a running subagent until its status is complete or the work is explicitly cancelled.
- Main agent owns integration, final gates, and branch merges.
