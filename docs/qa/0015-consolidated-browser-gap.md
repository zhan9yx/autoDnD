# 0015 Consolidated Browser Gap

Date: 2026-05-25
Worker: W
Scope: feasibility assessment and minimum evidence plan for `GATE-002` consolidated browser acceptance after Worker S indexed the Worker J refresh-recovery fix.

## Decision

No additional 0015 task can be closed from the current evidence set.

The local refresh-recovery P1 is fixed and rechecked for the fresh-browser `?room=<id>` path, and the visual checklist evidence is indexed. That is enough to remove the refresh failure as a standalone unresolved P1 in the fresh-browser track, but it is not enough to close `GATE-002`, BUG-0012, or any public-readiness gate.

`GATE-002` remains blocked until a complete consolidated 0014 browser acceptance pack exists with desktop and mobile evidence for the full visible-user flow.

## Evidence Already Covered

| Area | Current Evidence | Closure Boundary |
| --- | --- | --- |
| Fresh open-room loop | `docs/qa/0015-fresh-browser-acceptance.md` records fresh gateway load, account registration, open room creation, character join, scene start, chat, first action, state strip, State/Log/Team/My character/Market/Settings/Guide drawers, market purchase attempt, and backpack revisit. | Useful local browser evidence only. It does not include the full 0014 protected-room, multi-context, scene/audio, spell/class, and desktop/mobile matrix. |
| Refresh recovery | Worker J appendix in `docs/qa/0015-fresh-browser-acceptance.md` records `http://127.0.0.1:4216/?room=room_497dde73cd9f4d78` reload recovery with gateway hidden, table visible, local character controls enabled, and clean browser logs. | Fixed/rechecked for the local fresh-browser path. It still must be included in the consolidated pack before `GATE-002` can pass. |
| Visual checklist | `docs/qa/0015-visual-checklist.md` indexes Worker B screenshots for desktop, tablet, `<=430px` mobile, and 375px mobile checks. | Closes the missing visual-checklist artifact dependency only. It does not prove the full interactive 0014 browser plan. |
| Browser automation | `docs/qa/0015-browser-automation.md` records committed Node browser-contract coverage. | Regression guardrail only. It is not a visual/device browser acceptance pack. |
| Release evidence traceability | `docs/qa/0015-release-evidence-index.md` maps gates and explicitly keeps every public-readiness gate blocked. | Traceability only. It does not approve public launch or `GATE-002`. |
| Open-item alignment | `docs/qa/0015-open-items-matrix.md` records 0015 at 19/26 with consolidated browser acceptance and public-readiness evidence still open. | Current status tracker. It should not be advanced without new consolidated browser evidence. |

## Missing For `GATE-002`

The missing artifact is one reviewable consolidated browser pack, run on isolated local data, that covers the `docs/qa/0014-browser-qa-plan.md` procedure at desktop and mobile widths.

Minimum missing evidence:

- A machine-readable report or structured QA note under `docs/qa/` that ties each 0014 checklist domain to desktop and mobile evidence.
- Screenshot or report paths under `/private/tmp/aidm-0014-browser-qa-*` or a clearly named 0015 equivalent.
- Clean-storage create-room flow from visible UI.
- Login/session refresh recovery.
- At least two clean browser contexts, preferably three, proving party rail, local/active labels, room-scoped storage, and refresh behavior.
- Chat/action split proving chat does not advance turn and action does.
- Scene switch evidence tying stage, State drawer, Log drawer, Replay, and soundscape metadata to the same scene/weather/location change.
- Market/backpack buy, inspect, use/equip/sell where allowed, wallet/stock/inventory persistence after refresh.
- Password-room wrong-password and correct-password flow with seated refresh recovery.
- Host-approval pending, blocked action, host approve/reject, approved-player refresh recovery.
- Audio settings gesture, ambience/voice toggle, sliders, mute, scene/weather change, and refresh persistence without blocking gameplay.
- Desktop and about-390px mobile layout checks for situation strip, party rail, log density, drawers, action composer, market/backpack, protected-room panels, and audio controls.
- Browser console error/warning sweep for the checked flow.
- Explicit statement that no player-visible page exposes tokens, password hashes, session tokens, internal asset metadata, private memos from other players, or raw debug catalogs.

## Minimum Browser Script Plan

Use the existing 0014 plan shape and run a single scripted or semi-scripted browser acceptance pass.

Recommended command:

```bash
PORT=4224 AIDM_DATA_FILE=/private/tmp/aidm-0015-consolidated-browser-data.json npm run dev
```

Recommended evidence directory:

```text
/private/tmp/aidm-0015-consolidated-browser/
```

Minimum script flow:

1. Open a clean desktop context at `http://127.0.0.1:4224/`.
2. Register/login host, refresh, create open room, create character, and start scene.
3. Open two additional clean contexts through the visible room URL, join two players, refresh host and players, and verify local/active/pending labels and party rail.
4. Submit chat and action separately, capture round/log evidence, then trigger one scene/weather/location change.
5. Capture stage, State drawer, Log drawer, Replay, and soundscape label/reason after the scene change.
6. Buy an item, inspect backpack, use/equip/sell when the UI permits it, refresh, and verify wallet/backpack/stock state.
7. Exercise Settings audio controls after a user gesture, mute, refresh, and verify gameplay remains available.
8. Create and verify password-room wrong/correct password paths with seated refresh recovery.
9. Create and verify host-approval pending, rejected request if available, approved request, blocked pending action, and approved-player refresh recovery.
10. Repeat core captures at desktop and about 390px mobile width.
11. Save a JSON summary with per-domain pass/fail, screenshot paths, console errors/warnings, tested room IDs, viewport sizes, and any unresolved visible-browser blocker.

## Manual Acceptance Checklist

Before changing `GATE-002` or BUG-0012 status, the final reviewer should confirm:

- Every domain in `docs/qa/0014-acceptance-checklist.md` has a corresponding browser evidence row.
- Every required flow in `docs/qa/0014-browser-qa-plan.md` was run from visible UI unless the plan explicitly allowed seeding.
- Desktop and mobile evidence came from the same current tree after the Worker J refresh fix.
- The final pack includes refresh recovery, protected-room access, market/backpack, audio settings, and multi-context party evidence together rather than as scattered partial runs.
- Any failed step is recorded as a blocker instead of being averaged out by passing automated tests.

## Task Closure Assessment

Do not close any additional 0015 task from this Worker W pass.

The following remain open:

- `Execute and attach the full 0014 consolidated browser acceptance pack.`
- Public-readiness evidence tasks for deployment, operations, security, legal/privacy, load/reliability, and support/launch operations.

The existing 19/26 task status should remain unchanged unless a separate worker attaches the complete consolidated browser pack or public-readiness evidence.
