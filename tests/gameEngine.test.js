import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../src/core/gameEngine.js";
import { createInventoryEntry } from "../src/core/itemCatalog.js";
import { MemoryRoomStore } from "../src/core/storage.js";
import { buildTableStateSummary } from "../src/core/stateSummary.js";

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
  assert.equal(acted.players[0].character.level, 1);
  assert.equal(acted.players[0].character.xp, 0);
  assert.equal(acted.players[0].character.equipmentSummary.slots.body.id, "body");
  assert.equal(acted.memories.length, 1);
  assert.equal(acted.transcript.some((entry) => entry.type === "roll"), true);
  const gmLog = acted.transcript.find((entry) => entry.type === "gm" && entry.author === "AIDM")?.structuredLog;
  const rollLog = acted.transcript.find((entry) => entry.type === "roll")?.structuredLog;
  assert.equal(gmLog?.type, "ai.decision");
  assert.equal(gmLog?.scope, "ai-dm");
  assert.equal(gmLog?.category, "ai-dm");
  assert.equal(gmLog?.action, "narrate");
  assert.equal(gmLog?.messageKey, "ai.dm.decision");
  assert.match(gmLog?.template.en, /AI DM decision/);
  assert.match(gmLog?.template.zh, /AI DM 决策/);
  assert.equal(Array.isArray(gmLog?.metadata?.rationale), true);
  assert.equal(rollLog?.type, "dice.roll");
  assert.equal(rollLog?.category, "rules");
  assert.equal(rollLog?.action, "resolve-check");
  assert.equal(rollLog?.messageKey, "rules.check.resolved");
  assert.equal(rollLog?.metadata?.outcome, rollLog?.metadata?.total >= rollLog?.metadata?.dc ? "success" : "failure");
  assert.match(acted.transcript.at(-1).text, /Lio|archive/i);
});

test("AI DM transcript logs expose readable bilingual template fields", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "双语日志", language: "zh" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "澜",
    archetype: "调查员"
  });
  await engine.startRoom(room.id);

  const acted = await engine.submitAction(room.id, {
    playerId: joined.player.id,
    text: "谨慎检查档案馆台阶上的水迹"
  });
  const gmLog = acted.transcript
    .filter((entry) => entry.type === "gm" && entry.author === "AIDM")
    .at(-1).structuredLog;

  assert.equal(gmLog.type, "ai.decision");
  assert.equal(gmLog.category, "ai-dm");
  assert.equal(gmLog.action, "narrate");
  assert.equal(gmLog.messageKey, "ai.dm.decision");
  assert.equal(gmLog.template.key, "ai.dm.decision");
  assert.match(gmLog.template.en, /AI DM decision/);
  assert.match(gmLog.template.zh, /AI DM 决策/);
  assert.equal(typeof gmLog.template.params.decision, "string");
  assert.equal(typeof gmLog.template.params.result, "string");
  assert.equal(gmLog.humanSummary.en.includes("[object Object]"), false);
  assert.equal(gmLog.humanSummary.zh.includes("[object Object]"), false);
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
  assert.equal(chatted.transcript.at(-1).structuredLog.type, "chat.message");
  assert.doesNotMatch(JSON.stringify(chatted.transcript.at(-1).structuredLog), /inspect the door/);
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
    assert.equal(
      acted.players[0].character.inventory.some((entry) => entry.itemId === `generated:${rewardEntry.reward.semanticKey || rewardEntry.reward.id}`),
      true
    );
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

test("investigation actions evolve scene clues and reward hints before loot is claimed", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Clue Loop" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);
    const started = await engine.getRoom(room.id);

    const investigated = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "carefully inspect the archive stairs for ledger clues",
      expectedVersion: started.version
    });

    assert.equal(investigated.scene.location, started.scene.location);
    assert.equal(investigated.scene.lastShiftReason, undefined);
    assert.equal(investigated.scene.lastEvolutionReason, "clue-progress");
    assert.equal(investigated.scene.recentClues[0].clock, "clues");
    assert.equal(investigated.scene.rewardHints[0].sourceId, "source-old-coffer");
    assert.match(investigated.scene.rewardHints[0].prompt.en, /searchable|recover/i);
    assert.equal(investigated.transcript.some((entry) => entry.type === "reward"), false);

    const summary = buildTableStateSummary(investigated);
    assert.equal(summary.scene.currentLead.sourceId, "source-old-coffer");
    assert.equal(summary.scene.rewardHint.sourceId, "source-old-coffer");
    assert.match(summary.scene.summary.en, /Search|searchable|recover/i);

    const claimed = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "inspect the archive coffer and claim the ledger evidence",
      expectedVersion: investigated.version
    });

    const rewardEntry = claimed.transcript.at(-1);
    assert.equal(rewardEntry.type, "reward");
    assert.equal(rewardEntry.reward.source.id, "source-old-coffer");
  } finally {
    Math.random = originalRandom;
  }
});

test("failed actions record danger consequences in scene summary", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.01;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Consequences" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);
    const started = await engine.getRoom(room.id);

    const acted = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "reckless force the archive lock before checking the seal",
      expectedVersion: started.version
    });

    assert.equal(acted.scene.lastEvolutionReason, "danger-consequence");
    assert.equal(acted.scene.activeConsequences[0].clock, "danger");
    assert.equal(acted.scene.activeConsequences[0].severity, "major");
    assert.equal(acted.scene.clocks.danger, 3);
    assert.match(acted.scene.summary.en, /failed check|danger/i);

    const summary = buildTableStateSummary(acted);
    assert.equal(summary.scene.activeConsequences[0].severity, "major");
    assert.equal(summary.clocks.danger.value, 3);
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
    assert.equal(
      acted.players[0].character.inventory.some((entry) => entry.itemId === "generated:random-treasure-chest"),
      false
    );
  } finally {
    Math.random = originalRandom;
  }
});

test("deterministic progression path updates xp, level, spells, and equipment summary", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Progression" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio"
  });
  const stored = await engine.requireRoom(room.id);
  stored.players[0].character.inventory.push(createInventoryEntry("field-primer", {
    condition: "fine",
    instanceId: "primer-depth-test",
    source: "test"
  }));
  stored.players[0].character.inventory.push(createInventoryEntry("sleep-scroll", {
    condition: "fine",
    instanceId: "sleep-depth-test",
    source: "test"
  }));
  stored.players[0].character.inventory.push(createInventoryEntry("dagger", {
    condition: "fine",
    instanceId: "dagger-depth-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforePrimer = await engine.getRoom(room.id);
  const progressed = await engine.useItem(room.id, {
    playerId: joined.player.id,
    itemId: "primer-depth-test",
    expectedVersion: beforePrimer.version
  });
  const learned = await engine.useItem(room.id, {
    playerId: joined.player.id,
    itemId: "sleep-depth-test",
    expectedVersion: progressed.version
  });
  const equipped = await engine.equipItem(room.id, {
    playerId: joined.player.id,
    itemId: "dagger-depth-test",
    expectedVersion: learned.version
  });

  const character = equipped.players[0].character;
  assert.equal(character.xp, 120);
  assert.equal(character.level, 2);
  assert.equal(character.spells.includes("sleep"), true);
  assert.equal(character.knownSpells.includes("sleep"), true);
  assert.equal(character.equipmentSummary.slots.mainHand.item.id, "dagger-depth-test");
  assert.equal(equipped.transcript.some((entry) => entry.type === "spell" && entry.inventory.learnedSpell === "sleep"), true);
  assert.equal(equipped.transcript.at(-1).inventory.stateDeltas.equipment.equipped.includes("dagger"), true);
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
