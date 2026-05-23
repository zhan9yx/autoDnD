import { resolveDamage, resolveHealing } from "./rules.js";

export const STATUS_EFFECTS = Object.freeze({
  burning: Object.freeze({
    id: "burning",
    name: "Burning",
    damageType: "fire",
    damagePerRound: 2,
    clearsOnRest: "short"
  }),
  poisoned: Object.freeze({
    id: "poisoned",
    name: "Poisoned",
    damageType: "poison",
    damagePerRound: 1,
    attackPenalty: 2,
    clearsOnRest: "long"
  }),
  stunned: Object.freeze({
    id: "stunned",
    name: "Stunned",
    skipAction: true,
    clearsOnRest: "short"
  }),
  guarded: Object.freeze({
    id: "guarded",
    name: "Guarded",
    defenseBonus: 2,
    clearsOnRest: "short"
  }),
  marked: Object.freeze({
    id: "marked",
    name: "Marked",
    incomingDamageBonus: 1,
    clearsOnRest: "short"
  })
});

export function applyStatusEffect(target, { id, duration = 1, sourceId = null } = {}) {
  const effect = getStatusEffect(id);
  const effects = normalizeEffects(target.statusEffects).filter((entry) => entry.id !== effect.id);
  const status = {
    id: effect.id,
    name: effect.name,
    duration: Math.max(1, Math.floor(duration)),
    sourceId
  };
  return applyPassiveModifiers({
    ...clone(target),
    statusEffects: [...effects, status]
  });
}

export function tickStatusEffects(target, { timing = "end" } = {}) {
  let next = clearPassiveModifiers(clone(target));
  const events = [];
  const remaining = [];

  for (const status of normalizeEffects(target.statusEffects)) {
    const effect = getStatusEffect(status.id);
    let currentStatus = { ...status };
    if (timing === "end" && effect.damagePerRound) {
      const damage = resolveDamage({
        target: next,
        amount: effect.damagePerRound,
        damageType: effect.damageType
      });
      next = damage.targetAfter;
      events.push({
        type: "status-damage",
        statusId: status.id,
        amount: damage.finalAmount,
        targetHpAfter: next.hp
      });
    }

    if (timing === "end") {
      currentStatus = { ...currentStatus, duration: currentStatus.duration - 1 };
    }
    if (currentStatus.duration > 0) {
      remaining.push(currentStatus);
    } else {
      events.push({ type: "status-expired", statusId: status.id });
    }
  }

  next.statusEffects = remaining;
  return {
    target: applyPassiveModifiers(next),
    events
  };
}

export function canAct(target) {
  return !normalizeEffects(target.statusEffects).some((status) => getStatusEffect(status.id).skipAction);
}

export function restCombatant(target, { type = "short" } = {}) {
  const clearRanks = { short: 1, long: 2 };
  const restRank = clearRanks[type] || 1;
  const kept = normalizeEffects(target.statusEffects).filter((status) => {
    const clearsOn = getStatusEffect(status.id).clearsOnRest || "long";
    return (clearRanks[clearsOn] || 2) > restRank;
  });
  const healed = type === "long"
    ? { ...target, hp: target.maxHp }
    : resolveHealing({ target, amount: Math.ceil((target.maxHp || target.hp || 0) / 4) }).targetAfter;
  return applyPassiveModifiers({
    ...healed,
    statusEffects: kept
  });
}

export function getStatusEffect(id) {
  const effect = STATUS_EFFECTS[id];
  if (!effect) {
    throw new Error(`Unknown status effect: ${id}`);
  }
  return effect;
}

function applyPassiveModifiers(target) {
  const baseDefense = target.baseDefense ?? target.defense ?? 10;
  const defenseBonus = normalizeEffects(target.statusEffects)
    .map((status) => getStatusEffect(status.id).defenseBonus || 0)
    .reduce((sum, value) => sum + value, 0);
  return {
    ...target,
    baseDefense,
    defense: baseDefense + defenseBonus
  };
}

function clearPassiveModifiers(target) {
  if (!Number.isInteger(target.baseDefense)) {
    return target;
  }
  return {
    ...target,
    defense: target.baseDefense
  };
}

function normalizeEffects(effects) {
  return Array.isArray(effects) ? effects : [];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
