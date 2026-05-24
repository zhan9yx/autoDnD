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
    "archetype.investigator",
    "archetype.vanguard",
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
    "setup.guidance",
    "setup.ready",
    "state.audio",
    "inventory.sellValue",
    "inventory.reason.toolNarrativeUse",
    "inventory.feedback.sold",
    "market.feedback.buying",
    "market.feedback.bought",
    "ambience.status.off",
    "action.submitActionAria",
    "action.noPlayerHint",
    "action.noPlayerPlaceholder",
    "action.noPlayerSubmit",
    "action.noPlayerSubmitAria",
    "action.noPlayerTextAria",
    "action.noPlayerTextTitle",
    "action.formAria.noPlayer",
    "action.noPlayerSubmitError",
    "turnCue.yourTurn",
    "turnCue.otherTurn",
    "turnCue.noLocal",
    "turnCue.noActive",
    "turnCue.sceneContext",
    "turnCue.sceneShifted",
    "join.nameRequired",
    "error.actionRequired",
    "error.chatRequired",
    "error.itemNotUsable",
    "noReport",
    "replayShareText",
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
    t("zh", "archetype.investigator"),
    t("zh", "join.nameRequired"),
    t("zh", "error.actionRequired"),
    t("zh", "noReport"),
    t("zh", "replayShareText", { title: "雨档案馆", players: 1, round: 2, lead: "线索已确认" }),
    t("zh", "inventory.reason.toolNarrativeUse"),
    t("zh", "inventory.feedback.sold", { item: "暴风提灯", amount: "12 克朗", wallet: "20 克朗" }),
    t("zh", "market.note"),
    t("zh", "market.feedback.buying", { item: "治疗药剂" }),
    t("zh", "market.feedback.bought", { item: "治疗药剂", price: "10 克朗", wallet: "30 克朗" }),
    t("zh", "ambience.status.off", { soundscape: "雨声与湿石" }),
    t("zh", "setup.guidance", { species: "人类", className: "战士", readiness: "点数分配已就绪。" }),
    t("zh", "action.noPlayerHint"),
    t("zh", "action.noPlayerSubmit"),
    t("zh", "action.noPlayerSubmitError"),
    t("zh", "action.formAria.noPlayer"),
    t("zh", "turnCue.yourTurn", { name: "林" }),
    t("zh", "turnCue.otherTurn", { name: "阿岚" }),
    t("zh", "turnCue.noLocal", { location: "雨档案馆" }),
    t("zh", "turnCue.noActive"),
    t("zh", "turnCue.sceneContext", { location: "雨档案馆", objective: "找到线索" }),
    t("zh", "turnCue.sceneShifted"),
    t("zh", "voice.role.narrator"),
    t("zh", "voice.role.rules"),
    t("zh", "voice.role.mage"),
    t("zh", "speaker.aidm"),
    t("zh", "speaker.rules"),
    t("zh", "speaker.table")
  ];

  assert.deepEqual(zhLabels.slice(0, 26), [
    "有征兆",
    "威胁",
    "线索",
    "法师",
    "调查员",
    "请先输入玩家名再加入。",
    "行动文本不能为空。",
    "暂无战报。",
    "雨档案馆：1 名玩家推进到第 2 轮。线索已确认",
    "工具类物品：没有直接使用按钮。需要时在行动里说明如何使用它。",
    "已出售暴风提灯，获得 12 克朗。钱包：20 克朗。这是空闲整备：不消耗当前回合，不推进轮次。",
    "下一幕前的空闲整备。这里购买或出售不会消耗当前回合，也不会推进轮次；真正的场景行动请用“行动”。",
    "正在以空闲整备购买治疗药剂；不会消耗当前回合，也不会推进轮次...",
    "已用 10 克朗 购买治疗药剂。钱包：30 克朗。这是空闲整备：不消耗当前回合，不推进轮次。打开我的角色即可使用、装备或出售。",
    "关 · 雨声与湿石",
    "首次入座：人类战士。点数分配已就绪。 然后加入牌桌。",
    "请使用已加入本房间的浏览器，或先在设置流程加入角色，再行动或聊天。",
    "需要角色",
    "需要本地角色。请使用已加入本房间的浏览器，或先在设置流程加入角色，再提交。",
    "尚未选择本地角色。请使用已加入本房间的浏览器，或先在设置流程加入角色，再行动或聊天。",
    "轮到你，林：声明一个具体场景行动，然后点击行动。闲聊请用聊天。",
    "轮到阿岚：观察场景，准备下一步，也可以用聊天且不消耗回合。",
    "在雨档案馆行动前，请先加入或恢复本地角色。你仍可阅读牌桌并选择席位。",
    "暂无当前回合。至少一名玩家入座后即可开始场景。",
    "雨档案馆 · 找到线索",
    "场景已更新"
  ]);
  assert.deepEqual(zhLabels.slice(26), ["旁白", "规则裁定", "法师", "主持人", "规则裁定", "牌桌系统"]);
  for (const label of zhLabels) {
    assert.doesNotMatch(label, /foreshadowed|Threat|Clues|Mage|Investigator|Action text|No report yet|players reached round|Tool item|Bought|Wallet|Audio off|First seat|free-time|no turn|round advanced|noPlayer|noLocalPlayer|Join or restore|Action|Chat|AIDM|Rules|Table|narrator|rules|mage/i);
  }
});

test("client replay and archetype sync paths use localized labels", async () => {
  const app = await readFile("public/app.js", "utf8");

  assert.match(app, /els\.replaySummary\.textContent = t\(uiLanguage, "noReport"\)/);
  assert.match(app, /function localizedReplayShareText\(replay\)[\s\S]*t\(uiLanguage, "replayShareText"/);
  assert.match(app, /function syncLocalizedCharacterBuilderOptions\(\)[\s\S]*option\.dataset\.archetypeId = id[\s\S]*option\.value = label/);
  assert.doesNotMatch(app, /els\.replaySummary\.textContent = "No report yet\."/);
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
