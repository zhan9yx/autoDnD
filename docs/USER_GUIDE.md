# AIDM User Guide

This guide describes the current browser table. It is written for players and table hosts, so it focuses on what can be used in play today.

AIDM is an original, generic fantasy TRPG prototype for local play and product QA. It is not an official DND setting, rules service, or public-ready hosted campaign product.

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
- Room access can be open, password protected, or host approval when those controls are visible in the gateway.

If you refresh the page, reopen the same URL to return to the same room. A joined local player should use the same browser profile so the table can keep its local seat token.

## Local Accounts And Protected Rooms

The current account system is a local prototype for development and product QA. It helps test owned rooms and protected-room flows, but it is not a production identity provider.

- Register or log in before creating rooms that should be tied to the same local account.
- Refresh should keep the local account signed in when the browser still has the saved session.
- Open rooms let players join directly from the visible room URL.
- Password rooms require the correct room password before the player becomes seated.
- Host-approval rooms place new players in a pending state until the host approves them.
- Pending players should not be able to submit player-only actions or inspect player-only drawers before approval.
- Hosts can approve or reject pending players from the access queue when it is visible.

If a protected-room join fails, correct the password or wait for host approval from the same browser tab. Do not create a second room just to bypass a protected-room error.

## Character Creation

Players join from the `Team` drawer.

- Enter a player name and character name.
- Choose a species and class. The visual cards are the player-friendly choices; they should match the selected rules value.
- Pick an archetype or preset when available.
- Review starting spell cards if the class offers spells.
- Assign attribute points across Body, Agility, Mind, Presence, and Spirit.
- Submit `Join table`.

Attributes use a point budget. The budget indicator shows total spend and remaining points; if the total goes over budget, reduce one or more attributes before joining. The table derives HP, defense, initiative, skills, spell access, and starting equipment from the character build.

### Class Depth, Spells, And Warrior Growth

Character choices now give the AI DM more structured hints during play.

- Spell cards are grouped by role, such as damage, protection, ritual, control, movement, scouting, and healing. Use the role as a quick clue for when the spell is useful, not as a strict limit on creative use.
- A spell action works best when the player names the target, the intended effect, and the risk they accept if the roll goes badly.
- Warrior specializations expose practical levers such as stance, guard, weapon mastery, rally support, or aggressive pressure. These cues help the AI DM describe martial progress without turning every warrior turn into a plain attack.
- Level and specialization notes are player-facing guidance. They should explain what changed in play, while exact formulas stay in the rules engine and combat log.

### Character Hook Starter

A strong first character needs more than a class label. Before or immediately after joining, write short answers for these hooks:

| Hook | Player-facing purpose | Good first answer |
| --- | --- | --- |
| Goal | Gives the player a reason to act. | `Expose the false heir before the festival bell rings.` |
| Fear | Gives the AI DM a non-lethal pressure point. | `Being left alone in sealed ruins.` |
| Bond | Gives the party a reason to cooperate. | `The cleric hid me after the old bridge fire.` |
| Tension | Gives scenes social energy without breaking the party. | `I distrust nobles, but the mage needs court access.` |
| Secret | Gives the host a reveal to pace later. | `My family seal matches the villain's ledger mark.` |
| Safety line | Keeps play within agreed boundaries. | `Fade out body horror.` |

The current product can store short hook notes in the character memo. Future character setup should promote these hooks into first-class fields, but the play procedure works now if players keep the memo concise.

### Party Relationship Patterns

Use one of these patterns when players do not know how their characters met:

- Rescue: one character saved another from an earlier danger.
- Debt: two characters owe the same patron, guild, or neighborhood.
- Rivalry: two characters compete, but both want the current mystery solved.
- Witness: the party saw the same impossible event and cannot ignore it.
- Escort: one character is protecting another through hostile ground.

Relationships should create playable choices, not private homework. A good hook can be used in a sentence during the first scene.

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

## Step-By-Step Player Manual

Use this checklist when teaching a new player.

1. Open the room URL from the host.
2. Confirm the room title and language before joining.
3. Open `Team`, enter player and character names, choose species, class, archetype, and attributes, then select `Join table`.
4. Open `My character`, review HP, defense, spells, backpack, and memo.
5. Add one short memo with your goal, fear, bond, or safety line.
6. Watch the active actor cue and scene objective before typing.
7. Use `Chat` for table talk, plans, and in-character speech that should not advance the scene.
8. Use `Action` for declarations that should change the fiction, roll dice, spend time, move scenes, affect clocks, or create rewards.
9. Open `Market` when preparing, buy one affordable item, then confirm it appears in `My character`.
10. Select an item in the backpack before using, equipping, or selling it.
11. Open `State` when you need clocks, encounter status, rewards, scene details, media status, or replay.
12. Open `Log` when you need the full transcript.
13. Open `Settings` to enable voice or ambience after a user gesture.
14. If the table reloads, check that room, character, backpack, and current scene are still correct before acting.

