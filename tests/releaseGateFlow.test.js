import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { GameEngine } from "../src/core/gameEngine.js";
import { MemoryRoomStore } from "../src/core/storage.js";
import { chooseSoundscape } from "../src/core/soundscape.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("release gate API closes static, auth, market, bag, action, audio, and replay loop", async (t) => {
  const { baseUrl, dataFile } = await startServer(t);

  await assertStatic(baseUrl, "/", "text/html");
  await assertStatic(baseUrl, "/app.js", "text/javascript");
  await assertStatic(baseUrl, "/styles.css", "text/css");
  await assertStatic(baseUrl, "/i18n.js", "text/javascript");

  const health = await api(baseUrl, "/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const tts = await api(baseUrl, "/api/tts/providers");
  assert.equal(tts.status, 200);
  assert.equal(tts.body.providers.some((provider) => provider.id === "browser-speech-synthesis"), true);
  assert.equal(tts.body.providers.some((provider) => provider.id === "piper"), true);

  const soundscapes = await api(baseUrl, "/api/soundscapes");
  assert.equal(soundscapes.status, 200);
  assert.equal(soundscapes.body.presets.some((preset) => preset.id === "light-rain"), true);
  assert.equal(soundscapes.body.presets.some((preset) => preset.id === "combat-tension"), true);

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "release-host@example.test",
      password: "release-pass",
      displayName: "Release Host"
    }
  });
  assert.equal(registered.status, 201);
  assert.ok(registered.body.session.sessionToken);

  const restoredSession = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${registered.body.session.sessionToken}` }
  });
  assert.equal(restoredSession.status, 200);
  assert.equal(restoredSession.body.user.id, registered.body.user.id);

  const persistedAuth = JSON.parse(await readFile(dataFile, "utf8"));
  const persistedUser = persistedAuth.users.find((user) => user.id === registered.body.user.id);
  assert.match(persistedUser.passwordHash, /^scrypt-v1\$/);
  assert.equal(persistedAuth.sessions.every((session) => /^scrypt-session-v1\$/.test(session.tokenHash)), true);
  assert.equal(JSON.stringify(persistedAuth).includes("release-pass"), false);
  assert.equal(JSON.stringify(persistedAuth).includes(registered.body.session.sessionToken), false);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${registered.body.session.sessionToken}` },
    body: {
      title: "Release Gate Loop",
      tone: "mystery",
      language: "en",
      accessMode: "open"
    }
  });
  assert.equal(created.status, 201);
  assert.ok(created.body.session.hostToken);
  assert.equal(created.body.room.ownerUserId, registered.body.user.id);
  assert.equal(created.body.room.access.mode, "open");
  assert.ok(created.body.room.presentation.sceneAsset.file);
  assert.ok(created.body.room.soundscape.id);
  assert.equal(created.body.room.mediaLogs.some((entry) => entry.type === "soundscape.switch"), true);

  const firstJoin = await joinRoom(baseUrl, created.body.room.id, {
    playerName: "Asha",
    characterName: "Asha",
    classId: "mage",
    stats: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 }
  });
  const secondJoin = await joinRoom(baseUrl, created.body.room.id, {
    playerName: "Brann",
    characterName: "Brann",
    classId: "rogue",
    stats: { body: 4, agility: 7, mind: 4, presence: 4, spirit: 4 }
  });
  assert.notEqual(firstJoin.session.playerToken, secondJoin.session.playerToken);
  assert.equal(secondJoin.room.activePlayerId, firstJoin.player.id);
  assert.deepEqual(secondJoin.room.turnOrder, [firstJoin.player.id, secondJoin.player.id]);

  const started = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    body: { hostToken: created.body.session.hostToken }
  });
  assert.equal(started.status, 200);
  assert.equal(started.body.room.phase, "scene");

  const noLocalToken = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: firstJoin.player.id,
      text: "try to act from an unbound browser",
      expectedVersion: started.body.room.version
    }
  });
  assert.equal(noLocalToken.status, 403);
  assert.equal(noLocalToken.body.code, "PLAYER_TOKEN_REQUIRED");

  const market = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`);
  assert.equal(market.status, 200);
  const ration = market.body.shop.find((offer) => offer.itemId === "trail-ration");
  assert.ok(ration);
  assert.equal(ration.definition.assetRef.file.endsWith(".png"), true);

  const bought = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/buy`, {
    method: "POST",
    body: {
      playerId: firstJoin.player.id,
      playerToken: firstJoin.session.playerToken,
      itemId: "trail-ration",
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(bought.status, 200);
  assert.equal(bought.body.room.round, started.body.room.round);
  assert.equal(bought.body.room.activePlayerId, firstJoin.player.id);
  assert.equal(bought.body.room.transcript.at(-1).economy.action, "buy");
  assert.equal(bought.body.room.transcript.at(-1).economy.turnCost, "free-time");

  const buyer = bought.body.room.players.find((player) => player.id === firstJoin.player.id);
  const purchasedRation = buyer.character.inventory.find((item) => item.itemId === "trail-ration" && item.source === "shop");
  assert.ok(purchasedRation);

  const used = await api(baseUrl, `/api/rooms/${created.body.room.id}/items/use`, {
    method: "POST",
    body: {
      playerId: firstJoin.player.id,
      playerToken: firstJoin.session.playerToken,
      itemId: purchasedRation.id,
      expectedVersion: bought.body.room.version
    }
  });
  assert.equal(used.status, 200);
  assert.equal(used.body.room.round, started.body.room.round);
  assert.equal(used.body.room.activePlayerId, firstJoin.player.id);
  assert.equal(used.body.room.transcript.at(-1).inventory.action, "use");
  assert.equal(used.body.room.transcript.at(-1).inventory.consumed, true);

  const afterUsePlayer = used.body.room.players.find((player) => player.id === firstJoin.player.id);
  const staff = afterUsePlayer.character.inventory.find((item) => item.itemId === "staff");
  assert.ok(staff);
  const equipped = await api(baseUrl, `/api/rooms/${created.body.room.id}/items/equip`, {
    method: "POST",
    body: {
      playerId: firstJoin.player.id,
      playerToken: firstJoin.session.playerToken,
      itemId: staff.id,
      expectedVersion: used.body.room.version
    }
  });
  assert.equal(equipped.status, 200);
  assert.equal(equipped.body.room.players.find((player) => player.id === firstJoin.player.id).character.equipmentSummary.slots.mainHand.item.itemId, "staff");
  assert.equal(equipped.body.room.transcript.at(-1).inventory.action, "equip");

  const travelLamp = equipped.body.room.players
    .find((player) => player.id === firstJoin.player.id)
    .character.inventory.find((item) => item.itemId === "travel-lamp");
  assert.ok(travelLamp);
  const sold = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/sell`, {
    method: "POST",
    body: {
      playerId: firstJoin.player.id,
      playerToken: firstJoin.session.playerToken,
      itemId: travelLamp.id,
      expectedVersion: equipped.body.room.version
    }
  });
  assert.equal(sold.status, 200);
  assert.equal(sold.body.room.round, started.body.room.round);
  assert.equal(sold.body.room.activePlayerId, firstJoin.player.id);
  assert.equal(sold.body.room.transcript.at(-1).economy.action, "sell");
  assert.equal(sold.body.room.transcript.at(-1).economy.turnCost, "free-time");

  const chatted = await api(baseUrl, `/api/rooms/${created.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: secondJoin.player.id,
      playerToken: secondJoin.session.playerToken,
      text: "I keep watch while Asha checks the west stair.",
      channel: "party",
      expectedVersion: sold.body.room.version
    }
  });
  assert.equal(chatted.status, 200);
  assert.equal(chatted.body.room.round, started.body.room.round);
  assert.equal(chatted.body.room.activePlayerId, firstJoin.player.id);
  assert.equal(chatted.body.room.transcript.at(-1).type, "chat");
  assert.equal(chatted.body.room.transcript.at(-1).visibility.scope, "faction");

  const acted = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: firstJoin.player.id,
      playerToken: firstJoin.session.playerToken,
      text: "carefully inspect the west stair for the silver ledger",
      mode: "advantage",
      expectedVersion: chatted.body.room.version
    }
  });
  assert.equal(acted.status, 200);
  assert.equal(acted.body.room.activePlayerId, secondJoin.player.id);
  assert.equal(acted.body.room.transcript.some((entry) => entry.type === "roll"), true);
  assert.equal(acted.body.room.memories.length >= 1, true);
  assert.equal(acted.body.room.mediaLogs.some((entry) => entry.type === "asset.selection"), true);
  assert.equal(acted.body.room.stateSummary.scene.location.length > 0, true);

  const secondActed = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: secondJoin.player.id,
      playerToken: secondJoin.session.playerToken,
      text: "help Asha map the exit and cover the party retreat",
      mode: "normal",
      expectedVersion: acted.body.room.version
    }
  });
  assert.equal(secondActed.status, 200);
  assert.equal(secondActed.body.room.activePlayerId, firstJoin.player.id);
  assert.equal(secondActed.body.room.round, 2);

  const replay = await api(baseUrl, `/api/rooms/${created.body.room.id}/replay`);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replay.highlights.length >= 1, true);
  assert.match(replay.body.replay.shareText, /Release Gate Loop/);
});

