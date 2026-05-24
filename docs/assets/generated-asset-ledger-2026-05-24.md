# Generated Asset Ledger - 2026-05-24

Scope: asset-library worker audit for `assets/generated/**`, generated asset manifests, and asset docs only. UI and core gameplay files were not edited.

## Inventory Snapshot

- Generated source sheets: 34.
- Registered raster assets: 748.
- Registered files checked on disk: 1530 files referenced by the manifest; 0 missing.
- Unregistered files under `assets/generated`: 0.
- Player-safe assets: 475.
- Internal placeholders/review assets: 273.
- Planned sheet templates: 12.
- Scene backdrops: 132 of the 500 long-term scene target.
- Total generated-image target: 3000+ assets; current gap is 2252 assets.

## Category Counts

| Category | Count | Notes |
| --- | ---: | --- |
| `generated` | 36 | Internal marketplace exploration placeholders only. |
| `scenes` | 132 | Player-safe stage and relevant-scene backdrops. |
| `equipment` | 516 | Reward, inventory, market, clue, cutout, weapon, wearable, tool, magic, trade-good, and sheet 029-031/033 internal review art. |
| `characters` | 32 | Character option icons and NPC/enemy tokens. |
| `spells` | 16 | Player-safe spell-card and character-builder icons. |
| `rules` | 16 | Player-safe condition/status icons. |

## Group Counts

| Group | Count | Visibility | Main surfaces |
| --- | ---: | --- | --- |
| `generated-marketplace` | 36 | internal | `catalog-internal` |
| `generated-inventory-review` | 237 | internal | `catalog-internal` |
| `generated-scenes` | 132 | player-safe | `stage-backdrop`, `relevant-scene` |
| `generated-rewards` | 263 | player-safe | `reward-card`, `inventory-item`, `market-item`, `item-detail`, selected transcript use |
| `generated-quest-clues` | 16 | player-safe | `inventory-item`, `reward-card`, `item-detail`, `transcript-event` |
| `generated-character-options` | 16 | player-safe | `character-builder`, `party-avatar`, `player-detail` |
| `generated-npc-tokens` | 16 | player-safe | `encounter-card`, `npc-token`, `combatant-detail` |
| `generated-spells` | 16 | player-safe | `spell-card`, `character-builder` |
| `generated-status-effects` | 16 | player-safe | `status-icon`, `combatant-detail`, `transcript-event`, `player-detail` |

## Naming And Description Quality

- The registered naming scheme is consistent: sheet ids use `aidm-<domain>-sheet-###`, frame ids retain sheet numbers, and player-safe assets carry semantic keys.
- This pass tightened early description quality in `assets/generated/manifest.json`:
  - Replaced template-like ambience scene descriptions for sheet 002 with specific stageable scene copy.
  - Added Chinese `zhName` values for all 16 sheet 002 ambience scenes.
  - Rewrote 16 character option descriptions so they describe player-facing use instead of saying "generated option icon".
  - Rewrote 6 remaining short or frame-worded descriptions.
- After the rewrite, the local description scan found 0 player-safe descriptions below the minimum length/word-count threshold and 0 provenance-like description strings.

## Sheet 029 Ingestion

- Found `assets/generated/sheets/aidm-inventory-expansion-sheet-029.png` during the worker pass after the initial inventory scan.
- Source dimensions: 1254x1254 RGB.
- Grid: 8x8, sliced into 64 transparent PNG frames plus 64 SVG wrappers under `assets/generated/items/`.
- Manifest id: `aidm-inventory-expansion-sheet-029`.
- Frame id pattern: `aidm-inventory-expansion-029-##`.
- Promotion status: 6 frames are promoted to player-safe data-backed items; 58 frames remain internal review assets.
- Promoted frames: Blackthorn Warplate, Surveyor's Field Pack, Bitterleaf Ampoule, Skyglass Signet, Rainmarked Chart, and Pearwood Lute.
- Internal frames: `generated-inventory-review`, `catalog-internal` only.
- Rationale: selected frames now have item definitions, semantic keys, value/economy metadata, runtime bindings, and bilingual descriptions. Unreviewed frames stay auditable but not player-facing.

