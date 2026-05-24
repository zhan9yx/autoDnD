import { getSpell } from "./rules.js";

export const CURRENCY = Object.freeze({
  id: "coin",
  name: { en: "Crowns", zh: "克朗" },
  symbol: "CR"
});

export const ITEM_CONDITIONS = Object.freeze({
  poor: Object.freeze({ id: "poor", label: { en: "Poor", zh: "破旧" }, multiplier: 0.55 }),
  worn: Object.freeze({ id: "worn", label: { en: "Worn", zh: "磨损" }, multiplier: 0.75 }),
  fine: Object.freeze({ id: "fine", label: { en: "Fine", zh: "良好" }, multiplier: 1 }),
  pristine: Object.freeze({ id: "pristine", label: { en: "Pristine", zh: "崭新" }, multiplier: 1.35 }),
  masterwork: Object.freeze({ id: "masterwork", label: { en: "Masterwork", zh: "精工" }, multiplier: 1.8 })
});

export const ITEM_CATEGORIES = Object.freeze({
  weapon: { en: "Weapon", zh: "武器" },
  armor: { en: "Armor", zh: "护甲" },
  shield: { en: "Shield", zh: "盾牌" },
  spellScroll: { en: "Spell scroll", zh: "法卷" },
  tool: { en: "Tool", zh: "工具" },
  consumable: { en: "Consumable", zh: "消耗品" },
  tradeGood: { en: "Trade good", zh: "可售卖物" },
  food: { en: "Food and drink", zh: "食品与酒饮" },
  fashion: { en: "Fashion", zh: "时装" },
  quest: { en: "Quest item", zh: "任务物品" }
});

