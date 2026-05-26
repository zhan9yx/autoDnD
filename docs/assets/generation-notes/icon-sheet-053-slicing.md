# Icon Sheet 053 Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: 053-only slicing worker.

Scope: `assets/generated/sheets/aidm-armor-outfit-cutouts-sheet-053.png` only. No source sheet edits, new image generation, manifest registration, runtime integration, 054 work, or other worker file edits were performed.

## Source Sheet

| Sheet | Source file | Verified source size | Source color |
| --- | --- | --- | --- |
| 053 | `assets/generated/sheets/aidm-armor-outfit-cutouts-sheet-053.png` | 1254 x 1254 | RGB PNG, no alpha |

## Slicing Method

- Cut source sheet 053 into an 8x8 grid using the actual 1254 x 1254 source dimensions.
- Used integer partition boundaries that cover the full source image: `0, 156, 313, 470, 627, 783, 940, 1097, 1254` on both axes.
- Source crop cells are therefore 156 or 157 pixels before resizing.
- Resized every crop to a 512 x 512 RGBA PNG.
- Used row-major ordering: tile `01` is row 1 column 1, tile `08` is row 1 column 8, tile `09` is row 2 column 1, and tile `64` is row 8 column 8.
- Applied `ffmpeg` chroma-key cleanup against `#00ff00` with tolerance: `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 053 | `assets/generated/items/aidm-armor-outfit-cutout-053-01.png` through `assets/generated/items/aidm-armor-outfit-cutout-053-64.png` | 64 | `sliced`, `alpha-cleaned`, `metadata-validated` |

## Follow-Up Flags

- `source-size-risk`: source sheet is 1254 x 1254, not the preferred 4096 x 4096. All accepted slices are upscaled from 156 or 157 pixel source cells to 512 x 512 output.
- `grid-boundary-risk`: because the source size is not divisible by 8, adjacent source cells use mixed 156/157 pixel crop widths and heights.
- `needs-alpha-review`: chroma key was applied against green background. If an icon intentionally uses pixels close to pure `#00ff00`, those pixels may have been made transparent.
- `needs-manifest`: 053 outputs remain unregistered.
- `needs-integration`: 053 outputs remain unbound at runtime.

## Verification

Commands run:

```bash
sips -g pixelWidth -g pixelHeight assets/generated/sheets/aidm-armor-outfit-cutouts-sheet-053.png
file assets/generated/sheets/aidm-armor-outfit-cutouts-sheet-053.png
ffmpeg '<8x8 crop, scale, and chroma-key slicing loop for sheet 053>'
node -e '<count, continuity, and PNG header validation for assets/generated/items/aidm-armor-outfit-cutout-053-*.png>'
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/generated/items/aidm-armor-outfit-cutout-053-01.png assets/generated/items/aidm-armor-outfit-cutout-053-32.png assets/generated/items/aidm-armor-outfit-cutout-053-64.png
file assets/generated/items/aidm-armor-outfit-cutout-053-01.png assets/generated/items/aidm-armor-outfit-cutout-053-32.png assets/generated/items/aidm-armor-outfit-cutout-053-64.png
git diff --check -- docs/assets/generation-notes/icon-sheet-053-slicing.md
```

Results:

- Source check passed with risk noted: sheet 053 is 1254 x 1254 RGB PNG, not 4096 x 4096.
- Count and naming check passed: 64 outputs, continuous `01` through `64`, no extras.
- PNG header validation passed: all 64 outputs are 512 x 512, 8-bit RGBA PNG files.
- Sample check passed: outputs `01`, `32`, and `64` are 512 x 512 with alpha.
