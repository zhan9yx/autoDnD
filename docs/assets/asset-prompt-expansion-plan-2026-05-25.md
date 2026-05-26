# Asset Prompt Expansion Plan 2026-05-25

Status: planning only. This index records the 0020 prompt expansion wave and points downstream workers to the canonical prompt and description rows in `docs/assets/missing-asset-generation-prompts.md`. It does not generate images, cut sheets, register manifests, or change runtime code.

## Wave Allocation

| Wave | Prompt refs | Count | Purpose | Downstream source target | Status |
| --- | --- | ---: | --- | --- | --- |
| Single scenes | `scene-050-01` through `scene-050-50` | 50 | Common reusable adventure backdrops for social, travel, dungeon, wilderness, settlement, mystery, and otherworld scenes | `assets/generated/scenes/aidm-scene-backbone-050-*.png` after generation review | ready-for-generation |
| Hostile tokens | `icon-sheet-050-hostile-tokens` | 64 cells | Enemy and monster encounter tokens | `assets/generated/sheets/aidm-hostile-token-icons-sheet-050.png` | ready-for-generation |
| NPC tokens | `icon-sheet-051-npc-tokens` | 64 cells | Civilian, professional, and quest-role NPC markers | `assets/generated/sheets/aidm-npc-token-icons-sheet-051.png` | ready-for-generation |
| Weapons | `icon-sheet-052-weapons` | 64 cells | Weapon inventory and loot cutouts | `assets/generated/sheets/aidm-weapon-cutouts-sheet-052.png` | ready-for-generation |
| Armor and outfits | `icon-sheet-053-armor-outfits` | 64 cells | Wearable equipment and appearance variants | `assets/generated/sheets/aidm-armor-outfit-cutouts-sheet-053.png` | ready-for-generation |
| Consumables and provisions | `icon-sheet-054-consumables-provisions` | 64 cells | Recovery, travel, and utility consumables | `assets/generated/sheets/aidm-consumable-provision-icons-sheet-054.png` | ready-for-generation |
| Tools and clues | `icon-sheet-055-tools-clues` | 64 cells | Tools, evidence, and quest inventory items | `assets/generated/sheets/aidm-tool-clue-icons-sheet-055.png` | ready-for-generation |
| Treasure and materials | `icon-sheet-056-treasure-materials` | 64 cells | Currency, treasure, crafting, and monster materials | `assets/generated/sheets/aidm-treasure-material-icons-sheet-056.png` | ready-for-generation |
| Spells, scrolls, and runes | `icon-sheet-057-spells-scrolls-runes` | 64 cells | Spell variants, school runes, seals, and ritual effects | `assets/generated/sheets/aidm-spell-scroll-rune-icons-sheet-057.png` | ready-for-generation |
| Status and hazards | `icon-sheet-058-status-hazards` | 64 cells | Conditions, terrain states, traps, and environment hazards | `assets/generated/sheets/aidm-status-hazard-icons-sheet-058.png` | ready-for-generation |
| Factions and overlays | `icon-sheet-059-factions-overlays` | 64 cells | Faction badges, class emblems, weather, season, time, and locale overlays | `assets/generated/sheets/aidm-faction-overlay-icons-sheet-059.png` | ready-for-generation |

## Delta Counts

| Planned set | Added count | Canonical location |
| --- | ---: | --- |
| Single-scene prompts | 50 | `docs/assets/missing-asset-generation-prompts.md` `## Single Scene Prompts` |
| Icon/cutout sheets | 10 | `docs/assets/missing-asset-generation-prompts.md` `## Sprite Sheet Prompts` |
| Planned icon/cutout cells | 640 | `icon-sheet-050-*` through `icon-sheet-059-*` |
| Description map rows | 690 | `docs/assets/missing-asset-generation-prompts.md` `## Description Map` |

## Guardrails

- Do not use the active 0019 generation range `042-049` for this wave.
- Do not generate images from this change package until a generation worker explicitly claims a subset of `050-059`.
- Do not add placeholder raster assets, manifest entries, public files, or runtime bindings.
- Keep all implementation statuses at `ready-for-generation` until actual files are generated, sliced, registered, and reviewed.
