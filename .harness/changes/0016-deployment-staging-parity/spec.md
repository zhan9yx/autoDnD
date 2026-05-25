# 0016 Deployment Staging Parity

## Requirement

Add a local, repeatable evidence contract for `GATE-003` deployment and staging parity without deploying AIDM to an external service or claiming public readiness.

## Scope

- Define the environment-variable inventory for a production-like local profile.
- Add a script that validates required environment variables, masks secrets, starts the Node service with `NODE_ENV=production`, checks health, creates a canary room, restarts the process, and verifies the same data file remains readable.
- Add focused tests for the deployment parity contract.
- Record the staging parity checklist, canary plan, rollback smoke result, and remaining blockers in `docs/qa/0016-deployment-staging-parity.md`.
- Update operations and gate documents so `GATE-003` has a local partial evidence contract while remaining blocked for real deployment evidence.

## Non-Goals

- Do not deploy to a public host, staging service, database, identity provider, or observability system.
- Do not mark `GATE-003` as passed.
- Do not change browser UI, security controls, load testing, game rules, or persistence architecture.
- Do not claim production AI-provider readiness when `OPENAI_API_KEY` is absent.

## Acceptance Criteria

- `npm run deployment:parity` runs a local production-like health/canary/restart smoke and returns a `GATE-003` recommendation of `partial` only when every local check passes.
- Secret validation never prints raw `OPENAI_API_KEY` values.
- The deployment parity test covers environment inventory, unsafe default rejection, secret masking, and the local smoke script.
- Release gate docs still show `GATE-003` as blocked until real staging or production deployment evidence exists.
