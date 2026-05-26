import test from "node:test";
import assert from "node:assert/strict";
import { buildPresentation, chooseSceneAsset, loadGeneratedAssetCatalog } from "../src/core/assetSelection.js";
import { chooseSoundscape } from "../src/core/soundscape.js";
import { buildTableStateSummary } from "../src/core/stateSummary.js";

const scene050Cases = [
  {
    label: "tavern",
    expectedId: "aidm-scene-backbone-050-05",
    expectedFamily: "tavern",
    title: "Storm Dockside Tavern",
    ambience: "Storm Dockside Tavern dockside-tavern heavy rain night rumor exchange sailor rumors, wet rope, rough warmth."
  },
  {
    label: "market",
    expectedId: "aidm-scene-backbone-050-42",
    expectedFamily: "market",
    title: "Locked Market Warehouse",
    ambience: "Locked Market Warehouse market-warehouse dry indoor dust search, smuggled cargo, guard patrols, crates, trade evidence."
  },
  {
    label: "camp",
    expectedId: "aidm-scene-backbone-050-09",
    expectedFamily: "camp",
    title: "Rainproof Forest Camp",
    ambience: "Rainproof Forest Camp forest-camp light rain night camp watch, bedrolls, tarp, fire ring, guarded comfort."
  },
  {
    label: "dungeon",
    expectedId: "aidm-scene-backbone-050-08",
    expectedFamily: "dungeon",
    title: "Dungeon Crossroads",
    ambience: "Dungeon Crossroads underground damp torchlit dungeon crossroads exploration, route choice, ambush warning."
  },
  {
    label: "battlefield",
    expectedId: "aidm-scene-backbone-050-49",
    expectedFamily: "battlefield",
    title: "Aftermath War Camp",
    ambience: "Aftermath War Camp battle-camp rain clearing aftermath, siege battlefield triage, command disputes, prisoner clues."
  },
  {
    label: "archive",
    expectedId: "aidm-scene-backbone-050-50",
    expectedFamily: "archive",
    title: "Sealed Royal Archive",
    ambience: "Sealed Royal Archive royal-archive still indoor air forbidden research, records, contract evidence, historical investigation."
  }
];

test("050 backbone scenes close manifest to presentation to state summary for core TRPG locations", () => {
  const catalog = loadGeneratedAssetCatalog();
  const scene050Ids = new Set(catalog.scenes.filter((asset) => asset.id.startsWith("aidm-scene-backbone-050-")).map((asset) => asset.id));

  assert.equal(scene050Ids.size, 50);

  for (const entry of scene050Cases) {
    const room = sceneRuntimeRoom(entry.label, entry.title, entry.ambience);
    const soundscape = chooseSoundscape(room);
    const presentation = buildPresentation(room, soundscape);
    const asset = presentation.sceneAsset;
    const summary = buildTableStateSummary(room, { soundscape, presentation });

    assert.equal(scene050Ids.has(entry.expectedId), true, `${entry.expectedId} must be registered player-safe`);
    assert.equal(asset.id, entry.expectedId, `${entry.label} should select its 050 scene`);
    assert.equal(asset.categoryId, "scenes");
    assert.equal(asset.file.endsWith(".png"), true);
    assert.equal(asset.uiSurface.includes("stage-backdrop"), true);
    assert.equal(asset.uiSurface.includes("relevant-scene"), true);
    assert.equal(asset.variantAxes.sceneFamily, entry.expectedFamily);
    assert.equal(Boolean(asset.semanticKey), true);
    assert.equal(Boolean(asset.displayName.en), true);
    assert.equal(Boolean(asset.displayName.zh), true);
    assert.equal(asset.description.length > 20, true);
    assert.equal(presentation.relevantScenes[0].id, entry.expectedId);

    assert.equal(summary.scene.asset.id, entry.expectedId);
    assert.equal(summary.scene.asset.semanticKey, asset.semanticKey);
    assert.deepEqual(summary.scene.asset.displayName, asset.displayName);
    assert.equal(summary.scene.asset.description, asset.description);
    assert.equal(summary.media.sceneAsset.id, entry.expectedId);
    assert.equal(summary.media.sceneAsset.semanticKey, asset.semanticKey);
    assert.deepEqual(summary.media.sceneAsset.displayName, asset.displayName);
    assert.equal(summary.media.sceneAsset.description, asset.description);
    assert.equal(summary.media.sceneAssetId, entry.expectedId);
    assert.equal(summary.media.sceneAssetSemanticKey, asset.semanticKey);
    assert.deepEqual(summary.media.sceneAssetDisplayName, asset.displayName);
  }
});

test("scene rotation stays stable within a round and can change by round or transition context", () => {
  const baseScene = {
    title: "Wilderness recovery watch",
    location: "Temporary trail bivouac",
    objective: "Rest, recover, and choose the next watch.",
    ambience: "camp, campfire, embers, bedrolls, wilderness watch, short rest, recovery",
    weather: "clear",
    mood: "restful"
  };
  const sameRoundA = chooseSceneAsset({
    ...sceneRuntimeRoom("round-rotation-camp", baseScene.title, baseScene.ambience, baseScene),
    id: "room_round-rotation-camp",
    round: 4,
    version: 12
  }, { id: "campfire" });
  const sameRoundB = chooseSceneAsset({
    ...sceneRuntimeRoom("round-rotation-camp", baseScene.title, baseScene.ambience, baseScene),
    id: "room_round-rotation-camp",
    round: 4,
    version: 99
  }, { id: "campfire" });
  const idsByRound = new Set();

  for (let round = 1; round <= 8; round += 1) {
    idsByRound.add(chooseSceneAsset({
      ...sceneRuntimeRoom("round-rotation-camp", baseScene.title, baseScene.ambience, baseScene),
      id: "room_round-rotation-camp",
      round,
      version: 100 + round
    }, { id: "campfire" }).id);
  }

  const calm = chooseSceneAsset({
    ...sceneRuntimeRoom("transition-soft", baseScene.title, baseScene.ambience, baseScene),
    director: { beat: "discovery" }
  }, { id: "campfire" });
  const crisis = chooseSceneAsset({
    ...sceneRuntimeRoom("transition-hard", baseScene.title, baseScene.ambience, baseScene),
    director: { beat: "crisis" }
  }, { id: "campfire" });

  assert.equal(sameRoundA.id, sameRoundB.id);
  assert.equal(idsByRound.size > 1, true, `expected round rotation, got ${[...idsByRound].join(", ")}`);
  assert.equal(calm.transition, "soft-crossfade");
  assert.equal(crisis.transition, "hard-crossfade");
});

function sceneRuntimeRoom(label, title, ambience, sceneOverrides = {}) {
  return {
    id: `room_scene_runtime_${label}`,
    version: 1,
    round: 1,
    tone: "mystery",
    scene: {
      title,
      location: title,
      objective: ambience,
      ambience,
      ...sceneOverrides
    },
    director: { beat: "discovery" },
    combat: { state: "none" },
    transcript: [
      { type: "gm", text: ambience }
    ]
  };
}
