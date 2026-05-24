import { rollDice } from "./dice.js";

export const ATTRIBUTE_KEYS = Object.freeze(["body", "agility", "mind", "presence", "spirit"]);

export const DEFAULT_ATTRIBUTE_BUDGET = Object.freeze({
  base: 8,
  points: 27,
  maxBeforeAncestry: 15
});

export const SKILLS = Object.freeze({
  athletics: "body",
  melee: "body",
  guard: "body",
  stealth: "agility",
  ranged: "agility",
  arcana: "mind",
  investigation: "mind",
  medicine: "spirit",
  insight: "spirit",
  survival: "spirit",
  persuasion: "presence",
  intimidation: "presence"
});

export const RACES = Object.freeze({
  human: Object.freeze({
    id: "human",
    name: "Human",
    bonuses: Object.freeze({ body: 1, agility: 1, mind: 1, presence: 1, spirit: 1 }),
    skillBonuses: Object.freeze({ persuasion: 1 }),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    hpBonus: 0,
    speed: 6,
    traits: Object.freeze(["versatile"])
  }),
  elf: Object.freeze({
    id: "elf",
    name: "Elf",
    bonuses: Object.freeze({ agility: 2, mind: 1 }),
    skillBonuses: Object.freeze({ arcana: 1, stealth: 1 }),
    resistances: Object.freeze(["charm"]),
    weaknesses: Object.freeze([]),
    hpBonus: 0,
    speed: 7,
    traits: Object.freeze(["keen-senses"])
  }),
  dwarf: Object.freeze({
    id: "dwarf",
    name: "Dwarf",
    bonuses: Object.freeze({ body: 2, spirit: 1 }),
    skillBonuses: Object.freeze({ guard: 1 }),
    resistances: Object.freeze(["poison"]),
    weaknesses: Object.freeze([]),
    hpBonus: 2,
    speed: 5,
    traits: Object.freeze(["stone-blood"])
  }),
  orc: Object.freeze({
    id: "orc",
    name: "Orc",
    bonuses: Object.freeze({ body: 2, presence: 1 }),
    skillBonuses: Object.freeze({ intimidation: 1 }),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    hpBonus: 1,
    speed: 6,
    traits: Object.freeze(["relentless"])
  }),
  gnome: Object.freeze({
    id: "gnome",
    name: "Gnome",
    bonuses: Object.freeze({ mind: 2, agility: 1 }),
    skillBonuses: Object.freeze({ investigation: 1 }),
    resistances: Object.freeze(["illusion"]),
    weaknesses: Object.freeze([]),
    hpBonus: 0,
    speed: 5,
    traits: Object.freeze(["tinkerer"])
  }),
  tiefling: Object.freeze({
    id: "tiefling",
    name: "Tiefling",
    bonuses: Object.freeze({ presence: 2, mind: 1 }),
    skillBonuses: Object.freeze({ arcana: 1 }),
    resistances: Object.freeze(["fire"]),
    weaknesses: Object.freeze([]),
    hpBonus: 0,
    speed: 6,
    traits: Object.freeze(["hellish-resilience"])
  }),
  automaton: Object.freeze({
    id: "automaton",
    name: "Automaton",
    bonuses: Object.freeze({ body: 1, mind: 1, spirit: 1 }),
    skillBonuses: Object.freeze({ guard: 1, investigation: 1 }),
    resistances: Object.freeze(["poison"]),
    weaknesses: Object.freeze(["lightning"]),
    hpBonus: 1,
    speed: 5,
    traits: Object.freeze(["constructed", "tireless"])
  }),
  halfling: Object.freeze({
    id: "halfling",
    name: "Halfling",
    bonuses: Object.freeze({ agility: 2, presence: 1 }),
    skillBonuses: Object.freeze({ stealth: 1, persuasion: 1 }),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    hpBonus: 0,
    speed: 5,
    traits: Object.freeze(["lucky", "small"])
  })
});

export const CLASSES = Object.freeze({
  warrior: Object.freeze({
    id: "warrior",
    name: "Warrior",
    baseHp: 12,
    hitDie: 10,
    skillProficiencies: Object.freeze(["athletics", "melee", "guard", "intimidation"]),
    startingEquipment: Object.freeze(["longsword", "shield", "chainmail"]),
    knownSpells: Object.freeze([]),
    actions: Object.freeze(["attack", "defend"])
  }),
  rogue: Object.freeze({
    id: "rogue",
    name: "Rogue",
    baseHp: 9,
    hitDie: 8,
    skillProficiencies: Object.freeze(["stealth", "ranged", "investigation", "persuasion"]),
    startingEquipment: Object.freeze(["dagger", "shortbow", "leather"]),
    knownSpells: Object.freeze([]),
    actions: Object.freeze(["attack", "defend", "flee"])
  }),
  mage: Object.freeze({
    id: "mage",
    name: "Mage",
    baseHp: 7,
    hitDie: 6,
    skillProficiencies: Object.freeze(["arcana", "investigation", "insight"]),
    startingEquipment: Object.freeze(["staff", "robe"]),
    knownSpells: Object.freeze(["firebolt", "sleep", "arcane-shield"]),
    actions: Object.freeze(["attack", "cast", "defend"])
  }),
  cleric: Object.freeze({
    id: "cleric",
    name: "Cleric",
    baseHp: 10,
    hitDie: 8,
    skillProficiencies: Object.freeze(["medicine", "insight", "guard", "persuasion"]),
    startingEquipment: Object.freeze(["mace", "shield", "leather"]),
    knownSpells: Object.freeze(["healing-word", "radiant-bolt", "ward"]),
    actions: Object.freeze(["attack", "cast", "support", "defend"])
  }),
  ranger: Object.freeze({
    id: "ranger",
    name: "Ranger",
    baseHp: 10,
    hitDie: 8,
    skillProficiencies: Object.freeze(["ranged", "survival", "stealth", "medicine"]),
    startingEquipment: Object.freeze(["shortbow", "dagger", "leather"]),
    knownSpells: Object.freeze(["binding-vines"]),
    actions: Object.freeze(["attack", "cast", "defend", "flee"])
  }),
  bard: Object.freeze({
    id: "bard",
    name: "Bard",
    baseHp: 8,
    hitDie: 8,
    skillProficiencies: Object.freeze(["persuasion", "insight", "stealth", "medicine"]),
    startingEquipment: Object.freeze(["dagger", "leather"]),
    knownSpells: Object.freeze(["healing-word", "sleep"]),
    actions: Object.freeze(["attack", "cast", "support", "defend"])
  }),
  occultist: Object.freeze({
    id: "occultist",
    name: "Occultist",
    baseHp: 8,
    hitDie: 6,
    skillProficiencies: Object.freeze(["arcana", "investigation", "intimidation", "insight"]),
    startingEquipment: Object.freeze(["staff", "robe"]),
    knownSpells: Object.freeze(["firebolt", "sleep", "binding-vines"]),
    actions: Object.freeze(["attack", "cast", "defend", "flee"])
  }),
  envoy: Object.freeze({
    id: "envoy",
    name: "Envoy",
    baseHp: 9,
    hitDie: 8,
    skillProficiencies: Object.freeze(["persuasion", "insight", "guard", "medicine"]),
    startingEquipment: Object.freeze(["dagger", "shield", "leather"]),
    knownSpells: Object.freeze(["ward"]),
    actions: Object.freeze(["attack", "support", "defend"])
  })
});

