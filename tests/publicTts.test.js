import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildUtterancePlan,
  getSpeakerProfile,
  listVoiceProfiles,
  OPEN_SOURCE_TTS_PROVIDERS,
  selectVoice,
  splitSpeechText,
  TTS_PROVIDER_CATALOG
} from "../public/tts.js";

test("browser TTS voice selection prefers explicit voices and filters by plan language", () => {
  const voices = [
    { name: "Samantha", lang: "en-US" },
    { name: "Li Ting", lang: "zh-CN" },
    { name: "Kyoko", lang: "ja-JP" },
    { name: "Alex", lang: "en-GB" }
  ];

  const zhPlan = buildUtterancePlan({ author: "AIDM", text: "雨声靠近。", language: "zh" });
  const enPlan = buildUtterancePlan({ author: "Rules", text: "Roll with advantage.", language: "en" });

  assert.equal(selectVoice(voices, zhPlan)?.name, "Li Ting");
  assert.equal(selectVoice(voices, enPlan)?.lang.startsWith("en"), true);
  assert.equal(selectVoice(voices, zhPlan, "Alex")?.name, "Alex");
});

test("browser TTS voice selection prefers local system voices before remote matches", () => {
  const voices = [
    { name: "Remote Daniel", lang: "en-US", localService: false },
    { name: "Local Alex", lang: "en-US", localService: true },
    { name: "Li Ting", lang: "zh-CN", localService: true }
  ];
  const plan = buildUtterancePlan({ author: "Rules", text: "Roll with advantage.", language: "en" });

  assert.equal(selectVoice(voices, plan)?.name, "Local Alex");
  assert.equal(selectVoice(voices, plan, "Remote Daniel")?.name, "Remote Daniel");
});

test("public provider catalog keeps local open-source options separate from browser fallback", () => {
  assert.deepEqual(TTS_PROVIDER_CATALOG.map((provider) => provider.id), ["browser-speech-synthesis", "piper", "sherpa-onnx", "kokoro", "espeak-ng"]);
  assert.equal(TTS_PROVIDER_CATALOG.find((provider) => provider.id === "browser-speech-synthesis")?.default, true);
  assert.deepEqual(OPEN_SOURCE_TTS_PROVIDERS.map((provider) => provider.id), ["piper", "sherpa-onnx", "kokoro", "espeak-ng"]);
});

test("public voice profiles cover role catalog in both languages", () => {
  const enProfiles = listVoiceProfiles("en");
  const zhProfiles = listVoiceProfiles("zh");
  const ids = enProfiles.map((profile) => profile.id);

  assert.equal(enProfiles.length >= 26, true);
  assert.deepEqual(zhProfiles.map((profile) => profile.id), ids);
  assert.equal(ids.includes("bard"), true);
  assert.equal(ids.includes("captain"), true);
  assert.equal(ids.includes("artisan"), true);
  assert.equal(ids.includes("construct"), true);
  assert.equal(ids.includes("occult-scholar"), true);
  assert.equal(ids.includes("oracle"), true);
  assert.equal(ids.includes("trickster"), true);
  assert.equal(ids.includes("elder-woman"), true);
  assert.equal(ids.includes("spirit"), true);
  assert.equal(ids.includes("monster"), true);
  assert.equal(enProfiles.every((profile) => Array.isArray(profile.ambience) && profile.ambience.length > 0), true);
  assert.equal(enProfiles.every((profile) => profile.displayName.en && profile.displayName.zh), true);
  assert.equal(enProfiles.every((profile) => profile.personality && profile.usage), true);
  assert.equal(enProfiles.every((profile) => ["core", "people", "lineage", "special"].includes(profile.menuGroup)), true);
  assert.equal(enProfiles.every((profile) => profile.voiceTuning.rate === profile.rate && profile.voiceTuning.pitch === profile.pitch), true);
  assert.equal(enProfiles.filter((profile) => profile.useCases.includes("player")).length >= 12, true);
  assert.equal(enProfiles.filter((profile) => profile.useCases.includes("npc")).length >= 12, true);
  assert.equal(zhProfiles.find((profile) => profile.id === "bard")?.label, "吟游诗人");
});

test("settings voice picker exposes stable role profiles before browser voices", async () => {
  const app = await readFile("public/app.js", "utf8");

  assert.match(app, /listVoiceProfiles/);
  assert.match(app, /profile:\$\{profile\.id\}/);
  assert.match(app, /voice:\$\{voice\.name\}/);
  assert.match(app, /applySelectedVoiceProfile/);
  assert.match(app, /voiceHintsForProfile/);
  assert.match(app, /VOICE_PROFILE_GROUP_ORDER/);
  assert.match(app, /MAX_BROWSER_VOICE_OPTIONS = 12/);
  assert.match(app, /compactBrowserVoiceOptions/);
});

test("speaker plans map DM, NPC archetypes, and players to stable profiles", () => {
  const narrator = buildUtterancePlan({ author: "Host", language: "en", speakerType: "dm" });
  const rules = buildUtterancePlan({ author: "Rules", language: "en" });
  const elf = buildUtterancePlan({ author: "Moon elf ranger", language: "en", speakerType: "npc" });
  const cleric = buildUtterancePlan({ author: "牧师", language: "zh", speakerType: "npc" });
  const captain = buildUtterancePlan({ author: "watch commander", language: "en", speakerType: "npc" });
  const artisan = buildUtterancePlan({ author: "工匠", language: "zh", speakerType: "npc" });
  const oracle = buildUtterancePlan({ author: "temple prophet", language: "en", speakerType: "npc" });
  const trickster = buildUtterancePlan({ author: "masked gambler", language: "en", speakerType: "npc" });
  const spirit = buildUtterancePlan({ author: "old shrine ghost", language: "en", speakerType: "npc" });
  const elderWoman = buildUtterancePlan({ author: "village witness", language: "en", speakerType: "npc", gender: "female", age: "elder" });
  const player = buildUtterancePlan({ author: "Mira", language: "zh" });
  const playerAgain = getSpeakerProfile("Mira", "zh");

  assert.deepEqual(
    [narrator.profile.role, rules.profile.role, elf.profile.role, cleric.profile.role, captain.profile.role, artisan.profile.role, oracle.profile.role, trickster.profile.role, spirit.profile.role, elderWoman.profile.role, player.profile.role],
    ["narrator", "rules", "ranger", "cleric", "captain", "artisan", "oracle", "trickster", "spirit", "elder-woman", "player"]
  );
  assert.equal(player.language, "zh-CN");
  assert.equal(player.profile.id, playerAgain.id);
  assert.equal(player.profile.pitch, playerAgain.pitch);
});

test("long speech text is normalized and capped to four chunks", () => {
  const chunks = splitSpeechText(" First line.   Second line! Third line? Fourth line。 Fifth line！ Sixth line？ ");

  assert.deepEqual(chunks, ["First line.", "Second line!", "Third line?", "Fourth line。"]);
  assert.equal(chunks.length, 4);
});
