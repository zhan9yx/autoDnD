# Asset Inventory

Last audited: 2026-05-24 on `codex/v11-production-depth`.

This document is the human-readable inventory for generated image assets. The machine-readable source of truth remains `assets/generated/manifest.json`.

## Player UI Boundary

Generated assets are not a player-facing catalog. The player table should only show images that are relevant to the current room state, character choice, item definition, reward, spell, NPC, or status condition.

Allowed player surfaces:

- `stage-backdrop` and `relevant-scene`: scene art selected from current location, mood, weather, threat, encounter state, and soundscape hints.
- `character-builder`, `party-avatar`, and `player-detail`: species/class identity art and character-facing portraits or icons.
- `spell-card`: known, learnable, or starting spell art backed by spell definitions.
- `market-item`, `inventory-item`, `reward-card`, and `item-detail`: item art backed by runtime item definitions with value, rarity, quantity, tradeability, condition, use/equip rules, and ownership state.
- `encounter-card`, `npc-token`, and `combatant-detail`: NPC/enemy art backed by encounter or NPC definitions.
- `status-icon`, `combatant-detail`, `transcript-event`, and `player-detail`: status art backed by condition/rules definitions.

Disallowed player exposure:

- `catalog-internal` assets, placeholder marketplace exploration frames, source sheet/provenance metadata, prompt IDs, duplicate-risk notes, and batch maintenance status.
- Broad generated galleries that are not filtered by current gameplay state.
- Generated images used as standalone gameplay objects without a data-backed item, spell, NPC, condition, or scene binding.

When adding a new batch, update this inventory and the manifest together. If the UI needs a new asset surface, add the surface deliberately and document which runtime definition owns it before exposing it to players.

## Current Counts

Generated raster catalog:

- Generated sheets: 29.
- Raster assets: 488.
- Player-safe assets: 452.
- Internal placeholder assets: 36.
- Planned sheet metadata templates: 11, including frame-reviewed templates for sheets 020-028.
- Generated scene backdrops: 128 player-safe backdrops of the 500 long-term scene target.
- Total generated image target: 3000+ assets.

Category counts:

| Category | Count | Notes |
| --- | ---: | --- |
| `generated` | 36 | Internal marketplace exploration icons only. |
| `scenes` | 128 | Player-safe stage backdrops and relevant scenes with scene descriptions, taxonomy, and soundscape hints. |
| `equipment` | 260 | Player-safe reward, equipment, weapons, trade goods, market, backpack, transparent cutout, accessory, reagent, tool, trophy, magic item, wearable, and quest clue items with localized display names and descriptions. |
| `characters` | 32 | Player-safe character option icons plus NPC/enemy tokens. |
| `spells` | 16 | Player-safe spell icons for spell cards and character builder choices. |
| `rules` | 16 | Player-safe condition/status icons for status rows, combatant detail, transcript events, and player detail. |

Group counts:

