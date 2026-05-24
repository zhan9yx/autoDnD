import { listRuleKnowledgeSources } from "./rules.js";

const BRIEF_TOPICS = Object.freeze({
  actionEconomy: topic(
    "actionEconomy",
    "Action Economy",
    "Ask for one concrete objective, one method, and one risk-bearing commitment before resolving a turn-moving action.",
    "行动经济",
    "在结算会推进回合的行动前，要求玩家给出一个具体目标、一个方法和一个承担风险的承诺。"
  ),
  checks: topic(
    "checks",
    "Checks",
    "Use checks when outcome and cost are both uncertain; success should move clocks or reveal position, while failure should create recoverable pressure.",
    "检定",
    "当结果和代价都不确定时使用检定；成功推进时钟或揭示位置，失败制造可恢复的压力。"
  ),
  conditions: topic(
    "conditions",
    "Conditions",
    "Treat conditions as visible fictional constraints first, then let code-owned mechanics apply bounded numeric effects.",
    "状态",
    "先把状态描述成可见的叙事限制，再让代码拥有的规则处理有边界的数值效果。"
  ),
  travel: topic(
    "travel",
    "Travel",
    "Travel choices should name route, pace, weather pressure, and what sign the party follows into the next scene.",
    "旅行",
    "旅行选择应说明路线、节奏、天气压力，以及队伍跟随什么迹象进入下一场景。"
  ),
  equipment: topic(
    "equipment",
    "Equipment",
    "Items should explain what action they invite, why they are safe or protected, and what story memory they carry.",
    "装备",
    "物品需要说明它邀请哪类行动、为什么可安全处理或受保护，以及承载了什么故事记忆。"
  ),
  rest: topic(
    "rest",
    "Rest",
    "Rest should trade time for recovery; the table should make danger clocks, weather, and shelter explicit before confirming it.",
    "休整",
    "休整用时间换恢复；确认前应明确威胁时钟、天气和庇护条件。"
  )
});

export function buildRulesKnowledgeBrief({
  topics = Object.keys(BRIEF_TOPICS),
  language = "en",
  sourceIds = ["dnd-srd-5.2.1", "dnd-srd-5.1-cc"],
  maxBullets = 6
} = {}) {
  const locale = normalizeLocale(language);
  const sourceRegistry = new Map(listRuleKnowledgeSources().map((source) => [source.id, source]));
  const sources = sourceIds
    .map((id) => sourceRegistry.get(id))
    .filter(Boolean)
    .map((source) => ({
      id: source.id,
      title: source.title,
      license: source.license,
      useBoundary: source.useBoundary
    }));
  const selectedTopics = normalizeTopicIds(topics).slice(0, maxBullets);
  const bullets = selectedTopics.map((id) => {
    const entry = BRIEF_TOPICS[id];
    return {
      id: entry.id,
      topic: locale === "zh" ? entry.zhLabel : entry.label,
      brief: locale === "zh" ? entry.zhBrief : entry.brief,
      tags: [`rules:${entry.id}`, "aidm-original-wording"]
    };
  });

  return {
    framework: "repo-local-srd-style-brief",
    language: locale,
    sources,
    licenseBoundary: "CC-BY-4.0 attribution kept; brief uses original AIDM wording and avoids long source text.",
    bullets,
    promptBlock: bullets.map((entry) => `- ${entry.topic}: ${entry.brief}`).join("\n"),
    audit: {
      sourceIds: sources.map((source) => source.id),
      copiesLongSourceText: false,
      excludesProtectedSettingLore: true
    }
  };
}

function topic(id, label, brief, zhLabel, zhBrief) {
  return Object.freeze({ id, label, brief, zhLabel, zhBrief });
}

function normalizeTopicIds(topics) {
  const ids = Array.isArray(topics) ? topics : [topics];
  return ids
    .map((id) => String(id || "").trim())
    .filter((id) => BRIEF_TOPICS[id]);
}

function normalizeLocale(language) {
  return String(language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
}
