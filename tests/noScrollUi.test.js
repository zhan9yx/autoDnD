import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("open table uses one-viewport shell with overlay drawers", async () => {
  const [html, css, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/styles.css", "utf8"),
    readFile("public/app.js", "utf8")
  ]);

  assert.match(html, /data-drawer="party"[^>]+inert/);
  assert.match(html, /data-drawer="state"[^>]+inert/);
  assert.match(html, /data-drawer="log"[^>]+inert/);
  assert.match(html, /data-drawer="character"[^>]+inert/);
  assert.match(html, /data-drawer="market"[^>]+inert/);
  assert.match(html, /data-drawer="settings"[^>]+inert/);
  assert.match(html, /id="drawerScrim"/);
  assert.match(html, /id="turnDock"/);
  assert.match(html, /id="partyStatusBar"/);
  assert.match(html, /id="playerSetupPanel"/);
  assert.match(html, /id="fullTranscript"/);
  assert.doesNotMatch(html.match(/<div class="topbar-actions">[\s\S]*?<\/div>\s*<\/header>/)?.[0] || "", /id="marketButton"|id="tableGuideButton"/);
  assert.match(html, /id="playerMenuSection"[\s\S]*id="marketButton"[\s\S]*id="tableGuideButton"/);

  assert.match(css, /body\.table-active[\s\S]*overflow: hidden/);
  assert.match(css, /body\.table-active \.shell[\s\S]*height: 100dvh/);
  assert.match(css, /\.table[\s\S]*height: calc\(100dvh - 28px\)/);
  assert.match(css, /\.table-state-strip\s*\{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.topbar\s*\{[\s\S]*max-height: 76px;[\s\S]*overflow: hidden/);
  assert.match(css, /\.topbar-actions\s*\{[\s\S]*flex-wrap: nowrap;[\s\S]*overflow: hidden/);
  assert.match(css, /\.compact-button\s*\{[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.table-state-strip\s*\{[\s\S]*height: 58px;[\s\S]*overflow: hidden/);
  assert.match(css, /\.party-status-bar\s*\{[\s\S]*height: 74px;[\s\S]*overflow-y: hidden/);
  assert.match(css, /\.table\.in-play \.player-setup-panel\s*\{[\s\S]*display: none !important/);
  assert.match(css, /\.drawer-panel[\s\S]*position: fixed/);
  assert.match(css, /\.character-panel,[\s\S]*\.settings-panel,[\s\S]*\.market-panel\s*\{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(css, /\.character-sheet,[\s\S]*\.settings-stack\s*\{[\s\S]*min-height: 0;[\s\S]*overflow: auto/);
  assert.match(css, /\.market-stack\s*\{[\s\S]*min-height: 0;[\s\S]*overflow: auto/);
  assert.match(css, /\.settings-menu-actions\s*\{[\s\S]*grid-template-columns: repeat\(auto-fit, minmax\(116px, 1fr\)\)/);
  assert.match(css, /\.transcript-panel[\s\S]*grid-template-rows: auto auto auto minmax\(0, 1fr\) auto auto/);
  assert.match(css, /\.dice-panel\s*\{[\s\S]*height: 76px;[\s\S]*overflow: hidden/);
  assert.match(css, /\.message p\s*\{[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.builder-card\s*\{[\s\S]*min-height: 72px/);
  assert.match(css, /\.builder-card-art\s*\{[\s\S]*width: 30px;[\s\S]*height: 30px/);
  assert.match(css, /\.spell-card\s*\{[\s\S]*min-height: 64px/);
  assert.match(css, /\.spell-card-art,[\s\S]*\.spell-chip-art\s*\{[\s\S]*width: 34px;[\s\S]*height: 34px/);
  assert.match(css, /\.avatar-icon\s*\{[\s\S]*background-repeat: no-repeat;[\s\S]*background-size: 86%/);
  assert.match(css, /\.vital-meter\s*\{[\s\S]*display: grid;[\s\S]*min-width: 0;/);
  assert.match(css, /\.roster-vitals\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.dice-roller-animation::after\s*\{[\s\S]*content: attr\(data-final\)/);
  assert.match(css, /\.dice-panel\[data-roll-state="rolling"\] \.dice-roller-animation::after\s*\{[\s\S]*animation: dice-face-spin/);
  assert.match(css, /\.dice-final-score\s*\{[\s\S]*font: 900 1rem ui-monospace/);
  assert.match(css, /\.message\.channel-party\s*\{[\s\S]*rgba\(197, 161, 76, 0\.12\)/);
  assert.match(css, /\.channel-badge\[data-channel-badge="party"\]\s*\{[\s\S]*color: #ecd28f/);
  assert.match(css, /\.market-card\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 112px/);
  assert.match(css, /\.market-buy-reason\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.equipment-summary > div\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.party-drawer,[\s\S]*\.state-drawer,[\s\S]*\.log-drawer,[\s\S]*\.character-drawer,[\s\S]*\.settings-drawer,[\s\S]*\.market-drawer[\s\S]*transform: translateY\(100%\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.character-summary-grid,[\s\S]*\.equipment-summary > div,[\s\S]*\.market-card\s*\{[\s\S]*grid-template-columns: 1fr/);

  assert.match(app, /document\.body\.classList\.add\("table-active"\)/);
  assert.match(app, /panel\.inert = !active/);
  assert.match(app, /panel\.inert = true/);
  assert.match(app, /const showPlayerSetup = !localPlayer && room\.phase === "lobby"/);
  assert.match(app, /els\.table\.dataset\.phase = room\.phase \|\| "lobby"/);
  assert.match(app, /els\.table\.classList\.toggle\("in-play", !showPlayerSetup\)/);
  assert.match(app, /els\.playerSetupPanel\?\.classList\.toggle\("hidden", !showPlayerSetup\)/);
  assert.match(app, /els\.transcriptPanel\?\.classList\.toggle\("hidden", showPlayerSetup\)/);
  assert.match(app, /function layerPlayerMenuControls\(\)[\s\S]*const menuButtons = \[els\.marketButton, els\.tableGuideButton\]\.filter\(Boolean\)[\s\S]*els\.settingsStack\.prepend\(menu\)[\s\S]*button\.classList\.add\("settings-menu-button"\)/);
  assert.match(app, /entries\.slice\(-5\)/);
  assert.match(app, /drawerOpener/);
});
