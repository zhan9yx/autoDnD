import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { assetBinaryDelivery, isGeneratedRasterAssetFile } from "../src/core/assets.js";
import { ITEM_CATALOG, SHOP_CATALOG } from "../src/core/itemCatalog.js";

test("generated image assets are registered with auditable provenance", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));

  assert.equal(manifest.version, 2);
  assert.equal(manifest.sourceKind, "chatgpt-image-generation");
  assert.equal(manifest.generatedSheets.length >= 20, true);
  assert.equal(manifest.rasterAssets.length >= 392, true);
  assert.equal(manifest.generatedSheets.some((sheet) => sheet.id === "aidm-ambience-scenes-sheet-002"), true);

  for (const sheet of manifest.generatedSheets) {
    assert.equal(sheet.assetType, "raster-sheet");
    assert.equal(sheet.provenance.generator, "chatgpt-image-generation");
    assert.equal(Boolean(sheet.provenance.promptId), true);
    assert.equal(Boolean(sheet.provenance.sourceSha256), true);
    assert.equal(sheet.assetIds.length, sheet.tile.columns * sheet.tile.rows);
    assertGeneratedSheetBinaryContract(sheet);
  }

  for (const asset of manifest.rasterAssets) {
    assert.equal(asset.provenance.generator, "chatgpt-image-generation");
    assert.equal(asset.assetType, "raster");
    assert.equal(Boolean(asset.categoryId), true);
    await assertGeneratedAssetBinaryContract(asset);
    if (asset.svgFile) {
      await access(asset.svgFile);
    } else {
      assert.match(asset.file, /\.png$/);
    }
  }
});

test("generated raster inventory counts stay internally consistent", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const characterOptions = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-character-options-sheet-008");
  const npcTokens = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-npc-tokens-sheet-012");
  const productionScenes = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-production-scenes-sheet-011");
  const productionScenes027 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-production-scenes-sheet-027");
  const weatherScenes028 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-weather-scenes-sheet-028");
  const sheet013 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-equipment-fashion-sheet-013");
  const sheet014 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-weapons-sheet-014");
  const sheet015 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-spells-sheet-015");
  const sheet016 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-trade-goods-sheet-016");
  const sheet017 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-quest-clues-sheet-017");
  const sheet018 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-status-effects-sheet-018");
  const sheet019 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-accessories-cutouts-sheet-019");
  const sheet020 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-transparent-cutouts-sheet-020");
  const sheet021 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-tools-cutouts-sheet-021");
  const sheet022 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-trophies-cutouts-sheet-022");
  const sheet023 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-wearables-cutouts-sheet-023");
  const sheet024 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-weapons-cutouts-sheet-024");
  const sheet025 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-magic-cutouts-sheet-025");
  const sheet026 = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-trade-cutouts-sheet-026");
  const expectedRasterCount = 200
    + productionScenes.length
    + npcTokens.length
    + sheet013.length
    + sheet014.length
    + sheet015.length
    + sheet016.length
    + sheet017.length
    + sheet018.length
    + sheet019.length
    + sheet020.length
    + sheet021.length
    + sheet022.length
    + sheet023.length
    + sheet024.length
    + sheet025.length
    + sheet026.length
    + productionScenes027.length
    + weatherScenes028.length;
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");
  const internalAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "internal");
  const runtimePromotedAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "runtime-promoted");
  const sceneAssets = manifest.rasterAssets.filter((asset) => {
    return asset.assetType === "raster"
      && asset.categoryId === "scenes"
      && asset.group === "generated-scenes";
  });

  assert.equal(manifest.generatedSheets.length >= 27, true);
  assert.equal(manifest.plannedSheets.length >= 11, true);
  assert.equal(characterOptions.length, 16);
  assert.equal(productionScenes.length, 16);
  assert.equal(productionScenes027.length, 16);
  assert.equal(weatherScenes028.length, 16);
  assert.equal(npcTokens.length, 16);
  assert.equal(sheet013.length, 16);
  assert.equal(sheet014.length, 16);
  assert.equal(sheet015.length, 16);
  assert.equal(sheet016.length, 16);
  assert.equal(sheet017.length, 16);
  assert.equal(sheet018.length, 16);
  assert.equal(sheet019.length, 16);
  assert.equal(sheet020.length, 16);
  assert.equal(sheet021.length, 16);
  assert.equal(sheet022.length, 16);
  assert.equal(sheet023.length, 16);
  assert.equal(sheet024.length, 16);
  assert.equal(sheet025.length, 16);
  assert.equal(sheet026.length, 16);
  assert.equal(manifest.rasterAssets.length >= expectedRasterCount, true);
  assert.equal(manifest.rasterAssets.length >= 488, true);
  assert.equal(manifest.assets.length, manifest.rasterAssets.length);
  assert.equal(manifest.sheets.length, manifest.generatedSheets.length);
  assert.equal(manifest.assetCatalog?.actualGeneratedRasterAssets, manifest.rasterAssets.length);
  assert.equal(manifest.assetCatalog?.playerSafeAssets, playerSafeAssets.length);
  assert.equal(manifest.assetCatalog?.internalAssets, internalAssets.length);
  assert.equal(manifest.assetCatalog?.runtimePromotedAssets, runtimePromotedAssets.length);
  assert.equal(manifest.assetCatalog?.targetAssetCount >= 3000, true);
  assert.equal(manifest.sceneLibrary?.targetSceneCount, 500);
  assert.equal(manifest.sceneLibrary?.actualGeneratedRasterScenes, sceneAssets.length);

  for (const sheet of manifest.generatedSheets) {
    const sheetAssets = manifest.rasterAssets.filter((asset) => asset.sheetId === sheet.id);
    assert.equal(sheet.assetIds.length, sheetAssets.length, `${sheet.id} assetIds must match registered frames`);
    assert.deepEqual(
      new Set(sheet.assetIds),
      new Set(sheetAssets.map((asset) => asset.id)),
      `${sheet.id} assetIds must match raster asset ids`,
    );
  }
});

test("generated marketplace exposes reviewed scenes without internal review assets", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sceneCategory = manifest.marketplace.categories.find((category) => category.id === "scenes");
  const sceneAssets = manifest.rasterAssets.filter((asset) => asset.categoryId === "scenes");
  const internalOrReviewScenes = sceneAssets.filter((asset) => {
    return asset.visibility !== "player-safe"
      || asset.group !== "generated-scenes"
      || asset.uiSurface?.includes("catalog-internal")
      || asset.quality?.reviewStatus === "ingested-review-only"
      || asset.quality?.approved !== true;
  });

  assert.equal(Boolean(sceneCategory), true);
  assert.equal(sceneCategory.name, "Scenes");
  assert.deepEqual(sceneCategory.groups, ["generated-scenes"]);
  assert.deepEqual(sceneCategory.assetTypes, ["raster"]);
  assert.equal(sceneAssets.length >= 128, true);
  assert.deepEqual(internalOrReviewScenes, []);
});

test("player-safe generated assets keep immersive descriptions and semantic keys", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");
  const assetsBySemanticKey = new Map();

  assert.equal(playerSafeAssets.length >= 452, true);

  for (const asset of playerSafeAssets) {
    const description = englishDescription(asset);

    assert.equal(Boolean(asset.semanticKey), true, `${asset.id} must include a semanticKey`);
    assetsBySemanticKey.set(asset.semanticKey, [...(assetsBySemanticKey.get(asset.semanticKey) || []), asset]);
    assert.equal(description.length >= 70, true, `${asset.id} must include an immersive description`);
    assert.equal(wordCount(description) >= 10, true, `${asset.id} description must be more than a terse label`);
    assert.equal(isProvenanceDescription(description), false, `${asset.id} description must not be provenance text`);
    assert.equal(asset.quality?.approved, true, `${asset.id} must be approved before player exposure`);
    assert.equal(Array.isArray(asset.uiSurface), true, `${asset.id} must define UI surfaces`);
    assert.equal(asset.uiSurface.length > 0, true, `${asset.id} must define at least one UI surface`);

    if (typeof asset.description === "object") {
      assert.equal(Boolean(asset.description.zh), true, `${asset.id} must include a Chinese description`);
    }
  }

  const duplicateSemanticKeys = [...assetsBySemanticKey.entries()].filter(([, assets]) => assets.length > 1);

  assert.equal(
    duplicateSemanticKeys.length <= 8,
    true,
    "current scene semantic-key duplicate debt must not grow",
  );

  for (const [semanticKey, assets] of duplicateSemanticKeys) {
    assert.equal(
      assets.every((asset) => asset.categoryId === "scenes" && asset.group === "generated-scenes"),
      true,
      `${semanticKey} duplicate semantic keys are only tolerated for current scene variants`,
    );
  }
});

