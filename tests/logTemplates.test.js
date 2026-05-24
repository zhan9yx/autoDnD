import test from "node:test";
import assert from "node:assert/strict";
import {
  aiDecision,
  assetSelection,
  chatMessage,
  diceRoll,
  error,
  inventoryMutation,
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
    assert.equal(typeof log.humanSummary.en, "string");
    assert.equal(typeof log.humanSummary.zh, "string");
    assert.equal(log.humanSummary.en.includes("[object Object]"), false);
    assert.equal(log.humanSummary.zh.includes("[object Object]"), false);
  }
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
  assert.equal(log.actorId, "aidm");
  assert.equal(log.correlationId, "corr-fixed");
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
  assert.equal(chat.message, "Chat message recorded on party.");
  assert.equal(chat.metadata.textLength, "password=dragon token=abc123 meet behind the shrine".length);
  assert.equal(chat.metadata.channel, "party");
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
  assert.deepEqual(Object.keys(soundscape.metadata.layers[0]), ["id", "type", "gain"]);
  assert.match(soundscape.humanSummary.zh, /环境音/);
  assert.equal(asset.metadata.candidates.length, 5);
  assert.equal(asset.metadata.candidateCount, 8);
  assert.match(asset.humanSummary.en, /Selected asset Rain Archive/);
  assert.doesNotMatch(JSON.stringify(asset), /hidden/);
});
