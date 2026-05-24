# Asset Expansion Roadmap - 3000+ Images And 500 Scenes

Scope: executable resource plan for expanding the AIDM generated asset library. This document only covers asset planning, review, and documentation. The machine-readable source of truth remains `assets/generated/manifest.json`; source sheets remain under `assets/generated/sheets/`.

## Current Managed Inventory

As of the 2026-05-24 asset ledger:

- Registered generated source sheets: 34.
- Registered raster assets: 748.
- Player-safe assets: 475.
- Internal staging/review assets: 273.
- Scene backdrops: 132 player-safe scenes.
- Long-term image target: 3000+ generated raster assets.
- Long-term scene target: 500 player-safe scene backdrops.
- Remaining image gap: 2252 assets.
- Remaining scene gap: 368 scenes.

The current 748 assets are managed in three tiers:

| Tier | Count | Purpose | Exposure |
| --- | ---: | --- | --- |
| Player-safe runtime assets | 475 | Reviewed art with metadata, semantic keys, descriptions, runtime surfaces, and gameplay bindings. | May appear only through allowed player surfaces such as stage backdrop, inventory item, market item, reward card, character builder, spell card, NPC token, or status icon. |
| Internal marketplace exploration | 36 | Sheet 001 placeholder icons retained for review and possible frame-level promotion. | `catalog-internal` only; not player-facing. |
| Internal inventory review | 237 | Sheets 029-031 and 033 sliced and registered for audit, with 19 selected frames already promoted into data-backed items. | `catalog-internal` only until each frame receives names, bilingual descriptions, semantic keys, variant axes, rarity/value metadata, and item bindings. |

## 2026-05-24 Consistency Check

Manifest-derived counts currently agree with this roadmap, the generated asset ledger, and `docs/ASSET_INVENTORY.md`:

| Check | Result | Notes |
| --- | ---: | --- |
| Generated sheets | 34 | Matches the sheet inventory and ledger snapshot. |
| Registered raster assets | 748 | Matches `assetCatalog.actualGeneratedRasterAssets`. |
| Player-safe assets | 475 | Matches `assetCatalog.playerSafeAssets`; no player-safe asset has `catalog-internal`. |
| Internal assets | 273 | Matches `assetCatalog.internalAssets`; all internal assets are scoped only to `catalog-internal`. |
| Player-safe scene backdrops | 132 | Matches `scenes` category count and `generated-scenes` group count. |
| Missing manifest file references | 0 | All registered PNG/SVG references resolve on disk in the current workspace. |
| Known duplicate semantic-key debt | 8 scene pairs | Existing early scene variants only; must not grow in the next scene batch. |

Do not start the next player-safe scene wave until the 8 duplicate scene semantic-key pairs are either renamed with variant suffixes or explicitly quarantined as non-promotable legacy variants. This keeps the 132 current scene count stable while preventing new scene metadata collisions.

Current player-safe groups:

- `generated-scenes`: 132 scene backdrops for `stage-backdrop` and `relevant-scene`.
- `generated-rewards`: 263 equipment, item, market, reward, trade-good, cutout, accessory, and prop assets.
- `generated-quest-clues`: 16 investigation/task item assets.
- `generated-character-options`: 16 character-builder, party-avatar, and player-detail assets.
- `generated-npc-tokens`: 16 encounter/NPC/combatant token assets.
- `generated-spells`: 16 spell-card and character-builder assets.
- `generated-status-effects`: 16 condition/status assets.

## Target Allocation

The 2252-asset gap should be filled with reviewable batches rather than one undifferentiated gallery. The target allocation below reaches 3000 total registered assets and passes the 500-scene requirement with a small buffer.

| Category | Current | Add | Target | Batch shape | Runtime goal |
| --- | ---: | ---: | ---: | --- | --- |
| Scenes | 132 | 380 | 512 | 24 scene sheets at 4x4 | 500+ player-safe stage/relevant-scene backdrops, with surplus source frames for rejection buffer. |
| Equipment and inventory | 516 | 576 | 1092 | 9 large 8x8 cutout sheets | Weapons, armor, tools, consumables, trade goods, clue objects, magic items, trophies, and market goods. |
| Professions and classes | 16 class-facing options inside `characters` | 256 | 272 | 4 large 8x8 portrait/icon sheets | Class variants, hirelings, companions, faction roles, shopkeepers, trainers, and party-facing profession identities. |
| Species and NPC ancestry | 32 total `characters` today | 256 | 288 | 4 large 8x8 portrait/token sheets | Player ancestry variants, NPC ancestry tokens, enemy silhouettes, regional body/face variants, and party-avatar options. |
| Spells and rules | 32 spells/status today | 320 | 352 | 5 large 8x8 spell/status sheets | Spell schools, rituals, scrolls, status icons, hazard icons, blessings, curses, and combat affordance art. |
| Soundscape and ambience | Covered through 132 scene hints today | 192 | 192 dedicated ambience assets plus scene hints | 3 large 8x8 ambience sheets | Weather chips, ambience thumbnails, hazard overlays, environmental motifs, and soundscape preset art. |
| Cultural variants and faction props | Partially embedded in equipment/scenes today | 272 | 272 dedicated variant assets | 4 large 8x8 sheets plus 1 4x4 correction sheet | Regional skins for equipment, banners, currencies, ritual objects, social gifts, documents, foodways, and faction symbols. |

