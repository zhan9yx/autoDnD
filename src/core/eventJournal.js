const EVENT_TRIGGER_FIXTURES = Object.freeze({
  "weather-shift": fixture("weather-shift", "Weather shift", ["environment"], "The weather changes the scene pressure.", "Track how visibility, footing, or sound changes the next choice."),
  "patrol-arrival": fixture("patrol-arrival", "Patrol arrival", ["npc", "danger"], "A patrol enters the active location.", "Name the patrol's first demand before combat starts."),
  "trap-spring": fixture("trap-spring", "Trap spring", ["hazard"], "A prepared hazard resolves.", "Record who was exposed and what can still be disarmed."),
  "faction-move": fixture("faction-move", "Faction move", ["faction"], "A faction spends a clock tick.", "Show the visible consequence before hidden motives."),
  "countdown-expiry": fixture("countdown-expiry", "Countdown expiry", ["clock"], "A deadline resolves.", "Make the cost concrete and leave one recovery route."),
  "scene-exit": fixture("scene-exit", "Scene exit", ["scene"], "The party leaves the current scene.", "Carry one unresolved hook into the next location."),
  "failed-check": fixture("failed-check", "Failed check", ["rules", "complication"], "A failed check creates a recoverable complication.", "Convert failure into cost, timer, bargain, or exposure.")
});

export function listEventTriggerFixtures() {
  return Object.values(EVENT_TRIGGER_FIXTURES).map(clone);
}

export function resolveEventTriggerFixture(triggerId, input = {}) {
  const fixtureDef = EVENT_TRIGGER_FIXTURES[triggerId] || EVENT_TRIGGER_FIXTURES["failed-check"];
  const seed = stableHash([fixtureDef.id, input.sceneId, input.round, input.actorId, input.reason].join("|"));
  const severity = input.severity || ["low", "moderate", "high"][seed % 3];
  return createEventResolutionJournalEntry({
    id: `${fixtureDef.id}:${seed.toString(16)}`,
    trigger: {
      id: fixtureDef.id,
      label: fixtureDef.label,
      tags: fixtureDef.tags,
      reason: input.reason || fixtureDef.visibleConsequence
    },
    participants: input.participants || [input.actorId].filter(Boolean),
    beforeState: input.beforeState || {},
    afterState: input.afterState || {},
    visibleConsequence: input.visibleConsequence || fixtureDef.visibleConsequence,
    hiddenConsequence: input.hiddenConsequence || `Fixture severity ${severity}; no private prompt text stored.`,
    nextHook: input.nextHook || fixtureDef.nextHook,
    severity,
    round: input.round ?? null,
    sceneId: input.sceneId || null
  });
}

export function createEventResolutionJournalEntry(input = {}) {
  const trigger = normalizeTrigger(input.trigger);
  const participants = normalizeList(input.participants);
  const beforeState = normalizeState(input.beforeState);
  const afterState = normalizeState(input.afterState);
  const stateDelta = computeStateDelta(beforeState, afterState);
  const id = input.id || `${trigger.id}:${stableHash(JSON.stringify({ trigger, participants, stateDelta })).toString(16)}`;

  return {
    id,
    type: "event-resolution",
    trigger,
    participants,
    round: input.round ?? null,
    sceneId: input.sceneId || null,
    stateDelta,
    visibleConsequence: String(input.visibleConsequence || "The event resolves visibly at the table."),
    hiddenConsequenceSummary: String(input.hiddenConsequence || input.hiddenConsequenceSummary || "No hidden consequence recorded."),
    nextHook: String(input.nextHook || "Ask the next actor for a concrete response."),
    severity: input.severity || "moderate",
    audit: {
      deterministic: true,
      storesPrivatePromptText: false
    }
  };
}

export function buildEventResolutionJournal(events = []) {
  return events.map((event) => createEventResolutionJournalEntry(event));
}

function fixture(id, label, tags, visibleConsequence, nextHook) {
  return Object.freeze({
    id,
    label,
    tags: Object.freeze(tags),
    visibleConsequence,
    nextHook
  });
}

function normalizeTrigger(trigger = {}) {
  if (typeof trigger === "string") {
    const fixtureDef = EVENT_TRIGGER_FIXTURES[trigger] || EVENT_TRIGGER_FIXTURES["failed-check"];
    return {
      id: fixtureDef.id,
      label: fixtureDef.label,
      tags: [...fixtureDef.tags],
      reason: fixtureDef.visibleConsequence
    };
  }
  return {
    id: String(trigger.id || "manual-event"),
    label: String(trigger.label || trigger.id || "Manual event"),
    tags: normalizeList(trigger.tags),
    reason: String(trigger.reason || "")
  };
}

function normalizeState(state = {}) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return {};
  return Object.fromEntries(Object.entries(state).filter(([, value]) => typeof value !== "function"));
}

function computeStateDelta(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Object.fromEntries([...keys].map((key) => {
    const beforeValue = before[key];
    const afterValue = after[key];
    if (Number.isFinite(Number(beforeValue)) && Number.isFinite(Number(afterValue))) {
      return [key, Number(afterValue) - Number(beforeValue)];
    }
    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
      return [key, "unchanged"];
    }
    return [key, { before: beforeValue ?? null, after: afterValue ?? null }];
  }));
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== undefined && entry !== null).map(String);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}
