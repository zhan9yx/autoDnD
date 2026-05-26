# Non-Image Commit Preparation Plan

Date: 2026-05-26 CST
Worker: AF, non-image commit preparation
Scope: commit-prep analysis, minimal ignore protection, and staging guidance only. No `git add`, commit, merge, push, deletion, or asset move was performed.

## Inputs Reviewed

- `git status --short --branch`
- `git diff --stat`
- `git diff --name-status`
- `git ls-files --others --exclude-standard`
- `docs/qa/commit-batching-plan-2026-05-26.md`
- `docs/qa/worktree-clean-plan-2026-05-26.md`
- `.gitignore`

## Current Snapshot

Branch:

- `codex/0012-continuous-depth-assets...origin/codex/0012-continuous-depth-assets`

Tracked diff before this file was added:

- 55 tracked modified files before the `.gitignore` guard.
- 56 tracked modified files after the `.gitignore` guard, because `.gitignore` is now modified.
- No tracked generated raster image file is currently modified. The only tracked path under `assets/generated` in `git diff --name-status` is `assets/generated/manifest.json`.

Untracked visibility after the `.gitignore` guard and before this file was added:

- `git ls-files --others --exclude-standard`: 107 visible untracked non-image paths.
- Visible untracked image count for `.png`, `.jpg`, `.jpeg`, `.webp`: 0.
- `git ls-files --others -i --exclude-standard assets/generated`: 853 ignored paths, consisting of 852 generated PNG files plus `assets/generated/.DS_Store`.
- No ignored QA screenshot image currently appears under `docs/qa`.

Existing planning docs still apply:

- Worker Y classified `assets/generated` as 668M total and 852 untracked generated assets.
- Worker Z measured the untracked generated payload at about 483.3MiB and recommended not adding it to normal Git without an approved storage policy.
- `.gitattributes` is absent in this checkout, and no Git LFS tracking rule is active.

## Non-Image Candidate Scope

The following paths are candidates for a version-update commit that intentionally excludes generated image binaries.

### Runtime and UI Code

- `public/app.js`
- `public/i18n.js`
- `public/index.html`
- `public/styles.css`
- `src/core/assetSelection.js`
- `src/core/gameEngine.js`
- `src/core/itemCatalog.js`
- `src/core/localization.js`
- `src/core/rules.js`
- `src/core/stateSummary.js`
- `src/server/server.js`

### Package and Scripts

- `package.json`
- `scripts/deployment-parity.mjs`
- `scripts/smoke-flow.mjs`
- `scripts/register-generated-description-maps.mjs`

### Tests

- `tests/assetSelection.test.js`
- `tests/audioBrowserCompatibility.test.js`
- `tests/bilingualUi.test.js`
- `tests/browserAutomation.test.js`
- `tests/flowClosureExtended.test.js`
- `tests/gameEngine.test.js`
- `tests/guide.test.js`
- `tests/itemCatalog.test.js`
- `tests/itemEconomy.test.js`
- `tests/levelingSkills.test.js`
- `tests/levelingUi.test.js`
- `tests/localization.test.js`
- `tests/noScrollUi.test.js`
- `tests/playerUiAccess.test.js`
- `tests/rules.test.js`
- `tests/sceneRuntimeIntegration.test.js`
- `tests/serverRoutes.test.js`
- `tests/stateSummary.test.js`
- `tests/staticUiStructure.test.js`
- `tests/workerGUiGuidance.test.js`
- `tests/workerIActiveGuidance.test.js`

Conditional tests, only if the generated manifest is intentionally staged:

- `tests/generatedAssets.test.js`
- `tests/generatedManifestRegistration.test.js`

### Harness Records

Tracked modified Harness packages:

- `.harness/changes/0011-production-depth/`
- `.harness/changes/0012-continuous-depth-assets/`
- `.harness/changes/0013-public-productization/`
- `.harness/changes/0014-continuous-product-depth/`
- `.harness/changes/0015-continuous-hardening/`

Untracked Harness packages:

- `.harness/changes/0017-mobile-log-toast-density/`
- `.harness/changes/0017-rules-gameplay-depth/`
- `.harness/changes/0017-ui-density-worker-a/`
- `.harness/changes/0018-missing-asset-prompts/`
- `.harness/changes/0019-missing-asset-generation/`
- `.harness/changes/0020-asset-prompt-expansion/`

