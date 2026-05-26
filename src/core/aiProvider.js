import { normalizeLanguage, t } from "./localization.js";
import { buildRuleKnowledgeContext } from "./rules.js";

const DEFAULT_MODEL = "gpt-5.4-mini";
const BEAT_LABELS = Object.freeze({
  hook: { en: "Hook", zh: "开场钩子" },
  discovery: { en: "Discovery", zh: "发现" },
  trail: { en: "Trail", zh: "追踪" },
  revelation: { en: "Revelation", zh: "揭示" },
  complication: { en: "Complication", zh: "变故" },
  retaliation: { en: "Retaliation", zh: "反击" },
  crisis: { en: "Crisis", zh: "危机" },
  epilogue: { en: "Epilogue", zh: "尾声" }
});

const FALLBACK_ACTION_OPTIONS = Object.freeze({
  en: [
    "State a clear goal, method, and visible risk before the next roll.",
    "Ask which ally, tool, or clue you bring into the move.",
    "Choose whether speed, safety, secrecy, or leverage matters most right now."
  ],
  zh: [
    "先说清楚下一步目标、方法和愿意承担的可见风险。",
    "说明哪名队友、哪件工具或哪条线索会参与这次行动。",
    "在速度、安全、隐秘或筹码之间选择此刻最重要的一项。"
  ]
});

const ALLOWED_LATIN_TERMS = new Set(["AIDM", "AI", "DM", "NPC", "HP", "MP", "XP", "DC", "SRD"]);
const CHINESE_FRAGMENT_PLACEHOLDER = "相关信息";
const ZH_FRAGMENT_TRANSLATIONS = Object.freeze([
  [/\brain[-\s]+sheltered market\b/gi, "雨棚集市"],
  [/\bouter old forest\b/gi, "城外古林"],
  [/\barchive gate\b/gi, "档案馆门口"],
  [/\bnorth gate\b/gi, "北门"],
  [/\bbrass lock\b/gi, "黄铜锁"],
  [/\bsealed ledger\b/gi, "封印账本"],
  [/\bold coffer\b/gi, "旧匣"],
  [/\bfield notebook\b/gi, "现场札记"],
  [/\btravel lamp\b/gi, "旅行提灯"],
  [/\bcandle smoke\b/gi, "烛烟"],
  [/\bthunderstorm\b/gi, "雷雨"],
  [/\barchive\b/gi, "档案馆"],
  [/\bclues?\b/gi, "线索"],
  [/\blocked\b/gi, "上锁"],
  [/\blocks?\b/gi, "锁"],
  [/\bledgers?\b/gi, "账本"],
  [/\bcouriers?\b/gi, "信使"],
  [/\bgates?\b/gi, "门口"],
  [/\bstairs?\b/gi, "阶梯"],
  [/\bcorridors?\b/gi, "走廊"],
  [/\brooms?\b/gi, "房间"],
  [/\bwitness(?:es)?\b/gi, "目击者"],
  [/\bsurfaces?\b/gi, "表面"],
  [/\bcontradictions?\b/gi, "矛盾点"],
  [/\btracks?\b/gi, "足迹"],
  [/\btraces?\b/gi, "痕迹"],
  [/\broutes?\b/gi, "路线"],
  [/\brisks?\b/gi, "风险"],
  [/\bstorms?\b/gi, "风暴"],
  [/\bthunder\b/gi, "雷声"],
  [/\brain\b/gi, "雨"],
  [/\bwinter\b/gi, "冬季"],
  [/\bautumn\b/gi, "秋季"],
  [/\bspring\b/gi, "春季"],
  [/\bsummer\b/gi, "夏季"],
  [/\bcold\b/gi, "寒冷"],
  [/\bbrass\b/gi, "黄铜"],
  [/\binspect\b/gi, "检查"],
  [/\bfind\b/gi, "寻找"],
  [/\btrack\b/gi, "追踪"],
  [/\bfollow\b/gi, "跟随"]
]);
const RANDOM_HOOK_LABELS = Object.freeze({
  "witness-reframes-question": {
    en: "an overlooked witness changes the direction of the next question",
    zh: "被忽略的目击者改变下一个问题的方向"
  },
  "detail-becomes-leverage": {
    en: "a small environmental detail turns into leverage",
    zh: "一个细小环境细节变成可利用的筹码"
  },
  "clue-splits-routes": {
    en: "the same clue points to two routes with different costs",
    zh: "同一条线索指向两条代价不同的路线"
  },
  "desire-before-fact": {
    en: "an NPC reveals a desire before revealing a fact",
    zh: "NPC 先显露欲望，再显露事实"
  },
  "place-answers-action": {
    en: "the location answers the action with motion, sound, or pressure",
    zh: "地点用动作、声音或压力回应这次行动"
  },
  "miss-becomes-bargain": {
    en: "a failed attempt creates a bargain instead of a dead end",
    zh: "失败制造一次交易，而不是死路"
  }
});

