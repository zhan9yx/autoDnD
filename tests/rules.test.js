import test from "node:test";
import assert from "node:assert/strict";
import {
  allocateAttributes,
  buildRuleKnowledgeContext,
  calculateDefense,
  createCharacter,
  getEquipment,
  getWeapon,
  listRuleKnowledgeSources,
  resolveAttack,
  resolveDamage,
  resolveHealing,
  resolveSeasonWeatherHooks,
  suggestRuleActions,
  resolveSpellEffect
} from "../src/core/rules.js";
import { generateEncounter } from "../src/core/bestiary.js";

test("creates a character with ancestry, class, point budget, derived stats, and skills", () => {
  const character = createCharacter({
    name: "Ari",
    raceId: "elf",
    classId: "mage",
    allocations: {
      body: 2,
      agility: 5,
      mind: 7,
      presence: 2,
      spirit: 1
    }
  });

  assert.equal(character.attributes.mind, 16);
  assert.equal(character.attributes.agility, 15);
  assert.equal(character.attributeBudget.spent, 17);
  assert.equal(character.attributeBudget.remaining, 10);
  assert.equal(character.maxHp, 7);
  assert.equal(character.defense, 12);
  assert.equal(character.skills.arcana, 6);
  assert.deepEqual(character.knownSpells, ["firebolt", "sleep", "arcane-shield"]);
});

test("rejects invalid attribute budgets deterministically", () => {
  assert.throws(
    () => allocateAttributes({ allocations: { body: 8 } }),
    /exceeds max before ancestry/
  );
  assert.throws(
    () => allocateAttributes({ allocations: { body: 7, agility: 7, mind: 7, presence: 7 } }),
    /Attribute budget exceeded/
  );
});

test("resolves hit, critical damage, resistance, and healing without AI", () => {
  const attacker = createCharacter({
    name: "Borin",
    raceId: "human",
    classId: "warrior",
    allocations: { body: 7, agility: 2, mind: 1, presence: 2, spirit: 1 }
  });
  const target = {
    id: "training-skeleton",
    hp: 20,
    maxHp: 20,
    defense: 10,
    resistances: ["slashing"],
    weaknesses: []
  };

  const attack = resolveAttack({
    attacker,
    target,
    weaponId: "longsword",
    rng: sequence([0.999, 0.5])
  });

  assert.equal(attack.hit, true);
  assert.equal(attack.critical, true);
  assert.equal(attack.damageRoll.total, 12);
  assert.equal(attack.damage.finalAmount, 6);
  assert.equal(attack.damage.targetAfter.hp, 14);

  const fireDamage = resolveDamage({
    target,
    amount: 7,
    damageType: "fire"
  });
  assert.equal(fireDamage.finalAmount, 7);

  const healed = resolveHealing({
    target: { id: "ally", hp: 4, maxHp: 12 },
    amount: 20
  });
  assert.equal(healed.finalAmount, 8);
  assert.equal(healed.targetAfter.hp, 12);
});

test("expanded market equipment has deterministic combat and defense rules", () => {
  const mace = getWeapon("ironstar-mace");
  assert.equal(mace.damage, "1d6+2");
  assert.equal(mace.damageType, "bludgeoning");

  const foldedChain = getEquipment("folded-chain-shirt");
  const buckler = getEquipment("gilded-sun-buckler");
  const amulet = getEquipment("stormglass-amulet");
  assert.equal(foldedChain.kind, "armor");
  assert.equal(buckler.kind, "shield");
  assert.equal(amulet.kind, "accessory");
  assert.equal(calculateDefense({ agilityModifier: 4, equipment: [foldedChain, buckler, amulet] }), 17);

  const warrior = createCharacter({
    name: "Sella",
    raceId: "human",
    classId: "warrior",
    allocations: { body: 5, agility: 7, mind: 1, presence: 2, spirit: 1 },
    equipmentIds: ["ironstar-mace", "folded-chain-shirt", "gilded-sun-buckler", "stormglass-amulet"]
  });
  assert.equal(warrior.weapons.includes("ironstar-mace"), true);
  assert.equal(warrior.armor.includes("folded-chain-shirt"), true);
  assert.equal(warrior.armor.includes("gilded-sun-buckler"), true);
  assert.equal(warrior.defense, 17);
});

