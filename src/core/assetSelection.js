import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { fallbackAssetFileFor } from "./assets.js";
import { ENEMY_TEMPLATES } from "./bestiary.js";
import { ITEM_CATALOG, SHOP_CATALOG } from "./itemCatalog.js";
import { CLASSES, RACES, SPELLS } from "./rules.js";
import { STATUS_EFFECTS } from "./statusEffects.js";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
let cachedCatalog = null;
const assetTermsCache = new WeakMap();
const sceneFamilyTermsCache = new WeakMap();
const sceneAssetFamilyCache = new WeakMap();

const semanticAliases = [
  { patterns: ["档案", "档案馆", "图书馆", "书库", "archive", "archives", "library", "ledger"], aliases: ["archive", "archives", "knowledge"] },
  { patterns: ["雨", "雨水", "暴雨", "storm", "rain", "rainy", "wet", "puddle"], aliases: ["rain", "rainy", "storm", "wet", "weather"] },
  { patterns: ["雷", "雷雨", "雷暴", "闪电", "thunder", "thunderstorm", "lightning"], aliases: ["thunder", "thunderstorm", "storm", "rain", "weather"] },
  { patterns: ["风", "大风", "狂风", "gale", "wind", "windy", "gust"], aliases: ["wind", "gale-wind", "weather"] },
  { patterns: ["清晨", "黎明", "拂晓", "dawn", "daybreak", "sunrise"], aliases: ["dawn", "morning"] },
  { patterns: ["白天", "日间", "正午", "day", "daytime", "noon"], aliases: ["day"] },
  { patterns: ["黄昏", "傍晚", "薄暮", "dusk", "twilight", "sunset", "evening"], aliases: ["dusk", "evening"] },
  { patterns: ["夜", "夜晚", "午夜", "月光", "night", "midnight", "moonlit", "moonlight"], aliases: ["night", "moonlit"] },
  { patterns: ["春", "春季", "spring"], aliases: ["spring"] },
  { patterns: ["夏", "夏季", "summer"], aliases: ["summer"] },
  { patterns: ["秋", "秋季", "autumn", "fall"], aliases: ["autumn"] },
  { patterns: ["冬", "冬季", "雪", "霜", "winter", "snow", "frost"], aliases: ["winter", "snow"] },
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
  { patterns: ["旅店", "旅馆", "客栈", "酒馆", "酒厅", "tavern", "inn", "pub", "alehouse", "common room", "taproom", "lodge", "bunkroom", "mug"], aliases: ["tavern", "inn", "lodge", "hearth", "social", "interior"] },
  { patterns: ["商店", "商铺", "店铺", "市场", "市集", "集市", "摊位", "补给", "交易", "shop", "store", "market", "bazaar", "merchant", "vendor", "supply", "trade", "warehouse"], aliases: ["shop", "store", "market", "bazaar", "trade", "supply", "social"] },
  { patterns: ["营地", "营火", "篝火", "露营", "宿营", "驿站", "休整", "长休", "短休", "camp", "campground", "campsite", "encampment", "campfire", "coach station", "rest", "recovery"], aliases: ["camp", "campfire", "rest", "recovery", "outdoor"] },
  { patterns: ["战斗营地", "军营", "战场", "战后", "攻城", "战争", "battle camp", "war camp", "battlefield", "battle", "war", "siege", "military", "aftermath", "arena", "duel"], aliases: ["battle-camp", "battlefield", "war", "combat", "camp", "aftermath"] },
  { patterns: ["地牢", "地下城", "地下", "墓室", "墓穴", "墓道", "洞穴", "洞窟", "矿井", "矿洞", "下水道", "监牢", "牢房", "dungeon", "underground", "crypt", "catacomb", "cavern", "cave", "mine", "sewer", "vault", "prison"], aliases: ["dungeon", "underground", "crypt", "cavern", "danger"] },
  { patterns: ["调查", "搜证", "线索", "研究", "禁忌研究", "investigation", "inquiry", "search", "forbidden research", "clue"], aliases: ["investigation", "search", "mystery"] },
  { patterns: ["伏击", "追逐", "潜行", "营救", "撤退", "战斗", "ambush", "chase", "stealth", "rescue", "retreat", "combat", "crisis", "retaliation"], aliases: ["danger", "encounter", "combat"] },
  { patterns: ["谈判", "交涉", "外交", "听证", "社交", "parley", "negotiation", "diplomacy", "hearing", "social tension", "social-tension"], aliases: ["social", "social-intrigue"] },
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
const SCENE_ROTATION_SCORE_WINDOW = 44;
const SCENE_ROTATION_MIN_RATIO = 0.72;
const SCENE_ROTATION_CONFLICT_LIMIT = 34;
const sceneFamilyProfiles = [
  {
    id: "tavern",
    requestTerms: ["tavern", "inn", "lodge", "taproom", "alehouse", "pub", "hearth", "mug", "mugs", "social"],
    assetTerms: ["tavern", "inn", "lodge", "taproom", "alehouse", "pub", "mug", "mugs", "bunkroom", "common"],
    assetFamilies: ["tavern", "social-hub"]
  },
  {
    id: "market",
    requestTerms: ["shop", "store", "market", "bazaar", "merchant", "vendor", "supply", "trade", "warehouse"],
    assetTerms: ["shop", "store", "market", "bazaar", "merchant", "vendor", "trade", "auction", "guild", "arcade"],
    assetFamilies: ["market"]
  },
  {
    id: "camp",
    requestTerms: ["camp", "campfire", "encampment", "rest", "recovery", "outdoor", "coach", "watch"],
    assetTerms: ["camp", "campfire", "embers", "bedroll", "bedrolls", "frontier-camp", "restful", "encampment"],
    assetFamilies: ["camp"]
  },
  {
    id: "battlefield",
    requestTerms: ["battle-camp", "battlefield", "battle", "war", "siege", "military", "aftermath", "combat"],
    assetTerms: ["battle-camp", "battlefield", "battle", "war", "siege", "aftermath", "combat", "tension"],
    assetFamilies: ["battlefield"]
  },
  {
    id: "dungeon",
    requestTerms: ["dungeon", "underground", "crypt", "catacomb", "cavern", "cave", "mine", "sewer", "vault", "prison"],
    assetTerms: ["dungeon", "underground", "crypt", "catacomb", "cavern", "cave", "mine", "sewer", "vault", "prison", "cell", "aqueduct", "subterranean"],
    assetFamilies: ["undercity", "cavern", "mine"]
  },
  {
    id: "archive",
    requestTerms: ["archive", "archives", "library", "ledger", "records", "evidence", "stacks", "research", "investigation", "clue"],
    assetTerms: ["archive", "archives", "library", "ledger", "records", "evidence", "stacks", "research", "forbidden"],
    assetFamilies: ["archive", "interior-mystery"]
  },
  {
    id: "investigation",
    requestTerms: ["investigation", "inquiry", "search", "clue", "mystery", "evidence", "trace"],
    assetTerms: ["investigation", "search", "clue", "mystery", "evidence", "trace", "records", "ruined"],
    assetFamilies: ["archive", "interior-mystery", "ruined-city", "city-action"]
  },
  {
    id: "social",
    requestTerms: ["social", "social-intrigue", "parley", "negotiation", "diplomacy", "hearing", "court", "tribunal", "salon", "council"],
    assetTerms: ["social", "social-intrigue", "parley", "negotiation", "diplomacy", "hearing", "court", "tribunal", "salon", "council", "rotunda", "theater", "auction"],
    assetFamilies: ["court", "tavern", "social-hub"]
  },
  {
    id: "city",
    requestTerms: ["city", "street", "plaza", "alley", "road", "rooftop"],
    assetTerms: ["city", "street", "plaza", "alley", "road", "rooftop", "festival", "bridge"],
    assetFamilies: ["city", "city-weather", "city-action", "ruined-city"]
  },
  {
    id: "wilderness",
    requestTerms: ["forest", "grove", "brook", "creek", "stream", "trail", "path", "meadow", "road", "water"],
    assetTerms: ["forest", "grove", "brook", "creek", "stream", "trail", "path", "meadow", "ravine", "orchard", "wild"],
    assetFamilies: ["forest", "wilderness-travel", "pastoral", "river", "pond"]
  },
  {
    id: "shrine",
    requestTerms: ["shrine", "sanctuary", "temple", "altar", "ritual", "monastery"],
    assetTerms: ["shrine", "sanctuary", "temple", "altar", "ritual", "monastery", "cathedral"],
    assetFamilies: ["temple", "coastal-ritual", "mountain", "mountain-weather", "waterfall", "pastoral"]
  },
  {
    id: "harbor",
    requestTerms: ["harbor", "dock", "quay", "ship", "canal", "waterfront", "ferry"],
    assetTerms: ["harbor", "dock", "quay", "ship", "canal", "waterfront", "ferry", "river"],
    assetFamilies: ["harbor", "river"]
  }
];
const sceneFamilyConflictMap = {
  tavern: ["market", "camp", "battlefield", "dungeon"],
  market: ["tavern", "camp", "battlefield", "dungeon", "archive"],
  camp: ["tavern", "market", "dungeon", "archive"],
  battlefield: ["tavern", "market", "archive", "social"],
  dungeon: ["tavern", "market", "camp", "social", "city"],
  archive: ["camp", "battlefield", "market", "wilderness"],
  investigation: ["camp", "battlefield"],
  social: ["camp", "battlefield", "dungeon"],
  city: ["dungeon", "camp"],
  wilderness: ["tavern", "market", "archive", "dungeon"],
  shrine: ["market", "tavern"],
  harbor: ["dungeon", "camp"]
};
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
  "binding-vines": ["binding", "vines", "root", "wild", "grasp", "nature", "control"],
  "cleanse-poison": ["cleanse", "poison", "restoration", "healing", "verdant", "mend", "support", "condition"],
  "frost-bind": ["frost", "cold", "ice", "bind", "slowed", "control", "ward", "terrain"],
  "glass-echo": ["glass", "echo", "illusion", "mirror", "veil", "utility", "investigation"],
  "storm-arc": ["storm", "lightning", "arc", "lash", "evocation", "attack"],
  "thunder-step": ["thunder", "step", "movement", "escape", "moonlit", "teleport", "mobility"],
  "grave-whisper": ["grave", "whisper", "necromancy", "spirit", "debuff", "control", "mental", "shaken"],
  "iron-oath": ["iron", "oath", "abjuration", "metal", "buff", "defense", "support"],
  "lantern-sigil": ["lantern", "sigil", "divination", "radiance", "utility", "investigation", "light"],
  "blood-moon-hex": ["blood", "moon", "hex", "enchantment", "curse", "control", "mental"],
  tidecall: ["tide", "water", "conjuration", "control", "terrain", "slowed"],
  "clockwork-snare": ["clockwork", "snare", "transmutation", "mechanism", "control", "restrained"],
  "starfall-rune": ["starfall", "rune", "evocation", "astral", "area", "radiant", "damage"]
};
const spellRuntimeAssetIds = {
  firebolt: "aidm-spell-015-01",
  "radiant-bolt": "aidm-spell-015-13",
  "healing-word": "aidm-spell-015-05",
  ward: "aidm-spell-015-02",
  sleep: "aidm-spell-015-14",
  "arcane-shield": "aidm-spell-015-07",
  "binding-vines": "aidm-spell-015-16",
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
  const relevantScenes = chooseRelevantScenes(room, soundscape, { limit: 3, selectedScene: sceneAsset });
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
  const direct = findNamedSceneAsset(scenes, room);
  if (direct) {
    return summarizeAsset(direct, {
      reason: buildSceneReason(direct, soundscape),
      transition: chooseSceneTransition(room, soundscape)
    });
  }
  const terms = buildSceneTerms(room, soundscape);
  const anchored = findAnchoredSceneAsset(scenes, terms);
  if (anchored) {
    return summarizeAsset(anchored, {
      reason: buildSceneReason(anchored, soundscape),
      transition: chooseSceneTransition(room, soundscape)
    });
  }
  const scored = scoreSceneAssets(scenes, terms);
  const best = selectStableSceneAsset(scored, room, terms, scenes) || scenes[0];
  return summarizeAsset(best, {
    reason: buildSceneReason(best, soundscape),
    transition: chooseSceneTransition(room, soundscape)
  });
}