export class AIProvider {
  constructor(env = process.env) {
    this.apiKey = env.OPENAI_API_KEY || "";
    this.model = env.OPENAI_MODEL || DEFAULT_MODEL;
    this.baseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  async narrate(input) {
    if (!this.apiKey) {
      return localNarration(input);
    }

    try {
      return await this.openAiNarration(input);
    } catch (error) {
      const fallback = localNarration(input);
      return {
        ...fallback,
        provider: "local-fallback",
        warning: error.message
      };
    }
  }

  async openAiNarration({ room, player, actionText, check, memories }) {
    const prompt = buildNarrationPrompt({ room, player, actionText, check, memories });
    const startedAt = Date.now();
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt,
        max_output_tokens: 450
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const extractedText = extractResponseText(data);
    const fallback = localNarration({ room, player, actionText, check, memories });
    const usesModelText = extractedText && narrationMatchesLanguage(extractedText, room?.language);
    const text = usesModelText ? extractedText : fallback.text;
    return {
      provider: usesModelText ? "openai" : "local-fallback",
      model: this.model,
      text,
      warning: usesModelText ? undefined : "OpenAI narration did not match the room language; used deterministic local narration.",
      latencyMs: Date.now() - startedAt,
      promptChars: prompt.length,
      completionChars: text.length
    };
  }
}

export function localNarration({ room, player, actionText, check, memories = [] }) {
  const language = normalizeLanguage(room?.language);
  const scene = room?.scene || {};
  const character = player?.character || {};
  const safeActionText = languageSafeText(actionText, language, t(language, "currentAction"));
  const safeLocation = languageSafeText(scene.location, language, t(language, "currentScene"));
  const safeObjective = languageSafeText(scene.objective, language, t(language, "currentObjective"));
  const safeAmbience = languageSafeText(scene.ambience, language, t(language, "ambientPressure"));
  const knowledge = buildRuleKnowledgeContext({
    room,
    player,
    actionText: safeActionText,
    check,
    maxSuggestions: 4
  });
  const beatLabel = localizedBeatLabel(language, room?.director?.beat || knowledge.promptPack?.seedInputs?.beat);
  const suggestions = localizedActionOptions(language, knowledge.actionGuidance.suggestions);
  const weatherLabel = languageSafeText(knowledge.environment.weatherLabel[language] || knowledge.environment.weatherLabel.en, language, language === "zh" ? "天气" : "weather");
  const seasonLabel = languageSafeText(knowledge.environment.seasonLabel[language] || knowledge.environment.seasonLabel.en, language, language === "zh" ? "季节" : "season");
  const successLine = check.success
    ? t(language, "localSuccess", { margin: check.margin })
    : t(language, "localFailure", { margin: check.margin });
  const memoryText = languageSafeText(memories[0]?.text, language, "");
  const memoryLine = memoryText ? t(language, "localMemory", { text: memoryText }) : t(language, "localNoMemory");
  const knowledgeLine = t(language, "localKnowledgeHook", {
    weather: weatherLabel,
    season: seasonLabel,
    suggestion: suggestions[0]
  });
  const sensoryLine = t(language, "narrationSensoryDetail", {
    weather: weatherLabel,
    season: seasonLabel,
    ambience: safeAmbience
  });
  const consequence = check.success
    ? t(language, "localSuccessLead", { objective: safeObjective })
    : t(language, "localFailurePressure", { ambience: safeAmbience });
  const text = [
    t(language, "narrationSceneBeat", { beat: beatLabel }),
    t(language, "localMove", { characterName: character.name || t(language, "defaultCharacter"), location: safeLocation, actionText: safeActionText }),
    sensoryLine,
    `${successLine} ${t(language, "localRoll", { total: check.total, dc: check.dc })}`,
    knowledgeLine,
    memoryLine,
    t(language, "narrationConsequence", { consequence }),
    t(language, "narrationActionOptions", { options: formatActionOptions(language, suggestions) })
  ].join("\n");

  return {
    provider: "local",
    model: "deterministic",
    text,
    latencyMs: 0,
    promptChars: 0,
    completionChars: text.length
  };
}

function buildNarrationPrompt({ room, player, actionText, check, memories = [] }) {
  const language = normalizeLanguage(room?.language);
  const scene = room?.scene || {};
  const character = player?.character || {};
  const safeActionText = languageSafeText(actionText, language, t(language, "currentAction"));
  const safeMemories = memories
    .map((memory) => languageSafeText(memory?.text, language, ""))
    .filter(Boolean);
  const knowledge = buildRuleKnowledgeContext({
    room,
    player,
    actionText: safeActionText,
    check,
    maxSuggestions: 4
  });
  const suggestions = localizedActionOptions(language, knowledge.actionGuidance.suggestions);
  const beatLabel = localizedBeatLabel(language, room?.director?.beat || knowledge.promptPack?.seedInputs?.beat);
  const environmentHook = languageSafeText(
    knowledge.environment.narrativeHooks[language] || knowledge.environment.narrativeHooks.en,
    language,
    language === "zh" ? "环境压力改变了这次行动的节奏。" : "The environment changes the tempo of this move."
  );
  const randomnessHook = localizedRandomnessHook(language, knowledge.randomness);
  const sceneTitle = languageSafeText(scene.title, language, t(language, "currentScene"));
  const sceneLocation = languageSafeText(scene.location, language, t(language, "currentScene"));
  const sceneObjective = languageSafeText(scene.objective, language, t(language, "currentObjective"));

  if (language === "zh") {
    return [
      "你是 AIDM，一位桌面游戏主持人。只用简体中文给玩家输出沉浸式旁白。",
      "不要夹杂英文标题、英文行动建议或英文结构标签；角色名、骰值缩写和来源 URL 可以保留原样。",
      "代码已经结算生命值、物品、回合顺序、骰值和状态；你只能叙事和提出可选方向。",
      "必须包含：场景节拍、感官细节、行动后果，以及 2-4 个行动参考。行动参考不能替玩家做决定。",
      "只把本地 SRD 风格知识当结构参考；保持原创，不引用规则正文。",
      `知识归因边界：${knowledge.attribution}`,
      `场景节拍：${beatLabel}`,
      `环境钩子：${environmentHook}`,
      `行动参考：${formatActionOptions(language, suggestions)}`,
      `随机钩子：${randomnessHook}`,
      `房间：${languageSafeText(room?.title, language, t(language, "untitledRoom"))}`,
      `场景：${sceneTitle}，位置：${sceneLocation}`,
      `目标：${sceneObjective}`,
      `行动角色：${character.name || t(language, "defaultCharacter")}，${languageSafeText(character.archetype, language, t(language, "defaultArchetype"))}`,
      `玩家行动：${safeActionText}`,
      `规则结果：${check.expression} = ${check.total}，目标难度 ${check.dc}，成功=${check.success}，差值=${check.margin}`,
      `相关记忆：${safeMemories.map((memory) => `- ${memory}`).join("\n") || "无"}`,
      "只返回给牌桌看的旁白文本。"
    ].join("\n");
  }

  return [
    "You are AIDM, a tabletop game master. Use English only for player-facing narration, guidance, and structure labels.",
    `Output language: ${t(language, "promptLanguage")}.`,
    "Do not switch into Chinese except for player-provided names. Do not translate state by changing its meaning.",
    "Do not change HP, inventory, turn order, dice values, or status. The server already computed rules.",
    "Required storyteller structure: scene beat, sensory detail, consequence, and 2-4 optional next actions.",
    "Offer possible actions as references only; do not decide what the player does next.",
    "Use the local SRD-style knowledge context as structure only; do not quote rules text.",
    `Knowledge attribution boundary: ${knowledge.attribution}`,
    `Scene beat: ${beatLabel}`,
    `Environment hook: ${environmentHook}`,
    `Action suggestions: ${formatActionOptions(language, suggestions)}`,
    `Randomness hook: ${randomnessHook}`,
    `Room: ${languageSafeText(room?.title, language, t(language, "untitledRoom"))}`,
    `Scene: ${sceneTitle} at ${sceneLocation}`,
    `Objective: ${sceneObjective}`,
    `Active character: ${character.name || t(language, "defaultCharacter")}, ${languageSafeText(character.archetype, language, t(language, "defaultArchetype"))}`,
    `Player action: ${safeActionText}`,
    `Rules result: ${check.expression} = ${check.total}, DC ${check.dc}, success=${check.success}, margin=${check.margin}`,
    `Relevant memories: ${safeMemories.map((memory) => `- ${memory}`).join("\n") || "none"}`,
    "Return only narration text for the table."
  ].join("\n");
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text.trim();
  }
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("").trim();
}

