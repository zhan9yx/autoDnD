import test from "node:test";
import assert from "node:assert/strict";
import { buildUtterancePlan, getSpeakerProfile, listTtsProviders, voiceHintsForProfile } from "../src/core/ttsProfiles.js";

test("TTS provider catalog includes lightweight open-source options", () => {
  const providers = listTtsProviders();

  assert.equal(providers.some((provider) => provider.id === "browser-speech-synthesis" && provider.cost === "free"), true);
  assert.equal(providers.some((provider) => provider.id === "espeak-ng" && provider.openSource), true);
  assert.equal(providers.some((provider) => provider.id === "piper" && provider.openSource), true);
});

test("speaker profiles distinguish narrator rules system and players", () => {
  const aidm = getSpeakerProfile("AIDM", "en");
  const rules = getSpeakerProfile("Rules", "en");
  const playerA = getSpeakerProfile("Mei", "zh");
  const playerB = getSpeakerProfile("Bram", "zh");

  assert.equal(aidm.role, "narrator");
  assert.equal(rules.role, "rules");
  assert.equal(playerA.role, "player");
  assert.notEqual(playerA.pitch, playerB.pitch);
});

test("utterance plans are language-aware", () => {
  const plan = buildUtterancePlan({ author: "AIDM", text: "线索出现。", language: "zh" });
  const hints = voiceHintsForProfile(plan.profile, "zh");

  assert.equal(plan.language, "zh-CN");
  assert.equal(plan.provider, "browser-speech-synthesis");
  assert.equal(hints.espeakVoice, "zh");
  assert.equal(hints.piperVoicePattern, "zh_CN");
});
