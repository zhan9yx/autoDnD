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

  assert.equal(enProfiles.length >= 16, true);
  assert.deepEqual(zhProfiles.map((profile) => profile.id), ids);
  for (const id of ["warrior", "ranger", "mage", "cleric", "rogue", "bard", "dwarf", "elf", "orc", "construct", "occult-scholar"]) {
    assert.equal(ids.includes(id), true);
  }
  assert.equal(zhProfiles.find((profile) => profile.id === "mage")?.label, "法师");
  assert.equal(enProfiles.every((profile) => profile.hints.language === "en-US"), true);
  assert.equal(zhProfiles.every((profile) => profile.hints.language === "zh-CN"), true);
});

test("speaker profile mapping is stable for DM, NPC role types, and players", () => {
  const dm = getSpeakerProfile("Mysterious host", "en", { speakerType: "dm" });
  const orc = getSpeakerProfile("NPC orc raider", "en", { speakerType: "npc" });
  const scholar = getSpeakerProfile("秘术学者", "zh", { speakerType: "npc" });
  const construct = getSpeakerProfile("clockwork automaton", "en", { roleType: "construct" });
  const playerA = getSpeakerProfile("Mira", "zh");
  const playerB = getSpeakerProfile("Mira", "zh");

  assert.equal(dm.id, "aidm");
  assert.equal(orc.id, "orc");
  assert.equal(scholar.id, "occult-scholar");
  assert.equal(construct.id, "construct");
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
