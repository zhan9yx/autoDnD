# Non-Image Stage File List

Date: 2026-05-26 CST
Worker: AQ, exact non-image stage filelist
Scope: file-list generation only. No real `git add`, commit, merge, push, deletion, or business-code edit was performed.

## Inputs Reviewed

- `git status --short`
- `git status --short --untracked-files=all`
- `.gitignore`
- `docs/qa/non-image-staging-dry-run-2026-05-26.md`

## Summary

The exact default stage list contains 169 paths, including this Markdown report and the companion TXT pathspec file. The default list excludes generated raster payloads, QA screenshots, `tmp/`, and the generated manifest batch.

The conditional stage list contains 3 text paths. They should be staged only after the main agent decides how generated image payloads are delivered.

The hard-exclude guard contains 11 entries: 8 image/screenshot glob patterns, `tmp/`, and the 2 currently visible `tmp/` files. Conditional files are listed separately rather than counted as hard excludes.

## Copy-Paste Stage Commands

Preferred exact-path command for the main agent:

```bash
git add --pathspec-from-file=docs/qa/non-image-stage-filelist-2026-05-26.txt
```

Equivalent `xargs` form:

```bash
xargs git add -- < docs/qa/non-image-stage-filelist-2026-05-26.txt
```

Dry-run form used by this worker:

```bash
git add -n --pathspec-from-file=docs/qa/non-image-stage-filelist-2026-05-26.txt
```

Conditional manifest batch, only after the image delivery policy is decided:

```bash
git add -- assets/generated/manifest.json tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js
```

Do not run broad staging commands for this package:

```bash
git add .
git add -A
git add assets/generated
git add tmp
```

## Default Stage List

The same list is written as plain text in `docs/qa/non-image-stage-filelist-2026-05-26.txt`.

