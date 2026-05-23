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

test("chat messages do not roll dice, write memories, or advance rounds", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Chat" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio"
  });
  await engine.startRoom(room.id);
  const before = await engine.getRoom(room.id);

  const chatted = await engine.sendChat(room.id, {
    playerId: joined.player.id,
    text: "Can we inspect the door first?",
    expectedVersion: before.version
  });

  assert.equal(chatted.round, before.round);
  assert.equal(chatted.memories.length, 0);
  assert.equal(chatted.transcript.at(-1).type, "chat");
  assert.equal(chatted.transcript.some((entry) => entry.type === "roll"), false);
});

test("stale expectedVersion rejects actions with latest snapshot", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Versions" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio"
  });
  await engine.startRoom(room.id);

  await assert.rejects(
    () => engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "inspect the archive",
      expectedVersion: 1
    }),
    (error) => {
      assert.equal(error.code, "VERSION_CONFLICT");
      assert.equal(error.statusCode, 409);
      assert.equal(error.snapshot.id, room.id);
      return true;
    }
  );
});

test("host and player tokens protect controlled room mutations", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Secure", hostToken: "host-secret" });

  await assert.rejects(
    () => engine.startRoom(room.id, { hostToken: "wrong" }),
    { code: "HOST_TOKEN_REQUIRED" }
  );

  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio",
    playerToken: "player-secret"
  });
  await engine.startRoom(room.id, { hostToken: "host-secret" });
  const latest = await engine.getRoom(room.id);

  await assert.rejects(
    () => engine.sendChat(room.id, {
      playerId: joined.player.id,
      playerToken: "wrong",
      text: "hello",
      expectedVersion: latest.version
    }),
    { code: "PLAYER_TOKEN_REQUIRED" }
  );

  const chatted = await engine.sendChat(room.id, {
    playerId: joined.player.id,
    playerToken: "player-secret",
    text: "hello",
    expectedVersion: latest.version
  });
  assert.equal(chatted.auth, undefined);
  assert.equal(chatted.transcript.at(-1).type, "chat");
});
