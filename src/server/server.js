import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { GameEngine } from "../core/gameEngine.js";
import { JsonRoomStore } from "../core/storage.js";
import { roomSnapshot } from "../core/stateMachine.js";
import { createId } from "../core/id.js";
import { listTtsProviders } from "../core/ttsProfiles.js";
import { chooseSoundscape, listSoundscapePresets } from "../core/soundscape.js";
import { buildPresentation } from "../core/assetSelection.js";
import { buildTableStateSummary } from "../core/stateSummary.js";
import { assetSelection, soundscapeSwitch } from "../core/logTemplates.js";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const publicDir = process.env.AIDM_PUBLIC_DIR || join(rootDir, "public");
const assetsDir = process.env.AIDM_ASSETS_DIR || join(rootDir, "assets");
const port = Number.parseInt(process.env.PORT || "4173", 10);
const store = new JsonRoomStore();
const engine = new GameEngine({ store });
const sseClients = new Map();
const roomLocks = new Map();
const presentationCache = new Map();
const PRESENTATION_CACHE_LIMIT = 200;
const abuseBuckets = new Map();
const SENSITIVE_ERROR_KEY_PATTERN = /authorization|api[-_]?key|cookie|credential|hostToken|password|playerToken|secret|session|token/i;
const SENSITIVE_ERROR_TEXT_PATTERN = /((?:api[-_]?key|authorization|cookie|credential|hostToken|password|playerToken|secret|session|token)\s*[:=]\s*)("[^"]+"|'[^']+'|[^\s,;]+)/gi;
const ABUSE_LIMITS = Object.freeze({
  auth: 20,
  roomCreate: 30,
  join: 40,
  roomMutation: 120,
  sse: 80
});

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }
    await serveStatic(response, url.pathname);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const payload = {
      error: redactSensitiveText(error.message || (statusCode >= 500 ? "Internal error" : "Request failed")),
      code: error.code || "INTERNAL_ERROR"
    };
    if (error.snapshot) {
      payload.room = redactErrorValue(error.snapshot);
    }
    sendJson(response, statusCode, payload);
  }
});

server.listen(port, () => {
  console.log(`AIDM listening on http://localhost:${port}`);
});

