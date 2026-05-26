import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { runLongCampaignSimulation } from "../scripts/simulate-long-campaign.mjs";

test("long campaign simulation preserves large multi-player state across refresh", async () => {
  const tempDir = await mkdtemp("/private/tmp/aidm-long-campaign-test-");
  const result = await runLongCampaignSimulation({
    tempDir,
    dataFile: join(tempDir, "rooms.json"),
    turns: 72
  });

  assert.equal(result.ok, true);
  assert.equal(result.players, 6);
  assert.equal(result.quests >= 4, true);
  assert.equal(result.generatedTranscriptEvents >= 220, true);
  assert.equal(result.generatedTranscriptEvents <= 500, true);
  assert.equal(result.retainedTranscriptEvents, 200);
  assert.equal(result.memories >= 60, true);
  assert.equal(result.inventoryEvents.length >= 6, true);
  assert.equal(result.replayHighlights >= 6, true);
  assert.equal(result.recoveredReplayHighlights, result.replayHighlights);
  assert.equal(result.payloadMetrics.structuredLogCount, result.retainedTranscriptEvents);
  assert.equal(result.payloadMetrics.logTypes.includes("ai.decision"), true);
  assert.equal(result.payloadMetrics.logTypes.includes("chat.message"), true);
  assert.equal(result.payloadMetrics.logTypes.includes("dice.roll"), true);
  assert.equal(result.payloadMetrics.logTypes.includes("inventory.mutation"), true);
  assert.equal(result.payloadMetrics.snapshotBytes < 2_500_000, true);
  assert.equal(result.payloadMetrics.logPayloadBytes < 1_500_000, true);
  assert.equal(result.memoryChecks.every((entry) => entry.topSourceEventId === entry.expected), true);
});
