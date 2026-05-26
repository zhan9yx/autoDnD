# Scene Backbone 050-49/50 Regeneration R3

Date: 2026-05-26 Asia/Shanghai.

Worker: scene regeneration worker R3.

Scope:

- Replaced `assets/generated/scenes/aidm-scene-backbone-050-49.png`.
- Replaced `assets/generated/scenes/aidm-scene-backbone-050-50.png`.

Input basis:

- `docs/assets/missing-asset-generation-prompts.md`
- `docs/assets/generation-notes/asset-visual-qa-050-31-40-49-50-and-047-048.md`

Previous QA issue addressed:

- `050-49`: prior regeneration still had red diamond or insignia-like marks on shields and tent trim.
- `050-50`: prior regeneration still had repeated marked wax seals and hanging cloth symbols.

## Generation Method

Built-in image generation was used. The generated originals were copied from the Codex generated images directory into the target workspace asset paths, leaving the originals in place.

## Regenerated Assets

| Asset | Prompt id | Source generated file | Output path | Dimensions | Output mtime | R3 self-check |
| --- | --- | --- | --- | --- | --- | --- |
| `aidm-scene-backbone-050-49.png` | `scene-050-49-battle-camp` / `scene.backbone.battle-camp.rain-clearing.morning.aftermath.v01` | `/Users/yixuan.zhang/.codex/generated_images/019e5fe7-134f-7102-91d1-c7ac0e0d099d/ig_03306fab58ad3ce5016a1474cffe7c819182e77a075defb080.png` | `assets/generated/scenes/aidm-scene-backbone-050-49.png` | `1536 x 1024` | `May 26 00:16:39 2026` | Single full-bleed muddy war-camp scene. No visible text, grid, watermark, UI, collage, map page, red diamond marks, readable insignia, or emblem-like shield/tent markings observed in R3 visual self-check. |
| `aidm-scene-backbone-050-50.png` | `scene-050-50-royal-archive` / `scene.backbone.royal-archive.still-indoor-air.night.forbidden-research.v01` | `/Users/yixuan.zhang/.codex/generated_images/019e5fe7-134f-7102-91d1-c7ac0e0d099d/ig_03306fab58ad3ce5016a14750709648191a0990df6f0d273e0.png` | `assets/generated/scenes/aidm-scene-backbone-050-50.png` | `1536 x 1024` | `May 26 00:16:40 2026` | Single full-bleed sealed archive interior. No visible text, grid, watermark, UI, collage, readable documents, labeled drawers, marked wax seals, hanging cloth symbols, royal crests, or emblem-like marks observed in R3 visual self-check. |

## Prompt Controls Added For R3

- Forced single continuous scene output: no collage, grid, map, page layout, UI, frame, or sprite/contact sheet.
- Repeated the no-text constraint as no readable text, letters, numbers, labels, watermarks, logos, or signatures.
- For `050-49`, explicitly banned heraldry, insignia, emblems, crests, red diamonds, and markings on shields, tents, trim, maps, flags, crates, cloth, and banners.
- For `050-50`, explicitly banned royal crests, emblems, insignia, decorative seals with marks, repeated stamped wax faces, hanging cloth symbols, labeled drawers, and readable documents.

## Metadata Check

`file` confirmed both outputs are readable PNG images:

```text
assets/generated/scenes/aidm-scene-backbone-050-49.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-50.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
```

`sips -g pixelWidth -g pixelHeight` confirmed both outputs are `1536 x 1024`.

## Status

R3 regeneration is complete. Final acceptance still requires independent visual QA.
