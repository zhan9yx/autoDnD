# 0013 Requirements 400 QA

Date: 2026-05-25
Worker role: REQ-400 product requirements plus Worker E documentation sync
Runtime code touched by Worker E: no
Public UI files touched by Worker E: no
Bugfix or micro patch: no

## Scope

The REQ-400 pass extends `docs/REQUIREMENTS_200.md` from 280 rows to 400 rows. Those rows are acceptance-ready backlog requirements. This QA record does not claim `REQ-281` through `REQ-400` are implemented, and it does not approve public readiness.

Worker E synchronized the 0013 Harness and QA documents with partial evidence from sibling workers:

- UI density and compact table layout landed in public UI code.
- Auth/session and room access-control APIs landed in server/storage code.
- Audio scene variety landed in browser-synth ambience and soundscape code.
- Spell expansion and warrior specializations landed in rules, catalog, and engine code.
- Browser QA planning and static/API checks landed, but live browser verification is still open.

## Coverage Status

| Range | Count | Area | Current Status | Remaining Evidence |
| --- | ---: | --- | --- | --- |
| `REQ-281` through `REQ-292` | 12 | UI density and compact table ergonomics | Backlog landed; partial runtime UI landed. | Live desktop/mobile browser no-overlap, focus, resize, and screenshot evidence. |
| `REQ-293` through `REQ-304` | 12 | Party and log layout | Backlog landed; compact party rail and dense/full log paths partially landed. | Long-log browser QA, mobile panel checks, and replay/log channel verification. |
| `REQ-305` through `REQ-318` | 14 | Scene visual dynamics | Backlog landed; lightweight stage dynamics and scene summaries partially landed. | Browser screenshots, reduced-motion QA, asset preload behavior, and visual layer acceptance. |
| `REQ-319` through `REQ-332` | 14 | Audio naturalness and weather layers | Backlog landed; local Web Audio/weather/social ambience partially landed. | Browser autoplay, voice availability, background tab, mute persistence, and compatibility QA. |
| `REQ-333` through `REQ-348` | 16 | Spell systems | Backlog landed; expanded spell definitions and scrolls partially landed. | Browser spell use, visual bindings, sustained/interrupt flows, and balance evals. |
| `REQ-349` through `REQ-362` | 14 | Warrior specializations | Backlog landed; specialization and progression mechanics partially landed. | Browser character creation/specialization UI, encounter balance, and progression evidence. |
| `REQ-363` through `REQ-374` | 12 | Auth and session hardening | Backlog landed; local prototype auth/session APIs and static UI hooks partially landed. | Live browser login/register, session recovery browser QA, revocation/security review. |
| `REQ-375` through `REQ-386` | 12 | Room password, approval, and create-room hardening | Backlog landed; password and host-approval APIs plus static UI hooks partially landed. | Password/approval live browser flow, pending-user blocking in browser, invite/capacity/rate-limit evidence. |
| `REQ-387` through `REQ-400` | 14 | Deployment and public readiness | Backlog only. | Staging, secrets, migrations, observability, abuse controls, rollback, support, legal, load, and launch evidence. |

## Acceptance Status

- Completed: `REQ-281` through `REQ-400` are present as sequential requirement rows.
- Completed: every new row is a product capability or major requirement area, not a bugfix or tiny implementation task.
- Completed: 0013 spec, review, tasks, test report, QA records, roadmap traceability, and focused tests document the backlog boundary.
- Completed: sibling workers have partial implementation evidence for UI density, auth APIs, room access APIs, audio scene variety, spells, and warrior archetypes.
- Completed: current integrated automated baseline passed `npm run test` with 262/262 tests, 0 failed, 0 TODO.
- Not completed: full implementation of `REQ-281` through `REQ-400`.
- Not completed: live browser QA for account/auth/access-control, desktop/mobile layout, and audio compatibility.
- Not completed: deployment and launch readiness evidence.

## Worker E Verification

```bash
node --test tests/requirements.test.js tests/maturity.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/noScrollUi.test.js
```

Result: passed, 42 tests, 42 passed.

```bash
node --test tests/serverRoutes.test.js tests/releaseGateFlow.test.js tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js
```

Result after Worker H integration: passed hard assertions with no TODO at the earlier 262-test baseline. The final AK/Hilbert full `npm run test` baseline is 264 tests total, 264 passed, 0 failed, 0 TODO.

```bash
node --test tests/assetSelection.test.js tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js
```

Result after full integration: passed, 48 tests total, 48 passed.

```bash
npm run harness:check
```

Result: default-sandbox run failed with localhost `EPERM` in server-backed unit tests; escalated rerun passed lint, full unit tests, memory eval, production-depth eval, smoke, campaign simulation, and ended with `harness check ok`.

## Required Mainline Follow-Up

- Run live browser QA for no-account player flow, auth/session persistence, password rooms, host approval, UI density, and audio compatibility.
- Keep `REQ-387` through `REQ-400` open until deployment and launch evidence exists.
