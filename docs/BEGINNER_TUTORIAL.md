# Beginner Tutorial

This tutorial walks through one local AIDM session from a blank browser page to a replay summary. It is written for a first table where the host and players may not know tabletop procedures yet.

Expected duration: 35-50 minutes for one host and one to four players.

What success looks like:

- The host creates a room and starts the first scene.
- Every player joins with a character that has a motive, fear, relationship hook, and safe boundary.
- The table completes at least one action, one chat message, one market or backpack operation, one scene transition, one audio check, and one replay build.
- A refreshed or reconnected player can return to the same room and continue.

## Step 1: Open A Room

1. Start the local server with `npm run dev`.
2. Open the browser table.
3. Keep the default room title or enter a new one.
4. Choose a campaign tone.
5. Choose English or Chinese as the table language.
6. Select `Create room`.

The browser stores the host token locally. Keep the generated room URL if another player needs to join. After the room opens, the table keeps the scene, current state, latest log, and action composer in one viewport.

## Step 2: Create A Character

1. Select `Party` in the topbar.
2. In the Party drawer, enter a player name.
3. Enter a character name.
4. Choose species and class.
5. Adjust Body, Agility, Mind, Presence, and Spirit while watching the point budget.
6. Pick an archetype.
7. Select `Join table`.
8. Close the drawer to return to the stage.

The roster should show HP, defense, initiative, and attributes after the character joins.

Use this quick character worksheet before selecting `Join table`:

| Field | What To Write | Example |
| --- | --- | --- |
| Role | What the character does when danger starts. | Front-line guard, lock expert, field healer, street scholar. |
| Goal | What the character wants in this session. | Find proof that the missing magistrate was framed. |
| Fear | What makes the character hesitate. | Being trapped underground again. |
| Bond | One connection to another player, NPC, or place. | Owes the rogue a life debt from the bridge fire. |
| Secret | One fact the table can discover later. | Carries a signet from a banned house. |
| Safety line | A topic the player wants the story to avoid or fade out. | No detailed torture scenes. |

If the current UI does not yet have a dedicated field for one of these hooks, put the short version in the character memo after joining. Keep the hook player-facing unless the table agrees that it is a reveal.

For the first session, pick one party relationship before play starts:

- Ally bond: one character trusts another with a personal secret.
- Shared debt: two characters owe the same NPC a favor.
- Tension: two characters disagree about methods but share the same goal.
- Past event: the party survived one strange incident before this room opened.

## Step 3: Begin The Scene

Select `Begin scene` after at least one player has joined. The scene panel shows the current location, objective, threat clock, and clue clock.

If the button is disabled, confirm that the room is still in the lobby phase and that at least one player is in the roster.

Host first-scene script:

1. Read the scene title, objective, weather, and visible danger aloud.
2. Ask each player to say where their character stands in the scene.
3. Point at the active actor cue before asking for the first action.
4. Remind players that `Chat` is always safe for table talk, while `Action` moves the scene.

## Step 4: Act Or Chat

Use the visible table log form for player input. The main log shows the latest entries; select `Full log` when you need the full transcript.

- Choose `Action` for a move that should advance the game.
- Choose `Chat` for conversation that should not spend the turn.
- Choose a roll mode when the action needs normal, advantage, or disadvantage resolution.

Example action: `Search the archive desk for the missing ledger.`

When a player is unsure, ask them to choose one action shape:

| Action Shape | Use It When | Example |
| --- | --- | --- |
| Investigate | You want clues, exits, weaknesses, or history. | `Check the muddy window ledge for fresh tracks.` |
| Influence | You want to persuade, comfort, deceive, or threaten. | `Quietly ask the dock guard who paid him tonight.` |
| Move | You want to change position or leave the scene. | `Lead the group through the lantern alley toward the market.` |
| Prepare | You want to use gear, cast, guard, or set up advantage. | `Light the storm lantern and hand the map to Mira.` |
| Risk | You accept danger for a faster or stronger result. | `Jump the broken bridge before the patrol turns around.` |