```text
.gitignore
.harness/changes/0011-production-depth/review.md
.harness/changes/0011-production-depth/tasks.md
.harness/changes/0011-production-depth/test-report.md
.harness/changes/0012-continuous-depth-assets/review.md
.harness/changes/0012-continuous-depth-assets/tasks.md
.harness/changes/0012-continuous-depth-assets/test-report.md
.harness/changes/0013-public-productization/review.md
.harness/changes/0013-public-productization/tasks.md
.harness/changes/0013-public-productization/test-report.md
.harness/changes/0014-continuous-product-depth/review.md
.harness/changes/0014-continuous-product-depth/tasks.md
.harness/changes/0014-continuous-product-depth/test-report.md
.harness/changes/0015-continuous-hardening/review.md
.harness/changes/0015-continuous-hardening/tasks.md
.harness/changes/0015-continuous-hardening/test-report.md
.harness/changes/0017-mobile-log-toast-density/review.md
.harness/changes/0017-mobile-log-toast-density/spec.md
.harness/changes/0017-mobile-log-toast-density/tasks.md
.harness/changes/0017-mobile-log-toast-density/test-report.md
.harness/changes/0017-rules-gameplay-depth/review.md
.harness/changes/0017-rules-gameplay-depth/spec.md
.harness/changes/0017-rules-gameplay-depth/tasks.md
.harness/changes/0017-rules-gameplay-depth/test-report.md
.harness/changes/0017-ui-density-worker-a/review.md
.harness/changes/0017-ui-density-worker-a/spec.md
.harness/changes/0017-ui-density-worker-a/tasks.md
.harness/changes/0017-ui-density-worker-a/test-report.md
.harness/changes/0018-missing-asset-prompts/review.md
.harness/changes/0018-missing-asset-prompts/spec.md
.harness/changes/0018-missing-asset-prompts/tasks.md
.harness/changes/0018-missing-asset-prompts/test-report.md
.harness/changes/0019-missing-asset-generation/review.md
.harness/changes/0019-missing-asset-generation/spec.md
.harness/changes/0019-missing-asset-generation/tasks.md
.harness/changes/0019-missing-asset-generation/test-report.md
.harness/changes/0020-asset-prompt-expansion/review.md
.harness/changes/0020-asset-prompt-expansion/spec.md
.harness/changes/0020-asset-prompt-expansion/tasks.md
.harness/changes/0020-asset-prompt-expansion/test-report.md
docs/BEGINNER_TUTORIAL.md
docs/BUGS.md
docs/RELEASE_GATES.md
docs/USER_GUIDE.md
docs/assets/asset-inventory-and-gap-list.md
docs/assets/asset-prompt-expansion-plan-2026-05-25.md
docs/assets/description-maps/icon-description-map-042-049.json
docs/assets/description-maps/icon-description-map-042-049.md
docs/assets/description-maps/icon-description-map-050-059.json
docs/assets/description-maps/icon-description-map-050-059.md
docs/assets/description-maps/scene-description-map-042-050.json
docs/assets/description-maps/scene-description-map-042-050.md
docs/assets/generation-notes/asset-0020-count-gap-audit.md
docs/assets/generation-notes/asset-alpha-qa-058.md
docs/assets/generation-notes/asset-completeness-and-mapping-gap-2026-05-26.md
docs/assets/generation-notes/asset-final-count-only-audit.md
docs/assets/generation-notes/asset-qa-047-048-050.md
docs/assets/generation-notes/asset-qa-047-048-r2.md
docs/assets/generation-notes/asset-qa-047-r4.md
docs/assets/generation-notes/asset-qa-048-r4.md
docs/assets/generation-notes/asset-visual-qa-050-31-40-49-50-and-047-048.md
docs/assets/generation-notes/asset-visual-qa-050-49-50-r3.md
docs/assets/generation-notes/franklin-scenes-042-04-08.md
docs/assets/generation-notes/icon-sheet-047-regeneration-r4.md
docs/assets/generation-notes/icon-sheet-048-regeneration-r4.md
docs/assets/generation-notes/icon-sheet-052-slicing.md
docs/assets/generation-notes/icon-sheet-053-slicing.md
docs/assets/generation-notes/icon-sheet-054-slicing.md
docs/assets/generation-notes/icon-sheet-055-slicing.md
docs/assets/generation-notes/icon-sheet-056-slicing.md
docs/assets/generation-notes/icon-sheet-057-slicing.md
docs/assets/generation-notes/icon-sheets-042-045-slicing-review.md
docs/assets/generation-notes/icon-sheets-042-045-slicing.md
docs/assets/generation-notes/icon-sheets-042-045.md
docs/assets/generation-notes/icon-sheets-046-049-slicing-review.md
docs/assets/generation-notes/icon-sheets-046-049-slicing.md
docs/assets/generation-notes/icon-sheets-046-049.md
docs/assets/generation-notes/icon-sheets-047-048-regeneration-r2.md
docs/assets/generation-notes/icon-sheets-050-051-slicing.md
docs/assets/generation-notes/icon-sheets-054-055.md
docs/assets/generation-notes/icon-sheets-056-057.md
docs/assets/generation-notes/icon-sheets-058-059-slicing.md
docs/assets/generation-notes/icon-sheets-058-059.md
docs/assets/generation-notes/manifest-integration-status-2026-05-26.md
docs/assets/generation-notes/scene-backbone-042-01-15-review.md
docs/assets/generation-notes/scene-backbone-042-09-16.md
docs/assets/generation-notes/scene-backbone-042-16-review.md
docs/assets/generation-notes/scene-backbone-050-01-10.md
docs/assets/generation-notes/scene-backbone-050-11-20.md
docs/assets/generation-notes/scene-backbone-050-21-30.md
docs/assets/generation-notes/scene-backbone-050-41-50.md
docs/assets/generation-notes/scene-backbone-050-49-50-regeneration-r3.md
docs/assets/generation-notes/scene-backbone-050-49-50-regeneration.md
docs/assets/missing-asset-generation-coordination-2026-05-25.md
docs/assets/missing-asset-generation-prompts.md
docs/assets/missing-asset-generation-status-2026-05-25.md
docs/qa/0011-character-creation-browser.md
docs/qa/0011-reward-loot-browser.md
docs/qa/0011-scene-evolution-browser.md
docs/qa/0011-state-drawer-browser.md
docs/qa/0013-audio-browser.md
docs/qa/0013-browser-plan.md
docs/qa/0013-no-account-browser.md
docs/qa/0013-room-auth.md
docs/qa/0013-spell-warrior-browser.md
docs/qa/0014-non-auth-combined-browser-attempt.md
docs/qa/0015-consolidated-browser-acceptance.md
docs/qa/0015-consolidated-browser-gap.md
docs/qa/0015-open-items-matrix.md
docs/qa/0015-public-readiness-gates.md
docs/qa/0015-release-evidence-index.md
docs/qa/0017-mobile-log-toast-density.md
docs/qa/0017-rules-gameplay-depth-browser.md
docs/qa/0017-ui-density-worker-a.md
docs/qa/asset-runtime-integration-2026-05-26.md
docs/qa/clean-checkout-non-image-gate-2026-05-26.md
docs/qa/commit-batching-plan-2026-05-26.md
docs/qa/final-gates-2026-05-26.md
docs/qa/generated-asset-exposure-audit-2026-05-26.md
docs/qa/generated-asset-promotion-policy-2026-05-26.md
docs/qa/generated-manifest-external-binary-contract-2026-05-26.md
docs/qa/legacy-asset-reference-audit-2026-05-26.md
docs/qa/no-image-git-runtime-fallback-2026-05-26.md
docs/qa/non-image-commit-plan-2026-05-26.md
docs/qa/non-image-stage-filelist-2026-05-26.md
docs/qa/non-image-stage-filelist-2026-05-26.txt
docs/qa/non-image-staging-dry-run-2026-05-26.md
docs/qa/release-evidence-2026-05-26.md
docs/qa/release-gates-classification-2026-05-26.md
docs/qa/visual-evidence-closure-2026-05-26.md
docs/qa/worktree-clean-plan-2026-05-26.md
package.json
public/app.js
public/i18n.js
public/index.html
public/styles.css
scripts/deployment-parity.mjs
scripts/register-generated-description-maps.mjs
scripts/smoke-flow.mjs
src/core/assetSelection.js
src/core/assets.js
src/core/gameEngine.js
src/core/itemCatalog.js
src/core/localization.js
src/core/rules.js
src/core/stateSummary.js
src/server/server.js
tests/assetSelection.test.js
tests/audioBrowserCompatibility.test.js
tests/bilingualUi.test.js
tests/browserAutomation.test.js
tests/flowClosureExtended.test.js
tests/gameEngine.test.js
tests/guide.test.js
tests/itemCatalog.test.js
tests/itemEconomy.test.js
tests/levelingSkills.test.js
tests/levelingUi.test.js
tests/localization.test.js
tests/noScrollUi.test.js
tests/playerUiAccess.test.js
tests/rules.test.js
tests/sceneRuntimeIntegration.test.js
tests/serverRoutes.test.js
tests/stateSummary.test.js
tests/staticUiStructure.test.js
tests/visualUiClosure.test.js
tests/workerGUiGuidance.test.js
tests/workerIActiveGuidance.test.js
```

