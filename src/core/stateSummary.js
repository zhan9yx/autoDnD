const CLOCK_MAX = Object.freeze({
  clues: 6,
  danger: 6,
  deadline: 6
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

  return {
    objective: room?.scene?.objective || "",
    beat: {
      id: beat,
      label: BEAT_LABELS[beat] || { en: beat, zh: beat },
      tone: toneForBeat(beat)
    },
    clocks: {
      clues: clock("clues", clocks.clues),
      danger: clock("danger", clocks.danger ?? room?.scene?.threat),
      deadline: clock("deadline", clocks.deadline)
    },
    quest: quest ? {
      id: quest.id,
      title: quest.title,
      progress: Math.max(0, Math.min(100, Number(quest.progress || 0))),
      cluesCount: (quest.clues || []).length
    } : null,
    scene: {
      title: room?.scene?.title || "",
      location: room?.scene?.location || "",
      ambience: room?.scene?.ambience || "",
      lastShiftReason: room?.scene?.lastShiftReason || "opening-scene",
      blockedExit: room?.scene?.blockedExit || null,
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
    latestChange,
    control: {
      stateOwner: "rules-engine",
      narrationOwner: "aidm",
      randomness: "bounded-by-scene-state",
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
      zh: latest.type === "gm" ? "AIDM 推进" : "状态推进"
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
