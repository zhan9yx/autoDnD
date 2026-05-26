# Scene Backbone 050-49/050-50 Regeneration Note

Date: 2026-05-25 Asia/Shanghai
Worker: scene regeneration note closer
Scope: documentation note only for `scene-050-49` and `scene-050-50`

## Context

- This is a backfilled note. Actual regeneration was completed by a previous worker before shutdown.
- No new images were generated in this pass.
- No assets or manifests were modified in this pass.
- Prompt source: `docs/assets/missing-asset-generation-prompts.md`.

## Outputs

| Prompt id | Prompt ref | Asset id | Output path | `file` dimensions | `sips` dimensions | File size | mtime |
| --- | --- | --- | --- | --- | --- | ---: | --- |
| `scene-050-49` | `scene-050-49-battle-camp` | `aidm-scene-backbone-050-49` | `assets/generated/scenes/aidm-scene-backbone-050-49.png` | PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced | 1536 x 1024 | 3,229,707 bytes | 2026-05-25 21:48:31 +0800 |
| `scene-050-50` | `scene-050-50-royal-archive` | `aidm-scene-backbone-050-50` | `assets/generated/scenes/aidm-scene-backbone-050-50.png` | PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced | 1536 x 1024 | 2,325,888 bytes | 2026-05-25 21:48:32 +0800 |

## Quick QA

- PNG readability: pass. Both files were readable by `file` and `sips`.
- Dimensions: pass. Both files report the expected 1536 x 1024 scene size.
- Visual load check: pass for basic open/readability and nonblank full-scene composition.
- Visual details: pending visual QA. This closer pass did not perform a full prompt-compliance or emblem/mark inspection beyond a quick visual load check.

## Commands Run

```bash
file assets/generated/scenes/aidm-scene-backbone-050-49.png assets/generated/scenes/aidm-scene-backbone-050-50.png
sips -g pixelWidth -g pixelHeight assets/generated/scenes/aidm-scene-backbone-050-49.png assets/generated/scenes/aidm-scene-backbone-050-50.png
stat -f "%N|size=%z|mtime=%Sm" -t "%Y-%m-%d %H:%M:%S %z" assets/generated/scenes/aidm-scene-backbone-050-49.png assets/generated/scenes/aidm-scene-backbone-050-50.png
```
