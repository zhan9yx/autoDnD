import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
let cachedCatalog = null;

export function loadGeneratedAssetCatalog() {
  if (cachedCatalog) {
    return cachedCatalog;
  }
  const manifestPath = join(rootDir, "assets/generated/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const assets = manifest.rasterAssets || manifest.assets || [];
  cachedCatalog = {
    manifest,
    assets,
    scenes: assets.filter((asset) => {
      return asset.categoryId === "scenes"
        && asset.assetType === "raster"
        && asset.visibility === "player-safe"
        && (asset.uiSurface || []).includes("stage-backdrop")
        && asset.file;
    }),
    rewards: assets.filter((asset) => asset.group === "generated-rewards" && asset.visibility === "player-safe" && asset.file)
  };
  return cachedCatalog;
}

export function buildPresentation(room, soundscape) {
  const sceneAsset = chooseSceneAsset(room, soundscape);
  const relevantScenes = chooseRelevantScenes(room, soundscape, { limit: 3 });
  const latestReward = [...(room?.transcript || [])].reverse().find((entry) => entry.type === "reward") || null;
  return {
    sceneAsset,
    relevantScenes,
    latestReward: latestReward?.reward || null
  };
}

export function chooseSceneAsset(room, soundscape) {
  const scenes = loadGeneratedAssetCatalog().scenes;
  if (scenes.length === 0) return null;
  const scored = scoreAssets(scenes, buildSceneTerms(room, soundscape));
  const best = scored[0]?.asset || scenes[0];
  return summarizeAsset(best, {
    reason: buildSceneReason(best, soundscape),
    transition: chooseSceneTransition(room, soundscape)
  });
}

export function chooseRelevantScenes(room, soundscape, { limit = 3 } = {}) {
  const scenes = loadGeneratedAssetCatalog().scenes;
  return scoreAssets(scenes, buildSceneTerms(room, soundscape))
    .slice(0, limit)
    .map(({ asset }) => summarizeAsset(asset, {
      reason: buildSceneReason(asset, soundscape),
      transition: chooseSceneTransition(room, soundscape)
    }));
}

export function chooseRewardAsset(room, actionText, check) {
  if (!check?.success || !matchesRewardIntent(actionText)) {
    return null;
  }
  const rewards = loadGeneratedAssetCatalog().rewards;
  if (rewards.length === 0) return null;
  const terms = buildRewardTerms(room, actionText);
  const scored = scoreAssets(rewards, terms);
  const selected = scored[0]?.score > 0
    ? scored[0].asset
    : rewards[stableIndex(`${room?.id || ""}:${room?.version || 0}:${actionText}`, rewards.length)];
  return {
    ...summarizeAsset(selected, { reason: "reward" }),
    kind: selected.variantAxes?.itemKind || selected.type || "item",
    rarity: selected.variantAxes?.rarity || "common",
    semanticKey: selected.semanticKey || selected.id
  };
}

export function matchesRewardIntent(actionText) {
  return /open|chest|coffer|loot|search|take|obtain|gain|claim|reward|treasure|key|ledger|map|salve|ring|打开|宝箱|搜刮|搜索|获得|拿起|奖励|战利品|钥匙|账本|地图|戒指/.test(
    String(actionText || "").toLowerCase()
  );
}

function buildSceneTerms(room, soundscape) {
  const recent = (room?.transcript || [])
    .slice(-6)
    .map((entry) => entry.text)
    .join(" ");
  return tokenize([
    room?.tone,
    room?.scene?.title,
    room?.scene?.location,
    room?.scene?.objective,
    room?.scene?.ambience,
    room?.director?.beat,
    room?.combat?.state,
    soundscape?.id,
    recent
  ]);
}

function buildRewardTerms(room, actionText) {
  return tokenize([
    actionText,
    room?.scene?.location,
    room?.scene?.objective,
    room?.tone,
    ...(room?.memories || []).slice(-3).map((memory) => memory.text)
  ]);
}

function scoreAssets(assets, terms) {
  return assets
    .map((asset, index) => ({ asset, index, score: scoreAsset(asset, terms) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
}

function scoreAsset(asset, terms) {
  const haystack = tokenize([
    asset.id,
    asset.name,
    asset.sceneSlug,
    asset.semanticKey,
    asset.variantOf,
    localizeText(asset.displayName),
    localizeText(asset.description),
    ...(asset.tags || []),
    ...(asset.soundscapeHints || []),
    ...Object.values(asset.variantAxes || {})
  ]);
  let score = 0;
  for (const term of terms) {
    if (haystack.has(term)) score += 4;
    for (const value of haystack) {
      if (value.includes(term) || term.includes(value)) {
        score += 1;
      }
    }
  }
  if (asset.visibility === "player-safe") score += 1;
  if (asset.quality?.approved) score += 1;
  return score;
}

function summarizeAsset(asset, extra = {}) {
  if (!asset) return null;
  return {
    id: asset.id,
    assetId: asset.id,
    name: asset.name,
    displayName: asset.displayName || { en: asset.name, zh: asset.zhName || asset.name },
    description: asset.description || "",
    categoryId: asset.categoryId,
    group: asset.group,
    type: asset.type,
    file: asset.file,
    semanticKey: asset.semanticKey || asset.id,
    variantOf: asset.variantOf || asset.id,
    variantAxes: asset.variantAxes || {},
    soundscapeHints: asset.soundscapeHints || [],
    uiSurface: asset.uiSurface || [],
    ...extra
  };
}

function buildSceneReason(asset, soundscape) {
  const hint = asset.soundscapeHints?.includes(soundscape?.id) ? soundscape.id : asset.soundscapeHints?.[0];
  return hint ? `matched-${hint}` : "matched-scene";
}

function chooseSceneTransition(room, soundscape) {
  if (soundscape?.id === "combat-tension" || room?.director?.beat === "crisis" || room?.director?.beat === "retaliation") {
    return "hard-crossfade";
  }
  return "soft-crossfade";
}

function tokenize(values) {
  const terms = new Set();
  for (const value of values.flat().filter(Boolean)) {
    const text = String(value).toLowerCase();
    for (const part of text.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((item) => item.length >= 2)) {
      terms.add(part);
    }
  }
  return terms;
}

function localizeText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return [value.en, value.zh, value.default].filter(Boolean).join(" ");
}

function stableIndex(value, length) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % length;
}
