import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { AIProvider } from "./aiProvider.js";
import { resolveCheck } from "./dice.js";
import { createId, nowIso } from "./id.js";
import { MemoryIndex, extractMemoryTags } from "./memory.js";
import { addPlayer, appendTranscript, assertActivePlayer, createRoomState, roomSnapshot, startRoom, advanceTurn } from "./stateMachine.js";
import { generateEncounter } from "./bestiary.js";
import { chooseNpcAction } from "./npcStrategy.js";
import { applyDirectorBeat } from "./director.js";
import { buildReplay, renderReplayMarkdown } from "./replay.js";
import { COMBAT_STATUS, applyEnemyAction, createCombatState, playerAttackEnemy } from "./combat.js";
import { applyCharacterLevelProgression, applyWarriorSpecializationToCharacter, buildRuleKnowledgeContext, getSpell, inferWarriorSpecializationId, resolveKnownSpellUse } from "./rules.js";
import { summarizeKnowledgeForLog } from "./logTemplates.js";
import { localizeArchetype, localizeCombatSkillName, localizeSpellName as localizeRulesSpellName, t } from "./localization.js";
import { chooseRewardAsset, findRewardSource } from "./assetSelection.js";
import { buyShopItem, chooseLootItemId, createAssetInventoryEntry, createCatalogReward, createInventoryEntry, describeActionEquipmentInfluence, equipInventoryItem, equipmentSummary, sellInventoryItem, shopView, useInventoryItem } from "./itemCatalog.js";

const FREE_TIME_INVENTORY_TURN_COST = "free-time";
const ROOM_ACCESS_MODES = new Set(["open", "password", "host-approval"]);
const FOREST_ROUTE_PATTERN = /forest|woods|grove|\btrees?\b|\btreeline\b|\btree-lined\b|林|森林|树林|古林/;
const SCRYPT_KEY_LENGTH = 32;
const SCRYPT_OPTIONS = Object.freeze({
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
});
const PASSWORD_HASH_VERSION = "scrypt-v1";
const SESSION_HASH_VERSION = "scrypt-session-v1";
const SESSION_HASH_SALT = "aidm-session-token:scrypt-v1";

export class GameEngine {
  constructor({ store, aiProvider = new AIProvider() }) {
    this.store = store;
    this.aiProvider = aiProvider;
  }

  async registerUser(input = {}) {
    const email = normalizeEmail(input.email);
    const password = normalizePassword(input.password);
    if (!email) {
      throw codedError(400, "Email is required", "AUTH_EMAIL_REQUIRED");
    }
    if (!password) {
      throw codedError(400, "Password must be at least 4 characters", "AUTH_PASSWORD_REQUIRED");
    }
    const existing = await this.store.getUserByEmail(email);
    if (existing) {
      throw codedError(409, "User already exists", "USER_EXISTS");
    }
    const now = nowIso();
    const user = {
      id: createId("user"),
      email,
      displayName: normalizeDisplayName(input.displayName || input.name, email),
      passwordHash: createPasswordHash(password),
      createdAt: now,
      updatedAt: now
    };
    await this.store.saveUser(user);
    const session = await this.createUserSession(user);
    return { user: publicUser(user), session };
  }