async function handleApi(request, response, url) {
  const method = request.method || "GET";

  if (method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      service: "aidm",
      version: "0.11.0-production-depth",
      store: "json",
      aiProvider: process.env.OPENAI_API_KEY ? "openai" : "local",
      time: new Date().toISOString()
    });
    return;
  }

  enforceLocalAbuseGuard(request, url, method);

  if (method === "GET" && url.pathname === "/api/rooms") {
    const rooms = await engine.listRooms();
    sendJson(response, 200, { rooms });
    return;
  }

  if (method === "GET" && url.pathname === "/api/tts/providers") {
    sendJson(response, 200, { providers: listTtsProviders() });
    return;
  }

  if (method === "GET" && url.pathname === "/api/soundscapes") {
    sendJson(response, 200, { presets: listSoundscapePresets() });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/register") {
    const body = await readJson(request);
    const result = await engine.registerUser(body);
    sendJson(response, 201, result);
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(request);
    const result = await engine.loginUser(body);
    sendJson(response, 200, result);
    return;
  }

  if (method === "GET" && url.pathname === "/api/auth/session") {
    const sessionToken = readSessionToken(request);
    const result = await engine.getUserSession(sessionToken);
    sendJson(response, 200, result);
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/logout") {
    const body = await readJson(request);
    const result = await engine.logoutUser(readSessionToken(request, body));
    sendJson(response, 200, result);
    return;
  }

  if (method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(request);
    const authSession = await resolveOptionalAuthSession(request, body, {
      tolerateInvalid: true
    });
    const hostToken = createId("host_token");
    const room = await engine.createRoom({
      ...body,
      hostToken,
      ownerUserId: authSession?.user?.id,
      hostName: body.hostName || authSession?.user?.displayName
    });
    broadcast(room.id, room);
    sendJson(response, 201, { room: withPresentation(room), session: { hostToken } });
    return;
  }

  const roomMatch = /^\/api\/rooms\/([^/]+)(?:\/(.+))?$/.exec(url.pathname);
  if (!roomMatch) {
    throw httpError(404, "Route not found");
  }

  const roomId = roomMatch[1];
  const action = roomMatch[2] || "";

  if (method === "GET" && action === "") {
    const room = await engine.requireRoom(roomId);
    const access = await resolveRoomReadAccess(request, room);
    sendJson(response, 200, {
      room: access.authorized
        ? withPresentationForAccess(roomSnapshot(room), access)
        : minimalRoomLobby(room, access)
    });
    return;
  }

  if (method === "GET" && action === "replay") {
    const room = await engine.requireRoom(roomId);
    await requireRoomReadAccess(request, room);
    const format = url.searchParams.get("format") || "json";
    if (format === "markdown") {
      response.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
      response.end(await engine.getReplay(roomId, { format }));
      return;
    }
    sendJson(response, 200, { replay: await engine.getReplay(roomId) });
    return;
  }

  if (method === "GET" && action === "events") {
    const room = await engine.requireRoom(roomId);
    const access = await requireRoomReadAccess(request, room);
    await handleRoomEvents(request, response, roomId, room, access);
    return;
  }

  if (method === "GET" && action === "market") {
    const room = await engine.requireRoom(roomId);
    const access = await requireRoomReadAccess(request, room);
    const result = await engine.getMarket(roomId, {
      playerId: access.role === "player" ? access.playerId : null
    });
    sendJson(response, 200, { ...result, room: withPresentationForAccess(result.room, access) });
    return;
  }

  if (method === "POST" && action === "join") {
    const body = await readJson(request);
    const authSession = await resolveOptionalAuthSession(request, body, {
      tolerateInvalid: true
    });
    const playerToken = createId("player_token");
    const result = await withRoomLock(roomId, () => engine.joinRoom(roomId, {
      ...body,
      playerToken,
      userId: authSession?.user?.id
    }));
    broadcast(roomId, result.room);
    sendJson(response, 200, {
      ...result,
      room: result.session?.status === "pending"
        ? minimalRoomLobby(result.room, { role: "pending", pendingPlayerId: result.pendingPlayer?.id })
        : withPresentationForAccess(result.room, roomAccessForJoinedPlayer(result))
    });
    return;
  }

  if (method === "POST" && action === "start") {
    const body = await readJson(request);
    const authSession = await resolveOptionalAuthSession(request, body, {
      tolerateInvalid: Boolean(body.hostToken)
    });
    const room = await withRoomLock(roomId, () => engine.startRoom(roomId, {
      ...body,
      hostUserId: authSession?.user?.id
    }));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  const pendingMatch = /^pending\/([^/]+)\/(approve|reject)$/.exec(action);
  if (method === "POST" && pendingMatch) {
    const body = await readJson(request);
    const authSession = await resolveOptionalAuthSession(request, body, {
      tolerateInvalid: Boolean(body.hostToken)
    });
    const pendingPlayerId = pendingMatch[1];
    const decision = pendingMatch[2];
    const result = await withRoomLock(roomId, () => decision === "approve"
      ? engine.approvePendingPlayer(roomId, {
        ...body,
        pendingPlayerId,
        hostUserId: authSession?.user?.id
      })
      : engine.rejectPendingPlayer(roomId, {
        ...body,
        pendingPlayerId,
        hostUserId: authSession?.user?.id
      }));
    broadcast(roomId, result.room);
    sendJson(response, 200, { ...result, room: withPresentation(result.room) });
    return;
  }

  if (method === "POST" && action === "action") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.submitAction(roomId, body));
    return;
  }

  if (method === "POST" && action === "chat") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.sendChat(roomId, body));
    return;
  }

  if (method === "POST" && action === "items/use") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.useItem(roomId, body));
    return;
  }

  if (method === "POST" && action === "items/equip") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.equipItem(roomId, body));
    return;
  }

  if (method === "POST" && action === "market/buy") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.buyItem(roomId, body));
    return;
  }

  if (method === "POST" && action === "market/sell") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.sellItem(roomId, body));
    return;
  }

  if (method === "POST" && action === "memo") {
    const body = await readJson(request);
    await sendPlayerRoomMutation(response, roomId, body, () => engine.saveMemo(roomId, body));
    return;
  }

  throw httpError(404, "Route not found");
}

