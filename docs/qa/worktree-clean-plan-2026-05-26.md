# Worktree Clean Plan

Date: 2026-05-26 CST
Worker: Y, worktree clean and release-risk audit
Scope: repository audit only. No business code changes, no deletion, no `git add`, and no commit were performed.

Index update from Worker Z: detailed commit batching, generated-asset payload strategy, and suggested non-executed staging commands are now in `docs/qa/commit-batching-plan-2026-05-26.md`.

## Current Git State

Branch:

- `codex/0012-continuous-depth-assets...origin/codex/0012-continuous-depth-assets`

Point-in-time status before this file was added:

- `git status --porcelain=v1`: 943 dirty paths.
- Tracked modified: 54 paths.
- Untracked: 889 paths.
- Staged changes: none; `git diff --cached --name-only` printed no paths.

Tracked diff:

- `git diff --stat`: 54 files changed, 232321 insertions, 46681 deletions.
- Largest tracked diff is `assets/generated/manifest.json`: 224769 insertions, 46270 deletions.
- Other large tracked diffs are runtime/rules/UI files: `src/core/rules.js`, `public/app.js`, `src/core/assetSelection.js`, `public/styles.css`, `src/core/itemCatalog.js`, `src/core/gameEngine.js`, plus Harness test reports.

## Tracked Modified Classification

### Business/runtime changes: 11

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

Release note: these are product behavior changes and should not be bundled blindly with asset image drops. They need the full gate evidence already claimed elsewhere to be rechecked against the final commit set.

### Tests: 14

- `tests/assetSelection.test.js`
- `tests/bilingualUi.test.js`
- `tests/browserAutomation.test.js`
- `tests/gameEngine.test.js`
- `tests/generatedAssets.test.js`
- `tests/guide.test.js`
- `tests/itemCatalog.test.js`
- `tests/localization.test.js`
- `tests/noScrollUi.test.js`
- `tests/playerUiAccess.test.js`
- `tests/rules.test.js`
- `tests/serverRoutes.test.js`
- `tests/stateSummary.test.js`
- `tests/staticUiStructure.test.js`

### Harness records: 15

- `.harness/changes/0011-production-depth/review.md`
- `.harness/changes/0011-production-depth/tasks.md`
- `.harness/changes/0011-production-depth/test-report.md`
- `.harness/changes/0012-continuous-depth-assets/review.md`
- `.harness/changes/0012-continuous-depth-assets/tasks.md`
- `.harness/changes/0012-continuous-depth-assets/test-report.md`
- `.harness/changes/0013-public-productization/review.md`
- `.harness/changes/0013-public-productization/tasks.md`
- `.harness/changes/0013-public-productization/test-report.md`
- `.harness/changes/0014-continuous-product-depth/review.md`
- `.harness/changes/0014-continuous-product-depth/tasks.md`
- `.harness/changes/0014-continuous-product-depth/test-report.md`
- `.harness/changes/0015-continuous-hardening/review.md`
- `.harness/changes/0015-continuous-hardening/tasks.md`
- `.harness/changes/0015-continuous-hardening/test-report.md`

### Generated asset metadata: 1

- `assets/generated/manifest.json`

Validation run by this worker:

- JSON parse passed.
- Top-level array counts: `generatedSheets=52`, `rasterAssets=1582`, `sheets=52`, `assets=1582`, `plannedSheets=12`.

Risk: the file is valid JSON, but its diff is too large to review manually in a normal commit. It should be paired with the generated asset files and the manifest registration evidence, or split into a dedicated asset-manifest commit.

### User/product docs: 4

- `docs/BEGINNER_TUTORIAL.md`
- `docs/BUGS.md`
- `docs/RELEASE_GATES.md`
- `docs/USER_GUIDE.md`

### QA docs: 6

- `docs/qa/0013-browser-plan.md`
- `docs/qa/0013-room-auth.md`
- `docs/qa/0015-consolidated-browser-gap.md`
- `docs/qa/0015-open-items-matrix.md`
- `docs/qa/0015-public-readiness-gates.md`
- `docs/qa/0015-release-evidence-index.md`