Total additions: 2252. Total after completion: 3000 registered raster assets. Scene target after completion: 512 player-safe scenes, assuming at least 368 of the remaining scene frames pass review.

## Batch Phases

### Phase 0 - Promote Or Quarantine Existing Internal Assets

1. Continue sheet 029-031 and 033 review from the 19 promoted data-backed items.
2. Promote only frames with data-backed item definitions and complete metadata.
3. Keep the 237 unpromoted sheet 029-031/033 frames as `internal` with `catalog-internal`.
4. Decide whether sheet 001 placeholder marketplace frames are worth promotion; otherwise mark them as archival/internal and exclude them from production counts beyond registered inventory.
5. Resolve the known 8 legacy scene semantic-key duplicate pairs before approving another scene-scale batch.

Exit gate: 748 current assets remain fully accounted for; no internal asset leaks to player surfaces.

### Phase 1 - Scene Backbone To 500

Generate 24 scene sheets at 4x4. Keep scenes at 4x4 rather than 8x8 because stage backdrops need higher composition quality and less tiny-detail loss.

Scene packs:

- Wilderness travel: roads, rivers, forests, swamps, mountains, deserts, coasts, ruins.
- Settlements: villages, market streets, docks, temples, courts, taverns, guild halls, homes.
- Dungeons and hazards: mines, crypts, prisons, laboratories, sewers, caverns, towers, vaults.
- Social and faction spaces: courts, war rooms, shrines, councils, banquets, camps, hideouts.
- Weather and time variants: rain, fog, snow, thunder, wind, dust, dawn, noon, dusk, night.
- Combat and aftermath states: ambush, siege, chase, ritual, discovery, collapse, victory, retreat.

Every approved scene must include:

- `visibility: "player-safe"`.
- `categoryId: "scenes"`.
- `uiSurface`: `stage-backdrop` and `relevant-scene` only.
- Unique `semanticKey` shaped like `scene.<pack>.<location>.<variant>.v01`.
- `sceneSlug`, location taxonomy, weather, time of day, mood, threat level, narrative uses, and `soundscapeHints`.
- Stageable description text, not provenance text.

### Phase 2 - Equipment, Economy, And Item Definitions

Generate 9 large 8x8 cutout sheets. Use transparent or chroma-keyed source sheets so individual items can be used in inventory, market, reward, and detail surfaces.

Equipment packs:

- Weapons: weapon families, handling variants, cultural variants, mundane/magic tiers.
- Armor and wearables: head, body, hands, feet, cloak, belt, mask, robe, travel kit.
- Tools and instruments: lockpicks, lanterns, probes, climbing gear, artisan tools, musical tools.
- Consumables: food, drinks, potions, oils, bombs, antidotes, salves, charms.
- Quest and clue objects: letters, maps, seals, receipts, coded notes, contracts, warrants.
- Trade goods and trophies: gems, textiles, spices, monster parts, relic fragments, salvage.

Approval rule: no item art becomes player-safe until a runtime item definition owns value, rarity, quantity, equip/use rules, tradeability, and ownership behavior.

### Phase 3 - Professions, Classes, Species, And NPC Tokens

Generate 8 large 8x8 sheets split across profession/class identity and species/NPC ancestry.

Profession/class packs:

- Core classes, subclasses, backgrounds, hirelings, trainers, shopkeepers, guild roles, camp followers.
- UI surfaces: `character-builder`, `party-avatar`, `player-detail`, `encounter-card`, `npc-token`, `combatant-detail`.

Species/NPC packs:

- Player ancestry variants, mixed-region variants, enemy families, social NPC families, companion archetypes.
- Keep NPC token art out of player character selection unless explicitly reviewed as a player option.

Approval rule: character-builder assets must represent player-selectable options; NPC/enemy tokens must require NPC or encounter definitions and must not become broad player catalog entries.

