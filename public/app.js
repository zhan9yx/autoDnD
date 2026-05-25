import { applyTranslations, normalizeLanguage, t } from "./i18n.js";
import { buildUtterancePlan, listVoiceProfiles, selectVoice, splitSpeechText, voiceHintsForProfile } from "./tts.js";
import { canUseAudio, createAmbienceEngine } from "./ambience.js";

const AUTH_SESSION_KEY = "aidm.authSessionToken";
const CURRENT_USER_KEY = "aidm.currentUser";

let room = null;
let playerId = localStorage.getItem("aidm.playerId") || "";
let playerToken = localStorage.getItem("aidm.playerToken") || "";
let hostToken = localStorage.getItem("aidm.hostToken") || "";
let authSessionToken = localStorage.getItem(AUTH_SESSION_KEY) || "";
let currentUser = readStoredCurrentUser();
let authMode = "login";
let pendingPlayerId = "";
let pendingPlayerToken = "";
let pendingAccessPollTimer = null;
let eventSource = null;
let eventSourceRoomId = "";
let eventSourceGeneration = 0;
let realtimePauseDepth = 0;
let pendingRealtimeRoomId = "";
let animationFrame = null;
let uiLanguage = normalizeLanguage(localStorage.getItem("aidm.language") || navigator.language || "en");
let activeRoomId = "";
const spokenEventIds = new Set();
const shownRewardEventIds = new Set();
let selectedInventoryItemId = "";
let lastRenderedRollEventId = "";
let diceLandingTimer = null;
let marketOffers = [];
let marketLoading = false;
let marketFeedback = null;
let marketRefreshRequestId = 0;
let inventoryFeedback = null;
let lastReplay = null;
let replayBuildRequestId = 0;
let lastSceneSignature = "";
const LOG_DENSITY_SEQUENCE = ["summary", "dense", "comfortable"];
const LOG_MAIN_LIMITS = {
  summary: 16,
  dense: 10,
  comfortable: 6
};
let logDensity = normalizeLogDensity(localStorage.getItem("aidm.logDensity"));

const ROOM_SESSION_PREFIX = "aidm.rooms.";
const ACTION_REQUEST_TIMEOUT_MS = 10000;
const MARKET_REQUEST_TIMEOUT_MS = 10000;
const REPLAY_REQUEST_TIMEOUT_MS = 10000;
const INVENTORY_ACTION_TIMEOUT_MS = 10000;

const speechState = {
  enabled: localStorage.getItem("aidm.voice.enabled") === "true",
  selectedVoiceValue: localStorage.getItem("aidm.voice.selection")
    || legacyVoiceSelection(localStorage.getItem("aidm.voice.name") || ""),
  rate: Number(localStorage.getItem("aidm.voice.rate") || 1),
  pitch: Number(localStorage.getItem("aidm.voice.pitch") || 1),
  voices: []
};

const VOICE_PROFILE_GROUP_ORDER = ["core", "people", "lineage", "special"];
const MAX_BROWSER_VOICE_OPTIONS = 12;

const CLASS_IDS = new Set(["warrior", "rogue", "mage", "cleric", "ranger", "bard", "occultist", "envoy"]);
const SPECIES_IDS = new Set(["human", "elf", "dwarf", "orc", "gnome", "tiefling", "automaton", "halfling"]);
const ARCHETYPE_IDS = ["investigator", "vanguard", "occultist", "envoy"];
const AVATAR_OPTION_BASE = "assets/generated/options";
const SPECIES_AVATAR_FILES = {
  human: `${AVATAR_OPTION_BASE}/aidm-option-01.png`,
  elf: `${AVATAR_OPTION_BASE}/aidm-option-02.png`,
  dwarf: `${AVATAR_OPTION_BASE}/aidm-option-03.png`,
  orc: `${AVATAR_OPTION_BASE}/aidm-option-04.png`,
  tiefling: `${AVATAR_OPTION_BASE}/aidm-option-05.png`,
  gnome: `${AVATAR_OPTION_BASE}/aidm-option-06.png`,
  halfling: `${AVATAR_OPTION_BASE}/aidm-option-07.png`,
  automaton: `${AVATAR_OPTION_BASE}/aidm-option-08.png`
};
const CLASS_AVATAR_FILES = {
  warrior: `${AVATAR_OPTION_BASE}/aidm-option-09.png`,
  rogue: `${AVATAR_OPTION_BASE}/aidm-option-10.png`,
  mage: `${AVATAR_OPTION_BASE}/aidm-option-11.png`,
  cleric: `${AVATAR_OPTION_BASE}/aidm-option-12.png`,
  ranger: `${AVATAR_OPTION_BASE}/aidm-option-13.png`,
  bard: `${AVATAR_OPTION_BASE}/aidm-option-14.png`,
  occultist: `${AVATAR_OPTION_BASE}/aidm-option-15.png`,
  envoy: `${AVATAR_OPTION_BASE}/aidm-option-16.png`
};
const SPELL_ART_FILES = {
  firebolt: "assets/generated/spells/aidm-spell-015-01.png",
  "radiant-bolt": "assets/generated/spells/aidm-spell-015-13.png",
  "healing-word": "assets/generated/spells/aidm-spell-015-05.png",
  sleep: "assets/generated/spells/aidm-spell-015-14.png",
  ward: "assets/generated/spells/aidm-spell-015-02.png",
  "arcane-shield": "assets/generated/spells/aidm-spell-015-07.png",
  "binding-vines": "assets/generated/spells/aidm-spell-015-16.png",
  "cleanse-poison": "assets/generated/spells/aidm-spell-015-05.png",
  "frost-bind": "assets/generated/spells/aidm-spell-015-02.png",
  "glass-echo": "assets/generated/spells/aidm-spell-015-07.png",
  "storm-arc": "assets/generated/spells/aidm-spell-015-04.png",
  "thunder-step": "assets/generated/spells/aidm-spell-015-03.png"
};
const ITEM_ART_FILES = {
  "travel-lamp": "assets/generated/items/aidm-reward-item-006-06.png",
  "field-notebook": "assets/generated/items/aidm-reward-item-006-05.png",
  longsword: "assets/generated/items/aidm-weapon-cutout-024-01.png",
  shield: "assets/generated/items/aidm-weapon-cutout-024-03.png",
  dagger: "assets/generated/items/aidm-reward-item-006-07.png",
  shortbow: "assets/generated/items/aidm-equipment-variant-007-07.png",
  staff: "assets/generated/items/aidm-weapon-cutout-024-07.png",
  mace: "assets/generated/items/aidm-weapon-cutout-024-05.png",
  robe: "assets/generated/items/aidm-equipment-fashion-013-01.png",
  leather: "assets/generated/items/aidm-wearable-cutout-023-01.png",
  chainmail: "assets/generated/items/aidm-wearable-cutout-023-02.png",
  "moon-key": "assets/generated/items/aidm-reward-item-006-02.png",
  "silver-ledger": "assets/generated/items/aidm-reward-item-006-01.png",
  "storm-lantern": "assets/generated/items/aidm-reward-item-006-06.png",
  "healing-word-scroll": "assets/generated/items/aidm-market-item-009-05.png",
  "sleep-scroll": "assets/generated/items/aidm-consumable-cutout-010-03.png",
  "binding-vines-scroll": "assets/generated/items/aidm-magic-cutout-025-16.png",
  "festival-wine": "assets/generated/items/aidm-consumable-cutout-010-01.png",
  "minor-portrait": "assets/generated/items/aidm-reward-item-006-03.png"
};
const ITEM_CATEGORY_ART_FILES = {
  weapon: "assets/generated/items/aidm-weapon-cutout-024-01.png",
  armor: "assets/generated/items/aidm-wearable-cutout-023-01.png",
  shield: "assets/generated/items/aidm-weapon-cutout-024-03.png",
  tool: "assets/generated/items/aidm-tool-cutout-021-01.png",
  kit: "assets/generated/items/aidm-tool-cutout-021-08.png",
  spell: "assets/generated/spells/aidm-spell-015-07.png",
  scroll: "assets/generated/items/aidm-market-item-009-05.png",
  quest: "assets/generated/items/aidm-reward-item-006-05.png",
  trade: "assets/generated/items/aidm-trade-cutout-026-01.png",
  consumable: "assets/generated/items/aidm-consumable-cutout-010-01.png",
  food: "assets/generated/items/aidm-consumable-cutout-010-01.png",
  reward: "assets/generated/items/aidm-reward-item-006-01.png",
  item: "assets/generated/items/aidm-reward-item-006-03.png"
};
const GENERATED_REWARD_ART_FILES = {
  "silver-rain-ledger": "assets/generated/items/aidm-reward-item-006-01.png",
  "moon-key": "assets/generated/items/aidm-reward-item-006-02.png",
  "brass-wayfinder": "assets/generated/items/aidm-reward-item-006-03.png",
  "stormglass-vial": "assets/generated/items/aidm-reward-item-006-04.png",
  "wax-letter-bundle": "assets/generated/items/aidm-reward-item-006-05.png",
  "lantern-crystal": "assets/generated/items/aidm-reward-item-006-06.png",
  "obsidian-dagger": "assets/generated/items/aidm-reward-item-006-07.png",
  "clockwork-lockpicks": "assets/generated/items/aidm-reward-item-006-08.png",
  "saint-medallion": "assets/generated/items/aidm-reward-item-006-09.png",
  "emerald-signet-ring": "assets/generated/items/aidm-reward-item-006-10.png",
  "folded-city-map": "assets/generated/items/aidm-reward-item-006-11.png",
  "healing-salve": "assets/generated/items/aidm-reward-item-006-12.png",
  "ivory-dice-set": "assets/generated/items/aidm-reward-item-006-14.png"
};

const FRONTEND_ITEM_DEFINITIONS = {
  "travel-lamp": {
    name: { en: "Travel Lamp", zh: "旅行提灯" },
    category: { en: "Tool", zh: "工具" },
    description: { en: "A brass travel lamp with a blue glass shield, steady enough for rain-soaked streets.", zh: "一盏带蓝玻璃罩的黄铜旅行提灯，适合雨中的街道与湿石走廊。" }
  },
  "field-notebook": {
    name: { en: "Field Notebook", zh: "现场札记" },
    category: { en: "Tool", zh: "工具" },
    description: { en: "Waxed pages marked for clues, promises, debts, and suspects.", zh: "打蜡纸页预留了线索、承诺、欠账与嫌疑人的记录位置。" }
  },
  longsword: {
    name: { en: "Longsword", zh: "长剑" },
    category: { en: "Weapon", zh: "武器" },
    slot: "mainHand",
    description: { en: "A balanced patrol blade with a worn leather grip.", zh: "一柄配重稳当的巡逻长剑，皮柄已经磨旧。" }
  },
  shield: {
    name: { en: "Ward Shield", zh: "守护盾" },
    category: { en: "Shield", zh: "盾牌" },
    slot: "offHand",
    description: { en: "A compact shield painted with a fading ward-mark.", zh: "一面画着褪色护符的小盾。" }
  },
  dagger: {
    name: { en: "Dagger", zh: "匕首" },
    category: { en: "Weapon", zh: "武器" },
    slot: "mainHand",
    description: { en: "A narrow street blade that vanishes cleanly into a sleeve.", zh: "一柄能利落藏进袖口的窄刃街刀。" }
  },
  shortbow: {
    name: { en: "Shortbow", zh: "短弓" },
    category: { en: "Weapon", zh: "武器" },
    slot: "mainHand",
    description: { en: "A rain-oiled bow sized for alleys and forest tracks.", zh: "一张适合巷战与林径的防雨短弓。" }
  },
  staff: {
    name: { en: "Oak Staff", zh: "橡木杖" },
    category: { en: "Weapon", zh: "武器" },
    slot: "mainHand",
    description: { en: "A polished oak staff with brass rings near the grip.", zh: "一根打磨过的橡木杖，握柄旁有黄铜环。" }
  },
  mace: {
    name: { en: "Sun Mace", zh: "日纹钉锤" },
    category: { en: "Weapon", zh: "武器" },
    slot: "mainHand",
    description: { en: "A short mace stamped with a sunburst.", zh: "一柄压着日芒纹的短钉锤。" }
  },
  robe: {
    name: { en: "Travel Robe", zh: "旅行长袍" },
    category: { en: "Armor", zh: "护甲" },
    slot: "body",
    description: { en: "A layered robe with hidden inner pockets.", zh: "一件带暗袋的分层旅行长袍。" }
  },
  leather: {
    name: { en: "Leather Armor", zh: "皮甲" },
    category: { en: "Armor", zh: "护甲" },
    slot: "body",
    description: { en: "Soft black leather reinforced under the ribs and shoulders.", zh: "柔软黑皮在肋侧与肩部加固。" }
  },
  chainmail: {
    name: { en: "Chainmail", zh: "链甲" },
    category: { en: "Armor", zh: "护甲" },
    slot: "body",
    description: { en: "A heavy shirt of linked iron, patched at the left side.", zh: "一件沉重的铁环甲，左侧补过一片。" }
  },
  "moon-key": {
    name: { en: "Moon Key", zh: "月相钥匙" },
    category: { en: "Quest item", zh: "任务物品" },
    description: { en: "A pale key whose teeth change under moonlight.", zh: "一枚淡色钥匙，月光下齿纹会轻微改变。" }
  },
  "silver-ledger": {
    name: { en: "Silver Ledger", zh: "银边账本" },
    category: { en: "Trade good", zh: "可售卖物" },
    description: { en: "A ledger trimmed in tarnished silver.", zh: "一本镶着失光银边的账本。" }
  },
  "storm-lantern": {
    name: { en: "Storm Lantern", zh: "暴风提灯" },
    category: { en: "Tool", zh: "工具" },
    description: { en: "A sealed lantern that glows brighter when thunder rolls.", zh: "一盏密封提灯，雷声滚过时会更亮些。" }
  },
  "healing-word-scroll": {
    name: { en: "Scroll of Healing Word", zh: "治疗真言法卷" },
    category: { en: "Spell scroll", zh: "法卷" },
    description: { en: "A ribbon-bound scroll whose ink warms near wounded allies.", zh: "一卷以缎带束起的法卷，靠近伤者时墨迹会微微发暖。" }
  },
  "sleep-scroll": {
    name: { en: "Scroll of Veiled Sleep", zh: "睡眠帷幕法卷" },
    category: { en: "Spell scroll", zh: "法卷" },
    description: { en: "A violet scroll smelling faintly of rain on velvet curtains.", zh: "一卷带淡紫色的法卷，闻起来像雨落在天鹅绒帘上。" }
  },
  "binding-vines-scroll": {
    name: { en: "Scroll of Thorn Snare", zh: "荆棘缚网法卷" },
    category: { en: "Spell scroll", zh: "法卷" },
    description: { en: "A bark-fiber scroll sealed with green wax.", zh: "一卷树皮纤维制成的法卷，以绿蜡封口。" }
  },
  "festival-wine": {
    name: { en: "Festival Wine", zh: "节庆红酒" },
    category: { en: "Food and drink", zh: "食品与酒饮" },
    description: { en: "A plum-dark bottle from a crowded inn cellar.", zh: "一瓶来自拥挤旅店酒窖的深梅色红酒。" }
  },
  "minor-portrait": {
    name: { en: "Minor Noble Portrait", zh: "小贵族肖像" },
    category: { en: "Trade good", zh: "可售卖物" },
    description: { en: "A palm-sized portrait whose frame may be worth more than its sitter.", zh: "一幅巴掌大的小贵族肖像，画框也许比画中人更值钱。" }
  }
};

const CONDITION_LABELS = {
  poor: { en: "Poor", zh: "破旧" },
  worn: { en: "Worn", zh: "磨损" },
  fine: { en: "Fine", zh: "良好" },
  pristine: { en: "Pristine", zh: "崭新" },
  masterwork: { en: "Masterwork", zh: "精工" }
};

const ATTRIBUTE_POINT_BUDGET = Object.freeze({ max: 27, maxSpend: 7 });

const CLASS_RECOMMENDED_ALLOCATIONS = {
  warrior: { body: 7, agility: 4, mind: 3, presence: 6, spirit: 7 },
  rogue: { body: 4, agility: 7, mind: 6, presence: 5, spirit: 5 },
  mage: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 },
  cleric: { body: 5, agility: 3, mind: 5, presence: 7, spirit: 7 },
  ranger: { body: 5, agility: 7, mind: 4, presence: 4, spirit: 7 },
  bard: { body: 3, agility: 5, mind: 5, presence: 7, spirit: 7 },
  occultist: { body: 3, agility: 5, mind: 7, presence: 6, spirit: 6 },
  envoy: { body: 4, agility: 4, mind: 5, presence: 7, spirit: 7 }
};

const STARTER_SPELLS_BY_CLASS = {
  warrior: [],
  rogue: [],
  mage: [
    { id: "firebolt", label: { en: "Firebolt", zh: "火焰箭" }, detail: { en: "Reliable ranged arcane pressure.", zh: "稳定的远程奥术压制。" } },
    { id: "sleep", label: { en: "Sleep", zh: "睡眠术" }, detail: { en: "Disable a weakened target.", zh: "让虚弱目标失去行动力。" } },
    { id: "arcane-shield", label: { en: "Arcane Shield", zh: "奥术护盾" }, detail: { en: "Raise defense before impact.", zh: "在受击前提高防御。" } }
  ],
  cleric: [
    { id: "healing-word", label: { en: "Healing Word", zh: "治疗真言" }, detail: { en: "Restore an ally at range.", zh: "远距离恢复盟友生命。" } },
    { id: "radiant-bolt", label: { en: "Radiant Bolt", zh: "辉耀箭" }, detail: { en: "Strike from range with divine light.", zh: "用神圣光芒远程打击。" } },
    { id: "ward", label: { en: "Ward", zh: "护佑术" }, detail: { en: "Raise an ally's defense for a round.", zh: "让一名盟友本轮防御提高。" } }
  ],
  ranger: [
    { id: "binding-vines", label: { en: "Binding Vines", zh: "缚藤术" }, detail: { en: "Hold a route or fleeing enemy.", zh: "拦住路线或逃跑敌人。" } }
  ],
  bard: [
    { id: "healing-word", label: { en: "Healing Word", zh: "治疗真言" }, detail: { en: "Restore an ally at range.", zh: "远距离恢复盟友生命。" } },
    { id: "sleep", label: { en: "Sleep", zh: "睡眠术" }, detail: { en: "Disable a weakened target.", zh: "让虚弱目标失去行动力。" } }
  ],
  occultist: [
    { id: "firebolt", label: { en: "Firebolt", zh: "火焰箭" }, detail: { en: "Reliable ranged arcane pressure.", zh: "稳定的远程奥术压制。" } },
    { id: "sleep", label: { en: "Sleep", zh: "睡眠术" }, detail: { en: "Disable a weakened target.", zh: "让虚弱目标失去行动力。" } },
    { id: "binding-vines", label: { en: "Binding Vines", zh: "缚藤术" }, detail: { en: "Hold a route or fleeing enemy.", zh: "拦住路线或逃跑敌人。" } }
  ],
  envoy: [
    { id: "ward", label: { en: "Ward", zh: "护佑术" }, detail: { en: "Raise an ally's defense for a round.", zh: "让一名盟友本轮防御提高。" } }
  ]
};

let drawerOpener = null;

const els = {
  gateway: document.querySelector("#gateway"),
  table: document.querySelector("#table"),
  authForm: document.querySelector("#authForm"),
  authStatus: document.querySelector("#authStatus"),
  authStatusText: document.querySelector("#authStatusText"),
  tableAuthStatus: document.querySelector("#tableAuthStatus"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  logoutButton: document.querySelector("#logoutButton"),
  authDisplayNameField: document.querySelector("#authDisplayNameField"),
  authModeButtons: document.querySelectorAll("[data-auth-mode-button]"),
  createForm: document.querySelector("#createForm"),
  createAccessMode: document.querySelector("#createAccessMode"),
  createRoomPasswordField: document.querySelector("#createRoomPasswordField"),
  createAccessHint: document.querySelector("#createAccessHint"),
  createStatus: document.querySelector("#createStatus"),
  createLanguageSelect: document.querySelector("#createLanguageSelect"),
  languageSelect: document.querySelector("#languageSelect"),
  joinByIdForm: document.querySelector("#joinByIdForm"),
  joinForm: document.querySelector("#joinForm"),
  joinRoomPasswordField: document.querySelector("#joinRoomPasswordField"),
  joinStatus: document.querySelector("#joinStatus"),
  playerSetupPanel: document.querySelector("#playerSetupPanel"),
  setupGuidance: document.querySelector("#setupGuidance"),
  actionForm: document.querySelector("#actionForm"),
  actionModeHint: document.querySelector("#actionModeHint"),
  actionError: document.querySelector("#actionError"),
  turnFocus: document.querySelector("#turnFocus"),
  turnFocusLabel: document.querySelector("#turnFocusLabel"),
  turnFocusContext: document.querySelector("#turnFocusContext"),
  turnFocusSteps: document.querySelector("#turnFocusSteps"),
  startButton: document.querySelector("#startButton"),
  myCharacterButton: document.querySelector("#myCharacterButton"),
  tableGuideButton: document.querySelector("#tableGuideButton"),
  roomTitle: document.querySelector("#roomTitle"),
  connectionStatus: document.querySelector("#connectionStatus"),
  tableStateToggle: document.querySelector("#tableStateToggle"),
  tableStateDetails: document.querySelector("#tableStateDetails"),
  stateStripHeadline: document.querySelector("#stateStripHeadline"),
  stateStripMeta: document.querySelector("#stateStripMeta"),
  roundDock: document.querySelector("#roundDock"),
  turnDock: document.querySelector("#turnDock"),
  encounterDock: document.querySelector("#encounterDock"),
  threatClockLabel: document.querySelector("#threatClockLabel"),
  clueClockLabel: document.querySelector("#clueClockLabel"),
  syncDock: document.querySelector("#syncDock"),
  playerSummaryDock: document.querySelector("#playerSummaryDock"),
  tableStateStrip: document.querySelector(".table-state-strip"),
  audioStatusLabel: document.querySelector("#audioStatusLabel"),
  audioStatusDock: document.querySelector("#audioStatusDock"),
  partyStatusBar: document.querySelector("#partyStatusBar"),
  combatBrief: document.querySelector("#combatBrief"),
  roster: document.querySelector("#roster"),
  transcriptPanel: document.querySelector(".transcript-panel"),
  transcript: document.querySelector("#transcript"),
  logDensityToggle: document.querySelector("#logDensityToggle"),
  dicePanel: document.querySelector("#dicePanel"),
  dicePanelBody: document.querySelector("#dicePanelBody"),
  fullTranscript: document.querySelector("#fullTranscript"),
  logCount: document.querySelector("#logCount"),
  roundBadge: document.querySelector("#roundBadge"),
  turnBadge: document.querySelector("#turnBadge"),
  sceneLocation: document.querySelector("#sceneLocation"),
  sceneObjective: document.querySelector("#sceneObjective"),
  rewardCount: document.querySelector("#rewardCount"),
  stateBeat: document.querySelector("#stateBeat"),
  stateSummary: document.querySelector("#stateSummary"),
  stateChangeList: document.querySelector("#stateChangeList"),
  encounterState: document.querySelector("#encounterState"),
  encounterList: document.querySelector("#encounterList"),
  rewardList: document.querySelector("#rewardList"),
  replayButton: document.querySelector("#replayButton"),
  replaySummary: document.querySelector("#replaySummary"),
  rewardToast: document.querySelector("#rewardToast"),
  rewardToastTitle: document.querySelector("#rewardToastTitle"),
  rewardToastText: document.querySelector("#rewardToastText"),
  rewardToastImage: document.querySelector("#rewardToastImage"),
  rewardToastClose: document.querySelector("#rewardToastClose"),
  pointBudget: document.querySelector("#pointBudget"),
  stage: document.querySelector("#stage"),
  sceneBackdrop: document.querySelector("#sceneBackdrop"),
  sceneAssetDescription: document.querySelector("#sceneAssetDescription"),
  sceneChangeSummary: document.querySelector("#sceneChangeSummary"),
  sceneChangeLabel: document.querySelector("#sceneChangeLabel"),
  sceneChangeDetail: document.querySelector("#sceneChangeDetail"),
  sceneVisualMeta: document.querySelector("#sceneVisualMeta"),
  canvas: document.querySelector("#sceneCanvas"),
  guideOverlay: document.querySelector("#guideOverlay"),
  guideOpenButtons: document.querySelectorAll("[data-guide-open]"),
  guideCloseButtons: document.querySelectorAll("[data-guide-close]"),
  guideTabs: document.querySelectorAll("[data-guide-tab]"),
  guideSections: document.querySelectorAll("[data-guide-section]"),
  settingsStack: document.querySelector(".settings-stack"),
  drawerOpenButtons: document.querySelectorAll("[data-drawer-open]"),
  drawerCloseButtons: document.querySelectorAll("[data-drawer-close]"),
  drawerPanels: document.querySelectorAll("[data-drawer]"),
  drawerScrim: document.querySelector("#drawerScrim"),
  marketButton: document.querySelector("#marketButton"),
  marketWallet: document.querySelector("#marketWallet"),
  marketList: document.querySelector("#marketList"),
  marketStatus: document.querySelector("#marketStatus"),
  hostAccessSection: document.querySelector("#hostAccessSection"),
  roomAccessSummary: document.querySelector("#roomAccessSummary"),
  pendingPlayersList: document.querySelector("#pendingPlayersList"),
  voiceToggle: document.querySelector("#voiceToggle"),
  readLatestButton: document.querySelector("#readLatestButton"),
  stopVoiceButton: document.querySelector("#stopVoiceButton"),
  voiceSelect: document.querySelector("#voiceSelect"),
  voiceRate: document.querySelector("#voiceRate"),
  voicePitch: document.querySelector("#voicePitch"),
  ambienceToggle: document.querySelector("#ambienceToggle"),
  ambienceStop: document.querySelector("#ambienceStop"),
  ambienceMaster: document.querySelector("#ambienceMaster"),
  ambienceMusic: document.querySelector("#ambienceMusic"),
  ambienceEnvironment: document.querySelector("#ambienceEnvironment"),
  soundscapeLabel: document.querySelector("#soundscapeLabel"),
  soundscapeReason: document.querySelector("#soundscapeReason"),
  soundscapeLayers: document.querySelector("#soundscapeLayers"),
  characterWallet: document.querySelector("#characterWallet"),
  characterAvatar: document.querySelector("#characterAvatar"),
  characterMeta: document.querySelector("#characterMeta"),
  characterName: document.querySelector("#characterName"),
  characterVitals: document.querySelector("#characterVitals"),
  characterProgressSummary: document.querySelector("#characterProgressSummary"),
  equipmentSummary: document.querySelector("#equipmentSummary"),
  spellList: document.querySelector("#spellList"),
  inventoryList: document.querySelector("#inventoryList"),
  inventoryDetail: document.querySelector("#inventoryDetail"),
  inventoryStatus: document.querySelector("#inventoryStatus"),
  memoForm: document.querySelector("#memoForm"),
  memoText: document.querySelector("#memoText"),
  memoStatus: document.querySelector("#memoStatus"),
  starterSpellCards: document.querySelector("#starterSpellCards")
};

const ambienceEngine = createAmbienceEngine({ onStateChange: syncAmbienceControls });

applyLanguage(uiLanguage);
ensureSetupGuidance();
ensureAudioStatusDock();
bindAuthControls();
bindRoomAccessControls();
bindPointBudget();
bindBuilderCards();
layerPlayerMenuControls();
bindTableStateStrip();
bindLogDensityToggle();
bindGuide();
bindDrawers();
bindLanguageControls();
bindVoiceControls();
bindAmbienceControls();
bindRewardToast();
bindCharacterDrawer();
bindMarketDrawer();
bindHostAccessControls();
bindActionModeControls();
restoreAuthSession();

els.createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(els.createForm);
  const accessMode = String(form.get("accessMode") || "open");
  const roomPassword = String(form.get("roomPassword") || "").trim();
  if (accessMode === "password" && !roomPassword) {
    showCreateStatus("access.passwordRequired");
    els.createForm.elements.roomPassword?.focus();
    return;
  }
  showCreateStatus("");
  const submitButton = els.createForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  try {
    const body = {
      title: form.get("title"),
      tone: form.get("tone"),
      language: form.get("language") || uiLanguage,
      accessMode,
      system: "d20-lite"
    };
    if (accessMode === "password") {
      body.roomPassword = roomPassword;
    }
    const result = await api("/api/rooms", {
      method: "POST",
      body
    });
    hostToken = result.session?.hostToken || "";
    if (hostToken) {
      localStorage.setItem("aidm.hostToken", hostToken);
      saveRoomHostSession(result.room.id, hostToken);
    }
    openRoom(result.room);
  } catch (error) {
    showCreateStatus("", localizedErrorMessage(error));
  } finally {
    submitButton.disabled = false;
  }
});

