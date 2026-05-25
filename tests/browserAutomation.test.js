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
  assert.match(html, /id="createAccessMode"[\s\S]*value="password"[\s\S]*value="host-approval"/);
  assert.match(html, /id="createRoomPasswordField"[\s\S]*name="roomPassword"/);
  assert.match(html, /id="joinRoomPasswordField"[\s\S]*name="roomPassword"/);
  assert.match(html, /id="hostAccessSection"[\s\S]*id="roomAccessSummary"[\s\S]*id="pendingPlayersList"/);
  assert.match(html, /data-drawer-open="settings"[\s\S]*id="audioStatusDock"/);
  assert.match(html, /id="soundscapeLabel"[\s\S]*id="ambienceToggle"[\s\S]*id="ambienceMaster"[\s\S]*id="ambienceMusic"[\s\S]*id="ambienceEnvironment"/);
  assert.match(html, /id="voiceToggle"[\s\S]*id="voiceSelect"[\s\S]*id="voiceRate"[\s\S]*id="voicePitch"/);
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
  assert.match(app, /function roomPendingPlayerIdKey\(roomId\)[\s\S]*return `\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.pendingPlayerId`/);
  assert.match(app, /function roomPendingPlayerTokenKey\(roomId\)[\s\S]*return `\$\{ROOM_SESSION_PREFIX\}\$\{roomId\}\.pendingPlayerToken`/);
  assert.match(app, /function attachRoomAccessHeaders\(path, headers\)[\s\S]*X-AIDM-Host-Token[\s\S]*X-AIDM-Player-Id[\s\S]*X-AIDM-Player-Token[\s\S]*X-AIDM-Pending-Player-Id[\s\S]*X-AIDM-Pending-Player-Token/);
  assert.match(app, /function bindHostAccessControls\(\)[\s\S]*data-pending-action[\s\S]*approve[\s\S]*reject[\s\S]*\/pending\/\$\{encodeURIComponent\(pendingId\)\}\/\$\{decision\}/);
  assert.match(app, /function syncRoomAccessControls\([\s\S]*passwordInput\.required[\s\S]*pending\?\.status === "pending"[\s\S]*button\.pendingApproval/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.enabled", String\(speechState\.enabled\)\)/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.rate", String\(speechState\.rate\)\)/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.pitch", String\(speechState\.pitch\)\)/);
  assert.match(app, /ambienceEngine\.setVolumes\(\{[\s\S]*master: Number\(els\.ambienceMaster\.value\)[\s\S]*music: Number\(els\.ambienceMusic\.value\)[\s\S]*ambience: Number\(els\.ambienceEnvironment\.value\)/);

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

  const [health, index, appSource, tts, soundscapes] = await Promise.all([
    api(baseUrl, "/api/health"),
    fetchText(baseUrl, "/"),
    fetchText(baseUrl, "/app.js"),
    api(baseUrl, "/api/tts/providers"),
    api(baseUrl, "/api/soundscapes")
  ]);
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);
  assert.match(index, /id="createForm"/);
  assert.match(appSource, /attachRoomAccessHeaders\(path, headers\)/);
  assert.equal(tts.status, 200);
  assert.equal(tts.body.providers.some((provider) => provider.id === "browser-speech-synthesis"), true);
  assert.equal(soundscapes.status, 200);
  assert.equal(soundscapes.body.presets.some((preset) => preset.id === "light-rain"), true);

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
  await assertRoomUrlServesRefreshShell(baseUrl, created.body.room.id);

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
  await assertAuthorizedRefreshRecovery(baseUrl, created.body.room.id, playerHeaders(joined), {
    playerId: joined.player.id,
    phase: "lobby"
  });

  const started = await api(baseUrl, `/api/rooms/${created.body.room.id}/start`, {
    method: "POST",
    body: { hostToken: created.body.session.hostToken }
  });
  assert.equal(started.status, 200);
  assert.equal(started.body.room.phase, "scene");
  assert.equal(started.body.room.activePlayerId, joined.player.id);
  assert.ok(started.body.room.presentation?.sceneAsset?.file);
  assert.ok(started.body.room.soundscape?.id);
  assert.ok(started.body.room.stateSummary?.media?.soundscapeId || started.body.room.stateSummary?.scene);

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
  assert.equal(acted.body.room.transcript.some((entry) => entry.structuredLog?.type), true);
  assert.ok(acted.body.room.presentation?.sceneAsset?.file);
  assert.ok(acted.body.room.stateSummary?.turn?.prompt);
  assert.ok(acted.body.room.stateSummary?.control);
  assert.ok(acted.body.room.soundscape?.id);
  assert.equal(acted.body.room.mediaLogs.some((entry) => entry.type === "soundscape.switch"), true);

  const replay = await api(baseUrl, `/api/rooms/${created.body.room.id}/replay`, {
    headers: playerHeaders(joined)
  });
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replay.highlights.length >= 1, true);
  assert.match(replay.body.replay.shareText, /0015 Automated Browser QA/);

  const replayMarkdown = await fetch(`${baseUrl}/api/rooms/${created.body.room.id}/replay?format=markdown`, {
    headers: playerHeaders(joined)
  });
  assert.equal(replayMarkdown.status, 200);
  assert.match(await replayMarkdown.text(), /0015 Automated Browser QA/);

  const refreshedAfterAction = await api(baseUrl, `/api/rooms/${created.body.room.id}`, {
    headers: playerHeaders(joined)
  });
  assert.equal(refreshedAfterAction.status, 200);
  assert.equal(refreshedAfterAction.body.room.version, acted.body.room.version);
  assert.equal(refreshedAfterAction.body.room.players[0].id, joined.player.id);
  assert.equal(refreshedAfterAction.body.room.players[0].character.inventory.some((item) => item.id === purchased.id), true);
  assert.equal(refreshedAfterAction.body.room.transcript.length, acted.body.room.transcript.length);
});

