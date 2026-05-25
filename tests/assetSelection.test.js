import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRuntimeAssetBindings,
  buildPresentation,
  chooseCharacterAsset,
  chooseItemAsset,
  chooseNpcTokenAsset,
  chooseRewardAsset,
  chooseSceneAsset,
  chooseSpellAsset,
  chooseStatusAsset,
  findRewardSource,
  loadGeneratedAssetCatalog,
  matchesRewardIntent
} from "../src/core/assetSelection.js";
import { chooseSoundscape } from "../src/core/soundscape.js";
import { SPELLS } from "../src/core/rules.js";

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

test("generated asset selection pools exclude internal review assets", () => {
  const catalog = loadGeneratedAssetCatalog();
  const internalIds = new Set(
    catalog.assets
      .filter((asset) => {
        return asset.visibility === "internal"
          || asset.uiSurface?.includes("catalog-internal")
          || asset.quality?.approved === false;
      })
      .map((asset) => asset.id)
  );
  const sceneIds = new Set(catalog.scenes.map((asset) => asset.id));
  const rewardIds = new Set(catalog.rewards.map((asset) => asset.id));

  assert.equal(internalIds.size > 0, true, "fixture must include internal review assets");
  assert.equal(catalog.playerSafeAssets.length > 0, true);
  assert.equal(catalog.scenes.length > 0, true);
  assert.equal(catalog.rewards.length > 0, true);
  assert.equal(catalog.marketItems.length >= 29, true);
  assert.equal(catalog.inventoryItems.length >= 29, true);
  assert.equal(catalog.characterOptions.length, 16);
  assert.equal(catalog.spellAssets.length, 16);
  assert.equal(catalog.npcTokens.length, 16);
  assert.equal(catalog.statusIcons.length, 16);
  assert.deepEqual([...sceneIds].filter((id) => internalIds.has(id)), []);
  assert.deepEqual([...rewardIds].filter((id) => internalIds.has(id)), []);

  for (const asset of catalog.scenes) {
    assert.equal(asset.categoryId, "scenes");
    assert.equal(asset.assetType, "raster");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.uiSurface.includes("stage-backdrop"), true, `${asset.id} must be a stage backdrop candidate`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose catalog-internal`);
    assert.equal(asset.quality?.approved, true, `${asset.id} must be approved before scene selection`);
  }

  for (const asset of catalog.rewards) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-rewards");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose catalog-internal`);
    assert.equal(asset.quality?.approved, true, `${asset.id} must be approved before reward selection`);
  }

  for (const asset of [
    ...catalog.marketItems,
    ...catalog.inventoryItems,
    ...catalog.characterOptions,
    ...catalog.spellAssets,
    ...catalog.npcTokens,
    ...catalog.statusIcons
  ]) {
    assert.equal(asset.visibility, "player-safe", `${asset.id} must be player-safe before runtime binding`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose catalog-internal`);
    assert.equal(asset.quality?.approved, true, `${asset.id} must be approved before runtime binding`);
  }
});

test("runtime asset bindings route player-safe generated art through data-backed surfaces", () => {
  const runtimeRoom = {
    ...room,
    players: [
      {
        id: "player-runtime-1",
        character: {
          species: "elf",
          classId: "mage",
          knownSpells: ["firebolt"],
          spells: ["firebolt", "binding-vines"],
          inventory: [
            { id: "inventory-saber", itemId: "oathguard-saber" }
          ],
          statusEffects: [{ id: "poisoned", duration: 2 }]
        }
      }
    ],
    combat: {
      state: "active",
      encounter: {
        enemies: [
          {
            id: "enemy-bone-guard-1",
            templateId: "bone_guard",
            name: "Bone Guard",
            role: "soldier",
            threat: 2,
            statusEffects: [{ id: "marked", duration: 1 }]
          }
        ]
      }
    }
  };
  const bindings = buildPresentation(runtimeRoom, chooseSoundscape(runtimeRoom)).assetBindings;
  const marketSaber = bindings.marketItems.find((asset) => asset.runtimeBinding.itemId === "oathguard-saber");
  const inventorySaber = bindings.inventoryItems.find((asset) => asset.runtimeBinding.inventoryEntryId === "inventory-saber");
  const elfAsset = bindings.characterAssets.find((asset) => asset.runtimeBinding.rulesId === "elf");
  const mageAsset = bindings.characterAssets.find((asset) => asset.runtimeBinding.rulesId === "mage");
  const firebolt = bindings.spellCards.find((asset) => asset.runtimeBinding.spellId === "firebolt");
  const bindingVines = bindings.spellCards.find((asset) => asset.runtimeBinding.spellId === "binding-vines");
  const npcToken = bindings.npcTokens.find((asset) => asset.runtimeBinding.npcId === "enemy-bone-guard-1");
  const poisoned = bindings.statusIcons.find((asset) => asset.runtimeBinding.conditionId === "poisoned");
  const marked = bindings.statusIcons.find((asset) => asset.runtimeBinding.conditionId === "marked");
  const reward = chooseRewardAsset(runtimeRoom, "carefully open the old coffer and take the treasure", { success: true });
  const rewardBinding = buildRuntimeAssetBindings(runtimeRoom, { latestReward: reward }).rewardItems[0];
  const spellOptionById = new Map(bindings.spellOptions.map((asset) => [asset.runtimeBinding.spellId, asset]));
  const expectedNewSpellArt = {
    "cleanse-poison": "aidm-spell-015-05",
    "frost-bind": "aidm-spell-015-02",
    "glass-echo": "aidm-spell-015-07",
    "storm-arc": "aidm-spell-015-04",
    "thunder-step": "aidm-spell-015-03",
    "grave-whisper": "aidm-spell-015-06",
    "iron-oath": "aidm-spell-015-08",
    "lantern-sigil": "aidm-spell-015-09",
    "blood-moon-hex": "aidm-spell-015-10",
    tidecall: "aidm-spell-015-11",
    "clockwork-snare": "aidm-spell-015-12",
    "starfall-rune": "aidm-spell-015-15"
  };

  assertRuntimeBinding(marketSaber, "market-item", "shop-catalog");
  assertRuntimeBinding(inventorySaber, "inventory-item", "inventory");
  assertRuntimeBinding(rewardBinding, "reward-card", "latest-reward");
  assertRuntimeBinding(elfAsset, "player-detail", "player-character");
  assertRuntimeBinding(mageAsset, "player-detail", "player-character");
  assertRuntimeBinding(firebolt, "spell-card", "known-spell");
  assertRuntimeBinding(bindingVines, "spell-card", "known-spell");
  assertRuntimeBinding(npcToken, "npc-token", "encounter");
  assertRuntimeBinding(poisoned, "status-icon", "room-status");
  assertRuntimeBinding(marked, "status-icon", "room-status");

  assert.equal(bindings.characterOptions.length, 16);
  assert.equal(bindings.spellOptions.length, Object.keys(SPELLS).length);
  assert.deepEqual([...Object.keys(SPELLS)].filter((spellId) => !spellOptionById.has(spellId)), []);
  for (const spellId of Object.keys(SPELLS)) {
    assertRuntimeBinding(spellOptionById.get(spellId), "character-builder", "spell-definitions");
  }
  for (const [spellId, assetId] of Object.entries(expectedNewSpellArt)) {
    assert.equal(spellOptionById.get(spellId).id, assetId);
  }
  assert.equal(chooseItemAsset("oathguard-saber", { surface: "market-item" }).id, "aidm-inventory-expansion-031-02");
  assert.equal(chooseCharacterAsset("mage", { kind: "class", surface: "character-builder" }).id, "aidm-option-11");
  assert.equal(chooseSpellAsset("binding-vines", { surface: "spell-card" }).id, "aidm-spell-015-16");
  assert.equal(chooseNpcTokenAsset({ templateId: "bone_guard", role: "soldier", threat: 2 }, { surface: "combatant-detail" }).uiSurface.includes("combatant-detail"), true);
  assert.equal(chooseStatusAsset("poisoned", { surface: "player-detail" }).id, "aidm-status-effect-018-03");
});

test("rainy archive street context selects the exterior street instead of the indoor sheet032 archive", () => {
  const archiveRoom = {
    id: "room_archive_rain",
    version: 3,
    tone: "mystery",
    scene: {
      title: "封存档案馆外被雨水洗亮的街道",
      location: "封存档案馆外被雨水洗亮的街道",
      objective: "调查雨夜档案馆门口的线索，并确认谁进入了封存库。",
      ambience: "雨水、湿冷石街、档案馆铜灯、夜色",
      weather: "heavy rain",
      mood: "mystery"
    },
    director: { beat: "revelation" },
    combat: { state: "none" },
    transcript: [
      { type: "gm", text: "封存档案馆外被雨水洗亮的街道，街面积水映出门厅灯光。" }
    ]
  };
  const presentation = buildPresentation(archiveRoom, chooseSoundscape(archiveRoom));
  const selected = presentation.sceneAsset;
  const relevantKeys = [selected, ...presentation.relevantScenes].map((asset) => asset.semanticKey);

  assert.equal(selected.semanticKey, "scene.rain.archive.street");
  assert.equal(selected.variantOf, "rain-archive-street");
  assert.equal(selected.variantAxes.weather, "rain");
  assert.equal(selected.variantAxes.location, "city-street");
  assert.equal(selected.soundscapeHints.includes("rain"), true);
  assert.equal(selected.soundscapeHints.includes("archive"), true);
  assert.equal(relevantKeys.includes("scene.ambient.moonlit-rain-archive.v01"), false);
  assert.equal(relevantKeys.some((key) => /desert|ruin/.test(key)), false);
});

test("grand weather scenes are selected from soundscape and scene terms", () => {
  const stormRoom = {
    id: "room_lightning_causeway",
    version: 4,
    tone: "dark",
    scene: {
      title: "Lightning Causeway",
      location: "Storm bridge causeway under a thunderstorm",
      objective: "Cross the exposed causeway before the guards close the gate.",
      ambience: "heavy rain, thunder, lightning, gale wind, wet statues, slick stone"
    },
    director: { beat: "crisis" },
    combat: { state: "foreshadowed" },
    transcript: [
      { type: "gm", text: "Lightning breaks over the causeway while rain hammers the stones." }
    ]
  };
  const tavernRoom = {
    id: "room_tavern_song",
    version: 2,
    tone: "cheerful",
    scene: {
      title: "Tavern Song Hall",
      location: "Crowded tavern song hall",
      objective: "Find the informant during the singer's chorus.",
      ambience: "singing, cheering crowd, cup clatter, warm hearth, candlelit tables"
    },
    director: { beat: "hook" },
    combat: { state: "none" },
    transcript: [
      { type: "gm", text: "The whole tavern sings along under chandeliers and candlelight." }
    ]
  };

  const stormPresentation = buildPresentation(stormRoom, { id: "thunderstorm", intensity: 0.9 });
  const tavernPresentation = buildPresentation(tavernRoom, { id: "singing", intensity: 0.5 });

  assert.equal(stormPresentation.sceneAsset.semanticKey, "scene.weather.lightning-causeway.v01");
  assert.equal(stormPresentation.sceneAsset.soundscapeHints.includes("thunderstorm"), true);
  assert.equal(stormPresentation.sceneAsset.uiSurface.includes("relevant-scene"), true);
  assert.equal(tavernPresentation.sceneAsset.semanticKey, "scene.weather.tavern-song-hall.v01");
  assert.equal(tavernPresentation.sceneAsset.soundscapeHints.includes("singing"), true);
  assert.equal(tavernPresentation.relevantScenes.some((asset) => asset.semanticKey === "scene.weather.tavern-song-hall.v01"), true);
});

test("sheet032 ambient scenes stay reachable from current scene and soundscape terms", () => {
  const cases = [
    {
      label: "雨夜档案馆",
      expectedKey: "scene.ambient.moonlit-rain-archive.v01",
      scene: {
        title: "雨夜档案馆",
        location: "雨夜档案馆阅览厅 indoor archive reading hall",
        objective: "调查封存档案馆里的线索。",
        ambience: "雨水敲打高窗，档案架、羊皮纸、低火与远雷包围室内调查。",
        weather: "rain",
        mood: "mystery",
        tags: ["location:archive", "location:interior", "weather:light-rain"]
      },
      assertSelected(presentation) {
        assert.equal(presentation.sceneAsset.semanticKey, "scene.ambient.moonlit-rain-archive.v01");
        assert.equal(presentation.sceneAsset.variantAxes.sceneFamily, "interior-mystery");
        assert.equal(presentation.sceneAsset.variantAxes.location, "moonlit-rain-archive");
        assert.doesNotMatch(presentation.sceneAsset.variantOf, /street|plaza/);
      }
    },
    {
      label: "晴天溪边路",
      expectedKey: "scene.ambient.sunny-brook-road.v01",
      transcriptText: "上一幕是雷雨、风暴、雷声和暴雨，但现在天空已经放晴。",
      scene: {
        title: "晴天溪边路",
        location: "晴天溪边路 Sunny brook road",
        objective: "沿着溪边路前往村舍。",
        ambience: "晴朗蓝天、浅溪、鸟鸣、轻风和林间小路。",
        weather: "clear sunny",
        mood: "calm"
      },
      assertSelected(presentation) {
        assert.equal(presentation.sceneAsset.variantAxes.weather, "clear");
        assert.doesNotMatch(presentation.sceneAsset.semanticKey, /storm|thunder|rain|lightning/);
      }
    },
    {
      label: "灯火旅店",
      expectedKey: "scene.ambient.lantern-tavern-hall.v01",
      transcriptText: "之前在旧市场和城市街道，人群叫卖，摊贩争吵。",
      scene: {
        title: "灯火旅店",
        location: "灯火旅店大厅",
        objective: "在旅店大厅寻找线人。",
        ambience: "温暖灯火、旅店、酒杯、炉火、低声人群与琵琶声。",
        weather: "indoor",
        mood: "warm"
      },
      assertSelected(presentation) {
        const keys = [presentation.sceneAsset, ...presentation.relevantScenes].map((asset) => asset.semanticKey);
        assert.doesNotMatch(presentation.sceneAsset.semanticKey, /market/);
        assert.deepEqual(keys.filter((key) => /market/.test(key)), []);
      }
    },
    {
      label: "风暴崖边圣坛",
      expectedKey: "scene.ambient.storm-cliff-shrine.v01",
      scene: {
        title: "风暴崖边圣坛",
        location: "风暴崖边圣坛",
        objective: "在崖边圣坛阻止危险仪式。",
        ambience: "暴雨、风暴海浪、雷声、悬崖、圣坛和仪式火光。",
        weather: "thunderstorm",
        mood: "danger"
      }
    }
  ];

  for (const entry of cases) {
    const testRoom = sceneRoom(entry.label, entry.scene, entry.transcriptText);
    const soundscape = chooseSoundscape(testRoom);
    const presentation = buildPresentation(testRoom, soundscape);
    const keys = [presentation.sceneAsset, ...presentation.relevantScenes].map((asset) => asset.semanticKey);

    assert.equal(keys.includes(entry.expectedKey), true, `${entry.label} should include ${entry.expectedKey}; got ${keys.join(", ")}`);
    entry.assertSelected?.(presentation);
  }
});

test("scene asset selection uses existing named weather and time variants", () => {
  const alleyRoom = sceneRoom("ruined-alley-drizzle", {
    title: "Ruined Alley Drizzle",
    location: "Ruined alley at dusk",
    objective: "Follow the wet alley before the contact disappears.",
    ambience: "Light rain, wet stone, alley lamps, and dusk fog.",
    weather: "light rain",
    timeOfDay: "dusk",
    mood: "mystery"
  }, "The ruined alley glistens in drizzle at dusk.");
  const lanternRoom = sceneRoom("lantern-tavern-hall", {
    title: "灯火旅店",
    location: "灯火旅店大厅",
    objective: "在旅店大厅寻找线人。",
    ambience: "温暖灯火、旅店、酒杯、炉火、低声人群与琵琶声。",
    weather: "indoor",
    timeOfDay: "evening",
    mood: "warm"
  }, "Earlier the old market was loud with vendors and carts.");

  const alleyPresentation = buildPresentation(alleyRoom, chooseSoundscape(alleyRoom));
  const lanternPresentation = buildPresentation(lanternRoom, chooseSoundscape(lanternRoom));

  assert.equal(alleyPresentation.sceneAsset.semanticKey, "scene.weather.ruined-alley-drizzle.v01");
  assert.equal(alleyPresentation.sceneAsset.variantAxes.weather, "light-rain");
  assert.equal(alleyPresentation.sceneAsset.variantAxes.timeOfDay, "dusk");
  assert.equal(lanternPresentation.sceneAsset.semanticKey, "scene.ambient.lantern-tavern-hall.v01");
  assert.equal(lanternPresentation.sceneAsset.variantAxes.timeOfDay, "evening");
  assert.equal(lanternPresentation.relevantScenes[0].semanticKey, "scene.ambient.lantern-tavern-hall.v01");
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
  assert.equal(reward.gameplayBinding.requiresItemDefinition, true);
  assert.match(reward.semanticKey, /^items\./);

  assert.equal(chooseRewardAsset(room, "carefully open the old coffer", { success: false }), null);
  assert.equal(chooseRewardAsset(room, "discuss the plan with allies", { success: true }), null);
  assert.equal(chooseRewardAsset(room, "open a random chest that was never established", { success: true }), null);
});

function sceneRoom(id, scene, transcriptText = scene.ambience) {
  return {
    id: `room_${id}`,
    version: 1,
    tone: scene.mood,
    scene,
    director: { beat: "discovery" },
    combat: { state: "none" },
    transcript: [
      { type: "gm", text: transcriptText }
    ]
  };
}

function assertRuntimeBinding(asset, surface, source) {
  assert.ok(asset, `${surface} binding must exist`);
  assert.equal(asset.uiSurface.includes(surface), true, `${asset.id} must allow ${surface}`);
  assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose catalog-internal`);
  assert.equal(asset.runtimeBinding.surface, surface);
  assert.equal(asset.runtimeBinding.source, source);
  assert.equal(Boolean(asset.file), true);
  assert.equal(Boolean(asset.semanticKey), true);
}
