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

## Starter Campaign: The Rain Bell Ledger

This five-scene starter campaign is designed for first-session QA and onboarding. It demonstrates scene changes, checks, item use, social play, weather or season pressure, optional combat, and replay without requiring new image assets.

Campaign premise: the party is hired to recover a missing civic ledger before the Rain Bell Festival begins. The ledger proves who redirected flood-relief money, but several factions want it buried.

| Scene | Location Type | Weather Or Season | Player Goal | Exit Or Transition | Asset Reuse Plan |
| --- | --- | --- | --- | --- | --- |
| 1. Rain Bell Archive | Urban archive or civic interior | Spring rain, late afternoon | Find why the ledger vanished and identify the first witness. | Clue points to the glass market or a flooded alley. | Reuse archive, city, mystery, or rain scenes with rain overlay and `mystery` plus `rain` soundscape hints. |
| 2. Glass Market Testimony | Market or civic square | Rain easing into crowded festival prep | Question vendors, buy one useful item, and learn who paid the courier. | Social success opens the canal lock; failure advances a patrol clock. | Reuse market-city scenes and item art already bound to market offers. |
| 3. Flooded Lock Road | Travel, water, or street crossing | Cold rain, rising water | Cross safely, use equipment, and decide whether to rush or help stranded NPCs. | Success reaches the bell tower; partial success adds injury, lost time, or damaged supplies. | Reuse water, pond, dock, rain, or waterfall scenes with travel narration. |
| 4. Bell Tower Parley | Social interior or high civic site | Windy dusk | Negotiate with the courier, reveal a relationship hook, or expose the rival faction. | Dialogue success unlocks the ledger; failed pressure can trigger optional guards. | Reuse court, tower, archive, or mystery scenes; audio shifts from mystery to combat tension only if violence starts. |
| 5. Festival Bell Choice | Finale, plaza, or rooftop | Night rain clearing | Decide whether to publish the ledger, bargain with a faction, or protect a witness. | End scene produces quest handoff, reward, and replay summary. | Reuse market, rooftop, rain, calm-night, or civic scenes with brighter overlay after resolution. |

Minimum browser QA path:

1. Create a room and join one character with a goal, fear, bond, and memo.
2. Start Scene 1 and submit one investigation action.
3. Transition to Scene 2, buy or inspect an item, and submit one social action.
4. Transition to Scene 3, use or reference an inventory item during travel.
5. Transition to Scene 4 or optional combat, then return to exploration or social play.
6. Complete Scene 5, build replay, refresh, and verify the recovered room still shows scene, log, character, backpack, and replay state.

## Scene Variety Plan Before New Images

Before new image generation resumes, scene variety should come from structured reuse:

| Axis | Reuse Method | Example |
| --- | --- | --- |
| Weather | Apply rain, fog, mist, snow, storm, or clear overlays to existing backdrops. | A market image can become a rainy clue scene or a festival crowd scene. |
| Season | Change narration, color temperature, hazards, and NPC behavior without changing the base image. | Winter makes travel slow and fires valuable; summer makes delays and crowds matter. |
| Time | Use day, dusk, night, and dawn copy with ambience shifts. | The same bridge is safe at dawn, tense at foggy dusk, and dangerous at storm night. |
| Mode | Reframe a location as exploration, social, combat, downtime, or finale. | A tavern can host a rumor scene, a duel interruption, or a rest handback. |
| Pressure | Bind clocks and faction movement to the same scene art. | A quiet archive becomes urgent when the patrol clock reaches five. |

Starter coverage targets:

- Urban mystery: at least 3 reusable openings.
- Market or civic social scene: at least 3 negotiation layouts.
- Travel or crossing scene: at least 3 weather variants.
- Optional combat scene: at least 2 escalation routes that can return to exploration.
- Downtime or handback scene: at least 2 endings that summarize next objectives.

## Seasonal Encounter Variants

Use these variants as narration and mechanics guidance while keeping the base scene objective intact.

| Variant | Hazards | NPC Behavior | Audio Direction | Reward Or Clue Flavor |
| --- | --- | --- | --- | --- |
| Spring rain | Slick ground, swollen gutters, washed tracks. | Guards seek shelter; witnesses remember umbrellas, carts, and mud. | Rain with market or mystery layer. | Water-stained notes, fresh footprints, flood ledgers. |
| Summer heat | Fatigue, crowded streets, spoiled supplies. | Merchants linger outside; tempers rise faster. | Insects, sparse market bed, low tension pulse. | Melted wax seals, overheard complaints, water debts. |
| Autumn fog | Short sight lines, wrong turns, muffled bells. | Informants use fog for secret meetings. | Mystery with soft wind or distant bell-like texture. | Half-seen sigils, damp leaves, misdirected patrols. |
| Winter night | Cold exposure, frozen locks, longer darkness. | NPCs trade warmth and shelter for favors. | Calm-night with campfire or low wind-like pad. | Frosted keys, coal tokens, breath marks on glass. |
| Festival storm | Loud cover, panic, sudden movement, high clocks. | Factions act boldly while crowds distract. | Rain plus combat tension or transition sting. | Public confession, broken banner, bell-rope clue. |

No starter variant should require a dedicated new backdrop. Use existing generated art, localized narration, soundscape hints, and overlays first.
