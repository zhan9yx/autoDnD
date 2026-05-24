import test from "node:test";
import assert from "node:assert/strict";
import { MemoryIndex, tokenize } from "../src/core/memory.js";

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
