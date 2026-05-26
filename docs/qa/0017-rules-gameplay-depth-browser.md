# 0017 Rules Gameplay Depth Browser QA

Date: 2026-05-25 CST
Worker: 0017 rules gameplay follow-up

## Scope

Focused browser evidence and lightweight balance review for Herschel's rules/gameplay depth change. This pass does not claim public readiness, release-gate readiness, or final playtest tuning.

## Browser Flow

- Server: `PORT=4199 AIDM_DATA_FILE=/private/tmp/aidm-0017-rules-gameplay-browser-store.json npm run dev`
- Browser: isolated Google Chrome profile controlled through Chrome DevTools Protocol.
- Room: `room_4860f5c1c40e4404`
- Character: `Iris`, class `mage`, known spell action `cast Sleep while inspecting the archive coffer clue`.

Screenshots and structured result:

- `/private/tmp/aidm-0017-rules-gameplay-browser/0017-rules-04-transcript-spell-rule-modifier.png`
- `/private/tmp/aidm-0017-rules-gameplay-browser/0017-rules-05-state-drawer.png`
- `/private/tmp/aidm-0017-rules-gameplay-browser/0017-rules-browser-result.json`

Tooling note: the automated browser submit surfaced the existing frontend `Request timed out` message at 10 seconds, but the server completed the action and persisted the room. The same Chrome room was reloaded to verify the completed player-visible transcript and State drawer. I did not change request timeout behavior in this rules-field follow-up.

Observed browser-visible transcript:

- Roll entry shows `Iris rolled 1d20+8: 3 + 8 = 11 vs DC 12 Rule modifiers: Oak Staff supports this cast action (+1).`
- Spell entry shows `Iris cast Sleep. Mana 13 -> 11 (cost 2). Status: Drowsy. applies Drowsy for 1 round(s).`
- Combat follow-up remains player-facing: `Iris hit Street Skirmisher for 6 damage`; `Street Skirmisher fled`.

State drawer before this follow-up showed pressure and consequences but did not make season/event pressure readable enough. A minimal UI text mapping was added in `public/app.js` and `public/i18n.js`.

Observed browser-visible State drawer after the fix:

- `Environment`: `Spring · Dusk · Heavy rain · Tense`
- Environment detail: `Pressure: Moderate · Danger Consequence`
- `Event pressure`: `Complication · Moderate`
- Event detail: `The weather reveals one trace and hides another; ask which lead the party follows first. · Clock: Clues · Foreshadowed`

Debug leakage check from the browser result:

- `hasSleep`: true
- `hasRuleModifier`: true
- `hasWeather`: true
- `hasSeason`: true
- `hasPressure`: true
- `hasSeedLikeDebug`: false

The player UI deliberately does not show deterministic seed values. Seed remains available in state summary/control data for review surfaces, while the browser player surface shows readable environment and event-pressure copy.

## Balance Review

Added deterministic coverage in `tests/itemCatalog.test.js` for stacked loadouts:

- mage cast stack: equipped staff plus stormglass amulet plus carried spell scroll.
- dual-wielder hostile stack: weapons plus armor plus `dual-wielder`.
- defender guard stack: shield plus armor plus `defender`.
- travel tool stack: compass, rope, lamp.
- lock/clue stack: moon key plus clue tools.
- tactical commander order stack: weapon, shield, armor plus `tactical-commander`.

Result: every sampled stack stayed at `modifier <= 3` and exposed at most three sources. This supports the bounded +0 to +3 implementation.

Balance notes for later real playtest:

- Mage cast actions can reach strong totals because class stats/skill already contribute heavily before the equipment modifier. The +1 focus bonus felt readable, but repeated spell use should be observed in real scenes.
- Defender and dual-wielder stacks hit the cap in their intended narrow actions. This is acceptable as identity reinforcement, but repeated combat logs should check whether the cap makes warriors too reliable in early scenes.
- Travel/tool stacks are broad but not always combat-relevant; current risk is more "frequent small help" than burst power.

Status: browser-visible QA is closed for this focused 0017 scope. Final balance feel remains needs-playtest after real logs.

## Commands

- `node --check public/app.js`: passed.
- `node --check public/i18n.js`: passed.
- `node --test tests/rules.test.js tests/gameEngine.test.js tests/itemCatalog.test.js tests/localization.test.js tests/stateSummary.test.js tests/bilingualUi.test.js tests/staticUiStructure.test.js`: passed, 82 tests passed, 0 failed.
- `npm run harness:status`: passed after Harness task update, reporting `0017-rules-gameplay-depth` at 17/18.
- `git diff --check`: passed after documentation updates.
