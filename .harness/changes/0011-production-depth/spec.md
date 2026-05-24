# 0011 Production Depth

## Requirement

This change continues beyond v10 and targets production-depth gaps that still keep AIDM from feeling like a mature tabletop product. The next iteration must make generated assets more usable in live play, make character creation and progression richer, improve market/economy interactions, deepen state tracking without cluttering the player UI, and strengthen the reusable evaluation workflow.

## Scope

- Expand the generated asset catalog with another project-owned Image Generation sheet and deterministic ingestion path.
- Add data-first definitions for more player-usable items, spell scrolls, consumables, trade goods, equipment slots, rarity, condition, and culture variants before binding images.
- Improve character creation depth: ancestry/class cards with generated icons, starting spell cards, attribute budget feedback, and recommended presets.
- Add a compact market/shop drawer so players can buy and sell usable items without exposing admin catalog management.
- Add player progression hooks: XP, level, learned spells, equipment slot summaries, and stat deltas in player state.
- Improve event/state tracking: expose only player-useful quest clocks, danger, clues, current scene, and active consequences.
- Strengthen AIDM control: keep scene asset, soundscape, and narrative tone aligned; prevent abrupt scene jumps.
- Expand the evaluation system with scenario consistency checks: asset-scene match, soundscape-scene match, economy invariants, inventory item usability, and log safety.
- Keep the player UI one-screen first, with extra detail in drawers/modals rather than page scroll.
- Continue using worker subagents for actual implementation and tests, not only exploration.

## Acceptance Criteria

- Harness tasks and subagent ledger record all v11 worker ownership and completion status.
- New generated assets are registered with immersive names/descriptions and not dumped into the player UI.
- Character creation uses generated icons/cards and still hides after join.
- Inventory and market actions use the item catalog as source of truth and maintain wallet/equipment invariants.
- State tracking remains player-facing and compact.
- Evaluation scripts include reusable production-depth consistency checks.
- Browser QA covers the player path after integration.
- Lint, unit tests, smoke, memory eval, and harness check pass before merge.

## Non-Goals

- Do not build an admin asset management surface in the player UI.
- Do not require paid TTS or paid audio services.
- Do not attempt all 3000 image assets in one commit; improve the repeatable production pipeline and add another useful batch.
- Do not add multiplayer auth hardening beyond the local table token model in this pass.
