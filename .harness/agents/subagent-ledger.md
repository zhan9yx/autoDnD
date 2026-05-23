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

## Rules

- Assign disjoint write ownership before asking a worker to edit files.
- Explorers should not edit files.
- Do not close a running subagent until its status is complete or the work is explicitly cancelled.
- Main agent owns integration, final gates, and branch merges.
