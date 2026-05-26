# Scene Backbone 050-21 through 050-30 Generation Notes

Worker: 0020 scene generation worker C
Date: 2026-05-25
Source prompts: `docs/assets/missing-asset-generation-prompts.md`
Plan reference: `docs/assets/asset-prompt-expansion-plan-2026-05-25.md`

## Scope

Generated single full-bleed scene PNGs for `scene-050-21` through `scene-050-30`.
No manifest registration, runtime integration, global status updates, Harness files, UI files, icon sheets, slices, or `042-*` assets were edited.

## Output Summary

| Prompt ref | Asset id | Semantic key | Output path | Status | Visual QA notes |
| --- | --- | --- | --- | --- | --- |
| `scene-050-21-ancient-altar` | `aidm-scene-backbone-050-21` | `scene.backbone.ancient-altar.unnatural-stillness.eclipse-dusk.ritual-decision.v01` | `assets/generated/scenes/aidm-scene-backbone-050-21.png` | accepted | Eclipse dusk altar scene, autumn exterior, symmetric ritual staging, no readable text, no blood focus, no UI/watermark/black border. |
| `scene-050-22-old-graveyard` | `aidm-scene-backbone-050-22` | `scene.backbone.graveyard.fog.night.investigation.v01` | `assets/generated/scenes/aidm-scene-backbone-050-22.png` | accepted | Foggy night graveyard with crooked stones, gate, bare trees, lantern path, no readable inscriptions, no visible undead, no UI/watermark/black border. |
| `scene-050-23-city-gate` | `aidm-scene-backbone-050-23` | `scene.backbone.city-gate.clear.morning.checkpoint.v01` | `assets/generated/scenes/aidm-scene-backbone-050-23.png` | accepted | Clear summer morning city gate with queue lanes, raised portcullis, guardhouse, carts, no readable text, no close-up guards, no UI/watermark/black border. |
| `scene-050-24-interrogation-room` | `aidm-scene-backbone-050-24` | `scene.backbone.interrogation-room.indoor-cold.night.questioning.v01` | `assets/generated/scenes/aidm-scene-backbone-050-24.png` | accepted | Sparse cold stone interrogation room with lamp, empty chairs, barred window, blank table cloth, no readable papers, no characters, no UI/watermark/black border. |
| `scene-050-25-noble-manor` | `aidm-scene-backbone-050-25` | `scene.backbone.noble-manor.clear-chill.evening.intrigue.v01` | `assets/generated/scenes/aidm-scene-backbone-050-25.png` | accepted | Autumn evening manor exterior with garden approach, lit windows, iron gate, blank crest shields, no readable text, no modern objects, no UI/watermark/black border. |
| `scene-050-26-magic-academy` | `aidm-scene-backbone-050-26` | `scene.backbone.magic-academy.rain.day.academic-mystery.v01` | `assets/generated/scenes/aidm-scene-backbone-050-26.png` | accepted | Rainy academy courtyard with towers, covered walkways, floating spell lamps, puddled stone, no readable signs or runic letters, no student close-up, no UI/watermark/black border. |
| `scene-050-27-grand-library` | `aidm-scene-backbone-050-27` | `scene.backbone.grand-library.clear-light.day.research.v01` | `assets/generated/scenes/aidm-scene-backbone-050-27.png` | accepted | Winter daylight grand library reading hall with high shelves, ladders, balcony route, blank reading pages, no readable text, no portrait focus, no UI/watermark/black border. |
| `scene-050-28-manor-courtyard` | `aidm-scene-backbone-050-28` | `scene.backbone.walled-courtyard.humid-night-air.night.secret-meeting.v01` | `assets/generated/scenes/aidm-scene-backbone-050-28.png` | accepted | Humid summer night walled courtyard with lanterns, rain chain, stepping stones, quiet gate, upper balcony, no text, no modern fixtures, no UI/watermark/black border. |
| `scene-050-29-sewer-junction` | `aidm-scene-backbone-050-29` | `scene.backbone.sewer-junction.underground-mist.midnight.stealth-route.v01` | `assets/generated/scenes/aidm-scene-backbone-050-29.png` | accepted | Underground sewer junction with arched tunnels, ladders, side channels, mist over water, route clarity, no graffiti text, no monsters, no UI/watermark/black border. |
| `scene-050-30-mine-gallery` | `aidm-scene-backbone-050-30` | `scene.backbone.mine-gallery.dusty-air.torchlit.exploration-hazard.v01` | `assets/generated/scenes/aidm-scene-backbone-050-30.png` | accepted | Torchlit timbered mine gallery with rails, ore piles, strained support beams, side shaft, clear path, no warning text, no miners, no UI/watermark/black border. |

## Needs Regeneration

None.

## Validation

- `file assets/generated/scenes/aidm-scene-backbone-050-{21..30}.png` confirmed each output is PNG image data, 1536 x 1024, 8-bit/color RGB, non-interlaced.
- Manual visual review confirmed single full-bleed scenes with no obvious text, watermark, UI, black border, modern objects, close-up portraits, or cropped focal subjects.
- `git diff --check -- docs/assets/generation-notes/scene-backbone-050-21-30.md` passed.
