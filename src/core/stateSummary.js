const CLOCK_MAX = Object.freeze({
  quest: 6,
  clues: 6,
  danger: 6,
  deadline: 6
});

const CLOCK_LABELS = Object.freeze({
  quest: { en: "Quest", zh: "任务" },
  clues: { en: "Clues", zh: "线索" },
  danger: { en: "Threat", zh: "威胁" },
  deadline: { en: "Deadline", zh: "时限" }
});

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

const ENVIRONMENT_LABELS = Object.freeze({
  weather: {
    "clear sunny": { en: "Clear sunny", zh: "晴朗" },
    "light rain": { en: "Light rain", zh: "小雨" },
    "heavy rain": { en: "Heavy rain", zh: "大雨" },
    thunderstorm: { en: "Thunderstorm", zh: "雷暴" },
    "gale wind": { en: "Gale wind", zh: "强风" },
    "light wind": { en: "Light wind", zh: "微风" },
    "mist and spray": { en: "Mist and spray", zh: "水雾" }
  },
  season: {
    spring: { en: "Spring", zh: "春季" },
    summer: { en: "Summer", zh: "夏季" },
    autumn: { en: "Autumn", zh: "秋季" },
    winter: { en: "Winter", zh: "冬季" }
  },
  timeOfDay: {
    dawn: { en: "Dawn", zh: "黎明" },
    day: { en: "Day", zh: "白天" },
    dusk: { en: "Dusk", zh: "黄昏" },
    night: { en: "Night", zh: "夜晚" }
  },
  mood: {
    mystery: { en: "Mystery", zh: "悬疑" },
    danger: { en: "Danger", zh: "危险" },
    tense: { en: "Tense", zh: "紧张" },
    hopeful: { en: "Hopeful", zh: "有希望" }
  }
});

export function buildTableStateSummary(room, { soundscape = null, presentation = null } = {}) {
  const clocks = room?.scene?.clocks || {};
  const quest = (room?.quests || []).find((entry) => entry.status === "active") || room?.quests?.[0] || null;
  const latestChange = summarizeLatestChange(room);
  const beat = room?.director?.beat || "hook";
  const combat = summarizeCombat(room);
  const questClock = buildQuestClock(quest, clocks);
  const sceneChange = summarizeSceneChange(room);
  const npcIntent = summarizeNpcIntent(room, combat);
  const clockTrends = summarizeClockTrends(room);
  const environment = summarizeEnvironment(room, soundscape);
  const turn = summarizeTurnGuidance(room, { combat, questClock, npcIntent, trackers: { danger: clock("danger", clocks.danger ?? room?.scene?.threat), clues: clock("clues", clocks.clues) } });
  const trackers = {
    questClock,
    danger: clock("danger", clocks.danger ?? room?.scene?.threat),
    clues: clock("clues", clocks.clues),
    consequences: summarizeSceneEntries(room?.scene?.activeConsequences, 3),
    sceneChange,
    npcIntent,
    clockTrends,
    environment,
    turn
  };

  return {
    objective: room?.scene?.objective || "",
    beat: {
      id: beat,
      label: BEAT_LABELS[beat] || { en: beat, zh: beat },
      tone: toneForBeat(beat)
    },
    clocks: {
      quest: clock("quest", clocks.quest ?? questClock.value),
      clues: clock("clues", clocks.clues),
      danger: clock("danger", clocks.danger ?? room?.scene?.threat),
      deadline: clock("deadline", clocks.deadline)
    },
    clockLabels: CLOCK_LABELS,
    questClock,
    trackers,
    quest: quest ? {
      id: quest.id,
      title: quest.title,
      label: questTitleLabel(quest),
      progress: Math.max(0, Math.min(100, Number(quest.progress || 0))),
      cluesCount: (quest.clues || []).length
    } : null,
    scene: {
      title: room?.scene?.title || "",
      location: room?.scene?.location || "",
      ambience: room?.scene?.ambience || "",
      summary: room?.scene?.summary || null,
      lastEvolutionReason: room?.scene?.lastEvolutionReason || null,
      lastShiftReason: room?.scene?.lastShiftReason || "opening-scene",
      blockedExit: room?.scene?.blockedExit || null,
      currentLead: summarizeSceneEntry(room?.scene?.currentLead),
      recentClues: summarizeSceneEntries(room?.scene?.recentClues, 3),
      activeConsequences: summarizeSceneEntries(room?.scene?.activeConsequences, 3),
      rewardHint: summarizeSceneEntry(room?.scene?.rewardHints?.[0] || null),
      rewardHints: summarizeSceneEntries(room?.scene?.rewardHints, 3),
      exits: summarizeExits(room),
      environment
    },
    media: {
      sceneAssetId: presentation?.sceneAsset?.id || null,
      sceneAssetName: presentation?.sceneAsset?.displayName || presentation?.sceneAsset?.name || null,
      soundscapeId: soundscape?.id || null,
      soundscapeLabel: soundscape?.label || null,
      soundscapeReason: soundscape?.reason || "",
      transition: presentation?.sceneAsset?.transition || soundscape?.musicCue?.transition || "soft-crossfade"
    },
    combat,
    npcIntent,
    environment,
    turn,
    latestChange,
    progress: summarizeProgress(room, { latestChange, sceneChange, clockTrends }),
    memory: summarizeMemorySurface(room),
    review: summarizeReviewSurface(room, { questClock, trackers, sceneChange, npcIntent, latestChange }),
    control: {
      stateOwner: "rules-engine",
      narrationOwner: "aidm",
      randomness: "bounded-by-scene-state",
      reviewFields: ["questClock", "danger", "clues", "consequences", "sceneChange", "npcIntent", "environment", "turn"],
      controllableClocks: ["quest", "clues", "danger", "deadline"],
      stateChangeFields: ["version", "round", "phase", "latestEventId", "clockTrends", "environment", "activePlayerId"],
      latestMutation: latestChange.type === "chat" ? "none" : latestChange.type,
      status: latestChange.type === "chat" ? "unchanged" : "controlled"
    }
  };
}