### Scripts/package: 3

- `package.json`
- `scripts/deployment-parity.mjs`
- `scripts/smoke-flow.mjs`

## Untracked Classification

Point-in-time untracked count before this file was added: 889.

### Generated assets: 852

By generated asset subdirectory:

- `assets/generated/icons`: 192 files.
- `assets/generated/items`: 368 files.
- `assets/generated/scenes`: 66 files.
- `assets/generated/sheets`: 18 files.
- `assets/generated/spells`: 80 files.
- `assets/generated/tokens`: 128 files.

Directory size check:

- `assets/generated`: 668M total.

Recommendation: treat these as intentional release assets only if the manifest registration and runtime governance evidence remain green. Because the payload is 668M, consider a dedicated asset commit or confirm repository storage policy before merging.

### Asset docs: 52

Examples:

- `docs/assets/asset-inventory-and-gap-list.md`
- `docs/assets/asset-prompt-expansion-plan-2026-05-25.md`
- `docs/assets/description-maps/icon-description-map-042-049.json`
- `docs/assets/description-maps/icon-description-map-042-049.md`
- `docs/assets/description-maps/icon-description-map-050-059.json`
- `docs/assets/description-maps/icon-description-map-050-059.md`
- `docs/assets/description-maps/scene-description-map-042-050.json`
- `docs/assets/description-maps/scene-description-map-042-050.md`
- `docs/assets/generation-notes/*`
- `docs/assets/missing-asset-generation-coordination-2026-05-25.md`
- `docs/assets/missing-asset-generation-prompts.md`
- `docs/assets/missing-asset-generation-status-2026-05-25.md`

Recommendation: keep with the asset-generation commit set if these are source/evidence for the generated payload. Do not mix them into a pure runtime bugfix commit.

### Harness records: 24

Untracked Harness packages:

- `.harness/changes/0017-mobile-log-toast-density/`
- `.harness/changes/0017-rules-gameplay-depth/`
- `.harness/changes/0017-ui-density-worker-a/`
- `.harness/changes/0018-missing-asset-prompts/`
- `.harness/changes/0019-missing-asset-generation/`
- `.harness/changes/0020-asset-prompt-expansion/`

Recommendation: keep if these correspond to accepted work packages. The numbering has multiple `0017-*` packages, so reviewers should confirm whether the Harness process permits same-number parallel packages before merge.

### QA docs: 14

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
- `docs/qa/release-evidence-2026-05-26.md`

Recommendation: keep in `docs/qa` as audit evidence. These should be included with the related release/hardening package or in a docs/evidence commit.

### Tests: 8

- `tests/audioBrowserCompatibility.test.js`
- `tests/generatedManifestRegistration.test.js`
- `tests/itemEconomy.test.js`
- `tests/levelingSkills.test.js`
- `tests/levelingUi.test.js`
- `tests/sceneRuntimeIntegration.test.js`
- `tests/workerGUiGuidance.test.js`
- `tests/workerIActiveGuidance.test.js`

Recommendation: keep with the runtime/asset changes they validate. Do not leave them untracked if the corresponding product changes are committed.

### Scripts: 1

- `scripts/register-generated-description-maps.mjs`

Recommendation: keep only if it is the canonical manifest/description-map registration tool. It should be reviewed with the asset manifest commit.

### Temporary file: 1

- `tmp/subagent-prompts/legacy-asset-reference-auditor-t.md`

Recommendation: do not commit. Either remove after owner confirmation or add an ignore rule for local coordination prompts. This worker did not delete it.

### Screenshots and ad hoc captures

- Search for untracked `docs/qa` screenshots/captures returned no matches.
- No untracked screenshot/capture artifacts were identified outside the generated asset PNGs.

## Lightweight Checks

Commands run:

```bash
git status --short
git status --short --branch
git status --porcelain=v1
git diff --stat
git diff --name-only
git diff --numstat
git diff --check
git diff --cached --name-only
git diff --cached --check
git ls-files --others --exclude-standard
rg -n "^(<<<<<<<|=======|>>>>>>>)" --glob '!.git/**' --glob '!node_modules/**' --glob '!tmp/**'
git ls-files --others --exclude-standard | rg -n '(^tmp/|(^|/)(screenshot|screen|debug|trace|coverage|playwright-report|\.DS_Store)|\.(log|tmp|bak|swp|har)$)'
git ls-files --others --exclude-standard | rg -n '(^docs/qa/.*\.(png|jpg|jpeg|webp)$|screenshot|capture|screen)'
du -sh assets/generated docs/assets docs/qa tmp .harness
node -e "const fs=require('fs'); const p='assets/generated/manifest.json'; const m=JSON.parse(fs.readFileSync(p,'utf8')); const keys=Object.keys(m); console.log('manifest json ok'); console.log('topKeys', keys.join(',')); for (const k of keys) if (Array.isArray(m[k])) console.log(k, m[k].length);"
```

Results:

- `git diff --check`: passed; no output.
- `git diff --cached --check`: passed; no output.
- Conflict marker search: no matches outside `.git`, `node_modules`, and `tmp`.
- Staged diff: none.
- Temporary-file search: only `tmp/subagent-prompts/legacy-asset-reference-auditor-t.md`.
- Manifest parse: passed.
- `.gitignore` currently ignores `node_modules/`, `data/`, `.DS_Store`, `*.log`, `coverage/`, `evals/reports/*.json`, `.env`, and `.env.*`, but not `tmp/`.

## Release-Risk Blockers

1. Worktree is not commit-ready as a single unit.
   - The tree mixes runtime behavior, UI, localization, asset selection, rules, generated manifest, 852 raster assets, tests, Harness records, and evidence docs.
   - A single commit would be difficult to review and rollback.

2. Generated payload is large.
   - `assets/generated` is 668M and includes 852 untracked files.
   - Confirm repository storage policy before merge, especially if this branch will be pushed through normal Git hosting rather than an artifact store.

3. Harness evidence and current worktree need final alignment.
   - Existing QA evidence says later gates passed, but this worker did not rerun `npm run harness:check`.
   - Before release, rerun the final gate after the exact commit set is chosen.

4. Temporary coordination file is present.
   - `tmp/subagent-prompts/legacy-asset-reference-auditor-t.md` should not be committed.
   - Consider ignoring `tmp/` if the repository convention allows it.

5. Harness numbering needs review.
   - Multiple untracked packages share the `0017-*` prefix.
   - If the Harness process expects monotonic unique numeric IDs, normalize before merge. If parallel suffixes are allowed, document that convention.

## Suggested Commit/Cleanup Plan

Do not stage everything at once. Suggested order:

1. Evidence/docs-only commit.
   - Include `docs/qa/*` evidence files, relevant `docs/assets/*` generation notes, and this worktree clean plan.
   - Exclude `tmp/`.

2. Harness package commit.
   - Include `.harness/changes/0011-*` through `.harness/changes/0020-*` after confirming the duplicated `0017-*` naming convention.
   - This keeps process records reviewable separately from product behavior.

3. Runtime/test hardening commit.
   - Include `public/*`, `src/*`, `package.json`, `scripts/deployment-parity.mjs`, `scripts/smoke-flow.mjs`, and the test files that directly validate those changes.
   - Rerun at least `npm run lint`, `npm run test`, and any focused browser/runtime smoke expected by the release gate.

4. Generated asset registration commit.
   - Include `assets/generated/manifest.json`, `assets/generated/**`, `scripts/register-generated-description-maps.mjs`, description maps, and manifest registration tests.
   - Confirm the 668M payload is acceptable.

5. Final release gate.
   - After staging the chosen commit set, run `git diff --cached --check`.
   - Rerun `npm run harness:check` on the exact final tree.
   - If browser tooling is available, perform one final product-visible browser smoke for create/start/action/market/spell/scene-switch paths.

Cleanup actions to perform only after owner confirmation:

- Remove or ignore `tmp/subagent-prompts/legacy-asset-reference-auditor-t.md`.
- Do not delete generated assets unless the asset owner confirms they are superseded.
- Do not collapse QA evidence into runtime commits if reviewers need traceability.
