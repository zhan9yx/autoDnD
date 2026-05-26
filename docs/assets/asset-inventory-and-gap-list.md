# Asset Inventory And Gap List

Audit date: 2026-05-25 Asia/Shanghai.

Scope: product asset library under `assets/`, generated image registry, runtime references in `src/` and `public/`, and asset documentation in `docs/`. This pass does not add images, audio, manifest entries, or runtime code.

Related Harness context:

- Existing source of truth: `assets/manifest.json` for deterministic SVG assets and `assets/generated/manifest.json` for generated image sheets and sliced frames.
- Existing process docs: `docs/ASSET_PIPELINE.md`, `docs/ASSET_INVENTORY.md`, `docs/assets/generated-asset-ledger-2026-05-24.md`, and `docs/assets/asset-expansion-roadmap-2026-05-24.md`.
- The repo stores SRD reference metadata in `src/core/rules.js` as `dnd-srd-5.2.1`; this document uses SRD/DND terms only as asset taxonomy labels and does not copy rules text.

## Executive Summary

| Area | Current result |
| --- | ---: |
| Product media files under `assets/`, `public/`, `docs/` | 1612 |
| Image files under `assets/` | 1612 |
| Audio files under `assets/`, `public/`, `docs/` | 0 |
| Generated source sheets | 34 |
| Generated per-frame raster assets | 748 |
| Generated sheet/source + sliced PNG/SVG files referenced by generated manifest | 1530 |
| Deterministic SVG assets referenced by base manifest | 82 |
| Direct runtime-referenced product asset files | 128 |
| Docs-only referenced product asset files | 30 |
| Manifest-only product asset files | 1454 |
| Product asset files outside manifests | 0 |
| Product exact binary duplicate groups | 0 |
| Known generated semantic-key duplicate groups | 8 scene pairs |
| Harness QA screenshots outside product asset library | 16 PNG files |

The important operational conclusion is that the checked-in product asset library is well registered but visually shallow in several gameplay categories. The biggest gaps are not missing files on disk; they are missing data-backed visual concepts for actions, spell coverage, scroll variants, conditions, professions/subclasses, equipment breadth, reward/economy symbols, and scene variety toward the 500-scene target.

## Current Asset Inventory

### File System Coverage

| Location | Files | Role | Runtime exposure |
| --- | ---: | --- | --- |
| `assets/generated/items/` | 1000 | Generated item/equipment/reward PNGs plus SVG wrappers | Some direct, mostly manifest-mediated |
| `assets/generated/scenes/` | 264 | Generated scene PNGs plus SVG wrappers | Manifest-mediated scene selection; one CSS fallback image |
| `assets/generated/icons/` | 104 | Generated marketplace/status icon PNGs plus SVG wrappers | Status icons and internal marketplace review |
| `assets/generated/sheets/` | 34 | Original source sheets | Auditable source only |
| `assets/generated/options/` | 32 | Character option PNGs plus SVG wrappers | Direct character builder/avatar references |
| `assets/generated/spells/` | 32 | Spell icon PNGs plus SVG wrappers | Direct starter spell references and spell scroll references |
| `assets/generated/tokens/` | 32 | NPC/enemy token PNGs plus SVG wrappers | Manifest-mediated NPC token selection |
| `assets/generated/weapons/` | 32 | Generated weapon PNGs plus SVG wrappers | Several item definitions |
| `assets/enemies/` | 12 | Deterministic enemy SVG icons | Manifest/catalog |
| `assets/items/` | 12 | Deterministic item SVG icons | Several item definitions |
| `assets/spells/` | 12 | Deterministic spell/scroll SVG icons | Scroll item definitions |
| `assets/weapons/` | 12 | Deterministic weapon SVG icons | Item definitions and manifest |
| `assets/scenes/` | 10 | Deterministic scene SVG cards | Manifest/catalog |
| `assets/classes/` | 8 | Deterministic class SVG crests | Manifest/catalog |
| `assets/npcs/` | 8 | Deterministic NPC SVG icons | Manifest/catalog |
| `assets/species/` | 8 | Deterministic species SVG icons | Manifest/catalog |

There is no `public/assets/` directory and no image/audio media under `docs/` in the current product asset scope. `.harness/changes/0011-production-depth/screenshots/` contains 16 QA screenshots; these are evidence artifacts, not product assets.

### Type And Size

