# 0013 No-Account Browser Smoke

Date: 2026-05-25 CST
Worker: H
Scope: visible browser smoke for the no-account player flow only.

## Boundary

This pass used an isolated local data file and an independent dev-server port. It did not modify product code, auth rejection behavior, character-card-first setup, scene evolution rules, economy rules, or asset expansion.

This is local visible-browser evidence for the no-account flow. It does not approve public readiness, deployment readiness, browser audio compatibility, host rejection click-through, or the full consolidated 0014 browser acceptance pack.

## Environment

```bash
PORT=4201 AIDM_DATA_FILE=/private/tmp/aidm-0013-no-account-browser/store.json npm run dev
```

Default sandbox result: failed to listen on `0.0.0.0:4201` with `EPERM`.

Localhost-permitted result: server started and reported `AIDM listening on http://localhost:4201`.

Health check:

```bash
curl -sS http://127.0.0.1:4201/api/health
```

Result: passed with `ok=true`, `service=aidm`, `version=0.11.0-production-depth`, `store=json`, and `aiProvider=local`.

Browser target:

```text
http://127.0.0.1:4201/
```

Browser console check: no warning or error logs were reported after the desktop and mobile runs.

## Flow Covered

- Desktop viewport: `1280x900`.
- Mobile viewport: `390x844`.
- Open homepage.
- Create an open/public room as a guest/no-account user.
- Join a player character.
- Start the scene.
- Submit a turn-moving action.
- Open My character.
- Open State.
- Open Full log.
- Open Settings and then Market.

## Desktop Evidence

Desktop room: `0013 No-account Desktop Smoke`.

Observed result:

- Room created from the visible gateway.
- Guest player `QA玩家` joined as character `林岚`.
- Scene started and active turn changed to `林岚 的回合`.
- Action submitted successfully; transcript showed player action, dice roll, and GM response.
- My character, State, Full log, and Market drawers opened and closed.
- Horizontal overflow check returned `body.scrollWidth=1280`, `clientWidth=1280`, `overflowing=false`.

Screenshots:

- `/private/tmp/aidm-0013-no-account-browser/desktop-01-home.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-02-joined.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-03-scene-started.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-04-action-submitted.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-05-character-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-06-state-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-07-log-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/desktop-08-market-drawer.jpg`

## Mobile Evidence

Mobile room: `0013 No-account Mobile Smoke`.

Observed result:

- Room created from the visible gateway.
- Guest player `手机玩家` joined as character `莫岚`.
- Scene started and active turn changed to `莫岚 的回合`.
- Action submitted successfully after one retry once the room version refreshed; transcript showed player action, dice roll, and GM response.
- My character, State, Full log, Settings, and Market drawers opened and closed.
- Drawer geometry matched the narrow viewport: each tested drawer reported `width=390`, `height=844`, `x=0`, `y=0`.
- Horizontal overflow check returned `body.scrollWidth=390`, `clientWidth=390`, `overflowing=false`.

Screenshots:

- `/private/tmp/aidm-0013-no-account-browser/mobile-01-home.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-02-room-created.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-03a-join-form-visible.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-03-joined.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-04-scene-started.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-05-action-submitted.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-06-character-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-07-state-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-08-log-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-09-settings-drawer.jpg`
- `/private/tmp/aidm-0013-no-account-browser/mobile-10-market-drawer.jpg`

## Issues

- Mobile first action submit initially returned `房间版本冲突：期望 4，实际 6` after scene start. Waiting for the refreshed room state and submitting again succeeded. This is recorded as a recoverable browser-flow observation, not a public-readiness pass blocker for this narrow smoke.
- The mobile join setup form is below the first viewport after room creation; the browser run scrolled to the join form before filling player and character names. The key path remained clickable and completed.

## Verification Commands

```bash
node --test tests/publicReadinessGates.test.js tests/maturity.test.js tests/requirements.test.js
```

Result: passed, 18 tests total, 18 passed, 0 failed, 0 TODO.