## Conditional Stage List

```text
assets/generated/manifest.json
tests/generatedAssets.test.js
tests/generatedManifestRegistration.test.js
```

Reason: `assets/generated/manifest.json` is text, but it references generated image payloads intentionally excluded from Git. The two tests should move with the same policy decision so a clean checkout is not forced to rely on absent generated raster files.

## Must Exclude

Policy guards:

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
```

Currently visible hard-exclude paths:

```text
tmp/subagent-prompts/legacy-asset-reference-auditor-t.md
tmp/subagent-prompts/runtime-generated-png-exposure-auditor-u.md
```

Default-batch-only exclusions, handled by the conditional stage list:

```text
assets/generated/manifest.json
tests/generatedAssets.test.js
tests/generatedManifestRegistration.test.js
```

## Dry-Run Validation

Completed after file creation.

Commands run:

```bash
git add -n --pathspec-from-file=docs/qa/non-image-stage-filelist-2026-05-26.txt
node -e '<read-only pathspec count and forbidden-path check>'
git diff --cached --name-only
```

Result:

- `git add -n --pathspec-from-file=docs/qa/non-image-stage-filelist-2026-05-26.txt` exited 0 and printed add entries for the default pathspec list.
- Read-only validation of `docs/qa/non-image-stage-filelist-2026-05-26.txt` reported `defaultCount=169`, `badCount=0`.
- The forbidden check covered `.png`, `.jpg`, `.jpeg`, `.webp`, `tmp/`, and `assets/generated/`.
- `git diff --cached --name-only` printed no output after dry-run, confirming no real staging occurred.

Hand-off status: ready for the main agent to perform real default staging with the exact-path command above. The 3 conditional paths still require an explicit generated-image delivery policy decision before staging.