async function handleRoomEvents(request, response, roomId, initialRoom = null, access = {}) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  response.write("\n");

  const clients = sseClients.get(roomId) || new Set();
  sseClients.set(roomId, clients);
  const client = { response, access };
  clients.add(client);

  const snapshot = initialRoom ? roomSnapshot(initialRoom) : await engine.getRoom(roomId);
  writeSse(response, "snapshot", withPresentationForAccess(snapshot, access));

  const heartbeat = setInterval(() => {
    writeSse(response, "heartbeat", { time: new Date().toISOString() });
  }, 25000);

  request.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
}

function broadcast(roomId, room) {
  const clients = sseClients.get(roomId);
  if (!clients) {
    return;
  }
  for (const client of clients) {
    writeSse(client.response, "snapshot", withPresentationForAccess(room, client.access));
  }
}

function withPresentation(room) {
  if (!room || typeof room !== "object") {
    return room;
  }
  const soundscape = chooseSoundscape(room);
  const presentation = buildPresentation(room, soundscape);
  const mediaLogs = buildMediaLogs(room, soundscape, presentation);
  return {
    ...room,
    soundscape,
    presentation,
    mediaLogs,
    stateSummary: buildTableStateSummary(room, { soundscape, presentation })
  };
}

function withPresentationForAccess(room, access = {}) {
  const cacheKey = presentationCacheKey(room, access);
  if (cacheKey && presentationCache.has(cacheKey)) {
    return presentationCache.get(cacheKey);
  }
  const presented = withPresentation(roomViewForAccess(room, access));
  if (cacheKey) {
    presentationCache.set(cacheKey, presented);
    trimPresentationCache();
  }
  return presented;
}

function presentationCacheKey(room, access = {}) {
  if (!room || typeof room !== "object" || !room.id) {
    return "";
  }
  const version = room.version ?? room.updatedAt ?? "unknown";
  const role = access.role || "public";
  const playerId = role === "player" ? access.playerId || "" : "";
  const pendingPlayerId = role === "pending" ? access.pendingPlayerId || "" : "";
  return `${room.id}:${version}:${role}:${playerId}:${pendingPlayerId}`;
}

function trimPresentationCache() {
  while (presentationCache.size > PRESENTATION_CACHE_LIMIT) {
    const oldestKey = presentationCache.keys().next().value;
    presentationCache.delete(oldestKey);
  }
}

function roomViewForAccess(room, access = {}) {
  if (!room || typeof room !== "object" || access.role === "host") {
    return room;
  }
  const viewerPlayerId = access.role === "player" ? String(access.playerId || "") : "";
  const players = Array.isArray(room.players)
    ? room.players.map((player) => playerViewForAccess(player, viewerPlayerId))
    : room.players;
  const activePlayer = Array.isArray(players)
    ? players.find((player) => player.id === room.activePlayerId) || null
    : playerViewForAccess(room.activePlayer, viewerPlayerId);
  return {
    ...room,
    players,
    activePlayer,
    memos: Array.isArray(room.memos)
      ? room.memos.filter((memo) => isPrivateEntryVisibleToPlayer(memo, viewerPlayerId))
      : room.memos,
    transcript: Array.isArray(room.transcript)
      ? room.transcript.filter((entry) => isPrivateEntryVisibleToPlayer(entry, viewerPlayerId))
      : room.transcript
  };
}

