import { normalizeLanguage } from "./localization.js";

export const TTS_PROVIDERS = Object.freeze([
  {
    id: "browser-speech-synthesis",
    name: "Browser SpeechSynthesis",
    cost: "free",
    runtime: "client",
    default: true,
    note: "Immediate zero-cost playback using local platform voices. This is the shipped lightweight runtime."
  },
  {
    id: "espeak-ng",
    name: "eSpeak NG",
    cost: "free",
    runtime: "optional-local-cli",
    openSource: true,
    note: "Preferred self-host target for the smallest offline open-source TTS footprint."
  },
  {
    id: "piper",
    name: "Piper",
    cost: "free",
    runtime: "optional-local-cli",
    openSource: true,
    note: "Higher-quality local neural TTS target; requires downloaded ONNX voice models."
  }
]);

const BASE_PROFILES = {
  aidm: {
    id: "aidm",
    label: "AIDM Narrator",
    zhLabel: "AIDM 旁白",
    role: "narrator",
    rate: 0.92,
    pitch: 0.88,
    volume: 1
  },
  rules: {
    id: "rules",
    label: "Rules Arbiter",
    zhLabel: "规则裁定",
    role: "rules",
    rate: 1.02,
    pitch: 0.74,
    volume: 0.92
  },
  table: {
    id: "table",
    label: "Table System",
    zhLabel: "牌桌系统",
    role: "system",
    rate: 0.96,
    pitch: 0.68,
    volume: 0.86
  },
  player: {
    id: "player",
    label: "Player Character",
    zhLabel: "玩家角色",
    role: "player",
    rate: 1,
    pitch: 1.06,
    volume: 0.96
  }
};

export function listTtsProviders() {
  return TTS_PROVIDERS.map((provider) => ({ ...provider }));
}

export function getSpeakerProfile(author = "", language = "en") {
  const normalizedAuthor = String(author || "").trim().toLowerCase();
  const locale = normalizeLanguage(language);
  if (normalizedAuthor === "aidm") {
    return localizeProfile(BASE_PROFILES.aidm, locale);
  }
  if (normalizedAuthor === "rules" || normalizedAuthor === "规则") {
    return localizeProfile(BASE_PROFILES.rules, locale);
  }
  if (normalizedAuthor === "table" || normalizedAuthor === "system" || normalizedAuthor === "牌桌") {
    return localizeProfile(BASE_PROFILES.table, locale);
  }

  const hash = stableHash(normalizedAuthor || "player");
  return localizeProfile({
    ...BASE_PROFILES.player,
    id: `player-${hash % 7}`,
    pitch: 0.88 + (hash % 7) * 0.06,
    rate: 0.94 + (hash % 5) * 0.025
  }, locale);
}

export function voiceHintsForProfile(profile, language = "en") {
  const locale = normalizeLanguage(language);
  if (locale === "zh") {
    return {
      language: "zh-CN",
      espeakVoice: "zh",
      piperVoicePattern: "zh_CN",
      browserVoiceIncludes: ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Sinji", "Meijia", "Li"]
    };
  }
  return {
    language: "en-US",
    espeakVoice: profile.role === "rules" ? "en-us+m3" : profile.role === "player" ? "en-us+f2" : "en-us",
    piperVoicePattern: "en_US",
    browserVoiceIncludes: ["English", "United States", "Samantha", "Alex", "Daniel", "Karen"]
  };
}

export function buildUtterancePlan({ author = "AIDM", text = "", language = "en" } = {}) {
  const profile = getSpeakerProfile(author, language);
  const hints = voiceHintsForProfile(profile, language);
  return {
    provider: "browser-speech-synthesis",
    author,
    text: String(text || "").trim(),
    language: hints.language,
    profile,
    hints
  };
}

function localizeProfile(profile, locale) {
  return {
    ...profile,
    label: locale === "zh" ? profile.zhLabel || profile.label : profile.label
  };
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