| Type | Count in product assets |
| --- | ---: |
| PNG | 782 |
| SVG | 830 |
| Audio (`mp3`, `wav`, `ogg`, `m4a`, `flac`) | 0 |

Common dimensions:

| Dimension | Count | Typical use |
| --- | ---: | --- |
| `512x512` | 1200 | Generated cutout/icon PNGs and SVG wrappers |
| `313x313` | 192 | Early 4x4 generated sheet slices |
| `256x256` | 82 | Deterministic SVG viewboxes |
| `362x271` | 64 | Production/weather scene frames and wrappers |
| `384x256` | 32 | Scene/consumable full-bleed or cutout frames |
| `1254x1254` | 29 | Source sheets |
| `627x627` | 8 | 2x2 ambient scene frames and wrappers |
| `1536x1024` | 2 | Source sheets |
| `1448x1086` | 2 | Source sheets |
| `1402x1122` | 1 | Source sheet |

### Manifest Coverage And References

| Reference state | Count | Meaning |
| --- | ---: | --- |
| Direct runtime reference | 128 | Mentioned in `src/` or `public/`, mostly item catalog, character options, starter spell art, and CSS fallback scene art |
| Docs-only reference | 30 | Mentioned by asset docs and ledgers, not directly by runtime code |
| Manifest-only reference | 1454 | Registered for selection/review but not hardcoded in runtime |
| Product orphan | 0 | No product media file under `assets/`, `public/`, or `docs/` is outside the manifests |

Direct runtime references cluster as follows:

| Directory | Direct refs |
| --- | ---: |
| `assets/generated/items/` | 71 |
| `assets/generated/options/` | 16 |
| `assets/generated/spells/` | 16 |
| `assets/spells/` | 7 |
| `assets/items/` | 6 |
| `assets/generated/weapons/` | 3 |
| `assets/generated/scenes/` | 1 |

Repeated runtime asset use that should be treated as intentional reuse or later cleanup, not binary duplication:

| Asset file | Runtime item ids sharing it |
| --- | --- |
| `assets/items/storm-lantern.svg` | `travel-lamp`, `storm-lantern`, `rain-glass` |
| `assets/items/silver-ledger.svg` | `field-notebook`, `silver-ledger`, `field-primer` |
| `assets/weapons/ward-shield.svg` | `shield`, `chainmail` |
| `assets/items/witness-charm.svg` | `focus-tonic`, `moon-silk` |

Known generated semantic-key duplicate debt:

| Semantic key | Asset ids |
| --- | --- |
| `scene.bellmaker.alley` | `aidm-scene-03`, `aidm-macro-scene-003-04` |
| `scene.breaker.tunnel` | `aidm-scene-10`, `aidm-macro-scene-003-09` |
| `scene.royal.war.room` | `aidm-scene-16`, `aidm-macro-scene-004-03` |
| `scene.misty.forest.path` | `aidm-ambience-scene-02`, `aidm-macro-scene-005-01` |
| `scene.waterfall.grotto` | `aidm-ambience-scene-04`, `aidm-macro-scene-005-05` |
| `scene.desert.ruin.dusk` | `aidm-ambience-scene-13`, `aidm-macro-scene-005-09` |
| `scene.lava.bridge` | `aidm-ambience-scene-15`, `aidm-macro-scene-005-11` |
| `scene.moonlit.pond.garden` | `aidm-macro-scene-003-12`, `aidm-macro-scene-005-03` |

## Generated Image Status

Generated image registry snapshot:

| Category | Count | Notes |
| --- | ---: | --- |
| `generated` | 36 | Internal marketplace exploration placeholders |
| `scenes` | 132 | Player-safe stage/relevant-scene backdrops |
| `equipment` | 516 | Rewards, inventory, market, cutouts, quest clues, internal inventory review |
| `characters` | 32 | Character option icons and NPC/enemy tokens |
| `spells` | 16 | Player-safe spell icons |
| `rules` | 16 | Player-safe status/condition icons |

Generated groups:

| Group | Count | Visibility |
| --- | ---: | --- |
| `generated-marketplace` | 36 | internal |
| `generated-inventory-review` | 237 | internal |
| `generated-scenes` | 132 | player-safe |
| `generated-rewards` | 263 | player-safe |
| `generated-quest-clues` | 16 | player-safe |
| `generated-character-options` | 16 | player-safe |
| `generated-npc-tokens` | 16 | player-safe |
| `generated-spells` | 16 | player-safe |
| `generated-status-effects` | 16 | player-safe |

