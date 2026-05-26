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
let rejectedAccessNotice = null;
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
let rewardToastTimer = null;
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
  summary: 22,
  dense: 14,
  comfortable: 8
};
const LOG_MOBILE_MAIN_LIMITS = {
  summary: 12,
  dense: 9,
  comfortable: 6
};
const REWARD_TOAST_DURATION_MS = 3800;
let logDensity = normalizeLogDensity(localStorage.getItem("aidm.logDensity"));

const ROOM_SESSION_PREFIX = "aidm.rooms.";
const ACTION_REQUEST_TIMEOUT_MS = 10000;
const MARKET_REQUEST_TIMEOUT_MS = 10000;
const REPLAY_REQUEST_TIMEOUT_MS = 10000;
const INVENTORY_ACTION_TIMEOUT_MS = 10000;
const GENERATED_RASTER_FALLBACK_FILES = Object.freeze({
  action: "assets/items/brass-compass.svg",
  armor: "assets/items/healer-kit.svg",
  class: "assets/classes/warrior.svg",
  consumable: "assets/items/ashroot-antidote.svg",
  item: "assets/items/brass-compass.svg",
  reward: "assets/items/silver-ledger.svg",
  scene: "assets/scenes/rain-archive.svg",
  scroll: "assets/items/sealed-warrant.svg",
  spell: "assets/spells/ember-bolt.svg",
  status: "assets/spells/silver-ward.svg",
  token: "assets/enemies/street-skirmisher.svg",
  tool: "assets/items/brass-compass.svg",
  weapon: "assets/weapons/longsword.svg"
});

document.addEventListener("error", handleRuntimeAssetImageError, true);

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
    { id: "firebolt", label: { en: "Firebolt", zh: "火矢" }, detail: { en: "Already learned; usable from the first scene.", zh: "已学会；第一幕即可使用。" } },
    { id: "sleep", label: { en: "Sleep", zh: "沉眠咒" }, detail: { en: "Already learned; use to control a vulnerable target.", zh: "已学会；适合控制虚弱目标。" } },
    { id: "arcane-shield", label: { en: "Arcane Shield", zh: "奥术护盾" }, detail: { en: "Already learned; raise defense before impact.", zh: "已学会；在受击前提高防御。" } },
    { id: "glass-echo", label: { en: "Glass Echo", zh: "琉璃回声" }, detail: { en: "Already learned; inspect hidden details.", zh: "已学会；用于读取隐蔽细节。" } },
    { id: "storm-arc", label: { en: "Storm Arc", zh: "风暴弧光" }, detail: { en: "Already learned; spend mana for lightning pressure.", zh: "已学会；消耗法力制造雷电压制。" } }
  ],
  cleric: [
    { id: "healing-word", label: { en: "Healing Word", zh: "回春短句" }, detail: { en: "Already learned; restore an ally at range.", zh: "已学会；远距离恢复盟友生命。" } },
    { id: "radiant-bolt", label: { en: "Radiant Bolt", zh: "辉光箭" }, detail: { en: "Already learned; strike from range with light.", zh: "已学会；用光芒远程打击。" } },
    { id: "ward", label: { en: "Ward", zh: "守护印" }, detail: { en: "Already learned; raise an ally's defense.", zh: "已学会；提高一名盟友防御。" } },
    { id: "cleanse-poison", label: { en: "Cleanse Poison", zh: "净毒术" }, detail: { en: "Already learned; clear poison pressure.", zh: "已学会；清除中毒压力。" } }
  ],
  ranger: [
    { id: "binding-vines", label: { en: "Binding Vines", zh: "缚藤术" }, detail: { en: "Already learned; hold a route or fleeing enemy.", zh: "已学会；拦住路线或逃跑敌人。" } },
    { id: "frost-bind", label: { en: "Frost Bind", zh: "霜缚" }, detail: { en: "Already learned; slow a target through terrain.", zh: "已学会；借地形减缓目标。" } }
  ],
  bard: [
    { id: "healing-word", label: { en: "Healing Word", zh: "回春短句" }, detail: { en: "Already learned; keep an ally in the scene.", zh: "已学会；让盟友留在场景中。" } },
    { id: "sleep", label: { en: "Sleep", zh: "沉眠咒" }, detail: { en: "Already learned; quiet a weakened threat.", zh: "已学会；压住虚弱威胁。" } },
    { id: "glass-echo", label: { en: "Glass Echo", zh: "琉璃回声" }, detail: { en: "Already learned; turn rhythm into investigation.", zh: "已学会；把节奏转成调查优势。" } }
  ],
  occultist: [
    { id: "firebolt", label: { en: "Firebolt", zh: "火矢" }, detail: { en: "Already learned; simple destructive pressure.", zh: "已学会；稳定的破坏性压制。" } },
    { id: "sleep", label: { en: "Sleep", zh: "沉眠咒" }, detail: { en: "Already learned; borrow silence from a failed will.", zh: "已学会；从动摇意志中借来沉默。" } },
    { id: "binding-vines", label: { en: "Binding Vines", zh: "缚藤术" }, detail: { en: "Already learned; bind a target with omen-knots.", zh: "已学会；用异兆结扣束缚目标。" } },
    { id: "thunder-step", label: { en: "Thunder Step", zh: "雷步" }, detail: { en: "Already learned; escape a collapsing position.", zh: "已学会；脱离崩坏站位。" } }
  ],
  envoy: [
    { id: "ward", label: { en: "Ward", zh: "守护印" }, detail: { en: "Already learned; protect a speaker or witness.", zh: "已学会；保护发言者或证人。" } },
    { id: "glass-echo", label: { en: "Glass Echo", zh: "琉璃回声" }, detail: { en: "Already learned; read a tense room.", zh: "已学会；读取紧张场面。" } }
  ]
};

const STARTING_SPELL_CARD_STATE = Object.freeze({
  state: "known",
  availability: "starting-available"
});

