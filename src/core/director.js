const MAX_CLOCK = 6;

export function createDirectorState(tone = "mystery") {
  return {
    act: 1,
    beat: "hook",
    pacing: tone === "heroic" ? "bold" : "investigative",
    pressure: 1,
    spotlightPlayerId: null,
    lastMove: null,
    directives: [
      "Keep the immediate objective visible.",
      "Resolve rules in code before narration.",
      "Escalate failure through clocks, not arbitrary punishment."
    ]
  };
}

export function applyDirectorBeat(room, { check, actionText, player }) {
  const director = room.director || createDirectorState(room.tone);
  const clocks = room.scene.clocks || { clues: 0, danger: 0, deadline: 0 };
  const previousClues = clocks.clues || 0;
  const previousDanger = clocks.danger || 0;
  const successMargin = check.total - check.dc;
  const lowerAction = String(actionText || "").toLowerCase();

  if (check.success) {
    clocks.clues = clampClock(previousClues + (successMargin >= 5 ? 2 : 1));
    clocks.danger = clampClock(previousDanger - (successMargin >= 5 ? 1 : 0));
    director.lastMove = "reveal";
  } else {
    clocks.danger = clampClock(previousDanger + (successMargin <= -5 ? 2 : 1));
    clocks.deadline = clampClock((clocks.deadline || 0) + 1);
    director.lastMove = lowerAction.includes("attack") || lowerAction.includes("攻击") ? "counterattack" : "complication";
  }

  director.pressure = clampClock(Math.round((clocks.danger + room.scene.threat) / 2));
  director.spotlightPlayerId = player.id;
  director.beat = chooseBeat({ room, clocks, check, actionText: lowerAction });
  director.act = clocks.clues >= 5 ? 2 : clocks.danger >= 5 ? Math.max(director.act, 2) : director.act;
  director.directives = buildDirectives({ beat: director.beat, clocks, check });

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

function clampClock(value) {
  return Math.max(0, Math.min(MAX_CLOCK, Number.isFinite(value) ? value : 0));
}