els.joinByIdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const roomId = new FormData(els.joinByIdForm).get("roomId");
  const result = await api(`/api/rooms/${encodeURIComponent(roomId)}`);
  openRoom(result.room);
});

els.joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!room) return;
  const form = new FormData(els.joinForm);
  const playerName = String(form.get("playerName") || "").trim();
  const playerNameInput = els.joinForm.elements.playerName;
  const roomPasswordInput = els.joinForm.elements.roomPassword;
  if (!playerName) {
    showJoinStatus("join.nameRequired");
    playerNameInput?.setAttribute("aria-invalid", "true");
    playerNameInput?.focus();
    return;
  }
  playerNameInput?.removeAttribute("aria-invalid");
  roomPasswordInput?.removeAttribute("aria-invalid");
  showJoinStatus("");
  try {
    const result = await api(`/api/rooms/${room.id}/join`, {
      method: "POST",
      body: {
        playerName,
        characterName: String(form.get("characterName") || "").trim(),
        archetype: form.get("archetype"),
        species: form.get("species"),
        classId: form.get("classId"),
        roomPassword: String(form.get("roomPassword") || "").trim(),
        stats: {
          body: form.get("body"),
          agility: form.get("agility"),
          mind: form.get("mind"),
          presence: form.get("presence"),
          spirit: form.get("spirit")
        }
      }
    });
    if (result.pendingPlayer) {
      pendingPlayerId = result.session?.pendingPlayerId || result.pendingPlayer.id;
      pendingPlayerToken = result.session?.playerToken || "";
      saveRoomPendingSession(room.id, pendingPlayerId, pendingPlayerToken);
      showJoinStatus("join.pending");
      openRoom(roomWithPendingPlayer(result.room, result.pendingPlayer));
      return;
    }
    playerId = result.player.id;
    playerToken = result.session?.playerToken || "";
    localStorage.setItem("aidm.playerId", playerId);
    if (playerToken) {
      localStorage.setItem("aidm.playerToken", playerToken);
    }
    saveRoomPlayerSession(room.id, playerId, playerToken);
    clearRoomPendingSession(room.id);
    els.joinForm.reset();
    openRoom(result.room);
  } catch (error) {
    showJoinStatus("", localizedErrorMessage(error));
    if (error?.code === "ROOM_PASSWORD_REQUIRED" || error?.code === "ROOM_PASSWORD_INVALID") {
      roomPasswordInput?.setAttribute("aria-invalid", "true");
      roomPasswordInput?.focus();
    }
  }
});

els.startButton.addEventListener("click", async () => {
  if (!room) return;
  const result = await api(`/api/rooms/${room.id}/start`, {
    method: "POST",
    body: hostToken ? { hostToken } : {}
  });
  openRoom(result.room);
});

els.replayButton.addEventListener("click", async () => {
  if (!room || els.replayButton.getAttribute("aria-busy") === "true") return;
  const requestId = ++replayBuildRequestId;
  const roomId = room.id;
  closeRewardToast();
  els.replayButton.disabled = true;
  els.replayButton.setAttribute("aria-busy", "true");
  if (els.replaySummary) {
    els.replaySummary.textContent = t(uiLanguage, "button.resolvingAction");
    els.replaySummary.dataset.replayState = "building";
  }
  try {
    const result = await withRealtimePaused(() => api(`/api/rooms/${roomId}/replay`, { timeoutMs: REPLAY_REQUEST_TIMEOUT_MS }));
    if (requestId === replayBuildRequestId && room?.id === roomId) {
      renderReplay(result.replay);
    }
  } catch (error) {
    if (requestId === replayBuildRequestId && els.replaySummary) {
      els.replaySummary.textContent = localizedErrorMessage(error);
      els.replaySummary.dataset.replayState = "error";
    }
  } finally {
    if (requestId === replayBuildRequestId) {
      els.replayButton.disabled = false;
      els.replayButton.setAttribute("aria-busy", "false");
    }
  }
});

els.actionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.actionError.textContent = "";
  const localPlayer = getLocalPlayer();
  if (!room || !localPlayer || !playerId || !playerToken) {
    els.actionError.textContent = t(uiLanguage, "action.noPlayerSubmitError");
    syncActionModeControls();
    return;
  }
  const form = new FormData(els.actionForm);
  const intent = form.get("intent");
  const path = intent === "chat" ? "chat" : "action";
  const actionText = String(form.get("text") || "").trim();
  if (!actionText) {
    els.actionError.textContent = t(uiLanguage, intent === "chat" ? "error.chatRequired" : "error.actionRequired");
    els.actionForm.elements.text?.focus();
    return;
  }
  const submitButton = els.actionForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  els.actionForm.dataset.submitState = "sending";
  submitButton.textContent = t(uiLanguage, intent === "chat" ? "button.sendingChat" : "button.resolvingAction");
  try {
    const payload = {
      playerId,
      playerToken,
      text: actionText,
      expectedVersion: room.version
    };
    if (intent === "chat") {
      payload.channel = form.get("channel") || "public";
      payload.factionId = getLocalPlayer()?.factionId || "party";
    } else {
      payload.mode = form.get("mode");
    }
    const roomId = room.id;
    const result = await withRealtimePaused(() => api(`/api/rooms/${roomId}/${path}`, {
      method: "POST",
      timeoutMs: ACTION_REQUEST_TIMEOUT_MS,
      body: payload
    }));
    els.actionForm.reset();
    syncActionModeControls();
    openRoom(result.room);
  } catch (error) {
    els.actionError.textContent = localizedErrorMessage(error);
  } finally {
    submitButton.disabled = false;
    submitButton.setAttribute("aria-busy", "false");
    delete els.actionForm.dataset.submitState;
    syncActionModeControls();
  }
});

const urlRoomId = new URL(location.href).searchParams.get("room");
if (urlRoomId) {
  api(`/api/rooms/${encodeURIComponent(urlRoomId)}`).then((result) => openRoom(result.room)).catch(() => {});
}
drawLoop();

function openRoom(nextRoom) {
  nextRoom = normalizeClientRoom(nextRoom);
  const isNewRoom = nextRoom.id !== activeRoomId;
  restoreRoomHostSession(nextRoom);
  restoreRoomPlayerSession(nextRoom);
  room = nextRoom;
  activeRoomId = room.id;
  if (isNewRoom) {
    primeSpeechHistory(room);
    selectedInventoryItemId = "";
    lastRenderedRollEventId = "";
    marketOffers = [];
    lastReplay = null;
    lastSceneSignature = "";
  }
  if (room.language && room.language !== uiLanguage) {
    applyLanguage(room.language);
  }
  syncReplaySummary();
  history.replaceState(null, "", `?room=${room.id}`);
  els.gateway.classList.add("hidden");
  els.table.classList.remove("hidden");
  document.body.classList.add("table-active");
  if (shouldUseEventStream(room)) {
    connectEvents(room.id);
  } else {
    closeRealtimeSource();
    setConnectionStatus("status.live");
  }
  render();
}

function normalizeClientRoom(nextRoom = {}) {
  const access = nextRoom.access || {
    mode: "open",
    passwordProtected: false,
    hostApprovalRequired: false,
    pendingCount: 0
  };
  const protectedLobby = Boolean(access.passwordProtected || access.hostApprovalRequired) && !Array.isArray(nextRoom.players);
  const protectedScene = protectedLobby ? protectedLobbyScene(access) : null;
  return {
    ...nextRoom,
    _clientProtectedLobby: protectedLobby,
    id: nextRoom.id || activeRoomId || "",
    title: nextRoom.title || t(uiLanguage, "room.protectedTitle"),
    phase: nextRoom.phase || "lobby",
    round: Number(nextRoom.round || 1),
    players: Array.isArray(nextRoom.players) ? nextRoom.players : [],
    pendingPlayers: Array.isArray(nextRoom.pendingPlayers) ? nextRoom.pendingPlayers : [],
    turnOrder: Array.isArray(nextRoom.turnOrder) ? nextRoom.turnOrder : [],
    memories: Array.isArray(nextRoom.memories) ? nextRoom.memories : [],
    transcript: Array.isArray(nextRoom.transcript) ? nextRoom.transcript : [],
    rewards: Array.isArray(nextRoom.rewards) ? nextRoom.rewards : [],
    factions: Array.isArray(nextRoom.factions) ? nextRoom.factions : [],
    market: nextRoom.market || { offers: [] },
    combat: nextRoom.combat || { state: "scouting" },
    scene: nextRoom.scene || protectedScene || fallbackScene(),
    access
  };
}

function protectedLobbyScene(access = {}) {
  const mode = access.mode || "open";
  return {
    location: t(uiLanguage, "room.protectedLocation"),
    objective: mode === "password"
      ? t(uiLanguage, "room.passwordObjective")
      : t(uiLanguage, "room.approvalObjective"),
    ambience: t(uiLanguage, "room.protectedAmbience"),
    threat: 0,
    clocks: { danger: 0, clues: 0 },
    exits: []
  };
}

function fallbackScene() {
  return {
    location: t(uiLanguage, "state.scene"),
    objective: t(uiLanguage, "state.objective"),
    ambience: "",
    threat: 0,
    clocks: { danger: 0, clues: 0 },
    exits: []
  };
}

function roomWithPendingPlayer(nextRoom, pendingPlayer) {
  if (!pendingPlayer) return nextRoom;
  const pendingPlayers = Array.isArray(nextRoom?.pendingPlayers)
    ? nextRoom.pendingPlayers
    : [];
  if (pendingPlayers.some((entry) => entry.id === pendingPlayer.id)) {
    return nextRoom;
  }
  return {
    ...nextRoom,
    pendingPlayers: [...pendingPlayers, pendingPlayer]
  };
}

function saveRoomPlayerSession(roomId, nextPlayerId, nextPlayerToken) {
  if (!roomId || !nextPlayerId) return;
  localStorage.setItem(roomPlayerIdKey(roomId), nextPlayerId);
  if (nextPlayerToken) {
    localStorage.setItem(roomPlayerTokenKey(roomId), nextPlayerToken);
  }
}

function restoreRoomPlayerSession(nextRoom) {
  if (!nextRoom?.id) return;
  const storedPendingPlayerId = localStorage.getItem(roomPendingPlayerIdKey(nextRoom.id)) || "";
  const storedPendingPlayerToken = localStorage.getItem(roomPendingPlayerTokenKey(nextRoom.id)) || "";
  const storedPlayerId = localStorage.getItem(roomPlayerIdKey(nextRoom.id)) || "";
  const storedPlayerToken = localStorage.getItem(roomPlayerTokenKey(nextRoom.id)) || "";
  if (storedPendingPlayerId && nextRoom.players?.some((player) => player.id === storedPendingPlayerId)) {
    playerId = storedPendingPlayerId;
    playerToken = storedPendingPlayerToken;
    localStorage.setItem("aidm.playerId", playerId);
    if (playerToken) {
      localStorage.setItem("aidm.playerToken", playerToken);
    }
    saveRoomPlayerSession(nextRoom.id, playerId, playerToken);
    clearRoomPendingSession(nextRoom.id);
    return;
  }
  if (nextRoom.players?.some((player) => player.id === playerId)) {
    saveRoomPlayerSession(nextRoom.id, playerId, playerToken);
    clearRoomPendingSession(nextRoom.id);
    return;
  }

  if (storedPlayerId && nextRoom.players?.some((player) => player.id === storedPlayerId)) {
    playerId = storedPlayerId;
    playerToken = storedPlayerToken;
    localStorage.setItem("aidm.playerId", playerId);
    if (playerToken) {
      localStorage.setItem("aidm.playerToken", playerToken);
    } else {
      localStorage.removeItem("aidm.playerToken");
    }
    return;
  }

  const pending = (nextRoom.pendingPlayers || []).find((entry) => entry.id === storedPendingPlayerId);
  if (pending?.status === "pending") {
    pendingPlayerId = storedPendingPlayerId;
    pendingPlayerToken = storedPendingPlayerToken;
    playerId = "";
    playerToken = "";
    localStorage.removeItem("aidm.playerId");
    localStorage.removeItem("aidm.playerToken");
    return;
  }

  if (nextRoom._clientProtectedLobby) {
    if (storedPendingPlayerId && storedPendingPlayerToken) {
      pendingPlayerId = storedPendingPlayerId;
      pendingPlayerToken = storedPendingPlayerToken;
      playerId = "";
      playerToken = "";
      localStorage.removeItem("aidm.playerId");
      localStorage.removeItem("aidm.playerToken");
      return;
    }
    if (storedPlayerId && storedPlayerToken) {
      playerId = storedPlayerId;
      playerToken = storedPlayerToken;
      localStorage.setItem("aidm.playerId", playerId);
      localStorage.setItem("aidm.playerToken", playerToken);
      return;
    }
  }

  if (storedPendingPlayerId && pending?.status && pending.status !== "pending") {
    clearRoomPendingSession(nextRoom.id);
  }
  playerId = "";
  playerToken = "";
}

function roomPlayerIdKey(roomId) {
  return `${ROOM_SESSION_PREFIX}${roomId}.playerId`;
}

function roomPlayerTokenKey(roomId) {
  return `${ROOM_SESSION_PREFIX}${roomId}.playerToken`;
}

function saveRoomPendingSession(roomId, nextPendingPlayerId, nextPendingPlayerToken) {
  if (!roomId || !nextPendingPlayerId) return;
  pendingPlayerId = nextPendingPlayerId;
  pendingPlayerToken = nextPendingPlayerToken || "";
  localStorage.setItem(roomPendingPlayerIdKey(roomId), pendingPlayerId);
  if (pendingPlayerToken) {
    localStorage.setItem(roomPendingPlayerTokenKey(roomId), pendingPlayerToken);
  }
}

function clearRoomPendingSession(roomId) {
  pendingPlayerId = "";
  pendingPlayerToken = "";
  if (!roomId) return;
  localStorage.removeItem(roomPendingPlayerIdKey(roomId));
  localStorage.removeItem(roomPendingPlayerTokenKey(roomId));
}

function roomPendingPlayerIdKey(roomId) {
  return `${ROOM_SESSION_PREFIX}${roomId}.pendingPlayerId`;
}

function roomPendingPlayerTokenKey(roomId) {
  return `${ROOM_SESSION_PREFIX}${roomId}.pendingPlayerToken`;
}

function saveRoomHostSession(roomId, nextHostToken) {
  if (!roomId || !nextHostToken) return;
  localStorage.setItem(roomHostTokenKey(roomId), nextHostToken);
}

function restoreRoomHostSession(nextRoom) {
  if (!nextRoom?.id) return;
  const storedHostToken = localStorage.getItem(roomHostTokenKey(nextRoom.id)) || "";
  if (storedHostToken) {
    hostToken = storedHostToken;
    localStorage.setItem("aidm.hostToken", hostToken);
  }
}

function roomHostTokenKey(roomId) {
  return `${ROOM_SESSION_PREFIX}${roomId}.hostToken`;
}

function connectEvents(roomId) {
  if (!roomId) return;
  if (room?.id === roomId && !shouldUseEventStream(room)) {
    closeRealtimeSource();
    setConnectionStatus("status.live");
    return;
  }
  if (realtimePauseDepth > 0) {
    pendingRealtimeRoomId = roomId;
    setConnectionStatus("status.reconnecting");
    return;
  }
  if (eventSource && eventSourceRoomId === roomId && eventSource.readyState !== EventSource.CLOSED) {
    return;
  }
  if (eventSource) {
    closeRealtimeSource();
  }
  eventSource = new EventSource(`/api/rooms/${roomId}/events`);
  eventSourceRoomId = roomId;
  const generation = ++eventSourceGeneration;
  eventSource.addEventListener("open", () => {
    if (generation !== eventSourceGeneration || eventSourceRoomId !== roomId) return;
    setConnectionStatus("status.live");
  });
  eventSource.addEventListener("snapshot", (event) => {
    if (generation !== eventSourceGeneration || eventSourceRoomId !== roomId) return;
    const nextRoom = JSON.parse(event.data);
    restoreRoomPlayerSession(nextRoom);
    room = nextRoom;
    render();
  });
  eventSource.addEventListener("error", () => {
    if (generation !== eventSourceGeneration || eventSourceRoomId !== roomId) return;
    setConnectionStatus("status.reconnecting");
  });
}

function closeRealtimeSource() {
  if (eventSource) {
    eventSource.close();
  }
  eventSource = null;
  eventSourceRoomId = "";
  eventSourceGeneration += 1;
}

async function withRealtimePaused(task) {
  const reconnectRoomId = room?.id || activeRoomId || "";
  realtimePauseDepth += 1;
  if (realtimePauseDepth === 1) {
    closeRealtimeSource();
  }
  try {
    return await task();
  } finally {
    realtimePauseDepth = Math.max(0, realtimePauseDepth - 1);
    if (realtimePauseDepth === 0) {
      const nextRoomId = pendingRealtimeRoomId || (room?.id === reconnectRoomId ? reconnectRoomId : "");
      pendingRealtimeRoomId = "";
      if (nextRoomId && room?.id === nextRoomId) {
        connectEvents(nextRoomId);
      }
    }
  }
}

function setConnectionStatus(statusKey) {
  const key = statusKey || "status.offline";
  if (els.connectionStatus) {
    els.connectionStatus.dataset.statusKey = key;
    els.connectionStatus.textContent = t(uiLanguage, key);
  }
  if (els.syncDock) {
    els.syncDock.textContent = t(uiLanguage, key);
  }
  syncTableStateSummary();
}

function render() {
  if (!room) return;
  applyLanguage(room.language || uiLanguage, { rerender: false });
  els.roomTitle.textContent = room.title;
  els.roundBadge.textContent = t(uiLanguage, "round", { round: room.round });
  els.sceneLocation.textContent = room.scene.location;
  els.sceneObjective.textContent = room.scene.objective;
  document.querySelector("#threatMeter").value = room.scene.clocks?.danger ?? room.scene.threat ?? 0;
  document.querySelector("#clueMeter").value = room.scene.clocks?.clues ?? Math.min(5, (room.memories || []).length);
  const active = room.players.find((player) => player.id === room.activePlayerId);
  const localPlayer = getLocalPlayer();
  const hasPlayerBinding = hasLocalPlayerBinding();
  const showPlayerSetup = shouldShowPlayerSetup(room, hasPlayerBinding);
  const showPlaySurface = shouldShowTablePlaySurface(room, hasPlayerBinding);
  const sceneSignature = sceneGuidanceSignature(room);
  const sceneChanged = Boolean(lastSceneSignature && sceneSignature && sceneSignature !== lastSceneSignature);
  lastSceneSignature = sceneSignature;
  els.table.dataset.phase = room.phase || "lobby";
  els.table.classList.toggle("in-play", showPlaySurface);
  els.table.classList.toggle("setup-open", showPlayerSetup);
  els.table.classList.toggle("protected-entry", showPlayerSetup && isProtectedRoomAccess(room));
  els.turnBadge.textContent = active ? t(uiLanguage, "activeTurn", { name: active.character.name }) : t(uiLanguage, "noActiveTurn");
  els.turnDock.textContent = els.turnBadge.textContent;
  els.roundDock.textContent = t(uiLanguage, "round", { round: room.round });
  els.encounterDock.textContent = localizeEncounterState(room.combat?.state || "scouting");
  syncSceneClockLabels();
  setConnectionStatus(els.connectionStatus.dataset.statusKey || "status.offline");
  els.startButton.disabled = room.phase !== "lobby" || room.players.length === 0 || !canManageRoom();
  els.playerSetupPanel?.classList.toggle("hidden", !showPlayerSetup);
  els.transcriptPanel?.classList.toggle("hidden", !showPlaySurface);
  syncSetupGuidance(showPlayerSetup);
  syncRoomAccessControls(showPlayerSetup);
  syncPendingAccessRefresh();
  renderTurnFocus(active, localPlayer, hasPlayerBinding, sceneChanged);
  els.myCharacterButton.disabled = !hasPlayerBinding;
  if (els.marketButton) els.marketButton.disabled = !hasPlayerBinding;
  syncActionModeControls();
  renderPlayerSummaryDock(hasPlayerBinding ? localPlayer : null);
  syncAudioStatusDock();
  syncTableStateSummary();

  renderRoster(active);
  renderPartyStatus(active);
  renderCharacterDrawer();
  renderMarketDrawer();
  renderDicePanel();
  renderTranscript();
  renderStateSummary();
  renderHostAccessControls();
  renderEncounter();
  renderRewards();
  renderStage(sceneChanged);
  renderAmbience();
  renderCombatBrief();
}

function renderRoster(active) {
  els.roster.innerHTML = "";
  for (const player of room.players) {
    const row = document.createElement("div");
    row.className = `player-row ${player.id === active?.id ? "active" : ""}`;
    row.innerHTML = `
      <div class="player-row-head">
        ${avatarMarkup(player, "roster-avatar")}
        <div>
          <strong>${escapeHtml(player.character.name)}</strong>
          <span>${escapeHtml(player.name)} / ${escapeHtml(localizedSpeciesName(player.character))} ${escapeHtml(localizedClassName(player.character))}</span>
        </div>
      </div>
      <div class="roster-vitals">
        ${vitalMeterMarkup("hp", player.character.hp, player.character.maxHp, t(uiLanguage, "vital.hp"))}
        ${vitalMeterMarkup("mp", player.character.mana, player.character.maxMana, t(uiLanguage, "vital.mp"))}
      </div>
      <div class="roster-stat-row">
        <span>${escapeHtml(t(uiLanguage, "vital.defense"))} ${escapeHtml(player.character.defense ?? 0)}</span>
        <span>${escapeHtml(t(uiLanguage, "vital.initiative"))} ${escapeHtml(player.character.initiative || 0)}</span>
        <span>${escapeHtml(t(uiLanguage, "statsLine", { body: player.character.stats?.body || 0, agility: player.character.stats?.agility || 0, mind: player.character.stats?.mind || 0, presence: player.character.stats?.presence || 0, spirit: player.character.stats?.spirit || 0 }))}</span>
      </div>
    `;
    els.roster.append(row);
  }
}

function renderPartyStatus(active) {
  if (!els.partyStatusBar) return;
  els.partyStatusBar.innerHTML = "";
  els.partyStatusBar.dataset.count = String(room.players.length);
  if (!room.players.length) {
    const empty = document.createElement("button");
    empty.className = "party-status-empty";
    empty.type = "button";
    empty.dataset.drawerOpen = "party";
    empty.textContent = t(uiLanguage, "party.empty");
    empty.addEventListener("click", () => openDrawer("party", empty));
    els.partyStatusBar.append(empty);
    return;
  }
  for (const player of room.players) {
    const chip = document.createElement("button");
    const isActive = player.id === active?.id;
    const isLocal = hasLocalPlayerBinding() && player.id === playerId;
    const character = player.character || {};
    const hp = Number(character.hp ?? 0);
    const maxHp = Number(character.maxHp ?? 0);
    const mana = Number(character.mana ?? 0);
    const maxMana = Number(character.maxMana ?? 0);
    const healthState = partyVitalState(hp, maxHp);
    const manaState = partyVitalState(mana, maxMana);
    const statusTags = [
      isActive ? { kind: "active", label: t(uiLanguage, "party.activeTurn") } : null,
      isLocal ? { kind: "you", label: t(uiLanguage, "party.you") } : null,
      healthState === "critical" ? { kind: "critical", label: t(uiLanguage, "party.critical") } : null,
      healthState === "wounded" ? { kind: "wounded", label: t(uiLanguage, "party.wounded") } : null,
      manaState === "critical" ? { kind: "low-mana", label: t(uiLanguage, "party.lowMana") } : null
    ].filter(Boolean).slice(0, 3);
    const primaryStatus = statusTags[0]?.label || t(uiLanguage, "party.ready");
    chip.type = "button";
    chip.className = `party-status-card ${isActive ? "active" : ""} ${isLocal ? "local-player" : ""}`;
    chip.dataset.turnStatus = isActive ? "active" : "waiting";
    chip.dataset.health = healthState;
    chip.dataset.mana = manaState;
    chip.setAttribute("aria-label", t(uiLanguage, "party.statusAria", {
      name: character.name,
      role: localizedClassName(character),
      hp,
      maxHp,
      mana,
      maxMana
    }));
    chip.title = `${character.name || player.name} · ${primaryStatus} · ${t(uiLanguage, "party.vitals", { hp, maxHp, mana, maxMana })}`;
    chip.addEventListener("click", () => {
      if (player.id === playerId) {
        openDrawer("character", chip);
      } else {
        openDrawer("party", chip);
      }
    });
    chip.innerHTML = `
      ${avatarMarkup(player, "party-avatar")}
      <span class="party-status-copy">
        <strong>${escapeHtml(character.name)}</strong>
        <span class="party-status-subline">
          <span>${escapeHtml(localizedClassName(character))}</span>
          ${statusTags.map((tag) => `<em class="party-status-tag" data-party-tag="${escapeHtml(tag.kind)}">${escapeHtml(tag.label)}</em>`).join("")}
        </span>
        <span class="party-status-vitals">${escapeHtml(t(uiLanguage, "party.vitals", { hp, maxHp, mana, maxMana }))}</span>
      </span>
      ${vitalMeterMarkup("hp", hp, maxHp, t(uiLanguage, "vital.hp"))}
      ${vitalMeterMarkup("mp", mana, maxMana, t(uiLanguage, "vital.mp"))}
    `;
    els.partyStatusBar.append(chip);
  }
}

