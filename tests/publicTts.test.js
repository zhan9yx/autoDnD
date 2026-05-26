import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildUtterancePlan,
  getSpeakerProfile,
  installSpeechSynthesisLifecycle,
  listVoiceProfileGroups,
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
  const enGroups = listVoiceProfileGroups("en");
  const zhGroups = listVoiceProfileGroups("zh");
  const ids = enProfiles.map((profile) => profile.id);

  assert.equal(enProfiles.length >= 30, true);
  assert.deepEqual(zhProfiles.map((profile) => profile.id), ids);
  assert.deepEqual(enGroups.map((group) => group.id), ["core", "people", "lineage", "special"]);
  assert.equal(enGroups.find((group) => group.id === "lineage")?.displayName.zh, "血统与体型");
  assert.equal(zhGroups.find((group) => group.id === "special")?.label, "NPC 特殊声线");
  assert.equal(ids.includes("bard"), true);
  assert.equal(ids.includes("captain"), true);
  assert.equal(ids.includes("artisan"), true);
  assert.equal(ids.includes("guide"), true);
  assert.equal(ids.includes("weathered-guide"), true);
  assert.equal(ids.includes("battle-master"), true);
  assert.equal(ids.includes("court-herald"), true);
  assert.equal(ids.includes("construct"), true);
  assert.equal(ids.includes("tiefling"), true);
  assert.equal(ids.includes("halfling"), true);
  assert.equal(ids.includes("gnome"), true);
  assert.equal(ids.includes("dragonborn"), true);
  assert.equal(ids.includes("occult-scholar"), true);
  assert.equal(ids.includes("shadow-informant"), true);
  assert.equal(ids.includes("ritual-chanter"), true);
  assert.equal(ids.includes("oracle"), true);
  assert.equal(ids.includes("trickster"), true);
  assert.equal(ids.includes("elder-woman"), true);
  assert.equal(ids.includes("spirit"), true);
  assert.equal(ids.includes("monster"), true);
  assert.equal(enProfiles.every((profile) => Array.isArray(profile.ambience) && profile.ambience.length > 0), true);
  assert.equal(enProfiles.every((profile) => profile.displayName.en && profile.displayName.zh), true);
  assert.equal(enProfiles.every((profile) => profile.bilingualLabel.includes(" / ")), true);
  assert.equal(enProfiles.every((profile) => profile.group.displayName.en && profile.group.displayName.zh), true);
  assert.equal(zhProfiles.every((profile) => profile.menuGroupLabel === profile.group.displayName.zh), true);
  assert.equal(enProfiles.every((profile) => profile.voiceSummary.en && profile.voiceSummary.zh), true);
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
  const guide = buildUtterancePlan({ author: "Action Guide", language: "en", speakerType: "system" });
  const elf = buildUtterancePlan({ author: "Moon elf ranger", language: "en", speakerType: "npc" });
  const weatheredGuide = buildUtterancePlan({ author: "caravan scout", language: "en", speakerType: "npc" });
  const battleMaster = buildUtterancePlan({ author: "战术教官", language: "zh", speakerType: "npc" });
  const courtHerald = buildUtterancePlan({ author: "royal herald", language: "en", speakerType: "npc" });
  const informant = buildUtterancePlan({ author: "线人", language: "zh", speakerType: "npc" });
  const chanter = buildUtterancePlan({ author: "ritual chanter", language: "en", speakerType: "npc" });
  const tiefling = buildUtterancePlan({ author: "infernal pact envoy", language: "en", speakerType: "npc" });
  const halfling = buildUtterancePlan({ author: "半身人厨师", language: "zh", speakerType: "npc" });
  const gnome = buildUtterancePlan({ author: "gnome tinker", language: "en", speakerType: "npc" });
  const dragonborn = buildUtterancePlan({ author: "龙裔传令官", language: "zh", speakerType: "npc" });
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
    [narrator.profile.role, rules.profile.role, guide.profile.role, elf.profile.role, weatheredGuide.profile.role, battleMaster.profile.role, courtHerald.profile.role, informant.profile.role, chanter.profile.role, tiefling.profile.role, halfling.profile.role, gnome.profile.role, dragonborn.profile.role, cleric.profile.role, captain.profile.role, artisan.profile.role, oracle.profile.role, trickster.profile.role, spirit.profile.role, elderWoman.profile.role, player.profile.role],
    ["narrator", "rules", "guide", "ranger", "weathered-guide", "battle-master", "court-herald", "shadow-informant", "ritual-chanter", "tiefling", "halfling", "gnome", "dragonborn", "cleric", "captain", "artisan", "oracle", "trickster", "spirit", "elder-woman", "player"]
  );
  assert.equal(player.language, "zh-CN");
  assert.equal(player.profile.id, playerAgain.id);
  assert.equal(player.profile.pitch, playerAgain.pitch);
  assert.notEqual(guide.profile.pitch, battleMaster.profile.pitch);
});

