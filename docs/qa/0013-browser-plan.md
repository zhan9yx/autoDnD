# 0013 Browser QA Plan

Date: 2026-05-25
Worker: QA-BROWSER plus Worker E documentation sync plus Worker G/Auth UI P0 closeout plus Worker H flow-closure automation plus Avicenna auth-crypto hardening
Scope: automated browser-facing coverage plan plus focused static/API checks, including Auth/Access UI implementation smoke coverage and final documentation sync after Worker H plus Avicenna.

## Current Implementation Read

- Verified in the current 0013 records: `src/core/rules.js` and `src/core/gameEngine.js` import cleanly.
- Verified by focused API tests: auth register/login/session/logout, session-backed room ownership, open/password rooms, host-approval pending joins, approve/reject decisions, player token use after approval, room snapshot secret redaction, Market, inventory, action, audio metadata, and Replay loops.
- Verified by focused static/UI tests: auth login/register controls, non-URL-leaking auth/create/join forms, Authorization-bearing API wrapper, password and host-approval room-access controls with id/name/i18n coverage, pending-user player-surface blocking, room-scoped local player session restore, host/player localStorage persistence, collapsible table state strip, dense/comfortable log toggle, compact party strip, full log drawer, scene-change summary hooks, audio status dock, Market/Replay controls, and absence of player-visible admin/asset/director surfaces.
- Verified by focused audio tests: local browser-synth ambience profiles, weather layers, scene mismatch guards, social ambience variants, season layers, and localized soundscape reasons.
- Verified by requirements tests: `REQ-281` through `REQ-400`, 0013 Harness docs, roadmap boundary, and public-productization domain coverage exist without claiming completed public readiness.
- Verified by Avicenna-focused auth tests: user passwords, room passwords, and session token indexes use versioned `scrypt` storage with legacy SHA-256 migration coverage.
- Still not live-browser-verified: account registration/login UI, password-room UI, host-approval lobby UI, account-session persistence after reload, and pending-user player-drawer/action blocking in a real browser.
- Source scan note: auth and room-access API routes exist, and `public/index.html` / `public/app.js` / `public/i18n.js` now expose static login/register/password/approval controls and hooks. Current browser QA should prefer visible UI paths, using API-assisted setup only where a visible path is still incomplete.
- `.harness/changes/0013-public-productization/review.md` now exists, so the earlier missing-review blocker is resolved.

## Automated Coverage Added

- `tests/flowClosureExtended.test.js`
  - Converted the former 0013 browser TODO skeletons into executable API plus static DOM contract tests.
  - Added account registration/login/session-refresh/reopen coverage that verifies the same account identity owns and reopens a room after a stored-session refresh.
  - Added password-room and host-approval entry coverage for missing/wrong/correct passwords, pending players staying unseated, pending users being blocked from player writes, host approve/reject, and approved-player refresh.
  - Added hard assertions that public room snapshots do not leak host/player tokens, token hashes, or password hashes.
  - Added host-token-required start rejection before the valid host start.
  - Added Replay Markdown coverage and a post-Replay Market regression check.
- `tests/staticUiStructure.test.js`
  - Converted the 0013 auth/access TODO into hard assertions for login/register controls, safe form submission, Authorization session header wiring, room password and host-approval controls, host access queue controls, and bilingual i18n keys.
  - Added static checks for the collapsible status strip, compact party strip sizing, dense/comfortable log toggle, main log density limits, full log all-entry rendering, and log count wiring.
- `tests/playerUiAccess.test.js`
  - Converted the authenticated refresh identity and approval-gated drawer-access TODOs into hard assertions for account session storage/restore/logout, room-scoped seat restore, pending-player storage, pending-to-approved conversion, and pending-user action/drawer blocking.
  - Added static checks that create/join store host/player tokens and room-scoped player sessions in localStorage.
- `tests/noScrollUi.test.js`
  - Added static no-scroll-shell coverage for auth/create/join forms staying in-page, preventing default GET submits, JSON request bodies, compact auth actions, room-password fields, and host approval queue styling.

## Browser Verification Plan

Current browser path for implemented no-account player flow:

1. Start dev server with isolated storage, for example `PORT=4183 AIDM_DATA_FILE=/tmp/aidm-0013-browser.json npm run dev`.
2. Open `http://127.0.0.1:4183`.
3. Create a Chinese room and verify `aidm.hostToken` appears in localStorage while the room JSON does not expose token fields.
4. Join as player one, refresh, and verify the setup panel remains hidden, `My character` and `Market` are enabled, and room-scoped keys `aidm.rooms.<roomId>.playerId` / `playerToken` restore the seat.
5. Open the same room in a clean browser context, join as player two, start scene from the host context, and verify active turn ownership differs by seat.
6. Submit one action, then one party chat. Verify action advances turn and adds dice; party chat does not advance turn and renders `data-channel="party"`.
7. Open party, state, log, market, and replay surfaces. Verify party cards remain compact, the main transcript follows the selected dense/comfortable limit, full log shows all entries, Market loads/buy remains free-time, and Replay builds without changing round or active player.
8. Trigger forest/market travel action and verify scene backdrop, soundscape, state summary, and replay evidence follow the new scene.

Auth/access browser path:

1. In browser page context or API preflight, register/login a host through `/api/auth/register` or `/api/auth/login`.
2. Create an owned open room, a password room, and a host-approval room through `/api/rooms`.
3. Open each room URL in the browser and verify the existing player table renders without token/hash/password leakage.
4. For password rooms, verify missing/wrong/correct password joins through the visible join form and confirm errors stay in-page.
5. For host-approval rooms, verify pending join remains out of `players`/`turnOrder`, pending users cannot access player-only drawers/actions, then approve/reject from the visible host access queue.
6. Refresh after approved join and confirm room-scoped player keys restore the seat.
7. Toggle the status strip and log density controls in browser and verify no layout overlap on desktop and mobile.

## Known Blockers

- No live browser run is recorded in this pass; focused automated tests are the executable evidence.
- Account login/register and password/approval room access are now covered by server API flow tests plus static browser contract assertions, but no final live browser run is recorded yet.
- Default-sandbox `npm run harness:check` fails on localhost `EPERM` for server-backed tests. Worker N completed the post-H/post-scrypt rerun with localhost permission, and it ended with `harness check ok`.
- Browser automation under sandboxed localhost may require the approved dev-server/browser environment rather than the full-suite parallel runner.

## Commands Run

QA-BROWSER ran:

```bash
node --check tests/flowClosureExtended.test.js
node --check tests/staticUiStructure.test.js
node --check tests/playerUiAccess.test.js
node --test tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js
node -e "import('./src/core/rules.js').then(()=>console.log('rules import ok'))"
node -e "import('./src/core/gameEngine.js').then(()=>console.log('gameEngine import ok'))"
node --test tests/serverRoutes.test.js tests/releaseGateFlow.test.js
node --test tests/soundscape.test.js tests/ambienceEngine.test.js
node --test tests/requirements.test.js tests/maturity.test.js
node --test tests/gameEngine.test.js tests/rules.test.js tests/rulesEngine.test.js tests/assetSelection.test.js
git diff --check -- tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js docs/qa/0013-browser-plan.md
npm run harness:check
```

Worker E reran current integration-focused batches:

```bash
node --test tests/serverRoutes.test.js tests/releaseGateFlow.test.js tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js
node --test tests/requirements.test.js tests/maturity.test.js tests/soundscape.test.js tests/ambienceEngine.test.js tests/noScrollUi.test.js
node --test tests/assetSelection.test.js tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js
```

Current integrated focused results:

- Auth/API/browser-static batch now has the Worker G static Auth UI closeout and Worker H flow-closure automation applied; `tests/flowClosureExtended.test.js` reports 4 tests total, 4 passed, 0 TODO.
- Requirements/audio/UI batch passed: 42 tests total, 42 passed.
- Rules/spell/warrior/assets batch passed after full integration: 48 tests total, 48 passed.
- Escalated `npm run harness:check` passed lint, full unit tests, memory eval, production-depth eval, smoke, campaign simulation, and ended with `harness check ok`.

Worker G reran Auth UI closeout:

```bash
node --check tests/staticUiStructure.test.js
node --check tests/playerUiAccess.test.js
node --check tests/noScrollUi.test.js
node --check public/app.js
node --check public/i18n.js
node --test tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/noScrollUi.test.js
node --test tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/noScrollUi.test.js
node -e "<minimal DOM stub>; await import('./public/app.js')"
```

Current Worker G results:

- Auth/access static UI closeout passed: 8 tests total, 8 passed, 0 TODO.
- Browser/static focused batch passed hard assertions before Worker H; Worker H then cleared the remaining `tests/flowClosureExtended.test.js` TODOs with executable server/API plus static DOM contract coverage.

Worker H reran flow-closure automation:

```bash
node --check src/core/gameEngine.js tests/flowClosureExtended.test.js
node --test tests/flowClosureExtended.test.js tests/serverRoutes.test.js
npm run test
```

Current Worker H results:

- Flow closure plus server routes passed: 13 tests total, 13 passed, 0 failed, 0 TODO.
- Full test suite passed at the earlier 262-test baseline; superseded by the final AK/Hilbert gate with 264 tests total, 264 passed, 0 failed, 0 TODO.
- The two 0013 browser TODOs are cleared from `tests/flowClosureExtended.test.js`.
- A blocking pending-player write bug was fixed: protected-room player write paths now reject unseated/pending player IDs with `PLAYER_TOKEN_REQUIRED` instead of falling through to a 500.
- P0 module import smoke passed: `public/app.js import ok`.

Avicenna auth-crypto results:

- User password, room password, and session token persistence now uses versioned `scrypt` records, with migration coverage for legacy SHA-256 records.
- Focused auth/release tests passed: 11 tests total, 11 passed.
- Full test suite passed at the earlier 262-test baseline; superseded by the final AK/Hilbert gate with 264 tests total, 264 passed, 0 failed, 0 TODO.

## Live Browser Result

Worker A ran live browser QA on 2026-05-25 against `http://127.0.0.1:4185` using isolated local data. Evidence is recorded in `docs/qa/0013-browser-current.md`.

Worker A browser status:

- Account registration and reload-based session restore passed in browser.
- Create-room access-mode controls passed in browser.
- Situation page density, compact party strip, dense table log, scene visual dynamics, and ambience controls passed visual inspection.
- Password-room and host-approval-room entry are blocked as true visible user flows because the protected-room player setup panel is hidden in the player view.
- Host approval server-side decision works, but the approved player browser tab does not restore the seat after reload.

AD protected-room recheck status:

- AD reran a real headless Chrome DevTools protected-room recheck on 2026-05-25 against `http://127.0.0.1:4186` with isolated data file `/private/tmp/aidm-0013-protected-room-final-data.json`.
- Result: passed for visible password-room join panel, wrong-password feedback, correct-password seating, approval pending state, host queue Approve/Reject controls, and approved-player refresh recovery.
- Evidence screenshots:
  - `/private/tmp/aidm-0013-protected-room-final-01-password-panel.png`
  - `/private/tmp/aidm-0013-protected-room-final-02-password-error.png`
  - `/private/tmp/aidm-0013-protected-room-final-03-password-seated.png`
  - `/private/tmp/aidm-0013-protected-room-final-04-approval-pending.png`
  - `/private/tmp/aidm-0013-protected-room-final-05-host-queue.png`
  - `/private/tmp/aidm-0013-protected-room-final-06-approval-restored.png`

Current blocker boundary:

- The earlier protected-room P0/P1 browser blockers are superseded by the AD recheck.
- The 0013 public-productization worker then completed the missing rejection click-through against `http://127.0.0.1:4223`: pending `Vale` was visible in the host queue, the browser clicked `Reject`, the queue changed to `暂无待审批加入申请。`, and browser warning/error logs were empty.
- Additional 0013 public-productization evidence from the same worker covers foreground Chrome audio controls and the minimum spell/warrior visible flow. Screenshots and summary are under `/private/tmp/aidm-0013-public-productization-worker/`.
- This 0013 evidence closes the local host-rejection browser gap only. It does not close `GATE-002`, deployment gates, background-tab audio behavior, broader spell/warrior balance, or public-readiness approval.
