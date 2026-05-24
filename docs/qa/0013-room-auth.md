# 0013 Room Auth QA

Date: 2026-05-25
Role: AUTH-ROOM subagent plus Worker E documentation sync
Scope: local prototype auth, room ownership, room access modes, and host approval API.

## Implemented Interfaces

Auth:

- `POST /api/auth/register`
  - Body: `email`, `password`, optional `displayName`
  - Returns: public `user` and `session.sessionToken`
  - Stable errors: `AUTH_EMAIL_REQUIRED`, `AUTH_PASSWORD_REQUIRED`, `USER_EXISTS`
- `POST /api/auth/login`
  - Body: `email`, `password`
  - Returns: public `user` and a new `session.sessionToken`
  - Stable error: `INVALID_CREDENTIALS`
- `GET /api/auth/session`
  - Reads `Authorization: Bearer <token>` or `X-AIDM-Session-Token`.
  - `?sessionToken=` is intentionally ignored so tokens are not accepted through URLs.
  - Returns: public `user` and non-secret session metadata
  - Stable errors: `AUTH_REQUIRED`, `SESSION_INVALID`
- `POST /api/auth/logout`
  - Reads the same header session token locations, with legacy JSON body `sessionToken` support for local UI compatibility, and deletes the local session when present.

Rooms:

- `POST /api/rooms`
  - Existing `hostToken` response is preserved.
  - If a valid user session is supplied, the room snapshot includes `ownerUserId` and `host.userId`.
  - Session-backed POST handlers accept header session tokens and legacy JSON body `sessionToken`, but not URL query tokens.
  - Supports `accessMode: "open" | "password" | "host approval"` plus optional spelling `host-approval` / `host_approval`.
  - Password rooms require `roomPassword`; snapshots expose only `access.passwordProtected`, never the password or hash.
- `POST /api/rooms/:roomId/join`
  - `open`: joins immediately.
  - `password`: requires `roomPassword`; stable errors are `ROOM_PASSWORD_REQUIRED` and `ROOM_PASSWORD_INVALID`.
  - `host-approval`: returns `pendingPlayer` and `session.status: "pending"` without adding the player to `players` or `turnOrder`.
- `POST /api/rooms/:roomId/pending/:pendingPlayerId/approve`
  - Host-only through either owning user session or legacy `hostToken`.
  - Promotes the pending request into a real player while preserving the pending `playerToken`.
  - Stable errors include `HOST_TOKEN_REQUIRED`, `PENDING_PLAYER_NOT_FOUND`, and `PENDING_PLAYER_RESOLVED`.
- `POST /api/rooms/:roomId/pending/:pendingPlayerId/reject`
  - Host-only through the same controls.
  - Marks the pending request rejected and keeps it out of `players`.

Frontend Auth/Access UI:

- `public/index.html` exposes local register/login/logout controls, current-user status in the gateway and table header, create-room access mode selection, room-password fields, join password entry, and a host access queue.
- `public/app.js` restores `aidm.authSessionToken` plus `aidm.currentUser`, sends authenticated API calls with `Authorization: Bearer <sessionToken>`, keeps room-scoped host/player/pending tokens, and converts approved pending seats into local player bindings after room refresh or SSE snapshots.
- Host approval controls call `POST /api/rooms/:roomId/pending/:pendingPlayerId/approve|reject`; pending users remain without a local player binding until approval.

Protected reads:

- `GET /api/rooms/:roomId`
  - Open rooms preserve the existing full public snapshot behavior.
  - Password and host-approval rooms return only a minimal lobby snapshot unless the caller is the owning host session, a legacy host token supplied in `X-AIDM-Host-Token`, an approved player using `X-AIDM-Player-Id` plus `X-AIDM-Player-Token`, or a session-bound approved player.
- `GET /api/rooms/:roomId/replay`, `GET /api/rooms/:roomId/market`, and `GET /api/rooms/:roomId/events`
  - Password and host-approval rooms return stable `ROOM_READ_FORBIDDEN` errors without a full room payload unless the same read authorization passes.
  - SSE no longer opens a protected room stream before read authorization succeeds.

## Storage Boundary

