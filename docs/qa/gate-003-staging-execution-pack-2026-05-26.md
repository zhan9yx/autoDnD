# GATE-003 Staging Execution Pack

Date: 2026-05-26
Gate: `GATE-003` deployment and staging parity
Scope: execution package only; no deployment was performed.
Baseline commit observed during this worker run: `d5919ee`

## Boundary

This document prepares the staging deployment evidence run. It does not deploy
AIDM, does not approve `GATE-003`, does not edit `docs/RELEASE_GATES.md`, and
does not replace Harness review. The release gate remains fail-closed until a
real private staging deployment repeats the local contract and attaches provider
evidence, redacted environment evidence, canary output, rollback or redeploy
output, and owner sign-off.

The repository currently has `scripts/deployment-parity.mjs`,
`tests/deploymentParity.test.js`, and local `0016` evidence. No `vercel.json` or
`.vercel` project metadata was found in this checkout, so provider-specific
Vercel steps below are evidence requirements, not proof that the project is
already configured for Vercel.

## Required Environment Variables

### App Runtime

| Variable | Required | Secret | Expected staging value |
| --- | --- | --- | --- |
| `NODE_ENV` | yes | no | `production`. |
| `PORT` | yes | no | Port assigned by the hosting runtime. |
| `AIDM_DATA_FILE` | yes for current JSON-store prototype | no | Explicit staging JSON store path outside the repo, or a documented replacement if staging uses managed persistence. Never `data/aidm-store.json`. |
| `OPENAI_MODEL` | yes | no | Approved staging model, currently defaulted locally to `gpt-5.4-mini`. |
| `OPENAI_BASE_URL` | yes | no | Valid provider URL, currently defaulted locally to `https://api.openai.com/v1`. |
| `OPENAI_API_KEY` | required before any AI-provider readiness claim | yes | Provider secret from a secret manager or hosting provider secret store. Must not be printed. |
| `AIDM_PUBLIC_DIR` | optional | no | Omit unless the provider runtime needs an explicit public directory override. |
| `AIDM_ASSETS_DIR` | optional | no | Omit unless the provider runtime needs an explicit assets directory override. |

### Evidence Run

| Variable | Required | Secret | Notes |
| --- | --- | --- | --- |
| `AIDM_STAGING_URL` | yes | no | Private staging origin with no trailing slash preferred. |
| `AIDM_STAGING_HEALTH_URL` | yes | no | Usually `$AIDM_STAGING_URL/api/health`; set explicitly if the host uses rewrites. |
| `AIDM_STAGING_DEPLOYMENT_ID` | yes | no | Hosting artifact or deployment identifier. |
| `AIDM_STAGING_COMMIT` | yes | no | Git SHA deployed to staging. Must match the release-candidate commit or include a written exception. |
| `AIDM_STAGING_DATA_TARGET` | yes | no | JSON file path, mounted volume, managed database, or explicit staging persistence decision. |
| `AIDM_STAGING_PROVIDER` | yes | no | Hosting provider name and project identifier. |
| `AIDM_STAGING_REGION` | yes | no | Provider region or runtime location. |
| `AIDM_STAGING_BUILD_LOG_URL` | yes | no | Link or exported file path for provider build logs. |
| `AIDM_STAGING_ROLLBACK_TARGET` | yes | no | Previous deployment ID, rollback URL, or redeploy artifact ID. |
| `AIDM_STAGING_PRIVATE_ACCESS_NOTE` | yes | maybe | Redacted note describing private access controls, for example allowlist, preview auth, or VPN. |

## Output Paths

Use one run directory per execution:

```text
/private/tmp/aidm-public-gates-2026-05-26/gate-003/
```

Required machine-readable or reviewable files:

```text
/private/tmp/aidm-public-gates-2026-05-26/gate-003/preflight-git.txt
/private/tmp/aidm-public-gates-2026-05-26/gate-003/local-deployment-parity.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/deployment-parity-test.tap
/private/tmp/aidm-public-gates-2026-05-26/gate-003/provider-build-redacted.md
/private/tmp/aidm-public-gates-2026-05-26/gate-003/provider-env-redacted.md
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-health-before.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-static-manifest.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-generated-manifest.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-canary-create.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-canary-read-before.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/rollback-action-redacted.md
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-health-after-rollback.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-canary-read-after-rollback.json
/private/tmp/aidm-public-gates-2026-05-26/gate-003/failure-or-acceptance-summary.md
docs/qa/gate-003-staging-deployment-evidence-YYYY-MM-DD.md
```

The final `docs/qa/gate-003-staging-deployment-evidence-YYYY-MM-DD.md` should
link the files above and state whether `GATE-003` remains blocked or is ready
for Harness review. Do not mark the gate passed without that review.

