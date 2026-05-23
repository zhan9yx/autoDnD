import test from "node:test";
import assert from "node:assert/strict";
import { applyStatusEffect, canAct, restCombatant, tickStatusEffects } from "../src/core/statusEffects.js";

test("status effects apply passive defense and expire after ticking", () => {
  const target = { id: "hero", hp: 10, maxHp: 12, defense: 12, resistances: [], weaknesses: [] };
  const guarded = applyStatusEffect(target, { id: "guarded", duration: 1 });

  assert.equal(guarded.defense, 14);
  const ticked = tickStatusEffects(guarded);
  assert.equal(ticked.target.defense, 12);
  assert.equal(ticked.events.at(-1).type, "status-expired");
});

test("damage status uses resistance-aware damage and can block action", () => {
  const target = { id: "hero", hp: 10, maxHp: 12, defense: 12, resistances: ["fire"], weaknesses: [] };
  const burning = applyStatusEffect(target, { id: "burning", duration: 2 });
  const stunned = applyStatusEffect(burning, { id: "stunned", duration: 1 });

  assert.equal(canAct(stunned), false);
  const ticked = tickStatusEffects(stunned);
  assert.equal(ticked.target.hp, 9);
  assert.equal(ticked.events.some((event) => event.type === "status-damage"), true);
});

test("short and long rests clear appropriate statuses and heal", () => {
  const target = applyStatusEffect(
    applyStatusEffect({ id: "hero", hp: 4, maxHp: 12, defense: 12, resistances: [], weaknesses: [] }, { id: "poisoned", duration: 3 }),
    { id: "burning", duration: 2 }
  );

  const shortRested = restCombatant(target, { type: "short" });
  assert.equal(shortRested.hp, 7);
  assert.deepEqual(shortRested.statusEffects.map((effect) => effect.id), ["poisoned"]);

  const longRested = restCombatant(shortRested, { type: "long" });
  assert.equal(longRested.hp, 12);
  assert.equal(longRested.statusEffects.length, 0);
});