test("long speech text is normalized and capped to four chunks", () => {
  const chunks = splitSpeechText(" First line.   Second line! Third line? Fourth line。 Fifth line！ Sixth line？ ");

  assert.deepEqual(chunks, ["First line.", "Second line!", "Third line?", "Fourth line。"]);
  assert.equal(chunks.length, 4);
});

test("browser TTS lifecycle pauses hidden speech and cancels on pagehide", async () => {
  const document = createMockEventTarget({ hidden: false, visibilityState: "visible" });
  const window = createMockEventTarget();
  const speechSynthesis = createMockSpeechSynthesis();
  const states = [];
  const lifecycle = installSpeechSynthesisLifecycle({
    windowRef: window,
    documentRef: document,
    speechSynthesis,
    onStateChange: (state) => states.push(state)
  });

  assert.equal(lifecycle.supported, true);
  assert.equal(document.listenerCount("visibilitychange"), 1);
  assert.equal(window.listenerCount("pagehide"), 1);
  assert.equal(window.listenerCount("pageshow"), 1);

  document.hidden = true;
  await document.dispatchEvent({ type: "visibilitychange" });
  assert.equal(speechSynthesis.pauseCount, 1);
  assert.equal(speechSynthesis.cancelCount, 0);
  assert.equal(lifecycle.pausedByLifecycle, true);
  assert.equal(states.at(-1).reason, "visibilitychange-hidden");

  document.hidden = false;
  await document.dispatchEvent({ type: "visibilitychange" });
  assert.equal(speechSynthesis.resumeCount, 1);
  assert.equal(lifecycle.pausedByLifecycle, false);
  assert.equal(states.at(-1).reason, "visibilitychange-visible");

  speechSynthesis.speaking = true;
  await window.dispatchEvent({ type: "pagehide" });
  assert.equal(speechSynthesis.cancelCount, 1);
  assert.equal(lifecycle.canceledOnPageHide, true);
  assert.equal(states.at(-1).reason, "pagehide");

  await window.dispatchEvent({ type: "pageshow" });
  assert.equal(speechSynthesis.resumeCount, 1);
  assert.equal(lifecycle.canceledOnPageHide, false);

  lifecycle.dispose();
  assert.equal(document.listenerCount("visibilitychange"), 0);
  assert.equal(window.listenerCount("pagehide"), 0);
  assert.equal(window.listenerCount("pageshow"), 0);
});

test("browser TTS lifecycle auto-installs for browser imports", async () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const document = createMockEventTarget({ hidden: false, visibilityState: "visible" });
  const speechSynthesis = createMockSpeechSynthesis();
  const window = createMockEventTarget({ speechSynthesis });

  try {
    globalThis.window = window;
    globalThis.document = document;
    const moduleUrl = new URL("../public/tts.js", import.meta.url);
    moduleUrl.searchParams.set("autoInstallLifecycle", String(Date.now()));

    await import(moduleUrl.href);

    assert.equal(document.listenerCount("visibilitychange"), 1);
    assert.equal(window.listenerCount("pagehide"), 1);
    assert.equal(window.listenerCount("pageshow"), 1);

    document.hidden = true;
    document.visibilityState = "hidden";
    await document.dispatchEvent({ type: "visibilitychange" });
    assert.equal(speechSynthesis.pauseCount, 1);

    await window.dispatchEvent({ type: "pagehide" });
    assert.equal(speechSynthesis.cancelCount, 1);
  } finally {
    restoreGlobal("window", previousWindow);
    restoreGlobal("document", previousDocument);
  }
});

function createMockSpeechSynthesis() {
  return {
    speaking: true,
    pending: false,
    paused: false,
    pauseCount: 0,
    resumeCount: 0,
    cancelCount: 0,
    pause() {
      this.paused = true;
      this.speaking = false;
      this.pauseCount += 1;
    },
    resume() {
      this.paused = false;
      this.speaking = true;
      this.resumeCount += 1;
    },
    cancel() {
      this.paused = false;
      this.speaking = false;
      this.pending = false;
      this.cancelCount += 1;
    }
  };
}

function restoreGlobal(name, value) {
  if (value === undefined) {
    delete globalThis[name];
  } else {
    globalThis[name] = value;
  }
}

function createMockEventTarget(initialState = {}) {
  const listeners = new Map();
  return {
    ...initialState,
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    async dispatchEvent(event) {
      const normalizedEvent = typeof event === "string" ? { type: event } : event;
      for (const listener of listeners.get(normalizedEvent.type) || []) {
        await listener(normalizedEvent);
      }
    },
    listenerCount(type) {
      return listeners.get(type)?.size || 0;
    }
  };
}
