# 0015 Continuous Hardening Public-Readiness Gates

## Requirement

Turn the open public-readiness items left after 0014 into explicit, executable gates. This change does not make AIDM publicly launchable. It defines the gate contract that must fail closed until deployment, operations, security, legal/privacy, load, support, and release-candidate browser evidence exist.

## Scope

- Create the 0015 Harness document set: `spec.md`, `review.md`, `tasks.md`, and `test-report.md`.
- Add a public-readiness gate document that names each blocking domain, required evidence, and close condition.
- Add a 0015 QA note that explains the current gate decision and the commands used to verify the gate contract.
- Add a focused automated test that fails when required public-readiness documents are missing or when blocking gates are marked as passed without evidence.
- Sync existing status docs so 0014 remains an acceptance-design/local-alpha boundary and 0015 becomes the public-readiness gate boundary.

## Non-Goals

- Do not change public UI, browser automation, room flows, game rules, server routes, persistence, auth, asset selection, or AI provider behavior.
- Do not execute Worker C browser automation or replace the 0014 browser QA plan.
- Do not claim deployment, operations, security, legal/privacy, load, support, or public launch readiness is complete.
- Do not create a production deployment runbook that pretends real hosting, identity, database, observability, or support systems already exist.

## Acceptance Criteria

- `docs/RELEASE_GATES.md` exists and includes blocked gates for deployment, operations, security, legal/privacy, load, support, and consolidated browser acceptance.
- `docs/qa/0015-public-readiness-gates.md` records the current gate decision, runnable checks, and remaining blockers.
- Existing readiness docs point to the new release-gate contract without weakening the 0014 boundary.
- Focused tests verify required gate docs exist, required gate IDs remain present, and public gates stay blocked until evidence is added.
- `test-report.md` records every command run and the current known gaps.

## Close Boundary For This Change

0015 can close the gate-definition gap. It cannot close any public-launch gate. A future change may mark a gate passed only when the named evidence artifact exists, the relevant command or drill has been run, and the review file records an explicit acceptance decision.
