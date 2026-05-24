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
});

test("tokenizes CJK text enough for keyword recall", () => {
  const tokens = tokenize("玩家调查雨夜档案馆");
  assert.equal(tokens.has("档"), true);
  assert.equal(tokens.has("馆"), true);
});
