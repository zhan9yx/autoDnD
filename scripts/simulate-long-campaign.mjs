#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { AIProvider } from "../src/core/aiProvider.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { MemoryIndex } from "../src/core/memory.js";
import { JsonRoomStore } from "../src/core/storage.js";
import { buildTableStateSummary } from "../src/core/stateSummary.js";

const DEFAULT_CONFIG = Object.freeze({
  turns: 72,
  minGeneratedTranscriptEvents: 220,
  maxGeneratedTranscriptEvents: 500,
  minRetainedTranscriptEvents: 200,
  minMemoryCount: 60,
  maxSnapshotBytes: 2_500_000,
  maxLogPayloadBytes: 1_500_000,
  maxSingleLogBytes: 40_000,
  maxSummaryBytes: 350_000,
  maxDurationMs: 15_000
});

const BUILDS = Object.freeze([
  ["Ada", "Seren", "automaton", "occultist", { body: 2, agility: 3, mind: 5, presence: 3, spirit: 3 }],
  ["Bo", "Kara", "human", "warrior", { body: 5, agility: 3, mind: 2, presence: 3, spirit: 3 }],
  ["Cy", "Mira", "elf", "mage", { body: 2, agility: 3, mind: 5, presence: 3, spirit: 3 }],
  ["Dee", "Tovin", "dwarf", "cleric", { body: 4, agility: 2, mind: 3, presence: 3, spirit: 4 }],
  ["Eli", "Nox", "halfling", "rogue", { body: 2, agility: 5, mind: 3, presence: 4, spirit: 2 }],
  ["Fia", "Iri", "tiefling", "ranger", { body: 3, agility: 5, mind: 3, presence: 3, spirit: 2 }]
]);

const ACTIONS = Object.freeze([
  "carefully investigate Archive Keeper Vey's stair ledger mark for the silver ledger quest",
  "question Bellmaker Orra about the moon key toll and the bell-thread quest",
  "trace the blue ash trail through the cistern shrine for the water pact quest",
  "search the old coffer and coded map niche for a tangible inventory clue",
  "convince Dock Broker Sela to admit who moved the sealed warrant",
  "attack the nearest street skirmisher before the archive witness flees",
  "scout the glass market crowd for the masked heir and house signet",
  "study the storm lantern reflection beside Nalia's hidden blue ash message",
  "carefully open the evidence cache and claim anything tied to the ledger thread",
  "follow the market alley route while keeping the bellmaker thread visible",
  "read the rain archive shelf labels for NPC facts about Vey, Sela, and Hedra",
  "guard the wounded ally and inspect the healer kit before the next clue closes"
]);

const CHAT_NOTES = Object.freeze([
  "party note: keep Vey, Orra, Sela, and Nalia facts separate",
  "party note: do not sell quest clues until the ledger thread resolves",
  "party note: refresh the room after inventory updates before acting",
  "party note: confirm which quest thread each clue belongs to"
]);

const SEEDED_NPC_FACTS = Object.freeze([
  {
    text: "NPC fact: Archive Keeper Vey hides the silver ledger in the clocktower stair if the party names the witness charm.",
    tags: ["npc", "vey", "archive", "silver-ledger", "clocktower", "witness-charm"],
    sourceEventId: "NPC-VEY-LEDGER"
  },
  {
    text: "NPC fact: Bellmaker Orra will trade the moon key only after the cracked bronze bell is returned.",
    tags: ["npc", "orra", "bellmaker", "moon-key", "bronze-bell"],
    sourceEventId: "NPC-ORRA-MOON-KEY"
  },
  {
    text: "NPC fact: Dock Broker Sela forged the sealed warrant and fears the masked heir.",
    tags: ["npc", "sela", "dock-broker", "sealed-warrant", "masked-heir"],
    sourceEventId: "NPC-SELA-WARRANT"
  },
  {
    text: "NPC fact: Nalia recognizes blue ash at the cistern shrine and can expose the water pact.",
    tags: ["npc", "nalia", "blue-ash", "cistern", "water-pact"],
    sourceEventId: "NPC-NALIA-CISTERN"
  },
  {
    text: "NPC fact: Gate Captain Hedra waives the lantern toll for anyone carrying the house signet.",
    tags: ["npc", "hedra", "lantern-toll", "house-signet", "gate"],
    sourceEventId: "NPC-HEDRA-TOLL"
  },
  {
    text: "NPC fact: Street Oracle Pell saw the coded map folded inside the alchemist mortar crate.",
    tags: ["npc", "pell", "street-oracle", "coded-map", "alchemist-mortar"],
    sourceEventId: "NPC-PELL-MAP"
  }
]);

