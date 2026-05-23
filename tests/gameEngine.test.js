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
  assert.equal(chatted.transcript.some((entry) => entry.type === "reward"), false);
});

test("successful discovery actions create contextual reward events", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Rewards" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);

    const acted = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "carefully open the old coffer and take the treasure"
    });

    const rewardEntry = acted.transcript.at(-1);
    assert.equal(rewardEntry.type, "reward");
    assert.equal(rewardEntry.reward.categoryId, "equipment");
    assert.equal(rewardEntry.reward.file.endsWith(".png"), true);
    assert.equal(Boolean(rewardEntry.reward.displayName.en), true);
    assert.equal(acted.players[0].character.inventory.includes(rewardEntry.reward.name), true);
  } finally {
    Math.random = originalRandom;
  }
});

test("story actions shift scene context for presentation and soundscape selection", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Scene Shift" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);

    const acted = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "follow the old forest trail toward the insect lights"
    });

    assert.equal(acted.scene.location, "Misty forest path");
    assert.equal(acted.scene.lastShiftReason, "forest-action");
    assert.match(acted.scene.ambience, /insects|leaves|moss/i);
  } finally {
    Math.random = originalRandom;
  }
});

test("scene movement requires travel intent and unlocked routes", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.55;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Coherence" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);
    const started = await engine.getRoom(room.id);

    const mentionedForest = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "recite the word forest while inspecting the archive stairs",
      expectedVersion: started.version
    });

    assert.equal(mentionedForest.scene.location, started.scene.location);
    assert.equal(mentionedForest.scene.lastShiftReason, undefined);

    const second = await engine.getRoom(room.id);
    const blockedWaterfall = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "follow the hidden waterfall path immediately",
      expectedVersion: second.version
    });

    assert.equal(blockedWaterfall.scene.location, started.scene.location);
    assert.equal(blockedWaterfall.scene.blockedExit.reason, "route-not-established");
    assert.equal(blockedWaterfall.transcript.some((entry) => entry.type === "reward"), false);
  } finally {
    Math.random = originalRandom;
  }
});

test("successful reward intent needs an established source", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "No Free Loot" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);

    const acted = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "open a random treasure chest that nobody established"
    });

    assert.equal(acted.transcript.some((entry) => entry.type === "reward"), false);
    assert.equal(acted.players[0].character.inventory.includes("random treasure chest"), false);
  } finally {
    Math.random = originalRandom;
  }
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

test("defeated active players do not crash hostile action resolution", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Defeat" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio"
  });
  await engine.startRoom(room.id);
  const stored = await engine.requireRoom(room.id);
  stored.players[0].character.hp = 0;
  await engine.store.saveRoom(stored);

  const latest = await engine.getRoom(room.id);
  const acted = await engine.submitAction(room.id, {
    playerId: joined.player.id,
    text: "attack the nearest skirmisher",
    expectedVersion: latest.version
  });

  assert.equal(acted.players[0].character.hp, 0);
  assert.equal(acted.combat.log.length, 0);
  assert.equal(acted.transcript.some((entry) => entry.type === "gm"), true);
});
