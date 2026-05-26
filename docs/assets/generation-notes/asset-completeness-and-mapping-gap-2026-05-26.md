# Asset Completeness And Mapping Gap Audit

Date: 2026-05-26 Asia/Shanghai.

Scope: count-only completeness audit for `docs/assets/missing-asset-generation-prompts.md`
against the current generated asset tree and `assets/generated/manifest.json`.
No asset binaries, manifests, runtime files, prompt docs, Harness files, source files,
or public files were modified.

## Prompt Baseline

The prompt document plans the following totals:

| Planned set | Expected count |
| --- | ---: |
| Single-scene prompts | 66 |
| Sprite/cutout sheets | 18 |
| Icon/cutout cells | 768 |
| Description map rows | 834 |

## Current File Counts

### Scene Backbones

| Scene range | Expected | Found | Status |
| --- | ---: | ---: | --- |
| `aidm-scene-backbone-042-01` through `aidm-scene-backbone-042-16` | 16 | 16 | count-complete |
| `aidm-scene-backbone-050-01` through `aidm-scene-backbone-050-50` | 50 | 50 | count-complete |
| Total scenes | 66 | 66 | count-complete |

### Source Sheets

| Sheet range | Expected | Found | Status |
| --- | ---: | ---: | --- |
| `042` through `049` | 8 | 8 | count-complete |
| `050` through `059` | 10 | 10 | count-complete |
| Total source sheets | 18 | 18 | count-complete |

### Slices

| Slice range | Expected cells | Found PNGs | Status |
| --- | ---: | ---: | --- |
| `042` through `049` | 128 | 128 | count-complete |
| `050` through `059` | 640 | 640 | count-complete |
| Total slices | 768 | 768 | count-complete |

Notes:

- Sheets `050` and `051` were found under `assets/generated/tokens/` rather than the prompt table's `assets/generated/icons/` target directory, but the 64+64 token PNGs are present.
- Sheet `053` physical slices were found as `assets/generated/items/aidm-armor-outfit-cutout-053-01.png` through `...-64.png`. The prompt and description map expect ids without `cutout`: `aidm-armor-outfit-053-01` through `...-64`. Treat this as a mapping/id mismatch, not a missing binary-slice count.

## Manifest Spot Check

`assets/generated/manifest.json` does not contain any of the representative new ids requested for this audit:

| Asset id | Present in manifest |
| --- | --- |
| `aidm-scene-backbone-050-01` | no |
| `aidm-hostile-token-050-01` | no |
| `aidm-weapon-cutout-052-01` | no |
| `aidm-faction-overlay-059-64` | no |
| `aidm-equipment-tool-047-12` | no |
| `aidm-reward-economy-048-11` | no |

No planned `042..059` scene/slice ids were found registered in `assets/generated/manifest.json` during this count-only audit.

## Description Mapping And Metadata Gap

The binary generation and slicing loop is count-complete:

- Scenes: 66/66 PNGs present.
- Source sheets: 18/18 PNGs present.
- Slices: 768/768 physical PNGs present.

The description mapping and manifest-ready metadata loop is not complete:

- The prompt document's 834 description rows remain planning rows with `implementationStatus` still recorded as `ready-for-generation`.
- Representative new assets are absent from `assets/generated/manifest.json`.
- The `053` prompt/description ids do not match the current physical slice filename prefix.
- Runtime-facing manifest fields such as category registration, player-facing bilingual descriptions, source sheet provenance, semantic keys, and gameplay bindings have not been closed for the new `042..059` assets.

## Conclusion

Binary generation and slicing are complete by current file counts.
Description mapping, id normalization, and manifest metadata are still open and should not be treated as manifest-ready or runtime-integrated.

## Verification

Required command:

```bash
git diff --check -- docs/assets/generation-notes/asset-completeness-and-mapping-gap-2026-05-26.md
```

Result: pass.
