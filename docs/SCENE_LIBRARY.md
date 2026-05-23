# AIDM Scene Library

This document records the generated scene-backdrop direction for AIDM. It is intentionally about raster scene art from ChatGPT Image Generation, not SVG placeholders or code-rendered scenery.

## Current State

- Current generated raster scene count: 80.
- Current target catalog size: 500 macro scene backdrops.
- Source path: `assets/generated/manifest.json`.
- New sheets in 0007:
  - `assets/generated/sheets/aidm-macro-scenes-sheet-003.png`
  - `assets/generated/sheets/aidm-macro-scenes-sheet-004.png`
  - `assets/generated/sheets/aidm-macro-scenes-sheet-005.png`
- All new scene slices are copied into `assets/generated/scenes/` and carry `description`, `sceneSlug`, `soundscapeHints`, `taxonomy`, `mood`, `weather`, `threatLevel`, `narrativeUses`, `stylePresetId`, `license`, and `provenance`.

The built-in image tool does not expose a selectable model parameter in this environment. The asset provenance therefore records the truthful available path: `ChatGPT image generation`.

## Art Direction

AIDM scenes use one shared style preset: `aidm-cinematic-gaslamp-fantasy-v1`.

- Cinematic painterly realism for fantasy tabletop play.
- Wide establishing environments inside each sheet tile.
- Foreground, midground, and background should be readable.
- The lower or central area should leave playable room for characters, objects, and UI overlays.
- Lighting should feel grounded: rain reflections, brass lamps, moonlight, firelight, mist, spray, ash, or snow.
- No text, labels, logos, UI, watermarks, modern vehicles, isolated item cards, or close-up character portraits.

## 500-Scene Taxonomy

The 500-scene catalog should expand through repeatable 4x4 or 2x2 ChatGPT Image Generation sheets. Each category should eventually contain 24-36 finished backdrops, with variants for calm, mystery, danger, night, and travel.

| Category | Examples |
| --- | --- |
| Urban Streets | rain archive street, bellmaker alley, rooftop chase route, flooded lower ward |
| Markets And Civic Spaces | glass market hall, harbor exchange, festival plaza, guild auction floor |
| Taverns And Social Interiors | copper tavern, noble salon, theater lounge, secret club room |
| Archives And Knowledge | forbidden stacks, map room, observatory study, evidence vault |
| Temples And Sacred Ruins | cistern shrine, sunken chapel, oracle pool, storm bell temple |
| Courts And Power Rooms | old courthouse, throne antechamber, war room, secret tribunal |
| Forests And Overgrown Wilds | misty forest path, ancient grove gate, giant root hollow, thorn trail |
| Water And Wetlands | moonlit pond, reed marsh, lotus cistern, underground spring |
| Coasts, Docks, And Ships | storm harbor pier, canal lock, fogbound dock, smuggler cove |
| Mountains, Snow, And High Passes | snow pass, frozen watchtower, glacier gate, high monastery trail |
| Desert And Wasteland | desert ruin, caravan dune road, salt flat camp, buried temple mouth |
| Fire, Lava, And Industrial Heat | lava bridge, forge cathedral, ash road, burning gatehouse |
| Underground And Dungeon | breaker tunnel, catacomb hall, crystal cavern, prison depths |
| Horror And Haunted Sites | fog cemetery, mirror chapel, plague house street, shadowed mausoleum |
| Battlefields And Crisis | siege wall breach, duel bridge, barricaded street, ritual interrupted |
| Calm, Travel, And Transitional Scenes | camp watch, dawn meadow shrine, ferry dawn, roadside waystation |

## Soundscape Coverage

The 500-scene target should stay balanced against the existing soundscape families:

| Soundscape | Target Count | Description Cues |
| --- | ---: | --- |
| `market-city` | 65 | market, city, crowd, vendor, cart, bells, dock, street |
| `mystery` | 65 | secret, clue, archive, sealed, fog, shadow, whisper, ritual |
| `rain` | 55 | rain, downpour, thunder, wet stone, puddle, slick, mist |
| `combat-tension` | 55 | combat, fight, ambush, hostile, blade, wound, guard, danger |
| `forest` | 50 | forest, woods, canopy, leaves, moss, trail, roots |
| `calm-night` | 50 | night, dawn, moon, stars, quiet, rest, watch |
| `pond` | 45 | pond, lake, cistern, marsh, reeds, lotus, frog |
| `campfire` | 40 | campfire, hearth, embers, torch, candle, smoke |
| `waterfall` | 40 | waterfall, cascade, rapids, gorge, spray, rushing water |
| `insects` | 35 | insects, crickets, cicadas, buzz, dusk, grass |

Every generated scene should include at least two `soundscapeHints`, with the primary family first.

## Metadata Contract

Each generated scene asset should include:

- `id`, `name`, `description`, `file`, `sheetId`, `frame`
- `categoryId: "scenes"`, `group: "generated-scenes"`, `assetType: "raster"`
- `type: "raster-scene-backdrop"` for new macro scenes
- `sceneSlug`
- `soundscapeHints`
- `taxonomy`
- `mood`, `timeOfDay`, `weather`, `threatLevel`, `encounterRole`
- `narrativeUses`
- `tags`
- `stylePresetId`
- `provenance.generator`, `provenance.promptId`, `provenance.sourceSheet`, `provenance.sourceSha256`
- `license`

Descriptions should be written as stageable sensory copy, not short labels. AIDM uses these descriptions for search, scene matching, asset detail display, and future narration context.
