# 0013 SPELL-CLASS QA

## Scope

- Worker: `SPELL-CLASS` plus Worker E documentation sync.
- Files intentionally changed by the sibling worker: `src/core/rules.js`, `src/core/itemCatalog.js`, `src/core/gameEngine.js`, `tests/rules.test.js`, `tests/rulesEngine.test.js`, `tests/gameEngine.test.js`, `tests/itemCatalog.test.js`, and this QA note.
- Source boundary: official D&D SRD references were used only for high-level rules shape and attribution boundaries. AIDM stores original spell summaries, resource costs, class progression, and warrior archetype mechanics.

## Official Reference Boundary

- D&D Beyond SRD landing page: https://www.dndbeyond.com/srd
- SRD 5.2.1 PDF: https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf
- SRD boundary applied in code: no long SRD text copied into rules, tests, or docs; mechanics are AIDM-specific deterministic mappings.

## Implemented

- Expanded `SPELLS` from 7 to 19 definitions with `resource.manaCost`, action type, tags, range, and damage/healing/effect boundaries.
- Added Sub-agent J spell coverage pass for currently unused generated spell art:
  - `grave-whisper`: necromancy-style morale/control pressure.
  - `iron-oath`: abjuration-style temporary resolve and fear resistance.
  - `lantern-sigil`: divination-style investigation/insight utility.
  - `blood-moon-hex`: enchantment-style curse/control pressure.
  - `tidecall`: conjuration-style wet-terrain slowing.
  - `clockwork-snare`: transmutation-style short restraint.
  - `starfall-rune`: higher-cost radiant area pressure.
- Added starter spell option pools per class while keeping spell ids backed by rule definitions.
- Added usable scroll definitions and shop entries for `cleanse-poison`, `frost-bind`, `glass-echo`, `storm-arc`, `thunder-step`, and the seven Sub-agent J spells above.
- Added warrior specializations:
  - `dual-wielder`: agility, melee/stealth, dagger, offhand action, light weapon attack/damage bonus.
  - `berserker`: body/spirit, melee/intimidation, etched war axe, fury resource, melee attack/damage bonus, defense tradeoff.
  - `weapon-master`: body/mind, melee/guard, red-tassel spear, focus resource, mastery actions.
- Added level progression data and runtime sync for XP-based progression, including level 2 warrior `action-surge`.
- `GameEngine.joinRoom` applies explicit warrior specialization options after player creation without touching UI/auth/server surfaces.

## Verification

Original focused worker verification passed:

```bash
node --test tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js
```

Result: 41 tests passed, 0 failed.

Worker E integration rerun:

```bash
node --test tests/assetSelection.test.js tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js
```

Result after full integration: 48 tests total, 48 passed.

Sub-agent J focused rerun before edits:

```bash
node --test tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js tests/assetSelection.test.js
```

Result before J spell expansion: 48 tests total, 48 passed.

Sub-agent J adds focused assertions for 19 spell definitions, seven added scrolls, direct generated-art bindings, and representative runtime effects for `iron-oath`, `blood-moon-hex`, and `starfall-rune`.

Sub-agent J final focused rerun:

```bash
node --check src/core/rules.js src/core/itemCatalog.js src/core/assetSelection.js tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js tests/assetSelection.test.js
node --test tests/rules.test.js tests/rulesEngine.test.js tests/gameEngine.test.js tests/itemCatalog.test.js tests/assetSelection.test.js
```

Result after J spell expansion: syntax check passed; 48 tests total, 48 passed.

The earlier mage starting-spell expectation mismatch is not current in the Worker E rerun. The earlier asset binding count failure is also not current after the latest focused rerun and escalated full Harness rerun.

## Browser Verification Remaining

- Character creation UI for mage, bard, envoy, and warrior spell/specialization choices.
- Warrior specialization selection and resulting combat feedback in browser.
- Scroll purchase, scroll learning, and spell casting from browser inventory/action flows.
- Visual binding of new spell effects and scroll art in player-safe surfaces.
- Encounter balance feel for new spell and warrior options.

## Residual Follow-Up

- Browser QA owner should verify spell and warrior flows in a real browser.
- Balance owner should add encounter feel evidence for new spell and warrior options.

This page records partial rules/runtime implementation only. It does not close all spell/warrior requirements or public readiness.
