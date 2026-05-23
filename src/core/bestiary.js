import { abilityModifier, proficiencyBonus } from "./rules.js";

export const ENEMY_TEMPLATES = Object.freeze({
  street_skirmisher: Object.freeze({
    id: "street_skirmisher",
    name: "Street Skirmisher",
    role: "striker",
    threat: 1,
    maxHp: 7,
    defense: 13,
    attributes: Object.freeze({ body: 10, agility: 14, mind: 9, presence: 8, spirit: 10 }),
    actions: Object.freeze(["attack", "defend", "flee"]),
    attacks: Object.freeze(["dagger", "shortbow"]),
    spells: Object.freeze([]),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    preferredRange: 4,
    morale: Object.freeze({ breakAt: 0.25 })
  }),
  knife_hunter: Object.freeze({
    id: "knife_hunter",
    name: "Knife Hunter",
    role: "striker",
    threat: 2,
    maxHp: 12,
    defense: 13,
    attributes: Object.freeze({ body: 13, agility: 15, mind: 4, presence: 8, spirit: 12 }),
    actions: Object.freeze(["attack", "defend", "flee"]),
    attacks: Object.freeze(["dagger"]),
    spells: Object.freeze([]),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    preferredRange: 1,
    morale: Object.freeze({ breakAt: 0.2 })
  }),
  bone_guard: Object.freeze({
    id: "bone_guard",
    name: "Bone Guard",
    role: "soldier",
    threat: 2,
    maxHp: 13,
    defense: 14,
    attributes: Object.freeze({ body: 12, agility: 10, mind: 6, presence: 6, spirit: 10 }),
    actions: Object.freeze(["attack", "defend"]),
    attacks: Object.freeze(["mace"]),
    spells: Object.freeze([]),
    resistances: Object.freeze(["piercing", "poison"]),
    weaknesses: Object.freeze(["bludgeoning", "radiant"]),
    preferredRange: 1,
    morale: Object.freeze({ breakAt: 0 })
  }),
  veiled_acolyte: Object.freeze({
    id: "veiled_acolyte",
    name: "Veiled Acolyte",
    role: "support",
    threat: 2,
    maxHp: 10,
    defense: 12,
    attributes: Object.freeze({ body: 9, agility: 10, mind: 12, presence: 12, spirit: 14 }),
    actions: Object.freeze(["attack", "cast", "support", "defend", "flee"]),
    attacks: Object.freeze(["dagger"]),
    spells: Object.freeze(["healing-word", "radiant-bolt", "ward"]),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    preferredRange: 5,
    morale: Object.freeze({ breakAt: 0.25 })
  }),
  alley_archer: Object.freeze({
    id: "alley_archer",
    name: "Alley Archer",
    role: "controller",
    threat: 2,
    maxHp: 11,
    defense: 13,
    attributes: Object.freeze({ body: 10, agility: 15, mind: 10, presence: 10, spirit: 10 }),
    actions: Object.freeze(["attack", "defend", "flee"]),
    attacks: Object.freeze(["shortbow", "dagger"]),
    spells: Object.freeze([]),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    preferredRange: 6,
    morale: Object.freeze({ breakAt: 0.3 })
  }),
  iron_raider: Object.freeze({
    id: "iron_raider",
    name: "Iron Raider",
    role: "brute",
    threat: 3,
    maxHp: 18,
    defense: 13,
    attributes: Object.freeze({ body: 16, agility: 10, mind: 8, presence: 12, spirit: 11 }),
    actions: Object.freeze(["attack", "defend"]),
    attacks: Object.freeze(["longsword"]),
    spells: Object.freeze([]),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze([]),
    preferredRange: 1,
    morale: Object.freeze({ breakAt: 0.15 })
  }),
  bridge_brute: Object.freeze({
    id: "bridge_brute",
    name: "Bridge Brute",
    role: "brute",
    threat: 5,
    maxHp: 38,
    defense: 12,
    attributes: Object.freeze({ body: 19, agility: 8, mind: 6, presence: 10, spirit: 12 }),
    actions: Object.freeze(["attack", "defend"]),
    attacks: Object.freeze(["mace"]),
    spells: Object.freeze([]),
    resistances: Object.freeze([]),
    weaknesses: Object.freeze(["psychic"]),
    preferredRange: 1,
    morale: Object.freeze({ breakAt: 0.12 })
  }),
  shadow_mage: Object.freeze({
    id: "shadow_mage",
    name: "Shadow Mage",
    role: "controller",
    threat: 6,
    maxHp: 28,
    defense: 15,
    attributes: Object.freeze({ body: 8, agility: 14, mind: 18, presence: 14, spirit: 13 }),
    actions: Object.freeze(["attack", "cast", "defend", "flee"]),
    attacks: Object.freeze(["staff"]),
    spells: Object.freeze(["firebolt", "sleep", "arcane-shield"]),
    resistances: Object.freeze(["psychic"]),
    weaknesses: Object.freeze(["radiant"]),
    preferredRange: 6,
    morale: Object.freeze({ breakAt: 0.2 })
  })
});

