import test from "node:test";
import assert from "node:assert/strict";
import { resolveEventTriggerFixture } from "../src/core/eventJournal.js";
import { addPlayer, advanceTurn, appendTranscript, assertActivePlayer, createRoomState, startRoom } from "../src/core/stateMachine.js";

test("enforces active player turn order", () => {
  const room = createRoomState({ title: "Turn Test" });
  const first = addPlayer(room, { playerName: "A", characterName: "Aria" });
  const second = addPlayer(room, { playerName: "B", characterName: "Bram" });
  startRoom(room);

  assert.doesNotThrow(() => assertActivePlayer(room, first.id));
  assert.throws(() => assertActivePlayer(room, second.id), /Aria|another player/);

  advanceTurn(room);
  assert.equal(room.activePlayerId, second.id);
  assert.doesNotThrow(() => assertActivePlayer(room, second.id));
});

test("event resolution transcript logs preserve state delta and next player hook", () => {
  const room = createRoomState({ title: "Event Loop" });
  const player = addPlayer(room, { playerName: "Lio", characterName: "Lio" });
  startRoom(room);

  const eventResolution = resolveEventTriggerFixture("failed-check", {
    actorId: player.id,
    sceneId: "rain-archive",
    round: room.round,
    beforeState: { danger: 1, clues: 0 },
    afterState: { danger: 2, clues: 0 },
    visibleConsequence: "The lock clicks loudly and a patrol changes route.",
    hiddenConsequence: "Fixture severity high; no private prompt text stored.",
    nextHook: "Ask Lio whether to hide, bargain, or force the archive door.",
    severity: "high"
  });
  const beforeVersion = room.version;
  const entry = appendTranscript(room, {
    type: "event-resolution",
    author: "Rules",
    playerId: player.id,
    text: eventResolution.visibleConsequence,
    eventResolution,
    fromVersion: beforeVersion,
    toVersion: beforeVersion + 1
  });

  assert.equal(entry.structuredLog.type, "event.progression");
  assert.equal(entry.structuredLog.action, "resolve-event");
  assert.equal(entry.structuredLog.severity, "warn");
  assert.equal(entry.structuredLog.metadata.transcriptType, "event-resolution");
  assert.equal(entry.structuredLog.metadata.trigger.id, "failed-check");
  assert.equal(entry.structuredLog.metadata.stateDelta.danger, 1);
  assert.equal(entry.structuredLog.metadata.stateDelta.clues, 0);
  assert.equal(entry.structuredLog.metadata.nextHook, "Ask Lio whether to hide, bargain, or force the archive door.");
  assert.equal(entry.structuredLog.metadata.audit.storesPrivatePromptText, false);
  assert.match(entry.structuredLog.message, /Event progression Failed check/);
});