Common first actions:

- `Look for a safe exit before the patrol reaches the bridge.`
- `Ask the archivist what changed after the winter flood.`
- `Use my lantern to inspect the sealed door without touching it.`
- `Tell the party I can distract the guard if someone watches the alley.`

Action quality rule: write what your character does and what they hope to learn or change. The AI DM can handle uncertainty better when intent is explicit.

### AI DM Randomness And Action Prompts

The AI DM uses deterministic table context plus bounded random prompts. The goal is variety that can be reviewed, not arbitrary surprises.

- Similar room state and action text should produce stable guidance. A different scene, seed, weather state, or player intent can produce a different complication.
- Random events should stay tied to visible clocks, danger, clues, NPC intent, weather, or the player's declared risk.
- Player-facing action prompts are suggestions. They can point toward investigate, influence, move, prepare, risk, cast, defend, or support actions, but players can ignore them.
- When a prompt mentions a skill or approach, treat it as a useful action shape. The final declaration should still say what the character does in the fiction.
- If a result feels disconnected from the scene, report the room state, action text, weather/season, and latest log entry so the table can reproduce the issue.

## Turn Cues And Character Switching

The table distinguishes local identity from room membership.

- The active actor cue says whether you are expected to act now.
- The roster and character drawer identify the character currently bound to this browser profile.
- If another player is active, you can still use `Chat` unless the host asks for quiet initiative.
- If the room supports free-form play, the cue should make that clear and should not imply strict round order.
- If a player owns more than one character in a future version, the selected actor must be visible before submission.

Current recovery rule: if the browser cannot prove a local character binding, the setup panel appears so the player can join or recover from the correct room URL. Do not submit actions from an unknown local seat.

## Market

Open `Market` after joining the table.

- The wallet shows your current currency.
- Each offer has an item name, description, condition, rarity, price, stock, and buy action.
- Bought items are added to your backpack.
- Prices are derived from catalog value and condition. Worn items are cheaper than fine or pristine items; rare goods usually start from a higher base value.
- Item definitions, prices, quantity, tradeability, and use effects come from the data catalog, not from image files alone.
- The current market includes consumables, trade goods, adventuring tools, equippable armor or shields, accessories, weapons, and spell scrolls for every defined player spell.

Market buy and sell actions are currently treated as free-time inventory management in the local runtime. They should update wallet, stock, backpack, and log evidence without moving the active turn. If a table wants shopping to consume scene time, the host should say that explicitly before play.

## Backpack, Equipment, And Use

Open `My character` to manage owned items.

- The backpack lists your inventory.
- Selecting an item opens condition, rarity, base value, current value, sell value, tradeability, usability, and available actions.
- `Use` applies the item's effect when the item is usable.
- `Sell` converts tradeable items back into currency.
- Spell scrolls teach their linked spell and are consumed on success. A scroll for a spell the character already knows is rejected instead of being wasted.
- Item details expose why an action is unavailable, such as non-tradeable quest notes, non-usable tools, or items that cannot be equipped.
- Equipment slots summarize the currently equipped weapon, armor, focus, and tool-like items.
- Item art should decorate data-backed items; the image catalog does not create usable gameplay objects by itself.

Using, selling, buying, and equipping are server-side state changes. Wallet, quantities, learned spells, equipment summaries, and stat deltas should stay consistent after each action.

Suggested first inventory drill:

1. Buy one low-cost supply from `Market`.
2. Open `My character`.
3. Select the new item and read its allowed actions.
4. Use or equip it only if the detail panel says the action is valid.
5. Sell a tradeable item only after checking wallet and quantity.
6. Refresh the room and confirm the backpack still matches the last successful action.

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

Browser voice availability varies by device. The product should never promise voices that are not installed locally. When only one voice is available, AIDM still uses profile differences such as rate and pitch while the transcript remains readable without sound.

## Ambience And Environment Audio

Open `Settings` for adaptive ambience.

- `Ambience on/off` starts or stops generated background music and environmental sound.
- `Stop audio` immediately stops the ambience engine.
- `Master`, `Music`, and `Environment` sliders control the mix and are stored in local browser storage.
- The selected soundscape follows the current scene, danger, encounter state, and recent transcript.

The current implementation uses browser Web Audio synthesis. It does not download music packs or depend on copyrighted third-party audio. Supported families include rain, forest, pond, waterfall, campfire, insects, city/market, mystery, calm night, and combat tension.