export function chooseRelevantScenes(room, soundscape, { limit = 3, selectedScene = null } = {}) {
  const scenes = loadGeneratedAssetCatalog().scenes;
  const direct = findNamedSceneAsset(scenes, room);
  const terms = buildSceneTerms(room, soundscape);
  const selected = selectedScene
    ? scenes.find((asset) => asset.id === selectedScene.id) || direct
    : direct || selectStableSceneAsset(scoreSceneAssets(scenes, terms), room, terms, scenes);
  const scored = scoreSceneAssets(scenes, terms)
    .map(({ asset }) => asset)
    .filter((asset) => asset.id !== selected?.id);
  return [selected, ...scored]
    .filter(Boolean)
    .slice(0, limit)
    .map((asset) => summarizeAsset(asset, {
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
  const fallback = selected || candidates[stableIndex(`${surface}:${spellId}`, candidates.length)];
  if (!fallback) return null;
  return summarizeRuntimeAsset(fallback, {
    surface,
    source: "spell-definition",
    spellId,
    spellSchool: definition.school || null,
    spellRole: fallback.gameplayBinding?.spellRole || fallback.variantAxes?.role || null,
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
    assetRef.fallbackFile,
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

function findNamedSceneAsset(scenes, room) {
  const scene = room?.scene || {};
  const queries = [scene.title, scene.location]
    .map((value) => normalizeSceneName(value))
    .filter((value) => value.length >= 4);
  if (queries.length === 0) return null;

  return scenes.find((asset) => {
    const names = [
      asset.sceneSlug,
      asset.semanticKey,
      asset.variantOf,
      asset.name,
      localizeText(asset.displayName)
    ].map((value) => normalizeSceneName(value)).filter(Boolean);
    return queries.some((query) => {
      if (isAsciiSceneName(query) && query.length < 12) return false;
      return names.some((name) => name.includes(query) || (query.includes(name) && name.length >= 12));
    });
  }) || null;
}

function normalizeSceneName(value) {
  return localizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "")
    .trim();
}

function isAsciiSceneName(value) {
  return /^[a-z0-9]+$/.test(value);
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
    room?.scene?.season,
    room?.scene?.timeOfDay,
    room?.scene?.time,
    room?.scene?.mood,
    room?.scene?.tags,
    room?.scene?.soundscapeHints,
    room?.scene?.atmosphere,
    room?.scene?.sceneVisualState,
    soundscape?.id,
    soundscape?.category,
    soundscape?.visualHints,
    soundscape?.assetHints,
    soundscape?.profile?.weather,
    soundscape?.profile?.season,
    soundscape?.profile?.timeOfDay,
    soundscape?.profile?.pressure,
    soundscape?.profile?.location,
    soundscape?.profile?.mood,
    soundscape?.sceneVisualState?.variantAxes,
    soundscape?.sceneVisualState?.motionHints,
    soundscape?.sceneVisualState?.overlayHints,
    soundscape?.sceneVisualState?.assetHints,
    soundscape?.sceneVisualState?.variantKey
  ], 5);
  addWeightedTerms(terms, deriveSceneSelectionHints(room, soundscape), 7);
  addWeightedTerms(terms, [room?.scene?.objective, room?.tone], 3);
  addWeightedTerms(terms, [room?.director?.beat, room?.combat?.state], 2);
  addWeightedTerms(terms, [recent], 1);
  return terms;
}

function deriveSceneSelectionHints(room, soundscape) {
  const text = localizeText([
    room?.scene?.title,
    room?.scene?.location,
    room?.scene?.ambience,
    room?.scene?.weather,
    room?.scene?.mood,
    soundscape?.id,
    soundscape?.label
  ].flat().filter(Boolean).join(" ")).toLowerCase();
  const hints = [];
  if (/旅店|客栈|酒馆|tavern|inn|taproom/.test(text)) hints.push("tavern", "inn", "hall", "interior");
  if (/灯火|灯笼|炉火|lantern|hearth|firelight/.test(text)) hints.push("lantern", "hearth", "warmth");
  if (/酒杯|杯|mug|cup|tankard/.test(text)) hints.push("mugs", "cups", "hearth");
  if (/人群|宾客|crowd|patron|busy room/.test(text)) hints.push("crowd", "crowded", "social");
  if (/室内|屋内|房间|indoor|inside|interior/.test(text)) hints.push("indoor", "interior");
  return hints;
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
  const requestedFamilies = sceneFamilyRequestWeights(terms);
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
  const wantsNight = hasAny(requested, ["night", "midnight", "moonlit"]);
  const wantsDay = hasAny(requested, ["day", "daytime", "noon"]);
  const wantsDusk = hasAny(requested, ["dusk", "twilight", "sunset", "evening"]);
  const wantsDawn = hasAny(requested, ["dawn", "morning", "sunrise"]);
  const wantsWinter = hasAny(requested, ["winter", "snow", "frost"]);
  const wantsAutumn = hasAny(requested, ["autumn", "fall"]);
  const wantsSpring = requested.has("spring");
  const wantsSummer = requested.has("summer");
  const wantsMarketFamily = hasAny(requested, ["shop", "store", "market", "bazaar", "merchant", "vendor", "supply", "trade"]);
  const wantsCampFamily = hasAny(requested, ["camp", "campfire", "encampment", "rest", "recovery"]);
  const wantsBattlefieldFamily = hasAny(requested, ["battle-camp", "battlefield", "battle", "war", "siege", "military", "aftermath"]);
  const wantsDungeonFamily = hasAny(requested, ["dungeon", "underground", "crypt", "catacomb", "cavern", "cave", "mine", "sewer", "vault", "prison"]);
  const wantsSocialFamily = hasAny(requested, ["social", "social-intrigue", "parley", "negotiation", "diplomacy", "hearing", "court", "tribunal", "salon", "council"]);
  let candidates = assets;

  if (wantsMarketFamily) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildSceneFamilyTerms(asset);
      return hasAny(terms, ["shop", "store", "market", "bazaar", "merchant", "vendor", "trade", "auction", "stall", "stalls", "prices"]);
    });
  }

  if (wantsArchive && (wantsStreet || wantsExterior)) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildAssetTerms(asset);
      return hasAny(terms, ["archive", "archives", "library", "records"])
        && hasAny(terms, ["street", "plaza", "alley", "exterior", "outside"])
        && !hasAny(terms, ["market", "bazaar", "merchant", "vendor", "shop", "store"]);
    });
  }

  if (wantsArchive && wantsInterior && wantsRain) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildAssetTerms(asset);
      return (hasAny(terms, ["archive", "archives", "library", "records"]) || asset.variantAxes?.sceneFamily === "interior-mystery")
        && hasAny(terms, ["interior", "indoor"])
        && hasAny(terms, ["rain", "rainy", "storm", "wet", "thunderstorm"]);
    });
    if (wantsNight) {
      candidates = preferSceneAssets(candidates, (asset) => {
        return asset.variantAxes?.sceneFamily === "interior-mystery"
          || /moonlit-rain-archive/.test(String(asset.semanticKey || asset.variantOf || asset.sceneSlug || ""));
      });
    }
  }

  if (wantsCampFamily && !wantsBattlefieldFamily) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildSceneFamilyTerms(asset);
      return hasAny(terms, ["camp", "campfire", "embers", "bedroll", "bedrolls", "frontier-camp", "restful", "encampment"]);
    });
  }

  if (wantsBattlefieldFamily) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildSceneFamilyTerms(asset);
      return hasAny(terms, ["battlefield", "battle", "war", "siege", "military", "aftermath", "combat"]);
    });
  }

  if (wantsDungeonFamily) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildSceneFamilyTerms(asset);
      return hasAny(terms, ["dungeon", "underground", "crypt", "catacomb", "cavern", "cave", "mine", "sewer", "vault", "prison", "aqueduct", "subterranean"]);
    });
  }

  if (wantsSocialFamily && !wantsTavern && !wantsMarketFamily) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildSceneFamilyTerms(asset);
      return hasAny(terms, ["social", "social-intrigue", "parley", "negotiation", "diplomacy", "hearing", "court", "tribunal", "salon", "council", "rotunda", "theater"]);
    });
  }

  for (const family of orderedSceneFamilyRequests(primarySceneFamilyRequests(requestedFamilies))) {
    candidates = preferSceneAssets(candidates, (asset) => {
      return sceneAssetMatchesRequestedFamily(asset, family)
        && !sceneAssetHasBlockingFamilyConflict(asset, family, requestedFamilies);
    });
  }

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

  if (wantsTavern && hasAny(requested, ["lantern", "hearth", "mug", "mugs", "lute"])) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["lantern", "hearth", "mug", "mugs", "lute", "tavern-hall"]));
  }

  if (wantsTavern && hasAny(requested, ["crowded", "toasting", "cheer", "crowd", "cups", "mugs", "lute", "hall"])) {
    candidates = preferSceneAssets(candidates, (asset) => {
      const terms = buildAssetTerms(asset);
      return hasAny(terms, ["tavern", "hall", "mugs", "lute", "social", "crowd", "taproom", "common"]);
    });
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

  if (wantsNight) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["night", "midnight", "moonlit"]));
  } else if (wantsDusk) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["dusk", "twilight", "sunset", "evening"]));
  } else if (wantsDawn) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["dawn", "morning", "sunrise"]));
  } else if (wantsDay) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["day", "daytime", "noon"]));
  }

  if (wantsWinter) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["winter", "snow", "frost"]));
  } else if (wantsAutumn) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["autumn", "fall"]));
  } else if (wantsSpring) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["spring"]));
  } else if (wantsSummer) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["summer"]));
  }

  if (wantsExactStreet) {
    candidates = preferSceneAssets(candidates, (asset) => hasExactSceneFacet(asset, "street"));
  } else if (wantsStreet) {
    candidates = preferSceneAssets(candidates, (asset) => hasAny(buildAssetTerms(asset), ["street", "plaza", "alley"]));
  }

  return scoreAssets(candidates, terms);
}

