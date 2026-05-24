import test from "node:test";
import assert from "node:assert/strict";
import { parseDiceExpression, resolveCheck, rollDice } from "../src/core/dice.js";

test("parses normalized dice expressions", () => {
  assert.deepEqual(parseDiceExpression(" d20 + 3 "), {
    count: 1,
    sides: 20,
    modifier: 3,
    expression: "1d20+3"
  });
});

test("rolls deterministic totals", () => {
  const result = rollDice("2d6+1", { rng: sequence([0, 0.99]) });
  assert.deepEqual(result, {
    expression: "2d6+1",
    mode: "normal",
    rolls: [1, 6],
    kept: [1, 6],
    modifier: 1,
    total: 8
  });
});

test("handles d20 advantage and checks", () => {
  const result = resolveCheck({ expression: "1d20+2", dc: 12, mode: "advantage", rng: sequence([0.1, 0.9]) });
  assert.deepEqual(result.rolls, [3, 19]);
  assert.deepEqual(result.kept, [19]);
  assert.equal(result.total, 21);
  assert.equal(result.success, true);
  assert.equal(result.margin, 9);
  assert.equal(result.expression, "1d20+2");
  assert.equal(result.mode, "advantage");
  assert.equal(result.modifier, 2);
  assert.equal(result.dc, 12);
});

function sequence(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
