# Icon Sheet 048 Regeneration R4

Date: 2026-05-26 Asia/Shanghai.

Worker: 048 R4 finalize worker.

Scope: finalized only sheet 048 reward/economy outputs. No image generation, 047 work, manifest registration, runtime integration, prompt edits, or unrelated files were touched.

## Candidate Decision

Candidate used:

- `/Users/yixuan.zhang/.codex/generated_images/019e5ff4-a519-74e3-8e58-bdfa6f899b6e/ig_056b8215ecad564b016a14785174888191949d28b7b5ab4d0e.png`

Decision: `usable`.

Basis:

- Candidate decodes as 1254 x 1254 RGB PNG.
- Visual and cell scan both show a 4x4 reward/economy layout.
- Every row-major 4x4 cell contains a non-empty main subject.
- The candidate has green chroma-key background suitable for local alpha cleanup.

## Processing Method

- Used 4x4 integer bounds covering the full 1254 x 1254 candidate: `0, 314, 627, 940, 1254` on both axes.
- Applied edge-connected green chroma-key alpha cleanup from each crop edge with predicate `g > 150`, `g - r > 70`, and `g - b > 70`.
- Removed detached bottom-edge components from `048-09`, `048-10`, and `048-11` before normalization.
- Resized with premultiplied-alpha sampling.
- Centered each cleaned icon on a 512 x 512 transparent RGBA canvas with a maximum normalized footprint of 424 x 424.
- Rebuilt the source sheet from the final 16 RGBA slices over pure `#00ff00` background.

## Outputs

Actual overwrite: `yes`.

| Output | Path | Result |
| --- | --- | --- |
| Source sheet | `assets/generated/sheets/aidm-reward-economy-sheet-048.png` | 2048 x 2048 RGB PNG, pure `#00ff00` corners |
| Item slices | `assets/generated/items/aidm-reward-economy-048-01.png` through `assets/generated/items/aidm-reward-economy-048-16.png` | 16/16 present, all 512 x 512 RGBA PNG |

## Focused Review

| Slice | Detached cleanup | Outer 8 px opaque pixels | 8 px corner opaque pixels | Result |
| --- | --- | ---: | ---: | --- |
| `048-09` | Removed one 3 px bottom fragment at bbox `[162,312,164,312]`. | 0 | 0 | pass |
| `048-10` | Removed three bottom fragments: 38 px `[104,307,111,312]`, 34 px `[172,308,180,312]`, 33 px `[228,308,236,312]`. | 0 | 0 | pass |
| `048-11` | Removed one 543 px bottom fragment at bbox `[100,303,178,312]`. | 0 | 0 | pass |

Focused result: `048-09`, `048-10`, and `048-11` have no opaque pixels in the outer 8 px band or four 8 x 8 corners after final export, and no detached bottom/corner residue remained in the exported slices.

## Verification

File header check passed:

```text
assets/generated/sheets/aidm-reward-economy-sheet-048.png: PNG image data, 2048 x 2048, 8-bit/color RGB, non-interlaced
assets/generated/items/aidm-reward-economy-048-09.png:     PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
assets/generated/items/aidm-reward-economy-048-10.png:     PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
assets/generated/items/aidm-reward-economy-048-11.png:     PNG image data, 512 x 512, 8-bit/color RGBA, non-interlaced
```

Requested note check:

```bash
git diff --check -- docs/assets/generation-notes/icon-sheet-048-regeneration-r4.md
```

Result: pending at note write time.

Final result: pass, exit 0 with no output.

## Remaining QA

Still needs independent QA before promotion or runtime integration.
