import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function formMarkup(html, id) {
  return html.match(new RegExp(`<form[^>]+id="${id}"[\\s\\S]*?<\\/form>`))?.[0] || "";
}

function cssRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] || "";
}

test("0013 auth/access forms stay in-page and fit the no-scroll shell", async () => {
  const [html, css, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/styles.css", "utf8"),
    readFile("public/app.js", "utf8")
  ]);
  const authForm = formMarkup(html, "authForm");
  const createForm = formMarkup(html, "createForm");
  const joinForm = formMarkup(html, "joinForm");

  for (const [name, markup] of Object.entries({ authForm, createForm, joinForm })) {
    assert.ok(markup, `${name} should exist`);
    assert.doesNotMatch(markup, /\saction=|\smethod="get"/i, `${name} should not submit credentials through the URL`);
  }

  assert.match(app, /async function submitAuthForm\(event\) \{[\s\S]*event\.preventDefault\(\)/);
  assert.match(app, /els\.createForm\.addEventListener\("submit", async \(event\) => \{[\s\S]*event\.preventDefault\(\)/);
  assert.match(app, /els\.joinForm\.addEventListener\("submit", async \(event\) => \{[\s\S]*event\.preventDefault\(\)/);
  assert.match(app, /fetch\(path, \{[\s\S]*body: options\.body \? JSON\.stringify\(options\.body\) : undefined/);

  assert.match(css, /\.gateway\s*\{[\s\S]*min-height: calc\(100d?vh - (?:28|48)px\)/);
  assert.match(css, /\.auth-panel\s*\{[\s\S]*border-radius: 8px/);
  assert.match(css, /\.auth-form\s*\{[\s\S]*display: grid/);
  assert.match(css, /\.auth-actions\s*\{[\s\S]*display: grid/);
  assert.match(css, /\.auth-actions button\s*\{[\s\S]*min-width: 0/);
  assert.match(css, /\.access-mode-hint,[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.form-error\s*\{[\s\S]*display: -webkit-box;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.room-password-field\s*\{[\s\S]*margin: 0/);
  assert.match(css, /\.host-access-section/);
  assert.match(css, /\.pending-player-list/);
  assert.match(css, /\.pending-player-card/);
});

test("0013 narrow viewports keep situation chrome inside 375, 430, and 768px widths", async () => {
  const css = await readFile("public/styles.css", "utf8");

  assert.match(css, /\.status-pill\s*\{[\s\S]*max-width: 100%;[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.status-pill::before\s*\{[\s\S]*flex: 0 0 auto/);
  assert.match(css, /\.panel-head-actions > \*\s*\{[\s\S]*min-width: 0/);

  assert.match(css, /@media \(max-width: 1120px\)[\s\S]*\.topbar\s*\{[\s\S]*max-height: 168px/);
  assert.match(css, /@media \(max-width: 1120px\)[\s\S]*\.topbar-actions\s*\{[\s\S]*max-height: none/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1120px\)[\s\S]*\.topbar-actions\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*width: 100%/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1120px\)[\s\S]*\.topbar-actions button,[\s\S]*\.topbar-actions \.status-pill\s*\{[\s\S]*min-height: 34px;[\s\S]*justify-content: center/);

  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.topbar-actions \.status-pill\s*\{[\s\S]*width: 100%;[\s\S]*min-width: 0;[\s\S]*max-width: none;[\s\S]*overflow: hidden;[\s\S]*white-space: nowrap/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.auth-panel-head\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(78px, auto\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.transcript-panel > \.panel-head\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.transcript-panel > \.panel-head \.panel-head-actions\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.scene-change-summary\s*\{[\s\S]*max-height: 64px;[\s\S]*overflow: hidden/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.scene-change-summary small\s*\{[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.scene-visual-meta\s*\{[\s\S]*max-height: 22px;[\s\S]*flex-wrap: nowrap/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.scene-copy h3\s*\{[\s\S]*-webkit-line-clamp: 2/);

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.table\s*\{[\s\S]*gap: 6px;[\s\S]*grid-template-rows: auto auto 94px minmax\(104px, 15dvh\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.topbar\s*\{[\s\S]*max-height: 126px;[\s\S]*padding: 6px 8px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.party-status-card,[\s\S]*\.party-status-empty\s*\{[\s\S]*flex-basis: min\(204px, 78vw\);[\s\S]*grid-template-columns: 32px minmax\(0, 1fr\);[\s\S]*height: 90px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-card,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-empty\s*\{[\s\S]*flex-basis: min\(204px, 78vw\);[\s\S]*height: 90px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.scene-visual-meta span\s*\{[\s\S]*max-width: 86px;[\s\S]*padding-inline: 5px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.scene-visual-meta span:nth-child\(n\+5\)\s*\{[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.transcript\[data-log-density="summary"\] \.message\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*min-height: 34px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.transcript\[data-log-density="summary"\] \.message \.meta\s*\{[\s\S]*grid-column: 1;[\s\S]*flex-wrap: nowrap;[\s\S]*min-height: 16px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.transcript\[data-log-density="summary"\] \.message p\s*\{[\s\S]*grid-column: 1;[\s\S]*max-height: 1\.25em;[\s\S]*-webkit-line-clamp: 1/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.transcript\[data-log-density="summary"\] \.message-detail\s*\{[\s\S]*width: 18px;[\s\S]*height: 18px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.action-form,[\s\S]*\.action-form\.chat-mode\s*\{[\s\S]*grid-template-columns: 68px 72px minmax\(0, 1fr\) minmax\(54px, 0\.22fr\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.transcript-panel > \.panel-head h3\s*\{[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.action-form input,[\s\S]*\.action-form select,[\s\S]*\.action-form button\s*\{[\s\S]*grid-column: auto/);
  assert.match(css, /@media \(max-height: 760px\) and \(min-width: 1121px\)[\s\S]*\.table\s*\{[\s\S]*grid-template-rows: auto auto 72px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-height: 760px\) and \(min-width: 1121px\)[\s\S]*\.transcript-panel\s*\{[\s\S]*--transcript-readable-min: 72px/);
  assert.match(css, /@media \(max-height: 760px\) and \(min-width: 1121px\)[\s\S]*\.action-mode-hint\s*\{[\s\S]*max-height: 18px;[\s\S]*-webkit-line-clamp: 1/);
  assert.match(css, /@media \(max-width: 430px\) and \(max-height: 700px\)[\s\S]*\.table\s*\{[\s\S]*grid-template-rows: auto auto 68px minmax\(96px, 14dvh\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 430px\) and \(max-height: 700px\)[\s\S]*\.party-status-card,[\s\S]*\.party-status-empty,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-card,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-empty\s*\{[\s\S]*height: 64px;[\s\S]*min-height: 64px/);
});

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
  assert.match(html, /id="tableStateToggle"[^>]+aria-expanded="false"[^>]+aria-controls="tableStateDetails"/);
  assert.match(html, /id="tableStateDetails"[\s\S]*id="audioStatusDock"/);
  assert.match(html, /id="turnFocus"[\s\S]*id="turnFocusLabel"[\s\S]*id="turnFocusContext"[\s\S]*id="turnFocusSteps"/);
  assert.match(html, /id="partyStatusBar"/);
  assert.match(html, /id="playerSetupPanel"/);
  assert.match(html, /id="fullTranscript"/);
  assert.match(html, /id="logDensityToggle"[^>]+data-density-mode="summary"[\s\S]*data-drawer-open="log"/);
  assert.match(html, /id="rewardToastExpand"[^>]+data-i18n="reward\.expand"/);
  assert.match(html, /class="scene-ambience-overlay"[\s\S]*id="sceneChangeSummary"[\s\S]*id="sceneChangeLabel"[\s\S]*id="sceneChangeDetail"/);
  assert.doesNotMatch(html.match(/<div class="topbar-actions">[\s\S]*?<\/div>\s*<\/header>/)?.[0] || "", /id="marketButton"|id="tableGuideButton"/);
  assert.match(html, /id="playerMenuSection"[\s\S]*id="marketButton"[\s\S]*id="tableGuideButton"/);

  assert.match(css, /body\.table-active[\s\S]*overflow: hidden/);
  assert.match(css, /body\.table-active \.shell[\s\S]*height: 100dvh/);
  assert.match(css, /\.table[\s\S]*height: calc\(100dvh - 28px\)/);
  assert.match(css, /button\s*\{[\s\S]*min-width: 0;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.table\s*\{[\s\S]*grid-template-rows: auto auto 86px minmax\(0, 1fr\)/);
  assert.match(css, /\.table-state-strip\s*\{[\s\S]*height: auto;[\s\S]*min-height: 36px;[\s\S]*overflow: hidden/);
  assert.match(css, /\.state-strip-toggle\s*\{[\s\S]*grid-template-columns: auto minmax\(0, 1fr\) minmax\(170px, auto\) 12px/);
  assert.match(css, /\.state-strip-grid\s*\{[\s\S]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)[\s\S]*max-height: 0;[\s\S]*overflow: hidden;[\s\S]*visibility: hidden/);
  assert.match(css, /\.table-state-strip\[data-expanded="true"\] \.state-strip-grid\s*\{[\s\S]*max-height: 96px;[\s\S]*overflow-y: auto;[\s\S]*opacity: 1;[\s\S]*pointer-events: auto/);
  assert.match(css, /\.table-state-strip:not\(\[data-expanded="true"\]\) \.state-strip-grid\s*\{[\s\S]*max-height: 0;[\s\S]*overflow: hidden;[\s\S]*opacity: 0;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden/);
  assert.doesNotMatch(cssRule(css, ".state-strip-grid"), /position:\s*absolute/);
  assert.doesNotMatch(cssRule(css, ".state-strip-grid"), /position:\s*fixed/);
  assert.doesNotMatch(cssRule(css, ".table-state-strip[data-expanded=\"true\"] .state-strip-grid"), /position:\s*absolute/);
  assert.doesNotMatch(cssRule(css, ".table-state-strip[data-expanded=\"true\"] .state-strip-grid"), /position:\s*fixed/);
  assert.doesNotMatch(css, /\.table-state-strip:hover \.state-strip-grid/);
  assert.doesNotMatch(css, /\.table-state-strip:focus-within \.state-strip-grid/);
  assert.match(css, /\.state-strip-grid strong\s*\{[\s\S]*display: block;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.table-state-strip\[data-expanded="true"\] \.state-strip-grid\s*\{[\s\S]*max-height: min\(136px, calc\(100dvh - 196px\)\);[\s\S]*padding: 6px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.state-strip-grid strong\s*\{[\s\S]*display: -webkit-box;[\s\S]*min-height: 1\.15em;[\s\S]*line-height: 1\.15;[\s\S]*white-space: normal;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.topbar\s*\{[\s\S]*max-height: 76px;[\s\S]*overflow: hidden/);
  assert.match(css, /\.topbar-actions\s*\{[\s\S]*flex-wrap: nowrap;[\s\S]*overflow: hidden/);
  assert.match(css, /\.compact-button\s*\{[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.drawer-panel\s*\{[\s\S]*z-index: 28;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden/);
  assert.match(css, /\.drawer-panel\.open\s*\{[\s\S]*pointer-events: auto;[\s\S]*visibility: visible/);
  assert.match(css, /\.drawer-scrim\s*\{[\s\S]*z-index: 27;/);
  assert.match(css, /\.reward-toast\s*\{[\s\S]*bottom: calc\(18px \+ env\(safe-area-inset-bottom\)\);[\s\S]*z-index: 34;/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.reward-toast\s*\{[\s\S]*width: min\(316px, calc\(100vw - 56px\)\);[\s\S]*min-height: 64px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.reward-toast\s*\{[\s\S]*width: min\(292px, calc\(100vw - 52px\)\);[\s\S]*min-height: 56px/);
  assert.match(css, /body\.drawer-open \.reward-toast\s*\{[\s\S]*z-index: 26;[\s\S]*opacity: 0;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden;[\s\S]*display: none !important/);
  assert.match(css, /\.party-status-bar\s*\{[\s\S]*height: 86px;[\s\S]*overflow-y: hidden/);
  assert.match(css, /\.party-status-card,[\s\S]*\.party-status-empty\s*\{[\s\S]*flex: 0 0 clamp\(224px, 23vw, 286px\)[\s\S]*height: 82px/);
  assert.match(css, /\.party-status-bar\[data-party-size="expanded"\] \.party-status-card,[\s\S]*\.party-status-bar\[data-party-size="expanded"\] \.party-status-empty\s*\{[\s\S]*flex-basis: clamp\(206px, 22vw, 246px\)/);
  assert.match(css, /\.party-status-bar\[data-party-size="crowded"\] \.party-status-card,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-empty\s*\{[\s\S]*flex-basis: clamp\(188px, 20vw, 224px\)/);
  assert.match(css, /\.setup-guidance\s*\{[\s\S]*max-height: 52px;[\s\S]*-webkit-line-clamp: 2;[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.table\.in-play \.player-setup-panel\s*\{[\s\S]*display: none !important/);
  assert.match(css, /\.table\.setup-open\.protected-entry \.player-setup-panel\s*\{[\s\S]*display: grid !important/);
  assert.match(css, /\.drawer-panel[\s\S]*position: fixed/);
  assert.match(css, /\.character-panel,[\s\S]*\.settings-panel,[\s\S]*\.market-panel\s*\{[\s\S]*grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(css, /\.character-sheet,[\s\S]*\.settings-stack\s*\{[\s\S]*min-height: 0;[\s\S]*overflow: auto/);
  assert.match(css, /\.market-stack\s*\{[\s\S]*min-height: 0;[\s\S]*overflow: auto/);
  assert.match(css, /\.settings-menu-actions\s*\{[\s\S]*grid-template-columns: repeat\(auto-fit, minmax\(116px, 1fr\)\)/);
  assert.match(css, /\.settings-section-head,[\s\S]*\.voice-toolbar-head\s*\{[\s\S]*min-width: 0/);
  assert.match(css, /\.audio-console p\s*\{[\s\S]*-webkit-line-clamp: 2;[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.audio-actions \.compact-button\s*\{[\s\S]*flex: 1 1 118px;[\s\S]*max-width: none/);
  assert.match(css, /\.transcript-panel[\s\S]*--transcript-readable-min: 116px;[\s\S]*grid-template-rows: auto auto auto auto minmax\(var\(--transcript-readable-min\), 1fr\) max-content minmax\(0, auto\)/);
  assert.match(css, /\.transcript-panel\[data-log-density="dense"\] > \.transcript\s*\{[\s\S]*gap: 6px;[\s\S]*padding: 8px 10px/);
  assert.match(css, /\.transcript-panel\[data-log-density="summary"\] > \.transcript\s*\{[\s\S]*gap: 4px;[\s\S]*padding: 7px 9px/);
  assert.match(css, /\.transcript\[data-log-density="dense"\] \.message p\s*\{[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.log-timeline-marker\s*\{[\s\S]*max-width: 100%;[\s\S]*text-overflow: ellipsis/);
  assert.match(css, /\.message-detail summary\s*\{[\s\S]*overflow: hidden;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.message-detail\s*\{[\s\S]*font: 700 0\.68rem ui-monospace/);
  assert.match(css, /\.transcript\[data-log-density="summary"\] \.message-detail\[open\]\s*\{[\s\S]*position: static;[\s\S]*grid-column: 1 \/ -1;[\s\S]*height: auto/);
  assert.match(css, /\.turn-focus\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(140px, auto\)[\s\S]*min-height: 58px/);
  assert.match(css, /\.turn-focus small\s*\{[\s\S]*grid-column: 1 \/ -1;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.turn-focus strong\s*\{[\s\S]*-webkit-line-clamp: 2;[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.turn-focus span\s*\{[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.transcript-panel > \.transcript\s*\{[\s\S]*grid-row: 5;[\s\S]*min-height: var\(--transcript-readable-min\)/);
  assert.match(css, /\.transcript-panel > \.action-form\s*\{[\s\S]*grid-row: 6/);
  assert.match(css, /\.dice-panel\s*\{[\s\S]*height: 76px;[\s\S]*overflow: hidden/);
  assert.match(css, /#dicePanelBody\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: auto minmax\(0, 1fr\)/);
  assert.match(css, /\.dice-detail-line\s*\{[\s\S]*overflow: hidden;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.action-form\s*\{[\s\S]*min-height: 0/);
  assert.match(css, /\.action-form\[data-turn-owner="local"\]\s*\{[\s\S]*rgba\(61, 155, 148, 0\.12\)/);
  assert.match(css, /\.action-mode-hint\s*\{[\s\S]*display: -webkit-box;[\s\S]*max-height: 32px;[\s\S]*-webkit-line-clamp: 2;[\s\S]*white-space: normal/);
  assert.match(css, /\.message p\s*\{[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.party-status-subline > span\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.scene-ambience-overlay\s*\{[\s\S]*animation: scene-breathe 8s ease-in-out infinite/);
  assert.match(css, /\.scene-backdrop\s*\{[\s\S]*animation: scene-idle-pan var\(--scene-motion-duration, 18s\) ease-in-out infinite alternate/);
  assert.match(css, /\.stage\[data-scene-pulse="true"\] \.scene-ambience-overlay\s*\{[\s\S]*scene-pulse/);
  assert.match(css, /\.scene-change-summary\s*\{[\s\S]*position: absolute;[\s\S]*top: 14px/);
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
  assert.match(css, /\.inventory-action-hints\s*\{[\s\S]*display: grid;[\s\S]*min-width: 0/);
  assert.match(css, /\.inventory-action-hints p\s*\{[\s\S]*grid-template-columns: 58px minmax\(0, 1fr\)/);
  assert.match(css, /\.inventory-detail,[\s\S]*\.inventory-detail-card\s*\{[\s\S]*scroll-margin-top: 12px/);
  assert.match(css, /\.inventory-action-hints span\s*\{[\s\S]*display: -webkit-box;[\s\S]*overflow: hidden;[\s\S]*-webkit-line-clamp: 2;[\s\S]*white-space: normal/);
  assert.match(css, /\.inventory-actions button\s*\{[\s\S]*min-width: 0;[\s\S]*min-height: 34px/);
  assert.match(css, /\.inventory-actions button:disabled\s*\{[\s\S]*border-style: dashed;[\s\S]*opacity: 0\.72/);
  assert.match(css, /\.market-note\s*\{[\s\S]*max-height: 36px;[\s\S]*-webkit-line-clamp: 2;[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /#marketStatus\s*\{[\s\S]*position: sticky;[\s\S]*top: 0;[\s\S]*z-index: 2/);
  assert.match(css, /#marketStatus:not\(:empty\)\s*\{[\s\S]*min-height: 42px/);
  assert.match(css, /#marketStatus:empty\s*\{[\s\S]*min-height: 0;[\s\S]*padding-bottom: 0/);
  assert.match(css, /\.market-card\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 112px/);
  assert.match(css, /\.market-card \.market-card-meta\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*max-height: 18px/);
  assert.match(css, /\.market-card-meta span\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.market-card-buy \.market-price\s*\{[\s\S]*display: grid;[\s\S]*overflow: hidden;[\s\S]*text-align: right/);
  assert.match(css, /\.market-card-buy \.market-price em,[\s\S]*\.market-price-secondary\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.market-price-secondary\s*\{[\s\S]*font-size: 0\.56rem;[\s\S]*line-height: 1\.1;[\s\S]*text-align: right/);
  assert.match(css, /\.market-buy-reason\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.form-error\s*\{[\s\S]*max-height: 42px;[\s\S]*-webkit-line-clamp: 2;[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /#marketStatus\[data-feedback-kind="success"\],[\s\S]*#inventoryStatus\[data-feedback-kind="success"\]\s*\{[\s\S]*#9fe0d7/);
  assert.match(css, /\.equipment-summary > div\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.party-drawer,[\s\S]*\.state-drawer,[\s\S]*\.log-drawer,[\s\S]*\.character-drawer,[\s\S]*\.settings-drawer,[\s\S]*\.market-drawer[\s\S]*transform: translateY\(100%\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.character-summary-grid,[\s\S]*\.equipment-summary > div,[\s\S]*\.market-card\s*\{[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.state-strip-grid\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.turn-focus\s*\{[\s\S]*grid-template-columns: 1fr;[\s\S]*min-height: 66px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.inventory-detail,[\s\S]*\.inventory-detail-card\s*\{[\s\S]*scroll-margin-top: 10px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.inventory-actions\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.market-card \.market-card-meta\s*\{[\s\S]*grid-template-columns: 1fr;[\s\S]*max-height: 32px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.action-mode-hint\s*\{[\s\S]*max-height: 28px;[\s\S]*font-size: 0\.62rem;[\s\S]*line-height: 1\.15/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.topbar-actions button\s*\{[\s\S]*max-width: none;[\s\S]*text-overflow: clip;[\s\S]*white-space: normal/);

  assert.match(app, /document\.body\.classList\.add\("table-active"\)/);
  assert.match(app, /panel\.inert = !active/);
  assert.match(app, /panel\.inert = true/);
  assert.match(app, /const hasPlayerBinding = hasLocalPlayerBinding\(\);[\s\S]*const showPlayerSetup = shouldShowPlayerSetup\(room, hasPlayerBinding\);[\s\S]*const showPlaySurface = shouldShowTablePlaySurface\(room, hasPlayerBinding\);/);
  assert.match(app, /renderTurnFocus\(active, localPlayer, hasPlayerBinding, sceneChanged\)/);
  assert.match(app, /els\.table\.dataset\.phase = room\.phase \|\| "lobby"/);
  assert.match(app, /els\.table\.classList\.toggle\("in-play", showPlaySurface\)/);
  assert.match(app, /els\.playerSetupPanel\?\.classList\.toggle\("hidden", !showPlayerSetup\)/);
  assert.match(app, /els\.transcriptPanel\?\.classList\.toggle\("hidden", !showPlaySurface\)/);
  assert.match(app, /function layerPlayerMenuControls\(\)[\s\S]*const menuButtons = \[els\.marketButton, els\.tableGuideButton\]\.filter\(Boolean\)[\s\S]*els\.settingsStack\.prepend\(menu\)[\s\S]*button\.classList\.add\("settings-menu-button"\)/);
  assert.match(app, /bindTableStateStrip\(\);[\s\S]*bindLogDensityToggle\(\);/);
  assert.match(app, /function bindTableStateStrip\(\)[\s\S]*dataset\.expanded[\s\S]*aria-expanded/);
  assert.match(app, /tableStateDetails: document\.querySelector\("#tableStateDetails"\)/);
  assert.match(app, /els\.tableStateDetails\?\.setAttribute\("aria-hidden", String\(!expanded\)\);[\s\S]*els\.tableStateDetails\.inert = !expanded/);
  assert.match(app, /function bindLogDensityToggle\(\)[\s\S]*LOG_DENSITY_SEQUENCE\[\(index \+ 1\) % LOG_DENSITY_SEQUENCE\.length\]/);
  assert.match(app, /const LOG_MAIN_LIMITS = \{[\s\S]*summary: 22,[\s\S]*dense: 14,[\s\S]*comfortable: 8/);
  assert.match(app, /const LOG_MOBILE_MAIN_LIMITS = \{[\s\S]*summary: 12,[\s\S]*dense: 9,[\s\S]*comfortable: 6/);
  assert.match(app, /const mainLimit = transcriptMainLimit\(logDensity\)/);
  assert.match(app, /function transcriptMainLimit\(density = logDensity\)[\s\S]*isCompactMobileViewport\(\) \? LOG_MOBILE_MAIN_LIMITS : LOG_MAIN_LIMITS/);
  assert.match(app, /renderTranscriptEntries\(els\.transcript, entries\.slice\(-mainLimit\), \{ density: logDensity, surface: "main" \}\)/);
  assert.match(app, /message\.dataset\.logGroup = logGroup/);
  assert.match(app, /message\.dataset\.timelineStart = String\(groupStart\)/);
  assert.match(app, /function transcriptGroupLabel\(entry = \{\}\)[\s\S]*formatTranscriptTime\(entry\.createdAt\)/);
  assert.match(app, /function transcriptDetailMarkup\(entry = \{\}\)[\s\S]*log\.detail\.roll[\s\S]*log\.detail\.reward/);
  assert.match(app, /function eventProgressionDetail\(entry = \{\}\)[\s\S]*log\.detail\.warnPrefix[\s\S]*log\.detail\.eventProgression/);
  assert.match(app, /function transcriptMainText\(entry = \{\}\)[\s\S]*looksLikeRawJson[\s\S]*entry\.structuredLog\?\.humanSummary/);
  assert.match(app, /function renderStage\(sceneChanged = false\)[\s\S]*data-scene-pulse[\s\S]*renderSceneChangeSummary\(sceneChanged\)/);
  assert.match(app, /drawerOpener/);
  assert.match(app, /function openDrawer\(name, opener = document\.activeElement\)[\s\S]*closeRewardToast\(\);[\s\S]*document\.body\.classList\.add\("drawer-open"\)/);
  assert.match(app, /const REWARD_TOAST_DURATION_MS = 3800/);
  assert.match(app, /els\.rewardToastExpand\?\.addEventListener\("click"[\s\S]*els\.rewardPanel\.open = true[\s\S]*openDrawer\("state", els\.rewardToastExpand\)/);
  assert.match(app, /rewardToastTimer = window\.setTimeout\(closeRewardToast, REWARD_TOAST_DURATION_MS\)/);
  assert.match(app, /els\.replayButton\.addEventListener\("click", async \(\) => \{[\s\S]*const roomId = room\.id;[\s\S]*els\.replaySummary\.dataset\.replayState = "building"[\s\S]*withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/replay`, \{ timeoutMs: REPLAY_REQUEST_TIMEOUT_MS \}\)\)[\s\S]*renderReplay\(result\.replay\)/);
  assert.match(app, /async function withRealtimePaused\(task\)[\s\S]*realtimePauseDepth \+= 1;[\s\S]*closeRealtimeSource\(\);[\s\S]*return await task\(\);[\s\S]*connectEvents\(nextRoomId\)/);
});
