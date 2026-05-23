import { normalizeLanguage } from "./i18n.js";

const PROFILE_BASE = {
  aidm: { role: "narrator", rate: 0.92, pitch: 0.88, volume: 1 },
  rules: { role: "rules", rate: 1.02, pitch: 0.74, volume: 0.92 },
  table: { role: "system", rate: 0.96, pitch: 0.68, volume: 0.86 },
  player: { role: "player", rate: 1, pitch: 1.06, volume: 0.96 }
};

export const OPEN_SOURCE_TTS_PROVIDERS = [
  {
    id: "espeak-ng",
    name: "eSpeak NG",
    footprint: "smallest",
    mode: "offline CLI / native library",
    reason: "compact multilingual open-source synthesis for lightweight self-hosting"
  },
  {
    id: "piper",
    name: "Piper",
    footprint: "medium",
    mode: "offline ONNX voice models",
    reason: "local neural TTS with stronger naturalness when model size is acceptable"
  }
];

export function buildUtterancePlan({ author = "AIDM", text = "", language = "en" } = {}) {
  const profile = getSpeakerProfile(author, language);
  const locale = normalizeLanguage(language);
  return {
    provider: "browser-speech-synthesis",
    text: String(text || "").trim(),
    author,
    language: locale === "zh" ? "zh-CN" : "en-US",
    profile,
    hints: locale === "zh"
      ? ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Sinji", "Meijia", "Li"]
      : ["English", "United States", "Samantha", "Alex", "Daniel", "Karen"]
  };
}

export function getSpeakerProfile(author = "", language = "en") {
  const normalized = String(author || "").trim().toLowerCase();
  if (normalized === "aidm") return profile("aidm", language);
  if (normalized === "rules" || normalized === "规则") return profile("rules", language);
  if (normalized === "table" || normalized === "system" || normalized === "牌桌") return profile("table", language);

  const hash = stableHash(normalized || "player");
  return profile("player", language, {
    id: `player-${hash % 7}`,
    rate: 0.94 + (hash % 5) * 0.025,
    pitch: 0.88 + (hash % 7) * 0.06
  });
}

export function selectVoice(voices, plan, preferredName = "") {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  if (preferredName) {
    const preferred = voices.find((voice) => voice.name === preferredName);
    if (preferred) return preferred;
  }

  const sameLanguage = voices.filter((voice) => voice.lang?.toLowerCase().startsWith(plan.language.slice(0, 2).toLowerCase()));
  const hinted = sameLanguage.find((voice) => plan.hints.some((hint) => voice.name.includes(hint) || voice.lang.includes(hint)));
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

function profile(kind, language, overrides = {}) {
  const locale = normalizeLanguage(language);
  return {
    id: kind,
    ...PROFILE_BASE[kind],
    label: labelFor(kind, locale),
    ...overrides
  };
}

function labelFor(kind, locale) {
  const labels = {
    en: {
      aidm: "AIDM Narrator",
      rules: "Rules Arbiter",
      table: "Table System",
      player: "Player Character"
    },
    zh: {
      aidm: "AIDM 旁白",
      rules: "规则裁定",
      table: "牌桌系统",
      player: "玩家角色"
    }
  };
  return labels[locale]?.[kind] || labels.en[kind];
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