Runtime surface coverage:

| Surface | Assets |
| --- | ---: |
| `catalog-internal` | 273 |
| `stage-backdrop` | 132 |
| `relevant-scene` | 52 |
| `reward-card` | 279 |
| `inventory-item` | 247 |
| `market-item` | 231 |
| `item-detail` | 247 |
| `transcript-event` | 64 |
| `character-builder` | 32 |
| `party-avatar` | 16 |
| `player-detail` | 32 |
| `encounter-card` | 16 |
| `npc-token` | 16 |
| `combatant-detail` | 32 |
| `spell-card` | 16 |
| `status-icon` | 16 |

Generated source sheets:

| Sheet | Grid | Assets | Source dimension | Tile/frame | Primary category |
| --- | --- | ---: | --- | --- | --- |
| `aidm-marketplace-sheet-001` | 6x6 | 36 | `1254x1254` | `209x209` | `generated` |
| `aidm-scenes-sheet-001` | 4x4 | 16 | `1254x1254` | `313x313` | `scenes` |
| `aidm-ambience-scenes-sheet-002` | 4x4 | 16 | `1254x1254` | `313x313` | `scenes` |
| `aidm-macro-scenes-sheet-003` | 4x4 | 16 | `1254x1254` | `313x313` | `scenes` |
| `aidm-macro-scenes-sheet-004` | 4x4 | 16 | `1254x1254` | `313x313` | `scenes` |
| `aidm-macro-scenes-sheet-005` | 4x4 | 16 | `1254x1254` | `313x313` | `scenes` |
| `aidm-reward-items-sheet-006` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-cultural-equipment-sheet-007` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-character-options-sheet-008` | 4x4 | 16 | `1254x1254` | `313x313` | `characters` |
| `aidm-market-items-sheet-009` | 5x4 | 20 | `1402x1122` | `280x280` | `equipment` |
| `aidm-consumable-cutouts-sheet-010` | 4x4 | 16 | `1536x1024` | `384x256` | `equipment` |
| `aidm-production-scenes-sheet-011` | 4x4 | 16 | `1448x1086` | `362x271` | `scenes` |
| `aidm-npc-tokens-sheet-012` | 4x4 | 16 | `1254x1254` | `313x313` | `characters` |
| `aidm-equipment-fashion-sheet-013` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-weapons-sheet-014` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-spells-sheet-015` | 4x4 | 16 | `1254x1254` | `313x313` | `spells` |
| `aidm-trade-goods-sheet-016` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-quest-clues-sheet-017` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-status-effects-sheet-018` | 4x4 | 16 | `1254x1254` | `313x313` | `rules` |
| `aidm-accessories-cutouts-sheet-019` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-transparent-cutouts-sheet-020` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-tools-cutouts-sheet-021` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-trophies-cutouts-sheet-022` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-wearables-cutouts-sheet-023` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-weapons-cutouts-sheet-024` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-magic-cutouts-sheet-025` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-trade-cutouts-sheet-026` | 4x4 | 16 | `1254x1254` | `313x313` | `equipment` |
| `aidm-production-scenes-sheet-027` | 4x4 | 16 | `1536x1024` | `384x256` | `scenes` |
| `aidm-weather-scenes-sheet-028` | 4x4 | 16 | `1448x1086` | `362x271` | `scenes` |
| `aidm-inventory-expansion-sheet-029` | 8x8 | 64 | `1254x1254` | `156x156` | `equipment` |
| `aidm-inventory-expansion-sheet-030` | 8x8 | 64 | `1254x1254` | `156x156` | `equipment` |
| `aidm-inventory-expansion-sheet-031` | 8x8 | 64 | `1254x1254` | `156x156` | `equipment` |
| `aidm-ambient-scenes-sheet-032` | 2x2 | 4 | `1254x1254` | `627x627` | `scenes` |
| `aidm-inventory-expansion-sheet-033` | 8x8 | 64 | `1254x1254` | `156x156` | `equipment` |

Generated frame dimensions:

| Frame size | Frames |
| --- | ---: |
| `313x313` | 368 |
| `156x156` | 256 |
| `209x209` | 36 |
| `384x256` | 32 |
| `362x271` | 32 |
| `280x280` | 20 |
| `627x627` | 4 |

## Scene Coverage

Current generated scene count is 132 player-safe backdrops. Long-term target remains 500 player-safe generated scenes, so the scene gap is 368.

Scene weather tags are uneven:

| Weather tag | Count |
| --- | ---: |
| `clear` | 71 |
| `rain` | 23 |
| `indoor` | 6 |
| `wet` | 5 |
| `snow` | 4 |
| `heavy-rain` | 3 |
| `thunderstorm` | 3 |
| `light-rain` | 3 |
| `spray` | 3 |
| `mist` | 2 |
| `storm` | 2 |
| Other singletons | 7 |

Time-of-day coverage is also uneven:

| Time | Count |
| --- | ---: |
| `night` | 61 |
| `variable` | 41 |
| `day` | 16 |
| `dusk` | 5 |
| `dawn` | 2 |
| `evening` | 2 |
| `midnight` | 2 |
| Other singletons | 3 |

Scene-specific missing buckets:

| Bucket | Existing signal | Gap |
| --- | --- | --- |
| Season variants | Spring/summer/autumn/winter exist as soundscape terms, not as balanced scene inventory | Need seasonal scene art by location type |
| Weather variants | Rain/clear dominate | Need fog, snow, dust, heat, wind, smoke, storm aftermath, ash, magical weather |
| Location taxonomy | Many older scenes have `unknown` location taxonomy | Need normalized city/wilderness/dungeon/interior/social/faction/hazard labels |
| Encounter state | Some threat tags exist | Need clean variants for calm, investigation, social tension, ambush, active combat, aftermath, victory, retreat |
| Day/night | Night and variable dominate | Need dawn/day/dusk per common location |
| Soundscape match | Scene hints exist | Need visual coverage for all soundscape presets and layer families |

## Spell And Scroll Completeness

### Current Rules Baseline

AIDM currently defines 32 spells in `src/core/rules.js`.

| AIDM tier | Count | DND/SRD-style asset interpretation |
| --- | ---: | --- |
| `tier-0` | 1 | Cantrip-style low-cost/basic spell visuals |
| `tier-1` | 26 | Current main low-level spell visual set |
| `tier-2` | 5 | Stronger/ritual/mobility/area spell visuals |
| DND/SRD levels 3-9 | 0 local definitions | Future expansion only; not a current runtime gap |

Spells by school:

| School/source family | Runtime spells |
| --- | ---: |
| `evocation` | 6 |
| `abjuration` | 5 |
| `divination` | 3 |
| `enchantment` | 3 |
| `illusion` | 3 |
| `restoration` | 3 |
| `transmutation` | 3 |
| `conjuration` | 2 |
| `divine` | 2 |
| `nature` | 1 |
| `necromancy` | 1 |

Spells by use:

| Use/category | Runtime spells |
| --- | ---: |
| `control` | 9 |
| `damage` | 6 |
| `protection` | 5 |
| `healing` | 4 |
| `movement` | 3 |
| `ritual` | 3 |
| `scouting` | 2 |

Current generated spell icons are 16 icons from `aidm-spells-sheet-015`:

| Icon | Visual use |
| --- | --- |
| `Ember Bolt` | evocation attack/fire |
| `Frost Ward` | abjuration defense/cold |
| `Moonlit Step` | conjuration mobility |
| `Storm Lash` | evocation lightning attack |
| `Verdant Mend` | restoration/nature healing |
| `Grave Whisper` | necromancy debuff |
| `Mirror Veil` | illusion defense |
| `Iron Oath` | abjuration buff |
| `Lantern Sigil` | divination utility |
| `Blood Moon Hex` | enchantment control |
| `Tidecall` | conjuration/water control |
| `Clockwork Snare` | transmutation control |
| `Sun Choir` | evocation/radiance area |
| `Ashen Shroud` | illusion/stealth |
| `Starfall Rune` | evocation/astral area |
| `Wild Root Grasp` | transmutation/nature control |

Strict coverage gaps:

| Gap | Count | Notes |
| --- | ---: | --- |
| One unique spell icon per current spell | 16 missing | 32 spell definitions vs 16 generated spell icon concepts |
| Unique scroll icon per current spell | At least 12 missing | 20 `spellScroll` item definitions exist; 32 current spells exist |
| Ritual-specific icon family | 3 current runtime spells lack a strong dedicated visual language | `echo-ledger`, `threshold-circle`, `omen-map` |
| Social/control spell icons | Several runtime spells are currently aliases or lack direct art | `hush-ring`, `mirror-lure`, `blood-moon-hex` needs variants |
| Divine school identity | 2 runtime spells use custom `divine`; generated icons cover radiance but not a distinct divine school badge set | Add school badge/style variants |
| Scroll rarity/material variants | Existing scroll art is mixed with spell icons and item art | Need common/uncommon/rare/ritual scroll variants |

Recommended spell icon backlog by priority:

| Priority | Needed icons |
| --- | --- |
| P1 | Unique icons for `ember-lance`, `moonlit-shear`, `hush-ring`, `mirror-lure`, `bastion-mark`, `veil-of-rain`, `field-suture`, `steady-breath`, `mist-bridge`, `gale-hook`, `echo-ledger`, `threshold-circle`, `omen-map` |
| P1 | Scroll icons for the above plus scroll family badges by school |
| P2 | Second variants for existing aliased visuals: `cleanse-poison` vs `healing-word`, `frost-bind` vs `ward`, `glass-echo` vs `arcane-shield`, `sleep` vs `ashen-shroud` |
| P2 | School badges for SRD school set: abjuration, conjuration, divination, enchantment, evocation, illusion, necromancy, transmutation |
| P3 | Higher-level placeholder taxonomy for DND/SRD levels 3-9 only after local rules define those tiers |

## Status And Rules Icon Completeness

Runtime status effects: `burning`, `poisoned`, `stunned`, `guarded`, `marked`, `drowsy`, `restrained`, `slowed`, `shaken`, `cursed`, `silenced`, `distracted`.

Generated status icons: `Burning`, `Chilled`, `Poisoned`, `Bleeding`, `Stunned`, `Frightened`, `Blessed`, `Shielded`, `Hasted`, `Slowed`, `Invisible`, `Silenced`, `Cursed`, `Restrained`, `Regenerating`, `Marked`.

Coverage table:

| Status need | Current state | Gap |
| --- | --- | --- |
| Burning | generated + runtime | Covered |
| Poisoned | generated + runtime | Covered |
| Stunned | generated + runtime | Covered |
| Restrained | generated + runtime | Covered |
| Slowed | generated + runtime | Covered |
| Cursed | generated + runtime | Covered |
| Silenced | generated + runtime | Covered |
| Marked | generated + runtime | Covered |
| Guarded/shield/defend | runtime `guarded`, generated `Shielded` | Needs exact `guarded` semantic key or alias |
| Drowsy/sleep | runtime `drowsy` | Needs exact icon |
| Shaken/fear morale | runtime `shaken`, generated `Frightened` | Needs exact `shaken` or alias |
| Distracted/social lure | runtime `distracted` | Needs exact icon |
| Chilled/frozen | generated `Chilled` | Needs runtime condition or frozen variant |
| Bleeding | generated only | Needs runtime condition or keep as future art |
| Blessed | generated only | Needs runtime condition or keep as future art |
| Invisible | generated only | Needs runtime condition or keep as future art |
| Concentration | missing | Needed for DND/SRD-like spell maintenance affordance |
| SRD condition set | partial names only | Add blind/charm/deaf/prone/grappled/incapacitated/paralyzed/petrified/unconscious/exhaustion icons as taxonomy targets |

## Character, Species, Class, And Profession Coverage

Existing:

- 8 deterministic species SVGs: human, elf, dwarf, orc, gnome, tiefling, automaton, halfling.
- 8 deterministic class SVGs: warrior, rogue, mage, cleric, ranger, bard, occultist, envoy.
- 16 generated character option icons: 8 species cameos and 8 class crests.
- 16 generated NPC/enemy tokens.
- 5 warrior specializations in rules: dual-wielder, berserker, weapon-master, defender, tactical-commander.

Gaps:

| Category | Gap |
| --- | --- |
| Player portraits | No broad portrait library by species/class/background; current options are builder icons/cameos |
| Subclass/specialization badges | Warrior has 5 specializations but no dedicated generated badges; other classes have progression features but no subclass badge art |
| Background/profession tokens | No generated sheets for artisans, scholars, criminals, nobles, priests, soldiers, sailors, guides, merchants, spies, hirelings, shopkeepers |
| Enemy families | 16 generated NPC tokens plus 12 deterministic enemy SVGs are too shallow for encounter variety |
| Culture/faction variants | Some item variant axes exist; character portraits/tokens do not yet have a balanced regional/faction matrix |

## Equipment, Rewards, And Economy Coverage

Runtime item definitions currently total 81:

| Item category | Definitions |
| --- | ---: |
| `spellScroll` | 20 |
| `tool` | 16 |
| `weapon` | 9 |
| `tradeGood` | 9 |
| `fashion` | 7 |
| `armor` | 6 |
| `consumable` | 6 |
| `shield` | 4 |
| `food` | 3 |
| `quest` | 1 |

Generated equipment/reward inventory is numerically large at 516 assets, but 237 of those are still internal inventory-review frames and cannot be used by player flows until promoted frame by frame.

Missing equipment/reward groups:

| Category | Missing visual concepts |
| --- | --- |
| Weapon actions | Dedicated melee, ranged, thrown, reach, dual-wield, heavy, finesse, improvised, unarmed, spell-attack action icons |
| Armor and defense | More body armor, helmets, gloves, boots, cloaks, belts, bucklers, tower shields, wards, broken/damaged condition variants |
| Tools | Class/tool proficiency icons: thieves tools, healer kit, artisan tools, musical instruments, navigation, investigation kit, trap kit |
| Consumables | Potion families by effect: healing, mana, antidote, fire/ice/lightning resistance, stealth, speed, focus, social confidence |
| Spell scrolls | Scroll art by school, level/tier, rarity, paper/material, sealing style |
| Rewards | Gold/coin piles, gems, bars, monster parts, rare materials, relic shards, faction favors, reputation tokens |
| Rarity and economy | Common/uncommon/rare/epic/legendary badges, material tags, sellable junk, quest-only marks |
| Investigation/social props | Evidence, warrants, letters, contracts, rumors, bribes, blackmail, invitations, badges |

## Missing Asset Classes

This audit groups missing assets into 10 large classes:

| Priority | Missing class | Why it matters |
| --- | --- | --- |
| P0 | Scene semantic duplicate cleanup | Must be fixed before adding more player-safe scenes |
| P1 | Scene backbone | Need 368 more approved scenes to reach the 500-scene target |
| P1 | Spell and spell-scroll icons | 32 current spells vs 16 generated spell icons; scroll variants are incomplete |
| P1 | Action/attack icons | There is no dedicated action icon library for melee/ranged/spell/healing/control/social/investigation/stealth |
| P1 | Status/rules icons | Runtime statuses and SRD-style condition taxonomy are only partially covered |
| P2 | Character portraits and class/specialization badges | Current builder art is shallow; warrior specializations have no badge set |
| P2 | Equipment and item cutouts | Large inventory exists, but many frames are internal and not data-backed |
| P2 | Rewards, currency, materials, rarity | Economy visual grammar is not yet complete |
| P3 | Ambience/weather/hazard overlays | Soundscape visual chips and hazard overlays are not dedicated assets |
| P3 | Audio assets | No checked-in audio files; current soundscape is rule/synth/profile driven |

## Image Generation Plan

### Scene Images

For the next scene wave, generate scenes as single full-bleed images rather than multi-icon sprite sheets. If the current ingester needs a sheet-like source, treat each scene as a 1x1 preserved tile with a metadata plan.

Recommended scene output:

- Source size: `1536x1024` or larger, 3:2 or 16:9 full-bleed.
- No text, UI, frames, labels, watermarks, or isolated item icons.
- Register as `categoryId: "scenes"`, `group: "generated-scenes"`, `uiSurface: ["stage-backdrop", "relevant-scene"]`.
- Semantic key: `scene.<pack>.<location>.<weather>.<time>.<state>.v01`.
- Required metadata: `sceneSlug`, location taxonomy, weather, season, time of day, mood, threat level, encounter state, soundscape hints, narrative uses, bilingual display names, stageable description.

Prompt dimensions to vary:

| Dimension | Values |
| --- | --- |
| Location | city street, market, tavern, shrine, archive, dungeon, cave, forest road, swamp, mountain pass, harbor, courtroom, guild hall, camp, battlefield |
| Weather | clear, rain, heavy rain, fog, snow, wind, dust, smoke, thunder, magical weather |
| Season | spring, summer, autumn, winter |
| Time | dawn, day, dusk, night, midnight |
| Encounter state | calm, investigation, social tension, ambush, chase, combat, aftermath, victory, retreat |
| Threat | safe, tense, hidden danger, hostile, high-threat, deadly |
| Soundscape | rain, thunder, market, tavern, archive, shrine, forest, pond, waterfall, campfire, crowd, whispers, combat |

Scene priorities:

| Priority | Pack | Target |
| --- | --- | ---: |
| P0 | Fix or quarantine 8 duplicate scene semantic keys | 0 new images |
| P1 | Core missing location/weather/time backbone | 80-120 single scenes |
| P1 | Scene target catch-up toward 500 | 368 approved scenes total gap |
| P2 | Encounter-state variants for common locations | 80 scenes |
| P2 | Seasonal variants for travel and settlement locations | 64 scenes |
| P3 | Rare/planar/magical hazard scenes | 32 scenes |

### Sprite Sheet Plan For Small Icons

Small icons can be generated as sheets and sliced. Use a flat green `#00ff00` background unless true transparent output is available. Promoted PNGs must be chroma-keyed to alpha and pass the RGBA alpha gate.