function clock(id, value) {
  const max = CLOCK_MAX[id] || 6;
  const number = Math.max(0, Math.min(max, Number(value || 0)));
  return {
    id,
    value: number,
    max,
    ratio: max > 0 ? Number((number / max).toFixed(2)) : 0
  };
}

function summarizeLatestChange(room) {
  const latest = [...(room?.transcript || [])].reverse().find((entry) => {
    return ["reward", "combat", "gm", "roll", "player", "chat"].includes(entry.type);
  });
  if (!latest) {
    return {
      type: "none",
      eventId: null,
      label: { en: "Waiting", zh: "等待行动" },
      detail: { en: "No table action has resolved yet.", zh: "还没有完成一次牌桌行动。" }
    };
  }

  if (latest.type === "reward" && latest.reward) {
    const name = latest.reward.displayName || latest.reward.name || "";
    return {
      type: "reward",
      eventId: latest.id,
      label: { en: "Reward found", zh: "发现收获" },
      detail: localizedDetail({
        en: `${localize(name, "en")} is now available to the party.`,
        zh: `${localize(name, "zh")}已进入队伍收获。`
      })
    };
  }

  if (latest.type === "combat") {
    return {
      type: "combat",
      eventId: latest.id,
      label: { en: "Combat resolved", zh: "战斗结算" },
      detail: localizedDetail({
        en: latest.combat?.localizedMessage?.en || latest.text,
        zh: latest.combat?.localizedMessage?.zh || localizeCombatText(latest.text)
      })
    };
  }

  if (latest.type === "chat") {
    return {
      type: "chat",
      eventId: latest.id,
      label: { en: "Table talk", zh: "牌桌交流" },
      detail: localizedDetail({ en: latest.text, zh: latest.text })
    };
  }

  return {
    type: latest.type,
    eventId: latest.id,
    label: {
      en: latest.type === "gm" ? "AIDM narrated" : "State advanced",
      zh: latest.type === "gm" ? "主持人推进" : "状态推进"
    },
    detail: localizedDetail({ en: latest.text, zh: latest.text })
  };
}

function summarizeCombat(room) {
  const combat = room?.combat || {};
  const enemies = combat.encounter?.enemies || [];
  const living = enemies.filter((enemy) => Number(enemy.hp || 0) > 0);
  const mostDangerous = [...living].sort((left, right) => {
    return (right.hp + right.defense) - (left.hp + left.defense);
  })[0] || null;

  return {
    state: combat.state || "scouting",
    stateLabel: encounterStateLabel(combat.state || "scouting"),
    activeEnemies: living.length,
    mostDangerous: mostDangerous ? {
      name: mostDangerous.name,
      displayName: mostDangerous.displayName || null,
      hp: mostDangerous.hp,
      maxHp: mostDangerous.maxHp,
      defense: mostDangerous.defense,
      role: mostDangerous.role
    } : null,
    tacticalIntent: combat.tacticalIntent ? {
      type: combat.tacticalIntent.type,
      reason: combat.tacticalIntent.reason
    } : null
  };
}

