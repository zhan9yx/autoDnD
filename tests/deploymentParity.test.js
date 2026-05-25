import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";
import {
  environmentInventory,
  validateDeploymentEnv
} from "../scripts/deployment-parity.mjs";

const execFileAsync = promisify(execFile);

test("deployment parity environment inventory covers GATE-003 local contract keys", () => {
  const keys = environmentInventory().map((entry) => entry.key);

  for (const key of ["NODE_ENV", "PORT", "AIDM_DATA_FILE", "OPENAI_MODEL", "OPENAI_BASE_URL", "OPENAI_API_KEY"]) {
    assert.ok(keys.includes(key), `${key} should be documented in the deployment parity inventory`);
  }

  const apiKey = environmentInventory().find((entry) => entry.key === "OPENAI_API_KEY");
  assert.equal(apiKey.secret, true);
  assert.equal(apiKey.requiredForLocalParity, false);
});

test("deployment parity validation rejects unsafe defaults and masks provided secrets", () => {
  const result = validateDeploymentEnv({
    NODE_ENV: "development",
    PORT: "4173",
    AIDM_DATA_FILE: "data/aidm-store.json",
    OPENAI_MODEL: "gpt-test",
    OPENAI_BASE_URL: "https://api.openai.com/v1",
    OPENAI_API_KEY: "sk-test-secret-value"
  });

  assert.equal(result.ok, false);
  assert.match(result.blockers.join("\n"), /NODE_ENV must be production/);
  assert.match(result.blockers.join("\n"), /do not run staging parity against data\/aidm-store\.json/);
  assert.equal(result.sanitizedEnv.OPENAI_API_KEY, "sk-t...alue");
  assert.equal(JSON.stringify(result).includes("sk-test-secret-value"), false);
});

test("deployment parity validation rejects repo-local explicit data files", () => {
  const result = validateDeploymentEnv({
    NODE_ENV: "production",
    PORT: "4173",
    AIDM_DATA_FILE: join(process.cwd(), "tmp", "deployment-parity-store.json"),
    OPENAI_MODEL: "gpt-test",
    OPENAI_BASE_URL: "https://api.openai.com/v1"
  });

  assert.equal(result.ok, false);
  assert.match(result.blockers.join("\n"), /outside the repo root/);
});

test("deployment parity script starts production-like server and records local partial evidence", { timeout: 45000 }, async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-deployment-parity-test-"));
  const { stdout } = await execFileAsync(process.execPath, [
    "scripts/deployment-parity.mjs",
    "--data-file",
    join(tempDir, "store.json"),
    "--json"
  ], {
    timeout: 45000
  });
  const result = JSON.parse(stdout);

  assert.equal(result.ok, true);
  assert.equal(result.gate, "GATE-003");
  assert.equal(result.recommendation, "partial");
  assert.equal(result.validation.sanitizedEnv.NODE_ENV, "production");
  assert.equal(result.checks.every((check) => check.ok), true);
  assert.ok(result.checks.some((check) => check.name === "initial healthcheck"));
  assert.ok(result.checks.some((check) => check.name === "rollback restart persisted store smoke"));
});
