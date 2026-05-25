# Operations

## Local

```bash
npm run dev
```

Default URL: `http://localhost:4173`

## Environment

Copy `.env.example` into your shell environment or hosting provider settings.

- `OPENAI_API_KEY`: optional.
- `OPENAI_MODEL`: defaults to `gpt-5.4-mini`.
- `OPENAI_BASE_URL`: defaults to `https://api.openai.com/v1`.
- `PORT`: defaults to `4173`.
- `AIDM_DATA_FILE`: defaults to `data/aidm-store.json`.

## Smoke Test

1. Start the server.
2. Create a room.
3. Join as two players from two browser tabs.
4. Submit an action as the active player.
5. Confirm the inactive player is blocked from acting out of turn.
6. Restart the server and refresh the room.

## Host Runbook

Use this checklist when running a local table or QA session.

### Before Players Join

1. Start `npm run dev` and open `http://localhost:4173`.
2. Create a room with a clear title, campaign tone, and language.
3. Copy the room URL and keep it available for reconnects.
4. Tell players that voice and ambience are optional local browser features.
5. Ask each player for a goal, fear, bond, secret, and safety line. If a field is not available in the character builder, ask them to put the short version in memo after joining.

### During The First Scene

1. Start only after at least one player has joined.
2. Read the objective, weather, threat clock, and clue clock.
3. Confirm whether play is free-form, spotlighted, or strict initiative.
4. When the active actor cue changes, name the expected player and offer one short suggestion if needed.
5. Treat `Chat` as table talk and `Action` as the move that can change clocks, rewards, scene, or turn state.

### Scene Handback

After a major success, failure, combat, or travel result, state:

- what changed in the scene;
- what danger or clue remains;
- which exits or next scenes are visible;
- which item, spell, or relationship might help next;
- whether market, rest, or recovery is free-time preparation.

## Recovery Runbook

| Case | Operator Check | Player Instruction | Completion Signal |
| --- | --- | --- | --- |
| Same browser refresh | Confirm room URL is unchanged. | Refresh and wait for room, character, log, and scene to render. | Player can act or chat with the same character. |
| Different browser or device | Confirm the shared `room_...` ID. | Open the exact room URL and use setup only if no local binding exists. | Setup panel is visible or the owned character is recovered. |
| Lost token | Do not delete existing room data. | Avoid duplicate character creation until host confirms the intended seat. | One valid seat remains in the roster. |
| Stale action error | Check whether the round or log advanced. | Reload, read latest state, then resubmit only if the action still applies. | New action is accepted against current state. |
| Audio unavailable | Check browser mute, tab focus, and user gesture. | Click the page, then toggle voice or ambience. | Transcript remains usable even if audio stays unavailable. |

Record repeated recovery failures in `docs/BUGS.md` or the active Harness QA note with room ID, browser, viewport, and reproduction steps.

## Local Backup And Restore Drill

The current room store is a single JSON file selected by `AIDM_DATA_FILE`. The default `data/aidm-store.json` is local developer data and must not be used for destructive drills.

Use `scripts/ops-drill.mjs` only with an explicit absolute path under `/private/tmp`. The drill creates a fixture store if the target file does not exist, backs it up, exports a user data bundle, applies retention and deletion mutations, restores the original backup, and verifies the final checksum matches the starting checksum.

```bash
node scripts/ops-drill.mjs drill \
  --data-file /private/tmp/aidm-0016-ops-drill/aidm-store.json \
  --backup-dir /private/tmp/aidm-0016-ops-drill/backups \
  --export-dir /private/tmp/aidm-0016-ops-drill/exports \
  --report-file /private/tmp/aidm-0016-ops-drill/report.json
```

Expected completion signals:

- `ok: true`;
- `before.sha256` equals `after.sha256`;
- `backup.sha256` equals `restore.sha256`;
- export, retention, and deletion counts are present;
- `monitoring.status` remains `blocked` unless real monitoring and alerting endpoints are configured.

The script refuses relative paths and repo-local paths such as `data/aidm-store.json`. Keep this behavior fail-closed until a production database and formal backup target exist.

## Data Retention, Export, And Delete Operations

Local JSON operations currently provide only a temp-file evidence drill, not a public privacy program.

Use the same script subcommands for isolated operator checks:

```bash
node scripts/ops-drill.mjs backup --data-file /private/tmp/aidm-ops/store.json --backup-dir /private/tmp/aidm-ops/backups
node scripts/ops-drill.mjs restore --data-file /private/tmp/aidm-ops/store.json --backup-file /private/tmp/aidm-ops/backups/store.json.TIMESTAMP.bak.json
node scripts/ops-drill.mjs export-user --data-file /private/tmp/aidm-ops/store.json --export-dir /private/tmp/aidm-ops/exports --user-id user_ops_0016
node scripts/ops-drill.mjs delete-user --data-file /private/tmp/aidm-ops/store.json --user-id user_ops_0016
node scripts/ops-drill.mjs retention --data-file /private/tmp/aidm-ops/store.json --retention-days 30
```

Operational boundaries:

- Export includes the user record, matching sessions, and room summaries for rooms owned by or joined by the user.
- Delete removes the user and their sessions and redacts direct `userId` references from room ownership, host, player, and auth-player records.
- Retention prunes sessions whose `lastSeenAt` or `createdAt` is older than the configured day window.
- These operations are not legal/privacy clearance. `GATE-006` still needs a full privacy policy, retention schedule approval, deletion/export owner, and legal review.

