import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { runProductionDepthEval } from "../scripts/evaluate-production-depth.mjs";

const execFileAsync = promisify(execFile);

test("production-depth evaluator covers scene, audio, logs, economy, and asset bindings", async () => {
  const report = await runProductionDepthEval({
    datasetPath: "evals/production-depth/scenarios.json"
  });

  assert.equal(report.reportVersion, 1);
  assert.equal(report.summary.gate, "production-depth");
  assert.equal(report.summary.passed, true);
  assert.equal(report.summary.passRate, 1);
  assert.equal(report.results.some((result) => result.category === "scene-audio-consistency"), true);
  assert.equal(report.results.some((result) => result.category === "memory-retrieval"), true);
  assert.equal(report.results.some((result) => result.category === "log-safety"), true);
  assert.equal(report.results.some((result) => result.category === "event-progression"), true);
  assert.equal(report.results.some((result) => result.category === "state-control"), true);
  assert.equal(report.results.some((result) => result.category === "game-logic-consistency"), true);
  assert.equal(report.results.some((result) => result.category === "economy"), true);
  assert.equal(report.results.some((result) => result.category === "asset-binding"), true);

  const archive = report.results.find((result) => result.id === "scenario:rain-archive-street");
  assert.equal(archive.passed, true);
  assert.equal(archive.details.selectedAsset.semanticKey, "scene.rain.archive.street");
  assert.equal(archive.details.selectedSoundscape.profile.weather.includes("heavy-rain"), true);

  const progression = report.results.find((result) => result.id === "event-progression-monotonicity");
  assert.equal(progression.passed, true);
  assert.equal(progression.checks.some((entry) => entry.name.includes("scene location changes")), true);
  assert.equal(
    progression.checks.some((entry) => entry.name === "clocks stay bounded and change by at most two per event" && entry.passed),
    true
  );
  assert.deepEqual(progression.details.eventIds, ["T001", "T002", "T003", "T004"]);

  const stateControl = report.results.find((result) => result.id === "state-control-surface");
  assert.equal(stateControl.passed, true);
  assert.equal(stateControl.details.reviewFields.includes("npcIntent"), true);

  const memory = report.results.find((result) => result.id === "long-history-retrieval");
  assert.equal(memory.details.diagnostics.bargain.rank, 1);
  assert.equal(memory.details.diagnostics.bargain.topMatchedTokens.includes("cistern"), true);
  assert.equal(memory.details.diagnostics.consequence.rank, 1);
  assert.equal(memory.details.diagnostics.consequence.topMatchedTokens.includes("danger"), true);
  assert.equal(memory.checks.every((entry) => entry.passed), true);
  assert.equal(memory.details.indexedEvents >= 40, true);

  const logSafety = report.results.find((result) => result.id === "structured-log-safety");
  assert.equal(logSafety.passed, true);
  assert.equal(logSafety.details.logTypes.includes("memory.retrieval"), true);
  assert.equal(logSafety.details.logTypes.includes("combat.calculation"), true);
  assert.equal(
    logSafety.checks.some((entry) => entry.name === "memory and combat logs have first-class templates" && entry.passed),
    true
  );

  const combat = report.results.find((result) => result.id === "combat-logic-consistency");
  assert.equal(combat.passed, true);
  assert.equal(combat.details.diagnostics.finalStatuses.playerAttack, "victory");
  assert.equal(combat.details.diagnostics.finalStatuses.enemyAttack, "defeat");
});

test("production-depth evaluator CLI writes a reusable JSON report", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-production-depth-"));
  const reportPath = join(tempDir, "report.json");
  const { stdout } = await execFileAsync(process.execPath, [
    "scripts/evaluate-production-depth.mjs",
    "evals/production-depth/scenarios.json",
    reportPath
  ]);
  const summary = JSON.parse(stdout);
  const report = JSON.parse(await readFile(reportPath, "utf8"));

  assert.equal(summary.passed, true);
  assert.equal(report.summary.passed, true);
  assert.equal(report.summary.checkCount, report.results.length);
  assert.equal(report.results.every((result) => result.passed), true);
});

test("production-depth npm gate runs locally without writing a timestamped report", async () => {
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.equal(
    packageJson.scripts["eval:production-depth"],
    "node scripts/evaluate-production-depth.mjs evals/production-depth/scenarios.json --no-report"
  );

  const { stdout } = await execFileAsync("npm", ["run", "eval:production-depth"]);
  const summary = JSON.parse(stdout.slice(stdout.indexOf("{")));

  assert.equal(summary.gate, "production-depth");
  assert.equal(summary.passed, true);
  assert.equal(summary.failedCount, 0);
});
