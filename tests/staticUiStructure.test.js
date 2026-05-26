import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { t } from "../public/i18n.js";

function formMarkup(html, id) {
  return html.match(new RegExp(`<form[^>]+id="${id}"[\\s\\S]*?<\\/form>`))?.[0] || "";
}

function i18nKeyCount(i18n, key) {
  return Array.from(i18n.matchAll(new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*:`, "g"))).length;
}

function assertBilingualI18nKeys(i18n, keys) {
  const missing = keys.filter((key) => i18nKeyCount(i18n, key) < 2);
  assert.deepEqual(missing, [], `missing bilingual i18n keys: ${missing.join(", ")}`);
}

function collectReferencedI18nKeys(sources) {
  const keys = new Set();
  const patterns = [
    /data-i18n(?:-[\w-]+)?="([^"]+)"/g,
    /\bt\s*\(\s*[^,\n()]+,\s*"([^"]+)"/g,
    /show(?:Create|Join|Auth|Memo|Inventory|Market)Status\("([^"]+)"/g
  ];
  for (const source of sources) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source))) {
        if (!match[1].includes("${")) keys.add(match[1]);
      }
    }
  }
  return [...keys].sort();
}

function cssRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] || "";
}

test("0013 auth/access UI exposes safe login, registration, password, and approval controls", async () => {
  const [html, app, i18n, css] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8"),
    readFile("public/i18n.js", "utf8"),
    readFile("public/styles.css", "utf8")
  ]);
  const authForm = formMarkup(html, "authForm");
  const createForm = formMarkup(html, "createForm");
  const joinForm = formMarkup(html, "joinForm");
  const settingsMarkup = html.match(/<aside class="panel settings-panel[\s\S]*?<aside class="panel log-panel/)?.[0] || "";

  assert.match(html, /<section class="auth-panel" id="authPanel" aria-labelledby="authTitle">/);
  assert.match(authForm, /id="authForm"[^>]+class="auth-form"[^>]+data-auth-mode="login"/);
  assert.doesNotMatch(authForm, /\saction=|\smethod="get"/i);
  assert.match(authForm, /id="loginModeButton"[^>]+type="button"[^>]+data-auth-mode-button="login"[^>]+aria-pressed="true"[^>]+data-i18n="auth\.loginMode"/);
  assert.match(authForm, /id="registerModeButton"[^>]+type="button"[^>]+data-auth-mode-button="register"[^>]+aria-pressed="false"[^>]+data-i18n="auth\.registerMode"/);
  assert.match(authForm, /id="authDisplayNameField"[\s\S]*name="displayName"[^>]+autocomplete="name"[^>]+data-i18n-placeholder="placeholder\.displayName"/);
  assert.match(authForm, /name="email"[^>]+type="email"[^>]+autocomplete="email"[^>]+data-i18n-placeholder="placeholder\.email"/);
  assert.match(authForm, /name="password"[^>]+type="password"[^>]+autocomplete="current-password"[^>]+minlength="4"[^>]+data-i18n-placeholder="placeholder\.password"/);
  assert.match(authForm, /id="authSubmitButton"[^>]+type="submit"[^>]+data-i18n="button\.login"/);
  assert.match(authForm, /id="logoutButton"[^>]+type="button"[^>]+data-i18n="button\.logout"/);
  assert.match(authForm, /id="authStatus"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.match(html, /id="authStatusText"[^>]+data-auth-state="guest"[^>]+data-i18n="auth\.guest"/);
  assert.match(html, /id="tableAuthStatus"[^>]+data-auth-state="guest"[^>]+data-i18n="auth\.guest"/);

  assert.match(createForm, /name="accessMode" id="createAccessMode"/);
  assert.match(createForm, /value="open"[^>]+data-i18n="access\.open"/);
  assert.match(createForm, /value="password"[^>]+data-i18n="access\.password"/);
  assert.match(createForm, /value="host-approval"[^>]+data-i18n="access\.hostApproval"/);
  assert.match(createForm, /id="createRoomPasswordField"[\s\S]*name="roomPassword"[^>]+type="password"[^>]+autocomplete="new-password"[^>]+data-i18n-placeholder="placeholder\.roomPassword"/);
  assert.match(createForm, /id="createAccessHint"[^>]+data-i18n="access\.openHint"/);
  assert.doesNotMatch(createForm, /\saction=|\smethod="get"/i);

  assert.match(joinForm, /id="joinRoomPasswordField"[\s\S]*name="roomPassword"[^>]+type="password"[^>]+autocomplete="current-password"[^>]+data-i18n-placeholder="placeholder\.roomPassword"/);
  assert.match(joinForm, /id="joinStatus"[^>]+role="status"[^>]+aria-live="polite"/);
  assert.doesNotMatch(joinForm, /\saction=|\smethod="get"/i);

  assert.match(settingsMarkup, /id="hostAccessSection"[^>]+aria-labelledby="hostAccessTitle"/);
  assert.match(settingsMarkup, /id="hostAccessTitle"[^>]+data-i18n="access\.hostTitle"/);
  assert.match(settingsMarkup, /id="roomAccessSummary"/);
  assert.match(settingsMarkup, /id="pendingPlayersList"[^>]+aria-live="polite"/);

  assert.match(app, /bindAuthControls\(\);[\s\S]*bindRoomAccessControls\(\);[\s\S]*bindHostAccessControls\(\);[\s\S]*const startupAuthRestore = restoreAuthSession\(\);[\s\S]*initializeRoomFromUrl\(startupAuthRestore\);/);
  assert.match(app, /async function submitAuthForm\(event\) \{[\s\S]*event\.preventDefault\(\)[\s\S]*new FormData\(els\.authForm\)[\s\S]*api\(authMode === "register" \? "\/api\/auth\/register" : "\/api\/auth\/login"/);
  assert.match(app, /els\.createForm\.addEventListener\("submit", async \(event\) => \{[\s\S]*event\.preventDefault\(\)[\s\S]*const accessMode = String\(form\.get\("accessMode"\) \|\| "open"\)[\s\S]*body\.roomPassword = roomPassword/);
  assert.match(app, /els\.joinForm\.addEventListener\("submit", async \(event\) => \{[\s\S]*event\.preventDefault\(\)[\s\S]*roomPassword: String\(form\.get\("roomPassword"\) \|\| ""\)\.trim\(\)/);
  assert.match(app, /function syncCreateAccessControls\(\)[\s\S]*passwordInput\.required = mode === "password"[\s\S]*"access\.hostApprovalHint"[\s\S]*"access\.openHint"/);
  assert.match(app, /function syncRoomAccessControls\(showSetup = !hasLocalPlayerBinding\(\)\)[\s\S]*passwordProtected[\s\S]*hostApprovalRequired[\s\S]*button\.pendingApproval[\s\S]*button\.requestApproval[\s\S]*join\.approvalRequired[\s\S]*join\.passwordRequired/);
  assert.match(app, /let rejectedAccessNotice = null/);
  assert.match(app, /pending\.status === "rejected"[\s\S]*showJoinStatus\("join\.rejected"\)/);
  assert.match(app, /function normalizeClientRoom\(nextRoom = \{\}\)[\s\S]*protectedLobbyScene\(access\)[\s\S]*players: Array\.isArray\(nextRoom\.players\) \? nextRoom\.players : \[\]/);
  assert.match(app, /function attachRoomAccessHeaders\(path, headers\)[\s\S]*roomPendingPlayerIdKey\(roomId\)[\s\S]*"X-AIDM-Player-Id"[\s\S]*"X-AIDM-Player-Token"/);
  assert.match(app, /function syncPendingAccessRefresh\(\)[\s\S]*needsProtectedAccessRefresh\(\)[\s\S]*api\(`\/api\/rooms\/\$\{encodeURIComponent\(room\.id\)\}`\)/);
  assert.match(app, /function renderHostAccessControls\(\)[\s\S]*access\.summary[\s\S]*access\.noPending[\s\S]*data-pending-action="approve"[\s\S]*data-pending-action="reject"/);
  assert.match(app, /async function api\(path, options = \{\}\)[\s\S]*headers\.Authorization = `Bearer \$\{authSessionToken\}`[\s\S]*error\.code = payload\.code \|\| ""/);
  assert.match(css, /\.auth-panel\s*\{/);
  assert.match(css, /\.auth-form\s*\{/);
  assert.match(css, /\.auth-actions\s*\{/);
  assert.match(css, /\.room-password-field\s*\{/);
  assert.match(css, /\.access-mode-hint,/);

  assertBilingualI18nKeys(i18n, [
    "auth.kicker",
    "auth.title",
    "auth.guest",
    "auth.guestTitle",
    "auth.modeGroup",
    "auth.loginMode",
    "auth.registerMode",
    "auth.credentialsRequired",
    "auth.working",
    "auth.registered",
    "auth.loggedIn",
    "auth.loggedOut",
    "auth.checking",
    "auth.restored",
    "auth.sessionExpired",
    "auth.emailRequired",
    "auth.passwordRequired",
    "auth.userExists",
    "auth.invalidCredentials",
    "auth.sessionRequired",
    "field.displayName",
    "field.email",
    "field.password",
    "field.accessMode",
    "field.roomPassword",
    "placeholder.displayName",
    "placeholder.email",
    "placeholder.password",
    "placeholder.roomPassword",
    "button.login",
    "button.register",
    "button.logout",
    "button.pendingApproval",
    "button.requestApproval",
    "button.approve",
    "button.reject",
    "access.open",
    "access.password",
    "access.hostApproval",
    "access.openHint",
    "access.passwordHint",
    "access.hostApprovalHint",
    "access.passwordRequired",
    "access.joinPasswordRequired",
    "access.joinPasswordInvalid",
    "access.invalidMode",
    "access.hostRequired",
    "access.pendingMissing",
    "access.pendingResolved",
    "access.hostKicker",
    "access.hostTitle",
    "access.summary",
    "access.noPending",
    "setup.guidance.password",
    "setup.guidance.approval",
    "setup.guidance.pending",
    "setup.startSceneReady",
    "setup.startSceneNoPlayers",
    "setup.startSceneHostOnly",
    "setup.startSceneInProgress",
    "room.protectedTitle",
    "room.protectedLocation",
    "room.passwordObjective",
    "room.approvalObjective",
    "room.protectedAmbience",
    "room.openingFromUrl",
    "join.pending",
    "join.rejected",
    "join.approvalRequired",
    "join.passwordRequired"
  ]);
});

test("public UI i18n references resolve in English and Chinese", async () => {
  const [html, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8")
  ]);
  const missing = collectReferencedI18nKeys([html, app])
    .filter((key) => t("en", key) === key || t("zh", key) === key);

  assert.deepEqual(missing, [], `missing public i18n keys: ${missing.join(", ")}`);
});

test("static table UI keeps status summary, hidden drawer defaults, and reward toast state hooks", async () => {
  const [html, app, css, i18n] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8"),
    readFile("public/styles.css", "utf8"),
    readFile("public/i18n.js", "utf8")
  ]);
  const stateDrawerMarkup = html.match(/<aside class="panel state-panel[\s\S]*?<aside class="panel settings-panel/)?.[0] || "";

  assert.match(html, /<section class="table-state-strip"[^>]+aria-label="当前牌桌状态"[^>]+data-i18n-aria-label="panel\.tableState"[^>]+data-expanded="false"/);
  assert.match(html, /id="tableStateToggle"[^>]+aria-expanded="false"[^>]+aria-controls="tableStateDetails"[\s\S]*id="stateStripHeadline"[\s\S]*id="stateStripMeta"/);
  assert.match(html, /id="tableStateDetails"[\s\S]*id="turnDock"[\s\S]*id="roundDock"[\s\S]*id="encounterDock"[\s\S]*id="syncDock"[\s\S]*id="playerSummaryDock"[\s\S]*id="audioStatusDock"/);
  assert.match(html, /id="partyStatusBar"/);
  assert.match(html, /id="playerSetupPanel"[\s\S]*id="joinForm"/);
  assert.match(html, /data-drawer-open="character"/);
  assert.match(html, /data-drawer="character"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer-open="market"/);
  assert.match(html, /data-drawer="market"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer-open="settings"/);
  assert.match(html, /data-drawer="settings"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /id="inventoryList"[\s\S]*id="inventoryDetail"/);
  assert.match(html, /id="startButton"[^>]+data-action-priority="primary"/);
  assert.match(html, /id="myCharacterButton"[^>]+data-action-priority="secondary"/);
  assert.match(html, /data-action-priority="utility"[^>]+data-drawer-open="settings"/);
  assert.match(html, /class="setup-primary-actions"[\s\S]*type="submit" data-i18n="button\.joinTable"[\s\S]*data-guide-open[\s\S]*data-guide-tab-target="quickstart"/);
  assert.match(html, /id="characterProgressSummary"[\s\S]*id="equipmentSummary"[\s\S]*id="spellList"/);
  assert.match(html, /id="marketWallet"[\s\S]*class="market-note"[\s\S]*id="marketStatus"[\s\S]*id="marketList"/);
  assert.doesNotMatch(html.match(/<div class="topbar-actions">[\s\S]*?<\/div>\s*<\/header>/)?.[0] || "", /id="marketButton"|id="tableGuideButton"/);
  assert.match(html, /id="playerMenuSection"[\s\S]*id="marketButton"[\s\S]*id="tableGuideButton"/);
  assert.match(html, /data-card-select="speciesSelect"[\s\S]*data-card-value="human"[\s\S]*data-card-value="elf"[\s\S]*data-card-value="dwarf"[\s\S]*data-card-value="tiefling"/);
  assert.match(html, /data-card-select="classSelect"[\s\S]*data-card-value="warrior"[\s\S]*data-card-value="rogue"[\s\S]*data-card-value="mage"[\s\S]*data-card-value="cleric"/);
  assert.match(html, /class="builder-card-art" src="\/assets\/generated\/options\/aidm-option-01\.png"/);
  assert.match(html, /class="builder-card-art" src="\/assets\/generated\/options\/aidm-option-09\.png"/);
  assert.match(html, /id="starterSpellCards"/);
  assert.match(html, /id="memoForm"[\s\S]*id="memoText"/);
  assert.match(html, /id="dicePanel"[\s\S]*id="dicePanelBody"/);
  assert.match(html, /id="logDensityToggle"[^>]+data-density-mode="summary"[\s\S]*data-drawer-open="log"/);
  assert.match(html, /id="sceneBackdrop"[\s\S]*class="scene-ambience-overlay"[\s\S]*id="sceneChangeSummary"[\s\S]*id="sceneChangeLabel"[\s\S]*id="sceneChangeDetail"[\s\S]*id="sceneVisualMeta"/);
  assert.match(html, /id="threatClockLabel"[^>]+data-i18n="state\.threat">威胁/);
  assert.match(html, /id="clueClockLabel"[^>]+data-i18n="state\.clues">线索/);
  assert.match(html, /id="dicePanel" class="dice-panel empty"[^>]+aria-live="polite"[\s\S]*class="dice-roller-animation"[^>]+aria-hidden="true"/);
  assert.match(html, /id="turnFocus" class="turn-focus"[^>]+role="status"[^>]+aria-live="polite"[\s\S]*id="turnFocusLabel"[\s\S]*id="turnFocusContext"[\s\S]*id="turnFocusSteps"/);
  assert.match(html, /<form id="actionForm" class="action-form" data-intent="action"[\s\S]*id="actionModeHint"[^>]+aria-live="polite"/);
  assert.match(html, /name="channel"[\s\S]*value="public"[\s\S]*value="party"/);
  assert.match(html, /class="settings-menu settings-section" id="playerMenuSection"[\s\S]*class="settings-section-head"[\s\S]*id="playerMenuTitle"/);
  assert.match(html, /class="settings-section settings-language-section"[\s\S]*id="languageSelect"/);
  assert.match(html, /class="audio-console settings-section"[\s\S]*id="ambienceMaster"[\s\S]*id="ambienceEnvironment"/);
  assert.match(html, /class="voice-toolbar settings-section"[\s\S]*class="voice-toolbar-controls"[\s\S]*id="voiceRate"[\s\S]*id="voicePitch"/);
  assert.match(html, /id="stateSummary"/);
  assert.match(html, /id="stateChangeList"/);
  assert.match(stateDrawerMarkup, /<details class="state-summary-panel state-collapsible" open>[\s\S]*id="stateSummary"[\s\S]*id="stateChangeList"/);
  assert.match(stateDrawerMarkup, /<details class="encounter-panel state-collapsible">[\s\S]*id="encounterList"/);
  assert.match(stateDrawerMarkup, /<details class="reward-panel state-collapsible">[\s\S]*id="rewardList"/);
  assert.match(stateDrawerMarkup, /class="replay-panel state-collapsible"[\s\S]*id="replayButton" type="button"[\s\S]*id="replaySummary" class="replay-summary"/);
  assert.match(stateDrawerMarkup, /id="replaySummary" class="replay-summary" data-i18n="noReport">暂无战报。/);
  assert.doesNotMatch(stateDrawerMarkup, /id="replayButton"[^>]+disabled/);
  assert.match(app, /renderStateSummary/);
  assert.match(app, /renderPartyStatus/);
  assert.match(app, /const roundLabel = t\(uiLanguage, "round", \{ round: room\?\.round \|\| 1 \}\)/);
  assert.match(app, /data-party-tag="round">\$\{escapeHtml\(roundLabel\)\}/);
  assert.match(app, /renderCharacterDrawer/);
  assert.match(app, /renderMarketDrawer/);
  assert.match(app, /renderPlayerSummaryDock/);
  assert.match(app, /syncTableStateSummary/);
  assert.match(app, /function syncStartSceneButton\(\)[\s\S]*setup\.startSceneInProgress[\s\S]*setup\.startSceneNoPlayers[\s\S]*setup\.startSceneHostOnly[\s\S]*setup\.startSceneReady[\s\S]*aria-label/);
  assert.match(app, /bindTableStateStrip\(\);[\s\S]*bindLogDensityToggle\(\);/);
  assert.match(app, /function bindTableStateStrip\(\)[\s\S]*dataset\.expanded[\s\S]*aria-expanded/);
  assert.match(app, /const LOG_DENSITY_SEQUENCE = \["summary", "dense", "comfortable"\]/);
  assert.match(app, /function bindLogDensityToggle\(\)[\s\S]*LOG_DENSITY_SEQUENCE\[\(index \+ 1\) % LOG_DENSITY_SEQUENCE\.length\][\s\S]*localStorage\.setItem\("aidm\.logDensity", logDensity\)/);
  assert.match(app, /function syncLogDensityToggle\(\)[\s\S]*data-log-density/);
  assert.match(app, /const LOG_MAIN_LIMITS = \{[\s\S]*summary: 22,[\s\S]*dense: 14,[\s\S]*comfortable: 8/);
  assert.match(app, /const LOG_MOBILE_MAIN_LIMITS = \{[\s\S]*summary: 12,[\s\S]*dense: 9,[\s\S]*comfortable: 6/);
  assert.match(app, /const mainLimit = transcriptMainLimit\(logDensity\)/);
  assert.match(app, /function renderTranscriptEntries\(container, entries, options = \{\}\)[\s\S]*message\.dataset\.logType[\s\S]*localizedTranscriptType\(entry\)[\s\S]*message-detail/);
  assert.match(app, /function localizedTranscriptType\(entry = \{\}\)[\s\S]*transcriptTypeLabelKey\(entry\)/);
  assert.match(app, /function transcriptMainText\(entry = \{\}\)[\s\S]*looksLikeRawJson[\s\S]*log\.detail\.eventFallback/);
  assert.match(app, /function eventProgressionDetail\(entry = \{\}\)[\s\S]*stateDelta[\s\S]*log\.detail\.eventProgression/);
  assert.match(app, /function formatPlayerClockDelta\(delta = \{\}\)[\s\S]*log\.clock\.\$\{key\}/);
  assertBilingualI18nKeys(i18n, [
    "log.type.eventResolution",
    "log.type.warn",
    "log.detail.eventProgression",
    "log.detail.warnPrefix",
    "log.detail.noImpact",
    "log.detail.eventNextDefault",
    "log.detail.eventFallback",
    "log.clock.quest",
    "log.clock.clues",
    "log.clock.danger",
    "log.clock.deadline",
    "reward.expand",
    "reward.feedback.backpackShort"
  ]);
  assert.match(app, /function currentSceneVisualState\(\)[\s\S]*room\?\.soundscape\?\.sceneVisualState[\s\S]*room\?\.presentation\?\.sceneVisualState/);
  assert.match(app, /els\.partyStatusBar\.dataset\.partySize = room\.players\.length >= 6 \? "crowded" : room\.players\.length >= 4 \? "expanded" : "standard"/);
  assert.match(app, /function applySceneVisualState\(visualState\)[\s\S]*dataset\.sceneWeather[\s\S]*dataset\.sceneSeason[\s\S]*dataset\.sceneRain[\s\S]*dataset\.sceneWind[\s\S]*dataset\.sceneThunder[\s\S]*dataset\.sceneVariantKey/);
  assert.match(app, /function renderSceneVisualMeta\(visualState\)[\s\S]*sceneVisualChips\(visualState\)[\s\S]*dataset\.visualChip/);
  assert.match(app, /function sceneVisualChips\(visualState\)[\s\S]*sceneVisualAxis\(visualState, "timeOfDay", "time"\)[\s\S]*sceneVisualAxis\(visualState, "pressure"\)[\s\S]*sceneVisualAxis\(visualState, "season", "season", "unseasoned"\)/);
  assert.match(app, /function sceneVisualAxis\(visualState, axis, variantPrefix = axis, fallback = ""\)[\s\S]*sceneVisualVariantToken\(visualState\?\.variantKey, variantPrefix\)/);
  assert.match(app, /function refineSceneLocationToken\(token, visualState\)[\s\S]*preset:market-city[\s\S]*return "market-city"/);
  assert.match(app, /function formatVisualToken\(value\)[\s\S]*"market-city": \{ en: "Rain Lanes and Wet Stone", zh: "雨巷与湿石街区" \}[\s\S]*unseasoned: \{ en: "Not Set", zh: "未设定" \}/);
  assert.match(app, /function compactVariantLabel\(variantKey\)[\s\S]*preset:[\s\S]*weather:/);
  assert.match(app, /function transcriptDetailMarkup\(entry = \{\}\)[\s\S]*log\.detail\.roll[\s\S]*log\.detail\.economy[\s\S]*log\.detail\.inventory/);
  assert.match(app, /function renderStage\(sceneChanged = false\)[\s\S]*data-scene-pulse[\s\S]*renderSceneChangeSummary\(sceneChanged\)/);
  assert.match(app, /renderDicePanel/);
  assert.match(app, /threatClockLabel: document\.querySelector\("#threatClockLabel"\)/);
  assert.match(app, /clueClockLabel: document\.querySelector\("#clueClockLabel"\)/);
  assert.match(app, /function renderDicePanel\(\)[\s\S]*delete els\.dicePanel\.dataset\.rollTotal[\s\S]*els\.dicePanel\.dataset\.rollTotal = finalTotalLabel[\s\S]*data-dice-final-score[\s\S]*data-dice-outcome-copy[\s\S]*data-dice-detail/);
  assert.match(app, /function rollEventKey\(entry = \{\}\)[\s\S]*entry\.id[\s\S]*Array\.isArray\(roll\.rolls\)[\s\S]*roll\.expression/);
  assert.match(app, /row\.dataset\.combatResult = result[\s\S]*row\.dataset\.combatAction = entry\.action \|\| ""[\s\S]*row\.innerHTML = combatLogMarkup\(entry\)/);
  assert.match(app, /function combatLogMarkup\(entry = \{\}\)[\s\S]*data-combat-result-copy[\s\S]*data-combat-damage[\s\S]*data-combat-hp-shift/);
  assert.match(app, /function combatLogClasses\(entry = \{\}\)[\s\S]*entry\.critical \? "critical"[\s\S]*combatDamageAmount\(entry\) > 0/);
  assert.match(app, /function combatResult\(entry = \{\}\)[\s\S]*entry\.hit === true[\s\S]*entry\.hit === false/);
  assert.match(app, /bindCharacterDrawer/);
  assert.match(app, /bindBuilderCards/);
  assert.match(app, /bindMarketDrawer/);
  assert.match(app, /layerPlayerMenuControls\(\);[\s\S]*bindGuide\(\);[\s\S]*bindDrawers\(\);/);
  assert.match(app, /function layerPlayerMenuControls\(\)[\s\S]*const menuButtons = \[els\.marketButton, els\.tableGuideButton\]\.filter\(Boolean\)[\s\S]*els\.settingsStack\.prepend\(menu\)[\s\S]*button\.classList\.add\("settings-menu-button"\)[\s\S]*controls\.append\(button\)/);
  assert.match(app, /syncBuilderCards\(group, select\.value\)/);
  assert.match(app, /button\.setAttribute\("aria-pressed", String\(active\)\)/);
  assert.match(app, /els\.replayButton\.addEventListener\("click", async \(\) => \{[\s\S]*aria-busy[\s\S]*dataset\.replayState = "building"[\s\S]*api\(`\/api\/rooms\/\$\{roomId\}\/replay`, \{ timeoutMs: REPLAY_REQUEST_TIMEOUT_MS \}\)[\s\S]*renderReplay\(result\.replay\)/);
  assert.match(app, /function renderReplay\(replay\)[\s\S]*els\.replaySummary\.dataset\.replayState = "built"/);
  assert.match(app, /const SPELL_ART_FILES = \{/);
  assert.match(app, /const ITEM_ART_FILES = \{/);
  assert.match(app, /const ITEM_CATEGORY_ART_FILES = \{/);
  assert.match(app, /spellArtMarkup\(spell\.id, localizeTextValue\(spell\.label\), "spell-card-art"\)/);
  assert.match(app, /function spellArtFile\(spellId\)[\s\S]*SPELL_ART_FILES\[normalized\]/);
  assert.match(app, /renderCharacterProgress\(character\)/);
  assert.match(app, /renderEquipmentSummary\(character\.inventory \|\| \[\], character\.equipmentSummary\)/);
  assert.match(app, /els\.characterVitals\.innerHTML = `[\s\S]*vital\.defense[\s\S]*vital\.initiative/);
  assert.match(app, /function renderKnownSpells\(character\)[\s\S]*const spells = \[\.\.\.new Set\(\[\.\.\.\(character\.knownSpells \|\| \[\]\), \.\.\.\(character\.spells \|\| \[\]\)\]\)\]/);
  assert.match(app, /function renderPlayerSummaryDock\(player = getLocalPlayer\(\)\)[\s\S]*character\.summaryLine[\s\S]*level[\s\S]*xp[\s\S]*equipment: slots\.compact/);
  assert.match(app, /const summaryItem = equipmentSummary\?\.slots\?\.\[slot\.summarySlot\]\?\.item;[\s\S]*const entry = summaryItem[\s\S]*value: entry \? inventoryItemName\(entry\) : t\(uiLanguage, "slot\.empty"\)/);
  assert.match(app, /compact: items\.map\(\(slot\) => slot\.value === t\(uiLanguage, "slot\.empty"\) \? "-" : slot\.value\)\.join\("\/"\)/);
  assert.match(app, /function isEquippableInventoryItem\(item, definition = inventoryDefinition\(item\)\)[\s\S]*Boolean\(item\?\.slot \|\| definition\.slot\)/);
  assert.match(app, /function isCurrentEquipmentItem\(item, definition = inventoryDefinition\(item\)\)[\s\S]*summaryItem[\s\S]*Boolean\(item\?\.equipped\)/);
  assert.match(app, /action === "equip" \? "items\/equip"/);
  assert.match(app, /function marketPriceLabel\(offer\)[\s\S]*t\(uiLanguage, "currency\.cr"\)/);
  assert.match(app, /data-price-role="\$\{escapeHtml\(marketPriceRole\(offer\)\)\}"[\s\S]*marketPriceRoleLabel\(offer\)[\s\S]*marketPriceLabel\(offer\)/);
  assert.match(app, /const resaleLine = marketResaleLine\(offer\)[\s\S]*class="market-price-secondary" data-price-role="\$\{escapeHtml\(resaleLine\.role\)\}"/);
  assert.match(app, /card\.dataset\.purchaseState = purchaseState\.reasonCode \|\| \(purchaseState\.canBuy \? "available" : "unavailable"\)/);
  assert.match(app, /const statusLabel = marketOfferStatusLabel\(purchaseState\)/);
  assert.match(app, /const actionHint = purchaseState\.canBuy \? marketOfferActionHint\(offer, definition\) : marketOfferBlockedHint\(purchaseState\.reason\)/);
  assert.match(app, /card\.setAttribute\("aria-label", marketOfferCardAriaLabel\(definition, offer, statusLabel\)\)/);
  assert.match(app, /card\.setAttribute\("aria-disabled", String\(!purchaseState\.canBuy\)\)/);
  assert.match(app, /function marketPurchaseReasonCode\(offer, wallet\)[\s\S]*purchaseRestriction[\s\S]*availabilityReason[\s\S]*"rule-locked"[\s\S]*"sold-out"[\s\S]*"owned"[\s\S]*"insufficient-funds"/);
  assert.match(app, /function marketPurchaseReasonLabel\(offer, reasonCode, fallbacks = \{\}\)[\s\S]*if \(isStandardMarketReasonCode\(normalizedReasonCode\)\) return marketReasonFallbackLabel\(normalizedReasonCode\)/);
  assert.match(app, /function isAvailableMarketReasonLabel\(label\)[\s\S]*可购买/);
  assert.match(app, /function marketReasonFallbackLabel\(reasonCode\)[\s\S]*"rule-locked": "market\.state\.ruleLocked"[\s\S]*owned: "market\.state\.owned"[\s\S]*"sold-out": "market\.state\.soldOut"[\s\S]*"insufficient-funds": "market\.state\.insufficientFunds"/);
  assert.match(app, /function marketBuyButtonLabel\(definition, purchaseStateOrReason = ""\)[\s\S]*market\.buyAriaDisabled/);
  assert.match(app, /class="market-card-meta" data-market-card-meta/);
  assert.match(app, /class="\$\{purchaseState\.canBuy \? "market-card-hint" : "market-card-status"\}" data-market-card-status="\$\{escapeHtml\(statusLabel\)\}"/);
  assert.match(i18n, /"market\.state\.insufficientFunds": "Insufficient funds"/);
  assert.match(i18n, /"market\.state\.insufficientFunds": "资金不足"/);
  assert.match(i18n, /"market\.buyAriaDisabled": "Cannot buy \{item\}: \{reason\}"/);
  assert.match(i18n, /"market\.buyAriaDisabled": "无法购买\{item\}：\{reason\}"/);
  assert.match(app, /class="inventory-action-hints" data-inventory-action-hints/);
  assert.match(app, /function inventoryUnavailableReason\(action, item, definition = inventoryDefinition\(item\), actionState = item\?\.actions\?\.\[action\]\)[\s\S]*const backendReason = actionReasonLabel\(actionState\)/);
  assert.match(app, /data-action-state="\$\{row\.available \? "available" : "blocked"\}"/);
  assert.match(app, /function inventoryListValueLabel\(item\)[\s\S]*inventoryValueRoleLabel\(item\)[\s\S]*inventoryValueLabel\(item\)/);
  assert.match(app, /function inventoryValueRoleLabel\(item\)[\s\S]*item\?\.valueRoleLabel[\s\S]*economyRoleLabel\("inventory-value"\)/);
  assert.match(app, /function inventorySellValueRoleLabel\(item\)[\s\S]*item\?\.saleValueRoleLabel[\s\S]*economyRoleLabel\("resale-value"\)/);
  assert.match(app, /els\.marketStatus\.dataset\.feedbackKind = marketFeedback\?\.kind \|\| ""/);
  assert.match(app, /els\.inventoryStatus\.dataset\.feedbackKind = inventoryFeedback\?\.kind \|\| ""/);
  assert.match(app, /function itemArtMarkup\(item, definition, className\)[\s\S]*itemArtFile\(item, definition\)/);
  assert.match(app, /function itemArtFile\(item, definition = \{\}\)[\s\S]*assetRefFile\(item\?\.assetRef\)[\s\S]*assetRefFile\(item\?\.definitionSnapshot\?\.assetRef\)[\s\S]*assetRefFile\(definition\?\.assetRef\)[\s\S]*assetRefFile\(item\?\.generated\)/);
  assert.match(app, /function itemArtFile\(item, definition = \{\}\)[\s\S]*assetRefFile\(item\?\.definition\?\.image\)[\s\S]*assetRefFile\(item\?\.definitionSnapshot\?\.art\)[\s\S]*assetRefFile\(item\?\.generatedAsset\)/);
  assert.match(app, /function assetRefFile\(assetRef\)[\s\S]*assetRef\.generatedFile[\s\S]*assetRef\.art\?\.file[\s\S]*assetRef\.generated\?\.file/);
  assert.match(app, /function mappedItemArtFile\(item, definition = \{\}\)[\s\S]*ITEM_ART_FILES\[itemId\][\s\S]*GENERATED_REWARD_ART_FILES\[itemId\][\s\S]*ITEM_CATEGORY_ART_FILES\[categoryKey\]/);
  assert.match(app, /function rewardArtFile\(entry\)[\s\S]*mappedItemArtFile[\s\S]*ITEM_CATEGORY_ART_FILES\.reward/);
  assert.match(app, /const rewardFile = rewardArtFile\(entry\)/);
  assert.match(app, /function assetRefFile\(assetRef\)[\s\S]*assetRef\.file[\s\S]*assetRef\.url[\s\S]*assetRef\.image\?\.file/);
  assert.match(app, /class="\$\{className\} item-art-fallback"/);
  assert.match(app, /const hasPlayerBinding = hasLocalPlayerBinding\(\);[\s\S]*const showPlayerSetup = shouldShowPlayerSetup\(room, hasPlayerBinding\);[\s\S]*const showPlaySurface = shouldShowTablePlaySurface\(room, hasPlayerBinding\);/);
  assert.match(app, /els\.table\.dataset\.phase = room\.phase \|\| "lobby"/);
  assert.match(app, /els\.table\.classList\.toggle\("in-play", showPlaySurface\)/);
  assert.match(app, /els\.table\.classList\.toggle\("setup-open", showPlayerSetup\)/);
  assert.match(app, /els\.table\.classList\.toggle\("protected-entry", showPlayerSetup && isProtectedRoomAccess\(room\)\)/);
  assert.match(app, /const sceneSignature = sceneGuidanceSignature\(room\);[\s\S]*const sceneChanged = Boolean\(lastSceneSignature && sceneSignature && sceneSignature !== lastSceneSignature\)/);
  assert.match(app, /function renderTurnFocus\(active, localPlayer, hasPlayerBinding, sceneChanged = false\)[\s\S]*turnCue\.noLocal[\s\S]*turnCue\.yourTurn[\s\S]*turnCue\.otherTurn/);
  assert.match(app, /function renderTurnFocus\(active, localPlayer, hasPlayerBinding, sceneChanged = false\)[\s\S]*turnCue\.next\.noLocal/);
  assert.match(app, /function renderTurnFocus\(active, localPlayer, hasPlayerBinding, sceneChanged = false\)[\s\S]*turnCue\.next\.local/);
  assert.match(app, /function renderTurnFocus\(active, localPlayer, hasPlayerBinding, sceneChanged = false\)[\s\S]*turnCue\.next\.other/);
  assert.match(app, /function ensureSetupGuidance\(\)[\s\S]*guidance\.id = "setupGuidance"[\s\S]*guidance\.setAttribute\("role", "status"\)[\s\S]*syncSetupGuidance\(\)/);
  assert.match(app, /function syncSetupGuidance\(showSetup = !hasLocalPlayerBinding\(\)\)[\s\S]*setup\.guidance\.pending[\s\S]*setup\.guidance\.password[\s\S]*setup\.guidance\.approval[\s\S]*setup\.guidance\.playing[\s\S]*setup\.guidance[\s\S]*setup\.ready[\s\S]*setup\.adjustBudget/);
  assert.match(app, /els\.playerSetupPanel\?\.classList\.toggle\("hidden", !showPlayerSetup\)/);
  assert.match(app, /els\.transcriptPanel\?\.classList\.toggle\("hidden", !showPlaySurface\)/);
  assert.match(app, /syncSetupGuidance\(showPlayerSetup\)/);
  assert.match(app, /payload\.channel = form\.get\("channel"\) \|\| "public"/);
  assert.match(app, /submitButton\.textContent = t\(uiLanguage, intent === "chat" \? "button\.sendingChat" : "button\.resolvingAction"\)/);
  assert.match(app, /const ACTION_REQUEST_TIMEOUT_MS = 10000/);
  assert.match(app, /const roomId = room\.id;[\s\S]*const result = await withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/\$\{path\}`, \{[\s\S]*method: "POST",[\s\S]*timeoutMs: ACTION_REQUEST_TIMEOUT_MS,[\s\S]*body: payload[\s\S]*\}\)\)/);
  assert.match(app, /delete els\.actionForm\.dataset\.submitState/);
  assert.match(app, /function ensureActionIntentSegments\(\)[\s\S]*className = "action-intent-tabs"[\s\S]*dataset\.intentChoice = value/);
  assert.match(app, /function syncActionIntentSegments\(isChat = false\)[\s\S]*const titleKey = value === "chat" \? "action\.intent\.chatTitle" : "action\.intent\.actionTitle"[\s\S]*aria-pressed/);
  assert.match(app, /function syncActionModeControls\(\)[\s\S]*els\.actionForm\.dataset\.intent = isChat \? "chat" : "action"[\s\S]*els\.actionModeHint\.textContent/);
  assert.match(app, /function syncSceneTracker\(kind, source, meter, labelEl\)[\s\S]*state\.tracker\.tooltip[\s\S]*dataset\.trackerStage/);
  assert.match(app, /room\.stateSummary/);
  assert.match(css, /body\.table-active[\s\S]*overflow: hidden/);
  assert.match(css, /\.table[\s\S]*height: calc\(100dvh - 28px\)/);
  assert.match(css, /\.table\.in-play \.player-setup-panel\s*\{[\s\S]*display: none !important/);
  assert.match(css, /\.table\.setup-open\.protected-entry \.player-setup-panel\s*\{[\s\S]*display: grid !important/);
  assert.match(css, /\.setup-guidance\s*\{[\s\S]*max-height: 52px;[\s\S]*line-height: 1\.45;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.state-summary-grid\s*\{/);
  assert.match(css, /\.party-status-bar\s*\{/);
  assert.match(css, /\.character-drawer/);
  assert.match(css, /\.market-drawer/);
  assert.match(css, /\.settings-drawer/);
  assert.match(css, /\.settings-menu-actions\s*\{[\s\S]*grid-template-columns: repeat\(auto-fit, minmax\(116px, 1fr\)\)/);
  assert.match(css, /\.settings-section-head,[\s\S]*\.voice-toolbar-head\s*\{[\s\S]*display: grid/);
  assert.match(css, /\.voice-toolbar-controls\s*\{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap/);
  assert.match(css, /\.turn-focus\s*\{[\s\S]*grid-row: 2;[\s\S]*min-height: 58px/);
  assert.match(css, /\.turn-focus small\s*\{[\s\S]*grid-column: 1 \/ -1;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.turn-focus\[data-turn-owner="local"\]\s*\{[\s\S]*rgba\(61, 155, 148, 0\.18\)/);
  assert.match(css, /\.turn-focus\[data-scene-shifted="true"\] span\s*\{[\s\S]*#ecd28f/);
  assert.match(css, /\.transcript-panel > \.dice-panel\s*\{[\s\S]*grid-row: 4/);
  assert.match(css, /\.transcript-panel > \.transcript\s*\{[\s\S]*grid-row: 5/);
  assert.match(css, /\.transcript-panel > \.action-form\s*\{[\s\S]*grid-row: 6/);
  assert.match(css, /\.transcript-panel\s*\{[\s\S]*grid-template-rows: auto auto auto auto minmax\(var\(--transcript-readable-min\), 1fr\) max-content minmax\(0, auto\)/);
  assert.match(css, /\.inventory-detail-card\s*\{/);
  assert.match(css, /\.inventory-item-art,[\s\S]*\.market-item-art\s*\{[\s\S]*width: 42px;[\s\S]*height: 42px;[\s\S]*object-fit: contain;/);
  assert.match(css, /\.inventory-detail-art\s*\{[\s\S]*width: 64px;[\s\S]*height: 64px;[\s\S]*object-fit: contain;/);
  assert.match(css, /\.inventory-detail,[\s\S]*\.inventory-detail-card\s*\{[\s\S]*scroll-margin-top: 12px/);
  assert.match(css, /\.inventory-action-hints p\s*\{[\s\S]*grid-template-columns: 58px minmax\(0, 1fr\);[\s\S]*min-height: 24px/);
  assert.match(css, /\.inventory-action-hints span\s*\{[\s\S]*display: -webkit-box;[\s\S]*-webkit-line-clamp: 2;[\s\S]*white-space: normal/);
  assert.match(css, /\.inventory-action-hints p\[data-action-state="available"\] span\s*\{[\s\S]*rgba\(159, 224, 215, 0\.86\)/);
  assert.match(css, /\.inventory-action-hints p\[data-action-state="blocked"\] span\s*\{[\s\S]*#d98a80/);
  assert.match(css, /\.inventory-actions button\s*\{[\s\S]*min-width: 0;[\s\S]*font-size: 0\.78rem/);
  assert.match(css, /\.inventory-actions button:disabled\s*\{[\s\S]*border-style: dashed;[\s\S]*background: rgba\(21, 20, 18, 0\.42\)/);
  assert.match(css, /\.item-art-fallback/);
  assert.match(css, /\.market-card\s*\{/);
  assert.match(css, /\.market-note\s*\{[\s\S]*max-height: 36px;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.market-card-main > div\s*\{[\s\S]*display: grid;[\s\S]*min-width: 0/);
  assert.match(css, /\.market-card \.market-card-meta\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*max-height: 18px/);
  assert.match(css, /\.market-card-buy \.market-price\s*\{[\s\S]*display: grid;[\s\S]*text-align: right/);
  assert.match(css, /\.market-card-buy \.market-price em,[\s\S]*\.market-price-secondary\s*\{[\s\S]*text-transform: uppercase;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.market-card-buy \.market-price strong\s*\{[\s\S]*color: var\(--brass\);[\s\S]*text-overflow: ellipsis/);
  assert.match(css, /\.market-price-secondary\s*\{[\s\S]*font-size: 0\.56rem;[\s\S]*text-align: right/);
  assert.match(css, /\.market-card-status\s*\{[\s\S]*#d98a80[\s\S]*font-weight: 800/);
  assert.match(css, /\.market-card-buy button\s*\{[\s\S]*width: 100%;[\s\S]*min-width: 0/);
  assert.match(css, /\.builder-card\s*\{/);
  assert.match(css, /\.builder-card-art\s*\{/);
  assert.match(css, /\.spell-card\s*\{/);
  assert.match(css, /\.spell-card-art,[\s\S]*\.spell-chip-art\s*\{/);
  assert.match(css, /\.reward-card img,[\s\S]*\.reward-art-fallback\s*\{/);
  assert.match(css, /\.builder-card strong,[\s\S]*\.builder-card small\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.spell-card strong,[\s\S]*\.spell-card small\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;/);
  assert.match(css, /\.market-card strong\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.dice-panel\s*\{/);
  assert.match(css, /#dicePanelBody\s*\{[\s\S]*display: grid;[\s\S]*grid-template-rows: auto auto auto/);
  assert.match(css, /\.dice-panel\[data-roll-state="rolling"\]\s*\{/);
  assert.match(css, /\.dice-final-score\s*\{[\s\S]*text-shadow: 0 1px 0 #000/);
  assert.match(css, /\.dice-detail-line\s*\{[\s\S]*display: flex;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.dice-margin\s*\{[\s\S]*border-radius: 999px/);
  assert.match(css, /--dice-rest-transform/);
  assert.match(css, /@keyframes dice-tumble[\s\S]*var\(--dice-rest-transform\)[\s\S]*var\(--dice-roll-transform\)/);
  assert.match(css, /\.combat-row\.hit\s*\{/);
  assert.match(css, /\.combat-row\.miss\s*\{/);
  assert.match(css, /\.combat-result-pill,[\s\S]*\.combat-damage-pill,[\s\S]*\.combat-hp-shift/);
  assert.match(css, /\.combat-row\.critical \.combat-result-pill,[\s\S]*\.combat-row\.defeated \.combat-result-pill/);
  assert.match(css, /\.action-form\[data-intent="chat"\]\s*\{[\s\S]*rgba\(61, 155, 148, 0\.08\)/);
  assert.match(css, /\.action-intent-tabs\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.action-intent-tab\[aria-pressed="true"\]\s*\{[\s\S]*rgba\(159, 224, 215, 0\.16\)/);
  assert.match(css, /\.action-mode-hint\s*\{[\s\S]*grid-column: 1 \/ -1;[\s\S]*max-height: 32px;[\s\S]*-webkit-line-clamp: 2;[\s\S]*white-space: normal/);
  assert.match(css, /\.tracker-label\s*\{[\s\S]*pointer-events: auto/);
  assert.match(css, /\.audio-console p\s*\{[\s\S]*-webkit-line-clamp: 2;[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.form-error\s*\{[\s\S]*max-height: 42px;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /#marketStatus\s*\{[\s\S]*position: sticky;[\s\S]*top: 0;[\s\S]*z-index: 2/);
  assert.match(css, /#marketStatus:not\(:empty\)\s*\{[\s\S]*min-height: 42px/);
  assert.match(css, /#marketStatus\[data-feedback-kind="busy"\],[\s\S]*#inventoryStatus\[data-feedback-kind="busy"\]\s*\{[\s\S]*#ecd28f/);
  assert.match(css, /\.party-status-tag\s*\{[\s\S]*text-transform: uppercase/);
  assert.match(html, /id="fullTranscript" class="transcript full-transcript"/);
  assert.match(html, /class="log-toolbar"[^>]+data-i18n-aria-label="log\.toolbar"[\s\S]*id="logSearchInput"[^>]+type="search"[\s\S]*id="logTypeFilter"[\s\S]*id="logKeyOnlyToggle"[^>]+aria-pressed="false"[\s\S]*id="logLatestButton"/);
  assert.match(html, /id="logVisibleCount">0 可见/);
  assert.match(html, /id="logDensityToggle"[^>]+aria-pressed="true"[^>]+data-density-mode="summary"/);
  assert.match(app, /let logDensity = normalizeLogDensity\(localStorage\.getItem\("aidm\.logDensity"\)\)/);
  assert.match(app, /let logTypeFilter = normalizeLogTypeFilter\(localStorage\.getItem\("aidm\.logTypeFilter"\)\)/);
  assert.match(app, /let logKeyOnly = localStorage\.getItem\("aidm\.logKeyOnly"\) === "true"/);
  assert.match(app, /const mainLimit = transcriptMainLimit\(logDensity\);[\s\S]*syncLogDensityToggle\(\);[\s\S]*renderTranscriptEntries\(els\.transcript, entries\.slice\(-mainLimit\), \{ density: logDensity, surface: "main" \}\)/);
  assert.match(app, /function transcriptMainLimit\(density = logDensity\)[\s\S]*isCompactMobileViewport\(\) \? LOG_MOBILE_MAIN_LIMITS : LOG_MAIN_LIMITS/);
  assert.match(app, /const drawerEntries = filteredLogEntries\(entries\);[\s\S]*renderTranscriptEntries\(els\.fullTranscript, drawerEntries, \{ density: logDensity, surface: "drawer" \}\)/);
  assert.match(app, /function renderTranscriptEntries\(container, entries, options = \{\}\)[\s\S]*const density = options\.density \|\| "comfortable";[\s\S]*container\.dataset\.logDensity = density;[\s\S]*message\.dataset\.logType = entry\.type \|\| "event"/);
  assert.match(app, /const logGroup = transcriptGroupKey\(entry\);[\s\S]*message\.dataset\.logGroup = logGroup[\s\S]*message\.dataset\.timelineStart = String\(groupStart\)/);
  assert.match(app, /function filteredLogEntries\(entries = \[\]\)[\s\S]*logSearchQuery\.trim\(\)[\s\S]*normalizeLogTypeFilter\(logTypeFilter\)[\s\S]*isKeyTranscriptEvent\(entry\)[\s\S]*transcriptSearchText\(entry\)/);
  assert.match(app, /function bindLogDrawerControls\(\)[\s\S]*logSearchInput\?\.addEventListener\("input"[\s\S]*logTypeFilter\?\.addEventListener\("change"[\s\S]*logKeyOnlyToggle\?\.addEventListener\("click"[\s\S]*logLatestButton\?\.addEventListener\("click", scrollFullLogToLatest\)/);
  assert.match(app, /function transcriptGroupKey\(entry = null\)[\s\S]*entry\.structuredLog\?\.turnId[\s\S]*entry\.createdAt/);
  assert.match(app, /function transcriptGroupLabel\(entry = \{\}\)[\s\S]*log\.group\.round[\s\S]*log\.group\.time/);
  assert.match(app, /<details class="message-detail" aria-label="\$\{escapeHtml\(t\(uiLanguage, "log\.detail\.expand"\)\)\}"/);
  assert.match(app, /<details class="message-body-detail" aria-label="\$\{escapeHtml\(t\(uiLanguage, "log\.body\.expand"\)\)\}" data-long-text="true">/);
  assert.match(app, /function syncLogDensityToggle\(\)[\s\S]*dataset\.densityMode = logDensity[\s\S]*aria-pressed[\s\S]*data-log-density/);
  assert.match(app, /if \(els\.logCount\) \{[\s\S]*els\.logCount\.textContent = t\(uiLanguage, "logEntries", \{ count: entries\.length \}\)/);
  assert.match(app, /if \(els\.logVisibleCount\) \{[\s\S]*els\.logVisibleCount\.textContent = t\(uiLanguage, "log\.visibleCount", \{ visible: drawerEntries\.length, total: entries\.length \}\)/);
  assert.match(html, /class="table-state-strip"[^>]+data-expanded="false"[\s\S]*id="tableStateToggle"[^>]+aria-expanded="false"[^>]+aria-controls="tableStateDetails"[\s\S]*id="stateStripHeadline"[\s\S]*id="stateStripMeta"[\s\S]*class="state-strip-grid" id="tableStateDetails"/);
  assert.match(app, /tableStateDetails: document\.querySelector\("#tableStateDetails"\)/);
  assert.match(app, /function bindTableStateStrip\(\)[\s\S]*els\.tableStateStrip\.dataset\.expanded = String\(expanded\)[\s\S]*els\.tableStateToggle\.setAttribute\("aria-expanded", String\(expanded\)\)[\s\S]*els\.tableStateDetails\?\.setAttribute\("aria-hidden", String\(!expanded\)\);[\s\S]*els\.tableStateDetails\.inert = !expanded[\s\S]*event\.key === "Escape"/);
  assert.match(css, /\.table-state-strip\s*\{[\s\S]*height: auto;[\s\S]*min-height: 36px;[\s\S]*overflow: hidden/);
  assert.match(css, /\.state-strip-grid\s*\{[\s\S]*max-height: 0;[\s\S]*overflow: hidden;[\s\S]*padding: 0 8px;[\s\S]*visibility: hidden/);
  assert.match(css, /\.table-state-strip\[data-expanded="true"\] \.state-strip-grid\s*\{[\s\S]*max-height: 96px;[\s\S]*overflow-y: auto;[\s\S]*opacity: 1;[\s\S]*pointer-events: auto;[\s\S]*visibility: visible/);
  assert.match(css, /\.table-state-strip:not\(\[data-expanded="true"\]\) \.state-strip-grid\s*\{[\s\S]*max-height: 0;[\s\S]*overflow: hidden;[\s\S]*opacity: 0;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden/);
  assert.doesNotMatch(cssRule(css, ".state-strip-grid"), /position:\s*absolute/);
  assert.doesNotMatch(cssRule(css, ".state-strip-grid"), /position:\s*fixed/);
  assert.doesNotMatch(cssRule(css, ".table-state-strip[data-expanded=\"true\"] .state-strip-grid"), /position:\s*absolute/);
  assert.doesNotMatch(cssRule(css, ".table-state-strip[data-expanded=\"true\"] .state-strip-grid"), /position:\s*fixed/);
  assert.doesNotMatch(css, /\.table-state-strip:hover \.state-strip-grid/);
  assert.doesNotMatch(css, /\.table-state-strip:focus-within \.state-strip-grid/);
  assert.match(css, /\.party-status-bar\s*\{[\s\S]*height: 86px;[\s\S]*min-height: 86px;[\s\S]*overflow-x: auto;[\s\S]*overflow-y: hidden/);
  assert.match(css, /\.party-status-bar\s*\{[\s\S]*scroll-snap-type: x proximity/);
  assert.match(css, /\.party-status-card,[\s\S]*\.party-status-empty\s*\{[\s\S]*flex: 0 0 clamp\(224px, 23vw, 286px\);[\s\S]*grid-template-columns: 38px minmax\(0, 1fr\);[\s\S]*height: 82px/);
  assert.match(css, /\.party-status-card\.active::after\s*\{[\s\S]*height: 2px;[\s\S]*background: linear-gradient\(90deg, rgba\(236, 210, 143, 0\.2\), #ecd28f, rgba\(236, 210, 143, 0\.2\)\)/);
  assert.match(css, /\.party-status-tag\[data-party-tag="round"\]\s*\{[\s\S]*#ecd28f/);
  assert.match(css, /\.party-status-copy strong,[\s\S]*\.party-status-copy span\s*\{[\s\S]*overflow: hidden;[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.transcript\s*\{[\s\S]*gap: 12px;[\s\S]*padding: 14px;[\s\S]*overflow: auto/);
  assert.match(css, /\.message\s*\{[\s\S]*gap: 5px;[\s\S]*padding: 11px 12px;[\s\S]*border-radius: 8px/);
  assert.match(css, /\.state-summary-card:first-child\s*\{[\s\S]*grid-column: 1 \/ -1/);
  assert.match(app, /turnDock: document\.querySelector\("#turnDock"\)/);
  assert.match(app, /roundDock: document\.querySelector\("#roundDock"\)/);
  assert.match(app, /encounterDock: document\.querySelector\("#encounterDock"\)/);
  assert.match(app, /syncDock: document\.querySelector\("#syncDock"\)/);
  assert.match(app, /els\.turnDock\.textContent = els\.turnBadge\.textContent/);
  assert.match(app, /els\.syncDock\.textContent = t\(uiLanguage, key\)/);
  assert.match(css, /\.table\s*\{[\s\S]*grid-template-rows: auto auto 86px minmax\(0, 1fr\)/);
  assert.match(css, /\.topbar-actions \[data-action-priority="primary"\]\s*\{[\s\S]*order: 0/);
  assert.match(css, /\.setup-primary-actions\s*\{[\s\S]*display: flex/);
  assert.match(css, /\.table-state-strip\s*\{[\s\S]*height: auto;[\s\S]*overflow: hidden/);
  assert.match(css, /\.state-strip-toggle\s*\{[\s\S]*grid-template-columns: auto minmax\(0, 1fr\) minmax\(170px, auto\) 12px/);
  assert.match(css, /\.state-strip-grid\s*\{[\s\S]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)[\s\S]*max-height: 0;[\s\S]*visibility: hidden/);
  assert.match(css, /\.table-state-strip\[data-expanded="true"\] \.state-strip-grid\s*\{[\s\S]*opacity: 1;[\s\S]*pointer-events: auto/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1120px\)[\s\S]*\.topbar-actions\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.table\s*\{[\s\S]*grid-template-rows: auto auto 94px minmax\(104px, 15dvh\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.action-form input,[\s\S]*\.action-form select,[\s\S]*\.action-form button\s*\{[\s\S]*grid-column: auto/);
  assert.match(css, /\.state-strip-grid strong\s*\{[\s\S]*display: block;[\s\S]*max-width: 100%;[\s\S]*text-overflow: ellipsis/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.table-state-strip\[data-expanded="true"\] \.state-strip-grid\s*\{[\s\S]*max-height: min\(136px, calc\(100dvh - 196px\)\);[\s\S]*padding: 6px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.state-strip-grid strong\s*\{[\s\S]*display: -webkit-box;[\s\S]*min-height: 1\.15em;[\s\S]*line-height: 1\.15;[\s\S]*white-space: normal;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.party-status-bar\s*\{[\s\S]*height: 86px;[\s\S]*overflow-y: hidden/);
  assert.match(css, /\.party-status-card,[\s\S]*\.party-status-empty\s*\{[\s\S]*flex: 0 0 clamp\(224px, 23vw, 286px\)[\s\S]*height: 82px/);
  assert.match(css, /\.party-status-card \.vital-meter-head\s*\{[\s\S]*display: flex/);
  assert.match(css, /\.transcript-panel\[data-log-density="dense"\] > \.transcript\s*\{[\s\S]*gap: 6px;[\s\S]*padding: 8px 10px/);
  assert.match(css, /\.transcript-panel\[data-log-density="summary"\] > \.transcript\s*\{[\s\S]*gap: 4px;[\s\S]*padding: 7px 9px/);
  assert.match(css, /\.transcript\[data-log-density="summary"\] \.message\s*\{[\s\S]*position: relative;[\s\S]*min-height: 34px/);
  assert.match(css, /\.transcript\[data-log-density="dense"\] \.message p\s*\{[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.log-timeline-marker\s*\{[\s\S]*grid-column: 1 \/ -1;[\s\S]*text-transform: uppercase/);
  assert.match(css, /details\.message-detail\s*\{[\s\S]*cursor: pointer/);
  assert.match(css, /\.transcript\[data-log-density="summary"\] \.message-detail\s*\{[\s\S]*position: absolute;[\s\S]*width: 20px;[\s\S]*height: 20px/);
  assert.match(css, /\.message-detail summary\s*\{[\s\S]*text-overflow: ellipsis;[\s\S]*white-space: nowrap/);
  assert.match(css, /\.log-kind\s*\{[\s\S]*border-radius: 999px/);
  assert.match(css, /\.message-detail\s*\{[\s\S]*font: 700 0\.68rem ui-monospace/);
  assert.match(css, /\.log-drawer\s*\{[\s\S]*width: min\(640px, calc\(100vw - 28px\)\)/);
  assert.match(css, /\.log-toolbar\s*\{[\s\S]*display: grid;[\s\S]*border-bottom: 1px solid rgba\(241, 231, 208, 0\.1\)/);
  assert.match(css, /\.log-filter-row\s*\{[\s\S]*grid-template-columns: minmax\(132px, 1fr\) auto auto/);
  assert.match(css, /\.log-filter-toggle\[aria-pressed="true"\]\s*\{[\s\S]*rgba\(197, 161, 76, 0\.16\)/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message\s*\{[\s\S]*grid-template-columns: minmax\(108px, 0\.25fr\) minmax\(0, 1fr\);[\s\S]*padding: 6px 8px/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message:has\(\.message-asset\)\s*\{[\s\S]*grid-template-columns: 34px minmax\(108px, 0\.25fr\) minmax\(0, 1fr\);[\s\S]*min-height: auto/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message:has\(\.message-asset\) \.meta\s*\{[\s\S]*grid-column: 2;[\s\S]*grid-row: 1/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message:has\(\.message-asset\):has\(\.log-timeline-marker\) \.meta\s*\{[\s\S]*grid-row: 2/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message:has\(\.message-asset\) p,[\s\S]*\.full-transcript\[data-log-density="summary"\] \.message:has\(\.message-asset\) \.message-body-detail\s*\{[\s\S]*grid-column: 3;[\s\S]*grid-row: 2/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message \.meta\s*\{[\s\S]*display: grid;[\s\S]*white-space: normal/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message \.meta > span:not\(\.log-kind\):not\(\.channel-badge\)\s*\{[\s\S]*overflow-wrap: anywhere/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message p,[\s\S]*\.full-transcript\[data-log-density="summary"\] \.message-body-detail\s*\{[\s\S]*display: -webkit-box;[\s\S]*max-height: 2\.84em;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.message-body-detail\[open\]\s*\{[\s\S]*display: block;[\s\S]*max-height: none;[\s\S]*-webkit-line-clamp: unset/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message-detail\s*\{[\s\S]*position: static;[\s\S]*grid-column: 1 \/ -1;[\s\S]*height: auto/);
  assert.match(css, /\.full-transcript\[data-log-density="summary"\] \.message-detail summary\s*\{[\s\S]*font-size: 0\.58rem;[\s\S]*white-space: normal/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.full-transcript\[data-log-density="summary"\] \.message \.meta\s*\{[\s\S]*flex-wrap: wrap;[\s\S]*white-space: normal/);
  assert.match(css, /\.scene-ambience-overlay\s*\{[\s\S]*animation: scene-breathe 8s ease-in-out infinite/);
  assert.match(css, /\.scene-backdrop\s*\{[\s\S]*animation: scene-idle-pan var\(--scene-motion-duration, 18s\) ease-in-out infinite alternate/);
  assert.doesNotMatch(
    css,
    /url\(\s*["']?\/?assets\/generated\/[^"')]+\.(?:png|jpe?g|webp)["']?\s*\)/i,
    "styles.css must not directly request generated raster payloads in a clean checkout"
  );
  assert.match(app, /els\.sceneBackdrop\.style\.setProperty\("--scene-motion-duration"/);
  assert.match(css, /\.stage\[data-scene-pulse="true"\] \.scene-ambience-overlay\s*\{[\s\S]*scene-pulse/);
  assert.match(css, /\.stage\[data-scene-rain="heavy"\] \.scene-ambience-overlay::before,[\s\S]*\.stage\[data-scene-overlay~="heavy-rain"\] \.scene-ambience-overlay::before,[\s\S]*\.stage\[data-scene-rain="light"\] \.scene-ambience-overlay::before,[\s\S]*\.stage\[data-scene-overlay~="light-rain"\] \.scene-ambience-overlay::before\s*\{[\s\S]*scene-rain-sheet/);
  assert.match(css, /\.stage\[data-scene-wind="gale"\] \.scene-backdrop,[\s\S]*\.stage\[data-scene-motion~="dry-leaves"\] \.scene-backdrop\s*\{[\s\S]*scene-drift/);
  assert.match(css, /\.stage\[data-scene-thunder="close"\] \.scene-ambience-overlay::after,[\s\S]*\.stage\[data-scene-motion~="lightning-flash"\] \.scene-ambience-overlay::after\s*\{[\s\S]*scene-lightning/);
  assert.match(css, /\.stage\[data-scene-overlay~="mist"\] \.scene-ambience-overlay::before,[\s\S]*\.stage\[data-scene-overlay~="spray-mist"\] \.scene-ambience-overlay::before\s*\{[\s\S]*scene-mist-drift/);
  assert.match(css, /\.scene-visual-meta\s*\{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap/);
  assert.match(css, /\.scene-change-summary\s*\{[\s\S]*position: absolute;[\s\S]*top: 14px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.inventory-actions\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.state-strip-grid\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.market-card \.market-card-meta\s*\{[\s\S]*grid-template-columns: 1fr;[\s\S]*max-height: 32px/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1120px\)[\s\S]*\.topbar-actions\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(min-width: 681px\) and \(max-width: 1120px\)[\s\S]*\.topbar-actions button,[\s\S]*\.topbar-actions \.status-pill\s*\{[\s\S]*min-height: 34px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.transcript-panel > \.panel-head \.panel-head-actions\s*\{[\s\S]*display: grid;[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.scene-change-summary\s*\{[\s\S]*max-height: 64px;[\s\S]*overflow: hidden/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.party-status-card,[\s\S]*\.party-status-empty\s*\{[\s\S]*flex-basis: min\(204px, 78vw\);[\s\S]*height: 90px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-card,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-empty\s*\{[\s\S]*flex-basis: min\(204px, 78vw\);[\s\S]*height: 90px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.scene-visual-meta span\s*\{[\s\S]*max-width: 86px;[\s\S]*padding-inline: 5px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.scene-visual-meta span:nth-child\(n\+5\)\s*\{[\s\S]*display: none/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.action-form,[\s\S]*\.action-form\.chat-mode\s*\{[\s\S]*grid-template-columns: 68px 72px minmax\(0, 1fr\) minmax\(54px, 0\.22fr\)/);
  assert.match(css, /@media \(max-height: 760px\) and \(min-width: 1121px\)[\s\S]*\.table\s*\{[\s\S]*grid-template-rows: auto auto 72px minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-height: 760px\) and \(min-width: 1121px\)[\s\S]*\.party-status-bar\s*\{[\s\S]*height: 72px;[\s\S]*min-height: 72px/);
  assert.match(css, /@media \(max-height: 760px\) and \(min-width: 1121px\)[\s\S]*\.transcript-panel\s*\{[\s\S]*--transcript-readable-min: 72px/);
  assert.match(css, /@media \(max-width: 430px\) and \(max-height: 700px\)[\s\S]*\.table\s*\{[\s\S]*grid-template-rows: auto auto 68px minmax\(96px, 14dvh\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 430px\) and \(max-height: 700px\)[\s\S]*\.party-status-card,[\s\S]*\.party-status-empty,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-card,[\s\S]*\.party-status-bar\[data-party-size="crowded"\] \.party-status-empty\s*\{[\s\S]*height: 64px;[\s\S]*min-height: 64px/);

  assert.match(html, /data-drawer="party"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer="state"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer="log"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(html, /data-drawer="market"[^>]+aria-hidden="true"[^>]+inert/);
  assert.match(css, /\.drawer-panel\s*\{[\s\S]*opacity: 0;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden;/);
  assert.match(css, /\.drawer-panel\.open\s*\{[\s\S]*opacity: 1;[\s\S]*pointer-events: auto;[\s\S]*visibility: visible;/);
  assert.match(app, /panel\.classList\.toggle\("open", active\)/);
  assert.match(app, /panel\.inert = !active/);
  assert.match(app, /panel\.inert = true/);

  assert.match(html, /<div class="reward-toast hidden" id="rewardToast"[^>]+aria-hidden="true"/);
  assert.match(html, /id="rewardToastExpand"[^>]+data-i18n="reward\.expand"/);
  assert.match(app, /shownRewardEventIds/);
  assert.match(app, /const REWARD_TOAST_DURATION_MS = 3800/);
  assert.match(app, /els\.rewardToastExpand\?\.addEventListener\("click"[\s\S]*els\.rewardPanel\.open = true[\s\S]*openDrawer\("state", els\.rewardToastExpand\)/);
  assert.match(app, /els\.rewardToast\.classList\.remove\("hidden"\)/);
  assert.match(app, /els\.rewardToast\.setAttribute\("aria-hidden", "false"\)/);
  assert.match(app, /rewardToastTimer = window\.setTimeout\(closeRewardToast, REWARD_TOAST_DURATION_MS\)/);
  assert.match(app, /els\.rewardToast\.classList\.add\("hidden"\)/);
  assert.match(app, /els\.rewardToast\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(app, /function openDrawer\(name, opener = document\.activeElement\)[\s\S]*closeRewardToast\(\);[\s\S]*closeDrawers\(\{ restoreFocus: false \}\)/);
  assert.match(app, /function showRewardToast\(entry\)[\s\S]*document\.body\.classList\.contains\("drawer-open"\)[\s\S]*closeRewardToast\(\);[\s\S]*return;/);
  assert.match(app, /let replayBuildRequestId = 0/);
  assert.match(app, /const REPLAY_REQUEST_TIMEOUT_MS = 10000/);
  assert.match(app, /els\.replayButton\.addEventListener\("click", async \(\) => \{[\s\S]*const requestId = \+\+replayBuildRequestId;[\s\S]*const roomId = room\.id;[\s\S]*closeRewardToast\(\);[\s\S]*dataset\.replayState = "building"[\s\S]*withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/replay`, \{ timeoutMs: REPLAY_REQUEST_TIMEOUT_MS \}\)\)[\s\S]*renderReplay\(result\.replay\)[\s\S]*dataset\.replayState = "error"/);
  assert.match(app, /function connectEvents\(roomId\)[\s\S]*if \(realtimePauseDepth > 0\)[\s\S]*pendingRealtimeRoomId = roomId[\s\S]*eventSource = new EventSource\(`\/api\/rooms\/\$\{roomId\}\/events`\)[\s\S]*eventSourceGeneration/);
  assert.match(app, /function closeRealtimeSource\(\)[\s\S]*eventSource\.close\(\);[\s\S]*eventSource = null;[\s\S]*eventSourceRoomId = "";[\s\S]*eventSourceGeneration \+= 1;/);
  assert.match(app, /async function withRealtimePaused\(task\)[\s\S]*realtimePauseDepth \+= 1;[\s\S]*closeRealtimeSource\(\);[\s\S]*return await task\(\);[\s\S]*realtimePauseDepth = Math\.max\(0, realtimePauseDepth - 1\);[\s\S]*connectEvents\(nextRoomId\)/);
  assert.match(app, /async function refreshMarket\(\{ clearFeedback = false \} = \{\}\)[\s\S]*const requestId = \+\+marketRefreshRequestId;[\s\S]*withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/market`, \{ timeoutMs: MARKET_REQUEST_TIMEOUT_MS \}\)\)/);
  assert.match(app, /async function api\(path, options = \{\}\)[\s\S]*AbortController[\s\S]*window\.clearTimeout\(timeout\)/);
  assert.match(css, /\.hidden\s*\{[\s\S]*display: none !important;[\s\S]*\}/);
  assert.match(css, /\.reward-toast\s*\{[\s\S]*position: fixed;[\s\S]*bottom: calc\(18px \+ env\(safe-area-inset-bottom\)\);[\s\S]*z-index: 34;/);
  assert.match(css, /\.reward-toast\s*\{[\s\S]*grid-template-columns: 72px minmax\(0, 1fr\);[\s\S]*padding: 10px 52px 10px 10px/);
  assert.match(css, /\.reward-toast h2\s*\{[\s\S]*display: -webkit-box;[\s\S]*overflow: hidden;[\s\S]*-webkit-line-clamp: 2/);
  assert.match(css, /\.reward-toast-close\s*\{[\s\S]*width: 32px;[\s\S]*min-width: 32px;[\s\S]*height: 32px;[\s\S]*min-height: 32px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.reward-toast\s*\{[\s\S]*top: calc\(306px \+ env\(safe-area-inset-top\)\);[\s\S]*bottom: auto/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.reward-toast\s*\{[\s\S]*width: min\(316px, calc\(100vw - 56px\)\);[\s\S]*min-height: 64px;[\s\S]*padding: 8px 44px 8px 8px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.reward-toast-close\s*\{[\s\S]*width: 30px;[\s\S]*min-width: 30px;[\s\S]*height: 30px;[\s\S]*min-height: 30px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.reward-toast\s*\{[\s\S]*width: min\(292px, calc\(100vw - 52px\)\);[\s\S]*min-height: 56px;[\s\S]*padding: 7px 40px 7px 7px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.reward-toast h2\s*\{[\s\S]*-webkit-line-clamp: 1/);
  assert.match(css, /\.drawer-panel\s*\{[\s\S]*z-index: 28;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden;/);
  assert.match(css, /\.drawer-panel\.open\s*\{[\s\S]*pointer-events: auto;[\s\S]*visibility: visible;/);
  assert.match(css, /\.drawer-scrim\s*\{[\s\S]*z-index: 27;/);
  assert.match(css, /body\.drawer-open \.reward-toast\s*\{[\s\S]*opacity: 0;[\s\S]*pointer-events: none;[\s\S]*visibility: hidden;[\s\S]*display: none !important;/);
  assert.match(css, /body\.table-active:not\(\.drawer-open\) \.reward-toast\s*\{[\s\S]*bottom: calc\(156px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(css, /body\.table-active:not\(\.drawer-open\) \.transcript-panel > \.transcript\s*\{[\s\S]*padding-bottom: 14px;[\s\S]*scroll-padding-bottom: 156px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*body\.table-active:not\(\.drawer-open\) \.transcript-panel > \.transcript\s*\{[\s\S]*padding-bottom: 8px;[\s\S]*scroll-padding-bottom: 104px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*body\.table-active:not\(\.drawer-open\) \.reward-toast\s*\{[\s\S]*top: calc\(306px \+ env\(safe-area-inset-top\)\);[\s\S]*right: 8px;[\s\S]*bottom: auto;[\s\S]*left: auto;[\s\S]*width: min\(316px, calc\(100vw - 56px\)\);[\s\S]*min-height: 64px;[\s\S]*padding: 8px 44px 8px 8px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*body\.table-active:not\(\.drawer-open\) \.transcript-panel > \.transcript\s*\{[\s\S]*padding-bottom: 7px;[\s\S]*scroll-padding-bottom: 94px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*body\.table-active:not\(\.drawer-open\) \.reward-toast\s*\{[\s\S]*top: calc\(270px \+ env\(safe-area-inset-top\)\);[\s\S]*right: 6px;[\s\S]*bottom: auto;[\s\S]*left: auto;[\s\S]*width: min\(292px, calc\(100vw - 52px\)\);[\s\S]*min-height: 56px;[\s\S]*padding: 7px 40px 7px 7px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.topbar-actions button\s*\{[\s\S]*overflow-wrap: anywhere;[\s\S]*text-overflow: clip;[\s\S]*white-space: normal;/);
});