## Command Sequence

### 1. Preflight

```bash
mkdir -p /private/tmp/aidm-public-gates-2026-05-26/gate-003
{
  git rev-parse HEAD
  git status --short --branch
  node --version
  npm --version
  npm run --silent harness:status
} > /private/tmp/aidm-public-gates-2026-05-26/gate-003/preflight-git.txt
```

Fail this step if the deployed commit cannot be tied to `git rev-parse HEAD`, if
there are unexpected release-candidate mutations, or if Harness status cannot be
captured.

### 2. Local Contract

```bash
npm run --silent deployment:parity -- --json \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/local-deployment-parity.json

node --test tests/deploymentParity.test.js \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/deployment-parity-test.tap
```

Expected local contract:

- `ok=true`.
- `gate=GATE-003`.
- `recommendation=partial`.
- `validation.blockers=[]`.
- Health check passes before and after restart.
- Static manifest returns `version=2`.
- Canary room creation returns `201` and a `room_` ID.
- Canary survives local restart through the same isolated data file.

The local command is not staging evidence. It only proves the contract that the
staging run must repeat.

### 3. Provider Build And Environment Evidence

The deployment owner must capture provider evidence after deploying the release
candidate to a private staging target. Required provider facts:

- Provider and project ID.
- Deployment ID and deployed git SHA.
- Node version, start command, runtime type, region, and build timestamp.
- Build logs or provider artifact page.
- Redacted environment profile.
- Private access control proof.
- Staging data target and persistence decision.

If Vercel is selected, first confirm the project has been linked or configured;
this checkout currently has no `vercel.json` or `.vercel` metadata. Capture the
equivalent of provider inspect/build/log output into:

```text
/private/tmp/aidm-public-gates-2026-05-26/gate-003/provider-build-redacted.md
/private/tmp/aidm-public-gates-2026-05-26/gate-003/provider-env-redacted.md
```

Do not store raw provider tokens, `OPENAI_API_KEY`, preview passwords, host
tokens, player tokens, room passwords, private memos, cookies, or full request
headers in these files.

### 4. Staging Health And Manifest Checks

```bash
curl -fsS "$AIDM_STAGING_HEALTH_URL" \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-health-before.json

curl -fsS "$AIDM_STAGING_URL/assets/manifest.json" \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-static-manifest.json

curl -fsS "$AIDM_STAGING_URL/assets/generated/manifest.json" \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-generated-manifest.json
```

Health acceptance:

- HTTP status is `200`.
- JSON contains `ok=true`, `service=aidm`, `store=json` or the approved staging
  store mode, and a version string.
- AI provider mode is consistent with the environment claim. If no provider key
  is configured, the evidence must state that no public AI-provider readiness is
  claimed.

Manifest acceptance:

- `/assets/manifest.json` returns HTTP `200` and `version=2`.
- `/assets/generated/manifest.json` returns HTTP `200` and contains the expected
  generated asset metadata baseline for the release candidate.
- If generated PNG payloads are intentionally delivered outside Git, the staging
  evidence must separately state how those binaries are hydrated, served, or
  accepted as absent for this RC. Do not silently pass a missing external payload
  delivery path.

### 5. Canary Room Checks

Create a staging canary room with deterministic, non-user test data:

```bash
curl -fsS "$AIDM_STAGING_URL/api/rooms" \
  -H "Content-Type: application/json" \
  -d '{"title":"GATE-003 Staging Canary","tone":"rollback","language":"en"}' \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-canary-create.json
```

Record the room ID from `staging-canary-create.json`, then read room or room-list
state using the staging-supported access path:

```bash
curl -fsS "$AIDM_STAGING_URL/api/rooms" \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-canary-read-before.json
```

Canary acceptance:

- Create returns HTTP `201`.
- Returned ID starts with `room_`.
- Canary title is visible in the room list or through the approved room read
  path.
- Evidence contains no host token, player token, room password, private memo, or
  personal data.

### 6. Rollback Or Redeploy Smoke

Before the rollback action, write the selected rollback plan and owner into:

```text
/private/tmp/aidm-public-gates-2026-05-26/gate-003/rollback-action-redacted.md
```

The action may be a provider rollback to `AIDM_STAGING_ROLLBACK_TARGET` or a
redeploy of the same release-candidate artifact. Record actor, timestamp,
deployment IDs, and expected persistence behavior. After the action:

```bash
curl -fsS "$AIDM_STAGING_HEALTH_URL" \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-health-after-rollback.json

curl -fsS "$AIDM_STAGING_URL/api/rooms" \
  > /private/tmp/aidm-public-gates-2026-05-26/gate-003/staging-canary-read-after-rollback.json
```