test("player-facing scene item and character assets keep description and classification contracts", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");
  const allowedPlayerSurfaces = new Set(manifest.exposurePolicy.playerFlowSurfaces);
  const sceneAssets = playerSafeAssets.filter((asset) => asset.categoryId === "scenes");
  const itemAssets = playerSafeAssets.filter((asset) => asset.categoryId === "equipment");
  const characterAssets = playerSafeAssets.filter((asset) => asset.categoryId === "characters");
  const itemSurfaces = new Set(["inventory-item", "market-item", "reward-card", "item-detail", "transcript-event"]);
  const characterSurfaces = new Set(["character-builder", "party-avatar", "player-detail", "encounter-card", "npc-token", "combatant-detail"]);

  assert.equal(sceneAssets.length >= 128, true);
  assert.equal(itemAssets.length >= 272, true);
  assert.equal(characterAssets.length >= 32, true);

  for (const asset of sceneAssets) {
    assert.equal(asset.group, "generated-scenes");
    assert.equal(["scene-backdrop", "raster-scene-backdrop"].includes(asset.type), true, `${asset.id} must be a scene backdrop`);
    assert.equal(asset.uiSurface.every((surface) => allowedPlayerSurfaces.has(surface)), true, `${asset.id} must use known player surfaces`);
    assert.equal(asset.uiSurface.every((surface) => ["stage-backdrop", "relevant-scene"].includes(surface)), true, `${asset.id} must stay in scene surfaces`);
    assert.equal(asset.uiSurface.includes("stage-backdrop"), true, `${asset.id} must be selectable as a stage backdrop`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.match(asset.semanticKey, /^scene\./);
    assert.equal(Boolean(asset.sceneSlug), true, `${asset.id} must include sceneSlug`);
    assert.equal(Boolean(asset.taxonomy), true, `${asset.id} must include taxonomy`);
    assert.equal(Boolean(asset.weather), true, `${asset.id} must include weather`);
    assert.equal(Boolean(asset.timeOfDay), true, `${asset.id} must include timeOfDay`);
    assert.equal(Boolean(asset.mood), true, `${asset.id} must include mood`);
    assert.equal(Boolean(asset.threatLevel), true, `${asset.id} must include threatLevel`);
    assert.equal(Array.isArray(asset.soundscapeHints), true, `${asset.id} must include soundscapeHints`);
    assert.equal(asset.soundscapeHints.length >= 2, true, `${asset.id} must include matchable soundscape hints`);
    assert.equal(typeof asset.description, "string", `${asset.id} scene descriptions must be stage text`);
    assert.equal(wordCount(asset.description) >= 12, true, `${asset.id} scene description must be immersive`);
    assert.equal(isProvenanceDescription(asset.description), false);
  }

  for (const asset of itemAssets) {
    assert.equal(["generated-rewards", "generated-quest-clues"].includes(asset.group), true, `${asset.id} must stay in item groups`);
    assert.equal(asset.uiSurface.every((surface) => allowedPlayerSurfaces.has(surface)), true, `${asset.id} must use known player surfaces`);
    assert.equal(asset.uiSurface.every((surface) => itemSurfaces.has(surface)), true, `${asset.id} must stay in item surfaces`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.match(asset.semanticKey, /^(items|equipment)\./);
    assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
    assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include English description`);
    assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include Chinese description`);
    assert.equal(wordCount(asset.description.en) >= 10, true, `${asset.id} description must be immersive`);
    assert.equal(isProvenanceDescription(asset.description.en), false);
    assert.equal(Boolean(asset.variantAxes?.itemKind), true, `${asset.id} must include item kind axis`);
    assert.equal(Boolean(asset.variantAxes?.rarity), true, `${asset.id} must include rarity axis`);
    assert.equal(Boolean(asset.variantAxes?.culture), true, `${asset.id} must include culture axis`);
    assert.equal(Boolean(asset.variantAxes?.visualStyle), true, `${asset.id} must include visual style axis`);
    if (asset.group === "generated-quest-clues") {
      assert.equal(asset.uiSurface.includes("market-item"), false, `${asset.id} quest clues must not be direct market goods`);
      assert.equal(asset.gameplayBinding?.requiresQuestDefinition, true, `${asset.id} must require quest definitions`);
    }
    if (asset.gameplayBinding?.requiresItemDefinition !== undefined) {
      assert.equal(asset.gameplayBinding.requiresItemDefinition, true, `${asset.id} item binding cannot be explicitly disabled`);
    }
  }

  for (const asset of characterAssets) {
    assert.equal(["generated-character-options", "generated-npc-tokens"].includes(asset.group), true, `${asset.id} must stay in character groups`);
    assert.equal(asset.uiSurface.every((surface) => allowedPlayerSurfaces.has(surface)), true, `${asset.id} must use known player surfaces`);
    assert.equal(asset.uiSurface.every((surface) => characterSurfaces.has(surface)), true, `${asset.id} must stay in character surfaces`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
    assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include English description`);
    assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include Chinese description`);
    assert.equal(wordCount(asset.description.en) >= 10, true, `${asset.id} description must be immersive`);
    assert.equal(isProvenanceDescription(asset.description.en), false);

    if (asset.group === "generated-character-options") {
      assert.match(asset.semanticKey, /^characters\.(species|class)\.[a-z-]+\.v\d+$/);
      assert.equal(["species", "class"].includes(asset.variantAxes?.kind), true, `${asset.id} must classify character option kind`);
      assert.equal(Boolean(asset.variantAxes?.rulesId), true, `${asset.id} must include rules id`);
      assert.equal(["ancestry", "class"].includes(asset.gameplay?.slot), true, `${asset.id} must bind to a player option slot`);
    } else {
      assert.match(asset.semanticKey, /^characters\.npc\.[a-z0-9-]+\.v01$/);
      assert.equal(asset.variantAxes?.kind, "npc-token");
      assert.equal(asset.gameplayBinding?.requiresNpcDefinition, true, `${asset.id} must require NPC definitions`);
      assert.equal(asset.uiSurface.includes("character-builder"), false, `${asset.id} NPC tokens must not enter character builder`);
    }
  }
});

test("player-safe visibility does not leak internal generated assets to player UI", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const playerSurfaces = new Set([
    "stage-backdrop",
    "reward-card",
    "transcript-event",
    "inventory-item",
    "market-item",
    "item-detail",
    "character-builder",
    "party-avatar",
    "player-detail",
    "relevant-scene",
    "encounter-card",
    "npc-token",
    "combatant-detail",
    "spell-card",
    "status-icon"
  ]);
  const runtimePromotionSurfaces = new Set([
    ...playerSurfaces,
    "leveling-rule-card",
    "leveling-chip",
    "combat-skill-card",
    "leveling-summary",
    "leveling-specialization"
  ]);
  const internalAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "internal");
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");
  const runtimePromotedAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "runtime-promoted");

  assert.equal(internalAssets.length >= 36, true);
  assert.equal(playerSafeAssets.length >= 452, true);
  assert.equal(runtimePromotedAssets.length, 102);

  for (const asset of internalAssets) {
    assert.equal(asset.quality?.approved, false, `${asset.id} internal placeholders must not be approved`);
    assert.deepEqual(asset.uiSurface, ["catalog-internal"]);
    assert.equal(asset.uiSurface.some((surface) => playerSurfaces.has(surface)), false);
  }

  for (const asset of playerSafeAssets) {
    assert.equal(asset.uiSurface.every((surface) => playerSurfaces.has(surface)), true, `${asset.id} exposes an unknown surface`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose internal catalog surface`);
  }

  for (const asset of runtimePromotedAssets) {
    assert.deepEqual(asset.uiSurface, ["ui-approved-runtime"], `${asset.id} must use the runtime promotion boundary`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not remain catalog-internal`);
    assert.equal(asset.quality?.approved, false, `${asset.id} must not become broadly player-safe without visual QA`);
    assert.equal(asset.quality?.runtimePromotionStatus, "ui-approved-runtime", `${asset.id} must declare runtime promotion status`);
    assert.equal(asset.runtimePromotion?.status, "ui-approved-runtime", `${asset.id} must carry runtime promotion metadata`);
    assert.equal(asset.runtimePromotion?.catalogExposure, false, `${asset.id} must not be catalog exposed`);
    assert.equal(Array.isArray(asset.runtimePromotion?.playerSurfaces), true, `${asset.id} must declare audited player surfaces`);
    assert.equal(asset.runtimePromotion.playerSurfaces.length > 0, true, `${asset.id} must declare audited player surfaces`);
    assert.equal(
      asset.runtimePromotion.playerSurfaces.every((surface) => runtimePromotionSurfaces.has(surface)),
      true,
      `${asset.id} exposes an unknown runtime promotion surface`,
    );
  }
});

test("sheet 011 production scenes are player-safe relevant stage backdrops", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-production-scenes-sheet-011");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-production-scenes-sheet-011");

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(assets.length, 16);

  for (const asset of assets) {
    assert.equal(asset.categoryId, "scenes");
    assert.equal(asset.group, "generated-scenes");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.type, "scene-backdrop");
    assert.deepEqual(asset.uiSurface, ["stage-backdrop", "relevant-scene"]);
    assert.match(asset.semanticKey, /^scene\.production\.[a-z0-9-]+\.v01$/);
    assert.equal(asset.tags.includes("stage-backdrop"), true);
    assert.equal(asset.tags.includes("relevant-scene"), true);
    assert.equal(Array.isArray(asset.soundscapeHints), true);
    assert.equal(asset.soundscapeHints.length >= 2, true);
    assert.equal(isProvenanceDescription(asset.description), false, `${asset.id} description must not be provenance text`);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheets 027 and 028 grand scenes are player-safe soundscape-ready backdrops", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const expectations = [
    {
      sheetId: "aidm-production-scenes-sheet-027",
      metadataPlanId: "sheet-027-production-scenes",
      semanticPattern: /^scene\.production\.[a-z0-9-]+\.v01$/,
    },
    {
      sheetId: "aidm-weather-scenes-sheet-028",
      metadataPlanId: "sheet-028-weather-scenes",
      semanticPattern: /^scene\.weather\.[a-z0-9-]+\.v01$/,
    },
  ];

  for (const expectation of expectations) {
    const plan = manifest.plannedSheets.find((entry) => entry.metadataPlanId === expectation.metadataPlanId);
    const sheet = manifest.generatedSheets.find((entry) => entry.id === expectation.sheetId);
    const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === expectation.sheetId);

    assert.equal(Boolean(plan), true);
    assert.equal(plan.status, "metadata-ready-for-ingest");
    assert.equal(plan.categoryId, "scenes");
    assert.equal(plan.group, "generated-scenes");
    assert.equal(plan.expectedOutDir, "assets/generated/scenes");
    assert.deepEqual(plan.expectedGrid, { columns: 4, rows: 4 });
    assert.equal(plan.transparency, "full-bleed painted scene");
    assert.deepEqual(plan.metadataTemplate.uiSurface, ["stage-backdrop", "relevant-scene"]);
    assert.deepEqual(plan.metadataTemplate.approvalRules.allowedPlayerSurfaces, ["stage-backdrop", "relevant-scene"]);
    assert.equal(plan.metadataTemplate.frameTemplatePattern.frameCount, 16);
    assert.equal(plan.metadataTemplate.frameTemplates.length, 16);
    assert.equal(plan.classification.notForSurfaces.includes("catalog-internal"), true);
    assert.equal(Boolean(sheet), true);
    assert.equal(sheet.tile.columns, 4);
    assert.equal(sheet.tile.rows, 4);
    assert.equal(sheet.assetIds.length, 16);
    assert.equal(assets.length, 16);

    for (const asset of assets) {
      assert.equal(asset.categoryId, "scenes");
      assert.equal(asset.group, "generated-scenes");
      assert.equal(asset.visibility, "player-safe");
      assert.equal(asset.type, "scene-backdrop");
      assert.deepEqual(asset.uiSurface, ["stage-backdrop", "relevant-scene"]);
      assert.equal(asset.uiSurface.includes("catalog-internal"), false);
      assert.match(asset.semanticKey, expectation.semanticPattern);
      assert.equal(Boolean(asset.name), true, `${asset.id} must include an English name`);
      assert.equal(Boolean(asset.zhName), true, `${asset.id} must include a Chinese name`);
      assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
      assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
      assert.equal(Boolean(asset.sceneSlug), true, `${asset.id} must include sceneSlug`);
      assert.equal(Boolean(asset.taxonomy), true, `${asset.id} must include taxonomy`);
      assert.equal(Boolean(asset.weather), true, `${asset.id} must include weather`);
      assert.equal(Boolean(asset.timeOfDay), true, `${asset.id} must include timeOfDay`);
      assert.equal(Boolean(asset.mood), true, `${asset.id} must include mood`);
      assert.equal(Boolean(asset.threatLevel), true, `${asset.id} must include threatLevel`);
      assert.equal(Array.isArray(asset.soundscapeHints), true, `${asset.id} must include soundscapeHints`);
      assert.equal(asset.soundscapeHints.length >= 3, true, `${asset.id} must include matchable soundscape hints`);
      assert.equal(isProvenanceDescription(asset.description), false, `${asset.id} description must not be provenance text`);
      assert.equal(wordCount(asset.description) >= 16, true, `${asset.id} description must be immersive`);
      assert.equal(asset.tags.includes("stage-backdrop"), true);
      assert.equal(asset.tags.includes("relevant-scene"), true);
      await assertGeneratedAssetBinaryContract(asset);
      await access(asset.svgFile);
    }
  }
});