test("deterministic engine flow switches scene, turn owner, weathered soundscape, and replay", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Deterministic Release Loop", language: "en" });
    const first = await engine.joinRoom(room.id, {
      playerName: "Asha",
      characterName: "Asha",
      classId: "mage",
      playerToken: "asha-token"
    });
    const second = await engine.joinRoom(room.id, {
      playerName: "Brann",
      characterName: "Brann",
      classId: "rogue",
      playerToken: "brann-token"
    });
    const started = await engine.startRoom(room.id);

    const clue = await engine.submitAction(room.id, {
      playerId: first.player.id,
      playerToken: "asha-token",
      text: "carefully inspect the archive coffer for ledger clues",
      mode: "advantage",
      expectedVersion: started.version
    });
    assert.equal(clue.activePlayerId, second.player.id);
    assert.equal(clue.scene.clocks.clues >= 1, true);
    assert.equal(clue.memories.length >= 1, true);

    const shifted = await engine.submitAction(room.id, {
      playerId: second.player.id,
      playerToken: "brann-token",
      text: "follow the old forest trail toward insect lights",
      mode: "advantage",
      expectedVersion: clue.version
    });
    assert.equal(shifted.activePlayerId, first.player.id);
    assert.equal(shifted.round, 2);
    assert.equal(shifted.scene.location, "Misty forest path");
    assert.equal(shifted.scene.lastShiftReason, "forest-action");

    const weatheredSoundscape = chooseSoundscape({
      ...shifted,
      scene: {
        ...shifted.scene,
        weather: "light rain",
        ambience: `${shifted.scene.ambience}, light rain on leaves`
      }
    });
    assert.equal(weatheredSoundscape.id, "forest");
    assert.equal(weatheredSoundscape.layers.some((layer) => layer.profile === "nature.forest-leaves"), true);
    assert.equal(weatheredSoundscape.layers.some((layer) => layer.profile === "rain.light"), true);
    assert.equal(weatheredSoundscape.profile.weather.includes("light-rain"), true);

    const replay = await engine.getReplay(room.id);
    assert.equal(replay.highlights.length >= 2, true);
    assert.match(replay.shareText, /Deterministic Release Loop/);
  } finally {
    Math.random = originalRandom;
  }
});

async function joinRoom(baseUrl, roomId, body) {
  const result = await api(baseUrl, `/api/rooms/${roomId}/join`, {
    method: "POST",
    body
  });
  assert.equal(result.status, 200);
  return {
    room: result.body.room,
    player: result.body.player,
    session: result.body.session
  };
}

async function assertStatic(baseUrl, path, expectedType) {
  const response = await fetch(`${baseUrl}${path}`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", new RegExp(expectedType));
  assert.equal((await response.text()).length > 0, true);
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

async function startServer(t) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-release-gate-"));
  const port = await availablePort();
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
    }, 5000);

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
  const port = server.address().port;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}
