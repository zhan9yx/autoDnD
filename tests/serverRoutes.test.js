import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

test("server routes expose market, buy, sell, memo, and item-use flows", async (t) => {
  const { baseUrl } = await startServer(t);

  const table = await createJoinedRoom(baseUrl, "Route Inventory");
  const market = await api(baseUrl, `/api/rooms/${table.roomId}/market`);
  assert.equal(market.status, 200);

  const stormLantern = market.body.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.ok(stormLantern);
  assert.equal(stormLantern.definition.label, "Storm Lantern");
  assert.equal(stormLantern.conditionLabel, "Fine");
  assert.equal(stormLantern.priceLabel, `${stormLantern.price} CR`);

  const bought = await api(baseUrl, `/api/rooms/${table.roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: table.playerId,
      playerToken: table.playerToken,
      itemId: "storm-lantern",
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(bought.status, 200);

  const buyer = bought.body.room.players.find((player) => player.id === table.playerId);
  const purchased = buyer.character.inventory.find((entry) => entry.itemId === "storm-lantern" && entry.source === "shop");
  assert.ok(purchased);
  assert.equal(buyer.character.wallet, 120 - stormLantern.price);
  assert.equal(bought.body.room.transcript.at(-1).type, "economy");
  assert.equal(bought.body.room.transcript.at(-1).economy.action, "buy");
  assert.equal(bought.body.room.transcript.at(-1).economy.price, stormLantern.price);

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
      expectedVersion: bought.body.room.version
    }
  });
  assert.equal(sold.status, 200);
  const seller = sold.body.room.players.find((player) => player.id === table.playerId);
  const expectedPayout = Math.max(1, Math.floor(purchased.value * 0.55));
  assert.equal(seller.character.wallet, 120 - stormLantern.price + expectedPayout);
  assert.equal(seller.character.inventory.some((entry) => entry.id === purchased.id), false);
  assert.equal(sold.body.room.transcript.at(-1).economy.action, "sell");
  assert.equal(sold.body.room.transcript.at(-1).economy.payout, expectedPayout);

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

async function createJoinedRoom(baseUrl, title) {
  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: { title }
  });
  assert.equal(created.status, 201);

  const joined = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Yixuan",
      characterName: "Lio"
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

async function startServer(t) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-server-routes-"));
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
  const address = server.address();
  const port = address.port;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}
