# Franklin Scenes 042-04-08 Generation Note

Date: 2026-05-25 Asia/Shanghai.

Queue source: `docs/assets/missing-asset-generation-prompts.md`.

Coordination source: `docs/assets/missing-asset-generation-coordination-2026-05-25.md`.

Scope: source image generation only for `scene-042-04` through `scene-042-08`. These files are not sliced, manifest-registered, player-safe, or runtime-integrated.

## Prompt Refs Attempted

- `scene-042-04-harbor-clear-summer-chase`
- `scene-042-05-shrine-snow-dusk-calm`
- `scene-042-06-crypt-smoke-midnight-ritual`
- `scene-042-07-desert-ruin-heat-dusk-aftermath`
- `scene-042-08-mountain-wind-dawn-retreat`

## Saved Files

| Prompt ref | Saved file | Downstream status |
| --- | --- | --- |
| `scene-042-04-harbor-clear-summer-chase` | `assets/generated/scenes/aidm-scene-backbone-042-04.png` | generated-source-saved; needs-manifest; needs-integration |
| `scene-042-05-shrine-snow-dusk-calm` | `assets/generated/scenes/aidm-scene-backbone-042-05.png` | generated-source-saved; needs-manifest; needs-integration |
| `scene-042-06-crypt-smoke-midnight-ritual` | `assets/generated/scenes/aidm-scene-backbone-042-06.png` | generated-source-saved; needs-manifest; needs-integration |
| `scene-042-07-desert-ruin-heat-dusk-aftermath` | `assets/generated/scenes/aidm-scene-backbone-042-07.png` | generated-source-saved; needs-manifest; needs-integration |
| `scene-042-08-mountain-wind-dawn-retreat` | `assets/generated/scenes/aidm-scene-backbone-042-08.png` | generated-source-saved; needs-manifest; needs-integration |

## Rejected Outputs

None.

## Visual Review

| Saved file | Verdict |
| --- | --- |
| `assets/generated/scenes/aidm-scene-backbone-042-04.png` | Pass. Bright summer harbor chase route, clear pier-to-ship path, full-bleed, no obvious readable text, UI, watermark, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-042-05.png` | Pass. Snowy dusk roadside shrine, calm recovery mood, warm lantern light, full-bleed, no obvious readable text, UI, watermark, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-042-06.png` | Pass. Midnight smoky crypt ritual chamber with non-readable chalk markings, full-bleed, no obvious readable text, UI, watermark, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-042-07.png` | Pass. Desert ruin aftermath at dusk with collapsed arch, heat-haze color, camp ash, full-bleed, no obvious readable text, UI, watermark, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-042-08.png` | Pass. Wind-scoured dawn mountain pass with visible retreat path and textless prayer flags, full-bleed, no obvious readable text, UI, watermark, black bars, or cropped focal point. |

## Verification

```text
$ file assets/generated/scenes/aidm-scene-backbone-042-04.png assets/generated/scenes/aidm-scene-backbone-042-05.png assets/generated/scenes/aidm-scene-backbone-042-06.png assets/generated/scenes/aidm-scene-backbone-042-07.png assets/generated/scenes/aidm-scene-backbone-042-08.png
assets/generated/scenes/aidm-scene-backbone-042-04.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-042-05.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-042-06.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-042-07.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-042-08.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
```

`git diff --check -- docs/assets/generation-notes/franklin-scenes-042-04-08.md` passed.

No node tests are required for this worker scope because only PNG source files and this Markdown note were added.
