export const SCENARIO_SEED_TABLES = Object.freeze({
  discovery: table("discovery", [
    outcome("fresh-trace", "A fresh trace points toward a specific next location.", ["clue", "travel"]),
    outcome("split-clue", "The clue is real but names two possible routes with different costs.", ["choice", "clue"]),
    outcome("witness-detail", "A witness remembers a small sensory detail that changes the question.", ["npc", "memory"])
  ]),
  danger: table("danger", [
    outcome("soft-alarm", "Something notices the party but has not committed to violence.", ["warning"]),
    outcome("closing-route", "One route narrows, floods, locks, or fills with onlookers.", ["position"]),
    outcome("visible-threat", "The threat becomes visible before it becomes unavoidable.", ["combat", "pressure"])
  ]),
  npcReaction: table("npcReaction", [
    outcome("asks-price", "The NPC asks for a concrete price, promise, or proof.", ["social"]),
    outcome("reveals-need", "The NPC reveals a need before revealing a fact.", ["social", "motive"]),
    outcome("tests-trust", "The NPC offers a small test that can be accepted or refused.", ["choice"])
  ]),
  treasure: table("treasure", [
    outcome("useful-consumable", "The reward solves a near-term pressure instead of inflating power.", ["inventory"]),
    outcome("story-object", "The reward is valuable because of who wants its story.", ["inventory", "quest"]),
    outcome("tool-with-hook", "The reward is a tool that invites a specific next action.", ["inventory", "action"])
  ]),
  weather: table("weather", [
    outcome("sound-mask", "Weather masks sound and changes what stealth can mean.", ["weather", "stealth"]),
    outcome("track-revealed", "Weather reveals a track, stain, scent, or residue.", ["weather", "clue"]),
    outcome("shelter-pressure", "Weather makes shelter, supplies, or timing matter now.", ["weather", "survival"])
  ]),
  complication: table("complication", [
    outcome("cost-not-wall", "Failure creates a cost, not a dead end.", ["failure"]),
    outcome("new-bargain", "A setback opens a bargain with a price attached.", ["choice"]),
    outcome("timer-starts", "A visible timer starts and can still be answered.", ["clock"])
  ])
});

export function buildScenarioSeedPack(seedRef = "default", categories = Object.keys(SCENARIO_SEED_TABLES), context = {}) {
  return categories.map((category) => selectScenarioSeedOutcome({ seedRef, category, context }));
}

export function selectScenarioSeedOutcome({ seedRef = "default", category = "discovery", context = {}, validator = null } = {}) {
  const selectedTable = SCENARIO_SEED_TABLES[category] || SCENARIO_SEED_TABLES.discovery;
  const seed = stableHash([seedRef, selectedTable.id, context.sceneId, context.beat, context.weather, context.actorId].join("|"));
  const startIndex = seed % selectedTable.outcomes.length;
  const ordered = rotate(selectedTable.outcomes, startIndex);
  const selected = ordered.find((entry) => validateOutcome(entry, validator)) || selectedTable.outcomes[0];
  const rejectedAlternatives = ordered.filter((entry) => entry.id !== selected.id && !validateOutcome(entry, validator));
  const validatorResult = validator ? (rejectedAlternatives.length ? "accepted-with-rejections" : "accepted") : "not-run";
  const fallbackReason = selected.id === selectedTable.outcomes[0].id && !validateOutcome(ordered[0], validator)
    ? "validator-fallback"
    : "";

  return {
    mode: "deterministic-scenario-seed",
    seedRef,
    seed,
    selectedTable: selectedTable.id,
    selected,
    alternatives: selectedTable.outcomes.filter((entry) => entry.id !== selected.id).map((entry) => entry.id),
    telemetry: buildVarianceTelemetry({
      mode: "deterministic-scenario-seed",
      seedRef,
      selectedTable: selectedTable.id,
      selectedOutcomeId: selected.id,
      rejectedAlternativesCount: rejectedAlternatives.length,
      validatorResult,
      fallbackReason
    })
  };
}

export function buildVarianceTelemetry({
  mode = "deterministic-scenario-seed",
  seedRef = "default",
  selectedTable = "discovery",
  selectedOutcomeId = "",
  rejectedAlternativesCount = 0,
  validatorResult = "not-run",
  fallbackReason = ""
} = {}) {
  return {
    mode,
    seedRef,
    selectedTable,
    selectedOutcomeId,
    rejectedAlternativesCount: Math.max(0, Number.parseInt(rejectedAlternativesCount, 10) || 0),
    validatorResult,
    fallbackReason,
    storesPrivatePromptText: false,
    checksum: stableHash([mode, seedRef, selectedTable, selectedOutcomeId, validatorResult, fallbackReason].join("|")).toString(16)
  };
}

function table(id, outcomes) {
  return Object.freeze({
    id,
    outcomes: Object.freeze(outcomes)
  });
}

function outcome(id, summary, tags) {
  return Object.freeze({
    id,
    summary,
    tags: Object.freeze(tags)
  });
}

function validateOutcome(entry, validator) {
  if (typeof validator !== "function") return true;
  return Boolean(validator(entry));
}

function rotate(values, startIndex) {
  return [...values.slice(startIndex), ...values.slice(0, startIndex)];
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
