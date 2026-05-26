# Scene Backbone 050-01 Through 050-10 Generation Notes

Worker: 0020 scene generation worker A
Date: 2026-05-25
Scope: `scene-050-01` through `scene-050-10`
Source prompt doc: `docs/assets/missing-asset-generation-prompts.md`
Planning reference: `docs/assets/asset-prompt-expansion-plan-2026-05-25.md`
Generator: built-in `image_gen`

## Output Summary

All outputs are single full-bleed scene PNGs at 1536x1024. No manifest, runtime, Harness, global status, 042-range files, icon sheets, or icon slices were edited.

| Prompt ref | Asset id | Semantic key | Saved path | Visual review | Status |
| --- | --- | --- | --- | --- | --- |
| `scene-050-01-rest-lodge` | `aidm-scene-backbone-050-01` | `scene.backbone.rest-lodge.light-rain-outside.evening.rest.v01` | `assets/generated/scenes/aidm-scene-backbone-050-01.png` | Cozy lodge interior, rain visible through windows, hearth/table/bedroll elements present, no readable text or UI. | accepted |
| `scene-050-02-coach-station` | `aidm-scene-backbone-050-02` | `scene.backbone.coach-station.ground-fog.dawn.rendezvous.v01` | `assets/generated/scenes/aidm-scene-backbone-050-02.png` | Mist dawn coach station with lanterns, wagons, wet road, fog depth, no readable wayboard text. | accepted |
| `scene-050-03-inn-courtyard` | `aidm-scene-backbone-050-03` | `scene.backbone.inn-courtyard.clear.morning.social-hub.v01` | `assets/generated/scenes/aidm-scene-backbone-050-03.png` | Summer inn courtyard with balcony rooms, supply wagon, stable gate, social hub activity, no close-up faces. | accepted |
| `scene-050-04-gambling-den` | `aidm-scene-backbone-050-04` | `scene.backbone.gambling-den.indoor-smoke-haze.late-night.social-tension.v01` | `assets/generated/scenes/aidm-scene-backbone-050-04.png` | Smoke-hazed gambling den with green tables, dice/coins ambience, curtained alcoves, guarded doorway, no readable text. | accepted |
| `scene-050-05-dockside-tavern` | `aidm-scene-backbone-050-05` | `scene.backbone.dockside-tavern.heavy-rain.night.rumor-exchange.v01` | `assets/generated/scenes/aidm-scene-backbone-050-05.png` | Dockside tavern doorway view with heavy rain, rope coils, barrel tables, harbor outside, no portrait focus. | accepted |
| `scene-050-06-sunlit-plaza` | `aidm-scene-backbone-050-06` | `scene.backbone.city-plaza.clear.day.public-encounter.v01` | `assets/generated/scenes/aidm-scene-backbone-050-06.png` | Clear daylight city plaza with fountain, civic steps, market awnings, plain banners, no readable signs. | accepted |
| `scene-050-07-general-store` | `aidm-scene-backbone-050-07` | `scene.backbone.general-store.windy-dust-outside.afternoon.shopping.v01` | `assets/generated/scenes/aidm-scene-backbone-050-07.png` | Frontier store aisle with lanterns, rope, blankets, sacks, ration crates, dusty door light, no labels. | accepted |
| `scene-050-08-dungeon-crossroads` | `aidm-scene-backbone-050-08` | `scene.backbone.dungeon-crossroads.underground-damp.torchlit.exploration.v01` | `assets/generated/scenes/aidm-scene-backbone-050-08.png` | Damp torchlit dungeon crossroads with three readable passages, shallow water, broken tile cover, no creatures. | accepted |
| `scene-050-09-forest-camp` | `aidm-scene-backbone-050-09` | `scene.backbone.forest-camp.light-rain.night.camp-watch.v01` | `assets/generated/scenes/aidm-scene-backbone-050-09.png` | Rainy forest camp with tarp, fire ring, dry bedrolls, watch post, no visible characters or text. | accepted |
| `scene-050-10-hidden-grove` | `aidm-scene-backbone-050-10` | `scene.backbone.secret-grove.clear-with-drifting-motes.midnight.mystic-discovery.v01` | `assets/generated/scenes/aidm-scene-backbone-050-10.png` | Moonlit hidden grove with reflecting pool, ancient roots, ferns, drifting motes, no creature focus or UI. | accepted |

## Needs Regeneration

None.

## Validation

- `file assets/generated/scenes/aidm-scene-backbone-050-01.png ... aidm-scene-backbone-050-10.png`: all report `PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced`.
- Saved PNGs were visually inspected from the workspace paths for full-bleed scene format, prompt fit, missing text/UI/watermark, no black bars, no modern objects, and no close-up portrait focus.