Main-agent decision needed before staging: confirm that three parallel `0017-*` Harness package names are valid, or renumber them before commit.

### Product and QA Docs

- `docs/BEGINNER_TUTORIAL.md`
- `docs/BUGS.md`
- `docs/RELEASE_GATES.md`
- `docs/USER_GUIDE.md`
- `docs/qa/**/*.md`
- `docs/qa/non-image-commit-plan-2026-05-26.md`

Known untracked QA docs currently included by `docs/qa/**/*.md`:

- `docs/qa/0011-character-creation-browser.md`
- `docs/qa/0011-reward-loot-browser.md`
- `docs/qa/0011-scene-evolution-browser.md`
- `docs/qa/0011-state-drawer-browser.md`
- `docs/qa/0013-audio-browser.md`
- `docs/qa/0013-no-account-browser.md`
- `docs/qa/0013-spell-warrior-browser.md`
- `docs/qa/0014-non-auth-combined-browser-attempt.md`
- `docs/qa/0015-consolidated-browser-acceptance.md`
- `docs/qa/0017-mobile-log-toast-density.md`
- `docs/qa/0017-rules-gameplay-depth-browser.md`
- `docs/qa/0017-ui-density-worker-a.md`
- `docs/qa/asset-runtime-integration-2026-05-26.md`
- `docs/qa/commit-batching-plan-2026-05-26.md`
- `docs/qa/final-gates-2026-05-26.md`
- `docs/qa/generated-asset-exposure-audit-2026-05-26.md`
- `docs/qa/generated-asset-promotion-policy-2026-05-26.md`
- `docs/qa/legacy-asset-reference-audit-2026-05-26.md`
- `docs/qa/release-evidence-2026-05-26.md`
- `docs/qa/release-gates-classification-2026-05-26.md`
- `docs/qa/worktree-clean-plan-2026-05-26.md`

### Asset Metadata, Provenance, and Manifest

Non-image provenance files:

- `docs/assets/**/*.md`
- `docs/assets/**/*.json`

Conditional generated asset manifest:

- `assets/generated/manifest.json`

Manifest staging risk: the manifest is a text file, but it references generated PNG payload that is now intentionally excluded from Git. A manifest-only commit can make `tests/generatedAssets.test.js` or `tests/generatedManifestRegistration.test.js` fail for a fresh clone unless the binary payload is available through a separate artifact policy or the tests/runtime are adjusted for external assets.

### Commit-Prep Guard

- `.gitignore`

This should be included with the first non-image commit so later broad staging commands do not accidentally pick up generated raster payload.

## Excluded Paths and Patterns

The following must stay out of the non-image commit:

- `assets/generated/**/*.png`
- `assets/generated/**/*.jpg`
- `assets/generated/**/*.jpeg`
- `assets/generated/**/*.webp`
- `assets/generated/sheets/*.png`
- `assets/generated/scenes/*.png`
- `assets/generated/icons/*.png`
- `assets/generated/items/*.png`
- `assets/generated/spells/*.png`
- `assets/generated/tokens/*.png`
- `docs/qa/**/*.png`
- `docs/qa/**/*.jpg`
- `docs/qa/**/*.jpeg`
- `docs/qa/**/*.webp`
- Any ad hoc screenshots, browser captures, large source sheets, or generated raster exports outside the paths above.
- `tmp/`

Notes:

- The `.gitignore` change protects PNG/JPG/JPEG/WebP generated payloads and QA screenshot images going forward.
- `.gitignore` does not untrack files already committed in history. That is acceptable here because the current task is to prevent newly generated image payload from being staged.
- `tmp/` is not ignored by this worker because the requested write scope was generated image payload protection. It still must be excluded from staging.

## Minimal `.gitignore` Change Made

Added:

```gitignore
# Generated raster payload is kept outside Git unless an asset-storage policy is approved.
assets/generated/**/*.png
assets/generated/**/*.jpg
assets/generated/**/*.jpeg
assets/generated/**/*.webp

# QA screenshots/captures should not enter non-image release commits.
docs/qa/**/*.png
docs/qa/**/*.jpg
docs/qa/**/*.jpeg
docs/qa/**/*.webp
```

No `.gitattributes` file was created. Git LFS policy is still a main-agent decision.