function partyVitalState(value, max) {
  if (!Number.isFinite(max) || max <= 0) return "steady";
  const ratio = Math.max(0, Math.min(1, Number(value || 0) / max));
  if (ratio <= 0.28) return "critical";
  if (ratio <= 0.55) return "wounded";
  return "steady";
}

function renderPlayerSummaryDock(player = getLocalPlayer()) {
  if (!els.playerSummaryDock) return;
  if (!player) {
    els.playerSummaryDock.textContent = t(uiLanguage, "character.noCharacter");
    return;
  }
  const character = player.character || {};
  const level = character.level ?? character.progression?.level ?? 1;
  const xp = character.xp ?? character.progression?.xp ?? 0;
  const slots = equipmentSlotSummary(character.inventory || [], character.equipmentSummary);
  els.playerSummaryDock.textContent = t(uiLanguage, "character.summaryLine", {
    level,
    xp,
    equipment: slots.compact
  });
  syncTableStateSummary();
}

function syncTableStateSummary() {
  if (!els.stateStripHeadline || !els.stateStripMeta) return;
  const turn = els.turnDock?.textContent || t(uiLanguage, "noActiveTurn");
  const round = els.roundDock?.textContent || t(uiLanguage, "round", { round: room?.round || 1 });
  const encounter = els.encounterDock?.textContent || localizeEncounterState(room?.combat?.state || "scouting");
  const sync = els.syncDock?.textContent || t(uiLanguage, "status.offline");
  const audio = els.audioStatusDock?.textContent || t(uiLanguage, "ambience.waiting");
  const details = [round, encounter, sync, audio].filter(Boolean).join(" · ");
  els.stateStripHeadline.textContent = turn;
  els.stateStripMeta.textContent = t(uiLanguage, "state.details");
  els.tableStateToggle?.setAttribute("aria-label", `${turn}. ${details}. ${t(uiLanguage, "state.details")}`);
  els.tableStateToggle?.setAttribute("title", details);
}

function sceneGuidanceSignature(nextRoom = room) {
  if (!nextRoom?.scene) return "";
  return [
    nextRoom.scene.location,
    nextRoom.scene.objective,
    nextRoom.scene.clocks?.danger ?? nextRoom.scene.threat ?? "",
    nextRoom.scene.clocks?.clues ?? ""
  ].map((value) => String(value ?? "")).join("::");
}

function renderTurnFocus(active, localPlayer, hasPlayerBinding, sceneChanged = false) {
  if (!els.turnFocus || !els.turnFocusLabel || !els.turnFocusContext) return;
  const location = room?.scene?.location || t(uiLanguage, "state.scene");
  const objective = room?.scene?.objective || t(uiLanguage, "state.objective");
  const context = t(uiLanguage, "turnCue.sceneContext", { location, objective });
  let owner = "no-active";
  let message = t(uiLanguage, "turnCue.noActive");
  let nextStep = t(uiLanguage, "turnCue.next.noActive");
  if (!hasPlayerBinding) {
    owner = "no-local";
    message = t(uiLanguage, "turnCue.noLocal", { location });
    nextStep = t(uiLanguage, "turnCue.next.noLocal");
  } else if (active) {
    const activeName = active.character?.name || active.name || t(uiLanguage, "state.player");
    if (localPlayer?.id === active.id) {
      owner = "local";
      message = t(uiLanguage, "turnCue.yourTurn", { name: activeName });
      nextStep = t(uiLanguage, "turnCue.next.local");
    } else {
      owner = "other";
      message = t(uiLanguage, "turnCue.otherTurn", { name: activeName });
      nextStep = t(uiLanguage, "turnCue.next.other", { name: activeName });
    }
  }
  els.turnFocus.dataset.turnOwner = owner;
  els.turnFocus.dataset.sceneShifted = String(Boolean(sceneChanged));
  els.turnFocusLabel.textContent = message;
  els.turnFocusContext.textContent = sceneChanged
    ? `${t(uiLanguage, "turnCue.sceneShifted")} · ${context}`
    : context;
  if (els.turnFocusSteps) {
    els.turnFocusSteps.textContent = nextStep;
  }
  els.turnFocus.setAttribute("aria-label", `${message} ${nextStep} ${els.turnFocusContext.textContent}`);
  els.turnFocus.title = els.turnFocusContext.textContent;
  if (els.actionForm) {
    els.actionForm.dataset.turnOwner = owner;
  }
}

function ensureSetupGuidance() {
  if (els.setupGuidance || !els.playerSetupPanel) return els.setupGuidance;
  const guidance = document.createElement("p");
  guidance.id = "setupGuidance";
  guidance.className = "setup-guidance";
  guidance.setAttribute("role", "status");
  guidance.setAttribute("aria-live", "polite");
  const form = els.playerSetupPanel.querySelector("#joinForm");
  if (form) {
    els.playerSetupPanel.insertBefore(guidance, form);
  } else {
    els.playerSetupPanel.append(guidance);
  }
  els.setupGuidance = guidance;
  syncSetupGuidance();
  return guidance;
}

function syncSetupGuidance(showSetup = !hasLocalPlayerBinding()) {
  const guidance = ensureSetupGuidance();
  if (!guidance) return;
  guidance.classList.toggle("hidden", !showSetup);
  const pending = getLocalPendingPlayer();
  if (pending?.status === "pending") {
    guidance.textContent = t(uiLanguage, "setup.guidance.pending");
    return;
  }
  if (room?.access?.passwordProtected) {
    guidance.textContent = t(uiLanguage, "setup.guidance.password");
    return;
  }
  if (room?.access?.hostApprovalRequired) {
    guidance.textContent = t(uiLanguage, "setup.guidance.approval");
    return;
  }
  if (room?.phase && room.phase !== "lobby") {
    guidance.textContent = t(uiLanguage, "setup.guidance.playing");
    return;
  }
  const speciesId = els.joinForm?.elements?.species?.value || "human";
  const classId = els.joinForm?.elements?.classId?.value || "warrior";
  const ready = els.pointBudget?.classList.contains("ready");
  guidance.textContent = t(uiLanguage, "setup.guidance", {
    species: t(uiLanguage, `species.${speciesId}`),
    className: t(uiLanguage, `class.${classId}`),
    readiness: t(uiLanguage, ready ? "setup.ready" : "setup.adjustBudget")
  });
}

function ensureAudioStatusDock() {
  if (els.audioStatusDock || !els.tableStateStrip) return els.audioStatusDock;
  const card = document.createElement("article");
  card.id = "audioStatusDockCard";
  card.innerHTML = `
    <span id="audioStatusLabel">${escapeHtml(t(uiLanguage, "state.audio"))}</span>
    <strong id="audioStatusDock">--</strong>
  `;
  els.tableStateStrip.append(card);
  els.audioStatusLabel = card.querySelector("#audioStatusLabel");
  els.audioStatusDock = card.querySelector("#audioStatusDock");
  syncAudioStatusDock();
  return els.audioStatusDock;
}

function syncAudioStatusDock() {
  const dock = ensureAudioStatusDock();
  if (!dock) return;
  const label = room?.soundscape ? localizeSoundscape(room.soundscape) : t(uiLanguage, "ambience.waiting");
  const reason = room?.soundscape ? localizeSoundscapeReason(room.soundscape) : t(uiLanguage, "ambience.waiting");
  const audioState = canUseAudio()
    ? t(uiLanguage, ambienceEngine.enabled ? "ambience.state.on" : "ambience.state.off")
    : t(uiLanguage, "ambience.unsupported");
  if (els.audioStatusLabel) {
    els.audioStatusLabel.textContent = t(uiLanguage, "state.audio");
  }
  dock.textContent = canUseAudio()
    ? t(uiLanguage, ambienceEngine.enabled ? "ambience.status.on" : "ambience.status.off", { soundscape: label })
    : t(uiLanguage, "ambience.unsupported");
  dock.title = reason;
  dock.setAttribute("aria-label", t(uiLanguage, "ambience.status.aria", {
    state: audioState,
    soundscape: label,
    reason
  }));
  els.table?.setAttribute("data-audio-enabled", String(Boolean(canUseAudio() && ambienceEngine.enabled)));
  syncTableStateSummary();
}

function bindAuthControls() {
  if (!els.authForm) return;
  els.authForm.addEventListener("submit", submitAuthForm);
  for (const button of els.authModeButtons || []) {
    button.addEventListener("click", () => setAuthMode(button.dataset.authModeButton || "login"));
  }
  els.logoutButton?.addEventListener("click", logoutCurrentUser);
  setAuthMode(authMode);
  syncAuthControls();
}

async function submitAuthForm(event) {
  event.preventDefault();
  const form = new FormData(els.authForm);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  if (!email || !password) {
    showAuthStatus("auth.credentialsRequired");
    return;
  }
  const submitButton = els.authSubmitButton || els.authForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  showAuthStatus("auth.working");
  try {
    const body = { email, password };
    if (authMode === "register") {
      body.displayName = String(form.get("displayName") || "").trim();
    }
    const result = await api(authMode === "register" ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      auth: false,
      body
    });
    saveAuthSession(result);
    showAuthStatus(authMode === "register" ? "auth.registered" : "auth.loggedIn");
    els.authForm.elements.password.value = "";
    if (room) render();
  } catch (error) {
    showAuthStatus("", localizedErrorMessage(error));
  } finally {
    submitButton.disabled = false;
    submitButton.setAttribute("aria-busy", "false");
  }
}

async function logoutCurrentUser() {
  const token = authSessionToken;
  try {
    if (token) {
      await api("/api/auth/logout", {
        method: "POST",
        body: { sessionToken: token }
      });
    }
  } catch {
    // Local logout should still clear stale browser state if the session is already gone.
  }
  clearAuthSession();
  showAuthStatus("auth.loggedOut");
  if (room) render();
}

async function restoreAuthSession() {
  if (!authSessionToken) {
    syncAuthControls();
    return;
  }
  showAuthStatus("auth.checking");
  try {
    const result = await api("/api/auth/session");
    saveAuthSession({ user: result.user, session: { sessionToken: authSessionToken } });
    showAuthStatus("auth.restored");
    if (room) render();
  } catch {
    clearAuthSession({ preserveStatus: true });
    showAuthStatus("auth.sessionExpired");
  }
}

function saveAuthSession(result = {}) {
  authSessionToken = result.session?.sessionToken || authSessionToken || "";
  currentUser = result.user || currentUser || null;
  if (authSessionToken) {
    localStorage.setItem(AUTH_SESSION_KEY, authSessionToken);
  }
  if (currentUser) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  }
  syncAuthControls();
}

function clearAuthSession({ preserveStatus = false } = {}) {
  authSessionToken = "";
  currentUser = null;
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  syncAuthControls();
  if (!preserveStatus) {
    showAuthStatus("");
  }
}

function readStoredCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch {
    return null;
  }
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  syncAuthControls();
}

function syncAuthControls() {
  const signedIn = Boolean(currentUser && authSessionToken);
  const displayName = currentUser?.displayName || currentUser?.email || t(uiLanguage, "auth.guest");
  for (const status of [els.authStatusText, els.tableAuthStatus].filter(Boolean)) {
    status.dataset.authState = signedIn ? "signed-in" : "guest";
    status.textContent = signedIn ? displayName : t(uiLanguage, "auth.guest");
    status.title = signedIn ? currentUser.email || displayName : t(uiLanguage, "auth.guestTitle");
  }
  if (els.authForm) {
    els.authForm.dataset.authMode = authMode;
  }
  els.authDisplayNameField?.classList.toggle("hidden", authMode !== "register");
  const passwordInput = els.authForm?.elements?.password;
  if (passwordInput) {
    passwordInput.autocomplete = authMode === "register" ? "new-password" : "current-password";
  }
  for (const button of els.authModeButtons || []) {
    const active = button.dataset.authModeButton === authMode;
    button.setAttribute("aria-pressed", String(active));
    button.classList.toggle("secondary-button", active);
    button.classList.toggle("ghost-button", !active);
  }
  if (els.authSubmitButton) {
    els.authSubmitButton.textContent = t(uiLanguage, authMode === "register" ? "button.register" : "button.login");
  }
  els.logoutButton?.classList.toggle("hidden", !signedIn);
}

function showAuthStatus(key, fallback = "") {
  if (!els.authStatus) return;
  els.authStatus.dataset.statusKey = key || "";
  els.authStatus.textContent = key ? t(uiLanguage, key) : fallback;
}

function bindRoomAccessControls() {
  els.createAccessMode?.addEventListener("change", syncCreateAccessControls);
  syncCreateAccessControls();
}

function syncCreateAccessControls() {
  const mode = els.createAccessMode?.value || "open";
  const passwordField = els.createRoomPasswordField;
  const passwordInput = passwordField?.querySelector("input");
  passwordField?.classList.toggle("hidden", mode !== "password");
  if (passwordInput) {
    passwordInput.required = mode === "password";
  }
  if (els.createAccessHint) {
    const key = mode === "password"
      ? "access.passwordHint"
      : mode === "host-approval"
        ? "access.hostApprovalHint"
        : "access.openHint";
    els.createAccessHint.dataset.statusKey = key;
    els.createAccessHint.textContent = t(uiLanguage, key);
  }
}

function showCreateStatus(key, fallback = "") {
  if (!els.createStatus) return;
  els.createStatus.dataset.statusKey = key || "";
  els.createStatus.textContent = key ? t(uiLanguage, key) : fallback;
}

function syncRoomAccessControls(showSetup = !hasLocalPlayerBinding()) {
  const passwordRequired = Boolean(room?.access?.passwordProtected);
  const approvalRequired = Boolean(room?.access?.hostApprovalRequired);
  const pending = getLocalPendingPlayer();
  const passwordField = els.joinRoomPasswordField;
  const passwordInput = passwordField?.querySelector("input");
  const submitButton = els.joinForm?.querySelector("button[type='submit']");
  if (els.playerSetupPanel) {
    els.playerSetupPanel.dataset.accessMode = room?.access?.mode || "open";
    els.playerSetupPanel.dataset.accessState = pending?.status === "pending"
      ? "pending"
      : passwordRequired
        ? "password-required"
        : approvalRequired
          ? "approval-required"
          : "open";
  }
  passwordField?.classList.toggle("hidden", !passwordRequired);
  if (passwordInput) {
    passwordInput.required = passwordRequired && showSetup && !pending;
  }
  if (submitButton) {
    submitButton.disabled = Boolean(pending?.status === "pending");
    submitButton.textContent = t(uiLanguage, pending?.status === "pending"
      ? "button.pendingApproval"
      : approvalRequired
        ? "button.requestApproval"
        : "button.joinTable");
  }
  if (pending?.status === "pending") {
    showJoinStatus("join.pending");
  } else if (approvalRequired && showSetup) {
    showJoinStatus("join.approvalRequired");
  } else if (passwordRequired && showSetup) {
    showJoinStatus("join.passwordRequired");
  } else if (els.joinStatus?.dataset.statusKey && ["join.pending", "join.approvalRequired", "join.passwordRequired"].includes(els.joinStatus.dataset.statusKey)) {
    showJoinStatus("");
  }
}

function getLocalPendingPlayer(nextRoom = room) {
  if (!nextRoom) return null;
  const stored = getStoredPendingSession(nextRoom.id);
  const localPendingId = stored.id || pendingPlayerId;
  if (!localPendingId) return null;
  const pending = (nextRoom.pendingPlayers || []).find((entry) => entry.id === localPendingId);
  if (pending) return pending;
  if (isProtectedMinimalRoom(nextRoom) && stored.token) {
    return {
      id: localPendingId,
      status: "pending",
      playerName: "",
      characterName: ""
    };
  }
  return null;
}

function syncPendingAccessRefresh() {
  if (!needsProtectedAccessRefresh()) {
    clearPendingAccessPoll();
    return;
  }
  if (pendingAccessPollTimer) return;
  const delay = getLocalPendingPlayer()?.status === "pending" ? 2500 : 5000;
  pendingAccessPollTimer = window.setTimeout(async () => {
    pendingAccessPollTimer = null;
    if (!needsProtectedAccessRefresh()) return;
    try {
      const result = await api(`/api/rooms/${encodeURIComponent(room.id)}`);
      openRoom(result.room);
    } catch {
      syncPendingAccessRefresh();
    }
  }, delay);
}

function clearPendingAccessPoll() {
  if (!pendingAccessPollTimer) return;
  window.clearTimeout(pendingAccessPollTimer);
  pendingAccessPollTimer = null;
}

function bindHostAccessControls() {
  els.pendingPlayersList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-pending-action]");
    if (!button || !room) return;
    const pendingId = button.dataset.pendingId || "";
    const decision = button.dataset.pendingAction;
    if (!pendingId || !["approve", "reject"].includes(decision)) return;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      const body = hostToken ? { hostToken } : {};
      const result = await api(`/api/rooms/${room.id}/pending/${encodeURIComponent(pendingId)}/${decision}`, {
        method: "POST",
        body
      });
      openRoom(result.room);
    } catch (error) {
      if (els.roomAccessSummary) {
        els.roomAccessSummary.textContent = localizedErrorMessage(error);
      }
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
    }
  });
}

function renderHostAccessControls() {
  if (!els.hostAccessSection || !els.pendingPlayersList || !els.roomAccessSummary) return;
  const canManage = canManageRoom();
  els.hostAccessSection.classList.toggle("hidden", !room || !canManage);
  if (!room || !canManage) {
    els.pendingPlayersList.innerHTML = "";
    return;
  }
  const access = room.access || { mode: "open", pendingCount: 0 };
  els.roomAccessSummary.textContent = t(uiLanguage, "access.summary", {
    mode: accessModeLabel(access.mode),
    count: String(access.pendingCount || 0)
  });
  const pending = (room.pendingPlayers || []).filter((entry) => entry.status === "pending");
  if (!pending.length) {
    els.pendingPlayersList.innerHTML = `<p class="pending-empty">${escapeHtml(t(uiLanguage, "access.noPending"))}</p>`;
    return;
  }
  els.pendingPlayersList.innerHTML = pending.map((entry) => `
    <article class="pending-player-card" data-pending-player-id="${escapeHtml(entry.id)}">
      <div>
        <strong>${escapeHtml(entry.characterName || entry.playerName)}</strong>
        <span>${escapeHtml(entry.playerName || "")} / ${escapeHtml(t(uiLanguage, `class.${entry.classId || "warrior"}`))}</span>
      </div>
      <div class="pending-player-actions">
        <button class="secondary-button compact-button" type="button" data-pending-action="approve" data-pending-id="${escapeHtml(entry.id)}" data-i18n="button.approve">Approve</button>
        <button class="ghost-button compact-button" type="button" data-pending-action="reject" data-pending-id="${escapeHtml(entry.id)}" data-i18n="button.reject">Reject</button>
      </div>
    </article>
  `).join("");
}

function canManageRoom(nextRoom = room) {
  if (!nextRoom) return false;
  const ownsRoom = Boolean(currentUser?.id && (nextRoom.ownerUserId === currentUser.id || nextRoom.host?.userId === currentUser.id));
  return Boolean(ownsRoom || hostToken || localStorage.getItem(roomHostTokenKey(nextRoom.id)));
}

function isProtectedRoomAccess(nextRoom = room) {
  return Boolean(nextRoom?.access?.passwordProtected || nextRoom?.access?.hostApprovalRequired);
}

function isProtectedMinimalRoom(nextRoom = room) {
  return Boolean(nextRoom?._clientProtectedLobby && isProtectedRoomAccess(nextRoom));
}

function shouldShowPlayerSetup(nextRoom = room, hasPlayerBinding = hasLocalPlayerBinding()) {
  if (!nextRoom) return false;
  return !hasPlayerBinding;
}

function shouldShowTablePlaySurface(nextRoom = room, hasPlayerBinding = hasLocalPlayerBinding()) {
  if (!nextRoom) return false;
  return hasPlayerBinding;
}

function shouldUseEventStream(nextRoom = room) {
  return Boolean(nextRoom?.id && !isProtectedRoomAccess(nextRoom));
}

function getStoredPendingSession(roomId) {
  if (!roomId) {
    return { id: pendingPlayerId, token: pendingPlayerToken };
  }
  return {
    id: localStorage.getItem(roomPendingPlayerIdKey(roomId)) || pendingPlayerId || "",
    token: localStorage.getItem(roomPendingPlayerTokenKey(roomId)) || pendingPlayerToken || ""
  };
}

function hasStoredPendingSession(roomId) {
  const stored = getStoredPendingSession(roomId);
  return Boolean(stored.id && stored.token);
}

function hasStoredPlayerSession(roomId) {
  if (!roomId) return Boolean(playerId && playerToken);
  return Boolean(localStorage.getItem(roomPlayerIdKey(roomId)) && localStorage.getItem(roomPlayerTokenKey(roomId)));
}

function needsProtectedAccessRefresh() {
  if (!room?.id || !isProtectedRoomAccess(room)) return false;
  return Boolean(hasStoredPendingSession(room.id) || hasLocalPlayerBinding() || hasStoredPlayerSession(room.id) || canManageRoom(room));
}

function accessModeLabel(mode = "open") {
  const normalized = String(mode || "open");
  if (normalized === "password") return t(uiLanguage, "access.password");
  if (normalized === "host-approval") return t(uiLanguage, "access.hostApproval");
  return t(uiLanguage, "access.open");
}

function renderCharacterDrawer() {
  const player = getLocalPlayer();
  if (!els.characterName) return;
  if (!player) {
    els.characterWallet.textContent = `0 ${t(uiLanguage, "currency.cr")}`;
    els.characterAvatar.style.backgroundImage = "";
    els.characterAvatar.textContent = "?";
    els.characterMeta.textContent = t(uiLanguage, "character.unseated");
    els.characterName.textContent = t(uiLanguage, "character.joinPrompt");
    els.characterVitals.innerHTML = "";
    if (els.characterProgressSummary) els.characterProgressSummary.innerHTML = "";
    if (els.equipmentSummary) els.equipmentSummary.innerHTML = "";
    if (els.spellList) els.spellList.innerHTML = "";
    els.inventoryList.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "inventory.empty"))}</div>`;
    els.inventoryDetail.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "inventory.selectPrompt"))}</div>`;
    if (els.memoText && document.activeElement !== els.memoText) {
      els.memoText.value = "";
    }
    clearInventoryFeedback();
    return;
  }

  const character = player.character;
  els.characterWallet.textContent = `${Number(character.wallet || 0)} ${t(uiLanguage, "currency.cr")}`;
  applyAvatar(els.characterAvatar, player);
  els.characterMeta.textContent = `${localizedSpeciesName(character)} / ${localizedClassName(character)}`;
  els.characterName.textContent = character.name;
  els.characterVitals.innerHTML = `
    ${vitalCardMarkup("hp", character.hp, character.maxHp, t(uiLanguage, "vital.hp"))}
    ${vitalCardMarkup("mp", character.mana, character.maxMana, t(uiLanguage, "vital.mp"))}
    <article><span>${escapeHtml(t(uiLanguage, "vital.defense"))}</span><strong>${escapeHtml(character.defense ?? 0)}</strong></article>
    <article><span>${escapeHtml(t(uiLanguage, "vital.initiative"))}</span><strong>${escapeHtml(character.initiative ?? 0)}</strong></article>
  `;
  renderCharacterProgress(character);
  renderEquipmentSummary(character.inventory || [], character.equipmentSummary);
  renderKnownSpells(character);
  renderInventory(character.inventory || []);
  if (els.memoText && document.activeElement !== els.memoText) {
    els.memoText.value = character.memo || "";
  }
  syncInventoryFeedback();
}

function renderCharacterProgress(character) {
  if (!els.characterProgressSummary) return;
  const level = character.level ?? character.progression?.level ?? 1;
  const xp = character.xp ?? character.progression?.xp ?? 0;
  const nextXp = character.nextLevelXp ?? character.progression?.nextLevelXp ?? level * 100;
  const percent = Math.max(0, Math.min(100, Math.round((Number(xp) / Math.max(1, Number(nextXp))) * 100)));
  els.characterProgressSummary.innerHTML = `
    <article>
      <span>${escapeHtml(t(uiLanguage, "character.level"))}</span>
      <strong>${escapeHtml(level)}</strong>
    </article>
    <article>
      <span>${escapeHtml(t(uiLanguage, "character.xp"))}</span>
      <strong>${escapeHtml(`${xp}/${nextXp}`)}</strong>
      <span class="vital-bar xp" aria-label="${escapeHtml(t(uiLanguage, "character.xp"))} ${escapeHtml(`${xp}/${nextXp}`)}"><span style="width: ${percent}%"></span></span>
    </article>
  `;
}

function renderEquipmentSummary(inventory, equipmentSummary = null) {
  if (!els.equipmentSummary) return;
  const slots = equipmentSlotSummary(inventory, equipmentSummary);
  els.equipmentSummary.innerHTML = `
    <span class="audio-kicker">${escapeHtml(t(uiLanguage, "character.equipmentSlots"))}</span>
    <div>
      ${slots.items.map((slot) => `
        <article>
          <span>${escapeHtml(slot.label)}</span>
          <strong>${escapeHtml(slot.value)}</strong>
        </article>
      `).join("")}
    </div>
  `;
}

function renderKnownSpells(character) {
  if (!els.spellList) return;
  const spells = [...new Set([...(character.knownSpells || []), ...(character.spells || [])])];
  if (!spells.length) {
    els.spellList.innerHTML = "";
    return;
  }
  els.spellList.innerHTML = `
    <span class="audio-kicker">${escapeHtml(t(uiLanguage, "character.spells"))}</span>
    <div>${spells.map((spell) => {
      const label = formatSpellName(spell);
      return `<span>${spellArtMarkup(spell, label, "spell-chip-art")}<em>${escapeHtml(label)}</em></span>`;
    }).join("")}</div>
  `;
}

