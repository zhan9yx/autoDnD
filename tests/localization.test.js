import test from "node:test";
import assert from "node:assert/strict";
import { AIProvider, localNarration } from "../src/core/aiProvider.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { normalizeLanguage, t } from "../src/core/localization.js";
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
    species: "human",
    classId: "rogue"
  });
  assert.match(joined.room.transcript.at(-1).text, /加入了牌桌/);

  const started = await engine.startRoom(room.id);
  assert.match(started.transcript.at(-1).text, /跑团开始/);
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

test("localized message formatter interpolates parameters", () => {
  assert.equal(t("zh", "activeTurn", { name: "梅" }), "现在是梅的回合");
  assert.equal(t("en", "activeTurn", { name: "Mei" }), "It is Mei's turn");
});