function playerViewForAccess(player, viewerPlayerId) {
  if (!player?.character || String(player.id || "") === viewerPlayerId) {
    return player;
  }
  return {
    ...player,
    character: {
      ...player.character,
      memo: ""
    }
  };
}

function isPrivateEntryVisibleToPlayer(entry, viewerPlayerId) {
  const visibility = entry?.visibility;
  if (!isPrivateVisibility(visibility)) {
    return true;
  }
  if (!viewerPlayerId) {
    return false;
  }
  if (String(entry.authorPlayerId || entry.playerId || "") === viewerPlayerId) {
    return true;
  }
  const playerIds = typeof visibility === "object" && Array.isArray(visibility.playerIds)
    ? visibility.playerIds
    : [];
  return playerIds.some((playerId) => String(playerId) === viewerPlayerId);
}

function isPrivateVisibility(visibility) {
  if (visibility === "owner" || visibility === "private") {
    return true;
  }
  if (!visibility || typeof visibility !== "object") {
    return false;
  }
  return visibility.scope === "owner" || visibility.scope === "private";
}

async function sendPlayerRoomMutation(response, roomId, body, operation) {
  const access = { authorized: true, role: "player", playerId: body.playerId };
  try {
    const room = await withRoomLock(roomId, operation);
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentationForAccess(room, access) });
  } catch (error) {
    if (error.snapshot) {
      error.snapshot = roomViewForAccess(error.snapshot, access);
    }
    throw error;
  }
}

function roomAccessForJoinedPlayer(result) {
  const playerId = result?.player?.id;
  if (!playerId) {
    return { authorized: false, role: null };
  }
  return { authorized: true, role: "player", playerId };
}

function buildMediaLogs(room, soundscape, presentation) {
  const turnId = room?.activePlayerId ? `round-${room.round || 1}:${room.activePlayerId}` : `round-${room?.round || 1}`;
  const base = {
    roomId: room?.id,
    turnId,
    actorId: "aidm",
    timestamp: room?.updatedAt,
    correlationId: `${room?.id || "room"}:media:${room?.version || 0}`
  };
  const logs = [];

  if (soundscape) {
    logs.push(soundscapeSwitch({
      ...base,
      eventId: `${room?.id || "room"}:soundscape:${room?.version || 0}`,
      fromId: room?.lastSoundscapeId || "previous",
      toId: soundscape.id,
      intensity: soundscape.intensity,
      reason: soundscape.reason?.key || soundscape.reason,
      layers: soundscape.layers,
      visualHints: soundscape.visualHints,
      assetHints: soundscape.assetHints,
      result: soundscape.id,
      metadata: {
        reasonKey: soundscape.reason?.key || null,
        reasonParams: soundscape.reason?.params || null,
        category: soundscape.category,
        transition: soundscape.transition,
        profile: soundscape.profile
      }
    }));
  }

  const sceneAsset = presentation?.sceneAsset;
  if (sceneAsset) {
    logs.push(assetSelection({
      ...base,
      eventId: `${room?.id || "room"}:asset:${room?.version || 0}`,
      assetId: sceneAsset.id,
      assetName: localizedDisplayName(sceneAsset, room?.language),
      kind: sceneAsset.categoryId || "scene",
      reason: sceneAsset.reason || soundscape?.id || "scene-presentation",
      result: sceneAsset.semanticKey || sceneAsset.id,
      metadata: {
        file: sceneAsset.file,
        semanticKey: sceneAsset.semanticKey,
        soundscapeId: soundscape?.id || null,
        transition: sceneAsset.transition,
        uiSurface: sceneAsset.uiSurface
      }
    }));
  }

  return logs;
}

