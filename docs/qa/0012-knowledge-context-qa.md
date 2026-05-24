# 0012 Knowledge Context QA

Date: 2026-05-25
Scope: SRD-style knowledge context closure across local narration, OpenAI prompt construction, director decision-log metadata, and localized user-facing output.

## Source Boundary Checked

- Official source registry target: `https://www.dndbeyond.com/srd`.
- The official SRD page identifies SRD v5.2.1 as Creative Commons rules content for creator use, with the English SRD v5.2.1 PDF published on 2025-05-01 and the page last updated on 2026-03-02.
- The same page says SRD 5.1 and SRD 5.2 are available under Creative Commons CC-BY-4.0 with attribution.
- The page also warns that omitted classes, species, monsters, named characters, and setting material can be excluded for brand identity, licensing, and IP reasons. AIDM should keep SRD usage as rules inspiration and attribution metadata, not copied lore or protected setting content.

## Evidence Added

- Added [tests/knowledgeContextQa.test.js](/Users/yixuan.zhang/Documents/AIDM/tests/knowledgeContextQa.test.js) as a focused QA audit.
- The test verifies the knowledge source registry stays attribution-only and does not embed source corpus fields such as `content`, `body`, `markdown`, or `excerpt`.
- The test verifies local narration emits weather, season, and action guidance while keeping source URLs and license notes out of player-facing prose.
- The test intercepts `AIProvider.openAiNarration` and verifies the OpenAI prompt includes attribution, environment hook, action suggestion, randomness hook, and a "do not quote rules text" guardrail.
- The test verifies `aiDecision` can preserve `knowledgeSources`, `environmentHooks`, `actionGuidance`, and `licenseBoundary` when passed director knowledge.
- The test verifies `GameEngine.submitAction` attaches director/narration knowledge summaries into the runtime GM `structuredLog` while keeping player-facing narration free of license or source noise.
- The test scans audited runtime strings for common protected setting/product-identity terms and a few copied-rules-text signatures.

## Focused Test Result

Command:

```bash
node --test tests/knowledgeContextQa.test.js tests/director.test.js tests/rules.test.js tests/localization.test.js tests/logTemplates.test.js tests/gameEngine.test.js
```

Result: 44/44 passed.

## Findings

- Local narrator closure: covered. It consumes `buildRuleKnowledgeContext` and emits localized weather, season, and action guidance.
- OpenAI prompt closure: covered. Prompt construction uses the same knowledge context and includes explicit attribution and quote guardrails.
- Director knowledge closure: covered at `applyDirectorBeat`; the director state contains source ids, weather/season hooks, action guidance, and randomness metadata.
- Decision-log template closure: covered. `aiDecision` preserves knowledge metadata if it is supplied, and `summarizeKnowledgeForLog` keeps the runtime metadata compact.
- Runtime GM transcript closure: covered. `GameEngine.submitAction` now adds `knowledgeSources`, `environmentHooks`, `actionGuidance`, and `licenseBoundary` to the generated GM `structuredLog`.
- Localized room/player output closure: covered for direct local narration and localization strings.

## Gaps And Risks

- A future SRD ingestion job should keep a denylist and allowlist in a real source registry before retrieval is connected to production narration.
- Attribution is present in prompts and registry metadata. A user-facing legal/about surface is still required before public release if SRD-derived material becomes a visible product feature.
- The current audit checks common protected setting and product-identity terms. It is not a full legal review.
