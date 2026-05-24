import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { ENEMY_TEMPLATES } from "./bestiary.js";
import { ITEM_CATALOG, SHOP_CATALOG } from "./itemCatalog.js";
import { CLASSES, RACES, SPELLS } from "./rules.js";
import { STATUS_EFFECTS } from "./statusEffects.js";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
let cachedCatalog = null;

const semanticAliases = [
  { patterns: ["档案", "档案馆", "图书馆", "书库", "archive", "archives", "library", "ledger"], aliases: ["archive", "archives", "knowledge"] },
  { patterns: ["雨", "雨水", "暴雨", "storm", "rain", "rainy", "wet", "puddle"], aliases: ["rain", "rainy", "storm", "wet", "weather"] },
  { patterns: ["雷", "雷雨", "雷暴", "闪电", "thunder", "thunderstorm", "lightning"], aliases: ["thunder", "thunderstorm", "storm", "rain", "weather"] },
  { patterns: ["街", "街道", "街面", "street"], aliases: ["street"] },
  { patterns: ["巷", "小巷", "alley"], aliases: ["alley"] },
  { patterns: ["广场", "plaza"], aliases: ["plaza"] },
  { patterns: ["城市", "城镇", "city"], aliases: ["city"] },
  { patterns: ["外", "室外", "outside", "exterior"], aliases: ["exterior"] },
  { patterns: ["室内", "屋内", "房间", "inside", "indoor", "indoors", "interior"], aliases: ["indoor", "interior"] },
  { patterns: ["夜", "夜色", "夜晚", "moon", "moonlit", "night"], aliases: ["night", "moonlit"] },
  { patterns: ["晴", "晴朗", "sun", "sunny", "clear"], aliases: ["clear", "sunny"] },
  { patterns: ["溪", "溪边", "小溪", "brook", "creek", "stream"], aliases: ["brook", "creek", "stream", "water"] },
  { patterns: ["路", "道路", "小路", "road", "trail", "path"], aliases: ["road", "trail", "path", "travel"] },
  { patterns: ["旅店", "客栈", "酒馆", "tavern", "inn", "pub", "alehouse", "common room", "mug"], aliases: ["tavern", "inn", "hearth", "interior"] },
  { patterns: ["灯火", "灯笼", "炉火", "lantern", "hearth", "firelight"], aliases: ["lantern", "hearth", "warmth"] },
  { patterns: ["圣坛", "圣所", "神龛", "神殿", "神庙", "祭坛", "shrine", "sanctuary", "temple", "altar"], aliases: ["shrine", "sanctuary", "temple", "altar"] },
  { patterns: ["崖", "悬崖", "峭壁", "cliff", "cliffside", "bluff"], aliases: ["cliff", "cliffside"] },
  { patterns: ["沙漠", "荒漠", "desert", "wasteland"], aliases: ["desert", "wasteland"] },
  { patterns: ["废墟", "遗迹", "ruin", "ruins"], aliases: ["ruin", "ruins"] },
  { patterns: ["森林", "树林", "forest", "grove", "wood"], aliases: ["forest", "grove"] },
  { patterns: ["雪", "冰", "snow", "frozen", "ice"], aliases: ["snow", "frozen", "ice"] },
  { patterns: ["岩浆", "熔岩", "lava", "forge"], aliases: ["lava", "forge", "fire"] }
];

const rainWeatherConflicts = new Set(["clear", "sunny", "desert", "wasteland", "lava", "snow", "frozen", "ice"]);
const archiveLocationConflicts = new Set(["desert", "wasteland", "forest", "grove", "lava", "forge", "snow", "frozen", "cemetery", "meadow"]);
const itemSurfaces = new Set(["inventory-item", "market-item", "reward-card", "item-detail", "transcript-event"]);
const characterSurfaces = new Set(["character-builder", "party-avatar", "player-detail"]);
const npcSurfaces = new Set(["encounter-card", "npc-token", "combatant-detail"]);
const spellSurfaces = new Set(["spell-card", "character-builder"]);
const statusSurfaces = new Set(["status-icon", "combatant-detail", "transcript-event", "player-detail"]);
const spellRuntimeAliases = {
  firebolt: ["fire", "ember", "bolt", "evocation", "attack"],
  "radiant-bolt": ["radiant", "radiance", "sun", "bolt", "divine", "attack"],
  "healing-word": ["healing", "mend", "verdant", "restoration", "support"],
  ward: ["ward", "abjuration", "frost", "shield", "defense", "support"],
  sleep: ["sleep", "shroud", "illusion", "enchantment", "control"],
  "arcane-shield": ["arcane", "shield", "mirror", "veil", "abjuration", "defense"],
  "binding-vines": ["binding", "vines", "root", "wild", "grasp", "nature", "control"]
};
const spellRuntimeAssetIds = {
  firebolt: "aidm-spell-015-01",
  "radiant-bolt": "aidm-spell-015-13",
  "healing-word": "aidm-spell-015-05",
  ward: "aidm-spell-015-02",
  sleep: "aidm-spell-015-14",
  "arcane-shield": "aidm-spell-015-07",
  "binding-vines": "aidm-spell-015-16"
};
const npcRuntimeAliases = {
  street_skirmisher: ["street", "alley", "skirmisher", "blade", "thieves-guild", "standard"],
  knife_hunter: ["knife", "hunter", "blade", "skirmisher", "standard"],
  bone_guard: ["bone", "guard", "soldier", "undead", "duelist", "standard"],
  veiled_acolyte: ["acolyte", "cultist", "divine", "support", "standard"],
  alley_archer: ["alley", "archer", "skirmisher", "standard"],
  iron_raider: ["iron", "raider", "brute", "heavy"],
  bridge_brute: ["bridge", "brute", "heavy"],
  shadow_mage: ["shadow", "mage", "arcane", "rival", "elite"]
};

