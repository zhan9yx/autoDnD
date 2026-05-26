# Icon Sheet 050 Hostile Token Slicing Note

Date: 2026-05-25 Asia/Shanghai.

Worker: image slicing worker S1-small.

Scope: sheet 050 hostile token slicing only after the user interruption. No source sheet edits, generation, manifest registration, runtime integration, or 052/053 work was performed in this continuation.

## Current Status And Blocker

- The interrupted prior slicing process continued in the background after the turn was aborted. By the time it was checked, sheet 050 had completed and the process had already entered sheet 051.
- A stop was attempted, but the process had already exited. Sheet 051 files now exist from that prior background process, but they were not part of this continuation and were not validated here.
- This note records only the accepted 050 hostile-token output.

## Source Sheet

| Sheet | Source file | Verified source size |
| --- | --- | --- |
| 050 | `assets/generated/sheets/aidm-hostile-token-icons-sheet-050.png` | 4096 x 4096 RGB PNG |

## Slicing Method

- Cut source sheet 050 into an 8x8 grid using the actual 4096 x 4096 source dimensions.
- Each grid cell maps to one 512 x 512 output tile.
- Used row-major ordering: tile `01` is row 1 column 1, tile `08` is row 1 column 8, tile `09` is row 2 column 1, and tile `64` is row 8 column 8.
- Applied ffmpeg RGB chroma-key cleanup to each crop with `colorkey=0x00ff00:0.25:0.08,format=rgba`.
- The source sheet was not modified.

## Outputs

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 050 | `assets/generated/tokens/aidm-hostile-token-050-01.png` through `assets/generated/tokens/aidm-hostile-token-050-64.png` | 64 | `sliced`, `alpha-cleaned`, `validated` |

## Follow-Up Flags

- `needs-regeneration`: none observed for sheet 050. Visual inspection showed green background, no text labels, no obvious tile borders, no severe blank cells, and no obvious cross-grid subject placement.
- `needs-alpha-review`: some monsters include intentional green or cyan glow effects, so the chroma key may remove pixels close to pure `#00ff00` along VFX edges.
- `out-of-scope-051`: `assets/generated/tokens/aidm-npc-token-051-*.png` files were created by the already-running interrupted process before it could be stopped. They are not validated in this note.
- `needs-manifest`: 050 outputs remain unregistered.
- `needs-integration`: 050 outputs remain unbound at runtime.

## Verification

Commands run:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,pix_fmt -of default=noprint_wrappers=1 assets/generated/sheets/aidm-hostile-token-icons-sheet-050.png
node -e '<PNG header validation for assets/generated/tokens/aidm-hostile-token-050-*.png>'
git diff --check -- docs/assets/generation-notes/icon-sheets-050-051-slicing.md
```

Results:

- Source check passed: sheet 050 is 4096 x 4096, `rgb24`.
- Count check passed: 64 hostile-token outputs.
- PNG header check passed: all 64 hostile-token outputs are 512 x 512, 8-bit RGBA PNG files.

---

# Icon Sheet 051 NPC Token QA Addendum

Date: 2026-05-25 Asia/Shanghai.

Worker: 051 slice QA/closer worker.

Scope: validation only for `assets/generated/tokens/aidm-npc-token-051-01.png` through `assets/generated/tokens/aidm-npc-token-051-64.png`. No source sheet edits, generation, re-slicing, PNG edits, manifest registration, or runtime integration were performed in this pass.

This addendum supersedes the earlier `out-of-scope-051` validation status while preserving the original 050 worker note above.

## 051 Output Status

| Sheet | Output path pattern | Count | Status |
| --- | --- | ---: | --- |
| 051 | `assets/generated/tokens/aidm-npc-token-051-01.png` through `assets/generated/tokens/aidm-npc-token-051-64.png` | 64 | `accepted-for-slice-qa`, `metadata-validated`, `visual-sampled` |

## 051 Checks

- Count/continuity passed: 64 matching PNG files exist, with suffixes `01` through `64` and no missing target in that range.
- PNG metadata passed: all 64 files decode as 512 x 512, 8-bit RGBA PNG.
- Transparency/background check passed: all 64 files contain alpha `0` transparent pixels and alpha `255` visible pixels.
- Blank-cell risk check passed: decoded visible-pixel coverage ranged from 40.26% to 67.88%; no obvious blank token was detected.
- Border/cross-grid residue risk check passed at metadata level: no full-width or full-height border-like alpha runs were detected. Some tokens have visible pixels near the outer edge, but sampled previews read as large character silhouettes rather than continuous tile borders.
- Quick visual sample checked terminal previews for tokens `01`, `08`, `09`, `16`, `32`, `40`, `48`, and `64`; no obvious empty tile, text label, full-frame border, or cross-grid carry-over was observed at coarse preview resolution.
- `pending visual pass`: a high-fidelity manual visual review was not performed in this closer pass, so fine text/artifact defects below terminal-preview resolution remain possible.

## 051 Follow-Up Flags

- `needs-regeneration`: none observed from count, metadata, transparency, blank-cell, border-line, and sampled coarse visual checks.
- `needs-manifest`: 051 outputs remain unregistered.
- `needs-integration`: 051 outputs remain unbound at runtime.

## 051 Verification

Commands run:

```bash
node -e '<PNG header and RGBA pixel validation for assets/generated/tokens/aidm-npc-token-051-*.png>'
node -e '<border-like alpha run scan for assets/generated/tokens/aidm-npc-token-051-*.png>'
chafa -f symbols -c none --symbols block --fill space --size 24x12 --label on assets/generated/tokens/aidm-npc-token-051-01.png assets/generated/tokens/aidm-npc-token-051-08.png assets/generated/tokens/aidm-npc-token-051-09.png assets/generated/tokens/aidm-npc-token-051-16.png assets/generated/tokens/aidm-npc-token-051-32.png assets/generated/tokens/aidm-npc-token-051-40.png assets/generated/tokens/aidm-npc-token-051-48.png assets/generated/tokens/aidm-npc-token-051-64.png
git diff --check -- docs/assets/generation-notes/icon-sheets-050-051-slicing.md
```

Results:

- Count check passed: 64 NPC token outputs.
- PNG metadata check passed: all 64 NPC token outputs are 512 x 512, 8-bit RGBA PNG files.
- Transparency check passed: all 64 NPC token outputs include transparent background pixels.
- Blank-cell check passed: no output had near-empty visible coverage.
- Border-like alpha run scan passed: no full-row or full-column tile border residue detected.
