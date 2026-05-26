# Non-Image Staging Dry Run

Date: 2026-05-26 CST
Worker: AL, non-image staging dry-run
Scope: documentation and staging verification only. No real `git add`, commit, merge, push, deletion, or business-code edit was performed.

## Inputs Reviewed

- `git status --short --untracked-files=all`
- `.gitignore`
- `docs/qa/commit-batching-plan-2026-05-26.md`
- `docs/qa/non-image-commit-plan-2026-05-26.md`
- `git diff --name-only -- assets/generated docs/qa`
- `git ls-files --others --exclude-standard`
- `git ls-files --others -i --exclude-standard`
- Direct `git add -n` dry-run output for the default non-image pathspec set

## Current Snapshot

Before this report was added, the visible working tree had 56 tracked modified paths and 115 visible untracked paths. There were no staged paths; `git diff --cached --name-only` printed no output.

The tracked diff under `assets/generated` is text-only:

```text
assets/generated/manifest.json
```

No tracked generated raster path was modified in the visible diff reviewed for this dry-run.

## Ignore and Exclusion Validation

`.gitignore` currently excludes generated raster payloads and QA screenshot formats:

```gitignore
assets/generated/**/*.png
assets/generated/**/*.jpg
assets/generated/**/*.jpeg
assets/generated/**/*.webp
docs/qa/**/*.png
docs/qa/**/*.jpg
docs/qa/**/*.jpeg
docs/qa/**/*.webp
```

Representative ignore checks:

```text
.gitignore:12:assets/generated/**/*.png assets/generated/icons/aidm-action-icon-042-01.png
.gitignore:18:docs/qa/**/*.png docs/qa/example-browser-capture.png
```

Ignored generated payload count:

- `assets/generated`: 853 ignored paths.
- Generated raster images: 852 ignored PNG files.
- Other ignored generated path: `assets/generated/.DS_Store`.
- Ignored QA screenshots under `docs/qa`: 0 currently observed.
- Visible untracked image files from `git ls-files --others --exclude-standard`: 0.

Visible `tmp/` paths still exist and must stay out of staging:

```text
tmp/subagent-prompts/legacy-asset-reference-auditor-t.md
tmp/subagent-prompts/runtime-generated-png-exposure-auditor-u.md
```

## Default Non-Image Stageable Set

After this report exists, the default non-image set is 167 unique paths by read-only pathspec expansion. The set excludes `assets/generated/manifest.json`, `tests/generatedAssets.test.js`, and `tests/generatedManifestRegistration.test.js` by default because the existing non-image plan marks the generated manifest and manifest-registration tests as conditional on the image payload policy.

Category counts:

| Category | Count | Notes |
| --- | ---: | --- |
| QA docs and `.gitignore` guard | 34 | Includes this report and all `docs/qa/**/*.md` files. |
| Product docs and asset provenance docs | 56 | Includes `docs/assets/**/*.md` and `docs/assets/**/*.json`, not image files. |
| Harness records | 39 | Includes modified `0011`-`0015` records and untracked `0017`-`0020` records. |
| Runtime, scripts, and non-manifest tests | 38 | Includes current `src/core/assets.js` and `tests/visualUiClosure.test.js`, which are visible non-image paths not listed in the older plan. |
| Default unique total | 167 | No PNG/JPG/JPEG/WebP, no `tmp/`, no `assets/generated/*`. |

The pathspec expansion guard found `default_bad=0` for:

- image extensions: `.png`, `.jpg`, `.jpeg`, `.webp`
- `tmp/`
- `assets/generated/`

## Conditional Text Set

These three non-image paths are stageable only after the main agent decides how generated image payloads are delivered:

```text
assets/generated/manifest.json
tests/generatedAssets.test.js
tests/generatedManifestRegistration.test.js
```

Reason: the manifest is text, but it references generated PNG payloads that are intentionally excluded from Git for now. The two generated-asset tests should follow the same decision, otherwise a fresh clone can fail when image files are absent.

## Must Exclude

Keep these out of the default non-image staging pass:

