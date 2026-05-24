import test from "node:test";
import assert from "node:assert/strict";
import { applyDirectorBeat, createDirectorState } from "../src/core/director.js";
import { createRoomState, addPlayer } from "../src/core/stateMachine.js";

test("director state starts with rule-safe directives", () => {
  const director = createDirectorState("mystery");

  assert.equal(director.beat, "hook");
  assert.equal(director.pressure, 1);
  assert.deepEqual(director.questClock, { value: 0, max: 6, trend: "steady" });
  assert.equal(director.npcIntent.type, "none");
  assert.deepEqual(director.stateDeltas, { quest: 0, clues: 0, danger: 0, deadline: 0 });
  assert.equal(director.decisionFrame.allowedSceneShift, false);
  assert.equal(director.knowledge.framework, "repo-local-srd-style");
  assert.equal(director.knowledge.sources.some((source) => source.license === "CC-BY-4.0"), true);
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
  assert.equal(room.scene.clocks.quest, 6);
  assert.equal(room.scene.clocks.danger, 1);
  assert.equal(director.beat, "revelation");
  assert.equal(director.act, 2);
  assert.equal(director.questClock.trend, "up");
  assert.equal(director.questClock.previous, 4);
  assert.equal(director.questClock.delta, 2);
  assert.equal(director.clues.trend, "up");
  assert.equal(director.danger.trend, "down");
  assert.deepEqual(director.stateDeltas, { quest: 2, clues: 2, danger: -1, deadline: 0 });
  assert.equal(director.npcIntent.type, "reveal");
  assert.equal(director.memoryQuery.label, "revelation:success");
  assert.equal(director.decisionFrame.continuityRisk, "low");
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
  assert.equal(room.scene.clocks.quest, 0);
  assert.equal(director.beat, "retaliation");
  assert.equal(director.consequence.type, "retaliation");
  assert.equal(director.sceneChange.type, "pressure-without-location-jump");
  assert.equal(director.npcIntent.type, "counterattack");
  assert.equal(director.stateDeltas.danger, 2);
  assert.equal(director.stateDeltas.deadline, 1);
  assert.equal(director.decisionFrame.actionIntent, "hostile");
  assert.equal(director.decisionFrame.continuityRisk, "watch");
  assert.equal(director.directives.some((entry) => entry.includes("combat rules")), true);
});

test("director attaches SRD-style knowledge, action advice, and weather season hooks", () => {
  const room = createRoomState({ title: "Knowledge Test" });
  const player = addPlayer(room, {
    playerName: "Cyra",
    characterName: "Cyra",
    classId: "ranger",
    species: "elf"
  });
  room.scene.weather = "thunderstorm";
  room.scene.season = "winter";
  room.scene.ambience = "cold rain and close thunder";

  const director = applyDirectorBeat(room, {
    player,
    actionText: "track the courier through the storm",
    check: { success: false, total: 8, dc: 14 }
  });

  assert.equal(director.knowledge.environment.weather, "storm");
  assert.equal(director.knowledge.environment.season, "winter");
  assert.equal(director.knowledge.actionGuidance.intent, "travel");
  assert.equal(director.knowledge.actionGuidance.suggestions.some((entry) => entry.skill === "survival"), true);
  assert.equal(director.knowledge.randomness.twistPressure, "complication");
  assert.equal(director.memoryQuery.terms.includes("storm") || director.memoryQuery.terms.includes("thunderstorm"), true);
  assert.deepEqual(director.decisionFrame.knowledge.sourceIds, ["dnd-srd-5.2.1", "dnd-srd-5.1-cc"]);
  assert.equal(director.directives.some((entry) => entry.includes("Environment hook")), true);
  assert.equal(director.directives.some((entry) => entry.includes("do not quote long rules text")), true);
});

test("director keeps explicit spring scene season when leaf ambience suggests autumn", () => {
  const room = createRoomState({ title: "Season Priority Test" });
  const player = addPlayer(room, {
    playerName: "Mira",
    characterName: "Mira",
    classId: "ranger",
    species: "human"
  });
  room.scene.weatherState = "light rain";
  room.scene.season = "spring";
  room.scene.atmosphere = {
    season: "spring",
    weather: "light rain",
    soundscapeTags: ["location:forest", "season:spring", "weather:light-rain"]
  };
  room.scene.ambience = "wet leaves, harvest carts, and moss under the canopy";

  const director = applyDirectorBeat(room, {
    player,
    actionText: "inspect the leaf marks near the trail",
    check: { success: true, total: 17, dc: 12 }
  });

  assert.equal(director.knowledge.environment.weather, "rain");
  assert.equal(director.knowledge.environment.season, "spring");
  assert.equal(director.knowledge.environment.tags.includes("season:spring"), true);
  assert.equal(director.decisionFrame.knowledge.environment.season, "spring");
});
