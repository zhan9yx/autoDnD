import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";

const manifestPath = "assets/generated/manifest.json";
const descriptionMapPaths = [
  "docs/assets/description-maps/scene-description-map-042-050.json",
  "docs/assets/description-maps/icon-description-map-042-049.json",
  "docs/assets/description-maps/icon-description-map-050-059.json"
];

const licensePayload = {
  id: "chatgpt-image-generation",
  name: "ChatGPT image generation output",
  usage: "AIDM raster marketplace sprites and scene cards."
};

const sceneSurfaces = ["stage-backdrop", "relevant-scene"];
const internalSurfaces = ["catalog-internal"];
const runtimePromotionSurfaces = ["ui-approved-runtime"];
const runtimePromotionVisibility = "runtime-promoted";
const runtimePromotionStatus = "ui-approved-runtime";
const runtimePromotionAudit = "docs/qa/generated-asset-exposure-audit-2026-05-26.md";
const runtimePromotionSourceRoots = ["src", "public"];
const runtimePromotionExtensions = new Set([".js", ".mjs", ".html", ".css", ".json"]);
const generatedPngRefPattern = /assets\/generated\/[A-Za-z0-9_./-]+\.png/g;

const sheetSpecs = {
  "aidm-action-icon-042": sheetSpec("aidm-action-icons-sheet-042", "AIDM Action Icons Sheet 042", "assets/generated/sheets/aidm-action-icons-sheet-042.png", "rules", 4, 4, "action-icons-042"),
  "aidm-spell-icon-043": sheetSpec("aidm-spell-icons-sheet-043", "AIDM Spell Icons Sheet 043", "assets/generated/sheets/aidm-spell-icons-sheet-043.png", "spells", 4, 4, "spell-icons-043"),
  "aidm-scroll-icon-044": sheetSpec("aidm-scroll-icons-sheet-044", "AIDM Scroll Icons Sheet 044", "assets/generated/sheets/aidm-scroll-icons-sheet-044.png", "spells", 4, 4, "scroll-icons-044"),
  "aidm-status-icon-045": sheetSpec("aidm-status-icons-sheet-045", "AIDM Status Icons Sheet 045", "assets/generated/sheets/aidm-status-icons-sheet-045.png", "rules", 4, 4, "status-icons-045"),
  "aidm-class-badge-046": sheetSpec("aidm-class-profession-badges-sheet-046", "AIDM Class Profession Badges Sheet 046", "assets/generated/sheets/aidm-class-profession-badges-sheet-046.png", "characters", 4, 4, "class-profession-badges-046"),
  "aidm-equipment-tool-047": sheetSpec("aidm-equipment-tools-sheet-047", "AIDM Equipment Tools Sheet 047", "assets/generated/sheets/aidm-equipment-tools-sheet-047.png", "equipment", 4, 4, "equipment-tools-047", "accept-with-metadata-risk"),
  "aidm-reward-economy-048": sheetSpec("aidm-reward-economy-sheet-048", "AIDM Reward Economy Sheet 048", "assets/generated/sheets/aidm-reward-economy-sheet-048.png", "equipment", 4, 4, "reward-economy-048", "accepted-metadata"),
  "aidm-weather-overlay-049": sheetSpec("aidm-weather-overlay-icons-sheet-049", "AIDM Weather Overlay Icons Sheet 049", "assets/generated/sheets/aidm-weather-overlay-icons-sheet-049.png", "rules", 4, 4, "weather-overlay-icons-049"),
  "aidm-hostile-token-050": sheetSpec("aidm-hostile-token-icons-sheet-050", "AIDM Hostile Token Icons Sheet 050", "assets/generated/sheets/aidm-hostile-token-icons-sheet-050.png", "characters", 8, 8, "hostile-token-icons-050"),
  "aidm-npc-token-051": sheetSpec("aidm-npc-token-icons-sheet-051", "AIDM NPC Token Icons Sheet 051", "assets/generated/sheets/aidm-npc-token-icons-sheet-051.png", "characters", 8, 8, "npc-token-icons-051"),
  "aidm-weapon-cutout-052": sheetSpec("aidm-weapon-cutouts-sheet-052", "AIDM Weapon Cutouts Sheet 052", "assets/generated/sheets/aidm-weapon-cutouts-sheet-052.png", "equipment", 8, 8, "weapon-cutouts-052"),
  "aidm-armor-outfit-cutout-053": sheetSpec("aidm-armor-outfit-cutouts-sheet-053", "AIDM Armor Outfit Cutouts Sheet 053", "assets/generated/sheets/aidm-armor-outfit-cutouts-sheet-053.png", "equipment", 8, 8, "armor-outfit-cutouts-053"),
  "aidm-consumable-provision-054": sheetSpec("aidm-consumable-provision-icons-sheet-054", "AIDM Consumable Provision Icons Sheet 054", "assets/generated/sheets/aidm-consumable-provision-icons-sheet-054.png", "equipment", 8, 8, "consumable-provision-icons-054"),
  "aidm-tool-clue-055": sheetSpec("aidm-tool-clue-icons-sheet-055", "AIDM Tool Clue Icons Sheet 055", "assets/generated/sheets/aidm-tool-clue-icons-sheet-055.png", "equipment", 8, 8, "tool-clue-icons-055"),
  "aidm-treasure-material-056": sheetSpec("aidm-treasure-material-icons-sheet-056", "AIDM Treasure Material Icons Sheet 056", "assets/generated/sheets/aidm-treasure-material-icons-sheet-056.png", "equipment", 8, 8, "treasure-material-icons-056"),
  "aidm-spell-scroll-rune-057": sheetSpec("aidm-spell-scroll-rune-icons-sheet-057", "AIDM Spell Scroll Rune Icons Sheet 057", "assets/generated/sheets/aidm-spell-scroll-rune-icons-sheet-057.png", "spells", 8, 8, "spell-scroll-rune-icons-057"),
  "aidm-status-hazard-058": sheetSpec("aidm-status-hazard-icons-sheet-058", "AIDM Status Hazard Icons Sheet 058", "assets/generated/sheets/aidm-status-hazard-icons-sheet-058.png", "rules", 8, 8, "status-hazard-icons-058", "accept-with-risk"),
  "aidm-faction-overlay-059": sheetSpec("aidm-faction-overlay-icons-sheet-059", "AIDM Faction Overlay Icons Sheet 059", "assets/generated/sheets/aidm-faction-overlay-icons-sheet-059.png", "rules", 8, 8, "faction-overlay-icons-059")
};

