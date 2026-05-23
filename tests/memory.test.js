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

test("tokenizes CJK text enough for keyword recall", () => {
  const tokens = tokenize("玩家调查雨夜档案馆");
  assert.equal(tokens.has("档"), true);
  assert.equal(tokens.has("馆"), true);
});