function buildQuestClock(quest, clocks) {
  const progress = Math.max(0, Math.min(100, Number(quest?.progress || 0)));
  const clueValue = Number(clocks?.quest ?? clocks?.clues);
  const derivedValue = Number.isFinite(clueValue)
    ? clueValue
    : Math.round((progress / 100) * CLOCK_MAX.quest);
  const base = clock("quest", derivedValue);
  return {
    ...base,
    label: CLOCK_LABELS.quest,
    questId: quest?.id || null,
    status: quest?.status || "none",
    progress,
    cluesCount: (quest?.clues || []).length
  };
}

function summarizeSceneChange(room) {
  const lastShiftReason = room?.scene?.lastShiftReason || "opening-scene";
  const lastEvolutionReason = room?.scene?.lastEvolutionReason || null;
  const changed = Boolean(lastEvolutionReason || (lastShiftReason && lastShiftReason !== "opening-scene"));
  return {
    changed,
    location: room?.scene?.location || "",
    lastShiftReason,
    lastEvolutionReason,
    blockedExit: room?.scene?.blockedExit || null
  };
}

function summarizeNpcIntent(room, combatSummary) {
  const intent = room?.director?.npcIntent || room?.scene?.npcIntent || room?.combat?.tacticalIntent || combatSummary?.tacticalIntent || null;
  if (!intent) {
    return {
      type: "none",
      label: { en: "No active NPC intent", zh: "暂无 NPC 意图" },
      reason: ""
    };
  }
  const type = readableIntentType(intent.type || intent.intent || intent.action || intent.reason || "unknown");
  return {
    type,
    label: intent.label || intentLabel(type),
    reason: intent.reason || "",
    targetId: intent.targetId || null,
    sourceId: intent.sourceId || null
  };
}

function encounterStateLabel(state) {
  const labels = {
    scouting: { en: "Scouting", zh: "侦察中" },
    foreshadowed: { en: "Foreshadowed", zh: "有征兆" },
    imminent: { en: "Imminent", zh: "迫近" },
    active: { en: "Active", zh: "已触发" },
    combat: { en: "Combat", zh: "战斗中" },
    engaged: { en: "Engaged", zh: "交战中" },
    hostile: { en: "Hostile", zh: "敌对" },
    started: { en: "Started", zh: "已开始" },
    "in-combat": { en: "In combat", zh: "战斗中" }
  };
  const id = String(state || "scouting").trim() || "scouting";
  return labels[id.toLowerCase()] || { en: humanizeId(id), zh: "未知状态" };
}

function questTitleLabel(quest) {
  const title = quest?.title;
  if (title && typeof title === "object") {
    return {
      en: localize(title, "en"),
      zh: localize(title, "zh")
    };
  }
  const text = String(title || "");
  const known = {
    "Recover the sealed ledger": { en: "Recover the sealed ledger", zh: "取回封印账本" },
    "Recover the ledger": { en: "Recover the ledger", zh: "取回账本" },
    "Find the ledger": { en: "Find the ledger", zh: "找到账本" }
  };
  return known[text] || { en: text, zh: text };
}

function summarizeExits(room) {
  return (room?.scene?.exits || [])
    .slice(0, 3)
    .map((exit) => ({
      id: exit.id,
      label: exit.label || { en: exit.id, zh: exit.id },
      target: exit.target,
      available: Boolean(exit.available),
      requirement: exit.requirement || ""
    }));
}

function summarizeSceneEntries(entries, limit) {
  return (entries || [])
    .slice(0, limit)
    .map(summarizeSceneEntry)
    .filter(Boolean);
}

function summarizeSceneEntry(entry) {
  if (!entry) return null;
  return {
    id: entry.id || null,
    kind: entry.kind || null,
    severity: entry.severity || null,
    clock: entry.clock || null,
    sourceId: entry.sourceId || null,
    label: entry.label || null,
    detail: entry.detail || null,
    prompt: entry.prompt || null,
    actionSuggestion: entry.actionSuggestion || null,
    reason: entry.reason || null,
    atVersion: entry.atVersion || null
  };
}

