import test from "node:test";
import assert from "node:assert/strict";
import { buildPresentation, chooseRewardAsset, chooseSceneAsset, findRewardSource, matchesRewardIntent } from "../src/core/assetSelection.js";

const room = {
  id: "room_test",
  version: 7,
  tone: "mystery",
  scene: {
    title: "Forest Trail",
    location: "Misty forest path",
    objective: "Follow the wet trail before it disappears under the roots.",
    ambience: "wet moss, high leaves, soft footfalls, distant insects",
    rewardSources: [
      {
        id: "source-root-cache",
        label: { en: "Root-tangled cache", zh: "树根缠绕的暗藏物" },
        keywords: ["old coffer", "root cache", "under the roots", "树根"],
        itemTags: ["ring", "ledger", "key"]
      }
    ]
  },
  director: { beat: "revelation" },
  combat: { state: "foreshadowed" },
  transcript: [
    { type: "gm", text: "Rain beads on the forest marker." }
  ],
  memories: [
    { text: "The missing ledger names a silver-ringed courier." }
  ]
};

test("scene presentation chooses a player-safe generated backdrop from room context", () => {
  const soundscape = { id: "forest", intensity: 0.62 };
  const sceneAsset = chooseSceneAsset(room, soundscape);
  const presentation = buildPresentation(room, soundscape);

  assert.equal(sceneAsset.categoryId, "scenes");
  assert.equal(sceneAsset.file.endsWith(".png"), true);
  assert.equal(sceneAsset.uiSurface.includes("stage-backdrop"), true);
  assert.equal(presentation.sceneAsset.id, sceneAsset.id);
  assert.equal(presentation.relevantScenes.length, 3);
});

test("rainy archive street context does not select sunny or desert ruins", () => {
  const archiveRoom = {
    id: "room_archive_rain",
    version: 3,
    tone: "mystery",
    scene: {
      title: "封存档案馆外被雨水洗亮的街道",
      location: "封存档案馆外被雨水洗亮的街道",
      objective: "调查雨夜档案馆门口的线索，并确认谁进入了封存库。",
      ambience: "雨水、湿冷石街、档案馆铜灯、夜色"
    },
    director: { beat: "revelation" },
    combat: { state: "none" },
    transcript: [
      { type: "gm", text: "封存档案馆外被雨水洗亮的街道，街面积水映出门厅灯光。" }
    ]
  };
  const presentation = buildPresentation(archiveRoom, { id: "rain", intensity: 0.72 });
  const selected = presentation.sceneAsset;
  const relevantKeys = presentation.relevantScenes.map((asset) => asset.semanticKey);

  assert.equal(selected.semanticKey, "scene.rain.archive.street");
  assert.equal(selected.variantAxes.weather, "rain");
  assert.equal(selected.soundscapeHints.includes("rain"), true);
  assert.equal(selected.soundscapeHints.includes("archive"), true);
  assert.equal(relevantKeys.some((key) => /desert|ruin/.test(key)), false);
});

test("reward selection only responds to successful reward-intent actions", () => {
  assert.equal(matchesRewardIntent("carefully open the old coffer"), true);
  assert.equal(matchesRewardIntent("ask the guard for directions"), false);
  assert.equal(findRewardSource(room, "carefully open the old coffer")?.id, "source-root-cache");

  const reward = chooseRewardAsset(room, "carefully open the old coffer and take the treasure", { success: true });
  assert.equal(reward.categoryId, "equipment");
  assert.equal(reward.file.endsWith(".png"), true);
  assert.equal(reward.uiSurface.includes("reward-card"), true);
  assert.equal(Boolean(reward.displayName.en), true);
  assert.equal(Boolean(reward.displayName.zh), true);

  assert.equal(chooseRewardAsset(room, "carefully open the old coffer", { success: false }), null);
  assert.equal(chooseRewardAsset(room, "discuss the plan with allies", { success: true }), null);
  assert.equal(chooseRewardAsset(room, "open a random chest that was never established", { success: true }), null);
});
