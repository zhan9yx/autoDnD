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
});

test("server exposes soundscape presets and presentation-decorated room snapshots", async () => {
  const server = await readFile("src/server/server.js", "utf8");

  assert.match(server, /\/api\/soundscapes/);
  assert.match(server, /chooseSoundscape/);
  assert.match(server, /withPresentation/);
  assert.match(server, /buildPresentation/);
});
