# Non-Image Final Gates

Date: 2026-05-26 CST
Runner: AP, non-image final gate runner
Scope: gate verification on the non-image release candidate after staging.

## Decision

Strict gate decision: **pass for non-image staging and commit**.

Reason: the current staged candidate passed standalone unit tests, missing-raster focused tests, browser QA, and full Harness checks. Generated image payloads remain excluded from Git; runtime fallbacks and external-binary metadata contracts cover clean checkouts.

## Dirty Tree Context

The worktree was staged by the main agent after non-image pathspec dry-runs verified that generated PNG/JPG/WebP payloads, QA screenshots, and `tmp/` files are excluded. Generated image payloads remain outside the scope of this non-image gate.

## Commands Run

### `git diff --check`

Result: **PASS**, exit code 0 after staged whitespace cleanup.

Output: no whitespace or diff-check errors.

### `npm run test`

Result: **PASS**, exit code 0.

Summary:

```text
tests 347
pass 346
fail 0
cancelled 0
skipped 1
todo 0
duration_ms 76141.997916
```

The earlier AP standalone failure was not reproduced by the main-agent rerun.

### `npm run harness:check`

Result: **PASS**, exit code 0.

Important output:

```text
lint ok: 99 JavaScript files checked
unit tests: 346 passed, 0 failed, 1 skipped
long-memory eval: recallAt5=1, meanReciprocalRank=1, passed=true
production-depth eval: checkCount=10, passedCount=10, failedCount=0, passRate=1, passed=true
local smoke: ok=true, assetCount=82, generatedAssetCount=1582, marketOffers=75
campaign simulation: ok=true, players=5, round=6, transcript=109, memories=26
harness check ok
```

Notes:

- The harness-internal `npm run test` phase also passed with `346` pass, `0` fail, `1` skip.
- Lint checked 99 JavaScript files.
- Long-memory, production-depth, local smoke, and campaign simulation gates passed.

### Missing-Raster Focused Generated/Asset/UI Tests

Command:

```sh
AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js tests/playerUiAccess.test.js tests/itemCatalog.test.js tests/levelingSkills.test.js tests/levelingUi.test.js
```

Result: **PASS**, exit code 0.

Summary:

```text
tests 68
pass 68
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 2373.031542
```

Coverage notes:

- Confirms generated manifest registration accepts external generated raster payloads with committed fallbacks.
- Confirms generated asset metadata, player-safe exposure boundaries, runtime-promoted source-bound refs, catalog bindings, player UI access, item catalog, leveling rules, and leveling UI under `AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1`.

### Browser QA

Command:

```sh
npm run test:browser-qa
```

Result: **PASS**, exit code 0.

Summary:

```text
tests 3
pass 3
fail 0
```

## Failure Items

- No current non-image release gate failure.
- The generated raster payload itself remains intentionally outside Git and must be delivered later through the planned image artifact/LFS/CDN path.

## Staging Judgment

The staged non-image candidate is ready for commit. It contains manifest metadata, runtime fallbacks, code, tests, Harness records, QA evidence, and asset provenance documents, but no generated image payloads or QA screenshots.