export function loadGeneratedAssetCatalog() {
  if (cachedCatalog) {
    return cachedCatalog;
  }
  const manifestPath = join(rootDir, "assets/generated/manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const assets = manifest.rasterAssets || manifest.assets || [];
  const playerSafeAssets = assets.filter(isRuntimeVisibleAsset);
  const itemAssets = playerSafeAssets.filter((asset) => {
    return asset.categoryId === "equipment"
      && hasAnySurface(asset, itemSurfaces)
      && asset.gameplayBinding?.requiresItemDefinition === true;
  });
  cachedCatalog = {
    manifest,
    assets,
    playerSafeAssets,
    byFile: indexAssets(playerSafeAssets, (asset) => [asset.file, asset.svgFile]),
    bySemanticKey: indexAssets(playerSafeAssets, (asset) => [asset.semanticKey]),
    itemAssets,
    marketItems: itemAssets.filter((asset) => hasSurface(asset, "market-item")),
    inventoryItems: itemAssets.filter((asset) => hasSurface(asset, "inventory-item")),
    characterOptions: playerSafeAssets.filter((asset) => asset.group === "generated-character-options" && asset.categoryId === "characters"),
    npcTokens: playerSafeAssets.filter((asset) => asset.group === "generated-npc-tokens" && asset.categoryId === "characters"),
    spellAssets: playerSafeAssets.filter((asset) => asset.group === "generated-spells" && asset.categoryId === "spells"),
    statusIcons: playerSafeAssets.filter((asset) => asset.group === "generated-status-effects" && asset.categoryId === "rules"),
    scenes: playerSafeAssets.filter((asset) => {
      return asset.categoryId === "scenes"
        && asset.assetType === "raster"
        && hasSurface(asset, "stage-backdrop");
    }),
    rewards: playerSafeAssets.filter((asset) => asset.group === "generated-rewards" && asset.file)
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
    latestReward: latestReward?.reward || null,
    assetBindings: buildRuntimeAssetBindings(room, { latestReward: latestReward?.reward || null, soundscape })
  };
}

export function buildRuntimeAssetBindings(room = {}, { latestReward = null, soundscape = null } = {}) {
  const players = Array.isArray(room?.players) ? room.players : [];
  const marketItems = SHOP_CATALOG
    .map((offer) => chooseItemAsset(offer.itemId, {
      surface: "market-item",
      binding: {
        source: "shop-catalog",
        quantity: offer.quantity,
        condition: offer.condition
      }
    }))
    .filter(Boolean);
  const inventoryItems = [];
  const characterAssets = [];
  const spellCards = [];
  const statusIcons = [];

  for (const player of players) {
    for (const entry of player?.character?.inventory || []) {
      const bound = chooseItemAsset(entry, {
        surface: "inventory-item",
        binding: {
          source: "inventory",
          playerId: player.id,
          inventoryEntryId: entry?.id || null
        }
      });
      if (bound) inventoryItems.push(bound);
    }

    characterAssets.push(...chooseCharacterAssets(player?.character, {
      surface: "player-detail",
      binding: { source: "player-character", playerId: player.id }
    }));

    const knownSpellIds = new Set([
      ...(player?.character?.knownSpells || []),
      ...(player?.character?.spells || [])
    ]);
    for (const spellId of knownSpellIds) {
      const bound = chooseSpellAsset(spellId, {
        surface: "spell-card",
        binding: { source: "known-spell", playerId: player.id }
      });
      if (bound) spellCards.push(bound);
    }
  }

  for (const conditionId of collectRoomStatusIds(room)) {
    const bound = chooseStatusAsset(conditionId, {
      surface: "status-icon",
      binding: { source: "room-status" }
    });
    if (bound) statusIcons.push(bound);
  }

  const npcTokens = collectRoomNpcEntries(room)
    .map((npc) => chooseNpcTokenAsset(npc, {
      surface: "npc-token",
      binding: {
        source: "encounter",
        npcId: npc.id || null,
        templateId: npc.templateId || null
      }
    }))
    .filter(Boolean);
  const rewardItems = latestReward
    ? [chooseItemAsset(latestReward, {
        surface: "reward-card",
        binding: { source: "latest-reward" }
      })].filter(Boolean)
    : [];

  return {
    scenes: chooseRelevantScenes(room, soundscape, { limit: 3 }),
    marketItems: uniqueBindings(marketItems),
    inventoryItems: uniqueBindings(inventoryItems),
    rewardItems: uniqueBindings(rewardItems),
    characterOptions: listCharacterOptionAssets({ surface: "character-builder" }),
    characterAssets: uniqueBindings(characterAssets),
    spellOptions: Object.keys(SPELLS)
      .map((spellId) => chooseSpellAsset(spellId, {
        surface: "character-builder",
        binding: { source: "spell-definitions" }
      }))
      .filter(Boolean),
    spellCards: uniqueBindings(spellCards),
    npcTokens: uniqueBindings(npcTokens),
    statusIcons: uniqueBindings(statusIcons)
  };
}

export function chooseSceneAsset(room, soundscape) {
  const scenes = loadGeneratedAssetCatalog().scenes;
  if (scenes.length === 0) return null;
  const scored = scoreSceneAssets(scenes, buildSceneTerms(room, soundscape));
  const best = scored[0]?.asset || scenes[0];
  return summarizeAsset(best, {
    reason: buildSceneReason(best, soundscape),
    transition: chooseSceneTransition(room, soundscape)
  });
}

export function chooseRelevantScenes(room, soundscape, { limit = 3 } = {}) {
  const scenes = loadGeneratedAssetCatalog().scenes;
  return scoreSceneAssets(scenes, buildSceneTerms(room, soundscape))
    .slice(0, limit)
    .map(({ asset }) => summarizeAsset(asset, {
      reason: buildSceneReason(asset, soundscape),
      transition: chooseSceneTransition(room, soundscape)
    }));
}

export function chooseRewardAsset(room, actionText, check, { source = findRewardSource(room, actionText) } = {}) {
  if (!check?.success || !matchesRewardIntent(actionText) || !source) {
    return null;
  }
  const rewards = loadGeneratedAssetCatalog().rewards;
  if (rewards.length === 0) return null;
  const itemBackedRewards = rewards.filter((asset) => asset.gameplayBinding?.requiresItemDefinition);
  const candidates = itemBackedRewards.length > 0 ? itemBackedRewards : rewards;
  const terms = buildRewardTerms(room, actionText, source);
  const scored = scoreAssets(candidates, terms);
  const selected = scored[0]?.score > 0
    ? scored[0].asset
    : candidates[stableIndex(`${room?.id || ""}:${room?.version || 0}:${source.id}:${actionText}`, candidates.length)];
  return {
    ...summarizeAsset(selected, { reason: "reward" }),
    source,
    kind: selected.gameplayBinding?.itemKind || selected.variantAxes?.itemKind || selected.type || "item",
    rarity: selected.variantAxes?.rarity || "common",
    semanticKey: selected.semanticKey || selected.id
  };
}

export function chooseItemAsset(itemOrId, { surface = "item-detail", binding = {}, allowFallback = false } = {}) {
  if (!itemSurfaces.has(surface)) return null;
  const { definition, itemId, refs } = resolveItemAssetRequest(itemOrId);
  const candidates = loadGeneratedAssetCatalog().itemAssets.filter((asset) => hasSurface(asset, surface));
  const direct = findAssetByRefs(candidates, refs);
  if (direct) {
    return summarizeRuntimeAsset(direct, {
      surface,
      source: "item-definition",
      itemId,
      itemDefinitionId: definition?.id || itemId,
      itemCategory: definition?.category || null,
      ...binding
    });
  }
  if (!allowFallback || (!definition && !itemId)) return null;

  const terms = tokenize([
    itemId,
    definition?.id,
    definition?.category,
    definition?.slot,
    definition?.rarity,
    definition?.useEffect?.type,
    definition?.useEffect?.spellId,
    localizeText(definition?.name),
    localizeText(definition?.description),
    ...(definition?.tags || [])
  ]);
  const selected = firstScoredAsset(candidates, terms);
  if (!selected) return null;
  return summarizeRuntimeAsset(selected, {
    surface,
    source: "item-definition",
    itemId,
    itemDefinitionId: definition?.id || itemId,
    itemCategory: definition?.category || null,
    ...binding
  });
}

export function chooseCharacterAsset(characterOrId, { kind = null, surface = "player-detail", binding = {} } = {}) {
  if (!characterSurfaces.has(surface)) return null;
  const request = resolveCharacterAssetRequest(characterOrId, kind);
  if (!request?.rulesId || !request.kind) return null;
  const asset = loadGeneratedAssetCatalog().characterOptions.find((candidate) => {
    return candidate.variantAxes?.kind === request.kind
      && candidate.variantAxes?.rulesId === request.rulesId
      && hasSurface(candidate, surface);
  });
  if (!asset) return null;
  return summarizeRuntimeAsset(asset, {
    surface,
    source: "character-definition",
    characterOptionKind: request.kind,
    rulesId: request.rulesId,
    ...binding
  });
}

export function chooseCharacterAssets(character, { surface = "player-detail", binding = {} } = {}) {
  return [
    chooseCharacterAsset(character, { kind: "species", surface, binding }),
    chooseCharacterAsset(character, { kind: "class", surface, binding })
  ].filter(Boolean);
}

export function listCharacterOptionAssets({ surface = "character-builder" } = {}) {
  return [
    ...Object.keys(RACES).map((rulesId) => chooseCharacterAsset(rulesId, { kind: "species", surface })),
    ...Object.keys(CLASSES).map((rulesId) => chooseCharacterAsset(rulesId, { kind: "class", surface }))
  ].filter(Boolean);
}

export function chooseSpellAsset(spellOrId, { surface = "spell-card", binding = {} } = {}) {
  if (!spellSurfaces.has(surface)) return null;
  const { spellId, definition, refs } = resolveSpellAssetRequest(spellOrId);
  if (!spellId || !definition) return null;
  const candidates = loadGeneratedAssetCatalog().spellAssets.filter((asset) => hasSurface(asset, surface));
  const direct = findAssetByRefs(candidates, [...refs, spellRuntimeAssetIds[spellId]].filter(Boolean));
  if (direct) {
    return summarizeRuntimeAsset(direct, {
      surface,
      source: "spell-definition",
      spellId,
      spellSchool: definition.school || null,
      ...binding
    });
  }
  const terms = tokenize([
    spellId,
    definition.name,
    definition.action,
    definition.school,
    definition.damageType,
    definition.effect?.condition,
    ...(definition.tags || []),
    ...(spellRuntimeAliases[spellId] || [])
  ]);
  const selected = firstScoredAsset(candidates, terms);
  if (!selected) return null;
  return summarizeRuntimeAsset(selected, {
    surface,
    source: "spell-definition",
    spellId,
    spellSchool: definition.school || null,
    spellRole: selected.gameplayBinding?.spellRole || selected.variantAxes?.role || null,
    ...binding
  });
}

export function chooseNpcTokenAsset(npcOrId, { surface = "npc-token", binding = {} } = {}) {
  if (!npcSurfaces.has(surface)) return null;
  const { npc, templateId, template } = resolveNpcAssetRequest(npcOrId);
  const candidates = loadGeneratedAssetCatalog().npcTokens.filter((asset) => hasSurface(asset, surface));
  if (candidates.length === 0) return null;
  const terms = tokenize([
    npc?.id,
    npc?.name,
    localizeText(npc?.displayName),
    npc?.role,
    npc?.threat,
    templateId,
    template?.name,
    template?.role,
    threatBandFor(npc?.threat ?? template?.threat),
    ...(template?.actions || []),
    ...(template?.attacks || []),
    ...(template?.spells || []),
    ...(npcRuntimeAliases[templateId] || [])
  ]);
  const selected = firstScoredAsset(candidates, terms) || candidates[stableIndex(`${templateId || npc?.id || ""}:${npc?.name || ""}`, candidates.length)];
  return summarizeRuntimeAsset(selected, {
    surface,
    source: "npc-definition",
    npcId: npc?.id || null,
    templateId,
    npcRole: npc?.role || template?.role || null,
    threatBand: selected.gameplayBinding?.threatBand || selected.variantAxes?.threatBand || null,
    ...binding
  });
}

export function chooseStatusAsset(statusOrId, { surface = "status-icon", binding = {} } = {}) {
  if (!statusSurfaces.has(surface)) return null;
  const conditionId = normalizeRuntimeId(typeof statusOrId === "string" ? statusOrId : statusOrId?.id || statusOrId?.conditionId || statusOrId?.statusId);
  if (!conditionId || !STATUS_EFFECTS[conditionId]) return null;
  const asset = loadGeneratedAssetCatalog().statusIcons.find((candidate) => {
    return hasSurface(candidate, surface)
      && (candidate.gameplayBinding?.conditionId === conditionId || candidate.variantAxes?.conditionId === conditionId);
  });
  if (!asset) return null;
  return summarizeRuntimeAsset(asset, {
    surface,
    source: "condition-definition",
    conditionId,
    conditionRole: asset.gameplayBinding?.conditionRole || asset.variantAxes?.conditionRole || null,
    ...binding
  });
}

export function findRewardSource(room, actionText) {
  const lower = String(actionText || "").toLowerCase();
  if (!matchesRewardIntent(lower)) return null;
  const sources = room?.scene?.rewardSources || [];
  const source = sources.find((entry) => {
    return (entry.keywords || []).some((keyword) => lower.includes(String(keyword).toLowerCase()));
  });
  if (source) return source;

  const recentContext = (room?.transcript || [])
    .slice(-5)
    .map((entry) => entry.text)
    .join(" ")
    .toLowerCase();
  return sources.find((entry) => {
    return (entry.keywords || []).some((keyword) => recentContext.includes(String(keyword).toLowerCase()));
  }) || null;
}

export function matchesRewardIntent(actionText) {
  return /open|chest|coffer|loot|search|inspect|investigate|examine|explore|take|obtain|gain|claim|reward|treasure|key|ledger|map|salve|ring|打开|宝箱|搜刮|搜索|检查|调查|查看|探索|获得|拿起|奖励|战利品|钥匙|账本|地图|戒指/.test(
    String(actionText || "").toLowerCase()
  );
}

function isRuntimeVisibleAsset(asset) {
  return asset?.assetType === "raster"
    && asset.visibility === "player-safe"
    && asset.file
    && asset.quality?.approved === true
    && !hasSurface(asset, "catalog-internal");
}

function hasSurface(asset, surface) {
  return (asset?.uiSurface || []).includes(surface);
}

function hasAnySurface(asset, surfaces) {
  return [...surfaces].some((surface) => hasSurface(asset, surface));
}

function indexAssets(assets, getKeys) {
  const index = new Map();
  for (const asset of assets) {
    for (const key of getKeys(asset).filter(Boolean)) {
      index.set(normalizeAssetReference(key), asset);
    }
  }
  return index;
}

function resolveItemAssetRequest(itemOrId) {
  if (typeof itemOrId === "string") {
    const itemId = normalizeRuntimeId(itemOrId);
    const definition = ITEM_CATALOG[itemId] || null;
    return {
      itemId,
      definition,
      refs: assetRefsFromDefinition(definition)
    };
  }

  const snapshot = itemOrId?.definitionSnapshot || itemOrId?.definition || null;
  const itemId = String(itemOrId?.itemId || snapshot?.id || itemOrId?.id || "").trim();
  const catalogId = normalizeRuntimeId(itemId);
  const definition = snapshot || ITEM_CATALOG[catalogId] || null;
  return {
    itemId: itemId || catalogId || definition?.id || "",
    definition,
    refs: [
      ...assetRefsFromDefinition(definition),
      ...assetRefsFromDefinition(itemOrId),
      itemOrId?.file,
      itemOrId?.svgFile,
      itemOrId?.semanticKey,
      itemOrId?.assetId,
      itemOrId?.id
    ].filter(Boolean)
  };
}

function resolveCharacterAssetRequest(characterOrId, kind = null) {
  if (typeof characterOrId === "string") {
    const rulesId = normalizeRuntimeId(characterOrId);
    const optionKind = kind || (RACES[rulesId] ? "species" : CLASSES[rulesId] ? "class" : null);
    return { rulesId, kind: optionKind };
  }

  const character = characterOrId || {};
  if (kind === "species") {
    return {
      rulesId: normalizeRuntimeId(character.species || character.speciesId || character.raceId || character.race || "human"),
      kind: "species"
    };
  }
  if (kind === "class") {
    return {
      rulesId: normalizeRuntimeId(character.classId || character.class || character.archetype || "warrior"),
      kind: "class"
    };
  }
  const classId = normalizeRuntimeId(character.classId || character.class || "");
  if (CLASSES[classId]) return { rulesId: classId, kind: "class" };
  const speciesId = normalizeRuntimeId(character.species || character.speciesId || character.raceId || character.race || "");
  if (RACES[speciesId]) return { rulesId: speciesId, kind: "species" };
  return null;
}

function resolveSpellAssetRequest(spellOrId) {
  if (typeof spellOrId === "string") {
    const spellId = normalizeRuntimeId(spellOrId);
    return {
      spellId,
      definition: SPELLS[spellId] || null,
      refs: []
    };
  }

  const spellId = normalizeRuntimeId(spellOrId?.id || spellOrId?.spellId || spellOrId?.name);
  return {
    spellId,
    definition: SPELLS[spellId] || spellOrId || null,
    refs: assetRefsFromDefinition(spellOrId)
  };
}

function resolveNpcAssetRequest(npcOrId) {
  if (typeof npcOrId === "string") {
    const templateId = normalizeRuntimeId(npcOrId);
    return {
      npc: { id: templateId, templateId },
      templateId,
      template: ENEMY_TEMPLATES[templateId] || null
    };
  }

  const npc = npcOrId || {};
  const templateId = normalizeRuntimeId(npc.templateId || npc.id || "");
  return {
    npc,
    templateId,
    template: ENEMY_TEMPLATES[templateId] || null
  };
}

function assetRefsFromDefinition(definition) {
  const assetRef = definition?.assetRef || definition?.asset || definition?.image || definition?.icon || null;
  if (!assetRef) return [];
  if (typeof assetRef === "string") return [assetRef];
  return [
    assetRef.file,
    assetRef.path,
    assetRef.src,
    assetRef.url,
    assetRef.href,
    assetRef.semanticKey,
    assetRef.assetId,
    assetRef.id,
    assetRef.image?.file,
    assetRef.icon?.file
  ].filter(Boolean);
}

function findAssetByRefs(candidates, refs) {
  const normalizedRefs = new Set(refs.map(normalizeAssetReference).filter(Boolean));
  if (normalizedRefs.size === 0) return null;
  return candidates.find((asset) => {
    return [
      asset.id,
      asset.assetId,
      asset.file,
      asset.svgFile,
      asset.semanticKey
    ].some((value) => normalizedRefs.has(normalizeAssetReference(value)));
  }) || null;
}

function firstScoredAsset(candidates, terms) {
  const selected = scoreAssets(candidates, terms)[0];
  return selected?.score > 0 ? selected.asset : null;
}

function summarizeRuntimeAsset(asset, runtimeBinding = {}) {
  const surface = runtimeBinding.surface || asset.uiSurface?.[0] || "player-detail";
  return summarizeAsset(asset, {
    reason: `runtime-${surface}`,
    runtimeBinding: {
      assetId: asset.id,
      semanticKey: asset.semanticKey || asset.id,
      categoryId: asset.categoryId,
      group: asset.group,
      ...runtimeBinding
    }
  });
}

function uniqueBindings(bindings) {
  const seen = new Set();
  const unique = [];
  for (const binding of bindings.filter(Boolean)) {
    const runtime = binding.runtimeBinding || {};
    const key = [
      runtime.surface,
      runtime.playerId,
      runtime.inventoryEntryId,
      runtime.itemId,
      runtime.spellId,
      runtime.rulesId,
      runtime.npcId,
      runtime.templateId,
      runtime.conditionId,
      binding.assetId
    ].filter(Boolean).join(":");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(binding);
  }
  return unique;
}

function collectRoomNpcEntries(room) {
  return (room?.combat?.encounter?.enemies || []).filter(Boolean);
}

function collectRoomStatusIds(room) {
  const ids = new Set();
  const addStatus = (status) => {
    const id = normalizeRuntimeId(typeof status === "string" ? status : status?.id || status?.conditionId || status?.statusId);
    if (id) ids.add(id);
  };
  for (const player of room?.players || []) {
    for (const status of player?.character?.statusEffects || []) addStatus(status);
    for (const status of player?.character?.conditions || []) addStatus(status);
  }
  for (const npc of collectRoomNpcEntries(room)) {
    for (const status of npc?.statusEffects || []) addStatus(status);
    for (const status of npc?.conditions || []) addStatus(status);
  }
  return ids;
}

function threatBandFor(threat) {
  const value = Number(threat || 0);
  if (value <= 0) return "noncombat";
  if (value >= 5) return "elite";
  if (value >= 3) return "heavy";
  return "standard";
}

function normalizeRuntimeId(value) {
  return String(value || "")
    .trim()
    .replace(/^generated:/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "_");
}

function normalizeAssetReference(value) {
  return String(value || "").trim().replace(/^\/+/, "");
}

function buildSceneTerms(room, soundscape) {
  const recent = (room?.transcript || [])
    .filter((entry) => entry.type === "gm" || entry.type === "player")
    .slice(-4)
    .map((entry) => entry.text)
    .join(" ");
  const terms = new Map();
  addWeightedTerms(terms, [
    room?.scene?.title,
    room?.scene?.location,
    room?.scene?.ambience,
    room?.scene?.weather,
    room?.scene?.mood,
    room?.scene?.tags,
    room?.scene?.soundscapeHints,
    soundscape?.id,
    soundscape?.category,
    soundscape?.visualHints,
    soundscape?.assetHints,
    soundscape?.profile?.weather,
    soundscape?.profile?.location,
    soundscape?.profile?.mood
  ], 5);
  addWeightedTerms(terms, [room?.scene?.objective, room?.tone], 3);
  addWeightedTerms(terms, [room?.director?.beat, room?.combat?.state], 2);
  addWeightedTerms(terms, [recent], 1);
  return terms;
}

function buildRewardTerms(room, actionText, source = null) {
  return tokenize([
    actionText,
    source?.label?.en,
    source?.label?.zh,
    source?.id,
    ...(source?.itemTags || []),
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

function scoreSceneAssets(assets, terms) {
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  const wantsRain = hasAny(requested, ["rain", "rainy", "storm", "wet"]);
  const wantsArchive = hasAny(requested, ["archive", "archives"]);
  const wantsExactStreet = termWeightAtLeast(terms, ["street"], 3);
  const wantsStreet = termWeightAtLeast(terms, ["street", "plaza", "alley"], 3);
  const wantsExterior = hasAny(requested, ["exterior", "outside"]);
  const wantsClear = hasAny(requested, ["clear", "sunny"]);
  const wantsTavern = hasAny(requested, ["tavern", "inn"]);
  const wantsInterior = hasAny(requested, ["interior", "indoor"]);
  const wantsBrookRoad = hasAny(requested, ["brook", "creek", "stream"]) || (hasAny(requested, ["road", "trail", "path"]) && wantsClear);
  const wantsShrine = hasAny(requested, ["shrine", "sanctuary", "temple", "altar"]);
  const wantsCliff = hasAny(requested, ["cliff", "cliffside"]);
  let candidates = assets;

  if (wantsClear) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildAssetTerms(asset);
      return hasAny(terms, ["clear", "sunny", "day"]) && scoreSceneConflicts(terms, requested) === 0;
    });
  }

  if (wantsRain) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildAssetTerms(asset);
      return hasAny(terms, ["rain", "rainy", "storm", "wet"]) && scoreSceneConflicts(terms, requested) === 0;
    });
  }

  if (wantsArchive) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["archive", "archives"]));
  }

  if (wantsTavern) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["tavern", "inn"]));
  }

  if (wantsInterior) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["interior", "indoor"]));
  }

  if (wantsExterior) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["exterior", "outside"]));
  }

  if (wantsBrookRoad) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildAssetTerms(asset);
      return hasAny(terms, ["brook", "creek", "stream"]) || (hasAny(terms, ["road", "trail", "path"]) && hasAny(terms, ["clear", "sunny", "day"]));
    });
  }

  if (wantsShrine) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["shrine", "sanctuary", "temple", "altar"]));
  }

  if (wantsCliff) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["cliff", "cliffside"]));
  }

  if (wantsExactStreet) {
    candidates = preferSceneAssets(candidates, (asset) => hasExactSceneFacet(asset, "street"));
  } else if (wantsStreet) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["street", "plaza", "alley"]));
  }

  return scoreAssets(candidates, terms);
}

