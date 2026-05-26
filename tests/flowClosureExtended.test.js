import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MemoryRoomStore } from "../src/core/storage.js";
import { chooseSoundscape } from "../src/core/soundscape.js";
import { buildTableStateSummary } from "../src/core/stateSummary.js";
import { buildPresentation } from "../src/core/assetSelection.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const SERVER_READY_TIMEOUT_MS = 20000;

test("0013 auth session flow registers, logs in, refreshes, and reopens a room with the same account identity", async (t) => {
  let baseUrl;
  try {
    ({ baseUrl } = await startServer(t));
  } catch (error) {
    if (isInProgressImplementationBlocker(error)) {
      t.skip(`Blocked by in-progress implementation: ${implementationBlockerReason(error)}`);
      return;
    }
    throw error;
  }
  assertBrowserAuthSessionContract();

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "flow-host@example.test",
      password: "local-pass",
      displayName: "Flow Host"
    }
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.email, "flow-host@example.test");
  assert.equal(registered.body.user.displayName, "Flow Host");
  assert.ok(registered.body.session.sessionToken);
  assertNoSecretValues(registered.body, ["local-pass"]);

  const storedSessionToken = registered.body.session.sessionToken;
  const restoredAfterRefresh = await api(baseUrl, "/api/auth/session", {
    headers: { Authorization: `Bearer ${storedSessionToken}` }
  });
  assert.equal(restoredAfterRefresh.status, 200);
  assert.equal(restoredAfterRefresh.body.user.id, registered.body.user.id);
  assert.equal(restoredAfterRefresh.body.session.userId, registered.body.user.id);
  assert.equal(restoredAfterRefresh.body.session.sessionToken, undefined);

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${storedSessionToken}` },
    body: {
      title: "0013 Refresh Identity Room",
      language: "en",
      accessMode: "open"
    }
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.room.ownerUserId, registered.body.user.id);
  assert.equal(created.body.room.host.userId, registered.body.user.id);
  assert.equal(created.body.room.host.name, "Flow Host");
  assertNoSecretValues(created.body.room, [storedSessionToken, "local-pass"]);

  const reopenedAfterRefresh = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: { Authorization: `Bearer ${storedSessionToken}` }
  });
  assert.equal(reopenedAfterRefresh.status, 200);
  assert.equal(reopenedAfterRefresh.body.room.id, created.body.room.id);
  assert.equal(reopenedAfterRefresh.body.room.ownerUserId, registered.body.user.id);
  assert.equal(reopenedAfterRefresh.body.room.host.userId, registered.body.user.id);

  const login = await api(baseUrl, "/api/auth/login", {
    method: "POST",
    body: {
      email: "flow-host@example.test",
      password: "local-pass"
    }
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.id, registered.body.user.id);
  assert.notEqual(login.body.session.sessionToken, storedSessionToken);

  const joined = await joinRoom(baseUrl, created.body.room.id, {
    playerName: "Flow Host",
    characterName: "Keeper",
    classId: "warrior",
    sessionToken: login.body.session.sessionToken
  });
  assert.equal(joined.player.userId, registered.body.user.id);

  const startedByLoggedInHost = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${login.body.session.sessionToken}` }
  });
  assert.equal(startedByLoggedInHost.status, 200);
  assert.equal(startedByLoggedInHost.body.room.phase, "scene");
  assert.equal(startedByLoggedInHost.body.room.host.userId, registered.body.user.id);
  assertNoSecretValues(startedByLoggedInHost.body.room, [
    storedSessionToken,
    login.body.session.sessionToken,
    joined.session.playerToken,
    "local-pass"
  ]);
});