function selectStableSceneAsset(scored, room, terms, allScenes = []) {
  if (!scored.length) return null;
  const best = scored[0];
  const requestedFamilies = sceneFamilyRequestWeights(terms);
  const bestFamilies = sceneAssetFamilySet(best.asset);
  const primaryFamilies = sceneRotationFamilyRequests(terms, primarySceneFamilyRequests(requestedFamilies));
  const allowWideRotation = shouldAllowWideSceneRotation(terms, requestedFamilies);
  let pool = buildSceneRotationPool(scored, terms, {
    best,
    bestFamilies,
    requestedFamilies: primaryFamilies,
    allowWideRotation,
    relaxed: false
  });
  if (pool.length <= 1 && allowWideRotation) {
    pool = buildSceneRotationPool(scored, terms, {
      best,
      bestFamilies,
      requestedFamilies: primaryFamilies,
      allowWideRotation,
      relaxed: true
    });
  }
  if (pool.length <= 1 && allowWideRotation) {
    const broadScored = allScenes.length > 0 ? scoreAssets(allScenes, terms) : scored;
    pool = buildSceneFamilyFallbackRotationPool(broadScored, terms, primaryFamilies);
  }
  if (pool.length <= 1) return best.asset;

  const seed = buildSceneRotationSeed(room, terms, requestedFamilies, best.asset);
  let selectedIndex = (stableIndex(seed, pool.length) + sceneRotationStep(room)) % pool.length;
  let selected = pool[selectedIndex]?.asset || best.asset;
  const recentRefs = collectRecentSceneAssetRefs(room);
  if (recentRefs.size > 0 && sceneAssetRefMatches(selected, recentRefs) && pool.length > 1) {
    for (let offset = 1; offset < pool.length; offset += 1) {
      const candidate = pool[(selectedIndex + offset) % pool.length].asset;
      if (!sceneAssetRefMatches(candidate, recentRefs)) {
        selected = candidate;
        break;
      }
    }
  }
  return selected;
}