test("sheet 012 npc tokens are scoped to encounter and combat surfaces", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-npc-tokens-sheet-012");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-npc-tokens-sheet-012");
  const expectedSurfaces = ["encounter-card", "npc-token", "combatant-detail"];

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(assets.length, 16);

  for (const asset of assets) {
    assert.equal(asset.categoryId, "characters");
    assert.equal(asset.group, "generated-npc-tokens");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.type, "npc-token");
    assert.deepEqual(asset.uiSurface, expectedSurfaces);
    assert.equal(asset.uiSurface.includes("character-builder"), false);
    assert.equal(asset.uiSurface.includes("player-detail"), false);
    assert.equal(asset.uiSurface.includes("party-avatar"), false);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.match(asset.semanticKey, /^characters\.npc\.[a-z0-9-]+\.v01$/);
    assert.equal(asset.variantAxes?.kind, "npc-token");
    assert.equal(Boolean(asset.variantAxes?.role), true, `${asset.id} must include npc role axis`);
    assert.equal(Boolean(asset.gameplayBinding?.requiresNpcDefinition), true, `${asset.id} must require data-backed npc definitions`);
    assert.deepEqual(asset.gameplayBinding?.flow, ["encounter", "npc-token", "combatant-detail"]);
    assert.equal(isProvenanceDescription(englishDescription(asset)), false, `${asset.id} description must not be provenance text`);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheets 013 through 016 are registered as reviewed player-safe runtime assets", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const itemSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];
  const spellSurfaces = ["spell-card", "character-builder"];
  const sheetExpectations = [
    {
      sheetId: "aidm-equipment-fashion-sheet-013",
      group: "generated-rewards",
      categoryId: "equipment",
      surfaces: itemSurfaces,
      semanticPattern: /^items\.[a-z-]+\.[a-z0-9-]+\.v01$/,
      bindingKey: "requiresItemDefinition",
    },
    {
      sheetId: "aidm-weapons-sheet-014",
      group: "generated-rewards",
      categoryId: "equipment",
      surfaces: itemSurfaces,
      semanticPattern: /^items\.[a-z-]+\.[a-z0-9-]+\.v01$/,
      bindingKey: "requiresItemDefinition",
    },
    {
      sheetId: "aidm-spells-sheet-015",
      group: "generated-spells",
      categoryId: "spells",
      surfaces: spellSurfaces,
      semanticPattern: /^spells\.[a-z-]+\.[a-z0-9-]+\.v01$/,
      bindingKey: "requiresSpellDefinition",
    },
    {
      sheetId: "aidm-trade-goods-sheet-016",
      group: "generated-rewards",
      categoryId: "equipment",
      surfaces: itemSurfaces,
      semanticPattern: /^items\.[a-z-]+\.[a-z0-9-]+\.v01$/,
      bindingKey: "requiresItemDefinition",
    },
  ];

  for (const expectation of sheetExpectations) {
    const sheet = manifest.generatedSheets.find((entry) => entry.id === expectation.sheetId);
    const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === expectation.sheetId);

    assert.equal(Boolean(sheet), true);
    assert.equal(sheet.tile.columns, 4);
    assert.equal(sheet.tile.rows, 4);
    assert.equal(sheet.assetIds.length, 16);
    assert.equal(assets.length, 16);

    for (const asset of assets) {
      assert.equal(asset.group, expectation.group);
      assert.equal(asset.categoryId, expectation.categoryId);
      assert.equal(asset.visibility, "player-safe");
      assert.deepEqual(asset.uiSurface, expectation.surfaces);
      assert.equal(asset.uiSurface.includes("catalog-internal"), false);
      assert.match(asset.semanticKey, expectation.semanticPattern);
      assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
      assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
      assert.equal(isProvenanceDescription(englishDescription(asset)), false, `${asset.id} description must not be provenance text`);
      assert.equal(wordCount(englishDescription(asset)) >= 10, true, `${asset.id} description must be immersive`);
      assert.equal(Boolean(asset.variantAxes), true, `${asset.id} must include variant axes`);
      assert.equal(asset.gameplayBinding?.[expectation.bindingKey], true, `${asset.id} must require data-backed runtime definition`);
      assert.equal(asset.quality?.approved, true);
      await assertGeneratedAssetBinaryContract(asset);
      await access(asset.svgFile);
    }
  }
});

