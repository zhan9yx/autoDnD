import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { assetBinaryDelivery, isGeneratedRasterAssetFile } from "../src/core/assets.js";

const externalBinaryStatus = "external-pending-binary";

const representativeIds = [
  "aidm-scene-backbone-050-01",
  "aidm-hostile-token-050-01",
  "aidm-weapon-cutout-052-01",
  "aidm-armor-outfit-cutout-053-01",
  "aidm-faction-overlay-059-64",
  "aidm-equipment-tool-047-12",
  "aidm-reward-economy-048-11"
];

const keplerSceneBackbonePattern = /^aidm-scene-backbone-(042|050)-/;
const keplerInternalIconPattern = /^aidm-(action-icon-042|spell-icon-043|scroll-icon-044|status-icon-045|class-badge-046|equipment-tool-047|reward-economy-048|weather-overlay-049|hostile-token-050|npc-token-051|weapon-cutout-052|armor-outfit-cutout-053|consumable-provision-054|tool-clue-055|treasure-material-056|spell-scroll-rune-057|status-hazard-058|faction-overlay-059)-/;
const keplerAssetPattern = /^aidm-(scene-backbone-(042|050)|action-icon-042|spell-icon-043|scroll-icon-044|status-icon-045|class-badge-046|equipment-tool-047|reward-economy-048|weather-overlay-049|hostile-token-050|npc-token-051|weapon-cutout-052|armor-outfit-cutout-053|consumable-provision-054|tool-clue-055|treasure-material-056|spell-scroll-rune-057|status-hazard-058|faction-overlay-059)-/;
const keplerReviewStatuses = new Set([
  "metadata-approved",
  "metadata-registered-internal",
  "accept-with-metadata-risk",
  "accepted-metadata",
  "accept-with-risk"
]);

test("generated description map entries are registered in the generated manifest", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const assetsById = new Map(manifest.rasterAssets.map((asset) => [asset.id, asset]));
  const ids = manifest.rasterAssets.map((asset) => asset.id);

  assert.equal(new Set(ids).size, ids.length, "generated manifest must not contain duplicate asset ids");
  assert.equal(manifest.rasterAssets.length >= 1582, true);
  assert.equal(manifest.assetCatalog.actualGeneratedRasterAssets, manifest.rasterAssets.length);
  assert.equal(manifest.assets.length, manifest.rasterAssets.length);
  assert.equal(manifest.sheets.length, manifest.generatedSheets.length);

  for (const id of representativeIds) {
    const asset = assetsById.get(id);

    assert.ok(asset, `${id} must be registered`);
    assert.equal(Boolean(asset.file), true, `${id} must include a file path`);
    assert.equal(Boolean(asset.displayName?.en), true, `${id} must preserve English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${id} must preserve Chinese display name`);
    assert.equal(Boolean(asset.semanticKey), true, `${id} must preserve semanticKey`);
    assert.equal(Boolean(asset.variantAxes), true, `${id} must preserve variant axes`);
    assert.equal(Boolean(asset.gameplayBinding), true, `${id} must preserve gameplay binding`);
    assert.equal(Boolean(asset.sourcePromptRef), true, `${id} must preserve sourcePromptRef`);
    await assertRegistrationFileContract(asset);
  }

  const scene = assetsById.get("aidm-scene-backbone-050-01");
  assert.equal(scene.visibility, "player-safe");
  assert.equal(scene.quality.approved, true);
  assert.deepEqual(scene.uiSurface, ["stage-backdrop", "relevant-scene"]);
  assert.equal(Boolean(scene.localizedDescription?.en), true);
  assert.equal(Boolean(scene.localizedDescription?.zh), true);

  const metadataRiskAsset = assetsById.get("aidm-equipment-tool-047-12");
  assert.equal(metadataRiskAsset.visibility, "internal");
  assert.equal(metadataRiskAsset.quality.approved, false);
  assert.equal(metadataRiskAsset.quality.reviewStatus, "accept-with-metadata-risk");
  assert.deepEqual(metadataRiskAsset.uiSurface, ["catalog-internal"]);

  const alphaRiskAsset = assetsById.get("aidm-status-hazard-058-01");
  assert.ok(alphaRiskAsset, "058 alpha-risk asset must be registered");
  assert.equal(alphaRiskAsset.visibility, "internal");
  assert.equal(alphaRiskAsset.quality.approved, false);
  assert.equal(alphaRiskAsset.quality.reviewStatus, "accept-with-risk");
  assert.equal(alphaRiskAsset.quality.safetyFlags.includes("alpha-edge-risk"), true);
  await assertRegistrationFileContract(alphaRiskAsset);
});