function sceneRotationStep(room) {
  const round = Number(room?.round || 1);
  return Number.isFinite(round) ? Math.max(0, Math.floor(round) - 1) : 0;
}

function findAnchoredSceneAsset(scenes, terms) {
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  const forestWeight = maxTermWeight(terms, ["forest", "forests", "grove", "woods", "woodland"]);
  const staleBlockingWeight = maxTermWeight(terms, ["archive", "archives", "market", "bazaar", "city", "street", "plaza", "tavern", "inn", "dungeon"]);
  const wantsForest = forestWeight >= 3 && staleBlockingWeight < 4;
  if (wantsForest) {
    return findSceneByRequiredFacets(scenes, terms, {
      required: [["forest", "forests", "grove", "woods", "woodland"]],
      preferredSemanticKeys: ["scene.misty.forest.path", "scene.lantern.forest.ford", "scene.haunted.forest.road"]
    });
  }

  const wantsArchiveRain = hasAny(requested, ["archive", "archives"])
    && hasAny(requested, ["rain", "rainy", "storm", "wet"]);
  if (!wantsArchiveRain) return null;

  const wantsExteriorStreet = hasAny(requested, ["street", "plaza", "alley", "exterior", "outside"])
    && !hasAny(requested, ["interior", "indoor"]);
  if (wantsExteriorStreet) {
    return findSceneByRequiredFacets(scenes, terms, {
      required: [
        ["archive", "archives"],
        ["rain", "rainy", "storm", "wet"],
        ["street", "plaza", "alley"],
        ["exterior", "outside"]
      ],
      preferredSemanticKeys: ["scene.rain.archive.street"]
    });
  }

  if (hasAny(requested, ["interior", "indoor"])) {
    return findSceneByRequiredFacets(scenes, terms, {
      required: [
        ["archive", "archives", "library"],
        ["rain", "rainy", "storm", "wet"],
        ["interior", "indoor"]
      ],
      preferredSemanticKeys: ["scene.ambient.moonlit-rain-archive.v01"]
    });
  }

  return null;
}

