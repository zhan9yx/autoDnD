import test from "node:test";
import assert from "node:assert/strict";
import {
  aiDecision,
  assetSelection,
  chatMessage,
  combatCalculation,
  diceRoll,
  error,
  inventoryMutation,
  memoryRetrieval,
  soundscapeSwitch,
  stateTransition
} from "../src/core/logTemplates.js";

const fixedTime = "2026-05-24T01:02:03.000Z";
const requiredFields = [
  "type",
  "scope",
  "severity",
  "roomId",
  "turnId",
  "actorId",
  "eventId",
  "category",
  "action",
  "result",
  "messageKey",
  "template",
  "message",
  "humanSummary",
  "metadata",
  "timestamp",
  "correlationId"
];

test("structured log templates emit complete common fields and valid timestamps", () => {
  const templates = [
    aiDecision({
      roomId: "room-1",
      turnId: "turn-2",
      actorId: "aidm",
      eventId: "evt-ai",
      decision: "reveal the ledger clue",
      rationale: ["player succeeded the archive check"],
      constraints: ["do not reveal the hidden patron"],
      result: "new clue added",
      timestamp: fixedTime,
      correlationId: "corr-ai"
    }),
    stateTransition({
      roomId: "room-1",
      turnId: "turn-2",
      eventId: "evt-state",
      from: "lobby",
      to: "scene",
      timestamp: fixedTime
    }),
    diceRoll({
      roomId: "room-1",
      turnId: "turn-2",
      actorId: "player-1",
      eventId: "evt-roll",
      expression: "1d20+3",
      rolls: [14],
      modifier: 3,
      total: 17,
      dc: 15,
      timestamp: fixedTime
    }),
    memoryRetrieval({
      roomId: "room-1",
      turnId: "turn-2",
      eventId: "evt-memory",
      queryId: "Q001",
      queryLabel: "ledger clue",
      hitCount: 2,
      retrievedIds: ["E001", "E002"],
      timestamp: fixedTime
    }),
    combatCalculation({
      roomId: "room-1",
      turnId: "turn-2",
      actorId: "fighter",
      eventId: "evt-combat",
      action: "attack",
      targetId: "skirmisher",
      total: 18,
      defense: 12,
      damage: 7,
      result: "hit",
      timestamp: fixedTime
    }),
    inventoryMutation({
      roomId: "room-1",
      turnId: "turn-2",
      actorId: "player-1",
      eventId: "evt-inv",
      action: "use",
      itemId: "storm-lantern",
      itemLabel: "Storm Lantern",
      quantityDelta: -1,
      timestamp: fixedTime
    }),
    soundscapeSwitch({
      roomId: "room-1",
      eventId: "evt-sound",
      fromId: "rain",
      toId: "storm",
      intensity: 0.82,
      timestamp: fixedTime
    }),
    assetSelection({
      roomId: "room-1",
      eventId: "evt-asset",
      assetId: "scene-rainy-archive",
      assetName: "Rainy Archive",
      reason: "rain scene",
      timestamp: fixedTime
    }),
    chatMessage({
      roomId: "room-1",
      actorId: "player-1",
      eventId: "evt-chat",
      channel: "party",
      text: "meet by the archive",
      timestamp: fixedTime
    }),
    error({
      roomId: "room-1",
      eventId: "evt-error",
      code: "STORE_FAILED",
      errorMessage: "save failed",
      timestamp: fixedTime
    })
  ];

  for (const log of templates) {
    for (const field of requiredFields) {
      assert.equal(Object.hasOwn(log, field), true, `${log.type} is missing ${field}`);
    }
    assert.equal(log.timestamp, fixedTime);
    assert.equal(new Date(log.timestamp).toISOString(), fixedTime);
    assert.equal(typeof log.message, "string");
    assert.equal(typeof log.category, "string");
    assert.equal(typeof log.action, "string");
    assert.equal(typeof log.result, "string");
    assert.equal(typeof log.messageKey, "string");
    assert.equal(typeof log.template.en, "string");
    assert.equal(typeof log.template.zh, "string");
    assert.equal(typeof log.template.params, "object");
    assert.equal(typeof log.humanSummary.en, "string");
    assert.equal(typeof log.humanSummary.zh, "string");
    assert.equal(log.humanSummary.en.includes("[object Object]"), false);
    assert.equal(log.humanSummary.zh.includes("[object Object]"), false);
  }
});

