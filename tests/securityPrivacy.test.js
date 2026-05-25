import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("0016 local abuse guard throttles repeated protected-room join attempts without leaking secrets", async (t) => {
  const { baseUrl } = await startServer(t, {
    env: {
      AIDM_ABUSE_LIMIT: "2",
      AIDM_ABUSE_WINDOW_MS: "60000"
    }
  });

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: "Abuse Guard Room",
      accessMode: "password",
      roomPassword: "join-secret-0016"
    }
  });
  assert.equal(created.status, 201);

  for (let index = 0; index < 2; index += 1) {
    const denied = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
      method: "POST",
      body: {
        playerName: `Probe ${index}`,
        characterName: `Probe ${index}`,
        roomPassword: "wrong-secret-0016"
      }
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.body.code, "ROOM_PASSWORD_INVALID");
    assertNoSecretValues(denied.body, ["join-secret-0016", "wrong-secret-0016", created.body.session.hostToken]);
  }

  const throttled = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Probe 3",
      characterName: "Probe 3",
      roomPassword: "wrong-secret-0016"
    }
  });
  assert.equal(throttled.status, 429);
  assert.equal(throttled.body.code, "ABUSE_RATE_LIMITED");
  assertNoSensitiveKeys(throttled.body);
  assertNoSecretValues(throttled.body, ["join-secret-0016", "wrong-secret-0016", created.body.session.hostToken]);
});

test("0016 local session contract keeps session reads non-tokenized and logout token-scoped", async (t) => {
  const { baseUrl } = await startServer(t);

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "rotation-host@example.test",
      password: "rotation-pass",
      displayName: "Rotation Host"
    }
  });
  assert.equal(registered.status, 201);
  const firstToken = registered.body.session.sessionToken;

  const firstRead = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${firstToken}` }
  });
  assert.equal(firstRead.status, 200);
  assert.equal(firstRead.body.session.sessionToken, undefined);
  assertNoSecretValues(firstRead.body, [firstToken, "rotation-pass"]);

  const login = await api(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email: "rotation-host@example.test",
      password: "rotation-pass"
    }
  });
  assert.equal(login.status, 200);
  const secondToken = login.body.session.sessionToken;
  assert.ok(secondToken);
  assert.notEqual(secondToken, firstToken);

  const firstStillValid = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${firstToken}` }
  });
  assert.equal(firstStillValid.status, 200);
  assert.equal(firstStillValid.body.session.sessionToken, undefined);

  const logoutFirst = await api(baseUrl, "/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${firstToken}` }
  });
  assert.equal(logoutFirst.status, 200);
  assert.equal(logoutFirst.body.deleted, true);

  const firstAfterLogout = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${firstToken}` }
  });
  assert.equal(firstAfterLogout.status, 401);
  assert.equal(firstAfterLogout.body.code, "SESSION_INVALID");
  assertNoSecretValues(firstAfterLogout.body, [firstToken, secondToken, "rotation-pass"]);

  const secondStillValid = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${secondToken}` }
  });
  assert.equal(secondStillValid.status, 200);
  assert.equal(secondStillValid.body.session.sessionToken, undefined);
  assertNoSecretValues(secondStillValid.body, [firstToken, secondToken, "rotation-pass"]);
});