## Monitoring And Alerting Placeholders

Monitoring is intentionally fail-closed.

```bash
node scripts/ops-drill.mjs monitoring-status
```

The status is blocked until both placeholders are configured:

- `AIDM_MONITORING_URL`: production monitoring or synthetic-check endpoint.
- `AIDM_ALERT_WEBHOOK`: production alert routing endpoint.

Do not mark `GATE-004` passed from local health checks alone. Public operations need a deployed service, named alert owner, alert thresholds, incident intake, and evidence that alerts reach a human.

## Incident And Rollback Checklist

Use this checklist for local-alpha incidents and future production dry runs.

1. Assign an incident owner and record start time, affected room IDs, current commit, `AIDM_DATA_FILE`, and server port.
2. Stop public sharing of new room links if data recovery, auth, or room visibility is uncertain.
3. Capture `/api/health`, the current ops drill or backup report, and the exact user-visible symptom.
4. Create a backup of the affected data file before any mutation.
5. Reproduce on a copied `/private/tmp` data file whenever possible.
6. If rollback is needed, restore the latest verified backup to the target data file, restart the service, and run a create/join/refresh smoke.
7. Record the rollback owner, backup checksum, restored checksum, and player recovery status in the active Harness test report.
8. Keep the public gate blocked until root cause, blast radius, user communication, and prevention work are reviewed.

## Starter Campaign QA Path

The starter campaign path for a release smoke should cover:

1. Create room and join a character with memo hooks.
2. Investigate the opening urban mystery scene.
3. Move to a market or civic scene and buy or inspect one item.
4. Travel through weather or season pressure.
5. Resolve a social or optional combat scene.
6. Return to exploration or downtime, build replay, then refresh and confirm recovery.

Do not require new image assets for this path. Reuse generated scenes, overlays, ambience presets, and item art already present in the manifest.

## Deployment Notes

The MVP is deployable as a single Node web service. Before internet exposure, add authentication, rate limiting, payment controls, and a database-backed room store.

### Local Deployment Parity

Use the local parity check before any staging handoff:

```bash
npm run deployment:parity -- --json
```

The check starts the service with `NODE_ENV=production`, an isolated `AIDM_DATA_FILE`, explicit public and asset directories, and a temporary port. It validates required environment keys, masks `OPENAI_API_KEY`, calls `/api/health`, verifies the static asset manifest, creates a canary room, restarts the process, and verifies the canary room is still readable.

Passing this command is only local partial evidence for `GATE-003`. A real staging pass still needs hosting logs, deployed health output, environment profile evidence, canary result, rollback smoke, and review approval.

## Local Load And Reliability Smoke

Use the lightweight local smoke before release-candidate review or when changing room/SSE behavior:

```bash
npm run load:smoke
```

Default target:

- 4 concurrent rooms.
- 3 authorized SSE clients per room.
- 12 total SSE clients.
- API p95 `<= 15000ms`.
- SSE connect p95 is reported separately.
- SSE initial snapshot p95 after the stream is open `<= 1000ms`.
- SSE post-action broadcast p95 `<= 1000ms`.
- Error rate `0`.

This is not a stress test or production capacity claim. It is a local regression signal for room creation, player join, SSE subscription, start, chat mutation, and broadcast convergence. Room setup and room mutations are paced because the local JSON store writes through a single temp file; this smoke does not prove cross-room concurrent write safety. The detailed degradation policy and rollback threshold are recorded in `docs/qa/0016-load-support.md`.

## Support And Launch Operations Draft

Public support is not staffed yet. Before beta or public launch, assign a primary support owner, backup owner, escalation engineer for auth/room-state incidents, escalation engineer for deployment/rollback incidents, coverage window, and response targets.

Feedback triage should classify incoming items as `bug`, `reliability`, `security/privacy`, `support`, `content`, `ux`, or `question`; assign severity `P0` through `P3`; reproduce with isolated local data where possible; attach room ID, role, browser/device, command output, and expected vs actual behavior; and keep security/privacy reports out of public discussion until reviewed.

Known local-alpha limitations:

- JSON-file room storage is not a production database.
- SSE fanout is in-memory per server process and is not proven across multiple instances.
- The load smoke is small and local, not a public capacity benchmark.
- Authentication hardening, rate limits, abuse controls, monitoring, alerting, backup/restore, legal/privacy review, and deployment parity remain blocked gates.
- Voice and ambience are optional browser-local features and are not covered by the load smoke.

Use the incident template, canary checklist, and public issue intake plan in `docs/qa/0016-load-support.md` until a production support system exists.

## Public Operations Gate

Public operations are tracked by `GATE-004` in `docs/RELEASE_GATES.md` and are currently blocked. The 0016 local recovery drill adds temp-file backup/restore, retention, export/delete, incident checklist, and fail-closed monitoring evidence. It does not provide production monitoring, alert delivery, production backup storage, support ownership, or legal/privacy approval, so the public gate remains blocked.

Load/reliability and support/launch operations are tracked separately by `GATE-007` and `GATE-008`. The 0016 local smoke and support plan are partial evidence only; both gates remain blocked.
