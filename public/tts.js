import { normalizeLanguage } from "./i18n.js";

const BROWSER_TTS_PROVIDER_ID = "browser-speech-synthesis";

export const TTS_PROVIDER_CATALOG = [
  {
    id: BROWSER_TTS_PROVIDER_ID,
    name: "Browser SpeechSynthesis",
    runtime: "client",
    default: true,
    bundled: true,
    local: true,
    openSource: false,
    requiresModelDownload: false
  },
  {
    id: "piper",
    name: "Piper",
    footprint: "medium",
    mode: "offline CLI / native library",
    local: true,
    openSource: true,
    requiresModelDownload: true,
    reason: "fast local neural TTS when curated voice models are acceptable"
  },
  {
    id: "sherpa-onnx",
    name: "Sherpa-ONNX",
    footprint: "medium",
    mode: "offline ONNX runtime",
    local: true,
    openSource: true,
    requiresModelDownload: true,
    reason: "provider-neutral ONNX integration for multilingual local TTS models"
  },
  {
    id: "kokoro",
    name: "Kokoro",
    footprint: "small-to-medium",
    mode: "offline neural model runtime",
    local: true,
    openSource: true,
    requiresModelDownload: true,
    reason: "compact high-quality local voices when a Kokoro runtime is installed"
  },
  {
    id: "espeak-ng",
    name: "eSpeak NG",
    footprint: "smallest",
    mode: "offline CLI / native library",
    local: true,
    openSource: true,
    requiresModelDownload: false,
    reason: "compact multilingual open-source synthesis for the lowest-footprint fallback"
  }
];

export const OPEN_SOURCE_TTS_PROVIDERS = TTS_PROVIDER_CATALOG.filter((provider) => provider.openSource);

