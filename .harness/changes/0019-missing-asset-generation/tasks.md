# Tasks

## Reconciliation

- [x] Reconcile this Harness tracking file against `docs/qa/asset-external-payload-reconciliation-2026-05-26.md` without editing product code, generated assets, manifests, or QA evidence docs.

## Generation

- [x] Generate and save P1 scene prompts `scene-042-01` through `scene-042-08`.
- [x] Generate and save P2 scene prompts `scene-042-09` through `scene-042-16`.
- [x] Generate and save sprite sheets `icon-sheet-042` through `icon-sheet-049`.

## Tracking

- [x] Add per-prompt generation status document.
- [ ] Update status document after each accepted generated source file.
- [ ] Record any failed or regenerated prompts.

## Guardrails

- [x] Do not update generated manifests until real file review and slicing are complete.
- [x] Do not change runtime JS or UI code as part of this 0019 tracking reconciliation.
- [ ] Keep non-scene generated assets out of broad player-safe exposure until owner risk acceptance is recorded.

## Verification

- [x] Run `git diff --check` for touched text files.
- [x] Run `npm run harness:status`.

## Downstream After This Change

- [x] Slice icon sheets with chroma-key cleanup.
- [x] Preserve or ingest scene files according to the generated asset pipeline.
- [x] Register generated source sheets and raster assets in manifests after file review.
- [x] Bind reviewed assets to description map entries and runtime-scoped surfaces.
- [ ] Run fresh visible desktop/mobile browser QA after integration.
- [ ] Deliver or hydrate the external generated PNG payload for clean checkout and deployment.
- [ ] Record owner acceptance for sheet `047` metadata risk and sheet `058` alpha/content risk, or queue targeted regeneration.
