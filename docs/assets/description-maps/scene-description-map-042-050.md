# Scene Description Map 042-050

## Summary

- Source file: `docs/assets/missing-asset-generation-prompts.md`
- Output JSON: `docs/assets/description-maps/scene-description-map-042-050.json`
- Scope: `aidm-scene-backbone-042-01..16` and `aidm-scene-backbone-050-01..50`
- Total manifest-ready entries: 66
- Kind: `scene`
- Status assigned: `manifest-ready-pending-registration`
- Priority split: `P1` 28, `P2` 28, `P3` 10

## Missing

- Expected prompt rows missing: 0
- Expected description rows missing: 0
- Referenced generated scene files missing: 0

## Mapping Notes

- Display names and bilingual descriptions come from the Description Map rows in `docs/assets/missing-asset-generation-prompts.md`.
- Variant axes come from the single-scene prompt rows: season, weather, time, encounter state, camera, mood, and suggested size.
- `semanticKey` and `gameplayBinding.assetSemanticKey` use the `sceneSemanticKey` value without the table prefix.
- `file` points to `assets/generated/scenes/<assetId>.png`; this plan does not edit image assets or the runtime manifest.

## Risks

- Registration is still pending; no changes were made to `assets/generated/manifest.json`, runtime code, or public assets.
- 7 entries have no seasonal axis in the source prompt row and are represented as `null`; these are mostly indoor, underground, volcanic, prison, or dream/planar scenes.
- Visual QA and manifest schema reconciliation are still separate follow-up steps before runtime use.
