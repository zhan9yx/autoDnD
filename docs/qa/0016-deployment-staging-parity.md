# 0016 Deployment And Staging Parity Evidence

Date: 2026-05-25
Worker: C-0016
Gate: `GATE-003 deployment and staging parity`

## Decision

Status recommendation: partial for the local evidence contract, blocked for public `GATE-003`.

This pass adds a local, production-like deployment parity contract. It does not deploy AIDM to an external host, does not validate real public networking, and does not prove staging or production readiness. `docs/RELEASE_GATES.md` should keep `GATE-003` blocked until a real staging deployment repeats this contract and attaches provider evidence.

## Environment Inventory

| Variable | Required For Local Parity | Secret | Expected Value |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | no | `production` during the parity run. |
| `PORT` | yes | no | Integer TCP port selected by the check script or hosting platform. |
| `AIDM_DATA_FILE` | yes | no | Explicit isolated JSON store path; never the shared `data/aidm-store.json` for parity checks. |
| `OPENAI_MODEL` | yes | no | Defaults to `gpt-5.4-mini`; staging and production should pin an approved model. |
| `OPENAI_BASE_URL` | yes | no | Defaults to `https://api.openai.com/v1`; must be a valid provider URL. |
| `OPENAI_API_KEY` | no for local parity | yes | Optional local fallback. Required before any production AI-provider readiness claim. |
| `AIDM_PUBLIC_DIR` | no | no | Optional override, defaults to repo `public`. |
| `AIDM_ASSETS_DIR` | no | no | Optional override, defaults to repo `assets`. |

## Production-Like Local Check

Command:

```bash
npm run deployment:parity -- --json
```

The script performs these checks:

- Validates required environment variables and rejects unsafe defaults such as `NODE_ENV=development` or shared `data/aidm-store.json`.
- Masks `OPENAI_API_KEY` in output when the key is present.
- Starts `src/server/server.js` with `NODE_ENV=production`, isolated `AIDM_DATA_FILE`, explicit `PORT`, public dir, and assets dir.
- Calls `GET /api/health` and requires `ok=true`, `service=aidm`, `store=json`, and a version string.
- Fetches `/assets/manifest.json` to confirm static assets load under the same process profile.
- Creates a canary room through `POST /api/rooms`.
- Stops and restarts the service with the same data file.
- Rechecks `/api/health` and `GET /api/rooms` to verify the canary room survives the restart.

## Staging Parity Checklist

| Area | Local Evidence | Real Staging Evidence Still Needed |
| --- | --- | --- |
| Build/start artifact | `npm run deployment:parity` starts the Node service directly. | Hosting build logs, runtime command, Node version, and artifact identifier. |
| Environment profile | Script validates required local keys and masks secrets. | Provider environment export or screenshot with secrets redacted. |
| Secret validation | Placeholder keys are rejected when provided; raw keys are not printed. | Secret-manager location, rotation owner, and production key review. |
| Healthcheck | Local `/api/health` output is machine checked. | Staging/public health output from deployed URL. |
| Canary | Local canary room creation is machine checked. | Staging canary room with timestamp, owner, and rollback criteria. |
| Rollback smoke | Local restart against the same data file is machine checked. | Provider rollback or redeploy drill with before/after health evidence. |
| Persistence | JSON store survives process restart locally. | Decision on JSON file store versus managed database for staging/public access. |

## Canary Plan

1. Deploy to a private staging URL with no public traffic.
2. Run the same health, static manifest, canary room, restart or redeploy, and room-list checks against that URL.
3. Stop the canary if health fails, room creation fails, static assets fail, or restart loses the canary room.
4. Record the staging URL, artifact identifier, data store path or database, operator, timestamp, and rollback action.
5. Keep `GATE-003` blocked unless all evidence is attached and reviewed.

## Rollback Smoke Result

Local rollback smoke definition: stop the Node process and restart it with the same validated environment and data file.

Current local result: passed. `/api/health` stayed healthy after restart, and `GET /api/rooms` still included the canary room created before restart.

This is only a local process-restart smoke. It is not provider rollback evidence.

## Current Verification Result

- `node --test tests/deploymentParity.test.js`: passed, 3 tests total.
- `npm run deployment:parity -- --json`: passed in a localhost-permitted run with `recommendation: partial`.
- `npm run lint`: passed, `lint ok: 88 JavaScript files checked`.
- `npm run harness:status`: passed and reported 18 Harness changes.

Default sandbox note: the first direct parity command failed with `listen EPERM: operation not permitted 127.0.0.1`; the localhost-permitted rerun is the accepted evidence run.

## Verification Commands

```bash
node --test tests/deploymentParity.test.js
npm run deployment:parity -- --json
npm run lint
npm run harness:status
```

## Remaining Blockers

- No external staging host exists in this evidence package.
- No hosting build artifact, deployed URL, provider health output, or provider rollback result exists.
- No managed persistence decision is closed for staging or public access.
- No production secret-management owner, rotation record, or provider settings evidence is attached.