test("AI DM, state, rules, memory, combat, asset, and soundscape logs expose queryable template fields", () => {
  const decision = aiDecision({
    roomId: "room-fields",
    decision: "narrate consequence",
    result: "clue revealed",
    timestamp: fixedTime
  });
  const transition = stateTransition({
    roomId: "room-fields",
    from: "lobby",
    to: "scene",
    action: "start-room",
    result: "scene",
    timestamp: fixedTime
  });
  const rule = diceRoll({
    roomId: "room-fields",
    expression: "1d20+2",
    rolls: [16],
    modifier: 2,
    total: 18,
    dc: 12,
    timestamp: fixedTime
  });
  const memory = memoryRetrieval({
    roomId: "room-fields",
    queryId: "Q-ledger",
    queryLabel: "ledger clue",
    hitCount: 1,
    topResult: { sourceEventId: "E-ledger" },
    retrievedIds: ["E-ledger"],
    timestamp: fixedTime
  });
  const combat = combatCalculation({
    roomId: "room-fields",
    actorId: "fighter",
    actorName: "Borin",
    targetId: "skirmisher",
    targetName: "Lantern Cutpurse",
    total: 18,
    defense: 12,
    damage: 7,
    result: "hit",
    timestamp: fixedTime
  });
  const soundscape = soundscapeSwitch({
    roomId: "room-fields",
    fromId: "mystery",
    toId: "light-rain",
    result: "light-rain",
    timestamp: fixedTime
  });
  const asset = assetSelection({
    roomId: "room-fields",
    assetId: "scene-rain-archive",
    assetName: "Rain Archive",
    result: "scene.rain.archive",
    timestamp: fixedTime
  });

  assert.deepEqual(
    [decision.category, transition.category, rule.category, memory.category, combat.category, soundscape.category, asset.category],
    ["ai-dm", "state", "rules", "memory", "combat", "soundscape", "asset"]
  );
  assert.deepEqual(
    [decision.action, transition.action, rule.action, memory.action, combat.action, soundscape.action, asset.action],
    ["decide", "start-room", "resolve-check", "retrieve", "attack", "switch", "select"]
  );
  assert.deepEqual(
    [decision.result, transition.result, rule.result, memory.result, combat.result, soundscape.result, asset.result],
    ["clue revealed", "scene", "success", "retrieved", "hit", "light-rain", "scene.rain.archive"]
  );
  assert.deepEqual(
    [decision.messageKey, transition.messageKey, rule.messageKey, memory.messageKey, combat.messageKey, soundscape.messageKey, asset.messageKey],
    ["ai.dm.decision", "state.transition", "rules.check.resolved", "memory.retrieval", "combat.calculation", "soundscape.switch", "asset.selection"]
  );
  assert.match(decision.template.en, /AI DM decision/);
  assert.match(decision.template.zh, /AI DM 决策/);
  assert.match(transition.template.en, /\{from\} -> \{to\}/);
  assert.match(rule.template.zh, /规则判定/);
  assert.match(memory.template.zh, /记忆检索/);
  assert.match(combat.template.en, /Combat calculation/);
  assert.match(soundscape.template.zh, /音景切换/);
  assert.match(asset.template.en, /Asset selection/);
  assert.equal(decision.template.params.decision, "narrate consequence");
  assert.equal(decision.template.params.result, "clue revealed");
  assert.equal(memory.template.params.topResult, "E-ledger");
  assert.equal(combat.template.params.damage, 7);
});

test("AI DM logs carry reviewable clocks, scene changes, NPC intent, and memory references", () => {
  const log = aiDecision({
    roomId: "room-review",
    decision: "offer a risky bargain",
    result: "recoverable complication",
    beat: "complication",
    scene: { en: "Rain archive gate", zh: "雨中的档案馆门口" },
    clocks: {
      quest: { id: "quest", value: 3, max: 6 },
      clues: { id: "clues", value: 2, max: 6 },
      danger: { id: "danger", value: 4, max: 6 },
      deadline: { id: "deadline", value: 3, max: 6 }
    },
    consequence: { en: "Guard alerted", zh: "守卫警觉" },
    sceneChange: { type: "pressure-without-location-jump" },
    npcIntent: { type: "bargain", reason: "failure leaves a recoverable option" },
    memoryRefs: ["E0012", "E0044"],
    timestamp: fixedTime
  });

  assert.match(log.message, /Quest quest:3\/6; danger danger:4\/6; clues clues:2\/6/);
  assert.match(log.message, /NPC intent: bargain/);
  assert.equal(log.template.params.beat, "complication");
  assert.equal(log.template.params.scene, "Rain archive gate");
  assert.equal(log.template.params.consequence, "Guard alerted");
  assert.equal(log.metadata.questClock, "quest:3/6");
  assert.equal(log.metadata.dangerClock, "danger:4/6");
  assert.equal(log.metadata.clueClock, "clues:2/6");
  assert.equal(log.metadata.deadlineClock, "deadline:3/6");
  assert.equal(log.metadata.sceneChange, "pressure-without-location-jump");
  assert.equal(log.metadata.npcIntent, "bargain");
  assert.deepEqual(log.metadata.memoryRefs, ["E0012", "E0044"]);
  assert.equal(log.metadata.searchTags.includes("ai-dm"), true);
});