| Group | Count | Visibility | Primary UI surfaces |
| --- | ---: | --- | --- |
| `generated-marketplace` | 36 | `internal` | `catalog-internal` only. |
| `generated-scenes` | 128 | `player-safe` | `stage-backdrop`, `relevant-scene`. |
| `generated-rewards` | 244 | `player-safe` | `reward-card`, `transcript-event`, `inventory-item`, `market-item`, `item-detail`. |
| `generated-quest-clues` | 16 | `player-safe` | `inventory-item`, `reward-card`, `item-detail`, `transcript-event`. |
| `generated-character-options` | 16 | `player-safe` | `character-builder`, `party-avatar`, `player-detail`. |
| `generated-npc-tokens` | 16 | `player-safe` | `encounter-card`, `npc-token`, `combatant-detail`. |
| `generated-spells` | 16 | `player-safe` | `spell-card`, `character-builder`. |
| `generated-status-effects` | 16 | `player-safe` | `status-icon`, `combatant-detail`, `transcript-event`, `player-detail`. |

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
| `aidm-market-items-sheet-009` | 5x4 | 20 | `equipment` | `generated-rewards` | 20 | 0 | Approved inventory, market, reward, and item detail icons. |
| `aidm-consumable-cutouts-sheet-010` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved transparent cutout icons for inventory, market, reward, and item detail flows. |
| `aidm-production-scenes-sheet-011` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved production scene backdrops for stage and relevant scene selection. |
| `aidm-npc-tokens-sheet-012` | 4x4 | 16 | `characters` | `generated-npc-tokens` | 16 | 0 | Approved NPC/enemy tokens for encounter, token, and combatant detail flows. |
| `aidm-equipment-fashion-sheet-013` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved equipment and fashion item icons for inventory, market, reward, and item detail flows. |
| `aidm-weapons-sheet-014` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved weapon icons for inventory, market, reward, and item detail flows. |
| `aidm-spells-sheet-015` | 4x4 | 16 | `spells` | `generated-spells` | 16 | 0 | Approved spell icons for spell cards and character builder choices. |
| `aidm-trade-goods-sheet-016` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved trade goods, food, drink, and tavern prop icons for inventory, market, reward, and item detail flows. |
| `aidm-quest-clues-sheet-017` | 4x4 | 16 | `equipment` | `generated-quest-clues` | 16 | 0 | Approved investigation clue, document, and task item icons for inventory, reward, item detail, and transcript flows. |
| `aidm-status-effects-sheet-018` | 4x4 | 16 | `rules` | `generated-status-effects` | 16 | 0 | Approved condition/status icons for status rows, combatant detail, transcript events, and player detail. |
| `aidm-accessories-cutouts-sheet-019` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved transparent accessory cutouts for inventory, market, reward, and item detail flows. |
| `aidm-transparent-cutouts-sheet-020` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved crafting material and alchemical reagent cutouts for inventory, market, reward, and item detail flows. |
| `aidm-tools-cutouts-sheet-021` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved tools, traps, and gadget cutouts for inventory, market, reward, and item detail flows. |
| `aidm-trophies-cutouts-sheet-022` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved trophy, monster-part, and barter-good cutouts for inventory, market, reward, and item detail flows. |
| `aidm-wearables-cutouts-sheet-023` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved wearable armor, clothing, cloaks, belts, masks, gloves, and travel gear cutouts for inventory, market, reward, and item detail flows. |
| `aidm-weapons-cutouts-sheet-024` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved weapon and shield cutouts for inventory, market, reward, and item detail flows. |
| `aidm-magic-cutouts-sheet-025` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved scroll, ritual focus, reagent, and divination tool cutouts for inventory, market, reward, and item detail flows. |
| `aidm-trade-cutouts-sheet-026` | 4x4 | 16 | `equipment` | `generated-rewards` | 16 | 0 | Approved food, drink, luxury trade-good, instrument, and tavern prop cutouts for inventory, market, reward, and item detail flows. |
| `aidm-production-scenes-sheet-027` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved production-scale social, wilderness, dungeon, and war-camp backdrops for stage and relevant scene selection. |
| `aidm-weather-scenes-sheet-028` | 4x4 | 16 | `scenes` | `generated-scenes` | 16 | 0 | Approved weather and environmental soundscape backdrops for stage and relevant scene selection. |

## Sheets 027-028 Grand Scene Backdrops

Sheets `aidm-production-scenes-sheet-027` and `aidm-weather-scenes-sheet-028` added 32 player-safe scene backdrops:

- Sheet 027: orchard shrine road, mist river ferry, lantern festival plaza, imperial rotunda, storm library, sun bazaar, moss ravine bridge, snow gate, graveyard cathedral, forge hall, crystal cavern, mountain monastery, storm harbor, flooded aqueduct, war council, and war camp aftermath.
- Sheet 028: rain tavern street, lightning causeway, fog marsh, wind monastery, ember camp, sunny pond, snow trail, dust canyon, jungle ruin pool, rooftop chase, tavern song hall, mine lift cavern, rain manor, bell temple square, ruined drizzle alley, and waterfall shrine garden.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "scenes"`.
- `group: "generated-scenes"`.
- `uiSurface` exactly scoped to `stage-backdrop` and `relevant-scene`.
- No `catalog-internal` or gallery-style surface exposure.
- Bilingual `displayName` values and `zhName`.
- A unique `semanticKey` shaped like `scene.production.<scene-slug>.v01` or `scene.weather.<scene-slug>.v01`.
- Scene taxonomy, `weather`, `timeOfDay`, `mood`, `threatLevel`, and `soundscapeHints` for asset selection and ambience matching.
- Immersive descriptions written as stageable scene text, not provenance strings.

The registered plans use `metadataPlanId` values `sheet-027-production-scenes` and `sheet-028-weather-scenes`. Re-ingest must pass those plan ids with `--visibility player-safe --preserve-tile` so every frame keeps `sceneSlug`, taxonomy, weather, time of day, mood, threat level, `soundscapeHints`, and `narrativeUses`.

## Sheets 023-026 Cutout Runtime Batch

Sheets `aidm-wearables-cutouts-sheet-023`, `aidm-weapons-cutouts-sheet-024`, `aidm-magic-cutouts-sheet-025`, and `aidm-trade-cutouts-sheet-026` added 64 #00ff00 chroma-key transparent item cutouts:

- Sheet 023: wearable armor and clothing, including helms, cuirasses, chain shirts, cloaks, tunics, mantles, gloves, masks, boots, belts, and toolwear.
- Sheet 024: weapons and shields, including sabers, mauls, daggers, rapiers, bows, crossbows, spears, shields, whips, maces, halberds, axes, javelins, and scimitars.
- Sheet 025: magic items, including spell scrolls, warding tablets, scrying orbs, ritual knives, bells, astrolabes, rune stones, incense burners, bottled spirits, wands, formulas, amulets, mirrors, and card decks.
- Sheet 026: trade goods and tavern props, including wine, provisions, pies, ale, cheese, sweets, smoked fish, trays, spices, assay tools, portraits, tableware, cloth, tea bricks, instruments, and dice.

The registered plans use:

- `metadataPlanId` values `sheet-023-wearables-cutouts`, `sheet-024-weapons-cutouts`, `sheet-025-magic-cutouts`, and `sheet-026-trade-cutouts`.
- 4x4 grids, `expectedOutDir: "assets/generated/items"`, and frame id patterns `aidm-wearable-cutout-023-##`, `aidm-weapon-cutout-024-##`, `aidm-magic-cutout-025-##`, and `aidm-trade-cutout-026-##`.
- `categoryId: "equipment"` and `group: "generated-rewards"`.
- `uiSurface` exactly scoped to `inventory-item`, `market-item`, `reward-card`, and `item-detail`.
- `semanticKey` shaped like `items.<item-kind>.<base-item>.cutout.v01`.
- Localized `displayName` and `description` values with immersive English and Chinese text for every frame.
- `variantAxes.visualStyle: "transparent-cutout"`, plus culture, item kind, rarity, and economy role.
- Numeric `gameplay.valueGp` values and either an equip slot or an explicit gameplay binding for every frame.
- `gameplayBinding.requiresItemDefinition: true`, so the cutouts decorate data-backed runtime items instead of becoming a player UI gallery.
- The same alpha gate as sheets 010 and 019: 8-bit RGBA PNGs with fully transparent background pixels and fully opaque item pixels.
- No `catalog-internal` exposure after frame-level approval.

## Sheets 020-022 Cutout Runtime Batch

Sheets `aidm-transparent-cutouts-sheet-020`, `aidm-tools-cutouts-sheet-021`, and `aidm-trophies-cutouts-sheet-022` added 48 #00ff00 chroma-key transparent item cutouts:

- Sheet 020: crafting materials and alchemical reagents, including herbs, minerals, monster parts, and rare revival reagents.
- Sheet 021: tools, traps, and gadgets, including lockwork tools, snares, decoys, cutters, probes, and compact field devices.
- Sheet 022: trophies, monster parts, and barter goods, including talons, scales, horn chips, haunted trophies, and valuable monster components.