const RANDOM_SEQUENCE = Object.freeze([
  0.92, 0.18, 0.73, 0.41, 0.86, 0.27, 0.64, 0.35,
  0.97, 0.12, 0.58, 0.79, 0.22, 0.69, 0.44, 0.88
]);

export async function runLongCampaignSimulation(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  assert.ok(config.turns >= 65, "long campaign simulation needs at least 65 turns");
  const tempDir = options.tempDir || await mkdtemp(join(tmpdir(), "aidm-long-campaign-"));
  const dataFile = options.dataFile || join(tempDir, "rooms.json");
  const store = new TrackingJsonRoomStore(dataFile);
  const engine = new GameEngine({ store, aiProvider: new AIProvider({}) });
  const startedAt = performance.now();

  const result = await withDeterministicRandom(async () => {
    const created = await engine.createRoom({
      title: "Long Campaign Stability Simulation",
      tone: "mystery",
      language: "en",
      hostToken: "long-campaign-host"
    });
    await seedLongCampaignState(store, created.id);

    const tokens = new Map();
    for (const [playerName, characterName, species, classId, stats] of BUILDS) {
      const joined = await engine.joinRoom(created.id, {
        playerName,
        characterName,
        species,
        classId,
        stats,
        playerToken: `${playerName.toLowerCase()}-long-token`
      });
      tokens.set(joined.player.id, `${playerName.toLowerCase()}-long-token`);
    }

    await engine.startRoom(created.id, { hostToken: "long-campaign-host" });
    const inventoryEvents = [];
    const boughtByPlayer = new Map();

    for (let turn = 0; turn < config.turns; turn += 1) {
      const latest = await engine.getRoom(created.id);
      const active = latest.activePlayer;
      assert.ok(active, "long campaign requires an active player");
      if (turn % 10 === 4) {
        await engine.sendChat(created.id, {
          playerId: active.id,
          playerToken: tokens.get(active.id),
          text: `${CHAT_NOTES[turn % CHAT_NOTES.length]} at table turn ${turn}`,
          channel: turn % 20 === 4 ? "party" : "public",
          factionId: "party",
          expectedVersion: latest.version
        });
      } else {
        await engine.submitAction(created.id, {
          playerId: active.id,
          playerToken: tokens.get(active.id),
          text: `${ACTIONS[turn % ACTIONS.length]} (thread ${turn % 4})`,
          mode: turn % 9 === 0 ? "advantage" : turn % 13 === 0 ? "disadvantage" : "normal",
          expectedVersion: latest.version
        });
      }

      if (turn % 9 === 2) {
        const event = await applyInventoryMutation(engine, created.id, tokens, boughtByPlayer, turn);
        if (event) {
          inventoryEvents.push(event);
        }
      }
      if (turn % 17 === 5) {
        await saveRotatingMemo(engine, created.id, tokens, turn);
      }
    }

    const finalRoom = await engine.getRoom(created.id);
    const replay = await engine.getReplay(created.id);
    const stateSummary = buildTableStateSummary(finalRoom);
    const recoveredEngine = new GameEngine({
      store: new JsonRoomStore(dataFile),
      aiProvider: new AIProvider({})
    });
    const recoveredRoom = await recoveredEngine.getRoom(created.id);
    const recoveredReplay = await recoveredEngine.getReplay(created.id);
    const rawStore = JSON.parse(await readFile(dataFile, "utf8"));
    const memoryChecks = runMemoryChecks(recoveredRoom);
    const payloadMetrics = calculatePayloadMetrics(finalRoom, stateSummary);
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;

    const summary = {
      ok: true,
      dataFile,
      roomId: finalRoom.id,
      durationMs,
      generatedTranscriptEvents: store.transcriptEventIds.size,
      retainedTranscriptEvents: finalRoom.transcript.length,
      players: finalRoom.players.length,
      rounds: finalRoom.round,
      quests: finalRoom.quests.length,
      memories: finalRoom.memories.length,
      inventoryEvents,
      replayHighlights: replay.highlights.length,
      recoveredReplayHighlights: recoveredReplay.highlights.length,
      payloadMetrics,
      memoryChecks,
      tracking: {
        maxRetainedTranscriptEvents: store.maxRetainedTranscriptEvents,
        maxSnapshotBytes: store.maxSavedRoomBytes,
        saveCount: store.saveCount
      }
    };

    assertLongCampaignInvariants({
      config,
      finalRoom,
      recoveredRoom,
      rawStore,
      replay,
      recoveredReplay,
      summary,
      stateSummary
    });

    return summary;
  });

  return result;
}

