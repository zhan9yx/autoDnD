import { buildRuleKnowledgeContext } from "./rules.js";

const MAX_CLOCK = 6;

export function createDirectorState(tone = "mystery") {
  const knowledge = buildRuleKnowledgeContext({ beat: "hook" });
  return {
    act: 1,
    beat: "hook",
    pacing: tone === "heroic" ? "bold" : "investigative",
    pressure: 1,
    spotlightPlayerId: null,
    lastMove: null,
    questClock: { value: 0, max: MAX_CLOCK, trend: "steady" },
    danger: { value: 1, max: MAX_CLOCK, trend: "steady" },
    clues: { value: 0, max: MAX_CLOCK, trend: "steady" },
    deadline: { value: 0, max: MAX_CLOCK, trend: "steady" },
    stateDeltas: { quest: 0, clues: 0, danger: 0, deadline: 0 },
    consequence: null,
    sceneChange: { type: "opening-scene", reason: "opening-scene" },
    npcIntent: { type: "none", reason: "" },
    memoryQuery: { label: "opening context", terms: [] },
    decisionFrame: {
      reason: "opening-scene",
      allowedSceneShift: false,
      continuityRisk: "low"
    },
    knowledge,
    directives: [
      "Keep the immediate objective visible.",
      "Resolve rules in code before narration.",
      "Escalate failure through clocks, not arbitrary punishment.",
      ...knowledge.promptDirectives.slice(0, 2)
    ]
  };
}

export function applyDirectorBeat(room, { check, actionText, player }) {
  const director = room.director || createDirectorState(room.tone);
  const clocks = room.scene.clocks || { clues: 0, danger: 0, deadline: 0 };
  const previousClues = clocks.clues || 0;
  const previousQuest = clocks.quest ?? previousClues;
  const previousDanger = clocks.danger || 0;
  const previousDeadline = clocks.deadline || 0;
  const successMargin = check.total - check.dc;
  const lowerAction = String(actionText || "").toLowerCase();

  if (check.success) {
    clocks.quest = clampClock(previousQuest + (successMargin >= 5 ? 2 : 1));
    clocks.clues = clampClock(previousClues + (successMargin >= 5 ? 2 : 1));
    clocks.danger = clampClock(previousDanger - (successMargin >= 5 ? 1 : 0));
    director.lastMove = "reveal";
  } else {
    clocks.quest = clampClock(previousQuest);
    clocks.danger = clampClock(previousDanger + (successMargin <= -5 ? 2 : 1));
    clocks.deadline = clampClock(previousDeadline + 1);
    director.lastMove = lowerAction.includes("attack") || lowerAction.includes("攻击") ? "counterattack" : "complication";
  }

  director.pressure = clampClock(Math.round((clocks.danger + room.scene.threat) / 2));
  director.spotlightPlayerId = player?.id || null;
  director.beat = chooseBeat({ room, clocks, check, actionText: lowerAction });
  director.act = clocks.clues >= 5 ? 2 : clocks.danger >= 5 ? Math.max(director.act, 2) : director.act;
  director.questClock = clockTrace(clocks.quest, previousQuest);
  director.danger = clockTrace(clocks.danger, previousDanger);
  director.clues = clockTrace(clocks.clues, previousClues);
  director.deadline = clockTrace(clocks.deadline, previousDeadline);
  director.stateDeltas = {
    quest: director.questClock.delta,
    clues: director.clues.delta,
    danger: director.danger.delta,
    deadline: director.deadline.delta
  };
  director.consequence = summarizeConsequence({ check, clocks, lastMove: director.lastMove });
  director.sceneChange = summarizeSceneChange({ check, actionText: lowerAction, beat: director.beat });
  director.npcIntent = chooseNpcIntent({ beat: director.beat, check, actionText: lowerAction });
  director.knowledge = buildRuleKnowledgeContext({ room, actionText, check, player, beat: director.beat });
  director.memoryQuery = buildMemoryQuery({ room, actionText: lowerAction, beat: director.beat, check, knowledge: director.knowledge });
  director.decisionFrame = buildDecisionFrame({ director, check, actionText: lowerAction });
  director.directives = uniqueDirectives([
    ...buildDirectives({ beat: director.beat, clocks, check }),
    ...director.knowledge.promptDirectives
  ]);

  room.scene.clocks = clocks;
  room.director = director;
  return director;
}

export function chooseBeat({ room, clocks, check, actionText }) {
  if (room.phase === "ended") {
    return "epilogue";
  }
  if ((clocks.danger || 0) >= 5) {
    return "crisis";
  }
  if ((clocks.clues || 0) >= 5) {
    return "revelation";
  }
  if (!check.success && (actionText.includes("attack") || actionText.includes("strike") || actionText.includes("攻击"))) {
    return "retaliation";
  }
  if (!check.success) {
    return "complication";
  }
  if ((clocks.clues || 0) >= 3) {
    return "trail";
  }
  return "discovery";
}

