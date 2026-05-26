import { createId, nowIso } from "./id.js";

export const CAMPAIGN_MEMORY_SCHEMA_VERSION = 1;
export const CAMPAIGN_MEMORY_LAYERS = Object.freeze({
  TIMELINE: "timeline",
  QUEST: "quest",
  NPC: "npc",
  CLUE: "clue",
  SCENE: "scene"
});

const DEFAULT_LAYER_ORDER = Object.freeze([
  CAMPAIGN_MEMORY_LAYERS.TIMELINE,
  CAMPAIGN_MEMORY_LAYERS.QUEST,
  CAMPAIGN_MEMORY_LAYERS.NPC,
  CAMPAIGN_MEMORY_LAYERS.CLUE,
  CAMPAIGN_MEMORY_LAYERS.SCENE
]);

const LAYER_SCORE_BOOST = Object.freeze({
  [CAMPAIGN_MEMORY_LAYERS.TIMELINE]: 0.08,
  [CAMPAIGN_MEMORY_LAYERS.QUEST]: 0.18,
  [CAMPAIGN_MEMORY_LAYERS.NPC]: 0.18,
  [CAMPAIGN_MEMORY_LAYERS.CLUE]: 0.18,
  [CAMPAIGN_MEMORY_LAYERS.SCENE]: 0.12
});

const STOP_WORDS = new Set([
  "the",
  "and",
  "you",
  "your",
  "with",
  "that",
  "this",
  "from",
  "into",
  "玩家",
  "行动",
  "进行"
]);

export class MemoryIndex {
  constructor(memories = []) {
    this.memories = Array.isArray(memories)
      ? memories.map((memory) => normalizeMemoryEntry(memory)).filter(Boolean)
      : [];
  }

  add(input = {}) {
    const memory = normalizeMemoryEntry({
      ...input,
      id: input.id || createId("mem"),
      createdAt: input.createdAt || nowIso()
    });
    if (!memory) return null;
    this.memories.push(memory);
    return memory;
  }

  retrieve(query, { limit = 6, kinds = null, layers = null, statuses = null } = {}) {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) {
      return this.memories
        .filter((memory) => matchesMemoryFilter(memory, { kinds, layers, statuses }))
        .slice(-limit)
        .reverse();
    }

    return this.rank(query, { kinds, layers, statuses })
      .slice(0, limit)
      .map((entry) => entry.memory);
  }

  retrieveWithScores(query, { limit = 6, kinds = null, layers = null, statuses = null } = {}) {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) {
      return this.memories
        .filter((memory) => matchesMemoryFilter(memory, { kinds, layers, statuses }))
        .slice(-limit)
        .reverse()
        .map((memory) => ({
          memory,
          score: 0,
          matchedTokens: [],
          tokenCount: tokenize(`${memory.text} ${(memory.tags || []).join(" ")}`).size
        }));
    }
    return this.rank(query, { kinds, layers, statuses }).slice(0, limit);
  }

  retrieveStructuredContext(query, { limit = 8, perLayerLimit = 2, layers = DEFAULT_LAYER_ORDER, statuses = null } = {}) {
    const ranked = this.rank(query, { layers, statuses });
    const layerOrder = normalizeLayerList(layers);
    const layerCounts = new Map();
    const selected = [];

    for (const entry of ranked) {
      const layer = entry.memory.layer || entry.memory.kind || "event";
      const currentCount = layerCounts.get(layer) || 0;
      if (currentCount >= perLayerLimit) continue;
      selected.push(entry);
      layerCounts.set(layer, currentCount + 1);
      if (selected.length >= limit) break;
    }

    const sections = layerOrder
      .map((layer) => ({
        layer,
        entries: selected.filter((entry) => (entry.memory.layer || entry.memory.kind) === layer)
      }))
      .filter((section) => section.entries.length > 0);

    return {
      query: String(query ?? ""),
      memories: selected.map((entry) => entry.memory),
      results: selected,
      sections,
      diagnostics: {
        candidateCount: ranked.length,
        selectedCount: selected.length,
        matchedLayerCount: sections.length,
        layerCounts: Object.fromEntries(sections.map((section) => [section.layer, section.entries.length])),
        topScore: Number((selected[0]?.score || 0).toFixed(4))
      }
    };
  }

  rank(query, { kinds = null, layers = null, statuses = null } = {}) {
    const queryTokens = tokenize(query);
    const candidates = this.memories.filter((memory) => matchesMemoryFilter(memory, { kinds, layers, statuses }));
    const corpus = buildCorpusStats(candidates);
    return candidates
      .map((memory) => scoreMemory(memory, queryTokens, query, corpus))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt))
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));
  }

  toJSON() {
    return this.memories;
  }
}