function findSceneByRequiredFacets(scenes, terms, { required, preferredSemanticKeys = [] }) {
  const candidates = scenes.filter((asset) => {
    const assetTerms = buildAssetTerms(asset);
    return required.every((facetTerms) => hasAny(assetTerms, facetTerms));
  });
  if (candidates.length === 0) return null;

  for (const semanticKey of preferredSemanticKeys) {
    const preferred = candidates.find((asset) => asset.semanticKey === semanticKey);
    if (preferred) return preferred;
  }

  return scoreSceneAssets(candidates, terms)[0]?.asset || candidates[0];
}

function buildSceneRotationPool(scored, terms, { best, bestFamilies, requestedFamilies, allowWideRotation, relaxed }) {
  return scored.filter((entry) => {
    if (scoreSceneConflicts(buildAssetTerms(entry.asset), terms) >= SCENE_ROTATION_CONFLICT_LIMIT) {
      return false;
    }
    const scoreFloor = allowWideRotation
      ? Math.max(relaxed ? 8 : 18, best.score * (relaxed ? 0.16 : 0.36))
      : Math.max(best.score - SCENE_ROTATION_SCORE_WINDOW, best.score * SCENE_ROTATION_MIN_RATIO);
    if (entry.score < scoreFloor) return false;
    const entryFamilies = sceneAssetFamilySet(entry.asset);
    if (setsIntersect(entryFamilies, bestFamilies)) return true;
    for (const family of requestedFamilies.keys()) {
      if (entryFamilies.has(family)) return true;
    }
    return false;
  });
}

function buildSceneFamilyFallbackRotationPool(scored, terms, requestedFamilies) {
  return scored.filter((entry) => {
    if (entry.score <= 0) return false;
    if (!allowsSummarySceneFamilyForRotation(entry.asset, requestedFamilies)) return false;
    if (scoreSceneConflicts(buildAssetTerms(entry.asset), terms) >= SCENE_ROTATION_CONFLICT_LIMIT) {
      return false;
    }
    const entryFamilies = sceneAssetFamilySet(entry.asset);
    for (const family of requestedFamilies.keys()) {
      if (entryFamilies.has(family)) return true;
    }
    return false;
  }).slice(0, 24);
}

function allowsSummarySceneFamilyForRotation(asset, requestedFamilies) {
  if (requestedFamilies.has("camp") || requestedFamilies.has("wilderness")) {
    return ["camp", "wilderness"].includes(buildSummaryVariantAxes(asset).sceneFamily);
  }
  return true;
}

function shouldAllowWideSceneRotation(terms, requestedFamilies) {
  if (requestedFamilies.size === 0) return false;
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  if (
    hasAny(requested, ["archive", "archives"])
    && hasAny(requested, ["street", "plaza", "alley", "exterior", "outside"])
  ) {
    return false;
  }
  return ["camp", "tavern", "market", "battlefield", "dungeon"].some((family) => requestedFamilies.has(family));
}

