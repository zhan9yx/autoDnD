# Icon Sheets 058-059 Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: image slicing worker S3.

Scope: sheet 058 status/hazard slicing only after dispatcher correction. Sheet 059 was not processed in this pass. No source sheet edits, new image generation, manifest registration, runtime integration, or unrelated asset edits were performed.

## Current Status And Blocker

- The first attempted slicing path used Python/Pillow and failed before completing output with a macOS Rosetta code-signature error while loading Pillow's `_imaging` native extension.
- Because that path exited before successful completion, dispatcher-observed sliced counts for 058/059 were still zero at handoff time.
- The continuation switched to `ffmpeg` for sheet 058 only, per the revised instruction. Sheet 059 remains intentionally untouched.

## Source Sheet

| Sheet | Source file | Verified source size |
| --- | --- | --- |
| 058 | `assets/generated/sheets/aidm-status-hazard-icons-sheet-058.png` | 4096 x 4096 RGB PNG |

## Slicing Method

- Cut source sheet 058 into an 8x8 grid using the actual 4096 x 4096 source dimensions.
- Each grid cell maps to one 512 x 512 output tile.
- Used row-major ordering: tile `01` is row 1 column 1, tile `08` is row 1 column 8, tile `09` is row 2 column 1, and tile `64` is row 8 column 8.
- Applied `ffmpeg` RGB chroma-key cleanup to each crop with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 058 | `assets/generated/icons/aidm-status-hazard-058-01.png` through `assets/generated/icons/aidm-status-hazard-058-64.png` | 64 | `sliced`, `alpha-cleaned`, `validated` |
| 059 | `assets/generated/icons/aidm-faction-overlay-059-01.png` through `assets/generated/icons/aidm-faction-overlay-059-64.png` | 0 | `not-processed-per-dispatcher-instruction` |

## Follow-Up Flags

- `needs-regeneration`: none observed for sheet 058. Visual source inspection showed a green background, 64 populated cells, no visible text labels, no obvious tile borders, and no obvious cross-grid subjects.
- `needs-alpha-review`: sheet 058 contains intentional green poison, acid, gas, and glow effects. The chroma key may remove pixels close to pure `#00ff00` in those effects.
- `not-processed-059`: sheet 059 was left untouched by request and still needs a separate slicing pass.
- `needs-manifest`: 058 outputs remain unregistered.
- `needs-integration`: 058 outputs remain unbound at runtime.

## Verification

Commands run:

```bash
sips -g pixelWidth -g pixelHeight assets/generated/sheets/aidm-status-hazard-icons-sheet-058.png
node -e '<PNG header validation for assets/generated/icons/aidm-status-hazard-058-*.png>'
node -e '<count validation for assets/generated/icons/aidm-faction-overlay-059-*.png>'
git diff --check -- docs/assets/generation-notes/icon-sheets-058-059-slicing.md
```

Results:

- Source check passed: sheet 058 is 4096 x 4096.
- Count check passed: 64 status/hazard outputs.
- PNG header check passed: all 64 status/hazard outputs are 512 x 512, 8-bit RGBA PNG files.
- Scope check passed: 0 faction-overlay 059 outputs were created in this pass.

---

# Icon Sheet 059 Faction Overlay Slicing Addendum

Date: 2026-05-25 Asia/Shanghai.

Worker: 059-only slicing worker.

Scope: sheet 059 faction overlay slicing only. No source sheet edits, new image generation, manifest registration, runtime integration, or unrelated asset edits were performed. This addendum supersedes only the earlier 059 `not-processed` status above; the 058 record remains unchanged.

## 059 Source Sheet

| Sheet | Source file | Verified source size |
| --- | --- | --- |
| 059 | `assets/generated/sheets/aidm-faction-overlay-icons-sheet-059.png` | 4096 x 4096 RGB PNG |

## 059 Slicing Method

- Cut source sheet 059 into an 8x8 grid using the actual 4096 x 4096 source dimensions.
- Each grid cell maps to one 512 x 512 output tile.
- Used row-major ordering: tile `01` is row 1 column 1, tile `08` is row 1 column 8, tile `09` is row 2 column 1, and tile `64` is row 8 column 8.
- Applied `ffmpeg` RGB chroma-key cleanup to each crop with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheet was not modified.

## 059 Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 059 | `assets/generated/icons/aidm-faction-overlay-059-01.png` through `assets/generated/icons/aidm-faction-overlay-059-64.png` | 64 | `sliced`, `alpha-cleaned`, `validated` |

## 059 Follow-Up Flags

- `needs-regeneration`: none observed for sheet 059. Sampled output inspection showed green background cleanup, populated cells, no visible text labels, no obvious tile borders, and no obvious cross-grid subjects.
- Badge inner rings and faction medallion rings were treated as icon body, not border contamination.
- `needs-manifest`: 059 outputs remain unregistered.
- `needs-integration`: 059 outputs remain unbound at runtime.

## 059 Verification

Commands run:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of default=noprint_wrappers=1 assets/generated/sheets/aidm-faction-overlay-icons-sheet-059.png
node -e '<count, continuity, and PNG header validation for assets/generated/icons/aidm-faction-overlay-059-*.png>'
for f in assets/generated/icons/aidm-faction-overlay-059-01.png assets/generated/icons/aidm-faction-overlay-059-08.png assets/generated/icons/aidm-faction-overlay-059-32.png assets/generated/icons/aidm-faction-overlay-059-64.png; do ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of csv=p=0 "$f"; done
sips -g hasAlpha assets/generated/icons/aidm-faction-overlay-059-01.png assets/generated/icons/aidm-faction-overlay-059-08.png assets/generated/icons/aidm-faction-overlay-059-32.png assets/generated/icons/aidm-faction-overlay-059-64.png
ffmpeg -v error -i '<sample output>' -vf 'alphaextract,signalstats,metadata=print:file=-' -f null -
chafa -f symbols -c none --symbols block --fill space --size 24x12 --label on '<sample outputs>'
git diff --check -- docs/assets/generation-notes/icon-sheets-058-059-slicing.md
```

Results:

- Source check passed: sheet 059 is 4096 x 4096, `rgb24`.
- Count and continuity check passed: exactly 64 faction-overlay outputs exist, with suffixes `01` through `64`.
- PNG header check passed: all 64 faction-overlay outputs are 512 x 512, 8-bit RGBA PNG files.
- Sample metadata check passed for `01`, `08`, `32`, and `64`: each reports `512,512,rgba`.
- Sample alpha check passed for `01`, `08`, `32`, and `64`: each has alpha and alpha channel `YMIN=0`, `YMAX=255`.
