# Commit Batching and Large-Asset Plan

Date: 2026-05-26 CST
Worker: Z, commit batching and large-asset strategy
Scope: analysis and documentation only. No `git add`, no commit, no push, no deletion.

## Inputs Reviewed

- `docs/qa/worktree-clean-plan-2026-05-26.md`
- Current `git status`, `git diff --stat`, `git diff --name-status`, and `git diff --numstat`
- `assets/generated` directory size, tracked/untracked file split, and manifest counts
- Runtime references in `public/`, `src/`, `scripts/`, and `tests`
- Current ignore and LFS state: `.gitignore` exists, `.gitattributes` does not; `git lfs` is not installed in this checkout environment.

## Current Snapshot

Point-in-time after the worktree clean plan was added, before this file was written:

- Branch: `codex/0012-continuous-depth-assets...origin/codex/0012-continuous-depth-assets`.
- Staged changes: none.
- Dirty status: 55 tracked modified paths and 890 untracked paths.
- Difference from the earlier clean-plan snapshot: `tests/flowClosureExtended.test.js` is now tracked-modified, and `docs/qa/worktree-clean-plan-2026-05-26.md` is untracked.
- Tracked diff: 55 files changed, 232444 insertions, 46682 deletions.
- Largest tracked diff remains `assets/generated/manifest.json`: 224769 insertions, 46270 deletions.
- `assets/generated` totals about 668M by `du -sh`; direct file summing measured 662.5MiB across tracked and untracked files.

Generated asset size split:

| Area | Size | Notes |
| --- | ---: | --- |
| `assets/generated/icons` | 46M | 192 untracked PNGs plus existing tracked assets |
| `assets/generated/items` | 126M | 368 untracked PNGs plus existing tracked assets |
| `assets/generated/manifest.json` | 11M | tracked modified JSON |
| `assets/generated/options` | 2.5M | existing tracked runtime options |
| `assets/generated/scenes` | 213M | 66 untracked scene PNGs plus existing tracked scenes |
| `assets/generated/sheets` | 205M | 18 untracked source sheets plus existing tracked sheets |
| `assets/generated/spells` | 24M | 80 untracked PNGs plus existing tracked assets |
| `assets/generated/tokens` | 38M | 128 untracked PNGs plus existing tracked assets |
| `assets/generated/weapons` | 3.1M | existing tracked assets |

Tracked/untracked asset split:

- Tracked under `assets/generated`: 1531 files, about 179.2MiB.
- Untracked under `assets/generated`: 852 files, about 483.3MiB.
- Untracked generated files by directory: icons 192, items 368, scenes 66, sheets 18, spells 80, tokens 128.
- File extensions under `assets/generated`: 1634 PNG, 748 SVG, 1 JSON.

Manifest state:

- `generatedSheets=52`
- `rasterAssets=1582`
- `assets=1582`
- `plannedSheets=12`
- `assetCatalog.actualGeneratedRasterAssets=1582`
- `assetCatalog.playerSafeAssets=541`
- `assetCatalog.internalAssets=1041`

The 852 untracked generated files are represented in the manifest as 834 raster assets plus 18 source sheets. Of the 834 asset entries, 66 are `player-safe` scene backdrops and 768 are `internal` catalog/review assets.

## Runtime Dependency Findings

The generated payload is not just passive inventory.

1. `src/core/assetSelection.js` reads `assets/generated/manifest.json` at runtime and filters player-visible selections from the manifest. The 66 new untracked scene PNGs are `player-safe`, have `stage-backdrop`/`relevant-scene` surfaces, and can be selected by the presentation layer.

2. Current `public/` and `src/` files directly reference 102 untracked generated PNGs, totaling about 21.8MiB:

| Direct runtime reference group | Count | Size | Manifest visibility |
| --- | ---: | ---: | --- |
| equipment, `generated-metadata-review` | 17 | 4.0M | `internal` |
| spells, `generated-spell-review` | 46 | 9.5M | `internal` |
| rules, `generated-rules-review` | 26 | 4.6M | `internal` |
| characters, `generated-character-review` | 13 | 3.8M | `internal` |

This is a policy mismatch: runtime code references these images directly, but manifest metadata still marks them internal/catalog-only. Before merging, either:

- promote the directly referenced assets to an approved runtime surface in the manifest, or
- stop hard-coding them in runtime code, or
- explicitly document this as a transitional exception and commit the 102 files with the runtime code.

