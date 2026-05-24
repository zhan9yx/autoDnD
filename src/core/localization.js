export const SUPPORTED_LANGUAGES = Object.freeze(["en", "zh"]);
export const DEFAULT_LANGUAGE = "en";

const messages = {
  en: {
    roomCreated: ({ title, location }) => `Room created: ${title}. The opening scene waits at ${location}.`,
    playerJoined: ({ playerName, characterName, archetype }) => `${playerName} joined as ${characterName}, ${archetype}.`,
    sessionBegins: ({ objective, ambience }) => `The session begins. ${objective}. ${ambience} frames the first move.`,
    actionRequired: "Action text is required",
    chatRequired: "Chat text is required",
    unknownPlayer: "Unknown player",
    cannotStart: "Cannot start a room without players",
    roomRequired: "Room is required",
    roomEnded: "Room has ended",
    activeTurn: ({ name }) => `It is ${name}'s turn`,
    playerTokenRequired: "Player token is required",
    hostTokenRequired: "Host token is required",
    expectedVersionInteger: "Expected version must be an integer",
    roomVersionConflict: ({ expected, actual }) => `Room version conflict: expected ${expected}, got ${actual}`,
    roomNotFound: "Room not found",
    rollResult: ({ characterName, expression, rolls, modifier, total, dc }) =>
      `${characterName} rolled ${expression}: ${rolls.join(", ")} ${formatModifier(modifier)} = ${total} vs DC ${dc}`,
    rewardObtained: ({ characterName, rewardName, sourceName }) => `${characterName} obtained ${rewardName} from ${sourceName}.`,
    "inventory.usedItem": ({ characterName, itemName }) => `${characterName} used ${itemName}.`,
    "inventory.learnedSpell": ({ characterName, spellId }) => `${characterName} studied the scroll and learned ${spellId}.`,
    "inventory.soldItem": ({ characterName, itemName, amount }) => `${characterName} sold ${itemName} for ${amount} crowns.`,
    "inventory.boughtItem": ({ characterName, itemName, amount }) => `${characterName} bought ${itemName} for ${amount} crowns.`,
    "inventory.memoSaved": ({ characterName }) => `${characterName}'s memo was saved.`,
    rewardSource: "the scene",
    localSuccess: ({ margin }) => `The attempt lands cleanly by ${margin} over the difficulty.`,
    localFailure: ({ margin }) => `The attempt falls short by ${Math.abs(margin)}, but it still changes the scene.`,
    localMemory: ({ text }) => `A prior fact returns: ${text}`,
    localNoMemory: "No old certainty answers them yet.",
    localKnowledgeHook: ({ weather, season, suggestion }) =>
      `AIDM frames the move through ${weather} and ${season}; suggested focus: ${suggestion}`,
    knowledgeAttribution: ({ sourceCount }) => `${sourceCount} SRD-style source references are available under CC-BY-4.0 attribution boundaries.`,
    "knowledge.actionPrompt": ({ suggestion }) => `Suggested next action focus: ${suggestion}`,
    "knowledge.weatherHook": ({ weather, season }) => `Scene hook: ${weather} during ${season}.`,
    "knowledge.sourceBoundary": "Use official SRD links for attribution; keep runtime prose original and do not embed long rules text.",
    localMove: ({ characterName, location, actionText }) => `${characterName} moves through ${location}, choosing to ${formatActionSentence(actionText, ".")}`,
    localRoll: ({ total, dc }) => `The roll is ${total} against DC ${dc}.`,
    localSuccessLead: ({ objective }) => `The ${objective.toLowerCase()} feels closer, and the table gains a concrete lead.`,
    localFailurePressure: ({ ambience }) => `The pressure rises; ${ambience} closes in while a new complication appears.`,
    promptLanguage: "English",
    untitledRoom: "Untitled Expedition",
    defaultSceneTitle: "The First Door",
    defaultLocation: "A rain-polished street outside a sealed archive",
    defaultObjective: "Discover who stole the sealed ledger before dawn",
    heroicAmbience: "torchlight and brass horns",
    mysteryAmbience: "rain, old stone, and candle smoke",
    defaultQuest: "Recover the sealed ledger",
    defaultHost: "Host",
    defaultPlayer: "Player",
    defaultCharacter: "Adventurer",
    defaultArchetype: "Investigator",
    "archetype.investigator": "Investigator",
    "archetype.vanguard": "Vanguard",
    "archetype.occultist": "Occultist",
    "archetype.envoy": "Envoy",
    replayShareText: ({ title, players, round, lead }) => `${title}: ${players} players reached round ${round}. ${lead}`,
    "outcome.success": "success",
    "outcome.failure": "failure",
    memoryActionResult: ({ characterName, actionText, outcome, total, dc, narrationText }) =>
      `${characterName} tried to ${actionText}. Result: ${outcome} (${total}/${dc}). ${narrationText}`,
    anotherPlayer: "another player"
  },
  zh: {
    roomCreated: ({ title, location }) => `房间已创建：${title}。开场场景在${location}等待开始。`,
    playerJoined: ({ playerName, characterName, archetype }) => `${playerName}加入了牌桌，角色是${characterName}，定位为${archetype}。`,
    sessionBegins: ({ objective, ambience }) => `跑团开始。${objective}。${ambience}笼罩着第一步行动。`,
    actionRequired: "行动文本不能为空",
    chatRequired: "聊天文本不能为空",
    unknownPlayer: "未知玩家",
    cannotStart: "至少需要一名玩家才能开始房间",
    roomRequired: "房间不能为空",
    roomEnded: "房间已结束",
    activeTurn: ({ name }) => `现在是${name}的回合`,
    playerTokenRequired: "需要玩家令牌",
    hostTokenRequired: "需要主持人令牌",
    expectedVersionInteger: "期望版本必须是整数",
    roomVersionConflict: ({ expected, actual }) => `房间版本冲突：期望 ${expected}，实际 ${actual}`,
    roomNotFound: "找不到房间",
    rollResult: ({ characterName, expression, rolls, modifier, total, dc }) =>
      `${characterName}掷出 ${expression}：${rolls.join("、")} ${formatModifier(modifier)} = ${total}，目标难度 ${dc}`,
    rewardObtained: ({ characterName, rewardName, sourceName }) => `${characterName}从${sourceName}获得了${rewardName}。`,
    "inventory.usedItem": ({ characterName, itemName }) => `${characterName}使用了${itemName}。`,
    "inventory.learnedSpell": ({ characterName, spellId }) => `${characterName}研读法卷，学会了${spellId}。`,
    "inventory.soldItem": ({ characterName, itemName, amount }) => `${characterName}出售了${itemName}，获得 ${amount} 克朗。`,
    "inventory.boughtItem": ({ characterName, itemName, amount }) => `${characterName}购买了${itemName}，花费 ${amount} 克朗。`,
    "inventory.memoSaved": ({ characterName }) => `${characterName}的备忘录已保存。`,
    rewardSource: "当前场景",
    localSuccess: ({ margin }) => `这次尝试超过难度 ${margin} 点，结果干净利落。`,
    localFailure: ({ margin }) => `这次尝试差了 ${Math.abs(margin)} 点，但局势仍然被推动。`,
    localMemory: ({ text }) => `旧线索浮现：${text}`,
    localNoMemory: "暂时没有旧事实能给出确定答案。",
    localKnowledgeHook: ({ weather, season, suggestion }) =>
      `AIDM 将这次行动放进${season}与${weather}中；建议聚焦：${suggestion}`,
    knowledgeAttribution: ({ sourceCount }) => `${sourceCount} 个 SRD 风格资料源可在 CC-BY-4.0 归因边界下引用。`,
    "knowledge.actionPrompt": ({ suggestion }) => `建议下一步行动聚焦：${suggestion}`,
    "knowledge.weatherHook": ({ weather, season }) => `场景钩子：${season}中的${weather}。`,
    "knowledge.sourceBoundary": "使用官方 SRD 链接做归因；运行时叙事保持原创，不嵌入长篇规则正文。",
    localMove: ({ characterName, location, actionText }) => `${characterName}穿过${location}，选择${formatActionSentence(actionText, "。")}`,
    localRoll: ({ total, dc }) => `检定结果为 ${total}，目标难度为 ${dc}。`,
    localSuccessLead: ({ objective }) => `${objective}已经更接近真相，牌桌获得了一条明确线索。`,
    localFailurePressure: ({ ambience }) => `压力上升；${ambience}逼近，新的麻烦浮出水面。`,
    promptLanguage: "Simplified Chinese",
    untitledRoom: "未命名远征",
    defaultSceneTitle: "第一扇门",
    defaultLocation: "封存档案馆外被雨水洗亮的街道",
    defaultObjective: "在黎明前查明是谁偷走了封印账本",
    heroicAmbience: "火把光与铜号声",
    mysteryAmbience: "雨水、旧石墙与烛烟",
    defaultQuest: "取回封印账本",
    defaultHost: "主持人",
    defaultPlayer: "玩家",
    defaultCharacter: "冒险者",
    defaultArchetype: "调查员",
    "archetype.investigator": "调查员",
    "archetype.vanguard": "先锋",
    "archetype.occultist": "神秘学者",
    "archetype.envoy": "使节",
    replayShareText: ({ title, players, round, lead }) => `${title}：${players} 名玩家推进到第 ${round} 轮。${lead}`,
    "outcome.success": "成功",
    "outcome.failure": "失败",
    memoryActionResult: ({ characterName, actionText, outcome, total, dc, narrationText }) =>
      `${characterName}尝试${formatActionSentence(actionText, "。")} 结果：${outcome}（${total}/${dc}）。${narrationText}`,
    anotherPlayer: "另一名玩家"
  }
};

