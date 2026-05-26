# 0018 Missing Asset Prompts

## Requirement

Create a planning-only prompt and description map package for the missing AIDM asset classes identified by the 2026-05-25 asset inventory and gap audit. The package must support later image generation, slicing/chroma-keying, manifest registration, metadata binding, and runtime surface integration without generating images or changing runtime asset selection.

## Scope

- Add a Markdown prompt document for missing scene, spell, scroll, action, status, class/profession, equipment, reward/economy, and weather/environment assets.
- Keep scene prompts as single-image briefs, not sprite sheets.
- Keep small icon/cutout prompts as explicit sprite-sheet briefs with grid, tile, file naming, negative prompt, cutting rule, and expected ids.
- Add a description map with asset id, category, target binding, bilingual names, bilingual descriptions, prompt ref, priority, and planning status.
- Align the spell coverage section to `src/core/rules.js` `SPELLS` and the existing generated spell/status manifest entries.
- Record the downstream integration sequence from generation to validation.

## Out Of Scope

- No image generation.
- No new image, audio, or generated source-sheet files.
- No `assets/generated/manifest.json` or `assets/manifest.json` registration.
- No runtime JS, UI, item, spell, scene, status, or asset-selection changes.
- No player-safe promotion of planned assets.

## Acceptance Criteria

- The prompt document lists concrete scene prompts and sprite-sheet prompts for every requested missing asset category.
- The icon sheets share a single style anchor and include green chroma-key, no-text, no-transparent-background constraints.
- The spell section lists current spell icon coverage and missing icon needs against the current 32 spell definitions.
- The description map includes all planned assets in the prompt package and keeps implementation status at `ready-for-generation`.
- Harness status and diff whitespace checks pass for touched files.
