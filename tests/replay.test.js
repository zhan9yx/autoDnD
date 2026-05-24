import test from "node:test";
import assert from "node:assert/strict";
import { buildReplay, renderReplayMarkdown } from "../src/core/replay.js";
import { createRoomState, addPlayer, appendTranscript } from "../src/core/stateMachine.js";

test("builds replay summaries from transcript, players, quests, and memories", () => {
  const room = createRoomState({ title: "Replay Test" });
  addPlayer(room, {
    playerName: "Yixuan",
    characterName: "Lio",
    species: "elf",
    classId: "ranger"
  });
  appendTranscript(room, { type: "gm", author: "AIDM", text: "The archive opens." });
  appendTranscript(room, {
    type: "roll",
    author: "Rules",
    text: "Lio rolled 1d20+3: 18 + 3 = 21 vs DC 12",
    roll: { success: true }
  });
  room.memories.push({ id: "mem_1", kind: "lead", text: "Lio found a silver ledger clue.", weight: 2 });

  const replay = buildReplay(room);

  assert.equal(replay.title, "Replay Test");
  assert.equal(replay.players[0].className, "Ranger");
  assert.equal(replay.highlights.length, 2);
  assert.match(replay.shareText, /Replay Test/);
});

test("builds Chinese replay share text for Chinese rooms", () => {
  const room = createRoomState({ title: "雨档案馆", language: "zh" });
  room.round = 2;
  addPlayer(room, {
    playerName: "林",
    characterName: "阿林",
    archetype: "Investigator",
    species: "human",
    classId: "rogue"
  });
  room.memories.push({ id: "mem_1", kind: "lead", text: "线索已确认", weight: 2 });

  const replay = buildReplay(room);

  assert.match(replay.shareText, /雨档案馆：1 名玩家推进到第 2 轮。线索已确认/);
  assert.doesNotMatch(replay.shareText, /players reached round|No report yet/i);
});

test("renders deterministic markdown battle report", () => {
  const room = createRoomState({ title: "Markdown Test" });
  addPlayer(room, { playerName: "Mei", characterName: "Mei" });
  appendTranscript(room, { type: "gm", author: "AIDM", text: "A clue appears." });

  const markdown = renderReplayMarkdown(room);

  assert.match(markdown, /^# Markdown Test/);
  assert.match(markdown, /## Party/);
  assert.match(markdown, /## Timeline/);
});