export const ITEM_CATALOG = Object.freeze({
  "travel-lamp": item({
    id: "travel-lamp",
    name: { en: "Travel Lamp", zh: "旅行提灯" },
    category: "tool",
    baseValue: 12,
    tradeable: true,
    tags: ["light", "tool"],
    assetRef: { file: "assets/items/storm-lantern.svg", semanticKey: "lamp" },
    description: {
      en: "A brass travel lamp with a blue glass shield. Its flame stays steady in drizzle and makes wet stone gleam like polished ink.",
      zh: "一盏带蓝玻璃罩的黄铜旅行提灯。细雨里火苗依旧稳定，能把湿石照得像刚打磨过的墨。"
    }
  }),
  "field-notebook": item({
    id: "field-notebook",
    name: { en: "Field Notebook", zh: "现场札记" },
    category: "tool",
    baseValue: 8,
    tradeable: false,
    tags: ["note", "memory"],
    assetRef: { file: "assets/items/silver-ledger.svg", semanticKey: "notebook" },
    description: {
      en: "Waxed pages stitched into a weathered cover. Margins are marked for suspects, clues, promises, and debts.",
      zh: "打蜡纸页缝在旧封皮里，页边预留了嫌疑人、线索、承诺与欠账的位置。"
    }
  }),
  longsword: item({
    id: "longsword",
    name: { en: "Longsword", zh: "长剑" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 55,
    tradeable: true,
    tags: ["weapon", "melee", "slashing"],
    assetRef: { file: "assets/weapons/longsword.svg", semanticKey: "longsword" },
    description: {
      en: "A balanced patrol blade with a worn leather grip. Its fuller still carries old rainwater stains.",
      zh: "一柄配重稳当的巡逻长剑，皮柄已经磨旧，剑脊槽里还留着旧日雨渍。"
    }
  }),
  shield: item({
    id: "shield",
    name: { en: "Ward Shield", zh: "守护盾" },
    category: "shield",
    slot: "offHand",
    baseValue: 42,
    tradeable: true,
    tags: ["shield", "defense"],
    assetRef: { file: "assets/weapons/ward-shield.svg", semanticKey: "shield" },
    description: {
      en: "A compact shield painted with a fading ward-mark. It has stopped more panic than blades.",
      zh: "一面画着褪色护符的小盾。它挡下的恐惧，或许比刀刃还多。"
    }
  }),
  dagger: item({
    id: "dagger",
    name: { en: "Dagger", zh: "匕首" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 24,
    tradeable: true,
    tags: ["weapon", "light", "piercing"],
    assetRef: { file: "assets/weapons/dagger.svg", semanticKey: "dagger" },
    description: {
      en: "A narrow street blade that vanishes cleanly into a sleeve. The edge is honest even when its owner is not.",
      zh: "一柄能利落藏进袖口的窄刃街刀。刀口很诚实，哪怕主人未必如此。"
    }
  }),
  shortbow: item({
    id: "shortbow",
    name: { en: "Shortbow", zh: "短弓" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 48,
    tradeable: true,
    tags: ["weapon", "ranged"],
    assetRef: { file: "assets/weapons/shortbow.svg", semanticKey: "shortbow" },
    description: {
      en: "A rain-oiled bow sized for alleys and forest tracks, quiet enough to answer before a shout finishes.",
      zh: "一张适合巷战与林径的短弓，防雨油还没干，安静得能在喊声落下前回应。"
    }
  }),
  staff: item({
    id: "staff",
    name: { en: "Oak Staff", zh: "橡木杖" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 18,
    tradeable: true,
    tags: ["weapon", "focus", "bludgeoning"],
    assetRef: { file: "assets/weapons/oak-staff.svg", semanticKey: "staff" },
    description: {
      en: "A polished oak staff with brass rings near the grip. It can walk, ward, and strike with the same plain certainty.",
      zh: "一根打磨过的橡木杖，握柄旁有黄铜环。它能行路、护身，也能以同样朴素的确定性击人。"
    }
  }),
  mace: item({
    id: "mace",
    name: { en: "Sun Mace", zh: "日纹钉锤" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 38,
    tradeable: true,
    tags: ["weapon", "divine", "bludgeoning"],
    assetRef: { file: "assets/weapons/sun-mace.svg", semanticKey: "mace" },
    description: {
      en: "A short mace stamped with a sunburst. Temple guards claim it rings differently near a lie.",
      zh: "一柄压着日芒纹的短钉锤。神殿守卫说，它在谎言附近会响得不太一样。"
    }
  }),
  robe: item({
    id: "robe",
    name: { en: "Travel Robe", zh: "旅行长袍" },
    category: "armor",
    slot: "body",
    baseValue: 22,
    tradeable: true,
    tags: ["armor", "cloth"],
    assetRef: { file: "assets/items/witness-charm.svg", semanticKey: "robe" },
    description: {
      en: "A layered robe with hidden inner pockets for chalk, wire, and folded apologies.",
      zh: "一件分层长袍，内袋能藏粉笔、细线，以及折好的道歉信。"
    }
  }),
  leather: item({
    id: "leather",
    name: { en: "Leather Armor", zh: "皮甲" },
    category: "armor",
    slot: "body",
    baseValue: 45,
    tradeable: true,
    tags: ["armor", "light"],
    assetRef: { file: "assets/items/healer-kit.svg", semanticKey: "leather" },
    description: {
      en: "Soft black leather reinforced under the ribs and shoulders, made for running before it is made for dueling.",
      zh: "柔软黑皮在肋侧与肩部加固，比起决斗，它更适合让人活着跑出去。"
    }
  }),
  chainmail: item({
    id: "chainmail",
    name: { en: "Chainmail", zh: "链甲" },
    category: "armor",
    slot: "body",
    baseValue: 95,
    tradeable: true,
    tags: ["armor", "heavy"],
    assetRef: { file: "assets/weapons/ward-shield.svg", semanticKey: "chainmail" },
    description: {
      en: "A heavy shirt of linked iron, patched at the left side where something once tried to prove a point.",
      zh: "一件沉重的铁环甲，左侧补过一片，像是曾有什么东西在那里证明过观点。"
    }
  }),
  "moon-key": item({
    id: "moon-key",
    name: { en: "Moon Key", zh: "月相钥匙" },
    category: "quest",
    baseValue: 120,
    tradeable: false,
    tags: ["key", "quest", "moon"],
    assetRef: { file: "assets/items/moon-key.svg", semanticKey: "moon-key" },
    description: {
      en: "A pale key whose teeth change under moonlight. Every lock it fits seems to remember the hand that made it.",
      zh: "一枚淡色钥匙，月光下齿纹会轻微改变。凡是它能开的锁，似乎都记得铸造者的手。"
    }
  }),
  "silver-ledger": item({
    id: "silver-ledger",
    name: { en: "Silver Ledger", zh: "银边账本" },
    category: "tradeGood",
    baseValue: 80,
    tradeable: true,
    tags: ["ledger", "clue", "trade"],
    assetRef: { file: "assets/items/silver-ledger.svg", semanticKey: "ledger" },
    description: {
      en: "A ledger trimmed in tarnished silver. Several pages were torn out carefully, which is often louder than a confession.",
      zh: "一本镶着失光银边的账本。几页被小心撕去，而这往往比供词更响。"
    }
  }),
  "storm-lantern": item({
    id: "storm-lantern",
    name: { en: "Storm Lantern", zh: "暴风提灯" },
    category: "tool",
    baseValue: 64,
    tradeable: true,
    tags: ["lamp", "storm", "tool"],
    assetRef: { file: "assets/items/storm-lantern.svg", semanticKey: "storm-lantern" },
    description: {
      en: "A sealed lantern that glows brighter when thunder rolls. Sailors swear it points toward dry ground.",
      zh: "一盏密封提灯，雷声滚过时会更亮些。水手发誓它会指向干燥的地面。"
    }
  }),
  "healing-word-scroll": scroll({
    id: "healing-word-scroll",
    spellId: "healing-word",
    name: { en: "Scroll of Healing Word", zh: "治疗真言法卷" },
    baseValue: 110,
    assetRef: { file: "assets/spells/mend-wounds.svg", semanticKey: "healing-word-scroll" },
    description: {
      en: "A ribbon-bound scroll left behind by a nameless field saint. The ink warms when held near a wounded ally.",
      zh: "一卷以缎带束起的法卷，像是某位无名战地圣徒遗落之物。靠近伤者时，墨迹会微微发暖。"
    }
  }),
  "sleep-scroll": scroll({
    id: "sleep-scroll",
    spellId: "sleep",
    name: { en: "Scroll of Veiled Sleep", zh: "睡眠帷幕法卷" },
    baseValue: 95,
    assetRef: { file: "assets/spells/veil-of-sleep.svg", semanticKey: "sleep-scroll" },
    description: {
      en: "A violet scroll smelling faintly of rain on velvet curtains. Its script blurs when read aloud too eagerly.",
      zh: "一卷带淡紫色的法卷，闻起来像雨落在天鹅绒帘上。若读得太急，字迹会自己模糊。"
    }
  }),
  "binding-vines-scroll": scroll({
    id: "binding-vines-scroll",
    spellId: "binding-vines",
    name: { en: "Scroll of Thorn Snare", zh: "荆棘缚网法卷" },
    baseValue: 105,
    assetRef: { file: "assets/spells/thorn-snare.svg", semanticKey: "binding-vines-scroll" },
    description: {
      en: "A bark-fiber scroll sealed with green wax. Tiny root marks crawl along its edge when danger steps too close.",
      zh: "一卷树皮纤维制成的法卷，以绿蜡封口。危险靠近时，边缘会爬出细小根纹。"
    }
  }),
  "festival-wine": item({
    id: "festival-wine",
    name: { en: "Festival Wine", zh: "节庆红酒" },
    category: "food",
    baseValue: 16,
    tradeable: true,
    consumable: true,
    tags: ["wine", "food", "social"],
    assetRef: { file: "assets/generated/items/aidm-equipment-variant-007-12.png", semanticKey: "festival-wine" },
    description: {
      en: "A plum-dark bottle from a crowded inn cellar. Good for bargaining, bracing nerves, or making a bad song louder.",
      zh: "一瓶来自拥挤旅店酒窖的深梅色红酒。适合讨价还价、壮胆，或把难听的歌唱得更响。"
    }
  }),
  "minor-portrait": item({
    id: "minor-portrait",
    name: { en: "Minor Noble Portrait", zh: "小贵族肖像" },
    category: "tradeGood",
    baseValue: 70,
    tradeable: true,
    tags: ["portrait", "art", "trade"],
    assetRef: { file: "assets/generated/items/aidm-equipment-variant-007-15.png", semanticKey: "minor-portrait" },
    description: {
      en: "A palm-sized portrait of a noble nobody admits to knowing. The frame is worth more than the sitter's reputation.",
      zh: "一幅巴掌大的小贵族肖像，没人承认认识画中人。画框大概比他的名声更值钱。"
    }
  })
});

export const SHOP_CATALOG = Object.freeze([
  { itemId: "healing-word-scroll", condition: "fine", quantity: 1 },
  { itemId: "sleep-scroll", condition: "worn", quantity: 1 },
  { itemId: "storm-lantern", condition: "fine", quantity: 1 },
  { itemId: "festival-wine", condition: "pristine", quantity: 3 },
  { itemId: "minor-portrait", condition: "worn", quantity: 1 }
]);

export function createInventoryEntry(itemId, options = {}) {
  const definition = getItemDefinition(itemId);
  const condition = normalizeCondition(options.condition || defaultCondition(itemId));
  const quantity = Math.max(1, Number.parseInt(options.quantity ?? 1, 10) || 1);
  return {
    id: options.instanceId || `${itemId}-${stableHash(`${itemId}:${condition}:${options.seed || ""}`).toString(16)}`,
    itemId,
    quantity,
    condition,
    acquiredAt: options.acquiredAt || null,
    source: options.source || "starting",
    value: valueForItem(definition, condition),
    currency: CURRENCY.id,
    tradeable: definition.tradeable !== false,
    usable: Boolean(definition.useEffect || definition.consumable),
    equipped: Boolean(options.equipped),
    notes: options.notes || ""
  };
}

export function createAssetInventoryEntry(asset, options = {}) {
  const semanticKey = asset?.semanticKey || asset?.assetId || asset?.id || "generated-reward";
  const itemId = `generated:${semanticKey}`;
  const condition = normalizeCondition(options.condition || asset?.variantAxes?.condition || defaultCondition(itemId));
  const definitionSnapshot = {
    id: itemId,
    name: asset?.displayName || { en: asset?.name || "Found Item", zh: asset?.zhName || asset?.name || "发现物品" },
    category: asset?.categoryId === "equipment" ? "tradeGood" : "tool",
    baseValue: baseValueFromAsset(asset),
    tradeable: true,
    consumable: false,
    tags: [asset?.type, asset?.kind, ...(asset?.tags || []), ...(asset?.soundscapeHints || [])].filter(Boolean),
    assetRef: { file: asset?.file, semanticKey },
    description: asset?.description || {
      en: "A strange find from the current scene. Its exact worth depends on who wants the story attached to it.",
      zh: "这是一件从当前场景中发现的奇物。它真正的价值，取决于谁想买下它背后的故事。"
    }
  };
  return {
    id: options.instanceId || `${itemId}-${stableHash(`${itemId}:${condition}:${options.seed || ""}`).toString(16)}`,
    itemId,
    quantity: Math.max(1, Number.parseInt(options.quantity ?? 1, 10) || 1),
    condition,
    acquiredAt: options.acquiredAt || null,
    source: options.source || "reward",
    value: valueForItem(definitionSnapshot, condition),
    currency: CURRENCY.id,
    tradeable: true,
    usable: false,
    equipped: false,
    notes: options.notes || "",
    definitionSnapshot
  };
}

export function hydrateInventoryEntry(entry) {
  if (typeof entry === "string") {
    return createInventoryEntry(normalizeItemId(entry), { seed: entry });
  }
  const itemId = normalizeItemId(entry?.itemId || entry?.id || entry?.name);
  const definition = entry?.definitionSnapshot || getItemDefinition(itemId);
  const condition = normalizeCondition(entry?.condition || defaultCondition(itemId));
  return {
    ...createInventoryEntry(itemId, { condition, seed: entry?.id || itemId }),
    ...entry,
    itemId,
    condition,
    value: valueForItem(definition, condition),
    currency: entry?.currency || CURRENCY.id,
    tradeable: entry?.tradeable ?? definition.tradeable !== false,
    usable: entry?.usable ?? Boolean(definition.useEffect || definition.consumable)
  };
}

export function inventoryView(entries = [], language = "en") {
  return entries.map((entry) => describeInventoryEntry(hydrateInventoryEntry(entry), language));
}

export function describeInventoryEntry(entry, language = "en") {
  const normalized = hydrateInventoryEntry(entry);
  const definition = normalized.definitionSnapshot || getItemDefinition(normalized.itemId);
  const condition = ITEM_CONDITIONS[normalized.condition] || ITEM_CONDITIONS.fine;
  return {
    ...normalized,
    definition: {
      id: definition.id,
      name: definition.name,
      label: localize(definition.name, language),
      category: definition.category,
      categoryLabel: localize(ITEM_CATEGORIES[definition.category] || definition.category, language),
      slot: definition.slot || null,
      tags: definition.tags || [],
      description: definition.description,
      descriptionText: localize(definition.description, language),
      assetRef: definition.assetRef || null,
      useEffect: definition.useEffect || null
    },
    conditionLabel: localize(condition.label, language),
    valueLabel: `${normalized.value} ${CURRENCY.symbol}`
  };
}

export function getItemDefinition(itemId) {
  const normalized = normalizeItemId(itemId);
  if (normalized.startsWith("generated:")) {
    return {
      id: normalized,
      name: { en: "Generated Find", zh: "生成发现物" },
      category: "tradeGood",
      baseValue: 20,
      tradeable: true,
      tags: ["generated"],
      description: {
        en: "A generated item whose detailed description is stored on the inventory instance.",
        zh: "一件生成物品，具体描述保存在背包实例上。"
      }
    };
  }
  return ITEM_CATALOG[normalized] || ITEM_CATALOG["field-notebook"];
}

export function valueForItem(definition, conditionId = "fine") {
  const condition = ITEM_CONDITIONS[conditionId] || ITEM_CONDITIONS.fine;
  return Math.max(1, Math.round((definition.baseValue || 1) * condition.multiplier));
}

export function useInventoryItem(player, inventoryItemId) {
  const inventory = (player?.character?.inventory || []).map(hydrateInventoryEntry);
  const index = inventory.findIndex((entry) => entry.id === inventoryItemId || entry.itemId === inventoryItemId);
  if (index < 0) {
    throw new Error("Inventory item not found");
  }
  const entry = inventory[index];
  const definition = getItemDefinition(entry.itemId);
  if (!definition.useEffect && !definition.consumable) {
    throw new Error("Item is not usable");
  }

  const result = { item: describeInventoryEntry(entry), consumed: false, learnedSpell: null };
  if (definition.useEffect?.type === "learn-spell") {
    const spell = getSpell(definition.useEffect.spellId);
    const spells = new Set(player.character.spells || []);
    spells.add(spell.id);
    player.character.spells = [...spells];
    result.learnedSpell = spell.id;
  }
  if (definition.consumable || definition.useEffect?.consume !== false) {
    entry.quantity -= 1;
    result.consumed = true;
  }
  player.character.inventory = entry.quantity > 0
    ? inventory.with(index, entry)
    : inventory.filter((_, entryIndex) => entryIndex !== index);
  return result;
}

export function sellInventoryItem(player, inventoryItemId) {
  const inventory = (player?.character?.inventory || []).map(hydrateInventoryEntry);
  const index = inventory.findIndex((entry) => entry.id === inventoryItemId || entry.itemId === inventoryItemId);
  if (index < 0) {
    throw new Error("Inventory item not found");
  }
  const entry = inventory[index];
  if (!entry.tradeable) {
    throw new Error("Item cannot be traded");
  }
  const payout = Math.max(1, Math.floor(entry.value * 0.55));
  player.character.wallet = (player.character.wallet || 0) + payout;
  player.character.inventory = inventory.filter((_, entryIndex) => entryIndex !== index);
  return { item: describeInventoryEntry(entry), payout, currency: CURRENCY.id };
}

export function buyShopItem(player, shopItemId) {
  const offer = SHOP_CATALOG.find((entry) => entry.itemId === shopItemId);
  if (!offer) {
    throw new Error("Shop item not found");
  }
  const item = createInventoryEntry(offer.itemId, {
    condition: offer.condition,
    source: "shop",
    seed: `${player.id}:${shopItemId}:${Date.now()}`
  });
  const price = Math.ceil(item.value * 1.25);
  if ((player.character.wallet || 0) < price) {
    throw new Error("Not enough currency");
  }
  player.character.wallet -= price;
  player.character.inventory = [...(player.character.inventory || []).map(hydrateInventoryEntry), item];
  return { item: describeInventoryEntry(item), price, currency: CURRENCY.id };
}

export function shopView(language = "en") {
  return SHOP_CATALOG.map((offer) => {
    const entry = createInventoryEntry(offer.itemId, { condition: offer.condition, source: "shop" });
    const view = describeInventoryEntry(entry, language);
    return {
      ...view,
      price: Math.ceil(entry.value * 1.25),
      priceLabel: `${Math.ceil(entry.value * 1.25)} ${CURRENCY.symbol}`,
      quantity: offer.quantity
    };
  });
}

export function normalizeItemId(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (normalized.startsWith("generated:")) {
    return normalized;
  }
  const aliases = {
    "travel-lamp": "travel-lamp",
    "field-notebook": "field-notebook",
    "staff": "staff",
    "oak-staff": "staff",
    "mace": "mace",
    "sun-mace": "mace",
    "leather-armor": "leather",
    "chainmail": "chainmail",
    "shield": "shield",
    "ward-shield": "shield"
  };
  return aliases[normalized] || normalized || "field-notebook";
}

function baseValueFromAsset(asset) {
  const rarity = asset?.variantAxes?.rarity || asset?.rarity || "common";
  const rarityValue = {
    common: 24,
    uncommon: 64,
    rare: 140,
    epic: 320,
    legendary: 850
  };
  return rarityValue[rarity] || 32;
}

function item(definition) {
  return Object.freeze({
    tradeable: true,
    consumable: false,
    ...definition
  });
}

function scroll(definition) {
  return item({
    category: "spellScroll",
    tradeable: true,
    consumable: true,
    tags: ["scroll", "spell", definition.spellId],
    useEffect: { type: "learn-spell", spellId: definition.spellId, consume: true },
    ...definition
  });
}

function defaultCondition(itemId) {
  const hash = stableHash(itemId);
  return ["worn", "fine", "fine", "pristine"][hash % 4];
}

function normalizeCondition(condition) {
  return ITEM_CONDITIONS[condition] ? condition : "fine";
}

function localize(value, language = "en") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.zh || value.default || "";
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}
