import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("generated image assets are registered with auditable provenance", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));

  assert.equal(manifest.version, 2);
  assert.equal(manifest.sourceKind, "chatgpt-image-generation");
  assert.equal(manifest.generatedSheets.length >= 3, true);
  assert.equal(manifest.rasterAssets.length >= 68, true);
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

test("web asset library loads generated image manifest", async () => {
  const app = await readFile("public/app.js", "utf8");

  assert.match(app, /\/assets\/generated\/manifest\.json/);
  assert.match(app, /mergeGeneratedAssets/);
});
