# Icon Sheet 052 Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: 052-only slicing worker.

Scope: `assets/generated/sheets/aidm-weapon-cutouts-sheet-052.png` only. No source sheet edits, new image generation, manifest registration, runtime integration, 053 work, or other worker file edits were performed.

## Source Sheet

| Sheet | Source file | Verified source size | Source color |
| --- | --- | --- | --- |
| 052 | `assets/generated/sheets/aidm-weapon-cutouts-sheet-052.png` | 1254 x 1254 | RGB PNG, no alpha |

## Slicing Method

- Cut source sheet 052 into an 8x8 grid using the actual 1254 x 1254 source dimensions.
- Used integer partition boundaries that cover the full source image: `0, 156, 313, 470, 627, 783, 940, 1097, 1254` on both axes.
- Source crop cells are therefore 156 or 157 pixels before resizing.
- Used row-major ordering: tile `01` is row 1 column 1, tile `08` is row 1 column 8, tile `09` is row 2 column 1, and tile `64` is row 8 column 8.
- Applied chroma-key alpha cleanup by zeroing pixels matching exact `#00ff00` or close green-background variants.
- Resized every crop to a 512 x 512 RGBA PNG with premultiplied-alpha sampling so keyed green background pixels do not bleed into visible weapon edges.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 052 | `assets/generated/items/aidm-weapon-cutout-052-01.png` through `assets/generated/items/aidm-weapon-cutout-052-64.png` | 64 | `sliced`, `alpha-cleaned`, `metadata-validated` |

## Follow-Up Flags

- `source-size-risk`: source sheet is 1254 x 1254, not the preferred 4096 x 4096. All accepted slices are upscaled from 156 or 157 pixel source cells to 512 x 512 output.
- `grid-boundary-risk`: because the source size is not divisible by 8, adjacent source cells use mixed 156/157 pixel crop widths and heights.
- `green-background-risk`: the source green background is not clean pure `#00ff00`; only 1 source pixel matched exact `#00ff00`, while 1,310,496 pixels matched the broader green-background predicate used for cleanup.
- `needs-alpha-review`: chroma-key cleanup removed all pixels matching the green predicate. If any weapon detail intentionally uses close green colors, those pixels may have been made transparent.
- `needs-manifest`: 052 outputs remain unregistered.
- `needs-integration`: 052 outputs remain unbound at runtime.

## Verification

Commands run:

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/generated/sheets/aidm-weapon-cutouts-sheet-052.png
file assets/generated/sheets/aidm-weapon-cutouts-sheet-052.png
node '<052 slicing script using built-in PNG decode/encode, chroma key, and premultiplied resize>'
node '<count, continuity, and RGBA PNG header validation for assets/generated/items/aidm-weapon-cutout-052-*.png>'
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/generated/items/aidm-weapon-cutout-052-01.png assets/generated/items/aidm-weapon-cutout-052-32.png assets/generated/items/aidm-weapon-cutout-052-64.png
file assets/generated/items/aidm-weapon-cutout-052-01.png assets/generated/items/aidm-weapon-cutout-052-32.png assets/generated/items/aidm-weapon-cutout-052-64.png
git diff --check -- docs/assets/generation-notes/icon-sheet-052-slicing.md
```

Results:

- Source check passed with risk noted: sheet 052 is 1254 x 1254 RGB PNG with no alpha, not 4096 x 4096.
- Count and continuity passed: 64 files exist with suffixes `01` through `64`, no missing or extra 052 outputs.
- Metadata validation passed: all 64 outputs have PNG headers for 512 x 512, 8-bit RGBA.
- Sample check passed: outputs `01`, `32`, and `64` are 512 x 512 with alpha.
- Alpha cleanup stats: source cleanup keyed 1,310,496 of 1,572,516 pixels as green background; generated outputs contain transparent and opaque pixels after resizing.
