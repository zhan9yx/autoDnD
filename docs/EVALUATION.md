# Evaluation Flow

## Goal

AIDM must prove that it can retrieve relevant facts from long campaign history instead of relying on the current prompt window.

## Dataset Format

Datasets live under `evals/long-memory/`.

```json
{
  "events": [{ "id": "E001", "text": "..." }],
  "queries": [
    {
      "id": "Q001",
      "query": "What should we remember?",
      "expectedEventIds": ["E001"]
    }
  ],
  "threshold": {
    "minRecallAt5": 0.85,
    "minMeanReciprocalRank": 0.7
  }
}
```

## Commands

```bash
npm run eval:memory:generate
npm run eval:memory
npm run eval:memory:v1
npm run eval:memory:v2
node scripts/evaluate-memory.mjs evals/long-memory/campaign-history-v1.json evals/reports/manual.json
```

## Metrics

- `recallAt5`: how many expected facts appear in the top five retrieved memories.
- `meanReciprocalRank`: whether the first relevant fact appears near the top.

## Current Gate

`campaign-history-v2.json` is the default gate. It has 500 events and 50 queries. The minimum gate is `recallAt5 >= 0.90` and `MRR >= 0.75`.
`campaign-history-v1.json` remains as a smaller 200-event / 20-query regression baseline.

## Next Gates

- V5: 1000 events / 100 queries, mixed Chinese/English, contradictions, state changes, and multi-session summaries.
