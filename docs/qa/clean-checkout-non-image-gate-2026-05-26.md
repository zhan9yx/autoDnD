# Clean Checkout Non-Image Gate - 2026-05-26

Worker: AJ

## Result

Clean-checkout missing generated PNG payloads are no longer a blocker for the non-image release gate.

The release can keep generated raster metadata in Git while excluding `assets/generated/**/*.png`, `jpg`, `jpeg`, and `webp` payloads. Runtime flows keep using generated raster paths as source metadata, but every player-facing generated raster reference must either carry or derive a committed fallback asset.

## Contract

- Metadata contract: `assets/generated/manifest.json` remains the auditable source of generated raster ids, paths, provenance, visibility, surfaces, and semantic keys.
- Binary payload contract: generated raster binary delivery is optional for non-image commits. `assetBinaryDelivery(file, context)` reports `external-pending-binary` and a committed fallback path for generated raster files.
- Runtime contract: server-side scene, item, spell, status, token, and reward bindings may point at generated PNG files, but expose fallback metadata through `fallbackFile` when possible.
- Browser contract: generated `<img>` tags use `data-runtime-fallback-src` or derive fallback paths on error. CSS-backed scene and avatar images render with a fallback background layer.
- Static HTML contract: app startup scans existing generated PNG `<img>` elements and installs fallback metadata, so static builder option images also recover if the original PNG request fails before later re-rendering.

## Coverage

- Manifest: generated raster metadata/provenance stays validated without requiring PNG file access.
- Item art: catalog asset refs validate committed fallback files instead of requiring generated PNG payloads.
- Spell art and leveling UI: generated spell/action/status/class badge art resolves to committed spell/item/class fallback assets.
- Scene selection: generated scene selection continues to choose player-safe backdrops and carries fallback-ready presentation metadata.
- UI image URLs: runtime generated PNG refs are manifest-registered, not `catalog-internal`, and have fallback delivery policy.
- Tests: alpha-channel payload checks now run only when payload files are present; when payloads are absent or simulated absent, the tests assert metadata and fallback contracts instead.

## Verification

Commands run from `/Users/yixuan.zhang/Documents/AIDM`:

```sh
node --check public/app.js
node --check src/core/assets.js
git diff --check -- src/core/assets.js public/app.js tests/generatedAssets.test.js tests/playerUiAccess.test.js docs/qa/clean-checkout-non-image-gate-2026-05-26.md
node --test tests/generatedAssets.test.js tests/playerUiAccess.test.js tests/itemCatalog.test.js tests/levelingSkills.test.js
/usr/bin/env AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/generatedAssets.test.js tests/playerUiAccess.test.js tests/itemCatalog.test.js tests/levelingSkills.test.js
/usr/bin/env AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING=1 node --test tests/assetSelection.test.js tests/sceneRuntimeIntegration.test.js
npm run smoke
```

Observed results:

- Focused generated/UI/catalog/leveling tests: 61 pass, 0 fail.
- Same focused tests with simulated missing generated raster payload: 61 pass, 0 fail.
- Scene and asset-selection focused tests with simulated missing generated raster payload: 15 pass, 0 fail.
- Smoke: `ok: true`; observed `generatedAssetCount: 1582`, `marketOffers: 75`, reward, buy/sell/equip, level-up, soundscape, combat, memory, and replay flow completed.

Full `npm run harness:check` was not run because this worker scope asked for focused tests/smoke and to avoid full harness unless necessary.

## Remaining Risk

- If a future runtime surface introduces a generated PNG through a new rendering path that bypasses `runtimeAssetFallbackAttrs`, `runtimeCssBackgroundImage`, or the startup scanner, it must add an equivalent fallback hook.
- Any future or currently untracked test that directly requires `access(asset.file)` for generated PNGs must be split the same way before it is included in the release test set.
- Existing generated PNG paths can still produce HTTP 404s in a clean checkout; this is acceptable for the current gate because the user-facing UI falls back to committed assets and the gameplay flow continues.
- This gate does not approve generated raster binaries for Git inclusion. It only proves non-image commits can merge without those payloads.