const internalGroupsByCategory = {
  characters: "generated-character-review",
  equipment: "generated-metadata-review",
  rules: "generated-rules-review",
  spells: "generated-spell-review"
};

const pngMetadataCache = new Map();
const sha256Cache = new Map();
let runtimePromotionsCache = null;

function sheetSpec(id, name, file, categoryId, columns, rows, promptId, reviewStatus = "metadata-registered-internal") {
  return { id, name, file, categoryId, columns, rows, promptId, reviewStatus };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const rowsBySourcePath = await readDescriptionMaps();
  const rows = [...rowsBySourcePath.values()].flat();
  const existingAssetIds = new Set((manifest.rasterAssets || []).map((asset) => asset.id));
  const existingSheetIds = new Set((manifest.generatedSheets || []).map((sheet) => sheet.id));
  const nextAssetsById = new Map((manifest.rasterAssets || []).map((asset) => [asset.id, asset]));
  const nextSheetsById = new Map((manifest.generatedSheets || []).map((sheet) => [sheet.id, sheet]));
  const sheetRows = groupSheetRows(rows.filter((row) => row.kind !== "scene"));
  const stats = {
    rows: rows.length,
    addedAssets: 0,
    mergedAssets: 0,
    addedSheets: 0,
    mergedSheets: 0,
    missingFiles: [],
    duplicateInputIds: findDuplicateValues(rows.map((row) => row.assetId)),
    duplicateInputSemanticKeys: findDuplicateValues(rows.map((row) => row.semanticKey).filter(Boolean))
  };

  if (stats.duplicateInputIds.length > 0 || stats.duplicateInputSemanticKeys.length > 0) {
    throw new Error(`Description maps contain duplicate ids or semantic keys: ${JSON.stringify(stats)}`);
  }

  for (const [prefix, entries] of sheetRows) {
    const spec = sheetSpecs[prefix];
    if (!spec) {
      throw new Error(`No sheet spec for ${prefix}`);
    }
    const sheet = await buildSheet(spec, entries);
    nextSheetsById.set(sheet.id, mergeRegistration(nextSheetsById.get(sheet.id), sheet));
    if (existingSheetIds.has(sheet.id)) stats.mergedSheets += 1;
    else stats.addedSheets += 1;
  }

  for (const [sourceMapPath, mapRows] of rowsBySourcePath) {
    for (const row of mapRows) {
      const asset = row.kind === "scene"
        ? await buildSceneAsset(row, sourceMapPath, manifest)
        : await buildInternalAsset(row, sourceMapPath);
      nextAssetsById.set(asset.id, mergeRegistration(nextAssetsById.get(asset.id), asset));
      if (existingAssetIds.has(asset.id)) stats.mergedAssets += 1;
      else stats.addedAssets += 1;
    }
  }

  manifest.generatedSheets = mergeOrderedById(manifest.generatedSheets || [], nextSheetsById);
  manifest.rasterAssets = mergeOrderedById(manifest.rasterAssets || [], nextAssetsById);
  manifest.sheets = manifest.generatedSheets;
  manifest.assets = manifest.rasterAssets;
  refreshCatalogCounts(manifest);

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(stats, null, 2));
}

