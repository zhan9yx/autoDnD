# Tasks

## Generation

- [ ] Generate and save P1 scene prompts `scene-042-01` through `scene-042-08`.
- [ ] Generate and save P2 scene prompts `scene-042-09` through `scene-042-16`.
- [ ] Generate and save sprite sheets `icon-sheet-042` through `icon-sheet-049`.

## Tracking

- [x] Add per-prompt generation status document.
- [ ] Update status document after each accepted generated source file.
- [ ] Record any failed or regenerated prompts.

## Guardrails

- [ ] Do not update generated manifests until real file review and slicing are complete.
- [ ] Do not change runtime JS or UI code.
- [ ] Do not mark generated sources as integrated or player-safe.

## Verification

- [ ] Run `git diff --check` for touched text files.
- [ ] Run `npm run harness:status`.

## Downstream After This Change

- [ ] Slice icon sheets with chroma-key cleanup.
- [ ] Preserve or ingest scene files according to the generated asset pipeline.
- [ ] Register generated source sheets and raster assets in manifests after file review.
- [ ] Bind reviewed assets to description map entries and runtime surfaces.
- [ ] Run generated asset tests and focused browser QA after integration.
