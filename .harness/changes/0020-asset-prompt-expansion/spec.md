# 0020 Asset Prompt Expansion

## Requirement

Expand the missing asset prompt queue and description map for AIDM without generating images or touching runtime integration. The expansion must give downstream workers enough prompt detail, source naming, sheet cutting expectations, and bilingual metadata planning to continue asset generation after the active 0019 `042-049` wave.

## Scope

- Add 50 single-scene prompts beginning at `scene-050-01`.
- Add 10 icon/cutout sheet prompts beginning at `icon-sheet-050-*` and ending at `icon-sheet-059-*`.
- Plan 640 icon/cutout cells across 8x8 sheets with row-major cell order, target source file, target output directory, frame prefix, expected asset ids, prompt, and negative prompt.
- Add description map rows for every newly planned scene and icon cell.
- Add a short expansion index under `docs/assets/` for downstream coordination.

## Out Of Scope

- No image generation.
- No PNG, SVG, source-sheet, cutout, or alpha cleanup output.
- No edits to `assets/generated/manifest.json`, `assets/manifest.json`, `src/core/*`, or `public/*`.
- No changes to current 0019 global status or generation notes.
- No player-safe promotion, runtime binding, or integration completion claims.

## Acceptance Criteria

- Prompt refs do not overlap the active `042-049` generation and slicing range.
- Scene prompts remain single-image prompts with theme, place, season, weather, time, encounter state, camera, mood, size, and prompt.
- Icon sheets retain the AIDM icon style anchor, chroma-key green background, no-text/no-number constraints, and shared negative prompt.
- Description rows use the existing fields and set implementation status only to `ready-for-generation`.
- Harness status and diff whitespace checks pass for touched Markdown and Harness files.
