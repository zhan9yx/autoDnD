# 0019 Missing Asset Generation

## Requirement

Generate source images from the approved missing-asset prompt package, save accepted outputs into the workspace, and track per-prompt status without registering manifests or changing runtime bindings.

## Scope

- Use the prompt queue from `docs/assets/missing-asset-generation-prompts.md`.
- Generate source images sequentially with image generation.
- Save accepted scene sources under `assets/generated/scenes/`.
- Save accepted sprite-sheet sources under `assets/generated/sheets/`.
- Track status in `docs/assets/missing-asset-generation-status-2026-05-25.md`.
- Keep generated files unregistered until slicing, manifest metadata, and runtime ownership are reviewed.

## Out Of Scope

- No cutting, chroma-key removal, or alpha cleanup in this change unless separately requested.
- No updates to `assets/generated/manifest.json` or `assets/manifest.json`.
- No runtime JS, UI, item, spell, status, scene selection, or localization changes.
- No player-safe promotion.

## Acceptance Criteria

- Each generated source image is visually checked before being marked as saved.
- Status rows distinguish generated source files from downstream slicing, manifest, and integration work.
- Harness status and whitespace checks pass for touched text files.
