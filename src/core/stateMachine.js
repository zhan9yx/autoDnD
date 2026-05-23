import { createId, nowIso } from "./id.js";
import { createCharacter } from "./rules.js";
import { generateEncounter } from "./bestiary.js";
import { createDirectorState } from "./director.js";
import { normalizeLanguage, t } from "./localization.js";

export const PHASES = Object.freeze({
  LOBBY: "lobby",
  SCENE: "scene",
  RESOLUTION: "resolution",
  ENDED: "ended"
});

export function createRoomState({ title, system = "d20-lite", tone = "mystery", language = "en" } = {}) {
  const roomId = createId("room");
  const createdAt = nowIso();
  const locale = normalizeLanguage(language);
  return {
    id: roomId,
    title: String(title ?? "").trim() || t(locale, "untitledRoom"),
    system,
    tone,
    language: locale,
    phase: PHASES.LOBBY,
    round: 1,
    activePlayerId: null,
    turnOrder: [],
    version: 1,
    scene: {
      title: t(locale, "defaultSceneTitle"),
      location: t(locale, "defaultLocation"),
      objective: t(locale, "defaultObjective"),
      threat: 1,
      ambience: tone === "heroic" ? t(locale, "heroicAmbience") : t(locale, "mysteryAmbience"),
      clocks: {
        clues: 0,
        danger: 1,
        deadline: 2
      },
      exits: defaultSceneExits(locale),
      rewardSources: defaultRewardSources(locale)
    },
    quests: [
      {
        id: "quest-ledger",
        title: t(locale, "defaultQuest"),
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

function defaultSceneExits(locale) {
  return [
    {
      id: "exit-market",
      target: "market",
      label: locale === "zh" ? { zh: "雨棚集市", en: "Rain-sheltered market" } : { en: "Rain-sheltered market", zh: "雨棚集市" },
      available: true,
      requirement: locale === "zh" ? "需要明确前往或追踪行动" : "Requires a clear travel or follow action"
    },
    {
      id: "exit-forest",
      target: "forest",
      label: locale === "zh" ? { zh: "城外古林", en: "Outer old forest" } : { en: "Outer old forest", zh: "城外古林" },
      available: false,
      requirement: locale === "zh" ? "需要至少 1 条线索指向城外" : "Requires at least 1 clue pointing outside the city"
    }
  ];
}

function defaultRewardSources(locale) {
  return [
    {
      id: "source-old-coffer",
      kind: "container",
      label: locale === "zh" ? { zh: "档案馆旧匣", en: "Archive old coffer" } : { en: "Archive old coffer", zh: "档案馆旧匣" },
      keywords: ["old coffer", "archive coffer", "sealed cache", "evidence cache", "旧匣", "封存匣", "证物匣"],
      itemTags: ["ledger", "key", "ring", "map", "signet", "账本", "钥匙", "戒指", "地图"]
    }
  ];
}

export function addPlayer(room, { playerName, characterName, archetype, species = "human", classId = "warrior", stats = {} }) {
  assertMutableRoom(room);
  const language = room.language || "en";
  const normalizedClass = normalizeClassId(classId, archetype);
  const normalizedRace = normalizeRaceId(species);
  const normalizedStats = normalizeStats(stats);
  const ruleCharacter = createCharacter({
    name: normalizeName(characterName || playerName, t(language, "defaultCharacter")),
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
    name: normalizeName(playerName, t(language, "defaultPlayer")),
    joinedAt: nowIso(),
    ready: true,
    character: {
      id: ruleCharacter.id,
      name: ruleCharacter.name,
      archetype: normalizeName(archetype, t(language, "defaultArchetype")),
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
    throw new Error(t(room.language, "cannotStart"));
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
    throw new Error(t(room.language, "roomEnded"));
  }
  if (!room.players.some((player) => player.id === playerId)) {
    throw new Error(t(room.language, "unknownPlayer"));
  }
  if (room.activePlayerId !== playerId) {
    const active = room.players.find((player) => player.id === room.activePlayerId);
    throw new Error(t(room.language, "activeTurn", {
      name: active?.character?.name || active?.name || t(room.language, "anotherPlayer")
    }));
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
    throw new Error(t(room?.language, "roomRequired"));
  }
  if (room.phase === PHASES.ENDED) {
    throw new Error(t(room.language, "roomEnded"));
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
