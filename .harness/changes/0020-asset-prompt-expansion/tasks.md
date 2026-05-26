# Tasks

## Reconciliation

- [x] Reconcile downstream generation and registration evidence against `docs/qa/asset-external-payload-reconciliation-2026-05-26.md` without editing product code, generated assets, manifests, or QA evidence docs.

## Prompt Queue

- [x] Add 50 single-scene prompts with refs `scene-050-01` through `scene-050-50`.
- [x] Add 10 8x8 icon/cutout sheet prompts with refs `icon-sheet-050-*` through `icon-sheet-059-*`.
- [x] Record sheet id, cell count, grid, row-major cell order, target source file, target output directory, frame prefix, expected asset ids, prompt, and negative prompt for each new sheet.

## Description Map

- [x] Add 50 scene description rows.
- [x] Add 640 icon/cutout cell description rows.
- [x] Keep the original planning package at `ready-for-generation` before downstream generation.
- [x] Reconcile the downstream `050..059` generated rows as present in description-map and manifest evidence.

## Guardrails

- [x] Avoid active `042-049` generation and slicing ranges.
- [x] Keep the original planning-only change separate from later generation, slicing, and manifest registration work.
- [x] Add planning-only Harness records for this change.
- [x] Preserve the non-Git generated PNG payload boundary.

## Verification

- [x] Run `git diff --check` for touched Markdown and Harness files.
- [x] Run `npm run harness:status`.
- [x] Skip node tests because no JavaScript or runtime code changed.

## Downstream After This Change

- [x] Generation worker claims a subset of `scene-050-*` or `icon-sheet-050-*` through `icon-sheet-059-*`.
- [x] Generate scene images as full-bleed single images.
- [x] Generate icon sheets as 8x8 chroma-key source sheets.
- [x] Slice icon sheets with chroma-key cleanup and verify alpha.
- [x] Register reviewed generated assets in manifests after files exist.
- [x] Bind reviewed scene/runtime-scoped assets to runtime surfaces and keep broad icon/token/cutout pools internal.
- [ ] Run fresh focused desktop/mobile browser QA for `050..059` surfaces.
- [ ] Deliver or hydrate the external generated PNG payload for clean checkout and deployment.
- [ ] Record owner acceptance for residual sheet `058` alpha/content risk, or queue targeted regeneration.
