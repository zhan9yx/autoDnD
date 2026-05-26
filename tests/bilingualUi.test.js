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

test("first-load HTML fallbacks avoid historical English player labels", async () => {
  const html = await readFile("public/index.html", "utf8");
  const historicalLeaks = [
    /<title>AIDM Table<\/title>/,
    /placeholder="Table name"/,
    /aria-label="Table language"/,
    />AI tabletop host</,
    />A turn-safe game room/,
    />Local account</,
    />Host identity</,
    />Guest</,
    /aria-label="Account mode"/,
    />Log in</,
    />Register</,
    />Display name</,
    />Email</,
    />Password</,
    /placeholder="At least 4 characters"/,
    />Open guide</,
    />What can I do\?</,
    /value="The Rain Archive"/,
    />Room title</,
    />Campaign tone</,
    />Mystery noir</,
    />Heroic fantasy</,
    />Weird frontier</,
    />English</,
    />Access mode</,
    />Open</,
    />Host approval</,
    />Room password</,
    /placeholder="Invite password"/,
    />Anyone with the room link can join\.</,
    />Create room</,
    />Existing room ID</,
    />Open room</,
    />Live room</,
    />My character</,
    />Team</,
    />State</,
    />Settings</,
    />Begin scene</,
    /aria-label="Current table state"/,
    />Current table state</,
    />No active turn</,
    />Round 1</,
    />Encounter</,
    />Sync</,
    />Player</,
    />Audio</,
    /aria-label="Team status"/,
    />Seat open</,
    />Create your character</,
    /placeholder="Player name"/,
    /placeholder="Character"/,
    /aria-label="Quick species"/,
    /aria-label="Quick class"/,
    />Species</,
    />Class</,
    /aria-label="Starting spells"/,
    /aria-label="Attribute point buy"/,
    />Body</,
    />Agility</,
    />Mind</,
    />Presence</,
    />Spirit</,
    />10 \/ 27 points</,
    /aria-label="Archetype"/,
    />Human</,
    />Warrior</,
    />Mage</,
    />Investigator</,
    />Threat</,
    />Clues</,
    />Table Log</,
    />Table tools</,
    />Table<\/span>/,
    />Table guide</,
    />No report yet\.</,
    /aria-label="Stage"/,
    /aria-label="Generated scene backdrop"/,
    /aria-label="Weather and ambience effects"/,
    />Opening scene</,
    />Waiting for the table to move\.</,
    />Scene</,
    />Objective</,
    />Summary log</,
    />Full log</,
    />Latest roll</,
    />No roll yet</,
    /title="Message type"/,
    /title="Roll mode"/,
    /title="Chat channel"/,
    /placeholder="Describe a scene action that advances the turn"/,
    />Act</,
    />Action submits a scene move, advances the turn, and may roll dice\.</,
    />Unseated</,
    />Join to claim a seat</,
    />Inventory</,
    />Memo</,
    /placeholder="Private notes, clues, debts\.\.\."/,
    />Save memo</,
    />Market</,
    />Scene state</,
    />Rewards</,
    />Replay</,
    />Build</,
    />Player menu</,
    />Host access</,
    />Room access queue</,
    />Language and display</,
    /aria-label="Ambience controls"/,
    />Adaptive ambience</,
    />Mystery Undercurrent</,
    />Waiting for scene context\.</,
    />Ambience off</,
    />Stop audio</,
    />Master</,
    />Music</,
    />Environment</,
    /aria-label="Voice controls"/,
    />Voice line</,
    />Voice</,
    />Voice off</,
    />Read latest</,
    />Auto voice by speaker</,
    />Using local browser voice\.</,
    /aria-label="Close guide"/,
    /aria-label="Guide sections"/,
    />Run the table without guessing</,
    />Quick start</,
    />Reference</,
    />Open a room</,
    />Create characters</,
    />Begin the scene</,
    />Act or chat</,
    />Read the encounter</,
    />Use voice playback</,
    />Build replay</,
    />Rooms</,
    />Characters</,
    />Actions And Chat</,
    />Combat</,
    />Scene visuals</
  ];

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>AIDM 跑团桌<\/title>/);
  assert.match(html, /data-i18n="species\.human">人类</);
  assert.match(html, /data-i18n="class\.warrior">战士</);
  assert.match(html, /id="threatClockLabel"[^>]+data-i18n="state\.threat">威胁/);
  assert.match(html, /id="clueClockLabel"[^>]+data-i18n="state\.clues">线索/);
  assert.match(html, /id="replaySummary"[^>]+data-i18n="noReport">暂无战报。/);
  assert.match(html, /data-i18n="auth\.loginMode">登录</);
  assert.match(html, /data-i18n="button\.createRoom">创建房间</);
  assert.match(html, /<option value="zh" data-i18n="language\.zh" selected>中文<\/option>\s*<option value="en" data-i18n="language\.en">英文<\/option>/);
  assert.match(html, /id="guideTitle" data-i18n="guide\.title">不用猜，也能顺畅开团</);
  assert.match(html, /id="actionModeHint"[^>]+data-i18n="action\.hint\.action">行动会提交场景动作，推进回合，并可能掷骰。/);

  for (const leak of historicalLeaks) {
    assert.doesNotMatch(html, leak);
  }
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
  assert.match(i18n, /雨巷与湿石街区/);
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
  assert.match(app, /reward\.feedback\.addedToBackpack/);
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
    "state.card.objective",
    "state.card.quest",
    "state.card.clues",
    "state.card.danger",
    "state.card.deadline",
    "state.questProgress",
    "state.now",
    "state.location",
    "state.ambience",
    "state.evolution",
    "state.evolutionStable",
    "state.evolutionScene",
    "state.evolutionClue",
    "state.evolutionPressure",
    "state.clockDelta.clues",
    "state.clockDelta.danger",
    "state.clockDelta.deadline",
    "state.consequences",
    "state.environment",
    "state.eventPressure",
    "state.eventPressureLevel",
    "state.eventClock",
    "state.eventStatus.opportunity",
    "state.eventStatus.complication",
    "state.pressure.moderate",
    "state.clock.clues",
    "state.rewardHint",
    "state.noConsequences",
    "state.consequenceActive",
    "state.routes",
    "state.routeReady",
    "state.routeLocked",
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
    "market.reason.available",
    "market.reason.insufficientFunds",
    "market.reason.owned",
    "market.reason.outOfStock",
    "market.reason.ruleLocked",
    "market.reason.unavailable",
    "market.state.available",
    "market.state.insufficientFunds",
    "market.state.owned",
    "market.state.soldOut",
    "market.state.ruleLocked",
    "market.state.unavailable",
    "market.buyAriaBlocked",
    "market.buyAriaDisabled",
    "market.cardAria",
    "market.card.blockedHint",
    "character.noCharacter",
    "character.summaryLine",
    "character.level",
    "character.xp",
    "character.equipmentSlots",
    "character.spells",
    "slot.weapon",
    "slot.armor",
    "slot.offHand",
    "slot.focus",
    "slot.kit",
    "slot.empty",
    "spell.none",
    "pointBudget.over",
    "setup.guidance",
    "setup.startSceneReady",
    "setup.startSceneNoPlayers",
    "setup.startSceneHostOnly",
    "setup.startSceneInProgress",
    "setup.ready",
    "state.audio",
    "inventory.sellValue",
    "inventory.reason.toolNarrativeUse",
    "inventory.reason.toolNotEquipped",
    "inventory.feedback.used",
    "inventory.feedback.equipped",
    "inventory.feedback.sold",
    "market.openTitle",
    "market.feedback.buying",
    "market.feedback.noLocal",
    "market.feedback.bought",
    "reward.feedback.addedToBackpack",
    "ambience.status.off",
    "ambience.sceneStatus",
    "soundscape.market-city",
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
  assert.equal(t("en", "soundscape.market-city"), "Rain Lanes and Wet Stone");
  assert.equal(t("zh", "soundscape.market-city"), "雨巷与湿石街区");
  assert.notEqual(t("zh", "soundscape.market-city"), "市场与城市街道");
});

