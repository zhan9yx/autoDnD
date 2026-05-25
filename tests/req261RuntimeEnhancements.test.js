import test from "node:test";
import assert from "node:assert/strict";
import { createInventoryEntry } from "../src/core/itemCatalog.js";
import {
  describeInventoryActionReasons,
  describeItemStoryFlags
} from "../src/core/inventorySemantics.js";
import {
  buildEventResolutionJournal,
  listEventTriggerFixtures,
  resolveEventTriggerFixture
} from "../src/core/eventJournal.js";
import {
  buildScenarioSeedPack,
  buildVarianceTelemetry,
  selectScenarioSeedOutcome
} from "../src/core/scenarioSeeds.js";
import { buildRulesKnowledgeBrief } from "../src/core/knowledgeBriefs.js";

test("REQ-267 and REQ-268 expose action reasons and story flags without changing legacy sell behavior", () => {
  const clue = createInventoryEntry("merchant-contract", {
    instanceId: "merchant-contract-story",
    source: "witness-table"
  });
  const mundane = createInventoryEntry("bone-dice-set", {
    instanceId: "dice-story",
    source: "market"
  });

  const clueFlags = describeItemStoryFlags(clue, { questId: "quest-ledger" });
  const clueReasons = describeInventoryActionReasons(clue, "zh", { questId: "quest-ledger" });
  const mundaneReasons = describeInventoryActionReasons(mundane, "en");

  assert.equal(clueFlags.questId, "quest-ledger");
  assert.equal(clueFlags.clueId, "clue:merchant-contract");
  assert.equal(clueFlags.spendable, false);
  assert.equal(clueReasons.actions.sell.available, false);
  assert.equal(clueReasons.actions.sell.reasonCode, "quest-locked");
  assert.equal(clueReasons.actions.sell.reasonLabel, "受保护的任务或线索物品");
  assert.equal(clueReasons.actions.keep.available, true);
  assert.equal(clueReasons.actions.keep.reasonCode, "keep-recommended");
  assert.equal(clueReasons.actions.questLock.active, true);
  assert.equal(mundaneReasons.actions.sell.available, true);
  assert.equal(mundaneReasons.actions.sell.turnCost, "free-time");
  assert.equal(mundaneReasons.actions.use.available, false);
  assert.equal(mundaneReasons.actions.use.reasonCode, "not-usable");
});

test("REQ-269 records deterministic event resolution journals for trigger fixtures", () => {
  const fixtures = listEventTriggerFixtures();
  const triggerIds = fixtures.map((entry) => entry.id);

  assert.deepEqual(triggerIds, [
    "weather-shift",
    "patrol-arrival",
    "trap-spring",
    "faction-move",
    "countdown-expiry",
    "scene-exit",
    "failed-check"
  ]);

  const outcomes = triggerIds.map((triggerId) => resolveEventTriggerFixture(triggerId, {
    actorId: "player-1",
    sceneId: "rain-archive",
    round: 3,
    beforeState: { danger: 2, clues: 1 },
    afterState: { danger: 3, clues: 2 }
  }));

  assert.equal(outcomes.length, triggerIds.length);
  assert.equal(new Set(outcomes.map((entry) => entry.trigger.id)).size, triggerIds.length);
  for (const outcome of outcomes) {
    assert.equal(outcome.type, "event-resolution");
    assert.equal(outcome.audit.deterministic, true);
    assert.equal(outcome.audit.storesPrivatePromptText, false);
    assert.equal(outcome.stateDelta.danger, 1);
    assert.equal(outcome.stateDelta.clues, 1);
    assert.ok(outcome.visibleConsequence);
    assert.ok(outcome.hiddenConsequenceSummary);
    assert.ok(outcome.nextHook);
  }

  const journal = buildEventResolutionJournal([{
    trigger: "failed-check",
    participants: ["player-2"],
    beforeState: { deadline: 1 },
    afterState: { deadline: 2 },
    visibleConsequence: "The lock clicks loudly.",
    nextHook: "Choose whether to hide, talk, or force the door."
  }]);
  assert.equal(journal[0].stateDelta.deadline, 1);
  assert.match(journal[0].nextHook, /hide, talk, or force/);
});

