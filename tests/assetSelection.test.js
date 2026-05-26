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

test("forest drizzle presentation ignores stale archive transcript terms", () => {
  const forestRoom = {
    id: "room_forest_drizzle_after_archive",
    version: 9,
    round: 2,
    tone: "calm",
    scene: {
      title: "Misty forest trail",
      location: "Mosswood forest under a pine canopy",
      objective: "Follow the wet trail before it disappears under the roots.",
      ambience: "Leaves move above the trail while spring drizzle falls.",
      weather: "light rain",
      weatherState: "light rain",
      season: "spring",
      timeOfDay: "dusk",
      mood: "calm",
      atmosphere: {
        weather: "light rain",
        season: "spring",
        timeOfDay: "dusk",
        mood: "mystery",
        locationTags: ["forest"],
        soundscapeTags: ["location:forest", "weather:light-rain", "season:spring"]
      },
      lastShiftReason: "forest-action"
    },
    director: { beat: "trail" },
    combat: { state: "foreshadowed" },
    transcript: [
      { type: "player", text: "carefully inspect the archive stairs for old forest ledger tracks" },
      { type: "gm", text: "The archive keeper points toward the old forest ledger trail." },
      { type: "player", text: "follow the old forest trail through spring drizzle toward insect lights" }
    ]
  };
  const soundscape = chooseSoundscape(forestRoom);
  const presentation = buildPresentation(forestRoom, soundscape);

  assert.equal(soundscape.id, "forest");
  assert.match(presentation.sceneAsset.semanticKey, /forest/);
  assert.doesNotMatch(presentation.sceneAsset.semanticKey, /archive/);
  assert.equal(presentation.sceneAsset.uiSurface.includes("stage-backdrop"), true);
  assert.equal(presentation.relevantScenes[0].id, presentation.sceneAsset.id);
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

test("representative Kepler internal assets stay out of stage pools while scene backbones enter them", () => {
  const catalog = loadGeneratedAssetCatalog();
  const assetsById = new Map(catalog.assets.map((asset) => [asset.id, asset]));
  const stagePoolIds = new Set(catalog.scenes.map((asset) => asset.id));
  const internalIds = [
    "aidm-hostile-token-050-01",
    "aidm-status-hazard-058-01",
    "aidm-faction-overlay-059-64"
  ];
  const runtimePromotedIds = [
    "aidm-weapon-cutout-052-01",
    "aidm-status-hazard-058-08"
  ];

  for (const id of internalIds) {
    const asset = assetsById.get(id);

    assert.ok(asset, `${id} must be registered in the generated manifest`);
    assert.equal(asset.visibility, "internal", `${id} must remain internal`);
    assert.deepEqual(asset.uiSurface, ["catalog-internal"], `${id} must not expose player surfaces`);
    assert.equal(asset.quality?.approved, false, `${id} must not be runtime approved`);
    assert.equal(stagePoolIds.has(id), false, `${id} must not enter the stage backdrop pool`);
    assert.equal(catalog.playerSafeAssets.some((candidate) => candidate.id === id), false, `${id} must not enter runtime-visible pools`);
  }

  for (const id of runtimePromotedIds) {
    const asset = assetsById.get(id);

    assert.ok(asset, `${id} must be registered in the generated manifest`);
    assert.equal(asset.visibility, "runtime-promoted", `${id} must use source-bound runtime promotion`);
    assert.deepEqual(asset.uiSurface, ["ui-approved-runtime"], `${id} must not expose catalog-internal`);
    assert.equal(asset.quality?.approved, false, `${id} must not be broadly player-safe`);
    assert.equal(asset.runtimePromotion?.status, "ui-approved-runtime", `${id} must carry runtime promotion metadata`);
    assert.equal(stagePoolIds.has(id), false, `${id} must not enter the stage backdrop pool`);
    assert.equal(catalog.playerSafeAssets.some((candidate) => candidate.id === id), false, `${id} must not enter player-safe selection pools`);
  }

  assert.equal(stagePoolIds.has("aidm-scene-backbone-050-01"), true, "aidm-scene-backbone-050-01 must enter the scene pool");

  const restLodgeRoom = sceneRoom("kepler-rest-lodge", {
    title: "Hearth Rest Lodge",
    location: "Hearth Rest Lodge",
    objective: "Rest by the warm common-room hearth.",
    ambience: "warm hearth lodge, rest, party debrief, drying gear racks, light rain outside",
    weather: "light rain outside",
    timeOfDay: "evening",
    mood: "safe recovery"
  }, "The Hearth Rest Lodge waits with a warm fire.");
  const presentation = buildPresentation(restLodgeRoom, { id: "rest-lodge", intensity: 0.2 });

  assert.equal(presentation.sceneAsset.id, "aidm-scene-backbone-050-01");
  assert.equal(presentation.sceneAsset.uiSurface.includes("stage-backdrop"), true);
  assert.equal(presentation.relevantScenes.some((asset) => asset.id === "aidm-scene-backbone-050-01"), true);
  assert.deepEqual(
    presentation.relevantScenes
      .map((asset) => asset.id)
      .filter((id) => internalIds.includes(id)),
    [],
  );
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

test("scene family scoring separates TRPG location states and stays stable across version ticks", () => {
  const cases = [
    {
      label: "tavern",
      expectedFamilies: ["tavern", "social-hub", "settlement"],
      scene: {
        title: "Warm inn taproom",
        location: "busy tavern common room",
        objective: "Find the informant over mugs and hearthlight.",
        ambience: "crowded tavern, inn tables, mugs, lute, warm hearth, interior social hub",
        weather: "indoor",
        mood: "social"
      }
    },
    {
      label: "shop",
      expectedFamilies: ["market", "city", "city-weather"],
      scene: {
        title: "Merchant supply stop",
        location: "bazaar market store",
        objective: "Buy supplies and trace the vendor's ledger.",
        ambience: "market stalls, merchant prices, trade goods, shop counters, supply crates",
        weather: "clear",
        mood: "busy"
      }
    },
    {
      label: "camp",
      expectedFamilies: ["camp", "wilderness"],
      scene: {
        title: "Campfire rest",
        location: "forest camp clearing",
        objective: "Take a short rest and set the night watch.",
        ambience: "campfire, bedrolls, embers, recovery, quiet outdoor watch",
        weather: "clear",
        mood: "restful"
      }
    },
    {
      label: "dungeon",
      expectedFamilies: ["undercity", "cavern", "mine", "dungeon"],
      scene: {
        title: "Flooded dungeon vault",
        location: "underground aqueduct crypt",
        objective: "Cross the flooded sewer vault before the patrol hears you.",
        ambience: "subterranean water, dungeon arches, crypt echoes, cave drips, hidden danger",
        weather: "wet",
        mood: "mystery"
      }
    },
    {
      label: "battlefield",
      expectedFamilies: ["battlefield"],
      scene: {
        title: "War camp aftermath",
        location: "siege battlefield camp",
        objective: "Search the war camp before combat resumes.",
        ambience: "battlefield mud, siege banners, smoke, military wagons, aftermath, combat tension",
        weather: "storm",
        mood: "ominous"
      }
    },
    {
      label: "archive",
      expectedFamilies: ["archive", "interior-mystery"],
      scene: {
        title: "Forbidden archive research",
        location: "library records room interior",
        objective: "Investigate the sealed evidence ledger.",
        ambience: "archive shelves, library stacks, records, evidence, clues, quiet research, indoor rain",
        weather: "indoor rain",
        mood: "mystery"
      }
    },
    {
      label: "social",
      expectedFamilies: ["court", "social-hub", "tavern", "city", "settlement"],
      scene: {
        title: "Tribunal negotiation",
        location: "court hearing chamber",
        objective: "Negotiate with the magistrate before the hearing turns hostile.",
        ambience: "court, parley, diplomacy, social intrigue, council table, witnesses",
        weather: "indoor",
        mood: "tense"
      }
    }
  ];
  const selectedByCase = new Map();

  for (const entry of cases) {
    const baseRoom = sceneRoom(`family-${entry.label}`, entry.scene);
    const selected = chooseSceneAsset({ ...baseRoom, round: 4, version: 12 }, { id: entry.label, intensity: 0.5 });
    const tickSelected = chooseSceneAsset({ ...baseRoom, round: 4, version: 99 }, { id: entry.label, intensity: 0.5 });
    const family = selected.variantAxes.sceneFamily;
    selectedByCase.set(entry.label, selected);

    assert.equal(tickSelected.id, selected.id, `${entry.label} should not flicker on version-only updates`);
    assert.equal(entry.expectedFamilies.includes(family), true, `${entry.label} selected ${selected.semanticKey} with family ${family}`);
  }

  const uniqueFamilies = new Set([...selectedByCase.values()].map((asset) => asset.variantAxes.sceneFamily));
  assert.equal(uniqueFamilies.size >= 5, true, `expected diverse scene families, got ${[...uniqueFamilies].join(", ")}`);
  assert.notEqual(selectedByCase.get("tavern").id, selectedByCase.get("shop").id);
  assert.notEqual(selectedByCase.get("camp").id, selectedByCase.get("dungeon").id);
  assert.notEqual(selectedByCase.get("battlefield").id, selectedByCase.get("archive").id);
});

test("scene asset selection rotates within a stable family on round transitions", () => {
  const campScene = {
    title: "Wilderness recovery watch",
    location: "temporary trail bivouac",
    objective: "Rest, recover, and choose the next watch.",
    ambience: "camp, campfire, embers, bedrolls, wilderness watch, short rest, recovery",
    weather: "clear",
    mood: "restful"
  };
  const ids = new Set();
  for (let round = 1; round <= 10; round += 1) {
    const selected = chooseSceneAsset({ ...sceneRoom("round-rotation-camp", campScene), round, version: 200 + round }, { id: "campfire" });
    ids.add(selected.id);
    assert.equal(["camp", "wilderness"].includes(selected.variantAxes.sceneFamily), true);
  }

  assert.equal(ids.size > 1, true, `expected round rotation within camp family, got ${[...ids].join(", ")}`);
});

test("scene asset selection falls back when future 042 or 050 scene assets are not registered", () => {
  const catalog = loadGeneratedAssetCatalog();
  const hasFutureBackboneScenes = catalog.scenes.some((asset) => /(?:042|050)/.test(asset.id) && asset.categoryId === "scenes");
  const battlefield = chooseSceneAsset(sceneRoom("future-scene-fallback-battlefield", {
    title: "Battle camp fallback",
    location: "war camp battlefield aftermath",
    objective: "Resolve the ambush in the siege camp.",
    ambience: "battlefield, battle camp, war, siege, smoke, combat tension, aftermath",
    weather: "storm",
    mood: "danger"
  }), { id: "combat-tension" });
  const dungeon = chooseSceneAsset(sceneRoom("future-scene-fallback-dungeon", {
    title: "Dungeon fallback",
    location: "underground mine vault",
    objective: "Escape the prison tunnel.",
    ambience: "dungeon, underground, mine, cavern, prison, vault, wet stone",
    weather: "wet",
    mood: "mystery"
  }), { id: "mystery" });

  assert.equal(typeof hasFutureBackboneScenes, "boolean");
  assert.equal(battlefield.categoryId, "scenes");
  assert.equal(Boolean(battlefield.file), true);
  assert.equal(dungeon.categoryId, "scenes");
  assert.equal(Boolean(dungeon.file), true);
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
