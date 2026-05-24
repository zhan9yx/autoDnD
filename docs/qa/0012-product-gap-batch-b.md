# 0012 Product Gap Batch B QA

Date: 2026-05-25
Worker role: Product gap landing worker B
Runtime code touched: no
Public UI files touched: no

## Scope

This pass turns the next visible product gaps into acceptance-ready backlog without changing runtime behavior. It extends `docs/REQUIREMENTS_200.md` from 260 rows to 280 rows and keeps the existing requirement table contract intact.

The batch is intentionally small enough for parallel implementation workers to pick up without fighting over `public/**`. It focuses on audio, character switching, backpack semantics, event management, AI DM randomness, SRD style knowledge boundaries, onboarding, weather and season variety, replay proof, and real browser voice handling.

## Requirements Added

| Range | Count | Area | Status | Testability |
| --- | ---: | --- | --- | --- |
| `REQ-261` through `REQ-263` | 3 | Environment audio | Backlog landed and ready for runtime work | Can be tested through deterministic soundscape unit tests, static UI checks, and browser mute or status QA. |
| `REQ-264` through `REQ-266` | 3 | Character switching and turn guidance | Backlog landed and ready for runtime work | Can be tested through action ownership fixtures, no-local-token browser QA, and active-turn copy checks. |
| `REQ-267` through `REQ-268` | 2 | Backpack and quest item semantics | Backlog landed and ready for runtime work | Can be tested through item catalog unit tests and buy, sell, use, equip, keep browser flows. |
| `REQ-269` through `REQ-270` | 2 | Event manager and trigger fixtures | Backlog landed and ready for runtime work | Can be tested through deterministic event fixtures and replay assertions. |
| `REQ-271` through `REQ-272` | 2 | AI DM randomness | Backlog landed and ready for runtime work | Can be tested through seeded campaign evaluation and structured AI event assertions. |
| `REQ-273` through `REQ-274` | 2 | SRD style knowledge QA | Backlog landed and ready for runtime work | Can be tested through source-id prompt snapshots, no-long-copy scans, and generated answer samples. |
| `REQ-275` through `REQ-276` | 2 | Beginner onboarding | Backlog landed and ready for guide or UI implementation | Can be tested through guide coverage tests and first-round browser happy path QA. |
| `REQ-277` through `REQ-278` | 2 | Weather, season, and replay proof | Backlog landed and ready for data or runtime work | Can be tested through scene matrix fixtures and replay transition assertions. |
| `REQ-279` through `REQ-280` | 2 | Real voice variety | Backlog landed and ready for browser QA implementation | Can be tested through speech synthesis stubs and muted or delayed voice browser checks. |

Explicit row ledger for test and handoff traceability:

- `REQ-261` Ambient Audio Layer Mixer
- `REQ-262` Scene Audio Transition Cues
- `REQ-263` Ambient Audio Accessibility Controls
- `REQ-264` Character Switch Integrity Matrix
- `REQ-265` Companion Control Policy
- `REQ-266` Turn Intent Coach
- `REQ-267` Inventory Action Reason Labels
- `REQ-268` Item Memory And Quest Flags
- `REQ-269` Event Resolution Journal
- `REQ-270` Event Trigger Test Fixtures
- `REQ-271` Random Table Scenario Seeds
- `REQ-272` AI DM Variance Telemetry
- `REQ-273` Rules Knowledge Brief Builder
- `REQ-274` Knowledge Citation QA Surface
- `REQ-275` Starter Character Archetypes
- `REQ-276` Guided First Round Script
- `REQ-277` Weather Season Scene Matrix
- `REQ-278` Scene Change Replay Proof
- `REQ-279` Real Voice Profile Registry
- `REQ-280` Voice Assignment Browser QA

## Acceptance Status

- Completed: 20 new requirements are present as sequential `REQ-261` through `REQ-280` rows.
- Completed: every new row has a product goal, main acceptance criteria, version tag, and module tag.
- Completed: `docs/ROADMAP.md` now records the second product-gap batch and its runtime follow-up boundary.
- Completed: `tests/requirements.test.js` now checks the 280-row floor, the new row range, required topic coverage, roadmap traceability, and this QA record.
- Completed: `tests/maturity.test.js` now checks that the roadmap keeps the `REQ-261` through `REQ-280` batch visible.
- Not completed in this worker: runtime code for audio mixing, voice assignment, event fixtures, companion control, knowledge briefs, and browser automation.

## Runtime Follow-up Needed

Implementation workers should split the next code batch by module:

- Audio worker: implement ambience layer mixer, transition cue guard, accessibility state, and voice profile registry.
- Character worker: implement switch integrity matrix, companion control policy, and turn intent coach data.
- Inventory worker: implement reason labels and quest item flags in catalog, state, and UI flows.
- Event worker: implement event resolution journal and deterministic trigger fixtures.
- AI worker: implement scenario seeds, variance telemetry, and knowledge brief builder with source id guardrails.
- QA worker: implement browser voice assignment QA, weather or season matrix replay proof, and guided first-round flow evidence.

## Verification

Focused commands for this batch:

```bash
node --test tests/requirements.test.js tests/maturity.test.js
git diff --check
```

Expected result: both commands pass before this batch is handed back to the main integration gate.
