# AIDM User Guide

This guide describes the current browser table. It is written for players and table hosts, so it focuses on what can be used in play today.

## Quick Start

1. Run the app and open `http://localhost:4173`.
2. Create a room with a title, campaign tone, and table language, or reopen an existing `room_...` ID.
3. Share the room URL with other players. The URL includes `?room=<room id>`.
4. Open `Team`, create a character, and join the table.
5. Start the scene after at least one character has joined.
6. Use `Action` for turn-moving declarations and `Chat` for table talk.
7. Use `My character`, `Market`, `State`, `Log`, `Settings`, and `Guide` when you need more detail.

The table is designed to fit the main play loop in one screen. Extra information opens in drawers or the guide modal so the stage, log, and action composer stay close together.

## Rooms

The first screen creates or opens a room.

- `Room title` names the session and appears in the table header.
- `Campaign tone` changes the style used by the local director, scene selection, and narration.
- `Table language` sets English or Chinese for the UI, deterministic narration, system events, market text, and guide copy.
- `Create room` creates a host session and stores the host token in local browser storage.
- `Existing room ID` reopens a room when another player shares a room ID or URL.

If you refresh the page, reopen the same URL to return to the same room. A joined local player should use the same browser profile so the table can keep its local seat token.

## Character Creation

Players join from the `Team` drawer.

- Enter a player name and character name.
- Choose a species and class. The visual cards are the player-friendly choices; they should match the selected rules value.
- Pick an archetype or preset when available.
- Review starting spell cards if the class offers spells.
- Assign attribute points across Body, Agility, Mind, Presence, and Spirit.
- Submit `Join table`.

Attributes use a point budget. The budget indicator shows total spend and remaining points; if the total goes over budget, reduce one or more attributes before joining. The table derives HP, defense, initiative, skills, spell access, and starting equipment from the character build.

## Table Navigation

The topbar keeps secondary surfaces compact.

- `My character` opens your HP/MP, level, XP, equipment slots, known spells, backpack, item detail, use/sell actions, and memo.
- `Market` opens the shop for buying scene-ready supplies.
- `Team` opens roster, character creation, and round details.
- `State` opens encounter details, consequences, rewards, replay, scene state, and media state.
- `Log` opens the full transcript.
- `Settings` opens voice and ambience controls.
- `Guide` opens this guide inside the product.

Drawers close with the close button, the backdrop, or Escape.

## Actions And Chat

Use the action composer at the bottom of the table.

- `Action` is for declarations that should advance the scene, roll dice, affect danger/clue clocks, create rewards, or move the active turn.
- `Chat` is for table talk or in-character speech that should not consume the active turn.
- Roll mode supports normal, advantage, and disadvantage checks.

Only a joined player can submit actions. If the room changes while a player is writing, the server rejects stale actions so the player can retry against the current state.

## Market

Open `Market` after joining the table.

- The wallet shows your current currency.
- Each offer has an item name, description, price, and buy action.
- Bought items are added to your backpack.
- Item definitions, prices, quantity, tradeability, and use effects come from the data catalog, not from image files alone.

The product still needs a final rule decision for whether market actions are free-time inventory management or turn-consuming table actions. Until that is explicit in the UI, treat the market as a compact shop for preparing the next scene.

## Backpack, Equipment, And Use

Open `My character` to manage owned items.

- The backpack lists your inventory.
- Selecting an item opens condition, value, tradeability, usability, and available actions.
- `Use` applies the item's effect when the item is usable.
- `Sell` converts tradeable items back into currency.
- Equipment slots summarize the currently equipped weapon, armor, focus, and tool-like items.
- Item art should decorate data-backed items; the image catalog does not create usable gameplay objects by itself.

Using, selling, buying, and equipping are server-side state changes. Wallet, quantities, learned spells, equipment summaries, and stat deltas should stay consistent after each action.

## Memo

The `Memo` section in `My character` is for private notes such as clues, debts, promises, and plans.

- Save short reminders that help you return to the character later.
- Memo text is stored on your character and appears in your character drawer.
- Use memos for player-facing notes, not for hidden rules, asset provenance, or implementation detail.

## Voice And TTS

Open `Settings` for voice playback.

- `Voice on/off` controls automatic read-aloud for new transcript entries.
- `Read latest` repeats the newest table log entry.
- `Stop` cancels queued speech.
- The voice selector can stay on automatic speaker profiles or choose an installed browser voice.
- Rate and pitch sliders adjust playback without changing the transcript.

Voice playback uses browser speech synthesis when available. AIDM narration, rules output, table system messages, and player characters receive stable speaker profiles where the browser has enough local voices.

## Ambience And Environment Audio

Open `Settings` for adaptive ambience.

- `Ambience on/off` starts or stops generated background music and environmental sound.
- `Stop audio` immediately stops the ambience engine.
- `Master`, `Music`, and `Environment` sliders control the mix and are stored in local browser storage.
- The selected soundscape follows the current scene, danger, encounter state, and recent transcript.

The current implementation uses browser Web Audio synthesis. It does not download music packs or depend on copyrighted third-party audio. Supported families include rain, forest, pond, waterfall, campfire, insects, city/market, mystery, calm night, and combat tension.

## Scene, State, And Replay

The stage uses generated scene art from `assets/generated/manifest.json` and lightweight overlays for rain, mist, embers, motes, and danger pulses.

- The stage keeps location, objective, threat, and clue progress visible.
- The `State` drawer shows player-useful encounter, consequence, reward, scene, and media information.
- `Replay` builds a session summary from transcript chapters, highlights, combat events, rewards, and remembered facts.
- If an asset fails to load, the table should still show room state and controls.

The player table should not expose the full asset catalog or internal asset-management workflow.

## Long-Memory Evaluation

AIDM includes evaluation commands for long campaign memory.

- `npm run eval:memory` runs the default long-memory gate.
- `npm run eval:memory:v1` runs the smaller regression baseline.
- `npm run eval:memory:v2` runs the current 500-event gate.

The main metrics are `recallAt5` and `meanReciprocalRank`. They check whether important facts can be retrieved from long history instead of relying only on the current prompt window. These are delivery quality gates, not player UI concepts.

## Asset Boundary

Generated images are used when they help the current play moment.

- Scene art belongs on the stage and relevant-scene surfaces.
- Market, backpack, reward, and item detail art must be tied to data-backed item definitions.
- Character option art belongs in character creation, party avatars, and player detail.
- Spell art belongs in spell cards and character creation.
- NPC tokens belong in encounter and combatant surfaces.
- Status icons belong in status rows, combatant detail, transcript events, and player detail.

Internal placeholders, provenance, prompt IDs, duplicate-risk notes, and catalog maintenance stay in `docs/ASSET_INVENTORY.md`, `assets/generated/manifest.json`, and tests. They should not appear as player-facing UI.