test("AI DM decision logs preserve decision basis, constraints, and result without sensitive values", () => {
  const log = aiDecision({
    roomId: "room-7",
    turnId: "turn-4",
    actorId: "aidm",
    eventId: "evt-99",
    decision: "offer a risky bargain",
    rationale: ["failed persuasion check", "danger clock reached 4"],
    constraints: ["preserve player agency", "hide antagonist apiKey=sk-live-secret"],
    result: "complication added",
    provider: "local",
    model: "fallback-narrator",
    metadata: {
      promptChars: 420,
      playerToken: "player-token-123",
      nested: { password: "open-sesame" }
    },
    timestamp: fixedTime,
    correlationId: "corr-fixed"
  });

  assert.equal(log.type, "ai.decision");
  assert.equal(log.scope, "ai-dm");
  assert.equal(log.category, "ai-dm");
  assert.equal(log.action, "decide");
  assert.equal(log.result, "complication added");
  assert.equal(log.messageKey, "ai.dm.decision");
  assert.equal(log.actorId, "aidm");
  assert.equal(log.correlationId, "corr-fixed");
  assert.match(log.template.en, /AI DM decision/);
  assert.match(log.template.zh, /AI DM 决策/);
  assert.deepEqual(log.metadata.rationale, ["failed persuasion check", "danger clock reached 4"]);
  assert.deepEqual(log.metadata.constraints, ["preserve player agency", "hide antagonist apiKey=[redacted]"]);
  assert.equal(log.metadata.result, "complication added");
  assert.equal(log.metadata.provider, "local");
  assert.equal(log.metadata.playerToken, "[redacted]");
  assert.equal(log.metadata.nested.password, "[redacted]");
  assert.match(log.humanSummary.en, /AI DM chose offer a risky bargain/);
  assert.match(log.humanSummary.zh, /AI DM 决策/);
  assert.doesNotMatch(JSON.stringify(log), /sk-live-secret|player-token-123|open-sesame/);
});

test("chat and error templates avoid leaking raw user text, tokens, passwords, or stack traces", () => {
  const chat = chatMessage({
    type: "raw.override",
    roomId: "room-secret",
    actorId: "player-2",
    channel: "party",
    message: "raw table text should not become the log message",
    text: "password=dragon token=abc123 meet behind the shrine",
    timestamp: fixedTime
  });

  assert.equal(chat.type, "chat.message");
  assert.equal(chat.message, "Chat message recorded on party. Result: content hidden.");
  assert.equal(chat.metadata.textLength, "password=dragon token=abc123 meet behind the shrine".length);
  assert.equal(chat.metadata.channel, "party");
  assert.equal(chat.result, "content-hidden");
  assert.match(chat.humanSummary.en, /content hidden/);
  assert.doesNotMatch(JSON.stringify(chat), /dragon|abc123|meet behind|raw table text/);

  const thrown = new Error("provider failed with Bearer sk-test-token and password=hunter2");
  thrown.code = "AI_PROVIDER_FAILED";
  thrown.statusCode = 502;
  thrown.stack = "stack should stay private";
  const loggedError = error({
    roomId: "room-secret",
    error: thrown,
    context: {
      route: "narrate",
      apiKey: "sk-live-private",
      nested: { token: "nested-token" }
    },
    timestamp: fixedTime
  });

  assert.equal(loggedError.type, "error");
  assert.equal(loggedError.severity, "error");
  assert.equal(loggedError.metadata.code, "AI_PROVIDER_FAILED");
  assert.equal(loggedError.metadata.statusCode, 502);
  assert.equal(loggedError.metadata.context.apiKey, "[redacted]");
  assert.equal(loggedError.metadata.context.nested.token, "[redacted]");
  assert.equal(Object.hasOwn(loggedError.metadata, "stack"), false);
  assert.doesNotMatch(JSON.stringify(loggedError), /sk-test-token|hunter2|sk-live-private|nested-token|stack should stay private/);
});

test("media templates keep readable summaries and bounded metadata", () => {
  const soundscape = soundscapeSwitch({
    roomId: "room-2",
    fromId: "calm-night",
    toId: "rain",
    intensity: 0.64,
    layers: [
      { id: "steady-rain", type: "weather", gain: 0.7, internalBuffer: "not copied" },
      { id: "stone-drips", type: "water", gain: 0.4 }
    ],
    visualHints: ["wet stone", "mist"],
    assetHints: ["rainy archive"],
    timestamp: fixedTime
  });
  const asset = assetSelection({
    roomId: "room-2",
    assetId: "scene-archive-rain",
    assetName: "Rain Archive",
    reason: "rain",
    candidates: Array.from({ length: 8 }, (_, index) => ({ id: `asset-${index}`, score: 10 - index, secret: "hidden" })),
    timestamp: fixedTime
  });

  assert.equal(soundscape.metadata.layers.length, 2);
  assert.equal(soundscape.category, "soundscape");
  assert.equal(soundscape.action, "switch");
  assert.equal(soundscape.result, "rain");
  assert.deepEqual(Object.keys(soundscape.metadata.layers[0]), ["id", "type", "gain"]);
  assert.match(soundscape.humanSummary.zh, /环境音/);
  assert.equal(asset.metadata.candidates.length, 5);
  assert.equal(asset.category, "asset");
  assert.equal(asset.action, "select");
  assert.equal(asset.result, "scene-archive-rain");
  assert.equal(asset.metadata.candidateCount, 8);
  assert.match(asset.humanSummary.en, /Selected asset Rain Archive/);
  assert.doesNotMatch(JSON.stringify(asset), /hidden/);
});