function localizedDisplayName(asset, language = "en") {
  if (!asset) {
    return "asset";
  }
  return asset.displayName?.[language] || asset.displayName?.en || asset.displayName?.zh || asset.zhName || asset.name || asset.id;
}

function writeSse(response, event, data) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

async function withRoomLock(roomId, operation) {
  const previous = roomLocks.get(roomId) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => current);
  roomLocks.set(roomId, tail);
  try {
    await previous;
    return await operation();
  } finally {
    release();
    if (roomLocks.get(roomId) === tail) {
      roomLocks.delete(roomId);
    }
  }
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "Invalid JSON body");
  }
}

async function resolveOptionalAuthSession(request, body = {}, { tolerateInvalid = false } = {}) {
  const sessionToken = readSessionToken(request, body);
  if (!sessionToken) {
    return null;
  }
  try {
    return await engine.getUserSession(sessionToken);
  } catch (error) {
    if (tolerateInvalid && isInvalidAuthSessionError(error)) {
      return null;
    }
    throw error;
  }
}

async function resolveRoomReadAccess(request, room) {
  const sessionToken = readSessionToken(request);
  let sessionUserId = null;
  if (sessionToken) {
    const authSession = await resolveOptionalAuthSession(request, {}, { tolerateInvalid: true });
    sessionUserId = authSession?.user?.id || null;
  }
  return engine.authorizeRoomRead(room, {
    sessionUserId,
    hostToken: readHeader(request, "x-aidm-host-token"),
    playerId: readHeader(request, "x-aidm-player-id"),
    playerToken: readHeader(request, "x-aidm-player-token"),
    pendingPlayerId: readHeader(request, "x-aidm-pending-player-id"),
    pendingPlayerToken: readHeader(request, "x-aidm-pending-player-token")
  });
}

function isInvalidAuthSessionError(error) {
  return error?.code === "AUTH_REQUIRED" || error?.code === "SESSION_INVALID";
}

async function requireRoomReadAccess(request, room) {
  const access = await resolveRoomReadAccess(request, room);
  if (!access.authorized) {
    throw httpError(403, "Room read authorization required", "ROOM_READ_FORBIDDEN");
  }
  return access;
}

function minimalRoomLobby(room, access = {}) {
  const lobby = {
    id: room.id,
    title: room.title,
    phase: room.phase,
    playerCount: Array.isArray(room.players) ? room.players.length : 0,
    pendingCount: Array.isArray(room.pendingPlayers)
      ? room.pendingPlayers.filter((entry) => entry.status === "pending").length
      : 0,
    access: room.access || {
      mode: "open",
      passwordProtected: false,
      hostApprovalRequired: false,
      pendingCount: 0
    },
    updatedAt: room.updatedAt
  };
  if (access.role === "pending" && access.pendingPlayerId) {
    const pendingPlayer = (room.pendingPlayers || []).find((entry) => entry.id === access.pendingPlayerId);
    if (pendingPlayer) {
      lobby.pendingPlayers = [minimalPendingPlayer(pendingPlayer)];
    }
  }
  return lobby;
}

function minimalPendingPlayer(pendingPlayer) {
  return {
    id: pendingPlayer.id,
    status: pendingPlayer.status,
    playerName: pendingPlayer.playerName,
    characterName: pendingPlayer.characterName,
    archetype: pendingPlayer.archetype,
    species: pendingPlayer.species,
    classId: pendingPlayer.classId,
    requestedAt: pendingPlayer.requestedAt,
    decidedAt: pendingPlayer.decidedAt || null,
    reason: pendingPlayer.reason || ""
  };
}

function readSessionToken(request, body = {}) {
  const authorization = request.headers.authorization || "";
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  return String(
    body.sessionToken ||
    request.headers["x-aidm-session-token"] ||
    bearerMatch?.[1] ||
    ""
  ).trim();
}

function readHeader(request, name) {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? String(value[0] || "").trim() : String(value || "").trim();
}