function renderInventory(inventory) {
  els.inventoryList.innerHTML = "";
  if (!inventory.length) {
    els.inventoryList.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "inventory.empty"))}</div>`;
    els.inventoryDetail.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "inventory.selectPrompt"))}</div>`;
    selectedInventoryItemId = "";
    return;
  }

  const selectedStillExists = inventory.some((item) => item.id === selectedInventoryItemId);
  if (!selectedStillExists) {
    selectedInventoryItemId = "";
  }

  for (const item of inventory) {
    const definition = inventoryDefinition(item);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `inventory-item-button ${item.id === selectedInventoryItemId ? "active" : ""}`;
    button.dataset.itemId = item.id;
    button.innerHTML = `
      ${itemArtMarkup(item, definition, "inventory-item-art")}
      <span>
        <strong>${escapeHtml(definition.label)}</strong>
        <small>${escapeHtml(definition.categoryLabel)}</small>
      </span>
      <em>${escapeHtml(inventoryListValueLabel(item))}</em>
    `;
    els.inventoryList.append(button);
  }

  const selected = inventory.find((item) => item.id === selectedInventoryItemId);
  if (!selected) {
    els.inventoryDetail.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "inventory.selectPrompt"))}</div>`;
    return;
  }
  renderInventoryDetail(selected);
}

function renderInventoryDetail(item) {
  const definition = inventoryDefinition(item);
  const actionState = inventoryActionState(item, definition);
  const canUse = actionState.use.available;
  const canEquip = actionState.equip.available;
  const isCurrentlyEquipped = isCurrentEquipmentItem(item, definition);
  const canTrade = item?.tradeable !== false;
  const canSell = actionState.sell.available;
  const equipDisabled = !canEquip || isCurrentlyEquipped;
  const useHelp = inventoryActionButtonLabel("use", item, definition, actionState.use);
  const equipHelp = inventoryActionButtonLabel("equip", item, definition, actionState.equip, isCurrentlyEquipped);
  const sellHelp = inventoryActionButtonLabel("sell", item, definition, actionState.sell);
  els.inventoryDetail.innerHTML = `
    <div class="inventory-detail-card">
      <div class="inventory-detail-head">
        ${itemArtMarkup(item, definition, "inventory-detail-art")}
        <div>
          <span class="audio-kicker">${escapeHtml(definition.categoryLabel)}</span>
          <h4>${escapeHtml(definition.label)}</h4>
        </div>
      </div>
      <p>${escapeHtml(definition.description || t(uiLanguage, "inventory.noDescription"))}</p>
      <dl>
        <div><dt>${escapeHtml(t(uiLanguage, "inventory.condition"))}</dt><dd>${escapeHtml(inventoryConditionLabel(item))}</dd></div>
        <div><dt>${escapeHtml(t(uiLanguage, "inventory.rarity"))}</dt><dd>${escapeHtml(inventoryRarityLabel(item, definition))}</dd></div>
        <div><dt>${escapeHtml(inventoryValueRoleLabel(item))}</dt><dd>${escapeHtml(inventoryValueLabel(item))}</dd></div>
        <div><dt>${escapeHtml(inventorySellValueRoleLabel(item))}</dt><dd>${escapeHtml(inventorySellValueLabel(item, canSell))}</dd></div>
        <div><dt>${escapeHtml(t(uiLanguage, "inventory.tradeable"))}</dt><dd>${escapeHtml(t(uiLanguage, canTrade ? "common.yes" : "common.no"))}</dd></div>
        <div><dt>${escapeHtml(t(uiLanguage, "inventory.sellable"))}</dt><dd>${escapeHtml(t(uiLanguage, canSell ? "common.yes" : "common.no"))}</dd></div>
        <div><dt>${escapeHtml(t(uiLanguage, "inventory.usable"))}</dt><dd>${escapeHtml(t(uiLanguage, canUse ? "common.yes" : "common.no"))}</dd></div>
      </dl>
      ${inventoryActionHintMarkup(item, definition, actionState, isCurrentlyEquipped)}
      <div class="inventory-actions">
        <button type="button" data-item-action="equip" aria-label="${escapeHtml(equipHelp)}" title="${escapeHtml(equipHelp)}" ${equipDisabled ? "disabled" : ""}>${escapeHtml(t(uiLanguage, "button.equipItem"))}</button>
        <button type="button" data-item-action="use" aria-label="${escapeHtml(useHelp)}" title="${escapeHtml(useHelp)}" ${canUse ? "" : "disabled"}>${escapeHtml(t(uiLanguage, "button.useItem"))}</button>
        <button type="button" class="ghost-button" data-item-action="sell" aria-label="${escapeHtml(sellHelp)}" title="${escapeHtml(sellHelp)}" ${canSell ? "" : "disabled"}>${escapeHtml(t(uiLanguage, "button.sellItem"))}</button>
      </div>
    </div>
  `;
}

function inventoryActionState(item, definition = inventoryDefinition(item)) {
  const actions = item?.actions || {};
  const slot = item?.slot || definition.slot;
  const canUse = actions.use?.available ?? Boolean(item?.usable);
  const canSell = actions.sell?.available ?? isInventoryItemSellable(item);
  const canEquip = actions.equip?.available ?? Boolean(slot);
  return {
    use: {
      available: Boolean(canUse),
      reason: canUse ? "" : inventoryUnavailableReason("use", item, definition, actions.use)
    },
    sell: {
      available: Boolean(canSell),
      reason: canSell ? "" : inventoryUnavailableReason("sell", item, definition, actions.sell)
    },
    equip: {
      available: Boolean(canEquip),
      reason: canEquip ? "" : inventoryUnavailableReason("equip", item, definition, actions.equip)
    }
  };
}

function inventoryUnavailableReason(action, item, definition = inventoryDefinition(item), actionState = item?.actions?.[action]) {
  const backendReason = actionReasonLabel(actionState);
  if (backendReason) return backendReason;
  if (action === "use") {
    return t(uiLanguage, isToolLikeItem(item, definition) ? "inventory.reason.toolNarrativeUse" : "inventory.reason.noDirectUse");
  }
  if (action === "equip") {
    return t(uiLanguage, isToolLikeItem(item, definition) ? "inventory.reason.toolNotEquipped" : "inventory.reason.notEquippable");
  }
  if (action === "sell") {
    return t(uiLanguage, item?.tradeable === false ? "inventory.reason.notTradeable" : "inventory.reason.notSellable");
  }
  return "";
}

function actionReasonLabel(actionState = {}) {
  return localizeTextValue(actionState?.reasonLabel)
    || localizeTextValue(actionState?.label)
    || localizeTextValue(actionState?.reasonText)
    || localizeTextValue(actionState?.help)
    || "";
}

function inventoryActionHintMarkup(item, definition, actionState, isCurrentlyEquipped) {
  const rows = [
    {
      label: t(uiLanguage, "inventory.action.use"),
      available: actionState.use.available,
      text: actionState.use.available
        ? inventoryUseAvailableCopy(item, definition)
        : actionState.use.reason
    },
    {
      label: t(uiLanguage, "inventory.action.equip"),
      available: actionState.equip.available && !isCurrentlyEquipped,
      text: actionState.equip.available
        ? (isCurrentlyEquipped ? t(uiLanguage, "inventory.reason.alreadyEquipped") : t(uiLanguage, "inventory.hint.equipSlot", { slot: inventorySlotLabel(item, definition) }))
        : actionState.equip.reason
    },
    {
      label: t(uiLanguage, "inventory.action.sell"),
      available: actionState.sell.available,
      text: actionState.sell.available
        ? t(uiLanguage, "inventory.hint.sellValue", { value: inventorySellValueLabel(item, true) })
        : actionState.sell.reason
    }
  ];
  return `
    <div class="inventory-action-hints" data-inventory-action-hints>
      ${rows.map((row) => `
        <p data-action-state="${row.available ? "available" : "blocked"}"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.text)}</span></p>
      `).join("")}
    </div>
  `;
}

function inventoryUseAvailableCopy(item, definition = inventoryDefinition(item)) {
  const effect = inventoryUseEffectLabel(item, definition);
  if (effect) return t(uiLanguage, "inventory.hint.useEffect", { effect });
  return t(uiLanguage, "inventory.hint.useAvailable");
}

function inventoryActionButtonLabel(action, item, definition, state, isCurrentlyEquipped = false) {
  const itemName = definition?.label || t(uiLanguage, "inventory.item");
  if (action === "equip" && isCurrentlyEquipped) {
    return t(uiLanguage, "inventory.actionAriaBlocked.equip", { item: itemName, reason: t(uiLanguage, "inventory.reason.alreadyEquipped") });
  }
  if (!state.available) {
    return t(uiLanguage, `inventory.actionAriaBlocked.${action}`, { item: itemName, reason: state.reason });
  }
  const detail = action === "equip"
    ? t(uiLanguage, "inventory.hint.equipSlot", { slot: inventorySlotLabel(item, definition) })
    : action === "sell"
      ? t(uiLanguage, "inventory.hint.sellValue", { value: inventorySellValueLabel(item, true) })
      : inventoryUseAvailableCopy(item, definition);
  return t(uiLanguage, `inventory.actionAria.${action}`, { item: itemName, detail });
}

function inventoryActionBusyKey(action) {
  return {
    use: "button.usingItem",
    equip: "button.equippingItem",
    sell: "button.sellingItem"
  }[action] || "button.usingItem";
}

function inventoryUseEffectLabel(item, definition = inventoryDefinition(item)) {
  return item?.useEffectLabel
    || localizeTextValue(item?.toolUse?.label)
    || item?.definitionSnapshot?.useEffectLabel
    || localizeTextValue(item?.definitionSnapshot?.toolUse?.label)
    || item?.definition?.useEffectLabel
    || localizeTextValue(item?.definition?.toolUse?.label)
    || definition?.useEffectLabel
    || definition?.toolUseLabel
    || "";
}

function inventorySellValueLabel(item, canSell = isInventoryItemSellable(item)) {
  if (!canSell) return t(uiLanguage, "inventory.notSellable");
  const backendLabel = item?.saleValueLabel || item?.sellValueLabel || "";
  if (backendLabel && isCurrentCurrencyLabel(backendLabel)) return backendLabel;
  const saleValue = Number(item?.saleValue ?? item?.sellValue);
  if (Number.isFinite(saleValue) && saleValue > 0) return `${Math.floor(saleValue)} ${t(uiLanguage, "currency.cr")}`;
  const value = Number(item?.value);
  const fallback = Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value * 0.55)) : 0;
  return `${fallback} ${t(uiLanguage, "currency.cr")}`;
}

function inventorySlotLabel(item, definition = inventoryDefinition(item)) {
  const slot = item?.slot || definition.slot || "";
  if (definition.slotLabel) return definition.slotLabel;
  const labels = {
    mainHand: { en: "main hand", zh: "主手" },
    offHand: { en: "off hand", zh: "副手" },
    body: { en: "body", zh: "身体" },
    accessory: { en: "accessory", zh: "饰品" }
  };
  return localizeTextValue(labels[slot]) || t(uiLanguage, "inventory.item");
}

function isToolLikeItem(item, definition = inventoryDefinition(item)) {
  const text = [
    item?.itemId,
    definition.category,
    definition.categoryLabel,
    definition.label,
    definition.slot,
    ...(Array.isArray(item?.tags) ? item.tags : [])
  ].filter(Boolean).join(" ").toLowerCase();
  return /tool|kit|lamp|notebook|compass|rope|key|lockpick|工具|提灯|札记|罗盘|绳|钥匙/.test(text);
}

function renderMarketDrawer() {
  if (!els.marketList) return;
  const player = getLocalPlayer();
  syncMarketFeedback();
  els.marketList.setAttribute("aria-busy", String(marketLoading));
  if (els.marketWallet) {
    els.marketWallet.textContent = `${Number(player?.character?.wallet || 0)} ${t(uiLanguage, "currency.cr")}`;
  }
  if (!player) {
    els.marketList.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "market.joinPrompt"))}</div>`;
    return;
  }
  if (marketLoading) {
    els.marketList.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "market.loading"))}</div>`;
    return;
  }
  if (!marketOffers.length) {
    els.marketList.innerHTML = `<div class="inventory-empty">${escapeHtml(t(uiLanguage, "market.empty"))}</div>`;
    return;
  }
  const wallet = Number(player.character?.wallet || 0);
  els.marketList.innerHTML = "";
  for (const offer of marketOffers) {
    const definition = marketOfferDefinition(offer);
    const purchaseState = marketPurchaseState(offer, wallet);
    const buyLabel = marketBuyButtonLabel(definition, purchaseState);
    const statusLabel = marketOfferStatusLabel(purchaseState);
    const actionHint = purchaseState.canBuy ? marketOfferActionHint(offer, definition) : marketOfferBlockedHint(purchaseState.reason);
    const stockLabel = marketStockLabel(offer);
    const resaleLine = marketResaleLine(offer);
    const card = document.createElement("article");
    card.className = `market-card ${purchaseState.canBuy ? "" : "unaffordable"}`;
    card.dataset.purchaseState = purchaseState.reasonCode || (purchaseState.canBuy ? "available" : "unavailable");
    card.setAttribute("aria-label", marketOfferCardAriaLabel(definition, offer, statusLabel));
    card.setAttribute("aria-disabled", String(!purchaseState.canBuy));
    card.innerHTML = `
      <div class="market-card-main">
        ${itemArtMarkup(offer, definition, "market-item-art")}
        <div>
          <span class="audio-kicker">${escapeHtml(definition.categoryLabel)}</span>
          <strong>${escapeHtml(definition.label)}</strong>
          <p>${escapeHtml(definition.description || t(uiLanguage, "inventory.noDescription"))}</p>
          <p class="market-card-meta" data-market-card-meta>
            <span class="${purchaseState.canBuy ? "market-card-hint" : "market-card-status"}" data-market-card-status="${escapeHtml(statusLabel)}">${escapeHtml(actionHint)}</span>
            ${stockLabel ? `<span>${escapeHtml(stockLabel)}</span>` : ""}
          </p>
        </div>
      </div>
      <div class="market-card-buy">
        <span class="market-price" data-price-role="${escapeHtml(marketPriceRole(offer))}" title="${escapeHtml(`${marketPriceRoleLabel(offer)}: ${marketPriceLabel(offer)}`)}"><em>${escapeHtml(marketPriceRoleLabel(offer))}</em><strong>${escapeHtml(marketPriceLabel(offer))}</strong></span>
        ${resaleLine ? `<span class="market-price-secondary" data-price-role="${escapeHtml(resaleLine.role)}" title="${escapeHtml(resaleLine.title)}">${escapeHtml(resaleLine.label)}</span>` : ""}
        <button type="button" data-market-buy="${escapeHtml(offer.itemId)}" aria-label="${escapeHtml(buyLabel)}" title="${escapeHtml(buyLabel)}" ${purchaseState.canBuy ? "" : "disabled"}>${escapeHtml(t(uiLanguage, "button.buyItem"))}</button>
        ${purchaseState.reason ? `<span class="market-buy-reason">${escapeHtml(purchaseState.reason)}</span>` : ""}
      </div>
    `;
    els.marketList.append(card);
  }
}

function renderDicePanel() {
  if (!els.dicePanel || !els.dicePanelBody) return;
  const roller = els.dicePanel.querySelector(".dice-roller-animation");
  const latest = [...(room.transcript || [])].reverse().find((entry) => entry.type === "roll" && entry.roll);
  if (!latest) {
    clearDiceLandingTimer();
    lastRenderedRollEventId = "";
    els.dicePanel.classList.add("empty");
    els.dicePanel.classList.remove("rolling", "landing");
    els.dicePanel.dataset.rollState = "idle";
    delete els.dicePanel.dataset.outcome;
    delete els.dicePanel.dataset.rollTotal;
    delete els.dicePanel.dataset.rollExpression;
    if (roller) roller.dataset.final = "";
    els.dicePanelBody.innerHTML = `
      <span class="audio-kicker">${escapeHtml(t(uiLanguage, "dice.latest"))}</span>
      <strong>${escapeHtml(t(uiLanguage, "dice.waiting"))}</strong>
    `;
    return;
  }

  const roll = latest.roll;
  const rolls = Array.isArray(roll.rolls) ? roll.rolls : [];
  const successKey = roll.success ? "dice.success" : "dice.failure";
  const finalTotal = roll.total ?? "?";
  const finalTotalLabel = String(finalTotal);
  const rollExpression = roll.expression || "1d20";
  const rollList = rolls.join(", ") || finalTotalLabel;
  const margin = diceMarginLabel(roll);
  const currentRollEventId = rollEventKey(latest);
  els.dicePanel.classList.remove("empty");
  els.dicePanel.dataset.outcome = roll.success ? "success" : "failure";
  els.dicePanel.dataset.rollState = els.dicePanel.classList.contains("rolling") ? "rolling" : "landed";
  els.dicePanel.dataset.rollTotal = finalTotalLabel;
  els.dicePanel.dataset.rollExpression = rollExpression;
  if (roller) roller.dataset.final = finalTotalLabel;
  els.dicePanelBody.innerHTML = `
    <span class="audio-kicker">${escapeHtml(t(uiLanguage, "dice.latest"))}</span>
    <span class="dice-result-line" data-dice-result-line>
      <span class="dice-state-label" data-dice-state-copy>${escapeHtml(t(uiLanguage, "dice.landed"))}</span>
      <span class="dice-final-score" data-dice-final-score aria-label="${escapeHtml(t(uiLanguage, "dice.final", { total: finalTotalLabel }))}" title="${escapeHtml(t(uiLanguage, "dice.final", { total: finalTotalLabel }))}">${escapeHtml(finalTotalLabel)}</span>
    </span>
    <strong data-dice-outcome-copy>${escapeHtml(t(uiLanguage, successKey, { total: finalTotalLabel, dc: roll.dc ?? "?" }))}</strong>
    <p class="dice-detail-line" data-dice-detail>
      <span class="dice-expression">${escapeHtml(rollExpression)}</span>
      <span class="dice-rolls">${escapeHtml(t(uiLanguage, "dice.rolls", { rolls: rollList }))}</span>
      ${margin ? `<span class="dice-margin">${escapeHtml(margin)}</span>` : ""}
    </p>
  `;
  if (currentRollEventId && currentRollEventId !== lastRenderedRollEventId) {
    lastRenderedRollEventId = currentRollEventId;
    clearDiceLandingTimer();
    const stateCopy = els.dicePanelBody.querySelector("[data-dice-state-copy]");
    if (stateCopy) stateCopy.textContent = t(uiLanguage, "dice.rolling");
    els.dicePanel.dataset.rollState = "rolling";
    els.dicePanel.classList.remove("rolling", "landing");
    window.requestAnimationFrame(() => els.dicePanel.classList.add("rolling"));
    diceLandingTimer = window.setTimeout(() => {
      els.dicePanel.classList.remove("rolling");
      els.dicePanel.classList.add("landing");
      els.dicePanel.dataset.rollState = "landed";
      const latestStateCopy = els.dicePanelBody?.querySelector("[data-dice-state-copy]");
      if (latestStateCopy) latestStateCopy.textContent = t(uiLanguage, "dice.landed");
      diceLandingTimer = null;
    }, 680);
  } else if (!els.dicePanel.classList.contains("rolling")) {
    els.dicePanel.classList.add("landing");
    els.dicePanel.dataset.rollState = "landed";
  }
}

function diceMarginLabel(roll = {}) {
  const margin = Number.isFinite(Number(roll.margin)) ? Number(roll.margin) : Number(roll.total) - Number(roll.dc);
  if (!Number.isFinite(margin)) return "";
  const key = margin >= 0 ? "dice.margin.success" : "dice.margin.failure";
  return t(uiLanguage, key, { margin: Math.abs(margin) });
}

function rollEventKey(entry = {}) {
  if (entry.id) return String(entry.id);
  const roll = entry.roll || {};
  const rolls = Array.isArray(roll.rolls) ? roll.rolls.join(".") : "";
  return [
    entry.createdAt || "",
    roll.expression || "",
    roll.mode || "",
    roll.total ?? "",
    roll.dc ?? "",
    rolls
  ].join("|");
}

function clearDiceLandingTimer() {
  if (!diceLandingTimer) return;
  window.clearTimeout(diceLandingTimer);
  diceLandingTimer = null;
}

function renderTranscript() {
  const shouldPin = els.transcript.scrollTop + els.transcript.clientHeight >= els.transcript.scrollHeight - 80;
  const entries = room.transcript || [];
  logDensity = normalizeLogDensity(logDensity);
  const mainLimit = LOG_MAIN_LIMITS[logDensity] || LOG_MAIN_LIMITS.summary;
  syncLogDensityToggle();
  renderTranscriptEntries(els.transcript, entries.slice(-mainLimit), { density: logDensity, surface: "main" });
  renderTranscriptEntries(els.fullTranscript, entries, { density: logDensity, surface: "drawer" });
  if (els.logCount) {
    els.logCount.textContent = t(uiLanguage, "logEntries", { count: entries.length });
  }
  if (shouldPin) {
    els.transcript.scrollTop = els.transcript.scrollHeight;
  }
  speakNewTranscriptEntries();
}

function renderTranscriptEntries(container, entries, options = {}) {
  if (!container) return;
  container.dataset.logDensity = options.density || "comfortable";
  container.dataset.logSurface = options.surface || "drawer";
  container.innerHTML = "";
  for (const entry of entries) {
    const message = document.createElement("article");
    const channel = transcriptChannel(entry);
    message.className = `message ${entry.type}${channel ? ` channel-${channel}` : ""}`;
    message.dataset.logType = entry.type || "event";
    if (channel) {
      message.dataset.channel = channel;
    }
    const reward = entry.reward;
    const rewardFile = rewardArtFile(entry);
    const detail = transcriptDetailMarkup(entry);
    message.innerHTML = `
      <span class="meta">
        <span class="log-kind" data-log-kind="${escapeHtml(entry.type || "event")}">${escapeHtml(localizedTranscriptType(entry))}</span>
        <span>${escapeHtml(localizedTranscriptAuthor(entry))} / ${escapeHtml(formatTranscriptTime(entry.createdAt))}</span>
        ${channelBadgeMarkup(channel)}
      </span>
      ${rewardFile ? `<img class="message-asset" src="${escapeHtml(assetUrl(rewardFile))}" alt="${escapeHtml(localizeTextValue(reward?.displayName) || reward?.name || "")}" />` : ""}
      <p>${escapeHtml(entry.text)}</p>
      ${detail ? `<span class="message-detail">${escapeHtml(detail)}</span>` : ""}
    `;
    container.append(message);
  }
}

function localizedTranscriptType(entry = {}) {
  const key = `log.type.${entry.type || "event"}`;
  const label = t(uiLanguage, key);
  return label === key ? String(entry.type || "event") : label;
}

function transcriptDetailMarkup(entry = {}) {
  if (entry.roll) {
    const roll = entry.roll;
    return t(uiLanguage, "log.detail.roll", {
      expression: roll.expression || "1d20",
      total: roll.total ?? "?",
      dc: roll.dc ?? "?"
    });
  }
  if (entry.reward) {
    const item = localizeTextValue(entry.reward.displayName) || entry.reward.name || t(uiLanguage, "reward.item");
    return t(uiLanguage, "log.detail.reward", { item });
  }
  if (entry.economy) {
    return t(uiLanguage, "log.detail.economy", {
      action: localizeLogAction(entry.economy.action),
      turnCost: localizeLogAction(entry.economy.turnCost)
    });
  }
  if (entry.inventory) {
    return t(uiLanguage, "log.detail.inventory", {
      action: localizeLogAction(entry.inventory.action),
      item: localizeTextValue(entry.inventory.itemLabel) || entry.inventory.itemId || t(uiLanguage, "inventory.item")
    });
  }
  return "";
}

function localizeLogAction(value) {
  const key = `log.action.${value || "none"}`;
  const label = t(uiLanguage, key);
  return label === key ? String(value || "") : label;
}

function formatTranscriptTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  const locale = localeForLanguage(uiLanguage);
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: locale === "en-US"
  }).format(date);
}

function localeForLanguage(language) {
  return normalizeLanguage(language) === "zh" ? "zh-CN" : "en-US";
}

function transcriptChannel(entry) {
  if (entry?.type !== "chat") return "";
  if (entry.channel === "party" || entry.channel === "faction" || entry.visibility?.scope === "faction") return "party";
  return "public";
}

function channelBadgeMarkup(channel) {
  if (!channel) return "";
  const key = channel === "party" ? "channel.party" : "channel.public";
  return ` <span class="channel-badge" data-channel-badge="${escapeHtml(channel)}">${escapeHtml(t(uiLanguage, key))}</span>`;
}

function localizedTranscriptAuthor(entry = {}) {
  const author = String(entry.author || "").trim();
  const normalizedAuthor = author.toLowerCase();
  const authorKey = {
    aidm: "speaker.aidm",
    rules: "speaker.rules",
    table: "speaker.table"
  }[normalizedAuthor];
  const typeKey = entry.type ? `speaker.${entry.type}` : "";
  if (uiLanguage === "zh") {
    const key = authorKey || typeKey;
    const translated = key ? t(uiLanguage, key) : "";
    if (translated && translated !== key) return translated;
  }
  if (author) return author;
  if (typeKey) {
    const translated = t(uiLanguage, typeKey);
    if (translated !== typeKey) return translated;
  }
  return String(entry.type || "");
}

function renderEncounter() {
  const combat = room.combat || {};
  els.encounterState.textContent = localizeEncounterState(combat.state || "scouting");
  els.encounterList.innerHTML = "";
  for (const enemy of combat.encounter?.enemies || []) {
    const row = document.createElement("div");
    row.className = "enemy-row";
    row.innerHTML = `
      <strong>${escapeHtml(localizeEntityName(enemy))}</strong>
      <span>${escapeHtml(t(uiLanguage, "combatHpLine", { hp: enemy.hp, maxHp: enemy.maxHp, defense: enemy.defense, role: localizeCombatRole(enemy.role) }))}</span>
    `;
    els.encounterList.append(row);
  }
  if (combat.tacticalIntent) {
    const intent = document.createElement("div");
    intent.className = "tactic-row";
    intent.textContent = `${t(uiLanguage, "intent")}: ${localizeNpcAction(combat.tacticalIntent.type)} - ${localizeNpcReason(combat.tacticalIntent.reason)}`;
    els.encounterList.append(intent);
  }
  for (const entry of (combat.log || []).slice(-5).reverse()) {
    const row = document.createElement("div");
    const classes = combatLogClasses(entry);
    const result = combatResult(entry);
    const damage = combatDamageAmount(entry);
    row.className = `combat-row ${classes.join(" ")}`.trim();
    row.dataset.combatResult = result;
    row.dataset.combatAction = entry.action || "";
    if (damage !== null) {
      row.dataset.combatDamage = String(damage);
    }
    row.innerHTML = combatLogMarkup(entry);
    els.encounterList.append(row);
  }
}

function renderStateSummary() {
  if (!els.stateSummary || !els.stateChangeList) return;
  const summary = room.stateSummary || {};
  const beatLabel = localizeTextValue(summary.beat?.label) || summary.beat?.id || t(uiLanguage, "state.beat");
  if (els.stateBeat) {
    els.stateBeat.textContent = beatLabel;
    els.stateBeat.dataset.tone = summary.beat?.tone || "stable";
  }

  const clocks = summary.clocks || {};
  const quest = summary.quest;
  const cards = [
    {
      label: t(uiLanguage, "state.objective"),
      value: summary.objective || room.scene.objective,
      meter: null
    },
    {
      label: localizeTextValue(summary.clockLabels?.clues) || t(uiLanguage, "state.clues"),
      value: formatClock(clocks.clues),
      meter: clocks.clues
    },
    {
      label: localizeTextValue(summary.clockLabels?.danger) || t(uiLanguage, "state.threat"),
      value: formatClock(clocks.danger),
      meter: clocks.danger
    },
    {
      label: localizeTextValue(summary.clockLabels?.deadline) || t(uiLanguage, "state.deadline"),
      value: formatClock(clocks.deadline),
      meter: clocks.deadline
    },
    {
      label: t(uiLanguage, "state.quest"),
      value: quest ? `${localizeQuestTitle(quest)} · ${quest.progress}%` : t(uiLanguage, "state.noQuest"),
      meter: quest ? { value: quest.progress, max: 100 } : null
    }
  ];

  els.stateSummary.innerHTML = "";
  for (const card of cards) {
    const article = document.createElement("article");
    article.className = "state-summary-card";
    const meter = card.meter ? `<meter min="0" max="${escapeHtml(card.meter.max)}" value="${escapeHtml(card.meter.value)}"></meter>` : "";
    article.innerHTML = `
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      ${meter}
    `;
    els.stateSummary.append(article);
  }

  const latest = summary.latestChange || {};
  const scene = summary.scene || {};
  const media = summary.media || {};
  const blockedExit = scene.blockedExit;
  els.stateChangeList.innerHTML = "";
  els.stateChangeList.append(
    renderStateChangeItem(t(uiLanguage, "state.latest"), localizeTextValue(latest.label) || latest.type, localizeTextValue(latest.detail)),
    renderStateChangeItem(t(uiLanguage, "state.scene"), scene.location || room.scene.location, localizeShiftReason(scene.lastShiftReason || "opening-scene")),
    renderStateChangeItem(t(uiLanguage, "state.media"), localizeSoundscape(room.soundscape || {}) || media.soundscapeLabel, localizeSoundscapeReason(room.soundscape || {}))
  );
  if (blockedExit) {
    els.stateChangeList.append(renderStateChangeItem(t(uiLanguage, "state.routeHeld"), t(uiLanguage, "state.routeHeld"), localizeRouteBlock(blockedExit.reason)));
  }
  if (scene.exits?.length) {
    const item = document.createElement("div");
    item.className = "state-change-item state-exit-list";
    const exits = scene.exits.map((exit) => {
      const label = localizeTextValue(exit.label) || exit.target || exit.id;
      return `<span class="${exit.available ? "available" : "locked"}">${escapeHtml(label)}</span>`;
    }).join("");
    item.innerHTML = `<strong>${escapeHtml(t(uiLanguage, "state.exits"))}</strong><div>${exits}</div>`;
    els.stateChangeList.append(item);
  }
}

function renderStateChangeItem(label, value, detail = "") {
  const item = document.createElement("div");
  item.className = "state-change-item";
  item.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(String(value || ""))}</strong>
    ${detail ? `<small>${escapeHtml(String(detail))}</small>` : ""}
  `;
  return item;
}

