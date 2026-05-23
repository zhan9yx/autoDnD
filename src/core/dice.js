const DICE_PATTERN = /^\s*(?:(\d{1,3})\s*)?d\s*(\d{1,4})\s*([+-]\s*\d{1,4})?\s*$/i;

export function parseDiceExpression(expression) {
  const match = DICE_PATTERN.exec(String(expression ?? ""));
  if (!match) {
    throw new Error(`Invalid dice expression: ${expression}`);
  }

  const count = Number.parseInt(match[1] || "1", 10);
  const sides = Number.parseInt(match[2], 10);
  const modifier = match[3] ? Number.parseInt(match[3].replace(/\s+/g, ""), 10) : 0;

  if (count < 1 || count > 100) {
    throw new Error("Dice count must be between 1 and 100");
  }
  if (sides < 2 || sides > 1000) {
    throw new Error("Dice sides must be between 2 and 1000");
  }

  return { count, sides, modifier, expression: normalizeDiceExpression(count, sides, modifier) };
}

export function normalizeDiceExpression(count, sides, modifier = 0) {
  const suffix = modifier === 0 ? "" : modifier > 0 ? `+${modifier}` : `${modifier}`;
  return `${count}d${sides}${suffix}`;
}

export function rollDice(expression, options = {}) {
  const rng = options.rng || Math.random;
  const mode = options.mode || "normal";
  const parsed = parseDiceExpression(expression);

  if ((mode === "advantage" || mode === "disadvantage") && parsed.count === 1 && parsed.sides === 20) {
    const first = rollSingleDie(parsed.sides, rng);
    const second = rollSingleDie(parsed.sides, rng);
    const selected = mode === "advantage" ? Math.max(first, second) : Math.min(first, second);
    return {
      expression: parsed.expression,
      mode,
      rolls: [first, second],
      kept: [selected],
      modifier: parsed.modifier,
      total: selected + parsed.modifier
    };
  }

  const rolls = Array.from({ length: parsed.count }, () => rollSingleDie(parsed.sides, rng));
  return {
    expression: parsed.expression,
    mode: "normal",
    rolls,
    kept: rolls,
    modifier: parsed.modifier,
    total: rolls.reduce((sum, roll) => sum + roll, 0) + parsed.modifier
  };
}

export function resolveCheck({ expression, dc, mode = "normal", rng }) {
  if (!Number.isInteger(dc) || dc < 1) {
    throw new Error("Difficulty class must be a positive integer");
  }
  const roll = rollDice(expression, { mode, rng });
  return {
    ...roll,
    dc,
    success: roll.total >= dc,
    margin: roll.total - dc
  };
}

function rollSingleDie(sides, rng) {
  const value = Number(rng());
  if (!Number.isFinite(value)) {
    throw new Error("RNG must return a finite number");
  }
  const clamped = Math.min(Math.max(value, 0), 0.999999999999);
  return Math.floor(clamped * sides) + 1;
}
