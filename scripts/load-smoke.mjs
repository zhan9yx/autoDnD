#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const defaultConfig = {
  rooms: Number.parseInt(process.env.AIDM_LOAD_SMOKE_ROOMS || "4", 10),
  sseClientsPerRoom: Number.parseInt(process.env.AIDM_LOAD_SMOKE_SSE_PER_ROOM || "3", 10),
  apiP95Ms: Number.parseInt(process.env.AIDM_LOAD_SMOKE_API_P95_MS || "15000", 10),
  sseConnectP95Ms: Number.parseInt(process.env.AIDM_LOAD_SMOKE_SSE_CONNECT_P95_MS || "1000", 10),
  sseInitialP95Ms: Number.parseInt(process.env.AIDM_LOAD_SMOKE_SSE_INITIAL_P95_MS || "1000", 10),
  sseBroadcastP95Ms: Number.parseInt(process.env.AIDM_LOAD_SMOKE_SSE_BROADCAST_P95_MS || "1000", 10),
  maxErrorRate: Number.parseFloat(process.env.AIDM_LOAD_SMOKE_MAX_ERROR_RATE || "0"),
  timeoutMs: Number.parseInt(process.env.AIDM_LOAD_SMOKE_TIMEOUT_MS || "8000", 10)
};

export async function runLoadSmoke(options = {}) {
  const config = { ...defaultConfig, ...options };
  assert.ok(config.rooms >= 1, "rooms must be at least 1");
  assert.ok(config.sseClientsPerRoom >= 1, "sseClientsPerRoom must be at least 1");

  const ownedServer = options.baseUrl ? null : await startServer(config);
  const baseUrl = options.baseUrl || ownedServer.baseUrl;
  const metrics = {
    apiLatenciesMs: [],
    sseConnectLatenciesMs: [],
    sseInitialLatenciesMs: [],
    sseBroadcastLatenciesMs: [],
    errors: []
  };
  const clients = [];

  try {
    const health = await timedApi(metrics, baseUrl, "/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);

    const contexts = [];
    for (let index = 0; index < config.rooms; index += 1) {
      contexts.push(await createRoomContext(baseUrl, metrics, index));
    }

    await Promise.all(contexts.flatMap((context) => {
      return Array.from({ length: config.sseClientsPerRoom }, async () => {
        const connectStartedAt = performance.now();
        const client = await openSseClient(baseUrl, context);
        metrics.sseConnectLatenciesMs.push(performance.now() - connectStartedAt);
        clients.push(client);
        context.clients.push(client);
        const initialStartedAt = performance.now();
        await client.waitFor((event) => event.event === "snapshot", config.timeoutMs);
        metrics.sseInitialLatenciesMs.push(performance.now() - initialStartedAt);
      });
    }));

    for (const context of contexts) {
      await exerciseRoom(baseUrl, metrics, config, context);
    }

    const totalOperations = metrics.apiLatenciesMs.length
      + metrics.sseInitialLatenciesMs.length
      + metrics.sseBroadcastLatenciesMs.length
      + metrics.errors.length;
    const errorRate = totalOperations === 0 ? 0 : metrics.errors.length / totalOperations;
    const result = {
      ok: true,
      target: {
        rooms: config.rooms,
        sseClientsPerRoom: config.sseClientsPerRoom,
        totalSseClients: config.rooms * config.sseClientsPerRoom
      },
      thresholds: {
        apiP95Ms: config.apiP95Ms,
        sseConnectP95Ms: config.sseConnectP95Ms,
        sseInitialP95Ms: config.sseInitialP95Ms,
        sseBroadcastP95Ms: config.sseBroadcastP95Ms,
        maxErrorRate: config.maxErrorRate
      },
      metrics: {
        api: summarize(metrics.apiLatenciesMs),
        sseConnect: summarize(metrics.sseConnectLatenciesMs),
        sseInitial: summarize(metrics.sseInitialLatenciesMs),
        sseBroadcast: summarize(metrics.sseBroadcastLatenciesMs),
        errors: metrics.errors.length,
        errorRate: Number(errorRate.toFixed(4))
      },
      rooms: contexts.map((context) => context.roomId)
    };

    assertWithin(result.metrics.api.p95Ms, config.apiP95Ms, "API p95 latency");
    assertWithin(result.metrics.sseConnect.p95Ms, config.sseConnectP95Ms, "SSE connect p95 latency");
    assertWithin(result.metrics.sseInitial.p95Ms, config.sseInitialP95Ms, "SSE initial snapshot p95 latency");
    assertWithin(result.metrics.sseBroadcast.p95Ms, config.sseBroadcastP95Ms, "SSE broadcast p95 latency");
    assert.ok(errorRate <= config.maxErrorRate, `error rate ${errorRate} exceeded ${config.maxErrorRate}`);
    return result;
  } finally {
    for (const client of clients) {
      client.close();
    }
    if (ownedServer) {
      await ownedServer.stop();
    }
  }
}

async function createRoomContext(baseUrl, metrics, index) {
  const created = await timedApi(metrics, baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: `Load Smoke Room ${index + 1}`,
      tone: "mystery",
      language: index % 2 === 0 ? "en" : "zh",
      accessMode: "open"
    }
  });
  assert.equal(created.status, 201);

  const joined = await timedApi(metrics, baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: `Load Player ${index + 1}`,
      characterName: `Load Hero ${index + 1}`,
      classId: index % 2 === 0 ? "mage" : "rogue",
      stats: { body: 4, agility: 5, mind: 6, presence: 4, spirit: 5 }
    }
  });
  assert.equal(joined.status, 200);

  return {
    roomId: created.body.room.id,
    hostToken: created.body.session.hostToken,
    playerId: joined.body.player.id,
    playerToken: joined.body.session.playerToken,
    clients: []
  };
}