class TrackingJsonRoomStore extends JsonRoomStore {
  constructor(filePath) {
    super(filePath);
    this.transcriptEventIds = new Set();
    this.maxRetainedTranscriptEvents = 0;
    this.maxSavedRoomBytes = 0;
    this.saveCount = 0;
  }

  async saveRoom(room) {
    for (const event of room.transcript || []) {
      if (event?.id) {
        this.transcriptEventIds.add(event.id);
      }
    }
    this.maxRetainedTranscriptEvents = Math.max(this.maxRetainedTranscriptEvents, (room.transcript || []).length);
    this.maxSavedRoomBytes = Math.max(this.maxSavedRoomBytes, byteLength(room));
    this.saveCount += 1;
    return super.saveRoom(room);
  }
}

async function seedLongCampaignState(store, roomId) {
  const room = await store.getRoom(roomId);
  assert.ok(room, "seed room must exist");
  room.quests = [
    {
      id: "quest-ledger",
      title: "Silver Ledger Conspiracy",
      status: "active",
      progress: 0,
      clues: ["Vey has access to the stair ledger mark."]
    },
    {
      id: "quest-bell-thread",
      title: "Bellmaker Moon Key",
      status: "active",
      progress: 10,
      clues: ["Orra wants the cracked bronze bell returned."]
    },
    {
      id: "quest-water-pact",
      title: "Cistern Water Pact",
      status: "active",
      progress: 15,
      clues: ["Blue ash identifies the pact witness."]
    },
    {
      id: "quest-sealed-warrant",
      title: "Sealed Warrant Forgery",
      status: "active",
      progress: 5,
      clues: ["Sela's dock seal appears on the warrant."]
    }
  ];
  room.scene.rewardSources = [
    ...(room.scene.rewardSources || []),
    {
      id: "source-bell-crate",
      kind: "container",
      label: { en: "Bellmaker cracked crate", zh: "制铃师裂纹箱" },
      keywords: ["bell", "bellmaker", "cracked bronze bell", "bronze bell", "crate"],
      itemTags: ["key", "signet", "tool"]
    },
    {
      id: "source-cistern-cache",
      kind: "cache",
      label: { en: "Cistern blue ash cache", zh: "蓄水池蓝灰暗藏物" },
      keywords: ["cistern", "blue ash", "water pact", "shrine"],
      itemTags: ["antidote", "charm", "map"]
    },
    {
      id: "source-dock-ledger",
      kind: "ledger",
      label: { en: "Dock broker ledger", zh: "码头经纪账本" },
      keywords: ["dock", "sela", "sealed warrant", "broker"],
      itemTags: ["ledger", "warrant", "contract"]
    }
  ];
  const memoryIndex = new MemoryIndex(room.memories);
  for (const fact of SEEDED_NPC_FACTS) {
    memoryIndex.add({
      kind: "npc-fact",
      text: fact.text,
      tags: fact.tags,
      weight: 2.6,
      sourceEventId: fact.sourceEventId,
      createdAt: "2026-05-26T00:00:00.000Z"
    });
  }
  room.memories = memoryIndex.toJSON();
  room.version += 1;
  room.updatedAt = "2026-05-26T00:00:00.000Z";
  await store.saveRoom(room);
}