## Sheet 030 Alpha QA

- Verified `assets/generated/items/aidm-inventory-expansion-030-01.png` through `assets/generated/items/aidm-inventory-expansion-030-64.png` exist as 64 PNG frames.
- All 64 files decode as PNGs with alpha channels, and all four corner pixels are transparent on every frame.
- Manifest id: `aidm-inventory-expansion-sheet-030`.
- Frame id pattern: `aidm-inventory-expansion-030-##`.
- Promotion status: 6 frames are promoted to player-safe data-backed items; 58 frames remain internal review assets.
- Promoted frames: Lionward Shield, Azure Court Crown, Sapphire Treaty Ring, Lockpick Roll, Emberglass Lantern, and Brass Mariner Compass.
- Internal frames: `generated-inventory-review`, `catalog-internal` only.
- Rationale: promoted frames have semantic keys, value/economy metadata, manifest gameplay-binding metadata, and bilingual descriptions. Unreviewed frames stay auditable but not player-facing.

## Sheet 031 Inventory Review

- Manifest id: `aidm-inventory-expansion-sheet-031`.
- Grid: 8x8, 64 transparent inventory-expansion frames plus SVG wrappers under `assets/generated/items/`.
- Promotion status: 7 frames are promoted to player-safe data-backed items; 57 frames remain internal review assets.
- Promoted frames: Oathguard Saber, Red-Tassel Spear, Frostfur Travel Boots, Blue-Sigil Ward Scroll, Ironbound Coffer, Guild Keyring, and Alchemist Mortar.
- Internal frames: `generated-inventory-review`, `catalog-internal` only.
- Required promotion work: per-frame item definition, bilingual display copy, semantic key, item kind, rarity/value metadata, runtime surfaces, and gameplay binding.

## Sheet 032 Ambient Scenes

- Manifest id: `aidm-ambient-scenes-sheet-032`.
- Grid: 2x2, 4 full-bleed scene frames plus SVG wrappers under `assets/generated/scenes/`.
- Promotion status: all 4 frames are player-safe `generated-scenes`.
- Runtime scope: `stage-backdrop` and `relevant-scene` only.
- Metadata status: frames carry `scene.ambient.*` semantic keys, scene taxonomy, weather, time of day, mood, threat level, soundscape hints, and stageable descriptions.

## Sheet 033 Inventory Review Alpha Gate

- Manifest id: `aidm-inventory-expansion-sheet-033`.
- Grid: 8x8, 64 transparent inventory-expansion frames plus SVG wrappers under `assets/generated/items/`.
- Promotion status: 0 frames promoted; all 64 frames remain internal review assets.
- Internal frames: `generated-inventory-review`, `visibility: "internal"`, and `uiSurface: ["catalog-internal"]` only.
- Alpha status: every sliced PNG is an 8-bit RGBA cutout with transparent background pixels and opaque subject pixels; corner transparency is part of the generated asset test gate.
- Pool status: sheet 033 is excluded from generated reward, market, and scene pools until individual frames receive item definitions, semantic keys, runtime surfaces, and approval.

## Underused Or Not Fully Runtime-Bound Assets

- No generated source sheet or sliced asset is currently outside the manifest.
- The 36 `generated-marketplace` assets remain intentionally internal and are not gameplay-ready. They should either stay review-only or be promoted frame-by-frame with display names, semantic keys, variant axes, and data-backed item bindings.
- The 237 remaining `generated-inventory-review` assets from sheets 029-031 and 033 are intentionally internal. They need per-frame names, bilingual descriptions, semantic keys, variant axes, item-kind/rarity/value metadata, and gameplay bindings before they can move to inventory, market, reward, or item-detail surfaces.
- Early reward sheets 006 and 007 are player-safe and flow-bound to rewards/transcript, but 32 assets do not yet carry the richer `gameplayBinding.requiresItemDefinition` metadata used by later item batches. They are usable as rewards, but weaker for item-catalog matching than sheets 009-026.
- Character option icons are used by the builder/party/player-detail surfaces. NPC tokens, status icons, and spell icons are registered for runtime surfaces, but current direct code references are narrower than the manifest surface capacity; broader use should come from data-backed NPC, condition, and spell definitions rather than a gallery.
- Existing semantic-key duplicate debt remains limited to 8 scene-key pairs from early scene variants. No new duplicate keys were introduced in this pass.