```text
assets/generated/**/*.png
assets/generated/**/*.jpg
assets/generated/**/*.jpeg
assets/generated/**/*.webp
docs/qa/**/*.png
docs/qa/**/*.jpg
docs/qa/**/*.jpeg
docs/qa/**/*.webp
tmp/
assets/generated/manifest.json
tests/generatedAssets.test.js
tests/generatedManifestRegistration.test.js
```

Also avoid broad staging commands until the image and `tmp/` policies are decided:

```bash
git add .
git add -A
git add assets/generated
git add tmp
```

## Dry-Run Result

A direct `git add -n` over the default non-image pathspec set completed successfully after this report was written. The dry-run output listed only non-image docs, Harness records, runtime files, scripts, and tests. It did not list:

- `assets/generated/**/*.png`
- `docs/qa/**/*.png`
- `tmp/`

Follow-up count attempts that piped or concurrently ran `git add -n` hit a sandbox/index-lock limitation:

```text
fatal: Unable to create '.git/index.lock': Operation not permitted
```

No staging occurred; a later `git diff --cached --name-only` check still printed no output. For exact counts, this report uses read-only `git ls-files -m -o --exclude-standard -- <pathspecs>` expansion, plus the successful direct `git add -n` dry-run as the staging behavior check.

## Suggested Pathspec Batches

These are suggestions for the main agent only. This worker did not run real `git add`.

Batch 1, guard and QA evidence:

```bash
git add .gitignore ':(glob)docs/qa/**/*.md'
```

Batch 2, product docs and asset provenance metadata:

```bash
git add docs/BEGINNER_TUTORIAL.md docs/BUGS.md docs/RELEASE_GATES.md docs/USER_GUIDE.md
git add ':(glob)docs/assets/**/*.md' ':(glob)docs/assets/**/*.json'
```

Batch 3, Harness records:

```bash
git add .harness/changes/0011-production-depth .harness/changes/0012-continuous-depth-assets .harness/changes/0013-public-productization .harness/changes/0014-continuous-product-depth .harness/changes/0015-continuous-hardening
git add .harness/changes/0017-mobile-log-toast-density .harness/changes/0017-rules-gameplay-depth .harness/changes/0017-ui-density-worker-a .harness/changes/0018-missing-asset-prompts .harness/changes/0019-missing-asset-generation .harness/changes/0020-asset-prompt-expansion
```

Batch 4, runtime, scripts, and non-manifest tests:

```bash
git add package.json public/app.js public/i18n.js public/index.html public/styles.css
git add scripts/deployment-parity.mjs scripts/smoke-flow.mjs scripts/register-generated-description-maps.mjs
git add src/core/assets.js src/core/assetSelection.js src/core/gameEngine.js src/core/itemCatalog.js src/core/localization.js src/core/rules.js src/core/stateSummary.js src/server/server.js
git add tests/assetSelection.test.js tests/audioBrowserCompatibility.test.js tests/bilingualUi.test.js tests/browserAutomation.test.js tests/flowClosureExtended.test.js tests/gameEngine.test.js tests/guide.test.js tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/localization.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/rules.test.js tests/sceneRuntimeIntegration.test.js tests/serverRoutes.test.js tests/stateSummary.test.js tests/staticUiStructure.test.js tests/visualUiClosure.test.js tests/workerGUiGuidance.test.js tests/workerIActiveGuidance.test.js
```

Conditional manifest batch, only after image delivery policy is decided:

```bash
git add assets/generated/manifest.json tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js
```

## Required Post-Stage Guards

After the main agent performs real staging, run:

```bash
git diff --cached --check
git diff --cached --name-only
git diff --cached --name-only | rg -n '\.(png|jpe?g|webp)$|^tmp/'
git diff --cached --name-only -- assets/generated
```

Expected default-batch result:

- `git diff --cached --check` exits 0.
- The image-or-`tmp/` guard prints no output.
- `git diff --cached --name-only -- assets/generated` prints no output for the default set.

If the conditional manifest batch is intentionally staged, `git diff --cached --name-only -- assets/generated` should print only:

```text
assets/generated/manifest.json
```

## Recommendation

The default non-image pathspec batches are ready to hand back to the main agent for real staging. The main agent should still decide whether to keep the three manifest-related paths out of the first commit, and should confirm or renumber the parallel `.harness/changes/0017-*` packages before committing.
