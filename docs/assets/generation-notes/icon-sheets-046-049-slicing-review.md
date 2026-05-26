# Icon Sheets 046-049 Slicing Review

Date: 2026-05-25 Asia/Shanghai.

Worker: icon slicing QA/repair worker B.

Scope: reviewed only the generated 046-049 icon/item slices and this note. No edits were made to 042-045 assets, scenes, source sheets, manifests, runtime code, public UI, Harness 0019, global status, or prompt source documents.

## Summary

| Sheet | Output pattern | Count | Slice file status | Visual QA status |
| --- | --- | ---: | --- | --- |
| 046 | `assets/generated/icons/aidm-class-badge-046-01.png` through `assets/generated/icons/aidm-class-badge-046-16.png` | 16 | pass | pass |
| 047 | `assets/generated/items/aidm-equipment-tool-047-01.png` through `assets/generated/items/aidm-equipment-tool-047-16.png` | 16 | pass | `needs-regeneration` for source-grid overlap |
| 048 | `assets/generated/items/aidm-reward-economy-048-01.png` through `assets/generated/items/aidm-reward-economy-048-16.png` | 16 | pass | `needs-regeneration` for source-grid overlap |
| 049 | `assets/generated/icons/aidm-weather-overlay-049-01.png` through `assets/generated/icons/aidm-weather-overlay-049-16.png` | 16 | pass | pass |

## Checks Performed

- Output count and row-major filename completeness: pass, 64 of 64 expected files exist.
- PNG metadata: pass, all 64 outputs are 512 x 512, 8-bit RGBA PNGs.
- Alpha and non-empty pixel scan: pass, no all-transparent files, no low-transparency full-background files, and no detected chroma-green background remnants.
- Visual contact-sheet review: pass for 046 and 049; 047 and 048 have source-grid overlap artifacts described below.
- Source sheet grid overlay review: confirmed the 047 and 048 artifacts are already present across 512 px source grid boundaries, so re-slicing the same row-major 512 x 512 cells would reproduce the issue.

## Repair Decision

No PNGs were repaired in this pass.

Reason: the only visual defects found are source-sheet grid-overlap defects in 047 and 048, not missing files, wrong dimensions, bad RGBA mode, empty tiles, retained green background, or a non-row-major crop. The allowed repair path is to re-cut from the source sheet using the same row-major 512 x 512 tile boundaries; that would not remove these artifacts. Source sheet edits or regeneration are outside this worker's allowed repair scope.

## Follow-Up Flags

`needs-reslice`: none.

`needs-regeneration`:

- `assets/generated/items/aidm-equipment-tool-047-06.png`: contains a small lower-edge fragment from the source sheet's row-3 cloak crossing into row 2; the paired cloak tile also starts clipped.
- `assets/generated/items/aidm-equipment-tool-047-09.png` through `assets/generated/items/aidm-equipment-tool-047-12.png`: lower-edge fragments from row-4 items are visible in row-3 cells.
- `assets/generated/items/aidm-equipment-tool-047-13.png` through `assets/generated/items/aidm-equipment-tool-047-16.png`: row-4 items begin above the row-major boundary in the source sheet, so their top edges are clipped by strict slicing.
- `assets/generated/items/aidm-reward-economy-048-09.png` through `assets/generated/items/aidm-reward-economy-048-12.png`: lower-edge fragments from row-4 items are visible in row-3 cells.
- `assets/generated/items/aidm-reward-economy-048-13.png` through `assets/generated/items/aidm-reward-economy-048-16.png`: row-4 items begin above the row-major boundary in the source sheet, so their top edges are clipped by strict slicing.

## Verification Evidence

Commands run:

```bash
file assets/generated/icons/aidm-class-badge-046-*.png assets/generated/items/aidm-equipment-tool-047-*.png assets/generated/items/aidm-reward-economy-048-*.png assets/generated/icons/aidm-weather-overlay-049-*.png
node <inline PNG metadata/alpha scanner>
file assets/generated/sheets/aidm-class-profession-badges-sheet-046.png assets/generated/sheets/aidm-equipment-tools-sheet-047.png assets/generated/sheets/aidm-reward-economy-sheet-048.png assets/generated/sheets/aidm-weather-overlay-icons-sheet-049.png
```

Key scanner results:

```text
count 64
missing []
wrong []
empty []
low_transparent_ratio total 0 []
green_residual_candidates total 0 []
046 nonempty_ratio_range 0.4499..0.5328 transparent_ratio_range 0.4672..0.5501
047 nonempty_ratio_range 0.0882..0.4914 transparent_ratio_range 0.5086..0.9118
048 nonempty_ratio_range 0.2433..0.4260 transparent_ratio_range 0.5740..0.7567
049 nonempty_ratio_range 0.1615..0.4162 transparent_ratio_range 0.5838..0.8385
```

Final note check:

```bash
git diff --check -- docs/assets/generation-notes/icon-sheets-046-049-slicing-review.md
```

Result: pass.