The registered plans use:

- `metadataPlanId` values `sheet-020-transparent-cutouts`, `sheet-021-tools-cutouts`, and `sheet-022-trophies-cutouts`.
- 4x4 grids, `expectedOutDir: "assets/generated/items"`, and frame id patterns `aidm-transparent-cutout-020-##`, `aidm-tool-cutout-021-##`, and `aidm-trophy-cutout-022-##`.
- `categoryId: "equipment"` and `group: "generated-rewards"`.
- `uiSurface` exactly scoped to `inventory-item`, `market-item`, `reward-card`, and `item-detail`.
- `semanticKey` shaped like `items.<item-kind>.<base-item>.cutout.v01`.
- `variantAxes.visualStyle: "transparent-cutout"` and `gameplayBinding.requiresItemDefinition: true`.
- Numeric `gameplay.valueGp` values and rarity/economy axes for every frame.
- The same alpha gate as sheets 010 and 019: 8-bit RGBA PNGs with fully transparent background pixels and fully opaque item pixels.
- No `catalog-internal` exposure after frame-level approval.

## Sheet 019 Accessory Cutouts

`aidm-accessories-cutouts-sheet-019` added 16 chroma-keyed transparent accessory assets:

- Jewelry and adornments: ruby signet ring, sapphire ear cuff, moonstone necklace, raven brooch, stormglass pendant, pearl hairpin, bone charm bracelet, compass locket, crystal focus ring, and music box charm.
- Social, faction, and inspection objects: brass monocle, silver prayer beads, coin purse, jade clan token, black iron collar, and merchant guild pin.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "equipment"`.
- `group: "generated-rewards"`.
- `uiSurface` exactly scoped to `inventory-item`, `market-item`, `reward-card`, and `item-detail`.
- No `catalog-internal` exposure on player-safe accessory frames.
- An 8-bit RGBA PNG alpha channel with fully transparent background pixels and fully opaque accessory pixels.
- Localized `displayName` and `description`.
- A unique `semanticKey` shaped like `items.<item-kind>.<base-item>.cutout.v01`.
- `variantAxes.visualStyle: "transparent-cutout"`, plus culture, item kind, rarity, economy role, and accessory family.
- `gameplayBinding.requiresItemDefinition: true`, so transparent accessory art decorates data-backed runtime items instead of becoming a broad generated player catalog.

## Sheets 017-018 Runtime Batch

Sheets `aidm-quest-clues-sheet-017` and `aidm-status-effects-sheet-018` added 32 reviewed player-safe assets:

- Quest clues: receipts, letters, maps, sigils, evidence casts, keepsakes, coded notes, crate marks, and other investigation/task objects.
- Status effects: burning, chilled, poisoned, bleeding, stunned, frightened, blessed, shielded, hasted, slowed, invisible, silenced, cursed, restrained, regenerating, and marked.

Every registered frame must keep:

- `visibility: "player-safe"`.
- Quest clue frames scoped exactly to `inventory-item`, `reward-card`, `item-detail`, and `transcript-event`; they must not use `market-item`.
- Status effect frames scoped exactly to `status-icon`, `combatant-detail`, `transcript-event`, and `player-detail`.
- No `catalog-internal` exposure on player-safe batch frames.
- No direct market eligibility for quest clues or status effects.
- Localized `displayName` and `description`.
- `semanticKey` values shaped like `items.quest-clue.<clue>.v01` or `rules.condition.<condition>.v01`.
- `variantAxes` for clue item kind, clue role, culture, condition id, rules family, condition role, polarity, and visual style.
- `gameplayBinding.requiresQuestDefinition: true` for quest clues and `gameplayBinding.requiresConditionDefinition: true` for status icons, so generated art decorates data-backed runtime definitions instead of becoming a broad player catalog or market item.

## Sheets 013-016 Runtime Batch

Sheets `aidm-equipment-fashion-sheet-013` through `aidm-trade-goods-sheet-016` added 64 reviewed player-safe assets:

- Equipment and fashion: coats, robes, cloaks, boots, gloves, masks, hats, and wearable social gear.
- Weapons: melee, ranged, thrown, focus, and reach weapons with weapon-family and handling variant axes.
- Spells: spell icons for evocation, abjuration, illusion, conjuration, restoration, necromancy, enchantment, transmutation, and divination.
- Trade goods: food, drink, tavern props, documents, provisions, and luxury barter objects.

Every registered frame must keep:

- `visibility: "player-safe"`.
- Equipment, weapon, and trade-good frames scoped exactly to `inventory-item`, `market-item`, `reward-card`, and `item-detail`.
- Spell frames scoped exactly to `spell-card` and `character-builder`.
- No `catalog-internal` exposure on player-safe batch frames.
- Localized `displayName` and `description`.
- `semanticKey` values shaped like `items.<item-kind>.<base-item>.v01` or `spells.<school>.<spell>.v01`.
- `variantAxes` for item kind, rarity, economy role, visual style, spell school, element, role, or weapon handling.
- `gameplayBinding.requiresItemDefinition: true` for item art and `gameplayBinding.requiresSpellDefinition: true` for spell art, so generated images decorate data-backed runtime definitions instead of becoming broad player catalog entries.

## Sheet 011 Production Scenes

`aidm-production-scenes-sheet-011` added 16 player-safe full-bleed scene backdrops:

- Urban and social spaces: rain bridge district, storm market square, noble relic gallery, forge market arcade, storm harbor quay.
- Interiors: abandoned tavern hall, wayside inn bunkroom, undercity smuggler workshop, astral observatory.
- Wilderness and ruin stages: graveyard gate, flooded sanctum, forest shrine, waterfall pass, frontier camp, snowy mountain pass, moon garden court.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "scenes"`.
- `group: "generated-scenes"`.
- `uiSurface` exactly scoped to `stage-backdrop` and `relevant-scene`.
- A unique `semanticKey` shaped like `scene.production.<scene-slug>.v01`.
- Scene taxonomy, `soundscapeHints`, mood, time of day, weather, threat level, and narrative uses.
- Immersive descriptions written as stageable scene text, not provenance strings.

