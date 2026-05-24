import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { GameEngine } from "../src/core/gameEngine.js";
import { MemoryRoomStore } from "../src/core/storage.js";
import { chooseSoundscape } from "../src/core/soundscape.js";
import { buildTableStateSummary } from "../src/core/stateSummary.js";
import { buildRuleKnowledgeContext } from "../src/core/rules.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("API gameplay loop keeps room creation, seat binding, turn guidance, inventory, market, and logs closed", async (t) => {
  const { baseUrl } = await startServer(t);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: "Extended Closure API Loop",
      tone: "mystery",
      language: "en"
    }
  });
  assert.equal(created.status, 201);
  assert.ok(created.body.session.hostToken);
  assert.equal(created.body.room.phase, "lobby");
  assert.doesNotMatch(JSON.stringify(created.body.room), /host_token|player_token/i);

  const first = await joinRoom(baseUrl, created.body.room.id, {
    playerName: "Asha",
    characterName: "Asha",
    classId: "mage",
    stats: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 }
  });
  const second = await joinRoom(baseUrl, created.body.room.id, {
    playerName: "Brann",
    characterName: "Brann",
    classId: "rogue",
    stats: { body: 4, agility: 7, mind: 5, presence: 5, spirit: 3 }
  });
  assert.notEqual(first.session.playerToken, second.session.playerToken);
  assert.deepEqual(second.room.turnOrder, [first.player.id, second.player.id]);
  assert.equal(second.room.activePlayerId, first.player.id);

  const started = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    body: { hostToken: created.body.session.hostToken }
  });
  assert.equal(started.status, 200);
  assert.equal(started.body.room.phase, "scene");
  assert.equal(started.body.room.stateSummary.turn.activePlayer.characterName, "Asha");
  assert.match(started.body.room.stateSummary.turn.prompt.en, /Asha's turn/);
  assert.equal(started.body.room.stateSummary.turn.shouldCallout, true);
  assert.equal(started.body.room.stateSummary.turn.suggestions.length >= 2, true);

  const offTurn = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: second.player.id,
      playerToken: second.session.playerToken,
      text: "try to take the first action from the wrong seat",
      expectedVersion: started.body.room.version
    }
  });
  assert.equal(offTurn.status >= 400, true);
  assert.match(offTurn.body.error, /Asha/);

  const wrongToken = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: second.session.playerToken,
      text: "try to act with a copied token",
      expectedVersion: started.body.room.version
    }
  });
  assert.equal(wrongToken.status, 403);
  assert.equal(wrongToken.body.code, "PLAYER_TOKEN_REQUIRED");

  const market = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`);
  assert.equal(market.status, 200);
  assert.equal(market.body.room.activePlayerId, first.player.id);
  assert.equal(market.body.room.mediaLogs.some((entry) => entry.type === "soundscape.switch"), true);
  assert.equal(market.body.room.mediaLogs.some((entry) => entry.type === "asset.selection"), true);
  const draught = market.body.shop.find((offer) => offer.itemId === "healing-draught");
  assert.ok(draught);
  assert.equal(draught.definition.assetRef.file.endsWith(".png"), true);

  const bought = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/buy`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: first.session.playerToken,
      itemId: "healing-draught",
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(bought.status, 200);
  assert.equal(bought.body.room.round, started.body.room.round);
  assert.equal(bought.body.room.activePlayerId, first.player.id);
  assert.equal(bought.body.room.transcript.at(-1).economy.action, "buy");
  assert.equal(bought.body.room.transcript.at(-1).economy.turnCost, "free-time");
  const buyer = bought.body.room.players.find((player) => player.id === first.player.id);
  const purchasedDraught = buyer.character.inventory.find((item) => item.itemId === "healing-draught" && item.source === "shop");
  assert.ok(purchasedDraught);

  const used = await api(baseUrl, `/api/rooms/${created.body.room.id}/items/use`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: first.session.playerToken,
      itemId: purchasedDraught.id,
      expectedVersion: bought.body.room.version
    }
  });
  assert.equal(used.status, 200);
  assert.equal(used.body.room.round, started.body.room.round);
  assert.equal(used.body.room.activePlayerId, first.player.id);
  assert.equal(used.body.room.transcript.at(-1).inventory.action, "use");
  assert.equal(used.body.room.transcript.at(-1).inventory.consumed, true);

  const secondPlayerAfterUse = used.body.room.players.find((player) => player.id === second.player.id);
  const shortbow = secondPlayerAfterUse.character.inventory.find((item) => item.itemId === "shortbow");
  assert.ok(shortbow);
  const equipped = await api(baseUrl, `/api/rooms/${created.body.room.id}/items/equip`, {
    method: "POST",
    body: {
      playerId: second.player.id,
      playerToken: second.session.playerToken,
      itemId: shortbow.id,
      expectedVersion: used.body.room.version
    }
  });
  assert.equal(equipped.status, 200);
  assert.equal(equipped.body.room.round, started.body.room.round);
  assert.equal(equipped.body.room.activePlayerId, first.player.id);
  assert.equal(
    equipped.body.room.players.find((player) => player.id === second.player.id)
      .character.equipmentSummary.slots.mainHand.item.itemId,
    "shortbow"
  );

  const chatted = await api(baseUrl, `/api/rooms/${created.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: second.player.id,
      playerToken: second.session.playerToken,
      text: "I hold the exit and wait for Asha's signal.",
      channel: "party",
      expectedVersion: equipped.body.room.version
    }
  });
  assert.equal(chatted.status, 200);
  assert.equal(chatted.body.room.round, started.body.room.round);
  assert.equal(chatted.body.room.activePlayerId, first.player.id);
  assert.equal(chatted.body.room.transcript.at(-1).type, "chat");
  assert.equal(chatted.body.room.transcript.at(-1).visibility.scope, "faction");

  const firstActed = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: first.session.playerToken,
      text: "carefully inspect the archive coffer for rain-marked ledger clues",
      mode: "advantage",
      expectedVersion: chatted.body.room.version
    }
  });
  assert.equal(firstActed.status, 200);
  assert.equal(firstActed.body.room.activePlayerId, second.player.id);
  assert.equal(firstActed.body.room.stateSummary.turn.activePlayer.characterName, "Brann");
  assert.match(firstActed.body.room.stateSummary.turn.prompt.en, /Brann's turn/);
  assert.equal(firstActed.body.room.transcript.some((entry) => entry.type === "player"), true);
  assert.equal(firstActed.body.room.transcript.some((entry) => entry.type === "roll"), true);
  assert.equal(firstActed.body.room.transcript.some((entry) => entry.type === "gm"), true);

  const secondActed = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: second.player.id,
      playerToken: second.session.playerToken,
      text: "map the exit route and cover the party retreat",
      mode: "normal",
      expectedVersion: firstActed.body.room.version
    }
  });
  assert.equal(secondActed.status, 200);
  assert.equal(secondActed.body.room.activePlayerId, first.player.id);
  assert.equal(secondActed.body.room.round, 2);
  assert.equal(secondActed.body.room.stateSummary.turn.activePlayer.characterName, "Asha");
  assert.equal(secondActed.body.room.stateSummary.control.latestMutation !== "none", true);

  const replay = await api(baseUrl, `/api/rooms/${created.body.room.id}/replay`);
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replay.highlights.length >= 1, true);
  assert.match(replay.body.replay.shareText, /Extended Closure API Loop/);
});

test("deterministic engine loop closes scene switching, weather, season, soundscape, event state, and AI DM randomness", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Extended Deterministic Loop", language: "en" });
    const first = await engine.joinRoom(room.id, {
      playerName: "Asha",
      characterName: "Asha",
      classId: "mage",
      playerToken: "asha-token",
      stats: { body: 3, agility: 5, mind: 7, presence: 5, spirit: 7 }
    });
    const second = await engine.joinRoom(room.id, {
      playerName: "Brann",
      characterName: "Brann",
      classId: "rogue",
      playerToken: "brann-token",
      stats: { body: 4, agility: 7, mind: 5, presence: 5, spirit: 3 }
    });
    const started = await engine.startRoom(room.id);

    const clue = await engine.submitAction(room.id, {
      playerId: first.player.id,
      playerToken: "asha-token",
      text: "carefully inspect the archive stairs for old forest ledger tracks",
      mode: "advantage",
      expectedVersion: started.version
    });
    assert.equal(clue.activePlayerId, second.player.id);
    assert.equal(clue.scene.clocks.clues >= 1, true);
    assert.equal(clue.scene.recentClues.length >= 1, true);
    assert.equal(clue.scene.lastEvolutionReason, "clue-progress");

    const shifted = await engine.submitAction(room.id, {
      playerId: second.player.id,
      playerToken: "brann-token",
      text: "follow the old forest trail through spring drizzle toward insect lights",
      mode: "advantage",
      expectedVersion: clue.version
    });
    assert.equal(shifted.round, 2);
    assert.equal(shifted.activePlayerId, first.player.id);
    assert.equal(shifted.scene.location, "Misty forest path");
    assert.equal(shifted.scene.lastShiftReason, "forest-action");
    assert.equal(shifted.scene.weatherState, "light rain");
    assert.equal(shifted.scene.season, "spring");
    assert.equal(shifted.scene.atmosphere.soundscapeTags.includes("location:forest"), true);
    assert.equal(shifted.scene.atmosphere.soundscapeTags.includes("weather:light-rain"), true);
    assert.equal(shifted.scene.atmosphere.soundscapeTags.includes("season:spring"), true);

    const soundscape = chooseSoundscape(shifted);
    assert.equal(soundscape.id, "forest");
    assert.equal(soundscape.layers.some((layer) => layer.profile === "nature.forest-leaves"), true);
    assert.equal(soundscape.layers.some((layer) => layer.profile === "rain.light"), true);
    assert.equal(soundscape.layers.some((layer) => layer.profile === "nature.spring-birds"), true);

    const summary = buildTableStateSummary(shifted, { soundscape });
    assert.equal(summary.turn.activePlayer.characterName, "Asha");
    assert.match(summary.turn.prompt.en, /Asha's turn/);
    assert.equal(summary.scene.environment.weather, "light rain");
    assert.equal(summary.scene.environment.season, "spring");
    assert.equal(summary.scene.lastShiftReason, "forest-action");
    assert.equal(summary.media.soundscapeId, "forest");
    assert.notEqual(summary.progress.sceneChange, "none");
    assert.equal(summary.memory.count >= 2, true);
    assert.equal(summary.review.flags.includes("chat-only"), false);

    const playerEvents = shifted.transcript.filter((entry) => entry.type === "player");
    const rollEvents = shifted.transcript.filter((entry) => entry.type === "roll");
    const gmEvents = shifted.transcript.filter((entry) => entry.type === "gm" && entry.author === "AIDM");
    assert.equal(playerEvents.length >= 2, true);
    assert.equal(rollEvents.length >= 2, true);
    assert.equal(gmEvents.length >= 3, true);
    assert.equal(shifted.director.knowledge.environment.weather, "rain");
    assert.equal(typeof shifted.director.knowledge.environment.season, "string");
    assert.equal(typeof shifted.director.knowledge.randomness.seed, "number");

    const check = { total: 19, dc: 12, success: true, margin: 7 };
    const sameA = buildRuleKnowledgeContext({
      room: shifted,
      scene: {
        ...shifted.scene,
        ambience: "spring blossoms, wet roots, and light rain under the canopy"
      },
      player: first.player,
      actionText: "inspect the wet root marks",
      check,
      beat: shifted.director.beat
    });
    const sameB = buildRuleKnowledgeContext({
      room: shifted,
      scene: {
        ...shifted.scene,
        ambience: "spring blossoms, wet roots, and light rain under the canopy"
      },
      player: first.player,
      actionText: "inspect the wet root marks",
      check,
      beat: shifted.director.beat
    });
    const varied = buildRuleKnowledgeContext({
      room: {
        ...shifted,
        scene: {
          ...shifted.scene,
          weatherState: "thunderstorm",
          season: "winter"
        }
      },
      player: first.player,
      actionText: "attack the barricade under thunder",
      check: { total: 7, dc: 15, success: false, margin: -8 },
      beat: "retaliation"
    });
    assert.equal(sameA.environment.weather, "rain");
    assert.equal(sameA.environment.season, "spring");
    assert.equal(sameA.randomness.seed, sameB.randomness.seed);
    assert.equal(sameA.randomness.selectedHook, sameB.randomness.selectedHook);
    assert.notEqual(sameA.randomness.seed, varied.randomness.seed);
    assert.notEqual(sameA.actionGuidance.intent, varied.actionGuidance.intent);
    assert.equal(varied.environment.weather, "storm");
    assert.equal(varied.environment.season, "winter");
    assert.equal(varied.promptDirectives.some((line) => /Randomness hook/.test(line)), true);
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

async function api(baseUrl, path, { method = "GET", body = null } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null
  };
}

async function startServer(t) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-flow-closure-"));
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