function preferSceneAssets(assets, predicate) {
  const preferred = assets.filter(predicate);
  return preferred.length > 0 ? preferred : assets;
}

function scoreAsset(asset, terms) {
  const haystack = buildAssetTerms(asset);
  let score = 0;
  for (const [term, weight] of iterateTerms(terms)) {
    if (haystack.has(term)) score += 4 * weight;
    for (const value of haystack) {
      if (value.includes(term) || term.includes(value)) {
        score += weight;
      }
    }
  }
  score += scoreSceneFacetMatches(haystack, terms);
  score -= scoreSceneConflicts(haystack, terms);
  if (asset.visibility === "player-safe") score += 1;
  if (asset.quality?.approved) score += 1;
  return score;
}

function buildAssetTerms(asset) {
  return tokenize([
    asset.id,
    asset.name,
    asset.sceneSlug,
    asset.semanticKey,
    asset.variantOf,
    asset.weather,
    asset.timeOfDay,
    asset.mood,
    asset.threatLevel,
    asset.encounterRole,
    localizeText(asset.displayName),
    localizeText(asset.description),
    ...(asset.tags || []),
    ...(asset.soundscapeHints || []),
    ...(asset.narrativeUses || []),
    ...Object.values(asset.taxonomy || {}),
    ...Object.values(asset.variantAxes || {}),
    ...Object.values(asset.gameplayBinding || {}).flat()
  ]);
}

