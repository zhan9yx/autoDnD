import test from "node:test";
import assert from "node:assert/strict";
import { buildTableStateSummary } from "../src/core/stateSummary.js";

test("table state summary exposes bounded player-facing progress and media state", () => {
  const room = {
    scene: {
      title: "City Market",
      location: "Glass-roofed market street",
      objective: "Use the crowd to trace the next lead.",
      ambience: "vendors and wet stone",
      lastShiftReason: "market-action",
      clocks: { clues: 4, danger: 2, deadline: 3 },
      exits: [
        { id: "exit-forest", target: "forest", label: { en: "Outer old forest", zh: "城外古林" }, available: true }
      ]
    },
    director: { beat: "trail" },
    quests: [
      { id: "quest-ledger", title: "Recover the ledger", status: "active", progress: 60, clues: ["market seal"] }
    ],
    combat: {
      state: "imminent",
      encounter: {
        enemies: [
          { name: "Lantern Cutpurse", hp: 4, maxHp: 8, defense: 12, role: "skirmisher" },
          { name: "Brass Enforcer", hp: 13, maxHp: 14, defense: 15, role: "brute" }
        ]
      },
      tacticalIntent: { type: "pressure-low-defense", reason: "exploit opening" }
    },
    transcript: [
      {
        id: "evt_reward",
        type: "reward",
        text: "Lio obtained a key.",
        reward: {
          name: "archive-key",
          displayName: { en: "Archive Key", zh: "档案馆钥匙" }
        }
      }
    ]
  };
  const soundscape = { id: "market-city", label: "Market and City Streets", reason: "Location matched market; pressure 0.33." };
  const presentation = { sceneAsset: { id: "scene-market", name: "Rain Market", transition: "slow-crossfade" } };

  const summary = buildTableStateSummary(room, { soundscape, presentation });

  assert.equal(summary.objective, room.scene.objective);
  assert.deepEqual(summary.beat.label, { en: "Trail", zh: "追踪" });
  assert.deepEqual(summary.clocks.clues, { id: "clues", value: 4, max: 6, ratio: 0.67 });
  assert.equal(summary.quest.progress, 60);
  assert.equal(summary.scene.exits[0].target, "forest");
  assert.equal(summary.media.sceneAssetId, "scene-market");
  assert.equal(summary.media.soundscapeId, "market-city");
  assert.equal(summary.combat.mostDangerous.name, "Brass Enforcer");
  assert.equal(summary.latestChange.type, "reward");
  assert.equal(summary.control.stateOwner, "rules-engine");
  assert.equal(summary.control.randomness, "bounded-by-scene-state");
});

test("chat-only latest changes are marked unchanged for state control", () => {
  const summary = buildTableStateSummary({
    scene: { objective: "Keep watch", clocks: { clues: 1, danger: 1, deadline: 1 } },
    director: { beat: "discovery" },
    transcript: [{ id: "evt_chat", type: "chat", text: "Can we pause here?" }]
  });

  assert.equal(summary.latestChange.type, "chat");
  assert.equal(summary.control.status, "unchanged");
});

test("state summary exposes simple quest, danger, clue, consequence, scene, and NPC trackers", () => {
  const summary = buildTableStateSummary({
    scene: {
      objective: "Hold the archive gate",
      location: "Archive gate",
      clocks: { quest: 3, clues: 2, danger: 4, deadline: 3 },
      currentLead: { id: "lead-ash", kind: "clue", clock: "clues", label: { en: "Blue ash", zh: "蓝灰" } },
      activeConsequences: [{ id: "danger-guard", kind: "danger", clock: "danger", severity: "major", label: { en: "Guard alerted", zh: "守卫警觉" } }],
      lastEvolutionReason: "danger-consequence"
    },
    quests: [{ id: "quest-ledger", title: "Recover the ledger", status: "active", progress: 50, clues: ["ash", "seal"] }],
    director: { beat: "complication", npcIntent: { type: "bargain", reason: "recoverable failure" } },
    combat: { state: "imminent", encounter: { enemies: [] } },
    transcript: [{ id: "evt_gm", type: "gm", text: "The guard hears the failed attempt." }]
  });

  assert.equal(summary.clocks.quest.value, 3);
  assert.equal(summary.questClock.questId, "quest-ledger");
  assert.equal(summary.questClock.progress, 50);
  assert.equal(summary.trackers.danger.value, 4);
  assert.equal(summary.trackers.clues.value, 2);
  assert.equal(summary.trackers.consequences[0].id, "danger-guard");
  assert.equal(summary.trackers.sceneChange.changed, true);
  assert.equal(summary.trackers.sceneChange.lastEvolutionReason, "danger-consequence");
  assert.equal(summary.npcIntent.type, "bargain");
  assert.equal(summary.control.reviewFields.includes("npcIntent"), true);
  assert.equal(summary.control.controllableClocks.includes("quest"), true);
});

test("Chinese state summary labels avoid raw debug ids on player surfaces", () => {
  const summary = buildTableStateSummary({
    scene: { objective: "守住门厅", clocks: { clues: 2, danger: 3, deadline: 1 } },
    combat: { state: "unexpected-debug-state", encounter: { enemies: [] } },
    transcript: [{ id: "evt_gm", type: "gm", author: "AIDM", text: "门厅里的脚步声更近了。" }]
  });

  assert.deepEqual(summary.clockLabels.danger, { en: "Threat", zh: "威胁" });
  assert.deepEqual(summary.clockLabels.clues, { en: "Clues", zh: "线索" });
  assert.equal(summary.latestChange.label.zh, "主持人推进");
  assert.equal(summary.combat.stateLabel.zh, "未知状态");
  assert.doesNotMatch(summary.latestChange.label.zh, /AIDM|gm/i);
  assert.doesNotMatch(summary.combat.stateLabel.zh, /unexpected-debug-state|debug/i);
});