test("main play surface status and transcript labels do not leak debug English in Chinese", async () => {
  const { t } = await import("../public/i18n.js");
  const app = await readFile("public/app.js", "utf8");

  const zhSurfaceLabels = [
    t("zh", "encounter.state.foreshadowed"),
    t("zh", "state.threat"),
    t("zh", "state.clues"),
    t("zh", "log.clock.clues"),
    t("zh", "log.clock.danger"),
    t("zh", "log.type.gm"),
    t("zh", "log.type.system"),
    t("zh", "log.type.roll"),
    t("zh", "speaker.aidm"),
    t("zh", "speaker.rules"),
    t("zh", "speaker.table")
  ];

  assert.deepEqual(zhSurfaceLabels, [
    "有征兆",
    "威胁",
    "线索",
    "线索",
    "危险",
    "主持",
    "系统",
    "掷骰",
    "主持人",
    "规则裁定",
    "牌桌系统"
  ]);

  for (const label of zhSurfaceLabels) {
    assert.doesNotMatch(label, /foreshadowed|Threat|Clues|AIDM|Rules|Table|System|Roll/i);
  }

  assert.deepEqual([
    t("en", "encounter.state.foreshadowed"),
    t("en", "state.threat"),
    t("en", "state.clues"),
    t("en", "log.type.gm"),
    t("en", "speaker.rules"),
    t("en", "speaker.table")
  ], [
    "Foreshadowed",
    "Threat",
    "Clues",
    "AIDM",
    "Rules",
    "Table"
  ]);

  assert.match(app, /els\.encounterDock\.textContent = localizeEncounterState\(room\.combat\?\.state \|\| "scouting"\)/);
  assert.match(app, /function syncTableStateSummary\(\)[\s\S]*const details = \[round, encounter, sync, audio\]/);
  assert.match(app, /label: t\(uiLanguage, "state\.card\.clues"\)/);
  assert.match(app, /label: t\(uiLanguage, "state\.card\.danger"\)/);
  assert.match(app, /function localizedTranscriptType\(entry = \{\}\)[\s\S]*const key = `log\.type\.\$\{type\}`[\s\S]*t\(uiLanguage, key\)/);
  assert.match(app, /function localizedTranscriptAuthor\(entry = \{\}\)[\s\S]*aidm: "speaker\.aidm"[\s\S]*rules: "speaker\.rules"[\s\S]*table: "speaker\.table"[\s\S]*if \(uiLanguage === "zh"\)/);
});