export function extractMemoryTags(text) {
  const tokens = [...tokenize(text)];
  return tokens.slice(0, 8);
}

export function createCampaignMemoryState(value = null) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      schemaVersion: value.schemaVersion || CAMPAIGN_MEMORY_SCHEMA_VERSION,
      entries: normalizeMemoryEntries(value.entries),
      updatedAt: value.updatedAt || null,
      layerCounts: value.layerCounts || {}
    };
  }
  return {
    schemaVersion: CAMPAIGN_MEMORY_SCHEMA_VERSION,
    entries: normalizeMemoryEntries(Array.isArray(value) ? value : []),
    updatedAt: null,
    layerCounts: {}
  };
}

export function createCampaignMemoryIndex(roomOrState = {}) {
  const state = createCampaignMemoryState(roomOrState?.campaignMemory || roomOrState);
  const fallbackMemories = state.entries.length > 0
    ? []
    : normalizeMemoryEntries(roomOrState?.memories || []);
  return new MemoryIndex([...state.entries, ...fallbackMemories]);
}

export function appendCampaignMemoryEntries(room, entries = [], { limit = 1200 } = {}) {
  if (!room || typeof room !== "object") {
    return createCampaignMemoryState();
  }
  const state = createCampaignMemoryState(room.campaignMemory);
  const byId = new Map(state.entries.map((entry) => [entry.id, entry]));
  for (const entry of normalizeMemoryEntries(entries)) {
    byId.set(entry.id, entry);
  }
  const normalizedLimit = Math.max(1, Number.isFinite(Number(limit)) ? Number(limit) : 1200);
  const nextEntries = [...byId.values()]
    .sort(compareMemoryChronology)
    .slice(-normalizedLimit);
  room.campaignMemory = {
    schemaVersion: CAMPAIGN_MEMORY_SCHEMA_VERSION,
    entries: nextEntries,
    updatedAt: nowIso(),
    layerCounts: countMemoryLayers(nextEntries)
  };
  return room.campaignMemory;
}

export function buildCampaignMemoryEntries({
  room,
  player,
  actionText = "",
  check = {},
  narration = {},
  gmEvent = null,
  playerEvent = null,
  actionMemory = null,
  director = null,
  evolution = {}
} = {}) {
  const sourceEventId = gmEvent?.id || actionMemory?.sourceEventId || playerEvent?.id || null;
  const createdAt = gmEvent?.createdAt || actionMemory?.createdAt || nowIso();
  const language = room?.language || "en";
  const scene = room?.scene || {};
  const characterName = player?.character?.name || player?.name || "Unknown";
  const sceneLocation = localizeMemoryText(scene.location, language);
  const sceneObjective = localizeMemoryText(scene.objective, language);
  const beat = director?.beat || scene.eventState?.beat || "scene";
  const result = check.success ? "success" : "failure";
  const base = {
    sourceEventId,
    createdAt,
    round: numberOrNull(room?.round),
    version: numberOrNull(room?.version),
    sceneId: stableMemoryKey(sceneLocation || scene.title || room?.id || "scene"),
    evidence: [playerEvent?.id, gmEvent?.id].filter(Boolean)
  };
  const baseTags = uniqueTags([
    ...extractMemoryTags(actionText),
    ...extractMemoryTags(sceneObjective),
    ...extractMemoryTags(sceneLocation),
    characterName,
    beat,
    result
  ]);

  const entries = [
    {
      ...base,
      id: campaignMemoryId(sourceEventId, CAMPAIGN_MEMORY_LAYERS.TIMELINE, "beat"),
      kind: "timeline-beat",
      layer: CAMPAIGN_MEMORY_LAYERS.TIMELINE,
      subject: characterName,
      status: "resolved",
      anchor: sceneLocation || null,
      text: [
        `Round ${room?.round || 1} ${characterName} attempted: ${String(actionText).slice(0, 180)}.`,
        `Beat ${beat}; result ${result}; roll ${check.total ?? "?"} vs DC ${check.dc ?? "?"}.`,
        `Scene ${sceneLocation || "unknown"} objective: ${sceneObjective || "unknown"}.`,
        narration?.text ? `Narration: ${String(narration.text).slice(0, 220)}` : null
      ].filter(Boolean).join(" "),
      tags: uniqueTags([...baseTags, "timeline", "beat"]),
      weight: check.success ? 1.05 : 1.15,
      salience: check.success ? 1.1 : 1.3,
      metadata: { beat, result, margin: numberOrNull(check.margin) }
    },
    ...buildQuestThreadEntries({ room, actionText, check, sourceEventId, createdAt, base, baseTags }),
    ...buildNpcFactEntries({ room, director, check, sourceEventId, createdAt, base, baseTags }),
    ...buildOpenClueEntries({ room, evolution, actionText, check, sourceEventId, createdAt, base, baseTags }),
    buildSceneAnchorEntry({ room, director, sourceEventId, createdAt, base, baseTags })
  ].filter(Boolean);

  return entries;
}

