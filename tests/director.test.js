import test from "node:test";
import assert from "node:assert/strict";
import { applyDirectorBeat, createDirectorState } from "../src/core/director.js";
import { createRoomState, addPlayer } from "../src/core/stateMachine.js";

test("director state starts with rule-safe directives", () => {
  const director = createDirectorState("mystery");

  assert.equal(director.beat, "hook");
  assert.equal(director.pressure, 1);
  assert.equal(director.directives.some((entry) => entry.includes("rules")), true);
});

test("successful checks advance clue clocks and revelation beats", () => {
  const room = createRoomState({ title: "Director Test" });
  const player = addPlayer(room, { playerName: "Ari", characterName: "Ari" });
  room.scene.clocks.clues = 4;
  room.scene.clocks.danger = 2;

  const director = applyDirectorBeat(room, {
    player,
    actionText: "carefully decode the silver ledger",
    check: { success: true, total: 18, dc: 10 }
  });

  assert.equal(room.scene.clocks.clues, 6);
  assert.equal(room.scene.clocks.danger, 1);
  assert.equal(director.beat, "revelation");
  assert.equal(director.act, 2);
});

test("failed aggressive checks produce retaliation pressure", () => {
  const room = createRoomState({ title: "Director Test" });
  const player = addPlayer(room, { playerName: "Bo", characterName: "Bo" });

  const director = applyDirectorBeat(room, {
    player,
    actionText: "attack the masked guard",
    check: { success: false, total: 6, dc: 15 }
  });

  assert.equal(room.scene.clocks.danger, 3);
  assert.equal(room.scene.clocks.deadline, 3);
  assert.equal(director.beat, "retaliation");
  assert.equal(director.directives.some((entry) => entry.includes("combat rules")), true);
});