function summarizeEnvironment(room, soundscape) {
  const atmosphere = room?.scene?.atmosphere || {};
  const weather = atmosphere.weather || room?.scene?.weatherState || room?.scene?.weather || "";
  const season = atmosphere.season || room?.scene?.season || "";
  const timeOfDay = atmosphere.timeOfDay || room?.scene?.timeOfDay || "";
  const mood = atmosphere.mood || room?.scene?.mood || "";
  const tags = [...new Set([...(atmosphere.tags || []), ...(atmosphere.soundscapeTags || [])].filter(Boolean))].slice(0, 12);
  const soundscapeWeatherMix = soundscape?.profile?.weatherMix ? { ...soundscape.profile.weatherMix } : null;

  return {
    weather,
    season,
    timeOfDay,
    mood,
    labels: {
      weather: environmentLabel("weather", weather),
      season: environmentLabel("season", season),
      timeOfDay: environmentLabel("timeOfDay", timeOfDay),
      mood: environmentLabel("mood", mood)
    },
    tags,
    soundscapeTags: (atmosphere.soundscapeTags || tags).slice(0, 12),
    soundscapeWeatherMix,
    change: {
      reason: atmosphere.reason || room?.scene?.lastEvolutionReason || room?.scene?.lastShiftReason || "opening-scene",
      changed: Boolean(atmosphere.changed),
      previous: atmosphere.previous || null,
      atVersion: atmosphere.atVersion ?? null
    },
    prompt: environmentPrompt({ weather, season, timeOfDay, mood })
  };
}

function summarizeTurnGuidance(room, { combat, questClock, npcIntent, trackers }) {
  const active = (room?.players || []).find((player) => player.id === room?.activePlayerId) || null;
  const character = active?.character || {};
  const role = character.classId || character.archetype || "adventurer";
  const suggestions = buildActionSuggestions({ combat, questClock, npcIntent, trackers, role });
  const characterName = character.name || active?.name || "";
  const priority = suggestions[0]?.id || "act";

  return {
    activePlayerId: room?.activePlayerId || null,
    activePlayer: active ? {
      id: active.id,
      name: active.name,
      characterName,
      role,
      hp: Number.isFinite(Number(character.hp)) ? Number(character.hp) : null,
      maxHp: Number.isFinite(Number(character.maxHp)) ? Number(character.maxHp) : null
    } : null,
    priority,
    prompt: turnPrompt(characterName, suggestions[0], combat),
    suggestions,
    shouldCallout: Boolean(active && room?.phase === "scene"),
    reason: turnReason({ combat, questClock, npcIntent, trackers })
  };
}

function buildActionSuggestions({ combat, questClock, npcIntent, trackers, role }) {
  const suggestions = [];
  if ((combat?.activeEnemies || 0) > 0 || combat?.state === "imminent") {
    suggestions.push(actionSuggestion("stabilize-danger", "Protect the line", "稳住阵线", "defense"));
  }
  if ((trackers?.clues?.value || 0) < (trackers?.clues?.max || 6)) {
    suggestions.push(actionSuggestion("find-clue", "Inspect, question, or trace one concrete lead", "检查、询问或追踪一条具体线索", "investigation"));
  }
  if ((trackers?.danger?.value || 0) >= 4) {
    suggestions.push(actionSuggestion("reduce-danger", "Create cover, bargain, or disable the immediate threat", "制造掩护、谈判或解除眼前威胁", "pressure"));
  }
  if (npcIntent?.type && npcIntent.type !== "none") {
    suggestions.push(actionSuggestion("resolve-npc-intent", `Answer the NPC ${npcIntent.type} move`, `回应 NPC 的${npcIntent.type}意图`, "social"));
  }
  if ((questClock?.value || 0) < (questClock?.max || 6)) {
    suggestions.push(actionSuggestion("advance-quest", "Tie the action back to the main objective", "把行动明确接回主目标", "quest"));
  }
  suggestions.push(actionSuggestion("role-color", roleSpecificHint(role, "en"), roleSpecificHint(role, "zh"), "roleplay"));
  return uniqueById(suggestions).slice(0, 4);
}

function actionSuggestion(id, en, zh, mode) {
  return { id, label: { en, zh }, mode };
}

