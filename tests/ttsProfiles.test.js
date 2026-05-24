import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUtterancePlan,
  getSpeakerProfile,
  listVoiceProfileGroups,
  listTtsProviders,
  listVoiceProfiles,
  voiceHintsForProfile
} from "../src/core/ttsProfiles.js";

test("TTS provider catalog keeps browser fallback and local open-source placeholders", () => {
  const providers = listTtsProviders();
  const ids = providers.map((provider) => provider.id);

  assert.deepEqual(ids, ["browser-speech-synthesis", "piper", "sherpa-onnx", "kokoro", "espeak-ng"]);
  assert.equal(providers.find((provider) => provider.id === "browser-speech-synthesis")?.default, true);
  assert.equal(providers.find((provider) => provider.id === "espeak-ng")?.requiresModelDownload, false);
  for (const id of ["piper", "sherpa-onnx", "kokoro", "espeak-ng"]) {
    const provider = providers.find((candidate) => candidate.id === id);
    assert.equal(provider.openSource, true);
    assert.equal(provider.status, "catalog-only");
  }
});

test("voice profile catalog covers stable bilingual role voices", () => {
  const enProfiles = listVoiceProfiles("en");
  const zhProfiles = listVoiceProfiles("zh");
  const enGroups = listVoiceProfileGroups("en");
  const zhGroups = listVoiceProfileGroups("zh");
  const ids = enProfiles.map((profile) => profile.id);

  assert.equal(enProfiles.length >= 30, true);
  assert.deepEqual(zhProfiles.map((profile) => profile.id), ids);
  assert.deepEqual(enGroups.map((group) => group.id), ["core", "people", "lineage", "special"]);
  assert.deepEqual(zhGroups.map((group) => group.displayName.en), enGroups.map((group) => group.label));
  assert.equal(zhGroups.find((group) => group.id === "people")?.label, "人物与职业");
  for (const id of ["guide", "warrior", "ranger", "mage", "cleric", "rogue", "bard", "captain", "artisan", "weathered-guide", "battle-master", "court-herald", "dwarf", "elf", "orc", "tiefling", "halfling", "gnome", "dragonborn", "construct", "occult-scholar", "shadow-informant", "ritual-chanter", "oracle", "trickster", "noble", "young-hero", "elder-woman", "spirit", "monster"]) {
    assert.equal(ids.includes(id), true);
  }
  assert.equal(zhProfiles.find((profile) => profile.id === "mage")?.label, "法师");
  assert.equal(enProfiles.find((profile) => profile.id === "mage")?.displayName.zh, "法师");
  assert.equal(zhProfiles.find((profile) => profile.id === "mage")?.displayName.en, "Mage");
  assert.equal(enProfiles.find((profile) => profile.id === "mage")?.bilingualLabel, "Mage / 法师");
  assert.equal(enProfiles.find((profile) => profile.id === "mage")?.group.displayName.zh, "人物与职业");
  assert.equal(zhProfiles.find((profile) => profile.id === "mage")?.menuGroupLabel, "人物与职业");
  assert.match(enProfiles.find((profile) => profile.id === "mage")?.voiceSummary.en, /Mage: measured, arcane, intense/);
  assert.match(zhProfiles.find((profile) => profile.id === "mage")?.voiceSummary.zh, /法师: 克制、奥术感、专注/);
  assert.equal(enProfiles.every((profile) => typeof profile.gender === "string" && typeof profile.age === "string"), true);
  assert.equal(enProfiles.every((profile) => Array.isArray(profile.ambience) && profile.ambience.length > 0), true);
  assert.equal(enProfiles.every((profile) => typeof profile.personality === "string" && profile.personality.length > 0), true);
  assert.equal(zhProfiles.every((profile) => typeof profile.usage === "string" && profile.usage.includes("适合")), true);
  assert.equal(enProfiles.every((profile) => profile.voiceTuning.rate === profile.rate && profile.voiceTuning.pitch === profile.pitch), true);
  assert.equal(enProfiles.filter((profile) => profile.useCases.includes("player")).length >= 12, true);
  assert.equal(enProfiles.filter((profile) => profile.useCases.includes("npc")).length >= 12, true);
  assert.equal(enProfiles.every((profile) => profile.hints.language === "en-US"), true);
  assert.equal(zhProfiles.every((profile) => profile.hints.language === "zh-CN"), true);
});