async function applyInventoryMutation(engine, roomId, tokens, boughtByPlayer, turn) {
  const room = await engine.getRoom(roomId);
  const plan = inventoryPlanForTurn(turn);
  if (!plan) {
    return null;
  }
  const player = room.players[plan.playerIndex % room.players.length];
  const token = tokens.get(player.id);

  if (plan.action === "buy") {
    const bought = await engine.buyItem(roomId, {
      playerId: player.id,
      playerToken: token,
      itemId: plan.itemId,
      expectedVersion: room.version
    });
    const buyer = bought.players.find((entry) => entry.id === player.id);
    const item = buyer.character.inventory.find((entry) => entry.itemId === plan.itemId && entry.source === "shop");
    if (item) {
      boughtByPlayer.set(`${player.id}:${plan.itemId}`, item.id);
    }
    return { turn, playerId: player.id, action: "buy", itemId: plan.itemId };
  }

  if (plan.action === "use-bought") {
    const itemId = boughtByPlayer.get(`${player.id}:${plan.itemId}`);
    if (!itemId) {
      return null;
    }
    await engine.useItem(roomId, {
      playerId: player.id,
      playerToken: token,
      itemId,
      expectedVersion: room.version
    });
    boughtByPlayer.delete(`${player.id}:${plan.itemId}`);
    return { turn, playerId: player.id, action: "use", itemId: plan.itemId };
  }

  if (plan.action === "sell-bought") {
    const itemId = boughtByPlayer.get(`${player.id}:${plan.itemId}`);
    if (!itemId) {
      return null;
    }
    await engine.sellItem(roomId, {
      playerId: player.id,
      playerToken: token,
      itemId,
      expectedVersion: room.version
    });
    boughtByPlayer.delete(`${player.id}:${plan.itemId}`);
    return { turn, playerId: player.id, action: "sell", itemId: plan.itemId };
  }

  await engine.useItem(roomId, {
    playerId: player.id,
    playerToken: token,
    itemId: plan.itemId,
    expectedVersion: room.version
  });
  return { turn, playerId: player.id, action: "use", itemId: plan.itemId };
}

function inventoryPlanForTurn(turn) {
  const plans = [
    { playerIndex: 0, action: "buy", itemId: "healing-draught" },
    { playerIndex: 0, action: "use-bought", itemId: "healing-draught" },
    { playerIndex: 1, action: "buy", itemId: "trail-ration" },
    { playerIndex: 1, action: "sell-bought", itemId: "trail-ration" },
    { playerIndex: 2, action: "use", itemId: "travel-lamp" },
    { playerIndex: 3, action: "buy", itemId: "healing-draught" },
    { playerIndex: 3, action: "use-bought", itemId: "healing-draught" },
    { playerIndex: 4, action: "use", itemId: "travel-lamp" }
  ];
  const cycle = Math.floor((turn - 2) / 9);
  return plans[cycle] || null;
}

async function saveRotatingMemo(engine, roomId, tokens, turn) {
  const room = await engine.getRoom(roomId);
  const player = room.players[(turn + 2) % room.players.length];
  await engine.saveMemo(roomId, {
    playerId: player.id,
    playerToken: tokens.get(player.id),
    text: `memo turn ${turn}: ${player.character.name} tracks Vey ledger, Orra key, Sela warrant, and Nalia blue ash separately.`,
    expectedVersion: room.version
  });
}

function runMemoryChecks(room) {
  const index = new MemoryIndex(room.memories);
  const checks = [
    {
      query: "Who hides the silver ledger in the clocktower stair with the witness charm?",
      expected: "NPC-VEY-LEDGER"
    },
    {
      query: "Who trades the moon key after the cracked bronze bell is returned?",
      expected: "NPC-ORRA-MOON-KEY"
    },
    {
      query: "Which NPC recognizes blue ash at the cistern shrine water pact?",
      expected: "NPC-NALIA-CISTERN"
    },
    {
      query: "Who forged the sealed warrant and fears the masked heir?",
      expected: "NPC-SELA-WARRANT"
    }
  ];

  return checks.map((check) => {
    const [first] = index.retrieveWithScores(check.query, { limit: 4 });
    return {
      query: check.query,
      expected: check.expected,
      topSourceEventId: first?.memory?.sourceEventId || null,
      topScore: first?.score || 0,
      matchedTokens: first?.matchedTokens || []
    };
  });
}

function calculatePayloadMetrics(room, stateSummary) {
  const structuredLogs = (room.transcript || []).map((entry) => entry.structuredLog || null);
  const logSizes = structuredLogs.map(byteLength);
  return {
    snapshotBytes: byteLength(room),
    stateSummaryBytes: byteLength(stateSummary),
    logPayloadBytes: byteLength(structuredLogs),
    maxSingleLogBytes: Math.max(0, ...logSizes),
    structuredLogCount: structuredLogs.filter(Boolean).length,
    logTypes: [...new Set(structuredLogs.map((log) => log?.type).filter(Boolean))].sort()
  };
}

