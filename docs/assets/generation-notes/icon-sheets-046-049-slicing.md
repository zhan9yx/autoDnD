# Icon Sheets 046-049 Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: icon sheet slicing worker B.

Scope: source sheets 046-049 slicing only. No source sheet edits, scene edits, Harness edits, manifest registration, runtime integration, public UI edits, or status document edits were performed.

## Source Sheets

| Sheet | Source file | Verified source size |
| --- | --- | --- |
| 046 | `assets/generated/sheets/aidm-class-profession-badges-sheet-046.png` | 2048 x 2048 RGB PNG |
| 047 | `assets/generated/sheets/aidm-equipment-tools-sheet-047.png` | 2048 x 2048 RGB PNG |
| 048 | `assets/generated/sheets/aidm-reward-economy-sheet-048.png` | 2048 x 2048 RGB PNG |
| 049 | `assets/generated/sheets/aidm-weather-overlay-icons-sheet-049.png` | 2048 x 2048 RGB PNG |

## Slicing Method

- Cut each accepted source sheet into a 4x4 grid of 512 x 512 tiles.
- Used row-major ordering: tile `01` is row 1 column 1, tile `04` is row 1 column 4, tile `05` is row 2 column 1, and tile `16` is row 4 column 4.
- Applied ffmpeg RGB chroma key cleanup to each crop with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheets were not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 046 | `assets/generated/icons/aidm-class-badge-046-01.png` through `assets/generated/icons/aidm-class-badge-046-16.png` | 16 | `sliced`, `alpha-cleaned` |
| 047 | `assets/generated/items/aidm-equipment-tool-047-01.png` through `assets/generated/items/aidm-equipment-tool-047-16.png` | 16 | `sliced`, `alpha-cleaned` |
| 048 | `assets/generated/items/aidm-reward-economy-048-01.png` through `assets/generated/items/aidm-reward-economy-048-16.png` | 16 | `sliced`, `alpha-cleaned` |
| 049 | `assets/generated/icons/aidm-weather-overlay-049-01.png` through `assets/generated/icons/aidm-weather-overlay-049-16.png` | 16 | `sliced`, `alpha-cleaned` |

## Follow-Up Flags

- `needs-regeneration`: none observed in this slicing pass.
- `needs-alpha-cleanup`: none marked. The automated key removes the bright green sheet background and preserves intentional green/teal icon details.
- `needs-manifest`: all outputs remain unregistered.
- `needs-integration`: all outputs remain unbound at runtime.

## Verification

Commands run:

```bash
file assets/generated/icons/aidm-class-badge-046-*.png assets/generated/items/aidm-equipment-tool-047-*.png assets/generated/items/aidm-reward-economy-048-*.png assets/generated/icons/aidm-weather-overlay-049-*.png
find assets/generated/icons -maxdepth 1 -name 'aidm-class-badge-046-*.png' -type f | wc -l
find assets/generated/items -maxdepth 1 -name 'aidm-equipment-tool-047-*.png' -type f | wc -l
find assets/generated/items -maxdepth 1 -name 'aidm-reward-economy-048-*.png' -type f | wc -l
find assets/generated/icons -maxdepth 1 -name 'aidm-weather-overlay-049-*.png' -type f | wc -l
```

Results:

- All 64 output files are PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced.
- Count check passed: 16 class badge tiles, 16 equipment tool tiles, 16 reward economy tiles, and 16 weather overlay tiles.