export const RACE_LABELS = Object.freeze({
  human: Object.freeze({ en: "Human", zh: "人类" }),
  elf: Object.freeze({ en: "Elf", zh: "精灵" }),
  dwarf: Object.freeze({ en: "Dwarf", zh: "矮人" }),
  orc: Object.freeze({ en: "Orc", zh: "兽人" }),
  gnome: Object.freeze({ en: "Gnome", zh: "侏儒" }),
  tiefling: Object.freeze({ en: "Tiefling", zh: "提夫林" }),
  automaton: Object.freeze({ en: "Automaton", zh: "机关人" }),
  halfling: Object.freeze({ en: "Halfling", zh: "半身人" })
});

export const CLASS_LABELS = Object.freeze({
  warrior: Object.freeze({ en: "Warrior", zh: "战士" }),
  rogue: Object.freeze({ en: "Rogue", zh: "盗贼" }),
  mage: Object.freeze({ en: "Mage", zh: "法师" }),
  cleric: Object.freeze({ en: "Cleric", zh: "牧师" }),
  ranger: Object.freeze({ en: "Ranger", zh: "游侠" }),
  bard: Object.freeze({ en: "Bard", zh: "吟游诗人" }),
  occultist: Object.freeze({ en: "Occultist", zh: "神秘学者" }),
  envoy: Object.freeze({ en: "Envoy", zh: "使节" })
});

export const CLASS_RECOMMENDED_ALLOCATIONS = Object.freeze({
  warrior: freezeAttributeAllocation({ body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 }),
  rogue: freezeAttributeAllocation({ body: 4, agility: 7, mind: 6, presence: 5, spirit: 5 }),
  mage: freezeAttributeAllocation({ body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 }),
  cleric: freezeAttributeAllocation({ body: 5, agility: 3, mind: 5, presence: 7, spirit: 7 }),
  ranger: freezeAttributeAllocation({ body: 5, agility: 7, mind: 4, presence: 4, spirit: 7 }),
  bard: freezeAttributeAllocation({ body: 3, agility: 5, mind: 5, presence: 7, spirit: 7 }),
  occultist: freezeAttributeAllocation({ body: 3, agility: 5, mind: 7, presence: 6, spirit: 6 }),
  envoy: freezeAttributeAllocation({ body: 4, agility: 4, mind: 5, presence: 7, spirit: 7 })
});

export const WEAPONS = Object.freeze({
  longsword: Object.freeze({
    id: "longsword",
    name: "Longsword",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d8+2",
    damageType: "slashing",
    range: 1,
    tags: Object.freeze(["martial"])
  }),
  dagger: Object.freeze({
    id: "dagger",
    name: "Dagger",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "agility",
    damage: "1d4+2",
    damageType: "piercing",
    range: 1,
    tags: Object.freeze(["light", "thrown"])
  }),
  shortbow: Object.freeze({
    id: "shortbow",
    name: "Shortbow",
    kind: "weapon",
    category: "ranged",
    skill: "ranged",
    attackAttribute: "agility",
    damage: "1d6+2",
    damageType: "piercing",
    range: 8,
    tags: Object.freeze(["ranged"])
  }),
  staff: Object.freeze({
    id: "staff",
    name: "Staff",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d6",
    damageType: "bludgeoning",
    range: 1,
    tags: Object.freeze(["simple"])
  }),
  mace: Object.freeze({
    id: "mace",
    name: "Mace",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d6+1",
    damageType: "bludgeoning",
    range: 1,
    tags: Object.freeze(["simple"])
  }),
  "ironstar-mace": Object.freeze({
    id: "ironstar-mace",
    name: "Ironstar Mace",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d6+2",
    damageType: "bludgeoning",
    range: 1,
    tags: Object.freeze(["simple", "market"])
  }),
  "oathguard-saber": Object.freeze({
    id: "oathguard-saber",
    name: "Oathguard Saber",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d8+1",
    damageType: "slashing",
    range: 1,
    tags: Object.freeze(["martial", "market"])
  }),
  "red-tassel-spear": Object.freeze({
    id: "red-tassel-spear",
    name: "Red-Tassel Spear",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d8",
    damageType: "piercing",
    range: 2,
    tags: Object.freeze(["reach", "market"])
  }),
  claws: Object.freeze({
    id: "claws",
    name: "Claws",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d6+1",
    damageType: "slashing",
    range: 1,
    tags: Object.freeze(["natural"])
  }),
  bite: Object.freeze({
    id: "bite",
    name: "Bite",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d8+1",
    damageType: "piercing",
    range: 1,
    tags: Object.freeze(["natural"])
  })
});