function enforceLocalAbuseGuard(request, url, method) {
  if (process.env.AIDM_ABUSE_DISABLED === "1") {
    return;
  }
  const category = abuseCategory(url.pathname, method);
  if (!category) {
    return;
  }
  const windowMs = positiveInteger(process.env.AIDM_ABUSE_WINDOW_MS, 60_000);
  const limit = positiveInteger(process.env.AIDM_ABUSE_LIMIT, ABUSE_LIMITS[category] || 60);
  const now = Date.now();
  const actor = request.socket?.remoteAddress || "local";
  const key = `${category}:${actor}`;
  const bucket = abuseBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    abuseBuckets.set(key, { count: 1, resetAt: now + windowMs });
    cleanupAbuseBuckets(now);
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const error = httpError(429, "Too many local requests; retry later", "ABUSE_RATE_LIMITED");
    error.retryAfterMs = Math.max(0, bucket.resetAt - now);
    throw error;
  }
}

function abuseCategory(pathname, method) {
  if (method === "POST" && /^\/api\/auth\/(?:register|login)$/.test(pathname)) {
    return "auth";
  }
  if (method === "POST" && pathname === "/api/rooms") {
    return "roomCreate";
  }
  if (method === "POST" && /^\/api\/rooms\/[^/]+\/join$/.test(pathname)) {
    return "join";
  }
  if (method === "GET" && /^\/api\/rooms\/[^/]+\/events$/.test(pathname)) {
    return "sse";
  }
  if (
    method === "POST" &&
    /^\/api\/rooms\/[^/]+\/(?:action|chat|memo|items\/use|items\/equip|market\/buy|market\/sell|pending\/[^/]+\/(?:approve|reject))$/.test(pathname)
  ) {
    return "roomMutation";
  }
  return "";
}

function cleanupAbuseBuckets(now) {
  if (abuseBuckets.size < 500) {
    return;
  }
  for (const [key, bucket] of abuseBuckets.entries()) {
    if (bucket.resetAt <= now) {
      abuseBuckets.delete(key);
    }
  }
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function redactErrorValue(value, depth = 0) {
  if (depth > 12) {
    return "[redacted-depth]";
  }
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactErrorValue(entry, depth + 1));
  }
  const next = {};
  for (const [key, entry] of Object.entries(value)) {
    next[key] = SENSITIVE_ERROR_KEY_PATTERN.test(key)
      ? "[redacted]"
      : redactErrorValue(entry, depth + 1);
  }
  return next;
}

function redactSensitiveText(text) {
  return String(text || "").replace(SENSITIVE_ERROR_TEXT_PATTERN, "$1[redacted]");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function serveStatic(response, requestPath) {
  if (requestPath.startsWith("/assets/")) {
    await serveFileFrom(response, assetsDir, requestPath.replace(/^\/assets\//, ""));
    return;
  }

  const path = requestPath === "/" ? "/index.html" : requestPath;
  await serveFileFrom(response, publicDir, path);
}

async function serveFileFrom(response, baseDir, requestPath) {
  const path = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  const safePath = normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(baseDir, safePath);
  if (!filePath.startsWith(baseDir)) {
    throw httpError(403, "Forbidden", "FORBIDDEN");
  }

  let content;
  try {
    content = await readFile(filePath);
  } catch (error) {
    throw staticFileError(error);
  }

  response.writeHead(200, { "Content-Type": contentType(filePath) });
  response.end(content);
}

function staticFileError(error) {
  if (error?.code === "ENOENT") {
    return httpError(404, "Static file not found", "STATIC_NOT_FOUND");
  }
  if (error?.code === "EACCES" || error?.code === "EPERM") {
    return httpError(403, "Static file permission denied", "STATIC_PERMISSION_DENIED");
  }
  return httpError(500, "Static file read failed", "STATIC_READ_FAILED");
}

function contentType(filePath) {
  switch (extname(filePath)) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function httpError(statusCode, message, code = "REQUEST_ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