function localizedBeatLabel(language, beat = "hook") {
  const locale = normalizeLanguage(language);
  return BEAT_LABELS[beat]?.[locale] || (locale === "zh" ? "当前节拍" : "Current beat");
}

function localizedRandomnessHook(language, randomness = {}) {
  const locale = normalizeLanguage(language);
  const label = RANDOM_HOOK_LABELS[randomness.selectedHookId]?.[locale];
  return label || languageSafeText(randomness.selectedHook, locale, locale === "zh" ? "场景出现新的可回应变化" : "the scene adds a new actionable change");
}

function localizedActionOptions(language, suggestions = []) {
  const locale = normalizeLanguage(language);
  const fallback = FALLBACK_ACTION_OPTIONS[locale];
  const options = suggestions
    .map((entry) => {
      if (typeof entry === "string") return entry;
      return locale === "zh" ? entry.zhPrompt || entry.prompt : entry.prompt || entry.zhPrompt;
    })
    .map((option) => languageSafeText(option, locale, ""))
    .filter(Boolean);
  return [...new Set([...options, ...fallback])].slice(0, 4);
}

function formatActionOptions(language, suggestions = []) {
  const locale = normalizeLanguage(language);
  const options = localizedActionOptions(locale, suggestions).slice(0, 4);
  if (locale === "zh") {
    const labels = ["一", "二", "三", "四"];
    return options.map((option, index) => `${labels[index]}、${option}`).join(" ");
  }
  return options.map((option, index) => `${index + 1}. ${option}`).join(" ");
}

