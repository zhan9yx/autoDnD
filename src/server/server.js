import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { GameEngine } from "../core/gameEngine.js";
import { JsonRoomStore } from "../core/storage.js";
import { createId } from "../core/id.js";
import { listTtsProviders } from "../core/ttsProfiles.js";
import { chooseSoundscape, listSoundscapePresets } from "../core/soundscape.js";
import { buildPresentation } from "../core/assetSelection.js";
import { buildTableStateSummary } from "../core/stateSummary.js";
import { assetSelection, soundscapeSwitch } from "../core/logTemplates.js";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const publicDir = join(rootDir, "public");
const assetsDir = join(rootDir, "assets");
const port = Number.parseInt(process.env.PORT || "4173", 10);
const store = new JsonRoomStore();
const engine = new GameEngine({ store });
const sseClients = new Map();
const roomLocks = new Map();

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url);
      return;
    }
    await serveStatic(response, url.pathname);
  } catch (error) {
    const payload = {
      error: error.message || "Internal error",
      code: error.code || "INTERNAL_ERROR"
    };
    if (error.snapshot) {
      payload.room = error.snapshot;
    }
    sendJson(response, error.statusCode || 500, payload);
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

  if (method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(request);
    const hostToken = createId("host_token");
    const room = await engine.createRoom({ ...body, hostToken });
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
    sendJson(response, 200, { room: withPresentation(await engine.getRoom(roomId)) });
    return;
  }

  if (method === "GET" && action === "replay") {
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
    await handleRoomEvents(request, response, roomId);
    return;
  }

  if (method === "GET" && action === "market") {
    const result = await engine.getMarket(roomId);
    sendJson(response, 200, { ...result, room: withPresentation(result.room) });
    return;
  }

  if (method === "POST" && action === "join") {
    const body = await readJson(request);
    const playerToken = createId("player_token");
    const result = await withRoomLock(roomId, () => engine.joinRoom(roomId, { ...body, playerToken }));
    broadcast(roomId, result.room);
    sendJson(response, 200, { ...result, room: withPresentation(result.room) });
    return;
  }

  if (method === "POST" && action === "start") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.startRoom(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "action") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.submitAction(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "chat") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.sendChat(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "items/use") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.useItem(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "items/equip") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.equipItem(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "market/buy") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.buyItem(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "market/sell") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.sellItem(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  if (method === "POST" && action === "memo") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.saveMemo(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room: withPresentation(room) });
    return;
  }

  throw httpError(404, "Route not found");
}

async function handleRoomEvents(request, response, roomId) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  response.write("\n");

  const clients = sseClients.get(roomId) || new Set();
  sseClients.set(roomId, clients);
  clients.add(response);

  try {
    const room = await engine.getRoom(roomId);
    writeSse(response, "snapshot", withPresentation(room));
  } catch {
    writeSse(response, "error", { error: "Room not found" });
  }

  const heartbeat = setInterval(() => {
    writeSse(response, "heartbeat", { time: new Date().toISOString() });
  }, 25000);

  request.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(response);
  });
}

function broadcast(roomId, room) {
  const clients = sseClients.get(roomId);
  if (!clients) {
    return;
  }
  for (const client of clients) {
    writeSse(client, "snapshot", withPresentation(room));
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

  try {
    await readFile(filePath);
  } catch {
    throw httpError(404, "Not found");
  }

  response.writeHead(200, { "Content-Type": contentType(filePath) });
  createReadStream(filePath).pipe(response);
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
