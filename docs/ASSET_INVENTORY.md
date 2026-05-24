# Asset Inventory

Last audited: 2026-05-24 on `codex/log-sound-ui-assets-v10`.

This document is the human-readable inventory for generated image assets. The machine-readable source of truth remains `assets/generated/manifest.json`.

## Current Counts

Generated raster catalog:

- Generated sheets: 9.
- Raster assets: 164.
- Player-safe assets: 128.
- Internal placeholder assets: 36.
- Generated scene backdrops: 80 of the 500 long-term scene target.
- Total generated image target: 3000+ assets.

Category counts:

| Category | Count | Notes |
| --- | ---: | --- |
| `generated` | 36 | Internal marketplace exploration icons only. |
| `scenes` | 80 | Player-safe stage backdrops with scene descriptions, taxonomy, and soundscape hints. |
| `equipment` | 32 | Player-safe reward/equipment items with localized display names and descriptions. |
| `characters` | 16 | Player-safe character option icons for species and classes. |

Group counts:

| Group | Count | Visibility | Primary UI surfaces |
| --- | ---: | --- | --- |
| `generated-marketplace` | 36 | `internal` | `catalog-internal` only. |
| `generated-scenes` | 80 | `player-safe` | `stage-backdrop`. |
| `generated-rewards` | 32 | `player-safe` | `reward-card`, `transcript-event`. |
| `generated-character-options` | 16 | `player-safe` | `character-builder`, `party-avatar`, `player-detail`. |

## Sheet Inventory

| Sheet | Grid | Assets | Category | Group | Player-safe | Internal | Status |
| --- | --- | ---: | --- | --- | ---: | ---: | --- |
| `aidm-marketplace-sheet-001` | 6x6 | 36 | `generated` | `generated-marketplace` | 0 | 36 | Placeholder exploration sheet; not exposed to players. |
| `aidm-scenes-sheet-001` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved scene backdrops. |
| `aidm-ambience-scenes-sheet-002` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved ambience-aware scene backdrops. |
| `aidm-macro-scenes-sheet-003` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved macro scene expansion. |
| `aidm-macro-scenes-sheet-004` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved macro scene expansion. |
| `aidm-macro-scenes-sheet-005` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved macro scene expansion. |
| `aidm-reward-items-sheet-006` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved reward item icons. |
| `aidm-cultural-equipment-sheet-007` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved cultural equipment variants. |
| `aidm-character-options-sheet-008` | 4x4 | 16 | `characters` | `generated-character-options` | 16 | 0 | Approved character creation, party avatar, and player detail icons. |

## Sheet 008 Character Options

`aidm-character-options-sheet-008` added the 16 most important player-facing identity choices:

- Species: human, elf, dwarf, orc, tiefling, gnome, halfling, automaton.
- Classes: warrior, rogue, mage, cleric, ranger, bard, occultist, envoy.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "characters"`.
- `group: "generated-character-options"`.
- `uiSurface` containing `character-builder`, `party-avatar`, and `player-detail`.
- Localized `displayName` and `description`.
- A `semanticKey` shaped like `characters.species.<rules-id>.v01` or `characters.class.<rules-id>.v01`.
- `variantAxes.kind` as `species` or `class`, plus `variantAxes.rulesId`.
- `gameplay.slot` as `ancestry` for species or `class` for classes.

## Long-Term Taxonomy

The 3000+ catalog should grow through themed, reviewable batches. The top-level categories are:

- Scenes.
- Species.
- Classes.
- Weapons.
- Equipment slots.
- Scrolls.
- Consumables.
- Tradable junk.
- Social props.
- Weather/environment.

Use a BG3-like tree: player-readable category first, gameplay subtype second, visual/cultural variant third, and runtime surface last.

Recommended target split for the first 3000 assets:

| Category | Target | Purpose |
| --- | ---: | --- |
| Scenes | 500 | Stage backdrops, encounter spaces, exploration nodes, weather variants. |
| Species and portraits | 300 | Player options, NPC identities, faction looks, party avatars. |
| Classes and abilities | 300 | Class crests, actions, spell schools, conditions, dice/result symbols. |
| Weapons | 350 | Common, rare, cultural, improvised, magic, damaged, and upgraded variants. |
| Equipment slots | 550 | Armor pieces, jewelry, tools, instruments, focuses, trinkets. |
| Scrolls and documents | 250 | Spell scrolls, contracts, maps, warrants, letters, lore handouts. |
| Consumables | 250 | Potions, salves, bombs, food, drinks, oils, charms. |
| Tradable junk | 250 | Salvage, valuables, trophies, curios, vendor stock. |
| Social props | 150 | Gifts, bribes, tavern props, market goods, faction emblems. |
| Weather/environment | 100 | Overlays, hazards, ambience cues, environmental tokens. |

## Metadata Contract

Player-safe assets need enough metadata to be selected by game logic and inspected by players:

- `id`: stable frame id.
- `name`: readable English name.
- `displayName`: localized object for inventory and character assets.
- `description`: immersive stage prompt string for scenes or localized object for inventory/character assets.
- `semanticKey`: stable lookup key independent of filename.
- `variantOf`: base concept shared by variants.
- `variantAxes`: culture, item kind, rarity, weather, time of day, threat level, visual style, background, or rules id.
- `visibility`: `player-safe` or `internal`.
- `uiSurface`: explicit player/admin surfaces where this asset may appear.
- `quality`: approval status, duplicate risk, and safety flags.
- `provenance`: prompt id, source sheet, source SHA-256, generator, row, and column.
- `license`: generation license and usage scope.

Scene assets additionally keep `sceneSlug`, `taxonomy`, `soundscapeHints`, `mood`, `timeOfDay`, `weather`, `threatLevel`, and `narrativeUses`.

Inventory assets additionally need gameplay data before runtime binding: item kind, value, condition, tradability, use effect, rarity, and ownership rules. Images should decorate data-backed items, not define the item alone.

## Batch Workflow

1. Pick one taxonomy branch and one runtime purpose.
2. Draft a sheet plan with prompt id, sheet id, category, group, surface list, expected grid, and transparency mode.
3. Generate a contact sheet in ChatGPT image generation.
4. Save the source under `assets/generated/sheets/`.
5. Slice with the arm64 Python/Pillow path:

```bash
/Users/yixuan.zhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/ingest-imagegen-sheet.py --input <sheet.png> --out-dir <asset-dir> --group <group> --prefix <prefix> --rows 4 --cols 4 --manifest assets/generated/manifest.json --sheet-id <sheet-id> --category-id <category-id>
```

6. Use `--chroma-key` for transparent icon sheets. Do not use it for painted scene cards.
7. Add or enrich metadata: localized names, immersive descriptions, semantic keys, variant axes, gameplay fields, visibility, UI surfaces, and quality status.
8. Run tests and update this inventory count in the same asset batch change.

## Deduplication Rules

- `id` values are globally unique across `rasterAssets`.
- `semanticKey` values should be globally unique for player-safe assets before new batches are approved.
- `sheet.assetIds.length` must equal the number of frame registrations for that sheet.
- `assetCatalog.actualGeneratedRasterAssets` must equal `rasterAssets.length`.
- `assetCatalog.playerSafeAssets` and `assetCatalog.internalAssets` must match visibility counts.
- Similar art is allowed only when `variantAxes` explains the difference.
- Internal marketplace exploration assets must not appear in player UI surfaces.
- Placeholder or unapproved assets remain `internal` until reviewed.

Known duplicate debt in the current inventory: 8 scene semantic keys are reused across earlier scene expansion variants. This is tolerated as existing inventory debt only; the generated asset tests guard that the debt does not grow and that duplicates remain limited to scene variants.

## Known Runtime Issue

The default `python3` on this workstation currently resolves to `/Users/yixuan.zhang/pyglobal/.venv/bin/python3`, an x86_64 interpreter. Importing Pillow through that interpreter can fail with a Rosetta `_imaging.cpython-312-darwin.so.aot` code-signature error.

Use this arm64 runtime for sheet slicing:

```bash
/Users/yixuan.zhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
```

The ingester now checks for a non-arm64 macOS interpreter before importing Pillow and exits with the recommended runtime path instead of surfacing the lower-level Rosetta error.