test("State drawer copy stays compact, localized, and player-facing", async () => {
  const { t } = await import("../public/i18n.js");
  const app = await readFile("public/app.js", "utf8");

  const zhStateDrawerLabels = [
    t("zh", "state.card.objective"),
    t("zh", "state.card.quest"),
    t("zh", "state.card.clues"),
    t("zh", "state.card.danger"),
    t("zh", "state.card.deadline"),
    t("zh", "state.questProgress", { quest: "取回账本", progress: 50 }),
    t("zh", "state.now"),
    t("zh", "state.location"),
    t("zh", "state.ambience"),
    t("zh", "state.evolution"),
    t("zh", "state.evolutionClue"),
    t("zh", "state.evolutionPressure"),
    t("zh", "state.clockDelta.clues", { delta: "+1" }),
    t("zh", "state.clockDelta.danger", { delta: "+2" }),
    t("zh", "state.clockDelta.deadline", { delta: "-1" }),
    t("zh", "state.consequences"),
    t("zh", "state.environment"),
    t("zh", "state.eventPressure"),
    t("zh", "state.eventPressureLevel", { pressure: t("zh", "state.pressure.moderate") }),
    t("zh", "state.eventClock", { clock: t("zh", "state.clock.clues") }),
    t("zh", "state.eventStatus.complication"),
    t("zh", "state.rewardHint"),
    t("zh", "state.noConsequences"),
    t("zh", "state.routes"),
    t("zh", "state.routeReady"),
    t("zh", "state.routeLocked"),
    t("zh", "state.routeNotEstablished"),
    t("zh", "state.routeFailed")
  ];

  assert.deepEqual(zhStateDrawerLabels, [
    "目标",
    "任务",
    "线索",
    "压力",
    "时限",
    "取回账本 · 50%",
    "当前",
    "地点",
    "氛围",
    "场景演化",
    "线索浮现",
    "压力变化",
    "线索 +1",
    "压力 +2",
    "时限 -1",
    "后果",
    "环境",
    "事件压力",
    "压力：中",
    "时钟：线索",
    "变故",
    "可搜索收获",
    "暂无持续后果",
    "路线",
    "可走",
    "暂不可走",
    "先找到更多线索再继续。",
    "这次没有推进路线，先换个办法。"
  ]);

  for (const label of zhStateDrawerLabels) {
    assert.doesNotMatch(label, /debug|route held|route not established|failed check|media|objective|quest|danger|clues|deadline|consequence/i);
  }

  assert.deepEqual([
    t("en", "state.card.objective"),
    t("en", "state.card.quest"),
    t("en", "state.card.danger"),
    t("en", "state.questProgress", { quest: "Recover the ledger", progress: 50 }),
    t("en", "state.evolution"),
    t("en", "state.clockDelta.clues", { delta: "+1" }),
    t("en", "state.clockDelta.danger", { delta: "+2" }),
    t("en", "state.environment"),
    t("en", "state.eventPressure"),
    t("en", "state.eventPressureLevel", { pressure: t("en", "state.pressure.moderate") }),
    t("en", "state.eventClock", { clock: t("en", "state.clock.clues") }),
    t("en", "state.noConsequences")
  ], [
    "Goal",
    "Quest",
    "Pressure",
    "Recover the ledger · 50%",
    "Scene change",
    "Clues +1",
    "Pressure +2",
    "Environment",
    "Event pressure",
    "Pressure: Moderate",
    "Clock: Clues",
    "No active consequences"
  ]);

  assert.match(app, /function renderStateSummary\(\)[\s\S]*label: t\(uiLanguage, "state\.card\.objective"\)[\s\S]*state\.questProgress[\s\S]*state\.card\.clues[\s\S]*state\.card\.danger[\s\S]*state\.card\.deadline/);
  assert.match(app, /const environmentCue = stateEnvironmentCue\(summary\)[\s\S]*const eventCue = stateEventPressureCue\(summary\)[\s\S]*renderStateChangeItem\(t\(uiLanguage, "state\.now"\)[\s\S]*renderStateChangeItem\(t\(uiLanguage, "state\.location"\)[\s\S]*renderStateChangeItem\(t\(uiLanguage, "state\.evolution"\)[\s\S]*renderStateChangeItem\(t\(uiLanguage, "state\.consequences"\)[\s\S]*state\.environment[\s\S]*state\.eventPressure[\s\S]*state\.rewardHint[\s\S]*renderStateChangeItem\(t\(uiLanguage, "state\.ambience"\)/);
  assert.match(app, /function sceneEvolutionCue\(summary = room\?\.stateSummary \|\| \{\}\)[\s\S]*state\.evolutionClue[\s\S]*state\.evolutionPressure[\s\S]*formatSceneClockTrends/);
  assert.match(app, /function stateEnvironmentCue\(summary = room\?\.stateSummary \|\| \{\}\)[\s\S]*state\.eventPressureLevel[\s\S]*localizeShiftReason/);
  assert.match(app, /function stateEventPressureCue\(summary = room\?\.stateSummary \|\| \{\}\)[\s\S]*state\.eventStatus[\s\S]*state\.eventClock/);
  assert.match(app, /function formatSceneClockTrends\(clockTrends = \{\}\)[\s\S]*state\.clockDelta\.clues[\s\S]*state\.clockDelta\.danger[\s\S]*state\.clockDelta\.deadline/);
  assert.match(app, /function renderSceneChangeSummary\(sceneChanged = false\)[\s\S]*const evolutionCue = sceneEvolutionCue\(\)[\s\S]*const label = evolutionCue\?\.value/);
  assert.match(app, /function stateConsequencesText\(entries = \[\]\)[\s\S]*state\.noConsequences[\s\S]*state\.consequenceActive/);
  assert.match(app, /function compactStateCopy\(value, maxLength = 120\)[\s\S]*replace\(\/\\s\+\/g, " "\)[\s\S]*\.\.\./);
  assert.match(app, /const state = exit\.available \? t\(uiLanguage, "state\.routeReady"\) : t\(uiLanguage, "state\.routeLocked"\)/);
  assert.doesNotMatch(app, /renderStateChangeItem\(t\(uiLanguage, "state\.media"\)/);
});

test("market blocked purchase labels are bilingual and never claim purchasable", async () => {
  const { t } = await import("../public/i18n.js");

  assert.deepEqual([
    t("zh", "market.state.insufficientFunds"),
    t("zh", "market.state.owned"),
    t("zh", "market.state.soldOut"),
    t("zh", "market.state.ruleLocked"),
    t("zh", "market.state.unavailable"),
    t("zh", "market.buyAriaDisabled", { item: "治疗真言法卷", reason: "资金不足" }),
    t("zh", "market.card.blockedHint", { reason: "资金不足" }),
    t("zh", "market.cardAria", { item: "治疗真言法卷", price: "购买价格：138 克朗", status: "资金不足" })
  ], [
    "资金不足",
    "已拥有",
    "售罄",
    "暂不可买",
    "暂不可买",
    "无法购买治疗真言法卷：资金不足",
    "状态：资金不足。",
    "治疗真言法卷。购买价格：138 克朗。资金不足。"
  ]);

  assert.deepEqual([
    t("en", "market.state.insufficientFunds"),
    t("en", "market.state.owned"),
    t("en", "market.state.soldOut"),
    t("en", "market.state.ruleLocked"),
    t("en", "market.state.unavailable"),
    t("en", "market.buyAriaDisabled", { item: "Scroll of Healing Word", reason: "Insufficient funds" }),
    t("en", "market.card.blockedHint", { reason: "Insufficient funds" }),
    t("en", "market.cardAria", { item: "Scroll of Healing Word", price: "Purchase price: 138 CR", status: "Insufficient funds" })
  ], [
    "Insufficient funds",
    "Already owned",
    "Sold out",
    "Currently unavailable",
    "Currently unavailable",
    "Cannot buy Scroll of Healing Word: Insufficient funds",
    "Status: Insufficient funds.",
    "Scroll of Healing Word. Purchase price: 138 CR. Insufficient funds."
  ]);

  const disabledZh = t("zh", "market.buyAriaDisabled", { item: "治疗真言法卷", reason: "资金不足" });
  assert.doesNotMatch(disabledZh, /可购买|购买后/);
});

test("tool-like inventory semantics have bilingual player-visible copy", async () => {
  const { t } = await import("../public/i18n.js");

  assert.deepEqual([
    t("en", "inventory.reason.toolNarrativeUse"),
    t("en", "inventory.reason.toolNotEquipped"),
    t("en", "inventory.actionAriaBlocked.equip", {
      item: "Storm Lantern",
      reason: t("en", "inventory.reason.toolNotEquipped")
    }),
    t("zh", "inventory.reason.toolNarrativeUse"),
    t("zh", "inventory.reason.toolNotEquipped"),
    t("zh", "inventory.actionAriaBlocked.equip", {
      item: "暴风提灯",
      reason: t("zh", "inventory.reason.toolNotEquipped")
    })
  ], [
    "Tool item: no direct Use button. Mention it in an Action to apply it narratively.",
    "Tool item: kept in backpack unless it has an equipment slot.",
    "Cannot equip Storm Lantern: Tool item: kept in backpack unless it has an equipment slot.",
    "工具类物品：没有直接使用按钮。需要时在行动里说明如何使用它。",
    "工具类物品：除非有装备槽，否则保留在背包中。",
    "无法装备暴风提灯：工具类物品：除非有装备槽，否则保留在背包中。"
  ]);
});

test("purchase, use, equip, sell, and reward feedback copy confirms refreshed backpack state", async () => {
  const { t } = await import("../public/i18n.js");

  assert.deepEqual([
    t("en", "market.feedback.bought", { item: "Storm Lantern", price: "80 CR", wallet: "40 CR" }),
    t("en", "inventory.feedback.used", { item: "Healing Draught" }),
    t("en", "inventory.feedback.equipped", { item: "Shortbow", slot: "main hand" }),
    t("en", "inventory.feedback.sold", { item: "Festival Wine", amount: "16 CR", wallet: "56 CR" }),
    t("en", "reward.feedback.addedToBackpack"),
    t("zh", "market.feedback.bought", { item: "暴风提灯", price: "80 克朗", wallet: "40 克朗" }),
    t("zh", "inventory.feedback.used", { item: "治疗药剂" }),
    t("zh", "inventory.feedback.equipped", { item: "短弓", slot: "主手" }),
    t("zh", "inventory.feedback.sold", { item: "节庆酒", amount: "16 克朗", wallet: "56 克朗" }),
    t("zh", "reward.feedback.addedToBackpack")
  ], [
    "Bought Storm Lantern for 80 CR. Added to backpack. Wallet: 40 CR. Free-time inventory: no turn spent, no round advanced. Open My character to use, equip, or sell.",
    "Used Healing Draught. Character stats, spells, and backpack are refreshed.",
    "Equipped Shortbow to main hand. Equipment summary and backpack are refreshed.",
    "Sold Festival Wine for 16 CR. Wallet: 56 CR. Backpack is refreshed. Free-time inventory: no turn spent, no round advanced.",
    "Added to backpack. Open My character to use, equip, or sell.",
    "已用 80 克朗 购买暴风提灯。已加入背包。钱包：40 克朗。这是空闲整备：不消耗当前回合，不推进轮次。打开我的角色即可使用、装备或出售。",
    "已使用治疗药剂。角色数值、法术和背包已刷新。",
    "已将短弓装备到主手。装备摘要和背包已刷新。",
    "已出售节庆酒，获得 16 克朗。钱包：56 克朗。背包已刷新。这是空闲整备：不消耗当前回合，不推进轮次。",
    "已加入背包。打开我的角色即可使用、装备或出售。"
  ]);
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
    t("zh", "inventory.reason.toolNotEquipped"),
    t("zh", "inventory.feedback.sold", { item: "暴风提灯", amount: "12 克朗", wallet: "20 克朗" }),
    t("zh", "market.note"),
    t("zh", "market.feedback.buying", { item: "治疗药剂" }),
    t("zh", "market.feedback.noLocal"),
    t("zh", "market.feedback.bought", { item: "治疗药剂", price: "10 克朗", wallet: "30 克朗" }),
    t("zh", "reward.feedback.addedToBackpack"),
    t("zh", "ambience.status.off", { soundscape: "雨声与湿石" }),
    t("zh", "ambience.sceneStatus", { status: "关 · 雨声与湿石", reason: "已匹配当前天气氛围。" }),
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

  assert.deepEqual(zhLabels.slice(0, 30), [
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
    "工具类物品：除非有装备槽，否则保留在背包中。",
    "已出售暴风提灯，获得 12 克朗。钱包：20 克朗。背包已刷新。这是空闲整备：不消耗当前回合，不推进轮次。",
    "下一幕前的空闲整备。这里购买或出售不会消耗当前回合，也不会推进轮次；真正的场景行动请用“行动”。",
    "正在以空闲整备购买治疗药剂；不会消耗当前回合，也不会推进轮次...",
    "市场已锁定：请先加入或恢复本地角色。",
    "已用 10 克朗 购买治疗药剂。已加入背包。钱包：30 克朗。这是空闲整备：不消耗当前回合，不推进轮次。打开我的角色即可使用、装备或出售。",
    "已加入背包。打开我的角色即可使用、装备或出售。",
    "关 · 雨声与湿石",
    "关 · 雨声与湿石 · 已匹配当前天气氛围。",
    "首次入座：人类战士。点数分配已就绪。 需要帮助可先看指南，然后加入牌桌。",
    "请使用已加入本房间的浏览器，或先在设置流程加入角色，再行动或聊天。",
    "需要角色",
    "需要本地角色。请使用已加入本房间的浏览器，或先在设置流程加入角色，再提交。",
    "尚未选择本地角色。请使用已加入本房间的浏览器，或先在设置流程加入角色，再行动或聊天。",
    "轮到你：林",
    "等待 阿岚 行动",
    "在雨档案馆行动前，请先加入或恢复本地角色。",
    "暂无当前回合。",
    "雨档案馆 · 找到线索",
    "场景已更新"
  ]);
  assert.deepEqual(zhLabels.slice(30), ["旁白", "规则裁定", "法师", "主持人", "规则裁定", "牌桌系统"]);
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
