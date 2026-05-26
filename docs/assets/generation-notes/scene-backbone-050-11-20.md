# Scene Backbone 050-11 to 050-20 Generation Note

Date: 2026-05-25 Asia/Shanghai.

Queue source: `docs/assets/missing-asset-generation-prompts.md`.

Planning source: `docs/assets/asset-prompt-expansion-plan-2026-05-25.md`.

Scope: source image generation only for `scene-050-11` through `scene-050-20`. These files are not manifest-registered, player-safe, runtime-bound, sliced, or integrated.

## Prompt Refs Attempted

- `scene-050-11-village-green`
- `scene-050-12-black-market`
- `scene-050-13-healer-clinic`
- `scene-050-14-blacksmith-forge`
- `scene-050-15-stable-yard`
- `scene-050-16-misty-dock`
- `scene-050-17-old-bridge`
- `scene-050-18-mountain-road`
- `scene-050-19-forest-fork`
- `scene-050-20-cave-mouth`

## Saved Files

| Prompt ref | Saved file | Downstream status |
| --- | --- | --- |
| `scene-050-11-village-green` | `assets/generated/scenes/aidm-scene-backbone-050-11.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-12-black-market` | `assets/generated/scenes/aidm-scene-backbone-050-12.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-13-healer-clinic` | `assets/generated/scenes/aidm-scene-backbone-050-13.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-14-blacksmith-forge` | `assets/generated/scenes/aidm-scene-backbone-050-14.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-15-stable-yard` | `assets/generated/scenes/aidm-scene-backbone-050-15.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-16-misty-dock` | `assets/generated/scenes/aidm-scene-backbone-050-16.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-17-old-bridge` | `assets/generated/scenes/aidm-scene-backbone-050-17.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-18-mountain-road` | `assets/generated/scenes/aidm-scene-backbone-050-18.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-19-forest-fork` | `assets/generated/scenes/aidm-scene-backbone-050-19.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-050-20-cave-mouth` | `assets/generated/scenes/aidm-scene-backbone-050-20.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |

## Rejected Outputs

None.

## Visual Review

| Saved file | Verdict |
| --- | --- |
| `assets/generated/scenes/aidm-scene-backbone-050-11.png` | Accepted: autumn village green with central well, harvest stalls, blank banners, warm community mood, no obvious text, watermark, UI, black bars, modern objects, close-up villagers, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-12.png` | Accepted: cold rainy midnight black-market alley with tarps, lanterns, locked crates, secret-trade mood, no obvious text, watermark, UI, black bars, modern objects, portraits, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-13.png` | Accepted: rainy morning healer clinic with herb shelves, treatment bed, bottles without readable labels, recovery mood, no patient close-up, watermark, UI, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-14.png` | Accepted: evening blacksmith forge with coals, anvil, quenching barrel, weapon blanks, crafting workspace, no readable marks, watermark, UI, black bars, portrait focus, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-15.png` | Accepted: muddy stable yard after rain at dawn with tack, open stalls, hay, hoofprints, packed gear, departure tension, no readable signs, watermark, UI, black bars, horse close-up, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-16.png` | Accepted: autumn dawn river dock with mist, moored skiff, wet planks, cargo ropes, reeds, clear boarding route, no readable dock signs, watermark, UI, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-17.png` | Accepted: storm-rain old stone bridge at dusk over swollen water with torches and a clear standoff crossing, no visible combatants, text, watermark, UI, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-18.png` | Accepted: clear cold high mountain switchback with snow patches, distant peaks, cairns without writing, exposed travel mood, no characters, text, watermark, UI, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-19.png` | Accepted: humid twilight forest fork with three readable paths, roots, fireflies, broken marker without letters, route-choice mood, no creatures, watermark, UI, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-050-20.png` | Accepted: rainy afternoon cave entrance with wet hillside, dripping ferns, muddy foreground, dark threshold, no monster, readable marks, watermark, UI, black bars, or cropped focal point. |

## Verification

```text
$ file assets/generated/scenes/aidm-scene-backbone-050-11.png assets/generated/scenes/aidm-scene-backbone-050-12.png assets/generated/scenes/aidm-scene-backbone-050-13.png assets/generated/scenes/aidm-scene-backbone-050-14.png assets/generated/scenes/aidm-scene-backbone-050-15.png assets/generated/scenes/aidm-scene-backbone-050-16.png assets/generated/scenes/aidm-scene-backbone-050-17.png assets/generated/scenes/aidm-scene-backbone-050-18.png assets/generated/scenes/aidm-scene-backbone-050-19.png assets/generated/scenes/aidm-scene-backbone-050-20.png
assets/generated/scenes/aidm-scene-backbone-050-11.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-12.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-13.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-14.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-15.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-16.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-17.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-18.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-19.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-20.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
```

`git diff --check -- docs/assets/generation-notes/scene-backbone-050-11-20.md` passed.

No node tests are required for this worker scope because only PNG source files and this Markdown note were added.
