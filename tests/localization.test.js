import test from "node:test";
import assert from "node:assert/strict";
import { AIProvider, localNarration } from "../src/core/aiProvider.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { localizeArchetype, localizeClassName, localizeCombatSkillName, localizeSpellName, normalizeLanguage, t } from "../src/core/localization.js";
import { MemoryRoomStore } from "../src/core/storage.js";

test("normalizes supported table languages", () => {
  assert.equal(normalizeLanguage("zh-CN"), "zh");
  assert.equal(normalizeLanguage("zh-hans"), "zh");
  assert.equal(normalizeLanguage("en"), "en");
  assert.equal(normalizeLanguage("fr"), "en");
});

test("Chinese rooms persist language and emit localized lifecycle events", async () => {
  const engine = new GameEngine({ store: new MemoryRoomStore(), aiProvider: new AIProvider({}) });
  const room = await engine.createRoom({ title: "雨档案馆", language: "zh" });

  assert.equal(room.language, "zh");
  assert.match(room.scene.objective, /黎明前/);
  assert.match(room.transcript[0].text, /房间已创建/);

  const joined = await engine.joinRoom(room.id, {
    playerName: "林",
    characterName: "阿林",
    archetype: "Investigator",
    species: "human",
    classId: "rogue"
  });
  assert.match(joined.room.transcript.at(-1).text, /加入了牌桌/);
  assert.match(joined.room.transcript.at(-1).text, /定位为调查员/);
  assert.doesNotMatch(joined.room.transcript.at(-1).text, /Investigator/);

  const started = await engine.startRoom(room.id);
  assert.match(started.transcript.at(-1).text, /跑团开始/);

  const acted = await engine.submitAction(room.id, {
    playerId: joined.player.id,
    text: "检查封印账本"
  });
  assert.match(acted.memories.at(-1).text, /结果：(成功|失败)/);
  assert.doesNotMatch(acted.memories.at(-1).text, /tried to|Result:/);
});

test("local narration follows the room language", () => {
  const narration = localNarration({
    room: {
      language: "zh",
      scene: {
        location: "雨夜街道",
        objective: "找到账本",
        ambience: "雨声和烛烟",
        weather: "thunderstorm",
        season: "winter"
      },
      director: { beat: "complication" }
    },
    player: { character: { name: "阿林" } },
    actionText: "检查门锁",
    check: { success: true, margin: 3, total: 15, dc: 12 },
    memories: [{ text: "门锁曾被银钥匙打开。" }]
  });

  assert.match(narration.text, /阿林/);
  assert.match(narration.text, /旧线索浮现/);
  assert.match(narration.text, /目标难度/);
  assert.match(narration.text, /场景节拍：变故/);
  assert.match(narration.text, /感官细节：/);
  assert.match(narration.text, /后果：/);
  assert.match(narration.text, /你可以考虑：一、/);
  assert.match(narration.text, /二、/);
  assert.doesNotMatch(narration.text, /Scene beat|Sensory detail|Consequence|You can consider|Suggested next action/);
});

test("local narration keeps storyteller structure in English without Chinese guidance", () => {
  const narration = localNarration({
    room: {
      language: "en",
      scene: {
        location: "the archive stairs",
        objective: "Find the ledger",
        ambience: "rain and candle smoke",
        weather: "light rain",
        season: "autumn"
      },
      director: { beat: "discovery" }
    },
    player: { character: { name: "Lio" } },
    actionText: "inspect the brass lock",
    check: { success: false, margin: -2, total: 10, dc: 12 },
    memories: [{ text: "The lock clicked once before midnight." }]
  });

  assert.match(narration.text, /Scene beat: Discovery/);
  assert.match(narration.text, /Sensory detail:/);
  assert.match(narration.text, /Consequence:/);
  assert.match(narration.text, /You can consider: 1\. /);
  assert.match(narration.text, /2\. /);
  assert.doesNotMatch(narration.text, /场景节拍|感官细节|后果|你可以考虑/);
});

test("local Chinese narration sanitizes English fragments from mixed table input", () => {
  const narration = localNarration({
    room: {
      language: "zh",
      scene: {
        location: "Archive gate 档案馆入口",
        objective: "find brass lock clue",
        ambience: "cold rain over Archive clue",
        weather: "thunderstorm",
        season: "winter"
      },
      director: { beat: "discovery" }
    },
    player: { character: { name: "阿林" } },
    actionText: "inspect the brass lock clue",
    check: { success: true, margin: 2, total: 14, dc: 12 },
    memories: [{ text: "Archive clue: brass lock" }]
  });

  assert.match(narration.text, /场景节拍：发现/);
  assert.match(narration.text, /档案馆|黄铜锁|线索|相关信息/);
  assert.doesNotMatch(narration.text, /\b(?:Archive|brass|lock|clue|inspect|find|cold|rain|gate)\b/i);
  assert.doesNotMatch(narration.text, /Scene beat|Sensory detail|Consequence|You can consider/);
});

