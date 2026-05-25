import { createId, nowIso } from "./id.js";
import { createCharacter } from "./rules.js";
import { generateEncounter } from "./bestiary.js";
import { createDirectorState } from "./director.js";
import { normalizeLanguage, t } from "./localization.js";
import { createInventoryEntry, equipmentSummary, getItemDefinition, hydrateInventoryEntry } from "./itemCatalog.js";
import { getCharacterAvatar } from "./optionAssets.js";
import { aiDecision, assetSelection, chatMessage, createStructuredLog, diceRoll, eventProgression, inventoryMutation, stateTransition } from "./logTemplates.js";

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
      summary: locale === "zh"
        ? { zh: "封存档案馆外的第一条线索还没有被确认。", en: "The first lead outside the sealed archive has not been confirmed yet." }
        : { en: "The first lead outside the sealed archive has not been confirmed yet.", zh: "封存档案馆外的第一条线索还没有被确认。" },
      threat: 1,
      ambience: tone === "heroic" ? t(locale, "heroicAmbience") : t(locale, "mysteryAmbience"),
      clocks: {
        clues: 0,
        danger: 1,
        deadline: 2
      },
      exits: defaultSceneExits(locale),
      rewardSources: defaultRewardSources(locale),
      recentClues: [],
      activeConsequences: [],
      rewardHints: []
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
    factions: [
      {
        id: "party",
        name: locale === "zh" ? { zh: "同行者", en: "Party" } : { en: "Party", zh: "同行者" },
        playerIds: []
      }
    ],
    memos: [],
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
  const startingInventory = createStartingInventory(ruleCharacter);
  const maxMana = Math.max(2, 3 + Math.max(0, normalizedStats.mind) + (ruleCharacter.knownSpells.length > 0 ? 3 : 0));
  const player = {
    id: createId("player"),
    name: normalizeName(playerName, t(language, "defaultPlayer")),
    factionId: "party",
    joinedAt: nowIso(),
    ready: true,
    character: {
      id: ruleCharacter.id,
      name: ruleCharacter.name,
      archetype: normalizeName(archetype, t(language, "defaultArchetype")),
      species: normalizedRace,
      classId: normalizedClass,
      className: ruleCharacter.className,
      avatar: getCharacterAvatar({ species: normalizedRace, classId: normalizedClass }),
      hp: ruleCharacter.hp,
      maxHp: ruleCharacter.maxHp,
      mana: maxMana,
      maxMana,
      xp: 0,
      level: ruleCharacter.level,
      proficiencyBonus: ruleCharacter.proficiencyBonus,
      wallet: 120,
      defense: ruleCharacter.defense,
      initiative: ruleCharacter.modifiers.agility + ruleCharacter.proficiencyBonus,
      stats: normalizedStats,
      attributes: ruleCharacter.attributes,
      skills: ruleCharacter.skills,
      equipment: ruleCharacter.equipment,
      weapons: ruleCharacter.weapons,
      spells: ruleCharacter.knownSpells,
      inventory: startingInventory,
      equipmentSummary: equipmentSummary(startingInventory, language),
      memo: ""
    }
  };

  room.players.push(player);
  const party = room.factions?.find((faction) => faction.id === "party");
  if (party && !party.playerIds.includes(player.id)) {
    party.playerIds.push(player.id);
  }
  room.turnOrder.push(player.id);
  if (!room.activePlayerId) {
    room.activePlayerId = player.id;
  }
  bump(room);
  return player;
}