export const ARMOR = Object.freeze({
  robe: Object.freeze({
    id: "robe",
    name: "Travel Robe",
    kind: "armor",
    defenseBonus: 0,
    agilityCap: null
  }),
  leather: Object.freeze({
    id: "leather",
    name: "Leather Armor",
    kind: "armor",
    defenseBonus: 2,
    agilityCap: 4
  }),
  chainmail: Object.freeze({
    id: "chainmail",
    name: "Chainmail",
    kind: "armor",
    defenseBonus: 4,
    agilityCap: 2
  }),
  "folded-chain-shirt": Object.freeze({
    id: "folded-chain-shirt",
    name: "Folded Chain Shirt",
    kind: "armor",
    defenseBonus: 3,
    agilityCap: 3
  }),
  shield: Object.freeze({
    id: "shield",
    name: "Shield",
    kind: "shield",
    defenseBonus: 2,
    agilityCap: null
  }),
  "gilded-sun-buckler": Object.freeze({
    id: "gilded-sun-buckler",
    name: "Gilded Sun Buckler",
    kind: "shield",
    defenseBonus: 1,
    agilityCap: null
  }),
  "stormglass-amulet": Object.freeze({
    id: "stormglass-amulet",
    name: "Stormglass Amulet",
    kind: "accessory",
    defenseBonus: 0,
    agilityCap: null
  })
});

export const SPELLS = Object.freeze({
  firebolt: Object.freeze({
    id: "firebolt",
    name: "Firebolt",
    kind: "spell",
    action: "cast",
    school: "evocation",
    skill: "arcana",
    damage: "1d10",
    damageType: "fire",
    range: 8,
    tags: Object.freeze(["attack", "damage"])
  }),
  "radiant-bolt": Object.freeze({
    id: "radiant-bolt",
    name: "Radiant Bolt",
    kind: "spell",
    action: "cast",
    school: "divine",
    skill: "medicine",
    damage: "1d8+2",
    damageType: "radiant",
    range: 6,
    tags: Object.freeze(["attack", "damage"])
  }),
  "healing-word": Object.freeze({
    id: "healing-word",
    name: "Healing Word",
    kind: "spell",
    action: "support",
    school: "divine",
    skill: "medicine",
    healing: "1d8+3",
    range: 6,
    tags: Object.freeze(["healing", "support"])
  }),
  ward: Object.freeze({
    id: "ward",
    name: "Ward",
    kind: "spell",
    action: "support",
    school: "abjuration",
    skill: "medicine",
    effect: Object.freeze({ defenseBonus: 2, durationRounds: 1 }),
    range: 4,
    tags: Object.freeze(["support", "defense"])
  }),
  sleep: Object.freeze({
    id: "sleep",
    name: "Sleep",
    kind: "spell",
    action: "cast",
    school: "enchantment",
    skill: "arcana",
    effect: Object.freeze({ condition: "drowsy", dcAttribute: "spirit" }),
    range: 6,
    tags: Object.freeze(["control"])
  }),
  "arcane-shield": Object.freeze({
    id: "arcane-shield",
    name: "Arcane Shield",
    kind: "spell",
    action: "defend",
    school: "abjuration",
    skill: "arcana",
    effect: Object.freeze({ defenseBonus: 3, durationRounds: 1 }),
    range: 0,
    tags: Object.freeze(["defense"])
  }),
  "binding-vines": Object.freeze({
    id: "binding-vines",
    name: "Binding Vines",
    kind: "spell",
    action: "cast",
    school: "nature",
    skill: "survival",
    effect: Object.freeze({ condition: "restrained", dcAttribute: "body" }),
    range: 6,
    tags: Object.freeze(["control"])
  })
});

export const EQUIPMENT = Object.freeze({
  ...WEAPONS,
  ...ARMOR
});

export const RULE_KNOWLEDGE_SOURCES = Object.freeze({
  "dnd-srd-5.2.1": Object.freeze({
    id: "dnd-srd-5.2.1",
    title: "System Reference Document v5.2.1",
    publisher: "Wizards of the Coast / D&D Beyond",
    url: "https://www.dndbeyond.com/srd",
    license: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    useBoundary: "Use as a rules reference and attribution target only; do not embed long rules text; store original AIDM mechanics, labels, and prompts in repo.",
    note: "Official SRD reference can coexist with SRD 5.1 material under the same attribution family."
  }),
  "dnd-srd-5.1-cc": Object.freeze({
    id: "dnd-srd-5.1-cc",
    title: "System Reference Document 5.1 CC PDF",
    publisher: "Wizards of the Coast",
    url: "https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf",
    license: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    useBoundary: "Keep attribution and compatibility notes; do not copy long SRD rules text or proprietary setting lore.",
    note: "Legal information requires Creative Commons attribution for SRD-derived references."
  })
});

export const SRD_STYLE_ACTION_SEEDS = Object.freeze([
  Object.freeze({
    id: "observe-and-ask",
    intents: Object.freeze(["investigate", "general"]),
    skill: "investigation",
    attribute: "mind",
    prompt: "Name the exact clue, surface, witness, or contradiction you inspect.",
    zhPrompt: "说清楚你要检查的具体线索、表面、目击者或矛盾点。",
    risk: "A miss should add time pressure or partial truth, not erase the attempt."
  }),
  Object.freeze({
    id: "negotiate-leverage",
    intents: Object.freeze(["social", "general"]),
    skill: "persuasion",
    attribute: "presence",
    prompt: "Offer leverage, a promise, or a question that reveals what the NPC wants.",
    zhPrompt: "提出筹码、承诺或问题，让 NPC 的真实诉求浮出来。",
    risk: "A miss should reveal a price, suspicion, or rival interest."
  }),
  Object.freeze({
    id: "hold-position",
    intents: Object.freeze(["guard", "hostile"]),
    skill: "guard",
    attribute: "body",
    prompt: "Choose who or what you protect and what line you refuse to yield.",
    zhPrompt: "说明你保护谁或什么，以及哪条防线绝不退让。",
    risk: "A miss should shift position, expose an ally, or increase danger."
  }),
  Object.freeze({
    id: "force-opening",
    intents: Object.freeze(["hostile"]),
    skill: "melee",
    attribute: "body",
    prompt: "Pick a target, angle, and intended effect before damage is described.",
    zhPrompt: "先说明目标、进攻角度和想要造成的效果，再进入伤害描述。",
    risk: "A miss should invite a rules-bound response or tactical tradeoff."
  }),
  Object.freeze({
    id: "move-with-care",
    intents: Object.freeze(["travel", "investigate"]),
    skill: "survival",
    attribute: "spirit",
    prompt: "Describe the route, pace, and sign you follow before the scene shifts.",
    zhPrompt: "在场景切换前，描述路线、节奏和你追随的迹象。",
    risk: "A miss should complicate the route while preserving a recoverable path."
  }),
  Object.freeze({
    id: "vanish-or-flank",
    intents: Object.freeze(["stealth", "hostile", "travel"]),
    skill: "stealth",
    attribute: "agility",
    prompt: "State the cover, distraction, or blind spot you use.",
    zhPrompt: "说明你利用的掩护、干扰或视野死角。",
    risk: "A miss should expose position or cost time instead of stopping play."
  })
]);