test("0016 browser QA automation covers password rooms and host approval pending, approve, reject, and refresh", async (t) => {
  const { baseUrl } = await startServer(t);

  const passwordRoom = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: "0016 Password Browser QA",
      accessMode: "password",
      roomPassword: "swordfish-0016"
    }
  });
  assert.equal(passwordRoom.status, 201);
  assert.equal(passwordRoom.body.room.access.mode, "password");
  assert.equal(passwordRoom.body.room.access.passwordProtected, true);
  assert.ok(passwordRoom.body.session.hostToken);
  assertNoSecretValues(passwordRoom.body.room, ["swordfish-0016", passwordRoom.body.session.hostToken]);
  await assertRoomUrlServesRefreshShell(baseUrl, passwordRoom.body.room.id);

  const protectedLobby = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}`);
  assert.equal(protectedLobby.status, 200);
  assert.equal(protectedLobby.body.room.playerCount, 0);
  assert.equal(protectedLobby.body.room.players, undefined);
  assert.equal(protectedLobby.body.room.access.passwordProtected, true);

  const missingPassword = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Password Missing",
      characterName: "Password Missing"
    }
  });
  assert.equal(missingPassword.status, 403);
  assert.equal(missingPassword.body.code, "ROOM_PASSWORD_REQUIRED");

  const wrongPassword = await api(baseUrl, `/api/rooms/${passwordRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Password Wrong",
      characterName: "Password Wrong",
      roomPassword: "wrong-password"
    }
  });
  assert.equal(wrongPassword.status, 403);
  assert.equal(wrongPassword.body.code, "ROOM_PASSWORD_INVALID");

  const passwordJoin = await joinRoom(baseUrl, passwordRoom.body.room.id, {
    playerName: "Password Accepted",
    characterName: "Mira",
    classId: "rogue",
    roomPassword: "swordfish-0016"
  });
  assert.equal(passwordJoin.room.players.length, 1);
  assert.equal(passwordJoin.player.character.name, "Mira");
  assert.ok(passwordJoin.session.playerToken);
  assertNoSecretValues(passwordJoin.room, [
    "swordfish-0016",
    passwordRoom.body.session.hostToken,
    passwordJoin.session.playerToken,
    "passwordHash",
    "tokenHash"
  ]);
  await assertAuthorizedRefreshRecovery(baseUrl, passwordRoom.body.room.id, playerHeaders(passwordJoin), {
    playerId: passwordJoin.player.id,
    phase: "lobby"
  });

  const approvalRoom = await api(baseUrl, "/api/rooms", {
    method: "POST",
    body: {
      title: "0016 Approval Browser QA",
      accessMode: "host-approval"
    }
  });
  assert.equal(approvalRoom.status, 201);
  assert.equal(approvalRoom.body.room.access.mode, "host-approval");
  assert.equal(approvalRoom.body.room.access.hostApprovalRequired, true);
  assert.ok(approvalRoom.body.session.hostToken);
  await assertRoomUrlServesRefreshShell(baseUrl, approvalRoom.body.room.id);

  const approvalLobby = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`);
  assert.equal(approvalLobby.status, 200);
  assert.equal(approvalLobby.body.room.players, undefined);
  assert.equal(approvalLobby.body.room.access.hostApprovalRequired, true);

  const pendingJoin = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Pending Player",
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
  assert.equal(pendingJoin.body.room.pendingPlayers[0].id, pendingJoin.body.pendingPlayer.id);
  assert.equal(pendingJoin.body.room.access.pendingCount, 1);

  const pendingRefresh = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: pendingHeaders(pendingJoin.body)
  });
  assert.equal(pendingRefresh.status, 200);
  assert.equal(pendingRefresh.body.room.playerCount, 0);
  assert.equal(pendingRefresh.body.room.players, undefined);
  assert.equal(pendingRefresh.body.room.pendingPlayers[0].status, "pending");

  const hostBeforeApproval = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: hostHeaders(approvalRoom.body.session.hostToken)
  });
  assert.equal(hostBeforeApproval.status, 200);
  assert.equal(hostBeforeApproval.body.room.pendingPlayers.length, 1);
  assert.equal(hostBeforeApproval.body.room.access.pendingCount, 1);

  const blockedPendingAction = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/action`, {
    method: "POST",
    body: {
      playerId: pendingJoin.body.pendingPlayer.id,
      playerToken: pendingJoin.body.session.playerToken,
      text: "try to act before host approval",
      expectedVersion: hostBeforeApproval.body.room.version
    }
  });
  assert.equal(blockedPendingAction.status, 403);
  assert.equal(blockedPendingAction.body.code, "PLAYER_TOKEN_REQUIRED");

  const approved = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/pending/${pendingJoin.body.pendingPlayer.id}/approve`, {
    method: "POST",
    body: { hostToken: approvalRoom.body.session.hostToken }
  });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.pendingPlayer.status, "approved");
  assert.equal(approved.body.player.id, pendingJoin.body.pendingPlayer.id);
  assert.equal(approved.body.room.players.length, 1);
  assert.equal(approved.body.room.access.pendingCount, 0);

  const approvedRefresh = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}`, {
    headers: pendingHeaders(pendingJoin.body)
  });
  assert.equal(approvedRefresh.status, 200);
  assert.equal(approvedRefresh.body.room.players.length, 1);
  assert.equal(approvedRefresh.body.room.players[0].id, pendingJoin.body.pendingPlayer.id);

  const approvedChat = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/chat`, {
    method: "POST",
    body: {
      playerId: approved.body.player.id,
      playerToken: pendingJoin.body.session.playerToken,
      text: "I can chat after approval.",
      expectedVersion: approved.body.room.version
    }
  });
  assert.equal(approvedChat.status, 200);
  assert.equal(approvedChat.body.room.transcript.at(-1).type, "chat");

  const secondPending = await api(baseUrl, `/api/rooms/${approvalRoom.body.room.id}/join`, {
    method: "POST",
    body: {
      playerName: "Rejected Player",
      characterName: "Vale",
      classId: "warrior"
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
  assert.equal(rejected.body.pendingPlayer.reason, "table is full");
  assert.equal(rejected.body.room.players.length, 1);
  assert.equal(rejected.body.room.access.pendingCount, 0);
  assertNoSecretValues(rejected.body.room, [
    approvalRoom.body.session.hostToken,
    pendingJoin.body.session.playerToken,
    secondPending.body.session.playerToken,
    "hostToken",
    "playerToken",
    "passwordHash",
    "tokenHash"
  ]);
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

function pendingHeaders(joined) {
  return {
    "X-AIDM-Pending-Player-Id": joined.pendingPlayer.id,
    "X-AIDM-Pending-Player-Token": joined.session.playerToken
  };
}

function hostHeaders(hostToken) {
  return {
    "X-AIDM-Host-Token": hostToken
  };
}

async function assertRoomUrlServesRefreshShell(baseUrl, roomId) {
  const html = await fetchText(baseUrl, `/?room=${encodeURIComponent(roomId)}`);
  assert.match(html, /id="gateway"/);
  assert.match(html, /id="table"/);
  assert.match(html, /id="joinByIdForm"/);
}

async function assertAuthorizedRefreshRecovery(baseUrl, roomId, headers, { playerId, phase }) {
  const refreshed = await api(baseUrl, `/api/rooms/${roomId}`, { headers });
  assert.equal(refreshed.status, 200);
  assert.equal(refreshed.body.room.phase, phase);
  assert.equal(refreshed.body.room.players.some((player) => player.id === playerId), true);
  assertNoSecretValues(refreshed.body.room, ["hostToken", "playerToken", "passwordHash", "tokenHash"]);
  return refreshed;
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