test("sheet 017 quest clue assets are flow-bound investigation items", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-quest-clues-sheet-017");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-quest-clues-sheet-017");
  const expectedSurfaces = ["inventory-item", "reward-card", "item-detail", "transcript-event"];

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(assets.length, 16);

  for (const asset of assets) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-quest-clues");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.type, "quest-clue");
    assert.deepEqual(asset.uiSurface, expectedSurfaces);
    assert.equal(asset.uiSurface.includes("market-item"), false);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.match(asset.semanticKey, /^items\.quest-clue\.[a-z0-9-]+\.v01$/);
    assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
    assert.equal(Boolean(asset.variantAxes?.itemKind), true, `${asset.id} must include item kind axis`);
    assert.equal(Boolean(asset.variantAxes?.clueRole), true, `${asset.id} must include clue role axis`);
    assert.equal(asset.gameplayBinding?.requiresItemDefinition, true, `${asset.id} must require data-backed item definitions`);
    assert.equal(asset.gameplayBinding?.requiresQuestDefinition, true, `${asset.id} must require data-backed quest definitions`);
    assert.equal(asset.gameplayBinding?.marketEligible, false, `${asset.id} must not be directly market eligible`);
    assert.equal(isProvenanceDescription(englishDescription(asset)), false, `${asset.id} description must not be provenance text`);
    assert.equal(wordCount(englishDescription(asset)) >= 10, true, `${asset.id} description must be immersive`);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheet 018 status effect icons never expose as market goods", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-status-effects-sheet-018");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-status-effects-sheet-018");
  const expectedSurfaces = ["status-icon", "combatant-detail", "transcript-event", "player-detail"];
  const forbiddenMarketSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.categoryId, "rules");
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(assets.length, 16);
  assert.equal(manifest.exposurePolicy.playerFlowSurfaces.includes("status-icon"), true);

  for (const asset of assets) {
    assert.equal(asset.categoryId, "rules");
    assert.equal(asset.group, "generated-status-effects");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.type, "status-icon");
    assert.deepEqual(asset.uiSurface, expectedSurfaces);
    assert.equal(forbiddenMarketSurfaces.some((surface) => asset.uiSurface.includes(surface)), false);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.match(asset.semanticKey, /^rules\.condition\.[a-z0-9-]+\.v01$/);
    assert.equal(asset.variantAxes?.kind, "condition-icon");
    assert.equal(Boolean(asset.variantAxes?.conditionId), true, `${asset.id} must include condition id axis`);
    assert.equal(asset.gameplayBinding?.requiresConditionDefinition, true, `${asset.id} must require data-backed condition definitions`);
    assert.equal(asset.gameplayBinding?.marketEligible, false, `${asset.id} must not be directly market eligible`);
    assert.equal(asset.tags.includes("market-item"), false, `${asset.id} must not be tagged as a market item`);
    assert.equal(isProvenanceDescription(englishDescription(asset)), false, `${asset.id} description must not be provenance text`);
    assert.equal(wordCount(englishDescription(asset)) >= 10, true, `${asset.id} description must be immersive`);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheet 019 transparent accessory cutouts stay flow-bound item art", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-accessories-cutouts-sheet-019");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-accessories-cutouts-sheet-019");
  const expectedSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];
  const expectedItems = [
    "ruby-signet-ring",
    "sapphire-ear-cuff",
    "moonstone-necklace",
    "brass-monocle",
    "silver-prayer-beads",
    "coin-purse",
    "raven-brooch",
    "stormglass-pendant",
    "pearl-hairpin",
    "bone-charm-bracelet",
    "compass-locket",
    "jade-clan-token",
    "black-iron-collar",
    "merchant-guild-pin",
    "crystal-focus-ring",
    "music-box-charm",
  ];

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.categoryId, "equipment");
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(assets.length, 16);

  for (const [index, asset] of assets.entries()) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-rewards");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.type, "raster-icon");
    assert.deepEqual(asset.uiSurface, expectedSurfaces);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.equal(asset.tags.includes("transparent-cutout"), true, `${asset.id} must carry transparent-cutout tag`);
    assert.equal(asset.tags.includes("sheet-019"), true, `${asset.id} must carry sheet-019 tag`);
    assert.match(asset.semanticKey, /^items\.[a-z-]+\.[a-z0-9-]+\.cutout\.v01$/);
    assert.equal(asset.variantOf, expectedItems[index]);
    assert.equal(Boolean(asset.variantAxes?.culture), true, `${asset.id} must include culture axis`);
    assert.equal(Boolean(asset.variantAxes?.itemKind), true, `${asset.id} must include item kind axis`);
    assert.equal(asset.variantAxes?.visualStyle, "transparent-cutout");
    assert.deepEqual(asset.gameplayBinding?.flow, ["inventory", "market", "reward", "item-detail"]);
    assert.equal(asset.gameplayBinding?.requiresItemDefinition, true, `${asset.id} must require data-backed item definitions`);
    assert.equal(asset.gameplayBinding?.marketEligible, true, `${asset.id} must be eligible only through item-backed market flows`);
    assert.equal(isProvenanceDescription(englishDescription(asset)), false, `${asset.id} description must not be provenance text`);
    assert.equal(wordCount(englishDescription(asset)) >= 10, true, `${asset.id} description must be immersive`);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheet 008 character option assets are ready for character and party surfaces", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-character-options-sheet-008");
  const options = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-character-options-sheet-008");
  const kinds = new Map();

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.categoryId, "characters");
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(options.length, 16);

  for (const asset of options) {
    kinds.set(asset.variantAxes?.kind, (kinds.get(asset.variantAxes?.kind) || 0) + 1);
    assert.equal(asset.group, "generated-character-options");
    assert.equal(asset.categoryId, "characters");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.quality?.approved, true);
    assert.equal(asset.uiSurface.includes("character-builder"), true, `${asset.id} must appear in character builder`);
    assert.equal(asset.uiSurface.includes("party-avatar"), true, `${asset.id} must appear in party avatars`);
    assert.equal(asset.uiSurface.includes("player-detail"), true, `${asset.id} must appear in player detail`);
    assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include an English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include a Chinese display name`);
    assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include an English description`);
    assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include a Chinese description`);
    assert.match(asset.semanticKey, /^characters\.(species|class)\.[a-z-]+\.v\d+$/);
    assert.equal(Boolean(asset.variantAxes?.rulesId), true, `${asset.id} must bind to a rules id`);
    assert.equal(asset.gameplay?.rulesId, asset.variantAxes.rulesId);
    assert.equal(["ancestry", "class"].includes(asset.gameplay?.slot), true, `${asset.id} must bind to a gameplay slot`);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }

  assert.equal(kinds.get("species"), 8);
  assert.equal(kinds.get("class"), 8);
});

test("ambience scene assets keep soundscape hints for stage selection", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const ambienceScenes = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-ambience-scenes-sheet-002");

  assert.equal(ambienceScenes.length, 16);
  assert.equal(ambienceScenes.every((asset) => asset.type === "scene-backdrop"), true);
  assert.equal(ambienceScenes.some((asset) => asset.soundscapeHints.includes("rain")), true);
  assert.equal(ambienceScenes.some((asset) => asset.soundscapeHints.includes("forest")), true);
  assert.equal(ambienceScenes.some((asset) => asset.soundscapeHints.includes("waterfall")), true);
  assert.equal(ambienceScenes.some((asset) => asset.soundscapeHints.includes("campfire")), true);
  assert.equal(ambienceScenes.some((asset) => asset.soundscapeHints.includes("market")), true);
});

test("generated raster scene assets are immersive and source-traceable", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sceneAssets = manifest.rasterAssets.filter((asset) => {
    return asset.assetType === "raster"
      && asset.categoryId === "scenes"
      && asset.group === "generated-scenes"
      && asset.visibility === "player-safe"
      && asset.uiSurface?.includes("stage-backdrop");
  });

  assert.equal(
    sceneAssets.length >= 80,
    true,
    `expected at least 80 generated raster scene assets, found ${sceneAssets.length}`,
  );
  assert.equal(manifest.sceneLibrary?.targetSceneCount, 500);
  assert.equal(manifest.sceneLibrary?.actualGeneratedRasterScenes, sceneAssets.length);

  for (const asset of sceneAssets) {
    assert.equal(
      asset.provenance?.generator,
      manifest.sourceKind,
      `${asset.id} must keep provenance.generator aligned with manifest.sourceKind`,
    );
    assert.equal(
      typeof manifest.sourceKind,
      "string",
      `${asset.id} must be traceable to a manifest sourceKind`,
    );
    assert.equal(
      manifest.sourceKind.length > 0,
      true,
      `${asset.id} must be traceable to a non-empty manifest sourceKind`,
    );
    assert.equal(
      typeof asset.description,
      "string",
      `${asset.id} must include a scene description`,
    );
    assert.equal(
      asset.description.trim().length >= 80,
      true,
      `${asset.id} description must be immersive, not a short label`,
    );
    assert.equal(
      asset.description.trim().split(/\s+/).length >= 12,
      true,
      `${asset.id} description must read like a stageable scene prompt`,
    );
    assert.equal(
      Array.isArray(asset.soundscapeHints),
      true,
      `${asset.id} must include soundscapeHints`,
    );
    assert.equal(
      asset.soundscapeHints.filter((hint) => typeof hint === "string" && hint.trim().length > 0).length >= 2,
      true,
      `${asset.id} must include at least two soundscape hints`,
    );
  }
});

test("generated reward assets are player-safe and runtime-addressable", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const rewardAssets = manifest.rasterAssets.filter((asset) => asset.group === "generated-rewards");

  assert.equal(rewardAssets.length >= 180, true, `expected at least 180 generated reward assets, found ${rewardAssets.length}`);
  assert.equal(manifest.assetCatalog?.targetAssetCount >= 1200, true);
  assert.equal(manifest.assetCatalog?.actualGeneratedRasterAssets, manifest.rasterAssets.length);

  const semanticKeys = new Set();
  for (const asset of rewardAssets) {
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.uiSurface.includes("reward-card"), true);
    assert.equal(
      asset.uiSurface.includes("transcript-event")
        || asset.uiSurface.includes("inventory-item")
        || asset.uiSurface.includes("market-item")
        || asset.uiSurface.includes("item-detail"),
      true,
      `${asset.id} must bind to a reward, inventory, market, detail, or transcript flow`,
    );
    assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include an English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include a Chinese display name`);
    assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include an English description`);
    assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include a Chinese description`);
    assert.equal(Boolean(asset.semanticKey), true, `${asset.id} must include semanticKey`);
    assert.equal(Boolean(asset.variantOf), true, `${asset.id} must include variantOf`);
    assert.equal(Boolean(asset.variantAxes?.culture), true, `${asset.id} must include culture variant axis`);
    assert.equal(Boolean(asset.variantAxes?.itemKind), true, `${asset.id} must include item kind axis`);
    assert.equal(asset.quality?.approved, true, `${asset.id} must be approved before player use`);
    assert.equal(semanticKeys.has(asset.semanticKey), false, `${asset.semanticKey} must be unique`);
    semanticKeys.add(asset.semanticKey);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("runtime item catalog binds concrete items to registered generated assets", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const registeredFiles = new Set(manifest.rasterAssets.map((asset) => asset.file));
  const registeredSemanticKeys = new Set(manifest.rasterAssets.map((asset) => asset.semanticKey));
  const boundItemIds = [
    "dagger",
    "staff",
    "mace",
    "robe",
    "healing-draught",
    "mana-vial",
    "trail-ration",
    "spiced-rations",
    "festival-wine",
    "minor-portrait",
    "sealed-spices",
    "storm-ward-amulet",
    "lockpick-kit",
    "tower-shield",
    "ember-bomb",
    "signet-ring",
    "rain-city-map",
    "merchant-contract",
    "ceremonial-robe",
    "bone-dice-set",
    "brass-monocle",
    "etched-war-axe"
  ];

  for (const itemId of boundItemIds) {
    const assetRef = ITEM_CATALOG[itemId].assetRef;

    assert.equal(registeredFiles.has(assetRef.file), true, `${itemId} must use a registered generated raster file`);
    assert.equal(registeredSemanticKeys.has(assetRef.semanticKey), true, `${itemId} must use a registered generated semantic key`);
  }
});

