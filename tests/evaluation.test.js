import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("16h memory dataset has tabletop-scale coverage and gate thresholds", async () => {
  const dataset = JSON.parse(await readFile("evals/long-memory/campaign-history-16h.json", "utf8"));

  assert.equal(dataset.gate, "long-memory-16h");
  assert.equal(dataset.version, "16h-v1");
  assert.ok(Array.isArray(dataset.sessionBlocks));
  assert.ok(dataset.sessionBlocks.length >= 16);
  assert.ok(dataset.events.length >= 2000);
  assert.ok(dataset.queries.length >= 200);
  assert.ok(dataset.threshold.minRecallAt5 >= 0.9);
  assert.ok(dataset.threshold.minMeanReciprocalRank >= 0.8);

  const eventIds = new Set(dataset.events.map((event) => event.id));
  for (const block of dataset.sessionBlocks) {
    assert.ok(block.id);
    assert.ok(eventIds.has(block.startEventId));
    assert.ok(eventIds.has(block.endEventId));
    assert.ok(block.queryIds.length >= 10);
  }

  for (const query of dataset.queries) {
    assert.ok(query.sessionBlockId);
    assert.ok(query.expectedEventIds.length >= 5);
    for (const eventId of query.expectedEventIds) {
      assert.ok(eventIds.has(eventId), `${query.id} references missing ${eventId}`);
    }
  }
});

test("default memory eval script targets the 16h gate", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.match(packageJson.scripts["eval:memory"], /campaign-history-16h\.json/);
  assert.match(packageJson.scripts["eval:memory:16h"], /campaign-history-16h\.json/);
});

test("memory evaluator writes the v2 report format", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-memory-eval-"));
  const datasetPath = join(tempDir, "dataset.json");
  const reportPath = join(tempDir, "report.json");
  const fixture = {
    name: "Fixture memory benchmark",
    version: "fixture-v1",
    gate: "fixture-gate",
    sessionBlocks: [{ id: "H01", hour: 1, startEventId: "E001", endEventId: "E002", queryIds: ["Q001"] }],
    events: [
      { id: "E001", text: "Mara hid the silver ledger under the archive stair for Magistrate Cale." },
      { id: "E002", text: "A market vendor discussed oranges, ropes, ferry schedules, and candle wax." }
    ],
    queries: [
      {
        id: "Q001",
        sessionBlockId: "H01",
        query: "Where did Mara hide the silver ledger?",
        expectedEventIds: ["E001"]
      }
    ],
    threshold: {
      minRecallAt5: 1,
      minMeanReciprocalRank: 1
    }
  };
  await writeFile(datasetPath, `${JSON.stringify(fixture, null, 2)}\n`);

  const { stdout } = await execFileAsync(process.execPath, ["scripts/evaluate-memory.mjs", datasetPath, reportPath]);
  const summary = JSON.parse(stdout);
  const report = JSON.parse(await readFile(reportPath, "utf8"));

  assert.equal(report.reportVersion, 2);
  assert.equal(typeof report.generatedAt, "string");
  assert.equal(report.summary.datasetPath, datasetPath);
  assert.equal(report.summary.gate, "fixture-gate");
  assert.equal(report.summary.sessionBlockCount, 1);
  assert.equal(report.summary.passed, true);
  assert.equal(summary.passed, true);
  assert.deepEqual(report.results[0].expectedEventIds, ["E001"]);
  assert.deepEqual(report.results[0].hitEventIds, ["E001"]);
  assert.deepEqual(report.results[0].missedEventIds, []);
  assert.equal(report.results[0].recallAt5, 1);
  assert.equal(report.results[0].reciprocalRank, 1);
});