async function readDescriptionMaps() {
  const maps = new Map();
  for (const path of descriptionMapPaths) {
    const rows = JSON.parse(await readFile(path, "utf8"));
    maps.set(path, rows);
  }
  return maps;
}

function groupSheetRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const prefix = assetPrefix(row.assetId);
    const entries = groups.get(prefix) || [];
    entries.push(row);
    groups.set(prefix, entries);
  }
  for (const entries of groups.values()) {
    entries.sort((a, b) => rowIndex(a) - rowIndex(b));
  }
  return groups;
}

async function buildSheet(spec, entries) {
  const dimensions = await pngMetadata(spec.file);
  const sourceSha256 = await sha256File(spec.file);
  const tile = {
    width: Math.floor(dimensions.width / spec.columns),
    height: Math.floor(dimensions.height / spec.rows),
    columns: spec.columns,
    rows: spec.rows
  };

  return {
    id: spec.id,
    name: spec.name,
    categoryId: spec.categoryId,
    assetType: "raster-sheet",
    file: spec.file,
    format: "png",
    dimensions: {
      width: dimensions.width,
      height: dimensions.height
    },
    tile,
    assetIds: entries.map((entry) => entry.assetId),
    license: licensePayload,
    provenance: {
      source: "ChatGPT image generation",
      generator: "chatgpt-image-generation",
      promptId: spec.promptId,
      sourcePromptRef: entries[0]?.sourcePromptRef || spec.promptId,
      prompt: "",
      sourceSheet: spec.file,
      sourceSha256,
      generatedAt: "2026-05-26T00:00:00.000+08:00"
    },
    registration: {
      source: "description-map",
      registeredAt: "2026-05-26T00:00:00.000+08:00",
      reviewStatus: spec.reviewStatus
    }
  };
}