export const WEATHER_NARRATIVE_HOOKS = Object.freeze({
  clear: Object.freeze({
    id: "clear",
    labels: Object.freeze({ en: "clear air", zh: "晴朗空气" }),
    tags: Object.freeze(["weather:clear", "visibility:open"]),
    skills: Object.freeze(["investigation", "ranged", "persuasion"]),
    prompt: "Use visibility, heat shimmer, or exposed silhouettes to make choices feel legible.",
    zhPrompt: "用清晰视野、热浪或暴露的轮廓，让选择显得可判断。"
  }),
  rain: Object.freeze({
    id: "rain",
    labels: Object.freeze({ en: "steady rain", zh: "持续雨声" }),
    tags: Object.freeze(["weather:rain", "surface:wet"]),
    skills: Object.freeze(["survival", "investigation", "stealth"]),
    prompt: "Let water reveal tracks, distort sound, and turn haste into a visible risk.",
    zhPrompt: "让雨水显出足迹、扭曲声音，并把急躁变成看得见的风险。"
  }),
  storm: Object.freeze({
    id: "storm",
    labels: Object.freeze({ en: "near storm", zh: "逼近的风暴" }),
    tags: Object.freeze(["weather:storm", "sound:thunder", "visibility:broken"]),
    skills: Object.freeze(["guard", "survival", "arcana"]),
    prompt: "Use thunder, flash light, and unstable footing as pressure without changing rules numbers.",
    zhPrompt: "用雷声、闪光和不稳地面制造压力，但不越过规则数值。"
  }),
  fog: Object.freeze({
    id: "fog",
    labels: Object.freeze({ en: "low fog", zh: "低雾" }),
    tags: Object.freeze(["weather:fog", "visibility:limited"]),
    skills: Object.freeze(["insight", "stealth", "investigation"]),
    prompt: "Make silhouettes, mistaken voices, and partial evidence carry the uncertainty.",
    zhPrompt: "用剪影、误认的声音和残缺证据承载不确定感。"
  }),
  wind: Object.freeze({
    id: "wind",
    labels: Object.freeze({ en: "hard wind", zh: "强风" }),
    tags: Object.freeze(["weather:wind", "motion:unstable"]),
    skills: Object.freeze(["athletics", "ranged", "survival"]),
    prompt: "Let banners, loose shutters, and thrown voices show what the wind changes.",
    zhPrompt: "用旗帜、松动百叶和被吹散的声音表现风改变了什么。"
  }),
  snow: Object.freeze({
    id: "snow",
    labels: Object.freeze({ en: "cold snow", zh: "寒雪" }),
    tags: Object.freeze(["weather:snow", "surface:cold"]),
    skills: Object.freeze(["survival", "medicine", "investigation"]),
    prompt: "Use footprints, numb hands, and muffled space as cost and clue.",
    zhPrompt: "用脚印、麻木的手和被雪吞没的空间作为代价与线索。"
  })
});

export const SEASON_NARRATIVE_HOOKS = Object.freeze({
  spring: Object.freeze({
    id: "spring",
    labels: Object.freeze({ en: "spring thaw", zh: "春日融雪" }),
    tags: Object.freeze(["season:spring", "growth:new"]),
    prompt: "New growth hides old damage; promises and rot can appear together.",
    zhPrompt: "新生遮住旧伤，承诺与腐朽可以同时出现。"
  }),
  summer: Object.freeze({
    id: "summer",
    labels: Object.freeze({ en: "summer heat", zh: "盛夏热浪" }),
    tags: Object.freeze(["season:summer", "heat:rising"]),
    prompt: "Heat sharpens tempers, crowds, and exhaustion while long daylight exposes movement.",
    zhPrompt: "热浪放大脾气、人群与疲惫，漫长日光暴露行动。"
  }),
  autumn: Object.freeze({
    id: "autumn",
    labels: Object.freeze({ en: "autumn turn", zh: "秋日转凉" }),
    tags: Object.freeze(["season:autumn", "harvest:waning"]),
    prompt: "Falling leaves, closing markets, and old debts make endings feel near.",
    zhPrompt: "落叶、收摊的市场和旧债让结局显得更近。"
  }),
  winter: Object.freeze({
    id: "winter",
    labels: Object.freeze({ en: "winter hush", zh: "冬日寂静" }),
    tags: Object.freeze(["season:winter", "cold:hard"]),
    prompt: "Cold makes shelter, supplies, and loyalty matter before danger even speaks.",
    zhPrompt: "寒冷让庇护、补给和忠诚在危险开口前就变得重要。"
  })
});

export function abilityModifier(score) {
  if (!Number.isInteger(score)) {
    throw new Error("Ability score must be an integer");
  }
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level = 1) {
  const normalized = normalizePositiveInteger(level, "Level");
  return 2 + Math.floor((normalized - 1) / 4);
}

