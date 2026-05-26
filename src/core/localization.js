export const SUPPORTED_LANGUAGES = Object.freeze(["en", "zh"]);
export const DEFAULT_LANGUAGE = "en";

const spellLabels = {
  firebolt: { en: "Firebolt", zh: "火矢" },
  "radiant-bolt": { en: "Radiant Bolt", zh: "辉光箭" },
  "healing-word": { en: "Healing Word", zh: "回春短句" },
  ward: { en: "Ward", zh: "守护印" },
  sleep: { en: "Sleep", zh: "沉眠咒" },
  "arcane-shield": { en: "Arcane Shield", zh: "奥术护盾" },
  "binding-vines": { en: "Binding Vines", zh: "缚藤术" },
  "cleanse-poison": { en: "Cleanse Poison", zh: "净毒术" },
  "frost-bind": { en: "Frost Bind", zh: "霜缚" },
  "glass-echo": { en: "Glass Echo", zh: "琉璃回声" },
  "storm-arc": { en: "Storm Arc", zh: "风暴弧光" },
  "thunder-step": { en: "Thunder Step", zh: "雷步" },
  "grave-whisper": { en: "Grave Whisper", zh: "墓语" },
  "iron-oath": { en: "Iron Oath", zh: "铁誓" },
  "lantern-sigil": { en: "Lantern Sigil", zh: "提灯符印" },
  "blood-moon-hex": { en: "Blood Moon Hex", zh: "血月咒" },
  tidecall: { en: "Tidecall", zh: "潮唤" },
  "clockwork-snare": { en: "Clockwork Snare", zh: "机簧陷索" },
  "starfall-rune": { en: "Starfall Rune", zh: "星坠符文" },
  "ember-lance": { en: "Ember Lance", zh: "余烬长矛" },
  "moonlit-shear": { en: "Moonlit Shear", zh: "月辉斩线" },
  "hush-ring": { en: "Hush Ring", zh: "静默环" },
  "mirror-lure": { en: "Mirror Lure", zh: "镜诱" },
  "bastion-mark": { en: "Bastion Mark", zh: "壁垒印记" },
  "veil-of-rain": { en: "Veil of Rain", zh: "雨幕帷" },
  "field-suture": { en: "Field Suture", zh: "战地缝光" },
  "steady-breath": { en: "Steady Breath", zh: "定息祷言" },
  "mist-bridge": { en: "Mist Bridge", zh: "雾桥" },
  "gale-hook": { en: "Gale Hook", zh: "疾风钩" },
  "echo-ledger": { en: "Echo Ledger", zh: "回声账页" },
  "threshold-circle": { en: "Threshold Circle", zh: "门槛法阵" },
  "omen-map": { en: "Omen Map", zh: "兆象地图" }
};

const classLabels = {
  warrior: { en: "Warrior", zh: "战士" },
  rogue: { en: "Rogue", zh: "盗贼" },
  mage: { en: "Mage", zh: "法师" },
  cleric: { en: "Cleric", zh: "牧师" },
  ranger: { en: "Ranger", zh: "游侠" },
  bard: { en: "Bard", zh: "吟游诗人" },
  occultist: { en: "Occultist", zh: "神秘学者" },
  envoy: { en: "Envoy", zh: "使节" }
};

