# Icon Sheet 056 Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: 056-only slicing worker.

Scope: sheet 056 treasure/material slicing only. No source sheet edits, new image generation, manifest registration, runtime integration, public UI edits, Harness status edits, or unrelated worker files were modified.

## Source Sheet

| Sheet | Source file | Verified source size | Source color |
| --- | --- | --- | --- |
| 056 | `assets/generated/sheets/aidm-treasure-material-icons-sheet-056.png` | 2048 x 2048 | RGB PNG, no alpha |

## Slicing Method

- Cut source sheet 056 into an 8x8 grid using the actual 2048 x 2048 source dimensions.
- Each source cell is 256 x 256 and maps row-major to one output tile.
- Resized each tile to 512 x 512.
- Applied `ffmpeg` chroma-key cleanup with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 056 | `assets/generated/items/aidm-treasure-material-056-01.png` through `assets/generated/items/aidm-treasure-material-056-64.png` | 64 | `sliced`, `alpha-cleaned`, `validated` |

## Follow-Up Flags

- `source-size-risk`: source sheet is 2048 x 2048 rather than 4096 x 4096. Slicing used actual dimensions, then upscaled each 256 x 256 cell to the required 512 x 512 output size.
- `needs-alpha-review`: chroma key was applied against green background. If an icon intentionally uses pixels close to pure `#00ff00`, those pixels may have been made transparent.
- `needs-manifest`: outputs remain unregistered.
- `needs-integration`: outputs remain unbound at runtime.

## Verification

Commands run:

```bash
file assets/generated/sheets/aidm-treasure-material-icons-sheet-056.png
sips -g pixelWidth -g pixelHeight assets/generated/sheets/aidm-treasure-material-icons-sheet-056.png
node -e '<PNG header validation for assets/generated/items/aidm-treasure-material-056-*.png>'
sips -g pixelWidth -g pixelHeight -g hasAlpha assets/generated/items/aidm-treasure-material-056-01.png assets/generated/items/aidm-treasure-material-056-32.png assets/generated/items/aidm-treasure-material-056-64.png
file assets/generated/items/aidm-treasure-material-056-01.png assets/generated/items/aidm-treasure-material-056-32.png assets/generated/items/aidm-treasure-material-056-64.png
git diff --check -- docs/assets/generation-notes/icon-sheet-056-slicing.md
```

Results:

- Source check passed: sheet 056 is 2048 x 2048 RGB PNG.
- Count and naming check passed: 64 outputs, continuous `01` through `64`, no extras.
- PNG header check passed: all 64 outputs are 512 x 512, 8-bit RGBA PNG files.
- Sample check passed: outputs `01`, `32`, and `64` are 512 x 512 with alpha.
- Diff whitespace check passed for this note.
