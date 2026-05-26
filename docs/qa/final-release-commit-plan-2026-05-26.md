# Final Release Commit Plan - 2026-05-26

Worker scope: final commit grouping and clean-state checklist only. This worker
did not commit, did not edit product code, and did not change README, public,
tests, assets, or Harness files. The only intended write from this pass is this
plan.

## Current Git Baseline

Observed branch state:

```text
## main...origin/main [ahead 3]
```

Local commits ahead of `origin/main`:

```text
7af5386 chore: reconcile external generated asset tracking
bfadfbc feat: add audio lifecycle background handling
685434b fix: close approval and log drawer UI flows
```

Initial dirty scope before this plan file was added:

```text
 M README.md
?? docs/README-previous.md
?? docs/qa/gate-003-staging-execution-pack-2026-05-26.md
?? docs/qa/harness-open-gap-review-2026-05-26.md
?? docs/qa/public-gate-local-evidence-2026-05-26.md
?? docs/qa/public-gate-next-execution-plan-2026-05-26.md
?? docs/qa/rc-browser-closure-review-2026-05-26.md
?? docs/screenshots/README.md
?? docs/screenshots/aidm-desktop-scene.jpg
?? docs/screenshots/aidm-mobile-main.jpg
?? docs/screenshots/aidm-mobile-market.jpg
```

Latest dirty scope observed after this plan file was added and parallel workers
continued:

```text
 M README.md
 M docs/ASSET_INVENTORY.md
 M docs/ASSET_PIPELINE.md
 M docs/MATURITY_AUDIT.md
 M docs/ROADMAP.md
 M docs/qa/no-image-git-runtime-fallback-2026-05-26.md
?? docs/README-previous.md
?? docs/qa/final-release-commit-plan-2026-05-26.md
?? docs/qa/gate-003-staging-execution-pack-2026-05-26.md
?? docs/qa/harness-open-gap-review-2026-05-26.md
?? docs/qa/public-gate-local-evidence-2026-05-26.md
?? docs/qa/public-gate-next-execution-plan-2026-05-26.md
?? docs/qa/rc-browser-closure-review-2026-05-26.md
?? docs/screenshots/README.md
?? docs/screenshots/aidm-desktop-scene.jpg
?? docs/screenshots/aidm-mobile-main.jpg
?? docs/screenshots/aidm-mobile-market.jpg
```

Additional checks:

- Initial `git diff --name-status` showed only `M README.md`; the later
  parallel-doc pass added the five modified generated-asset/maturity docs listed
  above.
- No current `public/styles.css`, `tests/staticUiStructure.test.js`, or
  `docs/qa/ui-overlap*.md` dirty entries were present when checked.
- `git diff --check` returned clean.
- `git ls-files 'assets/generated/**/*.png'` returned no tracked files.
- Local filesystem currently contains 1634 ignored generated PNG files under
  `assets/generated/`.
- `.gitignore` ignores `assets/generated/**/*.png`, `*.jpg`, `*.jpeg`, and
  `*.webp`.
- `git check-ignore -v assets/generated/scenes/aidm-scene-01.png` confirmed the
  generated PNG ignore rule.

## File Classification

### Public Gate And Open Gap Evidence

These files can be grouped under:

```text
docs: record public gate and open gap evidence
```

Recommended exact staging list:

```bash
git add -- \
  docs/qa/gate-003-staging-execution-pack-2026-05-26.md \
  docs/qa/harness-open-gap-review-2026-05-26.md \
  docs/qa/public-gate-local-evidence-2026-05-26.md \
  docs/qa/public-gate-next-execution-plan-2026-05-26.md \
  docs/qa/rc-browser-closure-review-2026-05-26.md
```

Optional placement for this plan file:

```bash
git add -- docs/qa/final-release-commit-plan-2026-05-26.md
```

Include this plan file in the public-gate/open-gap docs commit only if the
reviewer wants the final commit plan preserved with the release evidence. Keep it
out of the README presentation commit.

Rationale:

- `public-gate-local-evidence` records local gate evidence and remaining
  fail-closed blockers for `GATE-003` through `GATE-008`.
- `public-gate-next-execution-plan` converts those gates into assignable
  staging, operations, security, legal/privacy, load, and support tickets.
- `gate-003-staging-execution-pack` is an execution package only, not proof of a
  completed staging deployment.
- `harness-open-gap-review` records current Harness gaps and explicitly avoids
  closing broad public-readiness tasks.
- `rc-browser-closure-review` records current RC browser evidence and caveats.

Before committing this group, verify:

```bash
git diff --cached --name-only
git diff --cached --check
git status --short
```

The staged list must not include `README.md`, `docs/screenshots/`, `public/`,
`tests/`, `assets/`, `.harness/`, or raw `/private/tmp` evidence.

### GitHub README Presentation

These files can be grouped under:

```text
docs: refresh GitHub README presentation
```

Recommended exact staging list:

```bash
git add -- \
  README.md \
  docs/README-previous.md \
  docs/screenshots/README.md \
  docs/screenshots/aidm-desktop-scene.jpg \
  docs/screenshots/aidm-mobile-main.jpg \
  docs/screenshots/aidm-mobile-market.jpg
```

Rationale:

- `README.md` was refreshed from a sparse local-alpha README into a GitHub-facing
  project presentation, with screenshots, product summary, run instructions,
  quality gates, maturity boundary, and documentation map.
- `docs/README-previous.md` preserves the previous README text for review.
- `docs/screenshots/README.md` documents the curated screenshot set and its
  source evidence.
