# Generated Asset Promotion Policy

Date: 2026-05-26 CST
Worker: AE, generated asset promotion policy

## Scope

This pass closes the generated asset release-boundary mismatch recorded in `docs/qa/generated-asset-exposure-audit-2026-05-26.md`.

Current runtime recount across `src` and `public` found 209 unique generated PNG references. The risky subset is the same 102 unique untracked Kepler PNG slices from the audit: they are referenced by `src/core/rules.js`, `src/core/itemCatalog.js`, and `public/app.js`, and all are present in `assets/generated/manifest.json`.

## Policy

Chosen strategy: B, explicit source-bound runtime promotion.

The 102 runtime-referenced Kepler slices are not promoted into the broad `player-safe` asset pool or generated marketplace groups. Instead each exact runtime dependency now uses:

- `visibility: "runtime-promoted"`
- `uiSurface: ["ui-approved-runtime"]`
- `runtimePromotion.status: "ui-approved-runtime"`
- `runtimePromotion.scope: "source-bound-player-ui"`
- `runtimePromotion.catalogExposure: false`
- `runtimePromotion.playerSurfaces`: the audited UI surfaces for that source-bound usage

This separates audited runtime UI use from broad catalog exposure. It also avoids batch-promoting the full 768 Kepler icon/cutout set.

`quality.approved` intentionally remains `false` for these 102 assets. The policy records that the source-bound runtime usage is allowed, but it does not claim the assets have completed broad visual QA. The six `accept-with-risk` status/hazard assets retain their original review status and risk flags.

## Change Range

- `assets/generated/manifest.json`
  - 102 exact runtime-bound Kepler assets now have `runtime-promoted` metadata.
  - `assetCatalog.runtimePromotedAssets` records the count.
  - `exposurePolicy.runtimePromotion*` records the boundary rules.
- `scripts/register-generated-description-maps.mjs`
  - Recomputes source-bound runtime promotions from literal generated PNG refs under `src` and `public`.
  - Applies the boundary only to matching internal Kepler rows during manifest registration.
- `tests/generatedManifestRegistration.test.js`
  - Updates Kepler boundary assertions: 66 scene backbones remain `player-safe`, 102 exact icon/cutout rows are `runtime-promoted`, and the remaining 666 Kepler icon/cutout rows stay internal.
- `tests/generatedAssets.test.js`
  - Adds manifest count and runtime-promotion boundary checks.
- `tests/playerUiAccess.test.js`
  - Adds a runtime/source scan proving generated PNG refs are registered and no runtime ref remains `catalog-internal`.
- `tests/assetSelection.test.js`
  - Confirms runtime-promoted assets do not enter player-safe selection pools or stage pools.

## Verification

- `node scripts/register-generated-description-maps.mjs`: passed; merged 834 description-map assets and 18 sheets, no missing files or duplicate input ids.
- Runtime recount after promotion: 209 unique generated PNG refs in `src`/`public`; 102 untracked runtime refs; 102/102 are `runtime-promoted`; 0 remain `catalog-internal`; 0 are missing manifest metadata.
- `node --test tests/generatedManifestRegistration.test.js tests/generatedAssets.test.js tests/playerUiAccess.test.js tests/assetSelection.test.js tests/itemCatalog.test.js tests/itemEconomy.test.js tests/levelingSkills.test.js tests/levelingUi.test.js tests/rules.test.js`: passed, 97/97.
- `git diff --check`: passed.

## Remaining Risk

No asset-boundary blocker remains for the 102 audited runtime dependencies: the manifest no longer labels those UI-visible files as `catalog-internal`.

Remaining risks are explicit:

- The 102 files are still release dependencies and must be committed or delivered with the runtime code.
- `runtime-promoted` is not broad `player-safe`; these rows must not be used by generic asset selection or marketplace browsing until separate visual QA promotes them.
- The six `accept-with-risk` status/hazard assets are allowed only through the source-bound runtime policy and still need follow-up visual review before broad promotion.