async function buildSceneAsset(row, sourceMapPath, manifest) {
  await assertFile(row.file);
  const semanticSlug = sceneSlug(row);
  const axes = {
    ...row.variantAxes,
    timeOfDay: row.variantAxes?.time || row.variantAxes?.timeOfDay
  };
  const description = ensureSceneDescription(row.description?.en || "");
  const soundscapeHints = uniqueCompact([
    axes.weather,
    axes.location,
    axes.season,
    axes.time || axes.timeOfDay,
    axes.mood,
    axes.theme,
    axes.encounterState
  ]).slice(0, 5);

  return {
    id: row.assetId,
    assetId: row.assetId,
    name: row.displayName?.en || titleize(row.assetId),
    zhName: row.displayName?.zh || "",
    group: "generated-scenes",
    categoryId: "scenes",
    assetType: "raster",
    type: "scene-backdrop",
    file: row.file,
    sheetId: null,
    frame: {
      x: 0,
      y: 0,
      ...(await pngMetadata(row.file))
    },
    index: rowIndex(row) - 1,
    provenance: {
      source: "ChatGPT image generation",
      generator: "chatgpt-image-generation",
      promptId: row.sourcePromptRef,
      sourcePromptRef: row.sourcePromptRef,
      generatedAt: "2026-05-26T00:00:00.000+08:00",
      assetId: row.assetId,
      sourceMap: sourceMapPath,
      fileSha256: await sha256File(row.file)
    },
    license: licensePayload,
    tags: uniqueCompact([
      "generated-scenes",
      "scene-backbone",
      `scene-backbone-${sceneBatch(row.assetId)}`,
      "stage-backdrop",
      "relevant-scene",
      "scene-backdrop",
      axes.location,
      axes.weather,
      axes.time || axes.timeOfDay,
      axes.mood,
      axes.theme,
      axes.priority
    ]),
    visibility: "player-safe",
    uiSurface: sceneSurfaces,
    quality: {
      approved: true,
      reviewStatus: "metadata-approved",
      duplicateRisk: "low",
      safetyFlags: []
    },
    stylePresetId: manifest.sceneLibrary?.stylePresetId || "aidm-cinematic-gaslamp-fantasy-v1",
    narrativeUses: ["stage-backdrop", "relevant-scene", "encounter-setup", axes.encounterState || axes.theme || "scene-backbone"],
    displayName: row.displayName,
    description,
    localizedDescription: row.description,
    semanticKey: row.semanticKey,
    variantOf: `scene.${semanticSlug}`,
    variantAxes: axes,
    gameplayBinding: {
      ...row.gameplayBinding,
      flow: ["stage", "scene-selection", "relevant-scene"],
      requiresSceneDefinition: true
    },
    sourcePromptRef: row.sourcePromptRef,
    sourceDescriptionMap: sourceMapPath,
    sourceMapStatus: row.status,
    sceneSlug: semanticSlug,
    taxonomy: {
      category: "Backbone Scenes",
      biome: axes.season || axes.weather || "fantasy",
      settlementType: inferSettlementType(axes.location),
      interiorExterior: inferInteriorExterior(axes.location, axes.weather),
      locationType: axes.location || "scene-backbone",
      scale: "full-bleed scene backdrop",
      theme: axes.theme
    },
    weather: axes.weather || "varied",
    timeOfDay: axes.time || axes.timeOfDay || "varied",
    mood: axes.mood || axes.theme || "adventure",
    threatLevel: axes.encounterState || axes.theme || "narrative-pressure",
    soundscapeHints
  };
}

