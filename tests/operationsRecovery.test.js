import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  assertSafeTempPath,
  monitoringStatus,
  runOperationsDrill
} from "../scripts/ops-drill.mjs";

test("operations drill backs up, restores, exports, deletes, and leaves the temp store unchanged", async () => {
  const tempDir = await mkdtemp("/private/tmp/aidm-ops-drill-test-");
  const dataFile = join(tempDir, "aidm-store.json");
  const backupDir = join(tempDir, "backups");
  const exportDir = join(tempDir, "exports");
  const reportFile = join(tempDir, "reports", "ops-drill.json");

  const result = await runOperationsDrill({
    dataFile,
    backupDir,
    exportDir,
    reportFile,
    retentionDays: 30
  });

  assert.equal(result.ok, true);
  assert.equal(result.gate, "GATE-004");
  assert.equal(result.status, "blocked");
  assert.equal(result.failClosed, true);
  assert.equal(result.seeded, true);
  assert.equal(result.before.sha256, result.after.sha256);
  assert.equal(result.backup.sha256, result.restore.sha256);
  assert.equal(result.restore.verified, true);
  assert.equal(result.exported.userFound, true);
  assert.equal(result.exported.sessionCount, 2);
  assert.equal(result.exported.roomCount, 1);
  assert.equal(result.retention.sessionsPruned, 1);
  assert.equal(result.deletion.usersDeleted, 1);
  assert.equal(result.deletion.sessionsDeleted, 1);
  assert.equal(result.deletion.roomReferencesRedacted > 0, true);
  assert.equal(result.monitoring.status, "blocked");
  assert.equal(result.monitoring.failClosed, true);

  const report = JSON.parse(await readFile(reportFile, "utf8"));
  assert.equal(report.after.sha256, result.after.sha256);
  const restoredStore = JSON.parse(await readFile(dataFile, "utf8"));
  assert.equal(restoredStore.users.some((user) => user.id === "user_ops_0016"), true);
  assert.equal(restoredStore.sessions.length, 2);
});

test("operations CLI emits drill evidence for explicit /private/tmp data files", async () => {
  const tempDir = await mkdtemp("/private/tmp/aidm-ops-cli-test-");
  const dataFile = join(tempDir, "rooms.json");
  const result = spawnSync(process.execPath, [
    "scripts/ops-drill.mjs",
    "drill",
    "--data-file",
    dataFile,
    "--backup-dir",
    join(tempDir, "backups"),
    "--export-dir",
    join(tempDir, "exports"),
    "--report-file",
    join(tempDir, "ops-report.json")
  ], {
    cwd: process.cwd(),
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.match(payload.dataFile, /^\/private\/tmp\/aidm-ops-cli-test-/);
  assert.equal(payload.before.sha256, payload.after.sha256);
});

test("operations tooling refuses implicit or repo-local data paths", () => {
  assert.throws(() => assertSafeTempPath("data/aidm-store.json", "data file"), /absolute path under \/private\/tmp/);
  assert.throws(() => assertSafeTempPath("/Users/yixuan.zhang/Documents/AIDM/data/aidm-store.json", "data file"), /under \/private\/tmp/);
});

test("monitoring and alerting placeholders fail closed until both endpoints are configured", () => {
  assert.deepEqual(monitoringStatus({}), {
    ok: false,
    status: "blocked",
    failClosed: true,
    monitoringConfigured: false,
    alertingConfigured: false,
    placeholders: ["AIDM_MONITORING_URL", "AIDM_ALERT_WEBHOOK"]
  });
  assert.equal(monitoringStatus({
    AIDM_MONITORING_URL: "https://monitor.example.invalid",
    AIDM_ALERT_WEBHOOK: "https://alerts.example.invalid"
  }).ok, true);
});

test("GATE-004 docs record local recovery evidence without closing public operations", async () => {
  const [operations, gates, qa] = await Promise.all([
    readFile("docs/OPERATIONS.md", "utf8"),
    readFile("docs/RELEASE_GATES.md", "utf8"),
    readFile("docs/qa/0016-operations-recovery.md", "utf8")
  ]);

  assert.match(operations, /node scripts\/ops-drill\.mjs drill/);
  assert.match(operations, /AIDM_MONITORING_URL/);
  assert.match(operations, /AIDM_ALERT_WEBHOOK/);
  assert.match(operations, /Incident And Rollback Checklist/);
  assert.match(gates, /\| GATE-004 \| Operations and data recovery \| blocked \|/);
  assert.match(gates, /0016 local recovery drill/i);
  assert.match(qa, /GATE-004 status: blocked/i);
  assert.match(qa, /\/private\/tmp\/aidm-0016-ops-drill/);
});
