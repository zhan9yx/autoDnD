# Harness And Tmp Cleanup Audit - 2026-05-26

Scope: pre-staging noise cleanup and Harness numbering audit for the non-image update. This pass did not modify business code and did not run `git add`, commit, or merge.

## Harness Numbering

Current `.harness/changes/0017-*` packages:

- `.harness/changes/0017-mobile-log-toast-density`
- `.harness/changes/0017-rules-gameplay-depth`
- `.harness/changes/0017-ui-density-worker-a`

Conclusion: multiple `0017-*` packages do not violate the current executable Harness rules. `scripts/harness.mjs` sorts and reports every directory under `.harness/changes/` and `verifyHarnessStructure()` only requires each change directory to contain `spec.md`, `review.md`, `tasks.md`, and `test-report.md`. It does not enforce unique numeric prefixes. The existing repo also already has multiple `0016-*` packages, and `npm run harness:status` reports all of them normally.

Blocker status: the duplicate `0017` prefix is not a staging blocker by itself and should not block `harness:check` through numbering alone. If the team wants stricter future bookkeeping, the smallest policy fix is to document that parallel workers may share a batch number, or to move to unique date-based `harness:new` ids in a later Harness policy change. No pre-staging rename is required for this merge.

## Tmp Noise

Before cleanup, visible untracked tmp files were:

- `tmp/subagent-prompts/legacy-asset-reference-auditor-t.md`
- `tmp/subagent-prompts/runtime-generated-png-exposure-auditor-u.md`

`git ls-files tmp` returned no tracked files. These are coordination prompts and should not be staged with the non-image product update. I added `tmp/` to `.gitignore` so repo-local scratch files stay out of `git status` and staging selection.

## Commands

- `git status --short --untracked-files=all`: ran. Confirmed many existing dirty product/doc/Harness files plus the two visible untracked tmp markdown files before cleanup.
- `npm run harness:status`: passed. Reported 25 Harness changes, including all three `0017-*` packages:
  - `0017-mobile-log-toast-density: 13/13 tasks complete`
  - `0017-rules-gameplay-depth: 17/18 tasks complete`
  - `0017-ui-density-worker-a: 14/14 tasks complete`
- `git status --short --untracked-files=all tmp`: ran before cleanup and showed the two `tmp/subagent-prompts/*.md` files.
- `git ls-files tmp`: ran and returned no tracked files.
- `git check-ignore -v tmp/subagent-prompts/legacy-asset-reference-auditor-t.md tmp/subagent-prompts/runtime-generated-png-exposure-auditor-u.md`: passed after cleanup and confirmed both files match `.gitignore:7:tmp/`.
- `git status --short --untracked-files=all tmp`: passed after cleanup with no output.
- `git diff --check`: passed before and after cleanup.

## Staging Impact

No Harness numbering blocker remains for staging. The only tmp noise blocker was the visible untracked `tmp/subagent-prompts/*.md` pair; the `.gitignore` update removes that blocker without deleting files.

Remaining pre-staging caution: `.gitignore` was already modified for generated raster and QA screenshot exclusion before this worker. This pass only added `tmp/`; the main staging owner should keep or reject the existing image ignore changes intentionally when selecting files.
