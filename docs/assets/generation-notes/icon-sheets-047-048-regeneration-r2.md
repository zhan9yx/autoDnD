# Icon Sheets 047-048 Regeneration R2

Date: 2026-05-25 Asia/Shanghai.

Worker: 047/048 regeneration worker R2.

Scope: regenerated and re-cut only the requested source sheets and 32 item slices:

- `assets/generated/sheets/aidm-equipment-tools-sheet-047.png`
- `assets/generated/items/aidm-equipment-tool-047-01.png` through `assets/generated/items/aidm-equipment-tool-047-16.png`
- `assets/generated/sheets/aidm-reward-economy-sheet-048.png`
- `assets/generated/items/aidm-reward-economy-048-01.png` through `assets/generated/items/aidm-reward-economy-048-16.png`

No prompt docs, manifests, runtime files, Harness files, QA notes from other workers, or unrelated assets were edited.

## Input Basis

- Prompt source: `docs/assets/missing-asset-generation-prompts.md`, `icon-sheet-047-equipment` and `icon-sheet-048-economy`.
- QA source: `docs/assets/generation-notes/icon-sheets-046-049-slicing-review.md` and `docs/assets/generation-notes/asset-qa-047-048-050.md`.
- Prior QA decision: 047 and 048 were complete by count, but still `needs-regeneration` because source-grid overlap created lower-edge fragments and clipped row-4 items under strict 512 x 512 slicing.

## Generation

Used built-in image generation to create fresh 4x4 source candidates on flat pure `#00ff00` background:

- 047 candidate: `ig_07dfe97f3585c83b016a146fd4743c8191a486d7662b7019de.png`
- 048 candidate: `ig_07dfe97f3585c83b016a147073dac88191a214ca13c5c5ae88.png`

Both generated candidates were 1254 x 1254 RGB PNGs. They were normalized into 2048 x 2048 RGB source sheets for the expected 4x4 layout.

## Processing Method

- Resampled each generated candidate to 2048 x 2048.
- Identified green background by flood-fill from sheet and tile edges using chroma-green dominance.
- Cut strict row-major 512 x 512 cells.
- Converted each cell to 512 x 512 RGBA with transparent chroma-key background.
- Recentered and, where needed, scaled each alpha bbox into a safe maximum 424 x 424 footprint before final export.
- Removed residual near-pure green fringe pixels after alpha cleanup.
- Rebuilt the source sheets from the safe centered RGBA slices over pure `#00ff00`.

This replaces the prior source-grid-boundary pollution: final edge scan found zero non-transparent pixels in the outer 4 px band of every slice.

## Output Summary

| Sheet | Source size | Source mode | Slice count | Slice size | Slice mode | Status |
| --- | --- | --- | ---: | --- | --- | --- |
| 047 | 2048 x 2048 | RGB PNG | 16 | 512 x 512 | RGBA PNG | regenerated and re-cut |
| 048 | 2048 x 2048 | RGB PNG | 16 | 512 x 512 | RGBA PNG | regenerated and re-cut |

Continuous expected outputs are present:

- `aidm-equipment-tool-047-01` through `aidm-equipment-tool-047-16`: 16/16
- `aidm-reward-economy-048-01` through `aidm-reward-economy-048-16`: 16/16

## Verification Evidence

Sampled `file` check:

```text
assets/generated/sheets/aidm-equipment-tools-sheet-047.png: PNG image data, 2048 x 2048, 8-bit/color RGB, non-interlaced
assets/generated/sheets/aidm-reward-economy-sheet-048.png:  PNG image data, 2048 x 2048, 8-bit/color RGB, non-interlaced
assets/generated/items/aidm-equipment-tool-047-01.png:      PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
assets/generated/items/aidm-equipment-tool-047-16.png:      PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
assets/generated/items/aidm-reward-economy-048-01.png:      PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
assets/generated/items/aidm-reward-economy-048-16.png:      PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
```

Sampled `sips` dimensions:

```text
assets/generated/sheets/aidm-equipment-tools-sheet-047.png: 2048 x 2048
assets/generated/sheets/aidm-reward-economy-sheet-048.png: 2048 x 2048
assets/generated/items/aidm-equipment-tool-047-01.png: 512 x 512
assets/generated/items/aidm-equipment-tool-047-16.png: 512 x 512
assets/generated/items/aidm-reward-economy-048-01.png: 512 x 512
assets/generated/items/aidm-reward-economy-048-16.png: 512 x 512
```

PNG scanner results:

```text
047 source corners: 0,255,0 on all four corners
048 source corners: 0,255,0 on all four corners
047 slices: count=16 missing=[] wrong=[] empty=[] transparent_ratio_range=0.5474..0.9493 max_edge_opaque_4px=0 corner_alpha_failures=0
048 slices: count=16 missing=[] wrong=[] empty=[] transparent_ratio_range=0.5763..0.7160 max_edge_opaque_4px=0 corner_alpha_failures=0
```

Count check:

```text
aidm-equipment-tool-047-*.png: 16
aidm-reward-economy-048-*.png: 16
```

Final note check:

```bash
git diff --check -- docs/assets/generation-notes/icon-sheets-047-048-regeneration-r2.md
```

Result: pass.
