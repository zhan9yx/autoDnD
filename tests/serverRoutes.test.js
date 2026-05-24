import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, writeFile } from "node:fs/promises";
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

test("auth routes keep session state and let users own password rooms", async (t) => {
  const { baseUrl, dataFile } = await startServer(t);

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "host@example.test",
      password: "local-pass",
      displayName: "Host Prime"
    }
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.email, "host@example.test");
  assert.equal(registered.body.user.displayName, "Host Prime");
  assert.ok(registered.body.session.sessionToken);
  assert.equal(JSON.stringify(registered.body).includes("passwordHash"), false);

  const duplicate = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "HOST@example.test",
      password: "local-pass"
    }
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.code, "USER_EXISTS");

  const badLogin = await api(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email: "host@example.test",
      password: "wrong-pass"
    }
  });
  assert.equal(badLogin.status, 401);
  assert.equal(badLogin.body.code, "INVALID_CREDENTIALS");

  const sessionToken = registered.body.session.sessionToken;
  const current = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(current.status, 200);
  assert.equal(current.body.user.id, registered.body.user.id);
  assert.equal(current.body.session.userId, registered.body.user.id);
  assert.equal(current.body.session.sessionToken, undefined);

  const login = await api(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email: "host@example.test",
      password: "local-pass"
    }
  });
  assert.equal(login.status, 200);
  assert.notEqual(login.body.session.sessionToken, sessionToken);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { "X-AIDM-Session-Token": sessionToken },
    body: {
      title: "Password Room",
      accessMode: "password",
      roomPassword: "swordfish"
    }
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.room.ownerUserId, registered.body.user.id);
  assert.equal(created.body.room.host.userId, registered.body.user.id);
  assert.equal(created.body.room.host.name, "Host Prime");
  assert.deepEqual(created.body.room.access, {
    mode: "password",
    passwordProtected: true,
    hostApprovalRequired: false,
    pendingCount: 0
  });
  assert.equal(created.body.room.auth, undefined);
  assert.equal(JSON.stringify(created.body.room).includes("swordfish"), false);

  const persistedAuth = JSON.parse(await readFile(dataFile, "utf8"));
  const persistedUser = persistedAuth.users.find((user) => user.email === "host@example.test");
  const persistedSession = persistedAuth.sessions.find((session) => session.userId === registered.body.user.id);
  const persistedRoom = persistedAuth.rooms.find((room) => room.id === created.body.room.id);
  assert.match(persistedUser.passwordHash, /^scrypt-v1\$/);
  assert.match(persistedSession.tokenHash, /^scrypt-session-v1\$/);
  assert.match(persistedRoom.auth.roomPasswordHash, /^scrypt-v1\$/);
  assert.equal(JSON.stringify(persistedAuth).includes("local-pass"), false);
  assert.equal(JSON.stringify(persistedAuth).includes("swordfish"), false);
  assert.equal(JSON.stringify(persistedAuth).includes(sessionToken), false);

  const listed = await api(baseUrl, "/api/rooms");
  assert.equal(listed.status, 200);
  const listedRoom = listed.body.rooms.find((room) => room.id === created.body.room.id);
  assert.equal(listedRoom.ownerUserId, registered.body.user.id);
  assert.equal(listedRoom.access.mode, "password");

  const missingPassword = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira"
    }
  });
  assert.equal(missingPassword.status, 403);
  assert.equal(missingPassword.body.code, "ROOM_PASSWORD_REQUIRED");

  const wrongPassword = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira",
      roomPassword: "wrong"
    }
  });
  assert.equal(wrongPassword.status, 403);
  assert.equal(wrongPassword.body.code, "ROOM_PASSWORD_INVALID");

  const joined = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira",
      roomPassword: "swordfish"
    }
  });
  assert.equal(joined.status, 200);
  assert.ok(joined.body.player.id);
  assert.ok(joined.body.session.playerToken);

  const started = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(started.status, 200);
  assert.equal(started.body.room.phase, "scene");

  const logout = await api(baseUrl, "/api/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(logout.status, 200);
  assert.equal(logout.body.ok, true);

  const afterLogout = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(afterLogout.status, 401);
  assert.equal(afterLogout.body.code, "SESSION_INVALID");
});