function languageSafeText(value, language, fallback = "") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const locale = normalizeLanguage(language);
  if (locale === "zh") {
    const sanitized = sanitizeChineseText(text);
    return textLooksCompatible(sanitized, locale) ? sanitized : fallback;
  }
  return textLooksCompatible(text, locale) ? text : fallback;
}

function textLooksCompatible(text, language) {
  const locale = normalizeLanguage(language);
  const cjkCount = (text.match(/[\u3400-\u9fff]/gu) || []).length;
  const latinWords = latinNarrativeWords(text);
  if (locale === "zh") {
    return latinWords.length === 0 && (cjkCount > 0 || text.length > 0);
  }
  return cjkCount === 0;
}

function narrationMatchesLanguage(text, language) {
  const locale = normalizeLanguage(language);
  const cjkCount = (text.match(/[\u3400-\u9fff]/gu) || []).length;
  const latinWords = latinNarrativeWords(text).length;
  if (locale === "zh") {
    return cjkCount >= 8 && !hasSubstantialEnglishFragment(text);
  }
  return latinWords >= 4 && !hasSubstantialCjkFragment(text);
}

function latinNarrativeWords(text) {
  return (String(text || "").match(/[A-Za-z]{2,}/g) || [])
    .filter((word) => !ALLOWED_LATIN_TERMS.has(word.toUpperCase()));
}

function sanitizeChineseText(text) {
  let sanitized = String(text || "");
  for (const [pattern, replacement] of ZH_FRAGMENT_TRANSLATIONS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  sanitized = sanitized.replace(/[A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*)*/g, (fragment) => {
    const words = fragment.match(/[A-Za-z]{2,}/g) || [];
    if (words.length > 0 && words.every((word) => ALLOWED_LATIN_TERMS.has(word.toUpperCase()))) {
      return fragment;
    }
    return CHINESE_FRAGMENT_PLACEHOLDER;
  });
  return sanitized
    .replace(new RegExp(`${CHINESE_FRAGMENT_PLACEHOLDER}(?:\\s*${CHINESE_FRAGMENT_PLACEHOLDER})+`, "g"), CHINESE_FRAGMENT_PLACEHOLDER)
    .replace(/\s*([，。；：、！？])\s*/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function hasSubstantialEnglishFragment(text) {
  const fragments = String(text || "").match(/[A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*)*/g) || [];
  let totalWords = 0;
  for (const fragment of fragments) {
    const words = latinNarrativeWords(fragment);
    totalWords += words.length;
    if (words.length >= 2 || words.join("").length >= 14) {
      return true;
    }
  }
  return totalWords >= 3;
}

function hasSubstantialCjkFragment(text) {
  const fragments = String(text || "").match(/[\u3400-\u9fff]+/gu) || [];
  return fragments.some((fragment) => fragment.length >= 3) || fragments.reduce((sum, fragment) => sum + fragment.length, 0) >= 4;
}
