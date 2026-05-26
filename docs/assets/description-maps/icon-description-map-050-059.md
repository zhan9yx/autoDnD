# Icon Description Map 050-059

## Summary

- Source file: `docs/assets/missing-asset-generation-prompts.md`
- Output JSON: `docs/assets/description-maps/icon-description-map-050-059.json`
- Scope: 050 hostile tokens, 051 npc tokens, 052 weapons, 053 armor/outfits, 054 consumables/provisions, 055 tools/clues, 056 treasure/materials, 057 spell/scroll/rune, 058 status/hazard, 059 faction/overlay.
- Expected planned cells: 640
- Actual manifest-ready entries written: 640
- Status assigned: `manifest-ready-pending-registration`
- Priority split: `P1` 320, `P2` 256, `P3` 64

## Counts

| Slice | Source prompt ref | Expected | Parsed rows | JSON entries | Missing rows | Missing files | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 050 hostile tokens | `icon-sheet-050-hostile-tokens` | 64 | 64 | 64 | 0 | 0 | none |
| 051 npc tokens | `icon-sheet-051-npc-tokens` | 64 | 64 | 64 | 0 | 0 | none |
| 052 weapons | `icon-sheet-052-weapons` | 64 | 64 | 64 | 0 | 0 | none |
| 053 armor/outfits | `icon-sheet-053-armor-outfits` | 64 | 64 | 64 | 0 | 0 | 64 entries normalized to actual file basename |
| 054 consumables/provisions | `icon-sheet-054-consumables-provisions` | 64 | 64 | 64 | 0 | 0 | none |
| 055 tools/clues | `icon-sheet-055-tools-clues` | 64 | 64 | 64 | 0 | 0 | none |
| 056 treasure/materials | `icon-sheet-056-treasure-materials` | 64 | 64 | 64 | 0 | 0 | none |
| 057 spell/scroll/rune | `icon-sheet-057-spells-scrolls-runes` | 64 | 64 | 64 | 0 | 0 | none |
| 058 status/hazard | `icon-sheet-058-status-hazards` | 64 | 64 | 64 | 0 | 0 | accept-with-risk carried forward |
| 059 faction/overlay | `icon-sheet-059-factions-overlays` | 64 | 64 | 64 | 0 | 0 | none |

## Missing

- Expected prompt/description rows missing: 0
- Referenced generated PNG files missing: 0

## Mapping Notes

- Display names, bilingual descriptions, priorities, source categories, and source gameplay binding strings come from the Description Map rows in `docs/assets/missing-asset-generation-prompts.md`.
- `file` paths are current sliced PNG paths under `assets/generated/tokens`, `assets/generated/items`, `assets/generated/spells`, and `assets/generated/icons`.
- `semanticKey` values are derived from the source binding prefix and slug, preserving the source binding in `gameplayBinding.sourceBinding` for registration review.
- 053 prompt rows use `aidm-armor-outfit-053-##`, while current slices are named `aidm-armor-outfit-cutout-053-##.png`; JSON entries use the actual sliced asset id/file basename and preserve the prompt id in `sourceAssetId`.

## Risks

- Registration is still pending; no changes were made to `assets/generated/manifest.json`, runtime code, public assets, source prompts, image assets, or Harness files.
- 058 status/hazard is explicitly `accept-with-risk`: existing alpha QA accepts the slice set but notes possible green poison, acid, gas, and glow edge/detail loss after chroma-key cleanup.
- 052, 053, and 054 have earlier source-size/grid-boundary slicing risk notes; this mapping only records metadata and does not re-slice or visually re-QA the images.
- 053 has a source prompt id versus sliced filename mismatch; this plan normalizes to actual file naming for manifest readiness.
