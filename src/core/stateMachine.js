import { createId, nowIso } from "./id.js";

export const PHASES = Object.freeze({
  LOBBY: "lobby",
  SCENE: "scene",
  RESOLUTION: "resolution",
  ENDED: "ended"
});

export function createRoomState({ title = "Untitled Expedition", system = "d20-lite", tone = "mystery" } = {}) {
  const roomId = createId("room");
  const createdAt = nowIso();
  return {
    id: roomId,
    title: String(title).trim() || "Untitled Expedition",
    system,
    tone,
    phase: PHASES.LOBBY,
    round: 1,
    activePlayerId: null,
    turnOrder: [],
    version: 1,
    scene: {
      title: "The First Door",
      location: "A rain-polished street outside a sealed archive",
      objective: "Discover who stole the sealed ledger before dawn",
      threat: 1,
      ambience: tone === "heroic" ? "torchlight and brass horns" : "rain, old stone, and candle smoke"
    },
    players: [],
    transcript: [],
    memories: [],
    metrics: {
      aiCalls: 0,
      lastLatencyMs: 0,
      totalPromptChars: 0,
      totalCompletionChars: 0,
      provider: "local"
    },
    createdAt,
    updatedAt: createdAt
  };
}

export function addPlayer(room, { playerName, characterName, archetype = "Investigator" }) {
  assertMutableRoom(room);
  const player = {
    id: createId("player"),
    name: normalizeName(playerName, "Player"),
    joinedAt: nowIso(),
    ready: true,
    character: {
      name: normalizeName(characterName || playerName, "Adventurer"),
      archetype: normalizeName(archetype, "Investigator"),
      hp: 10,
      maxHp: 10,
      defense: 12,
      stats: {
        body: 1,
        mind: 2,
        presence: 1
      },
      inventory: ["travel lamp", "field notebook"]
    }
  };

  room.players.push(player);
  room.turnOrder.push(player.id);
  if (!room.activePlayerId) {
    room.activePlayerId = player.id;
  }
  bump(room);
  return player;
}

export function startRoom(room) {
  if (room.players.length === 0) {
    throw new Error("Cannot start a room without players");
  }
  if (room.phase === PHASES.LOBBY) {
    room.phase = PHASES.SCENE;
    room.activePlayerId = room.activePlayerId || room.turnOrder[0];
    bump(room);
  }
  return room;
}

export function assertActivePlayer(room, playerId) {
  if (room.phase === PHASES.ENDED) {
    throw new Error("Room has ended");
  }
  if (!room.players.some((player) => player.id === playerId)) {
    throw new Error("Unknown player");
  }
  if (room.activePlayerId !== playerId) {
    const active = room.players.find((player) => player.id === room.activePlayerId);
    throw new Error(`It is ${active?.character?.name || active?.name || "another player"}'s turn`);
  }
}

export function advanceTurn(room) {
  if (room.turnOrder.length === 0) {
    room.activePlayerId = null;
    return room;
  }
  const currentIndex = Math.max(0, room.turnOrder.indexOf(room.activePlayerId));
  const nextIndex = (currentIndex + 1) % room.turnOrder.length;
  if (nextIndex === 0) {
    room.round += 1;
  }
  room.activePlayerId = room.turnOrder[nextIndex];
  room.phase = PHASES.SCENE;
  bump(room);
  return room;
}

export function getActivePlayer(room) {
  return room.players.find((player) => player.id === room.activePlayerId) || null;
}

export function appendTranscript(room, entry) {
  const record = {
    id: createId("evt"),
    createdAt: nowIso(),
    ...entry
  };
  room.transcript.push(record);
  room.transcript = room.transcript.slice(-200);
  bump(room);
  return record;
}

export function roomSnapshot(room) {
  return {
    ...room,
    activePlayer: getActivePlayer(room)
  };
}

function assertMutableRoom(room) {
  if (!room || typeof room !== "object") {
    throw new Error("Room is required");
  }
  if (room.phase === PHASES.ENDED) {
    throw new Error("Room has ended");
  }
}

function normalizeName(value, fallback) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function bump(room) {
  room.version += 1;
  room.updatedAt = nowIso();
}
