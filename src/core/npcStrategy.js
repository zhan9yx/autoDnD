const ACTION_PRIORITY = Object.freeze(["flee", "support", "defend", "cast", "attack"]);

export function chooseNpcAction(actor, context = {}) {
  const scored = scoreNpcActions(actor, context);
  return scored[0] ?? {
    type: "defend",
    actorId: actor.id,
    targetId: actor.id,
    score: 0,
    reason: "No legal target; hold position"
  };
}

export function scoreNpcActions(actor, { allies = [], enemies = [] } = {}) {
  const actions = new Set(actor.actions ?? []);
  const candidates = [];
  const hpRatio = ratio(actor.hp, actor.maxHp);
  const breakAt = actor.morale?.breakAt ?? 0.2;
  const nearestEnemy = chooseNearestEnemy(enemies);
  const priorityTarget = choosePriorityTarget(enemies);
  const woundedAlly = chooseWoundedAlly([actor, ...allies]);

  if (actions.has("flee") && hpRatio <= breakAt && enemies.length > 0) {
    candidates.push({
      type: "flee",
      actorId: actor.id,
      targetId: nearestEnemy?.id ?? null,
      score: 100 + Math.round((breakAt - hpRatio) * 100),
      reason: "HP below morale threshold"
    });
  }

  if (actions.has("support") && woundedAlly && woundedAlly.id !== actor.id) {
    const spellId = chooseSupportSpell(actor, "healing") ?? chooseSupportSpell(actor, "defense");
    candidates.push({
      type: "support",
      actorId: actor.id,
      targetId: woundedAlly.id,
      spellId,
      score: 90 + Math.round((1 - ratio(woundedAlly.hp, woundedAlly.maxHp)) * 20),
      reason: "Ally is wounded"
    });
  }

  if (actions.has("defend") && hpRatio <= Math.max(0.35, breakAt) && !actions.has("flee")) {
    candidates.push({
      type: "defend",
      actorId: actor.id,
      targetId: actor.id,
      score: 78 + Math.round((1 - hpRatio) * 10),
      reason: "Low HP and no safe retreat"
    });
  }

  if (actions.has("cast") && priorityTarget && (actor.spells?.length ?? 0) > 0) {
    const spellId = chooseOffensiveSpell(actor);
    const distance = distanceTo(priorityTarget);
    const rangePressure = distance > 1 ? 8 : 0;
    const controllerBonus = actor.role === "controller" ? 6 : 0;
    candidates.push({
      type: "cast",
      actorId: actor.id,
      targetId: priorityTarget.id,
      spellId,
      score: 62 + priorityTarget.threat * 5 + rangePressure + controllerBonus,
      reason: "Best ranged or magical pressure"
    });
  }

  if (actions.has("attack") && priorityTarget) {
    const distance = distanceTo(priorityTarget);
    const preferredRange = actor.preferredRange ?? 1;
    const inRangeBonus = distance <= preferredRange ? 10 : -8;
    candidates.push({
      type: "attack",
      actorId: actor.id,
      targetId: priorityTarget.id,
      weaponId: chooseWeapon(actor, distance),
      score: 52 + priorityTarget.threat * 5 + inRangeBonus,
      reason: "Pressure highest threat enemy"
    });
  }

  if (actions.has("defend")) {
    candidates.push({
      type: "defend",
      actorId: actor.id,
      targetId: actor.id,
      score: 40 + Math.round((1 - hpRatio) * 10),
      reason: "Maintain position"
    });
  }

  return candidates
    .filter((candidate) => candidate.type !== "cast" || candidate.spellId)
    .sort(compareActions);
}

function choosePriorityTarget(enemies) {
  return [...enemies]
    .filter((enemy) => (enemy.hp ?? 1) > 0)
    .sort((left, right) => {
      const threat = (right.threat ?? 1) - (left.threat ?? 1);
      if (threat !== 0) return threat;
      const health = ratio(left.hp, left.maxHp) - ratio(right.hp, right.maxHp);
      if (health !== 0) return health;
      const distance = distanceTo(left) - distanceTo(right);
      if (distance !== 0) return distance;
      return String(left.id).localeCompare(String(right.id));
    })[0] ?? null;
}

function chooseNearestEnemy(enemies) {
  return [...enemies]
    .filter((enemy) => (enemy.hp ?? 1) > 0)
    .sort((left, right) => {
      const distance = distanceTo(left) - distanceTo(right);
      if (distance !== 0) return distance;
      return String(left.id).localeCompare(String(right.id));
    })[0] ?? null;
}

function chooseWoundedAlly(allies) {
  return [...allies]
    .filter((ally) => (ally.hp ?? 0) > 0 && ratio(ally.hp, ally.maxHp) <= 0.45)
    .sort((left, right) => {
      const health = ratio(left.hp, left.maxHp) - ratio(right.hp, right.maxHp);
      if (health !== 0) return health;
      return String(left.id).localeCompare(String(right.id));
    })[0] ?? null;
}

function chooseSupportSpell(actor, tag) {
  const spells = actor.spells ?? [];
  if (tag === "healing") {
    return spells.find((spell) => spell === "healing-word") ?? null;
  }
  if (tag === "defense") {
    return spells.find((spell) => spell === "ward" || spell === "arcane-shield") ?? null;
  }
  return null;
}

function chooseOffensiveSpell(actor) {
  const spells = actor.spells ?? [];
  return spells.find((spell) => spell === "firebolt" || spell === "radiant-bolt")
    ?? spells.find((spell) => spell === "sleep" || spell === "binding-vines")
    ?? null;
}

function chooseWeapon(actor, distance) {
  const weapons = actor.attacks ?? actor.weapons ?? [];
  if (distance > 1) {
    return weapons.find((weapon) => weapon === "shortbow") ?? weapons[0] ?? null;
  }
  return weapons.find((weapon) => weapon !== "shortbow") ?? weapons[0] ?? null;
}

function compareActions(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }
  return ACTION_PRIORITY.indexOf(left.type) - ACTION_PRIORITY.indexOf(right.type);
}

function distanceTo(target) {
  return Number.isFinite(target.distance) ? target.distance : 1;
}

function ratio(value, max) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 1;
  }
  return Math.max(0, Math.min(1, value / max));
}