test("Kepler registered assets keep scene and internal catalog exposure boundaries", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const sceneBackbones = manifest.rasterAssets.filter((asset) => keplerSceneBackbonePattern.test(asset.id));
  const iconsAndCutouts = manifest.rasterAssets.filter((asset) => keplerInternalIconPattern.test(asset.id));
  const runtimePromotedIconsAndCutouts = iconsAndCutouts.filter((asset) => asset.visibility === "runtime-promoted");
  const internalIconsAndCutouts = iconsAndCutouts.filter((asset) => asset.visibility === "internal");

  assert.equal(sceneBackbones.length, 66);
  assert.equal(iconsAndCutouts.length, 768);
  assert.equal(runtimePromotedIconsAndCutouts.length, 102);
  assert.equal(internalIconsAndCutouts.length, 666);

  for (const asset of sceneBackbones) {
    assert.equal(asset.categoryId, "scenes", `${asset.id} must be categorized as a scene`);
    assert.equal(asset.group, "generated-scenes", `${asset.id} must stay in the generated scene group`);
    assert.equal(asset.visibility, "player-safe", `${asset.id} must be player-safe`);
    assert.deepEqual(asset.uiSurface, ["stage-backdrop", "relevant-scene"], `${asset.id} must only expose scene surfaces`);
    assert.equal(asset.quality?.approved, true, `${asset.id} must be approved for stage use`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose internal catalog surface`);
  }

  for (const asset of internalIconsAndCutouts) {
    assert.notEqual(asset.categoryId, "scenes", `${asset.id} must not be categorized as a scene`);
    assert.equal(asset.visibility, "internal", `${asset.id} must remain internal until runtime promotion`);
    assert.deepEqual(asset.uiSurface, ["catalog-internal"], `${asset.id} must only expose internal catalog metadata`);
    assert.equal(asset.quality?.approved, false, `${asset.id} must not be approved for direct player exposure`);
    assert.equal(asset.uiSurface.includes("stage-backdrop"), false, `${asset.id} must not be a stage backdrop`);
    assert.equal(asset.uiSurface.includes("relevant-scene"), false, `${asset.id} must not be a relevant scene`);
  }

  for (const asset of runtimePromotedIconsAndCutouts) {
    assert.notEqual(asset.categoryId, "scenes", `${asset.id} must not be categorized as a scene`);
    assert.equal(asset.visibility, "runtime-promoted", `${asset.id} must use the source-bound runtime promotion boundary`);
    assert.deepEqual(asset.uiSurface, ["ui-approved-runtime"], `${asset.id} must not expose broad catalog metadata`);
    assert.equal(asset.quality?.approved, false, `${asset.id} must not become broadly player-safe without visual QA`);
    assert.equal(asset.quality?.runtimePromotionStatus, "ui-approved-runtime", `${asset.id} must declare runtime promotion status`);
    assert.equal(asset.runtimePromotion?.status, "ui-approved-runtime", `${asset.id} must carry runtime promotion metadata`);
    assert.equal(asset.runtimePromotion?.catalogExposure, false, `${asset.id} must not enter broad catalog exposure`);
    assert.equal(Array.isArray(asset.runtimePromotion?.playerSurfaces), true, `${asset.id} must declare audited player surfaces`);
    assert.equal(asset.runtimePromotion.playerSurfaces.length > 0, true, `${asset.id} must declare at least one audited player surface`);
    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not expose internal catalog surface`);
    assert.equal(asset.uiSurface.includes("stage-backdrop"), false, `${asset.id} must not be a stage backdrop`);
    assert.equal(asset.uiSurface.includes("relevant-scene"), false, `${asset.id} must not be a relevant scene`);
  }
});

