# Tasks

This task list is the Worker E integration ledger for 0013 Harness and QA documentation. It records partial implementation evidence from sibling workers, but it does not claim public readiness and does not claim `REQ-281` through `REQ-400` are fully implemented.

## Worker E Documentation Sync

- [x] Sync `.harness/changes/0013-public-productization/tasks.md` with the current multi-worker 0013 state.
- [x] Sync `.harness/changes/0013-public-productization/test-report.md` with focused verification evidence and remaining gate blockers.
- [x] Sync `.harness/changes/0013-public-productization/review.md` with the partial-implementation approval boundary.
- [x] Sync `docs/qa/0013-*.md` so stale blockers such as missing `review.md` and resolved spell expectation failures are not treated as current facts.
- [x] Keep Worker E changes documentation-only within the requested write scope.
- [x] Reconcile the 0013 spec and roadmap language so they reflect current partial runtime implementation instead of saying the entire 0013 change is planning-only.

## Completed Inputs Recorded

- [x] REQ-400 backlog: `docs/REQUIREMENTS_200.md` contains `REQ-281` through `REQ-400` as acceptance-ready product backlog requirements.
- [x] Harness document set: `spec.md`, `review.md`, `tasks.md`, and `test-report.md` exist for 0013.
- [x] UI density: sibling UI work landed a collapsible table state strip, compact party rail, dense log mode, full log drawer path, and lightweight stage dynamics.
- [x] Auth and room API: sibling server work landed local register/login/session/logout APIs, session-owned rooms, password rooms, and host-approval pending/approve/reject API paths.
- [x] Audio and scene variety: sibling audio work landed local browser-synth ambience profiles, weather layers, social ambience, and deterministic soundscape selection updates.
- [x] Spell and warrior systems: sibling rules work landed expanded spell definitions, spell scroll catalog entries, class starter spell pools, warrior specializations, and progression hooks.
- [x] Worker B focused spell/warrior closure: starting spell cards now mean `known` plus `starting-available`, and the visible warrior setup exposes Weapon Master, Dual Wielder, and Berserker specialization choices with rules-backed effects.
- [x] Browser QA planning: QA-BROWSER added browser-facing coverage plans; Worker H later converted the former account/access-control TODO skeletons into executable API plus static DOM contract tests.
- [x] Auth storage hardening: Avicenna upgraded local user passwords, room passwords, and session token indexes to versioned `scrypt` formats with legacy SHA-256 migration coverage.
- [x] Integrated release gate evidence: Worker N reran `npm run harness:check` with localhost permission after Worker H and Avicenna; lint, 262/262 unit tests, memory eval, production-depth eval, smoke, campaign simulation, and Harness passed.

## Not Implemented Or Not Closed

- [x] Account registration/login UI and API coverage are present, and Worker A recorded live browser registration plus reload session-restore evidence in `docs/qa/0013-browser-current.md`.
- [x] Password entry and host-approval lobby UI hooks plus API coverage are present, and AD recorded final protected-room live browser screenshots for visible password entry, wrong-password feedback, correct-password seating, approval pending state, host queue controls, and approved-player refresh recovery.
- [x] Rejection is now final live-browser-click verified by the 0013 public-productization worker: the visible host queue showed `Vale`, the worker clicked `Reject`, the queue cleared, and browser warning/error logs were empty.
- [ ] Live browser visual QA is not recorded for desktop/mobile no-overlap checks after the UI density changes.
- [ ] Browser audio compatibility is not fully recorded for autoplay restrictions, delayed or missing speech voices, background tabs, and mute persistence.
  - Worker F recorded static/unit automation evidence for autoplay-safe opt-in ambience start, missing Web Audio unsupported UI state, delayed or missing speech voice fallback, local `speechSynthesis` fallback, and mute/voice preference persistence in `docs/qa/0013-audio-browser.md`.
  - The 0013 public-productization worker added live Chrome evidence for foreground Web Audio availability, ambience opt-in toggle, speechSynthesis availability, visible voice toggle, voice-option loading, and voice enabled persistence.
  - Background-tab behavior and actual audible-output quality remain open; no browser-specific Safari/mobile voice matrix is claimed.
- [ ] Spell and warrior browser flows are not recorded for the full set of character creation, specialization selection, scroll learning, spell casting, visual binding, and balance feel.
  - Worker F recorded partial static/API-focused evidence for starting spell visible binding and warrior specialization selection in `docs/qa/0013-spell-warrior-browser.md`.
  - The 0013 public-productization worker added live Chrome evidence for mage starting spell cards, warrior specialization selection, warrior join, scene start, action submit, scroll purchase visibility, scroll Use click, and learned-spell visual binding. Balance feel and a broader class/device matrix remain open.
- [ ] Deployment readiness in `REQ-387` through `REQ-400` remains backlog-only: staging parity, secrets validation, observability, rate limits, rollback, support, legal, load, and launch evidence are not closed.
- [ ] Public readiness remains blocked until full gates, browser evidence, deployment evidence, and accepted residual risks exist.

## Current Mainline Gate Follow-Up

- [x] Re-run the rules/assets focused batch after integration; `tests/assetSelection.test.js` now passes in the latest Worker E rerun.
- [x] Rerun full `npm run harness:check` outside the sandbox after localhost `EPERM`; Harness passed.
- [x] Record that the latest full `npm run test` evidence is 264 tests total, 264 passed, 0 TODO, 0 failed, superseding earlier Worker H and Avicenna 262-test baselines.
- [x] Record that legacy SHA-256 auth/room secret storage risk was addressed by Avicenna's `scrypt` migration work.
- [x] Record that Worker N completed the post-H/post-scrypt `npm run harness:check` rerun with localhost permission and `harness check ok`.
- [x] Run a live browser smoke on desktop and mobile widths for the no-account player flow, then attach evidence.
- [x] Run visible-UI browser verification for auth and room-access paths; use API-assisted setup only where visible UI remains incomplete.
- [x] Replace stale protected-room live-browser blocker wording in `docs/qa/0013-browser-plan.md` after the AD recheck.
- [x] Run the remaining 0013 public-productization browser closure pass for host rejection click-through, foreground audio controls, and spell/warrior visible flow; attach screenshots under `/private/tmp/aidm-0013-public-productization-worker/`.

## Resolved Earlier Blockers

- [x] `.harness/changes/0013-public-productization/review.md` now exists, so the earlier missing-review Harness blocker is resolved.
- [x] `src/core/rules.js` and `src/core/gameEngine.js` import cleanly in the current QA-BROWSER record.
- [x] Earlier mage starting-spell test mismatches are no longer current in Worker E focused reruns.
- [x] Earlier asset binding count failure is no longer current in the latest Worker E focused rerun and full Harness rerun.
- [x] The earlier browser-only `test.todo` records are no longer current; Worker H replaced them with executable API/static contract coverage.