function assertLongCampaignInvariants({
  config,
  finalRoom,
  recoveredRoom,
  rawStore,
  replay,
  recoveredReplay,
  summary,
  stateSummary
}) {
  assert.equal(finalRoom.auth, undefined);
  assert.equal(finalRoom.players.length, BUILDS.length);
  assert.equal(finalRoom.activePlayer?.id, finalRoom.activePlayerId);
  assert.equal(new Set(finalRoom.players.map((player) => player.id)).size, finalRoom.players.length);
  assert.equal(finalRoom.turnOrder.length, finalRoom.players.length);
  assert.equal(finalRoom.round >= 10, true);
  assert.equal(finalRoom.quests.length >= 4, true);
  assert.equal(finalRoom.quests.every((quest) => typeof quest.title === "string" && quest.status === "active"), true);
  assert.equal(finalRoom.memories.length >= config.minMemoryCount, true);
  assert.equal(finalRoom.transcript.length >= config.minRetainedTranscriptEvents, true);
  assert.equal(summary.generatedTranscriptEvents >= config.minGeneratedTranscriptEvents, true);
  assert.equal(summary.generatedTranscriptEvents <= config.maxGeneratedTranscriptEvents, true);
  assert.equal(summary.inventoryEvents.length >= 6, true);
  assert.equal(replay.highlights.length >= 6, true);
  assert.equal(recoveredReplay.highlights.length, replay.highlights.length);
  assert.equal(rawStore.rooms.length, 1);

  for (const player of finalRoom.players) {
    assert.ok(Array.isArray(player.character.inventory));
    assert.equal(player.character.inventory.length >= 3, true);
    assert.ok(player.character.equipmentSummary);
    assert.equal(typeof player.character.memo, "string");
  }

  for (const entry of finalRoom.transcript) {
    assert.ok(entry.id);
    assert.ok(entry.createdAt);
    assert.ok(entry.structuredLog, `missing structured log for transcript ${entry.id}`);
  }

  const logTypes = new Set(summary.payloadMetrics.logTypes);
  for (const requiredType of ["ai.decision", "dice.roll", "chat.message", "inventory.mutation", "state.transition"]) {
    assert.equal(logTypes.has(requiredType), true, `missing structured log type ${requiredType}`);
  }

  assert.equal(summary.payloadMetrics.structuredLogCount, finalRoom.transcript.length);
  assert.equal(summary.payloadMetrics.snapshotBytes < config.maxSnapshotBytes, true);
  assert.equal(summary.payloadMetrics.stateSummaryBytes < config.maxSummaryBytes, true);
  assert.equal(summary.payloadMetrics.logPayloadBytes < config.maxLogPayloadBytes, true);
  assert.equal(summary.payloadMetrics.maxSingleLogBytes < config.maxSingleLogBytes, true);
  assert.ok(stateSummary.quest);
  assert.ok(stateSummary.memory);

  assert.equal(recoveredRoom.version, finalRoom.version);
  assert.equal(recoveredRoom.round, finalRoom.round);
  assert.equal(recoveredRoom.activePlayerId, finalRoom.activePlayerId);
  assert.equal(recoveredRoom.transcript.length, finalRoom.transcript.length);
  assert.equal(recoveredRoom.memories.length, finalRoom.memories.length);
  assert.deepEqual(
    recoveredRoom.players.map((player) => [player.id, player.character.inventory.length, player.character.wallet]),
    finalRoom.players.map((player) => [player.id, player.character.inventory.length, player.character.wallet])
  );

  for (const check of summary.memoryChecks) {
    assert.equal(check.topSourceEventId, check.expected, `memory retrieval failed for ${check.expected}`);
    assert.equal(check.topScore > 0, true);
    assert.equal(check.matchedTokens.length >= 2, true);
  }

  assert.equal(summary.durationMs < config.maxDurationMs, true);
}

async function withDeterministicRandom(callback) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => {
    const value = RANDOM_SEQUENCE[index % RANDOM_SEQUENCE.length];
    index += 1;
    return value;
  };
  try {
    return await callback();
  } finally {
    Math.random = originalRandom;
  }
}

function byteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function readCliOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--turns") {
      options.turns = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--data-file") {
      options.dataFile = argv[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/simulate-long-campaign.mjs [options]

Options:
  --turns N          Table turns to simulate. Default: ${DEFAULT_CONFIG.turns}
  --data-file FILE   Persist the simulation store to FILE. Default: a /tmp file
`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const result = await runLongCampaignSimulation(readCliOptions(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}
