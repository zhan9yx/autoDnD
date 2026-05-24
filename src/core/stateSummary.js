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

export function buildTableStateSummary(room, { soundscape = null, presentation = null } = {}) {
  const clocks = room?.scene?.clocks || {};
  const quest = (room?.quests || []).find((entry) => entry.status === "active") || room?.quests?.[0] || null;
  const latestChange = summarizeLatestChange(room);
  const beat = room?.director?.beat || "hook";
  const combat = summarizeCombat(room);
  const questClock = buildQuestClock(quest, clocks);
  const sceneChange = summarizeSceneChange(room);
  const npcIntent = summarizeNpcIntent(room, combat);
  const trackers = {
    questClock,
    danger: clock("danger", clocks.danger ?? room?.scene?.threat),
    clues: clock("clues", clocks.clues),
    consequences: summarizeSceneEntries(room?.scene?.activeConsequences, 3),
    sceneChange,
    npcIntent
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
      exits: summarizeExits(room)
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
    latestChange,
    control: {
      stateOwner: "rules-engine",
      narrationOwner: "aidm",
      randomness: "bounded-by-scene-state",
      reviewFields: ["questClock", "danger", "clues", "consequences", "sceneChange", "npcIntent"],
      controllableClocks: ["quest", "clues", "danger", "deadline"],
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