## Sheet 012 NPC Tokens

`aidm-npc-tokens-sheet-012` added 16 player-safe NPC and enemy portrait tokens:

- Social and quest contacts: gray archive scholar, laughing innkeeper, caravan trickster, emerald wood envoy, redbeard tunnel smith.
- Allies and commanders: aegis captain, brass automaton warden, frost spirit wolf.
- Threats and enemies: masked alley blade, blood rite cultist, scarred raider brute, goblin spike runner, bone duelist, bog witch, velvet vampire heir, stormbound arcanist.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "characters"`.
- `group: "generated-npc-tokens"`.
- `uiSurface` exactly scoped to `encounter-card`, `npc-token`, and `combatant-detail`.
- No `character-builder`, `player-detail`, `party-avatar`, or `catalog-internal` surface exposure.
- Localized `displayName` and `description`.
- A unique `semanticKey` shaped like `characters.npc.<npc-slug>.v01`.
- `variantAxes.kind: "npc-token"`, plus role, ancestry, threat band, faction, and visual style.
- `gameplayBinding.requiresNpcDefinition: true`, so token art decorates data-backed NPCs instead of becoming a broad player catalog.

## Sheet 009 Market Items

`aidm-market-items-sheet-009` added 20 player-safe item icons for market and backpack flows:

- Consumables and supplies: healing draught, mana vial, ember bomb, lantern oil, spiced rations, vintage wine.
- Tools and documents: lockpick kit, spell scroll, rain city map, merchant contract.
- Equipment: storm ward amulet, signet ring, dwarven helm, elven boots, leather gloves, tower shield, chain coif, ceremonial robe.
- Trade goods and trinkets: framed portrait, bone dice set.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "equipment"`.
- `group: "generated-rewards"`.
- `uiSurface` exactly scoped to `inventory-item`, `market-item`, `reward-card`, and `item-detail`.
- Localized `displayName` and `description`.
- A `semanticKey` shaped like `items.<item-kind>.<base-item>.v01`.
- `variantAxes.itemKind`, `variantAxes.rarity`, and `variantAxes.economyRole`.
- `gameplayBinding.flow` containing `inventory`, `market`, `reward`, and `item-detail`.
- `gameplayBinding.requiresItemDefinition: true`, so art decorates a data-backed item instead of becoming a standalone player catalog entry.

