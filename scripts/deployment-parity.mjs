#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { once } from "node:events";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const SECRET_KEYS = new Set(["OPENAI_API_KEY"]);
const REQUIRED_ENV_KEYS = ["NODE_ENV", "PORT", "AIDM_DATA_FILE", "OPENAI_MODEL", "OPENAI_BASE_URL"];
const OPTIONAL_ENV_KEYS = ["OPENAI_API_KEY", "AIDM_PUBLIC_DIR", "AIDM_ASSETS_DIR"];
const SERVER_READY_TIMEOUT_MS = 10000;
const SERVER_READY_POLL_MS = 100;
const REQUEST_TIMEOUT_MS = 15000;
const SERVER_STOP_TIMEOUT_MS = 1500;

export function environmentInventory() {
  return [
    { key: "NODE_ENV", requiredForLocalParity: true, productionExpectation: "production", secret: false },
    { key: "PORT", requiredForLocalParity: true, productionExpectation: "integer TCP port selected by the runtime or hosting platform", secret: false },
    { key: "AIDM_DATA_FILE", requiredForLocalParity: true, productionExpectation: "explicit writable JSON store path for the current prototype", secret: false },
    { key: "OPENAI_MODEL", requiredForLocalParity: true, productionExpectation: `defaults to ${DEFAULT_OPENAI_MODEL}; pin an approved model for staging and production`, secret: false },
    { key: "OPENAI_BASE_URL", requiredForLocalParity: true, productionExpectation: `defaults to ${DEFAULT_OPENAI_BASE_URL}; must be a valid provider URL`, secret: false },
    { key: "OPENAI_API_KEY", requiredForLocalParity: false, productionExpectation: "optional for local fallback; required before any production AI provider claim", secret: true },
    { key: "AIDM_PUBLIC_DIR", requiredForLocalParity: false, productionExpectation: "optional override; defaults to repo public directory", secret: false },
    { key: "AIDM_ASSETS_DIR", requiredForLocalParity: false, productionExpectation: "optional override; defaults to repo assets directory", secret: false }
  ];
}

