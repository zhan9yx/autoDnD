import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("web UI exposes bilingual controls and voice controls", async () => {
  const html = await readFile("public/index.html", "utf8");

  assert.match(html, /id="createLanguageSelect"/);
  assert.match(html, /id="languageSelect"/);
  assert.match(html, /id="voiceToggle"/);
  assert.match(html, /id="readLatestButton"/);
  assert.match(html, /id="voiceSelect"/);
  assert.match(html, /id="ambienceToggle"/);
  assert.match(html, /id="ambienceMaster"/);
  assert.match(html, /id="sceneBackdrop"/);
  assert.match(html, /id="rewardToast"/);
  assert.match(html, /id="rewardList"/);
  assert.match(html, /data-drawer-open="party"/);
  assert.match(html, /data-drawer-open="state"/);
  assert.match(html, /data-drawer-open="log"/);
  assert.match(html, /id="drawerScrim"/);
  assert.match(html, /id="fullTranscript"/);
  assert.match(html, /class="table-state-strip"/);
  assert.match(html, /data-i18n="field.tableLanguage"/);
});

test("client modules include Chinese dictionary and speech synthesis plan", async () => {
  const i18n = await readFile("public/i18n.js", "utf8");
  const tts = await readFile("public/tts.js", "utf8");
  const ambience = await readFile("public/ambience.js", "utf8");
  const app = await readFile("public/app.js", "utf8");

  assert.match(i18n, /AI 跑团主持人/);
  assert.match(i18n, /语音开/);
  assert.match(i18n, /"class\.mage": "法师"/);
  assert.match(i18n, /"species\.human": "人类"/);
  assert.match(i18n, /"voice\.role\.young-hero": "年轻英雄"/);
  assert.match(i18n, /"voice\.role\.mage": "法师"/);
  assert.match(i18n, /自适应氛围/);
  assert.match(i18n, /完整日志/);
  assert.match(i18n, /当前牌桌状态/);
  assert.match(i18n, /场景画面/);
  assert.match(i18n, /收获/);
  assert.match(tts, /espeak-ng/);
  assert.match(tts, /piper/);
  assert.match(ambience, /AudioContext/);
  assert.match(ambience, /createAmbienceEngine/);
  assert.match(app, /speechSynthesis/);
  assert.match(app, /speakNewTranscriptEntries/);
  assert.match(app, /createAmbienceEngine/);
  assert.match(app, /renderStage/);
  assert.match(app, /room\.presentation\?\.sceneAsset/);
  assert.match(app, /renderRewards/);
  assert.match(app, /rewardToast/);
  assert.match(app, /ambienceEngine\.update\(soundscape\)/);
  assert.match(app, /bindDrawers/);
  assert.match(app, /renderTranscriptEntries/);
  assert.match(app, /function localizedTranscriptAuthor\(entry = \{\}\)[\s\S]*speaker\.aidm[\s\S]*speaker\.rules[\s\S]*speaker\.table/);
  assert.match(app, /function localizedClassName\(character = \{\}\)[\s\S]*t\(uiLanguage, `class\.\$\{classId\}`\)/);
  assert.match(app, /function voiceProfileOptionLabel\(profile\)[\s\S]*localizedVoiceProfileName\(profile\)/);
  assert.match(app, /function voiceProfileOptionTitle\(profile\)[\s\S]*localizedVoiceRoleLabel\(profile\)/);
  assert.match(app, /function localizedVoiceRoleLabel\(profile\)[\s\S]*t\(uiLanguage, key\)/);
});

test("rules expose bilingual class and species labels for player UI", async () => {
  const { createCharacter, listCharacterCreationPresets } = await import("../src/core/rules.js");

  const mage = createCharacter({ name: "Lin", raceId: "human", classId: "mage" });
  assert.equal(mage.className, "Mage");
  assert.deepEqual(mage.classLabel, { en: "Mage", zh: "法师" });
  assert.deepEqual(mage.speciesLabel, { en: "Human", zh: "人类" });
  assert.deepEqual(mage.ancestry.label, { en: "Human", zh: "人类" });

  const magePreset = listCharacterCreationPresets().find((preset) => preset.classId === "mage");
  assert.deepEqual(magePreset.label, { en: "Mage", zh: "法师" });
});

