# Evaluation Flow

## Goal

AIDM must prove that it can retrieve relevant facts from long campaign history instead of relying on the current prompt window.

## Dataset Format

Datasets live under `evals/long-memory/`.

```json
{
  "name": "Rain Archive 16-hour long memory benchmark",
  "version": "16h-v1",
  "gate": "long-memory-16h",
  "sessionBlocks": [
    {
      "id": "H01",
      "hour": 1,
      "startEventId": "E00001",
      "endEventId": "E00132",
      "queryIds": ["Q0001"]
    }
  ],
  "events": [{ "id": "E00001", "sessionBlockId": "H01", "text": "..." }],
  "queries": [
    {
      "id": "Q0001",
      "sessionBlockId": "H01",
      "query": "What should we remember?",
      "expectedEventIds": ["E00003"]
    }
  ],
  "threshold": {
    "minRecallAt5": 0.92,
    "minMeanReciprocalRank": 0.85
  }
}
```

## Commands

```bash
npm run eval:memory:generate
npm run eval:memory
npm run eval:memory:16h
npm run eval:memory:v1
npm run eval:memory:v2
node scripts/evaluate-memory.mjs evals/long-memory/campaign-history-v1.json evals/reports/manual.json
```

## Metrics

- `recallAt5`: how many expected facts appear in the top five retrieved memories.
- `meanReciprocalRank`: whether the first relevant fact appears near the top.

## Current Gate

`campaign-history-16h.json` is the default gate. It represents 16 session/hour blocks, 2,112 events, and 256 queries. The minimum gate is `recallAt5 >= 0.92` and `MRR >= 0.85`.

The evaluator writes report JSON with:

- `reportVersion`
- `generatedAt`
- `summary.dataset`, `summary.datasetPath`, `summary.gate`, `summary.sessionBlockCount`
- `summary.eventCount`, `summary.queryCount`
- `summary.recallAt5`, `summary.meanReciprocalRank`, `summary.thresholds`, `summary.durationMs`, `summary.passed`
- per-query `expectedEventIds`, `retrievedIds`, `hitEventIds`, `missedEventIds`, `recallAt5`, and `reciprocalRank`

## Regression Gates

`campaign-history-v2.json` remains the smaller 500-event / 50-query regression baseline with `recallAt5 >= 0.90` and `MRR >= 0.75`.
`campaign-history-v1.json` remains the smaller 200-event / 20-query regression baseline with `recallAt5 >= 0.85` and `MRR >= 0.70`.