3. `tests/generatedAssets.test.js` and `tests/generatedManifestRegistration.test.js` access manifest-listed files from disk. A manifest-only commit will fail if the binary files are not also present. Conversely, committing all new files without the manifest loses reviewability and registration proof.

## Recommended Batch Order

The safest plan is to keep commits reviewable while ensuring the branch is green at defined gates. Where a split would create an intentionally red intermediate commit, the commands below call that out.

### Batch 0: Storage Policy Gate

Purpose: decide whether PNGs go through normal Git, Git LFS, or an external artifact path before any generated PNG is staged.

Recommendation: do not add the 483.3MiB untracked PNG payload to normal Git unless the repository owner explicitly accepts permanent clone bloat. There is no `.gitattributes`, and `git lfs` is not installed locally, so staging PNGs now would write ordinary Git blobs.

Candidate commands for the committer, not run by this worker:

```bash
git lfs version
git lfs install
git lfs track "assets/generated/**/*.png"
git add .gitattributes
git diff --cached --check
git commit -m "chore: track generated PNG assets with Git LFS"
```

If `git lfs version` fails, install Git LFS first or choose the external artifact strategy before staging assets.

### Batch 1: QA Evidence and Release Notes

Purpose: preserve review evidence without mixing it with runtime behavior or binary assets.

Include:

- `docs/qa/worktree-clean-plan-2026-05-26.md`
- `docs/qa/commit-batching-plan-2026-05-26.md`
- Existing modified and untracked `docs/qa/*.md` evidence files
- No screenshots were found in the current untracked set; if screenshots are added later, keep them in this evidence batch or a separate screenshot-only evidence batch.

Candidate commands:

```bash
git add docs/qa/worktree-clean-plan-2026-05-26.md docs/qa/commit-batching-plan-2026-05-26.md
git add docs/qa/0011-character-creation-browser.md docs/qa/0011-reward-loot-browser.md docs/qa/0011-scene-evolution-browser.md docs/qa/0011-state-drawer-browser.md
git add docs/qa/0013-audio-browser.md docs/qa/0013-browser-plan.md docs/qa/0013-no-account-browser.md docs/qa/0013-room-auth.md docs/qa/0013-spell-warrior-browser.md
git add docs/qa/0014-non-auth-combined-browser-attempt.md
git add docs/qa/0015-consolidated-browser-acceptance.md docs/qa/0015-consolidated-browser-gap.md docs/qa/0015-open-items-matrix.md docs/qa/0015-public-readiness-gates.md docs/qa/0015-release-evidence-index.md
git add docs/qa/0017-mobile-log-toast-density.md docs/qa/0017-rules-gameplay-depth-browser.md docs/qa/0017-ui-density-worker-a.md
git add docs/qa/asset-runtime-integration-2026-05-26.md docs/qa/release-evidence-2026-05-26.md
git diff --cached --check
git commit -m "docs: add release QA evidence"
```

### Batch 2: Harness Records

Purpose: keep process records separate from code and assets.

Include:

- Modified `.harness/changes/0011-*` through `.harness/changes/0015-*`
- Untracked `.harness/changes/0017-*`, `0018-*`, `0019-*`, and `0020-*`

Gate before staging: confirm that parallel `0017-*` package names are allowed by the Harness process. If unique numeric IDs are required, renumber before committing.

Candidate commands:

```bash
git add .harness/changes/0011-production-depth .harness/changes/0012-continuous-depth-assets .harness/changes/0013-public-productization .harness/changes/0014-continuous-product-depth .harness/changes/0015-continuous-hardening
git add .harness/changes/0017-mobile-log-toast-density .harness/changes/0017-rules-gameplay-depth .harness/changes/0017-ui-density-worker-a .harness/changes/0018-missing-asset-prompts .harness/changes/0019-missing-asset-generation .harness/changes/0020-asset-prompt-expansion
git diff --cached --check
git commit -m "chore(harness): record production hardening packages"
```

### Batch 3: Runtime Code, Scripts, and Tests

Purpose: commit product behavior and its tests as an atomic review unit.

Include:

- Runtime/UI: `public/app.js`, `public/i18n.js`, `public/index.html`, `public/styles.css`
- Core/server: `src/core/assetSelection.js`, `src/core/gameEngine.js`, `src/core/itemCatalog.js`, `src/core/localization.js`, `src/core/rules.js`, `src/core/stateSummary.js`, `src/server/server.js`
- Scripts/package: `package.json`, `scripts/deployment-parity.mjs`, `scripts/smoke-flow.mjs`
- Tests that validate those changes, including the currently modified tracked tests and untracked runtime tests.

