# Icon Sheet 055 Tool Clue Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: 055-only slicing worker.

Scope: sheet 055 tool/clue icon slicing only. No source sheet edits, new image generation, manifest registration, runtime integration, or unrelated worker files were modified.

## Source Sheet

| Sheet | Source file | Verified source size | Source format |
| --- | --- | ---: | --- |
| 055 | `assets/generated/sheets/aidm-tool-clue-icons-sheet-055.png` | 1254 x 1254 | RGB PNG |

## Slicing Method

- Cut source sheet 055 into an 8x8 grid using the actual 1254 x 1254 source dimensions.
- Because 1254 is not evenly divisible by 8, crop bounds used proportional integer edges from `floor(i * 1254 / 8)`: `0, 156, 313, 470, 627, 783, 940, 1097, 1254`.
- This produces source cells of 156 or 157 pixels while covering the full source sheet without dropping edge pixels.
- Each cropped cell was scaled to a 512 x 512 output PNG with Lanczos scaling.
- Applied RGB chroma-key cleanup after scaling with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- Used row-major ordering: tile `01` is row 1 column 1, tile `08` is row 1 column 8, tile `09` is row 2 column 1, and tile `64` is row 8 column 8.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 055 | `assets/generated/items/aidm-tool-clue-055-01.png` through `assets/generated/items/aidm-tool-clue-055-64.png` | 64 | `sliced`, `alpha-cleaned`, `validated` |

## Follow-Up Flags

- `non-4096-source`: the source sheet is 1254 x 1254, not the preferred 4096 x 4096. Outputs are accepted as best-effort 8x8 proportional crops scaled to 512 x 512.
- `needs-alpha-review`: chroma-key cleanup removes pixels close to pure `#00ff00`; any intentional bright green glass, glow, herb, or magic detail may need visual review before promotion.
- `needs-manifest`: 055 outputs remain unregistered.
- `needs-integration`: 055 outputs remain unbound at runtime.

## Verification

Commands run:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of default=noprint_wrappers=1 assets/generated/sheets/aidm-tool-clue-icons-sheet-055.png
find assets/generated/items -maxdepth 1 -name 'aidm-tool-clue-055-*.png' -print | sort
file assets/generated/items/aidm-tool-clue-055-01.png assets/generated/items/aidm-tool-clue-055-32.png assets/generated/items/aidm-tool-clue-055-64.png
node -e '<PNG header validation for assets/generated/items/aidm-tool-clue-055-*.png>'
node <<'NODE'
<RGBA alpha-pixel validation for assets/generated/items/aidm-tool-clue-055-*.png>
NODE
git diff --check -- docs/assets/generation-notes/icon-sheet-055-slicing.md
```

Results:

- Source check passed: sheet 055 is 1254 x 1254, `rgb24`.
- Count and continuity check passed: 64 files exist, continuously named from `aidm-tool-clue-055-01.png` through `aidm-tool-clue-055-64.png`.
- PNG header check passed: all 64 outputs are 512 x 512, 8-bit RGBA PNG files.
- Sample check passed: files `01`, `32`, and `64` report as 512 x 512, 8-bit/color RGBA PNG.
- Alpha check passed: all 64 outputs contain transparent pixels and opaque visible pixels after chroma-key cleanup.
