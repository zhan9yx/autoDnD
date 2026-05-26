# Conditional Manifest Commit Decision

Date: 2026-05-26 CST
Worker: AS, conditional manifest commit decision
Scope: decision and verification only. No `git add`, commit, merge, push, or business-code edit was performed.

## Inputs Reviewed

- `docs/qa/non-image-stage-filelist-2026-05-26.md`
- `docs/qa/generated-manifest-external-binary-contract-2026-05-26.md`
- `docs/qa/no-image-git-runtime-fallback-2026-05-26.md`
- `docs/qa/generated-asset-promotion-policy-2026-05-26.md`
- `assets/generated/manifest.json`
- `tests/generatedAssets.test.js`
- `tests/generatedManifestRegistration.test.js`
- `tests/playerUiAccess.test.js`
- `src/core/assets.js`

## Decision

Recommendation: include the 3 conditional paths in the same non-image commit.

The manifest can be committed as external-pending-binary metadata because the current runtime and tests no longer treat generated PNG payloads as Git-required files. Generated raster payloads remain excluded from Git and are represented by metadata, provenance, `generated-raster-binary-excluded` policy, and committed SVG/runtime fallbacks.

## Conditional Path Decisions

| Path | Decision | Reason |
| --- | --- | --- |
| `assets/generated/manifest.json` | Include | The manifest is text metadata for generated assets. It records runtime promotion boundaries and provenance while generated raster binaries remain external. The reviewed policy documents require this metadata so runtime refs are not invisible or mislabeled as `catalog-internal`. |
| `tests/generatedAssets.test.js` | Include | The test now asserts generated metadata, runtime registration, provenance, and committed fallback availability. It uses `assetBinaryDelivery(...)` and `AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1` skips PNG payload inspection, so it does not require PNG binaries in the no-image gate. |
| `tests/generatedManifestRegistration.test.js` | Include | The test now separates registration metadata from raster payload delivery. Generated raster files assert `external-pending-binary`, `generated-raster-binary-excluded`, metadata provenance, and committed fallback availability instead of direct PNG access. |

## Verification

Normal workspace:

```sh
node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js tests/playerUiAccess.test.js
```

Result: passed, 42/42.

Explicit missing generated-raster payload assumption:

```sh
AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js tests/playerUiAccess.test.js
```

Result: passed, 42/42.

Whitespace/conflict marker gate:

```sh
git diff --check
```

Result: passed.

## Stage Recommendation

The main agent can start real staging.

Stage the 169-path default non-image list, then add this AS decision document and the 3 conditional paths:

```sh
git add --pathspec-from-file=docs/qa/non-image-stage-filelist-2026-05-26.txt
git add -- docs/qa/conditional-manifest-commit-decision-2026-05-26.md assets/generated/manifest.json tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js
```

Do not stage generated raster payloads, QA screenshots, or `tmp/`.
