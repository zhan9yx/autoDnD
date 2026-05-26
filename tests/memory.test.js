import test from "node:test";
import assert from "node:assert/strict";
import { CAMPAIGN_MEMORY_LAYERS, MemoryIndex, tokenize } from "../src/core/memory.js";

test("retrieves relevant memories by overlap", () => {
  const index = new MemoryIndex();
  index.add({ text: "Mara promised to hide the silver ledger beneath the archive stairs", tags: ["mara", "ledger"] });
  index.add({ text: "The market guard dislikes smugglers", tags: ["market"] });

  const [first] = index.retrieve("Where is Mara's ledger?", { limit: 1 });
  assert.match(first.text, /silver ledger/);
});

test("ranked retrieval exposes scores and matched tokens for long-history diagnostics", () => {
  const index = new MemoryIndex();
  for (let i = 0; i < 20; i += 1) {
    index.add({
      text: `Routine watch note ${i}: rain, rope, candles, and market gossip.`,
      tags: ["routine", `watch-${i}`],
      sourceEventId: `DEC${i}`,
      createdAt: `2026-01-01T00:00:${String(i).padStart(2, "0")}.000Z`
    });
  }
  index.add({
    text: "Nalia intends to bargain at the cistern if the party mentions blue ash.",
    tags: ["nalia", "bargain", "cistern", "blue", "ash"],
    sourceEventId: "KEY-CISTERN-BARGAIN",
    createdAt: "2026-01-01T00:01:00.000Z"
  });

  const [first] = index.retrieveWithScores("Who bargains at the cistern when we mention blue ash?", { limit: 3 });

  assert.equal(first.memory.sourceEventId, "KEY-CISTERN-BARGAIN");
  assert.equal(first.score > 0, true);
  assert.equal(first.matchedTokens.includes("cistern"), true);
  assert.equal(first.matchedTokens.includes("ash"), true);
  assert.equal(typeof first.tokenCount, "number");
  assert.equal(first.rank, 1);
  assert.equal(first.coverage > 0, true);
  assert.equal(first.queryTokenCount > 0, true);
});

test("long-history ranking prefers the specific continuity fact over similar decoys", () => {
  const index = new MemoryIndex();
  for (let i = 0; i < 80; i += 1) {
    index.add({
      text: `Campaign note ${i}: the archive, cistern, and ledger remain unresolved during routine travel.`,
      tags: ["archive", "cistern", "ledger", `routine-${i}`],
      sourceEventId: `DECOY-${i}`,
      createdAt: `2026-01-01T01:${String(i).padStart(2, "0")}.000Z`
    });
  }
  index.add({
    text: "Specific continuity fact: Nalia will trade the bronze moth key only if blue ash is named beside the sealed ledger.",
    tags: ["nalia", "bronze", "moth", "blue", "ash", "sealed-ledger"],
    weight: 1.1,
    sourceEventId: "KEY-BRONZE-MOTH",
    createdAt: "2026-01-01T03:00:00.000Z"
  });

  const results = index.retrieveWithScores("Who trades the bronze moth key when blue ash is named?", { limit: 5 });

  assert.equal(results[0].memory.sourceEventId, "KEY-BRONZE-MOTH");
  assert.equal(results[0].rank, 1);
  assert.equal(results[0].matchedTokens.includes("bronze"), true);
  assert.equal(results[0].matchedTokens.includes("ash"), true);
  assert.equal(results[0].score > results[1].score, true);
});

test("tokenizes CJK text enough for keyword recall", () => {
  const tokens = tokenize("玩家调查雨夜档案馆");
  assert.equal(tokens.has("档"), true);
  assert.equal(tokens.has("馆"), true);
});

