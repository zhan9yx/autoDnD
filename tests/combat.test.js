import test from "node:test";
import assert from "node:assert/strict";
import { createEnemy } from "../src/core/bestiary.js";
import { createCharacter } from "../src/core/rules.js";
import {
  COMBAT_STATUS,
  applyEnemyAction,
  createCombatState,
  getCombatStatus,
  playerAttackEnemy,
  resolveCombatRound,
  rollInitiative
} from "../src/core/combat.js";

test("rolls and sorts initiative by total, bonus, and team tie breaker", () => {
  const player = createCharacter({
    id: "rogue",
    name: "Rook",
    raceId: "halfling",
    classId: "rogue",
    allocations: { agility: 7 }
  });
  const enemy = createEnemy("iron_raider", { instanceId: "raider" });
  const initiative = rollInitiative({
    players: [player],
    enemies: [enemy],
    rng: sequence([0.4, 0.5])
  });

  assert.equal(initiative[0].actorId, "rogue");
  assert.equal(initiative[0].team, "players");
  assert.equal(initiative[0].total, 12);
  assert.equal(initiative[1].actorId, "raider");
  assert.equal(initiative[1].total, 11);

  const tied = createCombatState({
    players: [player],
    enemies: [enemy],
    initiative: [
      { actorId: "raider", team: "enemies", total: 12, bonus: 2, order: 1 },
      { actorId: "rogue", team: "players", total: 12, bonus: 2, order: 0 }
    ]
  });
  assert.equal(tied.initiative[0].actorId, "rogue");
});

test("clamps HP on combat creation and derives terminal status", () => {
  const player = { id: "hero", hp: 99, maxHp: 10, defense: 10, weapons: ["dagger"] };
  const enemy = { id: "fallen", hp: -5, maxHp: 7, defense: 10, attacks: ["dagger"] };
  const state = createCombatState({
    players: [player],
    enemies: [enemy],
    initiative: []
  });

  assert.equal(state.players[0].hp, 10);
  assert.equal(state.enemies[0].hp, 0);
  assert.equal(state.status, COMBAT_STATUS.VICTORY);
  assert.equal(getCombatStatus({ players: [{ hp: 0 }], enemies: [{ hp: 0 }] }), COMBAT_STATUS.DRAW);
});

test("player attack applies damage to an enemy, clamps HP, updates victory, and logs action", () => {
  const player = createCharacter({
    id: "fighter",
    name: "Borin",
    raceId: "human",
    classId: "warrior",
    allocations: { body: 7 }
  });
  const enemy = createEnemy("street_skirmisher", { instanceId: "skirmisher", hp: 5 });
  const state = createCombatState({
    players: [player],
    enemies: [enemy],
    initiative: [{ actorId: "fighter", team: "players", total: 20, bonus: 3, order: 0 }]
  });

  const next = playerAttackEnemy(state, {
    playerId: "fighter",
    enemyId: "skirmisher",
    weaponId: "longsword",
    rng: sequence([0.75, 0.999])
  });

  assert.equal(next.enemies[0].hp, 0);
  assert.equal(next.status, COMBAT_STATUS.VICTORY);
  assert.equal(next.log.length, 1);
  assert.equal(next.log[0].actorId, "fighter");
  assert.equal(next.log[0].targetId, "skirmisher");
  assert.equal(next.log[0].hit, true);
  assert.equal(next.log[0].damage, 10);
  assert.equal(next.log[0].targetHpAfter, 0);
  assert.equal(state.enemies[0].hp, 5);
});

test("enemy attack applies damage to a player, clamps HP, updates defeat, and logs action", () => {
  const player = {
    id: "mage",
    name: "Mira",
    hp: 4,
    maxHp: 7,
    defense: 10,
    weapons: ["staff"],
    resistances: [],
    weaknesses: []
  };
  const enemy = createEnemy("iron_raider", { instanceId: "raider", hp: 18 });
  const state = createCombatState({
    players: [player],
    enemies: [enemy],
    initiative: [{ actorId: "raider", team: "enemies", total: 20, bonus: 0, order: 0 }]
  });

  const next = applyEnemyAction(state, {
    enemyId: "raider",
    playerId: "mage",
    weaponId: "longsword",
    rng: sequence([0.5, 0.875])
  });

  assert.equal(next.players[0].hp, 0);
  assert.equal(next.status, COMBAT_STATUS.DEFEAT);
  assert.equal(next.log[0].actorTeam, "enemies");
  assert.equal(next.log[0].targetTeam, "players");
  assert.equal(next.log[0].damage, 10);
  assert.equal(next.log[0].targetHpBefore, 4);
  assert.equal(next.log[0].targetHpAfter, 0);
});

test("combat round follows initiative and skips enemies defeated earlier in the round", () => {
  const player = createCharacter({
    id: "fighter",
    name: "Borin",
    raceId: "human",
    classId: "warrior",
    allocations: { body: 7 }
  });
  const enemy = createEnemy("street_skirmisher", { instanceId: "skirmisher", hp: 5 });
  const state = createCombatState({
    players: [player],
    enemies: [enemy],
    initiative: [
      { actorId: "fighter", team: "players", total: 18, bonus: 3, order: 0 },
      { actorId: "skirmisher", team: "enemies", total: 12, bonus: 2, order: 1 }
    ]
  });

  const next = resolveCombatRound(state, {
    playerActions: [{ actorId: "fighter", type: "attack", targetId: "skirmisher", weaponId: "longsword" }],
    rng: sequence([0.75, 0.999])
  });

  assert.equal(next.round, 2);
  assert.equal(next.status, COMBAT_STATUS.VICTORY);
  assert.equal(next.players[0].hp, player.maxHp);
  assert.equal(next.log.length, 1);
  assert.equal(next.log[0].actorId, "fighter");
});

function sequence(values) {
  let index = 0;
  return () => values[index++ % values.length];
}