## Asset Utilization Binding Pass

This sub-agent pass added no image assets and did not modify the generated manifest. The low-risk runtime change is limited to `src/core/assetSelection.js`: it now builds filtered `assetBindings` for presentation snapshots from approved `player-safe` manifest pools.

New binding helpers cover these surfaces:

| Surface | Data-backed source | Current utilization result |
| --- | --- | --- |
| `stage-backdrop`, `relevant-scene` | Room scene + soundscape metadata | Existing scene selector remains the runtime entry point. |
| `market-item`, `inventory-item`, `reward-card`, `item-detail` | Item definitions, shop offers, inventory entries, latest reward | 29 current shop offers have direct generated manifest art bindings; owned inventory and latest rewards resolve through the same filtered item pool. |
| `character-builder`, `party-avatar`, `player-detail` | Race/class rules ids and player character fields | All 16 sheet 008 options resolve through data-backed character option bindings. |
| `spell-card`, `character-builder` | Seven current `SPELLS` definitions | Every current rules-backed player spell resolves to reviewed sheet 015 art. |
| `npc-token`, `encounter-card`, `combatant-detail` | Encounter enemies and enemy templates | Encounter combatants can resolve sheet 012 token art without exposing NPC tokens to character-builder or item flows. |
| `status-icon`, `combatant-detail`, `transcript-event`, `player-detail` | Active status ids backed by `STATUS_EFFECTS` | Exact condition-id matches resolve sheet 018 icons; unmatched condition art remains unused until rules definitions exist. |

Guardrails added by code and tests:

- Runtime pools require `visibility: "player-safe"`, `quality.approved: true`, a real file, and no `catalog-internal` surface.
- Item binding defaults to direct manifest references from item definitions or reward snapshots; it does not guess art for legacy SVG-backed items.
- Internal sheets 001 and 033, plus unpromoted 029-031 slices, remain excluded from market, backpack, reward, scene, character, spell, NPC, and status binding pools.

## Available Source Sheets

All existing source sheets in `assets/generated/sheets/` are now sliced and registered through sheet 033. If another source sheet appears, use `scripts/ingest-imagegen-sheet.py` with the matching metadata plan or add a reviewed plan first, then rerun the generated asset tests.

## Cross-Document Consistency Check

This worker rechecked the current manifest-derived counts against this ledger, `docs/assets/asset-expansion-roadmap-2026-05-24.md`, and `docs/ASSET_INVENTORY.md`.

| Check | Manifest-derived value | Document status |
| --- | ---: | --- |
| Generated source sheets | 34 | Consistent across the ledger, roadmap, and inventory. |
| Registered raster assets | 748 | Consistent with `assetCatalog.actualGeneratedRasterAssets`. |
| Player-safe assets | 475 | Consistent with `assetCatalog.playerSafeAssets`; no player-safe asset includes `catalog-internal`. |
| Internal review/placeholder assets | 273 | Consistent with `assetCatalog.internalAssets`; every internal asset uses `uiSurface: ["catalog-internal"]`. |
| Player-safe scene backdrops | 132 | Consistent with the `scenes` category and `generated-scenes` group. |
| Missing registered file references | 0 | All manifest PNG/SVG references resolve on disk. |
| Known duplicate semantic-key debt | 8 scene pairs | Consistent with the existing inventory warning; no new duplicate class is documented as acceptable for future batches. |

The checked duplicate scene keys are `scene.bellmaker.alley`, `scene.breaker.tunnel`, `scene.royal.war.room`, `scene.misty.forest.path`, `scene.waterfall.grotto`, `scene.desert.ruin.dusk`, `scene.lava.bridge`, and `scene.moonlit.pond.garden`.

