# Asset 0020 Count Gap Audit

Date: 2026-05-25 Asia/Shanghai.

Scope: read-only count and gap audit for the 0020 wave. No assets, source sheets,
manifest files, runtime files, public UI files, source files, or tests were edited.
Only this audit note was written.

## Summary

- Scene backbone `050-01` through `050-50`: expected 50 PNGs, found 50 PNGs,
  with no missing sequence ids.
- Source sheets `050` through `059`: expected 10 PNGs, found 10 PNGs.
- Slices for sheets `050` through `059`: expected 640 PNGs, found 640 PNGs,
  with no missing sequence ids in the expected `01` through `64` ranges.
- Count-complete does not mean QA-complete. Several ranges still need visual,
  alpha, regeneration, manifest, or runtime follow-up.

## Scene Counts

| Scene group | Expected | Actual | Missing ids | QA status from existing notes |
| --- | ---: | ---: | --- | --- |
| `050-01..10` | 10 | 10 | none | Accepted in `scene-backbone-050-01-10.md`. |
| `050-11..20` | 10 | 10 | none | Accepted in `scene-backbone-050-11-20.md`; still not manifest-registered or runtime-integrated. |
| `050-21..30` | 10 | 10 | none | Accepted in `scene-backbone-050-21-30.md`; still not manifest-registered or runtime-integrated. |
| `050-31..40` | 10 | 10 | none | Pending visual pass. `asset-qa-047-048-050.md` found full counts but no matching generation-note visual record. |
| `050-41..50` | 10 | 10 | none | `050-41..48` accepted in `scene-backbone-050-41-50.md`; `050-49..50` remain not accepted pending visual QA after the backfilled regeneration/readability note. |

## Source Sheets And Slices

| Sheet | Source sheet expected/actual | Slice prefix | Slice dir | Slice expected | Slice actual | Missing ids | Current note status |
| --- | ---: | --- | --- | ---: | ---: | --- | --- |
| `050` | 1 / 1 | `aidm-hostile-token-050-` | `assets/generated/tokens/` | 64 | 64 | none | Sliced and validated; `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `051` | 1 / 1 | `aidm-npc-token-051-` | `assets/generated/tokens/` | 64 | 64 | none | Count, metadata, transparency, and coarse sample checks passed; high-fidelity visual pass still pending; `needs-manifest`, `needs-integration`. |
| `052` | 1 / 1 | `aidm-weapon-cutout-052-` | `assets/generated/items/` | 64 | 64 | none | Sliced and metadata-validated; `source-size-risk`, `grid-boundary-risk`, `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `053` | 1 / 1 | `aidm-armor-outfit-cutout-053-` | `assets/generated/items/` | 64 | 64 | none | Sliced and metadata-validated; `source-size-risk`, `grid-boundary-risk`, `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `054` | 1 / 1 | `aidm-consumable-provision-054-` | `assets/generated/items/` | 64 | 64 | none | Sliced and metadata-validated; `source-size-risk`, `grid-boundary-risk`, `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `055` | 1 / 1 | `aidm-tool-clue-055-` | `assets/generated/items/` | 64 | 64 | none | Sliced and validated; `non-4096-source`, `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `056` | 1 / 1 | `aidm-treasure-material-056-` | `assets/generated/items/` | 64 | 64 | none | Sliced and validated; `source-size-risk`, `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `057` | 1 / 1 | `aidm-spell-scroll-rune-057-` | `assets/generated/spells/` | 64 | 64 | none | Files are present, but no dedicated slicing or QA note was found. Existing `icon-sheets-056-057.md` still records source-sheet-only status as `needs-slicing`. Treat as undocumented and still needing count, metadata, alpha, and visual QA before acceptance. |
| `058` | 1 / 1 | `aidm-status-hazard-058-` | `assets/generated/icons/` | 64 | 64 | none | Sliced and validated; `needs-alpha-review`, `needs-manifest`, `needs-integration`. |
| `059` | 1 / 1 | `aidm-faction-overlay-059-` | `assets/generated/icons/` | 64 | 64 | none | Sliced and validated by addendum; `needs-manifest`, `needs-integration`. |

## Open Gaps

No sheet `050..059` slice range is count-incomplete by current file tree:
all expected `01` through `64` PNGs exist for every listed prefix.

Items not yet QA-complete or acceptance-complete:

- `047` remains `needs-regeneration`: count is complete at source sheet 1/1 and
  slices 16/16, but `asset-qa-047-048-050.md` records prior source-grid overlap,
  lower-edge fragments, and clipped row-4 items. No later note in this pass
  cleared that status.
- `048` remains `needs-regeneration`: count is complete at source sheet 1/1 and
  slices 16/16, but `asset-qa-047-048-050.md` records prior source-grid overlap,
  lower-edge fragments, and clipped row-4 items. No later note in this pass
  cleared that status.
- `050-31..40` are present and readable by prior sampled checks, but remain
  pending visual pass because no matching generation-note visual record was
  found.
- `050-49..50` are present after the backfilled regeneration/readability note,
  but visual details are still pending QA. The earlier `needs-regeneration`
  finding should not be considered accepted or fully closed until a prompt
  compliance and emblem/mark visual pass is recorded.
- `051` has only coarse visual sampling in the addendum; high-fidelity manual
  visual review remains pending.
- `052`, `053`, `054`, `055`, `056`, and `058` retain `needs-alpha-review`
  style follow-up from their slicing notes because chroma-key cleanup may have
  removed intentional green detail.
- `057` has actual slice files on disk, but lacks a dedicated slicing, metadata,
  alpha, and visual QA note. Existing source note still says `needs-slicing`.
- `050..059` generated outputs remain outside manifest and runtime integration
  unless a later manifest/runtime note is added elsewhere.

## Recount Evidence

Current file-tree recount results:

```text
scene|050-scenes|50|50|missing=none; extra=none
sheet|050|1|1|none
sheet|051|1|1|none
sheet|052|1|1|none
sheet|053|1|1|none
sheet|054|1|1|none
sheet|055|1|1|none
sheet|056|1|1|none
sheet|057|1|1|none
sheet|058|1|1|none
sheet|059|1|1|none
slice|050|64|64|missing=none; extra=none
slice|051|64|64|missing=none; extra=none
slice|052|64|64|missing=none; extra=none
slice|053|64|64|missing=none; extra=none
slice|054|64|64|missing=none; extra=none
slice|055|64|64|missing=none; extra=none
slice|056|64|64|missing=none; extra=none
slice|057|64|64|missing=none; extra=none
slice|058|64|64|missing=none; extra=none
slice|059|64|64|missing=none; extra=none
```

Scene group recount results:

```text
050-01..10|10|10|missing=none
050-11..20|10|10|missing=none
050-21..30|10|10|missing=none
050-31..40|10|10|missing=none
050-41..50|10|10|missing=none
```

## Final Correction Addendum

Later final QA notes supersede the stale 047/048 and 050-49..50 open-gap
language above:

- `047` R4 is `accept-with-metadata-risk` in `asset-qa-047-r4.md`.
- `048` R4 is `accept` in `asset-qa-048-r4.md`.
- `050-49` and `050-50` R3 visual QA are `accept` in
  `asset-visual-qa-050-49-50-r3.md`.
- `058` alpha QA is `accept-with-risk` in `asset-alpha-qa-058.md`.
- `050..059` slices remain count-closed at 640/640.

This closes the image generation and slicing quantity loop for the current
round. Remaining work is later manifest/runtime integration and related product
wiring, not additional image generation or slicing.
