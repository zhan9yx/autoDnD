# Tasks

## Deployment Contract

- [x] Read release gates, operations, gap assessment, package scripts, server startup, and existing scripts.
- [x] Define the local environment inventory for deployment parity.
- [x] Add `scripts/deployment-parity.mjs` with secret validation, production-like start, healthcheck, canary, and restart smoke.
- [x] Add `npm run deployment:parity`.

## Evidence

- [x] Add `docs/qa/0016-deployment-staging-parity.md`.
- [x] Update operations guidance with the production-like local parity command.
- [x] Update release gate and gap assessment docs without marking public readiness passed.

## Tests

- [x] Add focused deployment parity tests.
- [x] Run focused node test subset.
- [x] Run deployment parity command.
- [x] Run lint.
- [x] Run Harness status.

## Still Open After This Change

- [ ] Run the same contract against a real staging deployment.
- [ ] Attach hosting build/start logs, public or staging health output, external canary result, rollback drill evidence, and owner sign-off.
- [ ] Decide whether JSON-file persistence is acceptable for a private staging review or must be replaced before any public launch gate can pass.