### Phase 4 - Spells, Rules, And Status Art

Generate 5 large 8x8 sheets.

Packs:

- Spell schools: evocation, abjuration, illusion, conjuration, restoration, necromancy, enchantment, transmutation, divination.
- Ritual and scroll variants: spell scrolls, tablets, sigils, ward papers, runes, spellbook icons.
- Status effects: buffs, debuffs, marks, wounds, fears, protections, terrain statuses, concentration.
- Hazard/rule icons: fire, ice, poison, lightning, darkness, silence, difficult terrain, cover.

Approval rule: spell art requires a spell definition; status art requires a condition/rules definition. Spell/status art must not be sold as market goods unless separately represented by a data-backed item such as a scroll.

### Phase 5 - Soundscape And Cultural Variants

Generate 3 large 8x8 ambience/soundscape sheets, 4 large 8x8 cultural-variant sheets, and 1 4x4 correction sheet.

Soundscape packs:

- Weather ambience: rain, thunder, fog, snow, wind, dust, heat, surf.
- Location ambience: market, tavern, forest, cave, shrine, battlefield, library, harbor.
- Pressure states: calm, mystery, danger, chase, combat, ritual, aftermath.

Cultural variant packs:

- Regional equipment skins, banners, faction seals, currencies, cookware, food, ritual tools, contracts, gifts, clothing motifs, and trade goods.
- Variant axes should include `culture`, `faction`, `region`, `material`, `rarity`, `economyRole`, and `visualStyle`.

Approval rule: soundscape visual assets decorate ambience UI and scene matching; they do not replace actual audio preset definitions. Cultural variants must have semantic keys that differ by role, culture, or faction, not only by filename.

## ChatGPT Image Generation Sheet Workflow

Use ChatGPT Image Generation to create large source sheets, then slice and register them. The repeatable workflow is:

1. Create a batch brief before generation:
   - `sheetId`, prompt id, category, group, grid size, transparency mode, expected output directory, frame naming prefix, desired player surfaces, and proposed semantic keys.
2. Generate the source sheet:
   - 4x4 for scenes and other composition-heavy art.
   - 8x8 for clean object cutouts, profession icons, spell/status icons, ambience chips, and cultural props.
   - Use a flat green `#00ff00` background or transparent-background prompt for cutouts.
   - Use full-bleed painted tiles for scenes; do not chroma-key scene sheets.
3. Save the original sheet under `assets/generated/sheets/` and keep it as the auditable source artifact.
4. Slice with `scripts/ingest-imagegen-sheet.py`:
   - Use `--preserve-tile` for scenes.
   - Use `--chroma-key` for green-background cutouts.
   - Use a metadata plan id whenever frame-level metadata has been prepared.
5. Register every frame as `internal` first unless a reviewed metadata plan exists.
6. Review frame by frame:
   - reject unreadable, duplicate, unsafe, miscategorized, or off-style frames;
   - add bilingual display names and descriptions;
   - add semantic keys and variant axes;
   - add runtime binding metadata;
   - confirm file existence and alpha/full-bleed quality.
7. Promote only approved frames to `player-safe` and restrict `uiSurface` to the exact runtime flow.
8. Update `docs/assets/generated-asset-ledger-2026-05-24.md` or a new dated ledger after each batch.
9. Run the generated asset tests and any asset-selection or production-depth checks before claiming the batch is usable.

## Immediate Next Batch Brief

Recommended next imagegen wave, assuming sheet ids continue after 033:

| Priority | Proposed sheet ids | Grid | Target adds | Visibility on ingest | Promotion goal |
| --- | --- | --- | ---: | --- | --- |
| P0 | no new sheet | n/a | 0 | n/a | Resolve the 8 legacy scene semantic-key duplicate pairs and rerun duplicate/file-existence checks. |
| P1 | `aidm-production-scenes-sheet-034` through `aidm-production-scenes-sheet-037` | 4x4 | 64 scenes | `internal` unless complete metadata plans exist | First scene backbone wave: wilderness, settlement, dungeon, social, weather, and combat-state backdrops. Promote only frames with unique `scene.<pack>.<location>.<variant>.v01` keys and soundscape hints. |
| P2 | `aidm-inventory-cutouts-sheet-038` and `aidm-inventory-cutouts-sheet-039` | 8x8 | 128 cutouts | `internal` | Weapons, armor, tools, consumables, documents, trade goods, and clue objects. Promote only with item definitions, value/rarity metadata, and exact item surfaces. |
| P3 | `aidm-status-spell-icons-sheet-040` | 8x8 | 64 icons | `internal` | Spell schools, scrolls, status effects, hazards, and rule affordances. Promote only with spell or condition definitions. |
| P4 | `aidm-profession-npc-tokens-sheet-041` | 8x8 | 64 portraits/tokens | `internal` | Hirelings, shopkeepers, faction contacts, enemy families, and companion archetypes. Promote only with character-builder or NPC/encounter ownership. |

