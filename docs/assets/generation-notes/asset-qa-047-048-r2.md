# Asset QA 047-048 R2

Date: 2026-05-26 Asia/Shanghai.

Worker: 047/048 R2 QA worker.

Scope reviewed only the requested R2 outputs:

- `assets/generated/sheets/aidm-equipment-tools-sheet-047.png`
- `assets/generated/sheets/aidm-reward-economy-sheet-048.png`
- `assets/generated/items/aidm-equipment-tool-047-01.png` through `assets/generated/items/aidm-equipment-tool-047-16.png`
- `assets/generated/items/aidm-reward-economy-048-01.png` through `assets/generated/items/aidm-reward-economy-048-16.png`

No assets, slices, source sheets, prompts, manifests, runtime files, Harness files, or unrelated notes were edited.

## Decision

Overall decision: `needs-regeneration`.

| Asset group | Count/metadata | Visual QA | Decision |
| --- | --- | --- | --- |
| 047 equipment tools | `pass`: source sheet present; 16/16 item slices present with continuous `01` through `16` names; all sampled and scanner-checked item slices are 512 x 512 RGBA PNGs with transparent backgrounds. | `fail`: `aidm-equipment-tool-047-12.png` still contains a detached lower-right fragment that appears to be a neighboring stringed-instrument headstock rather than part of the tool roll. | `needs-regeneration` |
| 048 reward economy | `pass`: source sheet present; 16/16 item slices present with continuous `01` through `16` names; all sampled and scanner-checked item slices are 512 x 512 RGBA PNGs with transparent backgrounds. | `fail`: `aidm-reward-economy-048-09.png`, `aidm-reward-economy-048-10.png`, and `aidm-reward-economy-048-11.png` still contain detached bottom-edge fragments from the next row. | `needs-regeneration` |

R2 improved the exterior alpha cleanup: the full pixel scan found no non-transparent pixels in the outer 4 px or 8 px band of any of the 32 slices. However, R2 did not fully eliminate the prior grid-boundary pollution because visible neighboring-cell fragments remain inside several slice canvases.

## Count Check

| Group | Expected | Found expected | Matched total | Continuity | Status |
| --- | ---: | ---: | ---: | --- | --- |
| `aidm-equipment-tool-047-*.png` | 16 | 16 | 16 | `01` through `16` | pass |
| `aidm-reward-economy-048-*.png` | 16 | 16 | 16 | `01` through `16` | pass |
| `aidm-equipment-tools-sheet-047.png` | 1 | 1 | 1 | n/a | pass |
| `aidm-reward-economy-sheet-048.png` | 1 | 1 | 1 | n/a | pass |

## Metadata And Pixel Evidence

`file` confirmed the two source sheets are 2048 x 2048 RGB PNGs, and all 32 item slices are 512 x 512 RGBA PNGs.

Read-only PNG scanner results:

```text
047: expected=16 found_expected=16 matched_total=16 missing=[] extra=[] wrong=[] empty=[] corner_failures=[]
047: transparent_ratio_range=0.5474..0.9493 max_edge4=0 max_edge8=0 bbox_w_range=270..418 bbox_h_range=375..424
047 samples: 01 edge4=0 edge8=0; 04 edge4=0 edge8=0; 08 edge4=0 edge8=0; 12 edge4=0 edge8=0; 16 edge4=0 edge8=0

048: expected=16 found_expected=16 matched_total=16 missing=[] extra=[] wrong=[] empty=[] corner_failures=[]
048: transparent_ratio_range=0.5763..0.7160 max_edge4=0 max_edge8=0 bbox_w_range=291..421 bbox_h_range=333..424
048 samples: 01 edge4=0 edge8=0; 04 edge4=0 edge8=0; 08 edge4=0 edge8=0; 12 edge4=0 edge8=0; 16 edge4=0 edge8=0

sheet aidm-equipment-tools-sheet-047.png: RGB 2048x2048, all four corners 0/255/0
sheet aidm-reward-economy-sheet-048.png: RGB 2048x2048, all four corners 0/255/0
```

Component scan was used only as supporting evidence for detached-fragment review:

```text
aidm-equipment-tool-047-12.png: components>=100=2; secondary component bbox=373/443/440/467
aidm-reward-economy-048-09.png: components>=100=2; secondary component bbox=244/443/282/467
aidm-reward-economy-048-10.png: components>=100=3; secondary component bboxes=274/440/299/467 and 202/444/228/467
aidm-reward-economy-048-11.png: components>=100=2; secondary component bbox=211/462/292/467
```

## Visual Sampling

Sampled clean examples:

- `aidm-equipment-tool-047-01.png`: centered sword, transparent background, no text, no outer frame pollution.
- `aidm-equipment-tool-047-04.png`: centered crossbow, transparent background, no text, no outer frame pollution.
- `aidm-equipment-tool-047-08.png`: centered helmet, transparent background, no text, no outer frame pollution.
- `aidm-equipment-tool-047-16.png`: centered lute, transparent background, no text, no outer frame pollution.
- `aidm-reward-economy-048-01.png`: centered coin stack, transparent background, no text, no outer frame pollution.
- `aidm-reward-economy-048-04.png`: centered silver ingot, transparent background, no text, no outer frame pollution.
- `aidm-reward-economy-048-08.png`: centered red seal/token, transparent background, no text, no outer frame pollution.
- `aidm-reward-economy-048-12.png` and `aidm-reward-economy-048-16.png`: centered tokens, transparent background, no text, no outer frame pollution.

Sampled failures:

- `aidm-equipment-tool-047-12.png`: the lockpick/tool roll is usable as a main subject, but a small detached object remains near the lower-right corner. It visually matches a neighboring stringed instrument headstock and is not part of the tool roll.
- `aidm-reward-economy-048-09.png`: a detached gold triangular fragment remains below the main gray token.
- `aidm-reward-economy-048-10.png`: detached flower/herb fragments remain below the main bronze token.
- `aidm-reward-economy-048-11.png`: a detached curved gold fragment remains below the main blue token.

## Verification

Final note check:

```bash
git diff --check -- docs/assets/generation-notes/asset-qa-047-048-r2.md
```

Result: pass.