const combatSkillLabels = {
  "action-surge": { en: "Action Surge", zh: "动作爆发" },
  "extra-attack": { en: "Extra Attack", zh: "额外攻击" },
  "offhand-attack": { en: "Offhand Attack", zh: "副手攻击" },
  "cross-cut": { en: "Cross-Cut", zh: "交叉斩" },
  "mobile-parry": { en: "Mobile Parry", zh: "游斗格挡" },
  "split-pressure": { en: "Split Pressure", zh: "分压连击" },
  "reckless-strike": { en: "Reckless Strike", zh: "冒险重击" },
  "break-line": { en: "Break Line", zh: "破阵突进" },
  "intimidating-roar": { en: "Intimidating Roar", zh: "震慑怒吼" },
  "relentless-advance": { en: "Relentless Advance", zh: "不屈推进" },
  "called-shot": { en: "Called Shot", zh: "指名打击" },
  "weapon-drill": { en: "Weapon Drill", zh: "兵器演练" },
  "disarming-angle": { en: "Disarming Angle", zh: "卸械角度" },
  "exploit-opening": { en: "Exploit Opening", zh: "利用破绽" },
  interpose: { en: "Interpose", zh: "插身护卫" },
  "shield-wall": { en: "Shield Wall", zh: "盾墙" },
  "guarded-counter": { en: "Guarded Counter", zh: "守势反击" },
  "hold-the-door": { en: "Hold the Door", zh: "死守门线" },
  rally: { en: "Rally", zh: "鼓舞集结" },
  "mark-target": { en: "Mark Target", zh: "标记目标" },
  "commander-read": { en: "Commander's Read", zh: "指挥官读势" },
  "coordinated-surge": { en: "Coordinated Surge", zh: "协同爆发" },
  "quick-move": { en: "Quick Move", zh: "迅捷移动" },
  sidestep: { en: "Sidestep", zh: "侧身闪避" },
  "recover-mana": { en: "Recover Mana", zh: "回收法力" },
  "channel-mercy": { en: "Channel Mercy", zh: "引导怜悯" },
  "mark-trail": { en: "Mark Trail", zh: "标记路径" },
  inspire: { en: "Inspire", zh: "激励" },
  "read-omen": { en: "Read Omen", zh: "读兆" }
};

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
    "rules.actionInfluence": ({ modifier, sources, intent }) => `Rule modifiers: ${sources || "loadout"} supports this ${intent || "action"} action (+${modifier}).`,
    rewardObtained: ({ characterName, rewardName, sourceName }) => `${characterName} obtained ${rewardName} from ${sourceName}. Added to backpack; check My character to view it.`,
    "spell.used": ({ characterName, spellName, manaCost, manaBefore, manaAfter, outcome, status }) =>
      `${characterName} cast ${spellName}. Mana ${manaBefore} -> ${manaAfter} (cost ${manaCost}). ${status ? `Status: ${status}. ` : ""}${outcome}`,
    "spell.noMana": ({ characterName, spellName, manaCost, manaBefore }) =>
      `${characterName} tried to cast ${spellName}, but needs ${manaCost} mana and has ${manaBefore}. The action still resolves through the roll.`,
    "inventory.usedItem": ({ characterName, itemName }) => `${characterName} used ${itemName}.`,
    "inventory.progressionSummary": ({ xp, level, unlocks }) =>
      `Gained ${xp} XP; level is now ${level}. Unlocked: ${unlocks}. Check My character for updated level, actions, resources, and stats.`,
    "inventory.learnedSpell": ({ characterName, spellId, spellName }) => `${characterName} studied the scroll and learned ${spellName || localizeSpellName("en", spellId)}.`,
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
    narrationSceneBeat: ({ beat }) => `Scene beat: ${beat}.`,
    narrationSensoryDetail: ({ weather, season, ambience }) =>
      `Sensory detail: ${season} air and ${weather} make ${ambience} feel immediate.`,
    narrationConsequence: ({ consequence }) => `Consequence: ${consequence}`,
    narrationActionOptions: ({ options }) => `You can consider: ${options}`,
    knowledgeAttribution: ({ sourceCount }) => `${sourceCount} SRD-style source references are available under CC-BY-4.0 attribution boundaries.`,
    "knowledge.actionPrompt": ({ suggestion }) => `Suggested next action focus: ${suggestion}`,
    "knowledge.weatherHook": ({ weather, season }) => `Scene hook: ${weather} during ${season}.`,
    "knowledge.sourceBoundary": "Use official SRD links for attribution; keep runtime prose original and do not embed long rules text.",
    localMove: ({ characterName, location, actionText }) => `${characterName} moves through ${location}, choosing to ${formatActionSentence(actionText, ".")}`,
    localRoll: ({ total, dc }) => `The roll is ${total} against DC ${dc}.`,
    localSuccessLead: ({ objective }) => `The ${objective.toLowerCase()} feels closer, and the table gains a concrete lead.`,
    localFailurePressure: ({ ambience }) => `The pressure rises; ${ambience} closes in while a new complication appears.`,
    promptLanguage: "English",
    currentScene: "the current scene",
    currentObjective: "the immediate objective",
    currentAction: "this move",
    ambientPressure: "the surrounding pressure",
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
    "rules.actionInfluence": ({ modifier, sources, intent }) => `规则修正：${sources || "装备"}支撑这次${intent || "行动"}行动（+${modifier}）。`,
    rewardObtained: ({ characterName, rewardName, sourceName }) => `${characterName}从${sourceName}获得了${rewardName}。已加入背包，可在我的角色查看。`,
    "spell.used": ({ characterName, spellName, manaCost, manaBefore, manaAfter, outcome, status }) =>
      `${characterName}施放了${spellName}。法力 ${manaBefore} -> ${manaAfter}（消耗 ${manaCost}）。${status ? `状态：${status}。` : ""}${outcome}`,
    "spell.noMana": ({ characterName, spellName, manaCost, manaBefore }) =>
      `${characterName}尝试施放${spellName}，但需要 ${manaCost} 点法力，当前只有 ${manaBefore} 点。本次行动仍按掷骰结算。`,
    "inventory.usedItem": ({ characterName, itemName }) => `${characterName}使用了${itemName}。`,
    "inventory.progressionSummary": ({ xp, level, unlocks }) =>
      `获得 ${xp} XP；当前 ${level} 级。解锁：${unlocks}。可在我的角色查看等级、动作、资源和属性。`,
    "inventory.learnedSpell": ({ characterName, spellId, spellName }) => `${characterName}研读法卷，学会了${spellName || localizeSpellName("zh", spellId)}。`,
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
    narrationSceneBeat: ({ beat }) => `场景节拍：${beat}。`,
    narrationSensoryDetail: ({ weather, season, ambience }) =>
      `感官细节：${season}的气息和${weather}压在场景上，${ambience}变得清晰可感。`,
    narrationConsequence: ({ consequence }) => `后果：${consequence}`,
    narrationActionOptions: ({ options }) => `你可以考虑：${options}`,
    knowledgeAttribution: ({ sourceCount }) => `${sourceCount} 个 SRD 风格资料源可在 CC-BY-4.0 归因边界下引用。`,
    "knowledge.actionPrompt": ({ suggestion }) => `建议下一步行动聚焦：${suggestion}`,
    "knowledge.weatherHook": ({ weather, season }) => `场景钩子：${season}中的${weather}。`,
    "knowledge.sourceBoundary": "使用官方 SRD 链接做归因；运行时叙事保持原创，不嵌入长篇规则正文。",
    localMove: ({ characterName, location, actionText }) => `${characterName}穿过${location}，选择${formatActionSentence(actionText, "。")}`,
    localRoll: ({ total, dc }) => `检定结果为 ${total}，目标难度为 ${dc}。`,
    localSuccessLead: ({ objective }) => `${objective}已经更接近真相，牌桌获得了一条明确线索。`,
    localFailurePressure: ({ ambience }) => `压力上升；${ambience}逼近，新的麻烦浮出水面。`,
    promptLanguage: "Simplified Chinese",
    currentScene: "当前场景",
    currentObjective: "当前目标",
    currentAction: "这次行动",
    ambientPressure: "周围压力",
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

export function localizeSpellName(language, spellId) {
  const locale = normalizeLanguage(language);
  const raw = String(spellId ?? "").trim();
  const label = spellLabels[raw];
  if (!label) return raw || (locale === "zh" ? "法术" : "spell");
  return label[locale] || label.en || raw;
}

export function localizeCombatSkillName(language, skillId) {
  const locale = normalizeLanguage(language);
  const raw = String(skillId ?? "").trim();
  const label = combatSkillLabels[raw];
  if (!label) return humanizeRuleId(raw) || (locale === "zh" ? "战技" : "combat skill");
  return label[locale] || label.en || raw;
}

export function localizeClassName(language, classId) {
  const locale = normalizeLanguage(language);
  const raw = String(classId ?? "").trim();
  const label = classLabels[raw];
  if (!label) return humanizeRuleId(raw) || (locale === "zh" ? "职业" : "class");
  return label[locale] || label.en || raw;
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

function humanizeRuleId(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