Generation rules for the wave:

- Transparency: prefer true transparent-background output for object art. If the generator needs a key color, use a flat `#00ff00` background and slice with `--chroma-key`; promoted PNGs must pass the RGBA alpha gate.
- Batch sheets: use 4x4 for scene backdrops and composition-heavy tokens; use 8x8 for cutouts, item props, status/spell icons, ambience chips, and other simple silhouettes.
- Naming: reserve sheet ids before generation with `aidm-<domain>-sheet-###`; frame ids should include the sheet number; semantic keys should name the runtime concept rather than the filename.
- In-game descriptions: every promoted frame needs player-ready copy before `player-safe`. Scenes get stageable scene text; item, character, NPC, spell, and status assets get localized display names and descriptions.
- Isolation: new frames start as `internal` with `catalog-internal`; promote only reviewed frames with exact player surfaces and data-backed runtime owners.

## Promotion Backlog

| Priority | Backlog | Count | Required exit condition |
| --- | --- | ---: | --- |
| P0 | Legacy scene semantic-key duplicates | 8 pairs | Rename or quarantine duplicate scene variants before any new player-safe scene wave. |
| P1 | Sheet 029-031/033 internal inventory-review frames | 237 | Frame-level item definition, bilingual display copy, semantic key, item kind, rarity/value metadata, exact item surfaces, and `gameplayBinding.itemDefinitionId`. |
| P2 | Sheet 001 marketplace placeholders | 36 | Either keep as archival/internal exploration or promote frame by frame with data-backed item ownership and no broad catalog surface. |
| P3 | Sheets 006-007 early reward art | 32 | Add richer `gameplayBinding.requiresItemDefinition` metadata or map to concrete item definitions before relying on them for inventory/economy matching. |
| P4 | NPC, spell, status, and ambience runtime depth | 64+ | Broader use must come through NPC, spell, condition, soundscape, or item definitions, not gallery exposure. |

## Player-Safe Promotion Checklist

An asset can move from internal staging to player-safe only when all of these are true:

- It has a unique `id` and unique `semanticKey`.
- It belongs to the correct category and group.
- It has localized display names and descriptions where player-facing.
- It has explicit `uiSurface` values from the allowed player-surface list.
- It has the right runtime owner:
  - scene definition for scenes;
  - item definition for inventory, market, rewards, and item detail;
  - spell definition for spell cards;
  - NPC/encounter definition for tokens;
  - condition/rules definition for statuses;
  - soundscape preset or scene hint for ambience.
- It has duplicate and variant-axis review.
- It has no `catalog-internal` surface after promotion.
- Transparent cutouts pass RGBA alpha checks; scenes remain full-bleed and are not chroma-keyed.

## Risks

- Scale risk: 2252 more assets means the manifest can become hard to review manually. Mitigation: batch ledgers, metadata plans, and frame-level promotion gates.
- Duplicate risk: early scene batches already carry a small semantic-key duplicate debt. Mitigation: fix known duplicate keys before Phase 1 scene expansion and require semantic-key collision checks per batch.
- Gallery leak risk: internal sheets can accidentally become player-visible if broad catalog surfaces are reused. Mitigation: new sheets default to `internal` and `catalog-internal`; promotion removes `catalog-internal`.
- Runtime-binding risk: attractive art can appear before item/spell/NPC/condition data exists. Mitigation: require `requiresItemDefinition`, `requiresSpellDefinition`, `requiresNpcDefinition`, or `requiresConditionDefinition` before player-safe promotion.
- Quality variance risk: 8x8 large sheets may produce small or inconsistent objects. Mitigation: reserve 8x8 for simple cutouts/icons, keep scenes at 4x4, and reject frames that fail readability checks.
- Storage and repository weight risk: thousands of PNG/SVG wrappers will increase repository size. Mitigation: keep source sheets, sliced PNGs, and wrappers organized by domain; consider compression and artifact policy before very large waves.
- Localization risk: newly promoted assets can reintroduce mixed English/Chinese player text. Mitigation: bilingual metadata is mandatory for player-facing item, character, spell, status, and scene assets.
- Audio mismatch risk: soundscape visual assets may imply unsupported audio behavior. Mitigation: bind ambience art to existing or newly defined soundscape presets, and keep reason text productized.
