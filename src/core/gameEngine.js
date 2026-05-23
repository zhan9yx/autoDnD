import { createHash } from "node:crypto";
import { AIProvider } from "./aiProvider.js";
import { resolveCheck } from "./dice.js";
import { MemoryIndex, extractMemoryTags } from "./memory.js";
import { addPlayer, appendTranscript, assertActivePlayer, createRoomState, roomSnapshot, startRoom, advanceTurn } from "./stateMachine.js";
import { generateEncounter } from "./bestiary.js";
import { chooseNpcAction } from "./npcStrategy.js";
import { applyDirectorBeat } from "./director.js";
import { buildReplay, renderReplayMarkdown } from "./replay.js";
import { COMBAT_STATUS, applyEnemyAction, createCombatState, playerAttackEnemy } from "./combat.js";
import { getSpell } from "./rules.js";

export class GameEngine {
  constructor({ store, aiProvider = new AIProvider() }) {
    this.store = store;
    this.aiProvider = aiProvider;
  }

  async createRoom(input = {}) {
    const room = createRoomState(input);
    if (input.hostToken) {
      room.auth = {
        hostTokenHash: hashToken(input.hostToken),
        players: {}
      };
      room.host = {
        name: String(input.hostName || "Host").trim() || "Host"
      };
    }
    appendTranscript(room, {
      type: "gm",
      author: "AIDM",
      text: `Room created: ${room.title}. The opening scene waits at ${room.scene.location}.`
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async joinRoom(roomId, input) {
    const room = await this.requireRoom(roomId);
    const player = addPlayer(room, input);
    const session = {};
    if (room.auth && input.playerToken) {
      room.auth.players[player.id] = {
        tokenHash: hashToken(input.playerToken),
        role: "player"
      };
      session.playerToken = input.playerToken;
    }
    appendTranscript(room, {
      type: "system",
      author: "Table",
      playerId: player.id,
      text: `${player.name} joined as ${player.character.name}, ${player.character.archetype}.`
    });
    await this.store.saveRoom(room);
    return { room: roomSnapshot(room), player, session };
  }

  async startRoom(roomId, { hostToken = null } = {}) {
    const room = await this.requireRoom(roomId);
    assertHostAccess(room, hostToken);
    startRoom(room);
    appendTranscript(room, {
      type: "gm",
      author: "AIDM",
      text: `The session begins. ${room.scene.objective}. ${room.scene.ambience} frames the first move.`
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async submitAction(roomId, { playerId, text, mode = "normal", expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const actionText = String(text ?? "").trim();
    if (actionText.length < 2) {
      throw new Error("Action text is required");
    }
    assertPlayerAccess(room, playerId, playerToken);
    assertActivePlayer(room, playerId);
    startRoom(room);

    const player = room.players.find((entry) => entry.id === playerId);
    const checkRequest = inferCheck(actionText, player, mode);
    const check = resolveCheck(checkRequest);
    const playerEvent = appendTranscript(room, {
      type: "player",
      author: player.name,
      playerId,
      text: actionText
    });
    appendTranscript(room, {
      type: "roll",
      author: "Rules",
      playerId,
      text: `${player.character.name} rolled ${check.expression}: ${check.rolls.join(", ")} ${formatModifier(check.modifier)} = ${check.total} vs DC ${check.dc}`,
      roll: check
    });

    const memoryIndex = new MemoryIndex(room.memories);
    const memories = memoryIndex.retrieve(`${actionText} ${room.scene.objective}`, { limit: 5 });
    const narration = await this.aiProvider.narrate({ room, player, actionText, check, memories });
    applyNarrationMetrics(room, narration);
    const gmEvent = appendTranscript(room, {
      type: "gm",
      author: "AIDM",
      playerId,
      text: narration.text,
      meta: {
        provider: narration.provider,
        model: narration.model,
        warning: narration.warning || null
      }
    });

    memoryIndex.add({
      kind: check.success ? "lead" : "complication",
      text: `${player.character.name} tried to ${actionText}. Result: ${check.success ? "success" : "failure"} (${check.total}/${check.dc}). ${narration.text}`,
      tags: extractMemoryTags(`${actionText} ${room.scene.objective} ${player.character.name}`),
      weight: check.success ? 1.2 : 1.4,
      sourceEventId: gmEvent.id || playerEvent.id
    });
    room.memories = memoryIndex.toJSON().slice(-80);
    updateSceneProgress(room, check, actionText, player);
    resolveCombatExchange(room, { player, actionText, check });
    advanceTurn(room);
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async sendChat(roomId, { playerId, text, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const chatText = String(text ?? "").trim();
    if (chatText.length < 1) {
      throw new Error("Chat text is required");
    }
    if (!room.players.some((entry) => entry.id === playerId)) {
      throw new Error("Unknown player");
    }
    assertPlayerAccess(room, playerId, playerToken);
    const player = room.players.find((entry) => entry.id === playerId);
    appendTranscript(room, {
      type: "chat",
      author: player.name,
      playerId,
      text: chatText
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async getRoom(roomId) {
    const room = await this.requireRoom(roomId);
    return roomSnapshot(room);
  }

  async getReplay(roomId, { format = "json" } = {}) {
    const room = await this.requireRoom(roomId);
    return format === "markdown" ? renderReplayMarkdown(room) : buildReplay(room);
  }

  async listRooms() {
    const rooms = await this.store.listRooms();
    return rooms.map((room) => ({
      id: room.id,
      title: room.title,
      phase: room.phase,
      playerCount: room.players.length,
      updatedAt: room.updatedAt
    }));
  }

  async requireRoom(roomId) {
    const room = await this.store.getRoom(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    return room;
  }
}

export function inferCheck(actionText, player, requestedMode = "normal") {
  const text = actionText.toLowerCase();
  const stat = text.includes("attack") || text.includes("strike") || text.includes("push") || text.includes("攻击")
    ? "body"
    : text.includes("convince") || text.includes("lie") || text.includes("threaten") || text.includes("说服")
      ? "presence"
      : "mind";
  const modifier = player.character.stats[stat] || 0;
  const dc = text.includes("reckless") || text.includes("强行") ? 15 : text.includes("careful") || text.includes("谨慎") ? 10 : 12;
  const mode = requestedMode === "advantage" || requestedMode === "disadvantage" ? requestedMode : "normal";
  return {
    expression: `1d20${modifier >= 0 ? "+" : ""}${modifier}`,
    dc,
    mode
  };
}

function applyNarrationMetrics(room, narration) {
  room.metrics.aiCalls += narration.provider === "openai" ? 1 : 0;
  room.metrics.lastLatencyMs = narration.latencyMs || 0;
  room.metrics.totalPromptChars += narration.promptChars || 0;
  room.metrics.totalCompletionChars += narration.completionChars || 0;
  room.metrics.provider = narration.provider || room.metrics.provider;
}

function assertExpectedVersion(room, expectedVersion) {
  if (expectedVersion === null || expectedVersion === undefined || expectedVersion === "") {
    return;
  }
  const expected = Number(expectedVersion);
  if (!Number.isInteger(expected)) {
    const error = new Error("Expected version must be an integer");
    error.statusCode = 400;
    error.code = "INVALID_VERSION";
    throw error;
  }
  if (expected !== room.version) {
    const error = new Error(`Room version conflict: expected ${expected}, got ${room.version}`);
    error.statusCode = 409;
    error.code = "VERSION_CONFLICT";
    error.snapshot = roomSnapshot(room);
    throw error;
  }
}

function assertHostAccess(room, hostToken) {
  if (!room.auth?.hostTokenHash) {
    return;
  }
  if (!hostToken || hashToken(hostToken) !== room.auth.hostTokenHash) {
    const error = new Error("Host token is required");
    error.statusCode = 403;
    error.code = "HOST_TOKEN_REQUIRED";
    throw error;
  }
}

function assertPlayerAccess(room, playerId, playerToken) {
  const tokenHash = room.auth?.players?.[playerId]?.tokenHash;
  if (!tokenHash) {
    return;
  }
  if (!playerToken || hashToken(playerToken) !== tokenHash) {
    const error = new Error("Player token is required");
    error.statusCode = 403;
    error.code = "PLAYER_TOKEN_REQUIRED";
    throw error;
  }
}

function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function updateSceneProgress(room, check, actionText, player) {
  const director = applyDirectorBeat(room, { check, actionText, player });
  room.scene.threat = Math.max(0, Math.min(6, room.scene.threat + (check.success ? -0.2 : 0.6)));
  if (check.success) {
    const quest = room.quests?.find((entry) => entry.status === "active");
    if (quest) {
      const progressStep = director.beat === "revelation" ? 30 : 20;
      quest.progress = Math.min(100, quest.progress + progressStep);
      quest.clues = [...new Set([...(quest.clues || []), actionText.slice(0, 80)])];
    }
  }

  const encounter = hasLivingEnemies(room.combat?.encounter)
    ? room.combat.encounter
    : generateEncounter({
      threat: Math.max(1, Math.ceil(room.scene.threat || 1)),
      partySize: Math.max(1, room.players.length),
      theme: check.success ? "intrigue" : "combat",
      maxEnemies: 4
    });
  const firstEnemy = firstLiving(encounter.enemies);
  const playerTargets = room.players.map((entry) => ({
    id: entry.id,
    hp: entry.character.hp,
    maxHp: entry.character.maxHp,
    defense: entry.character.defense,
    threat: Math.max(1, Math.round((entry.character.maxHp + entry.character.defense) / 10)),
    distance: 1 + (entry.id === player.id ? 0 : 2)
  }));
  room.combat = {
    ...(room.combat || {}),
    state: director.beat === "crisis" || room.scene.threat >= 2.5 ? "imminent" : "foreshadowed",
    encounter,
    status: room.combat?.status || COMBAT_STATUS.ONGOING,
    round: room.combat?.round || 1,
    log: room.combat?.log || [],
    tacticalIntent: firstEnemy ? chooseNpcAction(firstEnemy, { enemies: playerTargets }) : null
  };
}

function resolveCombatExchange(room, { player, actionText, check }) {
  const encounter = room.combat?.encounter;
  if (!hasLivingEnemies(encounter) || room.players.length === 0) {
    return;
  }

  const hostileAction = isHostileAction(actionText);
  const enemyShouldAct = hostileAction
    || room.director?.beat === "retaliation"
    || room.director?.beat === "crisis"
    || (!check.success && room.combat.state === "imminent");
  if (!hostileAction && !enemyShouldAct) {
    return;
  }

  const rng = seededRng(room.id, room.version, room.round, actionText);
  let state = createCombatState({
    players: room.players.map(toCombatPlayer),
    enemies: encounter.enemies,
    initiative: buildInitiative(room.players, encounter.enemies)
  });
  state = { ...state, round: room.combat.round || 1, log: [] };

  if (hostileAction && state.status === COMBAT_STATUS.ONGOING) {
    const target = firstLiving(state.enemies);
    if (target) {
      state = playerAttackEnemy(state, {
        playerId: player.id,
        enemyId: target.id,
        ...choosePlayerAttack(player.character, actionText),
        rng,
        damageRng: rng
      });
    }
  }

  let tacticalIntent = null;
  if (enemyShouldAct && state.status === COMBAT_STATUS.ONGOING) {
    const actor = firstLiving(state.enemies);
    if (actor) {
      tacticalIntent = chooseNpcAction(actor, {
        allies: state.enemies.filter((enemy) => enemy.id !== actor.id),
        enemies: state.players.map((target) => ({
          ...target,
          distance: 1,
          threat: Math.max(1, Math.round((target.maxHp + target.defense) / 10))
        }))
      });
      state = applyEnemyAction(state, {
        ...tacticalIntent,
        enemyId: actor.id,
        playerId: tacticalIntent.targetId,
        rng,
        damageRng: rng
      });
    }
  }

  writeCombatState(room, state, tacticalIntent);
}

function toCombatPlayer(player) {
  return {
    id: player.id,
    name: player.character.name,
    hp: player.character.hp,
    maxHp: player.character.maxHp,
    defense: player.character.defense,
    attributes: player.character.attributes,
    skills: player.character.skills,
    weapons: player.character.weapons,
    spells: player.character.spells,
    resistances: player.character.resistances || [],
    weaknesses: player.character.weaknesses || [],
    threat: Math.max(1, Math.round((player.character.maxHp + player.character.defense) / 10)),
    initiativeBonus: player.character.initiative || 0,
    distance: 1
  };
}

function writeCombatState(room, state, tacticalIntent) {
  for (const player of room.players) {
    const combatant = state.players.find((entry) => entry.id === player.id);
    if (combatant) {
      player.character.hp = combatant.hp;
      player.character.conditions = combatant.conditions || player.character.conditions || [];
    }
  }

  const enemies = room.combat.encounter.enemies.map((enemy) => {
    const combatant = state.enemies.find((entry) => entry.id === enemy.id);
    return combatant || enemy;
  });
  const log = [...(room.combat.log || []), ...state.log].slice(-60);

  room.combat = {
    ...room.combat,
    status: state.status,
    round: state.round,
    initiative: state.initiative,
    encounter: {
      ...room.combat.encounter,
      enemies,
      summary: `${enemies.filter((enemy) => enemy.hp > 0).length} active enemies`
    },
    tacticalIntent: tacticalIntent || room.combat.tacticalIntent,
    log
  };

  for (const entry of state.log) {
    appendTranscript(room, {
      type: "combat",
      author: "Rules",
      text: entry.message,
      combat: entry
    });
  }
}

function buildInitiative(players, enemies) {
  return [
    ...players.map((player, index) => ({
      actorId: player.id,
      team: "players",
      name: player.character.name,
      total: player.character.initiative || 0,
      bonus: player.character.initiative || 0,
      order: index
    })),
    ...enemies.map((enemy, index) => ({
      actorId: enemy.id,
      team: "enemies",
      name: enemy.name,
      total: enemy.modifiers?.agility || 0,
      bonus: enemy.modifiers?.agility || 0,
      order: players.length + index
    }))
  ];
}

function choosePlayerAttack(character, actionText) {
  const spellId = chooseDamageSpell(character.spells || [], actionText);
  if (spellId) {
    return { spellId };
  }
  return { weaponId: character.weapons?.[0] };
}

function chooseDamageSpell(spells, actionText) {
  const wantsSpell = /cast|spell|magic|法术|施法|火|雷|光/.test(String(actionText).toLowerCase());
  if (!wantsSpell) {
    return null;
  }
  return spells.find((spellId) => {
    try {
      return Boolean(getSpell(spellId).damage);
    } catch {
      return false;
    }
  }) ?? null;
}

function isHostileAction(actionText) {
  return /attack|strike|shoot|stab|cast|spell|攻击|射击|刺|施法/.test(String(actionText).toLowerCase());
}

function hasLivingEnemies(encounter) {
  return Boolean(encounter?.enemies?.some((enemy) => enemy.hp > 0));
}

function firstLiving(combatants = []) {
  return combatants.find((combatant) => combatant.hp > 0) || null;
}

function seededRng(...parts) {
  let seed = 2166136261;
  for (const part of parts) {
    for (const char of String(part)) {
      seed ^= char.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function formatModifier(modifier) {
  if (!modifier) {
    return "+ 0";
  }
  return modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}