function roleSpecificHint(role, language) {
  const value = String(role || "").toLowerCase();
  if (/rogue|ranger|游侠|盗/.test(value)) return language === "zh" ? "利用机动、潜行或观察制造优势" : "Use movement, stealth, or observation to create advantage";
  if (/mage|wizard|法师|巫/.test(value)) return language === "zh" ? "用法术、知识或仪式改变局面" : "Use magic, lore, or ritual pressure to change the scene";
  if (/cleric|牧师|祭司/.test(value)) return language === "zh" ? "保护队友、稳定伤势或借信念推进" : "Protect allies, steady harm, or press through conviction";
  if (/bard|吟游/.test(value)) return language === "zh" ? "用交涉、表演或谣言牵动人群" : "Use talk, performance, or rumor to move the crowd";
  return language === "zh" ? "声明一个清楚目标、方法和风险" : "State a clear goal, method, and risk";
}

function turnPrompt(characterName, suggestion, combat) {
  const name = characterName || "Active character";
  const lead = suggestion?.label || { en: "Choose a concrete action", zh: "选择一个具体行动" };
  const combatTail = (combat?.activeEnemies || 0) > 0
    ? { en: " Enemies are active, so make the intent visible.", zh: " 敌人已经行动，请把意图说清楚。" }
    : { en: " Include what you do and what outcome you want.", zh: " 说明你做什么以及想达成什么结果。" };
  return {
    en: `${name}'s turn: ${lead.en}.${combatTail.en}`,
    zh: `轮到${name}：${lead.zh}。${combatTail.zh}`
  };
}

function turnReason({ combat, questClock, npcIntent, trackers }) {
  if ((combat?.activeEnemies || 0) > 0) return "active-combat";
  if ((trackers?.danger?.value || 0) >= 4) return "danger-high";
  if (npcIntent?.type && npcIntent.type !== "none") return "npc-intent";
  if ((questClock?.value || 0) < (questClock?.max || 6)) return "quest-open";
  return "free-action";
}

function summarizeClockTrends(room) {
  const director = room?.director || {};
  return {
    quest: trendEntry(director.questClock),
    clues: trendEntry(director.clues),
    danger: trendEntry(director.danger),
    deadline: trendEntry(director.deadline)
  };
}

function trendEntry(value) {
  if (!value || typeof value !== "object") {
    return { trend: "steady", value: null, previous: null, delta: 0 };
  }
  const current = Number.isFinite(Number(value.value)) ? Number(value.value) : null;
  const previous = Number.isFinite(Number(value.previous)) ? Number(value.previous) : null;
  const delta = Number.isFinite(Number(value.delta))
    ? Number(value.delta)
    : (current !== null && previous !== null ? current - previous : 0);
  return {
    trend: value.trend || (delta > 0 ? "up" : delta < 0 ? "down" : "steady"),
    value: current,
    previous,
    delta
  };
}

function summarizeProgress(room, { latestChange, sceneChange, clockTrends }) {
  return {
    version: Number.isFinite(Number(room?.version)) ? Number(room.version) : null,
    round: Number.isFinite(Number(room?.round)) ? Number(room.round) : null,
    phase: room?.phase || "unknown",
    latestEventId: latestChange.eventId,
    latestEventType: latestChange.type,
    sceneChange: sceneChange.changed ? (sceneChange.lastEvolutionReason || sceneChange.lastShiftReason || "changed") : "none",
    clockTrends
  };
}

function summarizeMemorySurface(room) {
  const memories = Array.isArray(room?.memories) ? room.memories : [];
  const memos = Array.isArray(room?.memos) ? room.memos : [];
  const recent = memories
    .slice(-3)
    .reverse()
    .map((entry) => ({
      id: entry.id || null,
      kind: entry.kind || "event",
      sourceEventId: entry.sourceEventId || null,
      tags: (entry.tags || []).slice(0, 5),
      snippet: trimDetail(entry.text)
    }));
  return {
    count: memories.length,
    recent,
    pinnedMemoCount: memos.filter((entry) => entry.pinned).length,
    privateMemoCount: memos.filter((entry) => entry.visibility === "owner").length
  };
}