- `src/core/storage.js` persists `rooms`, `users`, and `sessions` through the same local JSON store.
- User passwords and room passwords are stored as versioned `scrypt-v1` hashes. Legacy SHA-256 password records remain readable only for migration and are upgraded after successful verification.
- Session token lookup indexes are stored as versioned `scrypt-session-v1` records. Legacy SHA-256 session indexes remain readable only for migration and are removed after successful restore.
- Player tokens and host tokens are stored as hashes only and are not exposed in public snapshots.
- `MemoryRoomStore` implements the same auth/session methods for tests and future replacement.

## Automated Coverage

Coverage in this area:

- `tests/serverRoutes.test.js`
  - Register/login/session restore/logout.
  - Duplicate registration and invalid login errors.
  - Session-owned password room creation.
  - Password join missing/wrong/correct branches.
  - Owner session can start its room without providing `hostToken`.
  - Host approval pending join, unauthorized approval error, owner-session approval, approved player token use, and hostToken rejection.
  - Protected read authorization for room, replay, market, and SSE paths.
  - Public lobby snapshots and read/auth errors do not leak `password`, `passwordHash`, `sessionToken`, `tokenHash`, `playerToken`, room passwords, or private memo values.
  - `?sessionToken=` no longer authenticates session reads.
- `tests/releaseGateFlow.test.js`
  - Release gate now registers a host user, restores the session, creates an owned open room, then continues the existing static/auth/market/action/audio/replay loop.

Worker E integration rerun:

```bash
node --test tests/serverRoutes.test.js tests/releaseGateFlow.test.js tests/flowClosureExtended.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js
```

Result: superseded by Worker H and Avicenna. The former browser skeletons are now executable API/static contract tests, and direct full-suite evidence is 264 tests total, 264 passed, 0 TODO, 0 failed.

Worker H focused rerun:

```bash
node --test tests/serverRoutes.test.js tests/logTemplates.test.js
```

Result: passed, 16 tests total.

Worker H flow-closure rerun:

```bash
node --test tests/flowClosureExtended.test.js tests/serverRoutes.test.js
```

Result: passed, 13 tests total, 13 passed, 0 failed, 0 TODO. This covered account persistence, password rooms, host approval, pending-player write blocking, and post-approval player refresh through API plus static DOM contracts.

Avicenna auth-crypto rerun:

```bash
node --check src/core/gameEngine.js src/core/storage.js src/server/server.js tests/serverRoutes.test.js tests/releaseGateFlow.test.js
node --test tests/serverRoutes.test.js tests/releaseGateFlow.test.js
npm run lint
npm run test
git diff --check
```

Result: focused auth/release tests passed, 11 tests total, and full `npm run test` passed with 264 tests total, 264 passed, 0 failed, 0 TODO.

P0 Auth UI focused rerun:

```bash
node --check public/app.js
node --check public/i18n.js
node --check tests/staticUiStructure.test.js
node --check tests/playerUiAccess.test.js
node --check tests/noScrollUi.test.js
node --test tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/noScrollUi.test.js
node -e "<minimal DOM stub>; await import('./public/app.js')"
```

Result: passed. Focused UI tests: 8 total, 8 passed, 0 TODO. `public/app.js` module import smoke printed `public/app.js import ok`.

## Current Verification Status

- Current API-level auth and room access assertions pass in the Worker E rerun.
- Worker H P0/P1 read-side authorization and leakage assertions pass in the focused rerun above.
- Worker H flow-closure automation cleared the former browser TODO records with executable API plus static DOM/source contract coverage.
- Avicenna scrypt migration coverage passes for user passwords, room passwords, and session token indexes; the old SHA-256 storage risk is no longer the current blocker.
- Auth/access static UI, `Authorization` session header wiring, and `public/app.js` module import smoke pass in the P0 rerun above.
- The earlier `freezeSpellOptions is not defined` import blocker is not current in the synchronized 0013 record.
- The earlier missing 0013 `review.md` Harness blocker is not current because `review.md` now exists.
- Live browser account and access-control flows are still not recorded.

## Not Yet Verified In Browser

- Visible browser login/register controls are present in static source, but not live-browser verified.
- Visible password entry and host-approval lobby hooks are present in static source, but not live-browser verified.
- Browser persistence of account identity after refresh.
- Browser proof that pending users cannot access player-only drawers or actions before approval.
- Browser proof that password-room wrong/missing/correct paths display usable feedback.
- Production security hardening beyond local `scrypt` storage and redaction tests, including parameter calibration, rate limiting, account recovery, secret rotation, and migration/rollback operations.

This QA page records local prototype API and static UI coverage only. It does not approve public readiness.
