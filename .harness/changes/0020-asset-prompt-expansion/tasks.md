# Tasks

## Prompt Queue

- [x] Add 50 single-scene prompts with refs `scene-050-01` through `scene-050-50`.
- [x] Add 10 8x8 icon/cutout sheet prompts with refs `icon-sheet-050-*` through `icon-sheet-059-*`.
- [x] Record sheet id, cell count, grid, row-major cell order, target source file, target output directory, frame prefix, expected asset ids, prompt, and negative prompt for each new sheet.

## Description Map

- [x] Add 50 scene description rows.
- [x] Add 640 icon/cutout cell description rows.
- [x] Keep every new implementation status at `ready-for-generation`.

## Guardrails

- [x] Avoid active `042-049` generation and slicing ranges.
- [x] Do not generate images, cut sheets, add manifests, or touch runtime code.
- [x] Add planning-only Harness records for this change.

## Verification

- [x] Run `git diff --check` for touched Markdown and Harness files.
- [x] Run `npm run harness:status`.
- [x] Skip node tests because no JavaScript or runtime code changed.

## Downstream After This Change

- [ ] Generation worker claims a subset of `scene-050-*` or `icon-sheet-050-*` through `icon-sheet-059-*`.
- [ ] Generate scene images as full-bleed single images.
- [ ] Generate icon sheets as 8x8 chroma-key source sheets.
- [ ] Slice icon sheets with chroma-key cleanup and verify alpha.
- [ ] Register reviewed generated assets in manifests after files exist.
- [ ] Bind reviewed assets to runtime surfaces and run generated-asset plus browser QA.
