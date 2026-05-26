# Icon Sheet 047 Regeneration R4

Date: 2026-05-26 Asia/Shanghai.

Worker: 047 R4 finalize worker.

Scope: 047 only. 048 was not processed.

## Candidate

- Candidate path: `/Users/yixuan.zhang/.codex/generated_images/019e5ff4-76c8-7100-9fcb-99d7fb13e0af/ig_06b602152042b23f016a147843f4fc8191b95beb5ccc3d51dd.png`
- Candidate dimensions: 1254 x 1254.
- Candidate mode: RGB PNG.
- Candidate usability: usable after local cleanup.
- Layout judgment: 4x4 row-major grid with all 16 slots occupied.

## Outputs

- Source sheet: `assets/generated/sheets/aidm-equipment-tools-sheet-047.png`
- Source dimensions: 2048 x 2048 RGB.
- Source SHA-256: `de1f111208cc579cfa2b98bdd6f592ad95914431fc3c32cc728dd6e68a555555`
- Slice output: `assets/generated/items/aidm-equipment-tool-047-01.png` through `assets/generated/items/aidm-equipment-tool-047-16.png`
- Slice count: 16.
- Slice dimensions: 512 x 512 RGBA.
- Actual overwrite: yes. The source sheet and all 16 `047` item slices were written from the specified candidate.

## Alpha And Cleanup

Alpha method:

- Resized the candidate to 2048 x 2048.
- Classified the green background with chroma-key threshold `g > 150`, `g - r > 70`, and `g - b > 70`.
- Limited background removal to border-connected green regions.
- Normalized source-sheet background pixels to pure `#00ff00`.
- Exported 16 RGBA slices with `alpha = 0` for the final background mask and `alpha = 255` elsewhere.

047-12 local cleanup:

- Initial 047-12 review found one detached non-green fragment in the bottom outer 8 px band.
- Removed detached 047-12 non-green components touching the outer 8 px band.
- Cleanup size: 509 pixels.

## 047-12 Review

- Slice path: `assets/generated/items/aidm-equipment-tool-047-12.png`
- Slice SHA-256: `2eb8c75ac861f8a4d0ed7e10c7e0b0fa61f146830a178fbb6af65f495c8567b9`
- Final non-transparent bounding box: `[25, 64, 445, 415]`.
- Final outer 8 px non-transparent pixels: 0.
- Final corner 8 px non-transparent pixels: 0.
- Review result: no detached outer-edge or corner artifact remains after cleanup.

## Verification

Requested note check:

```bash
git diff --check -- docs/assets/generation-notes/icon-sheet-047-regeneration-r4.md
```

Result: pass, exit 0 with no output.

Independent QA is still required before treating the regenerated 047 sheet as final approved production art.
