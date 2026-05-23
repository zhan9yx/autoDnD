#!/usr/bin/env node
import assert from "node:assert/strict";
import { GameEngine } from "../src/core/gameEngine.js";
import { MemoryRoomStore } from "../src/core/storage.js";

const engine = new GameEngine({ store: new MemoryRoomStore() });
const room = await engine.createRoom({
  title: "Five Player Simulation",
  tone: "mystery",
  hostToken: "simulation-host"
});

const builds = [
  ["Ada", "Seren", "automaton", "occultist", { body: 2, agility: 3, mind: 5, presence: 3, spirit: 3 }],
  ["Bo", "Kara", "human", "warrior", { body: 5, agility: 3, mind: 2, presence: 3, spirit: 3 }],
  ["Cy", "Mira", "elf", "mage", { body: 2, agility: 3, mind: 5, presence: 3, spirit: 3 }],
  ["Dee", "Tovin", "dwarf", "cleric", { body: 4, agility: 2, mind: 3, presence: 3, spirit: 4 }],
  ["Eli", "Nox", "halfling", "rogue", { body: 2, agility: 5, mind: 3, presence: 4, spirit: 2 }]
];

const tokens = new Map();
for (const [playerName, characterName, species, classId, stats] of builds) {
  const joined = await engine.joinRoom(room.id, {
    playerName,
    characterName,
    species,
    classId,
    stats,
    playerToken: `${playerName.toLowerCase()}-token`
  });
  tokens.set(joined.player.id, `${playerName.toLowerCase()}-token`);
}

await engine.startRoom(room.id, { hostToken: "simulation-host" });

const actionTexts = [
  "carefully inspect the west stair for the silver ledger",
  "attack the nearest street skirmisher with a spell",
  "convince the archive keeper to reveal the sealed oath",
  "guard the wounded ally while checking the moon key",
  "shoot a warning shot toward the alley archer",
  "decode the coded receipt near the old courthouse",
  "cast a spell at the shadowed figure by the door",
  "search the storm lantern for hidden ashroot residue",
  "threaten the masked heir with the witness coin",
  "carefully trace the bootprints toward Bellmaker Alley"
];

for (let turn = 0; turn < 30; turn += 1) {
  const latest = await engine.getRoom(room.id);
  const active = latest.activePlayer;
  assert.ok(active, "simulation requires active player");
  if (turn % 7 === 3) {
    await engine.sendChat(room.id, {
      playerId: active.id,
      playerToken: tokens.get(active.id),
      text: `table note ${turn}: regroup before the next move`,
      expectedVersion: latest.version
    });
    continue;
  }
  await engine.submitAction(room.id, {
    playerId: active.id,
    playerToken: tokens.get(active.id),
    text: actionTexts[turn % actionTexts.length],
    mode: turn % 5 === 0 ? "advantage" : "normal",
    expectedVersion: latest.version
  });
}

const finalRoom = await engine.getRoom(room.id);
const replay = await engine.getReplay(room.id);

assert.equal(finalRoom.players.length, 5);
assert.equal(finalRoom.round >= 5, true);
assert.equal(finalRoom.memories.length >= 20, true);
assert.equal(finalRoom.combat.log.length >= 2, true);
assert.equal(replay.highlights.length >= 4, true);
assert.equal(finalRoom.auth, undefined);

console.log(JSON.stringify({
  ok: true,
  players: finalRoom.players.length,
  round: finalRoom.round,
  transcript: finalRoom.transcript.length,
  memories: finalRoom.memories.length,
  combatLog: finalRoom.combat.log.length,
  replayHighlights: replay.highlights.length,
  directorBeat: finalRoom.director.beat
}, null, 2));
