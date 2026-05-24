# Generated Asset Ledger - 2026-05-24

Scope: asset-library worker audit for `assets/generated/**`, generated asset manifests, and asset docs only. UI and core gameplay files were not edited.

## Inventory Snapshot

- Generated source sheets: 30.
- Registered raster assets: 552.
- Registered files checked on disk: 1134 files referenced by the manifest; 0 missing.
- Unregistered files under `assets/generated`: 0.
- Player-safe assets: 458.
- Internal placeholders/review assets: 94.
- Planned sheet templates: 11.
- Scene backdrops: 128 of the 500 long-term scene target.
- Total generated-image target: 3000+ assets; current gap is 2448 assets.

## Category Counts

| Category | Count | Notes |
| --- | ---: | --- |
| `generated` | 36 | Internal marketplace exploration placeholders only. |
| `scenes` | 128 | Player-safe stage and relevant-scene backdrops. |
| `equipment` | 324 | Reward, inventory, market, clue, cutout, weapon, wearable, tool, magic, trade-good, and sheet 029 internal review art. |
| `characters` | 32 | Character option icons and NPC/enemy tokens. |
| `spells` | 16 | Player-safe spell-card and character-builder icons. |
| `rules` | 16 | Player-safe condition/status icons. |

## Group Counts

| Group | Count | Visibility | Main surfaces |
| --- | ---: | --- | --- |
| `generated-marketplace` | 36 | internal | `catalog-internal` |
| `generated-inventory-review` | 58 | internal | `catalog-internal` |
| `generated-scenes` | 128 | player-safe | `stage-backdrop`, `relevant-scene` |
| `generated-rewards` | 250 | player-safe | `reward-card`, `inventory-item`, `market-item`, `item-detail`, selected transcript use |
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

## Underused Or Not Fully Runtime-Bound Assets

- No generated source sheet or sliced asset is currently outside the manifest.
- The 36 `generated-marketplace` assets remain intentionally internal and are not gameplay-ready. They should either stay review-only or be promoted frame-by-frame with display names, semantic keys, variant axes, and data-backed item bindings.
- The 58 remaining `generated-inventory-review` sheet 029 assets are newly sliced but intentionally internal. They need per-frame names, bilingual descriptions, semantic keys, variant axes, item-kind/rarity/value metadata, and gameplay bindings before they can move to inventory, market, reward, or item-detail surfaces.
- Early reward sheets 006 and 007 are player-safe and flow-bound to rewards/transcript, but 32 assets do not yet carry the richer `gameplayBinding.requiresItemDefinition` metadata used by later item batches. They are usable as rewards, but weaker for item-catalog matching than sheets 009-026.
- Character option icons are used by the builder/party/player-detail surfaces. NPC tokens, status icons, and spell icons are registered for runtime surfaces, but current direct code references are narrower than the manifest surface capacity; broader use should come from data-backed NPC, condition, and spell definitions rather than a gallery.
- Existing semantic-key duplicate debt remains limited to 8 scene-key pairs from early scene variants. No new duplicate keys were introduced in this pass.

## Available Source Sheets

All existing source sheets in `assets/generated/sheets/` are now sliced and registered, including sheet 029. If another source sheet appears, use `scripts/ingest-imagegen-sheet.py` with the matching metadata plan or add a reviewed plan first, then rerun the generated asset tests.

## Remaining Gaps

- Asset scale: 552 / 3000 generated assets, gap 2448.
- Scene scale: 128 / 500 generated scene backdrops, gap 372.
- Runtime binding depth: promote or enrich early sheets 006-007 before relying on them as concrete inventory/economy items.
- Sheet 029 promotion: 6 frames have been promoted; review the remaining 58 frames individually and promote only data-backed assets to player-safe surfaces.
- Duplicate debt: resolve the 8 legacy scene semantic-key duplicate pairs before approving another scene-scale batch.
- Planned templates: 11 templates are retained for repeatable regeneration.
