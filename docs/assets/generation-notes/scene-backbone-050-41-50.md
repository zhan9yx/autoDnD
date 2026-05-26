# Scene Backbone 050-41-50 Generation Notes

Worker: 0020 scene generation worker E
Date: 2026-05-25
Scope: `scene-050-41` through `scene-050-50` only

## Inputs

- Canonical prompts: `docs/assets/missing-asset-generation-prompts.md`
- Read-only plan: `docs/assets/asset-prompt-expansion-plan-2026-05-25.md`

## Outputs

| Prompt ref | Asset id | Output path | Visual status | Notes |
| --- | --- | --- | --- | --- |
| `scene-050-41-dream-realm` | `aidm-scene-backbone-050-41` | `assets/generated/scenes/aidm-scene-backbone-050-41.png` | accepted | Full-bleed violet dream crossing with floating stones, mist, reflective void water, and impossible archways. No text, UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-42-market-warehouse` | `aidm-scene-backbone-050-42` | `assets/generated/scenes/aidm-scene-backbone-050-42.png` | accepted | Full-bleed locked warehouse aisle with crates, ropes, skylight dust, sealed parcels, autumn afternoon light, and search mood. No readable labels, UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-43-alchemist-lab` | `aidm-scene-backbone-050-43` | `assets/generated/scenes/aidm-scene-backbone-050-43.png` | accepted | Full-bleed alchemist lab with glassware, herb racks, colored vapors, burner glow, and winter night atmosphere. Small background papers are not readable or focal. No UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-44-watchtower-top` | `aidm-scene-backbone-050-44` | `assets/generated/scenes/aidm-scene-backbone-050-44.png` | accepted | Full-bleed rainy watchtower top with wet planks, signal brazier, spyglass table, dark forest, and dusk scouting mood. No readable flags, UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-45-prison-block` | `aidm-scene-backbone-050-45` | `assets/generated/scenes/aidm-scene-backbone-050-45.png` | accepted | Full-bleed stone prison block with barred cells, torchlight, damp floor, side corridor, and rescue-stealth mood. No close-up prisoners, text, UI, watermark, black border, modern objects, or cropped focal subject observed. |
| `scene-050-46-throne-room` | `aidm-scene-backbone-050-46` | `assets/generated/scenes/aidm-scene-backbone-050-46.png` | accepted | Full-bleed grand throne room with empty dais, long carpet, tall columns, blank banners, cold daylight, and high-diplomacy mood. No ruler portrait, readable text, UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-47-haunted-house` | `aidm-scene-backbone-050-47` | `assets/generated/scenes/aidm-scene-backbone-050-47.png` | accepted | Full-bleed haunted parlor with covered furniture, cracked mirror, cold moonlight, dust, blank frames, and autumn midnight unease. No visible specter, text, UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-48-fae-ring` | `aidm-scene-backbone-050-48` | `assets/generated/scenes/aidm-scene-backbone-050-48.png` | accepted | Full-bleed dewy dawn forest clearing with mushroom ring, luminous dew, bent grass, and tiny lights. No visible fae, text, UI, watermark, black border, modern objects, close-up portrait, or cropped focal subject observed. |
| `scene-050-49-battle-camp` | `aidm-scene-backbone-050-49` | `assets/generated/scenes/aidm-scene-backbone-050-49.png` | needs-regeneration | Scene matches muddy war camp aftermath, tents, command table, shields, and rain-clearing morning mood, but shield and tent geometry can read as insignia/emblem-like marks. Do not mark accepted without a cleaner unmarked version. |
| `scene-050-50-royal-archive` | `aidm-scene-backbone-050-50` | `assets/generated/scenes/aidm-scene-backbone-050-50.png` | needs-regeneration | Scene matches sealed royal archive vault, locked shelves, moonlit desk, drawers, and forbidden research mood, but repeated wax seals and hanging cloth include visible mark/emblem-like shapes. Do not mark accepted without a cleaner unmarked version. |

## Verification

- `file assets/generated/scenes/aidm-scene-backbone-050-41.png ... assets/generated/scenes/aidm-scene-backbone-050-50.png`: all ten files report `PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced`.
- `sips -g pixelWidth -g pixelHeight ...`: all ten files report `pixelWidth: 1536` and `pixelHeight: 1024`.
- Visual review completed for all ten generated files.

## Scope Notes

- No manifest registration.
- No runtime integration.
- No global status edits.
- No Harness edits.
- No `042-*` files touched.
- No icon sheets or slices touched.
