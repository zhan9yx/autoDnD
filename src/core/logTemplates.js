const DEFAULT_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const VALID_SEVERITIES = new Set(["debug", "info", "warn", "error", "critical"]);
const SENSITIVE_KEY_PATTERN = /authorization|api[-_]?key|cookie|credential|password|playerToken|secret|session|token/i;

export function aiDecision(input = {}) {
  const metadata = sanitizeMetadata({
    decision: input.decision,
    rationale: normalizeList(input.rationale),
    constraints: normalizeList(input.constraints),
    result: input.result,
    provider: input.provider,
    model: input.model,
    latencyMs: input.latencyMs,
    promptChars: input.promptChars,
    completionChars: input.completionChars,
    ...input.metadata
  });
  const decision = readableValue(input.decision, "decision");
  const result = readableValue(input.result, "result recorded");

  return createStructuredLog({
    ...input,
    type: "ai.decision",
    scope: input.scope || "ai-dm",
    severity: input.severity || "info",
    message: input.message || `AI DM decision: ${decision}.`,
    humanSummary: input.humanSummary || {
      en: `AI DM chose ${decision}; result: ${result}.`,
      zh: `AI DM 决策：${decision}；结果：${result}。`
    },
    metadata
  });
}

export function stateTransition(input = {}) {
  const from = readableValue(input.from || input.fromState, "unknown");
  const to = readableValue(input.to || input.toState, "unknown");
  return createStructuredLog({
    ...input,
    type: "state.transition",
    scope: input.scope || "state",
    severity: input.severity || "info",
    message: input.message || `State changed from ${from} to ${to}.`,
    humanSummary: input.humanSummary || {
      en: `State moved from ${from} to ${to}.`,
      zh: `状态从 ${from} 切换到 ${to}。`
    },
    metadata: sanitizeMetadata({
      from,
      to,
      reason: input.reason,
      phase: input.phase,
      ...input.metadata
    })
  });
}

export function diceRoll(input = {}) {
  const total = Number.isFinite(Number(input.total)) ? Number(input.total) : null;
  const dc = Number.isFinite(Number(input.dc)) ? Number(input.dc) : null;
  const outcome = input.outcome || (total !== null && dc !== null ? (total >= dc ? "success" : "failure") : "rolled");

  return createStructuredLog({
    ...input,
    type: "dice.roll",
    scope: input.scope || "rules",
    severity: input.severity || "info",
    message: input.message || `Dice roll ${readableValue(input.expression, "check")} resolved as ${outcome}.`,
    humanSummary: input.humanSummary || {
      en: `Rolled ${readableValue(input.expression, "a check")}: ${total ?? "unknown"} vs DC ${dc ?? "unknown"} (${outcome}).`,
      zh: `骰子检定 ${readableValue(input.expression, "检定")}：${total ?? "未知"} 对 DC ${dc ?? "未知"}（${outcome}）。`
    },
    metadata: sanitizeMetadata({
      expression: input.expression,
      rolls: input.rolls,
      modifier: input.modifier,
      total,
      dc,
      outcome,
      mode: input.mode,
      ...input.metadata
    })
  });
}

export function inventoryMutation(input = {}) {
  const action = readableValue(input.action, "updated");
  const item = readableValue(input.itemLabel || input.itemName || input.itemId, "item");
  return createStructuredLog({
    ...input,
    type: "inventory.mutation",
    scope: input.scope || "inventory",
    severity: input.severity || "info",
    message: input.message || `Inventory ${action}: ${item}.`,
    humanSummary: input.humanSummary || {
      en: `Inventory ${action}: ${item}.`,
      zh: `物品栏${action}：${item}。`
    },
    metadata: sanitizeMetadata({
      action,
      itemId: input.itemId,
      itemLabel: input.itemLabel || input.itemName,
      quantityDelta: input.quantityDelta,
      beforeQuantity: input.beforeQuantity,
      afterQuantity: input.afterQuantity,
      ...input.metadata
    })
  });
}

export function soundscapeSwitch(input = {}) {
  const from = readableValue(input.fromId || input.from, "none");
  const to = readableValue(input.toId || input.to, "soundscape");
  return createStructuredLog({
    ...input,
    type: "soundscape.switch",
    scope: input.scope || "media",
    severity: input.severity || "info",
    message: input.message || `Soundscape switched from ${from} to ${to}.`,
    humanSummary: input.humanSummary || {
      en: `Soundscape changed from ${from} to ${to}.`,
      zh: `环境音从 ${from} 切换到 ${to}。`
    },
    metadata: sanitizeMetadata({
      fromId: from,
      toId: to,
      intensity: input.intensity,
      reason: input.reason,
      layers: summarizeLayers(input.layers),
      visualHints: input.visualHints,
      assetHints: input.assetHints,
      ...input.metadata
    })
  });
}

export function assetSelection(input = {}) {
  const asset = readableValue(input.assetName || input.assetId, "asset");
  return createStructuredLog({
    ...input,
    type: "asset.selection",
    scope: input.scope || "media",
    severity: input.severity || "info",
    message: input.message || `Selected asset ${asset}.`,
    humanSummary: input.humanSummary || {
      en: `Selected asset ${asset} for ${readableValue(input.reason, "the scene")}.`,
      zh: `已选择素材 ${asset}，用于${readableValue(input.reason, "当前场景")}。`
    },
    metadata: sanitizeMetadata({
      assetId: input.assetId,
      assetName: input.assetName,
      kind: input.kind,
      reason: input.reason,
      candidateCount: Array.isArray(input.candidates) ? input.candidates.length : input.candidateCount,
      candidates: summarizeCandidates(input.candidates),
      ...input.metadata
    })
  });
}