test("Kepler registered assets keep complete localized semantic metadata", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const keplerAssets = manifest.rasterAssets.filter((asset) => keplerAssetPattern.test(asset.id));
  const semanticKeys = keplerAssets.map((asset) => asset.semanticKey);

  assert.equal(keplerAssets.length, 834);
  assert.equal(new Set(semanticKeys).size, semanticKeys.length, "Kepler semantic keys must remain unique");

  for (const asset of keplerAssets) {
    assert.equal(Boolean(asset.displayName?.en), true, `${asset.id} must include English display name`);
    assert.equal(Boolean(asset.displayName?.zh), true, `${asset.id} must include Chinese display name`);
    assert.equal(Boolean(asset.semanticKey), true, `${asset.id} must include semanticKey`);
    assert.equal(Boolean(asset.sourceDescriptionMap), true, `${asset.id} must include sourceDescriptionMap`);
    assert.equal(Boolean(asset.sourcePromptRef), true, `${asset.id} must include sourcePromptRef`);
    assert.equal(Boolean(asset.variantAxes), true, `${asset.id} must include variant axes`);
    assert.equal(Boolean(asset.gameplayBinding), true, `${asset.id} must include gameplay binding`);
    assert.equal(keplerReviewStatuses.has(asset.quality?.reviewStatus), true, `${asset.id} must use a known Kepler review status`);

    if (asset.categoryId === "scenes") {
      assert.equal(Boolean(asset.localizedDescription?.en), true, `${asset.id} must include English localized scene description`);
      assert.equal(Boolean(asset.localizedDescription?.zh), true, `${asset.id} must include Chinese localized scene description`);
      assert.equal(typeof asset.description, "string", `${asset.id} must expose stage description as text`);
      assert.equal(asset.gameplayBinding.requiresSceneDefinition, true, `${asset.id} must bind to a scene definition`);
    } else if (asset.visibility === "runtime-promoted") {
      assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include English localized runtime description`);
      assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include Chinese localized runtime description`);
      assert.equal(asset.gameplayBinding.runtimePromotionRequired, false, `${asset.id} must have completed source-bound runtime promotion`);
      assert.equal(asset.gameplayBinding.runtimePromotionStatus, "ui-approved-runtime", `${asset.id} must declare gameplay runtime promotion status`);
      assert.equal(asset.runtimePromotion?.status, "ui-approved-runtime", `${asset.id} must carry runtime promotion metadata`);
      assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not remain catalog-internal`);
    } else {
      assert.equal(Boolean(asset.description?.en), true, `${asset.id} must include English localized internal description`);
      assert.equal(Boolean(asset.description?.zh), true, `${asset.id} must include Chinese localized internal description`);
      assert.equal(asset.gameplayBinding.runtimePromotionRequired, true, `${asset.id} must require runtime promotion`);
    }
  }
});

test("sheet 053 armor outfit cutouts use normalized manifest names", async () => {
  const manifest = JSON.parse(await readFile("assets/generated/manifest.json", "utf8"));
  const assetsById = new Map(manifest.rasterAssets.map((asset) => [asset.id, asset]));
  const sheet = manifest.generatedSheets.find((entry) => entry.id === "aidm-armor-outfit-cutouts-sheet-053");

  assert.ok(sheet, "053 generated sheet must be registered");
  assert.equal(sheet.assetIds.length, 64);

  for (let tile = 1; tile <= 64; tile += 1) {
    const suffix = String(tile).padStart(2, "0");
    const id = `aidm-armor-outfit-cutout-053-${suffix}`;
    const asset = assetsById.get(id);

    assert.ok(asset, `${id} must be registered`);
    assert.equal(asset.file, `assets/generated/items/${id}.png`);
    assert.equal(asset.sourceAssetId, id, `${id} sourceAssetId must point to the normalized sliced asset id`);
    assert.equal(sheet.assetIds.includes(id), true, `${id} must be linked from the 053 sheet`);
    assert.equal(`${asset.id} ${asset.file} ${asset.sourceAssetId}`.includes("aidm-armor-outfit-053-"), false);
    await assertRegistrationFileContract(asset);
  }
});

async function assertRegistrationFileContract(asset) {
  assert.equal(Boolean(asset.file), true, `${asset.id || "asset"} must include a file path`);

  if (!isGeneratedRasterAssetFile(asset.file)) {
    await access(asset.file);
    return;
  }

  const delivery = assetBinaryDelivery(asset.file, asset);
  const fallbackFile = asset.svgFile || asset.fallbackFile || asset.binaryDelivery?.fallbackFile || delivery.fallbackFile;

  assert.equal(delivery.status, externalBinaryStatus, `${asset.id} generated raster payload may be delivered externally`);
  assert.equal(delivery.gitPolicy, "generated-raster-binary-excluded", `${asset.id} generated raster binary must not be required by Git`);
  assert.equal(Boolean(asset.provenance?.sourceSha256 || asset.provenance?.promptId || asset.semanticKey || asset.sourcePromptRef), true, `${asset.id} must keep enough metadata provenance without the binary payload`);
  assert.equal(Boolean(fallbackFile), true, `${asset.id} must have a committed fallback for missing generated raster payload`);
  await access(fallbackFile);
}