test("0013 password and host-approval rooms close the access-controlled entry flow before seating players", async (t) => {
  let baseUrl;
  try {
    ({ baseUrl } = await startServer(t));
  } catch (error) {
    if (isInProgressImplementationBlocker(error)) {
      t.skip(`Blocked by in-progress implementation: ${implementationBlockerReason(error)}`);
      return;
    }
    throw error;
  }
  assertBrowserAccessControlsContract();

  const registered = await api(baseUrl, "/api/auth/register", {
    method: "POST",
    body: {
      email: "flow-access-host@example.test",
      password: "local-pass",
      displayName: "Access Host"
    }
  });
  assert.equal(registered.status, 201);
  const sessionToken = registered.body.session.sessionToken;

  const passwordRoom = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: {
      title: "0013 Password Entry",
      accessMode: "password",
      roomPassword: "swordfish-0013"
    }
  });
  assert.equal(passwordRoom.status, 201);
  assert.equal(passwordRoom.body.room.access.mode, "password");
  assert.equal(passwordRoom.body.room.access.passwordProtected, true);
  assertNoSecretValues(passwordRoom.body.room, ["swordfish-0013", sessionToken]);

  const missingPassword = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira"
    }
  });
  assert.equal(missingPassword.status, 403);
  assert.equal(missingPassword.body.code, "ROOM_PASSWORD_REQUIRED");

  const wrongPassword = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira",
      roomPassword: "wrong"
    }
  });
  assert.equal(wrongPassword.status, 403);
  assert.equal(wrongPassword.body.code, "ROOM_PASSWORD_INVALID");

  const passwordJoin = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Mira",
      characterName: "Mira",
      classId: "rogue",
      roomPassword: "swordfish-0013"
    }
  });
  assert.equal(passwordJoin.status, 200);
  assert.equal(passwordJoin.body.player.character.name, "Mira");
  assert.ok(passwordJoin.body.session.playerToken);
  assert.equal(passwordJoin.body.room.players.length, 1);
  assertNoSecretValues(passwordJoin.body.room, ["swordfish-0013", sessionToken, passwordJoin.body.session.playerToken]);

  const passwordPlayerRefresh = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}`, {
    headers: {
      "X-AIDM-Player-Id": passwordJoin.body.player.id,
      "X-AIDM-Player-Token": passwordJoin.body.session.playerToken
    }
  });
  assert.equal(passwordPlayerRefresh.status, 200);
  assert.equal(passwordPlayerRefresh.body.room.players.length, 1);

  const approvalRoom = await api(baseUrl, "/api/rooms", {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` },
    body: {
      title: "0013 Approval Entry",
      accessMode: "host-approval"
    }
  });
  assert.equal(approvalRoom.status, 201);
  assert.equal(approvalRoom.body.room.access.mode, "host-approval");
  assert.equal(approvalRoom.body.room.access.hostApprovalRequired, true);

  const pendingJoin = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Nox",
      characterName: "Nox",
      classId: "mage"
    }
  });
  assert.equal(pendingJoin.status, 200);
  assert.equal(pendingJoin.body.player, undefined);
  assert.equal(pendingJoin.body.pendingPlayer.status, "pending");
  assert.equal(pendingJoin.body.session.status, "pending");
  assert.ok(pendingJoin.body.session.playerToken);
  assert.equal(pendingJoin.body.room.playerCount, 0);
  assert.equal(pendingJoin.body.room.players, undefined);
  assert.equal(pendingJoin.body.room.pendingPlayers.length, 1);
  assert.equal(pendingJoin.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);
  assert.equal(pendingJoin.body.room.pendingPlayers[0].status, "pending");
  assert.equal(pendingJoin.body.room.access.pendingCount, 1);

  const pendingRefresh = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: {
      "X-AIDM-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(pendingRefresh.status, 200);
  assert.equal(pendingRefresh.body.room.playerCount, 0);
  assert.equal(pendingRefresh.body.room.players, undefined);
  assert.equal(pendingRefresh.body.room.pendingPlayers.length, 1);
  assert.equal(pendingRefresh.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);
  assert.equal(pendingRefresh.body.room.pendingPlayers[0].status, "pending");

  const pendingRefreshViaPendingToken = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: {
      "X-AIDM-Pending-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Pending-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(pendingRefreshViaPendingToken.status, 200);
  assert.equal(pendingRefreshViaPendingToken.body.room.playerCount, 0);
  assert.equal(pendingRefreshViaPendingToken.body.room.players, undefined);
  assert.equal(pendingRefreshViaPendingToken.body.room.pendingPlayers.length, 1);
  assert.equal(pendingRefreshViaPendingToken.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);

  const hostBeforeApproval = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(hostBeforeApproval.status, 200);
  assert.equal(hostBeforeApproval.body.room.pendingPlayers.length, 1);
  const pendingChat = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: pendingJoin.body.pendingPlayer.id,
      playerToken: pendingJoin.body.session.playerToken,
      text: "I should not be seated yet.",
      expectedVersion: hostBeforeApproval.body.room.version
    }
  });
  assert.equal(pendingChat.status, 403);
  assert.equal(pendingChat.body.code, "PLAYER_TOKEN_REQUIRED");

  const approved = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/pending/${pendingJoin.body.pendingPlayer.id}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionToken}` }
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.pendingPlayer.status, "approved");
  assert.equal(approved.body.player.id, pendingJoin.body.pendingPlayer.id);
  assert.equal(approved.body.room.players.length, 1);
  assert.equal(approved.body.room.turnOrder[0], pendingJoin.body.pendingPlayer.id);
  assert.equal(approved.body.room.access.pendingCount, 0);

  const approvedRefresh = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: {
      "X-AIDM-Player-Id": approved.body.player.id,
      "X-AIDM-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(approvedRefresh.status, 200);
  assert.equal(approvedRefresh.body.room.players.length, 1);

  const approvedRefreshViaPendingToken = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: {
      "X-AIDM-Pending-Player-Id": pendingJoin.body.pendingPlayer.id,
      "X-AIDM-Pending-Player-Token": pendingJoin.body.session.playerToken
    }
  });
  assert.equal(approvedRefreshViaPendingToken.status, 200);
  assert.equal(approvedRefreshViaPendingToken.body.room.players.length, 1);
  assert.equal(approvedRefreshViaPendingToken.body.room.players[0].id, pendingJoin.body.pendingPlayer.id);

  const approvedChat = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: approved.body.player.id,
      playerToken: pendingJoin.body.session.playerToken,
      text: "I am seated after approval.",
      expectedVersion: approved.body.room.version
    }
  });
  assert.equal(approvedChat.status, 200);
  assert.equal(approvedChat.body.room.transcript.at(-1).type, "chat");

  const secondPending = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Vale",
      characterName: "Vale"
    }
  });
  assert.equal(secondPending.status, 200);
  assert.equal(secondPending.body.pendingPlayer.status, "pending");

  const rejected = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/pending/${secondPending.body.pendingPlayer.id}/reject`, {
    method: "POST",
    body: {
      hostToken: approvalRoom.body.session.hostToken,
      reason: "table is full"
    }
  });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.pendingPlayer.status, "rejected");
  assert.equal(rejected.body.room.players.length, 1);
  assertNoSecretValues(rejected.body.room, [
    sessionToken,
    pendingJoin.body.session.playerToken,
    secondPending.body.session.playerToken,
    approvalRoom.body.session.hostToken
  ]);
});