const archetypeAliases = {
  investigator: "investigator",
  "调查员": "investigator",
  vanguard: "vanguard",
  "先锋": "vanguard",
  occultist: "occultist",
  "神秘学者": "occultist",
  envoy: "envoy",
  "使节": "envoy"
};

export function normalizeLanguage(value) {
  const language = String(value || "").toLowerCase();
  if (language === "zh-cn" || language === "zh_hans" || language === "zh-hans" || language === "cn") {
    return "zh";
  }
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

export function t(language, key, params = {}) {
  const locale = normalizeLanguage(language);
  const entry = messages[locale]?.[key] ?? messages[DEFAULT_LANGUAGE][key];
  if (typeof entry === "function") {
    return entry(params);
  }
  return entry;
}

export function localizeArchetype(language, value) {
  const raw = String(value ?? "").trim();
  if (!raw) return t(language, "defaultArchetype");
  const key = archetypeAliases[raw.toLowerCase()] || archetypeAliases[raw];
  if (!key) return raw;
  return t(language, `archetype.${key}`) || raw;
}

export function isChinese(language) {
  return normalizeLanguage(language) === "zh";
}

export function formatModifier(modifier) {
  return modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}

function formatActionSentence(actionText, sentenceMark) {
  const text = String(actionText ?? "").trim();
  if (!text) return sentenceMark;
  return /[.!?。！？…]$/.test(text) ? text : `${text}${sentenceMark}`;
}