function summarizeReviewSurface(room, { questClock, trackers, sceneChange, npcIntent, latestChange }) {
  const flags = [];
  if (trackers.danger.value >= 5) flags.push("danger-critical");
  if (trackers.clues.value >= 5) flags.push("revelation-ready");
  if (sceneChange.blockedExit) flags.push("blocked-exit");
  if (latestChange.type === "chat") flags.push("chat-only");

  const nextLevers = [];
  if (questClock.value < questClock.max) nextLevers.push("advance-quest-clock");
  if (trackers.clues.value < trackers.clues.max) nextLevers.push("surface-specific-clue");
  if (trackers.danger.value >= 4) nextLevers.push("make-danger-visible");
  if (npcIntent.type && npcIntent.type !== "none") nextLevers.push(`resolve-npc-${npcIntent.type}`);

  return {
    headline: buildReviewHeadline(room, { questClock, trackers, npcIntent }),
    flags: flags.slice(0, 4),
    nextLevers: nextLevers.slice(0, 4)
  };
}

function buildReviewHeadline(room, { questClock, trackers, npcIntent }) {
  const objective = trimDetail(room?.scene?.objective || "No objective");
  const intent = npcIntent.type && npcIntent.type !== "none" ? `; NPC ${npcIntent.type}` : "";
  return {
    en: `${objective} Quest ${questClock.value}/${questClock.max}; threat ${trackers.danger.value}/${trackers.danger.max}${intent}.`,
    zh: `${objective} 任务 ${questClock.value}/${questClock.max}；威胁 ${trackers.danger.value}/${trackers.danger.max}${intent ? `；NPC ${npcIntent.type}` : ""}。`
  };
}

function readableIntentType(value) {
  return String(value || "unknown").trim() || "unknown";
}

function intentLabel(type) {
  const labels = {
    pressure: { en: "Apply pressure", zh: "施加压力" },
    reveal: { en: "Reveal a lead", zh: "揭示线索" },
    bargain: { en: "Offer a bargain", zh: "提出交易" },
    counterattack: { en: "Counterattack", zh: "反击" },
    retreat: { en: "Retreat", zh: "撤退" },
    guard: { en: "Guard objective", zh: "守住目标" },
    none: { en: "No active NPC intent", zh: "暂无 NPC 意图" },
    unknown: { en: "Unknown NPC intent", zh: "未知 NPC 意图" }
  };
  return labels[String(type).toLowerCase()] || { en: humanizeId(type), zh: "未知 NPC 意图" };
}

function toneForBeat(beat) {
  if (beat === "crisis" || beat === "retaliation") return "danger";
  if (beat === "revelation" || beat === "trail") return "momentum";
  if (beat === "complication") return "pressure";
  return "stable";
}

function localizedDetail(value) {
  return {
    en: trimDetail(value.en),
    zh: trimDetail(value.zh)
  };
}

function trimDetail(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 132 ? `${text.slice(0, 129)}...` : text;
}

function environmentLabel(kind, value) {
  const id = String(value || "").trim().toLowerCase();
  if (!id) return { en: "", zh: "" };
  return ENVIRONMENT_LABELS[kind]?.[id] || { en: humanizeId(id), zh: humanizeId(id) };
}

function environmentPrompt({ weather, season, timeOfDay, mood }) {
  const weatherLabel = environmentLabel("weather", weather);
  const seasonLabel = environmentLabel("season", season);
  const timeLabel = environmentLabel("timeOfDay", timeOfDay);
  const moodLabel = environmentLabel("mood", mood);
  return {
    en: [seasonLabel.en, timeLabel.en, weatherLabel.en, moodLabel.en].filter(Boolean).join(" · "),
    zh: [seasonLabel.zh, timeLabel.zh, weatherLabel.zh, moodLabel.zh].filter(Boolean).join(" · ")
  };
}

function uniqueById(values) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!value?.id || seen.has(value.id)) continue;
    seen.add(value.id);
    result.push(value);
  }
  return result;
}

function localize(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.zh || value.default || "";
}

function humanizeId(value) {
  return String(value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function localizeCombatText(text) {
  const attackMatch = /^(.+?) (hit|missed) (.+?) for (\d+) damage$/.exec(String(text || ""));
  if (attackMatch) {
    return `${attackMatch[1]}${attackMatch[2] === "hit" ? "命中" : "未命中"}${attackMatch[3]}，造成 ${attackMatch[4]} 点伤害。`;
  }
  const castMatch = /^(.+?) cast (.+?) on (.+?)$/.exec(String(text || ""));
  if (castMatch) {
    return `${castMatch[1]}对${castMatch[3]}施放了 ${castMatch[2]}。`;
  }
  return text;
}
