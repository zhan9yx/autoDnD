# Icon Sheets 058-059 Generation Notes

Worker: 0020 icon source-sheet generation worker E
Date: 2026-05-25
Scope: source sheet generation only; no slicing, alpha cleanup, manifest, runtime, public code, Harness, or global status edits.

## icon-sheet-058-status-hazards

- Prompt id: `icon-sheet-058-status-hazards`
- Frame prefix: `aidm-status-hazard-058`
- Expected ids: `aidm-status-hazard-058-01` through `aidm-status-hazard-058-64`
- Output path: `assets/generated/sheets/aidm-status-hazard-icons-sheet-058.png`
- Source generation: built-in image generation output copied from `/Users/yixuan.zhang/.codex/generated_images/019e5f8a-bfc4-7a73-b4d2-f4a0933ec96f/ig_08a19e852081a8c6016a145db6f6fc8191b01a470d65be3022.png`
- Final dimensions: 4096 x 4096 PNG, RGB, 8-bit/color, non-interlaced
- Grid/cells: yes, visual 8x8 sheet with 64 independent row-major icons; target tile size is 512 x 512
- Green background: yes, edge-connected chroma background normalized to exact `#00ff00`; outer corner samples are exact `0/255/0`
- No text/numbers/labels: yes by visual inspection
- No sheet border/grid lines/watermark: yes by visual inspection
- Notes: includes status, condition, terrain, trap, weather, and hazard concepts including poison, burning, frozen, bleeding, blessing, curse, poison gas, acid pool, hidden pit, pressure plate, rune trap, and alarm ward.
- Risks: semantic order should still be confirmed during downstream slicing QA; some status cells use abstract faces/skulls as condition tokens, but no written labels are visible.

## icon-sheet-059-factions-overlays

- Prompt id: `icon-sheet-059-factions-overlays`
- Frame prefix: `aidm-faction-overlay-059`
- Expected ids: `aidm-faction-overlay-059-01` through `aidm-faction-overlay-059-64`
- Output path: `assets/generated/sheets/aidm-faction-overlay-icons-sheet-059.png`
- Source generation: built-in image generation output copied from `/Users/yixuan.zhang/.codex/generated_images/019e5f8a-bfc4-7a73-b4d2-f4a0933ec96f/ig_08a19e852081a8c6016a145e18d2b881919fc0f110be3b36db.png`
- Final dimensions: 4096 x 4096 PNG, RGB, 8-bit/color, non-interlaced
- Grid/cells: yes, visual 8x8 sheet with 64 independent row-major icons; target tile size is 512 x 512
- Green background: yes, edge-connected chroma background normalized to exact `#00ff00`; outer corner samples are exact `0/255/0`
- No text/numbers/labels: yes by visual inspection
- No sheet border/grid lines/watermark: yes by visual inspection
- Notes: covers guild, watch/legion, cult/church/shrine, noble, class emblem, season, time, weather, lighting, and locale overlay concepts.
- Risks: many faction/class icons intentionally use badge or medallion rims as the icon shape, consistent with existing badge sheets; if downstream QA interprets those as forbidden UI frames rather than badge artwork, this sheet may need a rimless overlay-focused regeneration.

## Checks

- `file assets/generated/sheets/aidm-status-hazard-icons-sheet-058.png assets/generated/sheets/aidm-faction-overlay-icons-sheet-059.png`: both report PNG image data, 4096 x 4096, 8-bit/color RGB, non-interlaced.
- `sips -g pixelWidth -g pixelHeight ...`: both report `pixelWidth: 4096` and `pixelHeight: 4096`.
- Chroma-key sample check: outer corners and near-corners on both sheets report exact `0/255/0` after background normalization.
- `git diff --check -- docs/assets/generation-notes/icon-sheets-058-059.md`: passed with no output.