test("speaker profile mapping is stable for DM, NPC role types, and players", () => {
  const dm = getSpeakerProfile("Mysterious host", "en", { speakerType: "dm" });
  const orc = getSpeakerProfile("NPC orc raider", "en", { speakerType: "npc" });
  const scholar = getSpeakerProfile("秘术学者", "zh", { speakerType: "npc" });
  const construct = getSpeakerProfile("clockwork automaton", "en", { roleType: "construct" });
  const guide = getSpeakerProfile("next action", "en", { speakerType: "system" });
  const weatheredGuide = getSpeakerProfile("trail guide", "en", { speakerType: "npc" });
  const battleMaster = getSpeakerProfile("战术教官", "zh", { speakerType: "npc" });
  const courtHerald = getSpeakerProfile("royal herald", "en", { speakerType: "npc" });
  const informant = getSpeakerProfile("地下联系人", "zh", { speakerType: "npc" });
  const chanter = getSpeakerProfile("ritual chanter", "en", { speakerType: "npc" });
  const tiefling = getSpeakerProfile("infernal pact envoy", "en", { speakerType: "npc" });
  const halfling = getSpeakerProfile("半身人厨师", "zh", { speakerType: "npc" });
  const gnome = getSpeakerProfile("gnome tinker", "en", { speakerType: "npc" });
  const dragonborn = getSpeakerProfile("龙裔传令官", "zh", { speakerType: "npc" });
  const captain = getSpeakerProfile("camp commander", "en", { speakerType: "npc" });
  const artisan = getSpeakerProfile("blacksmith", "en", { speakerType: "npc" });
  const oracle = getSpeakerProfile("神谕者", "zh", { speakerType: "npc" });
  const trickster = getSpeakerProfile("masked jester", "en", { speakerType: "npc" });
  const noble = getSpeakerProfile("court lady", "en", { speakerType: "npc" });
  const elderWoman = getSpeakerProfile("village witness", "en", { speakerType: "npc", gender: "female", age: "elder" });
  const spirit = getSpeakerProfile("幽灵", "zh", { speakerType: "npc" });
  const monster = getSpeakerProfile("cave beast", "en", { speakerType: "npc" });
  const playerA = getSpeakerProfile("Mira", "zh");
  const playerB = getSpeakerProfile("Mira", "zh");

  assert.equal(dm.id, "aidm");
  assert.equal(orc.id, "orc");
  assert.equal(scholar.id, "occult-scholar");
  assert.equal(construct.id, "construct");
  assert.equal(guide.id, "guide");
  assert.equal(weatheredGuide.id, "weathered-guide");
  assert.equal(battleMaster.id, "battle-master");
  assert.equal(courtHerald.id, "court-herald");
  assert.equal(informant.id, "shadow-informant");
  assert.equal(chanter.id, "ritual-chanter");
  assert.equal(tiefling.id, "tiefling");
  assert.equal(halfling.id, "halfling");
  assert.equal(gnome.id, "gnome");
  assert.equal(dragonborn.id, "dragonborn");
  assert.equal(captain.id, "captain");
  assert.equal(artisan.id, "artisan");
  assert.equal(oracle.id, "oracle");
  assert.equal(trickster.id, "trickster");
  assert.equal(noble.id, "noble");
  assert.equal(elderWoman.id, "elder-woman");
  assert.equal(spirit.id, "spirit");
  assert.equal(monster.id, "monster");
  assert.equal(playerA.role, "player");
  assert.equal(playerA.id, playerB.id);
  assert.equal(playerA.pitch, playerB.pitch);
  assert.notDeepEqual(
    [guide.rate, guide.pitch, guide.volume],
    [battleMaster.rate, battleMaster.pitch, battleMaster.volume]
  );
});

test("utterance plans are language-aware and keep local provider hints", () => {
  const plan = buildUtterancePlan({ author: "女法师", text: "线索出现。", language: "zh", speakerType: "npc" });
  const hints = voiceHintsForProfile(plan.profile, "zh");

  assert.equal(plan.provider, "browser-speech-synthesis");
  assert.equal(plan.language, "zh-CN");
  assert.equal(plan.profile.id, "mage");
  assert.equal(hints.espeakVoice.startsWith("zh"), true);
  assert.equal(hints.piperVoicePattern.startsWith("zh_CN"), true);
  assert.equal(hints.sherpaVoicePattern.startsWith("zh_CN"), true);
  assert.equal(hints.kokoroVoicePattern.startsWith("z"), true);
});
