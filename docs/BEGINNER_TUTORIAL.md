# Beginner Tutorial

This tutorial walks through one local AIDM session from a blank browser page to a replay summary.

## Step 1: Open A Room

1. Start the local server with `npm run dev`.
2. Open the browser table.
3. Keep the default room title or enter a new one.
4. Choose a campaign tone.
5. Choose English or Chinese as the table language.
6. Select `Create room`.

The browser stores the host token locally. Keep the generated room URL if another player needs to join.

## Step 2: Create A Character

1. In the `Players` panel, enter a player name.
2. Enter a character name.
3. Choose species and class.
4. Adjust Body, Agility, Mind, Presence, and Spirit while watching the point budget.
5. Pick an archetype.
6. Select `Join table`.

The roster should show HP, defense, initiative, and attributes after the character joins.

## Step 3: Begin The Scene

Select `Begin scene` after at least one player has joined. The scene panel shows the current location, objective, threat clock, and clue clock.

If the button is disabled, confirm that the room is still in the lobby phase and that at least one player is in the roster.

## Step 4: Act Or Chat

Use the table log form for player input.

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

## Step 6: Read Combat State

When an encounter is active, read the `Encounter` panel before acting.

- Enemy rows show HP, defense, and role.
- Tactical intent shows what the enemy side is trying to do.
- Recent combat log rows show attacks, damage, conditions, and recovery.

Use this information to decide whether the next action should attack, defend, heal, investigate, or reposition.

## Step 7: Build A Replay

After a few rounds, select `Build` in the `Replay` panel. The summary reports the replay title, share text, chapter count, highlight count, and memory count.

Use replay output to verify that important table moments were captured in order.

## Step 8: Inspect The Asset Library

The `Asset Library` preview shows a small slice of the checked-in visual asset manifest. It helps confirm that scenes, character identities, equipment, spells, NPCs, and enemies are available to the table.

For asset pipeline details, read `docs/ASSET_PIPELINE.md`.

## Step 9: Run Evaluation

After changing memory behavior, run the long-memory evaluation before trusting the result.

```bash
npm run eval:memory
```

The gate checks `recallAt5` and `meanReciprocalRank` against the current dataset. See `docs/EVALUATION.md` for dataset shape and command variants.
