import test from "node:test";
import assert from "node:assert/strict";
import { validateAiProposal, validateAiProposals } from "../src/core/proposals.js";

test("accepts structured AI proposals that stay inside safe state paths", () => {
  const result = validateAiProposals([
    { type: "appendMemory", text: "Mara fears bells." },
    { type: "advanceClock", clock: "danger", amount: 1 },
    { type: "suggestCheck", attribute: "mind", dc: 12 }
  ]);

  assert.equal(result.ok, true);
  assert.equal(result.accepted.length, 3);
});

test("rejects AI proposals that mutate protected state directly", () => {
  const result = validateAiProposal({
    type: "setHp",
    path: "players.0.character.hp",
    value: 0
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.some((error) => error.includes("Unsupported")), true);
  assert.equal(result.errors.some((error) => error.includes("Forbidden")), true);
});

test("validates proposal-specific required fields", () => {
  const result = validateAiProposal({
    type: "advanceClock",
    clock: "weather",
    amount: 1.5
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 2);
});
