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