export function buildDirectives({ beat, clocks, check }) {
  const directives = [];
  if (beat === "crisis") {
    directives.push("Force a clear choice: retreat, bargain, or fight.");
    directives.push("Bring the active threat into the scene visibly.");
  } else if (beat === "revelation") {
    directives.push("Reveal a concrete lead that changes the next objective.");
    directives.push("Offer two actionable routes instead of open-ended wandering.");
  } else if (beat === "retaliation") {
    directives.push("Resolve enemy response through combat rules.");
    directives.push("Describe tactical pressure without changing HP outside rules.");
  } else if (beat === "complication") {
    directives.push("Add a cost, timer, or lost opportunity tied to the failed action.");
    directives.push("Preserve player agency by leaving a recoverable option.");
  } else {
    directives.push("Reward the action with one specific fact, clue, or position change.");
    directives.push("Tie the clue back to an existing quest or memory.");
  }

  if ((clocks.deadline || 0) >= 4) {
    directives.push("Remind the table that time is running out.");
  }
  if (check.total - check.dc >= 8) {
    directives.push("Grant extra momentum without skipping the core mystery.");
  }
  return directives;
}

function clockTrace(value, previous) {
  const current = clampClock(value);
  const before = clampClock(previous);
  return {
    value: current,
    max: MAX_CLOCK,
    previous: before,
    delta: current - before,
    trend: current > before ? "up" : current < before ? "down" : "steady"
  };
}

function summarizeConsequence({ check, clocks, lastMove }) {
  if (check.success) {
    return {
      type: "earned-progress",
      severity: "none",
      reason: "successful check advanced the quest or clue clock"
    };
  }
  return {
    type: lastMove === "counterattack" ? "retaliation" : "complication",
    severity: (clocks.danger || 0) >= 5 ? "major" : "minor",
    reason: "failed check advanced danger or deadline"
  };
}

function summarizeSceneChange({ check, actionText, beat }) {
  const travelIntent = /travel|move|follow|追踪|前往|移动|离开/.test(actionText);
  if (travelIntent && check.success) {
    return {
      type: "possible-location-shift",
      reason: "successful travel intent",
      beat
    };
  }
  if (!check.success) {
    return {
      type: "pressure-without-location-jump",
      reason: "failed action keeps the scene controllable",
      beat
    };
  }
  return {
    type: "scene-evolves-in-place",
    reason: "successful action adds information before moving location",
    beat
  };
}

function chooseNpcIntent({ beat, check, actionText }) {
  if (beat === "retaliation") {
    return { type: "counterattack", reason: "aggressive failed action invited a rules-bound response" };
  }
  if (beat === "crisis") {
    return { type: "pressure", reason: "danger clock is near full" };
  }
  if (beat === "revelation") {
    return { type: "reveal", reason: "clue clock reached a reveal beat" };
  }
  if (!check.success) {
    return { type: "bargain", reason: "failure should leave a recoverable option" };
  }
  if (/guard|block|protect|守|挡|保护/.test(actionText)) {
    return { type: "guard", reason: "player action focused on holding position" };
  }
  return { type: "none", reason: "" };
}

function buildMemoryQuery({ room, actionText, beat, check, knowledge }) {
  const terms = [
    ...String(actionText || "").split(/[^a-z0-9\u3400-\u9fff]+/i),
    room?.scene?.objective,
    room?.scene?.location,
    room?.scene?.weather,
    room?.scene?.season,
    beat,
    check.success ? "success" : "failure",
    ...(knowledge?.tags || []),
    ...(knowledge?.environment?.suggestedSkills || [])
  ]
    .flatMap((entry) => String(entry || "").toLowerCase().split(/[^a-z0-9\u3400-\u9fff]+/u))
    .filter((entry) => entry.length >= 2)
    .slice(0, 12);
  return {
    label: `${beat}:${check.success ? "success" : "failure"}`,
    terms: [...new Set(terms)]
  };
}

function buildDecisionFrame({ director, check, actionText }) {
  const sceneShiftAllowed = director.sceneChange?.type === "possible-location-shift";
  const continuityRisk = sceneShiftAllowed || director.beat === "crisis" || Math.abs(director.stateDeltas.danger) >= 2
    ? "watch"
    : "low";
  return {
    reason: director.sceneChange?.reason || director.consequence?.reason || "state-update",
    allowedSceneShift: sceneShiftAllowed,
    continuityRisk,
    lastMove: director.lastMove,
    beat: director.beat,
    knowledge: {
      framework: director.knowledge?.framework || null,
      sourceIds: (director.knowledge?.sources || []).map((source) => source.id),
      environment: {
        weather: director.knowledge?.environment?.weather || null,
        season: director.knowledge?.environment?.season || null,
        pressure: director.knowledge?.environment?.pressure || null
      },
      actionIntent: director.knowledge?.actionGuidance?.intent || null
    },
    check: {
      success: Boolean(check.success),
      margin: Number(check.total) - Number(check.dc)
    },
    actionIntent: actionIntent(actionText)
  };
}

function actionIntent(actionText) {
  if (/attack|strike|攻击/.test(actionText)) return "hostile";
  if (/travel|move|follow|go|前往|移动|追踪|离开/.test(actionText)) return "travel";
  if (/search|inspect|investigate|调查|搜索|查看/.test(actionText)) return "investigate";
  return "general";
}

function clampClock(value) {
  return Math.max(0, Math.min(MAX_CLOCK, Number.isFinite(value) ? value : 0));
}

function uniqueDirectives(values) {
  return [...new Set(values.filter(Boolean))];
}
