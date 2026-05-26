# Tasks

This task list belongs to Worker 07 for the 0021 rich campaign backlog proposal. It records documentation and planning work only.

## Harness Package

- [x] Confirm current branch and avoid reverting parallel worker changes.
- [x] Read current Harness change format and required files.
- [x] Create `.harness/changes/0021-mvp-to-rich-campaign-experience/spec.md`.
- [x] Create `.harness/changes/0021-mvp-to-rich-campaign-experience/requirements.md`.
- [x] Create `.harness/changes/0021-mvp-to-rich-campaign-experience/tasks.md`.
- [x] Create `.harness/changes/0021-mvp-to-rich-campaign-experience/review.md`.
- [x] Create `.harness/changes/0021-mvp-to-rich-campaign-experience/test-report.md`.

## Requirement Ledger

- [x] Add `REQ-401` through `REQ-900` as 500 sequential follow-up requirements.
- [x] Cover `Table UI/UX` with `REQ-401` through `REQ-425`.
- [x] Cover `Onboarding And Guidance` with `REQ-426` through `REQ-450`.
- [x] Cover `AI DM Narrative` with `REQ-451` through `REQ-475`.
- [x] Cover `AI DM Guardrails And Prompts` with `REQ-476` through `REQ-500`.
- [x] Cover `Long Term Memory` with `REQ-501` through `REQ-525`.
- [x] Cover `Knowledge Retrieval And Canon` with `REQ-526` through `REQ-550`.
- [x] Cover `Logs Audit And Replay` with `REQ-551` through `REQ-575`.
- [x] Cover `Party And Character Management` with `REQ-576` through `REQ-600`.
- [x] Cover `Character Progression` with `REQ-601` through `REQ-625`.
- [x] Cover `Combat And Rules` with `REQ-626` through `REQ-650`.
- [x] Cover `Enemies And Encounter Design` with `REQ-651` through `REQ-675`.
- [x] Cover `Economy And Market` with `REQ-676` through `REQ-700`.
- [x] Cover `Inventory Crafting And Items` with `REQ-701` through `REQ-725`.
- [x] Cover `Scenes Exploration And World` with `REQ-726` through `REQ-750`.
- [x] Cover `World Factions And Quests` with `REQ-751` through `REQ-775`.
- [x] Cover `Audio Voice And Media` with `REQ-776` through `REQ-800`.
- [x] Cover `Stability Performance And Data Resilience` with `REQ-801` through `REQ-825`.
- [x] Cover `Multiplayer Collaboration` with `REQ-826` through `REQ-850`.
- [x] Cover `Accessibility Localization And Mobile` with `REQ-851` through `REQ-875`.
- [x] Cover `Operations Release And Trust` with `REQ-876` through `REQ-900`.
- [x] Keep each row as a feature or engineering capability rather than a repair ticket.
- [x] Include acceptance criteria and risk or dependency in every row.

## Verification

- [x] Run an internal generation assertion for exact count, sequential IDs, no duplicate IDs, no pipe characters inside cells, and no disallowed repair-ticket wording in ledger rows.
- [x] Run `git diff --check -- .harness/changes/0021-mvp-to-rich-campaign-experience/spec.md .harness/changes/0021-mvp-to-rich-campaign-experience/requirements.md .harness/changes/0021-mvp-to-rich-campaign-experience/tasks.md .harness/changes/0021-mvp-to-rich-campaign-experience/review.md .harness/changes/0021-mvp-to-rich-campaign-experience/test-report.md`.
- [x] Run `npm run harness:status`.
- [x] Record final verification output in `test-report.md`.
- [x] Reviewer audit reran requirement-count scripts and full `npm run harness:check`.
- [x] Reviewer audit normalized `review.md` findings to the Harness priority/evidence/suggested-action format.

## Future Implementation Boundary

- [ ] Split `REQ-401` through `REQ-900` into smaller implementation changes with owners, tests, and browser evidence.
- [ ] Add automated requirement continuity coverage if this 0021 ledger is promoted into the global product requirements document.
