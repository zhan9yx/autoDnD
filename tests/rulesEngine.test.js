import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ATTRIBUTE_BUDGET,
  allocateAttributes,
  listCharacterCreationPresets
} from "../src/core/rules.js";

test("character creation presets spend the full point budget and stay within caps", () => {
  const presets = listCharacterCreationPresets();

  assert.equal(presets.length >= 8, true);
  for (const preset of presets) {
    const allocationValues = Object.values(preset.allocations);
    const spent = allocationValues.reduce((sum, value) => sum + value, 0);

    assert.equal(spent, DEFAULT_ATTRIBUTE_BUDGET.points, preset.id);
    assert.equal(
      allocationValues.every((value) => value <= DEFAULT_ATTRIBUTE_BUDGET.maxBeforeAncestry),
      true,
      preset.id
    );

    const budget = allocateAttributes({ allocations: preset.allocations });
    assert.equal(budget.remaining, 0, preset.id);
  }
});

test("character creation presets expose rule-backed starting spell ids", () => {
  const byClass = Object.fromEntries(listCharacterCreationPresets().map((preset) => [preset.classId, preset]));

  assert.deepEqual(byClass.warrior.knownSpells, []);
  assert.deepEqual(byClass.rogue.knownSpells, []);
  assert.deepEqual(byClass.mage.knownSpells, ["firebolt", "sleep", "arcane-shield", "glass-echo", "storm-arc"]);
  assert.deepEqual(byClass.cleric.knownSpells, ["healing-word", "radiant-bolt", "ward", "cleanse-poison"]);
  assert.deepEqual(byClass.ranger.knownSpells, ["binding-vines", "frost-bind"]);
  assert.deepEqual(byClass.bard.knownSpells, ["healing-word", "sleep", "glass-echo"]);
  assert.deepEqual(byClass.occultist.knownSpells, ["firebolt", "sleep", "binding-vines", "thunder-step"]);
  assert.deepEqual(byClass.envoy.knownSpells, ["ward", "glass-echo"]);
  assert.equal(byClass.mage.starterSpellOptions.length >= 5, true);
  assert.equal(byClass.cleric.starterSpellOptions.some((option) => option.id === "cleanse-poison"), true);
  assert.equal(byClass.ranger.starterSpellOptions.some((option) => option.id === "frost-bind"), true);
  assert.deepEqual(byClass.warrior.specializationOptions.map((option) => option.id).sort(), ["berserker", "defender", "dual-wielder", "tactical-commander", "weapon-master"]);
  assert.equal(byClass.warrior.specializationOptions.every((option) => option.actions.length > 0 && option.equipment.length > 0), true);
  assert.equal(byClass.warrior.specializationOptions.every((option) => option.impact.actions && option.recommendedAttributes.length > 0), true);
});