  async loginUser(input = {}) {
    const email = normalizeEmail(input.email);
    const password = normalizePassword(input.password);
    if (!email || !password) {
      throw codedError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const user = await this.store.getUserByEmail(email);
    if (!user || !verifyPasswordHash(password, user.passwordHash, email)) {
      throw codedError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }
    const activeUser = await this.upgradeUserPasswordHashIfNeeded(user, password);
    const session = await this.createUserSession(activeUser);
    return { user: publicUser(activeUser), session };
  }

  async getUserSession(sessionToken) {
    const { user, session } = await this.requireUserSession(sessionToken);
    const nextSession = {
      ...session,
      lastSeenAt: nowIso()
    };
    await this.store.saveSession(nextSession);
    return {
      user: publicUser(user),
      session: publicSession(nextSession)
    };
  }

  async logoutUser(sessionToken) {
    let deleted = false;
    for (const tokenHash of sessionTokenHashCandidates(sessionToken || "")) {
      deleted = (sessionToken ? await this.store.deleteSession(tokenHash) : false) || deleted;
    }
    return { ok: true, deleted };
  }

  async createUserSession(user) {
    const token = createId("session_token");
    const tokenHash = hashSessionToken(token);
    const now = nowIso();
    await this.store.saveSession({
      id: createId("session"),
      tokenHash,
      userId: user.id,
      createdAt: now,
      lastSeenAt: now
    });
    return {
      sessionToken: token,
      userId: user.id
    };
  }

  async requireUserSession(sessionToken) {
    if (!sessionToken) {
      throw codedError(401, "Session token is required", "AUTH_REQUIRED");
    }
    let session = null;
    let matchedHash = "";
    const currentTokenHash = hashSessionToken(sessionToken);
    for (const tokenHash of [currentTokenHash, hashToken(sessionToken)]) {
      session = await this.store.getSession(tokenHash);
      if (session) {
        matchedHash = tokenHash;
        break;
      }
    }
    if (!session) {
      throw codedError(401, "Session is invalid", "SESSION_INVALID");
    }
    if (matchedHash !== currentTokenHash) {
      session = await this.upgradeSessionTokenHash(session, sessionToken, currentTokenHash);
    }
    const user = await this.store.getUser(session.userId);
    if (!user) {
      throw codedError(401, "Session is invalid", "SESSION_INVALID");
    }
    return { user, session };
  }

  async upgradeUserPasswordHashIfNeeded(user, password) {
    if (!needsPasswordHashUpgrade(user.passwordHash)) {
      return user;
    }
    const now = nowIso();
    const upgradedUser = {
      ...user,
      passwordHash: createPasswordHash(password),
      passwordHashUpgradedAt: now,
      updatedAt: now
    };
    await this.store.saveUser(upgradedUser);
    return upgradedUser;
  }

  async upgradeSessionTokenHash(session, sessionToken, nextHash = hashSessionToken(sessionToken)) {
    const upgradedSession = {
      ...session,
      tokenHash: nextHash,
      tokenHashUpgradedAt: nowIso()
    };
    await this.store.saveSession(upgradedSession);
    if (session.tokenHash && session.tokenHash !== nextHash) {
      await this.store.deleteSession(session.tokenHash);
    }
    return upgradedSession;
  }

  async createRoom(input = {}) {
    const room = createRoomState(input);
    const access = normalizeRoomAccess(input);
    room.access = access.publicAccess;
    if (input.ownerUserId) {
      room.ownerUserId = String(input.ownerUserId);
    }
    applySceneAtmosphere(room, { reason: "opening-scene" });
    const auth = createRoomAuth(input, access);
    if (auth) {
      room.auth = auth;
      room.host = {
        userId: room.ownerUserId || null,
        name: String(input.hostName || t(room.language, "defaultHost")).trim() || t(room.language, "defaultHost")
      };
    } else if (room.ownerUserId) {
      room.host = {
        userId: room.ownerUserId,
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
    const accessDecision = resolveJoinAccess(room, input);
    if (accessDecision.status === "pending") {
      const pendingPlayer = createPendingPlayer(room, input);
      const auth = ensureRoomAuth(room);
      auth.pendingPlayers[pendingPlayer.id] = {
        tokenHash: input.playerToken ? hashToken(input.playerToken) : null,
        joinInput: sanitizeJoinInput(input)
      };
      updateRoomAccessSummary(room);
      appendTranscript(room, {
        type: "system",
        author: "Table",
        pendingPlayerId: pendingPlayer.id,
        text: `${pendingPlayer.playerName} requested to join as ${pendingPlayer.characterName}.`,
        joinRequest: {
          action: "pending",
          pendingPlayerId: pendingPlayer.id,
          status: pendingPlayer.status
        }
      });
      await this.store.saveRoom(room);
      return {
        room: roomSnapshot(room),
        pendingPlayer: publicPendingPlayer(pendingPlayer),
        session: {
          playerToken: input.playerToken,
          pendingPlayerId: pendingPlayer.id,
          status: "pending"
        }
      };
    }
    const player = addPlayer(room, input);
    applyCharacterCreationOptions(player, input, room.language);
    if (input.userId) {
      player.userId = String(input.userId);
    }
    const session = {};
    if (room.auth && input.playerToken) {
      room.auth.players[player.id] = {
        tokenHash: hashToken(input.playerToken),
        role: "player",
        userId: input.userId ? String(input.userId) : null
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
        archetype: localizeArchetype(room.language, player.character.archetype)
      })
    });
    await this.store.saveRoom(room);
    return { room: roomSnapshot(room), player, session };
  }

  async startRoom(roomId, { hostToken = null, hostUserId = null } = {}) {
    const room = await this.requireRoom(roomId);
    assertHostAccess(room, hostToken, hostUserId);
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
    const actionText = String(text ?? "").trim();
    if (actionText.length < 2) {
      throw new Error(t(room.language, "actionRequired"));
    }
    assertPlayerAccess(room, playerId, playerToken);
    assertExpectedVersion(room, expectedVersion);
    assertActivePlayer(room, playerId);
    startRoom(room);

    const player = room.players.find((entry) => entry.id === playerId);
    const checkRequest = inferCheck(actionText, player, mode, room.language);
    const check = resolveCheck(checkRequest);
    check.ruleInfluence = checkRequest.ruleInfluence;
    check.baseModifier = checkRequest.baseModifier;
    check.equipmentModifier = checkRequest.equipmentModifier;
    const playerEvent = appendTranscript(room, {
      type: "player",
      author: player.name,
      playerId,
      text: actionText
    });
    const influenceText = actionInfluenceTranscriptText(room.language, check.ruleInfluence);
    appendTranscript(room, {
      type: "roll",
      author: "Rules",
      playerId,
      text: [
        t(room.language, "rollResult", {
        characterName: player.character.name,
        expression: check.expression,
        rolls: check.rolls,
        modifier: check.modifier,
        total: check.total,
        dc: check.dc
        }),
        influenceText
      ].filter(Boolean).join(" "),
      roll: check,
      ruleInfluence: check.ruleInfluence
    });
    applyDeclaredSpellUse(room, { player, actionText });

    const memoryIndex = new MemoryIndex(room.memories);
    const memories = memoryIndex.retrieve(`${actionText} ${room.scene.objective}`, { limit: 5 });
    const narrationKnowledge = buildRuleKnowledgeContext({ room, player, actionText, check });
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
      text: t(room.language, "memoryActionResult", {
        characterName: player.character.name,
        actionText,
        outcome: t(room.language, check.success ? "outcome.success" : "outcome.failure"),
        total: check.total,
        dc: check.dc,
        narrationText: narration.text
      }),
      tags: extractMemoryTags(`${actionText} ${room.scene.objective} ${player.character.name}`),
      weight: check.success ? 1.2 : 1.4,
      sourceEventId: gmEvent.id || playerEvent.id
    });
    room.memories = memoryIndex.toJSON().slice(-80);
    updateSceneProgress(room, check, actionText, player);
    attachKnowledgeToStructuredLog(gmEvent, {
      directorKnowledge: room.director?.knowledge,
      narrationKnowledge: narration.knowledge || narrationKnowledge
    });
    resolveCombatExchange(room, { player, actionText, check });
    appendRewardEvent(room, { player, actionText, check, sourceEventId: gmEvent.id });
    advanceTurn(room);
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async sendChat(roomId, { playerId, text, expectedVersion = null, playerToken = null, channel = "public", factionId = "party" }) {
    const room = await this.requireRoom(roomId);
    const chatText = String(text ?? "").trim();
    if (chatText.length < 1) {
      throw new Error(t(room.language, "chatRequired"));
    }
    assertPlayerAccess(room, playerId, playerToken);
    if (!room.players.some((entry) => entry.id === playerId)) {
      throw new Error(t(room.language, "unknownPlayer"));
    }
    assertExpectedVersion(room, expectedVersion);
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
    assertPlayerAccess(room, playerId, playerToken);
    const player = requirePlayer(room, playerId);
    assertExpectedVersion(room, expectedVersion);
    const result = useInventoryItem(player, itemId, room.language);
    appendTranscript(room, {
      type: result.learnedSpell ? "spell" : "inventory",
      author: player.name,
      playerId,
      text: result.learnedSpell
        ? t(room.language, "inventory.learnedSpell", { characterName: player.character.name, spellId: result.learnedSpell })
        : inventoryUseTranscriptText(room.language, player.character, result),
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
    assertPlayerAccess(room, playerId, playerToken);
    const player = requirePlayer(room, playerId);
    assertExpectedVersion(room, expectedVersion);
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
      economy: { action: "sell", ...result, turnCost: FREE_TIME_INVENTORY_TURN_COST }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async buyItem(roomId, { playerId, itemId, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertPlayerAccess(room, playerId, playerToken);
    const player = requirePlayer(room, playerId);
    assertExpectedVersion(room, expectedVersion);
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
      economy: { action: "buy", ...result, turnCost: FREE_TIME_INVENTORY_TURN_COST }
    });
    await this.store.saveRoom(room);
    return roomSnapshot(room);
  }

  async equipItem(roomId, { playerId, itemId, expectedVersion = null, playerToken = null }) {
    const room = await this.requireRoom(roomId);
    assertPlayerAccess(room, playerId, playerToken);
    const player = requirePlayer(room, playerId);
    assertExpectedVersion(room, expectedVersion);
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
    assertPlayerAccess(room, playerId, playerToken);
    const player = requirePlayer(room, playerId);
    assertExpectedVersion(room, expectedVersion);
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

  async approvePendingPlayer(roomId, { pendingPlayerId, hostToken = null, hostUserId = null } = {}) {
    const room = await this.requireRoom(roomId);
    assertHostAccess(room, hostToken, hostUserId);
    const pending = requirePendingPlayer(room, pendingPlayerId);
    if (pending.status !== "pending") {
      throw codedError(409, "Pending player request has already been resolved", "PENDING_PLAYER_RESOLVED");
    }
    const auth = ensureRoomAuth(room);
    const pendingAuth = auth.pendingPlayers?.[pending.id];
    const joinInput = pendingAuth?.joinInput || pendingToJoinInput(pending);
    const player = addPlayer(room, joinInput);
    applyCharacterCreationOptions(player, joinInput, room.language);
    const generatedPlayerId = player.id;
    player.id = pending.id;
    if (joinInput.userId) {
      player.userId = String(joinInput.userId);
    }
    replacePlayerId(room, generatedPlayerId, player.id);
    auth.players[player.id] = {
      tokenHash: pendingAuth?.tokenHash || null,
      role: "player",
      userId: joinInput.userId ? String(joinInput.userId) : null
    };
    if (auth.pendingPlayers) {
      delete auth.pendingPlayers[pending.id];
    }
    pending.status = "approved";
    pending.playerId = player.id;
    pending.decidedAt = nowIso();
    pending.decidedBy = hostUserId || "host-token";
    updateRoomAccessSummary(room);
    appendTranscript(room, {
      type: "system",
      author: "Table",
      playerId: player.id,
      text: `${pending.playerName} was approved to join the room.`,
      joinRequest: {
        action: "approve",
        pendingPlayerId: pending.id,
        playerId: player.id,
        status: pending.status
      }
    });
    await this.store.saveRoom(room);
    return { room: roomSnapshot(room), player, pendingPlayer: publicPendingPlayer(pending) };
  }

  async rejectPendingPlayer(roomId, { pendingPlayerId, hostToken = null, hostUserId = null, reason = "" } = {}) {
    const room = await this.requireRoom(roomId);
    assertHostAccess(room, hostToken, hostUserId);
    const pending = requirePendingPlayer(room, pendingPlayerId);
    if (pending.status !== "pending") {
      throw codedError(409, "Pending player request has already been resolved", "PENDING_PLAYER_RESOLVED");
    }
    ensureRoomAuth(room);
    pending.status = "rejected";
    pending.decidedAt = nowIso();
    pending.decidedBy = hostUserId || "host-token";
    pending.reason = String(reason || "").trim().slice(0, 240);
    updateRoomAccessSummary(room);
    appendTranscript(room, {
      type: "system",
      author: "Table",
      pendingPlayerId: pending.id,
      text: `${pending.playerName}'s join request was rejected.`,
      joinRequest: {
        action: "reject",
        pendingPlayerId: pending.id,
        status: pending.status
      }
    });
    await this.store.saveRoom(room);
    return { room: roomSnapshot(room), pendingPlayer: publicPendingPlayer(pending) };
  }

  async getMarket(roomId, { playerId = null } = {}) {
    const room = await this.requireRoom(roomId);
    const player = playerId
      ? room.players.find((entry) => entry.id === playerId) || null
      : null;
    return {
      room: roomSnapshot(room),
      shop: shopView(room.language, player ? { player, character: player.character, wallet: player.character.wallet } : {})
    };
  }

  async getRoom(roomId) {
    const room = await this.requireRoom(roomId);
    return roomSnapshot(room);
  }

  async getReplay(roomId, { format = "json" } = {}) {
    const room = await this.requireRoom(roomId);
    return format === "markdown" ? renderReplayMarkdown(room) : buildReplay(room);
  }

  authorizeRoomRead(
    room,
    {
      sessionUserId = null,
      hostToken = null,
      playerId = null,
      playerToken = null,
      pendingPlayerId = null,
      pendingPlayerToken = null
    } = {}
  ) {
    const mode = room?.access?.mode || "open";
    const normalizedSessionUserId = sessionUserId ? String(sessionUserId) : "";
    if (room.ownerUserId && normalizedSessionUserId === String(room.ownerUserId)) {
      return { authorized: true, role: "host" };
    }
    if (room.auth?.hostTokenHash && hostToken && hashToken(hostToken) === room.auth.hostTokenHash) {
      return { authorized: true, role: "host" };
    }

    const players = room.auth?.players || {};
    const roomPlayerIds = new Set((room.players || []).map((player) => player.id));
    if (normalizedSessionUserId) {
      const ownedPlayer = Object.entries(players).find(([id, access]) => (
        roomPlayerIds.has(id) && access?.userId && String(access.userId) === normalizedSessionUserId
      ));
      if (ownedPlayer) {
        return { authorized: true, role: "player", playerId: ownedPlayer[0] };
      }
    }

    const playerCredentialPairs = [
      { id: playerId, token: playerToken },
      { id: pendingPlayerId, token: pendingPlayerToken }
    ];
    for (const credentials of playerCredentialPairs) {
      const normalizedPlayerId = String(credentials.id || "").trim();
      const tokenHash = players[normalizedPlayerId]?.tokenHash;
      if (
        normalizedPlayerId &&
        roomPlayerIds.has(normalizedPlayerId) &&
        tokenHash &&
        credentials.token &&
        hashToken(credentials.token) === tokenHash
      ) {
        return { authorized: true, role: "player", playerId: normalizedPlayerId };
      }
    }

    const pendingPlayers = room.auth?.pendingPlayers || {};
    const pendingRoomIds = new Set((room.pendingPlayers || [])
      .filter((entry) => entry.status === "pending" || entry.status === "rejected")
      .map((entry) => entry.id));
    for (const credentials of playerCredentialPairs) {
      const normalizedPendingPlayerId = String(credentials.id || "").trim();
      const pendingTokenHash = pendingPlayers[normalizedPendingPlayerId]?.tokenHash;
      if (
        normalizedPendingPlayerId &&
        pendingRoomIds.has(normalizedPendingPlayerId) &&
        pendingTokenHash &&
        credentials.token &&
        hashToken(credentials.token) === pendingTokenHash
      ) {
        return { authorized: false, role: "pending", pendingPlayerId: normalizedPendingPlayerId };
      }
    }

    if (mode === "open") {
      return { authorized: true, role: "public" };
    }

    return { authorized: false, role: null };
  }

  async listRooms() {
    const rooms = await this.store.listRooms();
    return rooms.map((room) => ({
      id: room.id,
      title: room.title,
      phase: room.phase,
      playerCount: room.players.length,
      pendingCount: countPendingPlayers(room),
      access: summarizeRoomAccess(room),
      ownerUserId: room.ownerUserId || null,
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

function applyCharacterCreationOptions(player, input = {}, language = "en") {
  const character = player?.character;
  if (!character) return;
  const explicitSpecialization = input.specializationId || input.warriorSpecializationId || input.classSpecializationId;
  const requestedSpecialization = inferWarriorSpecializationId(explicitSpecialization || input.archetype);
  if (character.classId === "warrior" && requestedSpecialization) {
    const beforeEquipment = new Set(character.equipment || []);
    try {
      applyWarriorSpecializationToCharacter(character, requestedSpecialization);
      for (const itemId of character.equipment || []) {
        if (beforeEquipment.has(itemId)) continue;
        if ((character.inventory || []).some((entry) => entry.itemId === itemId)) continue;
        character.inventory.push(createInventoryEntry(itemId, {
          seed: `${character.id}:${itemId}:specialization`,
          source: "specialization"
        }));
      }
    } catch (error) {
      if (explicitSpecialization) {
        throw error;
      }
      applyCharacterLevelProgression(character);
    }
  } else {
    applyCharacterLevelProgression(character);
  }
  character.knownSpells = [...new Set([...(character.knownSpells || []), ...(character.spells || [])])];
  character.equipmentSummary = equipmentSummary(character.inventory || [], language);
}

export function inferCheck(actionText, player, requestedMode = "normal", language = "en") {
  const text = actionText.toLowerCase();
  const stat = text.includes("attack") || text.includes("strike") || text.includes("push") || text.includes("攻击")
    ? "body"
    : text.includes("convince") || text.includes("lie") || text.includes("threaten") || text.includes("说服")
      ? "presence"
      : "mind";
  const baseModifier = player.character.stats[stat] || 0;
  const ruleInfluence = describeActionEquipmentInfluence(player.character, actionText, language);
  const equipmentModifier = ruleInfluence.modifier || 0;
  const modifier = baseModifier + equipmentModifier;
  const dc = text.includes("reckless") || text.includes("强行") ? 15 : text.includes("careful") || text.includes("谨慎") ? 10 : 12;
  const mode = requestedMode === "advantage" || requestedMode === "disadvantage" ? requestedMode : "normal";
  return {
    expression: `1d20${modifier >= 0 ? "+" : ""}${modifier}`,
    dc,
    mode,
    baseModifier,
    equipmentModifier,
    ruleInfluence
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

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePassword(password) {
  const value = String(password || "");
  return value.length >= 4 ? value : "";
}

function normalizeDisplayName(value, email) {
  const normalized = String(value || "").trim();
  if (normalized) {
    return normalized.slice(0, 80);
  }
  return email.split("@")[0] || "Player";
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function publicSession(session) {
  return {
    userId: session.userId,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt
  };
}

function normalizeRoomAccess(input = {}) {
  const raw = String(input.accessMode || input.access?.mode || "open")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
  const mode = raw === "hostapproval" ? "host-approval" : raw;
  if (!ROOM_ACCESS_MODES.has(mode)) {
    throw codedError(400, "Room access mode must be open, password, or host-approval", "ROOM_ACCESS_MODE_INVALID");
  }
  const roomPassword = String(input.roomPassword || input.password || "").trim();
  if (mode === "password" && !roomPassword) {
    throw codedError(400, "Room password is required for password access", "ROOM_PASSWORD_REQUIRED_FOR_MODE");
  }
  return {
    mode,
    roomPassword,
    publicAccess: {
      mode,
      passwordProtected: mode === "password",
      hostApprovalRequired: mode === "host-approval",
      pendingCount: 0
    }
  };
}

function createRoomAuth(input, access) {
  const auth = {
    players: {},
    pendingPlayers: {}
  };
  if (input.hostToken) {
    auth.hostTokenHash = hashToken(input.hostToken);
  }
  if (access.mode === "password") {
    auth.roomPasswordHash = createPasswordHash(access.roomPassword);
  }
  return auth.hostTokenHash || auth.roomPasswordHash ? auth : null;
}

function ensureRoomAuth(room) {
  room.auth = room.auth || {};
  room.auth.players = room.auth.players || {};
  room.auth.pendingPlayers = room.auth.pendingPlayers || {};
  return room.auth;
}

function resolveJoinAccess(room, input = {}) {
  const mode = room.access?.mode || "open";
  if (mode === "open") {
    return { status: "approved" };
  }
  if (mode === "password") {
    const provided = String(input.roomPassword || input.password || "").trim();
    if (!provided) {
      throw codedError(403, "Room password is required", "ROOM_PASSWORD_REQUIRED");
    }
    if (!room.auth?.roomPasswordHash || !verifyPasswordHash(provided, room.auth.roomPasswordHash, "room-password")) {
      throw codedError(403, "Room password is invalid", "ROOM_PASSWORD_INVALID");
    }
    if (needsPasswordHashUpgrade(room.auth.roomPasswordHash)) {
      room.auth.roomPasswordHash = createPasswordHash(provided);
    }
    return { status: "approved" };
  }
  if (mode === "host-approval") {
    return { status: "pending" };
  }
  throw codedError(400, "Room access mode is invalid", "ROOM_ACCESS_MODE_INVALID");
}

function sanitizeJoinInput(input = {}) {
  const sanitized = {
    playerName: String(input.playerName || "").trim(),
    characterName: String(input.characterName || "").trim(),
    archetype: String(input.archetype || "").trim(),
    species: String(input.species || "human").trim(),
    classId: String(input.classId || "warrior").trim(),
    stats: normalizeJoinStats(input.stats)
  };
  if (input.userId) {
    sanitized.userId = String(input.userId);
  }
  return sanitized;
}

function normalizeJoinStats(stats) {
  if (!stats || typeof stats !== "object") {
    return {};
  }
  return {
    body: stats.body,
    agility: stats.agility,
    mind: stats.mind,
    presence: stats.presence,
    spirit: stats.spirit
  };
}

function createPendingPlayer(room, input = {}) {
  const joinInput = sanitizeJoinInput(input);
  const pending = {
    id: createId("player"),
    status: "pending",
    playerName: joinInput.playerName || t(room.language, "defaultPlayer"),
    characterName: joinInput.characterName || joinInput.playerName || t(room.language, "defaultCharacter"),
    archetype: joinInput.archetype || t(room.language, "defaultArchetype"),
    species: joinInput.species,
    classId: joinInput.classId,
    userId: joinInput.userId || null,
    requestedAt: nowIso()
  };
  room.pendingPlayers = [...(room.pendingPlayers || []), pending];
  return pending;
}

function publicPendingPlayer(pending) {
  return {
    id: pending.id,
    status: pending.status,
    playerName: pending.playerName,
    characterName: pending.characterName,
    archetype: pending.archetype,
    species: pending.species,
    classId: pending.classId,
    userId: pending.userId || null,
    requestedAt: pending.requestedAt,
    decidedAt: pending.decidedAt || null,
    decidedBy: pending.decidedBy || null,
    playerId: pending.playerId || null,
    reason: pending.reason || ""
  };
}

function pendingToJoinInput(pending) {
  return {
    playerName: pending.playerName,
    characterName: pending.characterName,
    archetype: pending.archetype,
    species: pending.species,
    classId: pending.classId,
    userId: pending.userId || null
  };
}

function requirePendingPlayer(room, pendingPlayerId) {
  const pending = (room.pendingPlayers || []).find((entry) => entry.id === pendingPlayerId);
  if (!pending) {
    throw codedError(404, "Pending player was not found", "PENDING_PLAYER_NOT_FOUND");
  }
  return pending;
}

function replacePlayerId(room, fromId, toId) {
  if (!fromId || fromId === toId) {
    return;
  }
  room.turnOrder = (room.turnOrder || []).map((id) => id === fromId ? toId : id);
  if (room.activePlayerId === fromId) {
    room.activePlayerId = toId;
  }
  for (const faction of room.factions || []) {
    faction.playerIds = (faction.playerIds || []).map((id) => id === fromId ? toId : id);
  }
}

function updateRoomAccessSummary(room) {
  room.access = summarizeRoomAccess(room);
}

function summarizeRoomAccess(room) {
  const mode = room.access?.mode || "open";
  return {
    mode,
    passwordProtected: mode === "password",
    hostApprovalRequired: mode === "host-approval",
    pendingCount: countPendingPlayers(room)
  };
}

function countPendingPlayers(room) {
  return (room.pendingPlayers || []).filter((entry) => entry.status === "pending").length;
}

function equipTranscriptText(language, characterName, itemName) {
  if (language === "zh") {
    return `${characterName}装备了${itemName}。`;
  }
  return `${characterName} equipped ${itemName}.`;
}

function actionInfluenceTranscriptText(language, influence = {}) {
  if (!influence?.modifier) return "";
  const sources = (influence.sourceLabels || []).join(language === "zh" ? "、" : ", ");
  return t(language, "rules.actionInfluence", {
    modifier: influence.modifier,
    sources,
    intent: influence.intent
  });
}

function applyDeclaredSpellUse(room, { player, actionText }) {
  const spellUse = resolveKnownSpellUse({
    character: player.character,
    actionText,
    language: room.language
  });
  if (!spellUse) return null;
  if (spellUse.canCast) {
    player.character.mana = spellUse.manaAfter;
  }
  const statusLabel = spellUse.statusEffect?.label?.[room.language] || spellUse.statusEffect?.label?.en || "";
  player.character.lastSpellUse = {
    spellId: spellUse.spellId,
    spellLabel: spellUse.spellLabel,
    canCast: spellUse.canCast,
    manaCost: spellUse.manaCost,
    manaBefore: spellUse.manaBefore,
    manaAfter: spellUse.manaAfter,
    statusEffect: spellUse.statusEffect,
    outcome: spellUse.outcome,
    atVersion: room.version
  };
  appendTranscript(room, {
    type: "spell",
    author: "Rules",
    playerId: player.id,
    text: t(room.language, spellUse.canCast ? "spell.used" : "spell.noMana", {
      characterName: player.character.name,
      spellName: spellUse.spellLabel?.[room.language] || spellUse.spellLabel?.en || spellUse.spellName,
      manaCost: spellUse.manaCost,
      manaBefore: spellUse.manaBefore,
      manaAfter: spellUse.manaAfter,
      outcome: spellUse.outcome?.[room.language] || spellUse.outcome?.en || "",
      status: statusLabel
    }),
    spell: {
      action: spellUse.canCast ? "cast" : "insufficient-mana",
      spellId: spellUse.spellId,
      spellLabel: spellUse.spellLabel,
      category: spellUse.category,
      tier: spellUse.tier,
      manaCost: spellUse.manaCost,
      manaBefore: spellUse.manaBefore,
      manaAfter: spellUse.manaAfter,
      canCast: spellUse.canCast,
      statusEffect: spellUse.statusEffect,
      outcome: spellUse.outcome,
      feedback: spellUse.feedback
    }
  });
  return spellUse;
}

function inventoryUseTranscriptText(language, character, result) {
  const base = t(language, "inventory.usedItem", {
    characterName: character.name,
    itemName: result.item.definition.label
  });
  const progression = progressionTranscriptSummary(language, character, result.stateDeltas);
  return progression ? `${base} ${progression}` : base;
}

function progressionTranscriptSummary(language, character, deltas = {}) {
  if (!deltas.xp && !deltas.level && !deltas.progression && !deltas.learnedSpells) return "";
  const xp = Math.max(0, Number.parseInt(deltas.xp ?? 0, 10) || 0);
  const level = Number.parseInt(character.level ?? 1, 10) || 1;
  const unlocks = progressionUnlockLabels(language, deltas.progression, deltas).join(", ")
    || (language === "zh" ? "等级收益已刷新" : "level benefits refreshed");
  return t(language, "inventory.progressionSummary", { xp, level, unlocks });
}

function progressionUnlockLabels(language, progression = {}, deltas = {}) {
  const labels = [];
  for (const spellId of deltas.learnedSpells || []) {
    labels.push(localizeRulesSpellName(language, spellId));
  }
  for (const feature of progression.features || []) {
    labels.push(progressionFeatureLabel(language, feature));
  }
  for (const action of progression.actions || []) {
    labels.push(progressionFeatureLabel(language, action));
  }
  for (const resource of progression.resources || []) {
    labels.push(progressionFeatureLabel(language, resource));
  }
  return [...new Set(labels.filter(Boolean))];
}

function progressionFeatureLabel(language, id) {
  const labels = {
    "action-surge": { en: "Action Surge", zh: "动作爆发" },
    actionSurge: { en: "Action Surge", zh: "动作爆发" },
    "extra-attack": { en: "Extra Attack", zh: "额外攻击" },
    fury: { en: "Fury", zh: "怒气" },
    "relentless-advance": { en: "Relentless Advance", zh: "不屈推进" }
  };
  const entry = labels[id];
  if (entry) return entry[language] || entry.en;
  const localizedCombatSkill = localizeCombatSkillName(language, id);
  if (localizedCombatSkill && localizedCombatSkill !== humanizeProgressionId(id)) return localizedCombatSkill;
  if (/^[a-z][a-z0-9-]*$/.test(String(id || "")) && localizedCombatSkill) return localizedCombatSkill;
  return humanizeProgressionId(id);
}

function humanizeProgressionId(id) {
  return String(id || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function assertHostAccess(room, hostToken, hostUserId = null) {
  if (room.ownerUserId && hostUserId && String(hostUserId) === String(room.ownerUserId)) {
    return;
  }
  if (room.ownerUserId && !room.auth?.hostTokenHash) {
    throw codedError(403, t(room.language, "hostTokenRequired"), "HOST_TOKEN_REQUIRED");
  }
  if (!room.auth?.hostTokenHash) {
    return;
  }
  if (!hostToken || hashToken(hostToken) !== room.auth.hostTokenHash) {
    throw codedError(403, t(room.language, "hostTokenRequired"), "HOST_TOKEN_REQUIRED");
  }
}

function assertPlayerAccess(room, playerId, playerToken) {
  const tokenHash = room.auth?.players?.[playerId]?.tokenHash;
  if (room.auth && !tokenHash) {
    throw codedError(403, t(room.language, "playerTokenRequired"), "PLAYER_TOKEN_REQUIRED");
  }
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

function hashSessionToken(token) {
  const digest = scryptSync(String(token), SESSION_HASH_SALT, SCRYPT_KEY_LENGTH, SCRYPT_OPTIONS).toString("hex");
  return `${SESSION_HASH_VERSION}$${digest}`;
}

function legacyPasswordHash(password, salt) {
  return createHash("sha256").update(`aidm-local-auth:${salt}:${String(password)}`).digest("hex");
}

function sessionTokenHashCandidates(token) {
  if (!token) {
    return [];
  }
  return [hashSessionToken(token), hashToken(token)];
}

function createPasswordHash(password) {
  const salt = randomBytes(16).toString("base64url");
  const digest = deriveScryptHex(password, salt, SCRYPT_OPTIONS);
  return [
    PASSWORD_HASH_VERSION,
    String(SCRYPT_OPTIONS.N),
    String(SCRYPT_OPTIONS.r),
    String(SCRYPT_OPTIONS.p),
    salt,
    digest
  ].join("$");
}

function verifyPasswordHash(password, storedHash, legacySalt) {
  const normalized = String(storedHash || "");
  if (normalized.startsWith(`${PASSWORD_HASH_VERSION}$`)) {
    return verifyScryptPasswordHash(password, normalized);
  }
  return safeCompareHex(normalized, legacyPasswordHash(password, legacySalt));
}

function needsPasswordHashUpgrade(storedHash) {
  return !String(storedHash || "").startsWith(`${PASSWORD_HASH_VERSION}$`);
}

function verifyScryptPasswordHash(password, storedHash) {
  const [version, nValue, rValue, pValue, salt, expected] = storedHash.split("$");
  const options = {
    N: Number(nValue),
    r: Number(rValue),
    p: Number(pValue),
    maxmem: SCRYPT_OPTIONS.maxmem
  };
  if (
    version !== PASSWORD_HASH_VERSION ||
    !Number.isInteger(options.N) ||
    !Number.isInteger(options.r) ||
    !Number.isInteger(options.p) ||
    !salt ||
    !expected
  ) {
    return false;
  }
  try {
    return safeCompareHex(deriveScryptHex(password, salt, options), expected);
  } catch {
    return false;
  }
}

function deriveScryptHex(secret, salt, options) {
  return scryptSync(String(secret), salt, SCRYPT_KEY_LENGTH, options).toString("hex");
}

function safeCompareHex(actualHex, expectedHex) {
  if (!/^[0-9a-f]+$/i.test(actualHex) || !/^[0-9a-f]+$/i.test(expectedHex)) {
    return false;
  }
  const actual = Buffer.from(actualHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

function codedError(statusCode, message, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function applySceneAtmosphere(room, { actionText = "", check = { success: true }, director = {}, reason = "scene-pressure" } = {}) {
  if (!room?.scene) return;
  const previous = room.scene.atmosphere || {};
  const next = deriveSceneAtmosphere(room, { actionText, check, director, reason, previous });
  room.scene.weatherState = next.weather;
  room.scene.season = next.season;
  room.scene.timeOfDay = next.timeOfDay;
  room.scene.atmosphere = next;
}

function deriveSceneAtmosphere(room, { actionText, check, director, reason, previous }) {
  const locationTags = sceneLocationTags(room);
  const weather = weatherForScene(room, { actionText, check, director, previous, locationTags });
  const season = seasonForScene(room, { actionText, previous, locationTags });
  const timeOfDay = timeOfDayForScene(room, { actionText, previous, locationTags });
  const mood = moodForScene(room, { check, director });
  const weatherTags = weatherSoundscapeTags(weather);
  const soundscapeTags = [
    ...locationTags.map((tag) => `location:${tag}`),
    ...weatherTags.map((tag) => `weather:${tag}`),
    `season:${season}`,
    `time:${timeOfDay}`,
    `mood:${mood}`
  ];
  const changed = previous.weather !== weather || previous.season !== season || previous.timeOfDay !== timeOfDay || previous.mood !== mood;

  return {
    weather,
    season,
    timeOfDay,
    mood,
    locationTags,
    weatherTags,
    tags: soundscapeTags,
    soundscapeTags,
    reason,
    changed,
    previous: previous.weather || previous.season || previous.timeOfDay || previous.mood
      ? {
          weather: previous.weather || null,
          season: previous.season || null,
          timeOfDay: previous.timeOfDay || null,
          mood: previous.mood || null
        }
      : null,
    atVersion: room.version
  };
}

function weatherForScene(room, { actionText, check, director, previous, locationTags }) {
  const text = normalizeSceneCue([actionText, room?.scene?.weatherState, room?.scene?.ambience, room?.scene?.location].filter(Boolean).join(" "));
  const danger = Number(room?.scene?.clocks?.danger ?? room?.scene?.threat ?? 0);
  if (/thunder|lightning|storm|雷|闪电|风暴/.test(text) || director?.beat === "crisis") return "thunderstorm";
  if (/downpour|heavy rain|rainstorm|暴雨|大雨|倾盆雨/.test(text)) return "heavy rain";
  if (/gale|howling wind|squall|狂风|疾风|强风/.test(text)) return "gale wind";
  if (/clear|sunny|sunlit|晴朗|晴天|阳光/.test(text) && !/rain|雨/.test(text)) return "clear sunny";
  if (/drizzle|light rain|rain|wet|mist|细雨|小雨|雨|潮湿|雾/.test(text)) {
    return danger >= 4 || check?.success === false ? "heavy rain" : "light rain";
  }
  if (locationTags.includes("waterfall") || locationTags.includes("pond")) return "mist and spray";
  if (locationTags.includes("archive") || locationTags.includes("market") || locationTags.includes("town")) return danger >= 4 ? "heavy rain" : "light rain";
  if (locationTags.includes("forest")) return previous.weather && previous.weather !== "clear sunny" ? previous.weather : "light wind";
  return previous.weather || "clear sunny";
}

function seasonForScene(room, { actionText, previous, locationTags }) {
  const text = normalizeSceneCue([actionText, room?.scene?.season, room?.scene?.ambience, room?.scene?.location].filter(Boolean).join(" "));
  if (/winter|snow|frost|ice|寒冬|冬|雪|霜|冰/.test(text)) return "winter";
  if (/spring|blossom|new leaf|春|花|新叶/.test(text)) return "spring";
  if (/summer|cicada|heat|夏|蝉|暑/.test(text)) return "summer";
  if (/autumn|fall|dry leaves|harvest|秋|落叶|收获/.test(text)) return "autumn";
  if (previous.season && previous.season !== "unknown") return previous.season;
  if (locationTags.includes("forest") || locationTags.includes("pond")) return "spring";
  if (locationTags.includes("market") || locationTags.includes("town")) return "autumn";
  return "autumn";
}

function timeOfDayForScene(room, { actionText, previous, locationTags }) {
  const text = normalizeSceneCue([actionText, room?.scene?.timeOfDay, room?.scene?.ambience, room?.scene?.location].filter(Boolean).join(" "));
  if (/dawn|morning|sunrise|清晨|黎明|早晨/.test(text)) return "dawn";
  if (/noon|midday|afternoon|正午|午后/.test(text)) return "day";
  if (/dusk|evening|sunset|黄昏|傍晚/.test(text)) return "dusk";
  if (/night|midnight|moon|星|夜|月/.test(text)) return "night";
  if (locationTags.includes("campfire") || locationTags.includes("shrine")) return "night";
  if (locationTags.includes("forest")) return "dusk";
  if (locationTags.includes("market") || locationTags.includes("town")) return "day";
  return previous.timeOfDay || "dusk";
}

function moodForScene(room, { check, director }) {
  const danger = Number(room?.scene?.clocks?.danger ?? room?.scene?.threat ?? 0);
  if (director?.beat === "crisis" || director?.beat === "retaliation" || danger >= 5) return "danger";
  if (check?.success === false || director?.beat === "complication") return "tense";
  if (director?.beat === "revelation" || director?.beat === "trail") return "mystery";
  return room?.tone === "heroic" ? "hopeful" : "mystery";
}

function sceneLocationTags(room) {
  const text = normalizeSceneCue([room?.scene?.location, room?.scene?.title, room?.scene?.ambience].filter(Boolean).join(" "));
  const tags = [];
  if (FOREST_ROUTE_PATTERN.test(text) || /森林|树林|古林|树/.test(text)) tags.push("forest");
  if (/market|bazaar|city|street|alley|vendor|集市|市场|城市|街|摊/.test(text)) tags.push("market");
  if (/town|village|square|小镇|村庄|广场/.test(text)) tags.push("town");
  if (/archive|library|ledger|档案|图书馆|账本/.test(text)) tags.push("archive");
  if (/tavern|inn|pub|酒馆|旅店|客栈/.test(text)) tags.push("tavern");
  if (/waterfall|falls|gorge|瀑布|峡谷/.test(text)) tags.push("waterfall");
  if (/pond|cistern|pool|marsh|shrine|池|蓄水池|神龛|神殿/.test(text)) tags.push(text.includes("shrine") || text.includes("神") ? "shrine" : "pond");
  if (/camp|campfire|hearth|ember|营地|篝火|壁炉|余烬/.test(text)) tags.push("campfire");
  if (/interior|room|hall|inside|室内|房间|门厅|大厅/.test(text)) tags.push("interior");
  return [...new Set(tags.length > 0 ? tags : ["archive"])];
}

function weatherSoundscapeTags(weather) {
  const value = normalizeSceneCue(weather);
  if (/thunder|storm|雷|风暴/.test(value)) return ["thunder", "heavy-rain", "gale-wind"];
  if (/heavy rain|downpour|暴雨|大雨/.test(value)) return ["heavy-rain", "wet"];
  if (/light rain|drizzle|rain|mist|spray|雨|雾|水雾/.test(value)) return ["light-rain", "wet"];
  if (/gale|wind|风/.test(value)) return [value.includes("gale") || value.includes("狂") ? "gale-wind" : "light-wind"];
  if (/clear|sunny|晴|阳光/.test(value)) return ["clear"];
  return [];
}

function normalizeSceneCue(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function attachKnowledgeToStructuredLog(event, { directorKnowledge, narrationKnowledge } = {}) {
  if (!event?.structuredLog?.metadata) return;
  const knowledgeMetadata = summarizeKnowledgeForLog(directorKnowledge, narrationKnowledge);
  if (Object.keys(knowledgeMetadata).length === 0) return;
  event.structuredLog = {
    ...event.structuredLog,
    metadata: {
      ...event.structuredLog.metadata,
      ...knowledgeMetadata
    }
  };
}

function updateSceneProgress(room, check, actionText, player) {
  const preActionRouteClues = room.scene?.clocks?.clues || 0;
  const director = applyDirectorBeat(room, { check, actionText, player });
  applySceneShift(room, actionText, check, director, { routeClues: preActionRouteClues });
  room.scene.threat = Math.max(0, Math.min(6, room.scene.threat + (check.success ? -0.2 : 0.6)));
  updateExitAvailability(room);
  const evolution = applySceneEvolution(room, { actionText, check, director, player });
  applySceneAtmosphere(room, { actionText, check, director, reason: evolution.clue ? "clue-progress" : evolution.consequence ? "danger-consequence" : "scene-pressure" });
  refreshDirectorKnowledge(room, { actionText, check, director, player });
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
  applySceneEventState(room, { actionText, check, director, player, evolution });
}

function refreshDirectorKnowledge(room, { actionText, check, director, player }) {
  if (!director) return;
  director.knowledge = buildRuleKnowledgeContext({ room, actionText, check, player, beat: director.beat });
  room.director = director;
}

function applySceneShift(room, actionText, check, director, { routeClues = null } = {}) {
  const lower = String(actionText || "").toLowerCase();
  const shift = sceneShiftFor(room, lower, check, director, { routeClues });
  if (!shift) {
    if (mentionsLockedExit(room, lower, { routeClues })) {
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

function applySceneEventState(room, { actionText, check, director, player, evolution }) {
  const promptPack = director?.knowledge?.promptPack || buildRuleKnowledgeContext({ room, player, actionText, check, beat: director?.beat }).promptPack;
  const randomEvent = promptPack.randomEvent || {};
  const environment = promptPack.weatherSeasonPressure || {};
  const eventState = {
    id: randomEvent.id || `event-${stableTextKey(actionText)}`,
    eventId: `event:${room.round || 1}:${room.version || 0}:${randomEvent.id || stableTextKey(actionText)}`,
    status: check.success ? "opportunity" : "complication",
    beat: director?.beat || "scene",
    clock: randomEvent.clock || (evolution?.clue ? "clues" : evolution?.consequence ? "danger" : "quest"),
    pressureDelta: Number(randomEvent.pressureDelta || 0),
    prompt: {
      en: randomEvent.prompt || "",
      zh: randomEvent.zhPrompt || randomEvent.prompt || ""
    },
    weather: environment.weather || room.scene?.atmosphere?.weather || room.scene?.weatherState || null,
    season: environment.season || room.scene?.atmosphere?.season || room.scene?.season || null,
    pressure: environment.pressure || director?.knowledge?.environment?.pressure || null,
    clueId: evolution?.clue?.id || null,
    rewardSourceId: evolution?.rewardHint?.sourceId || null,
    consequenceId: evolution?.consequence?.id || null,
    encounterState: room.combat?.state || null,
    deterministicSeed: promptPack.seed ?? null,
    tags: [
      `beat:${director?.beat || "scene"}`,
      environment.weather ? `weather:${environment.weather}` : null,
      environment.season ? `season:${environment.season}` : null,
      randomEvent.clock ? `clock:${randomEvent.clock}` : null
    ].filter(Boolean),
    action: String(actionText || "").slice(0, 120),
    atVersion: room.version
  };
  room.scene.eventState = eventState;
  room.scene.eventHistory = [eventState, ...(room.scene.eventHistory || [])
    .filter((entry) => entry.eventId !== eventState.eventId)]
    .slice(0, 5);
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

function sceneShiftFor(room, lowerAction, check, director, { routeClues = null } = {}) {
  const wantsTravel = hasTravelIntent(lowerAction);
  if (wantsTravel && check.success && FOREST_ROUTE_PATTERN.test(lowerAction) && canUseExit(room, "forest", { routeClues })) {
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
  if (wantsTravel && check.success && /market|bazaar|city|street|alley|crowd|vendor|市场|集市|城市|街|小巷/.test(lowerAction) && canUseExit(room, "market", { routeClues })) {
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
  if (wantsTravel && check.success && /tavern|inn|pub|alehouse|common room|旅馆|酒馆|客栈/.test(lowerAction)) {
    return {
      title: sceneText(room, "Rainlit Tavern", "雨灯旅馆"),
      location: sceneText(room, "Crowded inn common room", "拥挤旅馆大厅"),
      objective: sceneText(room, "Trade rumors and recover supplies before the next lead goes cold.", "在下一条线索冷掉前交换传闻并补齐物资。"),
      ambience: sceneText(room, "mugs, wet cloaks, low songs, kitchen smoke", "酒杯、湿斗篷、低声歌和厨房烟气"),
      exits: sceneExits("tavern"),
      rewardSources: sceneRewardSources("tavern"),
      reason: "tavern-action"
    };
  }
  if (wantsTravel && check.success && /dungeon|crypt|catacomb|underground|ruin|vault|地牢|地下城|墓穴|地下|遗迹|密库/.test(lowerAction)) {
    return {
      title: sceneText(room, "Old Dungeon", "旧地牢"),
      location: sceneText(room, "Sealed stair under the city", "城市下方的封闭阶梯"),
      objective: sceneText(room, "Search the sealed chambers without waking the old mechanism.", "搜索封闭石室，同时别惊动旧机关。"),
      ambience: sceneText(room, "stone drip, stale air, chain echo, hidden locks", "石缝滴水、陈旧空气、链声回响和暗锁"),
      exits: sceneExits("dungeon"),
      rewardSources: sceneRewardSources("dungeon"),
      reason: "dungeon-action"
    };
  }
  if (wantsTravel && check.success && /waterfall|falls|gorge|瀑布|峡谷/.test(lowerAction) && canUseExit(room, "waterfall", { routeClues })) {
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
  if (wantsTravel && check.success && /pond|marsh|swamp|cistern|pool|池|池塘|沼泽|蓄水池/.test(lowerAction) && canUseExit(room, "pond", { routeClues })) {
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
  if (wantsTravel && check.success && /camp|campfire|rest|hearth|篝火|营地|休息|壁炉/.test(lowerAction) && canUseExit(room, "camp", { routeClues })) {
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
  const reward = chooseCatalogReward(room, { player, actionText, check, rewardSource, sourceEventId })
    || chooseRewardAsset(room, actionText, check, { source: rewardSource });
  if (!reward) return null;
  const rewardItemId = reward.itemId || `generated:${reward.semanticKey || reward.id}`;
  if (!player.character.inventory.some((entry) => entry.itemId === rewardItemId && entry.source === (rewardSource?.id || "reward"))) {
    const inventoryEntry = reward.itemId
      ? createInventoryEntry(reward.itemId, {
          condition: reward.condition || undefined,
          seed: `${player.id}:${sourceEventId || reward.id}`,
          source: rewardSource?.id || "reward"
        })
      : createAssetInventoryEntry(reward, {
          seed: `${player.id}:${sourceEventId || reward.id}`,
          source: rewardSource?.id || "reward"
        });
    player.character.inventory.push(inventoryEntry);
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

function chooseCatalogReward(room, { player, actionText, check, rewardSource, sourceEventId }) {
  if (!check?.success || !rewardSource?.catalogLootPool) return null;
  const existingItemIds = new Set((player?.character?.inventory || []).map((entry) => entry.itemId));
  const itemId = chooseLootItemId(rewardSource.catalogLootPool, {
    roomId: room?.id,
    version: room?.version,
    round: room?.round,
    sourceId: rewardSource.id,
    actionText,
    excludeItemIds: existingItemIds
  });
  if (!itemId) return null;
  return createCatalogReward(itemId, {
    language: room.language,
    source: rewardSource,
    poolId: rewardSource.catalogLootPool,
    seed: `${player?.id || "player"}:${sourceEventId || itemId}`
  });
}

function hasTravelIntent(lowerAction) {
  return /follow|go|head|enter|leave|travel|cross|move|walk|run|sneak|track|pursue|approach|return|前往|进入|离开|穿过|沿着|追踪|靠近|返回/.test(lowerAction);
}

function canUseExit(room, target, { routeClues = null } = {}) {
  const currentClues = room?.scene?.clocks?.clues ?? 0;
  const clues = routeClues ?? currentClues;
  const requiredClues = routeClueRequirement(target);
  const basicRouteUnlockedByCurrentAction = routeClues !== null && requiredClues <= 1 && currentClues >= requiredClues;
  const exit = (room?.scene?.exits || []).find((entry) => entry.target === target);
  if (!exit) {
    return target === "market" || clues >= requiredClues || basicRouteUnlockedByCurrentAction;
  }
  return Boolean(exit.available) || clues >= requiredClues || basicRouteUnlockedByCurrentAction;
}

function routeClueRequirement(target) {
  if (target === "forest" || target === "camp") return 1;
  if (target === "market") return 0;
  return 3;
}

function mentionsLockedExit(room, lowerAction, { routeClues = null } = {}) {
  if (!hasTravelIntent(lowerAction)) return false;
  const targets = [
    ["forest", FOREST_ROUTE_PATTERN],
    ["waterfall", /waterfall|falls|gorge|瀑布|峡谷/],
    ["pond", /pond|marsh|swamp|cistern|pool|池|池塘|沼泽|蓄水池/],
    ["camp", /camp|campfire|rest|hearth|篝火|营地|休息|壁炉/]
  ];
  return targets.some(([target, pattern]) => pattern.test(lowerAction) && !canUseExit(room, target, { routeClues }));
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
      exit("tavern", "Rainlit tavern", "雨灯旅馆", true),
      exit("crisis", "Barricade line", "街垒防线", true)
    ],
    tavern: [
      exit("market", "Market lanterns", "集市灯火", true),
      exit("camp", "Back-room watch", "后室守夜点", true),
      exit("dungeon", "Cellar stair", "地窖阶梯", true)
    ],
    dungeon: [
      exit("market", "Surface market", "地表集市", true),
      exit("waterfall", "Drainage ruin", "排水遗迹", true),
      exit("camp", "Fallback watch", "撤退守夜点", true)
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
      source("source-root-cache", "Root-tangled cache", "树根缠绕的暗藏物", ["root cache", "trail cache", "under the roots", "树根", "暗藏物"], "camp")
    ],
    market: [
      source("source-vendor-ledger", "Vendor ledger stall", "摊贩账本摊位", ["vendor ledger", "market ledger", "stall drawer", "摊位", "账本"], "market")
    ],
    tavern: [
      source("source-inn-lockbox", "Innkeeper lockbox", "店主小锁箱", ["inn lockbox", "tavern lockbox", "common room drawer", "小锁箱", "旅馆", "酒馆"], "tavern")
    ],
    dungeon: [
      source("source-dungeon-vault", "Sealed dungeon vault", "封闭地牢密库", ["dungeon vault", "sealed vault", "crypt cache", "地牢", "密库", "墓穴"], "dungeon")
    ],
    waterfall: [
      source("source-ruin-niche", "Spray-worn ruin niche", "水雾侵蚀的遗迹壁龛", ["ruin niche", "stone niche", "washed cache", "壁龛", "遗迹"], "dungeon")
    ],
    pond: [
      source("source-cistern-reflection", "Cistern reflection clue", "蓄水池倒影线索", ["reflection", "cistern offering", "waterlogged satchel", "倒影", "水浸包"], "dungeon")
    ],
    camp: [
      source("source-watch-pack", "Shared watch pack", "守夜补给包", ["watch pack", "camp supply", "coalside pouch", "补给包", "营地"], "camp")
    ],
    crisis: [
      source("source-fallen-raider", "Fallen raider kit", "倒下袭击者的装备", ["fallen raider", "raider kit", "disarmed enemy", "袭击者", "缴械"], "combat")
    ]
  };
  return sourceMap[scene] || [];
}

function source(id, en, zh, keywords, catalogLootPool = "") {
  return {
    id,
    kind: "scene-source",
    label: { en, zh },
    keywords,
    itemTags: keywords,
    catalogLootPool
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
    "arcane-shield": "奥术护盾",
    "cleanse-poison": "净毒术",
    "frost-bind": "霜缚术",
    "glass-echo": "玻璃回声",
    "storm-arc": "风暴弧光",
    "thunder-step": "雷步"
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
