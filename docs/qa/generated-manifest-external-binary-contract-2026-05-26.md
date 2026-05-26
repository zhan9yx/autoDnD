# Generated Manifest External Binary Contract QA

Date: 2026-05-26 CST
Worker: AM, generated manifest external-binary contract

## Scope

This pass only covered `tests/generatedManifestRegistration.test.js` and this QA
note. No UI files were changed.

## Failure Check

The existing test passed in the full local workspace because generated PNG files
were present:

```sh
node --test tests/generatedManifestRegistration.test.js
```

Result before the contract fix: passed, 4/4.

That did not prove clean-checkout safety. The test still had direct
`access(asset.file)` checks for generated raster payloads. In a temporary cwd
containing `assets/generated/manifest.json` but no generated PNG binaries, the
same test failed:

```sh
node --test /Users/yixuan.zhang/Documents/AIDM/tests/generatedManifestRegistration.test.js
```

Working directory: `/private/tmp/aidm-am-missing-png`.

Observed failures:

- `assets/generated/scenes/aidm-scene-backbone-050-01.png` missing.
- `assets/generated/items/aidm-armor-outfit-cutout-053-01.png` missing.

Failure judgment: yes, `tests/generatedManifestRegistration.test.js` blocked a
no-generated-PNG default gate when run from a clean checkout or equivalent
missing-payload environment.

## Fix

`tests/generatedManifestRegistration.test.js` now separates the metadata and
registration contract from the binary payload contract:

- Representative manifest entries still must be registered.
- Display names, semantic keys, variant axes, gameplay bindings, source prompt
  refs, visibility, surfaces, quality, normalized ids, and sheet linkage remain
  asserted.
- Non-generated files still use direct `access(file)`.
- Generated raster files use `assetBinaryDelivery(...)` and must resolve to:
  - `status: "external-pending-binary"`
  - `gitPolicy: "generated-raster-binary-excluded"`
  - metadata provenance through `sourceSha256`, `promptId`, `semanticKey`, or
    `sourcePromptRef`
  - a committed SVG fallback file

The test no longer requires generated PNG payloads to be tracked in Git.

## Verification

Normal workspace:

```sh
node --test tests/generatedManifestRegistration.test.js
```

Result after fix: passed, 4/4.

Explicit missing-payload assumption:

```sh
AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/generatedManifestRegistration.test.js
```

Result after fix: passed, 4/4.

Temporary missing-PNG cwd:

```sh
AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test /Users/yixuan.zhang/Documents/AIDM/tests/generatedManifestRegistration.test.js
```

Working directory: `/private/tmp/aidm-am-missing-png`, with manifest plus SVG
fallbacks and no generated PNG files under
`/private/tmp/aidm-am-missing-png/assets/generated`.

Result after fix: passed, 4/4.

## Residual Blocker

No external-binary blocker remains in
`tests/generatedManifestRegistration.test.js`. The test now accepts generated
manifest metadata without requiring generated PNG binaries to be present in Git.
