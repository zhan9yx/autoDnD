const DEFAULT_TIMESTAMP = "1970-01-01T00:00:00.000Z";
const VALID_SEVERITIES = new Set(["debug", "info", "warn", "error", "critical"]);
const SENSITIVE_KEY_PATTERN = /authorization|api[-_]?key|cookie|credential|password|playerToken|secret|session|token/i;
const LOG_TEMPLATES = Object.freeze({
  "ai.dm.decision": {
    en: "AI DM decision ({beat}) in {scene}: {decision}. Quest {questClock}; danger {dangerClock}; clues {clueClock}. NPC intent: {npcIntent}. Consequence: {consequence}. Result: {result}.",
    zh: "AI DM 决策（{beat}，{scene}）：{decision}。任务 {questClock}；危险 {dangerClock}；线索 {clueClock}。NPC 意图：{npcIntent}。后果：{consequence}。结果：{result}。"
  },
  "state.transition": {
    en: "State transition: {from} -> {to}. Result: {result}.",
    zh: "状态转移：{from} -> {to}。结果：{result}。"
  },
  "rules.check.resolved": {
    en: "Rule check {expression}: {total} vs DC {dc}. Result: {result}.",
    zh: "规则判定 {expression}：{total} 对 DC {dc}。结果：{result}。"
  },
  "memory.retrieval": {
    en: "Memory retrieval for {queryLabel}: {hitCount} hits; top result {topResult}. Result: {result}.",
    zh: "记忆检索 {queryLabel}：命中 {hitCount} 条；首位结果 {topResult}。结果：{result}。"
  },
  "combat.calculation": {
    en: "Combat calculation {action}: {actor} -> {target}; roll {total} vs defense {defense}; damage {damage}. Result: {result}.",
    zh: "战斗计算 {action}：{actor} -> {target}；掷骰 {total} 对防御 {defense}；伤害 {damage}。结果：{result}。"
  },
  "inventory.mutation": {
    en: "Inventory {action}: {item}. Result: {result}.",
    zh: "物品栏{action}：{item}。结果：{result}。"
  },
  "soundscape.switch": {
    en: "Soundscape switch: {from} -> {to}. Result: {result}.",
    zh: "音景切换：{from} -> {to}。结果：{result}。"
  },
  "asset.selection": {
    en: "Asset selection: {asset}. Result: {result}.",
    zh: "资产选择：{asset}。结果：{result}。"
  },
  "chat.message": {
    en: "Chat message recorded on {channel}. Result: content hidden.",
    zh: "已记录 {channel} 聊天。结果：正文已隐藏。"
  },
  "error": {
    en: "Error {code}: {errorMessage}",
    zh: "错误 {code}：{errorMessage}"
  },
  "transcript.event": {
    en: "{type} transcript event recorded. Result: {result}.",
    zh: "{type} 牌桌事件已记录。结果：{result}。"
  }
});

