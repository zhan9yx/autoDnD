import { createId, nowIso } from "./id.js";

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
    this.memories = Array.isArray(memories) ? memories : [];
  }

  add({ kind = "event", text, tags = [], weight = 1, sourceEventId = null, createdAt = null }) {
    if (!text || !String(text).trim()) {
      return null;
    }
    const numericWeight = Number(weight);
    const memory = {
      id: createId("mem"),
      kind,
      text: String(text).trim(),
      tags: [...new Set(tags.filter(Boolean).map((tag) => String(tag).toLowerCase()))],
      weight: Number.isFinite(numericWeight) ? numericWeight : 1,
      sourceEventId,
      createdAt: createdAt || nowIso()
    };
    this.memories.push(memory);
    return memory;
  }

  retrieve(query, { limit = 6, kinds = null } = {}) {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) {
      return this.memories.slice(-limit).reverse();
    }

    return this.rank(query, { kinds })
      .slice(0, limit)
      .map((entry) => entry.memory);
  }

  retrieveWithScores(query, { limit = 6, kinds = null } = {}) {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) {
      return this.memories
        .filter((memory) => !kinds || kinds.includes(memory.kind))
        .slice(-limit)
        .reverse()
        .map((memory) => ({
          memory,
          score: 0,
          matchedTokens: [],
          tokenCount: tokenize(`${memory.text} ${(memory.tags || []).join(" ")}`).size
        }));
    }
    return this.rank(query, { kinds }).slice(0, limit);
  }

  rank(query, { kinds = null } = {}) {
    const queryTokens = tokenize(query);
    return this.memories
      .filter((memory) => !kinds || kinds.includes(memory.kind))
      .map((memory) => scoreMemory(memory, queryTokens, query))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt));
  }

  toJSON() {
    return this.memories;
  }
}

export function extractMemoryTags(text) {
  const tokens = [...tokenize(text)];
  return tokens.slice(0, 8);
}

export function tokenize(text) {
  const normalized = String(text ?? "").toLowerCase();
  const latinTokens = normalized.match(/[a-z0-9_]{2,}/g) || [];
  const cjkTokens = normalized.match(/[\u3400-\u9fff]/g) || [];
  const tokens = [...latinTokens, ...cjkTokens].filter((token) => !STOP_WORDS.has(token));
  return new Set(tokens);
}

function scoreMemory(memory, queryTokens, query = "") {
  const memoryTokens = tokenize(`${memory.text} ${(memory.tags || []).join(" ")}`);
  let overlap = 0;
  const matchedTokens = [];
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      overlap += 1;
      matchedTokens.push(token);
    }
  }
  const tagBoost = (memory.tags || []).filter((tag) => queryTokens.has(tag)).length * 0.5;
  const phraseBoost = phraseMatchBoost(memory.text, query);
  const score = (overlap + tagBoost + phraseBoost) * (memory.weight || 1);
  return {
    memory,
    score,
    matchedTokens,
    tokenCount: memoryTokens.size
  };
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

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u3400-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
