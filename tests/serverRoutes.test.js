import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("server static errors distinguish missing and permission-denied files while GET health remains authoritative", async (t) => {
  const { baseUrl } = await startServer(t);

  const health = await api(baseUrl, "/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const headHealth = await fetch(`${baseUrl}/api/health`, { method: "HEAD" });
  assert.equal(headHealth.status, 404);

  const missing = await api(baseUrl, "/missing-static-file.js");
  assert.equal(missing.status, 404);
  assert.equal(missing.body.code, "STATIC_NOT_FOUND");

  const deniedRoot = await mkdtemp(join(tmpdir(), "aidm-denied-public-"));
  const deniedFile = join(deniedRoot, "blocked.js");
  await writeFile(deniedFile, "console.log('blocked');");
  await chmod(deniedFile, 0o000);
  t.after(async () => {
    await chmod(deniedFile, 0o600).catch(() => {});
  });

  const deniedServer = await startServer(t, {
    env: {
      AIDM_PUBLIC_DIR: deniedRoot
    }
  });
  const denied = await api(deniedServer.baseUrl, "/blocked.js");
  assert.equal(denied.status, 403);
  assert.equal(denied.body.code, "STATIC_PERMISSION_DENIED");
  assert.doesNotMatch(JSON.stringify(denied.body), /aidm-denied-public/);
});

test("server routes expose market, buy, sell, memo, and item-use flows", async (t) => {
  const { baseUrl } = await startServer(t);

  const table = await createJoinedRoom(baseUrl, "Route Inventory");
  const market = await api(baseUrl, `/api/rooms/${table.roomId}/market`);
  assert.equal(market.status, 200);
  const soundscapeLog = market.body.room.mediaLogs.find((entry) => entry.type === "soundscape.switch");
  const assetLog = market.body.room.mediaLogs.find((entry) => entry.type === "asset.selection");
  assert.ok(soundscapeLog);
  assert.ok(assetLog);
  assert.equal(soundscapeLog.category, "soundscape");
  assert.equal(soundscapeLog.action, "switch");
  assert.equal(soundscapeLog.messageKey, "soundscape.switch");
  assert.match(soundscapeLog.template.zh, /音景切换/);
  assert.equal(assetLog.category, "asset");
  assert.equal(assetLog.action, "select");
  assert.equal(assetLog.messageKey, "asset.selection");
  assert.equal(typeof assetLog.result, "string");

  const stormLantern = market.body.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.ok(stormLantern);
  assert.equal(stormLantern.definition.label, "Storm Lantern");
  assert.equal(stormLantern.conditionLabel, "Fine");
  assert.equal(stormLantern.priceLabel, `${stormLantern.price} CR`);
  assert.equal(stormLantern.quantity, 1);
  assert.equal(stormLantern.stock, stormLantern.quantity);
  assert.equal(stormLantern.availableQuantity, stormLantern.quantity);

  const rejectedBuyToken = await api(baseUrl, `/api/rooms/${table.roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: "wrong-token",
      itemId: "storm-lantern",
      expectedVersion: market.body.room.version,
      turnCost: "turn"
    }
  });
  assert.equal(rejectedBuyToken.status, 403);
  assert.equal(rejectedBuyToken.body.code, "PLAYER_TOKEN_REQUIRED");

  const bought = await api(baseUrl, `/api/rooms/${table.roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: "storm-lantern",
      expectedVersion: market.body.room.version,
      turnCost: "turn"
    }
  });
  assert.equal(bought.status, 200);
  assert.equal(bought.body.room.round, market.body.room.round);
  assert.equal(bought.body.room.activePlayerId, market.body.room.activePlayerId);
  assert.ok(bought.body.room.version > market.body.room.version);

  const buyer = bought.body.room.players.find((player) => player.id === table.playerId);
  const purchased = buyer.character.inventory.find((entry) => entry.itemId === "storm-lantern" && entry.source === "shop");
  assert.ok(purchased);
  assert.equal(buyer.character.wallet, 120 - stormLantern.price);
  assert.equal(bought.body.room.transcript.at(-1).type, "economy");
  assert.equal(bought.body.room.transcript.at(-1).economy.action, "buy");
  assert.equal(bought.body.room.transcript.at(-1).economy.turnCost, "free-time");
  assert.equal(bought.body.room.transcript.at(-1).economy.price, stormLantern.price);
  assert.equal(bought.body.room.transcript.at(-1).economy.priceLabel, `${stormLantern.price} CR`);
  assert.deepEqual(bought.body.room.transcript.at(-1).economy.stateDeltas.inventory, [{
    id: purchased.id,
    itemId: "storm-lantern",
    quantityDelta: 1
  }]);
  assert.deepEqual(bought.body.room.transcript.at(-1).economy.stateDeltas.stock, [{
    itemId: "storm-lantern",
    quantityDelta: -1
  }]);

  const marketAfterBuy = await api(baseUrl, `/api/rooms/${table.roomId}/market`);
  assert.equal(marketAfterBuy.status, 200);
  const stormLanternAfterBuy = marketAfterBuy.body.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.equal(stormLanternAfterBuy.quantity, stormLantern.quantity);
  assert.equal(stormLanternAfterBuy.stock, stormLantern.stock);
  assert.equal(stormLanternAfterBuy.availableQuantity, stormLantern.availableQuantity);

  const rejectedSellToken = await api(baseUrl, `/api/rooms/${table.roomId}/market/sell`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: "wrong-token",
      itemId: purchased.id,
      expectedVersion: bought.body.room.version,
      turnCost: "turn"
    }
  });
  assert.equal(rejectedSellToken.status, 403);
  assert.equal(rejectedSellToken.body.code, "PLAYER_TOKEN_REQUIRED");

  const staleSell = await api(baseUrl, `/api/rooms/${table.roomId}/market/sell`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: purchased.id,
      expectedVersion: market.body.room.version,
      turnCost: "turn"
    }
  });
  assert.equal(staleSell.status, 409);
  assert.equal(staleSell.body.code, "VERSION_CONFLICT");
  assert.equal(staleSell.body.room.version, bought.body.room.version);

  const notebook = buyer.character.inventory.find((entry) => entry.itemId === "field-notebook");
  const rejectedSale = await api(baseUrl, `/api/rooms/${table.roomId}/market/sell`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: notebook.id,
      expectedVersion: bought.body.room.version
    }
  });
  assert.equal(rejectedSale.status >= 400, true);
  assert.match(rejectedSale.body.error, /cannot be traded/i);

  const sold = await api(baseUrl, `/api/rooms/${table.roomId}/market/sell`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: purchased.id,
      expectedVersion: bought.body.room.version,
      turnCost: "turn"
    }
  });
  assert.equal(sold.status, 200);
  assert.equal(sold.body.room.round, market.body.room.round);
  assert.equal(sold.body.room.activePlayerId, market.body.room.activePlayerId);
  assert.ok(sold.body.room.version > bought.body.room.version);
  const seller = sold.body.room.players.find((player) => player.id === table.playerId);
  const expectedPayout = Math.max(1, Math.floor(purchased.value * 0.55));
  assert.equal(seller.character.wallet, 120 - stormLantern.price + expectedPayout);
  assert.equal(seller.character.inventory.some((entry) => entry.id === purchased.id), false);
  assert.equal(sold.body.room.transcript.at(-1).economy.action, "sell");
  assert.equal(sold.body.room.transcript.at(-1).economy.turnCost, "free-time");
  assert.equal(sold.body.room.transcript.at(-1).economy.payout, expectedPayout);
  assert.equal(sold.body.room.transcript.at(-1).economy.payoutLabel, `${expectedPayout} CR`);
  assert.deepEqual(sold.body.room.transcript.at(-1).economy.stateDeltas.inventory, [{
    id: purchased.id,
    itemId: "storm-lantern",
    quantityDelta: -1
  }]);
  assert.deepEqual(sold.body.room.transcript.at(-1).economy.stateDeltas.stock, [{
    itemId: "storm-lantern",
    quantityDelta: 1
  }]);

  const marketAfterSell = await api(baseUrl, `/api/rooms/${table.roomId}/market`);
  assert.equal(marketAfterSell.status, 200);
  const stormLanternAfterSell = marketAfterSell.body.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.equal(stormLanternAfterSell.quantity, stormLantern.quantity);
  assert.equal(stormLanternAfterSell.stock, stormLantern.stock);
  assert.equal(stormLanternAfterSell.availableQuantity, stormLantern.availableQuantity);

  const memo = await api(baseUrl, `/api/rooms/${table.roomId}/memo`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      text: "  suspect ledger is hidden under the market stall  ",
      expectedVersion: sold.body.room.version
    }
  });
  assert.equal(memo.status, 200);
  const memoPlayer = memo.body.room.players.find((player) => player.id === table.playerId);
  assert.equal(memoPlayer.character.memo, "suspect ledger is hidden under the market stall");
  assert.equal(memo.body.room.memos[0].visibility, "owner");
  assert.deepEqual(memo.body.room.transcript.at(-1).memo, {
    action: "save",
    length: 47
  });

  const scrollTable = await createJoinedRoom(baseUrl, "Route Scroll");
  const scrollMarket = await api(baseUrl, `/api/rooms/${scrollTable.roomId}/market`);
  const boughtScroll = await api(baseUrl, `/api/rooms/${scrollTable.roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: scrollTable.playerId,
      playerToken: scrollTable.playerToken,
      itemId: "sleep-scroll",
      expectedVersion: scrollMarket.body.room.version
    }
  });
  assert.equal(boughtScroll.status, 200);
  const scrollBuyer = boughtScroll.body.room.players.find((player) => player.id === scrollTable.playerId);
  const scroll = scrollBuyer.character.inventory.find((entry) => entry.itemId === "sleep-scroll" && entry.source === "shop");
  assert.ok(scroll);

  const used = await api(baseUrl, `/api/rooms/${scrollTable.roomId}/items/use`, {
    method: "POST",
    body: {
      playerId: scrollTable.playerId,
      playerToken: scrollTable.playerToken,
      itemId: scroll.id,
      expectedVersion: boughtScroll.body.room.version
    }
  });
  assert.equal(used.status, 200);
  const scrollUser = used.body.room.players.find((player) => player.id === scrollTable.playerId);
  assert.equal(scrollUser.character.spells.includes("sleep"), true);
  assert.equal(scrollUser.character.inventory.some((entry) => entry.id === scroll.id), false);
  assert.equal(used.body.room.transcript.at(-1).type, "spell");
  assert.equal(used.body.room.transcript.at(-1).inventory.learnedSpell, "sleep");
  assert.equal(used.body.room.transcript.at(-1).inventory.consumed, true);
});

test("server routes keep repeated market buys and Chinese economy labels consistent", async (t) => {
  const { baseUrl } = await startServer(t);

  const table = await createJoinedRoom(baseUrl, "Route Market Zh", { language: "zh" });
  const market = await api(baseUrl, `/api/rooms/${table.roomId}/market`);
  assert.equal(market.status, 200);

  const spices = market.body.shop.find((entry) => entry.itemId === "sealed-spices");
  assert.ok(spices);
  assert.equal(spices.quantity, 2);
  assert.match(spices.priceLabel, / 克朗$/);
  assert.doesNotMatch(spices.priceLabel, /\bCR\b/);

  const firstBuy = await api(baseUrl, `/api/rooms/${table.roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: "sealed-spices",
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(firstBuy.status, 200);
  assert.equal(firstBuy.body.room.transcript.at(-1).economy.price, spices.price);
  assert.equal(firstBuy.body.room.transcript.at(-1).economy.priceLabel, spices.priceLabel);

  const secondBuy = await api(baseUrl, `/api/rooms/${table.roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: "sealed-spices",
      expectedVersion: firstBuy.body.room.version
    }
  });
  assert.equal(secondBuy.status, 200);

  const buyer = secondBuy.body.room.players.find((player) => player.id === table.playerId);
  const purchased = buyer.character.inventory.filter((entry) => entry.itemId === "sealed-spices" && entry.source === "shop");
  assert.equal(buyer.character.wallet, 120 - (spices.price * 2));
  assert.equal(purchased.length, 2);
  assert.equal(new Set(purchased.map((entry) => entry.id)).size, 2);
  assert.deepEqual(purchased.map((entry) => entry.quantity), [1, 1]);
  assert.equal(secondBuy.body.room.transcript.at(-1).economy.stateDeltas.wallet, -spices.price);
  assert.deepEqual(secondBuy.body.room.transcript.at(-1).economy.stateDeltas.inventory, [{
    id: purchased[1].id,
    itemId: "sealed-spices",
    quantityDelta: 1
  }]);

  const sold = await api(baseUrl, `/api/rooms/${table.roomId}/market/sell`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: purchased[0].id,
      expectedVersion: secondBuy.body.room.version
    }
  });
  assert.equal(sold.status, 200);

  const seller = sold.body.room.players.find((player) => player.id === table.playerId);
  const expectedPayout = Math.max(1, Math.floor(purchased[0].value * 0.55));
  assert.equal(seller.character.wallet, 120 - (spices.price * 2) + expectedPayout);
  assert.equal(seller.character.inventory.some((entry) => entry.id === purchased[0].id), false);
  assert.equal(seller.character.inventory.find((entry) => entry.id === purchased[1].id).quantity, 1);
  assert.equal(sold.body.room.transcript.at(-1).economy.payout, expectedPayout);
  assert.equal(sold.body.room.transcript.at(-1).economy.payoutLabel, `${expectedPayout} 克朗`);
  assert.match(sold.body.room.transcript.at(-1).text, /克朗/);

  const afterMarket = await api(baseUrl, `/api/rooms/${table.roomId}/market`);
  assert.equal(afterMarket.status, 200);
  const spicesAfterTrade = afterMarket.body.shop.find((entry) => entry.itemId === "sealed-spices");
  assert.equal(spicesAfterTrade.quantity, spices.quantity);
  assert.equal(spicesAfterTrade.stock, spices.stock);
  assert.equal(spicesAfterTrade.availableQuantity, spices.availableQuantity);
});

test("server route equips inventory items with token and version checks", async (t) => {
  const { baseUrl } = await startServer(t);

  const table = await createJoinedRoom(baseUrl, "Route Equip Zh", { language: "zh", classId: "rogue" });
  const beforeEquip = await api(baseUrl, `/api/rooms/${table.roomId}`);
  assert.equal(beforeEquip.status, 200);

  const player = beforeEquip.body.room.players.find((entry) => entry.id === table.playerId);
  const shortbow = player.character.inventory.find((entry) => entry.itemId === "shortbow");
  assert.ok(shortbow);

  const rejectedToken = await api(baseUrl, `/api/rooms/${table.roomId}/items/equip`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: "wrong-token",
      itemId: shortbow.id,
      expectedVersion: beforeEquip.body.room.version
    }
  });
  assert.equal(rejectedToken.status, 403);
  assert.equal(rejectedToken.body.code, "PLAYER_TOKEN_REQUIRED");

  const equipped = await api(baseUrl, `/api/rooms/${table.roomId}/items/equip`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: shortbow.id,
      expectedVersion: beforeEquip.body.room.version
    }
  });
  assert.equal(equipped.status, 200);

  const equippedPlayer = equipped.body.room.players.find((entry) => entry.id === table.playerId);
  const event = equipped.body.room.transcript.at(-1);
  assert.equal(equippedPlayer.character.equipmentSummary.slots.mainHand.item.itemId, "shortbow");
  assert.equal(equippedPlayer.character.equipmentSummary.slots.mainHand.item.id, shortbow.id);
  assert.equal(equippedPlayer.character.equipmentSummary.slots.mainHand.item.definition.label, "短弓");
  assert.equal(equippedPlayer.character.inventory.find((entry) => entry.id === shortbow.id).equipped, true);
  assert.equal(equippedPlayer.character.inventory.find((entry) => entry.itemId === "dagger").equipped, false);
  assert.equal(event.type, "inventory");
  assert.equal(event.inventory.action, "equip");
  assert.equal(event.inventory.equipment.slots.mainHand.item.id, shortbow.id);
  assert.equal(event.text, "Lio装备了短弓。");

  const stale = await api(baseUrl, `/api/rooms/${table.roomId}/items/equip`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: shortbow.id,
      expectedVersion: beforeEquip.body.room.version
    }
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.code, "VERSION_CONFLICT");
  assert.equal(stale.body.room.version, equipped.body.room.version);
});

test("server route keeps duplicate joins token-isolated and enforces active turn ownership", async (t) => {
  const { baseUrl } = await startServer(t);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: { title: "Duplicate Seat Ownership" }
  });
  assert.equal(created.status, 201);

  const firstJoin = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Yixuan",
      characterName: "Lio"
    }
  });
  assert.equal(firstJoin.status, 200);

  const duplicateJoin = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Yixuan",
      characterName: "Lio"
    }
  });
  assert.equal(duplicateJoin.status, 200);
  assert.equal(duplicateJoin.body.room.players.length, 2);
  assert.notEqual(duplicateJoin.body.room.players[0].id, duplicateJoin.body.room.players[1].id);
  assert.notEqual(firstJoin.body.session.playerToken, duplicateJoin.body.session.playerToken);
  assert.equal(duplicateJoin.body.room.activePlayerId, firstJoin.body.player.id);

  const duplicateId = duplicateJoin.body.player.id;
  const wrongSeatToken = await api(baseUrl, `/api/rooms/${created.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: duplicateId,
      playerToken: firstJoin.body.session.playerToken,
      text: "trying the duplicate seat",
      expectedVersion: duplicateJoin.body.room.version
    }
  });
  assert.equal(wrongSeatToken.status, 403);
  assert.equal(wrongSeatToken.body.code, "PLAYER_TOKEN_REQUIRED");

  const duplicateTurn = await api(baseUrl, `/api/rooms/${created.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: duplicateId,
      playerToken: duplicateJoin.body.session.playerToken,
      text: "I take the first action from the duplicate seat",
      expectedVersion: duplicateJoin.body.room.version
    }
  });
  assert.equal(duplicateTurn.status >= 400, true);
  assert.match(duplicateTurn.body.error, /Lio/);
});

async function createJoinedRoom(baseUrl, title, options = {}) {
  const { classId, ...roomOptions } = options;
  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: { title, ...roomOptions }
  });
  assert.equal(created.status, 201);

  const joined = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Yixuan",
      characterName: "Lio",
      ...(classId ? { classId } : {})
    }
  });
  assert.equal(joined.status, 200);

  return {
    roomId: created.body.room.id,
    playerId: joined.body.player.id,
    playerToken: joined.body.session.playerToken
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

async function startServer(t, options = {}) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-server-routes-"));
  const port = await availablePort();
  const { cwd = repoRoot, env = {} } = options;
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd,
    env: {
      ...process.env,
      ...env,
      PORT: String(port),
      AIDM_DATA_FILE: env.AIDM_DATA_FILE || join(tempDir, "rooms.json")
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
  const address = server.address();
  const port = address.port;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}
