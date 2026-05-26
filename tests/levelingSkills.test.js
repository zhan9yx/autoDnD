import test from "node:test";
import assert from "node:assert/strict";
import {
  COMBAT_SKILLS,
  buildClassProgression,
  createCharacter,
  describeCombatSkillRuleCard,
  describeSpellRuleCard,
  getRuleAssetBinding
} from "../src/core/rules.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { createInventoryEntry } from "../src/core/itemCatalog.js";
import { MemoryRoomStore } from "../src/core/storage.js";

test("class spell advancement grants level-gated spells and exposes choice pools", () => {
  const mageProgression = buildClassProgression({ classId: "mage", level: 3 });
  assert.equal(mageProgression.spells.includes("ember-lance"), true);
  assert.equal(mageProgression.spells.includes("echo-ledger"), true);
  assert.equal(mageProgression.spellChoices.some((choice) => choice.id === "mage-level-2-school"), true);
  assert.equal(mageProgression.spellChoices.some((choice) => choice.options.some((option) => option.id === "hush-ring")), true);

  const mage = createCharacter({
    name: "Iris",
    raceId: "human",
    classId: "mage",
    level: 3,
    allocations: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 },
    selectedSpellIds: ["hush-ring"]
  });
  assert.equal(mage.knownSpells.includes("ember-lance"), true);
  assert.equal(mage.knownSpells.includes("echo-ledger"), true);
  assert.equal(mage.knownSpells.includes("hush-ring"), true);
  assert.equal(mage.availableSpellChoices.length >= 2, true);

  const cleric = buildClassProgression({ classId: "cleric", level: 2 });
  const ranger = buildClassProgression({ classId: "ranger", level: 2 });
  const envoy = buildClassProgression({ classId: "envoy", level: 2 });
  assert.deepEqual(cleric.spells, ["field-suture"]);
  assert.deepEqual(ranger.spells, ["mist-bridge"]);
  assert.deepEqual(envoy.spells, ["bastion-mark"]);
});

test("warrior branches unlock distinct combat skills and level-three choices", () => {
  assert.equal(Object.keys(COMBAT_SKILLS).length >= 29, true);

  const dual = buildClassProgression({ classId: "warrior", level: 3, specializationId: "dual-wielder" });
  const berserker = buildClassProgression({ classId: "warrior", level: 3, specializationId: "berserker" });
  const master = buildClassProgression({ classId: "warrior", level: 3, specializationId: "weapon-master" });
  const commander = buildClassProgression({ classId: "warrior", level: 3, specializationId: "tactical-commander" });

  assert.equal(dual.combatSkills.includes("cross-cut"), true);
  assert.equal(dual.combatSkillChoices[0].options.some((option) => option.id === "mobile-parry"), true);
  assert.equal(berserker.combatSkills.includes("break-line"), true);
  assert.equal(berserker.combatSkillChoices[0].options.some((option) => option.id === "intimidating-roar"), true);
  assert.equal(master.combatSkills.includes("weapon-drill"), true);
  assert.equal(master.combatSkillChoices[0].options.some((option) => option.id === "disarming-angle"), true);
  assert.equal(commander.combatSkills.includes("mark-target"), true);
  assert.equal(commander.combatSkillChoices[0].options.some((option) => option.id === "commander-read"), true);

  const weaponMaster = createCharacter({
    name: "Rook",
    raceId: "human",
    classId: "warrior",
    level: 3,
    specializationId: "weapon-master",
    selectedCombatSkillIds: ["disarming-angle"],
    allocations: { body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 }
  });
  assert.equal(weaponMaster.combatSkills.includes("weapon-drill"), true);
  assert.equal(weaponMaster.combatSkills.includes("disarming-angle"), true);
  assert.equal(weaponMaster.actions.includes("called-shot"), true);
  assert.equal(weaponMaster.specialization.art.assetId, "aidm-class-badge-046-11");
});

test("spell, status, action, and fallback art bindings are stable without manifest registration", () => {
  const ember = describeSpellRuleCard("ember-lance");
  assert.equal(ember.art.assetId, "aidm-spell-icon-043-01");
  assert.equal(ember.art.semanticKey, "spellId:ember-lance");
  assert.equal(ember.art.binaryDelivery.status, "external-pending-binary");
  assert.equal(ember.art.fallbackFile, "assets/spells/ember-bolt.svg");
  assert.equal(ember.scrollArt.assetId, "aidm-scroll-icon-044-05");

  const sleep = describeSpellRuleCard("sleep");
  assert.equal(sleep.statusEffect.art.assetId, "aidm-status-icon-045-02");

  const markTarget = describeCombatSkillRuleCard("mark-target");
  assert.equal(markTarget.art.assetId, "aidm-action-icon-042-12");
  assert.equal(markTarget.category, "control");

  const missing = getRuleAssetBinding("spell", "future-unregistered-spell");
  assert.equal(missing.assetId, null);
  assert.equal(missing.manifestStatus, "unregistered-safe-fallback");
});

test("item-driven level-up applies learned spells and combat skills through game engine", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: "Mage Progression" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Iris",
    classId: "mage",
    stats: { body: 1, agility: 2, mind: 5, presence: 2, spirit: 4 }
  });

  const stored = await engine.requireRoom(room.id);
  stored.players[0].character.inventory.push(createInventoryEntry("field-primer", {
    condition: "fine",
    instanceId: "mage-primer",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const before = await engine.getRoom(room.id);
  const progressed = await engine.useItem(room.id, {
    playerId: joined.player.id,
    itemId: "mage-primer",
    expectedVersion: before.version
  });

  const character = progressed.players[0].character;
  const event = progressed.transcript.at(-1);
  assert.equal(character.level, 2);
  assert.equal(character.knownSpells.includes("ember-lance"), true);
  assert.equal(character.spells.includes("ember-lance"), true);
  assert.equal(character.combatSkills.includes("recover-mana"), true);
  assert.equal(character.actions.includes("recover-mana"), true);
  assert.equal(event.inventory.stateDeltas.learnedSpells.includes("ember-lance"), true);
  assert.equal(event.inventory.stateDeltas.progression.actions.includes("recover-mana"), true);
  assert.match(event.text, /Ember Lance/);
  assert.match(event.text, /Recover Mana/);
});