Recommended base format:

- 8x8 sheet for simple icon/cutout sets: 64 icons.
- Source size: `4096x4096` if available; target tile after slicing: `512x512`.
- For denser but lower-quality drafts only, 4x4 at `2048x2048` with `512x512` tiles.
- Keep the original source under `assets/generated/sheets/`.
- Slice to domain directories: spells to `assets/generated/spells/`, statuses/actions to `assets/generated/icons/`, equipment/rewards to `assets/generated/items/`, portraits/tokens to `assets/generated/tokens/` or a future `assets/generated/characters/`.

Suggested sheets:

| Priority | Sheet id | Grid | Contents |
| --- | --- | --- | --- |
| P1 | `aidm-action-icons-sheet-034` | 8x8 | melee, ranged, thrown, spell attack, healing, control, area, defend, flee, sneak, investigate, social, support, ritual, tool use, movement, help, shove, grapple, disarm, mark, rally, dodge, opportunity |
| P1 | `aidm-spell-icons-sheet-035` | 8x8 | missing spell-specific icons, school badges, damage/heal/control/protection/movement/ritual/scouting variants |
| P1 | `aidm-scroll-icons-sheet-036` | 8x8 | scrolls by school, tier, rarity, seal/material, ritual circle, tablet, ward paper, spellbook page |
| P1 | `aidm-status-icons-sheet-037` | 8x8 | runtime statuses, SRD-style conditions, concentration, terrain/hazard states, buffs/debuffs |
| P2 | `aidm-class-badges-sheet-038` | 8x8 | class badges, warrior specializations, progression feature icons, background/profession symbols |
| P2 | `aidm-equipment-cutouts-sheet-039` | 8x8 | weapon families, armor slots, shields, tools, instruments, foci, consumables |
| P2 | `aidm-reward-economy-sheet-040` | 8x8 | coins, gems, materials, monster parts, relic fragments, rarity badges, faction favors |
| P3 | `aidm-ambience-hazard-icons-sheet-041` | 8x8 | weather chips, soundscape motifs, hazard overlays, terrain markers |