export function stableMemoryKey(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = Math.imul(31, hash) + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function tokenize(text) {
  const normalized = String(text ?? "").toLowerCase();
  const latinTokens = normalized.match(/[a-z0-9_]{2,}/g) || [];
  const cjkTokens = normalized.match(/[\u3400-\u9fff]/g) || [];
  const tokens = [...latinTokens, ...cjkTokens].filter((token) => !STOP_WORDS.has(token));
  return new Set(tokens);
}

function scoreMemory(memory, queryTokens, query = "", corpus = { total: 0, documentFrequency: new Map() }) {
  const memoryTokens = tokenize(`${memory.text} ${(memory.tags || []).join(" ")}`);
  let overlap = 0;
  const matchedTokens = [];
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      overlap += tokenWeight(token, corpus);
      matchedTokens.push(token);
    }
  }
  const tagBoost = (memory.tags || []).filter((tag) => queryTokens.has(tag)).length * 0.5;
  const phraseBoost = phraseMatchBoost(memory.text, query);
  const coverage = queryTokens.size > 0 ? matchedTokens.length / queryTokens.size : 0;
  const lexicalScore = overlap + tagBoost + phraseBoost;
  const score = lexicalScore > 0
    ? (lexicalScore * (memory.weight || 1))
      + salienceBoost(memory)
      + recencyBoost(memory, corpus)
      + (LAYER_SCORE_BOOST[memory.layer] || 0)
    : 0;
  return {
    memory,
    score,
    matchedTokens,
    tokenCount: memoryTokens.size,
    queryTokenCount: queryTokens.size,
    coverage: Number(coverage.toFixed(4))
  };
}

function buildCorpusStats(memories) {
  const documentFrequency = new Map();
  const positions = new Map();
  const timestamps = [];
  for (const memory of memories) {
    for (const token of tokenize(`${memory.text} ${(memory.tags || []).join(" ")}`)) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
    positions.set(memory.id, positions.size);
    const timestamp = Date.parse(memory.createdAt || "");
    if (Number.isFinite(timestamp)) timestamps.push(timestamp);
  }
  return {
    total: memories.length,
    documentFrequency,
    positions,
    oldestTimestamp: timestamps.length ? Math.min(...timestamps) : null,
    newestTimestamp: timestamps.length ? Math.max(...timestamps) : null
  };
}

function tokenWeight(token, corpus) {
  const total = Math.max(1, corpus.total || 1);
  const frequency = corpus.documentFrequency.get(token) || 0;
  return 1 + Math.log(1 + total / (1 + frequency)) * 0.2;
}

function phraseMatchBoost(text, query) {
  const normalizedMemory = normalizeSearchText(text);
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedMemory || !normalizedQuery) return 0;

  const queryParts = normalizedQuery.split(" ").filter((part) => part.length >= 3);
  const phraseHits = queryParts.filter((part) => normalizedMemory.includes(part)).length;
  if (normalizedMemory.includes(normalizedQuery)) {
    return 2;
  }
  return Math.min(1.5, phraseHits * 0.25);
}