export function allocateAttributes({ raceId = "human", allocations = {}, budget = DEFAULT_ATTRIBUTE_BUDGET } = {}) {
  const race = getRace(raceId);
  const base = normalizePositiveInteger(budget.base ?? DEFAULT_ATTRIBUTE_BUDGET.base, "Attribute base");
  const points = normalizeNonNegativeInteger(budget.points ?? DEFAULT_ATTRIBUTE_BUDGET.points, "Attribute points");
  const maxBeforeAncestry = normalizePositiveInteger(
    budget.maxBeforeAncestry ?? DEFAULT_ATTRIBUTE_BUDGET.maxBeforeAncestry,
    "Attribute max"
  );

  const unknownKeys = Object.keys(allocations).filter((key) => !ATTRIBUTE_KEYS.includes(key));
  if (unknownKeys.length > 0) {
    throw new Error(`Unknown attributes: ${unknownKeys.join(", ")}`);
  }

  const baseScores = {};
  const scores = {};
  const bonuses = {};
  let spent = 0;

  for (const key of ATTRIBUTE_KEYS) {
    const pointSpend = allocations[key] ?? 0;
    if (!Number.isInteger(pointSpend) || pointSpend < 0) {
      throw new Error(`Attribute allocation for ${key} must be a non-negative integer`);
    }
    const preAncestry = base + pointSpend;
    if (preAncestry > maxBeforeAncestry) {
      throw new Error(`${key} exceeds max before ancestry (${maxBeforeAncestry})`);
    }
    spent += pointSpend;
    baseScores[key] = preAncestry;
    bonuses[key] = race.bonuses[key] ?? 0;
    scores[key] = preAncestry + bonuses[key];
  }

  if (spent > points) {
    throw new Error(`Attribute budget exceeded: spent ${spent}, available ${points}`);
  }

  return {
    base,
    points,
    maxBeforeAncestry,
    spent,
    remaining: points - spent,
    allocations: normalizeAttributeMap(allocations, 0),
    ancestryBonuses: bonuses,
    baseScores,
    scores
  };
}

export function createCharacter({
  id,
  name,
  raceId = "human",
  classId = "warrior",
  level = 1,
  allocations = {},
  equipmentIds,
  knownSpellIds,
  hp,
  resistances = [],
  weaknesses = []
} = {}) {
  const safeName = String(name ?? "").trim();
  if (!safeName) {
    throw new Error("Character name is required");
  }

  const race = getRace(raceId);
  const classDef = getClass(classId);
  const normalizedLevel = normalizePositiveInteger(level, "Level");
  const attributes = allocateAttributes({ raceId, allocations });
  const modifiers = mapAttributes(attributes.scores, abilityModifier);
  const pb = proficiencyBonus(normalizedLevel);
  const equipment = resolveEquipment(equipmentIds ?? classDef.startingEquipment);
  const spells = resolveSpells(knownSpellIds ?? classDef.knownSpells);
  const maxHp = calculateMaxHp({ classDef, race, level: normalizedLevel, bodyModifier: modifiers.body });
  const defense = calculateDefense({ agilityModifier: modifiers.agility, equipment });
  const skills = calculateSkills({
    attributes: attributes.scores,
    classDef,
    race,
    level: normalizedLevel
  });
  const currentHp = hp === undefined ? maxHp : clamp(normalizeNonNegativeInteger(hp, "HP"), 0, maxHp);

  return {
    id: id ?? slugify(safeName),
    name: safeName,
    level: normalizedLevel,
    race: race.id,
    class: classDef.id,
    ancestry: {
      id: race.id,
      name: race.name,
      label: { ...RACE_LABELS[race.id] },
      traits: [...race.traits],
      speed: race.speed
    },
    className: classDef.name,
    classLabel: { ...CLASS_LABELS[classDef.id] },
    speciesLabel: { ...RACE_LABELS[race.id] },
    attributes: attributes.scores,
    attributeBudget: attributes,
    modifiers,
    proficiencyBonus: pb,
    skills,
    equipment: equipment.map((item) => item.id),
    weapons: equipment.filter((item) => item.kind === "weapon").map((item) => item.id),
    armor: equipment.filter((item) => item.kind === "armor" || item.kind === "shield").map((item) => item.id),
    knownSpells: spells.map((spell) => spell.id),
    actions: unique([...classDef.actions, ...(spells.length > 0 ? ["cast"] : [])]),
    maxHp,
    hp: currentHp,
    defense,
    resistances: unique([...race.resistances, ...resistances]),
    weaknesses: unique([...race.weaknesses, ...weaknesses]),
    speed: race.speed,
    threat: calculateCharacterThreat({ level: normalizedLevel, maxHp, defense, skills, spells, equipment })
  };
}

export function getClassRecommendedAllocations(classId = "warrior") {
  const classDef = getClass(classId);
  return { ...CLASS_RECOMMENDED_ALLOCATIONS[classDef.id] };
}

export function listCharacterCreationPresets() {
  return Object.values(CLASSES).map((classDef) => ({
    id: classDef.id,
    classId: classDef.id,
    name: classDef.name,
    label: { ...CLASS_LABELS[classDef.id] },
    allocations: getClassRecommendedAllocations(classDef.id),
    startingEquipment: [...classDef.startingEquipment],
    knownSpells: [...classDef.knownSpells],
    actions: [...classDef.actions]
  }));
}

export function calculateSkills({ attributes, classDef, race, level = 1 }) {
  const pb = proficiencyBonus(level);
  const skills = {};

  for (const [skill, attribute] of Object.entries(SKILLS)) {
    const trained = classDef.skillProficiencies.includes(skill) ? pb : 0;
    const ancestry = race.skillBonuses[skill] ?? 0;
    skills[skill] = abilityModifier(attributes[attribute]) + trained + ancestry;
  }

  return skills;
}