test("structured campaign context retrieves quest, npc, clue, and scene facts after a long transcript", () => {
  const index = new MemoryIndex();
  for (let i = 0; i < 220; i += 1) {
    index.add({
      kind: "timeline-beat",
      layer: CAMPAIGN_MEMORY_LAYERS.TIMELINE,
      text: `Long transcript beat ${i}: routine camp logistics, market food, rain watches, and side chatter.`,
      tags: ["routine", "camp", `beat-${i}`],
      salience: 0.4,
      sourceEventId: `LONG-DECOY-${i}`,
      createdAt: `2026-01-01T02:${String(i % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000Z`
    });
  }

  index.add({
    kind: "quest-thread",
    layer: CAMPAIGN_MEMORY_LAYERS.QUEST,
    text: "main quest thread Sealed Ledger: status active. The bronze moth key opens the east vault after the party finds blue ash.",
    tags: ["main", "quest", "sealed", "ledger", "bronze", "moth", "east", "vault", "blue", "ash"],
    salience: 1.8,
    sourceEventId: "STRUCT-QUEST-BRONZE-MOTH",
    createdAt: "2026-01-01T06:00:00.000Z"
  });
  index.add({
    kind: "npc-fact",
    layer: CAMPAIGN_MEMORY_LAYERS.NPC,
    text: "NPC fact Nalia: she intends to bargain for the bronze moth key if the sealed ledger and blue ash are named together.",
    tags: ["npc", "nalia", "bargain", "bronze", "moth", "key", "sealed", "ledger", "blue", "ash"],
    salience: 1.9,
    sourceEventId: "STRUCT-NPC-NALIA-BARGAIN",
    createdAt: "2026-01-01T06:01:00.000Z"
  });
  index.add({
    kind: "open-clue",
    layer: CAMPAIGN_MEMORY_LAYERS.CLUE,
    text: "Open clue: blue ash stains under the cistern grate remain unresolved and point back to Nalia's bargain.",
    tags: ["open", "clue", "blue", "ash", "cistern", "grate", "nalia", "bargain"],
    salience: 1.7,
    status: "open",
    sourceEventId: "STRUCT-CLUE-BLUE-ASH",
    createdAt: "2026-01-01T06:02:00.000Z"
  });
  index.add({
    kind: "scene-anchor",
    layer: CAMPAIGN_MEMORY_LAYERS.SCENE,
    text: "Scene anchor: Moonlit cistern shrine. Objective: read the reflection before the east vault route closes.",
    tags: ["scene", "anchor", "moonlit", "cistern", "shrine", "reflection", "east", "vault"],
    salience: 1.3,
    sourceEventId: "STRUCT-SCENE-CISTERN",
    createdAt: "2026-01-01T06:03:00.000Z"
  });

  const context = index.retrieveStructuredContext(
    "Which NPC bargain, open clue, quest thread, and scene anchor mention the bronze moth key, blue ash, cistern, and east vault?",
    { limit: 8, perLayerLimit: 2 }
  );
  const retrievedIds = context.results.map((entry) => entry.memory.sourceEventId);
  const retrievedLayers = new Set(context.sections.map((section) => section.layer));

  assert.equal(retrievedIds.slice(0, 2).includes("STRUCT-NPC-NALIA-BARGAIN"), true);
  assert.equal(retrievedIds.includes("STRUCT-QUEST-BRONZE-MOTH"), true);
  assert.equal(retrievedIds.includes("STRUCT-CLUE-BLUE-ASH"), true);
  assert.equal(retrievedIds.includes("STRUCT-SCENE-CISTERN"), true);
  assert.equal(retrievedLayers.has(CAMPAIGN_MEMORY_LAYERS.QUEST), true);
  assert.equal(retrievedLayers.has(CAMPAIGN_MEMORY_LAYERS.NPC), true);
  assert.equal(retrievedLayers.has(CAMPAIGN_MEMORY_LAYERS.CLUE), true);
  assert.equal(retrievedLayers.has(CAMPAIGN_MEMORY_LAYERS.SCENE), true);
  assert.equal(context.diagnostics.matchedLayerCount >= 4, true);
  assert.equal(context.diagnostics.candidateCount > 4, true);
});
