import { rollDice } from "./dice.js";
import { abilityModifier, resolveAttack, resolveSpellEffect } from "./rules.js";

export const COMBAT_STATUS = Object.freeze({
  ONGOING: "ongoing",
  VICTORY: "victory",
  DEFEAT: "defeat",
  DRAW: "draw"
});

export function createCombatState({ players = [], enemies = [], initiative, rng = Math.random } = {}) {
  const normalizedPlayers = normalizeCombatants(players, "players");
  const normalizedEnemies = normalizeCombatants(enemies, "enemies");
  const orderedInitiative = initiative
    ? sortInitiative(initiative)
    : rollInitiative({ players: normalizedPlayers, enemies: normalizedEnemies, rng });

  return withCombatStatus({
    round: 1,
    turnIndex: 0,
    players: normalizedPlayers,
    enemies: normalizedEnemies,
    initiative: orderedInitiative,
    log: []
  });
}

export function rollInitiative({ players = [], enemies = [], rng = Math.random } = {}) {
  const entries = [
    ...players.map((actor, index) => buildInitiativeEntry(actor, "players", index, rng)),
    ...enemies.map((actor, index) => buildInitiativeEntry(actor, "enemies", players.length + index, rng))
  ];
  return sortInitiative(entries);
}

export function sortInitiative(entries = []) {
  return [...entries].sort((left, right) => {
    const total = (right.total ?? 0) - (left.total ?? 0);
    if (total !== 0) return total;
    const bonus = (right.bonus ?? 0) - (left.bonus ?? 0);
    if (bonus !== 0) return bonus;
    const team = teamPriority(left.team) - teamPriority(right.team);
    if (team !== 0) return team;
    const order = (left.order ?? 0) - (right.order ?? 0);
    if (order !== 0) return order;
    return String(left.actorId ?? left.id).localeCompare(String(right.actorId ?? right.id));
  });
}

export function getCombatStatus({ players = [], enemies = [] } = {}) {
  const anyPlayerAlive = players.some(isAlive);
  const anyEnemyAlive = enemies.some(isAlive);
  if (!anyPlayerAlive && !anyEnemyAlive) return COMBAT_STATUS.DRAW;
  if (!anyEnemyAlive) return COMBAT_STATUS.VICTORY;
  if (!anyPlayerAlive) return COMBAT_STATUS.DEFEAT;
  return COMBAT_STATUS.ONGOING;
}

export function playerAttackEnemy(state, {
  playerId,
  enemyId,
  weaponId,
  spellId,
  mode = "normal",
  rng = Math.random,
  damageRng
} = {}) {
  const current = normalizeCombatState(state);
  assertOngoing(current);
  const player = requireAliveCombatant(current.players, playerId, "player");
  const enemy = requireAliveCombatant(current.enemies, enemyId, "enemy");
  const result = resolveAttack({
    attacker: player,
    target: enemy,
    weaponId,
    spellId,
    mode,
    rng,
    damageRng: damageRng ?? rng
  });
  const updatedEnemy = result.damage?.targetAfter ?? enemy;
  const next = {
    ...current,
    enemies: replaceCombatant(current.enemies, updatedEnemy, "enemies")
  };

  return appendLog(withCombatStatus(next), buildAttackLog({
    state: current,
    actor: player,
    actorTeam: "players",
    target: enemy,
    targetTeam: "enemies",
    result,
    targetAfter: findCombatant(next.enemies, enemy.id)
  }));
}

export function applyEnemyAction(state, {
  enemyId,
  actorId,
  playerId,
  targetId,
  type = "attack",
  weaponId,
  spellId,
  mode = "normal",
  rng = Math.random,
  damageRng
} = {}) {
  const current = normalizeCombatState(state);
  assertOngoing(current);
  const id = enemyId ?? actorId;
  const enemy = requireAliveCombatant(current.enemies, id, "enemy");
  const actionType = type ?? (spellId ? "cast" : "attack");

  if (actionType === "defend" || actionType === "flee") {
    return appendLog(withCombatStatus(current), {
      round: current.round,
      actorId: enemy.id,
      actorTeam: "enemies",
      actorName: enemy.name,
      actorDisplayName: enemy.displayName,
      targetId: enemy.id,
      targetTeam: "enemies",
      action: actionType,
      message: `${enemy.name ?? enemy.id} ${actionType === "flee" ? "fled" : "defended"}`,
      status: current.status
    });
  }

  if (actionType === "support") {
    const target = findCombatant(current.enemies, targetId) ?? enemy;
    return applyEnemySpell(current, enemy, target, "enemies", spellId, mode, rng);
  }

  const player = requireAliveCombatant(current.players, playerId ?? targetId, "player");
  if (actionType === "cast" || spellId) {
    return applyEnemySpell(current, enemy, player, "players", spellId, mode, rng);
  }

  const result = resolveAttack({
    attacker: enemy,
    target: player,
    weaponId,
    mode,
    rng,
    damageRng: damageRng ?? rng
  });
  const updatedPlayer = result.damage?.targetAfter ?? player;
  const next = {
    ...current,
    players: replaceCombatant(current.players, updatedPlayer, "players")
  };

  return appendLog(withCombatStatus(next), buildAttackLog({
    state: current,
    actor: enemy,
    actorTeam: "enemies",
    target: player,
    targetTeam: "players",
    result,
    targetAfter: findCombatant(next.players, player.id)
  }));
}

