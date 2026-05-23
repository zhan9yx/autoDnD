import test from "node:test";
import assert from "node:assert/strict";
import {
  allocateAttributes,
  createCharacter,
  resolveAttack,
  resolveDamage,
  resolveHealing,
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

function sequence(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