function preferSceneAssets(assets, predicate) {
  const preferred = assets.filter(predicate);
  return preferred.length > 0 ? preferred : assets;
}

function sceneFamilyRequestWeights(terms) {
  const requests = new Map();
  for (const profile of sceneFamilyProfiles) {
    let weight = 0;
    for (const term of profile.requestTerms) {
      weight = Math.max(weight, termWeight(terms, term));
    }
    if (weight > 0) requests.set(profile.id, weight);
  }
  if (requests.has("battlefield") && requests.has("camp")) {
    requests.set("camp", Math.min(requests.get("camp"), 3));
  }
  if (requests.has("market") && requests.has("social")) {
    requests.set("social", Math.min(requests.get("social"), 3));
  }
  if (requests.has("tavern") && requests.has("social")) {
    requests.set("social", Math.min(requests.get("social"), 3));
  }
  return requests;
}

function primarySceneFamilyRequests(requests) {
  if (requests.size <= 1) return requests;
  const maxWeight = Math.max(...requests.values());
  const minimumWeight = Math.max(4, maxWeight - 1);
  return new Map([...requests.entries()].filter(([, weight]) => weight >= minimumWeight));
}

function sceneRotationFamilyRequests(terms, requests) {
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  if (
    (requests.has("camp") || requests.has("wilderness"))
    && !hasAny(requested, ["city", "street", "plaza", "alley", "rooftop"])
  ) {
    const scoped = new Map(requests);
    scoped.delete("city");
    return scoped;
  }
  return requests;
}

function orderedSceneFamilyRequests(requests) {
  const priority = {
    battlefield: 95,
    dungeon: 90,
    archive: 86,
    market: 84,
    tavern: 84,
    camp: 78,
    social: 74,
    investigation: 72,
    city: 68,
    shrine: 66,
    harbor: 64,
    wilderness: 58
  };
  return [...requests.entries()]
    .sort((left, right) => right[1] - left[1] || (priority[right[0]] || 0) - (priority[left[0]] || 0))
    .map(([family]) => family);
}

function termWeight(terms, candidate) {
  for (const [term, weight] of iterateTerms(terms)) {
    if (term === candidate) return Number(weight || 1);
  }
  return 0;
}

function maxTermWeight(terms, candidates) {
  return Math.max(0, ...candidates.map((candidate) => termWeight(terms, candidate)));
}

function scoreSceneFamilyMatches(asset, haystack, terms) {
  const requests = sceneFamilyRequestWeights(terms);
  if (requests.size === 0) return 0;
  const families = sceneAssetFamilySet(asset);
  let score = 0;
  for (const [family, weight] of requests) {
    if (families.has(family)) {
      score += 17 * weight;
      continue;
    }
    if (familyConflictsWithAssetFamilies(family, families, requests)) {
      score -= 13 * weight;
    }
  }
  if (requests.has("archive") && requests.has("city") && families.has("archive") && families.has("city")) {
    score += 16;
  }
  if (requests.has("tavern") && hasAny(haystack, ["hearth", "mug", "mugs", "lute", "hall"])) {
    score += 18;
  }
  return score;
}

function sceneAssetMatchesRequestedFamily(asset, family) {
  return sceneAssetFamilySet(asset).has(family);
}

function sceneAssetHasBlockingFamilyConflict(asset, requestedFamily, allRequests) {
  const families = sceneAssetFamilySet(asset);
  return familyConflictsWithAssetFamilies(requestedFamily, families, allRequests);
}

function familyConflictsWithAssetFamilies(requestedFamily, assetFamilies, allRequests = new Map()) {
  if (assetFamilies.has(requestedFamily)) return false;
  const conflicts = sceneFamilyConflictMap[requestedFamily] || [];
  for (const conflict of conflicts) {
    if (assetFamilies.has(conflict) && !allRequests.has(conflict)) {
      return true;
    }
  }
  return false;
}

function sceneAssetFamilySet(asset) {
  if (asset && sceneAssetFamilyCache.has(asset)) {
    return sceneAssetFamilyCache.get(asset);
  }
  const terms = buildSceneFamilyTerms(asset);
  const families = sceneFamilySetFromTerms(terms);
  addSceneFamilyValue(families, asset?.variantAxes?.sceneFamily);
  if (families.size === 0) families.add("general");
  if (asset) sceneAssetFamilyCache.set(asset, families);
  return families;
}

function buildSceneFamilyTerms(asset) {
  if (asset && sceneFamilyTermsCache.has(asset)) {
    return sceneFamilyTermsCache.get(asset);
  }
  const terms = tokenizeRaw([
    asset?.id,
    asset?.name,
    asset?.sceneSlug,
    asset?.semanticKey,
    asset?.variantOf,
    asset?.weather,
    asset?.timeOfDay,
    asset?.mood,
    asset?.threatLevel,
    asset?.encounterRole,
    localizeText(asset?.displayName),
    ...(asset?.narrativeUses || []),
    ...Object.values(asset?.taxonomy || {}),
    asset?.variantAxes?.sceneFamily,
    asset?.variantAxes?.location,
    asset?.variantAxes?.weather,
    asset?.variantAxes?.timeOfDay,
    asset?.variantAxes?.time,
    asset?.variantAxes?.mood,
    asset?.variantAxes?.threatLevel,
    asset?.variantAxes?.theme,
    asset?.variantAxes?.encounterState,
    asset?.variantAxes?.composition
  ]);
  if (asset) sceneFamilyTermsCache.set(asset, terms);
  return terms;
}

function sceneFamilySetFromTerms(terms) {
  const families = new Set();
  for (const profile of sceneFamilyProfiles) {
    if (hasAny(terms, profile.assetTerms) || hasAny(terms, profile.assetFamilies)) {
      families.add(profile.id);
    }
  }
  return families;
}