async function buildInternalAsset(row, sourceMapPath) {
  await assertFile(row.file);
  const prefix = assetPrefix(row.assetId);
  const spec = sheetSpecs[prefix];
  const index = rowIndex(row);
  const rowZero = Math.floor((index - 1) / spec.columns);
  const colZero = (index - 1) % spec.columns;
  const sheetDimensions = await pngMetadata(spec.file);
  const tileWidth = Math.floor(sheetDimensions.width / spec.columns);
  const tileHeight = Math.floor(sheetDimensions.height / spec.rows);
  const reviewStatus = row.reviewRisk?.startsWith("accept-with-risk")
    ? "accept-with-risk"
    : spec.reviewStatus;
  const promotion = (await runtimePromotions()).get(row.assetId);

  const asset = {
    id: row.assetId,
    assetId: row.assetId,
    name: row.displayName?.en || titleize(row.assetId),
    zhName: row.displayName?.zh || "",
    group: internalGroupsByCategory[spec.categoryId] || "generated-metadata-review",
    categoryId: spec.categoryId,
    assetType: "raster",
    type: typeForRow(row),
    file: row.file,
    contentSha256: await sha256File(row.file),
    sheetId: spec.id,
    frame: {
      x: colZero * tileWidth,
      y: rowZero * tileHeight,
      width: tileWidth,
      height: tileHeight
    },
    index: index - 1,
    sourceSheet: spec.file,
    provenance: {
      source: "ChatGPT image generation",
      generator: "chatgpt-image-generation",
      promptId: spec.promptId,
      sourcePromptRef: row.sourcePromptRef,
      prompt: "",
      sourceSheet: spec.file,
      sourceSha256: await sha256File(spec.file),
      generatedAt: "2026-05-26T00:00:00.000+08:00",
      assetId: row.assetId,
      row: rowZero,
      col: colZero,
      sourceMap: sourceMapPath
    },
    license: licensePayload,
    tags: uniqueCompact([
      internalGroupsByCategory[spec.categoryId],
      prefix,
      `sheet-${sheetNumber(row.assetId)}`,
      row.kind,
      "imagegen",
      "metadata-review",
      "internal",
      row.variantAxes?.assetClass,
      row.variantAxes?.sheetGroup,
      row.variantAxes?.sourceCategory,
      row.variantAxes?.bindingDomain,
      row.variantAxes?.bindingKey,
      row.variantAxes?.visualStyle,
      row.variantAxes?.priority
    ]),
    visibility: "internal",
    uiSurface: internalSurfaces,
    quality: qualityForInternal(row, reviewStatus),
    displayName: row.displayName,
    description: row.description,
    semanticKey: row.semanticKey,
    variantOf: variantOf(row),
    variantAxes: row.variantAxes,
    gameplayBinding: {
      ...row.gameplayBinding,
      runtimePromotionRequired: true
    },
    sourcePromptRef: row.sourcePromptRef,
    sourceDescriptionMap: sourceMapPath,
    sourceMapStatus: row.status,
    reviewRisk: row.reviewRisk,
    sourceAssetId: normalizedSourceAssetId(row),
    namingNote: normalizedNamingNote(row)
  };

  return promotion ? applyRuntimePromotion(asset, row, promotion) : asset;
}

function qualityForInternal(row, reviewStatus) {
  const safetyFlags = ["runtime-promotion-required"];
  if (reviewStatus === "accept-with-metadata-risk") {
    safetyFlags.push("metadata-risk-review-required");
  }
  if (reviewStatus === "accept-with-risk") {
    safetyFlags.push("alpha-edge-risk");
  }
  return {
    approved: false,
    reviewStatus,
    duplicateRisk: "low",
    safetyFlags,
    riskNotes: row.reviewRisk || undefined
  };
}

async function runtimePromotions() {
  if (runtimePromotionsCache) return runtimePromotionsCache;

  const refsById = new Map();
  const files = await runtimeSourceFiles(runtimePromotionSourceRoots);

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(generatedPngRefPattern)) {
      const assetId = assetIdFromFile(match[0]);
      if (!assetId) continue;
      const refs = refsById.get(assetId) || { sourceFiles: new Set() };
      refs.sourceFiles.add(file);
      refsById.set(assetId, refs);
    }
  }

  runtimePromotionsCache = new Map([...refsById.entries()].map(([assetId, refs]) => [
    assetId,
    {
      sourceFiles: [...refs.sourceFiles].sort()
    }
  ]));
  return runtimePromotionsCache;
}

async function runtimeSourceFiles(roots) {
  const files = [];
  for (const root of roots) {
    files.push(...await listRuntimeFiles(root));
  }
  return files.sort();
}