## Weather, Seasons, And Audio Cues

Weather and season are player-facing story state. They should line up across scene text, state drawer, ambience label, and stage overlays.

| Cue | Player Meaning | Expected Audio Or Visual Hint |
| --- | --- | --- |
| Rain | Tracks wash out, streets get slick, voices are muffled. | Rain bed, wet reflections, cooler stage tint. |
| Fog | Sight lines shrink and ambush risk rises. | Mystery bed, mist overlay, lower contrast. |
| Winter | Travel slows, warmth matters, night feels longer. | Calm night or wind-like bed, pale overlay. |
| Summer heat | Delays and armor can become costly. | Sparse ambience, insects, warmer tint. |
| Storm | Time pressure and loud cover both increase. | Rain plus danger layer or transition sting. |
| Market day | Social options and crowds increase. | Market-city ambience, crowd-like pulse. |

If the fiction says winter fog but the state drawer says clear summer, report it as a continuity bug.

Environment changes can also add AI DM pressure. Storms may hide movement but raise travel danger, winter can make delay costly, fog can reward scouting, and market crowds can shift social risk. These pressures should be understandable from the visible state and log, not hidden rules text.

## Scene, State, And Replay

The stage uses generated scene art from `assets/generated/manifest.json` and lightweight overlays for rain, mist, embers, motes, and danger pulses.

- The stage keeps location, objective, threat, and clue progress visible.
- The `State` drawer shows player-useful encounter, consequence, reward, scene, and media information.
- `Replay` builds a session summary from transcript chapters, highlights, combat events, rewards, and remembered facts.
- If an asset fails to load, the table should still show room state and controls.

The player table should not expose the full asset catalog or internal asset-management workflow.

## Host Guide

The host's job is to keep the table moving, not to override every AI DM result.

Before play:

1. Choose a campaign tone that matches the table's tolerance for danger and humor.
2. Ask each player for one goal, one fear, one relationship hook, and one safety line.
3. Tell players whether turns are free-form, spotlighted, or strict initiative.
4. Confirm voice and ambience are optional and can be muted at any time.

During play:

1. Read the current objective and active actor cue before asking for actions.
2. When a player freezes, offer an action shape: investigate, influence, move, prepare, or risk.
3. Use clocks as pacing signals. A threat clock asks for urgency; a clue clock asks for investigation.
4. Let players ignore suggestions when they have a better idea.
5. When the AI DM result feels unclear, ask for a short clarifying action instead of rewriting the whole scene.

After a scene:

1. Summarize the outcome, unresolved clue, active danger, and next likely exit.
2. Encourage one backpack or market check before the next dangerous scene.
3. Build a replay when the session has enough highlights to preserve.

Safety practice: pause if a player invokes a boundary. Fade out, redirect, or retcon without requiring the player to justify the request.

## Recovery And Reconnect

Use this table when someone loses state.

| Symptom | Likely Cause | Player Action | Host Action | Expected Result |
| --- | --- | --- | --- | --- |
| Room opens but no local character is active. | The URL opened in a different browser profile or local storage was cleared. | Confirm the room ID and use setup to rejoin only if needed. | Verify the player is in the correct room before continuing. | The player gets a visible join or recovery path. |
| Submit fails after a long pause. | The room advanced while the form was open. | Reload, read the latest log, and submit a revised action. | Do not advance again until the player catches up. | The next action uses current room state. |
| Duplicate character appears. | A player rejoined instead of recovering. | Stop submitting with the duplicate. | Decide which seat is valid and record a cleanup task. | The table avoids split identity. |
| Backpack or wallet looks wrong after refresh. | The last inventory request may have failed or the player is viewing stale UI. | Reopen `My character` and check latest market/inventory feedback. | Check the log before granting manual corrections. | Server state remains authoritative. |
| Audio stopped. | Browser gesture, mute, or tab policy blocked playback. | Toggle ambience or voice after clicking the page. | Continue play without requiring audio. | Transcript and state still carry gameplay. |
| Password room does not seat the player. | The password is missing or incorrect, or the tab has stale local state. | Re-enter the password from the visible join form and wait for the in-page status. | Confirm the room mode and avoid sharing host credentials. | The player either sees a clear error or becomes seated after the correct password. |
| Approval room still shows pending. | The host has not approved the request, or the player tab has not refreshed after approval. | Keep the same tab open and refresh after approval. | Approve or reject from the access queue. | Approved players recover the seat; rejected players remain out of the party. |

Never ask a player to create a second room to fix a lost seat unless the current room is intentionally abandoned.

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