function addSceneFamilyValue(families, value) {
  const id = normalizeSceneFamilyId(value);
  if (!id) return;
  families.add(id);
  for (const profile of sceneFamilyProfiles) {
    if (profile.id === id || profile.assetFamilies.includes(id) || profile.assetTerms.includes(id)) {
      families.add(profile.id);
    }
  }
}

function normalizeSceneFamilyId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setsIntersect(left, right) {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
}

function buildSceneRotationSeed(room, terms, requestedFamilies, bestAsset) {
  const scene = room?.scene || {};
  const familyKey = orderedSceneFamilyRequests(requestedFamilies).join(",")
    || [...sceneAssetFamilySet(bestAsset)].sort().join(",");
  return [
    room?.id || "room",
    room?.sessionId || room?.session?.id || room?.campaignId || "",
    familyKey,
    normalizeSceneName([scene.id, scene.title, scene.location, scene.lastShiftReason, scene.lastEvolutionReason].filter(Boolean).join(" ")),
    dominantSceneTerms(terms).join(","),
    Number.isFinite(Number(room?.round)) ? Number(room.round) : 1
  ].join("|");
}

function dominantSceneTerms(terms) {
  const broadTerms = new Set(["scene", "stage", "weather", "mood", "safe", "danger", "night", "day", "rain", "clear"]);
  return [...iterateTerms(terms)]
    .filter(([term]) => !broadTerms.has(term))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([term]) => term);
}

function collectRecentSceneAssetRefs(room) {
  const refs = new Set();
  const add = (value) => {
    const normalized = normalizeAssetReference(value);
    if (normalized) refs.add(normalized);
  };
  const visit = (entry) => {
    if (!entry || typeof entry !== "object") return;
    add(entry.id);
    add(entry.assetId);
    add(entry.sceneAssetId);
    add(entry.semanticKey);
    add(entry.variantOf);
    add(entry.file);
    if (entry.sceneAsset) visit(entry.sceneAsset);
    if (entry.asset) visit(entry.asset);
  };
  for (const entry of room?.scene?.assetHistory || []) visit(entry);
  for (const entry of room?.scene?.sceneAssetHistory || []) visit(entry);
  for (const entry of room?.scene?.sceneHistory || []) visit(entry);
  visit(room?.scene?.previousSceneAsset);
  visit(room?.scene?.lastSceneAsset);
  return refs;
}

function sceneAssetRefMatches(asset, refs) {
  return [
    asset?.id,
    asset?.assetId,
    asset?.semanticKey,
    asset?.variantOf,
    asset?.file
  ].some((value) => refs.has(normalizeAssetReference(value)));
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
  score += scoreSceneFamilyMatches(asset, haystack, terms);
  score -= scoreSceneConflicts(haystack, terms);
  if (asset.visibility === "player-safe") score += 1;
  if (asset.quality?.approved) score += 1;
  return score;
}

