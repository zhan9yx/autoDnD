# AIDM User Guide

This guide explains the current browser table. It describes what works today in the local product and avoids future launch promises.

## Opening a Room

Use the first screen to create a room or reopen an existing room by ID.

- `Room title` names the session and appears in the live table header.
- `Campaign tone` changes the room tone used by the local director and scene rendering.
- `Table language` sets English or Chinese for UI text, deterministic narration, and system events.
- `Create room` creates a host session and stores the host token in local browser storage.
- `Existing room ID` reopens a room when another player shares a `room_...` ID or URL.

After a room opens, the URL includes `?room=<room id>`. Share that URL with players who should join the same table.

## Creating Characters

Players join from the `Players` panel.

- Enter a player name and character name.
- Choose a species and class.
- Assign attribute points across Body, Agility, Mind, Presence, and Spirit.
- Pick an archetype, then submit `Join table`.

The table derives combat stats such as HP, defense, and initiative from the character build. The point budget indicator warns when the current attribute total exceeds the intended budget.

## Acting And Chatting

The table log separates mechanical actions from casual chat.

- Use `Action` when the declaration should advance the turn, trigger a check, or change state.
- Use `Chat` for table talk or in-character speech that should not consume the active turn.
- Use the roll mode selector for normal, advantage, or disadvantage checks.

Only a joined player can submit actions. If the room version changes while a player is acting, the server rejects the stale action so the player can retry against the current state.

## Voice Playback

Use the `Voice` controls above the table log.

- `Voice on/off` controls automatic read-aloud for new transcript entries.
- `Read latest` repeats the newest table log entry.
- `Stop` cancels queued speech.
- The voice selector can stay on automatic speaker profiles or choose a specific installed browser voice.
- Rate and pitch sliders adjust playback without changing the transcript.

Each author receives a stable voice profile. AIDM narration, rules output, table system messages, and player characters are separated by voice, pitch, and rate where the browser provides enough local voices.

## Combat

Combat state appears in the `Encounter` panel.

- Enemies show HP, defense, and role.
- Tactical intent explains the current enemy plan when available.
- Combat log entries show recent attacks, damage, status effects, and recovery.
- The active turn indicator in the table log header shows whose turn is currently expected.

The rules engine resolves dice, defense checks, damage, healing, status effects, and encounter progress through deterministic code paths.

## Replay

Use `Replay` in the right rail to build a session summary from the transcript, party, combat highlights, and memory facts.

The replay summary is useful after a test run because it shows whether the table produced a coherent battle report and retained the important facts.

## Asset Library

The `Asset Library` panel previews reusable checked-in assets from `assets/manifest.json`.

The current asset set includes scenes, species, classes, weapons, spells, items, NPCs, and enemies. The manifest is tested so every referenced asset file exists and has tags.

For bilingual and voice design details, read `docs/I18N_TTS.md`.

## Evaluation

AIDM includes an evaluation path for long campaign memory.

- `npm run eval:memory` runs the default long-memory gate.
- `npm run eval:memory:v1` runs the smaller regression baseline.
- `npm run eval:memory:v2` runs the current 500-event gate.

The main metrics are `recallAt5` and `meanReciprocalRank`. They check whether relevant remembered facts are retrieved from long history instead of relying only on the current prompt window.