test("runtime item catalog promotes selected sheet 009 market items into concrete definitions", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const registeredAssetsByFile = new Map(manifest.rasterAssets.map((asset) => [asset.file, asset]));
  const shopItemIds = new Set(SHOP_CATALOG.map((offer) => offer.itemId));
  const expectedPromotions = [
    ["mana-vial", "aidm-market-item-009-02", "consumable", "recovery"],
    ["storm-ward-amulet", "aidm-market-item-009-03", "amulet", "minor-magic"],
    ["lockpick-kit", "aidm-market-item-009-04", "tool", "utility"],
    ["tower-shield", "aidm-market-item-009-14", "shield", "equipment"],
    ["spiced-rations", "aidm-market-item-009-17", "consumable", "supply"]
  ];

  for (const [itemId, assetId, itemKind, economyRole] of expectedPromotions) {
    const definition = ITEM_CATALOG[itemId];
    const registeredAsset = registeredAssetsByFile.get(definition.assetRef.file);

    assert.ok(registeredAsset, `${itemId} must use a registered sheet 009 raster file`);
    assert.equal(registeredAsset.id, assetId);
    assert.equal(registeredAsset.sheetId, "aidm-market-items-sheet-009");
    assert.equal(registeredAsset.group, "generated-rewards");
    assert.equal(registeredAsset.categoryId, "equipment");
    assert.equal(registeredAsset.visibility, "player-safe");
    assert.deepEqual(registeredAsset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(registeredAsset.semanticKey, definition.assetRef.semanticKey);
    assert.equal(registeredAsset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(registeredAsset.gameplayBinding?.itemKind, itemKind);
    assert.equal(registeredAsset.gameplayBinding?.economyRole, economyRole);
    assert.deepEqual(registeredAsset.gameplayBinding?.flow, ["inventory", "market", "reward", "item-detail"]);
    assert.equal(registeredAsset.quality?.approved, true);
    assert.equal(registeredAsset.quality?.reviewStatus, "approved");
    assert.equal(registeredAsset.uiSurface.includes("catalog-internal"), false);
    assert.equal(shopItemIds.has(itemId), true, `${itemId} must be market-offered through SHOP_CATALOG`);
    assert.match(definition.assetRef.semanticKey, /^items\./);
    assert.equal(Boolean(definition.description.en), true, `${itemId} must include an English item description`);
    assert.equal(Boolean(definition.description.zh), true, `${itemId} must include a Chinese item description`);
    assert.equal(isProvenanceDescription(definition.description.en), false, `${itemId} description must not be provenance text`);
    assert.equal(definition.description.en.length >= 70, true, `${itemId} description must be immersive`);
    assert.equal(definition.tradeable, true);
    assert.equal(Number.isFinite(definition.baseValue) && definition.baseValue > 0, true);
    await assertRuntimeAssetRefBinaryContract(definition.assetRef, definition);
    await assertGeneratedAssetBinaryContract(registeredAsset);
  }
});

test("runtime item catalog promotes next generated market batch into concrete definitions", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const registeredAssetsByFile = new Map(manifest.rasterAssets.map((asset) => [asset.file, asset]));
  const shopItemIds = new Set(SHOP_CATALOG.map((offer) => offer.itemId));
  const expectedPromotions = [
    ["ember-bomb", "aidm-market-item-009-06", "aidm-market-items-sheet-009", "consumable", "combat"],
    ["signet-ring", "aidm-market-item-009-08", "aidm-market-items-sheet-009", "ring", "social"],
    ["rain-city-map", "aidm-market-item-009-09", "aidm-market-items-sheet-009", "document", "quest-clue"],
    ["merchant-contract", "aidm-market-item-009-10", "aidm-market-items-sheet-009", "document", "quest-clue"],
    ["ceremonial-robe", "aidm-market-item-009-16", "aidm-market-items-sheet-009", "armor-body", "equipment"],
    ["bone-dice-set", "aidm-market-item-009-20", "aidm-market-items-sheet-009", "trinket", "game-prop"],
    ["brass-monocle", "aidm-accessory-cutout-019-04", "aidm-accessories-cutouts-sheet-019", "tool", "scholar-tool"],
    ["etched-war-axe", "aidm-weapon-cutout-024-12", "aidm-weapons-cutouts-sheet-024", "axe", "melee-weapon"]
  ];

  for (const [itemId, assetId, sheetId, itemKind, economyRole] of expectedPromotions) {
    const definition = ITEM_CATALOG[itemId];
    const registeredAsset = registeredAssetsByFile.get(definition.assetRef.file);

    assert.ok(registeredAsset, `${itemId} must use a registered generated raster file`);
    assert.equal(registeredAsset.id, assetId);
    assert.equal(registeredAsset.sheetId, sheetId);
    assert.equal(registeredAsset.group, "generated-rewards");
    assert.equal(registeredAsset.categoryId, "equipment");
    assert.equal(registeredAsset.visibility, "player-safe");
    assert.deepEqual(registeredAsset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(registeredAsset.semanticKey, definition.assetRef.semanticKey);
    assert.equal(registeredAsset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(registeredAsset.gameplayBinding?.itemKind, itemKind);
    assert.equal(registeredAsset.gameplayBinding?.economyRole, economyRole);
    assert.deepEqual(registeredAsset.gameplayBinding?.flow, ["inventory", "market", "reward", "item-detail"]);
    assert.equal(registeredAsset.quality?.approved, true);
    assert.equal(registeredAsset.uiSurface.includes("catalog-internal"), false);
    assert.equal(shopItemIds.has(itemId), true, `${itemId} must be market-offered through SHOP_CATALOG`);
    assert.match(definition.assetRef.semanticKey, /^items\./);
    assert.equal(Boolean(definition.description.en), true, `${itemId} must include an English item description`);
    assert.equal(Boolean(definition.description.zh), true, `${itemId} must include a Chinese item description`);
    assert.equal(isProvenanceDescription(definition.description.en), false, `${itemId} description must not be provenance text`);
    assert.equal(definition.description.en.length >= 70, true, `${itemId} description must be immersive`);
    assert.equal(definition.tradeable, true);
    assert.equal(Number.isFinite(definition.baseValue) && definition.baseValue > 0, true);
    await assertRuntimeAssetRefBinaryContract(definition.assetRef, definition);
    await assertGeneratedAssetBinaryContract(registeredAsset);
  }
});

test("runtime item catalog promotes selected sheet 029 slices into concrete item bindings", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const registeredAssetsByFile = new Map(manifest.rasterAssets.map((asset) => [asset.file, asset]));
  const sheet029ItemIds = [
    "blackthorn-warplate",
    "surveyor-pack",
    "skyglass-signet",
    "rainmarked-chart",
    "bitterleaf-ampoule",
    "pearwood-lute"
  ];

  for (const itemId of sheet029ItemIds) {
    const definition = ITEM_CATALOG[itemId];
    const registeredAsset = registeredAssetsByFile.get(definition.assetRef.file);

    assert.ok(registeredAsset, `${itemId} must use a registered sheet 029 raster file`);
    assert.match(registeredAsset.id, /^aidm-inventory-expansion-029-/);
    assert.equal(registeredAsset.group, "generated-rewards");
    assert.equal(registeredAsset.visibility, "player-safe");
    assert.deepEqual(registeredAsset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(registeredAsset.semanticKey, definition.assetRef.semanticKey);
    assert.equal(registeredAsset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(registeredAsset.gameplayBinding?.itemDefinitionId, definition.id);
    assert.equal(registeredAsset.gameplayBinding?.marketEligible, true);
    assert.equal(registeredAsset.quality?.approved, true);
    assert.equal(registeredAsset.uiSurface.includes("catalog-internal"), false);
    assert.match(definition.assetRef.semanticKey, /^items\./);
    assert.equal(Boolean(definition.description.en), true, `${itemId} must include an English item description`);
    assert.equal(Boolean(definition.description.zh), true, `${itemId} must include a Chinese item description`);
    assert.equal(isProvenanceDescription(definition.description.en), false, `${itemId} description must not be provenance text`);
    assert.equal(definition.description.en.length >= 70, true, `${itemId} description must be immersive`);
    assert.equal(definition.tradeable, true);
    assert.equal(Number.isFinite(definition.baseValue) && definition.baseValue > 0, true);
    await assertRuntimeAssetRefBinaryContract(definition.assetRef, definition);
  }
});

test("runtime item catalog promotes selected sheet 030 slices into concrete item bindings", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const registeredAssetsByFile = new Map(manifest.rasterAssets.map((asset) => [asset.file, asset]));
  const sheet030ItemIds = [
    "lionward-shield",
    "azure-court-crown",
    "sapphire-treaty-ring",
    "lockpick-roll",
    "emberglass-lantern",
    "brass-mariner-compass"
  ];

  for (const itemId of sheet030ItemIds) {
    const definition = ITEM_CATALOG[itemId];
    const registeredAsset = registeredAssetsByFile.get(definition.assetRef.file);

    assert.ok(registeredAsset, `${itemId} must use a registered sheet 030 raster file`);
    assert.match(registeredAsset.id, /^aidm-inventory-expansion-030-/);
    assert.equal(registeredAsset.group, "generated-rewards");
    assert.equal(registeredAsset.visibility, "player-safe");
    assert.deepEqual(registeredAsset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(registeredAsset.semanticKey, definition.assetRef.semanticKey);
    assert.equal(registeredAsset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(registeredAsset.gameplayBinding?.itemDefinitionId, definition.id);
    assert.equal(registeredAsset.gameplayBinding?.marketEligible, true);
    assert.equal(registeredAsset.quality?.approved, true);
    assert.equal(registeredAsset.uiSurface.includes("catalog-internal"), false);
    assert.match(definition.assetRef.semanticKey, /^items\./);
    assert.equal(Boolean(definition.description.en), true, `${itemId} must include an English item description`);
    assert.equal(Boolean(definition.description.zh), true, `${itemId} must include a Chinese item description`);
    assert.equal(isProvenanceDescription(definition.description.en), false, `${itemId} description must not be provenance text`);
    assert.equal(definition.description.en.length >= 70, true, `${itemId} description must be immersive`);
    assert.equal(definition.tradeable, true);
    assert.equal(Number.isFinite(definition.baseValue) && definition.baseValue > 0, true);
    await assertRuntimeAssetRefBinaryContract(definition.assetRef, definition);
  }
});

test("runtime item catalog promotes selected sheet 031 slices into player-safe concrete item bindings", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const registeredAssetsByFile = new Map(manifest.rasterAssets.map((asset) => [asset.file, asset]));
  const expectedPromotions = [
    ["oathguard-saber", "aidm-inventory-expansion-031-02", "saber", "weapon"],
    ["red-tassel-spear", "aidm-inventory-expansion-031-08", "spear", "weapon"],
    ["frostfur-travel-boots", "aidm-inventory-expansion-031-17", "boots", "travel-gear"],
    ["blue-sigil-ward-scroll", "aidm-inventory-expansion-031-36", "scroll", "spell-scroll"],
    ["ironbound-coffer", "aidm-inventory-expansion-031-42", "coffer", "treasure"],
    ["guild-keyring", "aidm-inventory-expansion-031-54", "keyring", "utility-tool"],
    ["alchemist-mortar", "aidm-inventory-expansion-031-58", "alchemy-tool", "crafting-tool"]
  ];

  for (const [itemId, assetId, itemKind, economyRole] of expectedPromotions) {
    const definition = ITEM_CATALOG[itemId];
    const registeredAsset = registeredAssetsByFile.get(definition.assetRef.file);

    assert.ok(registeredAsset, `${itemId} must use a registered sheet 031 raster file`);
    assert.equal(registeredAsset.id, assetId);
    assert.equal(registeredAsset.sheetId, "aidm-inventory-expansion-sheet-031");
    assert.equal(registeredAsset.categoryId, "equipment");
    assert.equal(registeredAsset.group, "generated-rewards");
    assert.equal(registeredAsset.visibility, "player-safe");
    assert.deepEqual(registeredAsset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(registeredAsset.uiSurface.includes("catalog-internal"), false);
    assert.equal(registeredAsset.semanticKey, definition.assetRef.semanticKey);
    assert.equal(registeredAsset.variantOf, itemId);
    assert.equal(registeredAsset.displayName.en, definition.name.en);
    assert.equal(registeredAsset.displayName.zh, definition.name.zh);
    assert.equal(registeredAsset.description.en, definition.description.en);
    assert.equal(registeredAsset.description.zh, definition.description.zh);
    assert.equal(registeredAsset.variantAxes?.itemKind, itemKind);
    assert.equal(registeredAsset.variantAxes?.rarity, definition.rarity);
    assert.equal(registeredAsset.variantAxes?.economyRole, economyRole);
    assert.equal(registeredAsset.variantAxes?.condition, "fine");
    assert.equal(registeredAsset.gameplay?.itemId, itemId);
    assert.equal(registeredAsset.gameplay?.valueGp, definition.baseValue);
    assert.equal(registeredAsset.gameplay?.currency, "coin");
    assert.equal(registeredAsset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(registeredAsset.gameplayBinding?.itemId, itemId);
    assert.equal(registeredAsset.gameplayBinding?.itemDefinitionId, definition.id);
    assert.equal(registeredAsset.gameplayBinding?.itemKind, itemKind);
    assert.equal(registeredAsset.gameplayBinding?.economyRole, economyRole);
    assert.equal(registeredAsset.quality?.approved, true);
    assert.deepEqual(registeredAsset.quality?.safetyFlags, []);
    assert.match(definition.assetRef.semanticKey, /^items\./);
    assert.equal(definition.description.en.length >= 70, true, `${itemId} description must be immersive`);
    assert.equal(definition.tradeable, true);
    assert.equal(Number.isFinite(definition.baseValue) && definition.baseValue > 0, true);
    await assertRuntimeAssetRefBinaryContract(definition.assetRef, definition);
    await assertGeneratedAssetBinaryContract(registeredAsset);
  }
});

test("unpromoted sheet 029 slices remain internal review assets", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet029Assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-inventory-expansion-sheet-029");
  const promoted = sheet029Assets.filter((asset) => asset.visibility === "player-safe");
  const internal = sheet029Assets.filter((asset) => asset.visibility === "internal");

  assert.equal(sheet029Assets.length, 64);
  assert.equal(promoted.length, 6);
  assert.equal(internal.length, 58);

  for (const asset of internal) {
    assert.equal(asset.group, "generated-inventory-review");
    assert.deepEqual(asset.uiSurface, ["catalog-internal"]);
    assert.equal(asset.quality?.approved, false);
    assert.equal(Boolean(asset.semanticKey), false);
  }
});

test("sheet 030 inventory expansion promotes selected gameplay items and isolates the rest", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-inventory-expansion-sheet-030");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-inventory-expansion-sheet-030");
  const promoted = assets.filter((asset) => asset.visibility === "player-safe");
  const internal = assets.filter((asset) => asset.visibility === "internal");

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.tile.columns, 8);
  assert.equal(sheet.tile.rows, 8);
  assert.equal(sheet.assetIds.length, 64);
  assert.equal(assets.length, 64);
  assert.equal(promoted.length, 6);
  assert.equal(internal.length, 58);

  for (const asset of internal) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-inventory-review");
    assert.deepEqual(asset.uiSurface, ["catalog-internal"]);
    assert.equal(asset.quality?.approved, false);
    assert.equal(Boolean(asset.semanticKey), false);
    assert.equal(asset.tags.includes("aidm-inventory-expansion-030"), true);
  }

  for (const asset of promoted) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-rewards");
    assert.deepEqual(asset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(asset.quality?.approved, true);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.equal(Boolean(asset.semanticKey), true);
    assert.equal(asset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(Boolean(asset.gameplayBinding?.itemDefinitionId), true);
  }
});

test("sheet 031 inventory expansion promotes seven player-safe gameplay items and isolates the rest", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-inventory-expansion-sheet-031");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-inventory-expansion-sheet-031");
  const promoted = assets.filter((asset) => asset.visibility === "player-safe");
  const internal = assets.filter((asset) => asset.visibility === "internal");
  const expectedPlayerSafeIds = [
    "aidm-inventory-expansion-031-02",
    "aidm-inventory-expansion-031-08",
    "aidm-inventory-expansion-031-17",
    "aidm-inventory-expansion-031-36",
    "aidm-inventory-expansion-031-42",
    "aidm-inventory-expansion-031-54",
    "aidm-inventory-expansion-031-58"
  ];
  const forbiddenPlayerSurfaces = new Set(["inventory-item", "market-item", "reward-card", "item-detail"]);

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.categoryId, "equipment");
  assert.equal(sheet.tile.columns, 8);
  assert.equal(sheet.tile.rows, 8);
  assert.equal(sheet.assetIds.length, 64);
  assert.equal(sheet.background?.mode, "chroma-key");
  assert.equal(sheet.background?.chromaKey?.enabled, true);
  assert.equal(assets.length, 64);
  assert.equal(promoted.length, 7);
  assert.equal(internal.length, 57);
  assert.deepEqual(promoted.map((asset) => asset.id), expectedPlayerSafeIds);

  for (const asset of internal) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-inventory-review");
    assert.equal(asset.visibility, "internal");
    assert.deepEqual(asset.uiSurface, ["catalog-internal"]);
    assert.equal(asset.quality?.approved, false);
    assert.equal(Boolean(asset.semanticKey), false);
    assert.equal(Boolean(asset.gameplayBinding), false);
    assert.equal(asset.tags.includes("aidm-inventory-expansion-031"), true);
    assert.equal(asset.uiSurface.some((surface) => forbiddenPlayerSurfaces.has(surface)), false);
  }

  for (const asset of promoted) {
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-rewards");
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.type, "raster-icon");
    assert.deepEqual(asset.uiSurface, ["inventory-item", "market-item", "reward-card", "item-detail"]);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    assert.equal(asset.quality?.approved, true);
    assert.equal(asset.quality?.reviewStatus, "approved-metadata-promotion");
    assert.equal(Boolean(asset.semanticKey), true);
    assert.equal(asset.tags.includes("sheet-031"), true);
    assert.equal(asset.tags.includes("generated-rewards"), true);
    assert.equal(asset.tags.includes("transparent"), true);
    assert.equal(asset.gameplayBinding?.requiresItemDefinition, true);
    assert.equal(Boolean(asset.gameplayBinding?.itemDefinitionId), true);
    assert.equal(asset.gameplayBinding?.itemDefinitionId, asset.gameplay?.itemId);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheet 033 inventory expansion stays internal with transparent alpha backgrounds", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-inventory-expansion-sheet-033");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-inventory-expansion-sheet-033");
  const rewardPoolIds = new Set(
    manifest.rasterAssets
      .filter((asset) => asset.group === "generated-rewards" && asset.visibility === "player-safe" && asset.file)
      .map((asset) => asset.id)
  );
  const marketPoolIds = new Set(
    manifest.rasterAssets
      .filter((asset) => asset.visibility === "player-safe" && asset.uiSurface?.includes("market-item"))
      .map((asset) => asset.id)
  );
  const scenePoolIds = new Set(
    manifest.rasterAssets
      .filter((asset) => {
        return asset.categoryId === "scenes"
          && asset.group === "generated-scenes"
          && asset.visibility === "player-safe"
          && asset.uiSurface?.some((surface) => surface === "stage-backdrop" || surface === "relevant-scene");
      })
      .map((asset) => asset.id)
  );
  const marketplaceGroups = new Set(manifest.marketplace.categories.flatMap((category) => category.groups || []));
  const forbiddenPlayerSurfaces = new Set(["reward-card", "market-item", "stage-backdrop", "relevant-scene"]);

  assert.equal(Boolean(sheet), true);
  assert.equal(sheet.categoryId, "equipment");
  assert.equal(sheet.tile.columns, 8);
  assert.equal(sheet.tile.rows, 8);
  assert.equal(sheet.assetIds.length, 64);
  assert.equal(sheet.background?.mode, "chroma-key");
  assert.equal(sheet.background?.chromaKey?.enabled, true);
  assert.equal(assets.length, 64);
  assert.equal(marketplaceGroups.has("generated-inventory-review"), false);

  for (const asset of assets) {
    assert.equal(asset.id.startsWith("aidm-inventory-expansion-033-"), true);
    assert.equal(sheet.assetIds.includes(asset.id), true, `${asset.id} must be registered on sheet 033`);
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-inventory-review");
    assert.equal(asset.visibility, "internal");
    assert.equal(asset.type, "raster-icon");
    assert.deepEqual(asset.uiSurface, ["catalog-internal"]);
    assert.equal(asset.quality?.approved, false);
    assert.equal(Boolean(asset.semanticKey), false);
    assert.equal(Boolean(asset.gameplayBinding), false);
    assert.equal(asset.tags.includes("generated-inventory-review"), true);
    assert.equal(asset.tags.includes("aidm-inventory-expansion-033"), true);
    assert.equal(asset.tags.includes("transparent"), true);
    assert.equal(asset.uiSurface.some((surface) => forbiddenPlayerSurfaces.has(surface)), false);
    assert.equal(rewardPoolIds.has(asset.id), false, `${asset.id} must not enter reward selection`);
    assert.equal(marketPoolIds.has(asset.id), false, `${asset.id} must not enter market item selection`);
    assert.equal(scenePoolIds.has(asset.id), false, `${asset.id} must not enter scene selection`);

    const alpha = await optionalGeneratedRasterPayloadStats(asset);
    if (!alpha) continue;

    assert.equal(alpha.colorType, 6, `${asset.id} must be an RGBA PNG`);
    assert.equal(alpha.bitDepth, 8, `${asset.id} must use 8-bit alpha`);
    assert.equal(alpha.transparentPixels > 0, true, `${asset.id} must contain transparent background pixels`);
    assert.equal(alpha.opaquePixels > 0, true, `${asset.id} must contain opaque item pixels`);
    assert.equal(alpha.minAlpha, 0, `${asset.id} must include fully transparent background pixels`);
    assert.equal(alpha.maxAlpha, 255, `${asset.id} must include fully opaque item pixels`);
    assert.deepEqual(alpha.cornerAlphas, [0, 0, 0, 0], `${asset.id} must keep transparent background corners`);
  }
});

