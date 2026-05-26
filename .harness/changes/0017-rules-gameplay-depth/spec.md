# 0017 Rules Gameplay Depth

## Requirement

Worker B extends the asset-independent rules and core loop depth for AIDM. This change improves DND-style spell structure, visible spell-use feedback, warrior specialization differentiation, equipment and tool impact on action checks, deterministic AI DM event state, and backpack/reward/use feedback without adding or changing image assets.

## Scope

- Enrich spell rule cards with tier labels, purpose guidance, use tags, status-effect descriptions, outcome summaries, and learn/use feedback.
- Detect named known-spell use during player actions, spend mana when possible, and write a visible spell transcript entry with status/outcome feedback.
- Apply bounded, deterministic action modifiers from equipped weapons, shields, arcane focuses, utility tools, and warrior specializations.
- Preserve movement coherence by preventing high-tier routes from being unlocked by the same movement action that tries to enter them.
- Record deterministic scene event state from the AI DM prompt pack, including weather, season, pressure, clock, clue, reward, consequence, encounter state, and seed.
- Expose event state through table state summary fields for UI/review surfaces.
- Add English and Chinese localization for rule modifiers and spell-use feedback.

## Out Of Scope

- No new image assets.
- No generated asset inventory or asset ledger changes.
- No auth, audio, browser evidence, deployment readiness, or release gate ownership changes.
- No public UI layout work except data fields already consumed by existing state surfaces.
- No changes to 0013 auth/audio/browser evidence or 0015 release readiness/gate documents.

## Acceptance Criteria

- Spell rule data exposes tier, category, purpose, status, outcome, and feedback fields through core APIs.
- Named known-spell action text creates visible transcript feedback and updates mana deterministically.
- Equipment, tools, and warrior specialization choices can affect the next action check through a capped modifier with inspectable sources.
- Scene event state is deterministic and visible in room state and state summary.
- Reward and inventory loops still preserve backpack visibility and existing progression/equipment deltas.
- Core rules, game engine, item catalog, localization, and state summary tests pass.
- Harness status and diff whitespace checks pass for touched files.