export function calculateDefense({ agilityModifier, equipment = [] }) {
  const armor = equipment.filter((item) => item.kind === "armor");
  const shields = equipment.filter((item) => item.kind === "shield");
  const agilityCap = armor
    .map((item) => item.agilityCap)
    .filter((value) => Number.isInteger(value))
    .reduce((lowest, value) => Math.min(lowest, value), Number.POSITIVE_INFINITY);
  const cappedAgility = Number.isFinite(agilityCap) ? Math.min(agilityModifier, agilityCap) : agilityModifier;
  const armorBonus = armor.reduce((sum, item) => sum + item.defenseBonus, 0);
  const shieldBonus = shields.reduce((sum, item) => sum + item.defenseBonus, 0);
  return 10 + cappedAgility + armorBonus + shieldBonus;
}

export function resolveAttack({
  attacker,
  target,
  weaponId,
  spellId,
  mode = "normal",
  rng = Math.random,
  damageRng = rng
}) {
  const source = spellId ? getSpell(spellId) : getWeapon(weaponId ?? firstWeaponId(attacker));
  if (source.healing) {
    throw new Error("Healing spells must be resolved with resolveSpellEffect");
  }
  if (!source.damage) {
    return resolveNonDamageAction({ attacker, target, source, mode, rng });
  }

  const attackBonus = getAttackBonus(attacker, source);
  const attackRoll = rollDice(`1d20${formatSigned(attackBonus)}`, { mode, rng });
  const natural = attackRoll.kept[0];
  const critical = natural === 20;
  const criticalMiss = natural === 1;
  const targetDefense = normalizeTargetDefense(target);
  const hit = critical || (!criticalMiss && attackRoll.total >= targetDefense);
  const damageRoll = hit ? rollDamage(source.damage, { critical, rng: damageRng }) : null;
  const damage = hit
    ? resolveDamage({
      target,
      amount: damageRoll.total,
      damageType: source.damageType,
      critical
    })
    : {
      kind: "damage",
      baseAmount: 0,
      finalAmount: 0,
      damageType: source.damageType,
      modifiers: [],
      targetBefore: clone(target),
      targetAfter: clone(target),
      defeated: false
    };

  return {
    kind: "attack",
    attackerId: attacker.id,
    targetId: target.id,
    sourceId: source.id,
    sourceKind: source.kind,
    attackBonus,
    attackRoll,
    targetDefense,
    hit,
    critical,
    criticalMiss,
    damageRoll,
    damage
  };
}

export function resolveSpellEffect({ caster, target, spellId, mode = "normal", rng = Math.random }) {
  const spell = getSpell(spellId);
  if (spell.damage) {
    return resolveAttack({ attacker: caster, target, spellId, mode, rng });
  }
  if (spell.healing) {
    const roll = rollDice(spell.healing, { rng });
    const healing = resolveHealing({ target, amount: roll.total });
    return {
      kind: "spell",
      casterId: caster.id,
      targetId: target.id,
      spellId: spell.id,
      roll,
      healing
    };
  }
  return {
    kind: "spell",
    casterId: caster.id,
    targetId: target?.id ?? caster.id,
    spellId: spell.id,
    effect: clone(spell.effect ?? {}),
    targetAfter: applySupportEffect(target ?? caster, spell.effect ?? {})
  };
}

export function rollDamage(expression, { critical = false, rng = Math.random } = {}) {
  const roll = rollDice(expression, { rng });
  const diceTotal = roll.kept.reduce((sum, value) => sum + value, 0);
  return {
    ...roll,
    critical,
    total: critical ? diceTotal * 2 + roll.modifier : roll.total
  };
}

export function resolveDamage({ target, amount, damageType = "untyped", critical = false }) {
  const baseAmount = normalizeNonNegativeInteger(Math.floor(amount), "Damage amount");
  const targetBefore = clone(target);
  let finalAmount = baseAmount;
  const modifiers = [];
  const resistances = new Set(target.resistances ?? []);
  const weaknesses = new Set(target.weaknesses ?? []);

  if (resistances.has(damageType) || resistances.has("all")) {
    finalAmount = Math.floor(finalAmount / 2);
    modifiers.push({ type: "resistance", damageType });
  }
  if (weaknesses.has(damageType) || weaknesses.has("all")) {
    finalAmount *= 2;
    modifiers.push({ type: "weakness", damageType });
  }

  const currentHp = normalizeNonNegativeInteger(target.hp ?? target.maxHp ?? 0, "Target HP");
  const targetAfter = {
    ...clone(target),
    hp: Math.max(0, currentHp - finalAmount)
  };

  return {
    kind: "damage",
    critical,
    baseAmount,
    finalAmount,
    damageType,
    modifiers,
    targetBefore,
    targetAfter,
    defeated: targetAfter.hp === 0
  };
}

export function resolveHealing({ target, amount, allowOverheal = false }) {
  const baseAmount = normalizeNonNegativeInteger(Math.floor(amount), "Healing amount");
  const currentHp = normalizeNonNegativeInteger(target.hp ?? 0, "Target HP");
  const maxHp = normalizeNonNegativeInteger(target.maxHp ?? currentHp, "Target max HP");
  const healedHp = allowOverheal ? currentHp + baseAmount : Math.min(maxHp, currentHp + baseAmount);
  const finalAmount = healedHp - currentHp;

  return {
    kind: "healing",
    baseAmount,
    finalAmount,
    targetBefore: clone(target),
    targetAfter: {
      ...clone(target),
      hp: healedHp
    }
  };
}

export function listRuleKnowledgeSources() {
  return Object.values(RULE_KNOWLEDGE_SOURCES).map((source) => clone(source));
}

export function ruleKnowledgeAttribution() {
  return listRuleKnowledgeSources()
    .map((source) => `${source.title} (${source.license}) ${source.url}`)
    .join("; ");
}