async function listRuntimeFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...await listRuntimeFiles(path));
    } else if (runtimePromotionExtensions.has(fileExtension(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function fileExtension(name) {
  const match = name.match(/\.[^.]+$/);
  return match?.[0] || "";
}

function assetIdFromFile(file) {
  const match = String(file).match(/\/([^/]+)\.png$/);
  return match?.[1] || "";
}

function applyRuntimePromotion(asset, row, promotion) {
  const playerSurfaces = runtimePlayerSurfaces(row, promotion.sourceFiles);
  const safetyFlags = uniqueCompact([
    ...(asset.quality?.safetyFlags || []).filter((flag) => flag !== "runtime-promotion-required"),
    "source-bound-runtime-only"
  ]);

  return {
    ...asset,
    tags: uniqueCompact([
      ...(asset.tags || []),
      runtimePromotionStatus,
      "runtime-promoted"
    ]),
    visibility: runtimePromotionVisibility,
    uiSurface: runtimePromotionSurfaces,
    quality: {
      ...asset.quality,
      approved: false,
      safetyFlags,
      runtimePromotionStatus
    },
    gameplayBinding: {
      ...asset.gameplayBinding,
      runtimePromotionRequired: false,
      runtimePromotionStatus,
      runtimePromotionSurfaces: playerSurfaces
    },
    runtimePromotion: {
      status: runtimePromotionStatus,
      scope: "source-bound-player-ui",
      source: "runtime-source-literal-scan",
      sourceAudit: runtimePromotionAudit,
      promotedAt: "2026-05-26T00:00:00.000+08:00",
      catalogExposure: false,
      playerSurfaces,
      sourceFiles: promotion.sourceFiles,
      notes: "Allowed only for audited source-bound UI paths; this is not a broad generated catalog or marketplace promotion."
    }
  };
}

function runtimePlayerSurfaces(row, sourceFiles) {
  const prefix = assetPrefix(row.assetId);
  const fromItemCatalog = sourceFiles.includes("src/core/itemCatalog.js");
  const surfaces = [];

  if (fromItemCatalog) {
    surfaces.push("inventory-item", "market-item", "reward-card", "item-detail", "transcript-event");
  }
  if (prefix === "aidm-action-icon-042") {
    surfaces.push("leveling-rule-card", "leveling-chip", "combat-skill-card");
  }
  if (prefix === "aidm-class-badge-046") {
    surfaces.push("character-builder", "player-detail", "leveling-summary", "leveling-specialization");
  }
  if (prefix === "aidm-spell-icon-043" || prefix === "aidm-spell-scroll-rune-057") {
    surfaces.push("spell-card", "character-builder", "leveling-rule-card", "leveling-chip");
  }
  if (prefix === "aidm-scroll-icon-044") {
    surfaces.push("spell-card", "item-detail", "leveling-rule-card", "leveling-chip");
  }
  if (prefix === "aidm-status-icon-045" || prefix === "aidm-status-hazard-058") {
    surfaces.push("status-icon", "combatant-detail", "transcript-event", "player-detail", "leveling-rule-card", "leveling-chip");
  }

  return uniqueCompact(surfaces);
}

function typeForRow(row) {
  if (row.kind === "hostile-token") return "hostile-token";
  if (row.kind === "npc-token") return "npc-token";
  if (row.kind === "armor-outfit-cutout" || row.kind === "weapon-cutout" || row.kind.endsWith("-cutout")) return "raster-icon";
  if (row.kind.endsWith("-icon") || ["rules", "characters", "equipment", "spells"].includes(row.kind)) return "raster-icon";
  return "raster-icon";
}

function mergeRegistration(existing, next) {
  if (!existing) return next;
  return {
    ...existing,
    ...next
  };
}

function mergeOrderedById(existingEntries, entriesById) {
  const emitted = new Set();
  const merged = [];
  for (const entry of existingEntries) {
    if (!entriesById.has(entry.id)) continue;
    merged.push(entriesById.get(entry.id));
    emitted.add(entry.id);
  }
  for (const [id, entry] of entriesById) {
    if (emitted.has(id)) continue;
    merged.push(entry);
  }
  return merged;
}

function refreshCatalogCounts(manifest) {
  const assets = manifest.rasterAssets || [];
  manifest.assetCatalog = manifest.assetCatalog || {};
  manifest.assetCatalog.actualGeneratedRasterAssets = assets.length;
  manifest.assetCatalog.playerSafeAssets = assets.filter((asset) => asset.visibility === "player-safe").length;
  manifest.assetCatalog.internalAssets = assets.filter((asset) => asset.visibility === "internal").length;
  manifest.assetCatalog.runtimePromotedAssets = assets.filter((asset) => asset.visibility === runtimePromotionVisibility).length;

  manifest.exposurePolicy = manifest.exposurePolicy || {};
  manifest.exposurePolicy.runtimePromotionVisibility = runtimePromotionVisibility;
  manifest.exposurePolicy.runtimePromotionSurface = runtimePromotionStatus;
  manifest.exposurePolicy.runtimePromotionRules = [
    "runtime-promoted generated assets are source-bound UI dependencies, not broadly player-safe marketplace assets.",
    "runtime-promoted generated assets must use uiSurface ui-approved-runtime and carry runtimePromotion.playerSurfaces for the audited UI paths.",
    "runtime-promoted generated assets must not use catalog-internal and must not enter player-safe selection pools until separately approved.",
    "quality.approved remains false when visual QA or alpha-risk review is not complete; runtimePromotion.status records the narrower source-bound allowance."
  ];

  manifest.sceneLibrary = manifest.sceneLibrary || {};
  manifest.sceneLibrary.actualGeneratedRasterScenes = assets.filter((asset) => {
    return asset.assetType === "raster"
      && asset.categoryId === "scenes"
      && asset.group === "generated-scenes";
  }).length;
}

async function pngMetadata(path) {
  if (pngMetadataCache.has(path)) return pngMetadataCache.get(path);
  const buffer = await readFile(path);
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error(`${path} is not a PNG file`);
  }
  const metadata = {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
  pngMetadataCache.set(path, metadata);
  return metadata;
}

async function assertFile(path) {
  await readFile(path);
}

async function sha256File(path) {
  if (sha256Cache.has(path)) return sha256Cache.get(path);
  const hash = createHash("sha256").update(await readFile(path)).digest("hex");
  sha256Cache.set(path, hash);
  return hash;
}

function assetPrefix(assetId) {
  return assetId.replace(/-\d{2}$/, "");
}

function rowIndex(row) {
  const fromAxes = row.variantAxes?.rowMajorIndex || row.variantAxes?.tileIndex;
  if (Number.isFinite(fromAxes)) return fromAxes;
  const match = row.assetId.match(/-(\d{2})$/);
  return match ? Number(match[1]) : 1;
}

function sheetNumber(assetId) {
  const match = assetId.match(/-(\d{3})-\d{2}$/);
  return match ? match[1] : "";
}

function sceneBatch(assetId) {
  const match = assetId.match(/-(\d{3})-\d{2}$/);
  return match ? match[1] : "unknown";
}

function sceneSlug(row) {
  return row.variantAxes?.location || slugify(row.displayName?.en || row.assetId);
}

function variantOf(row) {
  return row.variantAxes?.bindingKey
    || row.gameplayBinding?.bindingKey
    || row.gameplayBinding?.actionId
    || row.gameplayBinding?.spellId
    || row.gameplayBinding?.classId
    || row.gameplayBinding?.statusId
    || slugify(row.displayName?.en || row.semanticKey || row.assetId);
}

function normalizedSourceAssetId(row) {
  if (row.assetId.startsWith("aidm-armor-outfit-cutout-053-")) {
    return row.assetId;
  }
  return row.sourceAssetId;
}

function normalizedNamingNote(row) {
  if (row.assetId.startsWith("aidm-armor-outfit-cutout-053-")) {
    return "Prompt rows used aidm-armor-outfit-053-##; manifest sourceAssetId is normalized to the actual sliced asset/file basename aidm-armor-outfit-cutout-053-##.";
  }
  return row.namingNote;
}

function ensureSceneDescription(description) {
  const trimmed = description.trim();
  const suffix = " It leaves clear stage context for player choices, tactical narration, and scene transitions.";
  return wordCount(trimmed) >= 12 && trimmed.length >= 80 ? trimmed : `${trimmed}${suffix}`;
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function titleize(value) {
  return String(value)
    .replace(/\.[^.]+$/, "")
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferSettlementType(location) {
  if (!location) return "varied";
  if (/tavern|market|guild|archive|courthouse|temple|harbor|station|lodge|street|plaza/.test(location)) return "settlement";
  if (/camp|fort|gate|camp/.test(location)) return "military";
  return "wilderness";
}

function inferInteriorExterior(location, weather) {
  if (/archive|tavern|guild|courthouse|lodge|sanctum|laboratory|library|vault|hall/.test(location || "")) return "interior";
  if (/indoor/.test(weather || "")) return "interior";
  return "exterior";
}

function uniqueCompact(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && value !== ""))];
}

function findDuplicateValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