function buildAssetTerms(asset) {
  if (asset && assetTermsCache.has(asset)) {
    return assetTermsCache.get(asset);
  }
  const terms = tokenize([
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
  if (asset) assetTermsCache.set(asset, terms);
  return terms;
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
  const wantsNight = hasAny(requested, ["night", "midnight", "moonlit"]);
  const wantsDay = hasAny(requested, ["day", "daytime", "noon"]);
  const wantsDusk = hasAny(requested, ["dusk", "twilight", "sunset", "evening"]);
  const wantsDawn = hasAny(requested, ["dawn", "morning", "sunrise"]);
  const wantsWinter = hasAny(requested, ["winter", "snow", "frost"]);
  const wantsAutumn = hasAny(requested, ["autumn", "fall"]);
  const wantsSpring = requested.has("spring");
  const wantsSummer = requested.has("summer");
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
  const matchesNight = hasAny(haystack, ["night", "midnight", "moonlit"]);
  const matchesDay = hasAny(haystack, ["day", "daytime", "noon"]);
  const matchesDusk = hasAny(haystack, ["dusk", "twilight", "sunset", "evening"]);
  const matchesDawn = hasAny(haystack, ["dawn", "morning", "sunrise"]);
  const matchesWinter = hasAny(haystack, ["winter", "snow", "frost"]);
  const matchesAutumn = hasAny(haystack, ["autumn", "fall"]);
  const matchesSpring = haystack.has("spring");
  const matchesSummer = haystack.has("summer");
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
  if (wantsTavern && wantsLantern && matchesLantern) score += 42;
  if (wantsInterior && matchesInterior) score += 16;
  if (wantsBrookRoad && matchesBrookRoad) score += 36;
  if (wantsShrine && matchesShrine) score += 24;
  if (wantsCliff && matchesCliff) score += 24;
  if (wantsNight && matchesNight) score += 14;
  if (wantsDay && matchesDay) score += 12;
  if (wantsDusk && matchesDusk) score += 14;
  if (wantsDawn && matchesDawn) score += 12;
  if (wantsWinter && matchesWinter) score += 14;
  if (wantsAutumn && matchesAutumn) score += 10;
  if (wantsSpring && matchesSpring) score += 10;
  if (wantsSummer && matchesSummer) score += 10;
  if (wantsRain && wantsArchive && matchesRain && matchesArchive) score += 30;
  if (wantsArchive && wantsStreet && matchesArchive && matchesStreet) score += 30;
  if (wantsArchive && wantsExterior && matchesArchive && matchesExterior) score += 24;
  if (wantsClear && wantsBrookRoad && matchesClear && matchesBrookRoad) score += 30;
  if (wantsTavern && wantsInterior && matchesTavern && matchesInterior) score += 20;
  if (wantsShrine && wantsCliff && matchesShrine && matchesCliff) score += 35;
  if (wantsRain && wantsNight && matchesRain && matchesNight) score += 10;
  if (wantsClear && wantsDay && matchesClear && matchesDay) score += 10;

  return score;
}

function scoreSceneConflicts(haystack, terms) {
  const requested = new Set([...iterateTerms(terms)].map(([term]) => term));
  const requestedFamilies = sceneFamilyRequestWeights(terms);
  const haystackFamilies = sceneFamilySetFromTerms(haystack);
  let penalty = 0;

  for (const [family, weight] of requestedFamilies) {
    if (haystackFamilies.has(family)) continue;
    const conflicts = sceneFamilyConflictMap[family] || [];
    for (const conflict of conflicts) {
      if (haystackFamilies.has(conflict) && !requestedFamilies.has(conflict)) {
        penalty += 10 + (3 * weight);
      }
    }
  }

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
    penalty += 30;
  }

  if (
    (requested.has("street") || requested.has("plaza") || requested.has("alley"))
    && hasAny(haystack, ["interior", "indoor"])
    && !hasAny(haystack, ["street", "plaza", "alley", "exterior", "outside"])
  ) {
    penalty += 32;
  }

  if (
    (requested.has("interior") || requested.has("indoor"))
    && hasAny(haystack, ["street", "plaza", "alley", "exterior", "outside"])
    && !hasAny(haystack, ["interior", "indoor"])
  ) {
    penalty += 28;
  }

  if (
    (requested.has("archive") || requested.has("archives"))
    && hasAny(requested, ["street", "plaza", "alley", "exterior", "outside"])
    && hasAny(haystack, ["interior", "indoor"])
    && !hasAny(haystack, ["street", "plaza", "alley", "exterior", "outside"])
  ) {
    penalty += 24;
  }

  if (
    (requested.has("archive") || requested.has("archives"))
    && hasAny(requested, ["interior", "indoor"])
    && hasAny(haystack, ["street", "plaza", "alley", "exterior", "outside"])
    && !hasAny(haystack, ["interior", "indoor"])
  ) {
    penalty += 24;
  }

  if (
    (requested.has("camp") || requested.has("campfire") || requested.has("rest") || requested.has("recovery"))
    && !hasAny(requested, ["battlefield", "battle", "war", "siege", "battle-camp"])
    && hasAny(haystack, ["battlefield", "battle", "war", "siege", "aftermath"])
  ) {
    penalty += 28;
  }

  if (
    (requested.has("shop") || requested.has("store") || requested.has("market") || requested.has("bazaar"))
    && hasAny(haystack, ["archive", "library", "dungeon", "underground", "camp", "battlefield"])
    && !hasAny(haystack, ["shop", "store", "market", "bazaar", "merchant", "trade", "auction"])
  ) {
    penalty += 24;
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

  if (hasAny(requested, ["night", "midnight", "moonlit"]) && hasAny(haystack, ["day", "daytime", "noon"]) && !hasAny(haystack, ["night", "midnight", "moonlit"])) {
    penalty += 8;
  }

  if (hasAny(requested, ["day", "daytime", "noon"]) && hasAny(haystack, ["night", "midnight", "moonlit"]) && !hasAny(haystack, ["day", "daytime", "noon"])) {
    penalty += 8;
  }

  if (hasAny(requested, ["dusk", "twilight", "sunset", "evening"]) && hasAny(haystack, ["day", "night"]) && !hasAny(haystack, ["dusk", "twilight", "sunset", "evening"])) {
    penalty += 5;
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
    fallbackFile: asset.svgFile || fallbackAssetFileFor(asset.file, asset),
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
  if (!axes.sceneFamily && asset.categoryId === "scenes") {
    const families = [...sceneAssetFamilySet(asset)].filter((family) => family !== "general");
    axes.sceneFamily = preferredSummarySceneFamily(families) || "general";
  }
  if (!axes.interiorExterior && asset.categoryId === "scenes" && asset.taxonomy?.interiorExterior) {
    axes.interiorExterior = asset.taxonomy.interiorExterior;
  }
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

function preferredSummarySceneFamily(families) {
  if (families.length === 0) return null;
  return orderedSceneFamilyRequests(new Map(families.map((family) => [family, 1])))[0] || families[0];
}

function tokenize(values) {
  const terms = new Set();
  for (const value of flattenTokenValues(values)) {
    const text = String(value).toLowerCase();
    addSemanticAliases(terms, text);
    for (const part of text.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((item) => item.length >= 2)) {
      terms.add(part);
      addSemanticAliases(terms, part);
    }
  }
  return terms;
}

function tokenizeRaw(values) {
  const terms = new Set();
  for (const value of flattenTokenValues(values)) {
    const text = String(value).toLowerCase();
    for (const part of text.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((item) => item.length >= 2)) {
      terms.add(part);
    }
  }
  return terms;
}

function flattenTokenValues(values) {
  const result = [];
  const visit = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (value instanceof Map || value instanceof Set) {
      for (const item of value.values()) visit(item);
      return;
    }
    if (typeof value === "object") {
      for (const item of Object.values(value)) visit(item);
      return;
    }
    result.push(value);
  };
  visit(values);
  return result;
}

function addSemanticAliases(terms, text) {
  for (const entry of semanticAliases) {
    if (entry.patterns.some((pattern) => semanticPatternMatches(text, pattern))) {
      for (const alias of entry.aliases) {
        terms.add(alias);
      }
    }
  }
}

function semanticPatternMatches(text, pattern) {
  if (/^[a-z0-9][a-z0-9\s-]*$/.test(pattern)) {
    const normalizedText = ` ${String(text || "").replace(/[^a-z0-9]+/g, " ")} `;
    const normalizedPattern = String(pattern || "").replace(/[^a-z0-9]+/g, " ").trim();
    return normalizedPattern ? normalizedText.includes(` ${normalizedPattern} `) : false;
  }
  return text.includes(pattern);
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