## Sheet 010 Consumable Cutouts

`aidm-consumable-cutouts-sheet-010` added 16 #00ff00 chroma-key cutouts optimized for transparent PNG item icons:

- Consumables and scrolls: healing draught, mana vial, lightning scroll, antidote ampoule, smoke pouch, blessed candles.
- Tools and clues: thieves chalk, arcane compass, raven quill, mirror shard, hourglass, rope coil, wax seal stamp.
- Trinkets and lore items: frost ward charm, moonstone brooch, crystal memory shard.

Every registered frame must keep:

- `visibility: "player-safe"`.
- `categoryId: "equipment"`.
- `group: "generated-rewards"`.
- `uiSurface` exactly scoped to `inventory-item`, `market-item`, `reward-card`, and `item-detail`.
- An 8-bit RGBA PNG alpha channel with fully transparent background pixels and fully opaque item pixels.
- A `semanticKey` shaped like `items.<item-kind>.<base-item>.cutout.v01`.
- `variantAxes.visualStyle: "transparent-cutout"`.
- `gameplayBinding.requiresItemDefinition: true`.
- Transparent cutout tags so downstream selectors can prefer these over market-card art in dense UI.

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
- `gameplayBinding`: explicit runtime flow binding for generated item art; required for inventory, market, reward, and item detail assets.
- `quality`: approval status, duplicate risk, and safety flags.
- `provenance`: prompt id, source sheet, source SHA-256, generator, row, and column.
- `license`: generation license and usage scope.

Scene assets additionally keep `sceneSlug`, `taxonomy`, `soundscapeHints`, `mood`, `timeOfDay`, `weather`, `threatLevel`, and `narrativeUses`.

Inventory assets additionally need gameplay data before runtime binding: item kind, value, condition, tradability, use effect, rarity, and ownership rules. Images should decorate data-backed items, not define the item alone.

## Runtime Binding Rules

Market, backpack, equipment, consumable, memo-adjacent clue, and reward flows must stay data-first:

- Market offers come from item definitions and shop state; art is selected after the offer exists.
- Backpack rows come from owned inventory entries; art is selected from the item definition or generated reward binding.
- `Use`, `Sell`, and `Equip` actions must read runtime item fields such as `usable`, `tradeable`, `slot`, `quantity`, `condition`, `baseValue`, and effect data.
- Quest clues can appear as rewards, transcript events, inventory items, and item detail, but not as direct market stock unless a future item definition explicitly allows that.
- Status art can appear only for rules-backed conditions; it is not inventory, loot, or market stock.
- Character, spell, NPC, and scene art must be selected through semantic keys or runtime metadata, not filename guessing.
- Player UI should display player-readable names and descriptions only. Provenance, prompt, sheet id, and duplicate-risk information remain in this document, manifest metadata, tests, and review notes.

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
7. For transparent cutout sheets, confirm sliced PNGs keep real alpha: 8-bit RGBA, at least one fully transparent background pixel, and at least one fully opaque item pixel.
8. Add or enrich metadata: localized names, immersive descriptions, semantic keys, variant axes, gameplay fields, visibility, UI surfaces, and quality status.
9. Run tests and update this inventory count in the same asset batch change.

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

The ingester now checks for a non-arm64 macOS interpreter before importing Pillow and re-execs into the bundled arm64 runtime automatically. Calling the bundled runtime directly is still the clearest manual entry point:

```bash
/Users/yixuan.zhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/ingest-imagegen-sheet.py --input <sheet.png> --out-dir <asset-dir> --group <group> --prefix <prefix> --rows 4 --cols 4 --manifest assets/generated/manifest.json --sheet-id <sheet-id> --category-id <category-id>
```
