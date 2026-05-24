import test from "node:test";
import assert from "node:assert/strict";
import {
  SPELLS,
  allocateAttributes,
  buildClassProgression,
  buildRuleKnowledgeContext,
  calculateDefense,
  createCharacter,
  getEquipment,
  getSpell,
  getWeapon,
  listStarterSpellOptions,
  listWarriorSpecializations,
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
  assert.deepEqual(character.knownSpells, ["firebolt", "sleep", "arcane-shield", "glass-echo", "storm-arc"]);
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

test("expanded spell catalog exposes bounded resources, tags, and support effects", () => {
  const spells = Object.values(SPELLS);
  const allowedActions = new Set(["cast", "support", "defend", "move"]);

  assert.equal(spells.length >= 19, true);
  for (const spell of spells) {
    assert.equal(spell.kind, "spell", spell.id);
    assert.equal(allowedActions.has(spell.action), true, spell.id);
    assert.equal(Number.isInteger(spell.resource?.manaCost), true, spell.id);
    assert.equal(spell.resource.manaCost >= 0 && spell.resource.manaCost <= 3, true, spell.id);
    assert.equal(spell.tags.length >= 2, true, spell.id);
    assert.equal(Boolean(spell.damage || spell.healing || spell.effect), true, spell.id);
  }

  const cleric = createCharacter({
    name: "Mira",
    raceId: "human",
    classId: "cleric",
    allocations: { body: 5, agility: 3, mind: 5, presence: 7, spirit: 7 }
  });
  const cleansed = resolveSpellEffect({
    caster: cleric,
    target: { id: "scout", hp: 7, maxHp: 9, conditions: ["poisoned", "drowsy"], resistances: [] },
    spellId: "cleanse-poison"
  });
  assert.deepEqual(cleansed.targetAfter.conditions, ["drowsy"]);
  assert.equal(cleansed.targetAfter.resistances.includes("poison"), true);
  assert.equal(cleansed.resource.manaCost, 2);

  const oath = resolveSpellEffect({
    caster: cleric,
    target: { id: "frontline", hp: 10, maxHp: 12, resistances: [] },
    spellId: "iron-oath"
  });
  assert.equal(oath.targetAfter.temporaryHp, 5);
  assert.equal(oath.targetAfter.resistances.includes("fear"), true);

  const hex = resolveSpellEffect({
    caster: cleric,
    target: { id: "rival", hp: 9, maxHp: 9, conditions: [] },
    spellId: "blood-moon-hex"
  });
  assert.deepEqual(hex.targetAfter.conditions, ["cursed"]);

  const starfall = resolveSpellEffect({
    caster: createCharacter({
      name: "Iris",
      raceId: "human",
      classId: "mage",
      allocations: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 }
    }),
    target: { id: "cluster", hp: 18, maxHp: 18, defense: 8, resistances: [], weaknesses: [] },
    spellId: "starfall-rune",
    rng: sequence([0.8, 0.5, 0.5])
  });
  assert.equal(starfall.hit, true);
  assert.equal(starfall.damage.finalAmount, 8);
  assert.equal(starfall.resource.manaCost, 3);

  const mageOptions = listStarterSpellOptions("mage");
  assert.equal(mageOptions.length >= 7, true);
  assert.equal(mageOptions.every((option) => Boolean(getSpell(option.id))), true);
  assert.equal(listStarterSpellOptions("occultist").some((option) => option.id === "grave-whisper"), true);
  assert.equal(listStarterSpellOptions("envoy").some((option) => option.id === "lantern-sigil"), true);
});

