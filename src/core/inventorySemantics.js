import { describeInventoryEntry, getItemDefinition, hydrateInventoryEntry } from "./itemCatalog.js";

const ACTION_REASON_LABELS = Object.freeze({
  ok: { en: "Available", zh: "可执行" },
  "free-time": { en: "Free-time action", zh: "自由时间动作" },
  "turn-moving": { en: "Advances the table turn", zh: "会推进牌桌回合" },
  "not-usable": { en: "No direct use action", zh: "没有直接使用动作" },
  "not-tradeable": { en: "Cannot be sold", zh: "不可售卖" },
  "not-equippable": { en: "Cannot be equipped", zh: "不可装备" },
  "tool-utility": { en: "Use as a scene tool", zh: "作为场景工具使用" },
  "tool-not-equippable": { en: "Use from backpack; no equipment slot", zh: "从背包使用；不占用装备栏" },
  "not-equipped": { en: "Not currently equipped", zh: "当前未装备" },
  "quest-locked": { en: "Protected quest or clue item", zh: "受保护的任务或线索物品" },
  "host-override": { en: "Host override required", zh: "需要主持人确认" },
  "keep-recommended": { en: "Keep for story review", zh: "建议保留用于剧情复盘" }
});

export function describeItemStoryFlags(entryOrId, options = {}) {
  const entry = hydrateInventoryEntry(entryOrId);
  const definition = entry.definitionSnapshot || getItemDefinition(entry.itemId);
  const tags = unique([
    ...(definition.tags || []),
    ...(entry.tags || []),
    ...(entry.storyFlags?.tags || [])
  ].map(normalizeTag));
  const source = entry.source || options.discoveredSource || "unknown";
  const category = definition.category || "tradeGood";
  const isQuestItem = category === "quest" || tags.includes("quest");
  const isClue = tags.includes("clue") || tags.includes("quest-clue") || tags.includes("evidence");
  const explicitSpendable = firstDefined(entry.spendable, entry.storyFlags?.spendable, definition.storyFlags?.spendable);
  const protectedItem = Boolean(isQuestItem || isClue || entry.storyFlags?.protected || definition.storyFlags?.protected);
  const spendable = explicitSpendable === undefined ? !protectedItem : Boolean(explicitSpendable);
  const questId = entry.questId
    || entry.storyFlags?.questId
    || definition.storyFlags?.questId
    || (isQuestItem || tags.includes("quest-clue") ? options.questId || `quest:${entry.itemId}` : null);
  const clueId = entry.clueId
    || entry.storyFlags?.clueId
    || definition.storyFlags?.clueId
    || (isClue ? options.clueId || `clue:${entry.itemId}` : null);

  return {
    itemId: entry.itemId,
    entryId: entry.id,
    category,
    tags,
    questId,
    clueId,
    ownerNote: entry.ownerNote || entry.storyFlags?.ownerNote || options.ownerNote || "",
    discoveredSource: entry.discoveredSource || entry.storyFlags?.discoveredSource || source,
    spendable,
    protected: !spendable,
    safeHandling: spendable ? "normal" : "host-confirmation",
    protectionReason: !spendable
      ? (isQuestItem ? "quest-locked" : "clue-locked")
      : "spendable"
  };
}

export function describeInventoryActionReasons(entryOrId, language = "en", context = {}) {
  const entry = hydrateInventoryEntry(entryOrId);
  const view = describeInventoryEntry(entry, language);
  const story = describeItemStoryFlags(entry, context);
  const hostOverride = Boolean(context.hostOverride);
  const protectedWithoutOverride = story.protected && !hostOverride;
  const consumable = Boolean(view.definition.useEffect?.consume !== false && view.actions.use.available);
  const canSell = Boolean(view.actions.sell.available && (!protectedWithoutOverride || context.allowProtectedSell));
  const canUse = Boolean(view.actions.use.available && (!(protectedWithoutOverride && consumable) || context.allowProtectedUse));
  const canEquip = Boolean(view.actions.equip.available);
  const canUnequip = Boolean(entry.equipped);

  return {
    itemId: entry.itemId,
    entryId: entry.id,
    story,
    actions: {
      buy: action("buy", Boolean(context.offerAvailable ?? true), context.buyReason || "free-time", language, "free-time"),
      sell: action("sell", canSell, sellReason(view, story, hostOverride), language, "free-time"),
      use: action("use", canUse, useReason(view, story, hostOverride, consumable), language, canUse ? "turn-moving" : "free-time"),
      equip: action("equip", canEquip, canEquip ? "free-time" : equipReason(view), language, "free-time"),
      unequip: action("unequip", canUnequip, canUnequip ? "free-time" : "not-equipped", language, "free-time"),
      keep: action("keep", true, story.protected ? "keep-recommended" : "ok", language, "free-time"),
      questLock: action("questLock", false, story.protected ? "quest-locked" : "ok", language, "free-time", {
        active: story.protected,
        requiresHostOverride: story.protected && !hostOverride
      })
    }
  };
}

function action(id, available, reasonCode, language, turnCost, extra = {}) {
  return {
    id,
    available,
    reasonCode,
    reasonLabel: label(reasonCode, language),
    turnCost,
    turnCostLabel: label(turnCost, language),
    ...extra
  };
}

function sellReason(view, story, hostOverride) {
  if (!view.actions.sell.available) return "not-tradeable";
  if (story.protected && !hostOverride) return "quest-locked";
  if (story.protected && hostOverride) return "host-override";
  return "free-time";
}

function useReason(view, story, hostOverride, consumable) {
  if (!view.actions.use.available) return "not-usable";
  if (story.protected && consumable && !hostOverride) return "quest-locked";
  if (story.protected && consumable && hostOverride) return "host-override";
  if (view.definition.useEffect?.type === "tool-utility") return "tool-utility";
  return "turn-moving";
}

function equipReason(view) {
  return view.actions.equip.reasonCode || "not-equippable";
}

function label(reason, language) {
  const labels = ACTION_REASON_LABELS[reason] || ACTION_REASON_LABELS.ok;
  return localize(labels, language);
}

function localize(value, language = "en") {
  const locale = String(language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
  return value?.[locale] || value?.en || value?.zh || "";
}

function normalizeTag(value) {
  return String(value || "").trim().toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}