const ROLE_ORDERS = Object.freeze({
  balanced: Object.freeze(["soldier", "striker", "support", "controller", "brute"]),
  combat: Object.freeze(["brute", "soldier", "striker", "controller", "support"]),
  intrigue: Object.freeze(["controller", "support", "striker", "soldier", "brute"])
});

export function createEnemy(templateId, overrides = {}) {
  const template = getEnemyTemplate(templateId);
  const level = Math.max(1, Math.ceil(template.threat / 2));
  const pb = proficiencyBonus(level);
  const modifiers = Object.fromEntries(
    Object.entries(template.attributes).map(([key, value]) => [key, abilityModifier(value)])
  );
  const skills = {
    melee: modifiers.body + pb,
    ranged: modifiers.agility + pb,
    arcana: modifiers.mind + pb,
    medicine: modifiers.spirit + pb,
    guard: modifiers.body + pb
  };
  const maxHp = overrides.maxHp ?? template.maxHp;
  const hp = overrides.hp ?? maxHp;

  return {
    id: overrides.instanceId ?? template.id,
    templateId: template.id,
    name: overrides.name ?? template.name,
    displayName: enemyDisplayName(template.id, overrides.name ?? template.name),
    role: template.role,
    threat: overrides.threat ?? template.threat,
    maxHp,
    hp,
    defense: overrides.defense ?? template.defense,
    attributes: { ...template.attributes },
    modifiers,
    proficiencyBonus: pb,
    skills,
    actions: [...template.actions],
    attacks: [...template.attacks],
    weapons: [...template.attacks],
    spells: [...template.spells],
    resistances: [...template.resistances],
    weaknesses: [...template.weaknesses],
    preferredRange: overrides.preferredRange ?? template.preferredRange,
    distance: overrides.distance ?? template.preferredRange,
    morale: { ...template.morale }
  };
}

function enemyDisplayName(templateId, name) {
  const zhNames = {
    street_skirmisher: "街头游斗者",
    knife_hunter: "持刀猎手",
    bone_guard: "骸骨守卫",
    veiled_acolyte: "蒙面侍僧",
    alley_archer: "巷道弓手",
    iron_raider: "铁甲掠袭者",
    bridge_brute: "桥头蛮兵",
    shadow_mage: "影法师"
  };
  return {
    en: name,
    zh: zhNames[templateId] || name
  };
}

export function generateEncounter({ threat = 2, partySize = 4, theme = "balanced", maxEnemies = 8 } = {}) {
  const normalizedThreat = normalizeEncounterNumber(threat, "Encounter threat");
  const normalizedPartySize = normalizeEncounterNumber(partySize, "Party size");
  const enemyLimit = normalizeEncounterNumber(maxEnemies, "Max enemies");
  const budget = calculateEncounterBudget(normalizedThreat, normalizedPartySize);
  const roleOrder = ROLE_ORDERS[theme] ?? ROLE_ORDERS.balanced;
  const enemies = [];
  let remaining = budget;

  while (remaining > 0 && enemies.length < enemyLimit) {
    const role = roleOrder[(enemies.length + normalizedThreat) % roleOrder.length];
    const candidate = chooseTemplate({ remaining, role, maxThreat: normalizedThreat + 2 });
    if (!candidate) {
      break;
    }
    const instanceNumber = enemies.filter((enemy) => enemy.templateId === candidate.id).length + 1;
    enemies.push(createEnemy(candidate.id, {
      instanceId: `${candidate.id}-${instanceNumber}`,
      distance: candidate.preferredRange
    }));
    remaining -= candidate.threat;
  }

  const spent = enemies.reduce((sum, enemy) => sum + enemy.threat, 0);
  return {
    threat: normalizedThreat,
    partySize: normalizedPartySize,
    theme,
    budget,
    spent,
    remaining: budget - spent,
    enemies,
    summary: `${enemies.length} enemies, threat ${spent}/${budget}`
  };
}

export function calculateEncounterBudget(threat, partySize) {
  return normalizeEncounterNumber(threat, "Encounter threat") * normalizeEncounterNumber(partySize, "Party size");
}

export function getEnemyTemplate(id) {
  const aliases = {
    goblin_skirmisher: "street_skirmisher",
    wolf: "knife_hunter",
    skeleton_guard: "bone_guard",
    cult_acolyte: "veiled_acolyte",
    bandit_archer: "alley_archer",
    orc_raider: "iron_raider",
    ogre_brute: "bridge_brute"
  };
  const template = ENEMY_TEMPLATES[aliases[id] || id];
  if (!template) {
    throw new Error(`Unknown enemy template: ${id}`);
  }
  return template;
}

function chooseTemplate({ remaining, role, maxThreat }) {
  const templates = Object.values(ENEMY_TEMPLATES)
    .filter((template) => template.threat <= remaining && template.threat <= maxThreat);
  const roleMatch = templates
    .filter((template) => template.role === role)
    .sort(compareTemplate);
  if (roleMatch.length > 0) {
    return roleMatch[0];
  }
  return templates.sort(compareTemplate)[0] ?? null;
}

function compareTemplate(left, right) {
  if (right.threat !== left.threat) {
    return right.threat - left.threat;
  }
  return left.id.localeCompare(right.id);
}

function normalizeEncounterNumber(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}