## Remaining Gaps

- Asset scale: 748 / 3000 generated assets, gap 2252.
- Scene scale: 132 / 500 generated scene backdrops, gap 368.
- Runtime binding depth: current runtime selection now covers scenes, direct item/shop/backpack/reward bindings, character options, seven rules spells, encounter NPC tokens, and exact status icons. Remaining depth work is to promote/enrich early sheets 006-007 and add definitions for extra spell/NPC/status art before relying on those frames in gameplay.
- Sheet 029-031/033 promotion: 19 frames have been promoted; review the remaining 237 internal frames individually and promote only data-backed assets to player-safe surfaces.
- Duplicate debt: resolve the 8 legacy scene semantic-key duplicate pairs before approving another scene-scale batch.
- Planned templates: 12 templates are retained for repeatable regeneration.

## Next-Batch Plan - Asset Utilization Cleanup

1. Keep the dedicated `scenes` entry in `manifest.marketplace.categories` covered by tests before the next scene batch; scene assets must remain selectable only through stage and relevant-scene flows.
2. Keep the existing 237 sheet 029-031/033 internal frames in `generated-inventory-review` until each promoted frame has an item definition, bilingual display copy, semantic key, rarity/value metadata, and exact runtime surfaces.
3. Resolve the 8 legacy scene semantic-key duplicate pairs before adding more player-safe scenes, then rerun the duplicate-key and generated-asset file-existence checks.
4. For the next item or prop batch, prefer transparent-background output or a flat `#00ff00` chroma-key sheet, use 8x8 only for clean cutouts/icons, preserve sheet-numbered frame ids, and write player-facing descriptions during promotion rather than after exposure.

## Next Imagegen Wave Proposal

| Priority | Proposed sheet ids | Grid | Frames | Initial visibility | Review focus |
| --- | --- | --- | ---: | --- | --- |
| P0 | no new source sheet | n/a | 0 | n/a | Clear the 8 duplicate scene semantic keys and confirm the 748/475/273/132 baseline still holds. |
| P1 | `aidm-production-scenes-sheet-034` through `aidm-production-scenes-sheet-037` | 4x4 | 64 | `internal` unless complete metadata plans exist | Scene backbone wave toward the 500-scene target. Require unique scene keys, taxonomy, weather/time/mood/threat fields, narrative uses, and soundscape hints before promotion. |
| P2 | `aidm-inventory-cutouts-sheet-038` and `aidm-inventory-cutouts-sheet-039` | 8x8 | 128 | `internal` | Economy and inventory cutouts. Require alpha QA, item definitions, localized copy, value/rarity metadata, and exact item surfaces before promotion. |
| P3 | `aidm-status-spell-icons-sheet-040` | 8x8 | 64 | `internal` | Spell, scroll, hazard, status, and rule affordance icons. Require spell or condition definitions before player-safe exposure. |
| P4 | `aidm-profession-npc-tokens-sheet-041` | 8x8 | 64 | `internal` | Profession, hireling, shopkeeper, faction, companion, and NPC token art. Split player character options from NPC/encounter tokens during review. |

## Promotion Backlog

| Priority | Backlog | Count | Promotion gate |
| --- | --- | ---: | --- |
| P0 | Legacy duplicate scene semantic keys | 8 pairs | Rename with variant-specific keys or quarantine as legacy variants before adding scene sheets 034-037. |
| P1 | Sheet 029-031/033 internal inventory-review frames | 237 | Promote frame by frame only after item definition, bilingual copy, semantic key, item kind, rarity/value metadata, runtime surfaces, and gameplay binding are complete. |
| P2 | Sheet 001 marketplace placeholders | 36 | Keep archival/internal unless a concrete runtime item definition owns the promoted frame. |
| P3 | Sheets 006-007 early reward art | 32 | Enrich with `requiresItemDefinition` or map to concrete item catalog definitions before treating them as strong economy assets. |
| P4 | NPC, spell, status, and ambience direct-use expansion | 64+ | Broader player use must be mediated by NPC, spell, condition, soundscape, or item data, not raw manifest browsing. |
