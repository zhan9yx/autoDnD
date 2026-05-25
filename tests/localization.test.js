import test from "node:test";
import assert from "node:assert/strict";
import { AIProvider, localNarration } from "../src/core/aiProvider.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { localizeArchetype, localizeSpellName, normalizeLanguage, t } from "../src/core/localization.js";
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
        ambience: "雨声和烛烟"
      }
    },
    player: { character: { name: "阿林" } },
    actionText: "检查门锁",
    check: { success: true, margin: 3, total: 15, dc: 12 },
    memories: [{ text: "门锁曾被银钥匙打开。" }]
  });

  assert.match(narration.text, /阿林/);
  assert.match(narration.text, /旧线索浮现/);
  assert.match(narration.text, /目标难度/);
});

test("local narration does not duplicate punctuation after player actions", () => {
  const zhNarration = localNarration({
    room: {
      language: "zh",
      scene: {
        location: "雨夜街道",
        objective: "找到账本",
        ambience: "雨声和烛烟"
      }
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
      }
    },
    player: { character: { name: "Lio" } },
    actionText: "listen for the singing?",
    check: { success: false, margin: -2, total: 10, dc: 12 },
    memories: []
  });

  assert.match(zhNarration.text, /选择侧耳听歌声。 这次尝试/);
  assert.doesNotMatch(zhNarration.text, /。。|。\.|\.。/);
  assert.match(enNarration.text, /choosing to listen for the singing\? The attempt/);
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

test("archetype labels localize raw join values", () => {
  assert.equal(localizeArchetype("zh", "Investigator"), "调查员");
  assert.equal(localizeArchetype("zh", "Vanguard"), "先锋");
  assert.equal(localizeArchetype("en", "调查员"), "Investigator");
});