export function resolveCombatRound(state, {
  playerActions = [],
  enemyActions = [],
  rng = Math.random,
  damageRng
} = {}) {
  let next = normalizeCombatState(state);
  const playerActionMap = mapActions(playerActions);
  const enemyActionMap = mapActions(enemyActions);

  for (const entry of next.initiative) {
    if (next.status !== COMBAT_STATUS.ONGOING) break;

    if (entry.team === "players") {
      const player = findCombatant(next.players, entry.actorId);
      if (!isAlive(player)) continue;
      const action = playerActionMap.get(player.id);
      if (!action) continue;
      next = playerAttackEnemy(next, {
        ...action,
        playerId: player.id,
        enemyId: action.enemyId ?? action.targetId ?? firstAlive(next.enemies)?.id,
        rng,
        damageRng
      });
      continue;
    }

    const enemy = findCombatant(next.enemies, entry.actorId);
    if (!isAlive(enemy)) continue;
    const fallbackTarget = firstAlive(next.players);
    if (!fallbackTarget) continue;
    const action = enemyActionMap.get(enemy.id) ?? { type: "attack", targetId: fallbackTarget.id };
    next = applyEnemyAction(next, {
      ...action,
      enemyId: enemy.id,
      playerId: action.playerId ?? action.targetId ?? fallbackTarget.id,
      rng,
      damageRng
    });
  }

  return {
    ...next,
    round: next.round + 1,
    turnIndex: 0
  };
}

function applyEnemySpell(state, enemy, target, targetTeam, spellId, mode, rng) {
  if (!spellId) {
    throw new Error("Enemy spell action requires a spellId");
  }
  const result = resolveSpellEffect({ caster: enemy, target, spellId, mode, rng });
  const targetAfter = result.damage?.targetAfter ?? result.healing?.targetAfter ?? result.targetAfter ?? target;
  const collectionKey = targetTeam;
  const next = {
    ...state,
    [collectionKey]: replaceCombatant(state[collectionKey], targetAfter, targetTeam)
  };
  const targetCurrent = findCombatant(next[collectionKey], target.id);

  return appendLog(withCombatStatus(next), buildSpellLog({
    state,
    actor: enemy,
    target,
    targetTeam,
    result,
    targetAfter: targetCurrent
  }));
}

function buildInitiativeEntry(actor, team, order, rng) {
  const bonus = initiativeBonus(actor);
  const roll = rollDice(`1d20${formatSigned(bonus)}`, { rng });
  return {
    id: `${team}:${actor.id}`,
    actorId: actor.id,
    team,
    name: actor.name ?? actor.id,
    roll: roll.kept[0],
    bonus,
    total: roll.total,
    order
  };
}

function normalizeCombatState(state = {}) {
  const players = normalizeCombatants(state.players ?? [], "players");
  const enemies = normalizeCombatants(state.enemies ?? [], "enemies");
  const initiative = Array.isArray(state.initiative) && state.initiative.length > 0
    ? sortInitiative(state.initiative)
    : [
      ...players.map((actor, index) => defaultInitiativeEntry(actor, "players", index)),
      ...enemies.map((actor, index) => defaultInitiativeEntry(actor, "enemies", players.length + index))
    ];

  return withCombatStatus({
    ...state,
    round: positiveIntegerOr(state.round, 1),
    turnIndex: nonNegativeIntegerOr(state.turnIndex, 0),
    players,
    enemies,
    initiative,
    log: Array.isArray(state.log) ? [...state.log] : []
  });
}

function normalizeCombatants(combatants, team) {
  return combatants.map((combatant, index) => normalizeCombatant(combatant, team, index));
}

