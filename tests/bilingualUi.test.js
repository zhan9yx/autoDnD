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
  assert.match(html, /data-i18n="field.tableLanguage"/);
});

test("client modules include Chinese dictionary and speech synthesis plan", async () => {
  const i18n = await readFile("public/i18n.js", "utf8");
  const tts = await readFile("public/tts.js", "utf8");
  const app = await readFile("public/app.js", "utf8");

  assert.match(i18n, /AI 跑团主持人/);
  assert.match(i18n, /语音开/);
  assert.match(tts, /espeak-ng/);
  assert.match(tts, /piper/);
  assert.match(app, /speechSynthesis/);
  assert.match(app, /speakNewTranscriptEntries/);
});
