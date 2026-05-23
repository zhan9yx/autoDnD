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
  shield: Object.freeze({
    id: "shield",
    name: "Shield",
    kind: "shield",
    defenseBonus: 2,
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
      traits: [...race.traits],
      speed: race.speed
    },
    className: classDef.name,
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