test("local English narration falls back away from Chinese fragments in mixed table input", () => {
  const narration = localNarration({
    room: {
      language: "en",
      scene: {
        location: "档案馆 stairs",
        objective: "找到账本",
        ambience: "雨声和烛烟",
        weather: "thunderstorm",
        season: "winter"
      },
      director: { beat: "complication" }
    },
    player: { character: { name: "Lio" } },
    actionText: "检查门锁",
    check: { success: false, margin: -3, total: 9, dc: 12 },
    memories: [{ text: "旧线索指向档案馆。" }]
  });

  assert.match(narration.text, /Scene beat: Complication/);
  assert.match(narration.text, /the current scene|the immediate objective|this move|the surrounding pressure/);
  assert.doesNotMatch(narration.text, /[\u3400-\u9fff]/u);
  assert.doesNotMatch(narration.text, /场景节拍|感官细节|后果|你可以考虑/);
});

test("local narration does not duplicate punctuation after player actions", () => {
  const zhNarration = localNarration({
    room: {
      language: "zh",
      scene: {
        location: "雨夜街道",
        objective: "找到账本",
        ambience: "雨声和烛烟"
      },
      director: { beat: "discovery" }
    },
    player: { character: { name: "阿林" } },
    actionText: "侧耳听歌声。",
    check: { success: true, margin: 3, total: 15, dc: 12 },
    memories: []
  });
  const enNarration = localNarration({
    room: {
      language: "en",
      scene: {
        location: "the archive stairs",
        objective: "Find the ledger",
        ambience: "rain and candle smoke"
      },
      director: { beat: "complication" }
    },
    player: { character: { name: "Lio" } },
    actionText: "listen for the singing?",
    check: { success: false, margin: -2, total: 10, dc: 12 },
    memories: []
  });

  assert.match(zhNarration.text, /选择侧耳听歌声。\n感官细节/);
  assert.doesNotMatch(zhNarration.text, /。。|。\.|\.。/);
  assert.match(enNarration.text, /choosing to listen for the singing\?\nSensory detail/);
  assert.doesNotMatch(enNarration.text, /\?\./);
});

test("localized message formatter interpolates parameters", () => {
  assert.equal(t("zh", "activeTurn", { name: "梅" }), "现在是梅的回合");
  assert.equal(t("en", "activeTurn", { name: "Mei" }), "It is Mei's turn");
  assert.match(t("en", "knowledgeAttribution", { sourceCount: 2 }), /2 SRD-style source references/);
  assert.match(t("zh", "knowledgeAttribution", { sourceCount: 2 }), /2 个 SRD 风格资料源/);
  assert.match(t("en", "knowledge.sourceBoundary"), /do not embed long rules text/);
  assert.match(t("zh", "knowledge.sourceBoundary"), /不嵌入长篇规则正文/);
});

test("localized inventory spell logs use player-facing spell names", () => {
  assert.equal(localizeSpellName("zh", "healing-word"), "回春短句");
  assert.equal(localizeSpellName("en", "healing-word"), "Healing Word");

  const learned = t("zh", "inventory.learnedSpell", {
    characterName: "阿林",
    spellId: "healing-word"
  });
  assert.match(learned, /回春短句/);
  assert.doesNotMatch(learned, /healing-word/);
});

test("localized class and combat skill labels cover leveling choices", () => {
  assert.equal(localizeClassName("zh", "mage"), "法师");
  assert.equal(localizeClassName("en", "tactical-commander"), "Tactical Commander");
  assert.equal(localizeCombatSkillName("zh", "mark-target"), "标记目标");
  assert.equal(localizeCombatSkillName("en", "disarming-angle"), "Disarming Angle");
});

test("localized progression summaries point players to character state", () => {
  assert.match(t("en", "inventory.progressionSummary", {
    xp: 120,
    level: 2,
    unlocks: "Action Surge"
  }), /Gained 120 XP; level is now 2[\s\S]*Check My character/);
  assert.match(t("zh", "inventory.progressionSummary", {
    xp: 120,
    level: 2,
    unlocks: "动作爆发"
  }), /获得 120 XP；当前 2 级[\s\S]*我的角色/);
});

test("localized rule influence and spell-use feedback stays player-facing", () => {
  assert.equal(localizeSpellName("zh", "echo-ledger"), "回声账页");
  assert.equal(localizeSpellName("en", "moonlit-shear"), "Moonlit Shear");

  assert.match(t("en", "rules.actionInfluence", {
    modifier: 2,
    sources: "Travel Lamp, Field Notebook",
    intent: "investigate"
  }), /Rule modifiers: Travel Lamp, Field Notebook supports this investigate action \(\+2\)/);
  assert.match(t("zh", "rules.actionInfluence", {
    modifier: 2,
    sources: "旅行提灯、现场札记",
    intent: "investigate"
  }), /规则修正：旅行提灯、现场札记支撑这次investigate行动（\+2）/);

  assert.match(t("en", "spell.used", {
    characterName: "Iris",
    spellName: "Sleep",
    manaCost: 2,
    manaBefore: 8,
    manaAfter: 6,
    status: "Drowsy",
    outcome: "applies Drowsy."
  }), /Iris cast Sleep[\s\S]*Mana 8 -> 6[\s\S]*Status: Drowsy/);
  assert.match(t("zh", "spell.noMana", {
    characterName: "澜",
    spellName: "沉眠咒",
    manaCost: 2,
    manaBefore: 1
  }), /尝试施放沉眠咒[\s\S]*需要 2 点法力/);
});

test("archetype labels localize raw join values", () => {
  assert.equal(localizeArchetype("zh", "Investigator"), "调查员");
  assert.equal(localizeArchetype("zh", "Vanguard"), "先锋");
  assert.equal(localizeArchetype("en", "调查员"), "Investigator");
});
