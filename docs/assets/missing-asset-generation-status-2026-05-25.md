# Missing Asset Generation Status 2026-05-25

Run date: 2026-05-25 Asia/Shanghai.

Queue source: `docs/assets/missing-asset-generation-prompts.md`.

Scope: generated-image source tracking only. Rows in this file do not imply manifest registration, cutout slicing, alpha cleanup, runtime binding, player-safe exposure, or UI integration.

Status values:

- `pending-generation`: prompt has not been submitted to image generation yet.
- `generated-source-saved`: source image was generated, visually checked, and saved in the workspace.
- `needs-regeneration`: generated image failed visual or technical review and should be retried.
- `needs-slicing`: source sheet exists and still needs cutting/chroma-key cleanup.
- `needs-manifest`: generated file exists but is not registered in `assets/generated/manifest.json`.
- `needs-integration`: manifest-ready asset still needs runtime/UI binding.

## Progress

| Metric | Count |
| --- | ---: |
| Total prompt jobs | 24 |
| Generated source saved | 4 |
| Pending generation | 20 |
| Needs regeneration | 0 |

## Generation Queue

| Order | Prompt ref | Type | Target source path | Target frame/cut directory | Status | Visual check | Notes |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `scene-042-01-market-rain-dawn-investigation` | scene | `assets/generated/scenes/aidm-scene-backbone-042-01.png` | `assets/generated/scenes/` | generated-source-saved; needs-manifest; needs-integration | pass | 1536x1024. Rainy archive market scene accepted; no readable text observed. |
| 2 | `scene-042-02-tavern-snow-night-social` | scene | `assets/generated/scenes/aidm-scene-backbone-042-02.png` | `assets/generated/scenes/` | generated-source-saved; needs-manifest; needs-integration | pass | 1536x1024. Snowbound tavern negotiation stage accepted; no text observed. |
| 3 | `scene-042-03-forest-fog-autumn-ambush` | scene | `assets/generated/scenes/aidm-scene-backbone-042-03.png` | `assets/generated/scenes/` | generated-source-saved; needs-manifest; needs-integration | pass | 1536x1024. Autumn fog road accepted with cart, rope line, and ambush clues. |
| 4 | `scene-042-04-harbor-clear-summer-chase` | scene | `assets/generated/scenes/aidm-scene-backbone-042-04.png` | `assets/generated/scenes/` | generated-source-saved; needs-manifest; needs-integration | pass | 1536x1024. Bright harbor chase route accepted with clear pier-to-ship path. |
| 5 | `scene-042-05-shrine-snow-dusk-calm` | scene | `assets/generated/scenes/aidm-scene-backbone-042-05.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 6 | `scene-042-06-crypt-smoke-midnight-ritual` | scene | `assets/generated/scenes/aidm-scene-backbone-042-06.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 7 | `scene-042-07-desert-ruin-heat-dusk-aftermath` | scene | `assets/generated/scenes/aidm-scene-backbone-042-07.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 8 | `scene-042-08-mountain-wind-dawn-retreat` | scene | `assets/generated/scenes/aidm-scene-backbone-042-08.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 9 | `scene-042-09-courthouse-clear-day-hearing` | scene | `assets/generated/scenes/aidm-scene-backbone-042-09.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 10 | `scene-042-10-guildhall-evening-victory` | scene | `assets/generated/scenes/aidm-scene-backbone-042-10.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 11 | `scene-042-11-swamp-fog-spring-danger` | scene | `assets/generated/scenes/aidm-scene-backbone-042-11.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 12 | `scene-042-12-battlefield-storm-autumn-aftermath` | scene | `assets/generated/scenes/aidm-scene-backbone-042-12.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 13 | `scene-042-13-sewer-rain-midnight-stealth` | scene | `assets/generated/scenes/aidm-scene-backbone-042-13.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 14 | `scene-042-14-library-rain-night-investigation` | scene | `assets/generated/scenes/aidm-scene-backbone-042-14.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 15 | `scene-042-15-cavern-moon-combat` | scene | `assets/generated/scenes/aidm-scene-backbone-042-15.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 16 | `scene-042-16-village-snow-day-calm` | scene | `assets/generated/scenes/aidm-scene-backbone-042-16.png` | `assets/generated/scenes/` | pending-generation | pending | Single full-bleed scene; no sprite sheet. |
| 17 | `icon-sheet-042-actions` | sprite sheet | `assets/generated/sheets/aidm-action-icons-sheet-042.png` | `assets/generated/icons/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 18 | `icon-sheet-043-spells` | sprite sheet | `assets/generated/sheets/aidm-spell-icons-sheet-043.png` | `assets/generated/spells/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 19 | `icon-sheet-044-scrolls` | sprite sheet | `assets/generated/sheets/aidm-scroll-icons-sheet-044.png` | `assets/generated/items/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 20 | `icon-sheet-045-status` | sprite sheet | `assets/generated/sheets/aidm-status-icons-sheet-045.png` | `assets/generated/icons/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 21 | `icon-sheet-046-class-profession` | sprite sheet | `assets/generated/sheets/aidm-class-profession-badges-sheet-046.png` | `assets/generated/icons/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 22 | `icon-sheet-047-equipment` | sprite sheet | `assets/generated/sheets/aidm-equipment-tools-sheet-047.png` | `assets/generated/items/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 23 | `icon-sheet-048-economy` | sprite sheet | `assets/generated/sheets/aidm-reward-economy-sheet-048.png` | `assets/generated/items/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
| 24 | `icon-sheet-049-weather-overlays` | sprite sheet | `assets/generated/sheets/aidm-weather-overlay-icons-sheet-049.png` | `assets/generated/icons/` | pending-generation | pending | Requires later 4x4 slicing and chroma-key cleanup. |