test("0016 host account sessions and host tokens remain room-scoped for protected actions", async (t) => {
  const { baseUrl } = await startServer(t);

  const owner = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "owner-0016@example.test",
      password: "owner-pass",
      displayName: "Owner"
    }
  });
  const intruder = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "intruder-0016@example.test",
      password: "intruder-pass",
      displayName: "Intruder"
    }
  });
  assert.equal(owner.status, 201);
  assert.equal(intruder.status, 201);

  const firstRoom = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${owner.body.session.sessionToken}` },
    body: { title: "Room A", accessMode: "host-approval" }
  });
  const secondRoom = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${owner.body.session.sessionToken}` },
    body: { title: "Room B", accessMode: "host-approval" }
  });
  assert.equal(firstRoom.status, 201);
  assert.equal(secondRoom.status, 201);

  const deniedIntruderStart = await api(baseUrl, `/api/rooms/${firstRoom.body.room.id}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${intruder.body.session.sessionToken}` }
  });
  assert.equal(deniedIntruderStart.status, 403);
  assert.equal(deniedIntruderStart.body.code, "HOST_TOKEN_REQUIRED");

  const deniedCrossRoomToken = await api(baseUrl, `/api/rooms/${secondRoom.body.room.id}/start`, {
    method: "POST",
    body: { hostToken: firstRoom.body.session.hostToken }
  });
  assert.equal(deniedCrossRoomToken.status, 403);
  assert.equal(deniedCrossRoomToken.body.code, "HOST_TOKEN_REQUIRED");
  assertNoSecretValues(deniedCrossRoomToken.body, [
    firstRoom.body.session.hostToken,
    secondRoom.body.session.hostToken,
    owner.body.session.sessionToken,
    intruder.body.session.sessionToken
  ]);

  const pendingJoin = await api(baseUrl, `/api/rooms/${secondRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Pending Player",
      characterName: "Pending Hero"
    }
  });
  assert.equal(pendingJoin.status, 200);
  assert.equal(pendingJoin.body.pendingPlayer.status, "pending");

  const ownerApprove = await api(baseUrl, `/api/rooms/${secondRoom.body.room.id}/pending/${pendingJoin.body.pendingPlayer.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${owner.body.session.sessionToken}` }
  });
  assert.equal(ownerApprove.status, 200);
  assert.equal(ownerApprove.body.pendingPlayer.status, "approved");
  assert.equal(ownerApprove.body.player.id, pendingJoin.body.pendingPlayer.id);
});

test("0016 security/privacy docs keep source registry template local and public gates blocked", async () => {
  const [security, releaseGates, userGuide, gateQa, artifact] = await Promise.all([
    readFile("docs/SECURITY.md", "utf8"),
    readFile("docs/RELEASE_GATES.md", "utf8"),
    readFile("docs/USER_GUIDE.md", "utf8"),
    readFile("docs/qa/0015-public-readiness-gates.md", "utf8"),
    readFile("docs/qa/0016-security-privacy.md", "utf8")
  ]);
  const combined = `${security}\n${releaseGates}\n${userGuide}\n${artifact}`;

  assert.match(releaseGates, /\| GATE-005 \| Security and abuse controls \| blocked \|/);
  assert.match(releaseGates, /\| GATE-006 \| Legal and privacy \| blocked \|/);
  assert.match(gateQa, /GATE-005 .*blocked/i);
  assert.match(gateQa, /GATE-006 .*blocked/i);
  assert.doesNotMatch(combined, /GATE-00[56][^\n|]*\|\s*passed\s*\|/i);
  assert.doesNotMatch(combined, /legal clearance (?:is )?(?:complete|completed|done|passed|approved|cleared)/i);

  assert.match(combined, /original, generic fantasy TRPG prototype/i);
  assert.match(artifact, /No official DND or SRD rules text, setting text, stat blocks, names, art, audio, or lore are adopted/i);
  assert.match(artifact, /\| Source ID \| Source Name \| Owner \| License \/ Rights Basis \| Allowed Use \| Attribution Plan \| Excluded Terms \| Review Status \|/);
  assert.match(artifact, /\| Data Category \| Purpose \| Local Storage Surface \| Retention Default \| Export \/ Deletion Path \| Consent Or Notice Requirement \| Owner \|/);
  assert.match(artifact, /This artifact is a template and local evidence index only/i);
});

async function api(baseUrl, path, { method = "GET", body = null, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null
  };
}

function assertNoSensitiveKeys(payload) {
  const sensitiveKeys = new Set([
    "password",
    "passwordHash",
    "roomPassword",
    "roomPasswordHash",
    "sessionToken",
    "tokenHash",
    "playerToken",
    "hostToken",
    "hostTokenHash"
  ]);
  const visit = (value, path = "$") => {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    for (const [key, entry] of Object.entries(value)) {
      assert.equal(sensitiveKeys.has(key), false, `sensitive key leaked at ${path}.${key}`);
      visit(entry, `${path}.${key}`);
    }
  };
  visit(payload);
}

function assertNoSecretValues(payload, values) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  for (const value of values.filter(Boolean)) {
    assert.equal(text.includes(value), false, `secret value leaked: ${value}`);
  }
}

async function startServer(t, options = {}) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-security-privacy-"));
  const port = await availablePort();
  const { cwd = repoRoot, env = {} } = options;
  const dataFile = env.AIDM_DATA_FILE || join(tempDir, "rooms.json");
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd,
    env: {
      ...process.env,
      ...env,
      PORT: String(port),
      AIDM_DATA_FILE: dataFile
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let exited = false;
  child.once("exit", () => {
    exited = true;
  });
  t.after(async () => {
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
  });

  await waitForServer(child, port);
  return { baseUrl: `http://127.0.0.1:${port}`, dataFile };
}

async function waitForServer(child, port) {
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for test server on ${port}. stdout=${stdout} stderr=${stderr}`));
    }, 15000);

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
      reject(new Error(`Test server exited before ready: code=${code} signal=${signal} stderr=${stderr}`));
    });
  });
}

async function availablePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = address.port;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}