## Final Status Validation

After this plan file was written and after the concurrent QA policy doc appeared:

- `git diff --check`: passed with no output.
- `git status --short --branch`: still shows no staged changes.
- `git ls-files --others --exclude-standard`: 109 visible untracked non-image paths.
- Visible untracked image count for `.png`, `.jpg`, `.jpeg`, `.webp`: 0.
- `git ls-files --others -i --exclude-standard assets/generated`: 853 ignored generated paths, including 852 PNG files.

## Safe Staging Command Suggestions

These commands are suggestions only and were not run by this worker.

Stage commit-prep guard and QA plans:

```bash
git add .gitignore docs/qa/non-image-commit-plan-2026-05-26.md
git add ':(glob)docs/qa/**/*.md'
```

Stage product docs and asset provenance docs:

```bash
git add docs/BEGINNER_TUTORIAL.md docs/BUGS.md docs/RELEASE_GATES.md docs/USER_GUIDE.md
git add ':(glob)docs/assets/**/*.md' ':(glob)docs/assets/**/*.json'
```

Stage Harness records:

```bash
git add .harness/changes/0011-production-depth .harness/changes/0012-continuous-depth-assets .harness/changes/0013-public-productization .harness/changes/0014-continuous-product-depth .harness/changes/0015-continuous-hardening
git add .harness/changes/0017-mobile-log-toast-density .harness/changes/0017-rules-gameplay-depth .harness/changes/0017-ui-density-worker-a .harness/changes/0018-missing-asset-prompts .harness/changes/0019-missing-asset-generation .harness/changes/0020-asset-prompt-expansion
```

Stage runtime, scripts, and non-asset tests:

```bash
git add package.json public/app.js public/i18n.js public/index.html public/styles.css
git add scripts/deployment-parity.mjs scripts/smoke-flow.mjs scripts/register-generated-description-maps.mjs
git add src/core/assetSelection.js src/core/gameEngine.js src/core/itemCatalog.js src/core/localization.js src/core/rules.js src/core/stateSummary.js src/server/server.js
git add tests/assetSelection.test.js tests/audioBrowserCompatibility.test.js tests/bilingualUi.test.js tests/browserAutomation.test.js tests/flowClosureExtended.test.js tests/gameEngine.test.js tests/guide.test.js tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/localization.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/rules.test.js tests/sceneRuntimeIntegration.test.js tests/serverRoutes.test.js tests/stateSummary.test.js tests/staticUiStructure.test.js tests/workerGUiGuidance.test.js tests/workerIActiveGuidance.test.js
```

Conditional manifest staging, only after the main agent decides how the generated image payload is delivered:

```bash
git add assets/generated/manifest.json tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js
```

Verify the staged set before committing:

```bash
git diff --cached --check
git diff --cached --name-only
git diff --cached --name-only | rg -n '\.(png|jpe?g|webp)$|^tmp/'
git diff --cached --name-only | rg -n '^assets/generated/(?!manifest\.json$)'
```

Expected verification:

- `git diff --cached --check` exits 0.
- The two `rg` guard commands print no staged image payload and no staged generated asset path other than `assets/generated/manifest.json`.

Avoid these until the image payload policy and `tmp/` cleanup are decided:

```bash
git add .
git add -A
git add assets/generated
git add tmp
```

## Required Gates Before Commit or Merge

Recommended after staging the intended non-image set:

```bash
git diff --cached --check
npm run lint
npm run test
npm run harness:check
```

If this version update is intended to be merge-ready, also rerun the current browser QA gate documented in the release evidence docs. Prior AIDM work treats browser evidence as part of release readiness, not as an optional follow-up.

## Main-Agent Decisions Still Required

1. Decide whether `assets/generated/manifest.json` can land without image binaries. If yes, define the external artifact expectation and test behavior for fresh clones.
2. Decide whether generated PNGs will later use Git LFS, external artifact storage, optimized runtime derivatives, or a separate asset-only branch.
3. Confirm or renumber the three parallel `.harness/changes/0017-*` packages.
4. Decide whether `tmp/` should be ignored or cleaned separately. This worker did not change it.
5. Choose whether this is one large non-image commit or multiple commits matching the earlier batching plan.
6. After staging, run gates and only then commit and merge to `main`.
