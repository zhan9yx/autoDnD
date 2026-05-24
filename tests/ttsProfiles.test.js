import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUtterancePlan,
  getSpeakerProfile,
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
  const ids = enProfiles.map((profile) => profile.id);

  assert.equal(enProfiles.length >= 26, true);
  assert.deepEqual(zhProfiles.map((profile) => profile.id), ids);
  for (const id of ["warrior", "ranger", "mage", "cleric", "rogue", "bard", "captain", "artisan", "dwarf", "elf", "orc", "construct", "occult-scholar", "oracle", "trickster", "noble", "young-hero", "elder-woman", "spirit", "monster"]) {
    assert.equal(ids.includes(id), true);
  }
  assert.equal(zhProfiles.find((profile) => profile.id === "mage")?.label, "法师");
  assert.equal(enProfiles.find((profile) => profile.id === "mage")?.displayName.zh, "法师");
  assert.equal(zhProfiles.find((profile) => profile.id === "mage")?.displayName.en, "Mage");
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
