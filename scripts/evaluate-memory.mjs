#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { MemoryIndex, extractMemoryTags, tokenize } from "../src/core/memory.js";

const defaultDatasetPath = "evals/long-memory/campaign-history-16h.json";

if (isCli()) {
  const { datasetPath, reportPath } = parseCliArgs(process.argv.slice(2));
  const report = await runMemoryEval({ datasetPath, reportPath });
  console.log(JSON.stringify(report.summary, null, 2));
  if (!report.summary.passed) {
    process.exit(1);
  }
}

export async function runMemoryEval({ datasetPath = defaultDatasetPath, reportPath = null } = {}) {
  const startedAt = performance.now();
  const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
  const report = evaluateMemoryDataset(dataset, {
    datasetPath,
    durationMs: Math.round(performance.now() - startedAt)
  });

  if (reportPath) {
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

export function evaluateMemoryDataset(dataset, { datasetPath = "inline", durationMs = 0 } = {}) {
  const memory = buildMemoryIndex(dataset.events || []);
  const indexed = memory.toJSON().map((entry) => ({
    id: entry.id,
    sourceEventId: entry.sourceEventId,
    tokenCount: tokenize(`${entry.text} ${(entry.tags || []).join(" ")}`).size
  }));

  const results = (dataset.queries || []).map((query) => evaluateQuery(memory, query));
  const summary = {
    dataset: dataset.name,
    datasetPath,
    datasetVersion: dataset.version || null,
    gate: dataset.gate || dataset.version || dataset.name,
    sessionBlockCount: Array.isArray(dataset.sessionBlocks) ? dataset.sessionBlocks.length : null,
    eventCount: (dataset.events || []).length,
    indexedEventCount: indexed.length,
    queryCount: (dataset.queries || []).length,
    averageTokensPerMemory: mean(indexed.map((entry) => entry.tokenCount)),
    recallAt5: mean(results.map((result) => result.recallAt5)),
    meanReciprocalRank: mean(results.map((result) => result.reciprocalRank)),
    thresholds: dataset.threshold,
    durationMs
  };
  summary.passed =
    summary.recallAt5 >= dataset.threshold.minRecallAt5 &&
    summary.meanReciprocalRank >= dataset.threshold.minMeanReciprocalRank;

  return {
    reportVersion: 2,
    generatedAt: new Date().toISOString(),
    summary,
    diagnostics: buildMemoryDiagnostics(results, indexed, dataset),
    results
  };
}

export function buildMemoryIndex(events = []) {
  const memory = new MemoryIndex();
  events.forEach((event, index) => {
    memory.add({
      kind: event.kind || "event",
      text: event.text,
      tags: event.tags || extractMemoryTags(event.text),
      weight: event.weight || 1,
      sourceEventId: event.id,
      createdAt: event.createdAt || stableEventTime(index)
    });
  });
  return memory;
}

function evaluateQuery(memory, query) {
  const ranked = memory.retrieveWithScores(query.query, { limit: 5 });
  const retrievedIds = ranked.map((item) => item.memory.sourceEventId);
  const expectedEventIds = query.expectedEventIds || [];
  const expected = new Set(expectedEventIds);
  const hits = retrievedIds.filter((id) => expected.has(id));
  const firstRelevantRank = retrievedIds.findIndex((id) => expected.has(id)) + 1;
  return {
    id: query.id,
    sessionBlockId: query.sessionBlockId || null,
    query: query.query,
    queryTerms: [...tokenize(query.query)],
    expectedEventIds,
    retrievedIds,
    hitEventIds: hits,
    missedEventIds: expectedEventIds.filter((id) => !hits.includes(id)),
    rankedScores: ranked.map((entry) => ({
      sourceEventId: entry.memory.sourceEventId,
      score: Number(entry.score.toFixed(4)),
      matchedTokens: entry.matchedTokens,
      tokenCount: entry.tokenCount
    })),
    recallAt5: expectedEventIds.length === 0 ? 1 : hits.length / expectedEventIds.length,
    reciprocalRank: firstRelevantRank > 0 ? 1 / firstRelevantRank : 0
  };
}

function buildMemoryDiagnostics(results, indexed, dataset) {
  const tokenCounts = indexed.map((entry) => entry.tokenCount);
  const missedQueries = results
    .filter((result) => result.missedEventIds.length > 0)
    .map((result) => ({
      id: result.id,
      sessionBlockId: result.sessionBlockId,
      missedEventIds: result.missedEventIds,
      retrievedIds: result.retrievedIds,
      queryTerms: result.queryTerms
    }));
  const weakQueries = [...results]
    .sort((left, right) => left.recallAt5 - right.recallAt5 || left.reciprocalRank - right.reciprocalRank)
    .slice(0, 5)
    .map((result) => ({
      id: result.id,
      sessionBlockId: result.sessionBlockId,
      recallAt5: result.recallAt5,
      reciprocalRank: result.reciprocalRank,
      topRetrievedId: result.retrievedIds[0] || null,
      topMatchedTokens: result.rankedScores[0]?.matchedTokens || []
    }));
  const blockSummaries = (dataset.sessionBlocks || []).map((block) => {
    const blockResults = results.filter((result) => result.sessionBlockId === block.id);
    return {
      id: block.id,
      queryCount: blockResults.length,
      recallAt5: mean(blockResults.map((result) => result.recallAt5)),
      meanReciprocalRank: mean(blockResults.map((result) => result.reciprocalRank)),
      missedQueryIds: blockResults.filter((result) => result.missedEventIds.length > 0).map((result) => result.id)
    };
  });

  return {
    indexedTokenRange: {
      min: tokenCounts.length ? Math.min(...tokenCounts) : 0,
      max: tokenCounts.length ? Math.max(...tokenCounts) : 0
    },
    missedQueryCount: missedQueries.length,
    missedQueries,
    weakestQueries: weakQueries,
    sessionBlocks: blockSummaries
  };
}

function parseCliArgs(args) {
  const positional = args.filter((arg) => arg !== "--no-report");
  return {
    datasetPath: positional[0] || defaultDatasetPath,
    reportPath: args.includes("--no-report")
      ? null
      : positional[1] || `evals/reports/long-memory-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
  };
}

function stableEventTime(index) {
  return new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
}

function mean(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isCli() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}
