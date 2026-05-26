import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { assetBinaryDelivery } from "../src/core/assets.js";

test("0013 authenticated browser contract keeps account login and room-seat identity after refresh", async () => {
  const [html, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8")
  ]);

  assert.match(html, /id="authForm"[\s\S]*name="email"[\s\S]*name="password"[\s\S]*id="authSubmitButton"/);
  assert.match(html, /id="authStatusText"[^>]+data-auth-state="guest"/);
  assert.match(html, /id="tableAuthStatus"[^>]+data-auth-state="guest"/);

  assert.match(app, /const AUTH_SESSION_KEY = "aidm\.authSessionToken"/);
  assert.match(app, /const CURRENT_USER_KEY = "aidm\.currentUser"/);
  assert.match(app, /let authSessionToken = localStorage\.getItem\(AUTH_SESSION_KEY\) \|\| ""/);
  assert.match(app, /let currentUser = readStoredCurrentUser\(\)/);
  assert.match(app, /function readStoredCurrentUser\(\)[\s\S]*JSON\.parse\(localStorage\.getItem\(CURRENT_USER_KEY\) \|\| "null"\)/);
  assert.match(app, /async function submitAuthForm\(event\) \{[\s\S]*event\.preventDefault\(\)[\s\S]*const body = \{ email, password \}[\s\S]*body\.displayName = String\(form\.get\("displayName"\) \|\| ""\)\.trim\(\)[\s\S]*auth: false[\s\S]*saveAuthSession\(result\)/);
  assert.match(app, /function saveAuthSession\(result = \{\}\)[\s\S]*localStorage\.setItem\(AUTH_SESSION_KEY, authSessionToken\)[\s\S]*localStorage\.setItem\(CURRENT_USER_KEY, JSON\.stringify\(currentUser\)\)/);
  assert.match(app, /async function restoreAuthSession\(\)[\s\S]*api\("\/api\/auth\/session"\)[\s\S]*saveAuthSession\(\{ user: result\.user, session: \{ sessionToken: authSessionToken \} \}\)/);
  assert.match(app, /function clearAuthSession\([\s\S]*localStorage\.removeItem\(AUTH_SESSION_KEY\)[\s\S]*localStorage\.removeItem\(CURRENT_USER_KEY\)/);
  assert.match(app, /async function logoutCurrentUser\(\)[\s\S]*api\("\/api\/auth\/logout", \{[\s\S]*method: "POST"[\s\S]*body: \{ sessionToken: token \}/);

  assert.match(app, /async function api\(path, options = \{\}\)[\s\S]*headers\.Authorization = `Bearer \$\{authSessionToken\}`/);
  assert.match(app, /if \(options\.auth !== false && authSessionToken && !headers\.Authorization && !headers\.authorization\)/);
  assert.match(app, /response = await fetch\(path, \{[\s\S]*headers,[\s\S]*body: options\.body \? JSON\.stringify\(options\.body\) : undefined/);

  assert.match(app, /const ROOM_SESSION_PREFIX = "aidm\.rooms\."/);
  assert.match(app, /function roomPlayerIdKey\(roomId\)[\s\S]*`\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.playerId`/);
  assert.match(app, /function roomPlayerTokenKey\(roomId\)[\s\S]*`\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.playerToken`/);
  assert.match(app, /function saveRoomPlayerSession\(roomId, nextPlayerId, nextPlayerToken\)[\s\S]*localStorage\.setItem\(roomPlayerIdKey\(roomId\), nextPlayerId\)[\s\S]*localStorage\.setItem\(roomPlayerTokenKey\(roomId\), nextPlayerToken\)/);
  assert.match(app, /function restoreRoomPlayerSession\(nextRoom\)[\s\S]*const storedPlayerId = localStorage\.getItem\(roomPlayerIdKey\(nextRoom\.id\)\) \|\| ""[\s\S]*const storedPlayerToken = localStorage\.getItem\(roomPlayerTokenKey\(nextRoom\.id\)\) \|\| ""[\s\S]*playerId = storedPlayerId;[\s\S]*playerToken = storedPlayerToken/);
  assert.match(app, /openRoom\(nextRoom\)[\s\S]*restoreRoomHostSession\(nextRoom\);[\s\S]*restoreRoomPlayerSession\(nextRoom\);[\s\S]*room = nextRoom/);
});

test("0013 approval-gated rooms keep pending users out of player-only drawers until host approval", async () => {
  const [html, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8")
  ]);
  const settingsMarkup = html.match(/<aside class="panel settings-panel[\s\S]*?<aside class="panel log-panel/)?.[0] || "";

  assert.match(html, /id="createAccessMode"[\s\S]*value="host-approval"[^>]+data-i18n="access\.hostApproval"/);
  assert.match(html, /id="joinRoomPasswordField"[\s\S]*name="roomPassword"/);
  assert.match(settingsMarkup, /id="hostAccessSection"[\s\S]*id="pendingPlayersList"/);

  assert.match(app, /if \(result\.pendingPlayer\) \{[\s\S]*pendingPlayerId = result\.session\?\.pendingPlayerId \|\| result\.pendingPlayer\.id[\s\S]*pendingPlayerToken = result\.session\?\.playerToken \|\| ""[\s\S]*saveRoomPendingSession\(room\.id, pendingPlayerId, pendingPlayerToken\)[\s\S]*showJoinStatus\("join\.pending"\)[\s\S]*return;/);
  assert.match(app, /openRoom\(roomWithPendingPlayer\(result\.room, result\.pendingPlayer\)\)/);
  assert.match(app, /function roomPendingPlayerIdKey\(roomId\)[\s\S]*`\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.pendingPlayerId`/);
  assert.match(app, /function roomPendingPlayerTokenKey\(roomId\)[\s\S]*`\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.pendingPlayerToken`/);
  assert.match(app, /function saveRoomPendingSession\(roomId, nextPendingPlayerId, nextPendingPlayerToken\)[\s\S]*localStorage\.setItem\(roomPendingPlayerIdKey\(roomId\), pendingPlayerId\)[\s\S]*localStorage\.setItem\(roomPendingPlayerTokenKey\(roomId\), pendingPlayerToken\)/);
  assert.match(app, /function attachRoomAccessHeaders\(path, headers\)[\s\S]*storedPendingPlayerId[\s\S]*storedPendingPlayerToken[\s\S]*accessPlayerId[\s\S]*accessPlayerToken/);
  assert.match(app, /function normalizeClientRoom\(nextRoom = \{\}\)[\s\S]*protectedLobby = Boolean\(access\.passwordProtected \|\| access\.hostApprovalRequired\) && !Array\.isArray\(nextRoom\.players\)[\s\S]*protectedLobbyScene\(access\)[\s\S]*_clientProtectedLobby: protectedLobby/);
  assert.match(app, /const pending = \(nextRoom\.pendingPlayers \|\| \[\]\)\.find\(\(entry\) => entry\.id === storedPendingPlayerId\)[\s\S]*pending\?\.status === "pending"[\s\S]*playerId = "";[\s\S]*playerToken = "";/);
  assert.match(app, /if \(nextRoom\._clientProtectedLobby\) \{[\s\S]*storedPendingPlayerId && storedPendingPlayerToken[\s\S]*pendingPlayerId = storedPendingPlayerId[\s\S]*storedPlayerId && storedPlayerToken[\s\S]*playerId = storedPlayerId/);
  assert.match(app, /function getLocalPendingPlayer\(nextRoom = room\)[\s\S]*getStoredPendingSession\(nextRoom\.id\)[\s\S]*isProtectedMinimalRoom\(nextRoom\)[\s\S]*status: "pending"/);
  assert.match(app, /storedPendingPlayerId && nextRoom\.players\?\.some\(\(player\) => player\.id === storedPendingPlayerId\)[\s\S]*saveRoomPlayerSession\(nextRoom\.id, playerId, playerToken\)[\s\S]*clearRoomPendingSession\(nextRoom\.id\)/);
  assert.match(app, /function syncRoomAccessControls\(showSetup = !hasLocalPlayerBinding\(\)\)[\s\S]*const rejectedHere = Boolean\(rejectedAccessNotice\?\.roomId && rejectedAccessNotice\.roomId === room\?\.id\)[\s\S]*dataset\.accessState = rejectedHere[\s\S]*\? "approval-rejected"[\s\S]*: pending\?\.status === "pending"[\s\S]*submitButton\.disabled = Boolean\(pending\?\.status === "pending"\)[\s\S]*button\.pendingApproval[\s\S]*join\.approvalRequired/);
  assert.match(app, /function syncPendingAccessRefresh\(\)[\s\S]*needsProtectedAccessRefresh\(\)[\s\S]*window\.setTimeout\(async \(\) => \{[\s\S]*openRoom\(result\.room\)/);

  assert.match(app, /function hasLocalPlayerBinding\(\)[\s\S]*Boolean\(room && getLocalPlayer\(\) && playerId && playerToken\)/);
  assert.match(app, /els\.myCharacterButton\.disabled = !hasPlayerBinding/);
  assert.match(app, /function syncPlayerToolButtonStates\(hasPlayerBinding = hasLocalPlayerBinding\(\)\)[\s\S]*market\.feedback\.noLocal[\s\S]*els\.marketButton\.disabled = !hasPlayerBinding[\s\S]*aria-label/);
  assert.match(app, /function currentActionTurnState\(\)[\s\S]*pending\?\.status === "pending"[\s\S]*owner: "pending"[\s\S]*owner: "no-local"/);
  assert.match(app, /function currentActionGuidanceState\(isChat = false\)[\s\S]*state\.owner === "pending" \? "action\.hint\.pending"[\s\S]*submitErrorKey: state\.owner === "pending" \? "action\.pendingSubmitError"/);
  assert.match(app, /modeSelect\.disabled = isChat \|\| !canSubmit/);
  assert.match(app, /channelSelect\.disabled = !isChat \|\| !canSubmit/);
  assert.match(app, /submitButton\.disabled = !canSubmit/);
  assert.match(app, /const localPlayer = getLocalPlayer\(\);[\s\S]*if \(!room \|\| !localPlayer \|\| !playerId \|\| !playerToken\) \{[\s\S]*action\.noPlayerSubmitError/);

  assert.match(app, /function canManageRoom\(nextRoom = room\)[\s\S]*ownerUserId === currentUser\.id[\s\S]*hostToken[\s\S]*roomHostTokenKey\(nextRoom\.id\)/);
  assert.match(app, /function renderHostAccessControls\(\)[\s\S]*const pending = \(room\.pendingPlayers \|\| \[\]\)\.filter\(\(entry\) => entry\.status === "pending"\)[\s\S]*data-pending-action="approve"[\s\S]*data-pending-action="reject"/);
  assert.match(app, /els\.pendingPlayersList\?\.addEventListener\("click", async \(event\) => \{[\s\S]*const decision = button\.dataset\.pendingAction[\s\S]*api\(`\/api\/rooms\/\$\{room\.id\}\/pending\/\$\{encodeURIComponent\(pendingId\)\}\/\$\{decision\}`/);
});

test("player table does not expose asset-management or director controls", async () => {
  const [html, app, i18n] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8"),
    readFile("public/i18n.js", "utf8")
  ]);
  const publicSurface = `${html}\n${app}\n${i18n}`;
  const topbarMarkup = html.match(/<div class="topbar-actions">[\s\S]*?<\/div>\s*<\/header>/)?.[0] || "";
  const settingsMarkup = html.match(/<aside class="panel settings-panel[\s\S]*?<aside class="panel log-panel/)?.[0] || "";

  assert.doesNotMatch(publicSurface, /id="assetGrid"|id="assetSearch"|id="assetCategoryFilter"|id="assetShowAll"|id="assetDetail"/);
  assert.doesNotMatch(publicSurface, /asset-library|asset-grid|asset-tools|Asset Library|资产库/);
  assert.doesNotMatch(publicSurface, /assets\/generated\/manifest\.json|generated\/manifest\.json/);
  assert.doesNotMatch(publicSurface, /\brasterAssets\b|\bgeneratedSheets\b|\bcatalog-internal\b/);
  assert.doesNotMatch(publicSurface, /data-drawer-open="gm"|data-drawer="gm"|gm-drawer/);
  assert.doesNotMatch(publicSurface, /panel\.director|Director|导演推进/);
  assert.doesNotMatch(publicSurface, /guide\.tab\.evaluation|guide\.eval|Memory Evaluation|记忆评测/);
  assert.doesNotMatch(publicSurface, /admin-panel|admin-drawer|data-admin|后台|管理后台/);
  assert.doesNotMatch(publicSurface, /\/api\/admin|\/api\/assets|\/api\/director/);

  assert.match(html, /data-drawer-open="state"/);
  assert.match(html, /data-drawer-open="character"/);
  assert.match(html, /data-drawer-open="market"/);
  assert.match(html, /data-drawer-open="settings"/);
  assert.match(html, /id="partyStatusBar"/);
  assert.match(html, /id="turnFocus" class="turn-focus"[^>]+data-turn-owner="no-active"[\s\S]*id="turnFocusLabel"[\s\S]*id="turnFocusContext"/);
  assert.match(html, /id="inventoryList"/);
  assert.match(html, /id="marketList"/);
  assert.match(html, /id="playerSummaryDock"/);
  assert.match(html, /id="tableStateToggle"[^>]+aria-expanded="false"[^>]+aria-controls="tableStateDetails"/);
  assert.match(html, /id="audioStatusDock"/);
  assert.match(html, /id="starterSpellCards"/);
  assert.match(html, /id="dicePanel"/);
  assert.match(html, /id="logDensityToggle"[^>]+data-density-mode="summary"/);
  assert.match(html, /class="scene-ambience-overlay"[\s\S]*id="sceneChangeSummary"[\s\S]*id="sceneVisualMeta"/);
  assert.match(html, /name="channel"/);
  assert.match(html, /id="rewardToast"/);
  assert.match(html, /id="rewardToastExpand"[^>]+data-i18n="reward\.expand"/);
  assert.match(html, /id="actionModeHint"[^>]+data-i18n="action\.hint\.action"/);
  assert.doesNotMatch(topbarMarkup, /id="voiceToggle"|id="voiceSelect"|id="voiceRate"|id="voicePitch"|id="ambienceToggle"|id="ambienceMaster"|id="ambienceMusic"|id="ambienceEnvironment"/);
  assert.doesNotMatch(topbarMarkup, /id="marketButton"|id="tableGuideButton"/);
  assert.match(settingsMarkup, /id="playerMenuSection"[\s\S]*id="marketButton"[\s\S]*id="tableGuideButton"/);
  assert.match(settingsMarkup, /id="voiceToggle"[\s\S]*id="voiceSelect"[\s\S]*id="voiceRate"[\s\S]*id="voicePitch"/);
  assert.match(settingsMarkup, /id="ambienceToggle"[\s\S]*id="ambienceMaster"[\s\S]*id="ambienceMusic"[\s\S]*id="ambienceEnvironment"/);
  assert.doesNotMatch(settingsMarkup, /id="joinForm"|id="speciesSelect"|id="classSelect"|id="starterSpellCards"/);
  assert.match(settingsMarkup, /class="settings-menu settings-section" id="playerMenuSection"[\s\S]*data-i18n="settings\.playerMenuTitle"/);
  assert.match(settingsMarkup, /class="settings-section settings-language-section"[\s\S]*id="languageSelect"/);
  assert.match(settingsMarkup, /class="voice-toolbar settings-section"[\s\S]*class="voice-toolbar-controls"[\s\S]*id="voiceSelect"/);
  assert.match(app, /room\.presentation\?\.sceneAsset/);
  assert.match(app, /room\?\.soundscape\?\.sceneVisualState/);
  assert.match(app, /els\.stage\.dataset\.sceneVariantKey = variantKey/);
  assert.match(app, /els\.sceneBackdrop\.style\.setProperty\("--scene-pan-x"/);
  assert.match(app, /entry\.type === "reward"/);
  assert.match(app, /items\/use/);
  assert.match(app, /items\/equip/);
  assert.match(app, /market\/buy/);
  assert.match(app, /market\/sell/);
  assert.match(app, /renderMarketDrawer/);
  assert.match(app, /refreshMarket/);
  assert.match(app, /renderPlayerSummaryDock/);
  assert.match(app, /bindTableStateStrip\(\);[\s\S]*bindLogDensityToggle\(\);/);
  assert.match(app, /function syncTableStateSummary\(\)[\s\S]*stateStripHeadline[\s\S]*stateStripMeta/);
  assert.match(app, /const LOG_DENSITY_SEQUENCE = \["summary", "dense", "comfortable"\]/);
  assert.match(app, /const LOG_MOBILE_MAIN_LIMITS = \{[\s\S]*summary: 12,[\s\S]*dense: 9,[\s\S]*comfortable: 6/);
  assert.match(app, /const mainLimit = transcriptMainLimit\(logDensity\)/);
  assert.match(app, /function renderTranscriptEntries\(container, entries, options = \{\}\)[\s\S]*message\.dataset\.logType[\s\S]*message\.dataset\.logGroup[\s\S]*log-timeline-marker[\s\S]*message-detail/);
  assert.match(app, /function transcriptGroupKey\(entry = null\)[\s\S]*structuredLog\?\.turnId[\s\S]*type:\$\{entry\.type \|\| "event"\}/);
  assert.match(app, /function renderStage\(sceneChanged = false\)[\s\S]*data-scene-pulse[\s\S]*renderSceneChangeSummary\(sceneChanged\)/);
  assert.match(app, /layerPlayerMenuControls\(\);[\s\S]*bindGuide\(\);[\s\S]*bindDrawers\(\);/);
  assert.match(app, /function layerPlayerMenuControls\(\)[\s\S]*controls\.append\(button\)/);
  assert.match(app, /const hasPlayerBinding = hasLocalPlayerBinding\(\);[\s\S]*const showPlayerSetup = shouldShowPlayerSetup\(room, hasPlayerBinding\);[\s\S]*const showPlaySurface = shouldShowTablePlaySurface\(room, hasPlayerBinding\);/);
  assert.match(app, /function sceneGuidanceSignature\(nextRoom = room\)[\s\S]*nextRoom\.scene\.location[\s\S]*nextRoom\.scene\.objective/);
  assert.match(app, /function renderTurnFocus\(active, localPlayer, hasPlayerBinding, sceneChanged = false\)[\s\S]*els\.turnFocus\.dataset\.turnOwner = owner[\s\S]*els\.actionForm\.dataset\.turnOwner = owner/);
  assert.match(app, /els\.myCharacterButton\.disabled = !hasPlayerBinding/);
  assert.match(app, /syncPlayerToolButtonStates\(hasPlayerBinding\)/);
  assert.match(app, /els\.transcriptPanel\?\.classList\.toggle\("hidden", !showPlaySurface\)/);
  assert.match(app, /const ROOM_SESSION_PREFIX = "aidm\.rooms\."/);
  assert.match(app, /saveRoomPlayerSession\(room\.id, playerId, playerToken\)/);
  assert.match(app, /function restoreRoomPlayerSession\(nextRoom\)[\s\S]*roomPlayerIdKey\(nextRoom\.id\)[\s\S]*roomPlayerTokenKey\(nextRoom\.id\)/);
  assert.match(app, /restoreRoomPlayerSession\(nextRoom\);[\s\S]*room = nextRoom;/);
  assert.match(app, /hostToken = result\.session\?\.hostToken \|\| ""/);
  assert.match(app, /localStorage\.setItem\("aidm\.hostToken", hostToken\)/);
  assert.match(app, /playerToken = result\.session\?\.playerToken \|\| ""/);
  assert.match(app, /localStorage\.setItem\("aidm\.playerToken", playerToken\)/);
  assert.match(app, /saveRoomPlayerSession\(room\.id, playerId, playerToken\)/);
  assert.match(app, /els\.characterMeta\.textContent = `\$\{localizedSpeciesName\(character\)\} \/ \$\{localizedClassName\(character\)\}`/);
  assert.match(app, /escapeHtml\(localizedSpeciesName\(player\.character\)\)\} \$\{escapeHtml\(localizedClassName\(player\.character\)\)/);
  assert.match(app, /chip\.setAttribute\("aria-label", t\(uiLanguage, "party\.statusAria"/);
  assert.match(app, /const statusLine = t\(uiLanguage, "party\.statusLine", \{ scene: sceneLabel, status: primaryStatus \}\)/);
  assert.match(app, /statusTags = \[[\s\S]*kind: "active"[\s\S]*kind: "you"/);
  assert.match(app, /statusTags\.map\(\(tag\) => `<em class="party-status-tag" data-party-tag="\$\{escapeHtml\(tag\.kind\)\}"/);
  assert.match(app, /option\.textContent = voiceProfileOptionLabel\(profile\)/);
  assert.match(app, /option\.title = voiceProfileOptionTitle\(profile\)/);
  assert.match(app, /function localizedVoiceProfileName\(profile\)[\s\S]*主持人旁白/);
  assert.match(app, /function localizedVoiceRoleLabel\(profile\)[\s\S]*角色声线/);
  assert.match(app, /localizeEncounterState\(room\.combat\?\.state \|\| "scouting"\)/);
  assert.match(app, /els\.encounterState\.textContent = localizeEncounterState\(combat\.state \|\| "scouting"\)/);
  assert.match(app, /syncSceneClockLabels\(\)/);
  assert.match(app, /localizeQuestTitle\(quest\)/);
  assert.match(app, /function formatTranscriptTime\(value\)[\s\S]*Intl\.DateTimeFormat\(locale/);
  assert.match(app, /function localeForLanguage\(language\)[\s\S]*"zh-CN"[\s\S]*"en-US"/);
  assert.match(app, /\/memo/);
});

test("v11 production UI controls stay player-scoped", async () => {
  const [html, app, i18n] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8"),
    readFile("public/i18n.js", "utf8")
  ]);

  assert.match(html, /data-card-select="speciesSelect"[\s\S]*button type="button" class="builder-card active" data-card-value="human"/);
  assert.match(html, /data-card-select="classSelect"[\s\S]*button type="button" class="builder-card active" data-card-value="warrior"/);
  assert.match(html, /class="builder-card-art" src="\/assets\/generated\/options\/aidm-option-01\.png"/);
  assert.match(html, /class="builder-card-art" src="\/assets\/generated\/options\/aidm-option-09\.png"/);
  assert.match(html, /id="starterSpellCards"[^>]+aria-label="初始法术"[^>]+data-i18n-aria-label="field\.startingSpells"/);
  assert.match(html, /id="characterProgressSummary"[\s\S]*id="equipmentSummary"[\s\S]*id="spellList"/);
  assert.match(html, /data-drawer="market"[^>]+aria-hidden="true"[^>]+inert[\s\S]*id="marketWallet"[\s\S]*class="market-note"[\s\S]*id="marketStatus"[\s\S]*id="marketList"/);

  assert.match(app, /function renderStarterSpellCards\(\)[\s\S]*const classId = document\.querySelector\("#classSelect"\)\?\.value \|\| "warrior"/);
  assert.match(app, /const CLASS_RECOMMENDED_ALLOCATIONS = \{[\s\S]*mage: \{ body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 \}/);
  assert.match(app, /function applyRecommendedAttributePreset\(classId\)[\s\S]*CLASS_RECOMMENDED_ALLOCATIONS\[classId\]/);
  assert.match(app, /input\.max = String\(ATTRIBUTE_POINT_BUDGET\.maxSpend\)/);
  assert.match(app, /pointBudget\.ready/);
  assert.match(app, /els\.starterSpellCards\.innerHTML = spells\.map\(\(spell\) => `[\s\S]*<article class="spell-card"[^>]*>/);
  assert.match(app, /const SPELL_ART_FILES = \{[\s\S]*firebolt: "assets\/generated\/spells\/aidm-spell-015-01\.png"[\s\S]*"healing-word": "assets\/generated\/spells\/aidm-spell-015-05\.png"/);
  assert.match(app, /spellArtMarkup\(spell\.id, localizeTextValue\(spell\.label\), "spell-card-art"\)/);
  assert.match(app, /cleric: \[[\s\S]*id: "healing-word"[\s\S]*id: "radiant-bolt"[\s\S]*id: "ward"/);
  assert.doesNotMatch(app, /guarding-strike|shadow-step|silver-tongue|omen-mark|commanding-word|warding-light/);
  assert.match(app, /function renderCharacterProgress\(character\)[\s\S]*els\.characterProgressSummary\.innerHTML = `/);
  assert.match(app, /function renderEquipmentSummary\(inventory, equipmentSummary = null\)[\s\S]*const slots = equipmentSlotSummary\(inventory, equipmentSummary\)/);
  assert.match(app, /function equipmentSlotSummary\(inventory = \[\], equipmentSummary = null\)[\s\S]*slot\.weapon[\s\S]*summarySlot: "mainHand"[\s\S]*slot\.armor[\s\S]*summarySlot: "body"[\s\S]*slot\.offHand[\s\S]*summarySlot: "offHand"[\s\S]*shield\|scroll\|spell\|focus\|holy\|arcane[\s\S]*slot\.kit/);
  assert.match(app, /function renderMarketDrawer\(\)[\s\S]*const player = getLocalPlayer\(\)/);
  assert.match(app, /if \(nextRoom\.players\?\.some\(\(player\) => player\.id === playerId\)\) \{[\s\S]*saveRoomPlayerSession\(nextRoom\.id, playerId, playerToken\)/);
  assert.match(app, /const storedPlayerId = localStorage\.getItem\(roomPlayerIdKey\(nextRoom\.id\)\) \|\| ""/);
  assert.match(app, /playerId = storedPlayerId;[\s\S]*playerToken = storedPlayerToken/);
  assert.match(app, /playerId = "";[\s\S]*playerToken = "";/);
  assert.match(app, /const SPECIES_AVATAR_FILES = \{[\s\S]*human: `\$\{AVATAR_OPTION_BASE\}\/aidm-option-01\.png`/);
  assert.match(app, /const CLASS_AVATAR_FILES = \{[\s\S]*warrior: `\$\{AVATAR_OPTION_BASE\}\/aidm-option-09\.png`[\s\S]*envoy: `\$\{AVATAR_OPTION_BASE\}\/aidm-option-16\.png`/);
  assert.match(app, /function avatarDescriptor\(player\)[\s\S]*CLASS_AVATAR_FILES\[classId\][\s\S]*SPECIES_AVATAR_FILES\[speciesId\]/);
  assert.match(app, /data-avatar-kind="\$\{escapeHtml\(descriptor\.kind\)\}"/);
  assert.match(app, /function vitalMeterMarkup\(kind, value, max, label\)[\s\S]*class="vital-meter \$\{escapeHtml\(kind\)\}"/);
  assert.match(app, /class="roster-vitals"[\s\S]*vitalMeterMarkup\("hp", player\.character\.hp[\s\S]*vitalMeterMarkup\("mp", player\.character\.mana/);
  assert.match(app, /class="roster-stat-row"[\s\S]*"vital\.defense"[\s\S]*"vital\.initiative"/);
  assert.match(app, /let diceLandingTimer = null/);
  assert.match(app, /dataset\.rollState = "rolling"[\s\S]*window\.setTimeout\(\(\) => \{[\s\S]*dataset\.rollState = "landed"/);
  assert.match(app, /class="dice-final-score"[\s\S]*dice\.final/);
  assert.match(app, /const margin = diceMarginLabel\(roll\)/);
  assert.match(app, /function diceMarginLabel\(roll = \{\}\)[\s\S]*"dice\.margin\.success"[\s\S]*"dice\.margin\.failure"/);
  assert.match(app, /function hasLocalPlayerBinding\(\)[\s\S]*Boolean\(room && getLocalPlayer\(\) && playerId && playerToken\)/);
  assert.match(app, /els\.actionForm\.dataset\.intent = isChat \? "chat" : "action"/);
  assert.match(app, /const guidance = currentActionGuidanceState\(isChat\)/);
  assert.match(app, /const canSubmit = guidance\.canSubmit/);
  assert.match(app, /els\.actionForm\.dataset\.actionState = canSubmit \? "ready" : "blocked"/);
  assert.match(app, /els\.actionForm\.dataset\.guidanceOwner = guidance\.owner/);
  assert.match(app, /modeSelect\.disabled = isChat \|\| !canSubmit/);
  assert.match(app, /channelSelect\.disabled = !isChat \|\| !canSubmit/);
  assert.match(app, /textInput\.disabled = !guidance\.canType/);
  assert.match(app, /textInput\.placeholder = t\(uiLanguage, guidance\.placeholderKey, \{ name: guidance\.activeName \}\)/);
  assert.match(app, /submitButton\.disabled = !canSubmit/);
  assert.match(app, /submitButton\.textContent = t\(uiLanguage, guidance\.submitLabelKey, \{ name: guidance\.activeName \}\)/);
  assert.match(app, /els\.actionModeHint\.textContent = t\(uiLanguage, guidance\.hintKey, \{ name: guidance\.activeName \}\)/);
  assert.match(app, /function currentActionGuidanceState\(isChat = false\)[\s\S]*if \(isChat\)[\s\S]*action\.hint\.chatOther[\s\S]*canSubmit: true/);
  assert.match(app, /function currentActionGuidanceState\(isChat = false\)[\s\S]*if \(state\.owner === "local"\)[\s\S]*canSubmit: true[\s\S]*action\.hint\.localTurn/);
  assert.match(app, /function currentActionGuidanceState\(isChat = false\)[\s\S]*canSubmit: false[\s\S]*state\.owner === "other" \? "action\.hint\.otherTurn" : "action\.hint\.noActive"/);
  assert.match(i18n, /"action\.hint\.action": "Action submits a scene move, advances the turn, and may roll dice\."/);
  assert.match(i18n, /"action\.hint\.chat": "Chat posts table talk only; it does not spend a turn or advance the round\."/);
  assert.match(i18n, /"action\.hint\.localTurn": "Your turn is active\./);
  assert.match(i18n, /"action\.hint\.otherTurn": "It is \{name\}'s turn\. Action is locked/);
  assert.match(i18n, /"action\.hint\.pending": "Your join request is pending host approval\./);
  assert.match(i18n, /"action\.noPlayerHint": "Use the browser that joined this room, or join from setup before acting or chatting\."/);
  assert.match(i18n, /"action\.noPlayerSubmit": "Character required"/);
  assert.match(i18n, /"action\.noPlayerSubmitError": "A local character is required\. Use the browser that joined this room, or join from setup before submitting\."/);
  assert.match(i18n, /"action\.formAria\.noPlayer": "No local character selected\. Use the browser that joined this room, or join from setup before acting or chatting\."/);
  assert.match(app, /const actionText = String\(form\.get\("text"\) \|\| ""\)\.trim\(\)/);
  assert.match(app, /const localPlayer = getLocalPlayer\(\);[\s\S]*if \(!room \|\| !localPlayer \|\| !playerId \|\| !playerToken\) \{[\s\S]*action\.noPlayerSubmitError[\s\S]*syncActionModeControls\(\);[\s\S]*return;/);
  assert.match(app, /error\.chatRequired[\s\S]*error\.actionRequired/);
  assert.match(app, /function syncLocalizedCharacterBuilderOptions\(\)[\s\S]*option\.dataset\.archetypeId = id[\s\S]*option\.value = label/);
  assert.match(app, /showJoinStatus\("join\.nameRequired"\)/);
  assert.match(app, /function showJoinStatus\(key, fallback = ""\)/);
  assert.match(app, /function localizedReplayShareText\(replay\)[\s\S]*replayShareText/);
  assert.match(app, /function ensureSetupGuidance\(\)[\s\S]*setupGuidance[\s\S]*syncSetupGuidance\(\)/);
  assert.match(app, /function syncSetupGuidance\(showSetup = !hasLocalPlayerBinding\(\)\)[\s\S]*setup\.guidance\.pending[\s\S]*setup\.guidance\.password[\s\S]*setup\.guidance\.approval[\s\S]*setup\.guidance\.playing[\s\S]*setup\.guidance[\s\S]*setup\.ready[\s\S]*setup\.adjustBudget/);
  assert.match(app, /function ensureAudioStatusDock\(\)[\s\S]*audioStatusDockCard[\s\S]*els\.tableStateStrip\.append\(card\)/);
  assert.match(app, /function syncAudioStatusDock\(\)[\s\S]*soundscapeStatusText\(room\?\.soundscape\)[\s\S]*data-audio-enabled/);
  assert.match(app, /function syncTableStateSummary\(\)[\s\S]*const details = \[round, encounter, sync, audio\][\s\S]*els\.stateStripMeta\.textContent = details/);
  assert.match(app, /function renderSceneChangeSummary\(sceneChanged = false\)[\s\S]*ambience\.sceneStatus[\s\S]*soundscapeStatusText\(soundscape\)/);
  assert.match(app, /function soundscapeStatusText\(soundscape = room\?\.soundscape\)[\s\S]*ambience\.status\.on[\s\S]*ambience\.status\.off/);
  assert.match(app, /function transcriptChannel\(entry\)[\s\S]*entry\.visibility\?\.scope === "faction"[\s\S]*return "public"/);
  assert.match(app, /localizedTranscriptAuthor\(entry\)/);
  assert.match(app, /function localizedTranscriptAuthor\(entry = \{\}\)[\s\S]*speaker\.aidm[\s\S]*speaker\.rules[\s\S]*speaker\.table/);
  assert.doesNotMatch(app, /entry\.author \|\| entry\.type\)\} \/ /);
  assert.match(app, /message\.dataset\.channel = channel/);
  assert.match(app, /function channelBadgeMarkup\(channel\)[\s\S]*data-channel-badge="\$\{escapeHtml\(channel\)\}"/);
  assert.match(app, /if \(!player\) \{[\s\S]*market\.joinPrompt/);
  assert.match(app, /function marketPriceLabel\(offer\)[\s\S]*isCurrentCurrencyLabel\(backendLabel\)/);
  assert.match(app, /function marketPurchaseState\(offer, wallet\)[\s\S]*marketPurchaseReasonCode\(offer, wallet\)[\s\S]*reasonCode: "available"/);
  assert.match(app, /function marketPurchaseReasonCode\(offer, wallet\)[\s\S]*"rule-locked"[\s\S]*"sold-out"[\s\S]*"owned"[\s\S]*"insufficient-funds"[\s\S]*"unavailable"/);
  assert.match(app, /function marketBuyButtonLabel\(definition, purchaseStateOrReason = ""\)[\s\S]*market\.buyAriaDisabled[\s\S]*market\.buyAria/);
  assert.match(app, /itemArtMarkup\(item, definition, "inventory-item-art"\)/);
  assert.match(app, /itemArtMarkup\(item, definition, "inventory-detail-art"\)/);
  assert.match(app, /itemArtMarkup\(offer, definition, "market-item-art"\)/);
  assert.match(app, /inventory\.rarity/);
  assert.match(app, /function inventoryRarityLabel\(item, definition = inventoryDefinition\(item\)\)[\s\S]*item\?\.rarityLabel \|\| definition\?\.rarityLabel/);
  assert.match(app, /inventory\.sellable/);
  assert.match(app, /inventory\.sellValue/);
  assert.match(app, /function isInventoryItemSellable\(item\)[\s\S]*item\?\.tradeable !== false && item\?\.sellable !== false/);
  assert.match(app, /function inventoryActionState\(item, definition = inventoryDefinition\(item\)\)[\s\S]*inventory\.reason\.toolNarrativeUse[\s\S]*inventory\.reason\.toolNotEquipped/);
  assert.match(app, /class="inventory-action-hints" data-inventory-action-hints/);
  assert.match(app, /function inventoryActionButtonLabel\(action, item, definition, state/);
  assert.match(app, /function itemArtFile\(item, definition = \{\}\)[\s\S]*assetRefFile\(item\?\.definition\?\.assetRef\)[\s\S]*assetRefFile\(item\?\.definitionSnapshot\?\.assetRef\)[\s\S]*assetRefFile\(item\?\.generated\)/);
  assert.match(app, /const ITEM_ART_FILES = \{[\s\S]*longsword: "assets\/generated\/items\/aidm-weapon-cutout-024-01\.png"[\s\S]*"moon-key": "assets\/generated\/items\/aidm-reward-item-006-02\.png"/);
  assert.match(app, /function mappedItemArtFile\(item, definition = \{\}\)[\s\S]*itemCategoryArtKey\(text\)/);
  assert.match(app, /function rewardArtFile\(entry\)[\s\S]*reward\.file[\s\S]*mappedItemArtFile/);
  assert.match(app, /els\.rewardToastImage\.src = assetUrl\(file\)/);
  assert.match(app, /function assetRefFile\(assetRef\)[\s\S]*assetRef\.file[\s\S]*assetRef\.path[\s\S]*assetRef\.image\?\.file/);
  assert.match(app, /function isCurrentEquipmentItem\(item, definition = inventoryDefinition\(item\)\)[\s\S]*equipmentSummary\?\.slots\?\.\[slot\]\?\.item/);
  assert.match(app, /if \(summaryItem\.id && item\?\.id\) return summaryItem\.id === item\.id;/);
  assert.match(app, /summaryItem\.itemId && summaryItem\.itemId === item\?\.itemId && item\?\.equipped/);
  assert.match(app, /data-item-action="equip"/);
  assert.match(app, /selectedInventoryItemId = button\.dataset\.itemId;[\s\S]*renderCharacterDrawer\(\);[\s\S]*revealInventoryDetail\(\);/);
  assert.match(app, /function revealInventoryDetail\(\)[\s\S]*const schedule = window\.requestAnimationFrame \|\| \(\(callback\) => window\.setTimeout\(callback, 0\)\)[\s\S]*\.inventory-detail-card[\s\S]*target\.scrollIntoView\?\.\(\{ behavior: "smooth", block: "start", inline: "nearest" \}\)/);
  assert.match(app, /function revealInventoryFeedback\(\)[\s\S]*const schedule = window\.requestAnimationFrame \|\| \(\(callback\) => window\.setTimeout\(callback, 0\)\)[\s\S]*els\.inventoryStatus\.scrollIntoView\?\.\(\{ behavior: "smooth", block: "start", inline: "nearest" \}\)/);
  assert.match(app, /els\.inventoryStatus\.focus\?\.\(\{ preventScroll: true \}\)/);
  assert.match(app, /setInventoryFeedback\("inventory\.feedback\.sold"/);
  assert.match(app, /setInventoryFeedback\("inventory\.feedback\.equipped"/);
  assert.match(app, /setInventoryFeedback\("inventory\.feedback\.used"/);
  assert.match(app, /function setInventoryFeedback\(key, params = \{\}, kind = "success", fallback = ""\)[\s\S]*if \(inventoryFeedback\) \{[\s\S]*revealInventoryFeedback\(\);[\s\S]*\}/);
  assert.match(app, /const path = action === "sell" \? "market\/sell" : action === "equip" \? "items\/equip" : "items\/use"/);
  assert.match(app, /if \(!button \|\| !room \|\| !selectedInventoryItemId \|\| !hasLocalPlayerBinding\(\)\) return;/);
  assert.match(app, /if \(!room \|\| !hasLocalPlayerBinding\(\)\) return;/);
  assert.match(app, /if \(!button \|\| !room \|\| !hasLocalPlayerBinding\(\)\) return;/);
  assert.match(app, /if \(!room \|\| !hasLocalPlayerBinding\(\) \|\| marketLoading\) return;/);
  assert.match(app, /openRoom\(result\.room\)/);
  assert.match(app, /button type="button" data-market-buy="\$\{escapeHtml\(offer\.itemId\)\}" aria-label="\$\{escapeHtml\(buyLabel\)\}" title="\$\{escapeHtml\(buyLabel\)\}"/);
  assert.match(app, /purchaseState\.reason \? `<span class="market-buy-reason">\$\{escapeHtml\(purchaseState\.reason\)\}<\/span>` : ""/);
  assert.match(app, /function marketOfferActionHint\(offer, definition = marketOfferDefinition\(offer\)\)[\s\S]*market\.card\.toolAfterBuy/);
  assert.match(app, /setMarketFeedback\("market\.feedback\.buying"/);
  assert.match(app, /setMarketFeedback\("market\.feedback\.bought"/);
  assert.match(app, /function setMarketFeedback\(key, params = \{\}, kind = "success", fallback = ""\)[\s\S]*if \(marketFeedback\) \{[\s\S]*revealMarketFeedback\(\);[\s\S]*\}/);
  assert.match(app, /function revealMarketFeedback\(\)[\s\S]*const schedule = window\.requestAnimationFrame \|\| \(\(callback\) => window\.setTimeout\(callback, 0\)\)[\s\S]*els\.marketStatus\.scrollIntoView\?\.\(\{ behavior: "smooth", block: "start", inline: "nearest" \}\)/);
  assert.match(app, /els\.marketStatus\.focus\?\.\(\{ preventScroll: true \}\)/);
  assert.match(app, /let marketRefreshRequestId = 0/);
  assert.match(app, /const ACTION_REQUEST_TIMEOUT_MS = 10000/);
  assert.match(app, /const MARKET_REQUEST_TIMEOUT_MS = 10000/);
  assert.match(app, /const INVENTORY_ACTION_TIMEOUT_MS = 10000/);
  assert.match(app, /function renderMarketDrawer\(\)[\s\S]*els\.marketList\.setAttribute\("aria-busy", String\(marketLoading\)\)/);
  assert.match(app, /function refreshMarket\(\{ clearFeedback = false \} = \{\}\)[\s\S]*const requestId = \+\+marketRefreshRequestId;[\s\S]*const roomId = room\.id;[\s\S]*marketLoading = true;[\s\S]*renderMarketDrawer\(\);[\s\S]*api\(`\/api\/rooms\/\$\{roomId\}\/market`, \{ timeoutMs: MARKET_REQUEST_TIMEOUT_MS \}\)[\s\S]*marketOffers = Array\.isArray\(result\.shop\) \? result\.shop : \[\];[\s\S]*setMarketFeedback\("", \{\}, "error", localizedErrorMessage\(error\)\);[\s\S]*marketLoading = false;[\s\S]*renderMarketDrawer\(\);[\s\S]*renderPlayerSummaryDock\(\);/);
  assert.match(app, /if \(marketLoading\) \{[\s\S]*market\.loading[\s\S]*return;[\s\S]*\}/);
  assert.match(app, /button\.setAttribute\("aria-busy", "true"\)[\s\S]*setMarketFeedback\("market\.feedback\.buying"[\s\S]*button\.setAttribute\("aria-busy", "false"\)/);
  assert.match(app, /els\.inventoryDetail\?\.addEventListener\("click", async \(event\) => \{[\s\S]*const path = action === "sell" \? "market\/sell" : action === "equip" \? "items\/equip" : "items\/use";[\s\S]*const roomId = room\.id;[\s\S]*const result = await withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/\$\{path\}`, \{[\s\S]*method: "POST",[\s\S]*timeoutMs: INVENTORY_ACTION_TIMEOUT_MS,[\s\S]*itemId: selectedInventoryItemId,[\s\S]*expectedVersion: room\.version[\s\S]*\}\)\);/);
  assert.match(app, /async function api\(path, options = \{\}\)[\s\S]*new AbortController\(\)[\s\S]*window\.setTimeout\(\(\) => controller\.abort\(\), options\.timeoutMs\)[\s\S]*signal: controller\?\.signal[\s\S]*Request timed out/);
  assert.match(app, /els\.marketList\?\.addEventListener\("click", async \(event\) => \{[\s\S]*const roomId = room\.id;[\s\S]*const result = await withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/market\/buy`, \{[\s\S]*method: "POST",[\s\S]*timeoutMs: MARKET_REQUEST_TIMEOUT_MS,[\s\S]*itemId: button\.dataset\.marketBuy,[\s\S]*expectedVersion: room\.version[\s\S]*\}\)\);/);
  assert.match(app, /els\.actionForm\.addEventListener\("submit", async \(event\) => \{[\s\S]*const path = intent === "chat" \? "chat" : "action";[\s\S]*const roomId = room\.id;[\s\S]*const result = await withRealtimePaused\(\(\) => api\(`\/api\/rooms\/\$\{roomId\}\/\$\{path\}`, \{[\s\S]*method: "POST",[\s\S]*timeoutMs: ACTION_REQUEST_TIMEOUT_MS,[\s\S]*body: payload[\s\S]*\}\)\);/);
  assert.match(i18n, /"market\.reason\.insufficientFunds": "Not enough CR"/);
  assert.match(i18n, /"market\.reason\.outOfStock": "Out of stock"/);
  assert.match(i18n, /"market\.reason\.unavailable": "Unavailable"/);
  assert.match(i18n, /"market\.buyAriaBlocked": "Buy \{item\}: \{reason\}"/);
  assert.match(i18n, /"inventory\.rarity": "Rarity"/);
  assert.match(i18n, /"inventory\.sellable": "Sellable"/);
  assert.match(i18n, /"inventory\.sellValue": "Sell value"/);
  assert.match(i18n, /"inventory\.reason\.toolNarrativeUse": "Tool item: no direct Use button/);
  assert.match(i18n, /"inventory\.feedback\.sold": "Sold \{item\} for \{amount\}\. Wallet: \{wallet\}\. Backpack is refreshed\. Free-time inventory: no turn spent, no round advanced\."/);
  assert.match(i18n, /"market\.note": "Free-time inventory management for the next scene\. Buying or selling here does not spend a turn or advance the round; use Action for scene moves\."/);
  assert.match(i18n, /"market\.feedback\.buying": "Buying \{item\} as free-time inventory management; turn and round stay unchanged\.\.\."/);
  assert.match(i18n, /"market\.feedback\.noLocal": "Market locked: join or restore a local character first\."/);
  assert.match(i18n, /"market\.feedback\.bought": "Bought \{item\} for \{price\}\. Added to backpack\. Wallet: \{wallet\}\. Free-time inventory: no turn spent, no round advanced\./);
  assert.match(i18n, /"reward\.feedback\.addedToBackpack": "Added to backpack\. Open My character to use, equip, or sell\."/);
  assert.match(i18n, /"reward\.feedback\.backpackShort": "In backpack\."/);
  assert.match(i18n, /"reward\.expand": "Details"/);
  assert.match(i18n, /"party\.statusLine": "\{scene\} · \{status\}"/);
  assert.match(i18n, /"log\.group\.round": "Round \{round\} · \{time\}"/);
  assert.match(i18n, /"log\.detail\.expand": "Expand log detail"/);
  assert.match(i18n, /"ambience\.status\.off": "Off · \{soundscape\}"/);
  assert.match(i18n, /"ambience\.sceneStatus": "\{status\} · \{reason\}"/);
  assert.match(i18n, /"setup\.guidance": "First seat: \{species\} \{className\}\. \{readiness\} Use Guide if needed, then join the table\."/);
  assert.match(i18n, /"setup\.startSceneNoPlayers": "Start unlocks after at least one player joins\."/);
  assert.match(i18n, /"turnCue\.yourTurn": "Your turn: \{name\}"/);
  assert.match(i18n, /"turnCue\.next\.local": "Next: choose one concrete Action/);
  assert.match(i18n, /"turnCue\.sceneShifted": "Scene updated"/);
  assert.match(i18n, /"log\.density\.dense": "Dense"/);
  assert.match(i18n, /"log\.detail\.roll": "\{expression\} -> \{total\} vs DC \{dc\}"/);
  assert.match(i18n, /"stage\.recent": "Recent"/);
  assert.match(i18n, /"market\.reason\.insufficientFunds": "克朗不足"/);
  assert.match(i18n, /"market\.reason\.outOfStock": "已售罄"/);
  assert.match(i18n, /"market\.reason\.unavailable": "不可购买"/);
  assert.match(i18n, /"inventory\.rarity": "稀有度"/);
  assert.match(i18n, /"inventory\.sellable": "可售卖"/);
  assert.match(i18n, /"inventory\.sellValue": "出售值"/);
  assert.match(i18n, /"inventory\.reason\.toolNarrativeUse": "工具类物品：没有直接使用按钮/);
  assert.match(i18n, /"inventory\.feedback\.sold": "已出售\{item\}，获得 \{amount\}。钱包：\{wallet\}。背包已刷新。这是空闲整备：不消耗当前回合，不推进轮次。"/);
  assert.match(i18n, /"market\.note": "下一幕前的空闲整备。这里购买或出售不会消耗当前回合，也不会推进轮次；真正的场景行动请用“行动”。"/);
  assert.match(i18n, /"market\.feedback\.buying": "正在以空闲整备购买\{item\}；不会消耗当前回合，也不会推进轮次\.\.\."/);
  assert.match(i18n, /"market\.feedback\.noLocal": "市场已锁定：请先加入或恢复本地角色。"/);
  assert.match(i18n, /"market\.feedback\.bought": "已用 \{price\} 购买\{item\}。已加入背包。钱包：\{wallet\}。这是空闲整备：不消耗当前回合，不推进轮次。/);
  assert.match(i18n, /"reward\.feedback\.addedToBackpack": "已加入背包。打开我的角色即可使用、装备或出售。"/);
  assert.match(i18n, /"reward\.feedback\.backpackShort": "已入背包。"/);
  assert.match(i18n, /"reward\.expand": "详情"/);
  assert.match(i18n, /"ambience\.status\.off": "关 · \{soundscape\}"/);
  assert.match(i18n, /"ambience\.sceneStatus": "\{status\} · \{reason\}"/);
  assert.match(i18n, /"setup\.guidance": "首次入座：\{species\}\{className\}。\{readiness\} 需要帮助可先看指南，然后加入牌桌。"/);
  assert.match(i18n, /"setup\.startSceneNoPlayers": "至少一名玩家加入后才能开始场景。"/);
  assert.match(i18n, /"turnCue\.yourTurn": "轮到你：\{name\}"/);
  assert.match(i18n, /"turnCue\.next\.local": "下一步：选择行动/);
  assert.match(i18n, /"turnCue\.sceneShifted": "场景已更新"/);
  assert.match(i18n, /"log\.density\.dense": "紧凑"/);
  assert.match(i18n, /"log\.detail\.roll": "\{expression\} -> \{total\} \/ DC \{dc\}"/);
  assert.match(i18n, /"stage\.recent": "最近变化"/);
  assert.match(i18n, /"class\.mage": "法师"/);
  assert.match(i18n, /"voice\.role\.mage": "法师"/);
  assert.match(i18n, /"dice\.rolling": "Rolling"/);
  assert.match(i18n, /"dice\.landed": "Landed"/);
  assert.match(i18n, /"dice\.final": "Final total \{total\}"/);
  assert.match(i18n, /"dice\.margin\.success": "\+\{margin\} over DC"/);
  assert.match(i18n, /"settings\.voiceKicker": "Voice line"/);
  assert.match(i18n, /"archetype\.investigator": "Investigator"/);
  assert.match(i18n, /"join\.nameRequired": "Enter a player name before joining\."/);
  assert.match(i18n, /"replayShareText": "\{title\}: \{players\} players reached round \{round\}\. \{lead\}"/);
  assert.match(i18n, /"dice\.rolling": "掷骰中"/);
  assert.match(i18n, /"dice\.landed": "落定"/);
  assert.match(i18n, /"party\.activeTurn": "当前回合"/);
  assert.match(i18n, /"action\.hint\.action": "行动会提交场景动作，推进回合，并可能掷骰。"/);
  assert.match(i18n, /"action\.noPlayerHint": "请使用已加入本房间的浏览器，或先在设置流程加入角色，再行动或聊天。"/);
  assert.match(i18n, /"action\.noPlayerSubmit": "需要角色"/);
  assert.match(i18n, /"action\.noPlayerSubmitError": "需要本地角色。请使用已加入本房间的浏览器，或先在设置流程加入角色，再提交。"/);
  assert.match(i18n, /"action\.formAria\.noPlayer": "尚未选择本地角色。请使用已加入本房间的浏览器，或先在设置流程加入角色，再行动或聊天。"/);
  assert.match(i18n, /"archetype\.investigator": "调查员"/);
  assert.match(i18n, /"join\.nameRequired": "请先输入玩家名再加入。"/);
  assert.match(i18n, /"replayShareText": "\{title\}：\{players\} 名玩家推进到第 \{round\} 轮。\{lead\}"/);
  assert.match(i18n, /"builder\.frontline": "frontline"/);
  assert.match(i18n, /"builder\.frontline": "前线"/);
  assert.doesNotMatch(app, /data-market-spawn|data-market-edit|data-equipment-admin|data-spell-admin/);
});

test("runtime generated PNG references use explicit source-bound promotion metadata", async () => {
  const [manifest, app] = await Promise.all([
    readFile("assets/generated/manifest.json", "utf8").then((source) => JSON.parse(source)),
    readFile("public/app.js", "utf8")
  ]);
  const assetsByFile = new Map(manifest.rasterAssets.map((asset) => [asset.file, asset]));
  const runtimeRefs = await runtimeGeneratedPngRefs();
  const missingManifest = runtimeRefs.filter((file) => !assetsByFile.has(file));
  const catalogInternalRuntimeRefs = runtimeRefs.filter((file) => assetsByFile.get(file)?.uiSurface?.includes("catalog-internal"));
  const runtimePromotedRefs = runtimeRefs.filter((file) => assetsByFile.get(file)?.visibility === "runtime-promoted");

  assert.deepEqual(missingManifest, [], "runtime generated PNG refs must be registered in the generated manifest");
  assert.deepEqual(catalogInternalRuntimeRefs, [], "runtime generated PNG refs must not remain catalog-internal");
  assert.equal(runtimePromotedRefs.length, 102);
  assert.match(app, /document\.addEventListener\("error", handleRuntimeAssetImageError, true\)/);
  assert.match(app, /installRuntimeAssetFallbacks\(\)/);
  assert.match(app, /function installRuntimeAssetFallbacks\(root = document\)/);
  assert.match(app, /function runtimeGeneratedAssetFallback\(file\)/);
  assert.match(app, /function runtimeCssBackgroundImage\(file, explicitFallback = ""\)/);

  for (const file of runtimePromotedRefs) {
    const asset = assetsByFile.get(file);
    const delivery = assetBinaryDelivery(file, asset);

    assert.equal(asset.uiSurface.includes("catalog-internal"), false, `${asset.id} must not use catalog-internal`);
    assert.deepEqual(asset.uiSurface, ["ui-approved-runtime"], `${asset.id} must use the runtime promotion boundary`);
    assert.equal(asset.runtimePromotion?.status, "ui-approved-runtime", `${asset.id} must carry runtime promotion status`);
    assert.equal(asset.runtimePromotion?.catalogExposure, false, `${asset.id} must not enter broad generated catalog exposure`);
    assert.equal(asset.quality?.approved, false, `${asset.id} must not become broadly player-safe without visual QA`);
    assert.equal(delivery.status, "external-pending-binary", `${asset.id} binary may stay outside Git`);
    assert.equal(Boolean(delivery.fallbackFile), true, `${asset.id} must have a committed runtime fallback`);
  }
});

async function runtimeGeneratedPngRefs() {
  const files = await runtimeSourceFiles(["src", "public"]);
  const refs = new Set();

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/assets\/generated\/[A-Za-z0-9_./-]+\.png/g)) {
      refs.add(match[0]);
    }
  }

  return [...refs].sort();
}

async function runtimeSourceFiles(roots) {
  const files = [];
  for (const root of roots) {
    files.push(...await listRuntimeFiles(root));
  }
  return files.sort();
}

async function listRuntimeFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...await listRuntimeFiles(path));
    } else if (/\.(js|mjs|html|css|json)$/.test(entry.name)) {
      files.push(path);
    }
  }

  return files;
}
