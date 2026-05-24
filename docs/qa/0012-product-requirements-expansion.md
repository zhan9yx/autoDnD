# 0012 Product Requirements Expansion QA

Date: 2026-05-25
Worker role: Product/requirements subagent
Runtime code touched: no

## Scope

This pass turns the current product gaps and user-testing asks into acceptance-ready backlog. It extends `docs/REQUIREMENTS_200.md` from 200 rows to 260 rows while keeping the existing table contract used by `tests/requirements.test.js`.

## Coverage Added

- `REQ-201` through `REQ-203`: product requirement ledger, product subagent triage, and user-testing synthesis.
- `REQ-204` through `REQ-208`: closed-loop play and scene transition verification.
- `REQ-209` through `REQ-214`: weather, season, weather mechanics, ambience matrix, and visible soundscape status.
- `REQ-215` through `REQ-217`: multiple TTS voices, active-speaker cueing, and browser voice fallback.
- `REQ-218` through `REQ-224`: richer character setup, party relationships, character switching, active-player spotlight, nonlinear turn guidance, intent suggestions, and action consequence preview.
- `REQ-225` through `REQ-230`: AI DM randomness controls, randomness safety bounds, proposal variety evaluation, event dashboard, clock map, and timed interruptions.
- `REQ-231` through `REQ-235`: inventory onboarding, item semantics, equipment preview, market confirmation, and backpack browser QA.
- `REQ-236` through `REQ-240`: source registry, SRD ingestion boundary, attribution, IP guardrail, and rules retrieval evaluation.
- `REQ-241` through `REQ-246`: beginner tutorial expansion, step-by-step manual, starter player operations, host guidebook, and recovery manual.
- `REQ-247` through `REQ-260`: scene variety, seasonal variants, asset reuse, exploration, downtime, quest handoff, NPC memory, faction scheduling, combat-to-exploration transition, dialogue resolution, multi-character ownership, token recovery QA, seat transfer, and screenshot cadence.

## Source Review

Official source reviewed: `https://www.dndbeyond.com/srd`.

Observed source facts used for planning:

- The page identifies SRD v5.2.1 as rules content for creator use under Creative Commons.
- The page lists English SRD v5.2.1 as published on 2025-05-01 and says the page was last updated on 2026-03-02.
- The page says SRD 5.1 and SRD 5.2 are available under Creative Commons CC-BY-4.0 with attribution requirements.
- The page also describes protected brand identity exclusions and omitted content, so AIDM requirements now call for source registration and IP guardrails before retrieval ingestion.

## Acceptance Check

- Requirement rows remain sequential and table-compatible.
- New requirements do not claim implementation is complete.
- Runtime code and asset files are not changed by this product pass.
- Roadmap and Harness tasks record the expansion so implementation workers can pick scoped follow-up changes.

## Verification

Command run after this edit:

```bash
node --test tests/requirements.test.js tests/maturity.test.js
```

Result: passed, 9 tests, 9 passed.

The focused command is sufficient for this product/requirements pass because it validates the requirement table contract and 0012 Harness documentation constraints.
