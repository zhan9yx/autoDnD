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

  add({ kind = "event", text, tags = [], weight = 1, sourceEventId = null }) {
    if (!text || !String(text).trim()) {
      return null;
    }
    const memory = {
      id: createId("mem"),
      kind,
      text: String(text).trim(),
      tags: [...new Set(tags.filter(Boolean).map((tag) => String(tag).toLowerCase()))],
      weight: Number.isFinite(weight) ? weight : 1,
      sourceEventId,
      createdAt: nowIso()
    };
    this.memories.push(memory);
    return memory;
  }

  retrieve(query, { limit = 6, kinds = null } = {}) {
    const queryTokens = tokenize(query);
    if (queryTokens.size === 0) {
      return this.memories.slice(-limit).reverse();
    }

    return this.memories
      .filter((memory) => !kinds || kinds.includes(memory.kind))
      .map((memory) => ({ memory, score: scoreMemory(memory, queryTokens) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt))
      .slice(0, limit)
      .map((entry) => entry.memory);
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

function scoreMemory(memory, queryTokens) {
  const memoryTokens = tokenize(`${memory.text} ${(memory.tags || []).join(" ")}`);
  let overlap = 0;
  for (const token of queryTokens) {
    if (memoryTokens.has(token)) {
      overlap += 1;
    }
  }
  const tagBoost = (memory.tags || []).filter((tag) => queryTokens.has(tag)).length * 0.5;
  return (overlap + tagBoost) * (memory.weight || 1);
}