async function exerciseRoom(baseUrl, metrics, config, context) {
  const started = await timedApi(metrics, baseUrl, `/api/rooms/${context.roomId}/start`, {
    method: "POST",
    body: { hostToken: context.hostToken }
  });
  assert.equal(started.status, 200);

  const chatted = await timedApi(metrics, baseUrl, `/api/rooms/${context.roomId}/chat`, {
    method: "POST",
    body: {
      playerId: context.playerId,
      playerToken: context.playerToken,
      text: "checking the table connection before the next move",
      expectedVersion: started.body.room.version
    }
  });
  assert.equal(chatted.status, 200);

  const targetVersion = chatted.body.room.version;
  await Promise.all(context.clients.map(async (client) => {
    const startedAt = performance.now();
    await client.waitFor((event) => {
      return event.event === "snapshot" && Number(event.data?.version || 0) >= targetVersion;
    }, config.timeoutMs);
    metrics.sseBroadcastLatenciesMs.push(performance.now() - startedAt);
  }));
}

async function openSseClient(baseUrl, context) {
  const abortController = new AbortController();
  const response = await fetch(`${baseUrl}/api/rooms/${context.roomId}/events`, {
    headers: {
      "X-AIDM-Player-Id": context.playerId,
      "X-AIDM-Player-Token": context.playerToken
    },
    signal: abortController.signal
  });
  assert.equal(response.status, 200);
  return createSseReader(response, abortController);
}

