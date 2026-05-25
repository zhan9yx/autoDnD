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
    version: 7,
    round: 3,
    phase: "scene",
    director: {
      beat: "trail",
      questClock: { value: 4, previous: 3, delta: 1, trend: "up" },
      danger: { value: 2, previous: 3, delta: -1, trend: "down" },
      clues: { value: 4, previous: 3, delta: 1, trend: "up" },
      npcIntent: { type: "pressure", reason: "cutpurse probes the crowd" }
    },
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
    ],
    memories: [
      {
        id: "mem-1",
        kind: "lead",
        text: "The market seal points back to the ledger stall.",
        tags: ["market", "ledger"],
        sourceEventId: "evt_reward"
      }
    ],
    memos: [
      { id: "memo-1", visibility: "owner", pinned: true, text: "Ask about the seal." }
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
  assert.equal(summary.progress.version, 7);
  assert.equal(summary.progress.round, 3);
  assert.equal(summary.progress.latestEventId, "evt_reward");
  assert.equal(summary.trackers.clockTrends.quest.delta, 1);
  assert.equal(summary.trackers.clockTrends.danger.trend, "down");
  assert.equal(summary.memory.count, 1);
  assert.equal(summary.memory.recent[0].sourceEventId, "evt_reward");
  assert.equal(summary.memory.pinnedMemoCount, 1);
  assert.equal(summary.review.nextLevers.includes("surface-specific-clue"), true);
  assert.equal(summary.control.stateOwner, "rules-engine");
  assert.equal(summary.control.randomness, "bounded-by-scene-state");
  assert.equal(summary.control.stateChangeFields.includes("clockTrends"), true);
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
  assert.equal(summary.review.flags.includes("blocked-exit"), false);
  assert.equal(summary.review.nextLevers.includes("make-danger-visible"), true);
  assert.equal(summary.control.reviewFields.includes("npcIntent"), true);
  assert.equal(summary.control.controllableClocks.includes("quest"), true);
});

