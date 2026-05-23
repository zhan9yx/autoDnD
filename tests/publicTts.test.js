import test from "node:test";
import assert from "node:assert/strict";
import { buildUtterancePlan, selectVoice, splitSpeechText } from "../public/tts.js";

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

test("speaker plans keep distinct role rate and pitch profiles", () => {
  const narrator = buildUtterancePlan({ author: "AIDM", language: "en" });
  const rules = buildUtterancePlan({ author: "Rules", language: "en" });
  const table = buildUtterancePlan({ author: "Table", language: "en" });
  const player = buildUtterancePlan({ author: "Mira", language: "zh" });

  assert.deepEqual(
    [narrator.profile.role, rules.profile.role, table.profile.role, player.profile.role],
    ["narrator", "rules", "system", "player"]
  );
  assert.notEqual(narrator.profile.rate, rules.profile.rate);
  assert.notEqual(rules.profile.pitch, table.profile.pitch);
  assert.notEqual(table.profile.pitch, player.profile.pitch);
  assert.equal(player.language, "zh-CN");
});

test("long speech text is normalized and capped to four chunks", () => {
  const chunks = splitSpeechText(" First line.   Second line! Third line? Fourth line。 Fifth line！ Sixth line？ ");

  assert.deepEqual(chunks, ["First line.", "Second line!", "Third line?", "Fourth line。"]);
  assert.equal(chunks.length, 4);
});