function createStartingInventory(ruleCharacter) {
  const equippedSlots = new Set();
  const entries = [
    createInventoryEntry("travel-lamp", { seed: `${ruleCharacter.id}:travel-lamp` }),
    createInventoryEntry("field-notebook", { seed: `${ruleCharacter.id}:field-notebook` })
  ];

  for (const itemId of ruleCharacter.equipment) {
    const definition = getItemDefinition(itemId);
    const slot = definition.slot || null;
    const equipped = Boolean(slot && !equippedSlots.has(slot));
    if (equipped) {
      equippedSlots.add(slot);
    }
    entries.push(createInventoryEntry(itemId, {
      seed: `${ruleCharacter.id}:${itemId}`,
      equipped
    }));
  }

  return entries;
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
    throw stateError(409, t(room.language, "roomEnded"), "ROOM_ENDED");
  }
  if (!room.players.some((player) => player.id === playerId)) {
    throw stateError(404, t(room.language, "unknownPlayer"), "PLAYER_NOT_FOUND");
  }
  if (room.activePlayerId !== playerId) {
    const active = room.players.find((player) => player.id === room.activePlayerId);
    throw stateError(409, t(room.language, "activeTurn", {
      name: active?.character?.name || active?.name || t(room.language, "anotherPlayer")
    }), "ACTIVE_TURN_REQUIRED");
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
  record.structuredLog = buildTranscriptLog(room, record);
  room.transcript.push(record);
  room.transcript = room.transcript.slice(-200);
  bump(room);
  return record;
}

export function roomSnapshot(room) {
  const { auth, ...publicRoom } = room;
  const normalizedPlayers = (publicRoom.players || []).map((player) => normalizePlayerForSnapshot(player, room.language));
  const activePlayer = normalizedPlayers.find((player) => player.id === room.activePlayerId) || null;
  return {
    ...publicRoom,
    players: normalizedPlayers,
    activePlayer
  };
}