function formatClock(clock) {
  if (!clock) return "0 / 6";
  return t(uiLanguage, "clock.value", { value: clock.value, max: clock.max });
}

function syncSceneClockLabels() {
  if (els.threatClockLabel) els.threatClockLabel.textContent = t(uiLanguage, "state.threat");
  if (els.clueClockLabel) els.clueClockLabel.textContent = t(uiLanguage, "state.clues");
}

function localizeRouteBlock(reason) {
  if (reason === "route-not-established") return t(uiLanguage, "state.routeNotEstablished");
  if (reason === "failed-check") return t(uiLanguage, "state.routeFailed");
  return String(reason || "");
}

function renderRewards() {
  const rewards = (room.transcript || []).filter((entry) => entry.type === "reward" && entry.reward).slice(-4).reverse();
  if (els.rewardCount) {
    els.rewardCount.textContent = t(uiLanguage, "reward.count", { count: rewards.length });
  }
  if (!els.rewardList) return;
  els.rewardList.innerHTML = "";
  if (rewards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "reward-empty";
    empty.textContent = t(uiLanguage, "reward.empty");
    els.rewardList.append(empty);
  }
  for (const entry of rewards) {
    els.rewardList.append(renderRewardCard(entry));
  }
  const latest = rewards[0];
  if (latest && !shownRewardEventIds.has(latest.id)) {
    showRewardToast(latest);
  }
}

function bindRewardToast() {
  els.rewardToastClose?.addEventListener("click", closeRewardToast);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.rewardToast?.classList.contains("hidden")) {
      closeRewardToast();
    }
  });
}

function showRewardToast(entry) {
  if (!els.rewardToast || !entry?.reward) return;
  const reward = entry.reward;
  const file = rewardArtFile(entry);
  shownRewardEventIds.add(entry.id);
  els.rewardToastTitle.textContent = localizeTextValue(reward.displayName) || reward.name || t(uiLanguage, "reward.item");
  els.rewardToastText.textContent = localizeTextValue(reward.description) || entry.text;
  if (file) {
    els.rewardToastImage.src = assetUrl(file);
    els.rewardToastImage.alt = localizeTextValue(reward.displayName) || reward.name || "";
    els.rewardToastImage.hidden = false;
  } else {
    els.rewardToastImage.hidden = true;
  }
  if (document.body.classList.contains("drawer-open")) {
    closeRewardToast();
    return;
  }
  els.rewardToast.classList.remove("hidden");
  els.rewardToast.setAttribute("aria-hidden", "false");
}

function closeRewardToast() {
  if (!els.rewardToast) return;
  els.rewardToast.classList.add("hidden");
  els.rewardToast.setAttribute("aria-hidden", "true");
}

function renderRewardCard(entry) {
  const reward = entry.reward || {};
  const card = document.createElement("article");
  card.className = "reward-card";
  const file = rewardArtFile(entry);
  const label = localizeTextValue(reward.displayName) || reward.name || t(uiLanguage, "reward.item");
  if (file) {
    const image = document.createElement("img");
    image.src = assetUrl(file);
    image.alt = label;
    card.append(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "reward-art-fallback";
    fallback.setAttribute("aria-hidden", "true");
    fallback.textContent = itemArtFallbackGlyph(label);
    card.append(fallback);
  }
  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = label;
  const body = document.createElement("span");
  body.textContent = localizeTextValue(reward.description) || entry.text;
  copy.append(title, body);
  card.append(copy);
  return card;
}

function renderReplay(replay) {
  lastReplay = replay || null;
  if (!replay) {
    els.replaySummary.textContent = t(uiLanguage, "noReport");
    els.replaySummary.dataset.replayState = "empty";
    return;
  }
  const chapters = replay.chapters || [];
  const highlights = replay.highlights || [];
  els.replaySummary.innerHTML = `
    <strong>${escapeHtml(replay.title)}</strong>
    <span>${escapeHtml(localizedReplayShareText(replay))}</span>
    <span>${escapeHtml(t(uiLanguage, "replayStats", { chapters: chapters.length, highlights: highlights.length, memories: replay.memoryCount || 0 }))}</span>
  `;
  els.replaySummary.dataset.replayState = "built";
}

function syncReplaySummary() {
  if (!els.replaySummary) return;
  if (lastReplay) {
    renderReplay(lastReplay);
    return;
  }
  els.replaySummary.textContent = t(uiLanguage, "noReport");
  els.replaySummary.dataset.replayState = "empty";
}

function localizedReplayShareText(replay) {
  if (uiLanguage !== "zh" && replay.shareText) return replay.shareText;
  const highlights = replay.highlights || [];
  const lead = localizeTextValue(highlights[0]?.localizedText)
    || highlights[0]?.text
    || localizeTextValue(replay.scene?.objective)
    || room?.scene?.objective
    || "";
  return t(uiLanguage, "replayShareText", {
    title: replay.title || room?.title || t(uiLanguage, "panel.replay"),
    players: replay.players?.length ?? room?.players?.length ?? 0,
    round: replay.round ?? room?.round ?? 0,
    lead
  });
}

function renderStage(sceneChanged = false) {
  if (!els.sceneBackdrop) return;
  const visualState = currentSceneVisualState();
  const asset = room.presentation?.sceneAsset;
  if (asset) {
    const description = assetDescription(asset);
    const sceneLabel = assetLabel(asset);
    els.sceneBackdrop.style.backgroundImage = cssUrl(assetUrl(asset.file));
    const backdropLabel = sceneLabel === t(uiLanguage, "stage.backdrop")
      ? t(uiLanguage, "stage.backdrop")
      : `${t(uiLanguage, "stage.backdrop")}: ${sceneLabel}`;
    els.sceneBackdrop.setAttribute("aria-label", backdropLabel);
    els.stage?.setAttribute("aria-label", `${t(uiLanguage, "stage.label")}: ${sceneLabel}`);
    if (els.sceneAssetDescription) {
      els.sceneAssetDescription.textContent = description;
      els.sceneAssetDescription.classList.toggle("hidden", !description);
    }
  } else {
    els.sceneBackdrop.style.backgroundImage = "";
    els.sceneBackdrop.setAttribute("aria-label", t(uiLanguage, "stage.backdrop"));
    els.stage?.setAttribute("aria-label", t(uiLanguage, "stage.label"));
    els.sceneAssetDescription?.classList.add("hidden");
  }
  els.table?.setAttribute("data-soundscape", room.soundscape?.id || "mystery");
  els.stage?.setAttribute("data-scene-pulse", String(Boolean(sceneChanged)));
  applySceneVisualState(visualState);
  renderSceneChangeSummary(sceneChanged);
  renderSceneVisualMeta(visualState);
}

function renderSceneChangeSummary(sceneChanged = false) {
  if (!els.sceneChangeSummary || !els.sceneChangeLabel || !els.sceneChangeDetail) return;
  const latest = room?.stateSummary?.latestChange || {};
  const scene = room?.stateSummary?.scene || {};
  const label = localizeTextValue(latest.label)
    || localizeShiftReason(scene.lastShiftReason || room?.scene?.lastShiftReason || "opening-scene")
    || t(uiLanguage, "stage.opening");
  const detail = localizeTextValue(latest.detail)
    || localizeSoundscapeReason(room?.soundscape || {})
    || t(uiLanguage, "ambience.waiting");
  els.sceneChangeSummary.dataset.changed = String(Boolean(sceneChanged));
  els.sceneChangeLabel.textContent = label;
  els.sceneChangeDetail.textContent = detail;
}

function currentSceneVisualState() {
  const candidates = [
    room?.soundscape?.sceneVisualState,
    room?.presentation?.sceneVisualState,
    room?.scene?.sceneVisualState,
    room?.sceneVisualState
  ];
  return candidates.find((candidate) => candidate && typeof candidate === "object") || null;
}

function applySceneVisualState(visualState) {
  if (!els.stage) return;
  const axes = visualState?.variantAxes || {};
  const weather = firstVisualAxis(axes.weather, "unknown");
  const season = firstVisualAxis(axes.season, "unseasoned");
  const rain = axes.rain || "none";
  const wind = axes.wind || "none";
  const thunder = sceneThunderLevel(axes.thunderChance);
  const motionHints = visualTokens(visualState?.motionHints);
  const overlayHints = visualTokens(visualState?.overlayHints);
  const variantKey = String(visualState?.variantKey || "");

  els.stage.dataset.sceneWeather = sceneDataToken(weather, "unknown");
  els.stage.dataset.sceneSeason = sceneDataToken(season, "unseasoned");
  els.stage.dataset.sceneRain = sceneDataToken(rain, "none");
  els.stage.dataset.sceneWind = sceneDataToken(wind, "none");
  els.stage.dataset.sceneThunder = thunder;
  els.stage.dataset.sceneMotion = motionHints.join(" ");
  els.stage.dataset.sceneOverlay = overlayHints.join(" ");
  els.stage.dataset.sceneVariantKey = variantKey;

  if (!els.sceneBackdrop) return;
  const seed = hashVisualVariant(variantKey || [weather, season, rain, wind, thunder].join("|"));
  const hue = (seed % 11) - 5;
  const seasonHue = season === "winter" ? -8 : season === "autumn" ? 5 : season === "spring" ? 3 : 0;
  const seasonSaturation = season === "winter" ? -0.12 : season === "summer" ? 0.08 : 0;
  els.sceneBackdrop.style.setProperty("--scene-pan-x", `${42 + (seed % 17)}%`);
  els.sceneBackdrop.style.setProperty("--scene-pan-y", `${43 + (Math.floor(seed / 7) % 16)}%`);
  els.sceneBackdrop.style.setProperty("--scene-zoom", (1.018 + (seed % 5) / 1000).toFixed(3));
  els.sceneBackdrop.style.setProperty("--scene-hue", `${hue + seasonHue}deg`);
  els.sceneBackdrop.style.setProperty("--scene-saturate", (1.03 + (seed % 8) / 100 + seasonSaturation).toFixed(2));
  const motionDuration = wind === "gale" || thunder === "close"
    ? 8
    : rain === "heavy"
      ? 11
      : motionHints.length
        ? 13
        : 18;
  els.sceneBackdrop.style.setProperty("--scene-motion-duration", `${motionDuration}s`);
  els.sceneBackdrop.style.setProperty("--scene-motion-lift", `${((seed % 5) + 2) / 10}%`);
}

function renderSceneVisualMeta(visualState) {
  if (!els.sceneVisualMeta) return;
  const chips = sceneVisualChips(visualState);
  els.sceneVisualMeta.replaceChildren(...chips.map((chip) => {
    const node = document.createElement("span");
    node.dataset.visualChip = chip.kind;
    node.textContent = chip.label;
    if (chip.title) node.title = chip.title;
    return node;
  }));
  els.sceneVisualMeta.classList.toggle("hidden", chips.length === 0);
}

function sceneVisualChips(visualState) {
  if (!visualState?.variantAxes) return [];
  const axes = visualState.variantAxes;
  const weather = sceneVisualAxis(visualState, "weather");
  const rain = sceneVisualAxis(visualState, "rain");
  const timeOfDay = sceneVisualAxis(visualState, "timeOfDay", "time");
  const pressure = sceneVisualAxis(visualState, "pressure");
  const season = sceneVisualAxis(visualState, "season", "season", "unseasoned");
  const location = refineSceneLocationToken(sceneVisualAxis(visualState, "location"), visualState);
  const thunder = sceneThunderLevel(axes.thunderChance);
  const chips = [
    visualChip("weather", weather, { en: "Weather", zh: "天气" }),
    visualChip("time", timeOfDay, { en: "Time", zh: "时段" }),
    visualChip("pressure", pressure, { en: "Pressure", zh: "危势" }),
    visualChip("season", season, { en: "Season", zh: "季节" }),
    visualChip("location", location, { en: "Place", zh: "地点" }),
    visualChip("rain", rain && rain !== "none" && rain !== weather ? rain : "", { en: "Rain", zh: "雨势" }),
    visualChip("wind", axes.wind && axes.wind !== "none" ? axes.wind : "", { en: "Wind", zh: "风势" }),
    visualChip("thunder", thunder !== "none" ? thunder : "", { en: "Thunder", zh: "雷电" }),
    visualChip("motion", visualTokens(visualState.motionHints)[0], { en: "Motion", zh: "动态" })
  ].filter(Boolean);
  const variantLabel = compactVariantLabel(visualState.variantKey);
  let variantChip = null;
  if (variantLabel) {
    variantChip = {
      kind: "variant",
      label: `${localizeTextValue({ en: "Variant", zh: "变体" })} ${variantLabel}`,
      title: visualState.variantKey
    };
  }
  return variantChip ? [...chips.slice(0, 5), variantChip] : chips.slice(0, 6);
}

function visualChip(kind, value, label) {
  const token = firstVisualAxis(value, "");
  if (!token) return null;
  return {
    kind,
    label: `${localizeTextValue(label)} ${formatVisualToken(token)}`
  };
}

function sceneVisualAxis(visualState, axis, variantPrefix = axis, fallback = "") {
  const axes = visualState?.variantAxes || {};
  return firstVisualAxis(axes[axis], "")
    || sceneVisualVariantToken(visualState?.variantKey, variantPrefix)
    || fallback;
}

function sceneVisualVariantToken(variantKey, prefix) {
  const needle = `${prefix}:`;
  return String(variantKey || "")
    .split("|")
    .find((part) => part.startsWith(needle))
    ?.slice(needle.length)
    || "";
}

function refineSceneLocationToken(token, visualState) {
  const value = sceneDataToken(token, "");
  const weather = sceneVisualAxis(visualState, "weather");
  const rain = sceneVisualAxis(visualState, "rain");
  const variantKey = String(visualState?.variantKey || "");
  const rainyUrban = weather === "wet" || (rain && rain !== "none") || variantKey.includes("preset:market-city");
  if (rainyUrban && (value === "market" || value === "city-street" || value === "town")) {
    return "market-city";
  }
  return value;
}

function firstVisualAxis(value, fallback = "") {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || fallback || "").trim();
}

function visualTokens(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => sceneDataToken(item, ""))
    .filter(Boolean);
}

function sceneDataToken(value, fallback) {
  return String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || fallback
    || "";
}

function sceneThunderLevel(chance) {
  const value = Number(chance || 0);
  if (value >= 0.55) return "close";
  if (value > 0) return "distant";
  return "none";
}

function formatVisualToken(value) {
  const labels = {
    "heavy-rain": { en: "Heavy Rain", zh: "暴雨" },
    "light-rain": { en: "Light Rain", zh: "细雨" },
    "market-city": { en: "Rain Lanes and Wet Stone", zh: "雨巷与湿石街区" },
    "city-street": { en: "Wet Stone Street", zh: "湿石街道" },
    "city-alley": { en: "Rain Alley", zh: "雨巷" },
    "city-plaza": { en: "Stone Plaza", zh: "石板广场" },
    "archive-room": { en: "Archive Room", zh: "档案室" },
    "street-motion": { en: "Street Motion", zh: "街道动静" },
    "wet-stone": { en: "Wet Stone", zh: "湿石" },
    unseasoned: { en: "Not Set", zh: "未设定" },
    wet: { en: "Wet", zh: "潮湿" },
    clear: { en: "Clear", zh: "晴朗" },
    dawn: { en: "Dawn", zh: "黎明" },
    day: { en: "Day", zh: "白天" },
    dusk: { en: "Dusk", zh: "黄昏" },
    night: { en: "Night", zh: "夜晚" },
    spring: { en: "Spring", zh: "春季" },
    summer: { en: "Summer", zh: "夏季" },
    autumn: { en: "Autumn", zh: "秋季" },
    winter: { en: "Winter", zh: "冬季" },
    low: { en: "Low", zh: "低" },
    rising: { en: "Rising", zh: "升高" },
    high: { en: "High", zh: "高" },
    crisis: { en: "Crisis", zh: "危机" },
    market: { en: "Street Market", zh: "街市街区" },
    town: { en: "Town District", zh: "城镇街区" },
    archive: { en: "Archive District", zh: "档案馆周边" },
    interior: { en: "Interior", zh: "室内" },
    heavy: { en: "Heavy", zh: "强" },
    light: { en: "Light", zh: "轻" },
    gale: { en: "Gale", zh: "狂风" },
    close: { en: "Close", zh: "近处" },
    distant: { en: "Distant", zh: "远处" },
    "lightning-flash": { en: "Lightning", zh: "闪电" },
    "dry-leaves": { en: "Leaves", zh: "落叶" },
    "crowd-flow": { en: "Crowd", zh: "人群" }
  };
  const token = sceneDataToken(value, "");
  return localizeTextValue(labels[token]) || humanizeDebugId(token);
}

function compactVariantLabel(variantKey) {
  const parts = String(variantKey || "").split("|").filter(Boolean);
  const preset = parts.find((part) => part.startsWith("preset:"))?.replace("preset:", "");
  const weather = parts.find((part) => part.startsWith("weather:"))?.replace("weather:", "");
  const lead = [preset, weather].filter(Boolean).map(formatVisualToken).join(" / ");
  return lead || (parts.length ? `#${hashVisualVariant(variantKey).toString(16).slice(0, 4)}` : "");
}

function hashVisualVariant(value) {
  let hash = 0;
  for (const char of String(value || "scene")) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash || 1;
}

function renderAmbience() {
  const soundscape = room?.soundscape;
  if (!soundscape) {
    syncAudioStatusDock();
    return;
  }
  if (els.soundscapeLabel) {
    els.soundscapeLabel.textContent = localizeSoundscape(soundscape);
  }
  if (els.soundscapeReason) {
    els.soundscapeReason.textContent = localizeSoundscapeReason(soundscape);
  }
  if (els.soundscapeLayers) {
    els.soundscapeLayers.innerHTML = "";
    for (const layer of soundscape.layers || []) {
      const chip = document.createElement("span");
      const chance = Number(layer.probability);
      const chanceText = Number.isFinite(chance) && chance > 0
        ? ` · ${t(uiLanguage, "ambience.layerChance", { chance: Math.round(chance * 100) })}`
        : "";
      chip.textContent = `${localizeLayerType(layer.type)} ${Math.round((layer.gain || 0) * 100)}%${chanceText}`;
      els.soundscapeLayers.append(chip);
    }
  }
  ambienceEngine.update(soundscape);
  syncAmbienceControls();
  syncAudioStatusDock();
}

function renderCombatBrief() {
  if (!els.combatBrief) return;
  const combat = room.stateSummary?.combat || {};
  if (!["imminent", "active", "combat", "engaged"].includes(combat.state)) {
    els.combatBrief.classList.add("hidden");
    els.combatBrief.textContent = "";
    return;
  }
  const enemy = combat.mostDangerous;
  const enemyText = enemy
    ? t(uiLanguage, "combat.briefEnemy", { name: localizeEntityName(enemy), hp: enemy.hp, maxHp: enemy.maxHp })
    : t(uiLanguage, "combat.briefNoEnemy");
  const intent = combat.tacticalIntent?.type
    ? t(uiLanguage, "combat.briefIntent", { type: localizeNpcAction(combat.tacticalIntent.type) })
    : t(uiLanguage, "combat.briefPrepare");
  els.combatBrief.textContent = `${t(uiLanguage, "combat.brief")}: ${enemyText}. ${intent}`;
  els.combatBrief.classList.remove("hidden");
}

function syncAmbienceControls() {
  if (!els.ambienceToggle) {
    syncAudioStatusDock();
    return;
  }
  els.ambienceToggle.textContent = t(uiLanguage, ambienceEngine.enabled ? "ambience.toggleOn" : "ambience.toggleOff");
  els.ambienceToggle.setAttribute("aria-pressed", String(ambienceEngine.enabled));
  if (els.ambienceStop) {
    els.ambienceStop.textContent = t(uiLanguage, "ambience.stop");
  }
  const volumes = ambienceEngine.volumes;
  if (els.ambienceMaster) els.ambienceMaster.value = String(volumes.master);
  if (els.ambienceMusic) els.ambienceMusic.value = String(volumes.music);
  if (els.ambienceEnvironment) els.ambienceEnvironment.value = String(volumes.ambience);
  syncAudioStatusDock();
}

function localizeSoundscape(soundscape) {
  const key = `soundscape.${soundscape.id}`;
  const translated = t(uiLanguage, key);
  return translated === key ? soundscape.label : translated;
}

function localizeSoundscapeReason(soundscape) {
  if (!soundscape) return t(uiLanguage, "ambience.waiting");
  const reason = soundscape.reason;
  if (reason && typeof reason === "object" && typeof reason.key === "string") {
    const translated = t(uiLanguage, reason.key, reason.params || {});
    return translated === reason.key ? t(uiLanguage, "ambience.selectedReason", { intensity: Math.round((soundscape.intensity || 0) * 100) }) : translated;
  }
  if (typeof reason === "string" && reason.startsWith("soundscape.reason.")) {
    return t(uiLanguage, reason);
  }
  return t(uiLanguage, "ambience.selectedReason", { intensity: Math.round((soundscape.intensity || 0) * 100) });
}

function localizeShiftReason(reason) {
  const labels = {
    "opening-scene": { en: "Opening scene", zh: "开场场景" },
    "forest-action": { en: "Moved through a forest route", zh: "沿森林路线移动" },
    "market-action": { en: "Moved through the market route", zh: "沿集市路线移动" },
    "waterfall-action": { en: "Moved into the waterfall route", zh: "进入瀑布路线" },
    "water-action": { en: "Moved into a water route", zh: "进入水域路线" },
    "camp-action": { en: "Moved into camp watch", zh: "进入营地守夜" },
    "danger-action": { en: "Threat entered the scene", zh: "威胁进入场景" }
  };
  return localizeTextValue(labels[reason]) || (uiLanguage === "zh" ? "状态更新" : humanizeDebugId(reason));
}

function localizeEncounterState(state) {
  const id = String(state || "scouting").trim() || "scouting";
  const normalized = id.toLowerCase();
  const key = `encounter.state.${normalized}`;
  const translated = t(uiLanguage, key);
  if (translated !== key) return translated;
  return uiLanguage === "zh" ? "未知状态" : humanizeDebugId(id);
}

function localizeQuestTitle(quest) {
  const title = quest?.title;
  const localized = localizeTextValue(title);
  if (uiLanguage !== "zh") return localized || String(title || "");
  const labels = {
    "Recover the sealed ledger": "取回封印账本",
    "Recover the ledger": "取回账本",
    "Find the ledger": "找到账本"
  };
  return labels[localized] || localized || String(title || "");
}

function localizedClassName(character = {}) {
  const classId = characterClassId(character);
  if (CLASS_IDS.has(classId)) return t(uiLanguage, `class.${classId}`);
  const className = localizeTextValue(character.classLabel) || character.className || character.archetype || classId;
  if (uiLanguage === "zh") {
    const translated = englishClassNameToLocalized(className);
    if (translated) return translated;
  }
  return className || "";
}

function localizedSpeciesName(character = {}) {
  const speciesId = characterSpeciesId(character);
  if (SPECIES_IDS.has(speciesId)) return t(uiLanguage, `species.${speciesId}`);
  return localizeTextValue(character.speciesLabel) || character.species || "human";
}

function characterClassId(character = {}) {
  return String(character.classId || character.class || "").trim().toLowerCase();
}

function characterSpeciesId(character = {}) {
  return String(character.species || character.speciesId || "human").trim().toLowerCase();
}

function englishClassNameToLocalized(name) {
  const normalized = String(name || "").trim().toLowerCase();
  for (const classId of CLASS_IDS) {
    if (normalized === t("en", `class.${classId}`).toLowerCase()) {
      return t(uiLanguage, `class.${classId}`);
    }
  }
  return "";
}

