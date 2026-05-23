# Change Flow

## Branches

- `main`: releasable trunk.
- `develop`: integration branch for reviewed work.
- `codex/<change-slug>`: implementation branch.

## Steps

1. Proposal: create `.harness/changes/<id>-<slug>/spec.md`.
2. Requirement review: fill `review.md` with risks, missing details, and approval.
3. Plan: write `tasks.md` with small, testable tasks.
4. Develop: implement code and tests. Keep deterministic logic outside AI prompts.
5. Verify: run `npm run harness:check`.
6. Integrate: merge feature branch into `develop` after gates pass.
7. Release: merge `develop` into `main` after a final smoke test.

## Review Format

Each review issue should include:

- Priority: `MUST FIX`, `LOW`, or `INFO`
- Evidence: file, requirement, or command result
- Suggested action

## Done Definition

A task is done only when the user-facing path works, the deterministic logic is tested, and the verification report is updated.