Rollback acceptance:

- Health still returns HTTP `200` and `ok=true`.
- The canary persistence expectation is explicit and matched. If the chosen
  staging store is ephemeral and the canary is expected to disappear, the owner
  must document and accept that limitation. If persistence is claimed, the room
  must remain readable.
- The provider action is repeatable by another operator.
- The rollback owner and backup owner are named.

## Redaction Rules

Mask or omit all secrets and user-sensitive values before writing evidence:

- `OPENAI_API_KEY` and any provider key: keep only a fixed placeholder such as
  `<redacted>` or a short fingerprint approved by the secret owner.
- Cookies, bearer tokens, preview auth passwords, host tokens, player tokens,
  room passwords, and webhook URLs: do not store raw values.
- Private memos, chat text from real users, uploaded content, and personal data:
  do not capture. Use deterministic canary data only.
- Provider logs: remove request headers, query strings containing tokens, and
  full IP addresses unless security review explicitly requires them in a
  restricted artifact.
- Screenshots: crop or blur provider account names, billing data, secret values,
  emails, and private project URLs if they are not intended for repo evidence.

Any unredacted secret in an evidence artifact fails `GATE-003` and requires
secret rotation before a new run can be accepted.

## Failure Criteria

Treat the staging run as failed if any of these are true:

- The provider artifact cannot be tied to `AIDM_STAGING_COMMIT`.
- `AIDM_STAGING_URL` is public without review-approved access controls.
- Required runtime environment keys are missing, malformed, or undocumented.
- `OPENAI_API_KEY` or another secret appears in any artifact.
- `/api/health` is not HTTP `200`, does not return `ok=true`, or reports an
  unexpected service/store/provider mode.
- `/assets/manifest.json` is missing or not `version=2`.
- `/assets/generated/manifest.json` is missing without an explicit external
  payload decision.
- Canary creation fails, returns no `room_` ID, or cannot be read through the
  approved staging path.
- Rollback or redeploy action is undocumented, not repeatable, has no owner, or
  leaves health broken.
- Persistence behavior after rollback contradicts the data-target decision.
- The evidence summary attempts to mark `GATE-003` passed without Harness review.

## Local Commands Run For This Pack

`npm run --silent deployment:parity -- --json`

- First default-sandbox attempt failed with `listen EPERM: operation not
  permitted 127.0.0.1`.
- Rerun with localhost permission passed.
- Result: `ok=true`, `gate=GATE-003`, `recommendation=partial`.
- Validation blockers: none.
- Finding: `OPENAI_API_KEY` absent; health should report local AI fallback and no
  public AI-provider readiness is claimed.
- Sanitized environment used `NODE_ENV=production`, a temporary `PORT=58265`, an
  isolated temp `AIDM_DATA_FILE`, `OPENAI_MODEL=gpt-5.4-mini`,
  `OPENAI_BASE_URL=https://api.openai.com/v1`, repo `public`, and repo `assets`.
- Checks passed: initial healthcheck, static asset manifest, canary room
  creation, rollback restart healthcheck, rollback restart persisted store
  smoke.
- Canary room in local temp run: `room_76da9789e2144f1c`.

`node --test tests/deploymentParity.test.js`

- Passed 4/4.
- Covered environment inventory, unsafe default rejection, repo-local data file
  rejection, and the production-like local parity script.

Read-only repository checks:

- `git status --short --branch` showed an already dirty worker workspace with
  unrelated in-progress changes; this pack did not edit those files.
- `git rev-parse --short HEAD` returned `d5919ee`.
- `rg --files | rg -i 'vercel|deploy|deployment'` found only
  `scripts/deployment-parity.mjs`, `tests/deploymentParity.test.js`, and
  `docs/qa/0016-deployment-staging-parity.md`.
- A focused search found no `vercel.json` or `.vercel` metadata in this checkout.

## Still Needs Human Or Network Permission

- Choose and configure a private staging provider/project.
- Deploy the release-candidate commit to that staging target.
- Capture provider build logs, deployment ID, runtime/start command, region, and
  deployed SHA.
- Export or screenshot provider environment settings with secrets redacted.
- Configure private staging access controls.
- Decide the staging persistence target and whether JSON-file persistence is
  acceptable for this RC.
- Run health, static manifest, generated manifest, canary, and rollback/redeploy
  checks against the live staging URL.
- Review whether generated PNG payload delivery is intentionally external and
  how staging hydrates or serves that payload.
- Assign deployment owner, backup owner, rollback owner, and Harness reviewer.
- Write the final staging evidence summary and keep `GATE-003` blocked until
  Harness review explicitly accepts the evidence.