function localizeLayerType(type) {
  const key = `layer.${type}`;
  const translated = t(uiLanguage, key);
  return translated === key ? type : translated;
}

function assetDescription(asset) {
  const description = asset?.description;
  if (typeof description === "string") {
    return uiLanguage === "en" ? description.trim() : "";
  }
  return localizeTextValue(description);
}

function assetLabel(asset) {
  if (uiLanguage === "zh") {
    const zh = asset?.displayName?.zh;
    const en = asset?.displayName?.en;
    return (zh && zh !== en ? zh : "") || asset?.zhName || t(uiLanguage, "stage.backdrop");
  }
  return localizeTextValue(asset?.displayName) || asset?.name || t(uiLanguage, "stage.label");
}

function localizeEntityName(entity) {
  return localizeTextValue(entity?.displayName) || entity?.name || entity?.id || "";
}

function localizeCombatRole(role) {
  const labels = {
    striker: { en: "striker", zh: "突击者" },
    soldier: { en: "soldier", zh: "士兵" },
    support: { en: "support", zh: "支援者" },
    controller: { en: "controller", zh: "控场者" },
    brute: { en: "brute", zh: "重装敌人" }
  };
  return localizeTextValue(labels[role]) || role || "";
}

function localizeNpcAction(type) {
  const labels = {
    attack: { en: "attack", zh: "攻击" },
    cast: { en: "cast", zh: "施法" },
    support: { en: "support", zh: "支援" },
    defend: { en: "defend", zh: "防御" },
    flee: { en: "flee", zh: "撤离" }
  };
  return localizeTextValue(labels[type]) || type || "";
}

function combatLogMarkup(entry = {}) {
  const message = localizeTextValue(entry.localizedMessage) || entry.message || "";
  const actor = localizeCombatantLogName(entry, "actor");
  const target = localizeCombatantLogName(entry, "target");
  const result = combatResult(entry);
  const damage = combatDamageAmount(entry);
  const hpShift = combatHpShiftLabel(entry);
  const source = entry.sourceId ? combatSourceLabel(entry.sourceId) : "";
  return `
    <div class="combat-row-head">
      <span class="combat-actor">${escapeHtml(actor)}</span>
      <span class="combat-action">${escapeHtml(localizeNpcAction(entry.action))}</span>
      <span class="combat-target">${escapeHtml(target)}</span>
      <span class="combat-result-pill" data-combat-result-copy>${escapeHtml(combatResultLabel(result))}</span>
    </div>
    <div class="combat-row-meta">
      ${damage !== null ? `<span class="combat-damage-pill" data-combat-damage>${escapeHtml(combatDamageLabel(entry, damage))}</span>` : ""}
      ${hpShift ? `<span class="combat-hp-shift" data-combat-hp-shift>${escapeHtml(hpShift)}</span>` : ""}
      ${source ? `<span class="combat-source">${escapeHtml(source)}</span>` : ""}
    </div>
    ${message ? `<p>${escapeHtml(message)}</p>` : ""}
  `;
}

function combatLogClasses(entry = {}) {
  const result = combatResult(entry);
  return [
    result,
    entry.critical ? "critical" : "",
    entry.defeated ? "defeated" : "",
    combatDamageAmount(entry) > 0 ? "damage" : "no-damage"
  ].filter(Boolean);
}

function combatResult(entry = {}) {
  if (Number(entry.healing) > 0) return "healing";
  if (entry.critical) return "critical";
  if (entry.hit === true) return "hit";
  if (entry.hit === false) return "miss";
  if (entry.defeated) return "defeated";
  return entry.action || "action";
}

function combatResultLabel(result) {
  const labels = {
    hit: { en: "Hit", zh: "命中" },
    miss: { en: "Miss", zh: "未命中" },
    critical: { en: "Critical", zh: "重击" },
    defeated: { en: "Defeated", zh: "击倒" },
    healing: { en: "Healing", zh: "治疗" },
    attack: { en: "Action", zh: "行动" },
    cast: { en: "Spell", zh: "法术" },
    defend: { en: "Guard", zh: "防御" },
    flee: { en: "Flee", zh: "撤离" },
    support: { en: "Support", zh: "支援" },
    action: { en: "Action", zh: "行动" }
  };
  return localizeTextValue(labels[result]) || result || "";
}

function combatDamageAmount(entry = {}) {
  if (Number.isFinite(Number(entry.damage))) return Number(entry.damage);
  if (Number.isFinite(Number(entry.healing))) return Number(entry.healing);
  return null;
}

function combatDamageLabel(entry = {}, amount = combatDamageAmount(entry)) {
  const healing = Number(entry.healing) > 0;
  const label = healing
    ? localizeTextValue({ en: "Healing", zh: "治疗" })
    : localizeTextValue({ en: "Damage", zh: "伤害" });
  return `${label} ${amount}`;
}

function combatHpShiftLabel(entry = {}) {
  const before = Number(entry.targetHpBefore);
  const after = Number(entry.targetHpAfter);
  if (!Number.isFinite(before) || !Number.isFinite(after)) return "";
  const label = localizeTextValue({ en: "HP", zh: "生命" });
  return `${label} ${before} -> ${after}`;
}

function combatSourceLabel(sourceId) {
  const label = localizeTextValue({ en: "Source", zh: "来源" });
  return `${label}: ${sourceId}`;
}

function localizeCombatantLogName(entry = {}, field) {
  return localizeTextValue(entry[`${field}DisplayName`])
    || entry[`${field}Name`]
    || entry[`${field}Id`]
    || "";
}

function localizeNpcReason(reason) {
  const labels = {
    "No legal target; hold position": { en: "No legal target; hold position", zh: "没有合法目标，保持位置" },
    "HP below morale threshold": { en: "HP below morale threshold", zh: "生命低于士气阈值" },
    "Ally is wounded": { en: "Ally is wounded", zh: "盟友受伤" },
    "Low HP and no safe retreat": { en: "Low HP and no safe retreat", zh: "生命较低且没有安全撤退路线" },
    "Best ranged or magical pressure": { en: "Best ranged or magical pressure", zh: "远程或法术压制最有效" },
    "Pressure highest threat enemy": { en: "Pressure highest threat enemy", zh: "压迫威胁最高的目标" },
    "Maintain position": { en: "Maintain position", zh: "保持阵位" }
  };
  return localizeTextValue(labels[reason]) || reason || "";
}

function localizeTextValue(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value[uiLanguage] || value.en || value.zh || value.default || "").trim();
}

function assetUrl(file) {
  const value = String(file || "");
  if (/^(https?:|data:)/.test(value)) return value;
  return `/${value.replace(/^\/+/, "")}`;
}

function cssUrl(url) {
  return `url("${String(url).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}")`;
}

function bindPointBudget() {
  const inputs = [...document.querySelectorAll(".stat-grid input")];
  const update = () => {
    if (!els.pointBudget) return;
    const total = inputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
    const remaining = ATTRIBUTE_POINT_BUDGET.max - total;
    const key = remaining < 0 ? "pointBudget.over" : remaining === 0 ? "pointBudget.ready" : "pointBudget";
    const focus = recommendedAttributeFocus(document.querySelector("#classSelect")?.value || "warrior");
    els.pointBudget.textContent = t(uiLanguage, key, {
      total,
      max: ATTRIBUTE_POINT_BUDGET.max,
      remaining: Math.abs(remaining),
      focus
    });
    els.pointBudget.classList.toggle("over", total > ATTRIBUTE_POINT_BUDGET.max);
    els.pointBudget.classList.toggle("ready", total === ATTRIBUTE_POINT_BUDGET.max);
    els.pointBudget.setAttribute("aria-live", "polite");
    syncSetupGuidance();
  };
  for (const input of inputs) {
    input.max = String(ATTRIBUTE_POINT_BUDGET.maxSpend);
    input.addEventListener("input", update);
  }
  update();
  bindPointBudget.update = update;
}

function bindBuilderCards() {
  for (const group of document.querySelectorAll("[data-card-select]")) {
    const select = document.getElementById(group.dataset.cardSelect);
    if (!select) continue;
    group.addEventListener("click", (event) => {
      const button = event.target.closest("[data-card-value]");
      if (!button) return;
      select.value = button.dataset.cardValue;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncBuilderCards(group, select.value);
    });
    select.addEventListener("change", () => {
      syncBuilderCards(group, select.value);
      if (select.id === "classSelect") {
        applyRecommendedAttributePreset(select.value);
      }
      syncSetupGuidance();
    });
    syncBuilderCards(group, select.value);
  }
  document.querySelector("#classSelect")?.addEventListener("change", renderStarterSpellCards);
  applyRecommendedAttributePreset(document.querySelector("#classSelect")?.value || "warrior");
  renderStarterSpellCards();
}

function syncBuilderCards(group, value) {
  for (const button of group.querySelectorAll("[data-card-value]")) {
    const active = button.dataset.cardValue === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function applyRecommendedAttributePreset(classId) {
  const preset = CLASS_RECOMMENDED_ALLOCATIONS[classId] || CLASS_RECOMMENDED_ALLOCATIONS.warrior;
  for (const [attribute, value] of Object.entries(preset)) {
    const input = document.querySelector(`.stat-grid input[name="${attribute}"]`);
    if (input) input.value = String(value);
  }
  bindPointBudget.update?.();
}

function recommendedAttributeFocus(classId) {
  const preset = CLASS_RECOMMENDED_ALLOCATIONS[classId] || CLASS_RECOMMENDED_ALLOCATIONS.warrior;
  const entries = Object.entries(preset).sort((left, right) => right[1] - left[1]);
  return entries
    .slice(0, 2)
    .map(([attribute]) => t(uiLanguage, `field.${attribute}`))
    .join(" + ");
}

function renderStarterSpellCards() {
  if (!els.starterSpellCards) return;
  const classId = document.querySelector("#classSelect")?.value || "warrior";
  const spells = STARTER_SPELLS_BY_CLASS[classId] || [];
  if (!spells.length) {
    els.starterSpellCards.innerHTML = `<article class="spell-card muted"><strong>${escapeHtml(t(uiLanguage, "spell.none"))}</strong></article>`;
    return;
  }
  els.starterSpellCards.innerHTML = spells.map((spell) => `
    <article class="spell-card">
      ${spellArtMarkup(spell.id, localizeTextValue(spell.label), "spell-card-art")}
      <strong>${escapeHtml(localizeTextValue(spell.label))}</strong>
      <small>${escapeHtml(localizeTextValue(spell.detail))}</small>
    </article>
  `).join("");
}

function bindTableStateStrip() {
  if (!els.tableStateStrip || !els.tableStateToggle) return;
  const setExpanded = (expanded) => {
    els.tableStateStrip.dataset.expanded = String(expanded);
    els.tableStateToggle.setAttribute("aria-expanded", String(expanded));
    els.tableStateDetails?.setAttribute("aria-hidden", String(!expanded));
    if (els.tableStateDetails) {
      if (expanded) {
        els.tableStateDetails.removeAttribute("inert");
      } else {
        els.tableStateDetails.setAttribute("inert", "");
      }
      els.tableStateDetails.inert = !expanded;
    }
  };
  els.tableStateToggle.addEventListener("click", () => {
    setExpanded(els.tableStateStrip.dataset.expanded !== "true");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.tableStateStrip.dataset.expanded === "true") {
      setExpanded(false);
      els.tableStateToggle.focus();
    }
  });
  setExpanded(false);
}

function bindLogDensityToggle() {
  if (!els.logDensityToggle) return;
  els.logDensityToggle.addEventListener("click", () => {
    const index = LOG_DENSITY_SEQUENCE.indexOf(logDensity);
    logDensity = LOG_DENSITY_SEQUENCE[(index + 1) % LOG_DENSITY_SEQUENCE.length];
    localStorage.setItem("aidm.logDensity", logDensity);
    syncLogDensityToggle();
    if (room) renderTranscript();
  });
  syncLogDensityToggle();
}

function normalizeLogDensity(value) {
  return LOG_DENSITY_SEQUENCE.includes(value) ? value : "summary";
}

function syncLogDensityToggle() {
  if (!els.logDensityToggle) return;
  logDensity = normalizeLogDensity(logDensity);
  const compact = logDensity === "summary" || logDensity === "dense";
  els.logDensityToggle.dataset.densityMode = logDensity;
  els.logDensityToggle.setAttribute("aria-pressed", String(compact));
  els.logDensityToggle.textContent = t(uiLanguage, `log.density.${logDensity}`);
  els.logDensityToggle.title = t(uiLanguage, "log.densityTitle");
  els.logDensityToggle.setAttribute("aria-label", t(uiLanguage, "log.densityTitle"));
  els.transcriptPanel?.setAttribute("data-log-density", logDensity);
}

function bindGuide() {
  if (!els.guideOverlay) return;

  for (const button of els.guideOpenButtons) {
    button.addEventListener("click", () => openGuide(button.dataset.guideTabTarget || "quickstart"));
  }
  for (const button of els.guideCloseButtons) {
    button.addEventListener("click", closeGuide);
  }
  for (const tab of els.guideTabs) {
    tab.addEventListener("click", () => selectGuideTab(tab.dataset.guideTab));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.guideOverlay.classList.contains("hidden")) {
      closeGuide();
    }
  });
}

function layerPlayerMenuControls() {
  const menuButtons = [els.marketButton, els.tableGuideButton].filter(Boolean);
  if (!els.settingsStack || menuButtons.length === 0) return;

  let menu = document.querySelector("#playerMenuSection");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "playerMenuSection";
    menu.className = "settings-menu settings-section";
    const head = document.createElement("div");
    head.className = "settings-section-head";
    head.innerHTML = `
      <span class="audio-kicker">${escapeHtml(t(uiLanguage, "settings.playerMenuKicker"))}</span>
      <strong id="playerMenuTitle">${escapeHtml(t(uiLanguage, "settings.playerMenuTitle"))}</strong>
    `;
    const controls = document.createElement("div");
    controls.className = "settings-menu-actions";
    menu.append(head);
    menu.append(controls);
    els.settingsStack.prepend(menu);
  }

  const controls = menu.querySelector(".settings-menu-actions");
  for (const button of menuButtons) {
    button.classList.add("settings-menu-button");
    controls.append(button);
  }
}

function bindDrawers() {
  for (const button of els.drawerOpenButtons) {
    button.addEventListener("click", () => openDrawer(button.dataset.drawerOpen, button));
  }
  for (const button of els.drawerCloseButtons) {
    button.addEventListener("click", closeDrawers);
  }
  els.drawerScrim?.addEventListener("click", closeDrawers);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      closeDrawers();
    }
  });
}

function bindCharacterDrawer() {
  els.inventoryList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-item-id]");
    if (!button) return;
    selectedInventoryItemId = button.dataset.itemId;
    renderCharacterDrawer();
    revealInventoryDetail();
  });

  els.inventoryDetail?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-item-action]");
    if (!button || !room || !selectedInventoryItemId || !hasLocalPlayerBinding()) return;
    const action = button.dataset.itemAction;
    const path = action === "sell" ? "market/sell" : action === "equip" ? "items/equip" : "items/use";
    const item = getLocalPlayer()?.character?.inventory?.find((entry) => entry.id === selectedInventoryItemId || entry.itemId === selectedInventoryItemId);
    const definition = inventoryDefinition(item || { itemId: selectedInventoryItemId });
    const itemName = definition.label;
    const sellValue = inventorySellValueLabel(item, true);
    const slot = inventorySlotLabel(item, definition);
    const originalText = button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = t(uiLanguage, inventoryActionBusyKey(action));
    clearInventoryFeedback();
    try {
      const roomId = room.id;
      const result = await withRealtimePaused(() => api(`/api/rooms/${roomId}/${path}`, {
        method: "POST",
        timeoutMs: INVENTORY_ACTION_TIMEOUT_MS,
        body: {
          playerId,
          playerToken,
          itemId: selectedInventoryItemId,
          expectedVersion: room.version
        }
      }));
      if (action === "sell") {
        selectedInventoryItemId = "";
      }
      openRoom(result.room);
      const wallet = `${Number(getLocalPlayer()?.character?.wallet || 0)} ${t(uiLanguage, "currency.cr")}`;
      if (action === "sell") {
        setInventoryFeedback("inventory.feedback.sold", { item: itemName, amount: sellValue, wallet });
      } else if (action === "equip") {
        setInventoryFeedback("inventory.feedback.equipped", { item: itemName, slot });
      } else {
        setInventoryFeedback("inventory.feedback.used", { item: itemName });
      }
    } catch (error) {
      setInventoryFeedback("", {}, "error", localizedErrorMessage(error));
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      if (originalText) button.textContent = originalText;
    }
  });

  els.memoForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!room || !hasLocalPlayerBinding()) return;
    if (els.memoStatus) els.memoStatus.textContent = "";
    const submitButton = els.memoForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const result = await api(`/api/rooms/${room.id}/memo`, {
        method: "POST",
        body: {
          playerId,
          playerToken,
          text: els.memoText.value,
          expectedVersion: room.version
        }
      });
      openRoom(result.room);
      if (els.memoStatus) els.memoStatus.textContent = t(uiLanguage, "memo.saved");
    } catch (error) {
      if (els.memoStatus) els.memoStatus.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });
}

function bindMarketDrawer() {
  els.marketList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-market-buy]");
    if (!button || !room || !hasLocalPlayerBinding()) return;
    const offer = marketOffers.find((entry) => entry.itemId === button.dataset.marketBuy) || {};
    const definition = marketOfferDefinition(offer);
    const itemName = definition.label;
    const price = marketPriceLabel(offer);
    const originalText = button.textContent;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    button.textContent = t(uiLanguage, "button.buyingItem");
    setMarketFeedback("market.feedback.buying", { item: itemName }, "busy");
    try {
      const roomId = room.id;
      const result = await withRealtimePaused(() => api(`/api/rooms/${roomId}/market/buy`, {
        method: "POST",
        timeoutMs: MARKET_REQUEST_TIMEOUT_MS,
        body: {
          playerId,
          playerToken,
          itemId: button.dataset.marketBuy,
          expectedVersion: room.version
        }
      }));
      openRoom(result.room);
      await refreshMarket();
      const wallet = `${Number(getLocalPlayer()?.character?.wallet || 0)} ${t(uiLanguage, "currency.cr")}`;
      setMarketFeedback("market.feedback.bought", { item: itemName, price, wallet });
    } catch (error) {
      setMarketFeedback("", {}, "error", localizedErrorMessage(error));
    } finally {
      button.disabled = false;
      button.setAttribute("aria-busy", "false");
      if (originalText) button.textContent = originalText;
    }
  });
}

async function refreshMarket({ clearFeedback = false } = {}) {
  if (!room || !hasLocalPlayerBinding() || marketLoading) return;
  const requestId = ++marketRefreshRequestId;
  const roomId = room.id;
  if (clearFeedback) clearMarketFeedback();
  marketLoading = true;
  renderMarketDrawer();
  try {
    const result = await withRealtimePaused(() => api(`/api/rooms/${roomId}/market`, { timeoutMs: MARKET_REQUEST_TIMEOUT_MS }));
    if (requestId !== marketRefreshRequestId || room?.id !== roomId) return;
    marketOffers = Array.isArray(result.shop) ? result.shop : [];
    if (result.room && result.room.id === roomId) {
      room = result.room;
    }
  } catch (error) {
    if (requestId === marketRefreshRequestId) {
      marketOffers = [];
      setMarketFeedback("", {}, "error", localizedErrorMessage(error));
    }
  } finally {
    if (requestId === marketRefreshRequestId) {
      marketLoading = false;
      renderMarketDrawer();
      renderPlayerSummaryDock();
    }
  }
}

function bindActionModeControls() {
  const intentSelect = els.actionForm?.elements?.intent;
  if (!intentSelect) return;
  els.actionError?.setAttribute("role", "alert");
  els.actionError?.setAttribute("aria-live", "assertive");
  els.actionModeHint?.setAttribute("role", "status");
  els.actionModeHint?.setAttribute("aria-live", "polite");
  intentSelect.addEventListener("change", syncActionModeControls);
  syncActionModeControls();
}

function hasLocalPlayerBinding() {
  return Boolean(room && getLocalPlayer() && playerId && playerToken);
}

function syncActionModeControls() {
  const intentSelect = els.actionForm?.elements?.intent;
  const modeSelect = els.actionForm?.elements?.mode;
  const channelSelect = els.actionForm?.elements?.channel;
  const textInput = els.actionForm?.elements?.text;
  const submitButton = els.actionForm?.querySelector("button[type='submit']");
  if (!intentSelect || !modeSelect || !channelSelect) return;
  const isChat = intentSelect.value === "chat";
  const hasPlayerBinding = hasLocalPlayerBinding();
  els.actionForm.dataset.intent = isChat ? "chat" : "action";
  els.actionForm.classList.toggle("chat-mode", isChat);
  els.actionForm.classList.toggle("action-mode", !isChat);
  modeSelect.disabled = isChat || !hasPlayerBinding;
  channelSelect.disabled = !isChat || !hasPlayerBinding;
  els.actionForm.setAttribute("aria-label", t(uiLanguage, hasPlayerBinding ? (isChat ? "action.formAria.chat" : "action.formAria.action") : "action.formAria.noPlayer"));
  els.actionForm.setAttribute("aria-describedby", "actionModeHint actionError");
  intentSelect.setAttribute("aria-label", t(uiLanguage, "action.intentAria"));
  intentSelect.title = t(uiLanguage, "action.intentTitle");
  modeSelect.setAttribute("aria-label", t(uiLanguage, isChat ? "action.rollModeAria.chat" : "action.rollModeAria.action"));
  modeSelect.title = t(uiLanguage, isChat ? "action.rollModeTitle.chat" : "action.rollModeTitle.action");
  channelSelect.setAttribute("aria-label", t(uiLanguage, isChat ? "action.channelAria.chat" : "action.channelAria.action"));
  channelSelect.title = t(uiLanguage, isChat ? "action.channelTitle.chat" : "action.channelTitle.action");
  if (textInput) {
    textInput.disabled = !hasPlayerBinding;
    textInput.placeholder = t(uiLanguage, hasPlayerBinding ? (isChat ? "placeholder.chat" : "placeholder.action") : "action.noPlayerPlaceholder");
    textInput.setAttribute("aria-label", t(uiLanguage, hasPlayerBinding ? (isChat ? "action.textAria.chat" : "action.textAria.action") : "action.noPlayerTextAria"));
    textInput.setAttribute("aria-describedby", "actionModeHint actionError");
    textInput.title = t(uiLanguage, hasPlayerBinding ? (isChat ? "action.textTitle.chat" : "action.textTitle.action") : "action.noPlayerTextTitle");
  }
  if (submitButton && els.actionForm.dataset.submitState !== "sending") {
    submitButton.dataset.primaryAction = isChat ? "chat" : "action";
    submitButton.disabled = !hasPlayerBinding;
    submitButton.textContent = t(uiLanguage, hasPlayerBinding ? (isChat ? "button.chat" : "button.act") : "action.noPlayerSubmit");
    submitButton.setAttribute("aria-label", t(uiLanguage, hasPlayerBinding ? (isChat ? "action.submitChatAria" : "action.submitActionAria") : "action.noPlayerSubmitAria"));
  }
  if (els.actionModeHint) {
    els.actionModeHint.textContent = t(uiLanguage, hasPlayerBinding ? (isChat ? "action.hint.chat" : "action.hint.action") : "action.noPlayerHint");
  }
}

function openDrawer(name, opener = document.activeElement) {
  if (!name) return;
  closeRewardToast();
  closeDrawers({ restoreFocus: false });
  if (name === "market") {
    refreshMarket({ clearFeedback: true });
  }
  drawerOpener = opener instanceof HTMLElement ? opener : null;
  for (const panel of els.drawerPanels) {
    const active = panel.dataset.drawer === name;
    panel.classList.toggle("open", active);
    panel.setAttribute("aria-hidden", String(!active));
    panel.inert = !active;
    if (active) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  }
  for (const button of els.drawerOpenButtons) {
    button.setAttribute("aria-expanded", String(button.dataset.drawerOpen === name));
  }
  els.drawerScrim?.classList.remove("hidden");
  document.body.classList.add("drawer-open");
  const closeButton = [...els.drawerPanels].find((panel) => panel.dataset.drawer === name)?.querySelector("[data-drawer-close]");
  setTimeout(() => closeButton?.focus({ preventScroll: true }), 0);
}

function closeDrawers({ restoreFocus = true } = {}) {
  for (const panel of els.drawerPanels) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    panel.setAttribute("inert", "");
  }
  for (const button of els.drawerOpenButtons) {
    button.setAttribute("aria-expanded", "false");
  }
  els.drawerScrim?.classList.add("hidden");
  document.body.classList.remove("drawer-open");
  if (restoreFocus) {
    drawerOpener?.focus({ preventScroll: true });
  }
  drawerOpener = null;
}

function bindLanguageControls() {
  syncLanguageControls();
  for (const select of [els.createLanguageSelect, els.languageSelect].filter(Boolean)) {
    select.addEventListener("change", () => {
      applyLanguage(select.value);
    });
  }
}

function bindAmbienceControls() {
  if (!els.ambienceToggle) return;
  if (!canUseAudio()) {
    els.ambienceToggle.disabled = true;
    els.ambienceToggle.textContent = t(uiLanguage, "ambience.unsupported");
    syncAudioStatusDock();
    return;
  }

  const volumes = ambienceEngine.volumes;
  els.ambienceMaster.value = String(volumes.master);
  els.ambienceMusic.value = String(volumes.music);
  els.ambienceEnvironment.value = String(volumes.ambience);

  els.ambienceToggle.addEventListener("click", async () => {
    if (ambienceEngine.enabled) {
      ambienceEngine.stop();
    } else {
      await ambienceEngine.start(room?.soundscape);
    }
    syncAmbienceControls();
  });
  els.ambienceStop.addEventListener("click", () => {
    ambienceEngine.stop();
    syncAmbienceControls();
  });

  for (const input of [els.ambienceMaster, els.ambienceMusic, els.ambienceEnvironment].filter(Boolean)) {
    input.addEventListener("input", () => {
      ambienceEngine.setVolumes({
        master: Number(els.ambienceMaster.value),
        music: Number(els.ambienceMusic.value),
        ambience: Number(els.ambienceEnvironment.value)
      });
    });
  }
  syncAmbienceControls();
}