- The three screenshot files are compressed README UI screenshots:
  - `aidm-desktop-scene.jpg`: 1200 x 843, 204796 bytes.
  - `aidm-mobile-main.jpg`: 323 x 700, 71734 bytes.
  - `aidm-mobile-market.jpg`: 323 x 700, 42943 bytes.

Before committing this group, verify:

```bash
git diff --cached --name-only
git diff --cached --check
git status --short
```

The staged list must include only the README and curated docs screenshot files
above. Do not stage `assets/generated/` or bulk RC evidence PNG files.

### Parallel Asset And Maturity Documentation

These modified files appeared after the initial status check and should not be
mixed into either target docs commit unless the main thread explicitly chooses to
fold them into the public-gate package:

```text
docs/ASSET_INVENTORY.md
docs/ASSET_PIPELINE.md
docs/MATURITY_AUDIT.md
docs/ROADMAP.md
docs/qa/no-image-git-runtime-fallback-2026-05-26.md
```

Observed diff size:

```text
5 files changed, 24 insertions(+), 14 deletions(-)
```

Content classification:

- Asset inventory and pipeline docs clarify external generated PNG payload
  policy, clean-checkout SVG fallback behavior, and `runtime-promoted`
  accounting.
- Maturity audit and roadmap refresh generated asset counts to include 102
  source-bound runtime-promoted assets and 939 internal review assets.
- `no-image-git-runtime-fallback` updates the runtime generated raster ref count
  from 209 to 208 and records that `tests/generatedManifestRegistration.test.js`
  follows the same external-binary/fallback contract.

If accepted, keep these in a separate docs-only package such as:

```text
docs: reconcile generated asset fallback documentation
```

Recommended exact staging list:

```bash
git add -- \
  docs/ASSET_INVENTORY.md \
  docs/ASSET_PIPELINE.md \
  docs/MATURITY_AUDIT.md \
  docs/ROADMAP.md \
  docs/qa/no-image-git-runtime-fallback-2026-05-26.md
```

If the owner of that parallel work is still active, leave these files unstaged
until they confirm the package is complete.

### UI Overlap Worker Package

No current UI-overlap dirty entries were present when checked. If a parallel UI
overlap worker later changes these paths, commit them separately under a focused
message such as:

```text
fix: resolve UI overlap regressions
```

or, if it is documentation-only:

```text
docs: record UI overlap QA evidence
```

Expected paths for that standalone package:

```text
public/styles.css
tests/staticUiStructure.test.js
docs/qa/ui-overlap*.md
```

Recommended exact staging pattern after the worker finishes:

```bash
git add -- public/styles.css tests/staticUiStructure.test.js
git add -- docs/qa/ui-overlap*.md
git diff --cached --name-only
git diff --cached --check
```

Do not mix UI/CSS/test changes with either README presentation docs or public
gate evidence docs. If `docs/qa/ui-overlap*.md` exists but CSS/test files do not,
keep the commit documentation-only.

## Clean-State Gate Checklist

Run these after all parallel workers are finished and before the final commit or
handoff. Record pass/fail in the final release note or PR body.

```bash
git status --short --branch
npm run test
npm run test:browser-qa
npm run harness:check
npm run harness:status
git ls-files 'assets/generated/**/*.png' | wc -l
git status --short --untracked-files=all
```

Required result:

- `npm run test`: pass.
- `npm run test:browser-qa`: pass.
- `npm run harness:check`: pass.
- `npm run harness:status`: captured after the passing checks.
- `git ls-files 'assets/generated/**/*.png' | wc -l`: `0`.
- `git status --short --branch`: no unexpected dirty files after intended
  commits. If docs-only release notes remain intentionally uncommitted, list
  them explicitly before handoff.

Optional safety checks:

```bash
git status --ignored --short -- assets/generated
git check-ignore -v assets/generated/scenes/aidm-scene-01.png
git diff --check
```

## Suggested Commit Order

1. Public gate/open gap evidence:

   ```text
   docs: record public gate and open gap evidence
   ```

   Stage only the public gate and gap files listed above. Include this plan file
   only if the reviewer wants it versioned with final release evidence.

2. GitHub README presentation:

   ```text
   docs: refresh GitHub README presentation
   ```

   Stage only `README.md`, `docs/README-previous.md`, and the curated
   `docs/screenshots/` README/JPG files.

3. Parallel asset/maturity docs, only if accepted by the owning worker:

   ```text
   docs: reconcile generated asset fallback documentation
   ```

   Stage only the five asset/maturity docs listed above. Keep this separate from
   README presentation and public gate evidence so generated-asset accounting
   can be reviewed independently.

4. UI overlap package, only if the parallel worker produces it:

   ```text
   fix: resolve UI overlap regressions
   ```

   Stage only `public/styles.css`, `tests/staticUiStructure.test.js`, and the
   matching `docs/qa/ui-overlap*.md` evidence files. Keep this after the docs
   commits so CSS/test behavior can be verified against the final README/docs
   state.

5. Final clean-state verification:

   Run the clean-state gate checklist and keep the worktree clean except for any
   explicitly deferred evidence artifacts.

## Risks And Guardrails

- Parallel workers may add or modify files after this plan. Re-run
  `git status --short --untracked-files=all` immediately before staging each
  commit.
- Do not use broad `git add .`, `git add docs`, `git add docs/qa`, or
  `git add assets`.
- Local generated PNG files exist under `assets/generated/`; they must remain
  ignored and untracked.
- The curated README screenshots in `docs/screenshots/*.jpg` are acceptable
  presentation artifacts. They are not generated game payloads.
- The public gate docs are local evidence/planning only. They must not be
  described as public launch approval.
- `main` is already ahead of `origin/main` by 3 commits. Do not push or commit
  until the main thread confirms all parallel worker output has landed.
