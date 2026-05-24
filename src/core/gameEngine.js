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
import { t } from "./localization.js";
import { chooseRewardAsset, findRewardSource } from "./assetSelection.js";
import { buyShopItem, createAssetInventoryEntry, equipInventoryItem, sellInventoryItem, shopView, useInventoryItem } from "./itemCatalog.js";

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
        name: String(input.hostName || t(room.language, "defaultHost")).trim() || t(room.language, "defaultHost")
      };
    }
    appendTranscript(room, {
      type: "gm",
      author: "AIDM",
      text: t(room.language, "roomCreated", { title: room.title, location: room.scene.location })
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
      text: t(room.language, "playerJoined", {
        playerName: player.name,
        characterName: player.character.name,
        archetype: player.character.archetype
      })
    });
    await this.store.saveRoom(room);
    return { room: roomSnapshot(room), player, session };
  }

  async startRoom(roomId, { hostToken = null } = {}) {
    const room = await this.requireRoom(roomId);
    assertHostAccess(room, hostToken);
    const previousPhase = room.phase;
    startRoom(room);
    appendTranscript(room, {
      type: "gm",
      author: "AIDM",
      text: t(room.language, "sessionBegins", { objective: room.scene.objective, ambience: room.scene.ambience }),
      stateTransition: {
        from: previousPhase,
        to: room.phase,
        action: "start-room",
        result: room.phase,
        reason: "session-begins"
      }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async submitAction(roomId, { playerId, text, mode = "normal", expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const actionText = String(text ?? "").trim();
    if (actionText.length < 2) {
      throw new Error(t(room.language, "actionRequired"));
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
      text: t(room.language, "rollResult", {
        characterName: player.character.name,
        expression: check.expression,
        rolls: check.rolls,
        modifier: check.modifier,
        total: check.total,
        dc: check.dc
      }),
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
    appendRewardEvent(room, { player, actionText, check, sourceEventId: gmEvent.id });
    advanceTurn(room);
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async sendChat(roomId, { playerId, text, expectedVersion = null, playerToken = null, channel = "public", factionId = "party" }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const chatText = String(text ?? "").trim();
    if (chatText.length < 1) {
      throw new Error(t(room.language, "chatRequired"));
    }
    if (!room.players.some((entry) => entry.id === playerId)) {
      throw new Error(t(room.language, "unknownPlayer"));
    }
    assertPlayerAccess(room, playerId, playerToken);
    const player = room.players.find((entry) => entry.id === playerId);
    const normalizedChannel = channel === "party" || channel === "faction" ? "party" : "public";
    if (normalizedChannel === "party" && (player.factionId || "party") !== factionId) {
      const error = new Error("Channel forbidden");
      error.statusCode = 403;
      error.code = "CHANNEL_FORBIDDEN";
      throw error;
    }
    appendTranscript(room, {
      type: "chat",
      author: player.name,
      playerId,
      text: chatText,
      channel: normalizedChannel,
      visibility: normalizedChannel === "party"
        ? { scope: "faction", factionId: factionId || player.factionId || "party" }
        : { scope: "public" }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async useItem(roomId, { playerId, itemId, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const player = requirePlayer(room, playerId);
    assertPlayerAccess(room, playerId, playerToken);
    const result = useInventoryItem(player, itemId, room.language);
    appendTranscript(room, {
      type: result.learnedSpell ? "spell" : "inventory",
      author: player.name,
      playerId,
      text: result.learnedSpell
        ? t(room.language, "inventory.learnedSpell", { characterName: player.character.name, spellId: result.learnedSpell })
        : t(room.language, "inventory.usedItem", { characterName: player.character.name, itemName: result.item.definition.label }),
      inventory: {
        action: "use",
        item: result.item,
        learnedSpell: result.learnedSpell,
        consumed: result.consumed,
        stateDeltas: result.stateDeltas
      }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async sellItem(roomId, { playerId, itemId, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const player = requirePlayer(room, playerId);
    assertPlayerAccess(room, playerId, playerToken);
    const result = sellInventoryItem(player, itemId, room.language);
    appendTranscript(room, {
      type: "economy",
      author: player.name,
      playerId,
      text: t(room.language, "inventory.soldItem", {
        characterName: player.character.name,
        itemName: result.item.definition.label,
        amount: result.payout
      }),
      economy: { action: "sell", ...result }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async buyItem(roomId, { playerId, itemId, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const player = requirePlayer(room, playerId);
    assertPlayerAccess(room, playerId, playerToken);
    const result = buyShopItem(player, itemId, room.language);
    appendTranscript(room, {
      type: "economy",
      author: player.name,
      playerId,
      text: t(room.language, "inventory.boughtItem", {
        characterName: player.character.name,
        itemName: result.item.definition.label,
        amount: result.price
      }),
      economy: { action: "buy", ...result }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async equipItem(roomId, { playerId, itemId, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const player = requirePlayer(room, playerId);
    assertPlayerAccess(room, playerId, playerToken);
    const result = equipInventoryItem(player, itemId, room.language);
    appendTranscript(room, {
      type: "inventory",
      author: player.name,
      playerId,
      text: equipTranscriptText(room.language, player.character.name, result.item.definition.label),
      inventory: {
        action: "equip",
        ...result
      }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async saveMemo(roomId, { playerId, text, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertExpectedVersion(room, expectedVersion);
    const player = requirePlayer(room, playerId);
    assertPlayerAccess(room, playerId, playerToken);
    const memoText = String(text || "").trim().slice(0, 1200);
    player.character.memo = memoText;
    const existing = (room.memos || []).find((entry) => entry.authorPlayerId === player.id && entry.visibility === "owner");
    if (existing) {
      existing.text = memoText;
      existing.updatedAt = new Date().toISOString();
    } else {
      room.memos = [...(room.memos || []), {
        id: `memo_${player.id}`,
        authorPlayerId: player.id,
        text: memoText,
        visibility: "owner",
        pinned: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
    }
    appendTranscript(room, {
      type: "system",
      author: "Table",
      playerId,
      text: t(room.language, "inventory.memoSaved", { characterName: player.character.name }),
      visibility: { scope: "owner", playerIds: [player.id] },
      memo: { action: "save", length: memoText.length }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async getMarket(roomId) {
    const room = await this.requireRoom(roomId);
    return { room: roomSnapshot(room), shop: shopView(room.language) };
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
      throw new Error(t("en", "roomNotFound"));
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
    const error = new Error(t(room.language, "expectedVersionInteger"));
    error.statusCode = 400;
    error.code = "INVALID_VERSION";
    throw error;
  }
  if (expected !== room.version) {
    const error = new Error(t(room.language, "roomVersionConflict", { expected, actual: room.version }));
    error.statusCode = 409;
    error.code = "VERSION_CONFLICT";
    error.snapshot = roomSnapshot(room);
    throw error;
  }
}

function equipTranscriptText(language, characterName, itemName) {
  if (language === "zh") {
    return `${characterName}装备了${itemName}。`;
  }
  return `${characterName} equipped ${itemName}.`;
}

function assertHostAccess(room, hostToken) {
  if (!room.auth?.hostTokenHash) {
    return;
  }
  if (!hostToken || hashToken(hostToken) !== room.auth.hostTokenHash) {
    const error = new Error(t(room.language, "hostTokenRequired"));
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
    const error = new Error(t(room.language, "playerTokenRequired"));
    error.statusCode = 403;
    error.code = "PLAYER_TOKEN_REQUIRED";
    throw error;
  }
}

function requirePlayer(room, playerId) {
  const player = room.players.find((entry) => entry.id === playerId);
  if (!player) {
    throw new Error(t(room.language, "unknownPlayer"));
  }
  return player;
}

function hashToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

function updateSceneProgress(room, check, actionText, player) {
  const director = applyDirectorBeat(room, { check, actionText, player });
  applySceneShift(room, actionText, check, director);
  room.scene.threat = Math.max(0, Math.min(6, room.scene.threat + (check.success ? -0.2 : 0.6)));
  updateExitAvailability(room);
  const evolution = applySceneEvolution(room, { actionText, check, director, player });
  if (check.success) {
    const quest = room.quests?.find((entry) => entry.status === "active");
    if (quest) {
      const progressStep = director.beat === "revelation" ? 30 : 20;
      quest.progress = Math.min(100, quest.progress + progressStep);
      quest.clues = [...new Set([
        ...(quest.clues || []),
        localizeSceneText(evolution.clue?.detail, room.language) || actionText.slice(0, 80)
      ])];
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

function applySceneShift(room, actionText, check, director) {
  const lower = String(actionText || "").toLowerCase();
  const shift = sceneShiftFor(room, lower, check, director);
  if (!shift) {
    if (mentionsLockedExit(room, lower)) {
      room.scene = {
        ...room.scene,
        blockedExit: {
          action: actionText,
          reason: check.success ? "route-not-established" : "failed-check",
          atVersion: room.version
        }
      };
    }
    return;
  }
  room.scene = {
    ...room.scene,
    ...shift,
    lastShiftReason: shift.reason,
    shiftedAtVersion: room.version,
    blockedExit: null
  };
}

function applySceneEvolution(room, { actionText, check, director, player }) {
  const lower = String(actionText || "").toLowerCase();
  const clueBearing = check.success && isClueBearingAction(lower);
  const consequence = check.success ? null : buildSceneConsequence(room, { actionText, check, director });
  const clue = clueBearing ? buildSceneClue(room, { actionText, check, director }) : null;
  const rewardHint = clueBearing ? buildRewardHint(room, { actionText, check, player }) : null;

  if (clue) {
    room.scene.recentClues = upsertRecentSceneEntry(room.scene.recentClues, clue, "id", 4);
    room.scene.currentLead = clue;
  }
  if (consequence) {
    room.scene.activeConsequences = upsertRecentSceneEntry(room.scene.activeConsequences, consequence, "id", 3);
  }
  if (rewardHint) {
    room.scene.rewardHints = upsertRecentSceneEntry(room.scene.rewardHints, rewardHint, "sourceId", 3);
  }

  room.scene.summary = buildSceneSummary(room, { clue, consequence, rewardHint, check, director });
  room.scene.lastEvolutionReason = clue
    ? "clue-progress"
    : consequence
      ? "danger-consequence"
      : "scene-pressure";
  room.scene.evolvedAtVersion = room.version;

  return { clue, consequence, rewardHint };
}

function buildSceneClue(room, { actionText, check, director }) {
  const source = selectDiscoverableRewardSource(room, actionText);
  const clueCount = room.scene?.clocks?.clues || 0;
  const sourceName = localizeSceneText(source?.label, room.language);
  const label = source
    ? {
        en: `Lead near ${source.label?.en || source.id}`,
        zh: `${source.label?.zh || source.id}附近的线索`
      }
    : {
        en: director?.beat === "revelation" ? "Revealed lead" : "Fresh clue",
        zh: director?.beat === "revelation" ? "揭示线索" : "新线索"
      };
  const detail = source
    ? {
        en: `Clue ${clueCount} points toward ${source.label?.en || source.id}; a focused search there could uncover something useful.`,
        zh: `第 ${clueCount} 条线索指向${source.label?.zh || source.id}；在那里集中搜索可能会有实际收获。`
      }
    : {
        en: `Clue ${clueCount} narrows the objective without moving the party away from ${room.scene.location}.`,
        zh: `第 ${clueCount} 条线索收窄了目标，但没有把队伍突然带离${room.scene.location}。`
      };

  return {
    id: `clue:${room.round || 1}:${room.version || 0}:${stableTextKey(actionText)}`,
    kind: director?.beat === "revelation" ? "revelation" : "clue",
    label,
    detail,
    clock: "clues",
    sourceId: source?.id || null,
    sourceName: sourceName || null,
    action: String(actionText || "").slice(0, 120),
    margin: check.margin,
    atVersion: room.version
  };
}

function buildSceneConsequence(room, { actionText, check, director }) {
  const danger = room.scene?.clocks?.danger || Math.ceil(room.scene?.threat || 0);
  const severity = director?.beat === "crisis" || check.margin <= -5 ? "major" : "minor";
  return {
    id: `consequence:${room.round || 1}:${room.version || 0}:${stableTextKey(actionText)}`,
    severity,
    clock: "danger",
    label: {
      en: severity === "major" ? "Major pressure" : "Rising pressure",
      zh: severity === "major" ? "重大压力" : "压力上升"
    },
    detail: {
      en: `Danger reaches ${danger}/6; the failed action leaves a recoverable complication in the current scene.`,
      zh: `威胁推进到 ${danger}/6；这次失败在当前场景留下了仍可挽回的麻烦。`
    },
    action: String(actionText || "").slice(0, 120),
    margin: check.margin,
    atVersion: room.version
  };
}

function buildRewardHint(room, { actionText, player }) {
  const source = selectDiscoverableRewardSource(room, actionText);
  if (!source) return null;
  const sourceEn = source.label?.en || source.id;
  const sourceZh = source.label?.zh || source.id;
  return {
    id: `reward-hint:${source.id}`,
    sourceId: source.id,
    label: source.label,
    prompt: {
      en: `${sourceEn} looks searchable now; open, search, or claim it to recover a tangible find.`,
      zh: `${sourceZh}现在值得搜索；明确打开、搜索或取得它，就能回收实际收获。`
    },
    actionSuggestion: {
      en: `Search ${sourceEn}`,
      zh: `搜索${sourceZh}`
    },
    discoveredBy: player?.id || null,
    reason: "investigation-success",
    atVersion: room.version
  };
}

function buildSceneSummary(room, { clue, consequence, rewardHint, check, director }) {
  if (clue && rewardHint) {
    return {
      en: `${localizeSceneText(clue.label, "en")} advances the ${director?.beat || "scene"} beat; ${localizeSceneText(rewardHint.prompt, "en")}`,
      zh: `${localizeSceneText(clue.label, "zh")}推进了${localizeBeat(director?.beat, "zh")}；${localizeSceneText(rewardHint.prompt, "zh")}`
    };
  }
  if (clue) {
    return {
      en: `${localizeSceneText(clue.label, "en")} advances the scene without changing location.`,
      zh: `${localizeSceneText(clue.label, "zh")}推进了当前场景，但没有突然切换地点。`
    };
  }
  if (consequence) {
    return {
      en: `${localizeSceneText(consequence.label, "en")} follows the failed check; danger is now ${room.scene?.clocks?.danger || 0}/6.`,
      zh: `检定失败带来${localizeSceneText(consequence.label, "zh")}；威胁现在是 ${room.scene?.clocks?.danger || 0}/6。`
    };
  }
  return {
    en: check.success ? "The scene holds steady while the party gains position." : "The scene holds steady, but pressure remains visible.",
    zh: check.success ? "场景保持稳定，队伍获得了位置优势。" : "场景保持稳定，但压力仍然可见。"
  };
}

function isClueBearingAction(lowerAction) {
  return hasInvestigationIntent(lowerAction) || hasExplorationIntent(lowerAction) || hasRewardSearchIntent(lowerAction);
}

function hasInvestigationIntent(lowerAction) {
  return /inspect|investigate|examine|study|search|look|scan|read|question|listen|trace|clue|evidence|检查|调查|查看|观察|研究|搜索|寻找|倾听|追问|线索|证据/.test(lowerAction);
}

function hasExplorationIntent(lowerAction) {
  return /explore|scout|survey|map|probe|trail|track|探索|侦察|勘察|探查|摸索|路线|踪迹/.test(lowerAction);
}

function hasRewardSearchIntent(lowerAction) {
  return /open|coffer|cache|drawer|satchel|pack|niche|claim|take|loot|打开|匣|暗藏物|抽屉|包|壁龛|拿起|取得|搜刮/.test(lowerAction);
}

function selectDiscoverableRewardSource(room, actionText) {
  const lower = String(actionText || "").toLowerCase();
  const sources = room?.scene?.rewardSources || [];
  if (sources.length === 0) return null;
  const direct = sources.find((entry) => {
    return (entry.keywords || []).some((keyword) => lower.includes(String(keyword).toLowerCase()));
  });
  if (direct) return direct;
  if (!isClueBearingAction(lower)) return null;
  const clueCount = room?.scene?.clocks?.clues || 0;
  return sources[Math.max(0, (clueCount - 1) % sources.length)];
}

function upsertRecentSceneEntry(entries = [], entry, key, limit) {
  const value = entry?.[key];
  const withoutDuplicate = (entries || []).filter((candidate) => candidate?.[key] !== value);
  return [entry, ...withoutDuplicate].slice(0, limit);
}

function updateExitAvailability(room) {
  const exits = room.scene?.exits || [];
  room.scene.exits = exits.map((entry) => {
    if (entry.available) return entry;
    const available = canUseExit(room, entry.target);
    return available
      ? { ...entry, available: true, requirement: "" }
      : entry;
  });
}

function sceneShiftFor(room, lowerAction, check, director) {
  const wantsTravel = hasTravelIntent(lowerAction);
  if (wantsTravel && check.success && /forest|woods|grove|tree|林|森林|树林|古林/.test(lowerAction) && canUseExit(room, "forest")) {
    return {
      title: sceneText(room, "Forest Trail", "古林小径"),
      location: sceneText(room, "Misty forest path", "雾气缠绕的森林小径"),
      objective: check.success
        ? sceneText(room, "Follow the wet trail before it disappears under the roots.", "在湿脚印消失到树根下之前继续追踪。")
        : sceneText(room, "Find cover as the branches close around the failed trail.", "追踪失败后先寻找掩护，枝叶正在合拢。"),
      ambience: sceneText(room, "wet moss, high leaves, soft footfalls, distant insects", "湿苔、树冠、轻微脚步与远处虫鸣"),
      exits: sceneExits("forest"),
      rewardSources: sceneRewardSources("forest"),
      reason: "forest-action"
    };
  }
  if (wantsTravel && check.success && /market|bazaar|city|street|alley|crowd|vendor|市场|集市|城市|街|小巷/.test(lowerAction) && canUseExit(room, "market")) {
    return {
      title: sceneText(room, "City Market", "城市集市"),
      location: sceneText(room, "Glass-roofed market street", "玻璃顶棚下的集市街"),
      objective: check.success
        ? sceneText(room, "Use the crowd to trace the next lead.", "借助人群掩护追出下一条线索。")
        : sceneText(room, "Keep the suspect in sight as the market turns against you.", "在集市开始排斥你们时盯住嫌疑人。"),
      ambience: sceneText(room, "vendors, brass bells, cart wheels, wet stone", "摊贩、铜铃、车轮和潮湿石路"),
      exits: sceneExits("market"),
      rewardSources: sceneRewardSources("market"),
      reason: "market-action"
    };
  }
  if (wantsTravel && check.success && /waterfall|falls|gorge|瀑布|峡谷/.test(lowerAction) && canUseExit(room, "waterfall")) {
    return {
      title: sceneText(room, "Waterfall Gorge", "瀑布峡谷"),
      location: sceneText(room, "Cliffside waterfall ruin", "峭壁旁的瀑布遗迹"),
      objective: sceneText(room, "Cross the spray-choked stones before the evidence is washed downstream.", "在证据被冲走前穿过水雾中的乱石。"),
      ambience: sceneText(room, "rushing water, stone echo, cold mist", "奔流、水声回响与寒冷水雾"),
      exits: sceneExits("waterfall"),
      rewardSources: sceneRewardSources("waterfall"),
      reason: "waterfall-action"
    };
  }
  if (wantsTravel && check.success && /pond|marsh|swamp|cistern|pool|池|池塘|沼泽|蓄水池/.test(lowerAction) && canUseExit(room, "pond")) {
    return {
      title: sceneText(room, "Still Water", "静水"),
      location: sceneText(room, "Moonlit cistern shrine", "月光下的蓄水池神龛"),
      objective: sceneText(room, "Read the reflection without disturbing what waits beneath it.", "读懂倒影，同时不要惊动水下等待的东西。"),
      ambience: sceneText(room, "still water, frogs, reeds, low whispers", "静水、蛙鸣、芦苇和低声耳语"),
      exits: sceneExits("pond"),
      rewardSources: sceneRewardSources("pond"),
      reason: "water-action"
    };
  }
  if (wantsTravel && check.success && /camp|campfire|rest|hearth|篝火|营地|休息|壁炉/.test(lowerAction) && canUseExit(room, "camp")) {
    return {
      title: sceneText(room, "Camp Watch", "营地守夜"),
      location: sceneText(room, "Ember camp watch", "余烬旁的营地守夜点"),
      objective: sceneText(room, "Trade what the party learned before the next watch ends.", "在下一班守夜结束前交换已获得的信息。"),
      ambience: sceneText(room, "embers, smoke, low voices, night insects", "余烬、烟气、低声交谈与夜虫"),
      exits: sceneExits("camp"),
      rewardSources: sceneRewardSources("camp"),
      reason: "camp-action"
    };
  }
  if (director?.beat === "crisis" || director?.beat === "retaliation" || /attack|strike|ambush|combat|攻击|伏击|战斗/.test(lowerAction)) {
    return {
      title: sceneText(room, "Crisis Line", "危机线"),
      location: sceneText(room, "Barricaded street under rain", "雨中的街垒"),
      objective: sceneText(room, "Hold position while the threat breaks into the scene.", "威胁闯入场景时稳住阵线。"),
      ambience: sceneText(room, "shouts, rain, hard boots, drawn steel", "喊声、雨水、沉重脚步与出鞘武器"),
      exits: sceneExits("crisis"),
      rewardSources: sceneRewardSources("crisis"),
      reason: "danger-action"
    };
  }
  return null;
}

function sceneText(room, en, zh) {
  return room?.language === "zh" ? zh : en;
}

function localizeSceneText(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.zh || value.default || "";
}

function localizeBeat(beat, language) {
  const labels = {
    discovery: { en: "discovery", zh: "发现节拍" },
    trail: { en: "trail", zh: "追踪节拍" },
    revelation: { en: "revelation", zh: "揭示节拍" },
    complication: { en: "complication", zh: "变故节拍" },
    retaliation: { en: "retaliation", zh: "反击节拍" },
    crisis: { en: "crisis", zh: "危机节拍" }
  };
  return localizeSceneText(labels[beat] || { en: beat || "scene", zh: "场景" }, language);
}

function stableTextKey(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = Math.imul(31, hash) + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function appendRewardEvent(room, { player, actionText, check, sourceEventId }) {
  const rewardSource = findRewardSource(room, actionText);
  const reward = chooseRewardAsset(room, actionText, check, { source: rewardSource });
  if (!reward) return null;
  if (!player.character.inventory.some((entry) => entry.itemId === `generated:${reward.semanticKey || reward.id}`)) {
    player.character.inventory.push(createAssetInventoryEntry(reward, {
      seed: `${player.id}:${sourceEventId || reward.id}`,
      source: rewardSource?.id || "reward"
    }));
  }
  const rewardText = t(room.language, "rewardObtained", {
    characterName: player.character.name,
    rewardName: reward.displayName?.[room.language] || reward.displayName?.en || reward.name,
    sourceName: rewardSource?.label?.[room.language] || rewardSource?.label?.en || rewardSource?.id || t(room.language, "rewardSource")
  });
  const localizedRewardName = reward.displayName?.[room.language] || reward.displayName?.en || reward.name;
  const rewardForTranscript = room.language === "zh"
    ? {
        ...reward,
        displayName: {
          ...reward.displayName,
          en: localizedRewardName,
          zh: localizedRewardName
        },
        name: localizedRewardName
      }
    : reward;
  return appendTranscript(room, {
    type: "reward",
    author: "AIDM",
    playerId: player.id,
    text: rewardText,
    reward: {
      ...rewardForTranscript,
      source: rewardSource,
      eventId: sourceEventId,
      playerId: player.id,
      text: rewardText
    }
  });
}

function hasTravelIntent(lowerAction) {
  return /follow|go|head|enter|leave|travel|cross|move|walk|run|sneak|track|pursue|approach|return|前往|进入|离开|穿过|沿着|追踪|靠近|返回/.test(lowerAction);
}

function canUseExit(room, target) {
  const clues = room?.scene?.clocks?.clues || 0;
  const exit = (room?.scene?.exits || []).find((entry) => entry.target === target);
  if (!exit) {
    return target === "market" || clues >= routeClueRequirement(target);
  }
  return Boolean(exit.available) || clues >= routeClueRequirement(target);
}

function routeClueRequirement(target) {
  if (target === "forest" || target === "camp") return 1;
  if (target === "market") return 0;
  return 3;
}

function mentionsLockedExit(room, lowerAction) {
  if (!hasTravelIntent(lowerAction)) return false;
  const targets = [
    ["forest", /forest|woods|grove|tree|林|森林|树林|古林/],
    ["waterfall", /waterfall|falls|gorge|瀑布|峡谷/],
    ["pond", /pond|marsh|swamp|cistern|pool|池|池塘|沼泽|蓄水池/],
    ["camp", /camp|campfire|rest|hearth|篝火|营地|休息|壁炉/]
  ];
  return targets.some(([target, pattern]) => pattern.test(lowerAction) && !canUseExit(room, target));
}

function sceneExits(scene) {
  const routeMap = {
    forest: [
      exit("market", "Market lanterns", "集市灯火", true),
      exit("waterfall", "White gorge", "白雾峡谷", true),
      exit("camp", "Sheltered watchfire", "避雨营火", true)
    ],
    market: [
      exit("forest", "Outer old forest", "城外古林", true),
      exit("pond", "Cistern shrine", "蓄水池神龛", true),
      exit("crisis", "Barricade line", "街垒防线", true)
    ],
    waterfall: [
      exit("forest", "Root trail", "树根小径", true),
      exit("pond", "Lower cistern", "下层蓄水池", true)
    ],
    pond: [
      exit("market", "Drainage market", "排水渠集市", true),
      exit("camp", "Dry watch", "干燥守夜点", true)
    ],
    camp: [
      exit("forest", "Old trail", "古林小径", true),
      exit("market", "Dawn market", "黎明集市", true)
    ],
    crisis: [
      exit("market", "Crowd cover", "人群掩护", true),
      exit("camp", "Fallback watch", "撤退守夜点", true)
    ]
  };
  return routeMap[scene] || [];
}

function exit(target, en, zh, available) {
  return {
    id: `exit-${target}`,
    target,
    label: { en, zh },
    available,
    requirement: available ? "" : "Need a matching clue first."
  };
}

function sceneRewardSources(scene) {
  const sourceMap = {
    forest: [
      source("source-root-cache", "Root-tangled cache", "树根缠绕的暗藏物", ["root cache", "trail cache", "under the roots", "树根", "暗藏物"])
    ],
    market: [
      source("source-vendor-ledger", "Vendor ledger stall", "摊贩账本摊位", ["vendor ledger", "market ledger", "stall drawer", "摊位", "账本"])
    ],
    waterfall: [
      source("source-ruin-niche", "Spray-worn ruin niche", "水雾侵蚀的遗迹壁龛", ["ruin niche", "stone niche", "washed cache", "壁龛", "遗迹"])
    ],
    pond: [
      source("source-cistern-reflection", "Cistern reflection clue", "蓄水池倒影线索", ["reflection", "cistern offering", "waterlogged satchel", "倒影", "水浸包"])
    ],
    camp: [
      source("source-watch-pack", "Shared watch pack", "守夜补给包", ["watch pack", "camp supply", "coalside pouch", "补给包", "营地"])
    ],
    crisis: [
      source("source-fallen-raider", "Fallen raider kit", "倒下袭击者的装备", ["fallen raider", "raider kit", "disarmed enemy", "袭击者", "缴械"])
    ]
  };
  return sourceMap[scene] || [];
}

function source(id, en, zh, keywords) {
  return {
    id,
    kind: "scene-source",
    label: { en, zh },
    keywords,
    itemTags: keywords
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
  const actingPlayer = state.players.find((entry) => entry.id === player.id);
  const playerCanFight = Boolean(actingPlayer && actingPlayer.hp > 0);

  if (hostileAction && playerCanFight && state.status === COMBAT_STATUS.ONGOING) {
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
    const livingPlayers = state.players.filter((entry) => entry.hp > 0);
    if (actor && livingPlayers.length > 0) {
      tacticalIntent = chooseNpcAction(actor, {
        allies: state.enemies.filter((enemy) => enemy.id !== actor.id),
        enemies: livingPlayers.map((target) => ({
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
  const localizedEntries = state.log.map((entry) => ({
    ...entry,
    localizedMessage: localizeCombatLog(room.language, entry)
  }));
  const log = [...(room.combat.log || []), ...localizedEntries].slice(-60);

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

  for (const entry of localizedEntries) {
    appendTranscript(room, {
      type: "combat",
      author: "Rules",
      text: entry.localizedMessage?.[room.language] || entry.message,
      combat: entry
    });
  }
}

function localizeCombatLog(language, entry) {
  if (language !== "zh") {
    return { en: entry.message, zh: entry.message };
  }
  const attackMatch = /^(.+?) (hit|missed) (.+?) for (\d+) damage$/.exec(entry.message || "");
  const castMatch = /^(.+?) cast (.+?) on (.+?)$/.exec(entry.message || "");
  const actor = localizeCombatantName(language, entry.actorDisplayName, attackMatch?.[1] || castMatch?.[1] || entry.actorName || entry.actorId || "敌人");
  const target = localizeCombatantName(language, entry.targetDisplayName, attackMatch?.[3] || castMatch?.[3] || entry.targetName || entry.targetId || "目标");
  if (entry.action === "attack") {
    return {
      en: entry.message,
      zh: `${actor}${entry.hit ? "命中" : "未命中"}${target}，造成 ${attackMatch?.[4] || entry.damage || 0} 点伤害。`
    };
  }
  if (entry.action === "cast") {
    return {
      en: entry.message,
      zh: `${actor}对${target}施放了${localizeSpellName(castMatch?.[2] || entry.sourceId)}。`
    };
  }
  if (entry.action === "flee") {
    return { en: entry.message, zh: `${actor}试图撤离。` };
  }
  if (entry.action === "defend") {
    return { en: entry.message, zh: `${actor}转入防御。` };
  }
  return { en: entry.message, zh: entry.message };
}

function localizeCombatantName(language, displayName, fallback) {
  if (!displayName || typeof displayName !== "object") return fallback;
  return displayName[language] || displayName.en || fallback;
}

function localizeSpellName(spellId = "") {
  const spells = {
    firebolt: "火焰箭",
    "radiant-bolt": "辉光箭",
    sleep: "沉睡术",
    "binding-vines": "束缚藤蔓",
    "healing-word": "治疗真言",
    ward: "守护术",
    "arcane-shield": "奥术护盾"
  };
  return spells[spellId] || spellId || "法术";
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