function scoreSceneFacetMatches(haystack, terms) {
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  const wantsRain = hasAny(requested, ["rain", "rainy", "storm", "wet"]);
  const wantsArchive = hasAny(requested, ["archive", "archives"]);
  const wantsExactStreet = termWeightAtLeast(terms, ["street"], 3);
  const wantsStreet = termWeightAtLeast(terms, ["street", "plaza", "alley"], 3);
  const wantsExterior = hasAny(requested, ["exterior", "outside"]);
  const wantsClear = hasAny(requested, ["clear", "sunny"]);
  const wantsTavern = hasAny(requested, ["tavern", "inn"]);
  const wantsInterior = hasAny(requested, ["interior", "indoor"]);
  const wantsBrookRoad = hasAny(requested, ["brook", "creek", "stream"]) || (hasAny(requested, ["road", "trail", "path"]) && wantsClear);
  const wantsShrine = hasAny(requested, ["shrine", "sanctuary", "temple", "altar"]);
  const wantsCliff = hasAny(requested, ["cliff", "cliffside"]);
  const wantsInn = requested.has("inn");
  const wantsLantern = requested.has("lantern");
  const matchesRain = hasAny(haystack, ["rain", "rainy", "storm", "wet"]);
  const matchesArchive = hasAny(haystack, ["archive", "archives"]);
  const matchesStreet = hasAny(haystack, ["street", "plaza", "alley"]);
  const matchesClear = hasAny(haystack, ["clear", "sunny", "day"]);
  const matchesTavern = hasAny(haystack, ["tavern", "inn"]);
  const matchesInterior = hasAny(haystack, ["interior", "indoor"]);
  const matchesExterior = hasAny(haystack, ["exterior", "outside"]);
  const matchesBrookRoad = hasAny(haystack, ["brook", "creek", "stream"]) || (hasAny(haystack, ["road", "trail", "path"]) && matchesClear);
  const matchesShrine = hasAny(haystack, ["shrine", "sanctuary", "temple", "altar"]);
  const matchesCliff = hasAny(haystack, ["cliff", "cliffside"]);
  const matchesInn = haystack.has("inn");
  const matchesLantern = haystack.has("lantern");
  let score = 0;

  if (wantsRain && matchesRain) score += 15;
  if (wantsArchive && matchesArchive) score += 30;
  if (wantsStreet && matchesStreet) score += 20;
  if (wantsExterior && matchesExterior) score += 18;
  if (wantsClear && matchesClear) score += 18;
  if (wantsTavern && matchesTavern) score += 34;
  if (wantsTavern && wantsInn && matchesInn) score += 22;
  if (wantsTavern && wantsLantern && matchesLantern) score += 22;
  if (wantsInterior && matchesInterior) score += 16;
  if (wantsBrookRoad && matchesBrookRoad) score += 36;
  if (wantsShrine && matchesShrine) score += 24;
  if (wantsCliff && matchesCliff) score += 24;
  if (wantsRain && wantsArchive && matchesRain && matchesArchive) score += 30;
  if (wantsArchive && wantsStreet && matchesArchive && matchesStreet) score += 30;
  if (wantsArchive && wantsExterior && matchesArchive && matchesExterior) score += 24;
  if (wantsClear && wantsBrookRoad && matchesClear && matchesBrookRoad) score += 30;
  if (wantsTavern && wantsInterior && matchesTavern && matchesInterior) score += 20;
  if (wantsShrine && wantsCliff && matchesShrine && matchesCliff) score += 35;

  return score;
}

