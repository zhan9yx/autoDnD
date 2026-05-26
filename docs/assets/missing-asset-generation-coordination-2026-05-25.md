# Missing Asset Generation Coordination 2026-05-25

Date: 2026-05-25 Asia/Shanghai.

This file coordinates the current missing-asset generation wave after review of the latest completed sub-agents. It is a maintenance handoff only. It does not mark any generated source as manifest-registered, sliced, alpha-cleaned, player-safe, or integrated.

## Reviewed Sub-Agent Results

| Worker | Scope | Review result | Remaining follow-up |
| --- | --- | --- | --- |
| Franklin the 2nd | Missing asset prompt package | Accepted as planning-only. `docs/assets/missing-asset-generation-prompts.md` contains 16 single-scene prompts, 8 icon/cutout sheet prompts, and 144 description-map rows. `0018-missing-asset-prompts` remains 13/18 because no images are generated or integrated. | Use the prompt package as the queue source. Do not treat description-map rows as generated or integrated until files are reviewed and bound. |
| Beauvoir | 0017 UI density live screenshot evidence | Accepted. Desktop and mobile screenshots close the Hubble live-screenshot evidence gap. No product code changed. | No immediate blocker. Keep screenshots in `/private/tmp/aidm-0017-ui-density-*` as QA evidence. |
| Kant the 2nd | 0017 rules gameplay browser follow-up | Accepted. Browser evidence shows spell transcript, rule modifier, and state drawer environment/event pressure are visible without leaking seed/debug terms. `0017-rules-gameplay-depth` is 17/18. | Real playtest balance remains open for +0 to +3 action modifiers. |
| Epicurus the 2nd | Mobile log/toast density polish | Accepted. Mobile toast no longer overlaps the action form; summary row height is 34px. `0017-mobile-log-toast-density` is 13/13. | No immediate blocker. Future visual polish can continue from the after screenshot. |

## Current 0019 Generation State

`0019-missing-asset-generation` has started but is not complete.

Accepted generated sources already present in the workspace:

| Prompt ref | Asset id | Path | Review status | Integration status |
| --- | --- | --- | --- | --- |
| `scene-042-01-market-rain-dawn-investigation` | `aidm-scene-backbone-042-01` | `assets/generated/scenes/aidm-scene-backbone-042-01.png` | Accepted visually; 1536x1024; no obvious readable text. | Needs manifest, description binding, runtime selection, browser QA. |
| `scene-042-02-tavern-snow-night-social` | `aidm-scene-backbone-042-02` | `assets/generated/scenes/aidm-scene-backbone-042-02.png` | Accepted visually; 1536x1024; no obvious readable text. | Needs manifest, description binding, runtime selection, browser QA. |
| `scene-042-03-forest-fog-autumn-ambush` | `aidm-scene-backbone-042-03` | `assets/generated/scenes/aidm-scene-backbone-042-03.png` | Accepted visually; 1536x1024; no obvious readable text. | Needs manifest, description binding, runtime selection, browser QA. |

The global status file is `docs/assets/missing-asset-generation-status-2026-05-25.md`. Because multiple image-generation workers will run in parallel, workers must not edit that global status file directly. Each worker should write a per-scope completion note; the main coordinator will merge the notes into the global status file after review.

## Parallel Generation Assignments

Do not duplicate the already generated `scene-042-01` through `scene-042-03`.

| Owner | Assigned prompts | Output paths | Per-worker note |
| --- | --- | --- | --- |
| Franklin the 2nd | `scene-042-04` through `scene-042-08` | `assets/generated/scenes/aidm-scene-backbone-042-04.png` through `assets/generated/scenes/aidm-scene-backbone-042-08.png` | `docs/assets/generation-notes/franklin-scenes-042-04-08.md` |
| Scene worker | `scene-042-09` through `scene-042-16` | `assets/generated/scenes/aidm-scene-backbone-042-09.png` through `assets/generated/scenes/aidm-scene-backbone-042-16.png` | `docs/assets/generation-notes/scene-backbone-042-09-16.md` |
| Icon worker A | `icon-sheet-042-actions`, `icon-sheet-043-spells`, `icon-sheet-044-scrolls`, `icon-sheet-045-status` | `assets/generated/sheets/aidm-action-icons-sheet-042.png`, `aidm-spell-icons-sheet-043.png`, `aidm-scroll-icons-sheet-044.png`, `aidm-status-icons-sheet-045.png` | `docs/assets/generation-notes/icon-sheets-042-045.md` |
| Icon worker B | `icon-sheet-046-class-profession`, `icon-sheet-047-equipment`, `icon-sheet-048-economy`, `icon-sheet-049-weather-overlays` | `assets/generated/sheets/aidm-class-profession-badges-sheet-046.png`, `aidm-equipment-tools-sheet-047.png`, `aidm-reward-economy-sheet-048.png`, `aidm-weather-overlay-icons-sheet-049.png` | `docs/assets/generation-notes/icon-sheets-046-049.md` |

## Shared Guardrails

- Use `docs/assets/missing-asset-generation-prompts.md` as the prompt source of truth.
- Generate source images only. Do not slice icon sheets, remove chroma key, update manifests, or bind assets to runtime surfaces in this wave.
- Do not edit `assets/generated/manifest.json`, `assets/manifest.json`, `src/core/*`, or `public/*`.
- Do not mark generated files as player-safe or integrated.
- Icon sheets must use the shared AIDM icon style anchor and pure green `#00ff00` background in every tile.
- Scene images are single full-bleed 1536x1024 sources, not sprite sheets.
- If an output contains readable text, warped UI, cropped focal content, inconsistent icon grid, non-green sheet background, or style mismatch, save no accepted file for that prompt and mark it as `needs-regeneration` in the per-worker note.

## Required Per-Worker Note Fields

Each worker note must include:

| Field | Requirement |
| --- | --- |
| Prompt refs | List every prompt attempted. |
| Saved files | Absolute or repo-relative paths for accepted files. |
| Rejected outputs | Prompt refs and reason, if any. |
| Visual review | One short verdict per file. |
| Downstream status | Use `generated-source-saved`, `needs-regeneration`, `needs-slicing`, `needs-manifest`, and `needs-integration` only. |
| Verification | `file <generated paths>` and `git diff --check -- <touched docs>` at minimum. |

## Next Consolidation Step

After the four workers return, the main coordinator should:

1. Review generated images visually.
2. Merge per-worker notes into `docs/assets/missing-asset-generation-status-2026-05-25.md`.
3. Update `.harness/changes/0019-missing-asset-generation/tasks.md`, `test-report.md`, and `review.md`.
4. Run whitespace and Harness checks.
5. Only then plan slicing, chroma-key cleanup, manifest registration, description binding, and browser-visible asset integration.
