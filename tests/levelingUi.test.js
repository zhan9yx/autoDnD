import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createCharacter } from "../src/core/rules.js";

test("leveling UI consumes Tesla spell and combat-skill advancement fields", async () => {
  const app = await readFile("public/app.js", "utf8");

  const mage = createCharacter({
    name: "Iris",
    raceId: "human",
    classId: "mage",
    level: 3,
    allocations: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 },
    selectedSpellIds: ["hush-ring"]
  });
  const warrior = createCharacter({
    name: "Rook",
    raceId: "human",
    classId: "warrior",
    level: 3,
    specializationId: "weapon-master",
    selectedCombatSkillIds: ["disarming-angle"],
    allocations: { body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 }
  });

  assert.equal(mage.availableSpellChoices.some((choice) => choice.options.some((option) => option.art?.file)), true);
  assert.equal(mage.knownSpells.includes("hush-ring"), true);
  assert.equal(warrior.availableCombatSkillChoices.some((choice) => choice.options.some((option) => option.art?.file)), true);
  assert.equal(warrior.combatSkills.includes("disarming-angle"), true);
  assert.equal(Boolean(warrior.specialization?.art?.file), true);

  assert.match(app, /function levelingSummaryMarkup\(character = \{\}\)/);
  assert.match(app, /character\.availableSpellChoices[\s\S]*character\.progression\?\.spellChoices/);
  assert.match(app, /character\.availableCombatSkillChoices[\s\S]*character\.progression\?\.combatSkillChoices/);
  assert.match(app, /data-leveling-summary/);
  assert.match(app, /data-leveling-choice-kind="\$\{escapeHtml\(kind\)\}"/);
  assert.match(app, /data-choice-selected="\$\{selected \? "true" : "false"\}"/);
  assert.match(app, /specializationSummaryMarkup\(character\)/);
  assert.match(app, /ruleAssetMarkup\(specialization\.art \|\| character\.classArt/);
  assert.match(app, /runtimeAssetFallbackAttrs\(file, asset\?\.fallbackFile\)/);
  assert.match(app, /learnedRuleEntries\(character, "combatSkill"\)/);
  assert.match(app, /ruleChoiceOptionIndex\(character, "spell"\)/);
  assert.match(app, /spellArtMarkup\(spell, label, "spell-chip-art", ruleEntryAsset\(option \|\| spell, "spell"\)\)/);
  assert.match(app, /function ruleAssetMarkup\(asset, label, className, fallbackSeed = ""\)[\s\S]*const fallback = initials\(fallbackSeed \|\| label \|\| "\?"\)/);
  assert.doesNotMatch(app, /initialsForName/);
});

test("character and log drawer render paths stay non-empty for transcript and progression detail", async () => {
  const app = await readFile("public/app.js", "utf8");

  assert.match(app, /function render\(\)[\s\S]*renderCharacterDrawer\(\);[\s\S]*renderMarketDrawer\(\);[\s\S]*renderDicePanel\(\);[\s\S]*renderTranscript\(\);/);
  assert.match(app, /function renderCharacterDrawer\(\)[\s\S]*renderCharacterProgress\(character\);[\s\S]*renderEquipmentSummary\(character\.inventory \|\| \[\], character\.equipmentSummary\);[\s\S]*renderKnownSpells\(character\);[\s\S]*renderInventory\(character\.inventory \|\| \[\]\);/);
  assert.match(app, /function renderTranscript\(\)[\s\S]*const entries = room\.transcript \|\| \[\];[\s\S]*const drawerEntries = filteredLogEntries\(entries\);[\s\S]*renderTranscriptEntries\(els\.fullTranscript, drawerEntries, \{ density: logDensity, surface: "drawer" \}\);[\s\S]*logEntries/);
});

test("leveling UI keeps long option text constrained and action hints capability-aware", async () => {
  const [app, css] = await Promise.all([
    readFile("public/app.js", "utf8"),
    readFile("public/styles.css", "utf8")
  ]);

  assert.match(app, /function enhanceActionModeHint\(guidance, isChat = false\)/);
  assert.match(app, /characterActionCueText\(actionCueCharacter\(guidance\)\)/);
  assert.match(app, /learnedRuleEntries\(character, "spell"\)/);
  assert.match(app, /learnedRuleEntries\(character, "combatSkill"\)/);
  assert.match(app, /actionableInventoryLabels\(character, 2\)/);
  assert.match(app, /els\.actionForm\.dataset\.actionCue = cue \? "options" : "basic"/);
  assert.match(app, /els\.actionModeHint\.textContent = t\(uiLanguage, guidance\.hintKey, \{ name: guidance\.activeName \}\);[\s\S]*enhanceActionModeHint\(guidance, isChat\)/);

  assert.match(css, /\.leveling-summary\s*\{[\s\S]*grid-column: 1 \/ -1/);
  assert.match(css, /\.leveling-choice-grid\s*\{[\s\S]*grid-template-columns: repeat\(auto-fit, minmax\(176px, 1fr\)\)/);
  assert.match(css, /\.leveling-choice-card\s*\{[\s\S]*grid-template-columns: 30px minmax\(0, 1fr\) auto[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.leveling-summary-head strong,[\s\S]*\.leveling-chip em\s*\{[\s\S]*text-overflow: ellipsis[\s\S]*white-space: nowrap/);
  assert.match(css, /\.action-form\[data-action-cue="options"\] \.action-mode-hint/);
});