function recencyBoost(memory, corpus) {
  const total = Math.max(1, corpus.total || 1);
  if (total <= 1) return 0.15;
  const timestamp = Date.parse(memory.createdAt || "");
  if (
    Number.isFinite(timestamp)
    && Number.isFinite(corpus.oldestTimestamp)
    && Number.isFinite(corpus.newestTimestamp)
    && corpus.newestTimestamp > corpus.oldestTimestamp
  ) {
    return ((timestamp - corpus.oldestTimestamp) / (corpus.newestTimestamp - corpus.oldestTimestamp)) * 0.15;
  }
  const position = corpus.positions?.get(memory.id) ?? 0;
  return (position / Math.max(1, total - 1)) * 0.15;
}

function salienceBoost(memory) {
  const salience = Number(memory.salience ?? memory.weight ?? 1);
  if (!Number.isFinite(salience)) return 0.2;
  return Math.max(0, Math.min(3, salience)) * 0.2;
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMemoryEntries(entries) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => normalizeMemoryEntry(entry))
    .filter(Boolean);
}

function normalizeMemoryEntry(input = {}) {
  const text = String(input.text ?? "").trim();
  if (!text) return null;
  const weight = numberWithFallback(input.weight, 1);
  const layer = normalizeLayer(input.layer || layerFromKind(input.kind));
  return {
    id: input.id ? String(input.id) : createId("mem"),
    kind: String(input.kind || layer || "event"),
    layer,
    text,
    tags: uniqueTags(input.tags || []),
    weight,
    salience: numberWithFallback(input.salience, weight),
    subject: input.subject ? String(input.subject).trim() : null,
    status: input.status ? String(input.status).trim().toLowerCase() : null,
    sourceEventId: input.sourceEventId || null,
    createdAt: input.createdAt || nowIso(),
    round: numberOrNull(input.round),
    version: numberOrNull(input.version),
    sceneId: input.sceneId ? String(input.sceneId) : null,
    questId: input.questId ? String(input.questId) : null,
    npcId: input.npcId ? String(input.npcId) : null,
    clueId: input.clueId ? String(input.clueId) : null,
    anchor: input.anchor ? String(input.anchor).trim() : null,
    evidence: normalizeEvidence(input.evidence),
    metadata: normalizeMetadata(input.metadata)
  };
}

function matchesMemoryFilter(memory, { kinds = null, layers = null, statuses = null } = {}) {
  const kindList = normalizeStringList(kinds);
  const layerList = normalizeLayerList(layers);
  const statusList = normalizeStringList(statuses);
  return (!kindList || kindList.includes(memory.kind))
    && (!layerList || layerList.includes(memory.layer || memory.kind))
    && (!statusList || statusList.includes(memory.status));
}

function normalizeLayerList(layers) {
  if (!layers) return null;
  return normalizeStringList(layers).map((layer) => normalizeLayer(layer));
}

function normalizeStringList(value) {
  if (!value) return null;
  return (Array.isArray(value) ? value : [value])
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean);
}

function normalizeLayer(layer) {
  const normalized = String(layer || "").trim().toLowerCase();
  return normalized || "event";
}

function layerFromKind(kind) {
  const normalized = String(kind || "").toLowerCase();
  if (/quest|thread/.test(normalized)) return CAMPAIGN_MEMORY_LAYERS.QUEST;
  if (/npc|intent|relationship/.test(normalized)) return CAMPAIGN_MEMORY_LAYERS.NPC;
  if (/clue|lead|revelation/.test(normalized)) return CAMPAIGN_MEMORY_LAYERS.CLUE;
  if (/scene|anchor|location/.test(normalized)) return CAMPAIGN_MEMORY_LAYERS.SCENE;
  if (/timeline|beat|event|complication/.test(normalized)) return CAMPAIGN_MEMORY_LAYERS.TIMELINE;
  return "event";
}

function normalizeEvidence(value) {
  return (Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .map((entry) => String(entry))
    .slice(0, 8);
}

function normalizeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, normalizeMetadataValue(entry)])
  );
}

function normalizeMetadataValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((entry) => normalizeMetadataValue(entry)).slice(0, 12);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, normalizeMetadataValue(entry)])
    );
  }
  return String(value);
}