export function normalizePlayerForSnapshot(player, language = "en") {
  if (!player?.character) return player;
  const inventory = Array.isArray(player.character.inventory)
    ? player.character.inventory.map(hydrateInventoryEntry)
    : [];
  const maxMana = player.character.maxMana || Math.max(2, 3 + (player.character.stats?.mind || 0));
  return {
    ...player,
    factionId: player.factionId || "party",
    character: {
      ...player.character,
      avatar: player.character.avatar || getCharacterAvatar({
        species: player.character.species,
        classId: player.character.classId
      }),
      mana: Number.isFinite(player.character.mana) ? player.character.mana : maxMana,
      maxMana,
      wallet: Number.isFinite(player.character.wallet) ? player.character.wallet : 0,
      inventory,
      equipmentSummary: equipmentSummary(inventory, language),
      xp: Number.isFinite(player.character.xp) ? player.character.xp : 0,
      level: Number.isFinite(player.character.level) ? player.character.level : 1,
      memo: player.character.memo || ""
    }
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

function stateError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
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

function buildTranscriptLog(room, record) {
  const base = {
    roomId: room?.id,
    turnId: room?.activePlayerId ? `round-${room.round || 1}:${room.activePlayerId}` : `round-${room?.round || 1}`,
    actorId: record.playerId || normalizeAuthor(record.author),
    eventId: record.id,
    timestamp: record.createdAt,
    correlationId: `${room?.id || "room"}:${record.id}`
  };

  if (record.type === "gm" && normalizeAuthor(record.author) === "aidm") {
    return aiDecision({
      ...base,
      action: record.meta?.action || "narrate",
      decision: "narrate-table-event",
      rationale: [
        room?.scene?.objective ? `scene objective: ${summarizeText(room.scene.objective, 96)}` : "scene context",
        record.meta?.warning ? `warning: ${record.meta.warning}` : "rules remain server-authoritative"
      ],
      constraints: ["do not mutate dice, HP, inventory, or turn order from prose"],
      result: summarizeText(record.text),
      provider: record.meta?.provider,
      model: record.meta?.model,
      metadata: {
        transcriptType: record.type,
        textLength: String(record.text || "").length,
        warning: record.meta?.warning || null,
        stateTransition: record.stateTransition || null
      }
    });
  }

  if (record.type === "roll" && record.roll) {
    return diceRoll({
      ...base,
      expression: record.roll.expression,
      rolls: record.roll.rolls,
      modifier: record.roll.modifier,
      total: record.roll.total,
      dc: record.roll.dc,
      outcome: record.roll.success ? "success" : "failure",
      mode: record.roll.mode
    });
  }

  if (record.type === "chat") {
    return chatMessage({
      ...base,
      channel: record.channel || record.visibility?.scope || "public",
      visibility: record.visibility,
      text: record.text,
      metadata: {
        transcriptType: record.type
      }
    });
  }

  if (record.type === "reward" && record.reward) {
    return assetSelection({
      ...base,
      action: "grant-reward-asset",
      assetId: record.reward.id,
      assetName: record.reward.displayName?.en || record.reward.name,
      kind: record.reward.categoryId || record.reward.type,
      reason: record.reward.source?.id || "reward",
      result: record.reward.semanticKey || record.reward.id,
      metadata: {
        transcriptType: record.type,
        file: record.reward.file,
        semanticKey: record.reward.semanticKey
      }
    });
  }

  if (record.type === "event-resolution" && record.eventResolution) {
    const eventResolution = record.eventResolution;
    return eventProgression({
      ...base,
      action: "resolve-event",
      eventLabel: eventResolution.trigger?.label || eventResolution.trigger?.id || eventResolution.id,
      fromVersion: record.fromVersion ?? eventResolution.fromVersion ?? "unknown",
      toVersion: record.toVersion ?? eventResolution.toVersion ?? room?.version ?? "unknown",
      round: eventResolution.round ?? room?.round,
      clockDelta: eventResolution.stateDelta,
      sceneChange: eventResolution.trigger?.id === "scene-exit"
        ? "scene-exit"
        : room?.scene?.lastShiftReason || room?.scene?.lastEvolutionReason || "none",
      result: eventResolution.visibleConsequence,
      severity: logSeverityForEvent(eventResolution.severity),
      metadata: {
        transcriptType: record.type,
        eventResolutionId: eventResolution.id,
        trigger: eventResolution.trigger,
        participants: eventResolution.participants,
        stateDelta: eventResolution.stateDelta,
        visibleConsequence: eventResolution.visibleConsequence,
        hiddenConsequenceSummary: eventResolution.hiddenConsequenceSummary,
        nextHook: eventResolution.nextHook,
        eventSeverity: eventResolution.severity,
        audit: eventResolution.audit
      }
    });
  }

  if (["inventory", "economy", "spell"].includes(record.type)) {
    const event = record.inventory || record.economy || {};
    const item = event.item || {};
    return inventoryMutation({
      ...base,
      action: event.action || record.type,
      itemId: item.itemId || item.id || event.itemId,
      itemLabel: item.definition?.label || item.definition?.name?.en || item.itemId,
      quantityDelta: event.consumed ? -1 : undefined,
      metadata: {
        transcriptType: record.type,
        learnedSpell: event.learnedSpell,
        payout: event.payout,
        price: event.price,
        currency: event.currency,
        stateDeltas: event.stateDeltas
      }
    });
  }

  if (record.type === "system") {
    const transition = record.stateTransition || {};
    return stateTransition({
      ...base,
      action: transition.action || "record-system-event",
      from: transition.from || room?.phase || "table",
      to: transition.to || room?.phase || "table",
      result: transition.result || transition.to || "recorded",
      reason: transition.reason || summarizeText(record.text),
      metadata: {
        transcriptType: record.type,
        memo: record.memo || null
      }
    });
  }

  return createStructuredLog({
    ...base,
    type: `transcript.${record.type || "event"}`,
    scope: record.type === "player" ? "player-action" : "transcript",
    category: record.type === "player" ? "player" : "transcript",
    action: record.type === "player" ? "submit-action" : "record",
    result: "recorded",
    messageKey: "transcript.event",
    templateParams: {
      type: record.type || "event",
      result: "recorded"
    },
    severity: "info",
    message: `${record.type || "event"} transcript event recorded.`,
    humanSummary: {
      en: `${record.author || record.type || "Event"} recorded; content remains in the transcript.`,
      zh: `${record.author || record.type || "事件"} 已记录；正文保留在牌桌日志中。`
    },
    metadata: {
      transcriptType: record.type,
      textLength: String(record.text || "").length
    }
  });
}

function normalizeAuthor(author) {
  return String(author || "").trim().toLowerCase() || "system";
}

function summarizeText(value, limit = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text || "recorded";
  return `${text.slice(0, limit - 1)}...`;
}

function logSeverityForEvent(severity) {
  if (severity === "high" || severity === "major") return "warn";
  if (severity === "low" || severity === "minor") return "debug";
  return "info";
}