test("state summary exposes environment state and active player action guidance", () => {
  const summary = buildTableStateSummary({
    activePlayerId: "player_mage",
    phase: "scene",
    scene: {
      objective: "Open the winter shrine without alerting the guard.",
      location: "Snow-covered cistern shrine",
      weatherState: "thunderstorm",
      season: "winter",
      timeOfDay: "night",
      clocks: { quest: 2, clues: 1, danger: 5, deadline: 3 },
      atmosphere: {
        weather: "thunderstorm",
        season: "winter",
        timeOfDay: "night",
        mood: "danger",
        soundscapeTags: ["location:shrine", "weather:thunder", "season:winter", "time:night", "mood:danger"],
        reason: "danger-consequence",
        changed: true,
        previous: { weather: "light rain", season: "autumn", timeOfDay: "dusk", mood: "mystery" },
        atVersion: 9
      }
    },
    players: [
      {
        id: "player_mage",
        name: "Yixuan",
        character: { name: "Mira", classId: "mage", hp: 8, maxHp: 12, archetype: "Mage" }
      }
    ],
    quests: [{ id: "quest-shrine", title: "Open the shrine", status: "active", progress: 30, clues: ["frost seal"] }],
    director: { beat: "crisis", npcIntent: { type: "guard", reason: "ritual lock" } },
    combat: { state: "imminent", encounter: { enemies: [{ name: "Frost Guard", hp: 6, maxHp: 6, defense: 13 }] } },
    transcript: [{ id: "evt_gm", type: "gm", text: "The storm climbs over the shrine." }]
  }, {
    soundscape: { id: "shrine-cistern", profile: { weatherMix: { rain: "heavy", wind: "gale", thunderChance: 0.72, clear: false } } }
  });

  assert.equal(summary.environment.weather, "thunderstorm");
  assert.deepEqual(summary.environment.labels.season, { en: "Winter", zh: "冬季" });
  assert.equal(summary.environment.soundscapeTags.includes("season:winter"), true);
  assert.equal(summary.environment.soundscapeWeatherMix.thunderChance, 0.72);
  assert.equal(summary.scene.environment.change.reason, "danger-consequence");
  assert.equal(summary.turn.activePlayer.characterName, "Mira");
  assert.equal(summary.turn.shouldCallout, true);
  assert.match(summary.turn.prompt.en, /Mira's turn/);
  assert.equal(summary.turn.suggestions.some((entry) => entry.id === "reduce-danger"), true);
  assert.equal(summary.control.reviewFields.includes("environment"), true);
  assert.equal(summary.control.stateChangeFields.includes("activePlayerId"), true);
});

test("state summary gives concrete action suggestions for active character tools", () => {
  const summary = buildTableStateSummary({
    activePlayerId: "player_bard",
    phase: "scene",
    scene: {
      objective: "Convince the dock witness and reach the locked pier.",
      location: "Rain-dark dock gate",
      ambience: "night rain and lantern glare",
      clocks: { quest: 2, clues: 1, danger: 5, deadline: 2 },
      exits: [
        { id: "exit-pier", target: "pier", label: { en: "Locked pier", zh: "锁住的码头" }, available: false }
      ]
    },
    players: [
      {
        id: "player_bard",
        name: "Yixuan",
        character: {
          name: "Lio",
          classId: "bard",
          hp: 5,
          maxHp: 10,
          skills: { persuasion: 6, insight: 5, investigation: 4, medicine: 3, guard: 1 },
          knownSpells: ["mirror-lure", "steady-breath", "echo-ledger"],
          inventory: [
            { itemId: "field-notebook", displayName: { en: "Field Notebook", zh: "现场笔记" } }
          ]
        }
      },
      {
        id: "player_guard",
        name: "Nia",
        character: { name: "Nia", classId: "warrior" }
      }
    ],
    quests: [{ id: "quest-pier", title: "Reach the pier", status: "active", progress: 20, clues: [] }],
    director: { beat: "complication", npcIntent: { type: "bargain", label: { en: "Offer a bargain", zh: "提出交易" }, reason: "witness wants safety" } },
    combat: {
      state: "hostile",
      encounter: {
        enemies: [
          { id: "dock_enforcer_01", name: "Dock Enforcer", displayName: { en: "Dock Enforcer", zh: "码头打手" }, hp: 10, maxHp: 10, defense: 13, role: "brute", conditions: ["marked"], statusEffects: [{ id: "distracted", duration: 1 }] }
        ]
      }
    },
    transcript: [{ id: "evt_combat", type: "combat", combat: { localizedMessage: { en: "Lio acted.", zh: "Lio 完成行动。" } }, text: "Lio acted." }]
  });

  const modes = summary.turn.suggestions.map((entry) => entry.mode);
  assert.equal(modes.includes("attack"), true);
  assert.equal(modes.includes("spell"), true);
  assert.equal(modes.includes("move"), true);
  assert.equal(modes.includes("scout"), true);
  assert.equal(modes.includes("social"), true);
  assert.equal(modes.includes("item"), true);
  assert.equal(modes.includes("assist"), true);
  assert.equal(summary.turn.suggestions.find((entry) => entry.mode === "spell").spellLabel.zh, "镜诱");
  assert.equal(summary.turn.suggestions.find((entry) => entry.mode === "item").itemLabel.zh, "现场笔记");
  assert.equal(summary.turn.suggestions.find((entry) => entry.mode === "attack").target.label.zh, "码头打手");
  assert.deepEqual(summary.combat.enemies[0].conditions.map((entry) => entry.label.zh), ["标记", "分心"]);
  assert.doesNotMatch(JSON.stringify(summary.turn.suggestions.map((entry) => entry.label.zh)), /dock_enforcer_01|mirror-lure|debug/i);
});

test("localized combat latest change prefers safe spell labels over internal ids", () => {
  const summary = buildTableStateSummary({
    scene: { objective: "守住门厅", clocks: { clues: 1, danger: 4, deadline: 1 } },
    combat: { state: "combat", encounter: { enemies: [] } },
    transcript: [
      {
        id: "evt_spell",
        type: "combat",
        text: "Ash Scribe cast blood-moon-hex on Lio",
        combat: { localizedMessage: { en: "Ash Scribe cast Blood Moon Hex on Lio.", zh: "灰烬书记对 Lio 施放了血月咒。" } }
      }
    ]
  });

  assert.match(summary.latestChange.detail.zh, /血月咒/);
  assert.doesNotMatch(summary.latestChange.detail.zh, /blood-moon-hex|debug/i);
});

test("state summary keeps long memory and review context bounded", () => {
  const summary = buildTableStateSummary({
    version: 22,
    round: 6,
    phase: "scene",
    scene: {
      objective: "Recover the ledger before the balcony locks.",
      location: "Archive gate",
      clocks: { quest: 4, clues: 5, danger: 5, deadline: 4 },
      blockedExit: { reason: "route-not-established" }
    },
    director: {
      beat: "crisis",
      questClock: { value: 4, previous: 4, trend: "steady" },
      danger: { value: 5, previous: 3, delta: 2, trend: "up" },
      clues: { value: 5, previous: 4, delta: 1, trend: "up" },
      npcIntent: { type: "pressure", reason: "danger clock is near full" }
    },
    memories: Array.from({ length: 6 }, (_, index) => ({
      id: `mem-${index}`,
      kind: "event",
      text: `Memory ${index} describes the archive ledger trail and the cistern bargain in bounded detail.`,
      tags: ["archive", "ledger", `m${index}`],
      sourceEventId: `evt-${index}`
    })),
    transcript: [{ id: "evt_gm", type: "gm", text: "The balcony lock clicks into place." }]
  });

  assert.equal(summary.memory.count, 6);
  assert.equal(summary.memory.recent.length, 3);
  assert.equal(summary.memory.recent[0].sourceEventId, "evt-5");
  assert.equal(summary.review.flags.includes("danger-critical"), true);
  assert.equal(summary.review.flags.includes("revelation-ready"), true);
  assert.equal(summary.review.flags.includes("blocked-exit"), true);
  assert.equal(summary.review.nextLevers.length <= 4, true);
  assert.equal(summary.progress.clockTrends.danger.delta, 2);
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
