import { createId, nowIso } from "./id.js";
import { createCharacter } from "./rules.js";
import { generateEncounter } from "./bestiary.js";
import { createDirectorState } from "./director.js";

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
      ambience: tone === "heroic" ? "torchlight and brass horns" : "rain, old stone, and candle smoke",
      clocks: {
        clues: 0,
        danger: 1,
        deadline: 2
      }
    },
    quests: [
      {
        id: "quest-ledger",
        title: "Recover the sealed ledger",
        status: "active",
        progress: 0,
        clues: []
      }
    ],
    combat: {
      state: "foreshadowed",
      encounter: generateEncounter({ threat: 1, partySize: 1, theme: "intrigue", maxEnemies: 3 }),
      tacticalIntent: null
    },
    director: createDirectorState(tone),
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

export function addPlayer(room, { playerName, characterName, archetype = "Investigator", species = "human", classId = "warrior", stats = {} }) {
  assertMutableRoom(room);
  const normalizedClass = normalizeClassId(classId, archetype);
  const normalizedRace = normalizeRaceId(species);
  const normalizedStats = normalizeStats(stats);
  const ruleCharacter = createCharacter({
    name: normalizeName(characterName || playerName, "Adventurer"),
    raceId: normalizedRace,
    classId: normalizedClass,
    allocations: {
      body: normalizedStats.body,
      agility: normalizedStats.agility,
      mind: normalizedStats.mind,
      presence: normalizedStats.presence,
      spirit: normalizedStats.spirit
    }
  });
  const player = {
    id: createId("player"),
    name: normalizeName(playerName, "Player"),
    joinedAt: nowIso(),
    ready: true,
    character: {
      id: ruleCharacter.id,
      name: ruleCharacter.name,
      archetype: normalizeName(archetype, "Investigator"),
      species: normalizedRace,
      classId: normalizedClass,
      className: ruleCharacter.className,
      hp: ruleCharacter.hp,
      maxHp: ruleCharacter.maxHp,
      defense: ruleCharacter.defense,
      initiative: ruleCharacter.modifiers.agility + ruleCharacter.proficiencyBonus,
      stats: normalizedStats,
      attributes: ruleCharacter.attributes,
      skills: ruleCharacter.skills,
      equipment: ruleCharacter.equipment,
      weapons: ruleCharacter.weapons,
      spells: ruleCharacter.knownSpells,
      inventory: ["travel lamp", "field notebook", ...ruleCharacter.equipment]
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
  const { auth, ...publicRoom } = room;
  return {
    ...publicRoom,
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

function normalizeStats(stats) {
  const body = clampStat(stats.body, 3);
  const mind = clampStat(stats.mind, 3);
  const presence = clampStat(stats.presence, 3);
  const agility = clampStat(stats.agility, 3);
  const spirit = clampStat(stats.spirit, 3);
  const total = body + mind + presence + agility + spirit;
  if (total > 27) {
    throw new Error("Attribute point budget exceeded");
  }
  return { body, agility, mind, presence, spirit };
}

function clampStat(value, fallback) {
  const number = Number.parseInt(value ?? fallback, 10);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(0, Math.min(7, number));
}

function normalizeClassId(classId, archetype) {
  const value = String(classId || archetype || "warrior").toLowerCase();
  const aliases = {
    fighter: "warrior",
    vanguard: "warrior",
    investigator: "rogue"
  };
  return aliases[value] || value;
}

function normalizeRaceId(species) {
  const value = String(species || "human").toLowerCase();
  const aliases = {};
  return aliases[value] || value;
}

function bump(room) {
  room.version += 1;
  room.updatedAt = nowIso();
}