export function resolveSeasonWeatherHooks({ scene = {}, weather = "", season = "", actionText = "", beat = "" } = {}) {
  const weatherText = normalizeKnowledgeText([
    weather,
    scene.weather,
    scene.weatherState,
    scene.atmosphere?.weather,
    scene.ambience,
    ...(scene.tags || []),
    actionText
  ].join(" "));
  const explicitSeasonKey = matchExplicitSeasonKey([
    scene.season,
    scene.atmosphere?.season,
    season,
    scene.calendar?.season,
    ...(scene.tags || []),
    ...(scene.atmosphere?.tags || []),
    ...(scene.atmosphere?.soundscapeTags || [])
  ]);
  const seasonText = normalizeKnowledgeText([
    season,
    scene.season,
    scene.calendar?.season,
    scene.atmosphere?.season,
    scene.ambience,
    ...(scene.tags || []),
    ...(scene.atmosphere?.tags || []),
    ...(scene.atmosphere?.soundscapeTags || []),
    actionText
  ].join(" "));
  const weatherKey = matchWeatherKey(weatherText);
  const seasonKey = explicitSeasonKey || matchSeasonKey(seasonText);
  const weatherHook = WEATHER_NARRATIVE_HOOKS[weatherKey];
  const seasonHook = SEASON_NARRATIVE_HOOKS[seasonKey];
  const pressure = beat === "crisis" || beat === "retaliation" || weatherKey === "storm" ? "high"
    : weatherKey === "clear" ? "open"
      : "moderate";

  return {
    weather: weatherHook.id,
    weatherLabel: { ...weatherHook.labels },
    season: seasonHook.id,
    seasonLabel: { ...seasonHook.labels },
    pressure,
    tags: unique([...weatherHook.tags, ...seasonHook.tags]),
    suggestedSkills: unique([...weatherHook.skills]),
    narrativeHooks: {
      en: `${seasonHook.prompt} ${weatherHook.prompt}`,
      zh: `${seasonHook.zhPrompt}${weatherHook.zhPrompt}`
    }
  };
}