test("warrior specializations deterministically affect attributes, equipment, skills, actions, and attacks", () => {
  const options = listWarriorSpecializations();
  assert.deepEqual(options.map((option) => option.id).sort(), ["berserker", "dual-wielder", "weapon-master"]);

  const dualWielder = createCharacter({
    name: "Vela",
    raceId: "human",
    classId: "warrior",
    specializationId: "dual-wielder",
    allocations: { body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 }
  });
  assert.equal(dualWielder.specialization.id, "dual-wielder");
  assert.equal(dualWielder.attributes.agility, 14);
  assert.equal(dualWielder.skills.melee, 6);
  assert.equal(dualWielder.skills.stealth, 3);
  assert.equal(dualWielder.equipment.includes("dagger"), true);
  assert.equal(dualWielder.actions.includes("offhand-attack"), true);
  assert.equal(dualWielder.resources.momentum.max, 1);

  const offhandStrike = resolveAttack({
    attacker: dualWielder,
    target: { id: "dummy", hp: 12, maxHp: 12, defense: 10, resistances: [], weaknesses: [] },
    weaponId: "dagger",
    rng: sequence([0.5]),
    damageRng: sequence([0.5])
  });
  assert.equal(offhandStrike.attackBonus, 7);
  assert.equal(offhandStrike.damageBonus, 1);
  assert.equal(offhandStrike.damage.finalAmount, 6);

  const weaponMaster = createCharacter({
    name: "Rook",
    raceId: "human",
    classId: "warrior",
    level: 3,
    specializationId: "weapon-master",
    allocations: { body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 }
  });
  assert.equal(weaponMaster.attributes.body, 17);
  assert.equal(weaponMaster.attributes.mind, 13);
  assert.equal(weaponMaster.equipment.includes("red-tassel-spear"), true);
  assert.equal(weaponMaster.actions.includes("action-surge"), true);
  assert.equal(weaponMaster.actions.includes("weapon-drill"), true);
  assert.equal(weaponMaster.progression.specialization.features.includes("mastery-swap"), true);

  const progression = buildClassProgression({ classId: "warrior", level: 5, specializationId: "berserker" });
  assert.equal(progression.features.includes("extra-attack"), true);
  assert.equal(progression.actions.includes("relentless-advance"), true);
  assert.equal(progression.resources.fury.max, 2);
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

test("rules prefer explicit scene season over descriptive leaf keywords", () => {
  const environment = resolveSeasonWeatherHooks({
    scene: {
      weatherState: "light rain",
      season: "spring",
      atmosphere: {
        season: "spring",
        soundscapeTags: ["location:forest", "season:spring", "weather:light-rain"]
      },
      ambience: "wet leaves, old harvest carts, and moss under the canopy"
    },
    actionText: "inspect the leaf marks near the trail"
  });
  const context = buildRuleKnowledgeContext({
    room: {
      scene: {
        weatherState: "light rain",
        season: "spring",
        atmosphere: {
          season: "spring",
          soundscapeTags: ["location:forest", "season:spring", "weather:light-rain"]
        },
        ambience: "wet leaves, old harvest carts, and moss under the canopy"
      }
    },
    actionText: "inspect the leaf marks near the trail",
    beat: "reveal"
  });
  const atmosphereOnly = resolveSeasonWeatherHooks({
    scene: {
      weatherState: "light rain",
      atmosphere: {
        season: "spring",
        soundscapeTags: ["location:forest", "season:spring", "weather:light-rain"]
      },
      ambience: "wet leaves, old harvest carts, and moss under the canopy"
    },
    actionText: "inspect the leaf marks near the trail"
  });
  const soundscapeTagOnly = resolveSeasonWeatherHooks({
    scene: {
      weatherState: "light rain",
      atmosphere: {
        soundscapeTags: ["location:forest", "season:spring", "weather:light-rain"]
      },
      ambience: "wet leaves, old harvest carts, and moss under the canopy"
    },
    actionText: "inspect the leaf marks near the trail"
  });

  assert.equal(environment.weather, "rain");
  assert.equal(environment.season, "spring");
  assert.equal(atmosphereOnly.season, "spring");
  assert.equal(soundscapeTagOnly.season, "spring");
  assert.equal(environment.tags.includes("season:spring"), true);
  assert.equal(context.environment.season, "spring");
  assert.equal(context.tags.includes("season:spring"), true);
});

function sequence(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
