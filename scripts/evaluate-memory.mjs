#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { MemoryIndex, extractMemoryTags } from "../src/core/memory.js";

const datasetPath = process.argv[2] || "evals/long-memory/campaign-history-v2.json";
const reportPath = process.argv[3] || `evals/reports/long-memory-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
const memory = new MemoryIndex();

for (const event of dataset.events) {
  memory.add({
    kind: "event",
    text: event.text,
    tags: extractMemoryTags(event.text),
    weight: 1,
    sourceEventId: event.id
  });
}

const results = dataset.queries.map((query) => {
  const retrieved = memory.retrieve(query.query, { limit: 5 });
  const retrievedIds = retrieved.map((item) => item.sourceEventId);
  const expected = new Set(query.expectedEventIds);
  const hits = retrievedIds.filter((id) => expected.has(id));
  const firstRelevantRank = retrievedIds.findIndex((id) => expected.has(id)) + 1;
  return {
    id: query.id,
    query: query.query,
    expectedEventIds: query.expectedEventIds,
    retrievedIds,
    recallAt5: hits.length / query.expectedEventIds.length,
    reciprocalRank: firstRelevantRank > 0 ? 1 / firstRelevantRank : 0
  };
});

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const summary = {
  dataset: dataset.name,
  eventCount: dataset.events.length,
  queryCount: dataset.queries.length,
  recallAt5: mean(results.map((result) => result.recallAt5)),
  meanReciprocalRank: mean(results.map((result) => result.reciprocalRank)),
  thresholds: dataset.threshold
};
summary.passed =
  summary.recallAt5 >= dataset.threshold.minRecallAt5 &&
  summary.meanReciprocalRank >= dataset.threshold.minMeanReciprocalRank;

const report = {
  summary,
  results
};

await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!summary.passed) {
  process.exit(1);
}