export function suggestRuleActions({ character = null, actionText = "", maxSuggestions = 3 } = {}) {
  const intent = inferKnowledgeActionIntent(actionText);
  const trainedSkills = new Set(Object.entries(character?.skills || {})
    .filter(([, value]) => Number(value) >= 2)
    .map(([skill]) => skill));
  const classActions = new Set(character?.actions || []);
  const scored = SRD_STYLE_ACTION_SEEDS
    .map((seed) => ({
      seed,
      score: (seed.intents.includes(intent) ? 8 : seed.intents.includes("general") ? 3 : 0)
        + (trainedSkills.has(seed.skill) ? 3 : 0)
        + (classActions.has("attack") && seed.id === "force-opening" ? 1 : 0)
        + (classActions.has("defend") && seed.id === "hold-position" ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || a.seed.id.localeCompare(b.seed.id));

  return {
    intent,
    suggestions: scored.slice(0, maxSuggestions).map(({ seed, score }) => ({
      id: seed.id,
      skill: seed.skill,
      attribute: seed.attribute,
      prompt: seed.prompt,
      zhPrompt: seed.zhPrompt,
      risk: seed.risk,
      score
    }))
  };
}

export function buildRuleKnowledgeContext({
  room = {},
  scene = room.scene || {},
  player = null,
  actionText = "",
  check = null,
  beat = room.director?.beat || "hook",
  maxSuggestions = 3
} = {}) {
  const environment = resolveSeasonWeatherHooks({
    scene,
    weather: room.weather || room.mood?.weather,
    season: room.season || room.calendar?.season,
    actionText,
    beat
  });
  const actionGuidance = suggestRuleActions({
    character: player?.character || player,
    actionText,
    maxSuggestions
  });
  const sourceSummaries = listRuleKnowledgeSources().map((source) => ({
    id: source.id,
    title: source.title,
    url: source.url,
    license: source.license,
    useBoundary: source.useBoundary
  }));
  const randomness = buildImmersionRandomness({
    actionText,
    beat,
    check,
    weather: environment.weather,
    season: environment.season
  });
  const promptDirectives = [
    "Use SRD-style structure as inspiration, but only original AIDM wording and mechanics.",
    `Attribution boundary: ${sourceSummaries.map((source) => source.id).join(", ")} under CC-BY-4.0; do not quote long rules text.`,
    `Environment hook: ${environment.weatherLabel.en} during ${environment.seasonLabel.en}; ${environment.narrativeHooks.en}`,
    `Player guidance: ${actionGuidance.suggestions[0]?.prompt || "Ask for a concrete objective and method."}`,
    `Randomness hook: ${randomness.selectedHook}`
  ];

  return {
    framework: "repo-local-srd-style",
    sources: sourceSummaries,
    attribution: ruleKnowledgeAttribution(),
    licenseBoundary: "CC-BY-4.0 attribution kept; no long SRD text or proprietary setting text is embedded.",
    environment,
    actionGuidance,
    randomness,
    tags: unique([
      "knowledge:srd-style",
      `beat:${beat}`,
      `weather:${environment.weather}`,
      `season:${environment.season}`,
      `intent:${actionGuidance.intent}`,
      ...environment.tags
    ]),
    promptDirectives
  };
}

export function getRace(id) {
  return requireKnown(RACES, id, "race");
}

export function getClass(id) {
  return requireKnown(CLASSES, id, "class");
}

export function getWeapon(id) {
  return requireKnown(WEAPONS, id, "weapon");
}

export function getSpell(id) {
  return requireKnown(SPELLS, id, "spell");
}

export function getEquipment(id) {
  return requireKnown(EQUIPMENT, id, "equipment");
}

function matchWeatherKey(text) {
  if (/storm|thunder|lightning|雷|风暴|暴风/.test(text)) return "storm";
  if (/snow|ice|frost|雪|冰|霜/.test(text)) return "snow";
  if (/fog|mist|雾/.test(text)) return "fog";
  if (/wind|gale|breeze|风/.test(text)) return "wind";
  if (/rain|drizzle|downpour|wet|雨|潮湿/.test(text)) return "rain";
  if (/clear|sun|bright|晴|日光|阳光/.test(text)) return "clear";
  return "rain";
}

function matchExplicitSeasonKey(values) {
  for (const value of values) {
    const text = normalizeKnowledgeText(value);
    if (!text) continue;
    if (/\b(?:season:)?winter\b|冬/.test(text)) return "winter";
    if (/\b(?:season:)?spring\b|春/.test(text)) return "spring";
    if (/\b(?:season:)?summer\b|夏/.test(text)) return "summer";
    if (/\b(?:season:)?autumn\b|\b(?:season:)?fall\b|秋/.test(text)) return "autumn";
  }
  return null;
}

function matchSeasonKey(text) {
  if (/winter|cold|frost|冬|寒/.test(text)) return "winter";
  if (/autumn|fall|harvest|leaf|leaves|秋|收获|落叶/.test(text)) return "autumn";
  if (/summer|heat|hot|夏|炎|热/.test(text)) return "summer";
  if (/spring|thaw|bloom|春|花|融雪/.test(text)) return "spring";
  return "autumn";
}

function inferKnowledgeActionIntent(actionText) {
  const text = normalizeKnowledgeText(actionText);
  if (/attack|strike|stab|shoot|cast|攻击|打击|射击|施法/.test(text)) return "hostile";
  if (/guard|defend|protect|shield|守|挡|保护|防御/.test(text)) return "guard";
  if (/travel|move|follow|track|route|前往|移动|追踪|路线|离开/.test(text)) return "travel";
  if (/hide|sneak|ambush|潜行|躲|埋伏/.test(text)) return "stealth";
  if (/convince|bargain|lie|threaten|ask|talk|说服|谈判|威胁|询问/.test(text)) return "social";
  if (/search|inspect|investigate|study|decode|调查|搜索|查看|研究|解码/.test(text)) return "investigate";
  return "general";
}

function buildImmersionRandomness({ actionText, beat, check, weather, season }) {
  const hooks = [
    "an overlooked witness changes the direction of the next question",
    "a small environmental detail turns into leverage",
    "the same clue points to two routes with different costs",
    "an NPC reveals a desire before revealing a fact",
    "the location answers the action with motion, sound, or pressure",
    "a failed attempt creates a bargain instead of a dead end"
  ];
  const seed = stableHash([actionText, beat, check?.total, check?.dc, weather, season].join("|"));
  const selectedHook = hooks[seed % hooks.length];
  const margin = Number(check?.total) - Number(check?.dc);
  return {
    mode: "deterministic-table",
    seed,
    selectedHook,
    twistPressure: Number.isFinite(margin) && margin < 0 ? "complication" : "opportunity",
    table: hooks
  };
}

function normalizeKnowledgeText(value) {
  return String(value || "").toLowerCase();
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function calculateMaxHp({ classDef, race, level, bodyModifier }) {
  const firstLevel = classDef.baseHp + race.hpBonus + bodyModifier;
  const levelGain = Math.max(1, Math.ceil(classDef.hitDie / 2) + Math.max(0, bodyModifier));
  return Math.max(1, firstLevel + (level - 1) * levelGain);
}

function calculateCharacterThreat({ level, maxHp, defense, skills, spells, equipment }) {
  const bestAttack = Math.max(
    0,
    ...equipment.filter((item) => item.kind === "weapon").map((item) => skills[item.skill] ?? 0),
    ...spells.map((spell) => skills[spell.skill] ?? 0)
  );
  return Math.max(1, Math.round(level + maxHp / 10 + (defense - 10) / 3 + bestAttack / 3));
}

function resolveEquipment(ids) {
  return unique(ids).map(getEquipment);
}

function resolveSpells(ids) {
  return unique(ids).map(getSpell);
}

function getAttackBonus(attacker, source) {
  if (attacker.skills && Number.isInteger(attacker.skills[source.skill])) {
    return attacker.skills[source.skill];
  }
  if (attacker.modifiers && Number.isInteger(attacker.modifiers[source.attackAttribute])) {
    return attacker.modifiers[source.attackAttribute] + (attacker.proficiencyBonus ?? 0);
  }
  if (attacker.attributes && Number.isInteger(attacker.attributes[source.attackAttribute])) {
    return abilityModifier(attacker.attributes[source.attackAttribute]) + (attacker.proficiencyBonus ?? 0);
  }
  return attacker.attackBonus ?? 0;
}

function resolveNonDamageAction({ attacker, target, source, mode, rng }) {
  const attackBonus = getAttackBonus(attacker, source);
  const attackRoll = rollDice(`1d20${formatSigned(attackBonus)}`, { mode, rng });
  const targetDefense = normalizeTargetDefense(target);
  const natural = attackRoll.kept[0];
  return {
    kind: "attack",
    attackerId: attacker.id,
    targetId: target.id,
    sourceId: source.id,
    sourceKind: source.kind,
    attackBonus,
    attackRoll,
    targetDefense,
    hit: natural === 20 || (natural !== 1 && attackRoll.total >= targetDefense),
    critical: natural === 20,
    criticalMiss: natural === 1,
    damageRoll: null,
    damage: null
  };
}

function applySupportEffect(target, effect) {
  const cloned = clone(target);
  if (Number.isInteger(effect.defenseBonus)) {
    cloned.defense = (cloned.defense ?? 10) + effect.defenseBonus;
  }
  if (effect.condition) {
    cloned.conditions = unique([...(cloned.conditions ?? []), effect.condition]);
  }
  return cloned;
}

function firstWeaponId(character) {
  const id = character.weapons?.[0] ?? character.equipment?.find((itemId) => WEAPONS[itemId]);
  if (!id) {
    throw new Error("No weapon available for attack");
  }
  return id;
}

function normalizeTargetDefense(target) {
  return normalizePositiveInteger(target.defense ?? target.ac ?? 10, "Target defense");
}

function mapAttributes(scores, mapper) {
  const mapped = {};
  for (const key of ATTRIBUTE_KEYS) {
    mapped[key] = mapper(scores[key]);
  }
  return mapped;
}

function normalizeAttributeMap(input, fallback) {
  const output = {};
  for (const key of ATTRIBUTE_KEYS) {
    output[key] = input[key] ?? fallback;
  }
  return output;
}

function freezeAttributeAllocation(input) {
  return Object.freeze(normalizeAttributeMap(input, 0));
}

function requireKnown(map, id, kind) {
  const value = map[id];
  if (!value) {
    throw new Error(`Unknown ${kind}: ${id}`);
  }
  return value;
}

function normalizePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function normalizeNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function formatSigned(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "character";
}
