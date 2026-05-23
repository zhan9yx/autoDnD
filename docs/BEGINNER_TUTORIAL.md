# Beginner Tutorial

This tutorial walks through one local AIDM session from a blank browser page to a replay summary.

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

## Step 3: Begin The Scene

Select `Begin scene` after at least one player has joined. The scene panel shows the current location, objective, threat clock, and clue clock.

If the button is disabled, confirm that the room is still in the lobby phase and that at least one player is in the roster.

## Step 4: Act Or Chat

Use the visible table log form for player input. The main log shows the latest entries; select `Full log` when you need the full transcript.

- Choose `Action` for a move that should advance the game.
- Choose `Chat` for conversation that should not spend the turn.
- Choose a roll mode when the action needs normal, advantage, or disadvantage resolution.

Example action: `Search the archive desk for the missing ledger.`

## Step 5: Turn On Voice

Use the voice controls above the table log.

- Select `Voice on` to read new transcript entries aloud.
- Use `Read latest` to replay the newest entry.
- Use `Stop` if speech queues too much text.

Different authors use different speaker profiles so AIDM, rules, table messages, and player characters are easier to distinguish.

## Step 6: Turn On Ambience

Use the `Adaptive ambience` controls above the table log.

- Select `Ambience on` after a user gesture to start local background music and environment sound.
- Adjust `Master`, `Music`, and `Environment` if the mix is too strong.
- Watch the preset label change as the scene shifts from rain, forest, market, campfire, mystery, or combat pressure.

The stage also uses generated scene artwork. The backdrop changes automatically when the scene shifts to a forest, city, waterfall, camp, or combat pressure.

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

## Step 10: Run Evaluation

After changing memory behavior, run the long-memory evaluation before trusting the result.

```bash
npm run eval:memory
```

The gate checks `recallAt5` and `meanReciprocalRank` against the current dataset. See `docs/EVALUATION.md` for dataset shape and command variants.