test("sheet 009 market item card assets stay flow-bound", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-market-items-sheet-009");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-market-items-sheet-009");
  const expectedSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];
  const plan = manifest.plannedSheets.find((entry) => entry.metadataPlanId === "sheet-009-market-items");

  assert.equal(Boolean(sheet), true);
  assert.equal(Boolean(plan), true);
  assert.equal(sheet.tile.columns, 5);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 20);
  assert.equal(assets.length, 20);
  assert.deepEqual(plan.metadataTemplate.approvalRules.allowedPlayerSurfaces, expectedSurfaces);

  for (const asset of assets) {
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-rewards");
    assert.deepEqual(asset.uiSurface, expectedSurfaces);
    assert.match(asset.semanticKey, /^items\.[a-z-]+\.[a-z-]+\.v01$/);
    assert.equal(Boolean(asset.gameplayBinding?.itemKind), true, `${asset.id} must bind itemKind`);
    assert.equal(Boolean(asset.gameplayBinding?.economyRole), true, `${asset.id} must bind economyRole`);
    assert.equal(asset.gameplayBinding?.requiresItemDefinition, true, `${asset.id} must require data-backed item definitions`);
    assert.deepEqual(asset.gameplayBinding.flow, ["inventory", "market", "reward", "item-detail"]);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheet 010 transparent cutouts are registered as item icons, not broad UI catalog entries", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-consumable-cutouts-sheet-010");
  const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-consumable-cutouts-sheet-010");
  const expectedSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];
  const plan = manifest.plannedSheets.find((entry) => entry.metadataPlanId === "sheet-010-consumable-cutouts");

  assert.equal(Boolean(sheet), true);
  assert.equal(Boolean(plan), true);
  assert.equal(sheet.tile.columns, 4);
  assert.equal(sheet.tile.rows, 4);
  assert.equal(sheet.assetIds.length, 16);
  assert.equal(assets.length, 16);
  assert.equal(plan.transparency, "#00ff00 chroma-key");
  assert.deepEqual(plan.metadataTemplate.approvalRules.allowedPlayerSurfaces, expectedSurfaces);

  for (const asset of assets) {
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.group, "generated-rewards");
    assert.deepEqual(asset.uiSurface, expectedSurfaces);
    assert.match(asset.semanticKey, /^items\.[a-z-]+\.[a-z-]+\.cutout\.v01$/);
    assert.equal(asset.variantAxes?.visualStyle, "transparent-cutout");
    assert.equal(asset.tags.includes("transparent-cutout"), true, `${asset.id} must carry transparent-cutout tag`);
    assert.equal(asset.gameplayBinding?.requiresItemDefinition, true, `${asset.id} must require data-backed item definitions`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false);
    await assertGeneratedAssetBinaryContract(asset);
    await access(asset.svgFile);
  }
});