function scoreSceneConflicts(haystack, terms) {
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  let penalty = 0;

  if (requested.has("rain") || requested.has("rainy") || requested.has("storm") || requested.has("wet")) {
    for (const conflict of rainWeatherConflicts) {
      if (haystack.has(conflict)) penalty += 12;
    }
  }

  if (requested.has("clear") || requested.has("sunny")) {
    for (const conflict of ["rain", "rainy", "storm", "wet", "thunder", "thunderstorm"]) {
      if (haystack.has(conflict)) penalty += 14;
    }
  }

  if (requested.has("archive") || requested.has("archives")) {
    for (const conflict of archiveLocationConflicts) {
      if (haystack.has(conflict)) penalty += 10;
    }
  }

  if ((requested.has("tavern") || requested.has("inn")) && hasAny(haystack, ["market", "street", "city", "plaza", "alley"]) && !hasAny(haystack, ["tavern", "inn"])) {
    penalty += 16;
  }

  if (
    (requested.has("interior") || requested.has("indoor"))
    && hasAny(haystack, ["market", "street", "city", "plaza", "alley"])
    && !hasAny(requested, ["market", "street", "city", "plaza", "alley"])
    && !hasAny(haystack, ["tavern", "inn", "archive", "archives", "shrine", "sanctuary"])
  ) {
    penalty += 14;
  }

  if (
    (requested.has("exterior") || requested.has("outside"))
    && hasAny(haystack, ["interior", "indoor"])
    && !hasAny(haystack, ["exterior", "outside", "street", "plaza", "alley"])
  ) {
    penalty += 18;
  }

  if (
    (requested.has("brook") || requested.has("creek") || requested.has("stream"))
    && hasAny(haystack, ["rain", "rainy", "storm", "wet", "thunder", "ruin", "ruins", "shrine", "waterfall"])
  ) {
    penalty += 10;
  }

  if (
    (requested.has("street") || requested.has("city") || requested.has("plaza"))
    && haystack.has("wild")
    && !hasAny(haystack, ["archive", "street", "city", "plaza", "alley"])
  ) {
    penalty += 6;
  }

  return penalty;
}

