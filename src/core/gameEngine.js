import { AIProvider } from "./aiProvider.js";
import { resolveCheck } from "./dice.js";
import { MemoryIndex, extractMemoryTags } from "./memory.js";
import { addPlayer, appendTranscript, assertActivePlayer, createRoomState, roomSnapshot, startRoom, advanceTurn } from "./stateMachine.js";

export class GameEngine {
  constructor({ store, aiProvider = new AIProvider() }) {
    this.store = store;
    this.aiProvider = aiProvider;
  }

  async createRoom(input = {}) {
    const room = createRoomState(input);
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
    appendTranscript(room, {
      type: "system",
      author: "Table",
      playerId: player.id,
      text: `${player.name} joined as ${player.character.name}, ${player.character.archetype}.`
    });
    await this.store.saveRoom(room);
    return { room: roomSnapshot(room), player };
  }

  async startRoom(roomId) {
    const room = await this.requireRoom(roomId);
    startRoom(room);
    appendTranscript(room, {
      type: "gm",
      author: "AIDM",
      text: `The session begins. ${room.scene.objective}. ${room.scene.ambience} frames the first move.`
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async submitAction(roomId, { playerId, text, mode = "normal" }) {
    const room = await this.requireRoom(roomId);
    const actionText = String(text ?? "").trim();
    if (actionText.length < 2) {
      throw new Error("Action text is required");
    }
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
    room.scene.threat = Math.max(0, Math.min(6, room.scene.threat + (check.success ? -0.2 : 0.6)));
    advanceTurn(room);
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async getRoom(roomId) {
    const room = await this.requireRoom(roomId);
    return roomSnapshot(room);
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

function formatModifier(modifier) {
  if (!modifier) {
    return "+ 0";
  }
  return modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}