const ROLE_VOICE_PROFILES = [
  roleProfile({
    id: "aidm",
    label: "AIDM Narrator",
    zhLabel: "AIDM 旁白",
    role: "narrator",
    speakerType: "dm",
    gender: "neutral",
    age: "adult",
    aliases: ["aidm", "narrator", "gm", "dm", "host", "主持人", "旁白", "dm旁白"],
    rate: 0.92,
    pitch: 0.88,
    volume: 1,
    en: voiceHints("en-US", "en-us", "en_US-neutral", "en_US-neutral", "af_narrator", ["English", "United States", "Samantha", "Alex", "Daniel", "Karen"]),
    zh: voiceHints("zh-CN", "zh", "zh_CN-neutral", "zh_CN-neutral", "zf_narrator", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia", "Li"])
  }),
  roleProfile({
    id: "rules",
    label: "Rules Arbiter",
    zhLabel: "规则裁定",
    role: "rules",
    speakerType: "system",
    gender: "male",
    age: "adult",
    aliases: ["rules", "rule", "arbiter", "judge", "规则", "裁定", "规则裁定"],
    rate: 1.02,
    pitch: 0.74,
    volume: 0.92,
    en: voiceHints("en-US", "en-us+m3", "en_US-male-medium", "en_US-male-medium", "am_adam", ["English", "United States", "Daniel", "Fred", "Ralph", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m3", "zh_CN-male-medium", "zh_CN-male-medium", "zm_yunjian", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "table",
    label: "Table System",
    zhLabel: "牌桌系统",
    role: "system",
    speakerType: "system",
    gender: "neutral",
    age: "adult",
    aliases: ["table", "system", "state", "table system", "牌桌", "系统", "牌桌系统"],
    rate: 0.96,
    pitch: 0.68,
    volume: 0.86,
    en: voiceHints("en-US", "en-us+m1", "en_US-system", "en_US-system", "am_system", ["English", "United States", "Fred", "Daniel", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m1", "zh_CN-system", "zh_CN-system", "zm_system", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Li"])
  }),
  roleProfile({
    id: "player",
    label: "Player Character",
    zhLabel: "玩家角色",
    role: "player",
    speakerType: "player",
    gender: "neutral",
    age: "adult",
    aliases: ["player", "character", "hero", "adventurer", "玩家", "角色", "冒险者"],
    rate: 1,
    pitch: 1.06,
    volume: 0.96,
    en: voiceHints("en-US", "en-us+f2", "en_US-player", "en_US-player", "af_heart", ["English", "United States", "Samantha", "Karen", "Victoria"]),
    zh: voiceHints("zh-CN", "zh+f2", "zh_CN-player", "zh_CN-player", "zf_xiaoxiao", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "npc",
    label: "Common NPC",
    zhLabel: "普通 NPC",
    role: "npc",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    aliases: ["npc", "commoner", "villager", "civilian", "普通npc", "村民", "路人"],
    rate: 1.02,
    pitch: 0.98,
    volume: 0.94,
    en: voiceHints("en-US", "en-us", "en_US-common", "en_US-common", "af_common", ["English", "United States", "Samantha", "Alex", "Karen"]),
    zh: voiceHints("zh-CN", "zh", "zh_CN-common", "zh_CN-common", "zf_common", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Li"])
  }),
  roleProfile({
    id: "warrior",
    label: "Warrior",
    zhLabel: "战士",
    role: "warrior",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["warrior", "fighter", "soldier", "blade", "战士", "士兵", "武者"],
    rate: 0.9,
    pitch: 0.7,
    volume: 1,
    en: voiceHints("en-US", "en-us+m2", "en_US-warrior", "en_US-warrior", "am_michael", ["English", "United States", "Daniel", "Alex", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m2", "zh_CN-warrior", "zh_CN-warrior", "zm_yunxi", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "ranger",
    label: "Ranger",
    zhLabel: "游侠",
    role: "ranger",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["ranger", "scout", "hunter", "lookout", "游侠", "斥候", "猎人", "哨兵"],
    rate: 1.12,
    pitch: 1.16,
    volume: 0.93,
    en: voiceHints("en-US", "en-us+f4", "en_US-ranger", "en_US-ranger", "af_sarah", ["English", "United States", "Karen", "Samantha", "Moira"]),
    zh: voiceHints("zh-CN", "zh+f4", "zh_CN-ranger", "zh_CN-ranger", "zf_xiaoyi", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "mage",
    label: "Mage",
    zhLabel: "法师",
    role: "mage",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["mage", "wizard", "sorcerer", "witch", "法师", "巫师", "术士", "女巫"],
    rate: 0.94,
    pitch: 1.2,
    volume: 0.95,
    en: voiceHints("en-US", "en-us+f3", "en_US-mage", "en_US-mage", "af_sky", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f3", "zh_CN-mage", "zh_CN-mage", "zf_xiaoxuan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "cleric",
    label: "Cleric",
    zhLabel: "牧师",
    role: "cleric",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["cleric", "priest", "healer", "medic", "牧师", "医者", "治疗者", "祭司"],
    rate: 0.88,
    pitch: 1.08,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+f2", "en_US-cleric", "en_US-cleric", "af_bella", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f2", "zh_CN-cleric", "zh_CN-cleric", "zf_xiaomo", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "rogue",
    label: "Rogue",
    zhLabel: "盗贼",
    role: "rogue",
    speakerType: "npc",
    gender: "neutral",
    age: "young-adult",
    aliases: ["rogue", "thief", "trickster", "spy", "盗贼", "诡术师", "骗子", "间谍"],
    rate: 1.16,
    pitch: 1.24,
    volume: 0.92,
    en: voiceHints("en-US", "en-us+f5", "en_US-rogue", "en_US-rogue", "af_nicole", ["English", "United States", "Karen", "Samantha", "Tessa"]),
    zh: voiceHints("zh-CN", "zh+f5", "zh_CN-rogue", "zh_CN-rogue", "zf_xiaobei", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "bard",
    label: "Bard",
    zhLabel: "吟游诗人",
    role: "bard",
    speakerType: "npc",
    gender: "male",
    age: "young-adult",
    aliases: ["bard", "minstrel", "performer", "singer", "吟游诗人", "吟游", "诗人", "歌者"],
    rate: 1.08,
    pitch: 1.14,
    volume: 0.96,
    en: voiceHints("en-US", "en-us+m4", "en_US-bard", "en_US-bard", "am_echo", ["English", "United States", "Alex", "Daniel", "Moira"]),
    zh: voiceHints("zh-CN", "zh+m4", "zh_CN-bard", "zh_CN-bard", "zm_yunyang", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Sinji"])
  }),
  roleProfile({
    id: "dwarf",
    label: "Dwarf",
    zhLabel: "矮人",
    role: "dwarf",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["dwarf", "dwarven", "miner", "smith", "矮人", "矿工", "铁匠"],
    rate: 0.84,
    pitch: 0.58,
    volume: 1,
    en: voiceHints("en-US", "en-us+m5", "en_US-dwarf", "en_US-dwarf", "am_onyx", ["English", "United States", "Ralph", "Fred", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+m5", "zh_CN-dwarf", "zh_CN-dwarf", "zm_yunye", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "elf",
    label: "Elf",
    zhLabel: "精灵",
    role: "elf",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["elf", "elven", "fae", "精灵", "精灵族", "妖精"],
    rate: 0.92,
    pitch: 1.32,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+f1", "en_US-elf", "en_US-elf", "af_nova", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-elf", "zh_CN-elf", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "orc",
    label: "Orc",
    zhLabel: "兽人",
    role: "orc",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["orc", "orcish", "raider", "brute", "兽人", "掠夺者", "蛮兵"],
    rate: 0.78,
    pitch: 0.5,
    volume: 1,
    en: voiceHints("en-US", "en-us+m6", "en_US-orc", "en_US-orc", "am_fenrir", ["English", "United States", "Ralph", "Fred", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+m6", "zh_CN-orc", "zh_CN-orc", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "construct",
    label: "Construct",
    zhLabel: "构装体",
    role: "construct",
    speakerType: "npc",
    gender: "neutral",
    age: "ageless",
    aliases: ["construct", "automaton", "machine", "robot", "mechanical", "构装体", "机械", "机关人", "机器人"],
    rate: 0.82,
    pitch: 0.64,
    volume: 0.88,
    en: voiceHints("en-US", "en-us+m1", "en_US-construct", "en_US-construct", "am_robot", ["English", "United States", "Fred", "Daniel", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m1", "zh_CN-construct", "zh_CN-construct", "zm_robot", ["Chinese", "Mandarin", "普通话", "中文", "Li", "Sinji"])
  }),
  roleProfile({
    id: "occult-scholar",
    label: "Occult Scholar",
    zhLabel: "神秘学者",
    role: "occult-scholar",
    speakerType: "npc",
    gender: "neutral",
    age: "elder",
    aliases: ["occult scholar", "occultist", "scholar", "sage", "librarian", "神秘学者", "秘术学者", "学者", "贤者", "图书管理员"],
    rate: 0.9,
    pitch: 0.92,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+m3", "en_US-occult-scholar", "en_US-occult-scholar", "am_sage", ["English", "United States", "Daniel", "Victoria", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m3", "zh_CN-occult-scholar", "zh_CN-occult-scholar", "zm_yunjian", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Ting"])
  }),
  roleProfile({
    id: "elder",
    label: "Elder",
    zhLabel: "长者",
    role: "elder",
    speakerType: "npc",
    gender: "male",
    age: "elder",
    aliases: ["elder", "old one", "village elder", "grandfather", "长者", "老人", "村长", "老者"],
    rate: 0.82,
    pitch: 0.78,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+m5", "en_US-elder", "en_US-elder", "am_george", ["English", "United States", "Fred", "Daniel", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m5", "zh_CN-elder", "zh_CN-elder", "zm_yunye", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "child",
    label: "Child",
    zhLabel: "孩童",
    role: "child",
    speakerType: "npc",
    gender: "neutral",
    age: "child",
    aliases: ["child", "kid", "urchin", "young", "孩童", "孩子", "小孩", "少年"],
    rate: 1.1,
    pitch: 1.42,
    volume: 0.88,
    en: voiceHints("en-US", "en-us+f5", "en_US-child", "en_US-child", "af_child", ["English", "United States", "Samantha", "Karen", "Tessa"]),
    zh: voiceHints("zh-CN", "zh+f5", "zh_CN-child", "zh_CN-child", "zf_child", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "guardian",
    label: "Guardian",
    zhLabel: "守卫",
    role: "guardian",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["guardian", "guard", "sentinel", "warden", "守卫", "卫兵", "看守"],
    rate: 0.9,
    pitch: 0.72,
    volume: 0.98,
    en: voiceHints("en-US", "en-us+m2", "en_US-guardian", "en_US-guardian", "am_guardian", ["English", "United States", "Daniel", "Alex", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m2", "zh_CN-guardian", "zh_CN-guardian", "zm_yunxi", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "merchant",
    label: "Merchant",
    zhLabel: "商人",
    role: "merchant",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["merchant", "vendor", "shopkeeper", "trader", "商人", "店主", "摊主", "商贩"],
    rate: 1.05,
    pitch: 1.1,
    volume: 0.95,
    en: voiceHints("en-US", "en-us+f3", "en_US-merchant", "en_US-merchant", "af_merchant", ["English", "United States", "Karen", "Samantha", "Victoria"]),
    zh: voiceHints("zh-CN", "zh+f3", "zh_CN-merchant", "zh_CN-merchant", "zf_xiaoxiao", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "villain",
    label: "Villain",
    zhLabel: "反派",
    role: "villain",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["villain", "enemy", "boss", "antagonist", "反派", "敌人", "首领"],
    rate: 0.86,
    pitch: 0.62,
    volume: 1,
    en: voiceHints("en-US", "en-us+m4", "en_US-villain", "en_US-villain", "am_villain", ["English", "United States", "Daniel", "Fred", "Ralph"]),
    zh: voiceHints("zh-CN", "zh+m4", "zh_CN-villain", "zh_CN-villain", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  })
];

const PROFILE_BY_ID = new Map(ROLE_VOICE_PROFILES.map((profile) => [profile.id, profile]));
const PROFILE_ID_BY_ALIAS = new Map(
  ROLE_VOICE_PROFILES.flatMap((profile) => profile.aliases.map((alias) => [normalizeSpeakerKey(alias), profile.id]))
);
const PROFILE_MATCH_ORDER = [
  "occult-scholar",
  "construct",
  "warrior",
  "ranger",
  "cleric",
  "rogue",
  "dwarf",
  "orc",
  "bard",
  "mage",
  "elf",
  "elder",
  "child",
  "guardian",
  "merchant",
  "villain",
  "rules",
  "table",
  "aidm",
  "npc",
  "player"
];

export function listVoiceProfiles(language = "en") {
  const locale = normalizeLanguage(language);
  return ROLE_VOICE_PROFILES.map((profile) => localizeProfile(profile, locale));
}

export function buildUtterancePlan({
  author = "AIDM",
  text = "",
  language = "en",
  speakerType = "",
  roleType = ""
} = {}) {
  const profile = getSpeakerProfile(author, language, { speakerType, roleType });
  const hints = voiceHintsForProfile(profile, language);
  return {
    provider: BROWSER_TTS_PROVIDER_ID,
    text: String(text || "").trim(),
    author,
    language: hints.language,
    profile,
    hints
  };
}

export function getSpeakerProfile(author = "", language = "en", options = {}) {
  const request = normalizeProfileRequest(author, options);
  const locale = normalizeLanguage(language);
  const profileId = resolveProfileId(request);
  if (profileId) {
    return localizeProfile(PROFILE_BY_ID.get(profileId), locale);
  }

  const hash = stableHash(request.author || request.roleType || request.speakerType || "player");
  const fallbackId = request.speakerType === "npc" ? "npc" : "player";
  const fallback = PROFILE_BY_ID.get(fallbackId);
  return localizeProfile({
    ...fallback,
    id: `${fallbackId}-${hash % 7}`,
    rate: clamp(0.94 + (hash % 5) * 0.025, 0.76, 1.16),
    pitch: clamp(0.88 + (hash % 7) * 0.06, 0.5, 1.42)
  }, locale);
}

export function voiceHintsForProfile(profile, language = "en") {
  const locale = normalizeLanguage(language);
  const base = resolveProfileDefinition(profile);
  return cloneHints(base.hints[locale] || base.hints.en);
}

export function selectVoice(voices, plan, preferredName = "") {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  if (preferredName) {
    const preferred = voices.find((voice) => voice.name === preferredName);
    if (preferred) return preferred;
  }

  const hints = browserHintsForPlan(plan);
  const sameLanguage = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(plan.language.slice(0, 2).toLowerCase()));
  const hinted = sameLanguage.find((voice) => hints.some((hint) => includesHint(voice.name, hint) || includesHint(voice.lang, hint)));
  if (hinted) return hinted;
  if (sameLanguage.length > 0) {
    const index = stableHash(plan.author || plan.profile.id) % sameLanguage.length;
    return sameLanguage[index];
  }
  return voices[0];
}

export function splitSpeechText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function roleProfile({ en, zh, ...profile }) {
  return {
    ...profile,
    hints: { en, zh }
  };
}

function localizeProfile(profile, locale) {
  const hints = cloneHints(profile.hints?.[locale] || profile.hints?.en);
  return {
    ...profile,
    label: locale === "zh" ? profile.zhLabel || profile.label : profile.label,
    hints,
    aliases: [...(profile.aliases || [])]
  };
}

function resolveProfileDefinition(profile = {}) {
  const normalizedId = String(profile.id || "").replace(/-\d+$/, "");
  if (PROFILE_BY_ID.has(normalizedId)) return PROFILE_BY_ID.get(normalizedId);
  const byRole = ROLE_VOICE_PROFILES.find((candidate) => candidate.role === profile.role);
  return byRole || PROFILE_BY_ID.get("player");
}

function resolveProfileId(request) {
  if (request.speakerType === "dm") return "aidm";
  if (request.speakerType === "system" && !request.roleType && !request.author) return "table";

  const exactRole = PROFILE_ID_BY_ALIAS.get(request.roleType) || PROFILE_BY_ID.get(request.roleType)?.id;
  if (exactRole) return exactRole;

  const exactAuthor = PROFILE_ID_BY_ALIAS.get(request.author) || PROFILE_BY_ID.get(request.author)?.id;
  if (exactAuthor) return exactAuthor;

  const combined = [request.roleType, request.author].filter(Boolean).join(" ");
  if (combined) {
    for (const profileId of PROFILE_MATCH_ORDER) {
      const profile = PROFILE_BY_ID.get(profileId);
      if (profile.aliases.some((alias) => speakerTextMatches(combined, alias))) {
        return profile.id;
      }
    }
  }

  if (request.speakerType === "npc") return "npc";
  return "";
}

function normalizeProfileRequest(author, options) {
  if (author && typeof author === "object") {
    return {
      author: normalizeSpeakerKey(author.author || author.name || ""),
      speakerType: normalizeSpeakerKey(author.speakerType || options.speakerType || ""),
      roleType: normalizeSpeakerKey(author.roleType || author.role || options.roleType || "")
    };
  }
  return {
    author: normalizeSpeakerKey(author),
    speakerType: normalizeSpeakerKey(options.speakerType || ""),
    roleType: normalizeSpeakerKey(options.roleType || "")
  };
}

function speakerTextMatches(text, alias) {
  const normalizedText = normalizeSpeakerKey(text);
  const normalizedAlias = normalizeSpeakerKey(alias);
  if (!normalizedText || !normalizedAlias) return false;
  if (/^[a-z0-9 -]+$/.test(normalizedAlias)) {
    const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(normalizedText);
  }
  return normalizedText.includes(normalizedAlias);
}

function browserHintsForPlan(plan) {
  if (Array.isArray(plan.hints)) return plan.hints;
  return plan.hints?.browserVoiceIncludes || [];
}

function includesHint(value = "", hint = "") {
  return String(value).toLowerCase().includes(String(hint).toLowerCase());
}

function voiceHints(language, espeakVoice, piperVoicePattern, sherpaVoicePattern, kokoroVoicePattern, browserVoiceIncludes) {
  return {
    language,
    browserVoiceIncludes,
    espeakVoice,
    piperVoicePattern,
    sherpaVoicePattern,
    kokoroVoicePattern
  };
}

function cloneHints(hints) {
  return {
    ...hints,
    browserVoiceIncludes: [...(hints?.browserVoiceIncludes || [])]
  };
}

function normalizeSpeakerKey(value) {
  return String(value || "").trim().toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
