import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("generated image assets are registered with auditable provenance", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));

  assert.equal(manifest.version, 2);
  assert.equal(manifest.sourceKind, "chatgpt-image-generation");
  assert.equal(manifest.generatedSheets.length >= 9, true);
  assert.equal(manifest.rasterAssets.length >= 164, true);
  assert.equal(manifest.generatedSheets.some((sheet) => sheet.id === "aidm-ambience-scenes-sheet-002"), true);

  for (const sheet of manifest.generatedSheets) {
    assert.equal(sheet.assetType, "raster-sheet");
    assert.equal(sheet.provenance.generator, "chatgpt-image-generation");
    assert.equal(Boolean(sheet.provenance.promptId), true);
    assert.equal(Boolean(sheet.provenance.sourceSha256), true);
    assert.equal(sheet.assetIds.length, sheet.tile.columns * sheet.tile.rows);
    await access(sheet.file);
  }

  for (const asset of manifest.rasterAssets) {
    assert.equal(asset.provenance.generator, "chatgpt-image-generation");
    assert.equal(asset.assetType, "raster");
    assert.equal(Boolean(asset.categoryId), true);
    await access(asset.file);
    await access(asset.svgFile);
  }
});

test("generated raster inventory counts stay internally consistent", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const characterOptions = manifest.rasterAssets.filter((asset) => asset.sheetId === "aidm-character-options-sheet-008");
  const expectedRasterCount = 148 + characterOptions.length;
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");
  const internalAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "internal");
  const sceneAssets = manifest.rasterAssets.filter((asset) => {
    return asset.assetType === "raster"
      && asset.categoryId === "scenes"
      && asset.group === "generated-scenes";
  });

  assert.equal(manifest.generatedSheets.length, 9);
  assert.equal(characterOptions.length, 16);
  assert.equal(manifest.rasterAssets.length, expectedRasterCount);
  assert.equal(manifest.rasterAssets.length, 164);
  assert.equal(manifest.assets.length, manifest.rasterAssets.length);
  assert.equal(manifest.sheets.length, manifest.generatedSheets.length);
  assert.equal(manifest.assetCatalog?.actualGeneratedRasterAssets, manifest.rasterAssets.length);
  assert.equal(manifest.assetCatalog?.playerSafeAssets, playerSafeAssets.length);
  assert.equal(manifest.assetCatalog?.internalAssets, internalAssets.length);
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

test("player-safe generated assets keep immersive descriptions and semantic keys", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");
  const assetsBySemanticKey = new Map();

  assert.equal(playerSafeAssets.length, 128);

  for (const asset of playerSafeAssets) {
    const description = englishDescription(asset);

    assert.equal(Boolean(asset.semanticKey), true, `${asset.id} must include a semanticKey`);
    assetsBySemanticKey.set(asset.semanticKey, [...(assetsBySemanticKey.get(asset.semanticKey) || []), asset]);
    assert.equal(description.length >= 70, true, `${asset.id} must include an immersive description`);
    assert.equal(wordCount(description) >= 10, true, `${asset.id} description must be more than a terse label`);
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

test("player-safe visibility does not leak internal generated assets to player UI", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const playerSurfaces = new Set([
    "stage-backdrop",
    "reward-card",
    "transcript-event",
    "character-builder",
    "party-avatar",
    "player-detail"
  ]);
  const internalAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "internal");
  const playerSafeAssets = manifest.rasterAssets.filter((asset) => asset.visibility === "player-safe");

  assert.equal(internalAssets.length, 36);
  assert.equal(playerSafeAssets.length, 128);

  for (const asset of internalAssets) {
    assert.equal(asset.group, "generated-marketplace");
    assert.equal(asset.quality?.approved, false, `${asset.id} internal placeholders must not be approved`);
    assert.deepEqual(asset.uiSurface, ["catalog-internal"]);
    assert.equal(asset.uiSurface.some((surface) => playerSurfaces.has(surface)), false);
  }

  for (const asset of playerSafeAssets) {
    assert.equal(asset.uiSurface.every((surface) => playerSurfaces.has(surface)), true, `${asset.id} exposes an unknown surface`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose internal catalog surface`);
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
    await access(asset.file);
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
      && asset.group === "generated-scenes";
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

  assert.equal(rewardAssets.length >= 32, true, `expected at least 32 generated reward assets, found ${rewardAssets.length}`);
  assert.equal(manifest.assetCatalog?.targetAssetCount >= 1200, true);
  assert.equal(manifest.assetCatalog?.actualGeneratedRasterAssets, manifest.rasterAssets.length);

  const semanticKeys = new Set();
  for (const asset of rewardAssets) {
    assert.equal(asset.visibility, "player-safe");
    assert.equal(asset.categoryId, "equipment");
    assert.equal(asset.uiSurface.includes("reward-card"), true);
    assert.equal(asset.uiSurface.includes("transcript-event"), true);
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
    await access(asset.file);
    await access(asset.svgFile);
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
  assert.match(app, /room\.presentation\?\.sceneAsset/);
  assert.doesNotMatch(app, /mergeGeneratedAssets|\/assets\/generated\/manifest\.json/);
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
