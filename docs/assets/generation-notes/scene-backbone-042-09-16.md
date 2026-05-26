# Scene Backbone 042-09 to 042-16 Generation Note

Date: 2026-05-25 Asia/Shanghai.

Scope: P2 scene prompts `scene-042-09` through `scene-042-16` only. This note records generated source images only; it does not mark any source as manifest-registered, player-safe, runtime-bound, sliced, or integrated.

## Prompt Refs Attempted

- `scene-042-09-courthouse-clear-day-hearing`
- `scene-042-10-guildhall-evening-victory`
- `scene-042-11-swamp-fog-spring-danger`
- `scene-042-12-battlefield-storm-autumn-aftermath`
- `scene-042-13-sewer-rain-midnight-stealth`
- `scene-042-14-library-rain-night-investigation`
- `scene-042-15-cavern-moon-combat`
- `scene-042-16-village-snow-day-calm`

## Saved Files

| Prompt ref | Saved file | Downstream status |
| --- | --- | --- |
| `scene-042-09-courthouse-clear-day-hearing` | `assets/generated/scenes/aidm-scene-backbone-042-09.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-10-guildhall-evening-victory` | `assets/generated/scenes/aidm-scene-backbone-042-10.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-11-swamp-fog-spring-danger` | `assets/generated/scenes/aidm-scene-backbone-042-11.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-12-battlefield-storm-autumn-aftermath` | `assets/generated/scenes/aidm-scene-backbone-042-12.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-13-sewer-rain-midnight-stealth` | `assets/generated/scenes/aidm-scene-backbone-042-13.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-14-library-rain-night-investigation` | `assets/generated/scenes/aidm-scene-backbone-042-14.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-15-cavern-moon-combat` | `assets/generated/scenes/aidm-scene-backbone-042-15.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |
| `scene-042-16-village-snow-day-calm` | `assets/generated/scenes/aidm-scene-backbone-042-16.png` | `generated-source-saved`, `needs-manifest`, `needs-integration` |

## Rejected Outputs

| Prompt ref | Result | Reason |
| --- | --- | --- |
| `scene-042-14-library-rain-night-investigation` | Not saved | First generated version had visible page/book markings that risked reading as pseudo-text. Regenerated with blank-page constraints and accepted the second version. |

## Visual Review

| Saved file | Verdict |
| --- | --- |
| `assets/generated/scenes/aidm-scene-backbone-042-09.png` | Accepted: old courthouse chamber, clear daytime sunlight, hearing pressure, no obvious text, watermark, UI, black bars, or cropped focal point. |
| `assets/generated/scenes/aidm-scene-backbone-042-10.png` | Accepted: autumn evening guildhall, victory aftermath, no readable job-board text, watermark, UI, black bars, or foreground portrait. |
| `assets/generated/scenes/aidm-scene-backbone-042-11.png` | Accepted: spring fog swamp boardwalk at dawn, split route and disturbed water, no characters, text, watermark, UI, or crop issue. |
| `assets/generated/scenes/aidm-scene-backbone-042-12.png` | Accepted: storm-aftermath battlefield at dusk, broken shields and muddy field, no gore, focused bodies, readable symbols, watermark, UI, or black bars. |
| `assets/generated/scenes/aidm-scene-backbone-042-13.png` | Accepted: midnight rain-fed sewer route, ladder and side passages, no creatures, graffiti, watermark, UI, or crop issue. |
| `assets/generated/scenes/aidm-scene-backbone-042-14.png` | Accepted: rainy night library investigation space with blank table materials, no readable pages/spines, watermark, UI, or portrait focus. |
| `assets/generated/scenes/aidm-scene-backbone-042-15.png` | Accepted: moonlit cavern bridge with tactical lanes and broken cover, no visible combatants, blood focus, text, watermark, UI, or black bars. |
| `assets/generated/scenes/aidm-scene-backbone-042-16.png` | Accepted: snowy daytime village square, calm safe hub, blank/no readable signs, no watermark, UI, black bars, or close-up figures. |

## Verification

- `file assets/generated/scenes/aidm-scene-backbone-042-09.png ... assets/generated/scenes/aidm-scene-backbone-042-16.png`: passed; all eight files are PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced.
- `git diff --check -- docs/assets/generation-notes/scene-backbone-042-09-16.md`: passed.