const RULE_CARD_FALLBACKS = {
  "ember-lance": { kind: "spell", label: { en: "Ember Lance", zh: "余烬长矛" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-01.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-05.png" } },
  "echo-ledger": { kind: "spell", label: { en: "Echo Ledger", zh: "回声账页" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-11.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-03.png" } },
  "field-suture": { kind: "spell", label: { en: "Field Suture", zh: "战地缝光" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-07.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-10.png" } },
  "mist-bridge": { kind: "spell", label: { en: "Mist Bridge", zh: "雾桥" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-09.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-02.png" } },
  "bastion-mark": { kind: "spell", label: { en: "Bastion Mark", zh: "壁垒印记" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-05.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-01.png" } },
  "mirror-lure": { kind: "spell", label: { en: "Mirror Lure", zh: "镜诱" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-04.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-06.png" } },
  "lantern-sigil": { kind: "spell", label: { en: "Lantern Sigil", zh: "提灯符印" }, art: { file: "assets/generated/spells/aidm-spell-scroll-rune-057-35.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-03.png" } },
  "grave-whisper": { kind: "spell", label: { en: "Grave Whisper", zh: "墓语" }, art: { file: "assets/generated/spells/aidm-spell-scroll-rune-057-31.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-07.png" } },
  "blood-moon-hex": { kind: "spell", label: { en: "Blood Moon Hex", zh: "血月咒" }, art: { file: "assets/generated/spells/aidm-spell-scroll-rune-057-19.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-04.png" } },
  "iron-oath": { kind: "spell", label: { en: "Iron Oath", zh: "铁誓" }, art: { file: "assets/generated/spells/aidm-spell-scroll-rune-057-32.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-01.png" } },
  "hush-ring": { kind: "spell", label: { en: "Hush Ring", zh: "静默环" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-03.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-04.png" } },
  "threshold-circle": { kind: "spell", label: { en: "Threshold Circle", zh: "门槛法阵" }, art: { file: "assets/generated/spells/aidm-spell-icon-043-12.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-01.png" } },
  "starfall-rune": { kind: "spell", label: { en: "Starfall Rune", zh: "星坠符文" }, art: { file: "assets/generated/spells/aidm-spell-scroll-rune-057-30.png" }, scrollArt: { file: "assets/generated/items/aidm-scroll-icon-044-05.png" } },
  "recover-mana": { kind: "combatSkill", label: { en: "Recover Mana", zh: "回收法力" }, art: { file: "assets/generated/icons/aidm-action-icon-042-14.png" } },
  "action-surge": { kind: "combatSkill", label: { en: "Action Surge", zh: "动作爆发" }, art: { file: "assets/generated/icons/aidm-action-icon-042-13.png" } },
  "quick-move": { kind: "combatSkill", label: { en: "Quick Move", zh: "迅捷移动" }, art: { file: "assets/generated/icons/aidm-action-icon-042-10.png" } },
  "channel-mercy": { kind: "combatSkill", label: { en: "Channel Mercy", zh: "引导怜悯" }, art: { file: "assets/generated/icons/aidm-action-icon-042-05.png" } },
  "mark-trail": { kind: "combatSkill", label: { en: "Mark Trail", zh: "标记路径" }, art: { file: "assets/generated/icons/aidm-action-icon-042-11.png" } },
  inspire: { kind: "combatSkill", label: { en: "Inspire", zh: "激励" }, art: { file: "assets/generated/icons/aidm-action-icon-042-12.png" } },
  "read-omen": { kind: "combatSkill", label: { en: "Read Omen", zh: "读兆" }, art: { file: "assets/generated/icons/aidm-action-icon-042-14.png" } },
  rally: { kind: "combatSkill", label: { en: "Rally", zh: "鼓舞集结" }, art: { file: "assets/generated/icons/aidm-action-icon-042-13.png" } },
  "extra-attack": { kind: "combatSkill", label: { en: "Extra Attack", zh: "额外攻击" }, art: { file: "assets/generated/icons/aidm-action-icon-042-01.png" } },
  sidestep: { kind: "combatSkill", label: { en: "Sidestep", zh: "侧身闪避" }, art: { file: "assets/generated/icons/aidm-action-icon-042-16.png" } },
  "cross-cut": { kind: "combatSkill", label: { en: "Cross-Cut", zh: "交叉斩" }, art: { file: "assets/generated/icons/aidm-action-icon-042-01.png" } },
  "break-line": { kind: "combatSkill", label: { en: "Break Line", zh: "破阵突进" } },
  "weapon-drill": { kind: "combatSkill", label: { en: "Weapon Drill", zh: "兵器演练" }, art: { file: "assets/generated/icons/aidm-action-icon-042-15.png" } },
  "disarming-angle": { kind: "combatSkill", label: { en: "Disarming Angle", zh: "卸械角度" }, art: { file: "assets/generated/icons/aidm-action-icon-042-06.png" } },
  "mobile-parry": { kind: "combatSkill", label: { en: "Mobile Parry", zh: "游斗格挡" }, art: { file: "assets/generated/icons/aidm-action-icon-042-08.png" } },
  "intimidating-roar": { kind: "combatSkill", label: { en: "Intimidating Roar", zh: "震慑怒吼" }, art: { file: "assets/generated/icons/aidm-action-icon-042-12.png" } },
  "mark-target": { kind: "combatSkill", label: { en: "Mark Target", zh: "标记目标" }, art: { file: "assets/generated/icons/aidm-action-icon-042-12.png" } },
  "commander-read": { kind: "combatSkill", label: { en: "Commander's Read", zh: "指挥官读势" }, art: { file: "assets/generated/icons/aidm-action-icon-042-11.png" } },
  "shield-wall": { kind: "combatSkill", label: { en: "Shield Wall", zh: "盾墙" }, art: { file: "assets/generated/icons/aidm-action-icon-042-08.png" } },
  "guarded-counter": { kind: "combatSkill", label: { en: "Guarded Counter", zh: "守势反击" }, art: { file: "assets/generated/icons/aidm-action-icon-042-06.png" } }
};

const LEVELING_LABELS = {
  summary: { en: "Level gains", zh: "升级收益" },
  specialization: { en: "Fighter specialization", zh: "战士专精" },
  learnedSpells: { en: "Learned spells", zh: "已学法术" },
  combatSkills: { en: "Combat skills", zh: "战技" },
  spellChoices: { en: "Spell choices", zh: "法术可选项" },
  combatSkillChoices: { en: "Combat skill choices", zh: "战技可选项" },
  selected: { en: "Selected", zh: "已获得" },
  available: { en: "Available", zh: "可选" },
  level: { en: "Level", zh: "等级" },
  actionCuePrefix: { en: "Options", zh: "可用方向" },
  actionCueSpells: { en: "spells", zh: "法术" },
  actionCueSkills: { en: "combat skills", zh: "战技" },
  actionCueItems: { en: "items", zh: "道具" },
  more: { en: "more", zh: "更多" }
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
  rewardPanel: document.querySelector(".reward-panel"),
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
  rewardToastExpand: document.querySelector("#rewardToastExpand"),
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
installRuntimeAssetFallbacks();
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
const startupAuthRestore = restoreAuthSession();
initializeRoomFromUrl(startupAuthRestore);

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
  const roomId = normalizeRoomId(new FormData(els.joinByIdForm).get("roomId"));
  if (!roomId) return;
  setJoinByIdValue(roomId);
  showCreateStatus("");
  try {
    await openRoomById(roomId);
  } catch (error) {
    showCreateStatus("", localizedErrorMessage(error));
  }
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
        specializationId: String(form.get("classId") || "") === "warrior" ? form.get("specializationId") : "",
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
  const guidance = currentActionGuidanceState(intent === "chat");
  if (!guidance.canSubmit) {
    els.actionError.textContent = t(uiLanguage, guidance.submitErrorKey, { name: guidance.activeName });
    syncActionModeControls();
    return;
  }
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

drawLoop();

async function initializeRoomFromUrl(authRestorePromise = Promise.resolve()) {
  const roomId = roomIdFromCurrentUrl();
  if (!roomId) return;
  setJoinByIdValue(roomId);
  showCreateStatus("room.openingFromUrl");
  try {
    await authRestorePromise.catch(() => {});
    if (room?.id === roomId) return;
    await openRoomById(roomId);
  } catch (error) {
    showCreateStatus("", localizedErrorMessage(error));
  }
}

async function openRoomById(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  if (!normalizedRoomId) return null;
  const result = await api(`/api/rooms/${encodeURIComponent(normalizedRoomId)}`);
  openRoom(result.room);
  return result.room;
}

function roomIdFromCurrentUrl() {
  try {
    return normalizeRoomId(new URLSearchParams(window.location.search).get("room"));
  } catch {
    return "";
  }
}

function normalizeRoomId(value) {
  return String(value || "").trim();
}

function setJoinByIdValue(roomId) {
  const input = els.joinByIdForm?.elements?.roomId;
  if (input && roomId) input.value = roomId;
}

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
    rejectedAccessNotice = null;
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
    rejectedAccessNotice = null;
    saveRoomPlayerSession(nextRoom.id, playerId, playerToken);
    clearRoomPendingSession(nextRoom.id);
    return;
  }

  if (storedPlayerId && nextRoom.players?.some((player) => player.id === storedPlayerId)) {
    rejectedAccessNotice = null;
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
    rejectedAccessNotice = null;
    pendingPlayerId = storedPendingPlayerId;
    pendingPlayerToken = storedPendingPlayerToken;
    playerId = "";
    playerToken = "";
    localStorage.removeItem("aidm.playerId");
    localStorage.removeItem("aidm.playerToken");
    return;
  }

  if (storedPendingPlayerId && pending?.status && pending.status !== "pending") {
    rejectedAccessNotice = pending.status === "rejected"
      ? { roomId: nextRoom.id, reason: pending.reason || "" }
      : null;
    clearRoomPendingSession(nextRoom.id);
    playerId = "";
    playerToken = "";
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
  rejectedAccessNotice = null;
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
  syncStartSceneButton();
  els.playerSetupPanel?.classList.toggle("hidden", !showPlayerSetup);
  els.transcriptPanel?.classList.toggle("hidden", !showPlaySurface);
  syncSetupGuidance(showPlayerSetup);
  syncRoomAccessControls(showPlayerSetup);
  syncPendingAccessRefresh();
  renderTurnFocus(active, localPlayer, hasPlayerBinding, sceneChanged);
  els.myCharacterButton.disabled = !hasPlayerBinding;
  syncPlayerToolButtonStates(hasPlayerBinding);
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
  els.partyStatusBar.dataset.partySize = room.players.length >= 6 ? "crowded" : room.players.length >= 4 ? "expanded" : "standard";
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
    const sceneLabel = compactStateCopy(room?.scene?.location || t(uiLanguage, "state.scene"), 34);
    const vitalsLabel = t(uiLanguage, "party.vitals", { hp, maxHp, mana, maxMana });
    const statusLine = t(uiLanguage, "party.statusLine", { scene: sceneLabel, status: primaryStatus });
    chip.type = "button";
    chip.className = `party-status-card ${isActive ? "active" : ""} ${isLocal ? "local-player" : ""}`;
    chip.dataset.turnStatus = isActive ? "active" : "waiting";
    chip.dataset.health = healthState;
    chip.dataset.mana = manaState;
    chip.dataset.scene = sceneDataToken(sceneLabel, "scene");
    chip.setAttribute("aria-label", t(uiLanguage, "party.statusAria", {
      name: character.name,
      role: localizedClassName(character),
      scene: sceneLabel,
      status: primaryStatus,
      hp,
      maxHp,
      mana,
      maxMana
    }));
    chip.title = `${character.name || player.name} · ${statusLine} · ${vitalsLabel}`;
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
        <span class="party-status-vitals">${escapeHtml(`${statusLine} · ${vitalsLabel}`)}</span>
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
  els.stateStripMeta.textContent = details || t(uiLanguage, "state.details");
  els.tableStateToggle?.setAttribute("aria-label", `${turn}. ${details}. ${t(uiLanguage, "state.details")}`);
  els.tableStateToggle?.setAttribute("title", details);
}

function syncPlayerToolButtonStates(hasPlayerBinding = hasLocalPlayerBinding()) {
  if (els.marketButton) {
    const label = t(uiLanguage, "button.market");
    const title = hasPlayerBinding ? t(uiLanguage, "market.openTitle") : t(uiLanguage, "market.feedback.noLocal");
    els.marketButton.disabled = !hasPlayerBinding;
    els.marketButton.title = title;
    els.marketButton.setAttribute("aria-label", hasPlayerBinding ? label : `${label}: ${title}`);
  }
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

function syncStartSceneButton() {
  if (!els.startButton || !room) return;
  const disabled = room.phase !== "lobby" || room.players.length === 0 || !canManageRoom();
  const reasonKey = room.phase !== "lobby"
    ? "setup.startSceneInProgress"
    : room.players.length === 0
      ? "setup.startSceneNoPlayers"
      : !canManageRoom()
        ? "setup.startSceneHostOnly"
        : "setup.startSceneReady";
  const reason = t(uiLanguage, reasonKey);
  els.startButton.disabled = disabled;
  els.startButton.title = reason;
  els.startButton.setAttribute("aria-label", `${t(uiLanguage, "button.beginScene")}: ${reason}`);
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
  dock.textContent = soundscapeStatusText(room?.soundscape);
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
  const rejectedHere = Boolean(rejectedAccessNotice?.roomId && rejectedAccessNotice.roomId === room?.id);
  const passwordField = els.joinRoomPasswordField;
  const passwordInput = passwordField?.querySelector("input");
  const submitButton = els.joinForm?.querySelector("button[type='submit']");
  if (els.playerSetupPanel) {
    els.playerSetupPanel.dataset.accessMode = room?.access?.mode || "open";
    els.playerSetupPanel.dataset.accessState = rejectedHere
      ? "approval-rejected"
      : pending?.status === "pending"
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
  if (rejectedHere && approvalRequired && showSetup) {
    showJoinStatus("join.rejected");
  } else if (pending?.status === "pending") {
    showJoinStatus("join.pending");
  } else if (approvalRequired && showSetup) {
    showJoinStatus("join.approvalRequired");
  } else if (passwordRequired && showSetup) {
    showJoinStatus("join.passwordRequired");
  } else if (els.joinStatus?.dataset.statusKey && ["join.pending", "join.approvalRequired", "join.passwordRequired", "join.rejected"].includes(els.joinStatus.dataset.statusKey)) {
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
    ${levelingSummaryMarkup(character)}
  `;
}

function levelingSummaryMarkup(character = {}) {
  const learnedSpellEntries = learnedRuleEntries(character, "spell");
  const learnedCombatEntries = learnedRuleEntries(character, "combatSkill");
  const spellChoices = ruleChoiceGroups(character, "spell");
  const combatSkillChoices = ruleChoiceGroups(character, "combatSkill");
  const hasSpecialization = Boolean(character.specialization?.id);
  if (!hasSpecialization && !learnedSpellEntries.length && !learnedCombatEntries.length && !spellChoices.length && !combatSkillChoices.length) {
    return "";
  }
  const spellIndex = ruleChoiceOptionIndex(character, "spell");
  const skillIndex = ruleChoiceOptionIndex(character, "combatSkill");
  const learnedSpellIds = new Set(learnedSpellEntries.map((entry) => ruleEntryId(entry)).filter(Boolean));
  const learnedSkillIds = new Set(learnedCombatEntries.map((entry) => ruleEntryId(entry)).filter(Boolean));
  return `
    <section class="leveling-summary" data-leveling-summary aria-label="${escapeHtml(localizeTextValue(LEVELING_LABELS.summary))}">
      <div class="leveling-summary-head">
        ${ruleAssetMarkup(character.classArt, localizedClassName(character), "leveling-summary-art", localizedClassName(character))}
        <span>
          <strong>${escapeHtml(localizeTextValue(LEVELING_LABELS.summary))}</strong>
          <small>${escapeHtml(`${localizedClassName(character)} · ${localizeTextValue(LEVELING_LABELS.level)} ${character.level ?? character.progression?.level ?? 1}`)}</small>
        </span>
      </div>
      ${hasSpecialization ? specializationSummaryMarkup(character) : ""}
      ${learnedSpellEntries.length ? learnedRuleSectionMarkup("spell", learnedSpellEntries, spellIndex) : ""}
      ${learnedCombatEntries.length ? learnedRuleSectionMarkup("combatSkill", learnedCombatEntries, skillIndex) : ""}
      ${spellChoices.length ? ruleChoiceSectionMarkup("spell", spellChoices, learnedSpellIds) : ""}
      ${combatSkillChoices.length ? ruleChoiceSectionMarkup("combatSkill", combatSkillChoices, learnedSkillIds) : ""}
    </section>
  `;
}

function specializationSummaryMarkup(character = {}) {
  const specialization = character.specialization || {};
  const label = localizeTextValue(specialization.label) || humanizeDebugId(specialization.id);
  const features = (specialization.features || []).slice(0, 3).map((feature) => ruleEntryLabel(feature));
  const role = humanizeDebugId(specialization.role || "");
  return `
    <article class="leveling-specialization" data-leveling-specialization="${escapeHtml(specialization.id || "")}">
      ${ruleAssetMarkup(specialization.art || character.classArt, label, "leveling-specialization-art", label)}
      <span>
        <small>${escapeHtml(localizeTextValue(LEVELING_LABELS.specialization))}</small>
        <strong>${escapeHtml(label)}</strong>
        ${role || features.length ? `<em>${escapeHtml([role, ...features].filter(Boolean).join(" · "))}</em>` : ""}
      </span>
    </article>
  `;
}

function learnedRuleSectionMarkup(kind, entries, optionIndex = new Map()) {
  const title = kind === "spell"
    ? localizeTextValue(LEVELING_LABELS.learnedSpells)
    : localizeTextValue(LEVELING_LABELS.combatSkills);
  return `
    <div class="leveling-summary-section" data-leveling-learned-kind="${escapeHtml(kind)}">
      <span class="leveling-section-title">${escapeHtml(title)}</span>
      <div class="leveling-chip-strip">
        ${entries.map((entry) => ruleEntryChipMarkup(entry, kind, optionIndex)).join("")}
      </div>
    </div>
  `;
}

function ruleChoiceSectionMarkup(kind, choices, learnedIds) {
  const title = kind === "spell"
    ? localizeTextValue(LEVELING_LABELS.spellChoices)
    : localizeTextValue(LEVELING_LABELS.combatSkillChoices);
  return `
    <div class="leveling-summary-section" data-leveling-choice-kind="${escapeHtml(kind)}">
      <span class="leveling-section-title">${escapeHtml(title)}</span>
      <div class="leveling-choice-grid">
        ${choices.map((choice) => ruleChoiceGroupMarkup(choice, kind, learnedIds)).join("")}
      </div>
    </div>
  `;
}

function ruleChoiceGroupMarkup(choice, kind, learnedIds) {
  const level = choice.level ? `${localizeTextValue(LEVELING_LABELS.level)} ${choice.level}` : "";
  const stream = choice.stream ? humanizeDebugId(choice.stream) : "";
  return `
    <article class="leveling-choice-group" data-choice-id="${escapeHtml(choice.id || "")}">
      <header>
        <strong>${escapeHtml([level, stream].filter(Boolean).join(" · ") || humanizeDebugId(choice.id || kind))}</strong>
      </header>
      <div class="leveling-choice-options">
        ${(choice.options || []).map((option) => ruleChoiceOptionMarkup(option, kind, learnedIds.has(ruleEntryId(option)))).join("")}
      </div>
    </article>
  `;
}

function ruleChoiceOptionMarkup(option, kind, selected = false) {
  const id = ruleEntryId(option);
  const label = ruleEntryLabel(option, new Map(), kind);
  const stateLabel = localizeTextValue(selected ? LEVELING_LABELS.selected : LEVELING_LABELS.available);
  const detail = ruleEntryDetail(option, kind);
  return `
    <span class="leveling-choice-card" data-choice-selected="${selected ? "true" : "false"}" title="${escapeHtml([label, detail, stateLabel].filter(Boolean).join(" · "))}">
      ${ruleAssetMarkup(ruleEntryAsset(option, kind), label, "leveling-rule-art", label)}
      <span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(detail || stateLabel)}</small>
      </span>
      <em>${escapeHtml(stateLabel)}</em>
    </span>
  `;
}

function ruleEntryChipMarkup(entry, kind, optionIndex = new Map()) {
  const id = ruleEntryId(entry);
  const option = optionIndex.get(id) || null;
  const label = ruleEntryLabel(entry, optionIndex, kind);
  return `
    <span class="leveling-chip" data-rule-kind="${escapeHtml(kind)}" data-rule-id="${escapeHtml(id)}" title="${escapeHtml(label)}">
      ${ruleAssetMarkup(ruleEntryAsset(option || entry, kind), label, "leveling-chip-art", label)}
      <em>${escapeHtml(label)}</em>
    </span>
  `;
}

function ruleChoiceGroups(character = {}, kind = "spell") {
  const sources = kind === "spell"
    ? [character.availableSpellChoices, character.progression?.spellChoices]
    : [character.availableCombatSkillChoices, character.progression?.combatSkillChoices];
  const groups = new Map();
  for (const source of sources) {
    for (const choice of source || []) {
      if (!choice || typeof choice !== "object") continue;
      const id = String(choice.id || `${kind}-${choice.level || "choice"}`).trim();
      if (!id) continue;
      const existing = groups.get(id) || { ...choice, options: [] };
      const seenOptions = new Set(existing.options.map((option) => ruleEntryId(option)));
      for (const option of choice.options || []) {
        const optionId = ruleEntryId(option);
        if (!optionId || seenOptions.has(optionId)) continue;
        existing.options.push(option);
        seenOptions.add(optionId);
      }
      groups.set(id, existing);
    }
  }
  return [...groups.values()].filter((choice) => (choice.options || []).length);
}

function ruleChoiceOptionIndex(character = {}, kind = "spell") {
  const index = new Map();
  for (const choice of ruleChoiceGroups(character, kind)) {
    for (const option of choice.options || []) {
      const id = ruleEntryId(option);
      if (id && !index.has(id)) index.set(id, option);
    }
  }
  return index;
}

function learnedRuleEntries(character = {}, kind = "spell") {
  const source = kind === "spell"
    ? [
        ...(character.knownSpells || []),
        ...(character.spells || []),
        ...(character.progression?.spells || [])
      ]
    : [
        ...(character.combatSkills || []),
        ...(character.progression?.combatSkills || [])
      ];
  const seen = new Set();
  const entries = [];
  for (const entry of source) {
    const id = ruleEntryId(entry);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    entries.push(entry);
  }
  return entries;
}

function ruleEntryId(entry) {
  if (entry && typeof entry === "object") {
    return String(entry.id || entry.spellId || entry.skillId || entry.combatSkillId || "").trim().toLowerCase();
  }
  return String(entry || "").trim().toLowerCase();
}

function ruleEntryLabel(entry, optionIndex = new Map(), kind = "") {
  const id = ruleEntryId(entry);
  const direct = entry && typeof entry === "object" ? localizeTextValue(entry.label || entry.name || entry.displayName) : "";
  if (direct) return direct;
  const optionLabel = localizeTextValue(optionIndex.get(id)?.label);
  if (optionLabel) return optionLabel;
  const fallbackLabel = localizeTextValue(RULE_CARD_FALLBACKS[id]?.label);
  if (fallbackLabel) return fallbackLabel;
  if (kind === "spell") return formatSpellName(id);
  return humanizeDebugId(id);
}

function ruleEntryAsset(entry, kind = "") {
  const id = ruleEntryId(entry);
  if (entry && typeof entry === "object") {
    if (entry.file || entry.url) return entry;
    return entry.art || entry.icon || (kind === "spell" ? entry.scrollArt : null) || RULE_CARD_FALLBACKS[id]?.art || null;
  }
  return RULE_CARD_FALLBACKS[id]?.art || null;
}

function ruleEntryDetail(entry, kind = "") {
  const parts = [];
  if (entry?.categoryLabel) parts.push(localizeTextValue(entry.categoryLabel));
  else if (entry?.category) parts.push(humanizeDebugId(entry.category));
  if (entry?.school) parts.push(humanizeDebugId(entry.school));
  const mana = Number(entry?.resource?.manaCost);
  if (Number.isFinite(mana) && mana > 0) parts.push(uiLanguage === "zh" ? `${mana} 法力` : `${mana} mana`);
  if (typeof entry?.resource === "string") parts.push(humanizeDebugId(entry.resource));
  if (entry?.action) parts.push(humanizeDebugId(entry.action));
  if (!parts.length && kind === "combatSkill") parts.push(localizeTextValue(LEVELING_LABELS.combatSkills));
  return parts.filter(Boolean).slice(0, 3).join(" · ");
}

function ruleAssetMarkup(asset, label, className, fallbackSeed = "") {
  const file = typeof asset === "string" ? asset : asset?.file || asset?.url || "";
  if (file) {
    return `<img class="${escapeHtml(className)}" src="${escapeHtml(assetUrl(file))}"${runtimeAssetFallbackAttrs(file, asset?.fallbackFile)} alt="" loading="lazy" decoding="async" />`;
  }
  const fallback = initials(fallbackSeed || label || "?");
  return `<span class="${escapeHtml(className)} leveling-art-fallback" aria-hidden="true">${escapeHtml(fallback)}</span>`;
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
  const optionIndex = ruleChoiceOptionIndex(character, "spell");
  els.spellList.innerHTML = `
    <span class="audio-kicker">${escapeHtml(t(uiLanguage, "character.spells"))}</span>
    <div>${spells.map((spell) => {
      const label = ruleEntryLabel(spell, optionIndex, "spell");
      const option = optionIndex.get(ruleEntryId(spell));
      return `<span>${spellArtMarkup(spell, label, "spell-chip-art", ruleEntryAsset(option || spell, "spell"))}<em>${escapeHtml(label)}</em></span>`;
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
    if (els.marketStatus && !marketFeedback) {
      els.marketStatus.dataset.feedbackKind = "error";
      els.marketStatus.textContent = t(uiLanguage, "market.feedback.noLocal");
    }
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
  const mainLimit = transcriptMainLimit(logDensity);
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

function transcriptMainLimit(density = logDensity) {
  const normalized = normalizeLogDensity(density);
  const limits = isCompactMobileViewport() ? LOG_MOBILE_MAIN_LIMITS : LOG_MAIN_LIMITS;
  return limits[normalized] || limits.summary || LOG_MAIN_LIMITS.summary;
}

function isCompactMobileViewport() {
  return Boolean(window.matchMedia?.("(max-width: 430px)")?.matches);
}

function renderTranscriptEntries(container, entries, options = {}) {
  if (!container) return;
  container.dataset.logDensity = options.density || "comfortable";
  container.dataset.logSurface = options.surface || "drawer";
  container.innerHTML = "";
  for (const [index, entry] of entries.entries()) {
    const message = document.createElement("article");
    const channel = transcriptChannel(entry);
    const previousEntry = entries[index - 1] || null;
    const logGroup = transcriptGroupKey(entry);
    const groupStart = logGroup !== transcriptGroupKey(previousEntry);
    const groupLabel = groupStart ? transcriptGroupLabel(entry) : "";
    message.className = `message ${entry.type}${channel ? ` channel-${channel}` : ""}`;
    message.dataset.logType = entry.type || "event";
    message.dataset.logGroup = logGroup;
    message.dataset.timelineStart = String(groupStart);
    if (entry.structuredLog?.severity) {
      message.dataset.logSeverity = entry.structuredLog.severity;
    }
    if (channel) {
      message.dataset.channel = channel;
    }
    const reward = entry.reward;
    const rewardFile = rewardArtFile(entry);
    const detail = transcriptDetailMarkup(entry);
    const text = transcriptMainText(entry);
    const detailOpen = options.surface === "drawer" && options.density !== "summary";
    message.title = [text, detail].filter(Boolean).join(" · ");
    message.innerHTML = `
      ${groupLabel ? `<span class="log-timeline-marker">${escapeHtml(groupLabel)}</span>` : ""}
      <span class="meta">
        <span class="log-kind" data-log-kind="${escapeHtml(entry.type || "event")}">${escapeHtml(localizedTranscriptType(entry))}</span>
        <span>${escapeHtml(localizedTranscriptAuthor(entry))} / ${escapeHtml(formatTranscriptTime(entry.createdAt))}</span>
        ${channelBadgeMarkup(channel)}
      </span>
      ${rewardFile ? `<img class="message-asset" src="${escapeHtml(assetUrl(rewardFile))}"${runtimeAssetFallbackAttrs(rewardFile)} alt="${escapeHtml(localizeTextValue(reward?.displayName) || reward?.name || "")}" />` : ""}
      <p>${escapeHtml(text)}</p>
      ${detail ? `<details class="message-detail" aria-label="${escapeHtml(t(uiLanguage, "log.detail.expand"))}" ${detailOpen ? "open" : ""}><summary>${escapeHtml(compactStateCopy(detail, 96))}</summary><span>${escapeHtml(detail)}</span></details>` : ""}
    `;
    container.append(message);
  }
}

function transcriptGroupKey(entry = null) {
  if (!entry) return "";
  const turnId = entry.structuredLog?.turnId || entry.turnId || entry.structuredLog?.metadata?.turnId || "";
  if (turnId) return String(turnId);
  const date = new Date(entry.createdAt || "");
  if (!Number.isNaN(date.getTime())) {
    return `time:${date.toISOString().slice(0, 16)}`;
  }
  return `type:${entry.type || "event"}`;
}

function transcriptGroupLabel(entry = {}) {
  const key = transcriptGroupKey(entry);
  const roundMatch = key.match(/^round-(\d+)/);
  const time = formatTranscriptTime(entry.createdAt);
  if (roundMatch) {
    return t(uiLanguage, "log.group.round", { round: roundMatch[1], time });
  }
  return t(uiLanguage, "log.group.time", { time });
}

function localizedTranscriptType(entry = {}) {
  const type = transcriptTypeLabelKey(entry);
  const key = `log.type.${type}`;
  const label = t(uiLanguage, key);
  return label === key ? String(type || entry.type || "event") : label;
}

function transcriptTypeLabelKey(entry = {}) {
  if (entry.structuredLog?.type === "event.progression" || entry.type === "event-resolution") return "eventResolution";
  if (entry.structuredLog?.severity === "warn" || entry.severity === "warn" || entry.type === "warn") return "warn";
  return entry.type || "event";
}

function transcriptMainText(entry = {}) {
  const visibleConsequence = localizeTextValue(entry.eventResolution?.visibleConsequence);
  const text = localizeTextValue(entry.text) || visibleConsequence;
  if (text && !looksLikeRawJson(text)) return text;
  const summary = localizeTextValue(entry.structuredLog?.humanSummary);
  if (summary && !looksLikeRawJson(summary)) return summary;
  return t(uiLanguage, "log.detail.eventFallback");
}

function looksLikeRawJson(value) {
  const text = String(value || "").trim();
  return (/^[{[]/.test(text) && /["'}\]]\s*:/.test(text)) || text === "[object Object]";
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
  if (entry.structuredLog?.type === "event.progression" || entry.type === "event-resolution") {
    return eventProgressionDetail(entry);
  }
  return "";
}

function eventProgressionDetail(entry = {}) {
  const log = entry.structuredLog || {};
  const metadata = log.metadata || {};
  const impact = formatPlayerClockDelta(entry.eventResolution?.stateDelta || metadata.stateDelta || metadata.clockDelta);
  const next = localizeTextValue(entry.eventResolution?.nextHook) || localizeTextValue(metadata.nextHook) || t(uiLanguage, "log.detail.eventNextDefault");
  const warning = log.severity === "warn" ? t(uiLanguage, "log.detail.warnPrefix") : "";
  return t(uiLanguage, "log.detail.eventProgression", {
    warning,
    impact,
    next
  }).trim();
}

function formatPlayerClockDelta(delta = {}) {
  if (!delta || typeof delta !== "object") return t(uiLanguage, "log.detail.noImpact");
  const parts = Object.entries(delta)
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => {
      const labelKey = `log.clock.${key}`;
      const label = t(uiLanguage, labelKey);
      const amount = Number(value);
      return `${label === labelKey ? readableLogToken(key) : label} ${amount > 0 ? "+" : ""}${amount}`;
    });
  return parts.length ? parts.join(", ") : t(uiLanguage, "log.detail.noImpact");
}

function readableLogToken(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
      label: t(uiLanguage, "state.card.objective"),
      value: compactStateCopy(summary.objective || room.scene.objective, 92),
      meter: null
    },
    {
      label: t(uiLanguage, "state.card.quest"),
      value: quest ? t(uiLanguage, "state.questProgress", { quest: localizeQuestTitle(quest), progress: quest.progress }) : t(uiLanguage, "state.noQuest"),
      meter: quest ? { value: quest.progress, max: 100 } : null
    },
    {
      label: t(uiLanguage, "state.card.clues"),
      value: formatClock(clocks.clues),
      meter: clocks.clues
    },
    {
      label: t(uiLanguage, "state.card.danger"),
      value: formatClock(clocks.danger),
      meter: clocks.danger
    },
    {
      label: t(uiLanguage, "state.card.deadline"),
      value: formatClock(clocks.deadline),
      meter: clocks.deadline
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
  const consequences = scene.activeConsequences || summary.trackers?.consequences || [];
  const rewardHint = scene.rewardHint || null;
  const evolutionCue = sceneEvolutionCue(summary);
  const environmentCue = stateEnvironmentCue(summary);
  const eventCue = stateEventPressureCue(summary);
  els.stateChangeList.innerHTML = "";
  els.stateChangeList.append(
    renderStateChangeItem(t(uiLanguage, "state.now"), localizeTextValue(latest.label) || localizeEncounterState(room.combat?.state || "scouting"), compactStateCopy(localizeTextValue(latest.detail), 110)),
    renderStateChangeItem(t(uiLanguage, "state.location"), scene.location || room.scene.location, compactStateCopy(localizeShiftReason(scene.lastShiftReason || "opening-scene"), 92)),
    renderStateChangeItem(t(uiLanguage, "state.evolution"), evolutionCue?.value || t(uiLanguage, "state.evolutionStable"), evolutionCue?.detail || ""),
    renderStateChangeItem(t(uiLanguage, "state.consequences"), stateConsequencesText(consequences), "")
  );
  if (environmentCue) {
    els.stateChangeList.append(renderStateChangeItem(t(uiLanguage, "state.environment"), environmentCue.value, environmentCue.detail));
  }
  if (eventCue) {
    els.stateChangeList.append(renderStateChangeItem(t(uiLanguage, "state.eventPressure"), eventCue.value, eventCue.detail));
  }
  if (rewardHint) {
    els.stateChangeList.append(renderStateChangeItem(
      t(uiLanguage, "state.rewardHint"),
      localizeTextValue(rewardHint.actionSuggestion) || localizeTextValue(rewardHint.label) || t(uiLanguage, "reward.item"),
      compactStateCopy(localizeTextValue(rewardHint.prompt), 110)
    ));
  }
  els.stateChangeList.append(
    renderStateChangeItem(t(uiLanguage, "state.ambience"), localizeSoundscape(room.soundscape || {}) || media.soundscapeLabel, compactStateCopy(localizeSoundscapeReason(room.soundscape || {}), 92))
  );
  if (blockedExit) {
    els.stateChangeList.append(renderStateChangeItem(t(uiLanguage, "state.routeHeld"), t(uiLanguage, "state.routeHeld"), localizeRouteBlock(blockedExit.reason)));
  }
  if (scene.exits?.length) {
    const item = document.createElement("div");
    item.className = "state-change-item state-exit-list";
    const exits = scene.exits.map((exit) => {
      const label = localizeTextValue(exit.label) || exit.target || exit.id;
      const state = exit.available ? t(uiLanguage, "state.routeReady") : t(uiLanguage, "state.routeLocked");
      return `<span class="${exit.available ? "available" : "locked"}" title="${escapeHtml(state)}">${escapeHtml(label)}</span>`;
    }).join("");
    item.innerHTML = `<strong>${escapeHtml(t(uiLanguage, "state.routes"))}</strong><div>${exits}</div>`;
    els.stateChangeList.append(item);
  }
}

function stateEnvironmentCue(summary = room?.stateSummary || {}) {
  const environment = summary?.scene?.environment || summary?.environment || {};
  const labels = environment.labels || {};
  const value = localizeTextValue(environment.prompt)
    || [
      localizeTextValue(labels.season),
      localizeTextValue(labels.timeOfDay),
      localizeTextValue(labels.weather),
      localizeTextValue(labels.mood)
    ].filter(Boolean).join(" · ");
  if (!value) return null;
  const pressure = environment.pressurePrompt?.pressure || summary?.scene?.eventState?.pressure || summary?.trackers?.eventState?.pressure || "";
  const detail = [
    pressure ? t(uiLanguage, "state.eventPressureLevel", { pressure: localizeStateToken("state.pressure", pressure) }) : "",
    compactStateCopy(localizeShiftReason(environment.change?.reason || ""), 72)
  ].filter(Boolean).join(" · ");
  return { value: compactStateCopy(value, 92), detail };
}

function stateEventPressureCue(summary = room?.stateSummary || {}) {
  const scene = summary?.scene || {};
  const eventState = scene.eventState || summary?.trackers?.eventState || null;
  if (!eventState?.id) return null;
  const status = localizeStateToken("state.eventStatus", eventState.status || "active");
  const pressure = eventState.pressure ? localizeStateToken("state.pressure", eventState.pressure) : "";
  const clock = eventState.clock ? localizeStateToken("state.clock", eventState.clock) : "";
  const value = [status, pressure].filter(Boolean).join(" · ") || status;
  const detailParts = [
    localizeTextValue(eventState.prompt),
    clock ? t(uiLanguage, "state.eventClock", { clock }) : "",
    eventState.encounterState ? localizeEncounterState(eventState.encounterState) : ""
  ].filter(Boolean);
  return {
    value: compactStateCopy(value, 92),
    detail: compactStateCopy(detailParts.join(" · "), 120)
  };
}

function localizeStateToken(prefix, value = "") {
  const key = `${prefix}.${String(value || "").replace(/\s+/g, "-")}`;
  const label = t(uiLanguage, key);
  return label === key ? readableLogToken(value) : label;
}

function stateConsequencesText(entries = []) {
  const labels = (entries || [])
    .map((entry) => localizeTextValue(entry?.label) || localizeTextValue(entry?.detail) || localizeTextValue(entry?.prompt))
    .filter(Boolean)
    .slice(0, 3);
  if (labels.length === 0) return t(uiLanguage, "state.noConsequences");
  return compactStateCopy(labels.join(" · "), 110) || t(uiLanguage, "state.consequenceActive");
}

function sceneEvolutionCue(summary = room?.stateSummary || {}) {
  const scene = summary?.scene || {};
  const trackers = summary?.trackers || {};
  const reason = scene.lastEvolutionReason || trackers.sceneChange?.lastEvolutionReason || summary?.progress?.sceneChange || "";
  const lead = scene.currentLead || scene.recentClues?.[0] || null;
  const consequence = scene.activeConsequences?.[0] || trackers.consequences?.[0] || null;
  const clockTrendText = formatSceneClockTrends(trackers.clockTrends || summary?.progress?.clockTrends);

  if (reason === "danger-consequence" && consequence) {
    return buildSceneEvolutionCue(consequence, "state.evolutionPressure", clockTrendText, scene.summary);
  }
  if (reason === "clue-progress" && lead) {
    return buildSceneEvolutionCue(lead, "state.evolutionClue", clockTrendText, scene.summary);
  }
  if (lead) {
    return buildSceneEvolutionCue(lead, "state.evolutionClue", clockTrendText, scene.summary);
  }
  if (consequence) {
    return buildSceneEvolutionCue(consequence, "state.evolutionPressure", clockTrendText, scene.summary);
  }
  const summaryText = localizeTextValue(scene.summary);
  if (summaryText || clockTrendText) {
    return {
      value: t(uiLanguage, "state.evolutionScene"),
      detail: compactStateCopy(joinStateDetails([summaryText, clockTrendText]), 142)
    };
  }
  return null;
}

function buildSceneEvolutionCue(entry, fallbackKey, clockTrendText, sceneSummary) {
  const value = localizeTextValue(entry?.label) || t(uiLanguage, fallbackKey);
  const detail = joinStateDetails([
    localizeTextValue(entry?.detail) || localizeTextValue(entry?.prompt) || localizeTextValue(entry?.reason),
    clockTrendText,
    localizeTextValue(sceneSummary)
  ]);
  return {
    value,
    detail: compactStateCopy(detail, 142)
  };
}

function formatSceneClockTrends(clockTrends = {}) {
  const parts = [
    ["clues", "state.clockDelta.clues"],
    ["danger", "state.clockDelta.danger"],
    ["deadline", "state.clockDelta.deadline"]
  ].map(([key, labelKey]) => {
    const delta = Number(clockTrends?.[key]?.delta || 0);
    if (!delta) return "";
    const sign = delta > 0 ? `+${delta}` : String(delta);
    return t(uiLanguage, labelKey, { delta: sign });
  }).filter(Boolean);
  return parts.join(" · ");
}

function joinStateDetails(parts = []) {
  return parts
    .map((part) => String(part || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((part, index, values) => values.indexOf(part) === index)
    .join(" · ");
}

function compactStateCopy(value, maxLength = 120) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
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
  els.rewardToastExpand?.addEventListener("click", () => {
    if (els.rewardPanel) els.rewardPanel.open = true;
    closeRewardToast();
    openDrawer("state", els.rewardToastExpand);
  });
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
  const description = localizeTextValue(reward.description) || entry.text || "";
  const backpackCue = t(uiLanguage, "reward.feedback.addedToBackpack");
  const shortCue = t(uiLanguage, "reward.feedback.backpackShort");
  shownRewardEventIds.add(entry.id);
  els.rewardToastTitle.textContent = localizeTextValue(reward.displayName) || reward.name || t(uiLanguage, "reward.item");
  els.rewardToastText.textContent = shortCue;
  els.rewardToastText.title = [description, backpackCue].filter(Boolean).join(" ");
  els.rewardToast.dataset.hasImage = file ? "true" : "false";
  if (file) {
    const fallbackFile = runtimeGeneratedAssetFallback(file);
    if (fallbackFile) {
      els.rewardToastImage.dataset.runtimeFallbackSrc = assetUrl(fallbackFile);
    } else {
      delete els.rewardToastImage.dataset.runtimeFallbackSrc;
    }
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
  window.clearTimeout(rewardToastTimer);
  rewardToastTimer = window.setTimeout(closeRewardToast, REWARD_TOAST_DURATION_MS);
}

function closeRewardToast() {
  if (!els.rewardToast) return;
  window.clearTimeout(rewardToastTimer);
  rewardToastTimer = null;
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
    const fallbackFile = runtimeGeneratedAssetFallback(file);
    if (fallbackFile) image.dataset.runtimeFallbackSrc = assetUrl(fallbackFile);
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
    els.sceneBackdrop.style.backgroundImage = runtimeCssBackgroundImage(asset.file, asset.fallbackFile);
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
  const evolutionCue = sceneEvolutionCue();
  const soundscape = room?.soundscape || null;
  const label = evolutionCue?.value
    || localizeTextValue(latest.label)
    || localizeShiftReason(scene.lastShiftReason || room?.scene?.lastShiftReason || "opening-scene")
    || t(uiLanguage, "stage.opening");
  const detail = evolutionCue?.detail
    || localizeTextValue(latest.detail)
    || localizeSoundscapeReason(soundscape || {})
    || t(uiLanguage, "ambience.waiting");
  els.sceneChangeSummary.dataset.changed = String(Boolean(sceneChanged));
  els.sceneChangeLabel.textContent = label;
  els.sceneChangeDetail.textContent = soundscape
    ? t(uiLanguage, "ambience.sceneStatus", { status: soundscapeStatusText(soundscape), reason: detail })
    : detail;
}

function currentSceneVisualState() {
  const candidates = [
    room?.soundscape?.sceneVisualState,
    room?.presentation?.sceneVisualState,
    room?.scene?.sceneVisualState,
    room?.sceneVisualState,
    deriveSceneVisualStateFromRoom()
  ];
  return candidates.find((candidate) => candidate && typeof candidate === "object") || null;
}

function deriveSceneVisualStateFromRoom(nextRoom = room) {
  if (!nextRoom?.scene) return null;
  const scene = nextRoom.scene || {};
  const assetAxes = nextRoom.presentation?.sceneAsset?.variantAxes || {};
  const text = [
    scene.title,
    scene.location,
    scene.objective,
    scene.ambience,
    scene.weather,
    scene.season,
    scene.timeOfDay,
    scene.time,
    scene.mood,
    scene.tags,
    nextRoom.stateSummary?.latestChange?.label,
    nextRoom.stateSummary?.latestChange?.detail,
    nextRoom.stateSummary?.scene?.lastShiftReason
  ].flat().filter(Boolean).join(" ").toLowerCase();
  const danger = Number(scene.clocks?.danger ?? scene.threat ?? nextRoom.stateSummary?.clocks?.danger?.value ?? 0);
  const clues = Number(scene.clocks?.clues ?? nextRoom.stateSummary?.clocks?.clues?.value ?? 0);
  const pressure = assetAxes.pressure || (danger >= 5 ? "crisis" : danger >= 3 ? "high" : clues >= 3 ? "rising" : "low");
  const weather = assetAxes.weather || visualWeatherFromText(text);
  const rain = assetAxes.rain || visualRainFromText(text, weather);
  const wind = assetAxes.wind || (/gale|gust|storm|wind|狂风|强风|风暴|阵风/.test(text) ? "gale" : "none");
  const thunderChance = Number(assetAxes.thunderChance ?? (/thunder|lightning|storm|雷|闪电|雷暴/.test(text) ? 0.62 : 0));
  const season = assetAxes.season || visualSeasonFromText(text);
  const timeOfDay = assetAxes.timeOfDay || visualTimeFromText(text);
  const location = assetAxes.location || visualLocationFromText(text);
  const motionHints = [
    rain === "heavy" ? "heavy-rain" : rain === "light" ? "light-rain" : "",
    wind === "gale" ? "dry-leaves" : "",
    thunderChance >= 0.55 ? "lightning-flash" : "",
    location.includes("market") || /crowd|market|集市|市场|人群/.test(text) ? "crowd-flow" : "",
    timeOfDay ? `time:${timeOfDay}` : "",
    pressure ? `pressure:${pressure}` : ""
  ].filter(Boolean);
  const overlayHints = [
    rain === "heavy" ? "heavy-rain" : rain === "light" ? "light-rain" : "",
    /mist|fog|雾/.test(text) ? "mist" : ""
  ].filter(Boolean);
  const variantKey = [
    `preset:${location || "scene"}`,
    weather ? `weather:${weather}` : "",
    season ? `season:${season}` : "",
    timeOfDay ? `time:${timeOfDay}` : "",
    pressure ? `pressure:${pressure}` : "",
    rain !== "none" ? `rain:${rain}` : "",
    wind !== "none" ? `wind:${wind}` : "",
    thunderChance >= 0.55 ? "thunder:close" : ""
  ].filter(Boolean).join("|");
  return {
    variantAxes: {
      weather,
      rain,
      wind,
      thunderChance,
      season,
      timeOfDay,
      pressure,
      location
    },
    motionHints,
    overlayHints,
    variantKey,
    source: "client-scene-fallback"
  };
}

function visualWeatherFromText(text) {
  if (/clear|sunny|sunlit|晴|阳光|蓝天/.test(text)) return "clear";
  if (/thunder|lightning|storm|雷|闪电|雷暴|风暴/.test(text)) return "storm";
  if (/rain|drizzle|wet|mist|fog|雨|潮湿|雾/.test(text)) return "wet";
  return "unknown";
}

function visualRainFromText(text, weather) {
  if (/downpour|heavy rain|rainstorm|storm|暴雨|大雨|倾盆/.test(text)) return "heavy";
  if (/rain|drizzle|mist|wet|雨|细雨|小雨|潮湿/.test(text) || weather === "wet" || weather === "storm") return "light";
  return "none";
}

function visualSeasonFromText(text) {
  if (/winter|snow|frost|ice|冬|雪|霜|冰/.test(text)) return "winter";
  if (/autumn|fall|harvest|leaf|leaves|秋|落叶|收获/.test(text)) return "autumn";
  if (/summer|cicada|heat|夏|蝉|暑/.test(text)) return "summer";
  if (/spring|blossom|fresh growth|春|花|新叶/.test(text)) return "spring";
  return "unseasoned";
}

function visualTimeFromText(text) {
  if (/dawn|sunrise|morning|黎明|清晨|破晓/.test(text)) return "dawn";
  if (/dusk|twilight|sunset|evening|黄昏|傍晚|薄暮|暮色/.test(text)) return "dusk";
  if (/night|midnight|moon|夜|月光|午夜/.test(text)) return "night";
  if (/day|noon|sunny|白天|日间|正午|晴天/.test(text)) return "day";
  return "";
}

function visualLocationFromText(text) {
  if (/archive|library|ledger|档案|图书馆|账本/.test(text) && /street|outside|exterior|街|外|室外/.test(text)) return "city-street";
  if (/market|bazaar|vendor|stall|city|street|alley|plaza|集市|市场|摊|城市|街|巷|广场/.test(text)) return "market-city";
  if (/archive|library|档案|图书馆|书库/.test(text)) return "archive-room";
  if (/tavern|inn|pub|酒馆|旅店|客栈/.test(text)) return "interior";
  if (/forest|woods|grove|森林|树林/.test(text)) return "forest";
  if (/shrine|temple|altar|圣坛|神殿|祭坛/.test(text)) return "shrine";
  if (/waterfall|cascade|瀑布/.test(text)) return "waterfall";
  if (/pond|lake|stream|brook|池塘|湖|溪/.test(text)) return "water";
  return "scene";
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

function soundscapeStatusText(soundscape = room?.soundscape) {
  const label = soundscape ? localizeSoundscape(soundscape) : t(uiLanguage, "ambience.waiting");
  if (!canUseAudio()) return t(uiLanguage, "ambience.unsupported");
  return t(uiLanguage, ambienceEngine.enabled ? "ambience.status.on" : "ambience.status.off", { soundscape: label });
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

function handleRuntimeAssetImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement)) return;
  if (image.dataset.runtimeFallbackApplied === "true") return;
  const file = assetPathFromUrl(image.getAttribute("src") || image.currentSrc || "");
  const fallbackFile = image.dataset.runtimeFallbackSrc || runtimeGeneratedAssetFallback(file);
  if (!fallbackFile) {
    image.dataset.assetMissing = "true";
    return;
  }
  image.dataset.runtimeFallbackApplied = "true";
  image.dataset.runtimeAssetOriginal = file;
  image.src = assetUrl(fallbackFile);
}

function installRuntimeAssetFallbacks(root = document) {
  const images = [...root.querySelectorAll('img[src*="assets/generated/"], img[src*="/assets/generated/"]')];
  for (const image of images) {
    const file = assetPathFromUrl(image.getAttribute("src") || "");
    const fallbackFile = runtimeGeneratedAssetFallback(file);
    if (!fallbackFile) continue;
    image.dataset.runtimeFallbackSrc = assetUrl(fallbackFile);
    if (image.complete && image.naturalWidth === 0) {
      handleRuntimeAssetImageError({ target: image });
    }
  }
}

function runtimeAssetFallbackAttrs(file, explicitFallback = "") {
  const fallbackFile = explicitFallback || runtimeGeneratedAssetFallback(file);
  return fallbackFile ? ` data-runtime-fallback-src="${escapeHtml(assetUrl(fallbackFile))}"` : "";
}

function runtimeCssBackgroundImage(file, explicitFallback = "") {
  if (!file) return "";
  const primary = cssUrl(assetUrl(file));
  const fallbackFile = explicitFallback || runtimeGeneratedAssetFallback(file);
  return fallbackFile ? `${primary}, ${cssUrl(assetUrl(fallbackFile))}` : primary;
}

function runtimeGeneratedAssetFallback(file) {
  const normalized = assetPathFromUrl(file);
  if (!/^assets\/generated\/.+\.(png|jpe?g|webp)$/i.test(normalized)) return "";
  if (/\/options\//.test(normalized)) return normalized.replace(/\.(png|jpe?g|webp)$/i, ".svg");
  if (/\/scenes\//.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.scene;
  if (/\/tokens\//.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.token;
  if (/class-badge/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.class;
  if (/action-icon/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.action;
  if (/weather-overlay|faction-overlay/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.status;
  if (/status-icon|status-hazard/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.status;
  if (/\/spells\//.test(normalized)) return spellRuntimeFallback(normalized);
  if (/scroll-icon|scroll/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.scroll;
  if (/weapon|sword|blade|saber|spear|axe|bow|mace|staff|dagger/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.weapon;
  if (/armor|wearable|robe|chain|leather|outfit|boots|shield/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.armor;
  if (/consumable|provision|potion|tonic|ration|bandage|salve|wine|food/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.consumable;
  if (/tool|clue|key|map|ledger|compass|lantern|monocle|mortar|hook/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.tool;
  if (/reward|treasure|trade|market|ring|coin|gem|coffer|material/.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.reward;
  return normalized.replace(/\.(png|jpe?g|webp)$/i, ".svg");
}

function spellRuntimeFallback(file) {
  if (/heal|mend|suture|restoration|057-08/.test(file)) return "assets/spells/mend-wounds.svg";
  if (/sleep|drowsy|veil|057-10/.test(file)) return "assets/spells/veil-of-sleep.svg";
  if (/ward|shield|guard|oath|057-09|057-32/.test(file)) return "assets/spells/silver-ward.svg";
  if (/frost|ice|043-15/.test(file)) return "assets/spells/frost-bind.svg";
  if (/storm|lightning|thunder|057-16|057-07/.test(file)) return "assets/spells/storm-arc.svg";
  if (/glass|mirror|echo|illusion|043-11|043-16/.test(file)) return "assets/spells/glass-echo.svg";
  if (/vine|thorn|snare|bind|057-12/.test(file)) return "assets/spells/thorn-snare.svg";
  if (/poison|cleanse|043-14/.test(file)) return "assets/spells/cleanse-poison.svg";
  return GENERATED_RASTER_FALLBACK_FILES.spell;
}

function assetPathFromUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(data:|blob:)/.test(raw)) return "";
  try {
    const parsed = new URL(raw, window.location.href);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return raw.replace(/^\/+/, "");
  }
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
        syncClassDependentSetup(select.value);
      }
      syncSetupGuidance();
    });
    syncBuilderCards(group, select.value);
  }
  document.querySelector("#classSelect")?.addEventListener("change", renderStarterSpellCards);
  applyRecommendedAttributePreset(document.querySelector("#classSelect")?.value || "warrior");
  syncClassDependentSetup(document.querySelector("#classSelect")?.value || "warrior");
}

function syncBuilderCards(group, value) {
  for (const button of group.querySelectorAll("[data-card-value]")) {
    const active = button.dataset.cardValue === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  const hasCard = Boolean(group.querySelector(`[data-card-value="${cssEscape(value)}"]`));
  group.dataset.nativeOnlySelection = String(!hasCard);
}

function syncClassDependentSetup(classId) {
  const group = document.querySelector("#warriorSpecializationGroup");
  if (group) {
    const showWarrior = classId === "warrior";
    group.classList.toggle("hidden", !showWarrior);
    group.setAttribute("aria-hidden", String(!showWarrior));
    group.inert = !showWarrior;
  }
  renderStarterSpellCards();
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) return globalThis.CSS.escape(String(value || ""));
  return String(value || "").replace(/["\\]/g, "\\$&");
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
    <article class="spell-card" data-spell-state="${STARTING_SPELL_CARD_STATE.state}" data-spell-availability="${STARTING_SPELL_CARD_STATE.availability}">
      ${spellArtMarkup(spell.id, localizeTextValue(spell.label), "spell-card-art")}
      <span class="spell-card-state">${escapeHtml(t(uiLanguage, "spell.stateKnown"))}</span>
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

function currentActionTurnState() {
  const active = room?.players?.find((player) => player.id === room.activePlayerId) || null;
  const localPlayer = getLocalPlayer();
  const hasPlayerBinding = hasLocalPlayerBinding();
  const pending = getLocalPendingPlayer();
  const activeName = active?.character?.name || active?.name || t(uiLanguage, "state.player");
  if (pending?.status === "pending") {
    return { owner: "pending", active, localPlayer, hasPlayerBinding, activeName };
  }
  if (!hasPlayerBinding) {
    return { owner: "no-local", active, localPlayer, hasPlayerBinding, activeName };
  }
  if (!active) {
    return { owner: "no-active", active, localPlayer, hasPlayerBinding, activeName };
  }
  if (localPlayer?.id === active.id) {
    return { owner: "local", active, localPlayer, hasPlayerBinding, activeName };
  }
  return { owner: "other", active, localPlayer, hasPlayerBinding, activeName };
}

function currentActionGuidanceState(isChat = false) {
  const state = currentActionTurnState();
  if (isChat) {
    if (!state.hasPlayerBinding) {
      return {
        ...state,
        mode: "chat",
        canType: false,
        canSubmit: false,
        hintKey: state.owner === "pending" ? "action.hint.pending" : "action.noPlayerHint",
        formAriaKey: state.owner === "pending" ? "action.formAria.pending" : "action.formAria.noPlayer",
        placeholderKey: state.owner === "pending" ? "action.pendingPlaceholder" : "action.noPlayerPlaceholder",
        textAriaKey: state.owner === "pending" ? "action.pendingTextAria" : "action.noPlayerTextAria",
        textTitleKey: state.owner === "pending" ? "action.pendingTextTitle" : "action.noPlayerTextTitle",
        submitLabelKey: state.owner === "pending" ? "button.pendingApproval" : "action.noPlayerSubmit",
        submitAriaKey: state.owner === "pending" ? "action.pendingSubmitAria" : "action.noPlayerSubmitAria",
        submitErrorKey: state.owner === "pending" ? "action.pendingSubmitError" : "action.noPlayerSubmitError"
      };
    }
    const hintKey = state.owner === "local"
      ? "action.hint.chatLocal"
      : state.owner === "other"
        ? "action.hint.chatOther"
        : "action.hint.chatNoActive";
    return {
      ...state,
      mode: "chat",
      canType: true,
      canSubmit: true,
      hintKey,
      formAriaKey: "action.formAria.chat",
      placeholderKey: "placeholder.chat",
      textAriaKey: "action.textAria.chat",
      textTitleKey: "action.textTitle.chat",
      submitLabelKey: "button.chat",
      submitAriaKey: "action.submitChatAria",
      submitErrorKey: "error.chatRequired"
    };
  }
  if (!state.hasPlayerBinding) {
    return {
      ...state,
      mode: "action",
      canType: false,
      canSubmit: false,
      hintKey: state.owner === "pending" ? "action.hint.pending" : "action.noPlayerHint",
      formAriaKey: state.owner === "pending" ? "action.formAria.pending" : "action.formAria.noPlayer",
      placeholderKey: state.owner === "pending" ? "action.pendingPlaceholder" : "action.noPlayerPlaceholder",
      textAriaKey: state.owner === "pending" ? "action.pendingTextAria" : "action.noPlayerTextAria",
      textTitleKey: state.owner === "pending" ? "action.pendingTextTitle" : "action.noPlayerTextTitle",
      submitLabelKey: state.owner === "pending" ? "button.pendingApproval" : "action.noPlayerSubmit",
      submitAriaKey: state.owner === "pending" ? "action.pendingSubmitAria" : "action.noPlayerSubmitAria",
      submitErrorKey: state.owner === "pending" ? "action.pendingSubmitError" : "action.noPlayerSubmitError"
    };
  }
  if (state.owner === "local") {
    return {
      ...state,
      mode: "action",
      canType: true,
      canSubmit: true,
      hintKey: "action.hint.localTurn",
      formAriaKey: "action.formAria.action",
      placeholderKey: "placeholder.action",
      textAriaKey: "action.textAria.action",
      textTitleKey: "action.textTitle.action",
      submitLabelKey: "button.act",
      submitAriaKey: "action.submitActionAria",
      submitErrorKey: "error.actionRequired"
    };
  }
  return {
    ...state,
    mode: "action",
    canType: true,
    canSubmit: false,
    hintKey: state.owner === "other" ? "action.hint.otherTurn" : "action.hint.noActive",
    formAriaKey: state.owner === "other" ? "action.formAria.otherTurn" : "action.formAria.noActive",
    placeholderKey: state.owner === "other" ? "action.otherTurnPlaceholder" : "action.noActivePlaceholder",
    textAriaKey: state.owner === "other" ? "action.otherTurnTextAria" : "action.noActiveTextAria",
    textTitleKey: state.owner === "other" ? "action.otherTurnTextTitle" : "action.noActiveTextTitle",
    submitLabelKey: state.owner === "other" ? "action.waitingSubmit" : "action.noActiveSubmit",
    submitAriaKey: state.owner === "other" ? "action.waitingSubmitAria" : "action.noActiveSubmitAria",
    submitErrorKey: state.owner === "other" ? "action.waitingSubmitError" : "action.noActiveSubmitError"
  };
}

function syncActionModeControls() {
  const intentSelect = els.actionForm?.elements?.intent;
  const modeSelect = els.actionForm?.elements?.mode;
  const channelSelect = els.actionForm?.elements?.channel;
  const textInput = els.actionForm?.elements?.text;
  const submitButton = els.actionForm?.querySelector("button[type='submit']");
  if (!intentSelect || !modeSelect || !channelSelect) return;
  const isChat = intentSelect.value === "chat";
  const guidance = currentActionGuidanceState(isChat);
  const canSubmit = guidance.canSubmit;
  els.actionForm.dataset.intent = isChat ? "chat" : "action";
  els.actionForm.dataset.actionState = canSubmit ? "ready" : "blocked";
  els.actionForm.dataset.guidanceOwner = guidance.owner;
  els.actionForm.classList.toggle("chat-mode", isChat);
  els.actionForm.classList.toggle("action-mode", !isChat);
  modeSelect.disabled = isChat || !canSubmit;
  channelSelect.disabled = !isChat || !canSubmit;
  els.actionForm.setAttribute("aria-label", t(uiLanguage, guidance.formAriaKey, { name: guidance.activeName }));
  els.actionForm.setAttribute("aria-describedby", "actionModeHint actionError");
  intentSelect.setAttribute("aria-label", t(uiLanguage, "action.intentAria"));
  intentSelect.title = t(uiLanguage, "action.intentTitle");
  modeSelect.setAttribute("aria-label", t(uiLanguage, isChat ? "action.rollModeAria.chat" : "action.rollModeAria.action"));
  modeSelect.title = t(uiLanguage, isChat ? "action.rollModeTitle.chat" : "action.rollModeTitle.action");
  channelSelect.setAttribute("aria-label", t(uiLanguage, isChat ? "action.channelAria.chat" : "action.channelAria.action"));
  channelSelect.title = t(uiLanguage, isChat ? "action.channelTitle.chat" : "action.channelTitle.action");
  if (textInput) {
    textInput.disabled = !guidance.canType;
    textInput.placeholder = t(uiLanguage, guidance.placeholderKey, { name: guidance.activeName });
    textInput.setAttribute("aria-label", t(uiLanguage, guidance.textAriaKey, { name: guidance.activeName }));
    textInput.setAttribute("aria-describedby", "actionModeHint actionError");
    textInput.title = t(uiLanguage, guidance.textTitleKey, { name: guidance.activeName });
  }
  if (submitButton && els.actionForm.dataset.submitState !== "sending") {
    submitButton.dataset.primaryAction = isChat ? "chat" : "action";
    submitButton.disabled = !canSubmit;
    submitButton.textContent = t(uiLanguage, guidance.submitLabelKey, { name: guidance.activeName });
    submitButton.setAttribute("aria-label", t(uiLanguage, guidance.submitAriaKey, { name: guidance.activeName }));
  }
  if (els.actionModeHint) {
    els.actionModeHint.textContent = t(uiLanguage, guidance.hintKey, { name: guidance.activeName });
    enhanceActionModeHint(guidance, isChat);
  }
}

function enhanceActionModeHint(guidance, isChat = false) {
  if (!els.actionModeHint || !els.actionForm) return;
  const cue = isChat ? "" : characterActionCueText(actionCueCharacter(guidance));
  els.actionForm.dataset.actionCue = cue ? "options" : "basic";
  if (!cue) return;
  els.actionModeHint.textContent = `${els.actionModeHint.textContent} ${cue}`;
  els.actionModeHint.title = cue;
}

function actionCueCharacter(guidance = {}) {
  return guidance.active?.character || guidance.localPlayer?.character || null;
}

function characterActionCueText(character = null) {
  if (!character) return "";
  const spellLabels = limitedRuleLabels(learnedRuleEntries(character, "spell"), "spell", 2, ruleChoiceOptionIndex(character, "spell"));
  const skillLabels = limitedRuleLabels(learnedRuleEntries(character, "combatSkill"), "combatSkill", 2, ruleChoiceOptionIndex(character, "combatSkill"));
  const itemLabels = actionableInventoryLabels(character, 2);
  const segments = [];
  if (spellLabels.length) segments.push(`${localizeTextValue(LEVELING_LABELS.actionCueSpells)}: ${spellLabels.join(", ")}`);
  if (skillLabels.length) segments.push(`${localizeTextValue(LEVELING_LABELS.actionCueSkills)}: ${skillLabels.join(", ")}`);
  if (itemLabels.length) segments.push(`${localizeTextValue(LEVELING_LABELS.actionCueItems)}: ${itemLabels.join(", ")}`);
  if (!segments.length) return "";
  return `${localizeTextValue(LEVELING_LABELS.actionCuePrefix)}: ${segments.join(uiLanguage === "zh" ? "；" : "; ")}`;
}

function limitedRuleLabels(entries, kind, limit = 2, optionIndex = new Map()) {
  const labels = entries.map((entry) => ruleEntryLabel(entry, optionIndex, kind)).filter(Boolean);
  if (labels.length <= limit) return labels;
  return [...labels.slice(0, limit), `+${labels.length - limit} ${localizeTextValue(LEVELING_LABELS.more)}`];
}

function actionableInventoryLabels(character = {}, limit = 2) {
  const labels = [];
  for (const item of character.inventory || []) {
    const definition = inventoryDefinition(item);
    const state = inventoryActionState(item, definition);
    if (!state.use.available && !state.equip.available) continue;
    labels.push(inventoryItemName(item));
    if (labels.length >= limit) break;
  }
  return labels;
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
    { id: "offHand", label: t(uiLanguage, "slot.offHand"), summarySlot: "offHand", match: /shield|scroll|spell|focus|holy|arcane/i },
    { id: "kit", label: t(uiLanguage, "slot.kit"), summarySlot: "accessory", match: /tool|kit|lamp|notebook|key/i }
  ];
  const items = slots.map((slot) => {
    const summaryItem = equipmentSummary?.slots?.[slot.summarySlot]?.item;
    const entry = summaryItem
      || inventory.find((item) => item?.equipped && inventoryEntryMatchesSlot(item, slot))
      || inventory.find((item) => !inventory.some((candidate) => candidate?.equipped) && inventoryEntryMatchesSlot(item, slot));
    return {
      label: slot.label,
      value: entry ? inventoryItemName(entry) : t(uiLanguage, "slot.empty")
    };
  });
  return {
    items,
    compact: items.map((slot) => slot.value === t(uiLanguage, "slot.empty") ? "-" : slot.value).join("/")
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
  const normalized = ruleEntryId(spellId);
  const known = Object.values(STARTER_SPELLS_BY_CLASS).flat().find((spell) => spell.id === normalized);
  if (known) return localizeTextValue(known.label);
  const fallbackLabel = localizeTextValue(RULE_CARD_FALLBACKS[normalized]?.label);
  if (fallbackLabel) return fallbackLabel;
  return String(normalized || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSpellIcon(spellId) {
  spellId = ruleEntryId(spellId);
  if (/heal|ward|shield|light/.test(spellId)) return "+";
  if (/fire|bolt|omen/.test(spellId)) return "*";
  if (/sleep|shadow/.test(spellId)) return "~";
  return "^";
}

function spellArtMarkup(spellId, label, className, artMeta = null) {
  const file = ruleEntryAsset(artMeta || spellId, "spell")?.file || spellArtFile(spellId);
  if (!file) {
    return `<span class="${escapeHtml(className)} spell-art-fallback" aria-hidden="true">${escapeHtml(formatSpellIcon(spellId))}</span>`;
  }
  return `<img class="${escapeHtml(className)}" src="${escapeHtml(assetUrl(file))}"${runtimeAssetFallbackAttrs(file, artMeta?.fallbackFile)} alt="" loading="lazy" decoding="async" />`;
}

function spellArtFile(spellId) {
  const normalized = ruleEntryId(spellId);
  if (RULE_CARD_FALLBACKS[normalized]?.art?.file) return RULE_CARD_FALLBACKS[normalized].art.file;
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
  return `<img class="${className}" src="${escapeHtml(assetUrl(file))}"${runtimeAssetFallbackAttrs(file, definition?.assetRef?.fallbackFile)} alt="${escapeHtml(label)}" loading="lazy" decoding="async" />`;
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
  const style = image ? ` style="background-image: ${escapeHtml(runtimeCssBackgroundImage(image))}"` : "";
  const avatarClass = `${className} ${descriptor.kind === "custom" ? "avatar-custom" : "avatar-icon"}`;
  return `<span class="${escapeHtml(avatarClass)}" data-avatar-kind="${escapeHtml(descriptor.kind)}" data-avatar-id="${escapeHtml(descriptor.id)}" title="${escapeHtml(descriptor.label || name)}"${style}>${image ? "" : escapeHtml(initials(name))}</span>`;
}

function applyAvatar(node, player) {
  const descriptor = avatarDescriptor(player);
  const image = descriptor.file;
  node.style.backgroundImage = image ? runtimeCssBackgroundImage(image) : "";
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