function createSseReader(response, abortController) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const events = [];
  const waiters = [];
  let buffer = "";
  let closed = false;

  const client = {
    events,
    close() {
      closed = true;
      abortController.abort();
      reader.cancel().catch(() => {});
      for (const waiter of waiters.splice(0)) {
        waiter.reject(new Error("SSE client closed"));
      }
    },
    waitFor(predicate, timeoutMs) {
      const existing = events.find(predicate);
      if (existing) {
        return Promise.resolve(existing);
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timed out waiting for SSE event after ${timeoutMs}ms`));
        }, timeoutMs);
        waiters.push({
          predicate,
          resolve: (event) => {
            clearTimeout(timer);
            resolve(event);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          }
        });
      });
    }
  };

  pump().catch((error) => {
    if (!closed && error.name !== "AbortError") {
      for (const waiter of waiters.splice(0)) {
        waiter.reject(error);
      }
    }
  });

  async function pump() {
    while (!closed) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const parsed = parseSseEvent(rawEvent);
        if (parsed) {
          events.push(parsed);
          for (const waiter of waiters.slice()) {
            if (waiter.predicate(parsed)) {
              waiters.splice(waiters.indexOf(waiter), 1);
              waiter.resolve(parsed);
            }
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
  }

  return client;
}

function parseSseEvent(rawEvent) {
  const lines = rawEvent.split("\n").map((line) => line.trimEnd());
  const event = lines.find((line) => line.startsWith("event: "))?.slice("event: ".length) || "message";
  const data = lines
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))
    .join("\n");
  return data ? { event, data: JSON.parse(data), receivedAt: performance.now() } : null;
}

async function timedApi(metrics, baseUrl, path, { method = "GET", body = null, headers = {} } = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;
    metrics.apiLatenciesMs.push(performance.now() - startedAt);
    if (!response.ok) {
      metrics.errors.push({ path, status: response.status, body: parsed });
    }
    return { status: response.status, body: parsed };
  } catch (error) {
    metrics.errors.push({ path, message: error.message });
    throw error;
  }
}

async function startServer(config) {
  const port = await availablePort();
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-load-smoke-"));
  const dataFile = join(tempDir, "rooms.json");
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      AIDM_DATA_FILE: dataFile
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let exited = false;
  child.once("exit", () => {
    exited = true;
  });
  await waitForServer(child, port, config.timeoutMs);
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      if (!exited) {
        child.kill("SIGTERM");
        await Promise.race([
          once(child, "exit"),
          new Promise((resolve) => setTimeout(resolve, 1000))
        ]);
      }
      if (!exited) {
        child.kill("SIGKILL");
      }
    }
  };
}

async function waitForServer(child, port, timeoutMs) {
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for load-smoke server on ${port}. stdout=${stdout} stderr=${stderr}`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes(`http://localhost:${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`Load-smoke server exited before ready: code=${code} signal=${signal} stderr=${stderr}`));
    });
  });
}

async function availablePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    minMs: round(sorted[0] || 0),
    medianMs: percentile(sorted, 0.5),
    p95Ms: percentile(sorted, 0.95),
    maxMs: round(sorted.at(-1) || 0)
  };
}

function percentile(sorted, rank) {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * rank) - 1);
  return round(sorted[index]);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function assertWithin(actual, threshold, label) {
  assert.ok(actual <= threshold, `${label} ${actual}ms exceeded ${threshold}ms`);
}

function readCliOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      options.baseUrl = argv[index + 1];
      index += 1;
    } else if (arg === "--rooms") {
      options.rooms = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--sse-clients-per-room") {
      options.sseClientsPerRoom = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--api-p95-ms") {
      options.apiP95Ms = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--sse-connect-p95-ms") {
      options.sseConnectP95Ms = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--sse-initial-p95-ms") {
      options.sseInitialP95Ms = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--sse-broadcast-p95-ms") {
      options.sseBroadcastP95Ms = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--timeout-ms") {
      options.timeoutMs = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/load-smoke.mjs [options]

Options:
  --base-url URL                 Use an already-running local server.
  --rooms N                      Concurrent rooms to create. Default: ${defaultConfig.rooms}
  --sse-clients-per-room N       SSE clients per room. Default: ${defaultConfig.sseClientsPerRoom}
  --api-p95-ms N                 API p95 latency threshold. Default: ${defaultConfig.apiP95Ms}
  --sse-connect-p95-ms N         SSE open-to-headers threshold. Default: ${defaultConfig.sseConnectP95Ms}
  --sse-initial-p95-ms N         SSE first snapshot p95 threshold. Default: ${defaultConfig.sseInitialP95Ms}
  --sse-broadcast-p95-ms N       SSE broadcast p95 threshold. Default: ${defaultConfig.sseBroadcastP95Ms}
  --timeout-ms N                 Per-wait timeout. Default: ${defaultConfig.timeoutMs}
`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    const result = await runLoadSmoke(readCliOptions(process.argv.slice(2)));
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exit(1);
  }
}
