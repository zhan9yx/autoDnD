#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";
import { MemoryIndex, extractMemoryTags, tokenize } from "../src/core/memory.js";

const defaultDatasetPath = "evals/long-memory/campaign-history-16h.json";
const datasetPath = process.argv[2] || defaultDatasetPath;
const reportPath = process.argv[3] || `evals/reports/long-memory-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
const startedAt = performance.now();
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const memory = new MemoryIndex();

for (const event of dataset.events || []) {
  memory.add({
    kind: "event",
    text: event.text,
    tags: extractMemoryTags(event.text),
    weight: 1,
    sourceEventId: event.id
  });
}

const indexedMemories = memory.toJSON().map((entry) => ({
  memory: entry,
  tokens: tokenize(`${entry.text} ${(entry.tags || []).join(" ")}`)
}));

const results = (dataset.queries || []).map((query) => {
  const retrieved = retrieve(query.query, { limit: 5 });
  const retrievedIds = retrieved.map((item) => item.sourceEventId);
  const expected = new Set(query.expectedEventIds || []);
  const hits = retrievedIds.filter((id) => expected.has(id));
  const firstRelevantRank = retrievedIds.findIndex((id) => expected.has(id)) + 1;
  return {
    id: query.id,
    sessionBlockId: query.sessionBlockId || null,
    query: query.query,
    expectedEventIds: query.expectedEventIds || [],
    retrievedIds,
    hitEventIds: hits,
    missedEventIds: (query.expectedEventIds || []).filter((id) => !hits.includes(id)),
    recallAt5: hits.length / (query.expectedEventIds || []).length,
    reciprocalRank: firstRelevantRank > 0 ? 1 / firstRelevantRank : 0
  };
});

const summary = {
  dataset: dataset.name,
  datasetPath,
  datasetVersion: dataset.version || null,
  gate: dataset.gate || dataset.version || dataset.name,
  sessionBlockCount: Array.isArray(dataset.sessionBlocks) ? dataset.sessionBlocks.length : null,
  eventCount: (dataset.events || []).length,
  queryCount: (dataset.queries || []).length,
  recallAt5: mean(results.map((result) => result.recallAt5)),
  meanReciprocalRank: mean(results.map((result) => result.reciprocalRank)),
  thresholds: dataset.threshold,
  durationMs: Math.round(performance.now() - startedAt)
};
summary.passed =
  summary.recallAt5 >= dataset.threshold.minRecallAt5 &&
  summary.meanReciprocalRank >= dataset.threshold.minMeanReciprocalRank;

const report = {
  reportVersion: 2,
  generatedAt: new Date().toISOString(),
  summary,
  results
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.passed) {
  process.exit(1);
}

function retrieve(query, { limit = 5 } = {}) {
  const queryTokens = tokenize(query);
  if (queryTokens.size === 0) {
    return indexedMemories
      .slice(-limit)
      .reverse()
      .map((entry) => entry.memory);
  }

  return indexedMemories
    .map((entry) => ({ memory: entry.memory, score: scoreIndexedMemory(entry, queryTokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt))
    .slice(0, limit)
    .map((entry) => entry.memory);
}

function scoreIndexedMemory(entry, queryTokens) {
  let overlap = 0;
  for (const token of queryTokens) {
    if (entry.tokens.has(token)) {
      overlap += 1;
    }
  }
  const tagBoost = (entry.memory.tags || []).filter((tag) => queryTokens.has(tag)).length * 0.5;
  return (overlap + tagBoost) * (entry.memory.weight || 1);
}

function mean(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
