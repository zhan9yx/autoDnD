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
const SERVER_READY_TIMEOUT_MS = Number.parseInt(process.env.AIDM_TEST_SERVER_READY_TIMEOUT_MS || "20000", 10);
const SERVER_READY_POLL_MS = 100;

test("0015 static browser QA contract keeps drawers, refresh storage, and mobile no-overflow hooks wired", async () => {
  const [html, css, app] = await Promise.all([
    readFile(join(repoRoot, "public/index.html"), "utf8"),
    readFile(join(repoRoot, "public/styles.css"), "utf8"),
    readFile(join(repoRoot, "public/app.js"), "utf8")
  ]);

  for (const drawer of ["party", "state", "log", "character", "market", "settings"]) {
    assert.match(html, new RegExp(`data-drawer-open="${drawer}"`), `${drawer} opener should be present`);
    assert.match(
      html,
      new RegExp(`data-drawer="${drawer}"[^>]+aria-hidden="true"[^>]+inert`),
      `${drawer} drawer should default to a hidden inert panel`
    );
  }

  assert.match(html, /id="inventoryList"[\s\S]*id="inventoryDetail"/);
  assert.match(html, /id="marketWallet"[\s\S]*id="marketStatus"[\s\S]*id="marketList"/);
  assert.match(html, /id="tableStateToggle"[^>]+aria-expanded="false"[^>]+aria-controls="tableStateDetails"/);
  assert.match(html, /id="drawerScrim"/);

  assert.match(app, /function openDrawer\(name,[\s\S]*if \(name === "market"\) \{[\s\S]*refreshMarket\(\{ clearFeedback: true \}\)/);
  assert.match(app, /panel\.classList\.toggle\("open", active\)/);
  assert.match(app, /panel\.setAttribute\("aria-hidden", String\(!active\)\)/);
  assert.match(app, /panel\.inert = !active/);
  assert.match(app, /document\.body\.classList\.add\("drawer-open"\)/);
  assert.match(app, /function closeDrawers\([\s\S]*document\.body\.classList\.remove\("drawer-open"\)/);
  assert.match(app, /function bindTableStateStrip\(\)[\s\S]*aria-expanded[\s\S]*aria-hidden[\s\S]*inert/);

  assert.match(app, /const ROOM_SESSION_PREFIX = "aidm\.rooms\."/);
  assert.match(app, /const startupAuthRestore = restoreAuthSession\(\);[\s\S]*initializeRoomFromUrl\(startupAuthRestore\);/);
  assert.match(app, /async function initializeRoomFromUrl\(authRestorePromise = Promise\.resolve\(\)\)[\s\S]*roomIdFromCurrentUrl\(\)[\s\S]*setJoinByIdValue\(roomId\)[\s\S]*showCreateStatus\("room\.openingFromUrl"\)[\s\S]*await authRestorePromise\.catch\(\(\) => \{\}\)[\s\S]*await openRoomById\(roomId\)/);
  assert.match(app, /async function openRoomById\(roomId\)[\s\S]*api\(`\/api\/rooms\/\$\{encodeURIComponent\(normalizedRoomId\)\}`\)[\s\S]*openRoom\(result\.room\)/);
  assert.match(app, /function roomIdFromCurrentUrl\(\)[\s\S]*new URLSearchParams\(window\.location\.search\)\.get\("room"\)/);
  assert.match(app, /function setJoinByIdValue\(roomId\)[\s\S]*els\.joinByIdForm\?\.elements\?\.roomId[\s\S]*input\.value = roomId/);
  assert.match(app, /function roomPlayerIdKey\(roomId\)[\s\S]*return `\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.playerId`/);
  assert.match(app, /function roomPlayerTokenKey\(roomId\)[\s\S]*return `\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.playerToken`/);
  assert.match(app, /function roomHostTokenKey\(roomId\)[\s\S]*return `\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.hostToken`/);
  assert.match(app, /function attachRoomAccessHeaders\(path, headers\)[\s\S]*X-AIDM-Player-Id[\s\S]*X-AIDM-Player-Token/);

  assert.match(css, /body\.table-active\s*\{[\s\S]*overflow: hidden/);
  assert.match(css, /body\.table-active \.shell\s*\{[\s\S]*width: 100%;[\s\S]*height: 100dvh;[\s\S]*overflow: hidden/);
  assert.match(css, /\.table\s*\{[\s\S]*height: calc\(100dvh - 28px\)/);
  assert.match(css, /\.drawer-panel\s*\{[\s\S]*position: fixed;[\s\S]*width: min\(460px, calc\(100vw - 28px\)\)/);
  assert.match(css, /\.drawer-panel\.open\s*\{[\s\S]*pointer-events: auto;[\s\S]*visibility: visible/);
  assert.match(css, /body\.drawer-open \.reward-toast\s*\{[\s\S]*display: none !important/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*body\.table-active \.shell\s*\{[\s\S]*padding: 8px/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.topbar-actions\s*\{[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.drawer-panel\s*\{[\s\S]*width: 100%;[\s\S]*max-height: 100dvh/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.party-drawer,[\s\S]*\.market-drawer[\s\S]*transform: translateY\(100%\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.table\s*\{[\s\S]*grid-template-rows: auto 32px 40px minmax\(132px, 18dvh\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.action-form,[\s\S]*\.action-form\.chat-mode\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("0015 automated browser QA flow closes fresh room, market/backpack, action, replay, and refresh recovery", async (t) => {
  const { baseUrl } = await startServer(t);

  const [health, index, appSource] = await Promise.all([
    api(baseUrl, "/api/health"),
    fetchText(baseUrl, "/"),
    fetchText(baseUrl, "/app.js")
  ]);
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);
  assert.match(index, /id="createForm"/);
  assert.match(appSource, /attachRoomAccessHeaders\(path, headers\)/);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: "0015 Automated Browser QA",
      tone: "mystery",
      language: "zh"
    }
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.room.phase, "lobby");
  assert.equal(created.body.room.language, "zh");
  assert.ok(created.body.session.hostToken);
  assertNoSecretValues(created.body.room, [created.body.session.hostToken]);

  const joined = await joinRoom(baseUrl, created.body.room.id, {
    playerName: "Browser QA Player",
    characterName: "Lin",
    species: "human",
    classId: "rogue",
    stats: { body: 4, agility: 7, mind: 5, presence: 5, spirit: 3 }
  });
  assert.equal(joined.room.players.length, 1);
  assert.equal(joined.player.character.inventory.length > 0, true);
  assert.ok(joined.session.playerToken);

  const started = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    body: { hostToken: created.body.session.hostToken }
  });
  assert.equal(started.status, 200);
  assert.equal(started.body.room.phase, "scene");
  assert.equal(started.body.room.activePlayerId, joined.player.id);
  assert.ok(started.body.room.presentation?.sceneAsset?.file);
  assert.ok(started.body.room.soundscape?.id);

  const market = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`, {
    headers: playerHeaders(joined)
  });
  assert.equal(market.status, 200);
  assert.equal(market.body.room.activePlayerId, joined.player.id);
  assert.equal(market.body.room.mediaLogs.some((entry) => entry.type === "soundscape.switch"), true);
  assert.equal(market.body.room.mediaLogs.some((entry) => entry.type === "asset.selection"), true);

  const offer = market.body.shop.find((entry) => entry.itemId === "storm-lantern")
    || market.body.shop.find((entry) => entry.purchaseState?.canBuy !== false && Number(entry.price) <= 120);
  assert.ok(offer, "market should expose a buyable offer for the browser QA flow");
  assert.ok(offer.definition?.assetRef?.file, "market offer should carry item art for the browser card");

  const buyerBefore = market.body.room.players.find((player) => player.id === joined.player.id);
  const bought = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/buy`, {
    method: "POST",
    headers: playerHeaders(joined),
    body: {
      playerId: joined.player.id,
      playerToken: joined.session.playerToken,
      itemId: offer.itemId,
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(bought.status, 200);
  assert.equal(bought.body.room.activePlayerId, joined.player.id);
  assert.equal(bought.body.room.transcript.at(-1).economy.action, "buy");

  const buyerAfter = bought.body.room.players.find((player) => player.id === joined.player.id);
  const purchased = buyerAfter.character.inventory.find((item) => item.itemId === offer.itemId && item.source === "shop");
  assert.ok(purchased, "purchased market item should appear in the player's backpack");
  assert.equal(buyerAfter.character.wallet, buyerBefore.character.wallet - offer.price);

  const refreshedAfterBuy = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: playerHeaders(joined)
  });
  assert.equal(refreshedAfterBuy.status, 200);
  assert.equal(refreshedAfterBuy.body.room.phase, "scene");
  assert.equal(refreshedAfterBuy.body.room.players.length, 1);
  const refreshedBuyer = refreshedAfterBuy.body.room.players.find((player) => player.id === joined.player.id);
  assert.equal(refreshedBuyer.character.inventory.some((item) => item.id === purchased.id), true);
  assert.equal(refreshedBuyer.character.wallet, buyerAfter.character.wallet);
  assertNoSecretValues(refreshedAfterBuy.body.room, [
    created.body.session.hostToken,
    joined.session.playerToken,
    "hostToken",
    "playerToken",
    "passwordHash",
    "tokenHash"
  ]);

  const chatted = await api(baseUrl, `/api/rooms/${created.body.room.id}/chat`, {
    method: "POST",
    headers: playerHeaders(joined),
    body: {
      playerId: joined.player.id,
      playerToken: joined.session.playerToken,
      text: "先检查背包和市场记录，再继续行动。",
      channel: "party",
      expectedVersion: refreshedAfterBuy.body.room.version
    }
  });
  assert.equal(chatted.status, 200);
  assert.equal(chatted.body.room.activePlayerId, joined.player.id);
  assert.equal(chatted.body.room.transcript.at(-1).type, "chat");

  const acted = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    headers: playerHeaders(joined),
    body: {
      playerId: joined.player.id,
      playerToken: joined.session.playerToken,
      text: "带着新买的装备穿过雨中的市场，调查西侧楼梯的银色账册线索。",
      mode: "normal",
      expectedVersion: chatted.body.room.version
    }
  });
  assert.equal(acted.status, 200);
  assert.equal(acted.body.room.transcript.some((entry) => entry.type === "roll"), true);
  assert.equal(acted.body.room.transcript.some((entry) => entry.type === "gm"), true);
  assert.ok(acted.body.room.presentation?.sceneAsset?.file);
  assert.ok(acted.body.room.stateSummary?.turn?.prompt);
  assert.ok(acted.body.room.soundscape?.id);

  const replay = await api(baseUrl, `/api/rooms/${created.body.room.id}/replay`, {
    headers: playerHeaders(joined)
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replay.highlights.length >= 1, true);

  const refreshedAfterAction = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: playerHeaders(joined)
  });
  assert.equal(refreshedAfterAction.status, 200);
  assert.equal(refreshedAfterAction.body.room.version, acted.body.room.version);
  assert.equal(refreshedAfterAction.body.room.players[0].id, joined.player.id);
  assert.equal(refreshedAfterAction.body.room.players[0].character.inventory.some((item) => item.id === purchased.id), true);
  assert.equal(refreshedAfterAction.body.room.transcript.length, acted.body.room.transcript.length);
});

async function joinRoom(baseUrl, roomId, body) {
  const result = await api(baseUrl, `/api/rooms/${roomId}/join`, {
    method: "POST",
    body
  });
  assert.equal(result.status, 200);
  return result.body;
}

function playerHeaders(joined) {
  return {
    "X-AIDM-Player-Id": joined.player.id,
    "X-AIDM-Player-Token": joined.session.playerToken
  };
}

function assertNoSecretValues(payload, values) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  for (const value of values.filter(Boolean)) {
    assert.equal(text.includes(String(value)), false, `payload leaked secret value: ${value}`);
  }
}

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

async function fetchText(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200, `${path} should be served`);
  return response.text();
}

async function startServer(t) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-browser-qa-"));
  const port = await availablePort();
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      AIDM_DATA_FILE: join(tempDir, "rooms.json")
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
  return { baseUrl: `http://127.0.0.1:${port}` };
}

async function waitForServer(child, port) {
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

  const exited = once(child, "exit").then(([code, signal]) => ({ code, signal }));
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (stdout.includes(`http://localhost:${port}`)) {
      return;
    }

    const ready = await isServerHealthy(port);
    if (ready) {
      return;
    }

    const exit = await Promise.race([
      delay(SERVER_READY_POLL_MS).then(() => null),
      exited
    ]);
    if (exit) {
      throw new Error(`Test server exited before ready: code=${exit.code} signal=${exit.signal} stdout=${stdout} stderr=${stderr}`);
    }
  }

  throw new Error(`Timed out waiting for test server on ${port} after ${SERVER_READY_TIMEOUT_MS}ms. stdout=${stdout} stderr=${stderr}`);
}

async function isServerHealthy(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    if (!response.ok) {
      await response.arrayBuffer().catch(() => {});
      return false;
    }
    const body = await response.json();
    return body?.ok === true;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