test("auth storage migrates legacy SHA-256 password and session hashes after successful use", async (t) => {
  const legacyDir = await mkdtemp(join(tmpdir(), "aidm-legacy-auth-"));
  const dataFile = join(legacyDir, "rooms.json");
  const legacyEmail = "legacy-host@example.test";
  const legacyPassword = "legacy-pass";
  const legacySessionToken = "session_token_legacy_auth";
  const legacyPasswordHash = legacyPasswordDigest(legacyPassword, legacyEmail);
  const legacySessionHash = legacyTokenDigest(legacySessionToken);
  await writeFile(dataFile, JSON.stringify({
    rooms: [],
    users: [{
      id: "user_legacy_host",
      email: legacyEmail,
      displayName: "Legacy Host",
      passwordHash: legacyPasswordHash,
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z"
    }],
    sessions: [{
      id: "session_legacy_host",
      tokenHash: legacySessionHash,
      userId: "user_legacy_host",
      createdAt: "2026-05-01T00:00:00.000Z",
      lastSeenAt: "2026-05-01T00:00:00.000Z"
    }]
  }, null, 2));

  const { baseUrl } = await startServer(t, {
    env: { AIDM_DATA_FILE: dataFile }
  });

  const restoredSession = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${legacySessionToken}` }
  });
  assert.equal(restoredSession.status, 200);
  assert.equal(restoredSession.body.user.email, legacyEmail);

  const login = await api(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email: legacyEmail,
      password: legacyPassword
    }
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.session.sessionToken);

  const persisted = JSON.parse(await readFile(dataFile, "utf8"));
  const migratedUser = persisted.users.find((user) => user.id === "user_legacy_host");
  assert.match(migratedUser.passwordHash, /^scrypt-v1\$/);
  assert.notEqual(migratedUser.passwordHash, legacyPasswordHash);
  assert.ok(migratedUser.passwordHashUpgradedAt);
  assert.equal(persisted.sessions.some((session) => session.tokenHash === legacySessionHash), false);
  assert.equal(persisted.sessions.every((session) => /^scrypt-session-v1\$/.test(session.tokenHash)), true);
  assert.equal(JSON.stringify(persisted).includes(legacyPassword), false);
  assert.equal(JSON.stringify(persisted).includes(legacySessionToken), false);
});

test("protected room reads require host or approved member authorization and keep lobby public", async (t) => {
  const { baseUrl } = await startServer(t);

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "read-host@example.test",
      password: "local-pass",
      displayName: "Read Host"
    }
  });
  assert.equal(registered.status, 201);
  const sessionToken = registered.body.session.sessionToken;

  const querySession = await api(baseUrl, `/api/auth/session?sessionToken=${encodeURIComponent(sessionToken)}`);
  assert.equal(querySession.status, 401);
  assert.equal(querySession.body.code, "AUTH_REQUIRED");
  assertNoSensitiveKeys(querySession.body);
  assertNoSecretValues(querySession.body, [sessionToken]);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: {
      title: "Protected Read Room",
      accessMode: "password",
      roomPassword: "swordfish-p0"
    }
  });
  assert.equal(created.status, 201);
  assertNoSensitiveKeys(created.body.room);
  assertNoSecretValues(created.body.room, ["swordfish-p0", sessionToken]);

  const joined = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira",
      roomPassword: "swordfish-p0"
    }
  });
  assert.equal(joined.status, 200);
  const playerHeaders = {
    "X-AIDM-Player-Id": joined.body.player.id,
    "X-AIDM-Player-Token": joined.body.session.playerToken
  };

  const memoSecret = "hidden-lobby-memo-731";
  const memo = await api(baseUrl, `/api/rooms/${created.body.room.id}/memo`, {
    method: "POST",
    body: {
      playerId: joined.body.player.id,
      playerToken: joined.body.session.playerToken,
      text: memoSecret,
      expectedVersion: joined.body.room.version
    }
  });
  assert.equal(memo.status, 200);
  assert.equal(memo.body.room.memos[0].text, memoSecret);

  const forbiddenValues = ["swordfish-p0", memoSecret, sessionToken, joined.body.session.playerToken];
  const staleVersion = memo.body.room.version - 1;
  for (const staleWrite of [
    {
      path: `/api/rooms/${created.body.room.id}/action`,
      body: {
        playerId: joined.body.player.id,
        text: "try to force a stale action snapshot",
        expectedVersion: staleVersion
      }
    },
    {
      path: `/api/rooms/${created.body.room.id}/chat`,
      body: {
        playerId: joined.body.player.id,
        text: "try to force a stale chat snapshot",
        expectedVersion: staleVersion
      }
    },
    {
      path: `/api/rooms/${created.body.room.id}/memo`,
      body: {
        playerId: joined.body.player.id,
        text: "try to overwrite a memo without a token",
        expectedVersion: staleVersion
      }
    },
    {
      path: `/api/rooms/${created.body.room.id}/items/equip`,
      body: {
        playerId: joined.body.player.id,
        itemId: "missing-item",
        expectedVersion: staleVersion
      }
    },
    {
      path: `/api/rooms/${created.body.room.id}/items/use`,
      body: {
        playerId: joined.body.player.id,
        itemId: "missing-item",
        expectedVersion: staleVersion
      }
    },
    {
      path: `/api/rooms/${created.body.room.id}/market/buy`,
      body: {
        playerId: joined.body.player.id,
        itemId: "trail-ration",
        expectedVersion: staleVersion
      }
    },
    {
      path: `/api/rooms/${created.body.room.id}/market/sell`,
      body: {
        playerId: joined.body.player.id,
        itemId: "missing-item",
        expectedVersion: staleVersion
      }
    }
  ]) {
    const deniedWrite = await api(baseUrl, staleWrite.path, {
      method: "POST",
      body: staleWrite.body
    });
    assert.equal(deniedWrite.status, 403, staleWrite.path);
    assert.equal(deniedWrite.body.code, "PLAYER_TOKEN_REQUIRED", staleWrite.path);
    assert.equal(deniedWrite.body.room, undefined, staleWrite.path);
    assertNoSensitiveKeys(deniedWrite.body);
    assertNoSecretValues(deniedWrite.body, forbiddenValues);
  }

  const publicRoom = await api(baseUrl, `/api/rooms/${created.body.room.id}`);
  assert.equal(publicRoom.status, 200);
  assert.equal(publicRoom.body.room.id, created.body.room.id);
  assert.equal(publicRoom.body.room.playerCount, 1);
  assert.equal(publicRoom.body.room.access.mode, "password");
  assert.equal(publicRoom.body.room.players, undefined);
  assert.equal(publicRoom.body.room.memos, undefined);
  assert.equal(publicRoom.body.room.transcript, undefined);
  assert.equal(publicRoom.body.room.factions, undefined);
  assertNoSensitiveKeys(publicRoom.body);
  assertNoSecretValues(publicRoom.body, forbiddenValues);

  const deniedMarket = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`);
  assert.equal(deniedMarket.status, 403);
  assert.equal(deniedMarket.body.code, "ROOM_READ_FORBIDDEN");
  assertNoSensitiveKeys(deniedMarket.body);
  assertNoSecretValues(deniedMarket.body, forbiddenValues);

  const deniedReplay = await api(baseUrl, `/api/rooms/${created.body.room.id}/replay`);
  assert.equal(deniedReplay.status, 403);
  assert.equal(deniedReplay.body.code, "ROOM_READ_FORBIDDEN");
  assertNoSensitiveKeys(deniedReplay.body);
  assertNoSecretValues(deniedReplay.body, forbiddenValues);

  const deniedEvents = await api(baseUrl, `/api/rooms/${created.body.room.id}/events`);
  assert.equal(deniedEvents.status, 403);
  assert.equal(deniedEvents.body.code, "ROOM_READ_FORBIDDEN");
  assertNoSensitiveKeys(deniedEvents.body);
  assertNoSecretValues(deniedEvents.body, forbiddenValues);

  const hostRoom = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(hostRoom.status, 200);
  assert.equal(hostRoom.body.room.players.length, 1);
  assert.equal(hostRoom.body.room.memos[0].text, memoSecret);
  assertNoSensitiveKeys(hostRoom.body.room);
  assertNoSecretValues(hostRoom.body.room, ["swordfish-p0", sessionToken, joined.body.session.playerToken]);

  const memberMarket = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`, {
    headers: playerHeaders
  });
  assert.equal(memberMarket.status, 200);
  assert.equal(memberMarket.body.room.players.length, 1);
  assert.equal(memberMarket.body.room.memos[0].text, memoSecret);
  assertNoSensitiveKeys(memberMarket.body.room);
  assertNoSecretValues(memberMarket.body.room, ["swordfish-p0", sessionToken, joined.body.session.playerToken]);

  const hostReplay = await api(baseUrl, `/api/rooms/${created.body.room.id}/replay`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(hostReplay.status, 200);
  assertNoSensitiveKeys(hostReplay.body);
  assertNoSecretValues(hostReplay.body, ["swordfish-p0", sessionToken, joined.body.session.playerToken]);

  const memberEvents = await readSseEvent(baseUrl, `/api/rooms/${created.body.room.id}/events`, {
    headers: playerHeaders
  });
  assert.equal(memberEvents.status, 200);
  assert.match(memberEvents.text, /event: snapshot/);
  assert.match(memberEvents.text, new RegExp(memoSecret));
  assertNoSecretValues(memberEvents.text, ["swordfish-p0", sessionToken, joined.body.session.playerToken]);
});

test("authorized player room views redact other players' private memos while host keeps full notes", async (t) => {
  const { baseUrl } = await startServer(t);

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "memo-host@example.test",
      password: "local-pass",
      displayName: "Memo Host"
    }
  });
  assert.equal(registered.status, 201);
  const sessionToken = registered.body.session.sessionToken;

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: {
      title: "Private Memo Room",
      accessMode: "host-approval"
    }
  });
  assert.equal(created.status, 201);

  const firstPending = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Asha",
      characterName: "Asha"
    }
  });
  assert.equal(firstPending.status, 200);
  const firstApproved = await api(baseUrl, `/api/rooms/${created.body.room.id}/pending/${firstPending.body.pendingPlayer.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(firstApproved.status, 200);

  const secondPending = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Brann",
      characterName: "Brann"
    }
  });
  assert.equal(secondPending.status, 200);
  const secondApproved = await api(baseUrl, `/api/rooms/${created.body.room.id}/pending/${secondPending.body.pendingPlayer.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(secondApproved.status, 200);

  const firstSecret = "ag-first-owner-private-memo";
  const secondSecret = "ag-second-owner-private-memo";
  const firstHeaders = {
    "X-AIDM-Player-Id": firstApproved.body.player.id,
    "X-AIDM-Player-Token": firstPending.body.session.playerToken
  };
  const secondHeaders = {
    "X-AIDM-Player-Id": secondApproved.body.player.id,
    "X-AIDM-Player-Token": secondPending.body.session.playerToken
  };

  const firstMemo = await api(baseUrl, `/api/rooms/${created.body.room.id}/memo`, {
    method: "POST",
    body: {
      playerId: firstApproved.body.player.id,
      playerToken: firstPending.body.session.playerToken,
      text: firstSecret,
      expectedVersion: secondApproved.body.room.version
    }
  });
  assert.equal(firstMemo.status, 200);
  assert.equal(firstMemo.body.room.players.find((player) => player.id === firstApproved.body.player.id).character.memo, firstSecret);
  assert.equal(firstMemo.body.room.players.find((player) => player.id === secondApproved.body.player.id).character.memo, "");
  assert.deepEqual(firstMemo.body.room.memos.map((entry) => entry.text), [firstSecret]);

  const secondMemo = await api(baseUrl, `/api/rooms/${created.body.room.id}/memo`, {
    method: "POST",
    body: {
      playerId: secondApproved.body.player.id,
      playerToken: secondPending.body.session.playerToken,
      text: secondSecret,
      expectedVersion: firstMemo.body.room.version
    }
  });
  assert.equal(secondMemo.status, 200);
  assert.equal(secondMemo.body.room.players.find((player) => player.id === firstApproved.body.player.id).character.memo, "");
  assert.equal(secondMemo.body.room.players.find((player) => player.id === secondApproved.body.player.id).character.memo, secondSecret);
  assert.deepEqual(secondMemo.body.room.memos.map((entry) => entry.text), [secondSecret]);
  assertNoSecretValues(secondMemo.body.room, [firstSecret]);

  const hostRoom = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(hostRoom.status, 200);
  assert.equal(hostRoom.body.room.players.find((player) => player.id === firstApproved.body.player.id).character.memo, firstSecret);
  assert.equal(hostRoom.body.room.players.find((player) => player.id === secondApproved.body.player.id).character.memo, secondSecret);
  assert.deepEqual(hostRoom.body.room.memos.map((entry) => entry.text).sort(), [firstSecret, secondSecret].sort());

  const firstRoom = await api(baseUrl, `/api/rooms/${created.body.room.id}`, { headers: firstHeaders });
  assert.equal(firstRoom.status, 200);
  assert.equal(firstRoom.body.room.players.find((player) => player.id === firstApproved.body.player.id).character.memo, firstSecret);
  assert.equal(firstRoom.body.room.players.find((player) => player.id === secondApproved.body.player.id).character.memo, "");
  assert.deepEqual(firstRoom.body.room.memos.map((entry) => entry.text), [firstSecret]);
  assertNoSecretValues(firstRoom.body.room, [secondSecret]);

  const secondMarket = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`, { headers: secondHeaders });
  assert.equal(secondMarket.status, 200);
  assert.equal(secondMarket.body.room.players.find((player) => player.id === firstApproved.body.player.id).character.memo, "");
  assert.equal(secondMarket.body.room.players.find((player) => player.id === secondApproved.body.player.id).character.memo, secondSecret);
  assert.deepEqual(secondMarket.body.room.memos.map((entry) => entry.text), [secondSecret]);
  assertNoSecretValues(secondMarket.body.room, [firstSecret]);

  const staleChat = await api(baseUrl, `/api/rooms/${created.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: firstApproved.body.player.id,
      playerToken: firstPending.body.session.playerToken,
      text: "stale but authorized",
      expectedVersion: firstMemo.body.room.version
    }
  });
  assert.equal(staleChat.status, 409);
  assert.equal(staleChat.body.code, "VERSION_CONFLICT");
  assert.equal(staleChat.body.room.players.find((player) => player.id === firstApproved.body.player.id).character.memo, firstSecret);
  assert.equal(staleChat.body.room.players.find((player) => player.id === secondApproved.body.player.id).character.memo, "");
  assert.deepEqual(staleChat.body.room.memos.map((entry) => entry.text), [firstSecret]);
  assertNoSecretValues(staleChat.body.room, [secondSecret]);

  const firstEvents = await readSseEvent(baseUrl, `/api/rooms/${created.body.room.id}/events`, {
    headers: firstHeaders
  });
  assert.equal(firstEvents.status, 200);
  assert.match(firstEvents.text, new RegExp(firstSecret));
  assert.doesNotMatch(firstEvents.text, new RegExp(secondSecret));

  const hostEvents = await readSseEvent(baseUrl, `/api/rooms/${created.body.room.id}/events`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(hostEvents.status, 200);
  assert.match(hostEvents.text, new RegExp(firstSecret));
  assert.match(hostEvents.text, new RegExp(secondSecret));

  const thirdPending = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Cira",
      characterName: "Cira"
    }
  });
  assert.equal(thirdPending.status, 200);
  const pendingRead = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: {
      "X-AIDM-Pending-Player-Id": thirdPending.body.pendingPlayer.id,
      "X-AIDM-Pending-Player-Token": thirdPending.body.session.playerToken
    }
  });
  assert.equal(pendingRead.status, 200);
  assert.equal(pendingRead.body.room.players, undefined);
  assert.equal(pendingRead.body.room.memos, undefined);
  assertNoSecretValues(pendingRead.body.room, [firstSecret, secondSecret]);

  const anonymousRoom = await api(baseUrl, `/api/rooms/${created.body.room.id}`);
  assert.equal(anonymousRoom.status, 200);
  assert.equal(anonymousRoom.body.room.players, undefined);
  assert.equal(anonymousRoom.body.room.memos, undefined);
  assertNoSecretValues(anonymousRoom.body.room, [firstSecret, secondSecret]);
});

test("host approval rooms keep players pending until a host decision", async (t) => {
  const { baseUrl } = await startServer(t);

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "approval-host@example.test",
      password: "local-pass",
      displayName: "Approval Host"
    }
  });
  assert.equal(registered.status, 201);
  const sessionToken = registered.body.session.sessionToken;

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: {
      title: "Approval Room",
      accessMode: "host approval"
    }
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.room.access.mode, "host-approval");
  assert.equal(created.body.room.access.hostApprovalRequired, true);

  const pendingJoin = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Nox",
      characterName: "Nox",
      classId: "rogue"
    }
  });
  assert.equal(pendingJoin.status, 200);
  assert.equal(pendingJoin.body.player, undefined);
  assert.equal(pendingJoin.body.pendingPlayer.status, "pending");
  assert.equal(pendingJoin.body.session.status, "pending");
  assert.equal(pendingJoin.body.session.pendingPlayerId, pendingJoin.body.pendingPlayer.id);
  assert.ok(pendingJoin.body.session.playerToken);
  assert.equal(pendingJoin.body.room.playerCount, 0);
  assert.equal(pendingJoin.body.room.players, undefined);
  assert.equal(pendingJoin.body.room.pendingPlayers.length, 1);
  assert.equal(pendingJoin.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);
  assert.equal(pendingJoin.body.room.pendingPlayers[0].status, "pending");
  assert.equal(pendingJoin.body.room.access.pendingCount, 1);

  const pendingRead = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: {
      "X-AIDM-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(pendingRead.status, 200);
  assert.equal(pendingRead.body.room.playerCount, 0);
  assert.equal(pendingRead.body.room.players, undefined);
  assert.equal(pendingRead.body.room.pendingPlayers.length, 1);
  assert.equal(pendingRead.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);

  const pendingReadViaPendingHeaders = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: {
      "X-AIDM-Pending-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Pending-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(pendingReadViaPendingHeaders.status, 200);
  assert.equal(pendingReadViaPendingHeaders.body.room.playerCount, 0);
  assert.equal(pendingReadViaPendingHeaders.body.room.players, undefined);
  assert.equal(pendingReadViaPendingHeaders.body.room.pendingPlayers.length, 1);
  assert.equal(pendingReadViaPendingHeaders.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);
  assertNoSensitiveKeys(pendingReadViaPendingHeaders.body);
  assertNoSecretValues(pendingReadViaPendingHeaders.body, [sessionToken, pendingJoin.body.session.playerToken]);

  const badPendingRead = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: {
      "X-AIDM-Pending-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Pending-Player-Token": "wrong-token"
    }
  });
  assert.equal(badPendingRead.status, 200);
  assert.equal(badPendingRead.body.room.playerCount, 0);
  assert.equal(badPendingRead.body.room.players, undefined);
  assert.equal(badPendingRead.body.room.pendingPlayers, undefined);
  assertNoSensitiveKeys(badPendingRead.body);
  assertNoSecretValues(badPendingRead.body, [sessionToken, pendingJoin.body.session.playerToken]);

  const deniedApprove = await api(baseUrl, `/api/rooms/${created.body.room.id}/pending/${pendingJoin.body.pendingPlayer.id}/approve`, {
    method: "POST"
  });
  assert.equal(deniedApprove.status, 403);
  assert.equal(deniedApprove.body.code, "HOST_TOKEN_REQUIRED");

  const approved = await api(baseUrl, `/api/rooms/${created.body.room.id}/pending/${pendingJoin.body.pendingPlayer.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.pendingPlayer.status, "approved");
  assert.equal(approved.body.player.id, pendingJoin.body.pendingPlayer.id);
  assert.equal(approved.body.room.players.length, 1);
  assert.equal(approved.body.room.turnOrder[0], pendingJoin.body.pendingPlayer.id);
  assert.equal(approved.body.room.access.pendingCount, 0);

  const approvedRead = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: {
      "X-AIDM-Player-Id": approved.body.player.id,
      "X-AIDM-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(approvedRead.status, 200);
  assert.equal(approvedRead.body.room.players.length, 1);

  const approvedReadViaPendingHeaders = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: {
      "X-AIDM-Pending-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Pending-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(approvedReadViaPendingHeaders.status, 200);
  assert.equal(approvedReadViaPendingHeaders.body.room.players.length, 1);
  assert.equal(approvedReadViaPendingHeaders.body.room.players[0].id, pendingJoin.body.pendingPlayer.id);
  assertNoSensitiveKeys(approvedReadViaPendingHeaders.body.room);
  assertNoSecretValues(approvedReadViaPendingHeaders.body.room, [sessionToken, pendingJoin.body.session.playerToken]);

  const approvedChat = await api(baseUrl, `/api/rooms/${created.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: approved.body.player.id,
      playerToken: pendingJoin.body.session.playerToken,
      text: "I am ready after approval.",
      expectedVersion: approved.body.room.version
    }
  });
  assert.equal(approvedChat.status, 200);
  assert.equal(approvedChat.body.room.transcript.at(-1).type, "chat");

  const secondPending = await api(baseUrl, `/api/rooms/${created.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Vale",
      characterName: "Vale"
    }
  });
  assert.equal(secondPending.status, 200);
  assert.equal(secondPending.body.pendingPlayer.status, "pending");
  assert.equal(secondPending.body.room.access.pendingCount, 1);

  const rejected = await api(baseUrl, `/api/rooms/${created.body.room.id}/pending/${secondPending.body.pendingPlayer.id}/reject`, {
    method: "POST",
    body: {
      hostToken: created.body.session.hostToken,
      reason: "full table"
    }
  });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.pendingPlayer.status, "rejected");
  assert.equal(rejected.body.pendingPlayer.reason, "full table");
  assert.equal(rejected.body.room.players.length, 1);
  assert.equal(rejected.body.room.access.pendingCount, 0);
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

async function readSseEvent(baseUrl, path, { headers = {} } = {}) {
  const controller = new AbortController();
  const response = await fetch(`${baseUrl}${path}`, {
    headers,
    signal: controller.signal
  });
  let text = "";
  if (response.body) {
    const reader = response.body.getReader();
    try {
      while (!text.includes("\n\n")) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        text += Buffer.from(value).toString("utf8");
      }
    } finally {
      await reader.cancel().catch(() => {});
      controller.abort();
    }
  }
  return { status: response.status, text };
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

function legacyPasswordDigest(password, salt) {
  return createHash("sha256").update(`aidm-local-auth:${salt}:${String(password)}`).digest("hex");
}

function legacyTokenDigest(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

async function startServer(t, options = {}) {
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-server-routes-"));
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