function normalizeCombatant(combatant, team, index) {
  if (!combatant || typeof combatant !== "object") {
    throw new Error(`Invalid ${singularTeam(team)} combatant`);
  }
  const id = combatant.id ?? `${singularTeam(team)}-${index + 1}`;
  const maxHp = nonNegativeIntegerOr(combatant.maxHp, nonNegativeIntegerOr(combatant.hp, 0));
  const rawHp = Number.isInteger(combatant.hp) ? combatant.hp : maxHp;
  const hp = clamp(rawHp, 0, maxHp);
  return {
    ...clone(combatant),
    id,
    maxHp,
    hp
  };
}

function defaultInitiativeEntry(actor, team, order) {
  const bonus = initiativeBonus(actor);
  return {
    id: `${team}:${actor.id}`,
    actorId: actor.id,
    team,
    name: actor.name ?? actor.id,
    roll: 0,
    bonus,
    total: bonus,
    order
  };
}

function initiativeBonus(actor) {
  if (Number.isInteger(actor.initiativeBonus)) return actor.initiativeBonus;
  if (Number.isInteger(actor.modifiers?.agility)) return actor.modifiers.agility;
  if (Number.isInteger(actor.attributes?.agility)) return abilityModifier(actor.attributes.agility);
  return 0;
}

function withCombatStatus(state) {
  return {
    ...state,
    status: getCombatStatus(state)
  };
}

function appendLog(state, entry) {
  const next = withCombatStatus(state);
  return {
    ...next,
    log: [
      ...next.log,
      {
        ...entry,
        status: next.status
      }
    ]
  };
}

function buildAttackLog({ state, actor, actorTeam, target, targetTeam, result, targetAfter }) {
  const damage = result.damage?.finalAmount ?? 0;
  return {
    round: state.round,
    actorId: actor.id,
    actorTeam,
    actorName: actor.name,
    actorDisplayName: actor.displayName,
    targetId: target.id,
    targetTeam,
    targetName: target.name,
    targetDisplayName: target.displayName,
    action: result.sourceKind === "spell" ? "cast" : "attack",
    sourceId: result.sourceId,
    hit: result.hit,
    critical: result.critical,
    damage,
    targetHpBefore: target.hp,
    targetHpAfter: targetAfter?.hp ?? target.hp,
    defeated: !isAlive(targetAfter),
    message: `${actor.name ?? actor.id} ${result.hit ? "hit" : "missed"} ${target.name ?? target.id} for ${damage} damage`
  };
}

function buildSpellLog({ state, actor, target, targetTeam, result, targetAfter }) {
  if (result.kind === "attack") {
    return buildAttackLog({
      state,
      actor,
      actorTeam: "enemies",
      target,
      targetTeam,
      result,
      targetAfter
    });
  }

  const healing = result.healing?.finalAmount ?? 0;
  return {
    round: state.round,
    actorId: actor.id,
    actorTeam: "enemies",
    actorName: actor.name,
    actorDisplayName: actor.displayName,
    targetId: target.id,
    targetTeam,
    targetName: target.name,
    targetDisplayName: target.displayName,
    action: "cast",
    sourceId: result.spellId,
    healing,
    targetHpBefore: target.hp,
    targetHpAfter: targetAfter?.hp ?? target.hp,
    defeated: !isAlive(targetAfter),
    message: `${actor.name ?? actor.id} cast ${result.spellId} on ${target.name ?? target.id}`
  };
}

function replaceCombatant(combatants, updated, team) {
  return combatants.map((combatant, index) => {
    if (combatant.id !== updated.id) return combatant;
    return normalizeCombatant(updated, team, index);
  });
}

function requireAliveCombatant(combatants, id, label) {
  const combatant = findCombatant(combatants, id);
  if (!combatant) {
    throw new Error(`Unknown ${label}: ${id}`);
  }
  if (!isAlive(combatant)) {
    throw new Error(`${label} is not alive: ${id}`);
  }
  return combatant;
}

function findCombatant(combatants, id) {
  return combatants.find((combatant) => combatant.id === id) ?? null;
}

function firstAlive(combatants) {
  return combatants.find(isAlive) ?? null;
}

function isAlive(combatant) {
  return Boolean(combatant && (combatant.hp ?? 0) > 0);
}

function assertOngoing(state) {
  if (state.status !== COMBAT_STATUS.ONGOING) {
    throw new Error(`Combat is not ongoing: ${state.status}`);
  }
}

function mapActions(actions) {
  return new Map(actions.map((action) => [action.actorId ?? action.playerId ?? action.enemyId, action]));
}

function teamPriority(team) {
  return team === "players" ? 0 : 1;
}

function singularTeam(team) {
  return team === "players" ? "player" : "enemy";
}

function positiveIntegerOr(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nonNegativeIntegerOr(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatSigned(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