export function chatMessage(input = {}) {
  const channel = readableValue(input.channel, "public");
  const length = String(input.text || input.messageText || "").length || input.length || 0;
  return createStructuredLog({
    ...input,
    type: "chat.message",
    scope: input.scope || "chat",
    severity: input.severity || "info",
    message: `Chat message recorded on ${channel}.`,
    humanSummary: input.humanSummary || {
      en: `Chat message recorded on ${channel}; content hidden from structured logs.`,
      zh: `已记录 ${channel} 聊天；结构化日志不保存正文。`
    },
    metadata: sanitizeMetadata({
      channel,
      authorRole: input.authorRole,
      visibility: input.visibility,
      textLength: length,
      ...input.metadata
    })
  });
}

export function error(input = {}) {
  const err = input.error instanceof Error ? input.error : null;
  const code = input.code || err?.code || "ERROR";
  const statusCode = input.statusCode || err?.statusCode || null;
  const errorMessage = redactString(input.errorMessage || err?.message || input.message || "An error occurred.");

  return createStructuredLog({
    ...input,
    type: "error",
    scope: input.scope || "system",
    severity: input.severity || "error",
    message: `Error ${code}: ${errorMessage}`,
    humanSummary: input.humanSummary || {
      en: `Error ${code}: ${errorMessage}`,
      zh: `错误 ${code}：${errorMessage}`
    },
    metadata: sanitizeMetadata({
      code,
      statusCode,
      fatal: Boolean(input.fatal),
      name: err?.name,
      context: input.context,
      ...input.metadata
    })
  });
}

export function createStructuredLog(input = {}) {
  const type = readableValue(input.type, "event");
  const timestamp = normalizeTimestamp(input.timestamp);
  const roomId = normalizeOptional(input.roomId);
  const turnId = normalizeOptional(input.turnId);
  const eventId = normalizeOptional(input.eventId);
  const actorId = normalizeOptional(input.actorId);
  return {
    type,
    scope: readableValue(input.scope, "system"),
    severity: normalizeSeverity(input.severity),
    roomId,
    turnId,
    actorId,
    eventId,
    message: redactString(readableValue(input.message, type)),
    humanSummary: normalizeHumanSummary(input.humanSummary, input.message || type),
    metadata: sanitizeMetadata(input.metadata || {}),
    timestamp,
    correlationId: readableValue(input.correlationId, buildCorrelationId({ roomId, turnId, eventId, type, timestamp }))
  };
}

function normalizeHumanSummary(value, fallback) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      en: redactString(readableValue(value.en || value.default, fallback)),
      zh: redactString(readableValue(value.zh || value.default || value.en, fallback))
    };
  }
  const summary = redactString(readableValue(value, fallback));
  return {
    en: summary,
    zh: summary
  };
}

function sanitizeMetadata(value) {
  return sanitizeValue(value);
}

function sanitizeValue(value, key = "") {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry, key));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([entryKey, entryValue]) => [entryKey, sanitizeValue(entryValue, entryKey)])
    );
  }
  if (typeof value === "string") {
    return redactString(value);
  }
  return value === undefined ? null : value;
}

function redactString(value) {
  return String(value)
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/((?:api[-_]?key|authorization|cookie|credential|password|playerToken|secret|session|token)\s*[:=]\s*)("[^"]+"|'[^']+'|[^\s,;]+)/gi, "$1[redacted]")
    .slice(0, 800);
}

function summarizeLayers(layers) {
  if (!Array.isArray(layers)) return [];
  return layers.map((layer) => ({
    id: layer?.id || null,
    type: layer?.type || null,
    gain: layer?.gain ?? null
  }));
}

function summarizeCandidates(candidates) {
  if (!Array.isArray(candidates)) return [];
  return candidates.slice(0, 5).map((candidate) => ({
    id: candidate?.id || candidate?.assetId || null,
    score: candidate?.score ?? null,
    reason: candidate?.reason || null
  }));
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter((entry) => entry !== undefined && entry !== null);
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function normalizeTimestamp(value) {
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const now = new Date();
  return Number.isNaN(now.getTime()) ? DEFAULT_TIMESTAMP : now.toISOString();
}

function normalizeSeverity(value) {
  const severity = String(value || "info").toLowerCase();
  return VALID_SEVERITIES.has(severity) ? severity : "info";
}

function normalizeOptional(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function readableValue(value, fallback) {
  if (value === undefined || value === null || value === "") return String(fallback);
  if (Array.isArray(value)) return value.map((entry) => readableValue(entry, "")).filter(Boolean).join(", ");
  if (typeof value === "object") return readableValue(value.label || value.id || value.name || value.type, fallback);
  return redactString(value);
}

function buildCorrelationId({ roomId, turnId, eventId, type, timestamp }) {
  return [roomId || "room", turnId || "turn", eventId || "event", type, timestamp].join(":");
}