test("sheet 031 promoted weapons resolve deterministic saber and spear combat rules", () => {
  const saber = getWeapon("oathguard-saber");
  const spear = getWeapon("red-tassel-spear");

  assert.equal(saber.damage, "1d8+1");
  assert.equal(saber.damageType, "slashing");
  assert.equal(saber.range, 1);
  assert.deepEqual([...saber.tags], ["martial", "market"]);
  assert.equal(spear.damage, "1d8");
  assert.equal(spear.damageType, "piercing");
  assert.equal(spear.range, 2);
  assert.deepEqual([...spear.tags], ["reach", "market"]);

  const allocations = { body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 };
  const saberUser = createCharacter({
    name: "Kara",
    raceId: "human",
    classId: "warrior",
    allocations,
    equipmentIds: ["oathguard-saber"]
  });
  const spearUser = createCharacter({
    name: "Daro",
    raceId: "human",
    classId: "warrior",
    allocations,
    equipmentIds: ["red-tassel-spear"]
  });

  assert.deepEqual(saberUser.weapons, ["oathguard-saber"]);
  assert.deepEqual(spearUser.weapons, ["red-tassel-spear"]);

  const saberAttack = resolveAttack({
    attacker: saberUser,
    target: { id: "cloth-dummy", hp: 20, maxHp: 20, defense: 11, resistances: [], weaknesses: ["slashing"] },
    weaponId: "oathguard-saber",
    rng: sequence([0.25]),
    damageRng: sequence([0.5])
  });

  assert.equal(saberAttack.attackBonus, 5);
  assert.equal(saberAttack.attackRoll.total, 11);
  assert.equal(saberAttack.hit, true);
  assert.equal(saberAttack.damageRoll.total, 6);
  assert.equal(saberAttack.damage.finalAmount, 12);
  assert.equal(saberAttack.damage.targetAfter.hp, 8);

  const spearAttack = resolveAttack({
    attacker: spearUser,
    target: { id: "padded-target", hp: 18, maxHp: 18, defense: 14, resistances: ["piercing"], weaknesses: [] },
    weaponId: "red-tassel-spear",
    rng: sequence([0.75]),
    damageRng: sequence([0.875])
  });

  assert.equal(spearAttack.attackBonus, 5);
  assert.equal(spearAttack.attackRoll.total, 21);
  assert.equal(spearAttack.hit, true);
  assert.equal(spearAttack.damageRoll.total, 8);
  assert.equal(spearAttack.damage.finalAmount, 4);
  assert.equal(spearAttack.damage.targetAfter.hp, 14);
});

test("applies spell healing and generates bounded encounters", () => {
  const cleric = createCharacter({
    name: "Mira",
    raceId: "dwarf",
    classId: "cleric",
    allocations: { body: 3, agility: 1, mind: 2, presence: 3, spirit: 7 }
  });
  const spell = resolveSpellEffect({
    caster: cleric,
    target: { id: "rogue", hp: 2, maxHp: 9 },
    spellId: "healing-word",
    rng: sequence([0.5])
  });
  assert.equal(spell.healing.targetAfter.hp, 9);

  const encounter = generateEncounter({ threat: 3, partySize: 4, theme: "balanced" });
  assert.equal(encounter.budget, 12);
  assert.equal(encounter.spent <= encounter.budget, true);
  assert.equal(encounter.enemies.length > 1, true);
  assert.equal(encounter.enemies.every((enemy) => enemy.hp > 0 && enemy.actions.length > 0), true);
});

test("rules expose repo-local SRD-style knowledge sources with attribution boundaries", () => {
  const sources = listRuleKnowledgeSources();

  assert.equal(sources.length >= 2, true);
  assert.equal(sources.every((source) => source.license === "CC-BY-4.0"), true);
  assert.equal(sources.some((source) => source.url === "https://www.dndbeyond.com/srd"), true);
  assert.equal(sources.some((source) => source.url.includes("SRD_CC_v5.1.pdf")), true);
  assert.equal(sources.every((source) => /do not copy long|do not embed long|rules reference/i.test(source.useBoundary)), true);
});

test("rules build SRD-style action guidance and season weather hooks without external text", () => {
  const character = createCharacter({
    name: "Rin",
    raceId: "elf",
    classId: "ranger",
    allocations: { body: 4, agility: 7, mind: 4, presence: 5, spirit: 7 }
  });
  const actionGuidance = suggestRuleActions({
    character,
    actionText: "track the courier through thunder and rain",
    maxSuggestions: 2
  });
  const environment = resolveSeasonWeatherHooks({
    scene: { weather: "thunderstorm", season: "winter", ambience: "cold rain on slate" },
    actionText: "track the courier"
  });
  const context = buildRuleKnowledgeContext({
    room: { scene: { weather: "thunderstorm", season: "winter", ambience: "cold rain on slate" } },
    player: { character },
    actionText: "track the courier through thunder and rain",
    check: { total: 9, dc: 13 },
    beat: "complication"
  });

  assert.equal(actionGuidance.intent, "travel");
  assert.equal(actionGuidance.suggestions.length, 2);
  assert.equal(actionGuidance.suggestions.some((entry) => entry.skill === "survival"), true);
  assert.equal(environment.weather, "storm");
  assert.equal(environment.season, "winter");
  assert.equal(environment.tags.includes("weather:storm"), true);
  assert.equal(context.framework, "repo-local-srd-style");
  assert.equal(context.sources.length >= 2, true);
  assert.equal(context.licenseBoundary.includes("no long SRD text"), true);
  assert.equal(context.tags.includes("knowledge:srd-style"), true);
  assert.equal(context.randomness.mode, "deterministic-table");
  assert.equal(context.promptDirectives.some((entry) => entry.includes("Attribution boundary")), true);
});

function sequence(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