function hasExactSceneFacet(asset, facet) {
  return tokenize([
    asset.semanticKey,
    asset.variantOf,
    asset.sceneSlug,
    asset.name,
    localizeText(asset.displayName)
  ]).has(facet);
}

function hasAny(values, candidates) {
  return candidates.some((candidate) => values.has(candidate));
}

function addWeightedTerms(target, values, weight) {
  for (const term of tokenize(values)) {
    target.set(term, Math.max(target.get(term) || 0, weight));
  }
}

function iterateTerms(terms) {
  if (terms instanceof Map) {
    return terms.entries();
  }
  return [...terms].map((term) => [term, 1]);
}

function termWeightAtLeast(terms, candidates, minimumWeight) {
  for (const [term, weight] of iterateTerms(terms)) {
    if (weight >= minimumWeight && candidates.includes(term)) return true;
  }
  return false;
}

function summarizeAsset(asset, extra = {}) {
  if (!asset) return null;
  return {
    id: asset.id,
    assetId: asset.id,
    name: asset.name,
    zhName: asset.zhName || "",
    displayName: asset.displayName || { en: asset.name, zh: asset.zhName || asset.name },
    description: asset.description || "",
    categoryId: asset.categoryId,
    group: asset.group,
    type: asset.type,
    file: asset.file,
    semanticKey: asset.semanticKey || asset.id,
    variantOf: asset.variantOf || asset.id,
    variantAxes: buildSummaryVariantAxes(asset),
    gameplayBinding: asset.gameplayBinding || {},
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

function buildSummaryVariantAxes(asset) {
  const axes = { ...(asset.variantAxes || {}) };
  if (!axes.location && asset.categoryId === "scenes") {
    const terms = buildAssetTerms(asset);
    if (terms.has("street") && hasAny(terms, ["city", "market", "archive"])) {
      axes.location = "city-street";
    } else if (terms.has("plaza") && hasAny(terms, ["city", "market", "archive"])) {
      axes.location = "city-plaza";
    } else if (terms.has("alley") && hasAny(terms, ["city", "market", "archive"])) {
      axes.location = "city-alley";
    }
  }
  return axes;
}

function tokenize(values) {
  const terms = new Set();
  for (const value of values.flat().filter(Boolean)) {
    const text = String(value).toLowerCase();
    addSemanticAliases(terms, text);
    for (const part of text.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((item) => item.length >= 2)) {
      terms.add(part);
      addSemanticAliases(terms, part);
    }
  }
  return terms;
}

function addSemanticAliases(terms, text) {
  for (const entry of semanticAliases) {
    if (entry.patterns.some((pattern) => text.includes(pattern))) {
      for (const alias of entry.aliases) {
        terms.add(alias);
      }
    }
  }
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
