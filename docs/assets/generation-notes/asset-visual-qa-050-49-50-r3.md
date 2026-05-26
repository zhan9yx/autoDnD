# Asset Visual QA 050-49/50 R3

Date: 2026-05-26 Asia/Shanghai.

Worker: scene R3 visual QA worker.

Scope:

- `assets/generated/scenes/aidm-scene-backbone-050-49.png`
- `assets/generated/scenes/aidm-scene-backbone-050-50.png`

No images, generated assets, prompts, manifests, runtime files, or other worker notes were modified in this pass.

## Decision Summary

`accept`:

- `assets/generated/scenes/aidm-scene-backbone-050-49.png`
- `assets/generated/scenes/aidm-scene-backbone-050-50.png`

`needs-regeneration`:

- None.

## Metadata

| Asset | Dimensions | File size | mtime |
| --- | --- | ---: | --- |
| `aidm-scene-backbone-050-49.png` | `1536 x 1024` | `2768898` bytes | `2026-05-26 00:16:39 +0800` |
| `aidm-scene-backbone-050-50.png` | `1536 x 1024` | `2327951` bytes | `2026-05-26 00:16:40 +0800` |

`file` confirmed both reviewed images are readable PNGs:

```text
assets/generated/scenes/aidm-scene-backbone-050-49.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
assets/generated/scenes/aidm-scene-backbone-050-50.png: PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced
```

`sips -g pixelWidth -g pixelHeight ...` confirmed both reviewed images are `1536 x 1024`.

## Visual QA

| Asset | Decision | Visual QA notes |
| --- | --- | --- |
| `aidm-scene-backbone-050-49.png` | `accept` | Full-bleed muddy battle-camp scene after rain, with tents, shields, barrels, crates, and a blank table surface. No visible text, watermark, UI, collage/grid layout, map or book-page composition, or theme drift observed. Shield faces, tent fabric, trim, crates, cloth, and camp objects appear blank/unmarked; no red diamond, heraldic crest, readable insignia, emblem, banner symbol, or other badge-like mark observed. |
| `aidm-scene-backbone-050-50.png` | `accept` | Full-bleed sealed archive interior at night, with shelves, cabinets, papers, books, boxes, candles, locks, and chain restraints. No visible text, watermark, UI, collage/grid layout, map or book-page composition, or theme drift observed. Papers and drawers appear unreadable/blank; no marked wax seals, hanging cloth symbols, royal crest, readable insignia, emblem, label, logo, or badge-like mark observed. Round lock plates and padlocks read as plain hardware rather than symbolic marks. |

## Risk Checklist

| Risk | 050-49 | 050-50 |
| --- | --- | --- |
| Visible text / labels / numbers | Not observed | Not observed |
| Watermark / signature / logo | Not observed | Not observed |
| UI / screenshot / app chrome | Not observed | Not observed |
| Collage / grid / contact sheet | Not observed | Not observed |
| Map / atlas / picture-book page layout | Not observed | Not observed |
| Crest / emblem / insignia / badge-like symbol | Not observed | Not observed |
| Theme deviation | Not observed | Not observed |

## Verification

Final note check passed with no output:

```bash
git diff --check -- docs/assets/generation-notes/asset-visual-qa-050-49-50-r3.md
```