If the cue says another player is active, use `Chat` for short in-character support or ask the host whether the table is in free-form mode.

## Step 5: Buy, Inspect, Or Use An Item

Open `Market` after joining the table. Buy an affordable item such as a worn scroll, a tool, or a ration, then open `My character` and select the item in the backpack.

- Check condition, rarity, current value, sell value, and stock before buying.
- Use consumables or spell scrolls from the item detail panel.
- Sell tradeable items from the backpack when you want currency back.
- Equip weapons, armor, shields, or accessories from item detail when the item has a valid slot.

If a spell scroll teaches a spell the character already knows, the use action fails and the scroll stays in the backpack.

## Step 6: Turn On Voice And Ambience

Use the voice controls above the table log.

- Select `Voice on` to read new transcript entries aloud.
- Use `Read latest` to replay the newest entry.
- Use `Stop` if speech queues too much text.

Different authors use different speaker profiles so AIDM, rules, table messages, and player characters are easier to distinguish.

Voice expectations:

- AIDM narration should use the narrator profile.
- Rules or system feedback should be more neutral and concise.
- Player characters should keep a stable profile when the browser exposes enough local voices.
- If the browser only offers one voice, the UI still uses profile rate and pitch changes and the transcript remains the source of truth.

Use the `Adaptive ambience` controls above the table log.

- Select `Ambience on` after a user gesture to start local background music and environment sound.
- Adjust `Master`, `Music`, and `Environment` if the mix is too strong.
- Watch the preset label change as the scene shifts from rain, forest, market, campfire, mystery, or combat pressure.

The stage also uses generated scene artwork. The backdrop changes automatically when the scene shifts to a forest, city, waterfall, camp, or combat pressure.

Weather and season cues are part of the scene, not decoration. Rain can imply slick streets and muffled sound, fog can reduce visibility, winter can change travel risk, and summer heat can make delays costly. If the narration, state drawer, and ambience disagree, treat that as a QA issue.

## Step 7: Read Combat State

When an encounter is active, select `State` and read the `Encounter` section before acting.

- Enemy rows show HP, defense, and role.
- Tactical intent shows what the enemy side is trying to do.
- Recent combat log rows show attacks, damage, conditions, and recovery.

Use this information to decide whether the next action should attack, defend, heal, investigate, or reposition.

## Step 8: Build A Replay

After a few rounds, open `State` and select `Build` in the `Replay` section. The summary reports the replay title, share text, chapter count, highlight count, and memory count.

Use replay output to verify that important table moments were captured in order.

## Step 9: Find A Reward

Submit an action that can discover a concrete object, such as `Carefully open the old coffer and take whatever is inside.` When the action succeeds, the table writes a reward entry, shows an item image in the transcript, and opens a reward toast.

Open `State` to review recent rewards. The full catalog is not shown to players; it is managed by manifests and tests so the table can use images only when the story needs them.

## Step 10: Recover Or Reconnect

Use this recovery path during the first session so everyone knows how it works before a real problem appears.

1. Copy the room URL from the browser address bar.
2. Refresh the page in the same browser profile.
3. Confirm your character, backpack, memo, latest log, and current scene are still visible.
4. If you opened the room in a new browser and see no local character, use the setup panel to join or ask the host to confirm the correct room ID.
5. If an action fails with a stale-state message, reload once, read the latest log, and submit the action again only if it still makes sense.

Do not create a duplicate character just to recover a lost tab. First verify the room ID and local browser profile.

## Step 11: Run Evaluation

After changing memory behavior, run the long-memory evaluation before trusting the result.

```bash
npm run eval:memory
```

The gate checks `recallAt5` and `meanReciprocalRank` against the current dataset. See `docs/EVALUATION.md` for dataset shape and command variants.
