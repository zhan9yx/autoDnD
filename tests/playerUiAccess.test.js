import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
  assert.match(html, /id="inventoryList"/);
  assert.match(html, /id="marketList"/);
  assert.match(html, /id="playerSummaryDock"/);
  assert.match(html, /id="starterSpellCards"/);
  assert.match(html, /id="dicePanel"/);
  assert.match(html, /name="channel"/);
  assert.match(html, /id="rewardToast"/);
  assert.doesNotMatch(topbarMarkup, /id="voiceToggle"|id="voiceSelect"|id="voiceRate"|id="voicePitch"|id="ambienceToggle"|id="ambienceMaster"|id="ambienceMusic"|id="ambienceEnvironment"/);
  assert.doesNotMatch(topbarMarkup, /id="marketButton"|id="tableGuideButton"/);
  assert.match(settingsMarkup, /id="playerMenuSection"[\s\S]*id="marketButton"[\s\S]*id="tableGuideButton"/);
  assert.match(settingsMarkup, /id="voiceToggle"[\s\S]*id="voiceSelect"[\s\S]*id="voiceRate"[\s\S]*id="voicePitch"/);
  assert.match(settingsMarkup, /id="ambienceToggle"[\s\S]*id="ambienceMaster"[\s\S]*id="ambienceMusic"[\s\S]*id="ambienceEnvironment"/);
  assert.match(app, /room\.presentation\?\.sceneAsset/);
  assert.match(app, /entry\.type === "reward"/);
  assert.match(app, /items\/use/);
  assert.match(app, /items\/equip/);
  assert.match(app, /market\/buy/);
  assert.match(app, /market\/sell/);
  assert.match(app, /renderMarketDrawer/);
  assert.match(app, /refreshMarket/);
  assert.match(app, /renderPlayerSummaryDock/);
  assert.match(app, /layerPlayerMenuControls\(\);[\s\S]*bindGuide\(\);[\s\S]*bindDrawers\(\);/);
  assert.match(app, /function layerPlayerMenuControls\(\)[\s\S]*controls\.append\(button\)/);
  assert.match(app, /const showPlayerSetup = !localPlayer && room\.phase === "lobby"/);
  assert.match(app, /els\.transcriptPanel\?\.classList\.toggle\("hidden", showPlayerSetup\)/);
  assert.match(app, /const ROOM_SESSION_PREFIX = "aidm\.rooms\."/);
  assert.match(app, /saveRoomPlayerSession\(room\.id, playerId, playerToken\)/);
  assert.match(app, /function restoreRoomPlayerSession\(nextRoom\)[\s\S]*roomPlayerIdKey\(nextRoom\.id\)[\s\S]*roomPlayerTokenKey\(nextRoom\.id\)/);
  assert.match(app, /restoreRoomPlayerSession\(nextRoom\);[\s\S]*room = nextRoom;/);
  assert.match(app, /els\.characterMeta\.textContent = `\$\{localizedSpeciesName\(character\)\} \/ \$\{localizedClassName\(character\)\}`/);
  assert.match(app, /escapeHtml\(localizedSpeciesName\(player\.character\)\)\} \$\{escapeHtml\(localizedClassName\(player\.character\)\)/);
  assert.match(app, /option\.textContent = voiceProfileOptionLabel\(profile\)/);
  assert.match(app, /option\.title = voiceProfileOptionTitle\(profile\)/);
  assert.match(app, /function localizedVoiceProfileName\(profile\)[\s\S]*主持人旁白/);
  assert.match(app, /function localizedVoiceRoleLabel\(profile\)[\s\S]*角色声线/);
  assert.match(app, /localizeEncounterState\(room\.combat\?\.state \|\| "scouting"\)/);
  assert.match(app, /els\.encounterState\.textContent = localizeEncounterState\(combat\.state \|\| "scouting"\)/);
  assert.match(app, /syncSceneClockLabels\(\)/);
  assert.match(app, /localizeQuestTitle\(quest\)/);
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
  assert.match(html, /class="builder-card-art" src="\/assets\/species\/human\.svg"/);
  assert.match(html, /class="builder-card-art" src="\/assets\/classes\/warrior\.svg"/);
  assert.match(html, /id="starterSpellCards"[^>]+aria-label="Starting spells"/);
  assert.match(html, /id="characterProgressSummary"[\s\S]*id="equipmentSummary"[\s\S]*id="spellList"/);
  assert.match(html, /data-drawer="market"[^>]+aria-hidden="true"[^>]+inert[\s\S]*id="marketWallet"[\s\S]*id="marketList"[\s\S]*id="marketStatus"/);

  assert.match(app, /function renderStarterSpellCards\(\)[\s\S]*const classId = document\.querySelector\("#classSelect"\)\?\.value \|\| "warrior"/);
  assert.match(app, /const CLASS_RECOMMENDED_ALLOCATIONS = \{[\s\S]*mage: \{ body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 \}/);
  assert.match(app, /function applyRecommendedAttributePreset\(classId\)[\s\S]*CLASS_RECOMMENDED_ALLOCATIONS\[classId\]/);
  assert.match(app, /input\.max = String\(ATTRIBUTE_POINT_BUDGET\.maxSpend\)/);
  assert.match(app, /pointBudget\.ready/);
  assert.match(app, /els\.starterSpellCards\.innerHTML = spells\.map\(\(spell\) => `[\s\S]*<article class="spell-card">/);
  assert.match(app, /const SPELL_ART_FILES = \{[\s\S]*firebolt: "assets\/spells\/ember-bolt\.svg"[\s\S]*"healing-word": "assets\/spells\/mend-wounds\.svg"/);
  assert.match(app, /spellArtMarkup\(spell\.id, localizeTextValue\(spell\.label\), "spell-card-art"\)/);
  assert.match(app, /cleric: \[[\s\S]*id: "healing-word"[\s\S]*id: "radiant-bolt"[\s\S]*id: "ward"/);
  assert.doesNotMatch(app, /guarding-strike|shadow-step|silver-tongue|omen-mark|commanding-word|warding-light/);
  assert.match(app, /function renderCharacterProgress\(character\)[\s\S]*els\.characterProgressSummary\.innerHTML = `/);
  assert.match(app, /function renderEquipmentSummary\(inventory, equipmentSummary = null\)[\s\S]*const slots = equipmentSlotSummary\(inventory, equipmentSummary\)/);
  assert.match(app, /function equipmentSlotSummary\(inventory = \[\], equipmentSummary = null\)[\s\S]*slot\.weapon[\s\S]*summarySlot: "mainHand"[\s\S]*slot\.armor[\s\S]*summarySlot: "body"[\s\S]*slot\.focus[\s\S]*slot\.kit/);
  assert.match(app, /function renderMarketDrawer\(\)[\s\S]*const player = getLocalPlayer\(\)/);
  assert.match(app, /if \(nextRoom\.players\?\.some\(\(player\) => player\.id === playerId\)\) \{[\s\S]*saveRoomPlayerSession\(nextRoom\.id, playerId, playerToken\)/);
  assert.match(app, /const storedPlayerId = localStorage\.getItem\(roomPlayerIdKey\(nextRoom\.id\)\) \|\| ""/);
  assert.match(app, /playerId = storedPlayerId;[\s\S]*playerToken = localStorage\.getItem\(roomPlayerTokenKey\(nextRoom\.id\)\) \|\| ""/);
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
  assert.match(app, /function transcriptChannel\(entry\)[\s\S]*entry\.visibility\?\.scope === "faction"[\s\S]*return "public"/);
  assert.match(app, /localizedTranscriptAuthor\(entry\)/);
  assert.match(app, /function localizedTranscriptAuthor\(entry = \{\}\)[\s\S]*speaker\.aidm[\s\S]*speaker\.rules[\s\S]*speaker\.table/);
  assert.doesNotMatch(app, /entry\.author \|\| entry\.type\)\} \/ /);
  assert.match(app, /message\.dataset\.channel = channel/);
  assert.match(app, /function channelBadgeMarkup\(channel\)[\s\S]*data-channel-badge="\$\{escapeHtml\(channel\)\}"/);
  assert.match(app, /if \(!player\) \{[\s\S]*market\.joinPrompt/);
  assert.match(app, /function marketPriceLabel\(offer\)[\s\S]*isCurrentCurrencyLabel\(backendLabel\)/);
  assert.match(app, /function marketPurchaseState\(offer, wallet\)[\s\S]*market\.reason\.unavailable[\s\S]*market\.reason\.outOfStock[\s\S]*market\.reason\.insufficientFunds/);
  assert.match(app, /function marketBuyButtonLabel\(definition, reason\)[\s\S]*market\.buyAriaBlocked[\s\S]*market\.buyAria/);
  assert.match(app, /itemArtMarkup\(item, definition, "inventory-item-art"\)/);
  assert.match(app, /itemArtMarkup\(item, definition, "inventory-detail-art"\)/);
  assert.match(app, /itemArtMarkup\(offer, definition, "market-item-art"\)/);
  assert.match(app, /inventory\.sellable/);
  assert.match(app, /function isInventoryItemSellable\(item\)[\s\S]*item\?\.tradeable !== false && item\?\.sellable !== false/);
  assert.match(app, /function itemArtFile\(item, definition = \{\}\)[\s\S]*assetRefFile\(item\?\.definition\?\.assetRef\)[\s\S]*assetRefFile\(item\?\.definitionSnapshot\?\.assetRef\)[\s\S]*assetRefFile\(item\?\.generated\)/);
  assert.match(app, /const ITEM_ART_FILES = \{[\s\S]*longsword: "assets\/weapons\/longsword\.svg"[\s\S]*"moon-key": "assets\/items\/moon-key\.svg"/);
  assert.match(app, /function mappedItemArtFile\(item, definition = \{\}\)[\s\S]*itemCategoryArtKey\(text\)/);
  assert.match(app, /function rewardArtFile\(entry\)[\s\S]*reward\.file[\s\S]*mappedItemArtFile/);
  assert.match(app, /els\.rewardToastImage\.src = assetUrl\(file\)/);
  assert.match(app, /function assetRefFile\(assetRef\)[\s\S]*assetRef\.file[\s\S]*assetRef\.path[\s\S]*assetRef\.image\?\.file/);
  assert.match(app, /function isCurrentEquipmentItem\(item, definition = inventoryDefinition\(item\)\)[\s\S]*equipmentSummary\?\.slots\?\.\[slot\]\?\.item/);
  assert.match(app, /if \(summaryItem\.id && item\?\.id\) return summaryItem\.id === item\.id;/);
  assert.match(app, /summaryItem\.itemId && summaryItem\.itemId === item\?\.itemId && item\?\.equipped/);
  assert.match(app, /data-item-action="equip"/);
  assert.match(app, /const path = action === "sell" \? "market\/sell" : action === "equip" \? "items\/equip" : "items\/use"/);
  assert.match(app, /openRoom\(result\.room\)/);
  assert.match(app, /button type="button" data-market-buy="\$\{escapeHtml\(offer\.itemId\)\}" aria-label="\$\{escapeHtml\(buyLabel\)\}" title="\$\{escapeHtml\(buyLabel\)\}"/);
  assert.match(app, /purchaseState\.reason \? `<span class="market-buy-reason">\$\{escapeHtml\(purchaseState\.reason\)\}<\/span>` : ""/);
  assert.match(app, /api\(`\/api\/rooms\/\$\{room\.id\}\/market\/buy`/);
  assert.match(app, /api\(`\/api\/rooms\/\$\{room\.id\}\/\$\{path\}`/);
  assert.match(i18n, /"market\.reason\.insufficientFunds": "Not enough CR"/);
  assert.match(i18n, /"market\.reason\.outOfStock": "Out of stock"/);
  assert.match(i18n, /"market\.reason\.unavailable": "Unavailable"/);
  assert.match(i18n, /"market\.buyAriaBlocked": "Buy \{item\}: \{reason\}"/);
  assert.match(i18n, /"inventory\.sellable": "Sellable"/);
  assert.match(i18n, /"market\.reason\.insufficientFunds": "克朗不足"/);
  assert.match(i18n, /"market\.reason\.outOfStock": "已售罄"/);
  assert.match(i18n, /"market\.reason\.unavailable": "不可购买"/);
  assert.match(i18n, /"inventory\.sellable": "可售卖"/);
  assert.match(i18n, /"class\.mage": "法师"/);
  assert.match(i18n, /"voice\.role\.mage": "法师"/);
  assert.match(i18n, /"dice\.rolling": "Rolling"/);
  assert.match(i18n, /"dice\.landed": "Landed"/);
  assert.match(i18n, /"dice\.final": "Final total \{total\}"/);
  assert.match(i18n, /"dice\.rolling": "掷骰中"/);
  assert.match(i18n, /"dice\.landed": "落定"/);
  assert.match(i18n, /"builder\.frontline": "frontline"/);
  assert.match(i18n, /"builder\.frontline": "前线"/);
  assert.doesNotMatch(app, /data-market-spawn|data-market-edit|data-equipment-admin|data-spell-admin/);
});