Naming rules:

- Sheet: `aidm-<domain>-sheet-###.png`.
- Frame: `aidm-<domain>-###-NN.png` and `aidm-<domain>-###-NN.svg`.
- Semantic key: `<domain>.<subtype>.<concept>.<variant>.v01`.
- For spells: `spells.<school>.<spell-id>.v01`.
- For scrolls: `items.spell-scroll.<school>.<spell-id-or-tier>.<rarity>.v01`.
- For statuses: `rules.condition.<condition-id>.v01`.
- For actions: `rules.action.<action-id>.<mode>.v01`.
- For rewards/economy: `items.reward.<material-or-currency>.<rarity>.v01`.

Cutting and review:

1. Generate with green background or true transparency.
2. Slice with `scripts/ingest-imagegen-sheet.py --chroma-key` for green-background icon sheets.
3. Register new frames as `internal` and `catalog-internal` first.
4. Promote only frame-level reviewed assets with runtime owner definitions.
5. For player-safe icons, remove `catalog-internal` and restrict surfaces to exact flows.
6. Run duplicate semantic-key checks before promotion.

## Validation Notes

Read-only/lightweight checks used for this audit:

- `find assets public docs -type f (...) | wc -l` returned 1612 product media files.
- Node-based manifest scan decoded PNG/SVG dimensions, counted manifest references, runtime references, semantic duplicates, and rule coverage.
- `rg` was used to inspect runtime asset maps, item definitions, spell definitions, status definitions, soundscape taxonomy, and existing asset docs.

No generated image assets, audio files, manifests, or product runtime code were modified by this document pass.
