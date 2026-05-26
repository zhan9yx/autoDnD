# Icon Sheet 057 Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: 057-only slicing worker.

Scope: sheet 057 spell scroll/rune slicing only. No source sheet edits, new image generation, manifest registration, runtime integration, public UI edits, Harness status edits, or unrelated worker files were modified.

## Source Sheet

| Sheet | Source file | Verified source size | Source color |
| --- | --- | --- | --- |
| 057 | `assets/generated/sheets/aidm-spell-scroll-rune-icons-sheet-057.png` | 2048 x 2048 | RGB PNG, no alpha |

## Slicing Method

- Cut source sheet 057 into an 8x8 grid using the actual 2048 x 2048 source dimensions.
- Each source cell is 256 x 256 and maps row-major to one output tile.
- Resized each tile to 512 x 512.
- Applied `ffmpeg` chroma-key cleanup with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 057 | `assets/generated/spells/aidm-spell-scroll-rune-057-01.png` through `assets/generated/spells/aidm-spell-scroll-rune-057-64.png` | 64 | `sliced`, `alpha-cleaned` |

## Follow-Up Flags

- `source-size-risk`: source sheet is 2048 x 2048 rather than 4096 x 4096. Slicing used actual dimensions, then upscaled each 256 x 256 cell to the required 512 x 512 output size.
- `needs-alpha-review`: chroma key was applied against green background. If an icon intentionally uses pixels close to pure `#00ff00`, those pixels may have been made transparent.
- `needs-manifest`: outputs remain unregistered.
- `needs-integration`: outputs remain unbound at runtime.

## Verification

Commands run:

```bash
file assets/generated/sheets/aidm-spell-scroll-rune-icons-sheet-057.png
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of default=noprint_wrappers=1 assets/generated/sheets/aidm-spell-scroll-rune-icons-sheet-057.png
git diff --check -- docs/assets/generation-notes/icon-sheet-057-slicing.md
```

Results:

- Source check passed: sheet 057 is 2048 x 2048 RGB PNG.
- Slicing command completed for row-major outputs `01` through `64`.
- Dispatcher observed 64 generated 057 spell scroll/rune outputs before this note-only completion pass.
- Diff whitespace check passed for this note.