Asset dependency decision:

- If hard-coded new asset paths remain in runtime code, include the 102 direct runtime-referenced PNGs in this batch or in an immediately preceding LFS-backed asset dependency batch. This is about 21.8MiB.
- If assets must not be included in the runtime commit, revert or adjust those hard-coded references first. Otherwise browser/UI paths will have missing images.

Candidate command to generate the direct runtime asset pathspec:

```bash
node -e 'const fs=require("fs"),cp=require("child_process"); const files=cp.execSync("rg --files public src",{encoding:"utf8"}).trim().split(/\n/).filter(Boolean).filter(f=>/\.(js|mjs|html|css)$/.test(f)); const refs=new Set(); for (const f of files) { const text=fs.readFileSync(f,"utf8"); for (const m of text.matchAll(/assets\/generated\/[A-Za-z0-9_.\/-]+\.(?:png|svg|json)/g)) refs.add(m[0]); } const untracked=new Set(cp.execSync("git ls-files --others --exclude-standard assets/generated",{encoding:"utf8"}).trim().split(/\n/).filter(Boolean)); console.log([...refs].filter(p=>untracked.has(p)).sort().join("\n"));' > /tmp/aidm-runtime-direct-assets.txt
git add --pathspec-from-file=/tmp/aidm-runtime-direct-assets.txt
```

Candidate runtime/test staging:

```bash
git add package.json public/app.js public/i18n.js public/index.html public/styles.css
git add scripts/deployment-parity.mjs scripts/smoke-flow.mjs
git add src/core/assetSelection.js src/core/gameEngine.js src/core/itemCatalog.js src/core/localization.js src/core/rules.js src/core/stateSummary.js src/server/server.js
git add tests/assetSelection.test.js tests/audioBrowserCompatibility.test.js tests/bilingualUi.test.js tests/browserAutomation.test.js tests/flowClosureExtended.test.js tests/gameEngine.test.js tests/guide.test.js tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/localization.test.js tests/noScrollUi.test.js tests/playerUiAccess.test.js tests/rules.test.js tests/sceneRuntimeIntegration.test.js tests/serverRoutes.test.js tests/stateSummary.test.js tests/staticUiStructure.test.js tests/workerGUiGuidance.test.js tests/workerIActiveGuidance.test.js
git diff --cached --check
git commit -m "feat: harden runtime flows and UI depth"
```

Recommended gates:

```bash
npm run lint
node --test tests/assetSelection.test.js tests/gameEngine.test.js tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/rules.test.js tests/stateSummary.test.js tests/staticUiStructure.test.js tests/playerUiAccess.test.js tests/serverRoutes.test.js
npm run test:browser-qa
```

### Batch 4: Asset Source Docs and Registration Tool

Purpose: preserve asset-generation provenance and the registration tool separately from binary asset payload.

Include:

- `docs/assets/**`
- `scripts/register-generated-description-maps.mjs`

Do not include `assets/generated/manifest.json` in this batch unless the corresponding generated files are already committed or staged for the same commit stack. The manifest tests require on-disk files.

Candidate commands:

```bash
git add docs/assets scripts/register-generated-description-maps.mjs
git diff --cached --check
git commit -m "docs: record generated asset provenance"
```

### Batch 5: Generated Asset Manifest and Binary Payload

Purpose: land the generated asset expansion as a controlled asset release.

Recommendation: use Git LFS for PNGs before this batch. If LFS is unavailable or repo policy rejects LFS, choose either the smaller runtime-only asset subset or external artifact storage and update the manifest accordingly.

Suggested internal split:

1. Source sheets: 18 PNGs, about 119.6MiB. Runtime does not load these directly; they are provenance/regeneration assets. Prefer LFS or external artifact storage.
2. Player-safe scene backdrops: 66 PNGs, about 185.0MiB. Runtime can select these through `assetSelection`, so they are required if the new manifest is committed as-is.
3. Internal catalog/review slices: 768 PNGs, about 178.7MiB. These are not currently player-safe by manifest, but tests and the full manifest require the files. Defer them unless the goal is to commit the complete registry.
4. Manifest and registration tests: `assets/generated/manifest.json`, `tests/generatedAssets.test.js`, `tests/generatedManifestRegistration.test.js`. Commit these with or after the files they reference.

Candidate commands for full generated payload:

```bash
git add assets/generated/manifest.json
git add -- assets/generated/icons assets/generated/items assets/generated/scenes assets/generated/sheets assets/generated/spells assets/generated/tokens
git add tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js
git diff --cached --check
git commit -m "feat(assets): register generated asset expansion"
```

Candidate commands for player-safe scenes only, if the manifest is pruned or a staged stack allows temporary red commits:

```bash
node -e 'const fs=require("fs"); const m=JSON.parse(fs.readFileSync("assets/generated/manifest.json","utf8")); console.log((m.rasterAssets||[]).filter(a=>a.visibility==="player-safe"&&a.categoryId==="scenes").map(a=>a.file).sort().join("\n"));' > /tmp/aidm-player-safe-scenes.txt
git add --pathspec-from-file=/tmp/aidm-player-safe-scenes.txt
```

Candidate commands for all manifest-referenced new files:

```bash
git ls-files --others --exclude-standard assets/generated > /tmp/aidm-generated-untracked.txt
git add --pathspec-from-file=/tmp/aidm-generated-untracked.txt
git add assets/generated/manifest.json tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js
```

Recommended gates:

```bash
node --test tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js tests/assetSelection.test.js
npm run lint
```

### Batch 6: User/Product Docs

Purpose: keep public-facing docs reviewable after the actual behavior and asset state are known.

Include:

- `docs/BEGINNER_TUTORIAL.md`
- `docs/BUGS.md`
- `docs/RELEASE_GATES.md`
- `docs/USER_GUIDE.md`

Candidate commands:

```bash
git add docs/BEGINNER_TUTORIAL.md docs/BUGS.md docs/RELEASE_GATES.md docs/USER_GUIDE.md
git diff --cached --check
git commit -m "docs: update user guide and release gates"
```

### Excluded From Commits

- `tmp/subagent-prompts/legacy-asset-reference-auditor-t.md`
- Any future `coverage/`, `playwright-report/`, ad hoc traces, `.log`, `.tmp`, `.bak`, `.swp`, or `.DS_Store` files

If repo convention allows it, add `tmp/` to `.gitignore` in a separate housekeeping commit. This worker did not edit `.gitignore`.

## Large-Asset Strategy

### Recommended Policy

Use Git LFS for generated PNGs before staging any new generated PNG. The largest single file observed is about 21.9MiB, below common single-file host limits, but the aggregate payload is the real problem: 668M under `assets/generated`, 483.3MiB of it currently untracked. Normal Git would permanently bloat clone/fetch size and make later cleanup require history rewrite.

Recommended `.gitattributes` direction, if Git LFS is approved:

```gitattributes
assets/generated/**/*.png filter=lfs diff=lfs merge=lfs -text
```

Do not LFS-track `assets/generated/manifest.json`; it must remain normal text for review and conflict resolution.

### Keep Originals or Slices

- Runtime needs slices and standalone scene backdrops, not source sheets.
- Source sheets are valuable for provenance and regeneration but should be LFS or artifact-store assets, not normal Git blobs.
- The 66 new player-safe scene PNGs are runtime-relevant if the manifest is committed as-is.
- The 102 direct runtime-referenced PNGs are required by current code unless the references are removed or retargeted.
- The remaining internal catalog slices should not be shipped to normal Git until the team decides they are part of the release artifact. If they stay in the manifest, tests require the files.

### Compression and Filtering

Do not silently recompress or convert the existing dirty payload inside the commit batching step. Compression changes would create a new review surface and require visual QA.

Recommended follow-up optimization track:

1. Create web-runtime derivatives for large scene assets, likely WebP or optimized PNG, and update manifest/runtime paths.
2. Keep source sheets and full-resolution originals in LFS or external artifact storage.
3. Add a manifest field that distinguishes `sourceFile`, `runtimeFile`, and optional `thumbnailFile`.
4. Add a size budget gate for generated runtime assets.

## Final Gates Before Merge

Run gates on the exact final commit set, not on an earlier dirty worktree:

```bash
git status --short --branch
git diff --check
git diff --cached --check
npm run lint
npm run test
npm run harness:check
npm run test:browser-qa
```

Known risk from current QA evidence: `npm run harness:check` was recently red with failures around deployment parity timeout, scene asset alignment, director season knowledge, and production-depth evaluator expectations. Do not mark the release commit stack ready until those are either fixed and rerun green, or explicitly waived in `docs/RELEASE_GATES.md`.