function uniqueTags(tags) {
  return [...new Set((Array.isArray(tags) ? tags : [tags])
    .filter(Boolean)
    .flatMap((tag) => String(tag).toLowerCase().split(/[^a-z0-9_\u3400-\u9fff-]+/u))
    .filter((tag) => tag && !STOP_WORDS.has(tag)))]
    .slice(0, 24);
}

function numberWithFallback(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function compareMemoryChronology(left, right) {
  const time = Date.parse(left.createdAt || "") - Date.parse(right.createdAt || "");
  if (time !== 0 && Number.isFinite(time)) return time;
  const version = (left.version ?? 0) - (right.version ?? 0);
  if (version !== 0) return version;
  return String(left.id).localeCompare(String(right.id));
}

function countMemoryLayers(entries) {
  const counts = {};
  for (const entry of entries) {
    const layer = entry.layer || entry.kind || "event";
    counts[layer] = (counts[layer] || 0) + 1;
  }
  return counts;
}

function buildQuestThreadEntries({ room, actionText, check, sourceEventId, createdAt, base, baseTags }) {
  return (room?.quests || []).map((quest, index) => {
    const threadType = quest.id === "quest-ledger" || index === 0 ? "main" : "side";
    const title = localizeMemoryText(quest.title, room?.language || "en") || quest.id || "quest";
    const clues = (quest.clues || []).slice(-4).map((clue) => localizeMemoryText(clue, room?.language || "en"));
    return {
      ...base,
      id: campaignMemoryId(`${sourceEventId || room?.id}:${quest.id || index}`, CAMPAIGN_MEMORY_LAYERS.QUEST, threadType),
      kind: "quest-thread",
      layer: CAMPAIGN_MEMORY_LAYERS.QUEST,
      questId: quest.id || null,
      subject: title,
      status: quest.status || "active",
      anchor: threadType,
      text: [
        `${threadType} quest thread ${title}: status ${quest.status || "active"}, progress ${Math.round(Number(quest.progress || 0))}%.`,
        clues.length ? `Known quest clues: ${clues.join("; ")}.` : "No confirmed quest clues yet.",
        `Current action: ${String(actionText).slice(0, 160)}.`,
        `Latest check ${check.success ? "advanced" : "did not advance"} the thread.`
      ].join(" "),
      tags: uniqueTags([...baseTags, "quest", threadType, quest.id, title, ...clues]),
      weight: threadType === "main" ? 1.2 : 1.05,
      salience: threadType === "main" ? 1.7 : 1.35,
      metadata: {
        threadType,
        progress: numberOrNull(quest.progress),
        cluesCount: Array.isArray(quest.clues) ? quest.clues.length : 0
      },
      createdAt
    };
  });
}

function buildNpcFactEntries({ room, director, check, sourceEventId, createdAt, base, baseTags }) {
  const entries = [];
  const intent = director?.npcIntent || room?.director?.npcIntent;
  if (intent?.type && intent.type !== "none") {
    entries.push({
      ...base,
      id: campaignMemoryId(sourceEventId, CAMPAIGN_MEMORY_LAYERS.NPC, intent.type),
      kind: "npc-fact",
      layer: CAMPAIGN_MEMORY_LAYERS.NPC,
      npcId: "scene-npc-intent",
      subject: `NPC ${intent.type}`,
      status: intent.type === "counterattack" || intent.type === "pressure" ? "active" : "open",
      anchor: localizeMemoryText(room?.scene?.location, room?.language || "en") || null,
      text: `NPC intent fact: ${intent.type}; reason: ${intent.reason || "scene pressure"}. This intent remains relevant until the table resolves it in the scene.`,
      tags: uniqueTags([...baseTags, "npc", "intent", intent.type, intent.reason]),
      weight: check.success ? 1.05 : 1.25,
      salience: intent.type === "pressure" || intent.type === "counterattack" ? 1.75 : 1.45,
      metadata: { intentType: intent.type, reason: intent.reason || "" },
      createdAt
    });
  }
  const tactical = room?.combat?.tacticalIntent;
  if (tactical?.type) {
    entries.push({
      ...base,
      id: campaignMemoryId(sourceEventId, CAMPAIGN_MEMORY_LAYERS.NPC, `tactical-${tactical.type}`),
      kind: "npc-fact",
      layer: CAMPAIGN_MEMORY_LAYERS.NPC,
      npcId: tactical.actorId || "encounter",
      subject: `NPC tactic ${tactical.type}`,
      status: "active",
      text: `NPC tactical intent: ${tactical.type}; target ${tactical.targetId || "none"}; reason ${tactical.reason || "encounter pressure"}.`,
      tags: uniqueTags([...baseTags, "npc", "tactic", tactical.type, tactical.reason, tactical.actorId, tactical.targetId]),
      weight: 1.1,
      salience: 1.3,
      metadata: { tacticalIntent: tactical },
      createdAt
    });
  }
  return entries;
}

function buildOpenClueEntries({ room, evolution, actionText, check, sourceEventId, createdAt, base, baseTags }) {
  const clues = [
    evolution?.clue,
    ...(room?.scene?.recentClues || [])
  ].filter(Boolean);
  const uniqueClues = new Map(clues.map((clue) => [clue.id || stableMemoryKey(localizeMemoryText(clue.detail, room?.language || "en")), clue]));
  return [...uniqueClues.values()].slice(-4).map((clue) => {
    const detail = localizeMemoryText(clue.detail, room?.language || "en") || localizeMemoryText(clue.label, room?.language || "en");
    const label = localizeMemoryText(clue.label, room?.language || "en") || clue.id || "clue";
    return {
      ...base,
      id: campaignMemoryId(clue.id || sourceEventId, CAMPAIGN_MEMORY_LAYERS.CLUE, "open"),
      kind: "open-clue",
      layer: CAMPAIGN_MEMORY_LAYERS.CLUE,
      clueId: clue.id || null,
      subject: label,
      status: "open",
      anchor: clue.sourceName || localizeMemoryText(room?.scene?.location, room?.language || "en") || null,
      text: `Open clue ${label}: ${detail || "follow up needed"}. Source ${clue.sourceName || clue.sourceId || "current scene"}. Trigger action: ${String(actionText).slice(0, 140)}.`,
      tags: uniqueTags([...baseTags, "open", "clue", label, detail, clue.sourceId, clue.sourceName]),
      weight: check.success ? 1.25 : 1,
      salience: clue.kind === "revelation" ? 1.9 : 1.55,
      metadata: {
        sourceId: clue.sourceId || null,
        sourceName: clue.sourceName || null,
        kind: clue.kind || "clue"
      },
      createdAt
    };
  });
}

function buildSceneAnchorEntry({ room, director, sourceEventId, createdAt, base, baseTags }) {
  const scene = room?.scene || {};
  const location = localizeMemoryText(scene.location, room?.language || "en") || "unknown scene";
  const objective = localizeMemoryText(scene.objective, room?.language || "en") || "unknown objective";
  const exits = (scene.exits || [])
    .filter((exit) => exit.available)
    .map((exit) => localizeMemoryText(exit.label, room?.language || "en") || exit.target || exit.id)
    .slice(0, 4);
  return {
    ...base,
    id: campaignMemoryId(sourceEventId, CAMPAIGN_MEMORY_LAYERS.SCENE, stableMemoryKey(`${location}:${objective}`)),
    kind: "scene-anchor",
    layer: CAMPAIGN_MEMORY_LAYERS.SCENE,
    subject: location,
    status: "current",
    anchor: location,
    text: [
      `Scene anchor: ${location}. Objective: ${objective}.`,
      `Beat ${director?.beat || room?.director?.beat || "scene"}; threat ${room?.scene?.threat ?? "unknown"}.`,
      exits.length ? `Available routes: ${exits.join(", ")}.` : "No route has been established yet.",
      scene.currentLead ? `Current lead: ${localizeMemoryText(scene.currentLead.detail, room?.language || "en")}.` : null
    ].filter(Boolean).join(" "),
    tags: uniqueTags([...baseTags, "scene", "anchor", location, objective, ...exits]),
    weight: 1.05,
    salience: 1.25,
    metadata: {
      beat: director?.beat || room?.director?.beat || null,
      exits,
      threat: numberOrNull(room?.scene?.threat)
    },
    createdAt
  };
}

function campaignMemoryId(sourceEventId, layer, suffix = "entry") {
  return `cmem:${layer}:${stableMemoryKey(`${sourceEventId || "source"}:${suffix}`)}`;
}

function localizeMemoryText(value, language = "en") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.zh || value.default || "";
}
