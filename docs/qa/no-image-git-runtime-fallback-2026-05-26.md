# No Image Git Runtime Fallback QA

Date: 2026-05-26 CST
Worker: AH, no-image-git runtime fallback

## Question

The release wants to merge code without committing `assets/generated/**/*.png`.
The current source scan finds 208 runtime generated raster refs. After the Git
index cleanup, 0 of those PNG binaries are tracked by Git and all 208 are
external raster payloads. The manifest still marks the source-bound
runtime-promotion subset as `runtime-promoted` and `ui-approved-runtime`, so a
clean checkout needs committed fallback delivery for player-visible surfaces.

## Clean Checkout Failure Judgment

Current runtime/source scan:

- 208 unique generated PNG refs are reachable from `src` and `public`.
- 0 of those refs are tracked by Git.
- 208 of those refs are not tracked by Git and must be delivered as external
  raster payloads or rendered through committed fallbacks.
- The source-bound runtime-promotion subset remains `runtime-promoted` /
  `ui-approved-runtime`; it is not broadened into `player-safe`.
- 0 runtime refs are missing generated manifest metadata.
- Runtime owner counts overlap because the same file can be referenced by
  multiple runtime surfaces; the release gate treats the unique-ref total and
  Git tracking status as the authoritative clean-checkout boundary.

Without this pass, a clean checkout would fail in two ways:

- Browser/runtime: player-visible rule cards, spell cards, reward images,
  inventory/market item art, avatar/icon backgrounds, and stage/background
  surfaces could request generated PNGs that are absent from the checkout. The
  result would be 404 image requests and broken/blank UI art.
- Tests: `tests/generatedAssets.test.js` and `tests/itemCatalog.test.js`
  previously treated generated PNG binary presence as part of the committed
  contract. Those checks fail when the binary package is intentionally absent.

Follow-up review confirms `tests/generatedManifestRegistration.test.js` is
tracked and uses the same external-binary contract: generated raster paths stay
in metadata, the PNG payload may remain outside Git, and committed fallback
files must resolve.

## Strategy

Chosen strategy: keep generated PNG binaries external and make runtime/test code
explicitly tolerant of their absence.

- Do not add generated PNG binaries to Git.
- Treat generated raster files as `external-pending-binary` at runtime contract
  level.
- Preserve manifest metadata, source-bound runtime-promotion metadata, and
  source references.
- Attach committed SVG fallback files to runtime asset references.
- In the browser, use image error fallback for `<img>` surfaces and layered CSS
  background fallback for background-image surfaces.
- In focused tests, assert metadata plus committed fallback availability instead
  of asserting generated PNG file presence.

This keeps the code mergeable without pretending the approved PNG pack has been
delivered.

## Implementation

- `src/core/assets.js`
  - Adds shared generated-raster detection, fallback selection, and
    `external-pending-binary` delivery metadata.
- `src/core/rules.js`
  - Enriches rule asset bindings with fallback and binary-delivery metadata.
- `src/core/itemCatalog.js`
  - Enriches item `assetRef` data and item presentation data with fallback and
    binary-delivery metadata.
- `src/core/assetSelection.js`
  - Carries fallback files through summarized selected assets.
- `public/app.js`
  - Adds committed fallback mapping, global image error fallback, runtime
    fallback attributes, and layered CSS background fallback.
- `tests/generatedAssets.test.js`
  - Keeps manifest/runtime metadata coverage while accepting external pending
    generated raster binaries when a committed fallback exists.
- `tests/generatedManifestRegistration.test.js`
  - Checks representative registrations and Kepler sheets against the same
    external-binary/fallback contract.
- `tests/itemCatalog.test.js`
  - Checks item asset refs against the external-binary/fallback contract.
- `tests/playerUiAccess.test.js`
  - Asserts the 102 runtime-promoted refs stay source-bound and have fallback
    delivery metadata.
- `tests/levelingSkills.test.js` and `tests/levelingUi.test.js`
  - Add focused assertions that spell/leveling UI art exposes the fallback
    contract.

## Verification

Syntax checks:

```sh
node --check src/core/assets.js
node --check src/core/rules.js
node --check src/core/itemCatalog.js
node --check src/core/assetSelection.js
node --check public/app.js
```

Focused tests:

```sh
AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/generatedAssets.test.js tests/generatedManifestRegistration.test.js tests/playerUiAccess.test.js tests/itemCatalog.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/rules.test.js
```

Result: passed, 83/83.

```sh
git diff --check
```

Result: passed.

Full harness was intentionally not run for this worker.

## Merge Decision

The runtime blocker is closed for this fallback scope: the non-image code can
render without broken UI art because missing generated PNGs now have committed
fallbacks.

The binary package is still needed to show the final approved PNG art. It should
be delivered later by an explicit image package, artifact hydration step, CDN,
or other binary-delivery mechanism that places files at the existing
`assets/generated/...` manifest paths.

Do not broaden `runtime-promoted` into `player-safe` as part of this fallback.
The current contract only says source-bound UI refs may be used and can fall
back safely when the binary package is absent.
