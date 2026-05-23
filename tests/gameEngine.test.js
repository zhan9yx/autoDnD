import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../src/core/gameEngine.js";
import { MemoryRoomStore } from "../src/core/storage.js";

test("creates a playable room and persists action memory", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Archive" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio",
    archetype: "Investigator"
  });
  await engine.startRoom(room.id);
  const acted = await engine.submitAction(room.id, {
    playerId: joined.player.id,
    text: "carefully inspect the archive stairs"
  });

  assert.equal(acted.players.length, 1);
  assert.equal(acted.memories.length, 1);
  assert.equal(acted.transcript.some((entry) => entry.type === "roll"), true);
  assert.match(acted.transcript.at(-1).text, /Lio|archive/i);
});