export function maskSecret(value) {
  const text = String(value || "");
  if (!text) {
    return "";
  }
  if (text.length <= 8) {
    return "<redacted>";
  }
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

export function sanitizeEnv(env) {
  const sanitized = {};
  for (const key of [...REQUIRED_ENV_KEYS, ...OPTIONAL_ENV_KEYS]) {
    const value = env[key];
    if (value === undefined || value === "") {
      continue;
    }
    sanitized[key] = SECRET_KEYS.has(key) ? maskSecret(value) : String(value);
  }
  return sanitized;
}

export function validateDeploymentEnv(env) {
  const findings = [];
  const blockers = [];
  for (const key of REQUIRED_ENV_KEYS) {
    if (!String(env[key] || "").trim()) {
      blockers.push(`${key} is required for the local deployment parity profile`);
    }
  }

  if (env.NODE_ENV && env.NODE_ENV !== "production") {
    blockers.push("NODE_ENV must be production for the production-like parity check");
  }

  const parsedPort = Number.parseInt(env.PORT || "", 10);
  if (!Number.isInteger(parsedPort) || parsedPort < 1024 || parsedPort > 65535) {
    blockers.push("PORT must be an integer between 1024 and 65535");
  }

  const dataFile = String(env.AIDM_DATA_FILE || "");
  if (dataFile === "data/aidm-store.json") {
    blockers.push("AIDM_DATA_FILE must be explicit and isolated; do not run staging parity against data/aidm-store.json");
  }
  if (dataFile) {
    const resolvedDataFile = resolve(dataFile);
    if (resolvedDataFile === repoRoot || resolvedDataFile.startsWith(join(repoRoot, "/"))) {
      blockers.push("AIDM_DATA_FILE must be outside the repo root for deployment parity checks");
    }
  }
  if (dataFile.endsWith("/") || dataFile.endsWith("\\")) {
    blockers.push("AIDM_DATA_FILE must point to a JSON file, not a directory");
  }

  try {
    const baseUrl = new URL(env.OPENAI_BASE_URL || "");
    if (!["https:", "http:"].includes(baseUrl.protocol)) {
      blockers.push("OPENAI_BASE_URL must use http or https");
    }
    if (baseUrl.protocol === "http:" && !["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname)) {
      blockers.push("OPENAI_BASE_URL may use http only for localhost provider testing");
    }
  } catch {
    blockers.push("OPENAI_BASE_URL must be a valid URL");
  }

  const apiKey = String(env.OPENAI_API_KEY || "").trim();
  if (apiKey && /^(changeme|todo|test-key|placeholder|example)$/i.test(apiKey)) {
    blockers.push("OPENAI_API_KEY must not be a placeholder value when provided");
  }
  if (!apiKey) {
    findings.push("OPENAI_API_KEY is absent; health should report local AI fallback and no public AI-provider readiness is claimed");
  }

  return {
    ok: blockers.length === 0,
    blockers,
    findings,
    sanitizedEnv: sanitizeEnv(env)
  };
}

export async function buildLocalParityEnv(options = {}) {
  const tempDir = options.tempDir || await mkdtemp(join(tmpdir(), "aidm-deployment-parity-"));
  const port = options.port || await availablePort();
  return {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    AIDM_DATA_FILE: options.dataFile || join(tempDir, "staging-store.json"),
    OPENAI_MODEL: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || DEFAULT_OPENAI_BASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
    AIDM_PUBLIC_DIR: process.env.AIDM_PUBLIC_DIR || join(repoRoot, "public"),
    AIDM_ASSETS_DIR: process.env.AIDM_ASSETS_DIR || join(repoRoot, "assets")
  };
}

export async function runDeploymentParity(options = {}) {
  const env = options.env || await buildLocalParityEnv(options);
  const validation = validateDeploymentEnv(env);
  if (!validation.ok) {
    return {
      ok: false,
      gate: "GATE-003",
      recommendation: "blocked",
      validation,
      checks: []
    };
  }

  const checks = [];
  const baseUrl = `http://127.0.0.1:${env.PORT}`;
  const first = await startServer(env);
  try {
    const health = await requestJson(`${baseUrl}/api/health`);
    checks.push(assertHealth(health.body, "initial healthcheck"));

    const assets = await requestJson(`${baseUrl}/assets/manifest.json`);
    checks.push({
      name: "static asset manifest",
      ok: assets.status === 200 && assets.body?.version === 2,
      status: assets.status,
      version: assets.body?.version
    });

    const created = await requestJson(`${baseUrl}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Deployment Parity Smoke",
        tone: "rollback",
        language: "en"
      })
    });
    const roomId = created.body?.room?.id || "";
    checks.push({
      name: "canary room creation",
      ok: created.status === 201 && roomId.startsWith("room_"),
      status: created.status,
      roomId
    });
  } finally {
    await stopServer(first);
  }

  const second = await startServer(env);
  try {
    const health = await requestJson(`${baseUrl}/api/health`);
    checks.push(assertHealth(health.body, "rollback restart healthcheck"));

    const rooms = await requestJson(`${baseUrl}/api/rooms`);
    checks.push({
      name: "rollback restart persisted store smoke",
      ok: rooms.status === 200 && Array.isArray(rooms.body?.rooms) && rooms.body.rooms.some((room) => room.title === "Deployment Parity Smoke"),
      status: rooms.status,
      roomCount: Array.isArray(rooms.body?.rooms) ? rooms.body.rooms.length : 0
    });
  } finally {
    await stopServer(second);
  }

  const ok = checks.every((check) => check.ok);
  return {
    ok,
    gate: "GATE-003",
    recommendation: ok ? "partial" : "blocked",
    validation,
    checks,
    canaryPlan: [
      "Run this script against isolated staging data before opening external traffic.",
      "Verify /api/health, static manifest loading, canary room creation, and restart persistence.",
      "Keep public GATE-003 blocked until a real hosting deployment repeats the same contract."
    ],
    rollbackSmoke: "local process restart against the same data file"
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = await buildLocalParityEnv({
    port: args.port ? Number.parseInt(args.port, 10) : undefined,
    dataFile: args.dataFile ? resolve(args.dataFile) : undefined
  });
  const result = await runDeploymentParity({ env });
  console.log(args.json ? JSON.stringify(result, null, 2) : formatResult(result));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      parsed.json = true;
    } else if (arg === "--port") {
      parsed.port = args[index + 1];
      index += 1;
    } else if (arg === "--data-file") {
      parsed.dataFile = args[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function formatResult(result) {
  const lines = [
    `AIDM deployment parity: ${result.ok ? "ok" : "failed"}`,
    `Gate: ${result.gate}`,
    `Recommendation: ${result.recommendation}`,
    `Environment: ${JSON.stringify(result.validation.sanitizedEnv)}`
  ];
  for (const blocker of result.validation.blockers) {
    lines.push(`BLOCKER: ${blocker}`);
  }
  for (const finding of result.validation.findings) {
    lines.push(`FINDING: ${finding}`);
  }
  for (const check of result.checks) {
    lines.push(`${check.ok ? "PASS" : "FAIL"}: ${check.name}`);
  }
  return lines.join("\n");
}

function assertHealth(body, name) {
  return {
    name,
    ok: body?.ok === true && body?.service === "aidm" && body?.store === "json" && typeof body?.version === "string",
    service: body?.service,
    version: body?.version,
    store: body?.store,
    aiProvider: body?.aiProvider
  };
}

async function startServer(env) {
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd: repoRoot,
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  await waitForReady(child, env.PORT, () => ({ stdout, stderr }));
  return child;
}

async function waitForReady(child, port, getOutput) {
  const exited = once(child, "exit").then(([code, signal]) => ({ code, signal }));
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const output = getOutput();
    if (output.stdout.includes(`http://localhost:${port}`) || await isServerHealthy(port)) {
      return;
    }

    const exit = await Promise.race([
      delay(SERVER_READY_POLL_MS).then(() => null),
      exited
    ]);
    if (exit) {
      const outputAfterExit = getOutput();
      throw new Error(`Deployment parity server exited before ready: code=${exit.code} signal=${exit.signal} stdout=${outputAfterExit.stdout} stderr=${outputAfterExit.stderr}`);
    }
  }

  const output = getOutput();
  throw new Error(`Timed out waiting for deployment parity server on ${port} after ${SERVER_READY_TIMEOUT_MS}ms. stdout=${output.stdout} stderr=${output.stderr}`);
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  child.kill("SIGTERM");
  const stopped = await waitForExit(child, SERVER_STOP_TIMEOUT_MS);
  if (!stopped) {
    child.kill("SIGKILL");
    await waitForExit(child, SERVER_STOP_TIMEOUT_MS);
  }
}

async function requestJson(url, options = {}) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    const body = await response.json();
    return { status: response.status, body };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Timed out requesting ${url} after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function isServerHealthy(port) {
  try {
    const health = await requestJson(`http://127.0.0.1:${port}/api/health`, { timeoutMs: 750 });
    return health.status === 200 && health.body?.ok === true;
  } catch {
    return false;
  }
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return true;
  }
  return Promise.race([
    once(child, "exit").then(() => true),
    delay(timeoutMs).then(() => false)
  ]);
}

function delay(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolvePromise, reject) => {
    server.close((error) => error ? reject(error) : resolvePromise());
  });
  return port;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  await main();
}
