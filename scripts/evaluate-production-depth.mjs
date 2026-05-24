#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { buildPresentation, loadGeneratedAssetCatalog } from "../src/core/assetSelection.js";
import { MemoryIndex, extractMemoryTags } from "../src/core/memory.js";
import { buildTableStateSummary } from "../src/core/stateSummary.js";
import { chooseSoundscape } from "../src/core/soundscape.js";
import {
  CURRENCY,
  buyShopItem,
  createInventoryEntry,
  describeInventoryEntry,
  sellInventoryItem,
  useInventoryItem
} from "../src/core/itemCatalog.js";
import {
  aiDecision,
  assetSelection,
  chatMessage,
  error,
  inventoryMutation,
  soundscapeSwitch,
  stateTransition
} from "../src/core/logTemplates.js";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const defaultDatasetPath = "evals/production-depth/scenarios.json";

if (isCli()) {
  const { datasetPath, reportPath } = parseCliArgs(process.argv.slice(2));
  const report = await runProductionDepthEval({ datasetPath, reportPath });
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.summary.passed) {
    process.exit(1);
  }
}

export async function runProductionDepthEval({ datasetPath = defaultDatasetPath, reportPath = null } = {}) {
  const startedAt = performance.now();
  const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
  const scenarioResults = await Promise.all((dataset.scenarios || []).map(evaluateScenario));
  const suiteResults = [
    evaluateLongHistoryRetrieval(),
    evaluateStructuredLogSafety(),
    evaluateEventProgression(),
    evaluateStateControlSurface(),
    evaluateEconomyInvariants(),
    await evaluateAssetBindings()
  ];
  const results = [...scenarioResults, ...suiteResults];
  const passedCount = results.filter((result) => result.passed).length;
  const passRate = results.length === 0 ? 0 : passedCount / results.length;
  const summary = {
    dataset: dataset.name,
    datasetPath,
    datasetVersion: dataset.version || null,
    gate: dataset.gate || "production-depth",
    checkCount: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    passRate,
    thresholds: dataset.threshold || { minPassRate: 1 },
    durationMs: Math.round(performance.now() - startedAt)
  };
  summary.passed = passRate >= summary.thresholds.minPassRate;

  const report = {
    reportVersion: 1,
    generatedAt: new Date().toISOString(),
    summary,
    results
  };

  if (reportPath) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

async function evaluateScenario(scenario) {
  const soundscape = chooseSoundscape(scenario.room);
  const presentation = buildPresentation(scenario.room, soundscape);
  const asset = presentation.sceneAsset;
  const checks = [
    check("scene asset exists", Boolean(asset), { assetId: asset?.id || null }),
    check("scene asset semantic key matches expected", !scenario.expect?.assetSemanticKey || asset?.semanticKey === scenario.expect.assetSemanticKey, {
      expected: scenario.expect?.assetSemanticKey || null,
      actual: asset?.semanticKey || null
    }),
    checkTerms("scene asset includes required scene terms", assetTerms(asset), scenario.expect?.assetMustInclude || []),
    checkTermsAbsent("scene asset avoids conflicting scene terms", assetTerms(asset), scenario.expect?.assetMustNotInclude || []),
    check("soundscape matches expected family", soundscapeMatchesExpectedFamily(soundscape, scenario.expect?.soundscapeIds || []), {
      expected: scenario.expect?.soundscapeIds || [],
      actual: soundscape.id,
      profileWeather: soundscape.profile?.weather || [],
      layers: (soundscape.layers || []).map((layer) => layer.profile)
    }),
    checkTerms("soundscape includes weather/location evidence", soundscapeTerms(soundscape), scenario.expect?.soundscapeMustInclude || []),
    checkTermsAbsent("soundscape avoids conflicting weather/location evidence", soundscapeTerms(soundscape), scenario.expect?.soundscapeMustNotInclude || []),
    check("selected scene asset and soundscape share context terms", sharedSceneAudioTerms(asset, soundscape).length > 0, {
      sharedTerms: sharedSceneAudioTerms(asset, soundscape)
    })
  ];

  return result(`scenario:${scenario.id}`, "scene-audio-consistency", checks, {
    selectedAsset: summarizeAsset(asset),
    selectedSoundscape: summarizeSoundscape(soundscape)
  });
}

function evaluateStructuredLogSafety() {
  const fixedTime = "2026-05-24T01:02:03.000Z";
  const logs = [
    aiDecision({
      roomId: "room-secret",
      actorId: "aidm",
      decision: "hide raw provider secret",
      rationale: ["provider returned apiKey=sk-live-secret"],
      constraints: ["playerToken=private-token"],
      result: "redacted",
      beat: "complication",
      scene: "Rain archive gate",
      clocks: { quest: { id: "quest", value: 3, max: 6 }, clues: { id: "clues", value: 2, max: 6 }, danger: { id: "danger", value: 4, max: 6 } },
      consequence: "masked guard hears the failed attempt",
      sceneChange: "pressure-without-location-jump",
      npcIntent: { type: "bargain", reason: "failure leaves a recoverable option" },
      memoryRefs: ["E0012", "E0044"],
      metadata: { password: "open-sesame", nested: { token: "nested-token" } },
      timestamp: fixedTime
    }),
    chatMessage({
      roomId: "room-secret",
      actorId: "player-secret",
      channel: "party",
      text: "password=dragon token=abc123 meet behind the shrine",
      message: "raw text must not leak",
      timestamp: fixedTime
    }),
    error({
      roomId: "room-secret",
      error: Object.assign(new Error("Bearer sk-test-token password=hunter2"), {
        code: "AI_PROVIDER_FAILED",
        statusCode: 502,
        stack: "private stack"
      }),
      context: { apiKey: "sk-live-private" },
      timestamp: fixedTime
    }),
    stateTransition({ from: "lobby", to: "scene", timestamp: fixedTime }),
    inventoryMutation({ action: "use", itemId: "sleep-scroll", itemLabel: "Sleep Scroll", timestamp: fixedTime }),
    soundscapeSwitch({ fromId: "mystery", toId: "forest", layers: [{ id: "rain", type: "weather", gain: 0.4, buffer: "private" }], timestamp: fixedTime }),
    assetSelection({ assetId: "scene-archive-rain", assetName: "Rain Archive", candidates: [{ id: "a", score: 1, secret: "hidden" }], timestamp: fixedTime })
  ];
  const serialized = JSON.stringify(logs);
  const requiredFields = [
    "type",
    "scope",
    "category",
    "action",
    "result",
    "severity",
    "messageKey",
    "template",
    "message",
    "humanSummary",
    "metadata",
    "timestamp",
    "correlationId"
  ];
  const checks = [
    check("structured logs include required common fields", logs.every((log) => requiredFields.every((field) => Object.hasOwn(log, field)))),
    check("structured logs include readable bilingual templates", logs.every((log) => typeof log.messageKey === "string"
      && typeof log.template?.en === "string"
      && typeof log.template?.zh === "string"
      && log.category
      && log.action
      && log.result)),
    check("AI DM logs include reviewable state and memory hooks", (() => {
      const log = logs.find((entry) => entry.type === "ai.decision");
      return log?.template?.params?.beat === "complication"
        && log.metadata?.questClock === "quest:3/6"
        && log.metadata?.dangerClock === "danger:4/6"
        && log.metadata?.npcIntent === "bargain"
        && log.metadata?.memoryRefs?.length === 2
        && log.metadata?.searchTags?.includes("ai-dm");
    })()),
    check("structured logs redact sensitive values", !/sk-live-secret|private-token|open-sesame|nested-token|dragon|abc123|hunter2|sk-live-private|sk-test-token|private stack|raw text must not leak/.test(serialized)),
    check("chat logs keep content out of message and metadata", logs.find((log) => log.type === "chat.message")?.metadata.textLength === "password=dragon token=abc123 meet behind the shrine".length),
    check("media logs bound candidate and layer details", logs.find((log) => log.type === "asset.selection")?.metadata.candidates.length <= 5
      && Object.keys(logs.find((log) => log.type === "soundscape.switch")?.metadata.layers[0] || {}).join(",") === "id,type,gain")
  ];

  return result("structured-log-safety", "log-safety", checks, { logTypes: logs.map((log) => log.type) });
}

function evaluateLongHistoryRetrieval() {
  const memory = new MemoryIndex();
  const events = [
    ...Array.from({ length: 40 }, (_, index) => ({
      id: `DEC${String(index + 1).padStart(3, "0")}`,
      text: `Downtime note ${index + 1}: the party bought rope, checked tavern rumors, and discussed the south gate.`,
      tags: ["downtime", `note-${index + 1}`]
    })),
    {
      id: "KEY-CISTERN-BARGAIN",
      text: "Nalia, the cistern keeper, intends to offer a bargain if the party mentions blue ash and the sealed ledger.",
      tags: ["nalia", "cistern", "bargain", "blue", "ash", "ledger"]
    },
    {
      id: "KEY-ARCHIVE-CONSEQUENCE",
      text: "Magistrate Cale will lock the archive balcony if danger reaches five before the ledger clue is recovered.",
      tags: ["cale", "archive", "danger", "ledger", "consequence"]
    }
  ];
  events.forEach((event, index) => {
    memory.add({
      kind: "event",
      text: event.text,
      tags: event.tags || extractMemoryTags(event.text),
      sourceEventId: event.id,
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString()
    });
  });

  const bargainResults = memory.retrieveWithScores("Which NPC intends to bargain at the cistern if we mention blue ash?", { limit: 5 });
  const consequenceResults = memory.retrieveWithScores("What happens if archive danger reaches five before the ledger clue?", { limit: 5 });
  const checks = [
    check("long history retrieval finds a buried NPC intent fact", bargainResults.some((entry) => entry.memory.sourceEventId === "KEY-CISTERN-BARGAIN"), {
      retrievedIds: bargainResults.map((entry) => entry.memory.sourceEventId)
    }),
    check("long history retrieval ranks exact intent before generic decoys", bargainResults[0]?.memory.sourceEventId === "KEY-CISTERN-BARGAIN", {
      topResult: bargainResults[0]?.memory.sourceEventId || null,
      score: bargainResults[0]?.score || 0
    }),
    check("long history retrieval finds a delayed consequence fact", consequenceResults.some((entry) => entry.memory.sourceEventId === "KEY-ARCHIVE-CONSEQUENCE"), {
      retrievedIds: consequenceResults.map((entry) => entry.memory.sourceEventId)
    }),
    check("retrieval diagnostics expose matched tokens", bargainResults[0]?.matchedTokens?.includes("cistern") && bargainResults[0]?.matchedTokens?.includes("bargain"), {
      matchedTokens: bargainResults[0]?.matchedTokens || []
    })
  ];

  return result("long-history-retrieval", "memory-retrieval", checks, {
    indexedEvents: events.length,
    topBargainIds: bargainResults.map((entry) => entry.memory.sourceEventId),
    topConsequenceIds: consequenceResults.map((entry) => entry.memory.sourceEventId)
  });
}

function evaluateEventProgression() {
  const timeline = [
    {
      id: "T001",
      version: 1,
      round: 1,
      scene: { location: "Archive gate" },
      clocks: { quest: 0, clues: 0, danger: 1, deadline: 2 },
      sceneChange: { changed: false, reason: "opening-scene" }
    },
    {
      id: "T002",
      version: 2,
      round: 1,
      scene: { location: "Archive gate" },
      clocks: { quest: 1, clues: 1, danger: 1, deadline: 2 },
      sceneChange: { changed: false, reason: "clue-progress" }
    },
    {
      id: "T003",
      version: 3,
      round: 2,
      scene: { location: "Archive gate" },
      clocks: { quest: 1, clues: 1, danger: 3, deadline: 3 },
      sceneChange: { changed: false, reason: "danger-consequence" }
    },
    {
      id: "T004",
      version: 4,
      round: 2,
      scene: { location: "Rain-sheltered market" },
      clocks: { quest: 3, clues: 3, danger: 2, deadline: 3 },
      sceneChange: { changed: true, reason: "travel-intent" }
    }
  ];
  const checks = evaluateProgressionTimeline(timeline);
  return result("event-progression-monotonicity", "event-progression", checks, {
    eventIds: timeline.map((entry) => entry.id)
  });
}

export function evaluateProgressionTimeline(timeline = []) {
  const clockIds = ["quest", "clues", "danger", "deadline"];
  const versions = timeline.map((entry) => Number(entry.version || 0));
  const rounds = timeline.map((entry) => Number(entry.round || 0));
  const clockDeltas = [];
  const sceneJumps = [];

  for (let index = 1; index < timeline.length; index += 1) {
    const previous = timeline[index - 1];
    const current = timeline[index];
    for (const clockId of clockIds) {
      const delta = Number(current.clocks?.[clockId] || 0) - Number(previous.clocks?.[clockId] || 0);
      clockDeltas.push({ eventId: current.id, clockId, delta });
    }
    if (previous.scene?.location !== current.scene?.location && current.sceneChange?.changed !== true) {
      sceneJumps.push({ from: previous.id, to: current.id, fromLocation: previous.scene?.location, toLocation: current.scene?.location });
    }
  }

  return [
    check("event versions advance strictly", versions.every((value, index) => index === 0 || value > versions[index - 1]), { versions }),
    check("rounds never move backward", rounds.every((value, index) => index === 0 || value >= rounds[index - 1]), { rounds }),
    check("clocks stay bounded and change by at most two per event", timeline.every((entry) => {
      return clockIds.every((clockId) => Number(entry.clocks?.[clockId] || 0) >= 0
        && Number(entry.clocks?.[clockId] || 0) <= 6);
    }) && clockDeltas.every((entry) => Math.abs(entry.delta) <= 2), {
      largeDeltas: clockDeltas.filter((entry) => Math.abs(entry.delta) > 2)
    }),
    check("scene location changes require an explicit sceneChange marker", sceneJumps.length === 0, { sceneJumps })
  ];
}

function evaluateStateControlSurface() {
  const summary = buildTableStateSummary({
    scene: {
      title: "Archive gate",
      location: "Archive gate",
      objective: "Recover the sealed ledger",
      ambience: "rain and copper lamps",
      clocks: { quest: 3, clues: 2, danger: 4, deadline: 3 },
      currentLead: { id: "lead-ledger", kind: "clue", clock: "clues", label: { en: "Ledger ash", zh: "账本灰烬" } },
      activeConsequences: [{ id: "danger-guard", kind: "danger", clock: "danger", severity: "major", label: { en: "Guard alerted", zh: "守卫警觉" } }],
      lastEvolutionReason: "danger-consequence",
      lastShiftReason: "opening-scene"
    },
    quests: [{ id: "quest-ledger", title: "Recover the sealed ledger", status: "active", progress: 50, clues: ["ash", "seal"] }],
    director: { beat: "complication", npcIntent: { type: "bargain", reason: "recoverable failure" } },
    combat: { state: "imminent", tacticalIntent: { type: "pressure", reason: "danger high" }, encounter: { enemies: [] } },
    transcript: [{ id: "gm-1", type: "gm", text: "The guard hears the failed attempt." }]
  });

  const checks = [
    check("state summary exposes a quest clock", summary.questClock?.id === "quest" && summary.questClock.value === 3, { questClock: summary.questClock }),
    check("state trackers expose danger, clues, and consequences", summary.trackers?.danger?.value === 4
      && summary.trackers?.clues?.value === 2
      && summary.trackers?.consequences?.[0]?.id === "danger-guard", { trackers: summary.trackers }),
    check("state trackers expose scene change without forcing a location jump", summary.trackers?.sceneChange?.changed === true
      && summary.trackers?.sceneChange?.lastEvolutionReason === "danger-consequence", { sceneChange: summary.trackers?.sceneChange }),
    check("state summary exposes current NPC intent", summary.npcIntent?.type === "bargain", { npcIntent: summary.npcIntent }),
    check("state control advertises bounded review fields", summary.control?.reviewFields?.includes("npcIntent")
      && summary.control?.controllableClocks?.includes("quest")
      && summary.control?.status === "controlled", { control: summary.control })
  ];

  return result("state-control-surface", "state-control", checks, {
    questClock: summary.questClock,
    reviewFields: summary.control.reviewFields
  });
}

function evaluateEconomyInvariants() {
  const player = {
    id: "player-economy",
    character: {
      wallet: 200,
      spells: [],
      inventory: [
        createInventoryEntry("healing-word-scroll", { condition: "fine", instanceId: "scroll-entry" }),
        createInventoryEntry("silver-ledger", { condition: "worn", instanceId: "ledger-entry" }),
        createInventoryEntry("field-notebook", { condition: "fine", instanceId: "notebook-entry" })
      ]
    }
  };
  const initialWallet = player.character.wallet;
  const learned = useInventoryItem(player, "scroll-entry");
  const afterUseWallet = player.character.wallet;
  const sold = sellInventoryItem(player, "ledger-entry");
  const afterSellWallet = player.character.wallet;
  const bought = buyShopItem(player, "festival-wine");
  const checks = [
    check("using a scroll learns exactly one spell and consumes the entry", learned.learnedSpell === "healing-word"
      && player.character.spells.filter((spell) => spell === "healing-word").length === 1
      && !player.character.inventory.some((entry) => entry.id === "scroll-entry")),
    check("use actions do not mutate wallet", afterUseWallet === initialWallet, { initialWallet, afterUseWallet }),
    check("sell payout increases wallet by deterministic value", afterSellWallet === initialWallet + sold.payout, { payout: sold.payout, afterSellWallet }),
    check("buy price decreases wallet and adds inventory", player.character.wallet === afterSellWallet - bought.price
      && player.character.inventory.some((entry) => entry.itemId === "festival-wine" && entry.source === "shop"), {
      price: bought.price,
      wallet: player.character.wallet
    }),
    check("wallet never goes negative", player.character.wallet >= 0),
    check("currency stays catalog currency", sold.currency === CURRENCY.id && bought.currency === CURRENCY.id)
  ];

  return result("economy-invariants", "economy", checks, {
    initialWallet,
    finalWallet: player.character.wallet,
    soldPayout: sold.payout,
    boughtPrice: bought.price
  });
}

async function evaluateAssetBindings() {
  const catalog = loadGeneratedAssetCatalog();
  const boundAssets = [
    ...catalog.scenes.slice(0, 12),
    ...catalog.rewards.slice(0, 12)
  ];
  const fileChecks = await Promise.all(boundAssets.map(async (asset) => {
    const pngExists = await canAccess(join(rootDir, asset.file));
    const svgExists = asset.svgFile ? await canAccess(join(rootDir, asset.svgFile)) : true;
    return {
      id: asset.id,
      pngExists,
      svgExists,
      hasSemanticKey: Boolean(asset.semanticKey),
      hasSurface: Array.isArray(asset.uiSurface) && asset.uiSurface.length > 0,
      approved: asset.quality?.approved === true,
      usableRewardBinding: asset.group !== "generated-rewards" || Boolean(describeInventoryEntry({
        id: `${asset.id}-entry`,
        itemId: `generated:${asset.semanticKey}`,
        quantity: 1,
        condition: "fine",
        source: "eval",
        value: 1,
        currency: CURRENCY.id,
        tradeable: true,
        usable: false,
        definitionSnapshot: {
          id: `generated:${asset.semanticKey}`,
          name: asset.displayName || { en: asset.name, zh: asset.zhName || asset.name },
          category: "tradeGood",
          baseValue: 1,
          tradeable: true,
          tags: asset.tags || [],
          assetRef: { file: asset.file, semanticKey: asset.semanticKey },
          description: asset.description
        }
      }).definition.assetRef?.file)
    };
  }));
  const checks = [
    check("generated catalog exposes player-safe scene assets", catalog.scenes.length > 0, { sceneCount: catalog.scenes.length }),
    check("generated catalog exposes reward assets", catalog.rewards.length > 0, { rewardCount: catalog.rewards.length }),
    check("sampled generated assets have readable files and bindings", fileChecks.every((entry) => entry.pngExists && entry.svgExists && entry.hasSemanticKey && entry.hasSurface && entry.approved && entry.usableRewardBinding), {
      checked: fileChecks.length,
      failures: fileChecks.filter((entry) => !(entry.pngExists && entry.svgExists && entry.hasSemanticKey && entry.hasSurface && entry.approved && entry.usableRewardBinding))
    })
  ];

  return result("asset-binding-usability", "asset-binding", checks, {
    sceneCount: catalog.scenes.length,
    rewardCount: catalog.rewards.length,
    sampledAssetIds: fileChecks.map((entry) => entry.id)
  });
}

function checkTerms(name, terms, expectedTerms) {
  return check(name, expectedTerms.every((term) => terms.has(term)), {
    expectedTerms,
    missingTerms: expectedTerms.filter((term) => !terms.has(term))
  });
}

function checkTermsAbsent(name, terms, blockedTerms) {
  return check(name, blockedTerms.every((term) => !terms.has(term)), {
    blockedTerms,
    presentTerms: blockedTerms.filter((term) => terms.has(term))
  });
}

function check(name, passed, details = {}) {
  return { name, passed: Boolean(passed), details };
}

function result(id, category, checks, details = {}) {
  return {
    id,
    category,
    passed: checks.every((entry) => entry.passed),
    checks,
    details
  };
}

function assetTerms(asset) {
  return normalizedTerms([
    asset?.id,
    asset?.name,
    asset?.semanticKey,
    asset?.variantOf,
    asset?.displayName?.en,
    asset?.displayName?.zh,
    asset?.description?.en || asset?.description,
    asset?.description?.zh,
    ...(asset?.soundscapeHints || []),
    ...(asset?.uiSurface || []),
    ...Object.values(asset?.variantAxes || {})
  ]);
}

function soundscapeTerms(soundscape) {
  return normalizedTerms([
    soundscape?.id,
    soundscape?.category,
    soundscape?.label,
    soundscape?.reason,
    ...(soundscape?.profile?.weather || []),
    ...(soundscape?.profile?.location || []),
    ...(soundscape?.profile?.mood || []),
    ...(soundscape?.assetHints || []),
    ...(soundscape?.visualHints || []),
    ...(soundscape?.layers || []).flatMap((layer) => [layer.id, layer.type, layer.profile, ...(layer.assetHints || []), ...(layer.visualHints || [])])
  ]);
}

function soundscapeMatchesExpectedFamily(soundscape, expectedIds) {
  if (!expectedIds.length) return true;
  const terms = soundscapeTerms(soundscape);
  return expectedIds.some((id) => soundscape?.id === id || terms.has(id) || terms.has(`weather:${id}`) || terms.has(`location:${id}`));
}

function sharedSceneAudioTerms(asset, soundscape) {
  const blockedGeneric = new Set(["scene", "v01", "generated", "stage", "backdrop", "relevant", "weather", "location"]);
  const audioTerms = soundscapeTerms(soundscape);
  return [...assetTerms(asset)]
    .filter((term) => term.length >= 4 && !blockedGeneric.has(term) && audioTerms.has(term))
    .slice(0, 8);
}

function normalizedTerms(values) {
  const terms = new Set();
  for (const value of values.flat().filter(Boolean)) {
    const text = String(value).toLowerCase();
    terms.add(text);
    for (const part of text.split(/[^a-z0-9\u4e00-\u9fff:.]+/).filter(Boolean)) {
      terms.add(part);
    }
  }
  return terms;
}

function summarizeAsset(asset) {
  if (!asset) return null;
  return {
    id: asset.id,
    semanticKey: asset.semanticKey,
    file: asset.file,
    soundscapeHints: asset.soundscapeHints,
    uiSurface: asset.uiSurface
  };
}

function summarizeSoundscape(soundscape) {
  return {
    id: soundscape.id,
    category: soundscape.category,
    profile: soundscape.profile,
    layers: soundscape.layers.map((layer) => layer.profile),
    assetHints: soundscape.assetHints
  };
}

function parseCliArgs(args) {
  const positional = args.filter((arg) => arg !== "--no-report");
  return {
    datasetPath: positional[0] || defaultDatasetPath,
    reportPath: args.includes("--no-report")
      ? null
      : positional[1] || `evals/reports/production-depth-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  };
}

async function canAccess(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isCli() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