test("REQ-271 and REQ-272 scenario seeds are stable while variance telemetry avoids prompt text", () => {
  const first = selectScenarioSeedOutcome({
    seedRef: "rain-ledger-01",
    category: "weather",
    context: { sceneId: "rain-archive", beat: "complication", actorId: "ranger" }
  });
  const second = selectScenarioSeedOutcome({
    seedRef: "rain-ledger-01",
    category: "weather",
    context: { sceneId: "rain-archive", beat: "complication", actorId: "ranger" }
  });
  const third = selectScenarioSeedOutcome({
    seedRef: "rain-ledger-02",
    category: "weather",
    context: { sceneId: "rain-archive", beat: "complication", actorId: "ranger" }
  });
  const rejected = selectScenarioSeedOutcome({
    seedRef: "rain-ledger-01",
    category: "danger",
    validator: (entry) => !entry.tags.includes("combat")
  });
  const pack = buildScenarioSeedPack("starter-pack", ["discovery", "danger", "npcReaction"]);

  assert.equal(first.selected.id, second.selected.id);
  assert.notEqual(first.telemetry.checksum, third.telemetry.checksum);
  assert.equal(first.telemetry.mode, "deterministic-scenario-seed");
  assert.equal(first.telemetry.storesPrivatePromptText, false);
  assert.equal(typeof first.telemetry.rejectedAlternativesCount, "number");
  assert.equal(rejected.telemetry.validatorResult.includes("accepted"), true);
  assert.deepEqual(pack.map((entry) => entry.selectedTable), ["discovery", "danger", "npcReaction"]);

  const telemetry = buildVarianceTelemetry({
    seedRef: "manual",
    selectedTable: "complication",
    selectedOutcomeId: "timer-starts",
    rejectedAlternativesCount: 2,
    validatorResult: "accepted-with-rejections",
    fallbackReason: "validator-fallback"
  });
  assert.equal(telemetry.rejectedAlternativesCount, 2);
  assert.equal(telemetry.fallbackReason, "validator-fallback");
  assert.equal(telemetry.storesPrivatePromptText, false);
});

test("REQ-273 builds compact SRD-style knowledge briefs with attribution boundaries", () => {
  const brief = buildRulesKnowledgeBrief({
    topics: ["actionEconomy", "checks", "conditions", "travel", "equipment", "rest"],
    language: "zh"
  });

  assert.equal(brief.framework, "repo-local-srd-style-brief");
  assert.equal(brief.sources.length >= 2, true);
  assert.equal(brief.audit.sourceIds.includes("dnd-srd-5.2.1"), true);
  assert.equal(brief.audit.copiesLongSourceText, false);
  assert.equal(brief.audit.excludesProtectedSettingLore, true);
  assert.equal(brief.bullets.length, 6);
  assert.equal(brief.bullets.every((entry) => entry.tags.includes("aidm-original-wording")), true);
  assert.match(brief.promptBlock, /行动经济/);
  assert.match(brief.licenseBoundary, /avoids long source text/);
  assert.equal(brief.promptBlock.includes("https://"), false);
  assert.equal(brief.promptBlock.length < 1200, true);
});

test("REQ-273 knowledge briefs include AI DM prompt boundary topics without source text", () => {
  const brief = buildRulesKnowledgeBrief({
    topics: ["dmMoves", "pressureEvents", "spellTactics", "warriorMilestones"],
    language: "zh",
    maxBullets: 4
  });

  assert.deepEqual(brief.bullets.map((entry) => entry.id), ["dmMoves", "pressureEvents", "spellTactics", "warriorMilestones"]);
  assert.match(brief.promptBlock, /主持人行动/);
  assert.match(brief.promptBlock, /法术战术/);
  assert.equal(brief.audit.copiesLongSourceText, false);
  assert.equal(brief.promptBlock.includes("https://"), false);
});