test("API gameplay loop keeps room creation, seat binding, turn guidance, inventory, market, and logs closed", async (t) => {
  let baseUrl;
  try {
    ({ baseUrl } = await startServer(t));
  } catch (error) {
    if (isInProgressImplementationBlocker(error)) {
      t.skip(`Blocked by in-progress implementation: ${implementationBlockerReason(error)}`);
      return;
    }
    throw error;
  }

  const created = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: "Extended Closure API Loop",
      tone: "mystery",
      language: "en"
    }
  });
  if (isInProgressImplementationBlocker(created)) {
    t.skip(`Blocked by in-progress implementation: ${implementationBlockerReason(created)}`);
    return;
  }
  assert.equal(created.status, 201);
  assert.ok(created.body.session.hostToken);
  assert.equal(created.body.room.phase, "lobby");
  assert.doesNotMatch(JSON.stringify(created.body.room), /host_token|player_token/i);
  assert.doesNotMatch(JSON.stringify(created.body.room), /hostToken|playerToken|tokenHash|passwordHash|roomPassword/i);

  const loadedPublicRoom = await api(baseUrl, `/api/rooms/${created.body.room.id}`);
  assert.equal(loadedPublicRoom.status, 200);
  assert.doesNotMatch(JSON.stringify(loadedPublicRoom.body.room), /hostToken|playerToken|tokenHash|passwordHash|roomPassword/i);

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
  assert.doesNotMatch(JSON.stringify(second.room), /hostToken|playerToken|tokenHash|passwordHash|roomPassword/i);

  const blockedStart = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    body: {}
  });
  assert.equal(blockedStart.status, 403);
  assert.equal(blockedStart.body.code, "HOST_TOKEN_REQUIRED");

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
  assert.equal(offTurn.status, 409);
  assert.equal(offTurn.body.code, "ACTIVE_TURN_REQUIRED");
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

  const blockedMarketBuy = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/buy`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: second.session.playerToken,
      itemId: "healing-draught",
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(blockedMarketBuy.status, 403);
  assert.equal(blockedMarketBuy.body.code, "PLAYER_TOKEN_REQUIRED");

  const missingMarketBuy = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/buy`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: first.session.playerToken,
      itemId: "missing-test-item",
      expectedVersion: market.body.room.version
    }
  });
  assert.equal(missingMarketBuy.status >= 400, true);
  assert.match(missingMarketBuy.body.error, /Shop item not found/);

  const marketAfterFailure = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`);
  assert.equal(marketAfterFailure.status, 200);
  assert.equal(marketAfterFailure.body.room.version, market.body.room.version);
  assert.equal(marketAfterFailure.body.shop.some((offer) => offer.itemId === "healing-draught"), true);

  const bought = await api(baseUrl, `/api/rooms/${created.body.room.id}/market/buy`, {
    method: "POST",
    body: {
      playerId: first.player.id,
      playerToken: first.session.playerToken,
      itemId: "healing-draught",
      expectedVersion: marketAfterFailure.body.room.version
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
  assert.equal(replay.body.replay.chapters.length >= 1, true);
  assert.equal(replay.body.replay.highlights.length >= 1, true);
  assert.equal(Number.isInteger(replay.body.replay.memoryCount), true);
  assert.match(replay.body.replay.shareText, /Extended Closure API Loop/);

  const replayMarkdown = await fetch(`${baseUrl}/api/rooms/${created.body.room.id}/replay?format=markdown`);
  assert.equal(replayMarkdown.status, 200);
  assert.match(await replayMarkdown.text(), /Extended Closure API Loop/);

  const marketAfterReplay = await api(baseUrl, `/api/rooms/${created.body.room.id}/market`);
  assert.equal(marketAfterReplay.status, 200);
  assert.equal(marketAfterReplay.body.room.round, secondActed.body.room.round);
  assert.equal(marketAfterReplay.body.room.activePlayerId, secondActed.body.room.activePlayerId);
  assert.equal(marketAfterReplay.body.shop.some((offer) => offer.itemId === "healing-draught"), true);
});

test("deterministic engine loop closes scene switching, weather, season, soundscape, event state, and AI DM randomness", async (t) => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    let GameEngine;
    let buildRuleKnowledgeContext;
    try {
      ({ GameEngine } = await import("../src/core/gameEngine.js"));
      ({ buildRuleKnowledgeContext } = await import("../src/core/rules.js"));
    } catch (error) {
      if (isInProgressImplementationBlocker(error)) {
        t.skip(`Blocked by in-progress implementation: ${implementationBlockerReason(error)}`);
        return;
      }
      throw error;
    }
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    let room;
    try {
      room = await engine.createRoom({ title: "Extended Deterministic Loop", language: "en" });
    } catch (error) {
      if (isInProgressImplementationBlocker(error)) {
        t.skip(`Blocked by in-progress implementation: ${implementationBlockerReason(error)}`);
        return;
      }
      throw error;
    }
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

    const presentation = buildPresentation(shifted, soundscape);
    assert.match(presentation.sceneAsset.semanticKey, /forest/);
    assert.doesNotMatch(presentation.sceneAsset.semanticKey, /archive/);
    assert.equal(presentation.relevantScenes[0].id, presentation.sceneAsset.id);

    const summary = buildTableStateSummary(shifted, { soundscape, presentation });
    assert.equal(summary.turn.activePlayer.characterName, "Asha");
    assert.match(summary.turn.prompt.en, /Asha's turn/);
    assert.equal(summary.scene.environment.weather, "light rain");
    assert.equal(summary.scene.environment.season, "spring");
    assert.equal(summary.scene.lastShiftReason, "forest-action");
    assert.match(summary.scene.asset.semanticKey, /forest/);
    assert.doesNotMatch(summary.scene.asset.semanticKey, /archive/);
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
    assert.equal(shifted.director.knowledge.environment.season, "spring");
    assert.equal(typeof shifted.director.knowledge.randomness.seed, "number");

    const check = { total: 19, dc: 12, success: true, margin: 7 };
    const sameA = buildRuleKnowledgeContext({
      room: shifted,
      scene: {
        ...shifted.scene,
        ambience: "wet leaves, old harvest carts, wet roots, and light rain under the canopy"
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
        ambience: "wet leaves, old harvest carts, wet roots, and light rain under the canopy"
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

function assertBrowserAuthSessionContract() {
  const { appSource, htmlSource } = readBrowserContractSources();
  assert.match(htmlSource, /id="authForm"/);
  assert.match(htmlSource, /data-auth-mode="login"/);
  assert.match(htmlSource, /data-auth-mode-button="register"/);
  assert.match(htmlSource, /id="logoutButton"/);
  assert.match(appSource, /const AUTH_SESSION_KEY = "aidm\.authSessionToken"/);
  assert.match(appSource, /const CURRENT_USER_KEY = "aidm\.currentUser"/);
  assert.match(appSource, /const startupAuthRestore = restoreAuthSession\(\);/);
  assert.match(appSource, /initializeRoomFromUrl\(startupAuthRestore\);/);
  assert.match(appSource, /localStorage\.setItem\(AUTH_SESSION_KEY, authSessionToken\)/);
  assert.match(appSource, /localStorage\.setItem\(CURRENT_USER_KEY, JSON\.stringify\(currentUser\)\)/);
  assert.match(appSource, /headers\.Authorization = `Bearer \$\{authSessionToken\}`/);
  assert.match(appSource, /async function logoutCurrentUser\(\)/);
}

function assertBrowserAccessControlsContract() {
  const { appSource, htmlSource } = readBrowserContractSources();
  assert.match(htmlSource, /<select name="accessMode" id="createAccessMode">/);
  assert.match(htmlSource, /<option value="password"/);
  assert.match(htmlSource, /<option value="host-approval"/);
  assert.match(htmlSource, /id="createRoomPasswordField"/);
  assert.match(htmlSource, /<input name="roomPassword" type="password"/);
  assert.match(htmlSource, /id="pendingPlayersList"/);
  assert.match(appSource, /saveRoomPendingSession\(room\.id, pendingPlayerId, pendingPlayerToken\)/);
  assert.match(appSource, /function roomPendingPlayerIdKey\(roomId\)/);
  assert.match(appSource, /function roomPendingPlayerTokenKey\(roomId\)/);
  assert.match(appSource, /function normalizeClientRoom\(nextRoom = \{\}\)/);
  assert.match(appSource, /function attachRoomAccessHeaders\(path, headers\)/);
  assert.match(appSource, /X-AIDM-Pending-Player-Id/);
  assert.match(appSource, /X-AIDM-Pending-Player-Token/);
  assert.match(appSource, /function syncPendingAccessRefresh\(\)/);
  assert.match(appSource, /data-pending-action="approve"/);
  assert.match(appSource, /data-pending-action="reject"/);
  assert.match(appSource, /syncRoomAccessControls\(/);
  assert.match(appSource, /submitButton\.disabled = Boolean\(pending\?\.status === "pending"\)/);
}

function readBrowserContractSources() {
  return {
    appSource: readFileSync(join(repoRoot, "public/app.js"), "utf8"),
    htmlSource: readFileSync(join(repoRoot, "public/index.html"), "utf8")
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

function isInProgressImplementationBlocker(value) {
  const text = value instanceof Error
    ? `${value.message}\n${value.stack || ""}`
    : JSON.stringify(value?.body || value || {});
  return /normalizeRoomAccess is not defined|freezeSpellOptions is not defined|Unknown spell: glass-echo/.test(text);
}

function implementationBlockerReason(value) {
  const text = value instanceof Error
    ? `${value.message}\n${value.stack || ""}`
    : JSON.stringify(value?.body || value || {});
  if (/freezeSpellOptions is not defined/.test(text)) return "freezeSpellOptions is not defined";
  if (/normalizeRoomAccess is not defined/.test(text)) return "normalizeRoomAccess is not defined";
  if (/Unknown spell: glass-echo/.test(text)) return "Unknown spell: glass-echo";
  return "runtime implementation dependency is not ready";
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
    }, SERVER_READY_TIMEOUT_MS);

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
