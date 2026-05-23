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
  assert.match(html, /id="sceneRail"/);
  assert.match(html, /id="assetSearch"/);
  assert.match(html, /id="assetDetail"/);
  assert.match(html, /data-i18n="field.tableLanguage"/);
});

test("client modules include Chinese dictionary and speech synthesis plan", async () => {
  const i18n = await readFile("public/i18n.js", "utf8");
  const tts = await readFile("public/tts.js", "utf8");
  const ambience = await readFile("public/ambience.js", "utf8");
  const app = await readFile("public/app.js", "utf8");

  assert.match(i18n, /AI 跑团主持人/);
  assert.match(i18n, /语音开/);
  assert.match(i18n, /自适应氛围/);
  assert.match(tts, /espeak-ng/);
  assert.match(tts, /piper/);
  assert.match(ambience, /AudioContext/);
  assert.match(ambience, /createAmbienceEngine/);
  assert.match(app, /speechSynthesis/);
  assert.match(app, /speakNewTranscriptEntries/);
  assert.match(app, /createAmbienceEngine/);
  assert.match(app, /renderStage/);
});

test("server exposes soundscape presets and decorates room snapshots", async () => {
  const server = await readFile("src/server/server.js", "utf8");

  assert.match(server, /\/api\/soundscapes/);
  assert.match(server, /chooseSoundscape/);
  assert.match(server, /withSoundscape/);
});
