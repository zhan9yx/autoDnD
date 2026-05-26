# Evaluation Flow

## Goal

AIDM must prove that it can retrieve relevant facts from long campaign history, keep media aligned with the current scene, advance events monotonically, and expose state that can be reviewed or controlled without relying on ad hoc prompt text.

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
  "events": [{ "id": "E00001", "sessionBlockId": "H01", "layer": "quest", "text": "..." }],
  "queries": [
    {
      "id": "Q0001",
      "sessionBlockId": "H01",
      "query": "What should we remember?",
      "expectedEventIds": ["E00003"],
      "expectedLayers": ["quest"]
    }
  ],
  "threshold": {
    "minRecallAt5": 0.92,
    "minMeanReciprocalRank": 0.85,
    "minLayerRecallAt5": 1
  }
}
```

Structured campaign memory entries may include `layer`, `subject`, `status`, `salience`, `round`, `version`, `sceneId`, `questId`, `npcId`, `clueId`, `anchor`, and `metadata`. The supported first-class layers are:

- `timeline`: chronological beats and consequences.
- `quest`: main and side quest threads.
- `npc`: NPC intent, relationship, and tactical facts.
- `clue`: unresolved clues and revealed leads.
- `scene`: scene anchors, objectives, exits, and current location context.

## Commands

```bash
npm run eval:memory:generate
npm run eval:memory
npm run eval:memory:16h
npm run eval:memory:v1
npm run eval:memory:v2
node scripts/evaluate-memory.mjs evals/long-memory/campaign-structured-memory.json --no-report
node scripts/evaluate-production-depth.mjs evals/production-depth/scenarios.json --no-report
node scripts/evaluate-memory.mjs evals/long-memory/campaign-history-v1.json evals/reports/manual.json
```

## Metrics

- `recallAt5`: how many expected facts appear in the top five retrieved memories.
- `meanReciprocalRank`: whether the first relevant fact appears near the top.
- `layerRecallAt5`: for structured fixtures, how many expected layers appear in the top five retrieved memories.

## Current Gate

`campaign-history-16h.json` is the default gate. It represents 16 session/hour blocks, 2,112 events, and 256 queries. The minimum gate is `recallAt5 >= 0.92` and `MRR >= 0.85`.

The memory evaluator writes report JSON with:

- `reportVersion`
- `generatedAt`
- `summary.dataset`, `summary.datasetPath`, `summary.gate`, `summary.sessionBlockCount`
- `summary.eventCount`, `summary.indexedEventCount`, `summary.queryCount`
- `summary.averageTokensPerMemory`
- `summary.layerCounts`
- `summary.recallAt5`, `summary.meanReciprocalRank`, `summary.layerRecallAt5`, `summary.thresholds`, `summary.durationMs`, `summary.passed`
- per-query `queryTerms`, `expectedEventIds`, `expectedLayers`, `retrievedIds`, `retrievedLayers`, `hitEventIds`, `hitLayers`, `missedEventIds`, `missedLayers`, `rankedScores`, `recallAt5`, `layerRecallAt5`, and `reciprocalRank`

`scripts/evaluate-memory.mjs` also exports reusable helpers:

- `runMemoryEval({ datasetPath, reportPath })`
- `evaluateMemoryDataset(dataset, options)`
- `buildMemoryIndex(events)`

These helpers let other gates run the same retrieval logic without shelling out to the CLI.

## Production Depth Gate

`scripts/evaluate-production-depth.mjs` is the broader reusable gate for production-readiness signals. It currently checks:

- Long-history retrieval: verifies buried NPC intent and delayed consequence facts can be recalled with matched-token diagnostics.
- Scene/audio consistency: verifies selected scene art, soundscape family, weather/location evidence, and shared context terms.
- Structured log safety: verifies common fields, bilingual templates, queryable category/action/result fields, AI DM review hooks, and secret redaction.
- Event progression: verifies versions advance strictly, rounds never move backward, clocks stay bounded with small deltas, and scene location changes have explicit `sceneChange`.
- State control: verifies the state summary exposes quest clock, danger, clues, consequences, scene change, NPC intent, and bounded review/control fields.
- Economy and asset bindings: verifies inventory invariants and sampled generated assets have files, semantic keys, surfaces, approval, and reward bindings.

The report uses the same `summary.passed` shape as memory evaluation and stores per-check details that can be reviewed after a failed gate.

The focused unit assertions around this gate also pin the controllability contract:

- AI DM decision logs include beat, scene, quest/danger/clue/deadline clocks, consequence, scene-change, NPC-intent, memory recall status, directives, review fields, and state version/round.
- Memory retrieval logs include expected/retrieved/hit/missed event ids, ranked scores, top matched tokens, recall, and coverage.
- Event progression logs summarize version/round movement, clock deltas, explicit scene-change markers, and changed clocks.
- State summaries add compact `progress`, `memory`, and `review` surfaces without expanding player-facing clock objects.
- Production-depth assertions require buried long-history facts to rank first and require story movement to keep bounded clock deltas plus explicit scene-change evidence.

## Regression Gates

`campaign-history-v2.json` remains the smaller 500-event / 50-query regression baseline with `recallAt5 >= 0.90` and `MRR >= 0.75`.
`campaign-history-v1.json` remains the smaller 200-event / 20-query regression baseline with `recallAt5 >= 0.85` and `MRR >= 0.70`.
