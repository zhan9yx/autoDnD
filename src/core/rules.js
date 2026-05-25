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
    knownSpells: Object.freeze(["firebolt", "sleep", "arcane-shield", "glass-echo", "storm-arc"]),
    actions: Object.freeze(["attack", "cast", "defend"])
  }),
  cleric: Object.freeze({
    id: "cleric",
    name: "Cleric",
    baseHp: 10,
    hitDie: 8,
    skillProficiencies: Object.freeze(["medicine", "insight", "guard", "persuasion"]),
    startingEquipment: Object.freeze(["mace", "shield", "leather"]),
    knownSpells: Object.freeze(["healing-word", "radiant-bolt", "ward", "cleanse-poison"]),
    actions: Object.freeze(["attack", "cast", "support", "defend"])
  }),
  ranger: Object.freeze({
    id: "ranger",
    name: "Ranger",
    baseHp: 10,
    hitDie: 8,
    skillProficiencies: Object.freeze(["ranged", "survival", "stealth", "medicine"]),
    startingEquipment: Object.freeze(["shortbow", "dagger", "leather"]),
    knownSpells: Object.freeze(["binding-vines", "frost-bind"]),
    actions: Object.freeze(["attack", "cast", "defend", "flee"])
  }),
  bard: Object.freeze({
    id: "bard",
    name: "Bard",
    baseHp: 8,
    hitDie: 8,
    skillProficiencies: Object.freeze(["persuasion", "insight", "stealth", "medicine"]),
    startingEquipment: Object.freeze(["dagger", "leather"]),
    knownSpells: Object.freeze(["healing-word", "sleep", "glass-echo"]),
    actions: Object.freeze(["attack", "cast", "support", "defend"])
  }),
  occultist: Object.freeze({
    id: "occultist",
    name: "Occultist",
    baseHp: 8,
    hitDie: 6,
    skillProficiencies: Object.freeze(["arcana", "investigation", "intimidation", "insight"]),
    startingEquipment: Object.freeze(["staff", "robe"]),
    knownSpells: Object.freeze(["firebolt", "sleep", "binding-vines", "thunder-step"]),
    actions: Object.freeze(["attack", "cast", "defend", "flee"])
  }),
  envoy: Object.freeze({
    id: "envoy",
    name: "Envoy",
    baseHp: 9,
    hitDie: 8,
    skillProficiencies: Object.freeze(["persuasion", "insight", "guard", "medicine"]),
    startingEquipment: Object.freeze(["dagger", "shield", "leather"]),
    knownSpells: Object.freeze(["ward", "glass-echo"]),
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
  "etched-war-axe": Object.freeze({
    id: "etched-war-axe",
    name: "Etched War Axe",
    kind: "weapon",
    category: "melee",
    skill: "melee",
    attackAttribute: "body",
    damage: "1d10+1",
    damageType: "slashing",
    range: 1,
    tags: Object.freeze(["martial", "heavy", "axe", "market"])
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

export const SPELL_CATEGORIES = Object.freeze({
  damage: Object.freeze({ id: "damage", label: Object.freeze({ en: "Damage", zh: "伤害" }) }),
  control: Object.freeze({ id: "control", label: Object.freeze({ en: "Control", zh: "控制" }) }),
  protection: Object.freeze({ id: "protection", label: Object.freeze({ en: "Protection", zh: "防护" }) }),
  scouting: Object.freeze({ id: "scouting", label: Object.freeze({ en: "Scouting", zh: "侦察" }) }),
  healing: Object.freeze({ id: "healing", label: Object.freeze({ en: "Healing", zh: "治疗" }) }),
  movement: Object.freeze({ id: "movement", label: Object.freeze({ en: "Movement", zh: "移动" }) }),
  ritual: Object.freeze({ id: "ritual", label: Object.freeze({ en: "Ritual", zh: "仪式" }) })
});

const SPELL_LABELS = Object.freeze({
  firebolt: Object.freeze({ en: "Firebolt", zh: "火矢" }),
  "radiant-bolt": Object.freeze({ en: "Radiant Bolt", zh: "辉光箭" }),
  "healing-word": Object.freeze({ en: "Healing Word", zh: "回春短句" }),
  ward: Object.freeze({ en: "Ward", zh: "守护印" }),
  sleep: Object.freeze({ en: "Sleep", zh: "沉眠咒" }),
  "arcane-shield": Object.freeze({ en: "Arcane Shield", zh: "奥术护盾" }),
  "binding-vines": Object.freeze({ en: "Binding Vines", zh: "缚藤术" }),
  "cleanse-poison": Object.freeze({ en: "Cleanse Poison", zh: "净毒术" }),
  "frost-bind": Object.freeze({ en: "Frost Bind", zh: "霜缚" }),
  "glass-echo": Object.freeze({ en: "Glass Echo", zh: "琉璃回声" }),
  "storm-arc": Object.freeze({ en: "Storm Arc", zh: "风暴弧光" }),
  "thunder-step": Object.freeze({ en: "Thunder Step", zh: "雷步" }),
  "grave-whisper": Object.freeze({ en: "Grave Whisper", zh: "墓语" }),
  "iron-oath": Object.freeze({ en: "Iron Oath", zh: "铁誓" }),
  "lantern-sigil": Object.freeze({ en: "Lantern Sigil", zh: "提灯符印" }),
  "blood-moon-hex": Object.freeze({ en: "Blood Moon Hex", zh: "血月咒" }),
  tidecall: Object.freeze({ en: "Tidecall", zh: "潮唤" }),
  "clockwork-snare": Object.freeze({ en: "Clockwork Snare", zh: "机簧陷索" }),
  "starfall-rune": Object.freeze({ en: "Starfall Rune", zh: "星坠符文" }),
  "ember-lance": Object.freeze({ en: "Ember Lance", zh: "余烬长矛" }),
  "moonlit-shear": Object.freeze({ en: "Moonlit Shear", zh: "月辉斩线" }),
  "hush-ring": Object.freeze({ en: "Hush Ring", zh: "静默环" }),
  "mirror-lure": Object.freeze({ en: "Mirror Lure", zh: "镜诱" }),
  "bastion-mark": Object.freeze({ en: "Bastion Mark", zh: "壁垒印记" }),
  "veil-of-rain": Object.freeze({ en: "Veil of Rain", zh: "雨幕帷" }),
  "field-suture": Object.freeze({ en: "Field Suture", zh: "战地缝光" }),
  "steady-breath": Object.freeze({ en: "Steady Breath", zh: "定息祷言" }),
  "mist-bridge": Object.freeze({ en: "Mist Bridge", zh: "雾桥" }),
  "gale-hook": Object.freeze({ en: "Gale Hook", zh: "疾风钩" }),
  "echo-ledger": Object.freeze({ en: "Echo Ledger", zh: "回声账页" }),
  "threshold-circle": Object.freeze({ en: "Threshold Circle", zh: "门槛法阵" }),
  "omen-map": Object.freeze({ en: "Omen Map", zh: "兆象地图" })
});

export const SPELLS = Object.freeze({
  firebolt: Object.freeze({
    id: "firebolt",
    name: "Firebolt",
    kind: "spell",
    action: "cast",
    category: "damage",
    school: "evocation",
    skill: "arcana",
    damage: "1d10",
    damageType: "fire",
    resource: Object.freeze({ manaCost: 0, tier: 0 }),
    range: 8,
    tags: Object.freeze(["attack", "damage", "cantrip"])
  }),
  "radiant-bolt": Object.freeze({
    id: "radiant-bolt",
    name: "Radiant Bolt",
    kind: "spell",
    action: "cast",
    category: "damage",
    school: "divine",
    skill: "medicine",
    damage: "1d8+2",
    damageType: "radiant",
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["attack", "damage", "divine"])
  }),
  "healing-word": Object.freeze({
    id: "healing-word",
    name: "Healing Word",
    kind: "spell",
    action: "support",
    category: "healing",
    school: "divine",
    skill: "medicine",
    healing: "1d8+3",
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["healing", "support"])
  }),
  ward: Object.freeze({
    id: "ward",
    name: "Ward",
    kind: "spell",
    action: "support",
    category: "protection",
    school: "abjuration",
    skill: "medicine",
    effect: Object.freeze({ defenseBonus: 2, durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 4,
    tags: Object.freeze(["support", "defense"])
  }),
  sleep: Object.freeze({
    id: "sleep",
    name: "Sleep",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "enchantment",
    skill: "arcana",
    effect: Object.freeze({ condition: "drowsy", dcAttribute: "spirit" }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["control", "mental"])
  }),
  "arcane-shield": Object.freeze({
    id: "arcane-shield",
    name: "Arcane Shield",
    kind: "spell",
    action: "defend",
    category: "protection",
    school: "abjuration",
    skill: "arcana",
    effect: Object.freeze({ defenseBonus: 3, durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 0,
    tags: Object.freeze(["defense", "reaction"])
  }),
  "binding-vines": Object.freeze({
    id: "binding-vines",
    name: "Binding Vines",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "nature",
    skill: "survival",
    effect: Object.freeze({ condition: "restrained", dcAttribute: "body" }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["control", "nature"])
  }),
  "cleanse-poison": Object.freeze({
    id: "cleanse-poison",
    name: "Cleanse Poison",
    kind: "spell",
    action: "support",
    category: "healing",
    school: "restoration",
    skill: "medicine",
    effect: Object.freeze({ removeConditions: Object.freeze(["poisoned"]), resistance: "poison", durationRounds: 3 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 4,
    tags: Object.freeze(["support", "restoration", "condition"])
  }),
  "frost-bind": Object.freeze({
    id: "frost-bind",
    name: "Frost Bind",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "evocation",
    skill: "survival",
    effect: Object.freeze({ condition: "slowed", dcAttribute: "body", durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 6,
    tags: Object.freeze(["control", "cold", "terrain"])
  }),
  "glass-echo": Object.freeze({
    id: "glass-echo",
    name: "Glass Echo",
    kind: "spell",
    action: "support",
    category: "scouting",
    school: "illusion",
    skill: "arcana",
    effect: Object.freeze({ skillBonus: Object.freeze({ investigation: 2 }), durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 5,
    tags: Object.freeze(["utility", "illusion", "investigation"])
  }),
  "storm-arc": Object.freeze({
    id: "storm-arc",
    name: "Storm Arc",
    kind: "spell",
    action: "cast",
    category: "damage",
    school: "evocation",
    skill: "arcana",
    damage: "1d8+1",
    damageType: "lightning",
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["attack", "damage", "lightning"])
  }),
  "thunder-step": Object.freeze({
    id: "thunder-step",
    name: "Thunder Step",
    kind: "spell",
    action: "move",
    category: "movement",
    school: "transmutation",
    skill: "arcana",
    effect: Object.freeze({ speedBonus: 3, disengage: true, durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 3, tier: 2 }),
    range: 0,
    tags: Object.freeze(["movement", "escape", "thunder"])
  }),
  "grave-whisper": Object.freeze({
    id: "grave-whisper",
    name: "Grave Whisper",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "necromancy",
    skill: "arcana",
    effect: Object.freeze({ condition: "shaken", dcAttribute: "spirit", durationRounds: 2 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 5,
    tags: Object.freeze(["control", "necrotic", "mental"])
  }),
  "iron-oath": Object.freeze({
    id: "iron-oath",
    name: "Iron Oath",
    kind: "spell",
    action: "support",
    category: "protection",
    school: "abjuration",
    skill: "guard",
    effect: Object.freeze({ temporaryHp: 5, resistance: "fear", durationRounds: 2 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 3,
    tags: Object.freeze(["support", "defense", "buff"])
  }),
  "lantern-sigil": Object.freeze({
    id: "lantern-sigil",
    name: "Lantern Sigil",
    kind: "spell",
    action: "support",
    category: "scouting",
    school: "divination",
    skill: "investigation",
    effect: Object.freeze({ skillBonus: Object.freeze({ investigation: 2, insight: 1 }), durationRounds: 2 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 4,
    tags: Object.freeze(["utility", "divination", "light"])
  }),
  "blood-moon-hex": Object.freeze({
    id: "blood-moon-hex",
    name: "Blood Moon Hex",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "enchantment",
    skill: "intimidation",
    effect: Object.freeze({ condition: "cursed", dcAttribute: "spirit", durationRounds: 2 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["control", "curse", "mental"])
  }),
  tidecall: Object.freeze({
    id: "tidecall",
    name: "Tidecall",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "conjuration",
    skill: "survival",
    effect: Object.freeze({ condition: "slowed", dcAttribute: "agility", durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 6,
    tags: Object.freeze(["control", "water", "terrain"])
  }),
  "clockwork-snare": Object.freeze({
    id: "clockwork-snare",
    name: "Clockwork Snare",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "transmutation",
    skill: "arcana",
    effect: Object.freeze({ condition: "restrained", dcAttribute: "agility", durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 5,
    tags: Object.freeze(["control", "mechanism", "restraint"])
  }),
  "starfall-rune": Object.freeze({
    id: "starfall-rune",
    name: "Starfall Rune",
    kind: "spell",
    action: "cast",
    category: "damage",
    school: "evocation",
    skill: "arcana",
    damage: "2d6",
    damageType: "radiant",
    resource: Object.freeze({ manaCost: 3, tier: 2 }),
    range: 7,
    tags: Object.freeze(["attack", "damage", "area", "radiant"])
  }),
  "ember-lance": Object.freeze({
    id: "ember-lance",
    name: "Ember Lance",
    kind: "spell",
    action: "cast",
    category: "damage",
    school: "evocation",
    skill: "arcana",
    damage: "1d8+2",
    damageType: "fire",
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 7,
    tags: Object.freeze(["attack", "damage", "fire", "precision"])
  }),
  "moonlit-shear": Object.freeze({
    id: "moonlit-shear",
    name: "Moonlit Shear",
    kind: "spell",
    action: "cast",
    category: "damage",
    school: "evocation",
    skill: "stealth",
    damage: "1d6+3",
    damageType: "radiant",
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 5,
    tags: Object.freeze(["attack", "damage", "radiant", "stealth"])
  }),
  "hush-ring": Object.freeze({
    id: "hush-ring",
    name: "Hush Ring",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "enchantment",
    skill: "insight",
    effect: Object.freeze({ condition: "silenced", dcAttribute: "presence", durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 5,
    tags: Object.freeze(["control", "mental", "silence"])
  }),
  "mirror-lure": Object.freeze({
    id: "mirror-lure",
    name: "Mirror Lure",
    kind: "spell",
    action: "cast",
    category: "control",
    school: "illusion",
    skill: "persuasion",
    effect: Object.freeze({ condition: "distracted", dcAttribute: "mind", durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 5,
    tags: Object.freeze(["control", "illusion", "social"])
  }),
  "bastion-mark": Object.freeze({
    id: "bastion-mark",
    name: "Bastion Mark",
    kind: "spell",
    action: "support",
    category: "protection",
    school: "abjuration",
    skill: "guard",
    effect: Object.freeze({ defenseBonus: 2, temporaryHp: 3, durationRounds: 2 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 3,
    tags: Object.freeze(["support", "defense", "frontline"])
  }),
  "veil-of-rain": Object.freeze({
    id: "veil-of-rain",
    name: "Veil of Rain",
    kind: "spell",
    action: "support",
    category: "protection",
    school: "illusion",
    skill: "stealth",
    effect: Object.freeze({ skillBonus: Object.freeze({ stealth: 2, guard: 1 }), durationRounds: 2 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 4,
    tags: Object.freeze(["support", "defense", "stealth", "weather"])
  }),
  "field-suture": Object.freeze({
    id: "field-suture",
    name: "Field Suture",
    kind: "spell",
    action: "support",
    category: "healing",
    school: "restoration",
    skill: "medicine",
    healing: "1d6+2",
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 2,
    tags: Object.freeze(["healing", "support", "battlefield"])
  }),
  "steady-breath": Object.freeze({
    id: "steady-breath",
    name: "Steady Breath",
    kind: "spell",
    action: "support",
    category: "healing",
    school: "restoration",
    skill: "medicine",
    effect: Object.freeze({ removeConditions: Object.freeze(["shaken", "drowsy", "silenced"]), temporaryHp: 2, durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 1, tier: 1 }),
    range: 3,
    tags: Object.freeze(["healing", "support", "condition"])
  }),
  "mist-bridge": Object.freeze({
    id: "mist-bridge",
    name: "Mist Bridge",
    kind: "spell",
    action: "move",
    category: "movement",
    school: "conjuration",
    skill: "survival",
    effect: Object.freeze({ speedBonus: 2, ignoreDifficultTerrain: true, durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 4,
    tags: Object.freeze(["movement", "terrain", "escape"])
  }),
  "gale-hook": Object.freeze({
    id: "gale-hook",
    name: "Gale Hook",
    kind: "spell",
    action: "move",
    category: "movement",
    school: "transmutation",
    skill: "athletics",
    effect: Object.freeze({ speedBonus: 3, reposition: true, durationRounds: 1 }),
    resource: Object.freeze({ manaCost: 2, tier: 1 }),
    range: 5,
    tags: Object.freeze(["movement", "forced-move", "wind"])
  }),
  "echo-ledger": Object.freeze({
    id: "echo-ledger",
    name: "Echo Ledger",
    kind: "spell",
    action: "support",
    category: "ritual",
    school: "divination",
    skill: "investigation",
    effect: Object.freeze({ skillBonus: Object.freeze({ investigation: 3, arcana: 1 }), ritualMinutes: 10, durationRounds: 3 }),
    resource: Object.freeze({ manaCost: 2, tier: 2 }),
    range: 0,
    tags: Object.freeze(["utility", "ritual", "investigation", "memory"])
  }),
  "threshold-circle": Object.freeze({
    id: "threshold-circle",
    name: "Threshold Circle",
    kind: "spell",
    action: "support",
    category: "ritual",
    school: "abjuration",
    skill: "guard",
    effect: Object.freeze({ defenseBonus: 1, resistance: "fear", ritualMinutes: 10, durationRounds: 3 }),
    resource: Object.freeze({ manaCost: 2, tier: 2 }),
    range: 0,
    tags: Object.freeze(["utility", "ritual", "defense", "ward"])
  }),
  "omen-map": Object.freeze({
    id: "omen-map",
    name: "Omen Map",
    kind: "spell",
    action: "support",
    category: "ritual",
    school: "divination",
    skill: "survival",
    effect: Object.freeze({ skillBonus: Object.freeze({ survival: 2, insight: 1 }), ritualMinutes: 10, durationRounds: 3 }),
    resource: Object.freeze({ manaCost: 2, tier: 2 }),
    range: 0,
    tags: Object.freeze(["utility", "ritual", "route", "omen"])
  })
});

export const SPELLS_BY_CATEGORY = Object.freeze(Object.fromEntries(Object.keys(SPELL_CATEGORIES).map((categoryId) => [
  categoryId,
  Object.freeze(Object.values(SPELLS)
    .filter((spell) => spell.category === categoryId)
    .map((spell) => spell.id))
])));

export const EQUIPMENT = Object.freeze({
  ...WEAPONS,
  ...ARMOR
});

export const STARTER_SPELL_OPTIONS_BY_CLASS = Object.freeze({
  warrior: Object.freeze([]),
  rogue: Object.freeze([]),
  mage: freezeSpellOptions([
    ["firebolt", "pressure", "Reliable ranged fire pressure with no mana cost."],
    ["sleep", "control", "A first-scene control option against a vulnerable target."],
    ["arcane-shield", "defense", "A short defensive surge before impact."],
    ["glass-echo", "utility", "An investigative echo that makes hidden details easier to read."],
    ["storm-arc", "damage", "A lightning strike for wet, armored, or clustered threats."],
    ["lantern-sigil", "utility", "Mark a clue pattern so the next read of the scene lands cleaner."],
    ["starfall-rune", "area", "Commit scarce mana to a dramatic radiant strike when a cluster forms."],
    ["ember-lance", "damage", "Spend a little mana for precise fire pressure at range."],
    ["hush-ring", "control", "Cut off a caster, alarm, or shouted order for one decisive beat."],
    ["echo-ledger", "ritual", "Spend ritual time to make a memory, clue trail, or ledger pattern speak clearly."]
  ]),
  cleric: freezeSpellOptions([
    ["healing-word", "healing", "Ranged recovery for a wounded ally."],
    ["radiant-bolt", "damage", "Sacred ranged pressure against exposed foes."],
    ["ward", "defense", "A brief defense lift for the ally holding danger."],
    ["cleanse-poison", "restoration", "Remove poison pressure and grant short poison resistance."],
    ["iron-oath", "defense", "Bind an ally to a steadier stance with temporary resolve."],
    ["field-suture", "healing", "Close a small wound from the front line without ending the scene."],
    ["steady-breath", "restoration", "Clear panic, drowsiness, or silence with a short stabilizing prayer."],
    ["threshold-circle", "ritual", "Prepare a guarded boundary before a negotiation, rest, or ambush."]
  ]),
  ranger: freezeSpellOptions([
    ["binding-vines", "control", "Lock down a route, bridge, or fleeing target."],
    ["frost-bind", "terrain", "Slow a target by turning the ground and air against them."],
    ["tidecall", "terrain", "Pull water, mud, or loose ground into a movement problem."],
    ["mist-bridge", "movement", "Create a short route across broken ground or a dangerous gap."],
    ["gale-hook", "movement", "Move an ally, line, or loose object with a decisive burst of wind."],
    ["omen-map", "ritual", "Spend time reading weather, tracks, and omen signs before travel."]
  ]),
  bard: freezeSpellOptions([
    ["healing-word", "healing", "Keep an ally in the scene without stepping to the front line."],
    ["sleep", "control", "Quiet a weakened threat or interrupt a chaotic room."],
    ["glass-echo", "utility", "Turn performance timing into an investigative advantage."],
    ["lantern-sigil", "utility", "Frame the room so the party can read hidden social details."],
    ["blood-moon-hex", "control", "Make a dangerous opponent hesitate under a visible omen."],
    ["mirror-lure", "control", "Pull attention toward a false cue during a crowd or duel."],
    ["moonlit-shear", "damage", "Strike from rhythm, cover, or stage light with radiant pressure."],
    ["steady-breath", "healing", "Turn a phrase into a fast reset for a rattled ally."]
  ]),
  occultist: freezeSpellOptions([
    ["firebolt", "damage", "A simple destructive sign that works without setup."],
    ["sleep", "control", "Borrow silence from the edge of a failed will."],
    ["binding-vines", "control", "Bind a target with unnatural growth and omen-knots."],
    ["thunder-step", "movement", "Escape a collapsing position in a burst of force."],
    ["grave-whisper", "control", "Pressure a spirit or witness with a cold, unsettling command."],
    ["clockwork-snare", "control", "Lock a foe in a short-lived mechanical pattern."],
    ["hush-ring", "control", "Make a forbidden word, alarm, or command fail at the critical moment."],
    ["mirror-lure", "control", "Use false reflection and desire to pull a foe out of position."],
    ["omen-map", "ritual", "Translate strange signs into a route or warning the table can act on."]
  ]),
  envoy: freezeSpellOptions([
    ["ward", "defense", "Protect a speaker, witness, or ally during a tense exchange."],
    ["glass-echo", "utility", "Read the room by making small tells repeat."],
    ["iron-oath", "defense", "Give the front-line negotiator a visible promise to hold position."],
    ["lantern-sigil", "utility", "Turn testimony and evidence into a clearer next question."],
    ["bastion-mark", "defense", "Mark the ally who must stay standing while others reposition."],
    ["mirror-lure", "social", "Create a harmless false focus that changes who speaks next."],
    ["threshold-circle", "ritual", "Define neutral ground before a bargain, hearing, or standoff."]
  ])
});

export const WARRIOR_SPECIALIZATIONS = Object.freeze({
  "dual-wielder": freezeWarriorSpecialization({
    id: "dual-wielder",
    aliases: ["dual-wield", "two-weapon", "two weapon", "paired blades", "双持", "双武器"],
    name: "Dual Wielder",
    label: { en: "Dual Wielder", zh: "双持战士" },
    role: "mobile-striker",
    recommendedAttributes: ["agility", "body"],
    attributeBonuses: { agility: 1 },
    skillBonuses: { melee: 1, stealth: 1 },
    equipment: ["dagger"],
    defenseBonus: 0,
    impact: {
      attributes: "Agility improves initiative, light-weapon accuracy fallback, and stealth angles.",
      skills: "Melee and stealth push the character toward flanking and off-hand pressure.",
      equipment: "Adds a light dagger so light-tag combat bonuses have a legal source.",
      actions: "Off-hand and split-pressure actions reward moving between exposed targets."
    },
    combatBonuses: {
      attack: [{ amount: 1, tags: ["light"] }],
      damage: [{ amount: 1, tags: ["light"] }]
    },
    tiers: [
      { level: 1, features: ["paired-weapon-cadence"], actions: ["offhand-attack"], resources: { momentum: { max: 1, recovery: "short-rest" } } },
      { level: 3, features: ["cross-cut"], actions: ["cross-cut"] },
      { level: 5, features: ["split-pressure"], actions: ["split-pressure"] }
    ]
  }),
  berserker: freezeWarriorSpecialization({
    id: "berserker",
    aliases: ["berserk", "rage", "狂战", "狂战士"],
    name: "Berserker",
    label: { en: "Berserker", zh: "狂战士" },
    role: "reckless-breaker",
    recommendedAttributes: ["body", "spirit"],
    attributeBonuses: { body: 1, spirit: 1 },
    skillBonuses: { melee: 1, intimidation: 1 },
    equipment: ["etched-war-axe"],
    defenseBonus: -1,
    resistances: ["fear"],
    impact: {
      attributes: "Body raises hit points and melee pressure; spirit helps the warrior stay in the scene under fear or pain.",
      skills: "Melee and intimidation support direct challenges, forced openings, and morale pressure.",
      equipment: "Adds a heavy axe that benefits from melee damage bonuses.",
      actions: "Reckless and relentless actions trade defense for clear offensive tempo."
    },
    combatBonuses: {
      attack: [{ amount: 1, category: "melee" }],
      damage: [{ amount: 2, category: "melee" }]
    },
    tiers: [
      { level: 1, features: ["fury-spark"], actions: ["reckless-strike"], resources: { fury: { max: 2, recovery: "long-rest" } } },
      { level: 3, features: ["break-line"], actions: ["break-line"] },
      { level: 5, features: ["relentless-advance"], actions: ["relentless-advance"] }
    ]
  }),
  "weapon-master": freezeWarriorSpecialization({
    id: "weapon-master",
    aliases: ["weaponmaster", "master-at-arms", "武器大师", "兵器大师"],
    name: "Weapon Master",
    label: { en: "Weapon Master", zh: "武器大师" },
    role: "precision-controller",
    recommendedAttributes: ["body", "mind"],
    attributeBonuses: { body: 1, mind: 1 },
    skillBonuses: { melee: 1, guard: 1 },
    equipment: ["red-tassel-spear"],
    defenseBonus: 0,
    impact: {
      attributes: "Body keeps attacks credible while mind supports reading openings and switching drills.",
      skills: "Melee and guard make reach weapons useful for both pressure and interception.",
      equipment: "Adds a reach spear so martial and reach bonuses can shape position.",
      actions: "Called shots and opening study turn enemy mistakes into targeted follow-up."
    },
    combatBonuses: {
      attack: [{ amount: 1, tags: ["martial", "reach"] }],
      damage: [{ amount: 1, tags: ["martial", "reach"] }]
    },
    tiers: [
      { level: 1, features: ["weapon-drill"], actions: ["called-shot"], resources: { focus: { max: 1, recovery: "short-rest" } } },
      { level: 3, features: ["mastery-swap"], actions: ["weapon-drill"] },
      { level: 5, features: ["opening-study"], actions: ["exploit-opening"] }
    ]
  }),
  defender: freezeWarriorSpecialization({
    id: "defender",
    aliases: ["guardian", "shieldbearer", "shield-bearer", "tank", "防御者", "守护者", "盾卫"],
    name: "Defender",
    label: { en: "Defender", zh: "防御者" },
    role: "frontline-guardian",
    recommendedAttributes: ["body", "spirit"],
    attributeBonuses: { body: 1, spirit: 1 },
    skillBonuses: { guard: 2, athletics: 1 },
    equipment: ["gilded-sun-buckler"],
    defenseBonus: 1,
    resistances: ["fear"],
    impact: {
      attributes: "Body raises hit points and shove resistance; spirit keeps the defender steady when allies panic.",
      skills: "Guard and athletics support blocking doors, taking space, and moving endangered allies.",
      equipment: "Adds a buckler that stacks with defensive positioning without forcing a damage-first style.",
      actions: "Interpose and shield-wall actions make protection a clear turn choice."
    },
    combatBonuses: {
      attack: [{ amount: 1, tags: ["shield"] }],
      damage: []
    },
    tiers: [
      { level: 1, features: ["guarded-stance"], actions: ["interpose"], resources: { guardDie: { max: 2, recovery: "short-rest" } } },
      { level: 3, features: ["shield-wall"], actions: ["shield-wall"] },
      { level: 5, features: ["hold-the-door"], actions: ["hold-the-door"] }
    ]
  }),
  "tactical-commander": freezeWarriorSpecialization({
    id: "tactical-commander",
    aliases: ["tactician", "commander", "battle-captain", "战术指挥", "指挥官", "战术家"],
    name: "Tactical Commander",
    label: { en: "Tactical Commander", zh: "战术指挥" },
    role: "team-enabler",
    recommendedAttributes: ["presence", "mind"],
    attributeBonuses: { presence: 1, mind: 1 },
    skillBonuses: { guard: 1, insight: 1, persuasion: 1 },
    equipment: ["oathguard-saber"],
    defenseBonus: 0,
    impact: {
      attributes: "Presence improves commands and negotiation pressure; mind supports reading the field.",
      skills: "Guard, insight, and persuasion make the warrior useful before initiative and during team turns.",
      equipment: "Adds a saber that keeps the commander competent when orders become melee.",
      actions: "Rally and mark-target actions translate ally positioning into a concrete next step."
    },
    combatBonuses: {
      attack: [{ amount: 1, tags: ["martial"] }],
      damage: []
    },
    tiers: [
      { level: 1, features: ["field-orders"], actions: ["rally"], resources: { command: { max: 2, recovery: "short-rest" } } },
      { level: 3, features: ["mark-target"], actions: ["mark-target"] },
      { level: 5, features: ["coordinated-surge"], actions: ["coordinated-surge"] }
    ]
  })
});

export const CLASS_LEVEL_PROGRESSIONS = Object.freeze({
  warrior: freezeProgression([
    { level: 1, features: ["fighting-style", "second-wind", "weapon-drills"], resources: { secondWind: { max: 2, recovery: "short-rest" } } },
    { level: 2, features: ["action-surge"], actions: ["action-surge"], resources: { actionSurge: { max: 1, recovery: "short-rest" } } },
    { level: 5, features: ["extra-attack"], actions: ["extra-attack"] }
  ]),
  rogue: freezeProgression([
    { level: 1, features: ["expertise", "quick-hands"] },
    { level: 2, features: ["cunning-action"], actions: ["quick-move"] },
    { level: 5, features: ["uncanny-guard"], actions: ["sidestep"] }
  ]),
  mage: freezeProgression([
    { level: 1, features: ["spellbook", "ritual-notes"] },
    { level: 2, features: ["arcane-recovery"], actions: ["recover-mana"], resources: { arcaneRecovery: { max: 1, recovery: "long-rest" } } },
    { level: 5, features: ["third-circle-prep"] }
  ]),
  cleric: freezeProgression([
    { level: 1, features: ["field-prayer", "warding-sign"] },
    { level: 2, features: ["channel-mercy"], actions: ["channel-mercy"], resources: { channelMercy: { max: 1, recovery: "short-rest" } } },
    { level: 5, features: ["steadfast-aura"] }
  ]),
  ranger: freezeProgression([
    { level: 1, features: ["favored-route", "trail-magic"] },
    { level: 2, features: ["fighting-style"], actions: ["mark-trail"] },
    { level: 5, features: ["extra-attack"], actions: ["extra-attack"] }
  ]),
  bard: freezeProgression([
    { level: 1, features: ["inspiration", "street-lore"], resources: { inspiration: { max: 2, recovery: "short-rest" } } },
    { level: 2, features: ["jack-of-trades"], actions: ["inspire"] },
    { level: 5, features: ["quick-inspiration"] }
  ]),
  occultist: freezeProgression([
    { level: 1, features: ["pact-mark", "omen-sense"] },
    { level: 2, features: ["eldritch-focus"], actions: ["read-omen"], resources: { omen: { max: 1, recovery: "long-rest" } } },
    { level: 5, features: ["deep-rite"] }
  ]),
  envoy: freezeProgression([
    { level: 1, features: ["commanding-presence", "field-accord"] },
    { level: 2, features: ["rally"], actions: ["rally"], resources: { rally: { max: 1, recovery: "short-rest" } } },
    { level: 5, features: ["steady-command"] }
  ])
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

export const DM_MOVE_PROMPT_SEEDS = Object.freeze([
  promptSeed({
    id: "frame-risk-before-roll",
    beats: ["hook", "discovery", "trail"],
    intents: ["general", "investigate", "travel"],
    pressure: ["open", "moderate"],
    prompt: "Name the visible risk, the likely skill, and the clock that may move before asking for the roll.",
    zhPrompt: "在要求掷骰前，先说出可见风险、可能技能，以及可能推进的时钟。",
    stateLever: "clock-preview"
  }),
  promptSeed({
    id: "offer-two-costed-routes",
    beats: ["trail", "revelation"],
    intents: ["travel", "investigate"],
    pressure: ["moderate", "high"],
    prompt: "Offer two routes with different costs: speed, safety, secrecy, supplies, or reputation.",
    zhPrompt: "给出两条代价不同的路线：速度、安全、隐秘、补给或名声。",
    stateLever: "route-choice"
  }),
  promptSeed({
    id: "turn-failure-into-bargain",
    beats: ["complication", "retaliation", "crisis"],
    intents: ["general", "social", "travel", "investigate", "hostile"],
    pressure: ["moderate", "high"],
    prompt: "Turn the miss into a bargain, exposed position, or ticking timer instead of a dead end.",
    zhPrompt: "把失败转成交易、暴露位置或倒计时，而不是死路。",
    stateLever: "recoverable-cost"
  }),
  promptSeed({
    id: "make-threat-visible",
    beats: ["retaliation", "crisis"],
    intents: ["hostile", "guard"],
    pressure: ["high"],
    prompt: "Show what the threat does next, then let combat or condition rules own the numbers.",
    zhPrompt: "先展示威胁下一步做什么，再让战斗或状态规则拥有数值。",
    stateLever: "rules-owned-threat"
  }),
  promptSeed({
    id: "spotlight-ally-opening",
    beats: ["discovery", "trail", "complication"],
    intents: ["guard", "social", "general"],
    pressure: ["open", "moderate", "high"],
    prompt: "Ask which ally benefits from the action and what opening becomes easier on their next turn.",
    zhPrompt: "询问哪名队友会受益，以及他们下回合哪个突破口会变容易。",
    stateLever: "team-position"
  })
]);

export const RANDOM_EVENT_PROMPT_SEEDS = Object.freeze([
  promptSeed({
    id: "weather-reveals-trace",
    weather: ["rain", "storm", "snow", "fog"],
    pressure: ["moderate", "high"],
    prompt: "The weather reveals one trace and hides another; ask which lead the party follows first.",
    zhPrompt: "天气显出一条痕迹、遮住另一条；询问队伍先追哪条线索。",
    clock: "clues",
    pressureDelta: 0
  }),
  promptSeed({
    id: "crowd-changes-tempo",
    season: ["summer", "autumn"],
    pressure: ["open", "moderate"],
    prompt: "A crowd, market, or patrol changes tempo; the party can blend in, confront it, or wait.",
    zhPrompt: "人群、市场或巡逻改变节奏；队伍可以混入、正面处理或等待。",
    clock: "deadline",
    pressureDelta: 1
  }),
  promptSeed({
    id: "shelter-has-price",
    weather: ["storm", "snow", "rain", "wind"],
    season: ["winter", "autumn"],
    pressure: ["moderate", "high"],
    prompt: "Shelter appears, but it asks for time, trust, coin, or a promise before safety is real.",
    zhPrompt: "庇护出现了，但真正安全前需要时间、信任、钱币或承诺。",
    clock: "deadline",
    pressureDelta: 1
  }),
  promptSeed({
    id: "old-debt-surfaces",
    season: ["autumn", "winter"],
    pressure: ["moderate", "high"],
    prompt: "An old debt or remembered favor surfaces and gives the next social move a concrete price.",
    zhPrompt: "旧债或旧恩浮出水面，让下一次社交行动有明确代价。",
    clock: "danger",
    pressureDelta: 1
  }),
  promptSeed({
    id: "clear-view-hard-choice",
    weather: ["clear", "wind"],
    pressure: ["open", "moderate"],
    prompt: "The view is clear enough to see both the objective and the cost of reaching it now.",
    zhPrompt: "视野足够清楚，目标和立刻抵达它的代价同时显露。",
    clock: "quest",
    pressureDelta: 0
  }),
  promptSeed({
    id: "omens-split-the-party-read",
    beats: ["revelation", "crisis"],
    pressure: ["high"],
    prompt: "Two signs point in different directions; choose between fast certainty and slower safety.",
    zhPrompt: "两个征兆指向不同方向；在快速确定与慢速安全之间选择。",
    clock: "quest",
    pressureDelta: 0
  })
]);

export const SPELL_ROLE_PROMPT_SEEDS = Object.freeze({
  damage: promptRole("damage", "Use damage magic when removing a threat matters more than learning from it.", "当移除威胁比从威胁身上获取信息更重要时，使用伤害法术。"),
  control: promptRole("control", "Use control magic to buy position, silence an alarm, or make a dangerous target spend a turn answering the scene.", "用控制法术购买位置、压住警报，或迫使危险目标花一回合回应场景。"),
  protection: promptRole("protection", "Use protection magic before the hit lands: name who is protected and what line stays intact.", "在打击落下前使用防护法术：说明保护谁，以及哪条防线仍然成立。"),
  scouting: promptRole("scouting", "Use scouting magic to turn vague suspicion into one testable clue or one excluded route.", "用侦察法术把模糊怀疑变成一条可验证线索或一条可排除路线。"),
  healing: promptRole("healing", "Use healing magic to keep someone in the scene; it should not erase the fictional cost that caused the wound.", "用治疗法术让角色留在场景里；它不应抹掉造成伤势的叙事代价。"),
  movement: promptRole("movement", "Use movement magic when position, distance, or terrain is the problem rather than hit points.", "当问题是位置、距离或地形而不是生命值时，使用移动法术。"),
  ritual: promptRole("ritual", "Use ritual magic when the table chooses time and preparation over immediate action.", "当牌桌选择时间与准备，而不是立刻行动时，使用仪式法术。")
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
  specializationId = null,
  classSpecializationId = null,
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
  const specialization = resolveClassSpecialization(classDef, classSpecializationId ?? specializationId);
  const normalizedLevel = normalizePositiveInteger(level, "Level");
  const attributes = allocateAttributes({ raceId, allocations });
  const specializationBonuses = specialization?.attributeBonuses || {};
  const attributeScores = applyAttributeBonuses(attributes.scores, specializationBonuses);
  const modifiers = mapAttributes(attributeScores, abilityModifier);
  const pb = proficiencyBonus(normalizedLevel);
  const equipment = resolveEquipment(equipmentIds ?? unique([...classDef.startingEquipment, ...(specialization?.equipment || [])]));
  const spells = resolveSpells(knownSpellIds ?? classDef.knownSpells);
  const maxHp = calculateMaxHp({ classDef, race, level: normalizedLevel, bodyModifier: modifiers.body });
  const defense = Math.max(1, calculateDefense({ agilityModifier: modifiers.agility, equipment }) + (specialization?.defenseBonus || 0));
  const skills = calculateSkills({
    attributes: attributeScores,
    classDef,
    race,
    level: normalizedLevel,
    skillBonuses: specialization?.skillBonuses || {}
  });
  const currentHp = hp === undefined ? maxHp : clamp(normalizeNonNegativeInteger(hp, "HP"), 0, maxHp);
  const progression = buildClassProgression({
    classId: classDef.id,
    level: normalizedLevel,
    specializationId: specialization?.id
  });
  const actions = unique([...classDef.actions, ...progression.actions, ...(spells.length > 0 ? ["cast"] : [])]);

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
    specialization: specialization ? specializationSnapshot(specialization, normalizedLevel) : null,
    className: classDef.name,
    classLabel: { ...CLASS_LABELS[classDef.id] },
    speciesLabel: { ...RACE_LABELS[race.id] },
    attributes: attributeScores,
    attributeBudget: {
      ...attributes,
      scores: attributeScores,
      specializationBonuses: normalizeAttributeMap(specializationBonuses, 0)
    },
    modifiers,
    proficiencyBonus: pb,
    skills,
    equipment: equipment.map((item) => item.id),
    weapons: equipment.filter((item) => item.kind === "weapon").map((item) => item.id),
    armor: equipment.filter((item) => item.kind === "armor" || item.kind === "shield").map((item) => item.id),
    knownSpells: spells.map((spell) => spell.id),
    actions,
    progression,
    resources: clone(progression.resources),
    combatBonuses: specialization ? clone(specialization.combatBonuses) : { attack: [], damage: [] },
    maxHp,
    hp: currentHp,
    defense,
    resistances: unique([...race.resistances, ...(specialization?.resistances || []), ...resistances]),
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
    starterSpellOptions: listStarterSpellOptions(classDef.id),
    specializationOptions: classDef.id === "warrior" ? listWarriorSpecializations({ level: 1 }) : [],
    actions: [...classDef.actions]
  }));
}

export function calculateSkills({ attributes, classDef, race, level = 1, skillBonuses = {} }) {
  const pb = proficiencyBonus(level);
  const skills = {};

  for (const [skill, attribute] of Object.entries(SKILLS)) {
    const trained = classDef.skillProficiencies.includes(skill) ? pb : 0;
    const ancestry = race.skillBonuses[skill] ?? 0;
    const specialization = skillBonuses[skill] ?? 0;
    skills[skill] = abilityModifier(attributes[attribute]) + trained + ancestry + specialization;
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

  const attackBonus = getAttackBonus(attacker, source) + getCombatSourceBonus(attacker, source, "attack");
  const attackRoll = rollDice(`1d20${formatSigned(attackBonus)}`, { mode, rng });
  const natural = attackRoll.kept[0];
  const critical = natural === 20;
  const criticalMiss = natural === 1;
  const targetDefense = normalizeTargetDefense(target);
  const hit = critical || (!criticalMiss && attackRoll.total >= targetDefense);
  const damageBonus = getCombatSourceBonus(attacker, source, "damage");
  const damageRoll = hit ? applyStaticDamageBonus(rollDamage(source.damage, { critical, rng: damageRng }), damageBonus) : null;
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
    sourceName: source.name,
    sourceLabel: source.kind === "spell" ? getSpellLabel(source.id) : { en: source.name, zh: source.name },
    sourceKind: source.kind,
    attackBonus,
    damageBonus,
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
    const attack = resolveAttack({ attacker: caster, target, spellId, mode, rng });
    return {
      ...attack,
      action: spell.action,
      resource: clone(spell.resource || {})
    };
  }
  if (spell.healing) {
    const roll = rollDice(spell.healing, { rng });
    const healing = resolveHealing({ target, amount: roll.total });
    return {
      kind: "spell",
      casterId: caster.id,
      targetId: target.id,
      spellId: spell.id,
      spellName: spell.name,
      spellLabel: getSpellLabel(spell.id),
      action: spell.action,
      resource: clone(spell.resource || {}),
      roll,
      healing
    };
  }
  return {
    kind: "spell",
    casterId: caster.id,
    targetId: target?.id ?? caster.id,
    spellId: spell.id,
    spellName: spell.name,
    spellLabel: getSpellLabel(spell.id),
    action: spell.action,
    resource: clone(spell.resource || {}),
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
  const promptPack = buildTableFantasyPromptPack({
    room,
    scene,
    player,
    actionText,
    check,
    beat,
    environment,
    actionGuidance,
    randomness
  });
  const promptDirectives = [
    "Use SRD-style structure as inspiration, but only original AIDM wording and mechanics.",
    `Attribution boundary: ${sourceSummaries.map((source) => source.id).join(", ")} under CC-BY-4.0; do not quote long rules text.`,
    `Environment hook: ${environment.weatherLabel.en} during ${environment.seasonLabel.en}; ${environment.narrativeHooks.en}`,
    `Player guidance: ${actionGuidance.suggestions[0]?.prompt || "Ask for a concrete objective and method."}`,
    `Randomness hook: ${randomness.selectedHook}`,
    `DM move: ${promptPack.dmMove.prompt}`,
    `Random event: ${promptPack.randomEvent.prompt}`,
    `Turn callout: ${promptPack.turnCallout.en}`
  ];

  return {
    framework: "repo-local-srd-style",
    sources: sourceSummaries,
    attribution: ruleKnowledgeAttribution(),
    licenseBoundary: "CC-BY-4.0 attribution kept; no long SRD text or proprietary setting text is embedded.",
    environment,
    actionGuidance,
    randomness,
    promptPack,
    tags: unique([
      "knowledge:srd-style",
      `beat:${beat}`,
      `weather:${environment.weather}`,
      `season:${environment.season}`,
      `intent:${actionGuidance.intent}`,
      `dm-move:${promptPack.dmMove.id}`,
      `event:${promptPack.randomEvent.id}`,
      ...environment.tags
    ]),
    promptDirectives
  };
}

export function buildTableFantasyPromptPack({
  room = {},
  scene = room.scene || {},
  player = null,
  actionText = "",
  check = null,
  beat = room.director?.beat || "hook",
  environment = null,
  actionGuidance = null,
  randomness = null
} = {}) {
  const resolvedEnvironment = environment || resolveSeasonWeatherHooks({
    scene,
    weather: room.weather || room.mood?.weather,
    season: room.season || room.calendar?.season,
    actionText,
    beat
  });
  const resolvedGuidance = actionGuidance || suggestRuleActions({
    character: player?.character || player,
    actionText,
    maxSuggestions: 3
  });
  const resolvedRandomness = randomness || buildImmersionRandomness({
    actionText,
    beat,
    check,
    weather: resolvedEnvironment.weather,
    season: resolvedEnvironment.season
  });
  const seed = stableHash([
    resolvedRandomness.seed,
    scene?.objective,
    scene?.location,
    room?.activePlayerId,
    player?.id,
    player?.character?.classId || player?.classId,
    player?.character?.specialization?.id || player?.specialization?.id
  ].join("|"));
  const pressure = resolvedEnvironment.pressure;
  const intent = resolvedGuidance.intent;
  const dmMove = selectPromptSeed(DM_MOVE_PROMPT_SEEDS, {
    seed,
    salt: "dm-move",
    beat,
    intent,
    pressure,
    weather: resolvedEnvironment.weather,
    season: resolvedEnvironment.season
  });
  const randomEvent = selectPromptSeed(RANDOM_EVENT_PROMPT_SEEDS, {
    seed,
    salt: "random-event",
    beat,
    intent,
    pressure,
    weather: resolvedEnvironment.weather,
    season: resolvedEnvironment.season
  });
  const character = player?.character || player || {};
  const spellRole = buildSpellRolePrompt(character, { intent, pressure, seed });
  const warriorAdvancement = buildWarriorAdvancementPrompt(character, { beat, seed });
  const turnCallout = buildTurnCallout({
    character,
    actionGuidance: resolvedGuidance,
    dmMove,
    randomEvent,
    spellRole,
    warriorAdvancement
  });

  return {
    framework: "aidm-original-trpg-prompt-pack",
    mode: "deterministic-table",
    seed,
    seedInputs: {
      beat,
      intent,
      weather: resolvedEnvironment.weather,
      season: resolvedEnvironment.season,
      pressure,
      actionText: String(actionText || "")
    },
    weatherSeasonPressure: {
      weather: resolvedEnvironment.weather,
      weatherLabel: { ...resolvedEnvironment.weatherLabel },
      season: resolvedEnvironment.season,
      seasonLabel: { ...resolvedEnvironment.seasonLabel },
      pressure,
      tags: [...resolvedEnvironment.tags],
      suggestedSkills: [...resolvedEnvironment.suggestedSkills],
      prompt: { ...resolvedEnvironment.narrativeHooks }
    },
    dmMove: exposePromptSeed(dmMove),
    randomEvent: exposePromptSeed(randomEvent),
    spellRole,
    warriorAdvancement,
    actionFrame: {
      intent,
      primarySkill: resolvedGuidance.suggestions[0]?.skill || null,
      primaryAttribute: resolvedGuidance.suggestions[0]?.attribute || null,
      primaryPrompt: resolvedGuidance.suggestions[0]?.prompt || null,
      primaryZhPrompt: resolvedGuidance.suggestions[0]?.zhPrompt || null
    },
    turnCallout,
    audit: {
      wording: "aidm-original",
      copiesLongSourceText: false,
      deterministic: true,
      stateOwnedByRules: true
    }
  };
}

export function listStarterSpellOptions(classId = "mage") {
  const classDef = getClass(classId);
  return (STARTER_SPELL_OPTIONS_BY_CLASS[classDef.id] || []).map((entry) => clone(entry));
}

export function listWarriorSpecializations({ level = 1 } = {}) {
  const normalizedLevel = normalizePositiveInteger(level, "Level");
  return Object.values(WARRIOR_SPECIALIZATIONS).map((specialization) => specializationSnapshot(specialization, normalizedLevel));
}

export function getWarriorSpecialization(id = "weapon-master") {
  const normalized = inferWarriorSpecializationId(id);
  return requireKnown(WARRIOR_SPECIALIZATIONS, normalized, "warrior specialization");
}

export function inferWarriorSpecializationId(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  if (!normalized) return "";
  if (WARRIOR_SPECIALIZATIONS[normalized]) return normalized;
  const compact = normalized.replace(/-/g, "");
  for (const specialization of Object.values(WARRIOR_SPECIALIZATIONS)) {
    if (specialization.aliases.includes(normalized) || specialization.aliases.includes(compact)) {
      return specialization.id;
    }
  }
  return normalized;
}

export function buildClassProgression({ classId = "warrior", level = 1, specializationId = null } = {}) {
  const classDef = getClass(classId);
  const normalizedLevel = normalizePositiveInteger(level, "Level");
  const baseEntries = CLASS_LEVEL_PROGRESSIONS[classDef.id] || [];
  const features = [];
  const actions = [];
  let resources = {};

  for (const entry of baseEntries) {
    if (entry.level > normalizedLevel) continue;
    features.push(...(entry.features || []));
    actions.push(...(entry.actions || []));
    resources = mergeResources(resources, entry.resources || {});
  }

  const specialization = classDef.id === "warrior" && specializationId
    ? getWarriorSpecialization(specializationId)
    : null;
  const specializationFeatures = [];
  if (specialization) {
    for (const tier of specialization.tiers) {
      if (tier.level > normalizedLevel) continue;
      features.push(...(tier.features || []));
      specializationFeatures.push(...(tier.features || []));
      actions.push(...(tier.actions || []));
      resources = mergeResources(resources, tier.resources || {});
    }
  }

  return {
    classId: classDef.id,
    level: normalizedLevel,
    features: unique(features),
    actions: unique(actions),
    resources,
    specialization: specialization ? {
      id: specialization.id,
      features: unique(specializationFeatures),
      nextFeatureLevel: nextSpecializationFeatureLevel(specialization, normalizedLevel)
    } : null
  };
}

export function applyCharacterLevelProgression(character = {}) {
  const classId = character.classId || character.class || "warrior";
  const classDef = getClass(classId);
  const progression = buildClassProgression({
    classId: classDef.id,
    level: character.level || 1,
    specializationId: character.specialization?.id || null
  });
  const spellIds = unique([...(character.spells || []), ...(character.knownSpells || [])]);
  character.actions = unique([
    ...(character.actions || []),
    ...classDef.actions,
    ...progression.actions,
    ...(spellIds.length > 0 ? ["cast"] : [])
  ]);
  character.progression = progression;
  character.resources = mergeResources(character.resources || {}, progression.resources);
  return character;
}

export function applyWarriorSpecializationToCharacter(character = {}, specializationId = "weapon-master") {
  const classId = character.classId || character.class || "warrior";
  if (classId !== "warrior") {
    return applyCharacterLevelProgression(character);
  }
  const specialization = getWarriorSpecialization(specializationId);
  if (character.specialization?.id === specialization.id) {
    return applyCharacterLevelProgression(character);
  }

  character.specialization = specializationSnapshot(specialization, character.level || 1);
  character.attributes = applyAttributeBonuses(character.attributes || {}, specialization.attributeBonuses);
  if (character.stats) {
    character.stats = applyAttributeBonuses(character.stats, specialization.attributeBonuses);
  }
  if (character.modifiers) {
    character.modifiers = mapAttributes(character.attributes, abilityModifier);
  }
  character.skills = applySkillBonuses(character.skills || {}, specialization.skillBonuses);
  character.equipment = unique([...(character.equipment || []), ...specialization.equipment]);
  character.weapons = unique([
    ...(character.weapons || []),
    ...specialization.equipment.filter((itemId) => Boolean(WEAPONS[itemId]))
  ]);
  character.armor = unique([
    ...(character.armor || []),
    ...specialization.equipment.filter((itemId) => Boolean(ARMOR[itemId]))
  ]);
  character.actions = unique([...(character.actions || []), ...specialization.actions]);
  character.resistances = unique([...(character.resistances || []), ...specialization.resistances]);
  character.combatBonuses = mergeCombatBonuses(character.combatBonuses || {}, specialization.combatBonuses);
  if (Number.isInteger(character.defense)) {
    character.defense = Math.max(1, character.defense + (specialization.defenseBonus || 0));
  }
  const bodyBonus = specialization.attributeBonuses.body || 0;
  if (bodyBonus > 0 && Number.isInteger(character.maxHp)) {
    character.maxHp += bodyBonus;
    character.hp = Math.min(character.maxHp, (character.hp ?? character.maxHp) + bodyBonus);
  }
  return applyCharacterLevelProgression(character);
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

export function getSpellLabel(id, language = null) {
  const spell = getSpell(id);
  const label = SPELL_LABELS[spell.id] || Object.freeze({ en: spell.name, zh: spell.name });
  if (language === "en" || language === "zh") return label[language] || label.en;
  return { ...label };
}

export function getEquipment(id) {
  return requireKnown(EQUIPMENT, id, "equipment");
}

export function listSpellsByCategory(categoryId = null) {
  if (categoryId) {
    const normalized = String(categoryId).trim();
    requireKnown(SPELL_CATEGORIES, normalized, "spell category");
    return (SPELLS_BY_CATEGORY[normalized] || []).map((id) => ({ ...getSpell(id), label: getSpellLabel(id) }));
  }
  return Object.fromEntries(Object.keys(SPELL_CATEGORIES).map((id) => [
    id,
    listSpellsByCategory(id)
  ]));
}

function freezeSpellOptions(options) {
  return Object.freeze(options.map(([id, role, detail]) => Object.freeze({
    id,
    role,
    detail,
    category: SPELLS[id]?.category || "damage",
    label: Object.freeze({ ...(SPELL_LABELS[id] || { en: SPELLS[id]?.name || id, zh: SPELLS[id]?.name || id }) }),
    resource: Object.freeze({ ...(SPELLS[id]?.resource || {}) }),
    action: SPELLS[id]?.action || "cast",
    tags: Object.freeze([...(SPELLS[id]?.tags || [])])
  })));
}

function freezeWarriorSpecialization(definition) {
  const tiers = (definition.tiers || []).map((tier) => Object.freeze({
    level: tier.level,
    features: Object.freeze([...(tier.features || [])]),
    actions: Object.freeze([...(tier.actions || [])]),
    resources: freezeResources(tier.resources || {})
  }));
  const tierOneActions = tiers
    .filter((tier) => tier.level <= 1)
    .flatMap((tier) => tier.actions);
  return Object.freeze({
    ...definition,
    aliases: Object.freeze((definition.aliases || []).map((alias) => String(alias).toLowerCase().replace(/[_\s]+/g, "-"))),
    role: definition.role || "frontline",
    recommendedAttributes: Object.freeze([...(definition.recommendedAttributes || [])]),
    impact: Object.freeze({ ...(definition.impact || {}) }),
    resistances: Object.freeze([...(definition.resistances || [])]),
    actions: Object.freeze(unique([...(definition.actions || []), ...tierOneActions])),
    equipment: Object.freeze([...(definition.equipment || [])]),
    attributeBonuses: Object.freeze(normalizeAttributeMap(definition.attributeBonuses || {}, 0)),
    skillBonuses: Object.freeze({ ...(definition.skillBonuses || {}) }),
    defenseBonus: definition.defenseBonus || 0,
    combatBonuses: freezeCombatBonuses(definition.combatBonuses || {}),
    tiers: Object.freeze(tiers)
  });
}

function freezeProgression(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze({
    level: entry.level,
    features: Object.freeze([...(entry.features || [])]),
    actions: Object.freeze([...(entry.actions || [])]),
    resources: freezeResources(entry.resources || {})
  })));
}

function freezeResources(resources) {
  return Object.freeze(Object.fromEntries(Object.entries(resources).map(([key, value]) => [
    key,
    Object.freeze({
      max: value.max,
      recovery: value.recovery || "long-rest"
    })
  ])));
}

function freezeCombatBonuses(combatBonuses) {
  return Object.freeze({
    attack: Object.freeze((combatBonuses.attack || []).map((bonus) => Object.freeze({
      amount: bonus.amount || 0,
      category: bonus.category || null,
      tags: Object.freeze([...(bonus.tags || [])])
    }))),
    damage: Object.freeze((combatBonuses.damage || []).map((bonus) => Object.freeze({
      amount: bonus.amount || 0,
      category: bonus.category || null,
      tags: Object.freeze([...(bonus.tags || [])])
    })))
  });
}

function resolveClassSpecialization(classDef, specializationId) {
  if (classDef.id !== "warrior" || !specializationId) return null;
  return getWarriorSpecialization(specializationId);
}

function specializationSnapshot(specialization, level) {
  const progression = buildClassProgression({
    classId: "warrior",
    level,
    specializationId: specialization.id
  });
  return {
    id: specialization.id,
    name: specialization.name,
    label: { ...specialization.label },
    role: specialization.role,
    recommendedAttributes: [...specialization.recommendedAttributes],
    impact: { ...specialization.impact },
    attributeBonuses: { ...specialization.attributeBonuses },
    skillBonuses: { ...specialization.skillBonuses },
    equipment: [...specialization.equipment],
    actions: [...specialization.actions],
    features: progression.specialization?.features || [],
    nextFeatureLevel: progression.specialization?.nextFeatureLevel || null
  };
}

function nextSpecializationFeatureLevel(specialization, level) {
  const next = specialization.tiers.find((tier) => tier.level > level);
  return next?.level || null;
}

function applyAttributeBonuses(scores, bonuses = {}) {
  const output = {};
  for (const key of ATTRIBUTE_KEYS) {
    output[key] = (scores[key] ?? 0) + (bonuses[key] ?? 0);
  }
  return output;
}

function applySkillBonuses(skills, bonuses = {}) {
  const output = { ...skills };
  for (const [skill, bonus] of Object.entries(bonuses)) {
    output[skill] = (output[skill] ?? 0) + bonus;
  }
  return output;
}

function mergeResources(current = {}, next = {}) {
  const merged = clone(current || {});
  for (const [key, value] of Object.entries(next || {})) {
    const previous = merged[key] || {};
    const max = Math.max(previous.max ?? 0, value.max ?? 0);
    merged[key] = {
      max,
      current: Math.min(max, previous.current ?? max),
      recovery: value.recovery || previous.recovery || "long-rest"
    };
  }
  return merged;
}

function mergeCombatBonuses(current = {}, next = {}) {
  return {
    attack: [...(current.attack || []), ...(next.attack || [])].map((bonus) => clone(bonus)),
    damage: [...(current.damage || []), ...(next.damage || [])].map((bonus) => clone(bonus))
  };
}

function getCombatSourceBonus(attacker, source, kind) {
  return (attacker.combatBonuses?.[kind] || [])
    .filter((bonus) => combatBonusApplies(source, bonus))
    .reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
}

function combatBonusApplies(source, bonus) {
  if (bonus.category && source.category !== bonus.category) return false;
  const requiredTags = bonus.tags || [];
  if (requiredTags.length === 0) return true;
  const sourceTags = new Set(source.tags || []);
  return requiredTags.some((tag) => sourceTags.has(tag));
}

function applyStaticDamageBonus(roll, bonus = 0) {
  if (!bonus) return roll;
  return {
    ...roll,
    expression: `${roll.expression}${formatSigned(bonus)}`,
    modifier: roll.modifier + bonus,
    total: roll.total + bonus,
    staticBonus: (roll.staticBonus || 0) + bonus
  };
}

function promptSeed(definition) {
  return Object.freeze({
    id: definition.id,
    beats: Object.freeze([...(definition.beats || [])]),
    intents: Object.freeze([...(definition.intents || [])]),
    weather: Object.freeze([...(definition.weather || [])]),
    season: Object.freeze([...(definition.season || [])]),
    pressure: Object.freeze([...(definition.pressure || [])]),
    prompt: definition.prompt,
    zhPrompt: definition.zhPrompt,
    stateLever: definition.stateLever || null,
    clock: definition.clock || null,
    pressureDelta: definition.pressureDelta ?? 0
  });
}

function promptRole(id, prompt, zhPrompt) {
  return Object.freeze({ id, prompt, zhPrompt });
}

function selectPromptSeed(entries, { seed, salt, beat, intent, pressure, weather, season }) {
  const scored = entries
    .map((entry) => {
      let score = 1;
      if (entry.beats.length === 0 || entry.beats.includes(beat)) score += entry.beats.length === 0 ? 0 : 4;
      if (entry.intents.length === 0 || entry.intents.includes(intent) || entry.intents.includes("general")) score += entry.intents.includes(intent) ? 4 : 1;
      if (entry.pressure.length === 0 || entry.pressure.includes(pressure)) score += entry.pressure.length === 0 ? 0 : 3;
      if (entry.weather.length === 0 || entry.weather.includes(weather)) score += entry.weather.length === 0 ? 0 : 3;
      if (entry.season.length === 0 || entry.season.includes(season)) score += entry.season.length === 0 ? 0 : 2;
      return { entry, score };
    })
    .filter(({ score }) => score > 1)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftRank = stableHash(`${seed}|${salt}|${left.entry.id}`);
      const rightRank = stableHash(`${seed}|${salt}|${right.entry.id}`);
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.entry.id.localeCompare(right.entry.id);
    });
  return scored[0]?.entry || entries[stableHash(`${seed}|${salt}`) % entries.length];
}

function exposePromptSeed(seed) {
  return {
    id: seed.id,
    prompt: seed.prompt,
    zhPrompt: seed.zhPrompt,
    stateLever: seed.stateLever,
    clock: seed.clock,
    pressureDelta: seed.pressureDelta,
    tags: unique([
      ...(seed.beats || []).map((entry) => `beat:${entry}`),
      ...(seed.intents || []).map((entry) => `intent:${entry}`),
      ...(seed.weather || []).map((entry) => `weather:${entry}`),
      ...(seed.season || []).map((entry) => `season:${entry}`),
      ...(seed.pressure || []).map((entry) => `pressure:${entry}`)
    ])
  };
}

function buildSpellRolePrompt(character, { intent, pressure, seed }) {
  const spellIds = unique([...(character?.knownSpells || []), ...(character?.spells || [])]);
  const candidates = spellIds
    .map((id) => {
      try {
        const spell = getSpell(id);
        let score = 1;
        if (intent === "hostile" && spell.category === "damage") score += 8;
        if (intent === "guard" && spell.category === "protection") score += 7;
        if (intent === "travel" && spell.category === "movement") score += 6;
        if (intent === "investigate" && (spell.category === "scouting" || spell.category === "ritual")) score += 6;
        if (intent === "social" && spell.category === "control") score += 4;
        if (pressure === "high" && ["control", "protection", "healing", "movement"].includes(spell.category)) score += 3;
        return { spell, score };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftRank = stableHash(`${seed}|spell|${left.spell.id}`);
      const rightRank = stableHash(`${seed}|spell|${right.spell.id}`);
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.spell.id.localeCompare(right.spell.id);
    });
  const selected = candidates[0]?.spell || null;
  const category = selected?.category || fallbackSpellCategory(intent, pressure);
  const role = SPELL_ROLE_PROMPT_SEEDS[category] || SPELL_ROLE_PROMPT_SEEDS.scouting;
  const label = selected ? getSpellLabel(selected.id) : null;
  return {
    category: role.id,
    spellId: selected?.id || null,
    spellLabel: label,
    prompt: selected ? `${label.en}: ${role.prompt}` : role.prompt,
    zhPrompt: selected ? `${label.zh}：${role.zhPrompt}` : role.zhPrompt,
    resourceHint: selected?.resource ? { ...selected.resource } : null,
    action: selected?.action || null,
    tags: selected ? [...selected.tags] : [`spell-role:${role.id}`]
  };
}

function fallbackSpellCategory(intent, pressure) {
  if (intent === "hostile") return "damage";
  if (intent === "guard") return "protection";
  if (intent === "travel") return "movement";
  if (intent === "investigate") return "scouting";
  if (intent === "social") return "control";
  if (pressure === "high") return "protection";
  return "ritual";
}

function buildWarriorAdvancementPrompt(character, { beat, seed }) {
  const classId = character?.classId || character?.class || "";
  const specializationId = character?.specialization?.id || character?.specializationId || "";
  const specialization = classId === "warrior" && specializationId
    ? safeWarriorSpecialization(specializationId)
    : null;
  const fallbackOptions = Object.values(WARRIOR_SPECIALIZATIONS)
    .map((entry) => ({
      specialization: entry,
      score: warriorSpecializationScore(character, entry)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      const leftRank = stableHash(`${seed}|warrior|${beat}|${left.specialization.id}`);
      const rightRank = stableHash(`${seed}|warrior|${beat}|${right.specialization.id}`);
      if (leftRank !== rightRank) return leftRank - rightRank;
      return left.specialization.id.localeCompare(right.specialization.id);
    });
  const selected = specialization || fallbackOptions[0]?.specialization || WARRIOR_SPECIALIZATIONS["weapon-master"];
  const snapshot = specializationSnapshot(selected, character?.level || 1);
  return {
    classId: "warrior",
    specializationId: selected.id,
    label: { ...selected.label },
    role: selected.role,
    recommendedAttributes: [...selected.recommendedAttributes],
    nextFeatureLevel: snapshot.nextFeatureLevel,
    prompt: `Make advancement visible through ${selected.impact.attributes.toLowerCase()} Then ask which action or equipment choice proves it this scene.`,
    zhPrompt: `把进阶表现为属性、技能、装备和行动的变化；本场询问哪一个动作或装备选择能证明${selected.label.zh}的成长。`,
    visibleLevers: {
      attributes: selected.impact.attributes,
      skills: selected.impact.skills,
      equipment: selected.impact.equipment,
      actions: selected.impact.actions
    }
  };
}

function safeWarriorSpecialization(specializationId) {
  try {
    return getWarriorSpecialization(specializationId);
  } catch {
    return null;
  }
}

function warriorSpecializationScore(character, specialization) {
  const attributes = character?.attributes || character?.stats || {};
  const skills = character?.skills || {};
  return specialization.recommendedAttributes.reduce((sum, key) => sum + (Number(attributes[key]) || 0), 0)
    + Object.keys(specialization.skillBonuses || {}).reduce((sum, key) => sum + (Number(skills[key]) || 0), 0);
}

function buildTurnCallout({ character, actionGuidance, dmMove, randomEvent, spellRole, warriorAdvancement }) {
  const name = character?.name || "Active character";
  const action = actionGuidance.suggestions[0] || null;
  const enParts = [
    `${name}: ${action?.prompt || "state a concrete objective and method"}`,
    dmMove.prompt,
    randomEvent.prompt
  ];
  const zhParts = [
    `${name}：${action?.zhPrompt || "声明一个具体目标和方法"}`,
    dmMove.zhPrompt,
    randomEvent.zhPrompt
  ];
  if (spellRole?.spellId) {
    enParts.push(spellRole.prompt);
    zhParts.push(spellRole.zhPrompt);
  }
  if ((character?.classId || character?.class) === "warrior") {
    enParts.push(`Warrior growth cue: ${warriorAdvancement.label.en} should show through action, not only numbers.`);
    zhParts.push(`战士成长提示：${warriorAdvancement.label.zh}要通过行动表现，而不只是数值。`);
  }
  return {
    en: enParts.join(" "),
    zh: zhParts.join(" ")
  };
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
    { id: "witness-reframes-question", text: "an overlooked witness changes the direction of the next question" },
    { id: "detail-becomes-leverage", text: "a small environmental detail turns into leverage" },
    { id: "clue-splits-routes", text: "the same clue points to two routes with different costs" },
    { id: "desire-before-fact", text: "an NPC reveals a desire before revealing a fact" },
    { id: "place-answers-action", text: "the location answers the action with motion, sound, or pressure" },
    { id: "miss-becomes-bargain", text: "a failed attempt creates a bargain instead of a dead end" }
  ];
  const seed = stableHash([actionText, beat, check?.total, check?.dc, weather, season].join("|"));
  const selected = hooks[seed % hooks.length];
  const margin = Number(check?.total) - Number(check?.dc);
  return {
    mode: "deterministic-table",
    seed,
    seedInputs: {
      actionText: String(actionText || ""),
      beat: String(beat || ""),
      total: Number.isFinite(Number(check?.total)) ? Number(check.total) : null,
      dc: Number.isFinite(Number(check?.dc)) ? Number(check.dc) : null,
      weather: String(weather || ""),
      season: String(season || "")
    },
    selectedHookId: selected.id,
    selectedHook: selected.text,
    twistPressure: Number.isFinite(margin) && margin < 0 ? "complication" : "opportunity",
    table: hooks.map((entry) => ({ ...entry }))
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
    sourceName: source.name,
    sourceLabel: source.kind === "spell" ? getSpellLabel(source.id) : { en: source.name, zh: source.name },
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
  if (Number.isInteger(effect.speedBonus)) {
    cloned.speed = (cloned.speed ?? 0) + effect.speedBonus;
  }
  if (Number.isInteger(effect.temporaryHp)) {
    cloned.temporaryHp = Math.max(cloned.temporaryHp ?? 0, effect.temporaryHp);
  }
  if (effect.condition) {
    cloned.conditions = unique([...(cloned.conditions ?? []), effect.condition]);
  }
  if (Array.isArray(effect.removeConditions)) {
    const removed = new Set(effect.removeConditions);
    cloned.conditions = (cloned.conditions ?? []).filter((condition) => !removed.has(condition));
  }
  if (effect.resistance) {
    cloned.resistances = unique([...(cloned.resistances ?? []), effect.resistance]);
  }
  if (effect.disengage) {
    cloned.disengaged = true;
  }
  if (effect.ignoreDifficultTerrain) {
    cloned.ignoreDifficultTerrain = true;
  }
  if (effect.reposition) {
    cloned.repositionAvailable = true;
  }
  if (effect.skillBonus) {
    cloned.skillBonuses = {
      ...(cloned.skillBonuses || {}),
      ...effect.skillBonus
    };
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
