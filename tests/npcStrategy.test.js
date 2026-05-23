import test from "node:test";
import assert from "node:assert/strict";
import { createEnemy } from "../src/core/bestiary.js";
import { chooseNpcAction, scoreNpcActions } from "../src/core/npcStrategy.js";

test("flee is selected when HP drops below morale threshold", () => {
  const skirmisher = createEnemy("street_skirmisher", { hp: 1, distance: 4 });
  const action = chooseNpcAction(skirmisher, {
    enemies: [{ id: "fighter", hp: 14, maxHp: 14, threat: 3, distance: 1 }]
  });

  assert.equal(action.type, "flee");
  assert.equal(action.reason, "HP below morale threshold");
});

test("support caster heals the most wounded ally before attacking", () => {
  const acolyte = createEnemy("veiled_acolyte", { instanceId: "acolyte", hp: 10 });
  const action = chooseNpcAction(acolyte, {
    allies: [
      createEnemy("iron_raider", { instanceId: "raider-a", hp: 4 }),
      createEnemy("street_skirmisher", { instanceId: "skirmisher-a", hp: 6 })
    ],
    enemies: [{ id: "ranger", hp: 12, maxHp: 12, threat: 2, distance: 5 }]
  });

  assert.equal(action.type, "support");
  assert.equal(action.targetId, "raider-a");
  assert.equal(action.spellId, "healing-word");
});

test("controller at range casts at the highest threat target", () => {
  const mage = createEnemy("shadow_mage", { instanceId: "mage", hp: 28, distance: 6 });
  const action = chooseNpcAction(mage, {
    enemies: [
      { id: "cleric", hp: 10, maxHp: 10, threat: 2, distance: 4 },
      { id: "warrior", hp: 20, maxHp: 20, threat: 5, distance: 5 }
    ]
  });

  assert.equal(action.type, "cast");
  assert.equal(action.targetId, "warrior");
  assert.equal(action.spellId, "firebolt");
});

test("melee enemy attacks the highest threat reachable target", () => {
  const raider = createEnemy("iron_raider", { instanceId: "raider", hp: 18, distance: 1 });
  const action = chooseNpcAction(raider, {
    enemies: [
      { id: "wizard", hp: 6, maxHp: 7, threat: 4, distance: 1 },
      { id: "rogue", hp: 8, maxHp: 9, threat: 2, distance: 1 }
    ]
  });

  assert.equal(action.type, "attack");
  assert.equal(action.targetId, "wizard");
  assert.equal(action.weaponId, "longsword");
});

test("scores are deterministic and fall back to defend with no target", () => {
  const guard = createEnemy("bone_guard", { instanceId: "guard", hp: 13 });
  const first = scoreNpcActions(guard, { enemies: [] });
  const second = scoreNpcActions(guard, { enemies: [] });
  const action = chooseNpcAction(guard, { enemies: [] });

  assert.deepEqual(first, second);
  assert.equal(action.type, "defend");
  assert.equal(action.targetId, "guard");
});