test("production-depth player surfaces have complete bilingual labels", async () => {
  const { t } = await import("../public/i18n.js");

  const playerVisibleKeys = [
    "button.market",
    "button.buyItem",
    "panel.market",
    "state.player",
    "state.threat",
    "encounter.state.foreshadowed",
    "encounter.state.imminent",
    "encounter.state.active",
    "field.startingSpells",
    "builder.balanced",
    "builder.frontline",
    "drawer.closeMarket",
    "market.note",
    "market.loading",
    "market.empty",
    "market.joinPrompt",
    "character.noCharacter",
    "character.summaryLine",
    "character.level",
    "character.xp",
    "character.equipmentSlots",
    "character.spells",
    "slot.weapon",
    "slot.armor",
    "slot.focus",
    "slot.kit",
    "slot.empty",
    "spell.none",
    "pointBudget.over",
    "speaker.aidm",
    "speaker.rules",
    "speaker.table"
  ];

  for (const key of playerVisibleKeys) {
    assert.notEqual(t("en", key), key, `missing English label for ${key}`);
    assert.notEqual(t("zh", key), key, `missing Chinese label for ${key}`);
  }
});

test("Chinese player labels hide internal English and voice role ids", async () => {
  const { t } = await import("../public/i18n.js");

  const zhLabels = [
    t("zh", "encounter.state.foreshadowed"),
    t("zh", "state.threat"),
    t("zh", "state.clues"),
    t("zh", "class.mage"),
    t("zh", "voice.role.narrator"),
    t("zh", "voice.role.rules"),
    t("zh", "voice.role.mage"),
    t("zh", "speaker.aidm"),
    t("zh", "speaker.rules"),
    t("zh", "speaker.table")
  ];

  assert.deepEqual(zhLabels.slice(0, 4), ["有征兆", "威胁", "线索", "法师"]);
  assert.deepEqual(zhLabels.slice(4), ["旁白", "规则裁定", "法师", "主持人", "规则裁定", "牌桌系统"]);
  for (const label of zhLabels) {
    assert.doesNotMatch(label, /foreshadowed|Threat|Clues|Mage|AIDM|Rules|Table|narrator|rules|mage/i);
  }
});

test("player-visible state summary labels are bilingual without changing internal ids", async () => {
  const { buildTableStateSummary } = await import("../src/core/stateSummary.js");
  const summary = buildTableStateSummary({
    scene: {
      objective: "Find the ledger",
      clocks: { clues: 3, danger: 4, deadline: 2 }
    },
    quests: [
      { id: "quest-ledger", title: "Recover the ledger", status: "active", progress: 50, clues: ["seal"] }
    ],
    combat: { state: "foreshadowed", encounter: { enemies: [] } },
    transcript: []
  });

  assert.equal(summary.combat.state, "foreshadowed");
  assert.deepEqual(summary.combat.stateLabel, { en: "Foreshadowed", zh: "有征兆" });
  assert.equal(summary.clocks.danger.id, "danger");
  assert.deepEqual(summary.clockLabels.danger, { en: "Threat", zh: "威胁" });
  assert.equal(summary.clocks.clues.id, "clues");
  assert.deepEqual(summary.clockLabels.clues, { en: "Clues", zh: "线索" });
  assert.equal(summary.quest.title, "Recover the ledger");
  assert.deepEqual(summary.quest.label, { en: "Recover the ledger", zh: "取回账本" });
});

test("server exposes soundscape presets and presentation-decorated room snapshots", async () => {
  const server = await readFile("src/server/server.js", "utf8");

  assert.match(server, /\/api\/soundscapes/);
  assert.match(server, /chooseSoundscape/);
  assert.match(server, /withPresentation/);
  assert.match(server, /buildPresentation/);
});
