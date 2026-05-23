import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { GameEngine } from "../core/gameEngine.js";
import { JsonRoomStore } from "../core/storage.js";

const rootDir = fileURLToPath(new URL("../..", import.meta.url));
const publicDir = join(rootDir, "public");
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
    sendJson(response, error.statusCode || 500, { error: error.message || "Internal error" });
  }
});

server.listen(port, () => {
  console.log(`AIDM listening on http://localhost:${port}`);
});

async function handleApi(request, response, url) {
  const method = request.method || "GET";

  if (method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, service: "aidm", time: new Date().toISOString() });
    return;
  }

  if (method === "GET" && url.pathname === "/api/rooms") {
    sendJson(response, 200, { rooms: await engine.listRooms() });
    return;
  }

  if (method === "POST" && url.pathname === "/api/rooms") {
    const body = await readJson(request);
    const room = await engine.createRoom(body);
    broadcast(room.id, room);
    sendJson(response, 201, { room });
    return;
  }

  const roomMatch = /^\/api\/rooms\/([^/]+)(?:\/([^/]+))?$/.exec(url.pathname);
  if (!roomMatch) {
    throw httpError(404, "Route not found");
  }

  const roomId = roomMatch[1];
  const action = roomMatch[2] || "";

  if (method === "GET" && action === "") {
    sendJson(response, 200, { room: await engine.getRoom(roomId) });
    return;
  }

  if (method === "GET" && action === "events") {
    await handleRoomEvents(request, response, roomId);
    return;
  }

  if (method === "POST" && action === "join") {
    const body = await readJson(request);
    const result = await withRoomLock(roomId, () => engine.joinRoom(roomId, body));
    broadcast(roomId, result.room);
    sendJson(response, 200, result);
    return;
  }

  if (method === "POST" && action === "start") {
    const room = await withRoomLock(roomId, () => engine.startRoom(roomId));
    broadcast(roomId, room);
    sendJson(response, 200, { room });
    return;
  }

  if (method === "POST" && action === "action") {
    const body = await readJson(request);
    const room = await withRoomLock(roomId, () => engine.submitAction(roomId, body));
    broadcast(roomId, room);
    sendJson(response, 200, { room });
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
    writeSse(response, "snapshot", room);
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
    writeSse(client, "snapshot", room);
  }
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
  const path = requestPath === "/" ? "/index.html" : requestPath;
  const safePath = normalize(path).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    throw httpError(403, "Forbidden");
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
    default:
      return "application/octet-stream";
  }
}

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