function applyLanguage(language, { rerender = true } = {}) {
  uiLanguage = normalizeLanguage(language);
  localStorage.setItem("aidm.language", uiLanguage);
  applyTranslations(uiLanguage);
  syncLanguageControls();
  syncAuthControls();
  syncCreateAccessControls();
  syncLocalizedCharacterBuilderOptions();
  syncJoinStatus();
  syncRoomAccessControls();
  refreshVoices();
  syncVoiceControls();
  bindPointBudget.update?.();
  renderStarterSpellCards();
  syncSceneClockLabels();
  syncActionModeControls();
  syncSetupGuidance();
  syncAudioStatusDock();
  syncTableStateSummary();
  syncLogDensityToggle();
  syncMarketFeedback();
  syncInventoryFeedback();
  syncReplaySummary();
  renderHostAccessControls();
  if (rerender) {
    if (room) render();
  }
}

function syncLanguageControls() {
  if (els.createLanguageSelect) {
    els.createLanguageSelect.value = uiLanguage;
  }
  if (els.languageSelect) {
    els.languageSelect.value = uiLanguage;
  }
}

function syncLocalizedCharacterBuilderOptions() {
  localizeSelectOptionLabels(els.joinForm?.elements?.species, (value) => `species.${value}`);
  localizeSelectOptionLabels(els.joinForm?.elements?.classId, (value) => `class.${value}`);
  const archetypeSelect = els.joinForm?.elements?.archetype;
  if (!archetypeSelect) return;
  for (const option of archetypeSelect.options || []) {
    const id = option.dataset.archetypeId || archetypeIdFromLabel(option.value || option.textContent);
    if (!id) continue;
    option.dataset.archetypeId = id;
    const label = t(uiLanguage, `archetype.${id}`);
    option.textContent = label;
    option.value = label;
  }
}

function localizeSelectOptionLabels(select, keyForValue) {
  if (!select) return;
  for (const option of select.options || []) {
    const key = keyForValue(option.value);
    const label = t(uiLanguage, key);
    if (label !== key) option.textContent = label;
  }
}

function archetypeIdFromLabel(label) {
  const normalized = String(label || "").trim().toLowerCase();
  const known = {
    investigator: "investigator",
    "调查员": "investigator",
    vanguard: "vanguard",
    "先锋": "vanguard",
    occultist: "occultist",
    "神秘学者": "occultist",
    envoy: "envoy",
    "使节": "envoy"
  };
  return known[normalized] || ARCHETYPE_IDS.find((id) => normalized === id) || "";
}

function ensureJoinStatus() {
  if (els.joinStatus || !els.joinForm) return els.joinStatus;
  const status = document.createElement("p");
  status.id = "joinStatus";
  status.className = "form-error join-status";
  status.setAttribute("aria-live", "polite");
  const submitButton = els.joinForm.querySelector("button[type='submit']");
  if (submitButton) {
    els.joinForm.insertBefore(status, submitButton);
  } else {
    els.joinForm.append(status);
  }
  els.joinStatus = status;
  return status;
}

function showJoinStatus(key, fallback = "") {
  const status = ensureJoinStatus();
  if (!status) return;
  status.dataset.statusKey = key || "";
  status.textContent = key ? t(uiLanguage, key) : fallback;
}

function syncJoinStatus() {
  const key = els.joinStatus?.dataset.statusKey || "";
  if (key) showJoinStatus(key);
}

function localizedErrorMessage(error) {
  const message = String(error?.message || "");
  const codeKey = {
    AUTH_EMAIL_REQUIRED: "auth.emailRequired",
    AUTH_PASSWORD_REQUIRED: "auth.passwordRequired",
    USER_EXISTS: "auth.userExists",
    INVALID_CREDENTIALS: "auth.invalidCredentials",
    AUTH_REQUIRED: "auth.sessionRequired",
    SESSION_INVALID: "auth.sessionExpired",
    ROOM_PASSWORD_REQUIRED_FOR_MODE: "access.passwordRequired",
    ROOM_PASSWORD_REQUIRED: "access.joinPasswordRequired",
    ROOM_PASSWORD_INVALID: "access.joinPasswordInvalid",
    ROOM_ACCESS_MODE_INVALID: "access.invalidMode",
    HOST_TOKEN_REQUIRED: "access.hostRequired",
    PENDING_PLAYER_NOT_FOUND: "access.pendingMissing",
    PENDING_PLAYER_RESOLVED: "access.pendingResolved"
  }[error?.code];
  if (codeKey) return t(uiLanguage, codeKey);
  const key = {
    "Action text is required": "error.actionRequired",
    "Action text is required.": "error.actionRequired",
    "Chat text is required": "error.chatRequired",
    "Chat text is required.": "error.chatRequired",
    "Item is not usable": "error.itemNotUsable",
    "Item cannot be equipped": "error.itemNotEquippable",
    "Item cannot be traded": "error.itemNotTradeable",
    "Inventory item not found": "error.itemMissing",
    "Spell already known": "error.spellKnown",
    "Not enough currency": "market.reason.insufficientFunds",
    "Shop item is out of stock": "market.reason.outOfStock",
    "Shop item is unavailable": "market.reason.unavailable",
    "Email is required": "auth.emailRequired",
    "Password must be at least 4 characters": "auth.passwordRequired",
    "User already exists": "auth.userExists",
    "Invalid email or password": "auth.invalidCredentials",
    "Session is invalid": "auth.sessionExpired",
    "Room password is required": "access.joinPasswordRequired",
    "Room password is invalid": "access.joinPasswordInvalid",
    "Host approval is required": "access.hostRequired"
  }[message];
  return key ? t(uiLanguage, key) : message;
}

function setMarketFeedback(key, params = {}, kind = "success", fallback = "") {
  marketFeedback = key || fallback ? { key, params, kind, fallback } : null;
  syncMarketFeedback();
  if (marketFeedback) {
    revealMarketFeedback();
  }
}

function clearMarketFeedback() {
  marketFeedback = null;
  syncMarketFeedback();
}

function syncMarketFeedback() {
  if (!els.marketStatus) return;
  els.marketStatus.dataset.feedbackKind = marketFeedback?.kind || "";
  els.marketStatus.textContent = marketFeedback
    ? (marketFeedback.key ? t(uiLanguage, marketFeedback.key, marketFeedback.params) : marketFeedback.fallback)
    : "";
}

function revealMarketFeedback() {
  if (!els.marketStatus) return;
  const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
  schedule(() => {
    els.marketStatus.scrollIntoView?.({ behavior: "smooth", block: "start", inline: "nearest" });
    els.marketStatus.focus?.({ preventScroll: true });
  });
}

function revealInventoryDetail() {
  if (!els.inventoryDetail) return;
  const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
  schedule(() => {
    const target = els.inventoryDetail.querySelector(".inventory-detail-card") || els.inventoryDetail;
    target.setAttribute?.("tabindex", "-1");
    target.scrollIntoView?.({ behavior: "smooth", block: "start", inline: "nearest" });
    target.focus?.({ preventScroll: true });
  });
}

function revealInventoryFeedback() {
  if (!els.inventoryStatus) return;
  const schedule = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 0));
  schedule(() => {
    els.inventoryStatus.scrollIntoView?.({ behavior: "smooth", block: "start", inline: "nearest" });
    els.inventoryStatus.focus?.({ preventScroll: true });
  });
}

function setInventoryFeedback(key, params = {}, kind = "success", fallback = "") {
  inventoryFeedback = key || fallback ? { key, params, kind, fallback } : null;
  syncInventoryFeedback();
  if (inventoryFeedback) {
    revealInventoryFeedback();
  }
}

function clearInventoryFeedback() {
  inventoryFeedback = null;
  syncInventoryFeedback();
}

function syncInventoryFeedback() {
  if (!els.inventoryStatus) return;
  els.inventoryStatus.dataset.feedbackKind = inventoryFeedback?.kind || "";
  els.inventoryStatus.textContent = inventoryFeedback
    ? (inventoryFeedback.key ? t(uiLanguage, inventoryFeedback.key, inventoryFeedback.params) : inventoryFeedback.fallback)
    : "";
}

function bindVoiceControls() {
  if (!els.voiceToggle || !supportsSpeech()) {
    if (els.voiceToggle) {
      els.voiceToggle.disabled = true;
      els.voiceToggle.textContent = t(uiLanguage, "voice.unsupported");
    }
    return;
  }

  speechState.rate = clampSpeechNumber(speechState.rate, 1);
  speechState.pitch = clampSpeechNumber(speechState.pitch, 1);
  els.voiceRate.value = String(speechState.rate);
  els.voicePitch.value = String(speechState.pitch);

  els.voiceToggle.addEventListener("click", () => {
    speechState.enabled = !speechState.enabled;
    localStorage.setItem("aidm.voice.enabled", String(speechState.enabled));
    syncVoiceControls();
    if (speechState.enabled) {
      readLatestTranscript();
    } else {
      stopSpeech();
    }
  });
  els.readLatestButton.addEventListener("click", readLatestTranscript);
  els.stopVoiceButton.addEventListener("click", stopSpeech);
  els.voiceSelect.addEventListener("change", () => {
    speechState.selectedVoiceValue = els.voiceSelect.value;
    localStorage.setItem("aidm.voice.selection", speechState.selectedVoiceValue);
    const selection = parseVoiceSelection(speechState.selectedVoiceValue);
    if (selection.browserVoiceName) {
      localStorage.setItem("aidm.voice.name", selection.browserVoiceName);
    } else {
      localStorage.removeItem("aidm.voice.name");
    }
  });
  els.voiceRate.addEventListener("input", () => {
    speechState.rate = clampSpeechNumber(Number(els.voiceRate.value), 1);
    localStorage.setItem("aidm.voice.rate", String(speechState.rate));
  });
  els.voicePitch.addEventListener("input", () => {
    speechState.pitch = clampSpeechNumber(Number(els.voicePitch.value), 1);
    localStorage.setItem("aidm.voice.pitch", String(speechState.pitch));
  });

  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
  refreshVoices();
  syncVoiceControls();
}

function refreshVoices() {
  if (!supportsSpeech()) return;
  speechState.voices = window.speechSynthesis.getVoices();
  const selected = speechState.selectedVoiceValue;
  els.voiceSelect.innerHTML = `<option value="">${escapeHtml(t(uiLanguage, "voice.auto"))}</option>`;

  for (const group of voiceProfileGroupsForMenu(listVoiceProfiles(uiLanguage))) {
    const profileGroup = document.createElement("optgroup");
    profileGroup.label = t(uiLanguage, `voice.group.${group.id}`);
    for (const profile of group.profiles) {
      const option = document.createElement("option");
      option.value = `profile:${profile.id}`;
      option.textContent = voiceProfileOptionLabel(profile);
      option.title = voiceProfileOptionTitle(profile);
      profileGroup.append(option);
    }
    els.voiceSelect.append(profileGroup);
  }

  const languagePrefix = uiLanguage === "zh" ? "zh" : "en";
  const matching = speechState.voices.filter((voice) => voice.lang?.toLowerCase().startsWith(languagePrefix));
  const visibleVoices = compactBrowserVoiceOptions(matching.length > 0 ? matching : speechState.voices, selected);
  if (visibleVoices.length > 0) {
    const browserGroup = document.createElement("optgroup");
    browserGroup.label = t(uiLanguage, "voice.group.browser");
    for (const voice of visibleVoices) {
      const option = document.createElement("option");
      option.value = `voice:${voice.name}`;
      option.textContent = `${voice.name} (${voice.lang})`;
      browserGroup.append(option);
    }
    els.voiceSelect.append(browserGroup);
  }
  els.voiceSelect.value = hasSelectOption(els.voiceSelect, selected) ? selected : "";
}

function syncVoiceControls() {
  if (!els.voiceToggle) return;
  els.voiceToggle.textContent = t(uiLanguage, speechState.enabled ? "voice.toggleOn" : "voice.toggleOff");
  els.voiceToggle.setAttribute("aria-pressed", String(speechState.enabled));
  if (els.readLatestButton) els.readLatestButton.textContent = t(uiLanguage, "voice.readLatest");
  if (els.stopVoiceButton) els.stopVoiceButton.textContent = t(uiLanguage, "voice.stop");
  if (els.voiceSelect?.options?.[0]) els.voiceSelect.options[0].textContent = t(uiLanguage, "voice.auto");
}

function applySelectedVoiceProfile(plan) {
  const selection = parseVoiceSelection(speechState.selectedVoiceValue);
  if (!selection.profileId) return plan;
  const profile = listVoiceProfiles(uiLanguage).find((candidate) => candidate.id === selection.profileId);
  if (!profile) return plan;
  const hints = voiceHintsForProfile(profile, uiLanguage);
  return {
    ...plan,
    language: hints.language,
    profile,
    hints
  };
}

function voiceProfileGroupsForMenu(profiles) {
  const buckets = new Map(VOICE_PROFILE_GROUP_ORDER.map((groupId) => [groupId, []]));
  for (const profile of profiles) {
    const groupId = buckets.has(profile.menuGroup) ? profile.menuGroup : "special";
    buckets.get(groupId).push(profile);
  }
  return VOICE_PROFILE_GROUP_ORDER
    .map((id) => ({ id, profiles: buckets.get(id) || [] }))
    .filter((group) => group.profiles.length > 0);
}

function voiceProfileOptionLabel(profile) {
  return localizedVoiceProfileName(profile);
}

function voiceProfileOptionTitle(profile) {
  const roleLabel = localizedVoiceRoleLabel(profile);
  const tuning = profile.voiceTuning || profile;
  const details = uiLanguage === "zh"
    ? [
      localizedVoiceProfileName(profile),
      roleLabel,
      profile.personality,
      profile.usage,
      `年龄 ${localizeVoiceAge(profile.age)}`,
      `语速 ${Number(tuning.rate).toFixed(2)}`,
      `音高 ${Number(tuning.pitch).toFixed(2)}`
    ]
    : [
      `${profile.displayName?.en || profile.label} / ${profile.displayName?.zh || profile.label}`,
      roleLabel,
      profile.personality,
      profile.usage,
      `age ${profile.age}`,
      `rate ${Number(tuning.rate).toFixed(2)}`,
      `pitch ${Number(tuning.pitch).toFixed(2)}`
    ];
  return details.filter(Boolean).join(" · ");
}

function localizedVoiceProfileName(profile) {
  const label = uiLanguage === "zh" ? profile.displayName?.zh || profile.label : profile.displayName?.en || profile.label;
  return uiLanguage === "zh" && label === "AIDM 旁白" ? "主持人旁白" : label;
}

function localizedVoiceRoleLabel(profile) {
  const key = `voice.role.${profile.role}`;
  const translated = t(uiLanguage, key);
  if (translated !== key) return translated;
  return uiLanguage === "zh" ? "角色声线" : humanizeDebugId(profile.role);
}

function localizeVoiceAge(age) {
  if (uiLanguage !== "zh") return age;
  const labels = {
    child: "孩童",
    "young-adult": "青年",
    adult: "成年",
    elder: "年长",
    neutral: "不限"
  };
  return labels[age] || "不限";
}

function compactBrowserVoiceOptions(voices, selectedValue) {
  const sorted = sortBrowserVoiceOptions(voices);
  const compact = sorted.slice(0, MAX_BROWSER_VOICE_OPTIONS);
  const selectedVoiceName = parseVoiceSelection(selectedValue).browserVoiceName;
  if (selectedVoiceName && !compact.some((voice) => voice.name === selectedVoiceName)) {
    const selectedVoice = sorted.find((voice) => voice.name === selectedVoiceName);
    if (selectedVoice) compact.push(selectedVoice);
  }
  return compact;
}

function sortBrowserVoiceOptions(voices) {
  return [...voices].sort((left, right) => {
    const localRank = Number(right.localService !== false) - Number(left.localService !== false);
    if (localRank !== 0) return localRank;
    return `${left.lang || ""} ${left.name || ""}`.localeCompare(`${right.lang || ""} ${right.name || ""}`);
  });
}

function parseVoiceSelection(value = "") {
  if (value.startsWith("profile:")) {
    return { profileId: value.slice("profile:".length), browserVoiceName: "" };
  }
  if (value.startsWith("voice:")) {
    return { profileId: "", browserVoiceName: value.slice("voice:".length) };
  }
  return { profileId: "", browserVoiceName: "" };
}

function legacyVoiceSelection(name) {
  return name ? `voice:${name}` : "";
}

function hasSelectOption(select, value) {
  return Array.from(select.options || []).some((option) => option.value === value);
}

function speakNewTranscriptEntries() {
  if (!speechState.enabled || !room) return;
  const newEntries = (room.transcript || []).filter((entry) => entry.id && !spokenEventIds.has(entry.id));
  for (const entry of newEntries.slice(-3)) {
    spokenEventIds.add(entry.id);
    speakEntry(entry);
  }
}

function readLatestTranscript() {
  const latest = room?.transcript?.at(-1);
  if (latest) {
    speakEntry(latest, { interrupt: true });
  }
}

function speakEntry(entry, { interrupt = false } = {}) {
  if (!supportsSpeech() || !entry?.text) return;
  if (interrupt) {
    stopSpeech();
  }
  const plan = applySelectedVoiceProfile(buildUtterancePlan({ author: entry.author || entry.type, text: entry.text, language: uiLanguage }));
  const selection = parseVoiceSelection(speechState.selectedVoiceValue);
  for (const chunk of splitSpeechText(plan.text)) {
    const utterance = new SpeechSynthesisUtterance(chunk);
    const voice = selectVoice(speechState.voices, plan, selection.browserVoiceName);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || plan.language;
    utterance.rate = clampSpeechNumber(plan.profile.rate * speechState.rate, 1);
    utterance.pitch = clampSpeechNumber(plan.profile.pitch * speechState.pitch, 1);
    utterance.volume = plan.profile.volume;
    window.speechSynthesis.speak(utterance);
  }
}

function stopSpeech() {
  if (supportsSpeech()) {
    window.speechSynthesis.cancel();
  }
}

function primeSpeechHistory(nextRoom) {
  spokenEventIds.clear();
  for (const entry of nextRoom.transcript || []) {
    if (entry.id) spokenEventIds.add(entry.id);
  }
}

function supportsSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function clampSpeechNumber(value, fallback) {
  return Number.isFinite(value) ? Math.max(0.2, Math.min(2, value)) : fallback;
}

function openGuide(tab = "quickstart") {
  selectGuideTab(tab);
  els.guideOverlay.classList.remove("hidden");
  els.guideOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("guide-open");
  els.guideOverlay.querySelector(".guide-tab.active")?.focus({ preventScroll: true });
}

function closeGuide() {
  els.guideOverlay.classList.add("hidden");
  els.guideOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("guide-open");
}

function selectGuideTab(tabName = "quickstart") {
  const target = [...els.guideSections].some((section) => section.dataset.guideSection === tabName)
    ? tabName
    : "quickstart";

  for (const tab of els.guideTabs) {
    const active = tab.dataset.guideTab === target;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  for (const section of els.guideSections) {
    section.classList.toggle("active", section.dataset.guideSection === target);
  }
}

async function api(path, options = {}) {
  const controller = options.timeoutMs ? new AbortController() : null;
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), options.timeoutMs)
    : null;
  let response;
  try {
    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    };
    if (options.auth !== false && authSessionToken && !headers.Authorization && !headers.authorization) {
      headers.Authorization = `Bearer ${authSessionToken}`;
    }
    attachRoomAccessHeaders(path, headers);
    response = await fetch(path, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller?.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    if (timeout) {
      window.clearTimeout(timeout);
    }
  }
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "Request failed");
    error.code = payload.code || "";
    throw error;
  }
  return payload;
}

function attachRoomAccessHeaders(path, headers) {
  const roomId = roomIdFromApiPath(path);
  if (!roomId) return headers;
  const storedHostToken = localStorage.getItem(roomHostTokenKey(roomId)) || (room?.id === roomId ? hostToken : "");
  const storedPlayerId = localStorage.getItem(roomPlayerIdKey(roomId)) || (room?.id === roomId ? playerId : "");
  const storedPlayerToken = localStorage.getItem(roomPlayerTokenKey(roomId)) || (room?.id === roomId ? playerToken : "");
  const storedPendingPlayerId = localStorage.getItem(roomPendingPlayerIdKey(roomId)) || (room?.id === roomId ? pendingPlayerId : "");
  const storedPendingPlayerToken = localStorage.getItem(roomPendingPlayerTokenKey(roomId)) || (room?.id === roomId ? pendingPlayerToken : "");
  const accessPlayerId = storedPlayerId || storedPendingPlayerId;
  const accessPlayerToken = storedPlayerToken || storedPendingPlayerToken;
  if (storedHostToken && !headers["X-AIDM-Host-Token"] && !headers["x-aidm-host-token"]) {
    headers["X-AIDM-Host-Token"] = storedHostToken;
  }
  if (accessPlayerId && accessPlayerToken) {
    if (!headers["X-AIDM-Player-Id"] && !headers["x-aidm-player-id"]) {
      headers["X-AIDM-Player-Id"] = accessPlayerId;
    }
    if (!headers["X-AIDM-Player-Token"] && !headers["x-aidm-player-token"]) {
      headers["X-AIDM-Player-Token"] = accessPlayerToken;
    }
  }
  if (storedPendingPlayerId && storedPendingPlayerToken) {
    if (!headers["X-AIDM-Pending-Player-Id"] && !headers["x-aidm-pending-player-id"]) {
      headers["X-AIDM-Pending-Player-Id"] = storedPendingPlayerId;
    }
    if (!headers["X-AIDM-Pending-Player-Token"] && !headers["x-aidm-pending-player-token"]) {
      headers["X-AIDM-Pending-Player-Token"] = storedPendingPlayerToken;
    }
  }
  return headers;
}

function roomIdFromApiPath(path) {
  const pathname = String(path || "").split("?")[0];
  const match = /^\/api\/rooms\/([^/]+)/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : "";
}

function drawLoop(time = 0) {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const soundscape = room?.soundscape?.id || "mystery";
  const intensity = room?.soundscape?.intensity || 0.25;
  const threat = room?.scene?.clocks?.danger ?? room?.scene?.threat ?? 1;
  ctx.clearRect(0, 0, width, height);

  drawAtmosphereTint(ctx, width, height, soundscape, intensity, threat);

  if (soundscape.includes("rain") || soundscape === "market-city") {
    drawRain(ctx, width, height, time, intensity);
  }
  if (soundscape === "forest" || soundscape === "insects" || soundscape === "calm-night") {
    drawMotes(ctx, width, height, time, intensity, soundscape);
  }
  if (soundscape === "campfire" || soundscape === "combat-tension") {
    drawEmbers(ctx, width, height, time, intensity);
  }
  if (soundscape === "waterfall" || soundscape === "pond") {
    drawMist(ctx, width, height, time, intensity);
  }
  if (soundscape === "combat-tension") {
    drawDangerPulse(ctx, width, height, time, intensity);
  }

  animationFrame = requestAnimationFrame(drawLoop);
}

function drawAtmosphereTint(ctx, width, height, soundscape, intensity, threat) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const danger = threat > 3 || soundscape === "combat-tension";
  gradient.addColorStop(0, danger ? "rgba(99, 31, 28, 0.22)" : "rgba(11, 22, 25, 0.14)");
  gradient.addColorStop(0.62, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${0.18 + intensity * 0.16})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRain(ctx, width, height, time, intensity) {
  ctx.strokeStyle = `rgba(203, 228, 235, ${0.16 + intensity * 0.18})`;
  ctx.lineWidth = 1.5;
  const count = Math.floor(38 + intensity * 48);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 83 + time / (12 + (i % 7))) % (width + 160) - 80;
    const y = (i * 47 + time / (8 + (i % 5))) % (height + 120) - 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 24, y + 80);
    ctx.stroke();
  }
}

function drawMotes(ctx, width, height, time, intensity, soundscape) {
  const warm = soundscape === "insects" || soundscape === "calm-night";
  const count = Math.floor(20 + intensity * 32);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 97 + Math.sin(time / 1300 + i) * 34) % width;
    const y = (i * 61 + Math.cos(time / 1100 + i) * 26) % height;
    ctx.fillStyle = warm ? "rgba(232, 207, 112, 0.28)" : "rgba(187, 232, 201, 0.2)";
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEmbers(ctx, width, height, time, intensity) {
  const count = Math.floor(18 + intensity * 34);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 71 + Math.sin(time / 800 + i) * 48) % width;
    const y = height - ((i * 43 + time / (18 + (i % 5))) % (height * 0.72));
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 197, 93, 0.45)" : "rgba(217, 91, 48, 0.34)";
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMist(ctx, width, height, time, intensity) {
  ctx.fillStyle = `rgba(189, 228, 225, ${0.05 + intensity * 0.08})`;
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 211 + time / 18) % (width + 320)) - 160;
    const y = height * (0.18 + (i % 5) * 0.14);
    ctx.beginPath();
    ctx.ellipse(x, y, 180 + i * 9, 26 + (i % 3) * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDangerPulse(ctx, width, height, time, intensity) {
  const alpha = (0.08 + intensity * 0.12) * (0.5 + Math.sin(time / 420) * 0.5);
  ctx.strokeStyle = `rgba(214, 73, 58, ${alpha})`;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, width - 10, height - 10);
}

function getLocalPlayer() {
  if (!room || !playerId) return null;
  return room.players.find((player) => player.id === playerId) || null;
}

function equipmentSlotSummary(inventory = [], equipmentSummary = null) {
  const slots = [
    { id: "weapon", label: t(uiLanguage, "slot.weapon"), summarySlot: "mainHand", match: /weapon|sword|bow|staff|mace|dagger/i },
    { id: "armor", label: t(uiLanguage, "slot.armor"), summarySlot: "body", match: /armor|robe|chainmail|leather/i },
    { id: "focus", label: t(uiLanguage, "slot.focus"), summarySlot: "offHand", match: /scroll|spell|focus|holy|arcane/i },
    { id: "kit", label: t(uiLanguage, "slot.kit"), summarySlot: "accessory", match: /tool|kit|lamp|notebook|key/i }
  ];
  const items = slots.map((slot) => {
    const summaryItem = equipmentSummary?.slots?.[slot.summarySlot]?.item;
    const entry = inventoryEntryMatchesSlot(summaryItem, slot)
      ? summaryItem
      : inventory.find((item) => item?.equipped && inventoryEntryMatchesSlot(item, slot))
        || inventory.find((item) => !inventory.some((candidate) => candidate?.equipped) && inventoryEntryMatchesSlot(item, slot));
    return {
      label: slot.label,
      value: entry ? inventoryItemName(entry) : t(uiLanguage, "slot.empty")
    };
  });
  return {
    items,
    compact: items.map((slot) => slot.value === t(uiLanguage, "slot.empty") ? "-" : slot.label).join("/")
  };
}

function inventoryEntryMatchesSlot(item, slot) {
  if (!item) return false;
  const definition = inventoryDefinition(item);
  return slot.match.test(`${item?.itemId || ""} ${definition.categoryLabel} ${definition.label}`);
}