test("sheets 020 through 026 cutouts stay flow-bound item art", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const expectedSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];
  const expectations = [
    {
      metadataPlanId: "sheet-020-transparent-cutouts",
      sheetId: "aidm-transparent-cutouts-sheet-020",
      file: "assets/generated/sheets/aidm-transparent-cutouts-sheet-020.png",
      prefix: "aidm-transparent-cutout-020",
      sheetTag: "sheet-020",
    },
    {
      metadataPlanId: "sheet-021-tools-cutouts",
      sheetId: "aidm-tools-cutouts-sheet-021",
      file: "assets/generated/sheets/aidm-tools-cutouts-sheet-021.png",
      prefix: "aidm-tool-cutout-021",
      sheetTag: "sheet-021",
    },
    {
      metadataPlanId: "sheet-022-trophies-cutouts",
      sheetId: "aidm-trophies-cutouts-sheet-022",
      file: "assets/generated/sheets/aidm-trophies-cutouts-sheet-022.png",
      prefix: "aidm-trophy-cutout-022",
      sheetTag: "sheet-022",
    },
    {
      metadataPlanId: "sheet-023-wearables-cutouts",
      sheetId: "aidm-wearables-cutouts-sheet-023",
      file: "assets/generated/sheets/aidm-wearables-cutouts-sheet-023.png",
      prefix: "aidm-wearable-cutout-023",
      sheetTag: "sheet-023",
    },
    {
      metadataPlanId: "sheet-024-weapons-cutouts",
      sheetId: "aidm-weapons-cutouts-sheet-024",
      file: "assets/generated/sheets/aidm-weapons-cutouts-sheet-024.png",
      prefix: "aidm-weapon-cutout-024",
      sheetTag: "sheet-024",
    },
    {
      metadataPlanId: "sheet-025-magic-cutouts",
      sheetId: "aidm-magic-cutouts-sheet-025",
      file: "assets/generated/sheets/aidm-magic-cutouts-sheet-025.png",
      prefix: "aidm-magic-cutout-025",
      sheetTag: "sheet-025",
    },
    {
      metadataPlanId: "sheet-026-trade-cutouts",
      sheetId: "aidm-trade-cutouts-sheet-026",
      file: "assets/generated/sheets/aidm-trade-cutouts-sheet-026.png",
      prefix: "aidm-trade-cutout-026",
      sheetTag: "sheet-026",
    },
  ];

  for (const expectation of expectations) {
    const plan = manifest.plannedSheets.find((entry) => entry.metadataPlanId === expectation.metadataPlanId);
    const sheet = manifest.generatedSheets.find((entry) => entry.id === expectation.sheetId);
    const assets = manifest.rasterAssets.filter((asset) => asset.sheetId === expectation.sheetId);

    assert.equal(Boolean(plan), true);
    assert.equal(Boolean(sheet), true);
    assert.equal(plan.status, "metadata-ready-for-ingest");
    assert.equal(plan.categoryId, "equipment");
    assert.equal(plan.group, "generated-rewards");
    assert.equal(plan.expectedFile, expectation.file);
    assert.equal(plan.expectedOutDir, "assets/generated/items");
    assert.equal(plan.expectedPrefix, expectation.prefix);
    assert.deepEqual(plan.expectedGrid, { columns: 4, rows: 4 });
    assert.equal(plan.transparency, "#00ff00 chroma-key");
    assert.equal(plan.namingRules.sheetId, expectation.sheetId);
    assert.equal(plan.namingRules.frameIdPattern, `${expectation.prefix}-##`);
    assert.equal(plan.namingRules.semanticKeyPattern, "items.<item-kind>.<base-item>.cutout.v01");
    assert.deepEqual(plan.metadataTemplate.uiSurface, expectedSurfaces);
    assert.deepEqual(plan.metadataTemplate.approvalRules.allowedPlayerSurfaces, expectedSurfaces);
    assert.equal(plan.metadataTemplate.tags.includes("transparent-cutout"), true);
    assert.equal(plan.metadataTemplate.tags.includes(expectation.sheetTag), true);
    assert.equal(plan.metadataTemplate.alphaGate.required, true);
    assert.equal(plan.metadataTemplate.alphaGate.pngColorType, 6);
    assert.equal(plan.metadataTemplate.alphaGate.bitDepth, 8);
    assert.equal(plan.metadataTemplate.frameTemplatePattern.frameCount, 16);
    assert.equal(plan.metadataTemplate.frameTemplates.length, 16);
    assert.equal(plan.classification.notForSurfaces.includes("catalog-internal"), true);

    assert.equal(sheet.categoryId, "equipment");
    assert.equal(sheet.assetIds.length, 16);
    assert.equal(assets.length, 16);

    for (const asset of assets) {
      assert.equal(asset.id.startsWith(expectation.prefix), true);
      assert.equal(asset.categoryId, "equipment");
      assert.equal(asset.group, "generated-rewards");
      assert.equal(asset.visibility, "player-safe");
      assert.equal(asset.type, "raster-icon");
      assert.deepEqual(asset.uiSurface, expectedSurfaces);
      assert.equal(asset.uiSurface.includes("catalog-internal"), false);
      assert.equal(asset.tags.includes("transparent-cutout"), true, `${asset.id} must carry transparent-cutout tag`);
      assert.equal(asset.tags.includes(expectation.sheetTag), true, `${asset.id} must carry ${expectation.sheetTag} tag`);
      assert.match(asset.semanticKey, /^items\.[a-z-]+\.[a-z0-9-]+\.cutout\.v01$/);
      assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
      assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
      assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include English description`);
      assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include Chinese description`);
      assert.equal(wordCount(asset.description.en) >= 10, true, `${asset.id} description must be immersive`);
      assert.equal(Boolean(asset.variantAxes?.itemKind), true, `${asset.id} must include item kind axis`);
      assert.equal(Boolean(asset.variantAxes?.rarity), true, `${asset.id} must include rarity axis`);
      assert.equal(Boolean(asset.variantAxes?.economyRole), true, `${asset.id} must include economy role axis`);
      assert.equal(asset.variantAxes?.visualStyle, "transparent-cutout");
      assert.equal(typeof asset.gameplay?.valueGp, "number", `${asset.id} must include a numeric value`);
      assert.equal(Boolean(asset.gameplay?.slot || asset.gameplayBinding?.itemSlot || asset.gameplayBinding?.itemKind), true, `${asset.id} must include a slot or gameplay binding`);
      assert.deepEqual(asset.gameplayBinding?.flow, ["inventory", "market", "reward", "item-detail"]);
      assert.equal(asset.gameplayBinding?.requiresItemDefinition, true, `${asset.id} must require data-backed item definitions`);
      assert.equal(asset.gameplayBinding?.marketEligible, true, `${asset.id} must be eligible only through item-backed market flows`);
      await assertGeneratedAssetBinaryContract(asset);
      await access(asset.svgFile);
    }
  }
});

