# Icon Sheets 042-045 Slicing Review

Date: 2026-05-25

Scope:
- Source sheets reviewed:
  - `assets/generated/sheets/aidm-action-icons-sheet-042.png`
  - `assets/generated/sheets/aidm-spell-icons-sheet-043.png`
  - `assets/generated/sheets/aidm-scroll-icons-sheet-044.png`
  - `assets/generated/sheets/aidm-status-icons-sheet-045.png`
- Output paths reviewed:
  - `assets/generated/icons/aidm-action-icon-042-01..16.png`
  - `assets/generated/spells/aidm-spell-icon-043-01..16.png`
  - `assets/generated/items/aidm-scroll-icon-044-01..16.png`
  - `assets/generated/icons/aidm-status-icon-045-01..16.png`

Result: pass. No reslicing or regeneration was needed.

Checks performed:
- Confirmed 64 expected output files are present.
- Confirmed row-major `01..16` naming is complete for all four sheets.
- Confirmed all 64 outputs are `313x313` PNGs with RGBA color.
- Confirmed each output has non-empty visible alpha pixels.
- Checked transparent-background behavior by measuring visible alpha on borders and corners.
- Checked for obvious retained green sheet background; maximum measured green border coverage was 0.35%, with 0.00% green corner coverage.
- Visually reviewed a contact sheet of all 64 outputs against the four source sheets for empty tiles, obvious crop shifts, and large green remnants.

Measured summary:

| Sheet | Outputs | Min visible alpha | Max green border | Max green corner | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| 042 action | 16 | 14.66% | 0.13% | 0.00% | pass |
| 043 spell | 16 | 17.20% | 0.26% | 0.00% | pass |
| 044 scroll | 16 | 38.71% | 0.35% | 0.00% | pass |
| 045 status | 16 | 30.82% | 0.34% | 0.00% | pass |

Notes:
- Source sheets are `1254x1254` RGB PNGs; reviewed outputs are the expected `313x313` transparent RGBA tiles.
- Several scroll/status icons intentionally reach a crop edge in the source art. They were visually checked and are not marked as mis-sliced.
- No files were marked `needs-reslice`.
- No files were marked `needs-regeneration`.

Verification commands run:
- `file assets/generated/icons/aidm-action-icon-042-01.png assets/generated/spells/aidm-spell-icon-043-16.png assets/generated/items/aidm-scroll-icon-044-14.png assets/generated/icons/aidm-status-icon-045-16.png`
- Node PNG coverage check for expected files, dimensions, RGBA color type, visible alpha, border/corner alpha, and green-background remnants.
- `git diff --check -- docs/assets/generation-notes/icon-sheets-042-045-slicing-review.md`