function marketOfferDefinition(offer) {
  const definition = offer?.definition || offer?.definitionSnapshot || {};
  const toolUseLabel = localizeTextValue(definition.toolUse?.label)
    || localizeTextValue(offer?.toolUse?.label)
    || definition.toolUseLabel
    || offer?.toolUseLabel
    || "";
  return {
    label: definition.label
      || localizeTextValue(definition.name)
      || displayNameFromId(offer?.itemId)
      || t(uiLanguage, "inventory.item"),
    category: definition.categoryId || definition.categoryKey || definition.category || "",
    categoryLabel: definition.categoryLabel
      || localizeTextValue(definition.category)
      || definition.category
      || t(uiLanguage, "inventory.item"),
    description: definition.descriptionText
      || localizeTextValue(definition.description)
      || "",
    slot: offer?.slot || definition.slot || null,
    slotLabel: definition.slotLabel || "",
    useEffectLabel: definition.useEffectLabel || "",
    toolUseLabel,
    assetRef: offer?.assetRef || definition.assetRef || offer?.image || definition.image || offer?.art || definition.art || null,
    image: definition.image || offer?.image || null,
    art: definition.art || offer?.art || null
  };
}

function marketPriceLabel(offer) {
  const price = Number(offer?.price ?? offer?.purchasePrice ?? 0);
  const backendLabel = String(offer?.purchasePriceLabel || offer?.priceLabel || offer?.economy?.purchasePrice?.label || "").trim();
  if (backendLabel && isCurrentCurrencyLabel(backendLabel)) return backendLabel;
  return `${price} ${t(uiLanguage, "currency.cr")}`;
}

function marketPriceRole(offer) {
  return offer?.priceRole || offer?.purchasePriceRole || offer?.economy?.purchasePrice?.role || "purchase-price";
}

function marketPriceRoleLabel(offer) {
  return offer?.priceRoleLabel
    || offer?.purchasePriceRoleLabel
    || offer?.economy?.purchasePrice?.roleLabel
    || economyRoleLabel("purchase-price");
}

function marketResaleLine(offer) {
  const label = offer?.resaleValueLabel || offer?.saleValueLabel || offer?.sellValueLabel || offer?.economy?.resaleValue?.label || "";
  if (!label || !isCurrentCurrencyLabel(label)) return null;
  const role = offer?.saleValueRole || offer?.resaleValueRole || offer?.economy?.resaleValue?.role || "resale-value";
  const roleLabel = offer?.saleValueRoleLabel
    || offer?.resaleValueRoleLabel
    || offer?.economy?.resaleValue?.roleLabel
    || economyRoleLabel(role);
  return {
    role,
    label: `${roleLabel}: ${label}`,
    title: `${roleLabel}: ${label}`
  };
}

function marketPurchaseState(offer, wallet) {
  const reasonFallbacks = marketReasonFallbacks();
  const reasonCode = marketPurchaseReasonCode(offer, wallet);
  if (reasonCode) {
    const reason = marketPurchaseReasonLabel(offer, reasonCode, reasonFallbacks);
    return { canBuy: false, reason, reasonCode };
  }
  const explicitCanBuy = offer?.canBuy ?? offer?.purchaseState?.canBuy;
  if (explicitCanBuy === false) {
    const reason = marketPurchaseReasonLabel(offer, "unavailable", reasonFallbacks);
    return { canBuy: false, reason, reasonCode: "unavailable" };
  }
  return { canBuy: true, reason: "", reasonCode: "available" };
}

function marketPurchaseReasonCode(offer, wallet) {
  const state = offer?.purchaseState || {};
  const explicit = normalizeReasonCode(offer?.purchaseRestriction || offer?.availabilityReason || offer?.reasonCode || state.reasonCode || state.reason);
  if (explicit && explicit !== "available") return explicit;
  if (offer?.purchasable === false || offer?.buyable === false || state.ruleLocked || offer?.ruleLocked) return "rule-locked";
  const quantity = offer?.quantity ?? offer?.stock ?? offer?.availableQuantity;
  if (state.soldOut || offer?.soldOut || (quantity !== undefined && Number(quantity) <= 0)) return "sold-out";
  const ownedQuantity = Number(state.ownedQuantity ?? offer?.ownedQuantity ?? 0);
  const purchaseLimit = state.purchaseLimit ?? offer?.purchaseLimit;
  if (state.owned || offer?.owned || (ownedQuantity > 0 && purchaseLimit !== null && purchaseLimit !== undefined && ownedQuantity >= Number(purchaseLimit))) return "owned";
  if (state.insufficientFunds || offer?.insufficientFunds || Number(wallet || 0) < Number(offer?.price || offer?.purchasePrice || 0)) return "insufficient-funds";
  if (offer?.available === false || offer?.canBuy === false || state.canBuy === false) return "unavailable";
  return "";
}

function marketPurchaseReasonLabel(offer, reasonCode, fallbacks = {}) {
  const normalizedReasonCode = normalizeReasonCode(reasonCode);
  if (isStandardMarketReasonCode(normalizedReasonCode)) return marketReasonFallbackLabel(normalizedReasonCode);

  const state = offer?.purchaseState || {};
  const backendReasonCode = normalizeReasonCode(offer?.purchaseRestriction || offer?.availabilityReason || offer?.reasonCode || state.reasonCode || state.reason);
  const backendLabels = [
    offer?.purchaseRestrictionLabel,
    state.reasonLabel,
    state.label,
    state.help,
    backendReasonCode === normalizedReasonCode ? offer?.availabilityLabel : ""
  ];
  const backendLabel = backendLabels
    .map((label) => localizeTextValue(label))
    .find((label) => label && !isAvailableMarketReasonLabel(label));
  return backendLabel
    || fallbacks[normalizedReasonCode]
    || marketReasonFallbackLabel(normalizedReasonCode)
    || fallbacks.unavailable
    || "";
}

function marketReasonFallbacks() {
  return {
    available: marketReasonFallbackLabel("available"),
    unavailable: marketReasonFallbackLabel("unavailable"),
    "rule-locked": marketReasonFallbackLabel("rule-locked"),
    owned: marketReasonFallbackLabel("owned"),
    "sold-out": marketReasonFallbackLabel("sold-out"),
    "insufficient-funds": marketReasonFallbackLabel("insufficient-funds")
  };
}

function marketReasonFallbackLabel(reasonCode) {
  const keys = {
    available: "market.state.available",
    "rule-locked": "market.state.ruleLocked",
    owned: "market.state.owned",
    "sold-out": "market.state.soldOut",
    "insufficient-funds": "market.state.insufficientFunds",
    unavailable: "market.state.unavailable"
  };
  const key = keys[normalizeReasonCode(reasonCode)];
  return key ? t(uiLanguage, key) : "";
}

function isStandardMarketReasonCode(reasonCode) {
  return ["insufficient-funds", "owned", "sold-out", "rule-locked", "unavailable"].includes(normalizeReasonCode(reasonCode));
}

function isAvailableMarketReasonLabel(label) {
  const normalized = String(label || "").trim().toLowerCase();
  return normalized === "available" || normalized === "purchasable" || String(label || "").trim() === "可购买";
}

function marketOfferStatusLabel(purchaseState) {
  if (purchaseState?.canBuy) return marketReasonFallbackLabel("available");
  return purchaseState?.reason || marketReasonFallbackLabel(purchaseState?.reasonCode || "unavailable");
}

function marketOfferBlockedHint(reason) {
  return t(uiLanguage, "market.card.blockedHint", { reason: reason || marketReasonFallbackLabel("unavailable") });
}

function marketOfferCardAriaLabel(definition, offer, statusLabel) {
  const item = definition?.label || t(uiLanguage, "inventory.item");
  const price = `${marketPriceRoleLabel(offer)}: ${marketPriceLabel(offer)}`;
  return t(uiLanguage, "market.cardAria", { item, price, status: statusLabel || marketReasonFallbackLabel("unavailable") });
}

function marketBuyButtonLabel(definition, purchaseStateOrReason = "") {
  const item = definition?.label || t(uiLanguage, "inventory.item");
  const reason = typeof purchaseStateOrReason === "string"
    ? purchaseStateOrReason
    : purchaseStateOrReason?.reason || "";
  if (reason) return t(uiLanguage, "market.buyAriaDisabled", { item, reason });
  return t(uiLanguage, "market.buyAria", { item });
}

function marketOfferActionHint(offer, definition = marketOfferDefinition(offer)) {
  const actions = offer?.actions || {};
  const equipAvailable = actions.equip?.available ?? Boolean(offer?.slot || definition.slot);
  const useAvailable = actions.use?.available ?? Boolean(offer?.usable);
  const toolUse = inventoryUseEffectLabel(offer, definition);
  if (isToolLikeItem(offer, definition) && useAvailable) {
    const base = t(uiLanguage, "market.card.useAfterBuy");
    return toolUse ? `${base} ${toolUse}` : base;
  }
  if (isToolLikeItem(offer, definition) && equipAvailable) {
    return t(uiLanguage, "market.card.equipAfterBuy", { slot: inventorySlotLabel(offer, definition) });
  }
  if (useAvailable) return t(uiLanguage, "market.card.useAfterBuy");
  if (equipAvailable) return t(uiLanguage, "market.card.equipAfterBuy", { slot: inventorySlotLabel(offer, definition) });
  if (isToolLikeItem(offer, definition)) return t(uiLanguage, "market.card.toolAfterBuy");
  return t(uiLanguage, "market.card.inspectAfterBuy");
}

function marketStockLabel(offer) {
  const quantity = offer?.quantity ?? offer?.stock ?? offer?.availableQuantity;
  if (quantity === undefined || quantity === null) return "";
  return t(uiLanguage, "market.card.stock", { count: Number(quantity) });
}

function isCurrentCurrencyLabel(label) {
  if (uiLanguage === "zh") return /克朗$/.test(label) && !/\bCR\b/.test(label);
  return /\bCR$/.test(label);
}

function economyRoleLabel(role) {
  const labels = {
    "base-value": { en: "Base value", zh: "基础估值" },
    "inventory-value": { en: "Inventory value", zh: "背包估值" },
    "purchase-price": { en: "Purchase price", zh: "购买价格" },
    "resale-value": { en: "Resale value", zh: "转售价值" }
  };
  return localizeTextValue(labels[role]) || "";
}

function normalizeReasonCode(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  const aliases = {
    "already-owned": "owned",
    insufficientfunds: "insufficient-funds",
    "insufficient-funds": "insufficient-funds",
    "not-enough-crowns": "insufficient-funds",
    "not-enough-cr": "insufficient-funds",
    "not-enough-currency": "insufficient-funds",
    outofstock: "sold-out",
    "out-of-stock": "sold-out",
    soldout: "sold-out",
    "sold-out": "sold-out",
    rulelocked: "rule-locked",
    "rule-locked": "rule-locked"
  };
  return aliases[normalized] || normalized;
}

function displayNameFromId(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const normalized = normalizeGeneratedItemId(text)
    .replace(/^aidm-/, "")
    .replace(/\b\d{2,}\b/g, "")
    .replace(/\.(png|jpg|jpeg|webp|svg)$/i, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSpellName(spellId) {
  const known = Object.values(STARTER_SPELLS_BY_CLASS).flat().find((spell) => spell.id === spellId);
  if (known) return localizeTextValue(known.label);
  return String(spellId || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSpellIcon(spellId) {
  if (/heal|ward|shield|light/.test(spellId)) return "+";
  if (/fire|bolt|omen/.test(spellId)) return "*";
  if (/sleep|shadow/.test(spellId)) return "~";
  return "^";
}

function spellArtMarkup(spellId, label, className) {
  const file = spellArtFile(spellId);
  if (!file) {
    return `<span class="${escapeHtml(className)} spell-art-fallback" aria-hidden="true">${escapeHtml(formatSpellIcon(spellId))}</span>`;
  }
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(assetUrl(file))}" alt="" loading="lazy" decoding="async" />`;
}

function spellArtFile(spellId) {
  const normalized = String(spellId || "").trim().toLowerCase();
  if (SPELL_ART_FILES[normalized]) return SPELL_ART_FILES[normalized];
  if (/heal|mend/.test(normalized)) return SPELL_ART_FILES["healing-word"];
  if (/ward|shield|light/.test(normalized)) return SPELL_ART_FILES.ward;
  if (/fire|bolt|ember/.test(normalized)) return SPELL_ART_FILES.firebolt;
  if (/sleep|veil/.test(normalized)) return SPELL_ART_FILES.sleep;
  if (/thorn|vine|snare|bind/.test(normalized)) return SPELL_ART_FILES["binding-vines"];
  return "";
}

function inventoryItemName(item) {
  return inventoryDefinition(item).label;
}

function inventoryDefinition(item) {
  const snapshot = item?.definitionSnapshot || item?.definition || {};
  const fallback = FRONTEND_ITEM_DEFINITIONS[item?.itemId] || FRONTEND_ITEM_DEFINITIONS[normalizeGeneratedItemId(item?.itemId)] || {};
  const label = snapshot.label
    || localizeTextValue(snapshot.name)
    || localizeTextValue(fallback.name)
    || displayNameFromId(item?.itemId)
    || t(uiLanguage, "inventory.item");
  const categoryLabel = snapshot.categoryLabel
    || localizeTextValue(snapshot.category)
    || localizeTextValue(fallback.category)
    || snapshot.category
    || fallback.category
    || t(uiLanguage, "inventory.item");
  const category = snapshot.categoryId || snapshot.categoryKey || snapshot.category || fallback.category || "";
  const description = snapshot.descriptionText
    || localizeTextValue(snapshot.description)
    || localizeTextValue(fallback.description)
    || "";
  const slot = item?.slot || snapshot.slot || fallback.slot || null;
  const slotLabel = snapshot.slotLabel || "";
  const assetRef = item?.assetRef || snapshot.assetRef || item?.image || snapshot.image || item?.art || snapshot.art || fallback.assetRef || null;
  const rarity = item?.rarity || snapshot.rarity || fallback.rarity || "";
  const rarityLabel = item?.rarityLabel || snapshot.rarityLabel || fallback.rarityLabel || "";
  const useEffectLabel = item?.useEffectLabel || snapshot.useEffectLabel || fallback.useEffectLabel || "";
  const toolUseLabel = item?.toolUseLabel
    || localizeTextValue(item?.toolUse?.label)
    || snapshot.toolUseLabel
    || localizeTextValue(snapshot.toolUse?.label)
    || fallback.toolUseLabel
    || localizeTextValue(fallback.toolUse?.label)
    || "";
  return { label, category, categoryLabel, description, slot, slotLabel, assetRef, rarity, rarityLabel, useEffectLabel, toolUseLabel, image: snapshot.image || item?.image || null, art: snapshot.art || item?.art || null };
}

function itemArtMarkup(item, definition, className) {
  const file = itemArtFile(item, definition);
  const label = definition?.label || item?.itemId || t(uiLanguage, "inventory.item");
  if (!file) {
    return `<span class="${className} item-art-fallback" aria-hidden="true">${escapeHtml(itemArtFallbackGlyph(label))}</span>`;
  }
  return `<img class="${className}" src="${escapeHtml(assetUrl(file))}" alt="${escapeHtml(label)}" loading="lazy" decoding="async" />`;
}

function itemArtFile(item, definition = {}) {
  const direct = assetRefFile(item?.assetRef)
    || assetRefFile(item?.definition?.assetRef)
    || assetRefFile(item?.definitionSnapshot?.assetRef)
    || assetRefFile(definition?.assetRef)
    || assetRefFile(item?.definition?.image)
    || assetRefFile(item?.definitionSnapshot?.image)
    || assetRefFile(definition?.image)
    || assetRefFile(item?.definition?.art)
    || assetRefFile(item?.definitionSnapshot?.art)
    || assetRefFile(definition?.art)
    || assetRefFile(item?.asset)
    || assetRefFile(item?.art)
    || assetRefFile(item?.image)
    || assetRefFile(item?.icon)
    || assetRefFile(item?.thumbnail)
    || assetRefFile(item?.generated)
    || assetRefFile(item?.generatedAsset)
    || item?.generatedAssetFile
    || item?.generatedFile
    || item?.file
    || item?.imageFile
    || item?.iconFile
    || "";
  if (direct) return direct;
  return mappedItemArtFile(item, definition);
}

function mappedItemArtFile(item, definition = {}) {
  const itemId = normalizeGeneratedItemId(item?.itemId || item?.id || definition?.itemId || "");
  if (ITEM_ART_FILES[itemId]) return ITEM_ART_FILES[itemId];
  if (GENERATED_REWARD_ART_FILES[itemId]) return GENERATED_REWARD_ART_FILES[itemId];
  const text = [
    itemId,
    item?.name,
    item?.label,
    definition.label,
    definition.categoryLabel,
    definition.category,
    definition.slot,
    definition.slotLabel
  ].filter(Boolean).join(" ").toLowerCase();
  const categoryKey = itemCategoryArtKey(text);
  return ITEM_CATEGORY_ART_FILES[categoryKey] || "";
}

function itemCategoryArtKey(text) {
  if (/shield|盾/.test(text)) return "shield";
  if (/weapon|sword|bow|dagger|mace|staff|blade|武器|剑|弓|匕首|钉锤|法杖|杖/.test(text)) return "weapon";
  if (/armor|robe|chainmail|leather|wearable|护甲|甲|袍/.test(text)) return "armor";
  if (/scroll|spell|arcane|holy|magic|法卷|法术|奥术|神圣/.test(text)) return "scroll";
  if (/quest|clue|key|warrant|map|任务|线索|钥匙|地图|令状/.test(text)) return "quest";
  if (/trade|ledger|portrait|signet|good|可售卖|账本|肖像|印戒/.test(text)) return "trade";
  if (/food|wine|drink|ration|食品|酒/.test(text)) return "food";
  if (/consumable|potion|antidote|healing|消耗|药|解毒|治疗/.test(text)) return "consumable";
  if (/kit|tool|lamp|notebook|compass|rope|工具|提灯|札记|罗盘|绳/.test(text)) return "tool";
  if (/reward|trophy|prize|收获|奖励|战利品/.test(text)) return "reward";
  return "item";
}

function rewardArtFile(entry) {
  const reward = entry?.reward || entry || {};
  if (!reward || typeof reward !== "object") return "";
  const direct = assetRefFile(reward.assetRef)
    || assetRefFile(reward.asset)
    || assetRefFile(reward.image)
    || assetRefFile(reward.icon)
    || assetRefFile(reward.generated)
    || reward.file
    || reward.generatedFile
    || reward.imageFile
    || reward.iconFile
    || "";
  if (direct) return direct;
  const generatedKey = generatedAssetKey(reward.itemId || reward.id || reward.semanticKey || reward.name || localizeTextValue(reward.displayName));
  if (GENERATED_REWARD_ART_FILES[generatedKey]) return GENERATED_REWARD_ART_FILES[generatedKey];
  const definition = rewardDefinition(reward);
  return mappedItemArtFile({
    itemId: reward.itemId || reward.id || reward.name || "reward",
    name: localizeTextValue(reward.displayName) || reward.name,
    label: localizeTextValue(reward.displayName) || reward.name
  }, definition) || ITEM_CATEGORY_ART_FILES.reward;
}

function rewardDefinition(reward) {
  return {
    label: localizeTextValue(reward.displayName) || displayNameFromId(reward.name || reward.itemId || reward.id) || t(uiLanguage, "reward.item"),
    categoryLabel: localizeTextValue(reward.category) || reward.categoryLabel || t(uiLanguage, "reward.item"),
    category: reward.category || "reward",
    assetRef: reward.assetRef || null
  };
}

function assetRefFile(assetRef) {
  if (!assetRef) return "";
  if (typeof assetRef === "string") return assetRef;
  return assetRef.file
    || assetRef.path
    || assetRef.src
    || assetRef.url
    || assetRef.href
    || assetRef.imageFile
    || assetRef.generatedFile
    || assetRef.image?.file
    || assetRef.image?.path
    || assetRef.art?.file
    || assetRef.art?.path
    || assetRef.asset?.file
    || assetRef.asset?.path
    || assetRef.generated?.file
    || assetRef.generated?.path
    || assetRef.icon?.file
    || "";
}

function itemArtFallbackGlyph(label) {
  return String(label || "?").trim().charAt(0).toUpperCase() || "?";
}

function normalizeGeneratedItemId(itemId = "") {
  const value = String(itemId || "").trim().toLowerCase();
  if (!value) return "";
  if (value.startsWith("generated:")) return generatedAssetKey(value.slice("generated:".length));
  return generatedAssetKey(value);
}

function generatedAssetKey(value = "") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^items?\./, "")
    .replace(/^equipment\.reward\./, "")
    .replace(/^reward\./, "")
    .replace(/\.v\d+$/, "")
    .replace(/\.cutout$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (GENERATED_REWARD_ART_FILES[normalized]) return normalized;
  const parts = normalized.split("-").filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    const candidate = parts.slice(index).join("-");
    if (GENERATED_REWARD_ART_FILES[candidate] || ITEM_ART_FILES[candidate]) return candidate;
  }
  return normalized || "generated";
}

function isEquippableInventoryItem(item, definition = inventoryDefinition(item)) {
  return Boolean(item?.slot || definition.slot);
}

function isInventoryItemSellable(item) {
  return item?.tradeable !== false && item?.sellable !== false;
}

function isCurrentEquipmentItem(item, definition = inventoryDefinition(item)) {
  const slot = item?.slot || definition.slot;
  const summaryItem = getLocalPlayer()?.character?.equipmentSummary?.slots?.[slot]?.item;
  if (!summaryItem) return Boolean(item?.equipped);
  if (summaryItem.id && item?.id) return summaryItem.id === item.id;
  return Boolean(summaryItem.itemId && summaryItem.itemId === item?.itemId && item?.equipped);
}

function inventoryConditionLabel(item) {
  return item?.conditionLabel || localizeTextValue(CONDITION_LABELS[item?.condition]) || item?.condition || "";
}

function inventoryRarityLabel(item, definition = inventoryDefinition(item)) {
  return item?.rarityLabel || definition?.rarityLabel || item?.rarity || definition?.rarity || "";
}

function inventoryValueLabel(item) {
  const economyLabel = item?.economy?.inventoryValue?.label;
  return item?.valueLabel || economyLabel || `${Number(item?.value || 0)} ${t(uiLanguage, "currency.cr")}`;
}

function inventoryListValueLabel(item) {
  return `${inventoryValueRoleLabel(item)}: ${inventoryValueLabel(item)}`;
}

function inventoryValueRoleLabel(item) {
  return item?.valueRoleLabel
    || item?.economy?.inventoryValue?.roleLabel
    || economyRoleLabel("inventory-value")
    || t(uiLanguage, "inventory.value");
}

function inventorySellValueRoleLabel(item) {
  return item?.saleValueRoleLabel
    || item?.sellValueRoleLabel
    || item?.resaleValueRoleLabel
    || item?.economy?.resaleValue?.roleLabel
    || economyRoleLabel("resale-value")
    || t(uiLanguage, "inventory.sellValue");
}

function vitalCardMarkup(kind, value, max, label) {
  return `
    <article>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatVital(value, max))}</strong>
      ${vitalBarMarkup(kind, value, max, label)}
    </article>
  `;
}

function vitalMeterMarkup(kind, value, max, label) {
  return `
    <span class="vital-meter ${escapeHtml(kind)}" aria-label="${escapeHtml(`${label} ${formatVital(value, max)}`)}">
      <span class="vital-meter-head">
        <span class="vital-label">${escapeHtml(label)}</span>
        <span class="vital-value">${escapeHtml(formatVital(value, max))}</span>
      </span>
      ${vitalBarMarkup(kind, value, max, label)}
    </span>
  `;
}

function vitalBarMarkup(kind, value, max, label) {
  const percent = vitalPercent(value, max);
  return `
    <span class="vital-bar ${escapeHtml(kind)}" aria-label="${escapeHtml(`${label} ${formatVital(value, max)}`)}">
      <span style="width: ${percent}%"></span>
    </span>
  `;
}

function formatVital(value, max) {
  const current = Number.isFinite(Number(value)) ? Number(value) : 0;
  const cap = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : Math.max(1, current);
  return `${current}/${cap}`;
}

function vitalPercent(value, max) {
  const current = Number.isFinite(Number(value)) ? Number(value) : 0;
  const cap = Number.isFinite(Number(max)) && Number(max) > 0 ? Number(max) : Math.max(1, current);
  return Math.max(0, Math.min(100, Math.round((current / cap) * 100)));
}

function avatarMarkup(player, className) {
  const descriptor = avatarDescriptor(player);
  const image = descriptor.file;
  const name = player?.character?.name || player?.name || "?";
  const style = image ? ` style="background-image: ${escapeHtml(cssUrl(assetUrl(image)))}"` : "";
  const avatarClass = `${className} ${descriptor.kind === "custom" ? "avatar-custom" : "avatar-icon"}`;
  return `<span class="${escapeHtml(avatarClass)}" data-avatar-kind="${escapeHtml(descriptor.kind)}" data-avatar-id="${escapeHtml(descriptor.id)}" title="${escapeHtml(descriptor.label || name)}"${style}>${image ? "" : escapeHtml(initials(name))}</span>`;
}

function applyAvatar(node, player) {
  const descriptor = avatarDescriptor(player);
  const image = descriptor.file;
  node.style.backgroundImage = image ? cssUrl(assetUrl(image)) : "";
  node.classList.toggle("avatar-custom", descriptor.kind === "custom");
  node.classList.toggle("avatar-icon", descriptor.kind !== "custom");
  node.dataset.avatarKind = descriptor.kind;
  node.dataset.avatarId = descriptor.id;
  node.title = descriptor.label || player?.character?.name || player?.name || "?";
  node.textContent = image ? "" : initials(player?.character?.name || player?.name || "?");
}

function avatarFile(player) {
  return avatarDescriptor(player).file;
}

function avatarDescriptor(player) {
  const character = player?.character || {};
  const customFile = customAvatarFile(player);
  if (customFile) {
    return {
      file: customFile,
      kind: "custom",
      id: "custom",
      label: character.name || player?.name || ""
    };
  }
  const classId = characterClassId(character);
  if (CLASS_AVATAR_FILES[classId]) {
    return {
      file: CLASS_AVATAR_FILES[classId],
      kind: "class",
      id: classId,
      label: localizedClassName(character)
    };
  }
  const speciesId = characterSpeciesId(character);
  if (SPECIES_AVATAR_FILES[speciesId]) {
    return {
      file: SPECIES_AVATAR_FILES[speciesId],
      kind: "species",
      id: speciesId,
      label: localizedSpeciesName(character)
    };
  }
  return {
    file: "",
    kind: "initials",
    id: "",
    label: character.name || player?.name || ""
  };
}

function customAvatarFile(player) {
  return player?.character?.avatar?.file
    || player?.character?.avatar?.assetRef?.file
    || player?.character?.avatar?.url
    || "";
}

function initials(value) {
  return String(value || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function humanizeDebugId(value) {
  return String(value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

window.addEventListener("beforeunload", () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
