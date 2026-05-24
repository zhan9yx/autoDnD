# Generated Asset Ledger - 2026-05-24

Scope: asset-library worker audit for `assets/generated/**`, generated asset manifests, and asset docs only. UI and core gameplay files were not edited.

## Inventory Snapshot

- Generated source sheets: 31.
- Registered raster assets: 616.
- Registered files checked on disk: 1263 files referenced by the manifest; 0 missing.
- Unregistered files under `assets/generated`: 0.
- Player-safe assets: 464.
- Internal placeholders/review assets: 152.
- Planned sheet templates: 11.
- Scene backdrops: 128 of the 500 long-term scene target.
- Total generated-image target: 3000+ assets; current gap is 2384 assets.

## Category Counts

| Category | Count | Notes |
| --- | ---: | --- |
| `generated` | 36 | Internal marketplace exploration placeholders only. |
| `scenes` | 128 | Player-safe stage and relevant-scene backdrops. |
| `equipment` | 388 | Reward, inventory, market, clue, cutout, weapon, wearable, tool, magic, trade-good, and sheet 029/030 internal review art. |
| `characters` | 32 | Character option icons and NPC/enemy tokens. |
| `spells` | 16 | Player-safe spell-card and character-builder icons. |
| `rules` | 16 | Player-safe condition/status icons. |

## Group Counts

| Group | Count | Visibility | Main surfaces |
| --- | ---: | --- | --- |
| `generated-marketplace` | 36 | internal | `catalog-internal` |
| `generated-inventory-review` | 116 | internal | `catalog-internal` |
| `generated-scenes` | 128 | player-safe | `stage-backdrop`, `relevant-scene` |
| `generated-rewards` | 256 | player-safe | `reward-card`, `inventory-item`, `market-item`, `item-detail`, selected transcript use |
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

## Underused Or Not Fully Runtime-Bound Assets

- No generated source sheet or sliced asset is currently outside the manifest.
- The 36 `generated-marketplace` assets remain intentionally internal and are not gameplay-ready. They should either stay review-only or be promoted frame-by-frame with display names, semantic keys, variant axes, and data-backed item bindings.
- The 116 remaining `generated-inventory-review` assets from sheet 029 and sheet 030 are intentionally internal. They need per-frame names, bilingual descriptions, semantic keys, variant axes, item-kind/rarity/value metadata, and gameplay bindings before they can move to inventory, market, reward, or item-detail surfaces.
- Early reward sheets 006 and 007 are player-safe and flow-bound to rewards/transcript, but 32 assets do not yet carry the richer `gameplayBinding.requiresItemDefinition` metadata used by later item batches. They are usable as rewards, but weaker for item-catalog matching than sheets 009-026.
- Character option icons are used by the builder/party/player-detail surfaces. NPC tokens, status icons, and spell icons are registered for runtime surfaces, but current direct code references are narrower than the manifest surface capacity; broader use should come from data-backed NPC, condition, and spell definitions rather than a gallery.
- Existing semantic-key duplicate debt remains limited to 8 scene-key pairs from early scene variants. No new duplicate keys were introduced in this pass.

## Available Source Sheets

All existing source sheets in `assets/generated/sheets/` are now sliced and registered, including sheet 030. If another source sheet appears, use `scripts/ingest-imagegen-sheet.py` with the matching metadata plan or add a reviewed plan first, then rerun the generated asset tests.

## Remaining Gaps

- Asset scale: 616 / 3000 generated assets, gap 2384.
- Scene scale: 128 / 500 generated scene backdrops, gap 372.
- Runtime binding depth: promote or enrich early sheets 006-007 before relying on them as concrete inventory/economy items.
- Sheet 029/030 promotion: 12 frames have been promoted; review the remaining 116 internal frames individually and promote only data-backed assets to player-safe surfaces.
- Duplicate debt: resolve the 8 legacy scene semantic-key duplicate pairs before approving another scene-scale batch.
- Planned templates: 11 templates are retained for repeatable regeneration.

## Next-Batch Plan - Asset Utilization Cleanup

1. Add a dedicated `scenes` entry to `manifest.marketplace.categories` before the next scene batch, because 128 registered assets currently use `categoryId: "scenes"` while the marketplace category registry only lists generated, equipment, characters, spells, and rules.
2. Keep the existing 116 sheet 029/030 internal frames in `generated-inventory-review` until each promoted frame has an item definition, bilingual display copy, semantic key, rarity/value metadata, and exact runtime surfaces.
3. Resolve the 8 legacy scene semantic-key duplicate pairs before adding more player-safe scenes, then rerun the duplicate-key and generated-asset file-existence checks.