test("transparent cutout PNGs for registered sheets carry real alpha channels", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const transparentCutoutSheetIds = [
    "aidm-consumable-cutouts-sheet-010",
    "aidm-accessories-cutouts-sheet-019",
    "aidm-transparent-cutouts-sheet-020",
    "aidm-tools-cutouts-sheet-021",
    "aidm-trophies-cutouts-sheet-022",
    "aidm-wearables-cutouts-sheet-023",
    "aidm-weapons-cutouts-sheet-024",
    "aidm-magic-cutouts-sheet-025",
    "aidm-trade-cutouts-sheet-026",
  ];
  const transparentCutouts = manifest.rasterAssets.filter((asset) => {
    return transparentCutoutSheetIds.includes(asset.sheetId);
  });
  const registeredTransparentSheetIds = new Set(transparentCutouts.map((asset) => asset.sheetId));

  assert.equal(registeredTransparentSheetIds.has("aidm-consumable-cutouts-sheet-010"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-accessories-cutouts-sheet-019"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-transparent-cutouts-sheet-020"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-tools-cutouts-sheet-021"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-trophies-cutouts-sheet-022"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-wearables-cutouts-sheet-023"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-weapons-cutouts-sheet-024"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-magic-cutouts-sheet-025"), true);
  assert.equal(registeredTransparentSheetIds.has("aidm-trade-cutouts-sheet-026"), true);
  assert.equal(transparentCutouts.length, registeredTransparentSheetIds.size * 16);

  for (const asset of transparentCutouts) {
    assert.equal(asset.variantAxes?.visualStyle, "transparent-cutout");
    assert.equal(asset.tags.includes("transparent-cutout"), true, `${asset.id} must carry transparent-cutout tag`);

    const alpha = await optionalGeneratedRasterPayloadStats(asset);
    if (!alpha) continue;

    assert.equal(alpha.colorType, 6, `${asset.id} must be an RGBA PNG`);
    assert.equal(alpha.bitDepth, 8, `${asset.id} must use 8-bit alpha`);
    assert.equal(alpha.transparentPixels > 0, true, `${asset.id} must contain transparent background pixels`);
    assert.equal(alpha.opaquePixels > 0, true, `${asset.id} must contain opaque item pixels`);
    assert.equal(alpha.minAlpha, 0, `${asset.id} must include fully transparent pixels after chroma-key removal`);
    assert.equal(alpha.maxAlpha, 255, `${asset.id} must include fully opaque item pixels`);
  }
});

test("server presentation layer loads generated image manifest for player-safe runtime use", async () => {
  const [server, selector, app] = await Promise.all([
    readFile("src/server/server.js", "utf8"),
    readFile("src/core/assetSelection.js", "utf8"),
    readFile("public/app.js", "utf8")
  ]);

  assert.match(server, /buildPresentation/);
  assert.match(selector, /assets\/generated\/manifest\.json/);
  assert.match(selector, /chooseSceneAsset/);
  assert.match(selector, /chooseRewardAsset/);
  assert.match(selector, /buildRuntimeAssetBindings/);
  assert.match(selector, /chooseItemAsset/);
  assert.match(selector, /chooseSpellAsset/);
  assert.match(selector, /chooseNpcTokenAsset/);
  assert.match(selector, /chooseStatusAsset/);
  assert.match(app, /room\.presentation\?\.sceneAsset/);
  assert.doesNotMatch(app, /mergeGeneratedAssets|\/assets\/generated\/manifest\.json/);
});

test("generated raster metadata contract is independent from optional binary payload", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const scene = manifest.rasterAssets.find((asset) => asset.categoryId === "scenes" && asset.visibility === "player-safe");
  const item = manifest.rasterAssets.find((asset) => asset.categoryId === "equipment" && asset.visibility === "player-safe");
  const spell = manifest.rasterAssets.find((asset) => asset.categoryId === "spells" && asset.visibility === "player-safe");

  for (const asset of [scene, item, spell]) {
    assert.ok(asset, "representative generated asset must be registered");
    assert.equal(isGeneratedRasterAssetFile(asset.file), true, `${asset.id} must keep generated raster metadata`);
    const delivery = assetBinaryDelivery(asset.file, asset);

    assert.equal(delivery.status, "external-pending-binary", `${asset.id} binary delivery must stay optional`);
    assert.equal(delivery.gitPolicy, "generated-raster-binary-excluded", `${asset.id} must document git binary policy`);
    assert.equal(Boolean(asset.provenance?.sourceSha256 || asset.provenance?.promptId), true, `${asset.id} keeps provenance without requiring payload`);
    assert.equal(Boolean(asset.svgFile || delivery.fallbackFile), true, `${asset.id} needs a committed fallback`);
    await access(asset.svgFile || delivery.fallbackFile);
  }
});

function englishDescription(asset) {
  if (typeof asset.description === "string") {
    return asset.description.trim();
  }

  if (typeof asset.description?.en === "string") {
    return asset.description.en.trim();
  }

  return "";
}

function wordCount(value) {
  return value.split(/\s+/).filter(Boolean).length;
}

function isProvenanceDescription(value) {
  return /ChatGPT image generation|sourceSheet|sourceSha256|promptId|generatedAt|provenance/i.test(value);
}

function assertGeneratedSheetBinaryContract(sheet) {
  assert.equal(Boolean(sheet.file), true, `${sheet.id} must keep a source sheet path`);
  assert.equal(isGeneratedRasterAssetFile(sheet.file), true, `${sheet.id} sheet binary is an external generated raster`);
  assert.equal(Boolean(sheet.provenance?.sourceSha256), true, `${sheet.id} must keep source hash while binary is external`);
}

async function assertGeneratedAssetBinaryContract(asset) {
  assert.equal(Boolean(asset.file), true, `${asset.id || "asset"} must keep a raster file path`);
  if (!isGeneratedRasterAssetFile(asset.file)) {
    await access(asset.file);
    return;
  }

  const delivery = assetBinaryDelivery(asset.file, asset);

  assert.equal(delivery.status, "external-pending-binary", `${asset.id || asset.file} generated raster must be external-delivery tolerant`);
  assert.equal(Boolean(asset.provenance?.sourceSha256 || asset.provenance?.promptId || asset.semanticKey), true, `${asset.id || asset.file} must keep metadata provenance`);
  assert.equal(Boolean(asset.svgFile || delivery.fallbackFile), true, `${asset.id || asset.file} must have a committed fallback path`);
  if (asset.svgFile) {
    await access(asset.svgFile);
  } else {
    await access(delivery.fallbackFile);
  }
}

async function assertRuntimeAssetRefBinaryContract(assetRef, context = {}) {
  assert.equal(Boolean(assetRef?.file), true, `${context.id || "runtime asset"} must keep an asset file`);
  await assertGeneratedAssetBinaryContract({
    id: context.id || assetRef.assetId || assetRef.file,
    file: assetRef.file,
    fallbackFile: assetRef.fallbackFile,
    semanticKey: assetRef.semanticKey || context.semanticKey || "",
    categoryId: context.categoryId || context.category || "",
    provenance: { promptId: "runtime-asset-ref" }
  });
}

async function optionalGeneratedRasterPayloadStats(asset) {
  if (process.env.AIDM_ASSUME_GENERATED_RASTER_PAYLOAD_MISSING === "1") {
    await assertGeneratedAssetBinaryContract(asset);
    return null;
  }

  try {
    await access(asset.file);
  } catch {
    await assertGeneratedAssetBinaryContract(asset);
    return null;
  }

  return pngAlphaStats(asset.file);
}

async function pngAlphaStats(file) {
  const png = await readFile(file);
  const signature = png.subarray(0, 8);
  assert.deepEqual([...signature], [137, 80, 78, 71, 13, 10, 26, 10], `${file} must be a PNG`);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === "IHDR") {
      width = png.readUInt32BE(dataStart);
      height = png.readUInt32BE(dataStart + 4);
      bitDepth = png[dataStart + 8];
      colorType = png[dataStart + 9];
      const compression = png[dataStart + 10];
      const filter = png[dataStart + 11];
      const interlace = png[dataStart + 12];

      assert.equal(compression, 0, `${file} must use PNG compression method 0`);
      assert.equal(filter, 0, `${file} must use PNG filter method 0`);
      assert.equal(interlace, 0, `${file} must be non-interlaced`);
    } else if (type === "IDAT") {
      idatChunks.push(png.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }

    offset = dataEnd + 4;
  }

  assert.equal(width > 0, true, `${file} must define width`);
  assert.equal(height > 0, true, `${file} must define height`);
  assert.equal(colorType, 6, `${file} must be RGBA`);
  assert.equal(bitDepth, 8, `${file} must use 8-bit channels`);

  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  const expectedLength = height * (rowLength + 1);

  assert.equal(inflated.length, expectedLength, `${file} inflated PNG data length must match dimensions`);

  let inputOffset = 0;
  let minAlpha = 255;
  let maxAlpha = 0;
  let transparentPixels = 0;
  let opaquePixels = 0;
  const cornerAlphas = [];
  let previousRow = Buffer.alloc(rowLength);

  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[inputOffset];
    inputOffset += 1;
    const row = Buffer.from(inflated.subarray(inputOffset, inputOffset + rowLength));
    inputOffset += rowLength;
    unfilterPngRow(row, previousRow, bytesPerPixel, filterType, file);

    if (y === 0) {
      cornerAlphas[0] = row[3];
      cornerAlphas[1] = row[rowLength - 1];
    }
    if (y === height - 1) {
      cornerAlphas[2] = row[3];
      cornerAlphas[3] = row[rowLength - 1];
    }

    for (let x = 3; x < row.length; x += bytesPerPixel) {
      const alpha = row[x];
      minAlpha = Math.min(minAlpha, alpha);
      maxAlpha = Math.max(maxAlpha, alpha);
      if (alpha === 0) {
        transparentPixels += 1;
      }
      if (alpha === 255) {
        opaquePixels += 1;
      }
    }

    previousRow = row;
  }

  return { bitDepth, colorType, cornerAlphas, maxAlpha, minAlpha, opaquePixels, transparentPixels };
}

function unfilterPngRow(row, previousRow, bytesPerPixel, filterType, file) {
  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
    const up = previousRow[index] || 0;
    const upperLeft = index >= bytesPerPixel ? previousRow[index - bytesPerPixel] : 0;

    if (filterType === 0) {
      continue;
    }

    if (filterType === 1) {
      row[index] = (row[index] + left) & 0xff;
    } else if (filterType === 2) {
      row[index] = (row[index] + up) & 0xff;
    } else if (filterType === 3) {
      row[index] = (row[index] + Math.floor((left + up) / 2)) & 0xff;
    } else if (filterType === 4) {
      row[index] = (row[index] + paethPredictor(left, up, upperLeft)) & 0xff;
    } else {
      assert.fail(`${file} uses unsupported PNG filter type ${filterType}`);
    }
  }
}

function paethPredictor(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left;
  }

  if (upDistance <= upperLeftDistance) {
    return up;
  }

  return upperLeft;
}