export function aiDecision(input = {}) {
  const review = buildAiDecisionReview(input);
  const metadata = sanitizeMetadata({
    decision: input.decision,
    rationale: normalizeList(input.rationale),
    constraints: normalizeList(input.constraints),
    result: input.result,
    beat: review.beat,
    scene: review.scene,
    questClock: review.questClock,
    dangerClock: review.dangerClock,
    clueClock: review.clueClock,
    deadlineClock: review.deadlineClock,
    consequence: review.consequence,
    sceneChange: review.sceneChange,
    npcIntent: review.npcIntent,
    memoryRefs: review.memoryRefs,
    searchTags: review.searchTags,
    provider: input.provider,
    model: input.model,
    latencyMs: input.latencyMs,
    promptChars: input.promptChars,
    completionChars: input.completionChars,
    ...input.metadata
  });
  const decision = readableValue(input.decision, "decision");
  const result = readableValue(input.result, "result recorded");
  const template = buildTemplate(input.messageKey || "ai.dm.decision", {
    decision,
    result,
    beat: review.beat,
    scene: review.scene,
    questClock: review.questClock,
    dangerClock: review.dangerClock,
    clueClock: review.clueClock,
    npcIntent: review.npcIntent,
    consequence: review.consequence
  }, input.template);

  return createStructuredLog({
    ...input,
    type: "ai.decision",
    scope: input.scope || "ai-dm",
    category: input.category || "ai-dm",
    action: input.action || "decide",
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
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
  const result = readableValue(input.result || to, to);
  const template = buildTemplate(input.messageKey || "state.transition", { from, to, result }, input.template);
  return createStructuredLog({
    ...input,
    type: "state.transition",
    scope: input.scope || "state",
    category: input.category || "state",
    action: input.action || "transition",
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
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
  const result = readableValue(input.result || outcome, outcome);
  const expression = readableValue(input.expression, "check");
  const template = buildTemplate(input.messageKey || "rules.check.resolved", {
    expression,
    total: total ?? "unknown",
    dc: dc ?? "unknown",
    result
  }, input.template);

  return createStructuredLog({
    ...input,
    type: "dice.roll",
    scope: input.scope || "rules",
    category: input.category || "rules",
    action: input.action || "resolve-check",
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
    humanSummary: input.humanSummary || {
      en: `Rolled ${expression}: ${total ?? "unknown"} vs DC ${dc ?? "unknown"} (${outcome}).`,
      zh: `骰子检定 ${expression}：${total ?? "未知"} 对 DC ${dc ?? "未知"}（${outcome}）。`
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

export function memoryRetrieval(input = {}) {
  const queryLabel = readableValue(input.queryLabel || input.queryId || input.query, "query");
  const results = Array.isArray(input.results) ? input.results : [];
  const hitCount = Number.isFinite(Number(input.hitCount)) ? Number(input.hitCount) : results.length;
  const top = input.topResult || results[0] || null;
  const topResult = readableValue(top?.sourceEventId || top?.id || top, "none");
  const result = readableValue(input.result || (hitCount > 0 ? "retrieved" : "miss"), hitCount > 0 ? "retrieved" : "miss");
  const template = buildTemplate(input.messageKey || "memory.retrieval", {
    queryLabel,
    hitCount,
    topResult,
    result
  }, input.template);

  return createStructuredLog({
    ...input,
    type: "memory.retrieval",
    scope: input.scope || "memory",
    category: input.category || "memory",
    action: input.action || "retrieve",
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
    humanSummary: input.humanSummary || {
      en: `Memory retrieval for ${queryLabel}: ${hitCount} hits; top result ${topResult}.`,
      zh: `记忆检索 ${queryLabel}：命中 ${hitCount} 条；首位结果 ${topResult}。`
    },
    metadata: sanitizeMetadata({
      queryId: input.queryId,
      queryTerms: normalizeList(input.queryTerms),
      expectedEventIds: normalizeList(input.expectedEventIds),
      retrievedIds: normalizeList(input.retrievedIds || results.map((entry) => entry?.sourceEventId || entry?.id).filter(Boolean)),
      hitEventIds: normalizeList(input.hitEventIds),
      missedEventIds: normalizeList(input.missedEventIds),
      rankedScores: summarizeRankedScores(input.rankedScores || results),
      recallAtK: input.recallAtK ?? input.recallAt5,
      reciprocalRank: input.reciprocalRank,
      ...input.metadata
    })
  });
}

export function combatCalculation(input = {}) {
  const action = readableValue(input.action, "attack");
  const actor = readableValue(input.actorName || input.actorId, "actor");
  const target = readableValue(input.targetName || input.targetId, "target");
  const total = Number.isFinite(Number(input.total)) ? Number(input.total) : readableValue(input.total, "unknown");
  const defense = Number.isFinite(Number(input.defense)) ? Number(input.defense) : readableValue(input.defense, "unknown");
  const damage = Number.isFinite(Number(input.damage)) ? Number(input.damage) : readableValue(input.damage, "0");
  const derivedOutcome = Number.isFinite(Number(total)) && Number.isFinite(Number(defense))
    ? (Number(total) >= Number(defense) ? "hit" : "miss")
    : "resolved";
  const result = readableValue(input.result || input.outcome || derivedOutcome, "resolved");
  const template = buildTemplate(input.messageKey || "combat.calculation", {
    action,
    actor,
    target,
    total,
    defense,
    damage,
    result
  }, input.template);

  return createStructuredLog({
    ...input,
    type: "combat.calculation",
    scope: input.scope || "combat",
    category: input.category || "combat",
    action,
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
    humanSummary: input.humanSummary || {
      en: `${actor} ${action} ${target}: ${result}, ${damage} damage.`,
      zh: `${actor} 对 ${target} 执行${action}：${result}，伤害 ${damage}。`
    },
    metadata: sanitizeMetadata({
      actorId: input.actorId,
      targetId: input.targetId,
      actorTeam: input.actorTeam,
      targetTeam: input.targetTeam,
      total,
      defense,
      damage,
      targetHpBefore: input.targetHpBefore,
      targetHpAfter: input.targetHpAfter,
      statusBefore: input.statusBefore,
      statusAfter: input.statusAfter,
      roll: input.roll,
      formula: input.formula,
      ...input.metadata
    })
  });
}

export function inventoryMutation(input = {}) {
  const action = readableValue(input.action, "updated");
  const item = readableValue(input.itemLabel || input.itemName || input.itemId, "item");
  const result = readableValue(input.result || input.outcome || action, action);
  const template = buildTemplate(input.messageKey || "inventory.mutation", { action, item, result }, input.template);
  return createStructuredLog({
    ...input,
    type: "inventory.mutation",
    scope: input.scope || "inventory",
    category: input.category || "inventory",
    action,
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
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
  const result = readableValue(input.result || to, to);
  const template = buildTemplate(input.messageKey || "soundscape.switch", { from, to, result }, input.template);
  return createStructuredLog({
    ...input,
    type: "soundscape.switch",
    scope: input.scope || "media",
    category: input.category || "soundscape",
    action: input.action || "switch",
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
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
  const result = readableValue(input.result || input.assetId || asset, asset);
  const template = buildTemplate(input.messageKey || "asset.selection", { asset, result }, input.template);
  return createStructuredLog({
    ...input,
    type: "asset.selection",
    scope: input.scope || "media",
    category: input.category || "asset",
    action: input.action || "select",
    result,
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: input.message || renderTemplate(template, "en"),
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
  const template = buildTemplate(input.messageKey || "chat.message", { channel }, input.template);
  return createStructuredLog({
    ...input,
    type: "chat.message",
    scope: input.scope || "chat",
    category: input.category || "chat",
    action: input.action || "record",
    result: input.result || "content-hidden",
    messageKey: template.key,
    template,
    severity: input.severity || "info",
    message: renderTemplate(template, "en"),
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
  const template = buildTemplate(input.messageKey || "error", { code, errorMessage }, input.template);

  return createStructuredLog({
    ...input,
    type: "error",
    scope: input.scope || "system",
    category: input.category || "system",
    action: input.action || "error",
    result: input.result || code,
    messageKey: template.key,
    template,
    severity: input.severity || "error",
    message: renderTemplate(template, "en"),
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
  const messageKey = readableValue(input.messageKey || input.template?.key || type, type);
  const template = normalizeTemplate(input.template, messageKey, input.templateParams, input.message || type);
  return {
    type,
    scope: readableValue(input.scope, "system"),
    category: readableValue(input.category || input.scope || type.split(".")[0], "system"),
    action: readableValue(input.action || type.split(".").at(-1) || "record", "record"),
    result: readableValue(input.result || input.outcome || input.metadata?.result || "recorded", "recorded"),
    severity: normalizeSeverity(input.severity),
    roomId,
    turnId,
    actorId,
    eventId,
    messageKey,
    template,
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

function buildAiDecisionReview(input) {
  const state = input.stateSummary || {};
  const clocks = input.clockState || input.clocks || state.clocks || {};
  const scene = input.scene || input.sceneLocation || state.scene?.location || state.scene?.title || "current scene";
  const beat = input.beat || input.directorBeat || state.beat?.id || "unknown beat";
  const consequence = input.consequence
    || input.consequenceLabel
    || state.scene?.activeConsequences?.[0]?.label
    || state.trackers?.consequences?.[0]?.label
    || "none";
  const npcIntent = input.npcIntent
    || state.npcIntent?.type
    || state.trackers?.npcIntent?.type
    || state.combat?.tacticalIntent?.type
    || state.combat?.tacticalIntent?.reason
    || "none";

  return {
    beat: readableValue(beat, "unknown beat"),
    scene: readableValue(scene, "current scene"),
    questClock: formatClockForLog(firstDefined(input.questClock, clocks.quest, state.questClock, state.trackers?.questClock, state.quest?.progress), "quest"),
    dangerClock: formatClockForLog(firstDefined(input.dangerClock, clocks.danger, state.trackers?.danger), "danger"),
    clueClock: formatClockForLog(firstDefined(input.clueClock, clocks.clues, state.trackers?.clues), "clues"),
    deadlineClock: formatClockForLog(firstDefined(input.deadlineClock, clocks.deadline), "deadline"),
    consequence: readableValue(consequence, "none"),
    sceneChange: readableValue(input.sceneChange || state.trackers?.sceneChange || state.scene?.lastShiftReason || state.scene?.lastEvolutionReason || "none", "none"),
    npcIntent: readableValue(npcIntent, "none"),
    memoryRefs: normalizeList(input.memoryRefs || input.memoryIds || state.memoryRefs),
    searchTags: normalizeList(input.searchTags || [
      "ai-dm",
      beat,
      scene,
      npcIntent,
      consequence
    ]).map((entry) => readableValue(entry, "")).filter(Boolean)
  };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function formatClockForLog(value, fallbackId) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const id = value.id || fallbackId;
    const current = value.value ?? value.current ?? value.progress ?? value.count;
    const max = value.max ?? (Number(current) > 6 ? 100 : 6);
    if (Number.isFinite(Number(current))) {
      return `${id}:${Number(current)}/${max}`;
    }
    return readableValue(value.label || value.status || id, fallbackId);
  }
  if (Number.isFinite(Number(value))) {
    const current = Number(value);
    const max = current > 6 ? 100 : 6;
    return `${fallbackId}:${current}/${max}`;
  }
  return `${fallbackId}:unknown`;
}

function buildTemplate(key, params = {}, override = null) {
  const definition = LOG_TEMPLATES[key] || {};
  const template = override && typeof override === "object" && !Array.isArray(override)
    ? override
    : {};
  return {
    key: readableValue(template.key || key, key),
    en: readableValue(template.en || definition.en || "{type} event recorded.", "{type} event recorded."),
    zh: readableValue(template.zh || definition.zh || template.en || definition.en || "{type} 事件已记录。", "{type} 事件已记录。"),
    params: sanitizeMetadata({
      ...params,
      ...(template.params || {})
    })
  };
}

function normalizeTemplate(value, messageKey, params = {}, fallback = "event") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return buildTemplate(value.key || messageKey, {
      ...params,
      ...(value.params || {})
    }, value);
  }
  if (typeof value === "string") {
    return buildTemplate(messageKey, params, { en: value, zh: value });
  }
  return buildTemplate(messageKey, params, { en: readableValue(fallback, "event"), zh: readableValue(fallback, "事件") });
}

function renderTemplate(template, locale = "en") {
  const pattern = template?.[locale] || template?.en || "{type} event recorded.";
  const params = template?.params || {};
  return redactString(String(pattern).replace(/\{(\w+)\}/g, (_, key) => readableValue(params[key], key)));
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

function summarizeRankedScores(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, 10).map((entry) => ({
    sourceEventId: entry?.sourceEventId || entry?.memory?.sourceEventId || entry?.id || null,
    score: Number.isFinite(Number(entry?.score)) ? Number(Number(entry.score).toFixed(4)) : null,
    matchedTokens: normalizeList(entry?.matchedTokens).slice(0, 12),
    tokenCount: Number.isFinite(Number(entry?.tokenCount)) ? Number(entry.tokenCount) : null
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
  if (typeof value === "object") {
    return readableValue(value.label || value.en || value.zh || value.default || value.id || value.name || value.type, fallback);
  }
  return redactString(value);
}

function buildCorrelationId({ roomId, turnId, eventId, type, timestamp }) {
  return [roomId || "room", turnId || "turn", eventId || "event", type, timestamp].join(":");
}
