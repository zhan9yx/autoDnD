# AIDM User Guide

This guide explains the current browser table. It describes what works today in the local product and avoids future launch promises.

## Opening a Room

Use the first screen to create a room or reopen an existing room by ID.

- `Room title` names the session and appears in the live table header.
- `Campaign tone` changes the room tone used by the local director and scene rendering.
- `Table language` sets English or Chinese for UI text, deterministic narration, and system events.
- `Create room` creates a host session and stores the host token in local browser storage.
- `Existing room ID` reopens a room when another player shares a `room_...` ID or URL.

After a room opens, the URL includes `?room=<room id>`. Share that URL with players who should join the same table. The room screen is designed as a one-viewport table: the current scene, state strip, latest log, and action composer stay visible while extra information opens from drawer buttons.

## Creating Characters

Players join from the `Party` drawer.

- Enter a player name and character name.
- Choose a species and class.
- Assign attribute points across Body, Agility, Mind, Presence, and Spirit.
- Pick an archetype, then submit `Join table`.

The table derives combat stats such as HP, defense, and initiative from the character build. The point budget indicator warns when the current attribute total exceeds the intended budget. Close the drawer to return to the stage and action composer.

## Table Navigation

The topbar exposes the main secondary panels without requiring page scrolling.

- `Party` opens roster, character creation, and current round details.
- `State` opens encounter details, rewards, and replay without exposing internal director or asset-management data.
- `Full log` opens the complete transcript. The main table log only keeps the latest entries visible for current play.
- `Guide` opens the product guide.

Each drawer can be closed with its close button, the backdrop, or Escape.

## Acting And Chatting

The table log separates mechanical actions from casual chat.

- Use `Action` when the declaration should advance the turn, trigger a check, or change state.
- Use `Chat` for table talk or in-character speech that should not consume the active turn.
- Use the roll mode selector for normal, advantage, or disadvantage checks.

Only a joined player can submit actions. If the room version changes while a player is acting, the server rejects the stale action so the player can retry against the current state.

## Voice Playback

Use the `Voice` controls above the table log. On small screens, advanced voice settings are compacted so the action composer stays reachable.

- `Voice on/off` controls automatic read-aloud for new transcript entries.
- `Read latest` repeats the newest table log entry.
- `Stop` cancels queued speech.
- The voice selector can stay on automatic speaker profiles or choose a specific installed browser voice.
- Rate and pitch sliders adjust playback without changing the transcript.

Each author receives a stable voice profile. AIDM narration, rules output, table system messages, and player characters are separated by voice, pitch, and rate where the browser provides enough local voices.

## Ambience And Background Music

Use the `Adaptive ambience` controls above the table log. On small screens, advanced mix controls are compacted so the table remains one-viewport.

- `Ambience on/off` starts or stops generated background music and environmental sound.
- `Stop audio` immediately stops the ambience engine.
- `Master`, `Music`, and `Environment` sliders control the mix and are stored in local browser storage.
- The table auto-selects soundscape presets from the current scene, threat level, director beat, encounter state, and recent transcript.

The current implementation uses browser Web Audio synthesis for local, zero-cost ambience. It does not download music packs or depend on copyrighted third-party audio. Supported soundscape families include rain, forest, pond, waterfall, campfire, insects, city/market, mystery, calm night, and combat tension.

## Scene Stage

The main stage is image-driven. It uses generated raster scene art from `assets/generated/manifest.json`, with lightweight canvas overlays only for rain, mist, embers, motes, and danger pulses.

- The server selects the active visual backdrop from the current scene, soundscape, combat state, and recent table events.
- The stage keeps the location, objective, threat clock, and clue clock readable over the artwork.
- If generated assets fail to load, the table still shows the room state and controls.

## Combat

Combat state appears in the `Encounter` section of the `State` drawer. The main table state strip also shows the current encounter state.

- Enemies show HP, defense, and role.
- Tactical intent explains the current enemy plan when available.
- Combat log entries show recent attacks, damage, status effects, and recovery.
- The active turn indicator in the table log header shows whose turn is currently expected.

The rules engine resolves dice, defense checks, damage, healing, status effects, and encounter progress through deterministic code paths.

## Replay

Use `Replay` in the `State` drawer to build a session summary from the transcript, party, combat highlights, and memory facts.

The replay summary is useful after a test run because it shows whether the table produced a coherent battle report and retained the important facts.

## Scene Visuals And Rewards

The player table does not expose the full asset catalog. The catalog stays managed by manifests and tests, while the table only presents assets that matter to the current story moment.

- Scene art changes automatically when the story moves to a new environment or danger level.
- Reward art appears in the transcript and reward toast when a successful action discovers loot, a clue item, or equipment.
- The `State` drawer keeps a short reward list so players can review what the party found.

The current asset set includes generated scenes, reward items, equipment variants, species, classes, weapons, spells, NPCs, and enemies. The manifests are tested so player-safe assets have names, descriptions, provenance, and file references.

For bilingual and voice design details, read `docs/I18N_TTS.md`.

## Evaluation

AIDM includes an evaluation path for long campaign memory.

- `npm run eval:memory` runs the default long-memory gate.
- `npm run eval:memory:v1` runs the smaller regression baseline.
- `npm run eval:memory:v2` runs the current 500-event gate.

The main metrics are `recallAt5` and `meanReciprocalRank`. They check whether relevant remembered facts are retrieved from long history instead of relying only on the current prompt window.
